# Domino Vibes Known Issues and Guardrails

This document tracks private beta guardrails and known MVP limitations.

## Known Issues

- The Vite production build may warn that a JavaScript chunk is larger than 500 kB.
- The UI is a polished MVP web experience, not the final production mobile app UI.
- Current domino assets are acceptable for beta, but should be replaced with production-quality, consistently authored assets later.
- No bots or AFK takeover exist yet.
- No chat exists yet.
- No tournaments or ranked play exist yet.
- No spectator or replay system exists yet.
- Manual dev SQL cleanup may still be needed for old test data.
- Supabase migrations must be applied to the same project used by `.env.local`.
- Old games created before later board-geometry migrations may not be good visual test cases.

## Private Beta Guardrails

- Private beta should use test accounts.
- Do not use real-money, gambling, wagering, or prize mechanics.
- Do not invite testers until hidden-hand security has been verified against the target Supabase project.
- Do not judge board geometry using old pre-geometry games.
- Do not manually edit production game state except through approved migration or admin cleanup scripts.

## Roadmap Items Not Included Yet

- Bots and disconnected-player takeover.
- Chat and table reactions.
- Ranked tables.
- Tournaments.
- Spectators.
- Match history and replay.
- Production analytics and crash reporting.
- Native mobile packaging.
