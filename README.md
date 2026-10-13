<p align="center">
  <img src="assets/byte-logo.webp" alt="The BYTE Club logo" width="120" />
</p>

<h1 align="center">Open Source BYTE 2K26</h1>

<p align="center">
  <b>Small commits, big journeys.</b><br />
  A beginner-friendly open source program by The BYTE Club, NIE.<br />
  <a href="https://thebyteclubnie.github.io/Open-Source_BYTE_2K26/">Website</a> ·
  <a href="https://thebyteclubnie.github.io/Open-Source_BYTE_2K26/#first-pr">Make your first PR</a> ·
  <a href="CONTRIBUTING.md">Contributing guide</a> ·
  <a href="https://thebyteclubnie.github.io/Open-Source_BYTE_2K26/#ask">Ask a question</a>
</p>

---

This repo **is** the program. The website you're helping to build is where every student starts:
put your name on it, then level up one pull request at a time until you're contributing to real projects out there.

## Your first PR in 5 minutes

1. **Fork** this repo (top right button).
2. Add one file, **`contributors/<your-github-username>.json`**:

   ```json
   {
     "name": "Your Name",
     "github": "your-github-username",
     "year": 2,
     "note": "One line about you."
   }
   ```

3. **Commit** it and open a **pull request**.
4. A bot checks your file. If it's right, it merges it for you. If not, it tells you exactly what to fix.
5. Your polaroid shows up on the [website](https://thebyteclubnie.github.io/Open-Source_BYTE_2K26/#contributors) a few minutes later. 🎉

Never used git? The [first PR guide](https://thebyteclubnie.github.io/Open-Source_BYTE_2K26/#first-pr) fills in every command for you, and has a no-install browser route too.

## The six levels

| Level | You'll do | You'll learn |
|---|---|---|
| **0 · Set up** | GitHub account, profile README, say hi in the *Introduce yourself* issue | GitHub basics, issues |
| **1 · First PR** | Add your `contributors/` file | Fork, clone, branch, commit, push, PR |
| **2 · Docs** | Fix or add docs, FAQ entries, cheat-sheet cards | Claiming issues, linking PRs |
| **3 · Small code** | Fix bugs, improve accessibility, add terminal commands | Code review, syncing forks, merge conflicts |
| **4 · Feature** | Propose and build a new section | Proposals, design discussions |
| **5 · Graduate** | Get a PR merged in a real project outside this repo | The real world |

Level 2–4 issues are labelled `level-2`, `level-3` and `level-4`. Comment **`/assign`** on one to claim it.
Full rules, local setup and tips are in **[CONTRIBUTING.md](CONTRIBUTING.md)**.

## What's in here

```
index.html          the whole landing page
css/style.css       all styles (colours are variables at the top)
js/main.js          everything interactive
blog/               blog posts, one HTML page each
contributors/       one JSON file per student  ← Level 1 happens here
blogs.json          list of blog posts
scripts/            data builder + tests for the bots
.github/workflows/  the bots: Level 1 checks, /assign, deploys
```

No frameworks and no build step: plain HTML, CSS and JavaScript, so anyone can read every line.

## Run it locally

```bash
python -m http.server 5500
```

Then open http://localhost:5500. (Opening `index.html` directly won't load the data files.)

## Community

- Be kind. Read the [Code of Conduct](CODE_OF_CONDUCT.md).
- Questions go to [Ask Us](https://thebyteclubnie.github.io/Open-Source_BYTE_2K26/#ask) on the website (publicly on GitHub, or privately by email), and no question is too basic.
- Maintainers: see [MAINTAINERS.md](MAINTAINERS.md) for setup and review guidelines.
- Follow the club: [Instagram](https://www.instagram.com/thebyteclubnie/) · [LinkedIn](https://www.linkedin.com/company/thebyteclubnie) · [Website](https://byteclubnie.vercel.app/) · [thebyteclub@nie.ac.in](mailto:thebyteclub@nie.ac.in)

Licensed under [MIT](LICENSE). Built by students of NIE, for students of NIE ♡
