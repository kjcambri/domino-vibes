# Netlify Deployment

Domino Vibes deploys as a Vite React single-page app on Netlify.

Reference docs:

- Netlify redirects and rewrites: https://docs.netlify.com/routing/redirects/
- Netlify custom domains: https://docs.netlify.com/manage/domains/get-started-with-domains/
- Netlify HTTPS/SSL: https://docs.netlify.com/domains-https/https-ssl/

## Netlify Site Setup

1. Open Netlify and create a new site from Git.
2. Connect GitHub repo `kjcambri/domino-vibes`.
3. Use branch `main`.
4. Set build command to `npm run build`.
5. Set publish directory to `dist`.
6. Confirm Netlify detects `netlify.toml` at the repo root.
7. Deploy the site.

The repo includes `netlify.toml` with:

- build command: `npm run build`
- publish directory: `dist`
- SPA fallback redirect from `/*` to `/index.html`
- basic security headers

## Required Environment Variables

Add these in Netlify site configuration under Environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Do not commit `.env.local`. The deployed Netlify values must point to the same Supabase project used for the intended beta environment.

If these values are missing, the app shows a safe deployment configuration screen instead of attempting to run against placeholder Supabase credentials.

## Supabase Project Alignment

1. Compare Netlify `VITE_SUPABASE_URL` with local `.env.local`.
2. Confirm the Supabase project reference in the URL is the expected beta project.
3. In Supabase, open SQL Editor or use the Supabase CLI to confirm all migrations have been applied.
4. If migrations are missing, apply them to the same project used by Netlify.
5. Do not mix a local `.env.local` project with a different Netlify production project unless that is intentional.

Useful checks:

```bash
npm run deploy:check
```

If using Supabase CLI:

```bash
supabase db push
```

Only run CLI commands against the intended Supabase project.

## Auth Checks

In Supabase Auth settings:

- Confirm email/password signups are enabled if testers should self-register.
- Confirm email confirmation behavior matches the beta plan.
- Confirm allowed redirect URLs include the Netlify deploy URL and `https://dominovibes.com`.
- Confirm Site URL is set to the canonical production domain once the domain is live.

## Realtime and Chat Checks

After deploy:

- Open two browser sessions with separate users.
- Confirm game room polling/realtime updates current turn and board state.
- Confirm lobby chat messages appear in another session.
- Confirm table chat is limited to seated users.
- Confirm game chat is limited to game participants.
- Confirm no hidden hands are exposed through chat or game room data.

If realtime appears delayed, remember the app has polling fallbacks for game state and chat.

## Asset Checks

Netlify publishes Vite `public` assets into `dist`.

Verify these URLs after deployment:

```text
/assets/dominoes-webp/domino-6-6.webp
/assets/dominoes/domino-6-6.png
/assets/dominoes/domino-back.png
```

The renderer tries optimized WebP first and falls back to PNG/text if needed.

## Optional Netlify CLI Flow

GitHub integration is preferred for beta. If CLI deploy is needed:

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy
netlify deploy --prod
```

Use the CLI only after confirming it is linked to the correct Netlify site.

## Pre-Deploy Check

Run:

```bash
npm run deploy:check
git diff --check
```

Then smoke test the deployed URL and `dominovibes.com`.
