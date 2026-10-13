// Builds the two data files the site reads, so visitors never call the GitHub API themselves
// (a whole campus shares one IP, and GitHub allows 60 anonymous requests per hour per IP).
//   contributors.json  <- contributors/*.json, one file per student
//   stats.json         <- open issues per level + leaderboard, from the GitHub API
// Runs on every deploy in .github/workflows/deploy.yml. Locally: node scripts/build-data.mjs
import { readdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const REPO = process.env.GITHUB_REPOSITORY || "TheBYTEClubNIE/Open-Source_BYTE_2K26";
const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i; // GitHub's rules
const PR_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+$/;
// Maintainers' PRs would swamp the leaderboard. Comma-separated logins, set in the workflow.
const NOT_ON_BOARD = new Set((process.env.LEADERBOARD_EXCLUDE || "").toLowerCase().split(",").filter(Boolean));

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "byte-build-data",
  ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
};

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json();
}

// When the file first landed in git, so the wall is in joining order. 0 if git history isn't available.
function addedAt(path) {
  try {
    const out = execFileSync("git", ["log", "--diff-filter=A", "--format=%ct", "--", path], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return Number(out.trim().split("\n").pop()) || 0;
  } catch {
    return 0;
  }
}

async function buildContributors() {
  const files = (await readdir("contributors")).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
  const people = [];
  for (const file of files) {
    try {
      const p = JSON.parse(await readFile(`contributors/${file}`, "utf8"));
      const valid =
        typeof p.name === "string" && p.name.trim() &&
        USERNAME.test(p.github || "") &&
        file.toLowerCase() === `${p.github.toLowerCase()}.json`;
      if (!valid) {
        console.warn(`skip ${file}: needs "name" and "github", and the file name must be <github>.json`);
        continue;
      }
      people.push({
        name: p.name.trim().slice(0, 60),
        github: p.github,
        year: [1, 2, 3, 4].includes(p.year) ? p.year : undefined,
        note: typeof p.note === "string" ? p.note.trim().slice(0, 100) : undefined,
        graduated: PR_URL.test(p.graduated || "") ? p.graduated : undefined,
        added: addedAt(`contributors/${file}`),
      });
    } catch (e) {
      console.warn(`skip ${file}: ${e.message}`);
    }
  }
  return people.sort((a, b) => a.added - b.added).map(({ added, ...p }) => p);
}

async function buildStats() {
  const issues = { "level-2": [], "level-3": [], "level-4": [] };
  for (let page = 1; ; page++) {
    const batch = await gh(`/repos/${REPO}/issues?state=open&per_page=100&page=${page}`);
    for (const i of batch) {
      if (i.pull_request) continue; // this endpoint returns PRs too
      for (const label of i.labels) {
        issues[label.name]?.push({ number: i.number, title: i.title, url: i.html_url, claimed: i.assignees.length > 0 });
      }
    }
    if (batch.length < 100) break;
  }
  // Oldest first: the starter issues (easiest, tagged "good first issue") lead the Journey cards.
  for (const list of Object.values(issues)) list.sort((a, b) => a.number - b.number);

  // A merged PR scores its level label (level-3 = 3 points); unlabelled PRs score 1.
  const scores = new Map();
  let merged = 0;
  for (let page = 1; page <= 10; page++) { // search caps at 1000 results
    const q = encodeURIComponent(`repo:${REPO} is:pr is:merged`);
    const { items } = await gh(`/search/issues?q=${q}&per_page=100&page=${page}`);
    for (const pr of items) {
      if (pr.user.type === "Bot") continue;
      merged++;
      if (NOT_ON_BOARD.has(pr.user.login.toLowerCase())) continue;
      const level = Math.max(1, ...pr.labels.map((l) => Number(/^level-(\d)$/.exec(l.name)?.[1] || 0)));
      const s = scores.get(pr.user.login) || { github: pr.user.login, prs: 0, points: 0, level1: false };
      const isLevel1 = pr.labels.some((l) => l.name === "level-1");
      if (isLevel1 && s.level1) continue; // one Level 1 PR per person, so a duplicate doesn't score twice
      s.level1 ||= isLevel1;
      s.prs++;
      s.points += level;
      scores.set(pr.user.login, s);
    }
    if (items.length < 100) break;
  }
  const leaderboard = [...scores.values()]
    .sort((a, b) => b.points - a.points || b.prs - a.prs)
    .slice(0, 10)
    .map(({ level1, ...s }) => s);

  // The website hides its GitHub Discussions links while Discussions is switched off in the repo.
  const { has_discussions: discussions } = await gh(`/repos/${REPO}`);

  return { merged, issues, leaderboard, discussions };
}

await writeFile("contributors.json", JSON.stringify(await buildContributors(), null, 2) + "\n");
console.log("wrote contributors.json");

try {
  await writeFile("stats.json", JSON.stringify(await buildStats(), null, 2) + "\n");
  console.log("wrote stats.json");
} catch (e) {
  console.warn(`stats.json not updated (kept the old one): ${e.message}`);
}
