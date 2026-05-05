# Domino Vibes

Mobile-first Caribbean/Latino multiplayer dominoes web app foundation.

## Sprint 1

This sprint sets up the production-minded app foundation only:

- React + Vite + TypeScript
- Tailwind CSS
- React Router
- Supabase JS client setup
- TanStack React Query provider
- Zustand app store placeholder
- Framer Motion
- lucide-react
- Shared mobile shell and UI primitives
- Placeholder routes for auth, profiles, lobby, tables, games, and 404

No gameplay, authentication implementation, database schema, or migrations are included yet.

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The app warns when Supabase variables are missing during Sprint 1 instead of crashing.

## Supabase Auth Email

Domino Vibes keeps Supabase email confirmation enabled. The default Supabase Auth
email sender is suitable for quick local checks, but it is limited to 2 auth
emails per hour. For production or multi-user testing, configure custom SMTP in
Supabase so signup confirmations and resend-confirmation emails are delivered
reliably.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## Restore Point

Sprint 1 is intended to be a clean baseline for later auth, lobby, and gameplay sprints.
