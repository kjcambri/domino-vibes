# Private Beta Deployment Checklist

Use this checklist when deploying Domino Vibes for private testers.

## 1. GitHub Status

- Confirm `main` contains the intended release commit.
- Confirm local worktree has no accidental changes with `git status -sb`.
- Confirm required checks passed locally before deploy.

## 2. Supabase Alignment

- Confirm `.env.local` and deployment env vars point to the same Supabase project.
- Confirm the Supabase project URL matches `VITE_SUPABASE_URL`.
- Confirm the anon key matches `VITE_SUPABASE_ANON_KEY`.
- Confirm no service role key is exposed to the frontend.

## 3. Required Environment Variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do not add secrets to GitHub commits. Configure production values in the hosting provider dashboard.

## 4. Verify Migrations

- Run `supabase migration list` if the CLI is linked.
- Or open Supabase Dashboard, then SQL Editor, and verify recent RPCs exist.
- Confirm these functions exist in the target project:
  - `start_game(uuid)`
  - `play_tile(uuid, text, text)`
  - `pass_turn(uuid)`
  - `start_next_round(uuid)`
  - `leave_finished_game(uuid)`
  - `get_game_room(uuid)`
  - `get_my_hand(uuid)`
  - `heartbeat_game_presence(uuid)`
  - `heartbeat_table_presence(uuid)`
  - `mark_stale_players(uuid)`

## 5. Supabase Auth Settings

- Confirm Email provider is enabled if testers will sign up with email.
- Confirm email confirmation setting matches the planned beta flow.
- Confirm redirect URLs include local dev and production domain.

## 6. Asset Loading

- Confirm `/assets/dominoes/domino-back.png` loads.
- Confirm a few tile assets load, for example `/assets/dominoes/domino-0-0.png` and `/assets/dominoes/domino-6-6.png`.
- Confirm `/assets/tables/domino-table.png` exists if still used by any UI.

## 7. Local Checks

Run before deploy:

```bash
npm run lint
npm run build
npm run test:run
git diff --check
```

## 8. Deploy to Vercel or Netlify

### Vercel

- Import the GitHub repo.
- Set framework to Vite if not detected automatically.
- Build command: `npm run build`
- Output directory: `dist`
- Add production env vars.
- Deploy from `main`.

### Netlify

- Import the GitHub repo.
- Build command: `npm run build`
- Publish directory: `dist`
- Add production env vars.
- Deploy from `main`.

## 9. Domain and DNS

- Point the beta domain to the hosting provider.
- Confirm HTTPS is active.
- Add the beta domain to Supabase Auth redirect URLs.
- Test login after DNS propagation.

## 10. Smoke Test After Deploy

- Load the landing page.
- Sign up or log in with a test user.
- Create or confirm profile.
- Enter lobby.
- Join table.
- Ready four test users.
- Start a game.
- Confirm each user sees exactly their own hand.
- Play a few moves.
- Refresh and rejoin.
- Finish or reset with dev cleanup if needed.

## 11. Rollback Plan

- Keep the previous known-good commit hash.
- If deploy breaks login or game flow, redeploy the previous commit from the hosting dashboard.
- If database state is bad in beta, use dev cleanup only for test data.
- Do not rollback migrations casually once testers have created data.

## 12. Private Tester Invites

- Invite a small group first.
- Tell testers this is beta test data only.
- Ask testers to report browser, device, steps, screenshot, and expected behavior.
- Remind testers there are no gambling, wagering, or real-money mechanics.
