#!/usr/bin/env bash
# Creates (or updates) every label the bots and the website rely on.
# Needs the GitHub CLI, logged in as a maintainer:  gh auth login
# Run from the repo root:  bash scripts/setup-labels.sh
set -euo pipefail
REPO="${REPO:-byteopensource/byteopensource.github.io}"

label() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force; }

# Levels: the leaderboard scores merged PRs by these, and /assign only works on level-2/3/4 issues.
label "level-0"          "c5def5" "Getting set up: account, profile, say hi"
label "level-1"          "ffe03d" "First PR: your contributors file (merged by the bot)"
label "level-2"          "b8def2" "Docs and content. Claim with /assign"
label "level-3"          "f79a3e" "Small code changes. Claim with /assign"
label "level-4"          "e3341e" "Features. Proposal first, then claim with /assign"

# Workflow
label "good first issue" "7057ff" "Great for newcomers"
label "proposal"         "5319e7" "A Level 4 idea waiting for a maintainer's thumbs up"
label "needs-review"     "0e8a16" "A maintainer needs to look at this"
label "bug"              "d73a4a" "Something is broken"
label "invalid"          "e4e669" "Low-effort or spam. Closed."
label "graduated"        "8ae9dd" "Level 5: a merged PR in an outside project"

echo "Labels ready on $REPO"
