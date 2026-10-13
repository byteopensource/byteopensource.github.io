# Maintainers

## Who to contact

| Name | GitHub | Role |
|---|---|---|
| Tanishq Dhawan | [@CALL-ME-TATA](https://github.com/CALL-ME-TATA) | Maintainer |
| Ritesh Kumar Karn | [@riteshkrkarn](https://github.com/riteshkrkarn) | Maintainer |

Students can reach any of these people about anything, including Code of Conduct reports.

---

## One-time setup

Do these in order, on GitHub, as a repo admin.

1. **Publish the site.** Settings → Pages → *Build and deployment* → Source: **GitHub Actions**.
   The `Deploy site` workflow publishes on every push to `main` and every 30 minutes.
   The site lives at `https://thebyteclubnie.github.io/Open-Source_BYTE_2K26/`. If that ever changes, update the URLs in `index.html` (`og:` tags), `404.html`, and `.github/ISSUE_TEMPLATE/config.yml`.
2. **Turn on Discussions.** Settings → General → Features → **Discussions**. Keep the default **Q&A** category: the website's *Ask Us* form opens it by its address (`q-a`).
3. **Create the labels:** `bash scripts/setup-labels.sh` (needs the [GitHub CLI](https://cli.github.com), `gh auth login` first).
4. **Create the starter issues:** `node scripts/create-starter-issues.mjs` shows the list. Add `--create` to open them. Then **pin** the *Introduce yourself* issue.
5. **Protect `main`.** Settings → Rules → Rulesets → New branch ruleset targeting `main`:
   - Block force pushes, restrict deletions
   - Require a pull request before merging
   - **Required approvals: 0.** The Level 1 bot merges with the workflow token, and an approval rule would block it.
     If you'd rather require approvals, that's fine too: valid Level 1 PRs then get the `needs-review` label and a maintainer clicks merge.
6. **Keep yourselves off the leaderboard.** In `.github/workflows/deploy.yml`, set `LEADERBOARD_EXCLUDE` to your logins, e.g. `"alice,bob"`.
7. **Make it findable.** Settings → General → *Social preview*: upload `assets/og.png`. Add topics: `open-source`, `beginner-friendly`, `first-timers-only`, `good-first-issue`.
8. **If a bot fails with "Resource not accessible by integration":** Settings → Actions → General → Workflow permissions → **Read and write permissions**.
9. **Optional: private questions by email.** Deploy the `ask-api/` folder to Vercel and switch it on in the Ask Us form. Step-by-step in [ask-api/README.md](ask-api/README.md). The Resend key goes in Vercel only.

## The bots

| Workflow | What it does |
|---|---|
| `pull-requests.yml` | Copies the level label from the linked issue onto each PR (the leaderboard scores by it). Checks Level 1 PRs and merges the valid ones, then redeploys the site. |
| `claims.yml` | Handles `/assign` and `/unassign`. One open issue per student. Frees claims with no PR after 48 hours (level-2), 3 days (level-3) or 7 days (level-4). Change these in `CLAIM_HOURS`. |
| `deploy.yml` | Builds `contributors.json` and `stats.json` and publishes the site. Nothing is committed back. |
| `checks.yml` | Runs `scripts/test-workflows.mjs` on PRs that touch the bots. |

`pull-requests.yml` runs with write access on PRs from forks, so it **must never check out or run PR code**. Keep it API-only. If you change it, update `scripts/test-workflows.mjs` too.

## Running the program

- **Keep the issue queue full.** This is the single most important job. Aim for 10+ open, unclaimed `level-2` and `level-3` issues at all times. When it drops below that, write more.
- **Reply to every PR within 48 hours.** The website promises it. Split the queue between reviewers by day of the week.
- **Turn bug reports into issues.** Label them with a level so someone can claim them.
- **Level 4 proposals:** reply on the issue. When the plan is good, remove `proposal`, add `level-4`, and say "go ahead, comment /assign".
- **Graduations (Level 5):** a student edits their own contributor file to add `graduated`. The bot labels it `needs-review`. Open the link, check the PR is theirs and merged in an outside project, then merge and add the `graduated` label.
- **Watch the dashboard:** `stats.json` on the live site shows open issues per level and the leaderboard.

## Reviewing pull requests

- **Start with something kind and specific,** e.g. "Nice, the new FAQ answer is really clear."
- **Ask, don't order:** "Could we move this into the existing function?" works better than "Move this."
- **Say why.** Link to CONTRIBUTING.md or the line of code that explains it.
- **Check it locally** for anything visual: phone width, laptop width and BYTE mode.
- **Squash and merge,** and make sure the PR has a `level-N` label. It's added automatically when the PR says `Closes #<issue>`, but add it yourself if it's missing.
- **Low-effort or spam PRs:** close with the `invalid` label and one polite sentence. Don't argue.
- **Never merge your own feature PR** without a second maintainer's review.

## Writing a good issue

Every starter issue in `scripts/create-starter-issues.mjs` follows the same shape. Copy it:

1. **What:** one or two sentences, from the student's point of view.
2. **Where:** the exact file and section.
3. **Done when:** a short checklist the reviewer will check.
4. **Hints:** a nudge, not the answer.

Label it `level-2`, `level-3` or `level-4` (plus `good first issue` for the easiest ones).
