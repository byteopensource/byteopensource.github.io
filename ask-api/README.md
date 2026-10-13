# Ask Us email function

One small Vercel function that lets students send an *Ask Us* question privately by email.
The website stays on GitHub Pages. Only this folder is deployed to Vercel, because the
Resend API key must never be in the website's code, where anyone can read it.

```
Website (GitHub Pages)  →  this function (Vercel, holds the key)  →  Resend  →  thebyteclub@nie.ac.in
```

It checks the question, blocks other websites from using it, catches spam bots with a hidden
field, limits each person to 5 questions in 10 minutes, and sets Reply-To to the student's
email, so replying from your inbox answers them directly.

## Set it up (about 10 minutes, once)

1. **Resend: verify a domain** (Resend dashboard → Domains). You can only send *from* an address
   on a verified domain. To test before that, use `onboarding@resend.dev` as the sender, but Resend
   will then only deliver to the email you signed up to Resend with.
2. **Vercel: import this repo.** Add New → Project → pick `TheBYTEClubNIE/Open-Source_BYTE_2K26`.
   - **Root Directory: `ask-api`** (important: this keeps Vercel away from the website files)
   - Framework preset: **Other**. No build command.
3. **Vercel: add environment variables** (Project → Settings → Environment Variables):

   | Name | Value |
   |---|---|
   | `RESEND_API_KEY` | your Resend key (paste it here only, never in code or chat) |
   | `ASK_FROM` | e.g. `BYTE Ask Us <ask@your-verified-domain>` |
   | `ASK_TO` | optional, defaults to `thebyteclub@nie.ac.in` |
   | `ALLOWED_ORIGINS` | optional, defaults to `https://thebyteclubnie.github.io` |

   Then redeploy (Deployments → ⋯ → Redeploy) so the function sees them.
4. **Copy the function's address.** It's your Vercel project URL plus `/api/ask`,
   e.g. `https://byte-ask-api.vercel.app/api/ask`.
5. **Turn it on in the website.** In `index.html`, find the Ask Us form and fill in the address:

   ```html
   <form class="details__form ask-form" data-email-endpoint="https://byte-ask-api.vercel.app/api/ask">
   ```

   Commit and push. The *On GitHub / By email* switch appears on the form. Send yourself a test question.

## If something goes wrong

- **Students see "Email isn't set up yet"**: `RESEND_API_KEY` or `ASK_FROM` is missing in Vercel, or you didn't redeploy.
- **"Couldn't send right now"**: Resend refused it. Vercel → Project → Logs shows the exact reason (usually an unverified sender domain).
- **Nothing happens / a CORS error in the browser console**: the site's address isn't in `ALLOWED_ORIGINS`.
- **The key leaked?** Delete it in Resend, create a new one, update it in Vercel, redeploy.

## Tests

```bash
node ask-api/test.mjs
```

They run automatically on pull requests that change this folder.
