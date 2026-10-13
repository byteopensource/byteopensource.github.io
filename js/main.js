// Sticky header gets a shadow once the page scrolls.
const header = document.querySelector(".header");
const onScroll = () => header.classList.toggle("is-scrolled", scrollY > 8);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Underline the nav link for the section you're currently reading.
const navLinks = [...document.querySelectorAll(".nav a")];
const sectionFor = (a) => (a.hash === "#top" ? document.getElementById("hero") : document.querySelector(a.hash));
const spy = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    navLinks.forEach((a) =>
      sectionFor(a) === e.target ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")
    );
  }
}, { rootMargin: "-45% 0px -50% 0px" }); // a thin band across the middle of the screen
navLinks.forEach((a) => spy.observe(sectionFor(a)));

// Mobile menu toggle.
const menuBtn = document.querySelector(".menu-btn");
const nav = document.getElementById("site-nav");
menuBtn.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  menuBtn.setAttribute("aria-expanded", open);
});
nav.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    nav.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", false);
  }
});

// Hero polaroid: a contribution graph that gets busier left to right.
const graph = document.querySelector(".graph");
for (let i = 0; i < 84; i++) {
  const growth = Math.floor(i / 7) / 11; // column 0 → 11
  const cell = document.createElement("i");
  cell.dataset.l = Math.round((growth * 4 * ((i * 37) % 10)) / 9);
  graph.append(cell);
}

// Journey: stops work as tabs, progress is saved in this browser only.
const route = document.querySelector(".route");
const stops = [...route.querySelectorAll(".stop")];
const panels = [...document.querySelectorAll(".level-card")];
const plane = route.querySelector(".route__plane");
const statusText = document.querySelector(".journey__status-text");
const resetBtn = document.querySelector(".journey__reset");
const KEY = "byte-journey";

let done = [];
try { done = JSON.parse(localStorage.getItem(KEY)) || []; } catch {}

function select(i, focus) {
  stops.forEach((s, j) => {
    s.setAttribute("aria-selected", j === i);
    s.tabIndex = j === i ? 0 : -1;
  });
  panels.forEach((p, j) => (p.hidden = j !== i));
  if (focus) stops[i].focus();
}

function render() {
  const next = stops.findIndex((_, i) => !done.includes(i));
  stops.forEach((s, i) => s.classList.toggle("is-done", done.includes(i)));
  panels.forEach((p, i) => (p.querySelector(".done input").checked = done.includes(i)));

  // Park the plane above the next unfinished stop (or the last one).
  const dot = stops[next === -1 ? 5 : next].querySelector(".stop__dot").getBoundingClientRect();
  const box = route.getBoundingClientRect();
  plane.style.translate = `${dot.left - box.left + dot.width / 2}px ${dot.top - box.top}px`;

  statusText.textContent =
    next === -1 ? "All six stops done. You're an open source contributor ♡"
    : done.length ? `${done.length} of 6 done. Next stop: Level ${next}.`
    : "Pick a stop to begin.";
  resetBtn.hidden = !done.length;
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(done)); } catch {}
  render();
}

stops.forEach((s, i) => s.addEventListener("click", () => select(i)));

route.addEventListener("keydown", (e) => {
  const i = stops.indexOf(document.activeElement);
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (i < 0 || !step) return;
  e.preventDefault();
  select((i + step + stops.length) % stops.length, true);
});

panels.forEach((p, i) =>
  p.querySelector(".done input").addEventListener("change", (e) => {
    done = e.target.checked ? [...done, i] : done.filter((d) => d !== i);
    save();
    if (e.target.checked) celebrate(i);
  })
);

resetBtn.addEventListener("click", () => {
  done = [];
  save();
  select(0, true);
});

addEventListener("resize", render);
render();

// Runs fn the first time el scrolls into view.
function onceVisible(el, fn) {
  new IntersectionObserver(([entry], obs) => {
    if (!entry.isIntersecting) return;
    obs.disconnect();
    fn();
  }, { threshold: 0.3 }).observe(el);
}

// Pop the stops in the first time the journey scrolls into view.
onceVisible(route, () => route.classList.add("is-visible"));

// First PR: personalise every command and the contributor file with the student's details.
const REPO = "https://github.com/TheBYTEClubNIE/Open-Source_BYTE_2K26";
const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i; // GitHub's rules
const form = document.querySelector(".details__form");
const hint = document.querySelector(".field-hint");
const DETAILS_KEY = "byte-details";

try {
  const saved = JSON.parse(localStorage.getItem(DETAILS_KEY)) || {};
  for (const [k, v] of Object.entries(saved)) if (form.elements[k]) form.elements[k].value = v;
} catch {}

function updateGuide() {
  const f = Object.fromEntries(new FormData(form));
  const typed = f.github.trim();
  const valid = USERNAME.test(typed);
  const u = valid ? typed : "your-username";

  form.elements.github.setAttribute("aria-invalid", Boolean(typed) && !valid);
  hint.hidden = !typed || valid;
  document.querySelectorAll("[data-u]").forEach((el) => (el.textContent = u));

  // Name inside git config "...": drop characters that would break the shell quoting.
  const gitName = f.name.replace(/["\\`$]/g, "").trim() || "Your Name";
  document.querySelectorAll("[data-name]").forEach((el) => (el.textContent = gitName));

  // Personal shortcuts, once we know who they are.
  const shortcuts = document.querySelector(".shortcuts");
  shortcuts.hidden = !valid;
  if (valid) {
    const links = {
      fork: `https://github.com/${u}/Open-Source_BYTE_2K26`,
      prs: `${REPO}/pulls?q=${encodeURIComponent(`is:pr author:${u}`)}`,
      issues: `${REPO}/issues?q=${encodeURIComponent(`is:issue is:open assignee:${u}`)}`,
    };
    shortcuts.querySelectorAll("[data-link]").forEach((a) => (a.href = links[a.dataset.link]));
  }

  const json = JSON.stringify({
    name: f.name.trim() || "Your Name",
    github: u,
    year: Number(f.year),
    note: f.note.trim() || "One line about you.",
  }, null, 2);
  document.querySelector(".json-preview").textContent = json;
  document.querySelector(".new-file-link").href =
    `${REPO}/new/main/contributors?filename=${encodeURIComponent(u + ".json")}&value=${encodeURIComponent(json + "\n")}`;

  try { localStorage.setItem(DETAILS_KEY, JSON.stringify(f)); } catch {}
}

form.addEventListener("input", updateGuide);
form.addEventListener("submit", (e) => e.preventDefault());
updateGuide();

// Terminal / Browser-only switch.
const ways = [...document.querySelectorAll(".first-pr .toggle button")];
ways.forEach((b) =>
  b.addEventListener("click", () =>
    ways.forEach((w) => {
      w.setAttribute("aria-pressed", w === b);
      document.getElementById(w.getAttribute("aria-controls")).hidden = w !== b;
    })
  )
);

// Links elsewhere on the page can open a specific route, e.g. data-way="way-browser".
document.querySelectorAll("[data-way]").forEach((a) =>
  a.addEventListener("click", () => document.querySelector(`[aria-controls="${a.dataset.way}"]`).click())
);

// Copy buttons on every code block.
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".copy");
  if (!btn) return;
  try {
    await navigator.clipboard.writeText(btn.parentElement.querySelector("code").innerText.trim());
    btn.textContent = "copied ✓";
  } catch {
    btn.textContent = "select + ctrl+c";
  }
  setTimeout(() => (btn.textContent = "copy"), 1600);
});

// Contributor wall, filled from contributors.json.
// That file is rebuilt from contributors/*.json on every deploy (.github/workflows/deploy.yml).
const wall = document.getElementById("contributor-wall");
const cardTpl = document.getElementById("person-card");
const nextCard = wall.querySelector(".person--next");
const wallSearch = document.querySelector(".wall-search input");
const yearBtns = [...document.querySelectorAll(".wall-tools .toggle button")];
const moreBtn = document.querySelector(".wall__more");
const emptyMsg = document.querySelector(".wall__empty");
const PAGE = 30;
const YEARS = ["", "1st", "2nd", "3rd", "4th"];
const PR_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+$/; // same check as scripts/build-data.mjs

let people = [];
let shown = PAGE;
let year = "all";

function myUsername() {
  try { return (JSON.parse(localStorage.getItem(DETAILS_KEY)) || {}).github?.trim().toLowerCase(); } catch {}
}

function renderWall() {
  const q = wallSearch.value.trim().toLowerCase();
  const me = myUsername();
  const isMe = (p) => p.github.toLowerCase() === me;
  const matches = people
    .filter((p) => year === "all" || (year === "grad" ? Boolean(p.graduated) : String(p.year) === year))
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.github.toLowerCase().includes(q))
    .sort((a, b) => isMe(b) - isMe(a)); // you first

  wall.querySelectorAll(".person:not(.person--next)").forEach((el) => el.remove());
  nextCard.hidden = Boolean(q) || year !== "all";

  for (const p of matches.slice(0, shown)) {
    const li = cardTpl.content.firstElementChild.cloneNode(true);
    const url = `https://github.com/${p.github}`;
    li.querySelector("a").href = url;
    li.querySelector("img").src = `${url}.png?size=160`;
    li.querySelector(".person__name").textContent = p.name;
    li.querySelector(".person__meta").textContent = `${YEARS[p.year] || ""} year · @${p.github}`;
    li.querySelector(".person__note").textContent = p.note || "";
    li.classList.toggle("is-you", isMe(p));
    if (PR_URL.test(p.graduated || "")) {
      const grad = li.querySelector(".person__grad");
      grad.href = p.graduated;
      grad.title = "See the PR that made them a graduate";
      grad.hidden = false;
    }
    wall.append(li);
  }

  emptyMsg.hidden = matches.length > 0 || (!q && year === "all");
  moreBtn.hidden = matches.length <= shown;
}

function countUp(el, n) {
  if (!n || matchMedia("(prefers-reduced-motion: reduce)").matches) return (el.textContent = n);
  const start = performance.now();
  requestAnimationFrame(function tick(now) {
    const k = Math.min(1, (now - start) / 1200);
    el.textContent = Math.round(n * (1 - (1 - k) ** 3)); // ease-out
    if (k < 1) requestAnimationFrame(tick);
  });
}

wallSearch.addEventListener("input", () => { shown = PAGE; renderWall(); });
yearBtns.forEach((b) =>
  b.addEventListener("click", () => {
    yearBtns.forEach((y) => y.setAttribute("aria-pressed", y === b));
    year = b.dataset.year;
    shown = PAGE;
    renderWall();
  })
);
moreBtn.addEventListener("click", () => { shown += PAGE; renderWall(); });
document.querySelector("[data-show-grads]").addEventListener("click", () => yearBtns.find((b) => b.dataset.year === "grad").click());
form.addEventListener("change", renderWall); // typing your username updates "that's you"

fetch("contributors.json")
  .then((res) => res.json())
  .then((list) => {
    // Entries come from student PRs: skip anything malformed rather than break the wall.
    people = list.filter((p) => p && typeof p.name === "string" && USERNAME.test(p.github || ""));
    renderWall();
    const count = document.querySelector(".count");
    onceVisible(count, () => countUp(count, people.length));
  })
  .catch(() => {}); // wall just shows "your spot" if the file can't load

// Ask us: turns the form into a prefilled GitHub Discussion, so no backend is needed.
const askForm = document.querySelector(".ask-form");
const askSearch = document.querySelector(".ask-form__search");
const askSent = document.querySelector(".ask-form__sent");
const ASK_KEY = "byte-ask-draft";

try {
  const draft = JSON.parse(localStorage.getItem(ASK_KEY)) || {};
  for (const [k, v] of Object.entries(draft)) if (askForm.elements[k]) askForm.elements[k].value = v;
} catch {}

function updateAsk() {
  const title = askForm.elements.title.value.trim();
  askSearch.hidden = title.length < 3;
  askSearch.querySelector("a").href = `${REPO}/discussions?discussions_q=${encodeURIComponent(title)}`;
  askSent.hidden = true;
  try { localStorage.setItem(ASK_KEY, JSON.stringify(Object.fromEntries(new FormData(askForm)))); } catch {}
}

askForm.addEventListener("input", updateAsk);
updateAsk();

askForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(askForm));
  const next = stops.findIndex((_, i) => !done.includes(i)); // from the journey above
  const where = !done.length ? "Just getting started" : next === -1 ? "Finished all six levels" : `Working on Level ${next}`;
  const body = [
    `**Topic:** ${f.topic}`,
    `**Where I am:** ${where}`,
    "",
    f.body.trim() || "_No details given._",
    "",
    "<sub>Asked from the Open Source BYTE 2K26 site</sub>",
  ].join("\n");
  const title = `[${f.topic}] ${f.title.trim()}`;
  window.open(
    `${REPO}/discussions/new?category=q-a&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`,
    "_blank",
    "noopener"
  );
  askSent.hidden = false;
});

// ---------- Live data: open issues per level + leaderboard ----------
// stats.json is rebuilt on every deploy (at least every 30 min) by .github/workflows/deploy.yml, so visitors never
// hit GitHub's per-IP rate limit (a whole campus shares one IP).
const SAFE_URL = /^https:\/\/github\.com\//;

function renderIssues(issues) {
  document.querySelectorAll(".live-issues[data-label]").forEach((box) => {
    const all = (issues[box.dataset.label] || []).filter((i) => SAFE_URL.test(i.url));
    const open = all.filter((i) => !i.claimed);
    const count = document.createElement("p");
    count.className = "live-issues__count";
    if (all.length) {
      const b = document.createElement("b");
      b.textContent = all.length;
      count.append(b, ` open right now · ${open.length} unclaimed`);
    } else {
      count.textContent = `No open ${box.dataset.label} issues right now. New ones are added every week.`;
    }
    box.replaceChildren(count);

    if (open.length) {
      const ul = document.createElement("ul");
      for (const i of open.slice(0, 3)) {
        const a = document.createElement("a");
        a.href = i.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = `#${i.number} ${i.title}`; // issue titles are written by anyone: text only
        const li = document.createElement("li");
        li.append(a);
        ul.append(li);
      }
      const pick = document.createElement("button");
      pick.type = "button";
      pick.className = "link-btn";
      pick.textContent = "Pick one for me ↗";
      pick.addEventListener("click", () => window.open(open[Math.floor(Math.random() * open.length)].url, "_blank", "noopener"));
      box.append(ul, pick);
    }
    box.hidden = false;
  });
}

function renderBoard({ merged = 0, leaderboard = [] }) {
  const board = document.querySelector(".board");
  const list = board.querySelector(".board__list");
  board.querySelector(".board__merged b").textContent = Number(merged) || 0;
  for (const p of leaderboard.filter((p) => USERNAME.test(p.github || ""))) {
    const img = document.createElement("img");
    img.src = `https://github.com/${p.github}.png?size=64`;
    img.alt = "";
    img.loading = "lazy";
    const a = document.createElement("a");
    a.href = `https://github.com/${p.github}`;
    a.textContent = `@${p.github}`;
    const score = document.createElement("span");
    score.className = "board__score";
    const pts = document.createElement("b");
    pts.textContent = Number(p.points) || 0;
    const prs = Number(p.prs) || 0;
    score.append(pts, ` pts · ${prs} PR${prs === 1 ? "" : "s"}`);
    const li = document.createElement("li");
    li.append(img, a, score);
    list.append(li);
  }
  list.hidden = !list.childElementCount;
  board.querySelector(".board__empty").hidden = list.childElementCount > 0;
  board.hidden = false;
}

fetch("stats.json")
  .then((res) => res.json())
  .then((stats) => {
    renderIssues(stats.issues || {});
    renderBoard(stats);
  })
  .catch(() => {}); // no stats yet: cards keep their plain "Find an issue" buttons

// ---------- Git, Decoded: filter the cards as you type ----------
const cheatSearch = document.querySelector(".cheats__search input");
const cheats = [...document.querySelectorAll(".cheat, .word")]; // commands and glossary words
const glossaryTitle = document.querySelector(".glossary__head");
cheatSearch.addEventListener("input", () => {
  const words = cheatSearch.value.toLowerCase().split(/\s+/).filter(Boolean);
  let visible = 0;
  for (const c of cheats) {
    const text = `${c.textContent} ${c.dataset.keywords || ""}`.toLowerCase();
    c.hidden = !words.every((w) => text.includes(w));
    if (!c.hidden) visible++;
  }
  glossaryTitle.hidden = !document.querySelector(".word:not([hidden])");
  document.querySelector(".cheats__empty").hidden = visible > 0;
});

// ---------- Git, Decoded: glossary flashcards ----------
const glossary = document.querySelector(".glossary");
const wordCards = [...glossary.querySelectorAll(".word__card")];
const flipAllBtn = document.querySelector(".glossary__flip-all");
const WORDS_KEY = "byte-words";
let learned = new Set();
try { learned = new Set(JSON.parse(localStorage.getItem(WORDS_KEY)) || []); } catch {}

function flipCard(card, on) {
  card.classList.toggle("is-flipped", on);
  card.setAttribute("aria-pressed", on);
}

function showLearned() {
  wordCards.forEach((card, i) => card.parentElement.classList.toggle("is-learned", learned.has(i)));
  document.querySelector(".glossary__progress b").textContent = learned.size;
  document.querySelector(".glossary__meter i").style.width = `${(learned.size / wordCards.length) * 100}%`;
  flipAllBtn.textContent = wordCards.every((c) => c.classList.contains("is-flipped")) ? "hide answers" : "show all answers";
  try { localStorage.setItem(WORDS_KEY, JSON.stringify([...learned])); } catch {}
}

wordCards.forEach((card, i) =>
  card.addEventListener("click", () => {
    const on = !card.classList.contains("is-flipped");
    flipCard(card, on);
    const isNew = on && !learned.has(i);
    if (isNew) learned.add(i);
    showLearned();
    if (isNew && learned.size === wordCards.length) {
      confetti(140);
      toast(`All ${wordCards.length} words learned ✱ You speak Git now.`);
    }
  })
);

flipAllBtn.addEventListener("click", () => {
  const show = wordCards.some((c) => !c.classList.contains("is-flipped"));
  wordCards.forEach((c) => flipCard(c, show)); // reading mode, doesn't count as learning
  showLearned();
});

document.querySelector(".glossary__reset").addEventListener("click", () => {
  learned.clear();
  wordCards.forEach((c) => flipCard(c, false));
  showLearned();
});

showLearned();
onceVisible(glossary, () => glossary.classList.add("is-dealt")); // cards deal in like a hand of cards

// ---------- From the Blog: blogs.json, newest first ----------
const blogSection = document.getElementById("blog");
const blogGrid = blogSection.querySelector(".blog__grid");
const blogTags = blogSection.querySelector(".blog__tags");
const blogMore = blogSection.querySelector(".blog__more");
const postTpl = document.getElementById("post-card");
const BLOG_PAGE = 6;
const BLOG_URL = /^(https:\/\/|blog\/[\w-]+\.html$)/; // external post, or a page in blog/
let posts = [];
let postTag = "all";
let postsShown = BLOG_PAGE;

function renderPosts() {
  const list = posts.filter((p) => postTag === "all" || p.tag === postTag);
  blogGrid.replaceChildren(
    ...list.slice(0, postsShown).map((p) => {
      const card = postTpl.content.firstElementChild.cloneNode(true);
      const date = new Date(p.date);
      const link = card.querySelector("a");
      link.href = p.url;
      if (!p.url.startsWith("https://")) {
        // A post hosted on this site: open in the same tab
        link.removeAttribute("target");
        card.querySelector(".post__read").textContent = "read it →";
      }
      const cover = card.querySelector(".post__cover");
      if (typeof p.cover === "string" && p.cover) {
        cover.src = p.cover;
        cover.alt = "";
        cover.hidden = false;
      } else {
        cover.remove();
      }
      card.querySelector(".post__tag").textContent = p.tag || "blog";
      card.querySelector(".post__title").textContent = p.title;
      card.querySelector(".post__summary").textContent = p.summary || "";
      card.querySelector(".post__meta").textContent = [
        p.author,
        isNaN(date) ? "" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        p.minutes && `${Number(p.minutes)} min read`,
      ].filter(Boolean).join(" · ");
      return card;
    })
  );
  blogMore.hidden = list.length <= postsShown;
}

blogTags.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  blogTags.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b === btn));
  postTag = btn.dataset.tag;
  postsShown = BLOG_PAGE;
  renderPosts();
});
blogMore.addEventListener("click", () => { postsShown += BLOG_PAGE; renderPosts(); });

fetch("blogs.json")
  .then((res) => res.json())
  .then((list) => {
    posts = list
      .filter((p) => p && typeof p.title === "string" && BLOG_URL.test(p.url || ""))
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    if (!posts.length) return; // section and nav link stay hidden

    const tags = [...new Set(posts.map((p) => p.tag).filter(Boolean))];
    if (tags.length > 1) {
      for (const t of ["all", ...tags]) {
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.tag = t;
        b.textContent = t === "all" ? "All" : t;
        b.setAttribute("aria-pressed", t === "all");
        blogTags.append(b);
      }
      blogTags.hidden = false;
    }
    renderPosts();
    blogSection.hidden = false;
    document.querySelector('.nav a[href="#blog"]').parentElement.hidden = false;
  })
  .catch(() => {});

// ---------- Surprises ----------

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const toastEl = document.querySelector(".toast");
let toastTimer;

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.hidden = true), 3800);
}

function confetti(count) {
  if (reduceMotion.matches) return;
  const css = getComputedStyle(document.documentElement);
  const colors = ["--red", "--yellow", "--prompt", "--ink"].map((v) => css.getPropertyValue(v));
  const layer = document.createElement("div");
  layer.className = "confetti";
  layer.setAttribute("aria-hidden", "true");
  for (let i = 0; i < count; i++) {
    const bit = document.createElement("i");
    bit.style.cssText = `--x:${Math.random() * 100}%;--c:${colors[i % colors.length]};--d:${1.8 + Math.random() * 1.6}s;--delay:${Math.random() * 0.4}s;--dx:${Math.random() * 160 - 80}px;--r:${Math.random() * 900 - 450}deg`;
    layer.append(bit);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 4200);
}

// Called by the journey checkboxes.
function celebrate(level) {
  if (done.length === stops.length) {
    confetti(180);
    toast("All six done. You graduated! ♡ Hall of Fame, here you come.");
  } else {
    confetti(60);
    toast(`Level ${level} done ✓ ${stops.length - done.length} to go.`);
  }
}

// BYTE mode: the club logo's colours.
const byteBtn = document.querySelector(".dock__byte");
const byteModeOn = () => document.documentElement.dataset.theme === "byte";
function setByteMode(on) {
  if (on) document.documentElement.dataset.theme = "byte";
  else delete document.documentElement.dataset.theme;
  byteBtn.setAttribute("aria-pressed", on);
  try { localStorage.setItem("byte-theme", on ? "byte" : "light"); } catch {}
  return on;
}
function toggleByteMode() {
  const on = setByteMode(!byteModeOn());
  if (on) confetti(120);
  toast(on ? "BYTE mode on ✱ Click it again to go back." : "Back to daylight ☀");
}
byteBtn.setAttribute("aria-pressed", byteModeOn());
byteBtn.addEventListener("click", toggleByteMode);

// Konami code: up up down down left right left right B A
const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
let konamiAt = 0;
addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  konamiAt = key === KONAMI[konamiAt] ? konamiAt + 1 : key === KONAMI[0] ? 1 : 0;
  if (konamiAt < KONAMI.length) return;
  konamiAt = 0;
  toggleByteMode();
});

// The terminal in the hero is real.
const term = document.querySelector(".term");
const termOut = term.querySelector(".term__out");
const termIn = term.querySelector("#term-in");
const termHistory = [];
let historyAt = 0;

function print(text, cls) {
  const p = document.createElement("p");
  if (cls) p.className = cls;
  p.textContent = text;
  termOut.append(p);
  termOut.scrollTop = termOut.scrollHeight;
}

const SECTIONS = { journey: "levels", "first-pr": "first-pr", cheatsheet: "cheatsheet", contributors: "contributors", beyond: "beyond", blog: "blog", faq: "faq", ask: "ask" };

// Short fake commit hash so git log looks real.
function hash(s) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h.toString(16).padStart(7, "0").slice(0, 7);
}

const COMMANDS = {
  help: () => [
    "help                 this list",
    "whoami               who you are (fill in the First PR card first)",
    "git status           your journey progress",
    "git log              who's already in",
    "ls                   sections on this page",
    "cd <section>         jump to a section",
    "open repo            the GitHub repo",
    "byte                 toggle BYTE mode",
    "clear / exit",
    "",
    "psst… there's a Konami code somewhere too.",
  ].join("\n"),
  whoami: () => {
    try {
      const d = JSON.parse(localStorage.getItem(DETAILS_KEY)) || {};
      if (USERNAME.test(d.github || "")) return `${d.github}${d.name ? ` (${d.name}, ${YEARS[d.year] || "?"} year)` : ""}`;
    } catch {}
    return "a future contributor. Tell me who you are in the First PR card.";
  },
  "git status": () => {
    const next = stops.findIndex((_, i) => !done.includes(i));
    if (!done.length) return "On branch journey\nnothing done yet, working tree clean.\nStart with Level 0: cd journey";
    if (next === -1) return "On branch journey\nAll 6 levels done. You graduated ♡";
    const name = stops[next].querySelector(".stop__name").textContent;
    return `On branch journey\nLevels done: ${done.length}/6\nNext up: Level ${next}, ${name}`;
  },
  "git log": () => {
    if (!people.length) return "fatal: your current branch 'main' does not have any commits yet.\nBe the first: cd first-pr";
    return people.slice(-8).reverse().map((p) => `${hash(p.github)}  Add ${p.github} to contributors`).join("\n");
  },
  ls: () => Object.keys(SECTIONS).map((s) => s + "/").join("   "),
  "open repo": () => { window.open(REPO, "_blank", "noopener"); return "Opening GitHub…"; },
  byte: () => (setByteMode(!byteModeOn()) ? "BYTE mode on ✱ (type byte again to go back)" : "BYTE mode off. Hello daylight."),
  coffee: () => "  ( (\n   ) )\n c[_]   brewing… done. Now go fix that bug.",
  "sudo make me a contributor": () => "[sudo] password for you: ********\nNice try. Contributors are made, not sudo'd.\nOne PR does it though: cd first-pr",
  "rm -rf /": () => "Permission denied. And honestly? Respect.",
  hello: () => "Hey! ♡ Type help to see what I can do.",
  exit: () => term.close(),
  clear: () => { termOut.textContent = ""; },
};
COMMANDS.hi = COMMANDS.hello;
COMMANDS.quit = COMMANDS.exit;

function run(raw) {
  const line = raw.trim().replace(/\s+/g, " ");
  if (!line) return;
  print(line, "cmd");
  const [first, ...rest] = line.split(" ");
  const arg = rest.join(" ");

  if (first === "cd") {
    const id = SECTIONS[arg.replace(/\/$/, "")];
    if (!id) return print(`cd: no such section: ${arg || "(nothing)"}. Try ls`);
    term.close();
    return document.getElementById(id).scrollIntoView();
  }
  if (first === "echo") return print(arg);

  const cmd = COMMANDS[line.toLowerCase()];
  if (!cmd && first === "sudo") return print("[sudo] password for you: ********\nyou are not in the sudoers file. This incident will be reported to The BYTE Club ✱");
  const out = cmd ? cmd() : `command not found: ${first}. Try help`;
  if (out) print(out, cmd === COMMANDS.help ? "hl" : undefined);
}

function openTerm() {
  if (term.open) return;
  if (!termOut.childElementCount) print("Welcome to The BYTE Club terminal ✱\nType help and press Enter.", "hl");
  term.showModal();
  termIn.focus();
}

term.querySelector(".term__form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (termIn.value.trim()) termHistory.push(termIn.value);
  historyAt = termHistory.length;
  run(termIn.value);
  termIn.value = "";
});

termIn.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
  e.preventDefault();
  historyAt = Math.max(0, Math.min(termHistory.length, historyAt + (e.key === "ArrowUp" ? -1 : 1)));
  termIn.value = termHistory[historyAt] || "";
});

term.querySelector(".term__close").addEventListener("click", () => term.close());
term.addEventListener("click", (e) => { if (e.target === term) term.close(); }); // click on the backdrop
document.querySelector(".collage .terminal").addEventListener("click", openTerm);
document.querySelectorAll("[data-open-term]").forEach((b) => b.addEventListener("click", openTerm));
addEventListener("keydown", (e) => {
  if (e.key !== "`" || e.target.closest("input, textarea, select")) return;
  e.preventDefault();
  openTerm();
});

// For anyone who opens DevTools.
console.log(
  `%cThe BYTE Club ✱%c\n\nYou opened DevTools. You're exactly who we're looking for.\n\nFound a bug? That's a Level 3 issue: ${REPO}/issues\nPsst: press \` on the page. Or try the Konami code.`,
  "font: 700 28px sans-serif; color: #e3341e",
  "font: 14px sans-serif"
);
