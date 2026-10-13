// Vercel function behind the website's "Ask Us → Email" form.
// The Resend API key lives only in Vercel's environment variables, never in the website.
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY   required. Your Resend key.
//   ASK_FROM         required. A sender on a domain verified in Resend, e.g. "BYTE Ask Us <ask@yourdomain>".
//                    Before verifying a domain you can use "BYTE Ask Us <onboarding@resend.dev>",
//                    but Resend then only delivers to your own Resend account's email.
//   ASK_TO           where questions go. Default: thebyteclub@nie.ac.in
//   ALLOWED_ORIGINS  comma-separated sites allowed to call this. Default: the GitHub Pages site.

const TOPICS = ["Setup", "Git", "My PR", "Levels", "Other"];
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const DEFAULT_ORIGINS = "https://byteopensource.github.io,https://thebyteclubnie.github.io";

// ponytail: per-instance memory, so the limit resets when Vercel starts a new instance.
// Good enough to stop one person hammering the button; use Vercel KV/Upstash if real abuse shows up.
const recent = new Map();
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

function rateLimited(ip, now = Date.now()) {
  const hits = (recent.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > LIMIT;
}

const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Pure validation, so it can be tested without a network.
export function validate(body) {
  const q = {
    name: clean(body?.name, 80),
    email: clean(body?.email, 120),
    topic: clean(body?.topic, 20),
    title: clean(body?.title, 120),
    details: clean(body?.details, 2000),
    level: clean(body?.level, 40),
  };
  if (!TOPICS.includes(q.topic)) return { error: "Pick a topic." };
  if (q.title.length < 8) return { error: "Write your question in at least a few words." };
  if (q.email && !EMAIL.test(q.email)) return { error: "That email address doesn't look right." };
  return { q };
}

export function buildEmail(q, { from, to }) {
  const who = q.name || "A student";
  const lines = [
    `Topic: ${q.topic}`,
    ...(q.level ? [`Where they are: ${q.level}`] : []),
    `From: ${who}${q.email ? ` <${q.email}>` : " (no email given, so you can't reply directly)"}`,
    "",
    q.details || "(no details)",
  ];
  return {
    from,
    to: [to],
    subject: `[Ask Us · ${q.topic}] ${q.title}`,
    ...(q.email && { reply_to: q.email }), // hitting Reply in your inbox answers the student
    text: lines.join("\n"),
    html: `<p><b>${escapeHtml(q.title)}</b></p><pre style="font:14px/1.5 system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(lines.join("\n"))}</pre>`,
  };
}

export default async function handler(req, res) {
  const origins = (process.env.ALLOWED_ORIGINS || DEFAULT_ORIGINS).split(",").map((o) => o.trim());
  const origin = req.headers.origin || "";
  if (origins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  if (!origins.includes(origin)) return res.status(403).json({ error: "Not allowed from this site." });

  const body = typeof req.body === "string" ? safeJson(req.body) : req.body;

  // Honeypot: a hidden field real people never fill. Pretend it worked so bots don't adapt.
  if (body?.website) return res.status(200).json({ ok: true });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return res.status(429).json({ error: "Too many questions in a short time. Try again in a few minutes." });

  const { q, error } = validate(body);
  if (error) return res.status(400).json({ error });

  const { RESEND_API_KEY, ASK_FROM, ASK_TO = "thebyteclub@nie.ac.in" } = process.env;
  if (!RESEND_API_KEY || !ASK_FROM) return res.status(500).json({ error: "Email isn't set up yet. Please use the GitHub option." });

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(buildEmail(q, { from: ASK_FROM, to: ASK_TO })),
  });
  if (!r.ok) {
    console.error("Resend error", r.status, await r.text()); // visible in Vercel logs, never sent to the browser
    return res.status(502).json({ error: "Couldn't send right now. Please try again, or use the GitHub option." });
  }
  return res.status(200).json({ ok: true });
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return null; }
}
