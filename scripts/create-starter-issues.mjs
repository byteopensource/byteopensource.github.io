// The starter issue backlog: real, small tasks on this website, sorted by level.
// Dry run (prints the list):   node scripts/create-starter-issues.mjs
// Create them on GitHub:        node scripts/create-starter-issues.mjs --create
// Needs the GitHub CLI logged in as a maintainer (gh auth login). Issues that already exist (same title) are skipped.
import { execFileSync } from "node:child_process";

const REPO = process.env.REPO || "byteopensource/byteopensource.github.io";
const SITE = "https://byteopensource.github.io/";

function body({ what, where, done, hints }) {
  return [
    what,
    where && `### Where\n${where}`,
    done && `### Done when\n${done.map((d) => `- [ ] ${d}`).join("\n")}`,
    hints && `### Hints\n${hints}`,
    `---\nComment \`/assign\` to claim this issue. New here? Do [Level 1](${SITE}#first-pr) first, it takes 10 minutes.`,
  ].filter(Boolean).join("\n\n");
}

const faq = (question, hint) => ({
  title: `FAQ: ${question}`,
  labels: ["level-2", "good first issue"],
  body: body({
    what: `Add a new question to the **Stuck?** FAQ on the website: **${question}**`,
    where: "`index.html`, inside `<section class=\"faq\" id=\"faq\">`. Each question is a `<details name=\"faq\">` block.",
    done: [
      "A new `<details name=\"faq\">` with the question in `<summary>` and a short answer (2 to 3 sentences) in `<p>`",
      "Plain, friendly English that a first-year student understands",
      "Checked in a browser: it opens and closes, and opening it closes the others",
    ],
    hints: hint,
  }),
});

const cheat = (title, command, hint) => ({
  title: `Git, Decoded: add a card for "${title}"`,
  labels: ["level-2", "good first issue"],
  body: body({
    what: `Add a card to the **Git, Decoded** cheat sheet: *${title}*, using \`${command}\`.`,
    where: "`index.html`, inside `<section … id=\"cheatsheet\">`. Copy an existing `<article class=\"cheat\">` and change it.",
    done: [
      "A heading that says what the student wants to do, not the command name",
      "The command inside `<span>` lines in the code block (the `$ ` is added automatically)",
      "One or two sentences of plain-English explanation",
      "Useful words in `data-keywords` so the search box finds it",
      "The copy button copies exactly the command",
    ],
    hints: hint,
  }),
});

const ISSUES = [
  // ---------- Level 0 ----------
  {
    title: "👋 Introduce yourself!",
    labels: ["level-0"],
    body: [
      "Welcome to Open Source BYTE 2K26! Say hi in a comment below. Tell us:",
      "",
      "- Your name and year",
      "- What you want to learn or build",
      "- One fun fact about you",
      "",
      `Then head to [Level 1](${SITE}#first-pr) and put your name on the website.`,
      "",
      "_(Maintainers: pin this issue and never close it.)_",
    ].join("\n"),
  },

  // ---------- Level 2: docs and content ----------
  faq("What's the difference between a fork and a clone?", "A fork is your copy on GitHub. A clone is a copy on your laptop. Most people need both."),
  faq("Do I need to install anything for my first PR?", "Mention the **Browser only** route in the First PR section, and that the terminal route needs Git."),
  faq("What makes a good commit message?", "Short, in the imperative (\"Add…\", \"Fix…\"). CONTRIBUTING.md has examples you can borrow."),
  faq("What does \"upstream\" mean?", "upstream = the club's repo, origin = your fork. A tiny example helps."),
  faq("GitHub says \"This branch has conflicts\". What now?", "Link to the merge-conflict help in CONTRIBUTING.md instead of repeating all of it."),
  cheat("Save unfinished work for later", "git stash / git stash pop", "Explain when you'd need it: switching branches with half-done changes."),
  cheat("Delete a branch after it's merged", "git branch -d my-change", "You can also mention `git push origin --delete my-change` for the copy on GitHub."),
  cheat("Check where your code gets pushed", "git remote -v", "Tie it to the \"permission denied\" problem: origin should be your fork."),
  cheat("Set your name and email (first time only)", "git config --global user.name / user.email", "Students hit this error on their very first commit. Use placeholder values in the example."),
  {
    title: "CONTRIBUTING: add screenshots of the \"Compare & pull request\" button",
    labels: ["level-2", "good first issue"],
    body: body({
      what: "Beginners can't find the button that opens a pull request. Add two screenshots to the Level 1 part of CONTRIBUTING.md.",
      where: "`CONTRIBUTING.md`, section *Level 1 · Your first PR*. Put images in a new `assets/docs/` folder.",
      done: [
        "Screenshot 1: the yellow \"Compare & pull request\" banner on a fork",
        "Screenshot 2: the pull request form with the title and description filled in",
        "Images are PNG or WebP, under 300 KB each, with alt text",
      ],
    }),
  },
  {
    title: "Translate the Level 1 guide into Kannada",
    labels: ["level-2"],
    body: body({
      what: "Some students are more comfortable reading Kannada. Translate the *Level 1 · Your first PR* steps.",
      where: "Create `docs/first-pr.kn.md` and link to it from the top of the Level 1 section in `CONTRIBUTING.md`.",
      done: ["Steps translated, commands and file names left in English", "Linked from CONTRIBUTING.md", "Checked by a second Kannada speaker in the PR review"],
    }),
  },
  {
    title: "Translate the Level 1 guide into Hindi",
    labels: ["level-2"],
    body: body({
      what: "Translate the *Level 1 · Your first PR* steps into Hindi.",
      where: "Create `docs/first-pr.hi.md` and link to it from the top of the Level 1 section in `CONTRIBUTING.md`.",
      done: ["Steps translated, commands and file names left in English", "Linked from CONTRIBUTING.md", "Checked by a second Hindi speaker in the PR review"],
    }),
  },
  {
    title: "Blog: write about your first pull request",
    labels: ["level-2"],
    body: body({
      what: "Write a short post (400 to 800 words) about making your first PR here: what confused you, what helped, what you'd tell a friend.",
      where: "Copy `blog/what-is-open-source.html` to `blog/<short-name>.html`, replace the article, and add an entry at the top of `blogs.json`.",
      done: ["Your own words and experience", "A tag (e.g. `story`), date, reading time and one-line summary in `blogs.json`", "It shows up in the *From the Blog* section locally"],
      hints: "Keep the same classes (`article`, `nudge`…) and the post will match the site's style.",
    }),
  },

  // ---------- Level 3: small code ----------
  {
    title: "Terminal: add a `date` command",
    labels: ["level-3"],
    body: body({
      what: "The secret terminal (click the terminal in the hero, or press `` ` ``) should answer `date` with the current date and time in India.",
      where: "`js/main.js`, the `COMMANDS` object in the *Surprises* section. Also add it to the `help` list.",
      done: ["`date` prints something like `Tue 13 Oct 2026, 10:42 IST`", "Listed in `help`"],
      hints: "Look up `toLocaleString` with the `timeZone: \"Asia/Kolkata\"` option.",
    }),
  },
  {
    title: "Terminal: add `git branch` showing the six levels",
    labels: ["level-3"],
    body: body({
      what: "Make `git branch` list the levels like real branches, with a `*` on the student's next level from their Journey progress.",
      where: "`js/main.js`, `COMMANDS`. The `git status` command already reads the progress, so reuse its logic.",
      done: ["Output looks like real `git branch` output", "The `*` follows the Journey progress", "Listed in `help`"],
    }),
  },
  {
    title: "Terminal: Tab to autocomplete commands",
    labels: ["level-3"],
    body: body({
      what: "Pressing Tab in the terminal should complete a partly typed command (`gi` + Tab → `git `), like a real shell.",
      where: "`js/main.js`, the `keydown` listener on `termIn`.",
      done: ["Tab completes when there's exactly one match", "With several matches, it prints them all", "Tab never moves focus out of the terminal input"],
    }),
  },
  {
    title: "Copy buttons: tell screen-reader users when something is copied",
    labels: ["level-3"],
    body: body({
      what: "The copy buttons change their text to \"copied ✓\", but screen readers don't announce it. Fix that.",
      where: "`js/main.js`, the *Copy buttons on every code block* listener.",
      done: ["Screen readers announce \"Copied\" after a click", "Nothing visual changes for sighted users"],
      hints: "An element with `aria-live=\"polite\"` (or `role=\"status\"`) is the usual way.",
    }),
  },
  {
    title: "FAQ: add a search box",
    labels: ["level-3"],
    body: body({
      what: "As the FAQ grows, add a search box that filters the questions, like the one in *Git, Decoded*.",
      where: "`index.html` (FAQ section), `css/style.css`, `js/main.js`. The cheat sheet search is a good example to copy.",
      done: ["Typing filters questions by question and answer text", "A friendly message when nothing matches, linking to Ask Us", "Works with the keyboard and in BYTE mode"],
    }),
  },
  {
    title: "Git, Decoded: make the cheat sheet print nicely",
    labels: ["level-3"],
    body: body({
      what: "Students will want to print the cheat sheet. When printing, show only the Git, Decoded cards, in black and white, two per row.",
      where: "`css/style.css`, a new `@media print { … }` block.",
      done: ["Ctrl+P shows only the cheat sheet", "No dark backgrounds or dock buttons in the printout", "Fits on two A4 pages"],
    }),
  },
  {
    title: "Contributors wall: sort by newest or A to Z",
    labels: ["level-3"],
    body: body({
      what: "Add a small sort control to the wall: *Newest first* (default) or *A to Z*.",
      where: "`index.html` (`.wall-tools`), `js/main.js` (`renderWall`).",
      done: ["Sorting works together with search and the year filter", "\"That's you\" still comes first", "Keyboard accessible"],
      hints: "`contributors.json` is already in joining order. Newest first is just that list reversed.",
    }),
  },
  {
    title: "Blog posts: add a \"Copy link\" button",
    labels: ["level-3"],
    body: body({
      what: "Make sharing posts on WhatsApp easy: a *Copy link* button at the end of each blog post.",
      where: "`blog/what-is-open-source.html` (and the CSS in `css/style.css` under *Blog post pages*).",
      done: ["Copies the page URL", "Shows \"Link copied ✓\" for a moment", "Uses the site's button styles"],
    }),
  },
  {
    title: "Hero: make the \"good first issue\" sticky note open a real issue",
    labels: ["level-3"],
    body: body({
      what: "The red sticky note in the hero collage should open a random unclaimed `level-2` issue.",
      where: "`index.html` (`.sticky` in the collage), `js/main.js` (the live-issues code already loads `stats.json`).",
      done: ["Clicking the note opens a random unclaimed level-2 issue", "If there are none, it scrolls to the Journey instead", "Still reachable for keyboard users (the collage is `aria-hidden`, so think about this)"],
    }),
  },
  {
    title: "404 page: suggest where to go",
    labels: ["level-3"],
    body: body({
      what: "Make `404.html` more helpful: under the fake git error, add a few links to the main sections (Journey, First PR, FAQ).",
      where: "`404.html`. Styles are inline in that file on purpose (read the comment).",
      done: ["Three or four section links in the same style", "Works on a phone"],
    }),
  },
  {
    title: "Suggest BYTE mode to people whose system is in dark mode",
    labels: ["level-3"],
    body: body({
      what: "If someone's device is set to dark mode and they've never chosen a theme, show a small one-time toast: *\"Dark mode fan? Try BYTE mode ✱\"* with a button.",
      where: "`js/main.js`: the BYTE mode block and the `toast()` helper.",
      done: ["Only shown once, and never if they already picked a theme", "The button switches BYTE mode on", "Does not switch the theme by itself"],
      hints: "`matchMedia(\"(prefers-color-scheme: dark)\")`.",
    }),
  },
  {
    title: "Journey: Home and End keys jump to the first and last stop",
    labels: ["level-3"],
    body: body({
      what: "The Journey stops are tabs. Arrow keys already move between them. Add Home and End, which the tabs pattern expects.",
      where: "`js/main.js`, the `keydown` listener on `.route`.",
      done: ["Home focuses and opens Level 0", "End focuses and opens Level 5", "Arrow keys still work"],
    }),
  },

  // ---------- Level 4: features ----------
  {
    title: "Feature: events section for workshops and PR parties",
    labels: ["level-4"],
    body: body({
      what: "Add an *Events* section listing upcoming workshops, read from a new `events.json`, so the club can add events with a small PR.",
      done: ["`events.json` with date, title, place, short description and optional link", "Past events hidden or greyed out automatically", "Section hidden when there are no upcoming events", "Nav link and terminal `cd events`"],
      hints: "The blog section (`blogs.json` + template + hidden-until-loaded) is the pattern to follow. Post a plan as a comment before building.",
    }),
  },
  {
    title: "Feature: mentors section",
    labels: ["level-4"],
    body: body({
      what: "Show who students can ask for help: mentor cards from a new `mentors.json` (name, GitHub, year, what they can help with).",
      done: ["`mentors.json` and a card layout matching the polaroid style", "Each card shows the mentor's topics as chips", "Section hidden when empty"],
      hints: "Post a plan as a comment before building.",
    }),
  },
  {
    title: "Feature: a Hall of Fame page for graduates",
    labels: ["level-4"],
    body: body({
      what: "A separate page, `hall-of-fame.html`, listing everyone who reached Level 5, with links to their outside pull requests.",
      done: ["Reads `contributors.json` and shows only people with `graduated`", "Shows the project name, taken from the PR link", "Linked from the Level 5 card and the contributors wall"],
    }),
  },
  {
    title: "Feature: write blog posts in Markdown",
    labels: ["level-4"],
    body: body({
      what: "Writing posts in raw HTML is a barrier. Let people write `blog/<name>.md`, and have the deploy turn it into a page that matches the current design.",
      done: ["A script in `scripts/` converts `blog/*.md` to `blog/*.html` during deploy", "Supports headings, lists, links, bold, code, and `> Nudge:` notes", "No new npm dependencies, or a very good reason in the proposal"],
      hints: "Post a plan first: this touches `deploy.yml`.",
    }),
  },
  {
    title: "Feature: English / ಕನ್ನಡ toggle for the First PR guide",
    labels: ["level-4"],
    body: body({
      what: "Let students switch the First PR section between English and Kannada.",
      done: ["A toggle in the First PR section, remembered in the browser", "Commands, file names and code stay in English", "Easy to add more languages later"],
      hints: "Post a plan first: where should the translated text live?",
    }),
  },
];

// ---------- runner ----------
const create = process.argv.includes("--create");
const gh = (args) => execFileSync("gh", args, { encoding: "utf8" });

const existing = create
  ? new Set(JSON.parse(gh(["issue", "list", "--repo", REPO, "--state", "all", "--limit", "1000", "--json", "title"])).map((i) => i.title))
  : new Set();

for (const issue of ISSUES) {
  if (existing.has(issue.title)) {
    console.log(`skip (already exists)  ${issue.title}`);
  } else if (create) {
    gh(["issue", "create", "--repo", REPO, "--title", issue.title, "--body", issue.body, "--label", issue.labels.join(",")]);
    console.log(`created  ${issue.title}`);
  } else {
    console.log(`${issue.labels.join(", ").padEnd(28)} ${issue.title}`);
  }
}
if (!create) console.log(`\n${ISSUES.length} issues. Dry run only: add --create to open them on ${REPO}.`);
