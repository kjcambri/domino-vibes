# Domino Engine and Game Modes Implementation Plan

This plan starts after the current Sprint 22 real-WebP asset and private-beta gameplay baseline. The order protects the existing Cutthroat 4 experience first, then expands into popular Caribbean, Latino, competitive, and family domino modes.

## Ordering Principles

- Preserve the current playable MVP before adding new rules.
- Build shared engine foundations before adding modes that need different boards or scoring.
- Prioritize modes that match Domino Vibes' Caribbean/Latino identity.
- Add complex casual modes only after the line-board engine is proven.
- Put engagement systems after the event log and mode model can support them cleanly.

## Sprint 23: Engine Foundation and Rule-Set Architecture

Goal: Convert the current single-mode engine into a deterministic, mode-driven rules engine without changing player-facing Cutthroat 4 behavior.

Scope:

- Introduce a shared `RuleSet` model for tile set, player count, teams, deal rules, start rules, legal moves, pass/draw behavior, scoring, round-end rules, and match-end rules.
- Move common line-board behavior out of `cutthroat4.ts` into reusable engine modules.
- Keep the existing `cutthroat_4` mode working as the first rule-set implementation.
- Add event concepts for `round_started`, `tile_played`, `player_passed`, `round_finished`, and `score_awarded`.
- Add replay tests that rebuild state from events.

Primary files:

- `src/game-engine/types.ts`
- `src/game-engine/engine.ts`
- `src/game-engine/cutthroat4.ts`
- `src/game-engine/board.ts`
- `src/game-engine/validation.ts`
- `src/game-engine/scoring.ts`
- `src/game-engine/__tests__/`

Acceptance checks:

- Current Cutthroat 4 tests still pass.
- Legal move behavior matches the current app.
- A recorded event list can reconstruct the final round state.
- No new mode is exposed in the UI yet.

## Sprint 24: Server Authority Alignment

Goal: Make the backend follow the same rules as the shared engine so future modes do not require rule duplication across TypeScript and SQL.

Scope:

- Decide whether Supabase RPCs stay as SQL implementations temporarily or move gameplay commands into a shared server runner.
- Keep Postgres authoritative for persistence, RLS, hidden hands, and move history.
- Add parity fixtures that compare TypeScript engine outcomes with backend RPC outcomes for play, pass, blocked round, and round finish.
- Add mode identifiers to persisted game state in a way that can support future modes.

Primary files:

- `supabase/migrations/*gameplay*.sql`
- `src/features/games/gameService.ts`
- `src/features/games/gameplayRules.ts`
- `src/game-engine/__tests__/`
- `docs/security/supabase-rls-checklist.md`

Acceptance checks:

- A player still cannot play out of turn, play an unowned tile, pass with a legal move, or see hidden hands.
- Existing tables and games continue to work after migrations.
- Backend and TypeScript fixtures agree for the existing mode.

## Sprint 25: Jamaican Cut Throat Rules Polish

Goal: Make the flagship mode more authentic before branching into teams and new regions.

Scope:

- Rename or alias the current mode from internal `cutthroat_4` toward player-facing `Jamaican Cut Throat`.
- Add configurable match targets such as Straight-to-Six and Six-Love, while keeping the current target as the default if needed.
- Add support for first-round double-six pose rules and subsequent-round winner pose rules where compatible with the product flow.
- Add blocked-game tie handling rules to the rule-set model, even if the first implementation keeps the current tie-break behavior behind a default option.

Primary files:

- `src/game-engine/modes/`
- `src/components/lobby/GameModeLabel.tsx`
- `src/components/table/StartGamePanel.tsx`
- `src/components/game/RoundFinishedPanel.tsx`
- `docs/qa/private-beta-checklist.md`

Acceptance checks:

- Existing beta players can still start and finish a four-player Cut Throat game.
- UI labels match the selected rules.
- Round winner, next-round starter, and match-end state are clear.

## Sprint 26: Jamaican Partners / Caribbean Partners

Goal: Add the first new high-value mode with the smallest engine jump: four players, two teams, opposite-seat partners, double-six line board, pass-only play.

Scope:

- Add team assignment based on seats across the table.
- Add team scoring and team match winner state.
- Add partner-aware table/game UI labels.
- Add blocked-round scoring where the lowest-count player's team wins.
- Keep partner signaling out of product mechanics; chat remains social, not a legal gameplay channel.

Primary files:

- `src/game-engine/modes/jamaicanPartners.ts`
- `src/features/lobby/types.ts`
- `src/features/tables/types.ts`
- `src/features/games/types.ts`
- `src/components/game/GamePlayerList.tsx`
- `src/components/table/TableSeatGrid.tsx`

Acceptance checks:

- Partners sit opposite each other.
- Team scores update together.
- A blocked round awards the correct team.
- The UI never exposes a partner's hidden hand.

## Sprint 27: Cuban Double-Nine Partners

Goal: Reach the core Cuban/Latino domino audience with a double-nine, four-player partners mode.

Scope:

- Add double-nine tile generation, 55-tile conservation tests, and 10-tile hands.
- Add 15 sleeping tiles that are not drawn during the round.
- Add counterclockwise turn ordering as a rule-set option.
- Add Cuban match targets such as 100, 150, and 200.
- Add Cuban mode labels and glossary-friendly UI copy where it improves clarity.

Primary files:

- `src/game-engine/tiles.ts`
- `src/game-engine/deal.ts`
- `src/game-engine/modes/cubanPartners.ts`
- `src/components/lobby/GameModeLabel.tsx`
- `src/components/game/OpponentHandCounts.tsx`

Acceptance checks:

- Each round uses exactly 55 double-nine tiles.
- Four players receive 10 tiles each.
- Fifteen sleeping tiles remain unavailable.
- Team scoring and blocked-round scoring are correct.

## Sprint 28: All Fives / Muggins

Goal: Add the first strong competitive scoring variant for US, UK, and European players.

Scope:

- Add in-round scoring when open ends total a multiple of five.
- Add boneyard draw behavior.
- Add score events so the move log shows when points were earned.
- Add mode-specific score UI that can show points earned during a turn.
- Add match targets such as 200 or 250 based on player count and table settings.

Primary files:

- `src/game-engine/modes/allFives.ts`
- `src/game-engine/scoring.ts`
- `src/components/game/TurnActionPanel.tsx`
- `src/components/game/RoundFinishedPanel.tsx`
- `src/features/games/gameOutcome.ts`

Acceptance checks:

- Open-end totals score immediately on valid multiples of five.
- Doubles at the end count correctly for scoring.
- Draw/pass behavior follows the selected All Fives variant.
- Round-end scoring is tested separately from in-round scoring.

## Sprint 29: Draw and Block Dominoes Tutorial Modes

Goal: Add simple global modes that help new players learn the engine before entering cultural or competitive variants.

Scope:

- Add Block Dominoes as a simple line-board mode.
- Add Draw Dominoes as a simple boneyard mode.
- Add beginner-friendly table filters or labels.
- Reuse as much of the All Fives boneyard work as possible.

Primary files:

- `src/game-engine/modes/block.ts`
- `src/game-engine/modes/draw.ts`
- `src/components/lobby/LobbyTableCard.tsx`
- `src/components/table/StartGamePanel.tsx`

Acceptance checks:

- Block mode never draws from the boneyard.
- Draw mode draws according to the configured reserve rule.
- Both modes finish correctly by going out or blocking.

## Sprint 30: Mexican Train Engine

Goal: Add the first train-topology mode after line-board modes are stable.

Scope:

- Add train board topology with personal trains, public markers, and Mexican train.
- Add double-twelve tile support.
- Add first-turn train-building rules.
- Add boneyard draw and train marking when a player cannot play.
- Add required double satisfaction.
- Build a dedicated board renderer for train layouts instead of forcing the current line renderer to stretch.

Primary files:

- `src/game-engine/boards/trainBoard.ts`
- `src/game-engine/modes/mexicanTrain.ts`
- `src/components/game/BoardStatePreview.tsx`
- `src/features/games/boardLayout.ts`
- `src/components/game/MiniBoardPreview.tsx`

Acceptance checks:

- Personal trains and public trains are distinct in engine state.
- The Mexican train can be started and played according to rules.
- Unsatisfied doubles force legal play correctly.
- Mobile layout remains usable with multiple trains.

## Sprint 31: Chicken Foot Engine

Goal: Add a popular party/family mode that uses a tree-style board and forced double completion.

Scope:

- Add tree board topology.
- Add opening cross behavior from the starting double.
- Add chicken-foot forced plays after doubles.
- Add chicken yard draw behavior.
- Add round sequencing from highest double down to double blank for supported tile sets.

Primary files:

- `src/game-engine/boards/treeBoard.ts`
- `src/game-engine/modes/chickenFoot.ts`
- `src/features/games/boardLayout.ts`
- `src/components/game/BoardStatePreview.tsx`

Acceptance checks:

- Opening double must be satisfied before normal play continues.
- Doubles force the required follow-up plays.
- The board renderer can show arms and chicken-foot branches clearly.

## Sprint 32: Spectators, Replays, and Match History

Goal: Use the event log to make matches more social and reviewable.

Scope:

- Add read-only spectator access for allowed public/private table rules.
- Add replay reconstruction from stored events.
- Add match history pages for completed games.
- Add post-round recap using event and scoring data.

Primary files:

- `src/features/games/`
- `src/pages/GameRoomPage.tsx`
- `src/pages/ProfilePage.tsx`
- `supabase/migrations/`

Acceptance checks:

- Spectators never receive hidden hands.
- A replay can step through tile plays in order.
- Completed matches show mode, players/teams, winner, score, and date.

## Sprint 33: Bots and AFK Takeover

Goal: Improve table completion and reduce abandoned-game frustration.

Scope:

- Add bot players that use the same engine legal-move API as humans.
- Add basic bot difficulty levels: legal-random, pip-dump, suit-aware.
- Add AFK timeout takeover for private beta testing only at first.
- Add clear UI state when a bot controls a seat.

Primary files:

- `src/game-engine/bots/`
- `src/features/games/useGamePresence.ts`
- `supabase/migrations/*presence*.sql`
- `src/components/game/GamePlayerList.tsx`

Acceptance checks:

- Bots cannot make illegal moves.
- AFK takeover never exposes the absent player's hidden hand to other clients.
- Human players can distinguish bot-controlled seats.

## Sprint 34: Ranked Tables and Mode-Specific Progression

Goal: Add competition after the rules are stable enough to trust.

Scope:

- Add ranked tables per mode.
- Track rating separately by mode or mode family.
- Add basic season stats: games played, wins, streaks, blocked wins, points scored.
- Keep casual tables available.

Primary files:

- `supabase/migrations/`
- `src/features/profiles/`
- `src/features/lobby/`
- `src/pages/ProfilePage.tsx`

Acceptance checks:

- Ranking cannot be affected by unfinished or abandoned games.
- Ratings are not shared across modes with very different skill profiles.
- Profile stats match completed-game records.

## Sprint 35: Tournaments and Weekly Challenges

Goal: Add structured engagement once ranked/casual play is reliable.

Scope:

- Add weekly non-prize challenges using product-safe language.
- Add bracket or table-rotation tournament support.
- Add community tournament pages and table assignment flows.
- Avoid gambling, wagering, buy-in, prize pool, and casino framing.

Primary files:

- `src/features/tournaments/`
- `src/pages/LobbyPage.tsx`
- `src/pages/ProfilePage.tsx`
- `docs/design/stitch-ui-direction.md`

Acceptance checks:

- Tournament copy follows the existing no-gambling guardrails.
- Players can join, see assignments, play, and receive standings.
- Failed or abandoned tournament games have an admin-safe resolution path.

## Sprint 36: Moderation, Safety, and Social Depth

Goal: Make the social layer safer before broader public growth.

Scope:

- Add chat reporting, user blocking, and moderation queues.
- Add table reactions and safe taunts.
- Add private table invite improvements.
- Add direct messages only after blocking/reporting is in place.

Primary files:

- `src/features/chat/`
- `src/components/chat/`
- `supabase/migrations/*chat*.sql`
- `docs/security/supabase-rls-checklist.md`

Acceptance checks:

- Reports include enough context for review.
- Blocking prevents direct social contact without breaking active gameplay state.
- Reactions cannot reveal hidden-hand or partner strategy information.

## Sprint 37: Production Analytics, Crash Reporting, and Native Packaging

Goal: Prepare for a larger launch with observability and mobile distribution.

Scope:

- Add product analytics for funnel, mode popularity, abandoned games, and rule errors.
- Add client error reporting and server command failure tracking.
- Add native packaging evaluation after mobile web UX is stable.
- Add performance monitoring for realtime game rooms.

Primary files:

- `src/lib/logger.ts`
- `src/lib/deploymentDiagnostics.ts`
- `docs/deployment/`
- `docs/qa/`

Acceptance checks:

- Analytics do not collect hidden hands or sensitive gameplay secrets.
- Rule errors can be traced by mode and command type.
- Mobile packaging does not regress the browser app.

## Mode Implementation Priority

1. Jamaican Cut Throat polish
2. Jamaican / Caribbean Partners
3. Cuban Double-Nine Partners
4. All Fives / Muggins
5. Block Dominoes
6. Draw Dominoes
7. Mexican Train
8. Chicken Foot

## Research Sources

- Pagat domino game index and classifications: https://www.pagat.com/domino/
- Jamaican Cut Throat and Partners rules: https://www.dominoj.com/rules
- Cuban Dominoes summary: https://www.dominorules.com/cuban-dominoes
- Cuban double-nine cultural and rules context: https://aromadecuba.com/en/blog/2026-02-12-domino-cubano-juego-nacional/
- All Fives / Muggins rules: https://www.pagat.com/domino/line/muggins.html
- Block Dominoes rules: https://www.pagat.com/domino/line/block.html
- Draw Dominoes rules: https://www.pagat.com/domino/line/draw.html
- Mexican Train rules: https://www.pagat.com/domino/star/mextrain.html
- Chicken Foot rules: https://www.pagat.com/domino/tree/chickenfoot.html
