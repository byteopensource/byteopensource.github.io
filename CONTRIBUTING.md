# Contributing to Open Source BYTE 2K26

Welcome! This guide covers everything from your very first pull request to building whole features.
If anything here is confusing, that's a bug in this guide. [Ask us](https://github.com/TheBYTEClubNIE/Open-Source_BYTE_2K26/discussions/new?category=q-a) and then fix it in a PR. That's a great Level 2 contribution.

**Contents:** [The rules](#the-rules) · [Level 0](#level-0--set-up) · [Level 1](#level-1--your-first-pr) · [Level 2–4](#levels-24--working-on-issues) · [Level 5](#level-5--graduate) · [Run the site locally](#run-the-site-locally) · [Code style](#code-style) · [After you open a PR](#after-you-open-a-pr) · [Common git problems](#common-git-problems)

---

## The rules

1. **One Level 1 PR per person.** Your contributor file is yours to keep. Edit it later with a normal PR.
2. **Claim before you code.** Comment `/assign` on an issue. Work on unclaimed issues may be closed so the person who claimed it isn't wasted.
3. **One claimed issue at a time.** Finish it, or comment `/unassign` to let it go.
4. **Claims expire** if no pull request shows up: 48 hours for `level-2`, 3 days for `level-3`, 7 days for `level-4`. Open a draft PR early if you need more time. Draft PRs count.
5. **Only change what the issue asks for.** Spotted something else? Open a new issue.
6. **No low-effort PRs.** Whitespace-only changes, copy-pasted AI output you didn't check, or "fixed typo" PRs that fix nothing are closed with the `invalid` label.
7. **Be kind.** Everyone here is learning. See the [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Level 0 · Set up

- Create a [GitHub account](https://github.com/signup) with a real photo and a short bio.
- Write a [profile README](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme).
- Star this repo ⭐ and say hi in the pinned **Introduce yourself** issue.

## Level 1 · Your first PR

The website has a [step-by-step guide](https://thebyteclubnie.github.io/Open-Source_BYTE_2K26/#first-pr) that fills in every command with your username. The short version:

```bash
# 1. Fork the repo on GitHub, then:
git clone https://github.com/<your-username>/Open-Source_BYTE_2K26.git
cd Open-Source_BYTE_2K26
git switch -c add-<your-username>

# 2. Create contributors/<your-username>.json (see below)

# 3. Save and send it
git add contributors/<your-username>.json
git commit -m "Add <your-username> to contributors"
git push origin add-<your-username>

# 4. On GitHub, click "Compare & pull request"
```

Your file, named exactly after your GitHub username:

```json
{
  "name": "Your Name",
  "github": "your-github-username",
  "year": 2,
  "note": "One line about you, up to 100 characters."
}
```

| Field | Required | Rules |
|---|---|---|
| `name` | yes | Your name, up to 60 characters |
| `github` | yes | Your GitHub username, exactly. Must match the file name. |
| `year` | no | `1`, `2`, `3` or `4`, as a number, no quotes |
| `note` | no | One line, up to 100 characters |

**What happens next:** a bot checks the file. If everything's right it merges your PR, and your polaroid appears on the website a few minutes later.
If something's off, it comments with exactly what to fix. Push a fix to the same branch and it checks again automatically.

## Levels 2–4 · Working on issues

1. Browse issues labelled [`level-2`](https://github.com/TheBYTEClubNIE/Open-Source_BYTE_2K26/issues?q=is%3Aopen+label%3Alevel-2), [`level-3`](https://github.com/TheBYTEClubNIE/Open-Source_BYTE_2K26/issues?q=is%3Aopen+label%3Alevel-3) or [`level-4`](https://github.com/TheBYTEClubNIE/Open-Source_BYTE_2K26/issues?q=is%3Aopen+label%3Alevel-4). Unassigned ones are free.
2. Comment **`/assign`**. The bot assigns you and tells you your deadline.
3. **Sync your fork first**, so you start from the latest code (see [Common git problems](#common-git-problems)).
4. Make a branch, make the change, [test it locally](#run-the-site-locally).
5. Open a PR and write **`Closes #<issue-number>`** in the description. That links the issue and copies its level label onto your PR, which is how you score points on the leaderboard.

| Level | What it looks like | Points per merged PR |
|---|---|---|
| `level-2` | Docs, FAQ entries, cheat-sheet cards, README fixes | 2 |
| `level-3` | Small code changes: bug fixes, accessibility, new terminal commands | 3 |
| `level-4` | A whole feature. **Open a [proposal](https://github.com/TheBYTEClubNIE/Open-Source_BYTE_2K26/issues/new?template=idea.yml) first** and wait for a thumbs up | 4 |

Found a bug or a typo that isn't an issue yet? [Report it](https://github.com/TheBYTEClubNIE/Open-Source_BYTE_2K26/issues/new?template=bug.yml) and tick "I want to fix it". A maintainer will label it so you can claim it.

## Level 5 · Graduate

Get a pull request merged in a real open source project outside this repo. [goodfirstissue.dev](https://goodfirstissue.dev) is a good place to look. Pick a project you actually use, and read its CONTRIBUTING file first.

Then open a PR that adds one line to **your own** contributor file:

```json
"graduated": "https://github.com/<owner>/<repo>/pull/<number>"
```

A maintainer checks the link and merges it. Your polaroid gets a **graduate ✱** stamp and joins the Hall of Fame.

---

## Run the site locally

The site is plain HTML, CSS and JavaScript. There's nothing to install except a tiny web server, because browsers block the data files when you open `index.html` directly.

```bash
python -m http.server 5500
```

Open http://localhost:5500. No Python? Use the **Live Server** extension in VS Code, or `npx serve`.

To fill the contributors wall with the real files while you work:

```bash
node scripts/build-data.mjs
```

That rebuilds `contributors.json` (and `stats.json`, if GitHub's API lets you; it's fine if that part fails). **Don't commit those two files.** The site rebuilds them on every deploy.

If you change the bots in `.github/workflows/`, run their tests:

```bash
node scripts/test-workflows.mjs
```

## Project map

| Path | What it is |
|---|---|
| `index.html` | The whole landing page, section by section |
| `css/style.css` | All styles. Colours and fonts are variables at the top (`--sky`, `--red`…). BYTE mode overrides them. |
| `js/main.js` | Everything interactive, in commented blocks (journey, first PR, wall, blog, terminal…) |
| `blog/*.html` + `blogs.json` | Blog posts and the list that feeds the blog section |
| `contributors/` | One JSON file per student |
| `scripts/build-data.mjs` | Builds `contributors.json` and `stats.json` for the site |
| `ask-api/` | The Vercel function behind *Ask Us → By email* (deployed separately, see its README) |
| `.github/workflows/` | `deploy.yml` (publishes the site), `pull-requests.yml` (Level 1 bot + level labels), `claims.yml` (`/assign`), `checks.yml` (tests) |

## Code style

- **No frameworks, no build step, no new dependencies.** Plain HTML, CSS and JS keep the site readable for every beginner.
- **Use the CSS variables** (`var(--red)`, `var(--paper)`…) instead of hard-coded colours, so BYTE mode keeps working.
- **Check three views** before opening a PR: a phone-sized window, a laptop window, and BYTE mode (the button in the bottom-right corner).
- **Accessibility:** images need `alt` text, buttons must be real `<button>`s, and anything clickable must work with the keyboard.
- **Never put user content into `innerHTML`.** Data from JSON files or GitHub comes from strangers, so use `textContent`.
- Match the surrounding code: same naming, same comment style, small focused changes.

## Commit messages

Short, in the imperative, saying what the commit does:

```
Add FAQ entry about forks vs clones
Fix copy button overlapping long commands
```

Not `update`, `changes`, or `fixed stuff`.

## After you open a PR

- A maintainer replies within **48 hours**. Busy week? A polite nudge after that is fine.
- They may ask for changes. **That's normal and it's the best part.** Push the fixes to the same branch and the PR updates itself.
- Don't close and reopen a new PR to "start fresh". Keep the conversation in one place.
- Once it's merged, delete your branch, sync your fork, and pick your next issue.

## Common git problems

<details>
<summary><b>"Permission denied" when I push</b></summary>

You're pushing to the club's repo instead of your fork. Check with `git remote -v`. `origin` should point to **your** username.
</details>

<details>
<summary><b>My fork is behind</b></summary>

On your fork's GitHub page click **Sync fork**, then `git pull`. Or from the terminal:

```bash
git remote add upstream https://github.com/TheBYTEClubNIE/Open-Source_BYTE_2K26.git   # once
git switch main
git pull upstream main
git push origin main
```
</details>

<details>
<summary><b>Merge conflict</b></summary>

Two people changed the same lines. Open the file, find the `<<<<<<<`, `=======` and `>>>>>>>` markers, keep the right lines, delete the markers, then:

```bash
git add <file>
git commit
git push
```

Stuck? Comment on your PR and someone will walk you through it.
</details>

<details>
<summary><b>I committed to main by mistake</b></summary>

```bash
git switch -c my-change      # your commit comes along to the new branch
git switch main
git reset --hard upstream/main
git switch my-change
```
</details>

<details>
<summary><b>Windows: every line shows as changed</b></summary>

That's line endings. Run this once, then re-clone:

```bash
git config --global core.autocrlf true
```
</details>

Still stuck? [Ask in Discussions](https://github.com/TheBYTEClubNIE/Open-Source_BYTE_2K26/discussions/new?category=q-a). Paste the exact error message and what you ran.
