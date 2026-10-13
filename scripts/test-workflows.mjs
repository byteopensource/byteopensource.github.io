// Tests the bots in .github/workflows by running their github-script blocks against a fake GitHub API.
// Run: node scripts/test-workflows.mjs   (CI runs it too, see .github/workflows/checks.yml)
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const ROOT = new URL("../.github/workflows/", import.meta.url);

// Pull every "script: |" block out of a workflow file (YAML block scalars, indentation-based).
function scripts(file) {
  const lines = readFileSync(new URL(file, ROOT), "utf8").split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^(\s*)script: \|\s*$/.exec(lines[i]);
    if (!m) continue;
    const body = [];
    let indent = null;
    for (i++; i < lines.length; i++) {
      const l = lines[i];
      if (l.trim() === "") { body.push(""); continue; }
      const ind = l.match(/^\s*/)[0].length;
      if (indent === null) indent = ind;
      if (ind < indent) { i--; break; }
      body.push(l.slice(indent));
    }
    out.push(body.join("\n"));
  }
  return out;
}

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
async function run(code, { context, github, env = {} }) {
  const log = { failed: null, info: [] };
  const core = { info: (m) => log.info.push(m), setFailed: (m) => (log.failed = m) };
  Object.assign(process.env, env);
  await new AsyncFunction("github", "context", "core", code)(github, context, core);
  return log;
}

// ---------- fake GitHub ----------
function fakeGitHub({ files = [], content = {}, onBase = [], issues = {}, comments = [], mergeFails = false, myIssues = [], timelines = {}, openAssigned = [] }) {
  const calls = [];
  const rec = (name) => async (args) => { calls.push({ name, args }); return { data: {} }; };
  const github = {
    calls,
    paginate: async (fn, args) => (await fn(args)).data,
    rest: {
      issues: {
        get: async ({ issue_number }) => { if (!issues[issue_number]) throw new Error("404"); return { data: issues[issue_number] }; },
        addLabels: rec("addLabels"),
        listComments: async () => ({ data: comments }),
        createComment: rec("createComment"),
        updateComment: rec("updateComment"),
        removeAssignees: rec("removeAssignees"),
        addAssignees: rec("addAssignees"),
        listForRepo: async (args) => ({ data: args.assignee === "*" ? openAssigned : myIssues }),
        listEventsForTimeline: async ({ issue_number }) => ({ data: timelines[issue_number] || [] }),
      },
      pulls: {
        listFiles: async () => ({ data: files }),
        merge: async (args) => { calls.push({ name: "merge", args }); if (mergeFails) throw new Error("protected"); return { data: {} }; },
      },
      repos: {
        getContent: async ({ path, ref }) => {
          if (ref === "main") {
            // what's already on the club's main branch
            if (!onBase.includes(path)) throw new Error("404");
            return { data: {} };
          }
          const text = content[path];
          return { data: { size: Buffer.byteLength(text), content: Buffer.from(text).toString("base64") } };
        },
      },
      actions: { createWorkflowDispatch: rec("dispatch") },
    },
  };
  return github;
}

const repoCtx = { owner: "TheBYTEClubNIE", repo: "Open-Source_BYTE_2K26" };
function prContext(author, body = "") {
  return {
    repo: repoCtx,
    payload: { pull_request: { number: 7, user: { login: author }, body, head: { sha: "abc", repo: { name: "Open-Source_BYTE_2K26", owner: { login: author } } }, base: { ref: "main" } } },
  };
}
const names = (gh) => gh.calls.map((c) => c.name);
const commentText = (gh) => gh.calls.filter((c) => /Comment$/.test(c.name)).map((c) => c.args.body).join("\n");

const [prScript] = scripts("pull-requests.yml");
const [claimScript, expireScript] = scripts("claims.yml");
let passed = 0;
async function test(name, fn) { await fn(); passed++; console.log("ok -", name); }

// ---------- PR helper ----------
await test("valid Level 1 file is labelled, merged and redeployed", async () => {
  const gh = fakeGitHub({
    files: [{ filename: "contributors/Riya-S.json", status: "added" }],
    content: { "contributors/Riya-S.json": JSON.stringify({ name: "Riya", github: "riya-s", year: 2, note: "hi" }) },
  });
  const log = await run(prScript, { context: prContext("riya-s"), github: gh });
  assert.equal(log.failed, null);
  assert.deepEqual(names(gh), ["addLabels", "merge", "createComment", "dispatch"]);
  assert.equal(gh.calls[0].args.labels[0], "level-1");
  assert.equal(gh.calls[1].args.sha, "abc"); // merges exactly what was checked
  assert.match(commentText(gh), /Welcome/);
});

await test("broken JSON gets a helpful comment and a failed check, no merge", async () => {
  const gh = fakeGitHub({ files: [{ filename: "contributors/riya-s.json", status: "added" }], content: { "contributors/riya-s.json": '{ "name": "Riya", }' } });
  const log = await run(prScript, { context: prContext("riya-s"), github: gh });
  assert.ok(log.failed);
  assert.ok(!names(gh).includes("merge"));
  assert.match(commentText(gh), /valid JSON/);
});

await test("someone else's filename, wrong github field, bad year and extra field are all reported", async () => {
  const gh = fakeGitHub({
    files: [{ filename: "contributors/friend.json", status: "added" }],
    content: {},
  });
  const log = await run(prScript, { context: prContext("riya-s"), github: gh });
  assert.ok(log.failed);
  assert.match(commentText(gh), /contributors\/riya-s\.json/);

  const gh2 = fakeGitHub({
    files: [{ filename: "contributors/riya-s.json", status: "added" }],
    content: { "contributors/riya-s.json": JSON.stringify({ name: "Riya", github: "someone", year: "2", graduated: "x" }) },
  });
  const log2 = await run(prScript, { context: prContext("riya-s"), github: gh2 });
  assert.ok(log2.failed);
  const t = commentText(gh2);
  assert.match(t, /`github` should be exactly/);
  assert.match(t, /`year` should be a number/);
  assert.match(t, /Remove these fields: `graduated`/);
});

await test("touching other files alongside is refused", async () => {
  const gh = fakeGitHub({
    files: [{ filename: "contributors/riya-s.json", status: "added" }, { filename: "index.html", status: "modified" }],
    content: { "contributors/riya-s.json": JSON.stringify({ name: "Riya", github: "riya-s" }) },
  });
  const log = await run(prScript, { context: prContext("riya-s"), github: gh });
  assert.ok(log.failed);
  assert.match(commentText(gh), /exactly one file/);
});

await test("editing an existing contributor file goes to a human", async () => {
  const gh = fakeGitHub({ files: [{ filename: "contributors/riya-s.json", status: "modified" }] });
  const log = await run(prScript, { context: prContext("riya-s"), github: gh });
  assert.equal(log.failed, null);
  assert.ok(!names(gh).includes("merge"));
  assert.equal(gh.calls[0].args.labels[0], "needs-review");
});

await test("a second 'new' file from a fork that's behind main still goes to a human", async () => {
  // Real case: PR #33 re-added a file that PR #32 had merged a minute earlier.
  const gh = fakeGitHub({
    files: [{ filename: "contributors/riya-s.json", status: "added" }],
    content: { "contributors/riya-s.json": JSON.stringify({ name: "Riya", github: "riya-s" }) },
    onBase: ["contributors/riya-s.json"],
  });
  const log = await run(prScript, { context: prContext("riya-s"), github: gh });
  assert.equal(log.failed, null);
  assert.ok(!names(gh).includes("merge"));
  assert.equal(gh.calls[0].args.labels[0], "needs-review");
});

await test("PRs that don't touch contributors/ are left alone (apart from the level label)", async () => {
  const gh = fakeGitHub({
    files: [{ filename: "index.html", status: "modified" }],
    issues: { 12: { labels: [{ name: "level-3" }, { name: "good first issue" }] } },
  });
  await run(prScript, { context: prContext("riya-s", "This fixes the footer.\n\nCloses #12"), github: gh });
  assert.deepEqual(names(gh), ["addLabels"]);
  assert.deepEqual(gh.calls[0].args.labels, ["level-3"]);
});

await test("merge blocked by branch protection asks a maintainer instead", async () => {
  const gh = fakeGitHub({
    files: [{ filename: "contributors/riya-s.json", status: "added" }],
    content: { "contributors/riya-s.json": JSON.stringify({ name: "Riya", github: "riya-s" }) },
    mergeFails: true,
  });
  const log = await run(prScript, { context: prContext("riya-s"), github: gh });
  assert.equal(log.failed, null);
  assert.ok(!names(gh).includes("dispatch"));
  assert.match(commentText(gh), /maintainer just needs to click merge/);
});

await test("a re-run updates the old bot comment instead of adding another", async () => {
  const gh = fakeGitHub({
    files: [{ filename: "contributors/riya-s.json", status: "added" }],
    content: { "contributors/riya-s.json": "nope" },
    comments: [{ id: 99, user: { type: "Bot" }, body: "<!-- level-1-check -->\nold" }],
  });
  await run(prScript, { context: prContext("riya-s"), github: gh });
  assert.deepEqual(names(gh), ["updateComment"]);
  assert.equal(gh.calls[0].args.comment_id, 99);
});

// ---------- Claims ----------
const env = { CLAIM_HOURS: '{"level-2": 48, "level-3": 72, "level-4": 168}' };
function claimCtx(body, issue) {
  return { repo: repoCtx, payload: { comment: { body, user: { login: "riya-s" } }, issue: { number: 12, state: "open", assignees: [], labels: [{ name: "level-2" }], ...issue } } };
}

await test("/assign on a free level-2 issue assigns and gives 48 hours", async () => {
  const gh = fakeGitHub({});
  await run(claimScript, { context: claimCtx("/assign"), github: gh, env });
  assert.deepEqual(names(gh), ["addAssignees", "createComment"]);
  assert.match(commentText(gh), /48 hours/);
});

await test("level-4 claims get 7 days", async () => {
  const gh = fakeGitHub({});
  await run(claimScript, { context: claimCtx(" /Assign ", { labels: [{ name: "level-4" }] }), github: gh, env });
  assert.match(commentText(gh), /7 days/);
});

await test("taken issues, unlabelled issues and a second claim are refused", async () => {
  let gh = fakeGitHub({});
  await run(claimScript, { context: claimCtx("/assign", { assignees: [{ login: "arjun" }] }), github: gh, env });
  assert.deepEqual(names(gh), ["createComment"]);
  assert.match(commentText(gh), /@arjun is already on this one/);

  gh = fakeGitHub({});
  await run(claimScript, { context: claimCtx("/assign", { labels: [{ name: "bug" }] }), github: gh, env });
  assert.match(commentText(gh), /only `level-2`/);

  gh = fakeGitHub({ myIssues: [{ number: 5 }] });
  await run(claimScript, { context: claimCtx("/assign"), github: gh, env });
  assert.ok(!names(gh).includes("addAssignees"));
  assert.match(commentText(gh), /already working on #5/);
});

await test("ordinary comments are ignored", async () => {
  const gh = fakeGitHub({});
  await run(claimScript, { context: claimCtx("Can I /assign this please?"), github: gh, env });
  assert.equal(gh.calls.length, 0);
});

await test("/unassign frees the issue", async () => {
  const gh = fakeGitHub({});
  await run(claimScript, { context: claimCtx("/unassign", { assignees: [{ login: "riya-s" }] }), github: gh, env });
  assert.deepEqual(names(gh), ["removeAssignees", "createComment"]);
});

await test("expiry frees stale claims but keeps ones with an open PR", async () => {
  const hoursAgo = (h) => new Date(Date.now() - h * 3600e3).toISOString();
  const gh = fakeGitHub({
    openAssigned: [
      { number: 1, labels: [{ name: "level-2" }], assignees: [{ login: "slow" }] },      // 50h, no PR -> freed
      { number: 2, labels: [{ name: "level-2" }], assignees: [{ login: "busy" }] },      // 50h, open PR -> kept
      { number: 3, labels: [{ name: "level-3" }], assignees: [{ login: "fresh" }] },     // 50h but level-3 has 72h -> kept
      { number: 4, labels: [{ name: "bug" }], assignees: [{ login: "maintainer" }] },    // not a level issue -> kept
    ],
    timelines: {
      1: [{ event: "assigned", assignee: { login: "slow" }, created_at: hoursAgo(50) }],
      2: [
        { event: "assigned", assignee: { login: "busy" }, created_at: hoursAgo(50) },
        { event: "cross-referenced", source: { issue: { pull_request: {}, state: "open", user: { login: "busy" } } } },
      ],
      3: [{ event: "assigned", assignee: { login: "fresh" }, created_at: hoursAgo(50) }],
    },
  });
  await run(expireScript, { context: { repo: repoCtx, payload: {} }, github: gh, env });
  const freed = gh.calls.filter((c) => c.name === "removeAssignees").map((c) => c.args.issue_number);
  assert.deepEqual(freed, [1]);
});

console.log(`\n${passed} tests passed`);
