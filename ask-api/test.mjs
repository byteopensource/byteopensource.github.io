// Tests for the Ask Us email function, with Resend faked. Run: node ask-api/test.mjs
import assert from "node:assert/strict";
import handler, { validate, buildEmail } from "./api/ask.js";

const SITE = "https://byteopensource.github.io";
let passed = 0;
async function test(name, fn) { await fn(); passed++; console.log("ok -", name); }

function call({ method = "POST", origin = SITE, body, ip = "1.2.3.4", env = {} } = {}) {
  Object.assign(process.env, { RESEND_API_KEY: "re_test", ASK_FROM: "BYTE <ask@example.com>", ...env });
  const res = {
    statusCode: 0, headers: {}, payload: undefined,
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(p) { this.payload = p; return this; },
    end() { return this; },
  };
  return handler({ method, headers: { origin, "x-forwarded-for": ip }, body }, res).then(() => res);
}

const sent = [];
let resendOk = true;
globalThis.fetch = async (url, opts) => {
  sent.push({ url, opts, body: JSON.parse(opts.body) });
  return { ok: resendOk, status: resendOk ? 200 : 422, text: async () => "bad" };
};

const good = { topic: "Git", title: "git push says permission denied", details: "I ran git push origin main.", name: "Riya", email: "riya@example.com", level: "Working on Level 2" };

await test("valid question is emailed with the key, reply-to and subject", async () => {
  const res = await call({ body: good, ip: "10.0.0.1" });
  assert.equal(res.statusCode, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].url, "https://api.resend.com/emails");
  assert.equal(sent[0].opts.headers.Authorization, "Bearer re_test");
  assert.equal(sent[0].body.reply_to, "riya@example.com");
  assert.equal(sent[0].body.to[0], "thebyteclub@nie.ac.in");
  assert.match(sent[0].body.subject, /\[Ask Us · Git\] git push says/);
  assert.match(sent[0].body.text, /Where they are: Working on Level 2\nFrom: Riya <riya@example.com>\n\nI ran git push/);
  assert.equal(res.headers["Access-Control-Allow-Origin"], SITE);
});

await test("other websites can't use it", async () => {
  const res = await call({ origin: "https://evil.example", body: good, ip: "10.0.0.2" });
  assert.equal(res.statusCode, 403);
  assert.equal(res.headers["Access-Control-Allow-Origin"], undefined);
});

await test("preflight and wrong methods", async () => {
  assert.equal((await call({ method: "OPTIONS" })).statusCode, 204);
  assert.equal((await call({ method: "GET" })).statusCode, 405);
});

await test("bots filling the hidden field get a fake success and nothing is sent", async () => {
  const before = sent.length;
  const res = await call({ body: { ...good, website: "http://spam" }, ip: "10.0.0.3" });
  assert.equal(res.statusCode, 200);
  assert.equal(sent.length, before);
});

await test("bad input is rejected with a friendly message", async () => {
  assert.equal((await call({ body: { ...good, topic: "Hacking" }, ip: "10.0.0.4" })).statusCode, 400);
  assert.equal((await call({ body: { ...good, title: "help" }, ip: "10.0.0.4" })).statusCode, 400);
  assert.match((await call({ body: { ...good, email: "not-an-email" }, ip: "10.0.0.4" })).payload.error, /email/);
  assert.equal((await call({ body: "not json", ip: "10.0.0.4" })).statusCode, 400);
});

await test("the 6th question in 10 minutes from one person is refused", async () => {
  const codes = [];
  for (let i = 0; i < 6; i++) codes.push((await call({ body: good, ip: "10.0.0.5" })).statusCode);
  assert.deepEqual(codes, [200, 200, 200, 200, 200, 429]);
});

await test("HTML in a question can't inject into the email", async () => {
  const mail = buildEmail(validate({ ...good, title: "<img src=x onerror=alert(1)> hello", details: "<script>x</script>" }).q, { from: "a", to: "b" });
  assert.ok(!mail.html.includes("<img"));
  assert.ok(!mail.html.includes("<script>"));
  assert.ok(mail.html.includes("&lt;img"));
});

await test("no email given: no reply-to, and the email says so", async () => {
  const mail = buildEmail(validate({ ...good, email: "", name: "" }).q, { from: "a", to: "b" });
  assert.equal(mail.reply_to, undefined);
  assert.match(mail.text, /A student \(no email given/);
});

await test("missing setup or a Resend failure sends people to the GitHub option", async () => {
  const unset = await call({ body: good, ip: "10.0.0.6", env: { RESEND_API_KEY: "" } });
  assert.equal(unset.statusCode, 500);
  assert.match(unset.payload.error, /GitHub option/);
  resendOk = false;
  const failed = await call({ body: good, ip: "10.0.0.7" });
  resendOk = true;
  assert.equal(failed.statusCode, 502);
  assert.ok(!JSON.stringify(failed.payload).includes("bad")); // Resend's error stays in the logs
});

console.log(`\n${passed} tests passed`);
