# Domino Vibes Known Issues and Guardrails

This document tracks private beta guardrails and known MVP limitations.

## Known Issues

- The Vite production build may warn that a JavaScript chunk is larger than 500 kB.
- The UI is a polished MVP web experience, not the final production mobile app UI.
- Stitch-inspired Island Elite UI polish is being implemented gradually and may continue evolving from tester feedback.
- Sprint 22 real WebP dominoes are the current primary tile renderer.
- The procedural SVG/CSS domino renderer exists in the codebase, but it is experimental and not the default production visual system.
- Legacy optimized WebP/photo-style dominoes remain as fallback assets.
- Current real domino assets are beta production assets, but the future goal can still be an even more consistent realistic 2.5D rendered tile set.
- The Sprint 22 real set is improved and canvas-normalized, but testers should still review source-level lighting, crop, edge halos, and perspective.
- The normalized asset pipeline helps align canvas size, padding, dimensions, and output size, but it does not replace a production-rendered asset set.
- Gray/white halos and slightly tilted dominoes are source-art issues; import/normalization can reduce inconsistent padding but should be visually reviewed before release.
- The normalized WebP candidate set is generated for review only. Production uses the Sprint 22 real WebP set unless `USE_NORMALIZED_DOMINO_ASSETS` is intentionally enabled in a branch.
- Domino asset loading falls back from real WebP to legacy optimized WebP, optional normalized WebP, PNG, and then text, so broken files should be caught during asset QA rather than blocking gameplay.
- Homepage live match preview is read-only and falls back to the static featured table card when no active game is available or the preview RPC fails.
- No bots or AFK takeover exist yet.
- Chat is MVP text-only chat with basic room scoping and guardrails.
- No advanced moderation, reports, blocks, or admin dashboard exist yet.
- No direct messages or media uploads exist yet.
- No tournaments or ranked play exist yet.
- Future mode cards, if visible, are non-functional previews only.
- No spectator or replay system exists yet.
- Manual dev SQL cleanup may still be needed for old test data.
- Supabase migrations must be applied to the same project used by `.env.local`.
- Old games created before later board-geometry migrations may not be good visual test cases.
- Board and hand feel are polished for browser beta, but final production mobile animation/sound design is still future work.

## Private Beta Guardrails

- Private beta should use test accounts.
- Do not use real-money, gambling, wagering, or prize mechanics.
- Do not invite testers until hidden-hand security has been verified against the target Supabase project.
- Do not judge board geometry using old pre-geometry games.
- Do not manually edit production game state except through approved migration or admin cleanup scripts.

## Roadmap Items Not Included Yet

- Bots and disconnected-player takeover.
- Chat moderation, reports, blocks, and table reactions.
- Ranked tables.
- Tournaments.
- Spectators.
- Match history and replay.
- Production analytics and crash reporting.
- Native mobile packaging.
