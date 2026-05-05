# Domino Asset Standards

Domino Vibes currently uses the Sprint 22 real WebP domino asset set as the default in-app tile system. These standards keep board rotation, mobile loading, and visual polish predictable while retaining older photo/WebP, normalized WebP, PNG, and experimental procedural renderers as fallback paths.

## Current Production Tile System

Domino Vibes renders Sprint 22 real WebP domino fronts from `public/assets/dominoes-real-webp/` by default. The source set was imported from `~/Desktop/Real Domino Assets`, normalized onto a 320x640 transparent canvas, and exported as WebP at quality 90.

Default behavior:

- `USE_REAL_DOMINO_ASSETS` is `true` in `src/features/games/dominoAssets.ts`.
- `USE_PROCEDURAL_DOMINOES` is `false` in `src/features/games/dominoAssets.ts`.
- `USE_NORMALIZED_DOMINO_ASSETS` is `false` in `src/features/games/dominoAssets.ts`.
- `DominoImageTile` tries real WebP first.
- If real WebP fails, it falls back to the existing optimized WebP set.
- If normalized assets are intentionally enabled in a branch, they are tried after optimized WebP.
- If WebP loading fails, it falls back to PNG.
- If image loading fails entirely, the component still renders a fixed-size text fallback.
- Board and hand tile dimensions remain controlled by component CSS so image assets cannot render at natural source size.
- Hand/rack tiles should use the same image treatment as board tiles: fixed dimensions, image fill/crop, readable shadows, and only subtle disabled-state muting.
- Hand/rack tiles should not sit inside heavy dark overlays. The hand rack can use felt/wood styling, but the tile image itself should stay bright, sharp, and visually close to the board tiles.

Primary asset import:

```bash
npm run assets:import-real
```

This reads from:

```text
~/Desktop/Real Domino Assets
```

and writes:

```text
public/assets/dominoes-real-webp/
```

Generate the real asset contact sheet:

```bash
npm run assets:contact-sheet-real
```

Review:

```text
public/assets/dominoes-real-contact-sheet.png
```

The Sprint 22 real set contains all 28 fronts plus `domino-back`, all exported at 320x640 WebP. The imported `domino-back` is intentionally kept from the supplied source set; visual review can decide later whether a branded emerald back should replace it.

## Photo Asset Normalization Pipeline

Sprint 20 keeps photo/WebP dominoes as the default and improves the optional normalization pipeline for the current photo-style assets:

```bash
npm run assets:normalize
```

The script reads from `public/assets/dominoes/` and writes normalized WebP copies to:

```text
public/assets/dominoes-normalized-webp/
```

It does not overwrite PNG originals or the current optimized WebP set.

The normalization pipeline now:

- consistent output canvas size
- consistent vertical tile dimensions
- consistent transparent padding on a 320x640 canvas
- centered tile placement
- smaller WebP output size
- conservative transparent trim
- mild brightness/saturation/sharpening for review candidates

It cannot fully fix:

- inconsistent source lighting
- source perspective
- baked-in shadows
- mismatched source crops that already lost visual detail
- gray/white edge halos baked into source pixels
- source tilt or skew that needs manual cleanup

Normalized assets are not the default. To preview them in a branch deploy, set `USE_NORMALIZED_DOMINO_ASSETS` to `true` in `src/features/games/dominoAssets.ts`, or use `getDominoImageSrc(tileId, { preferOptimized: true, preferNormalized: true })` for one-off checks. Keep the flag off unless specifically evaluating the older normalized candidate set.

Generate a normalized contact sheet after running the normalizer:

```bash
npm run assets:contact-sheet
```

Review:

```text
public/assets/dominoes-normalized-contact-sheet.png
```

## Experimental Procedural Domino Tile System

The repo includes an experimental procedural SVG/CSS-style renderer. It builds 2.5D ivory-resin dominoes with layered CSS surfaces, crisp pip placement, beveled rims, physical shadows, selected-state glow, latest-move highlight, and hidden-back styling.

Why the procedural renderer is not default yet:

- The first visual pass is clean and consistent but still feels too SVG-like compared with the current photo/WebP assets.
- It needs more art direction before replacing production visuals.
- Tester feedback should compare readability, realism, and brand fit before switching defaults.

Why the experimental renderer remains useful:

- Photo assets carried inconsistent lighting, crop, baked-in shadows, and perspective.
- Procedural tiles scale cleanly between board and hand sizes.
- Board geometry stays easier to reason about because tile dimensions are controlled by CSS.
- Future skins can be layered onto the procedural renderer without changing tile IDs or gameplay data.

The procedural renderer keeps the same orientation convention:

- Vertical tile is the default source posture.
- `tile.left` is the visual top value.
- `tile.right` is the visual bottom value.
- File/tile IDs stay low-high, such as `domino-2-6` or `2-6`.
- Board rotations still come from saved geometry; the renderer does not change placement math.

Pip mapping uses a 3x3 half-tile grid:

- `0`: no pips
- `1`: center
- `2`: top-left + bottom-right
- `3`: top-left + center + bottom-right
- `4`: four corners
- `5`: four corners + center
- `6`: top-left, middle-left, bottom-left, top-right, middle-right, bottom-right

Visual states are component-owned:

- Normal: ivory resin body, recessed dark pips, recessed divider, beveled rim, subtle thickness, warm material texture, and soft physical shadow.
- Selected: gold glow, slight lift, stronger shadow.
- Latest move: subtle teal/gold ring.
- Start tile: subtle gold outline.
- Disabled: dimmed and lower contrast.
- Hidden/back: emerald back with gold/cream rim and subtle Domino Vibes mark.

To test procedural tiles in a branch deploy, set `USE_PROCEDURAL_DOMINOES` to `true` in `src/features/games/dominoAssets.ts`. Keep that as an experimental preview only; production should continue using the Sprint 22 real WebP asset set unless a future consistent rendered tile set is accepted.

## Naming

- Sprint 22 real WebP files live in `public/assets/dominoes-real-webp/`.
- Legacy source PNG files live in `public/assets/dominoes/`.
- Legacy optimized WebP files live in `public/assets/dominoes-webp/`.
- Optional normalized WebP files live in `public/assets/dominoes-normalized-webp/`.
- Tile fronts use low-high naming: `domino-low-high.png` or `domino-low-high.webp`.
- Examples: `domino-0-1.png`, `domino-2-6.png`, `domino-6-6.png`.
- The back tile is `domino-back.png` and `domino-back.webp`.

## Orientation

- Every non-double `domino-low-high` asset visually shows the low value on top and high value on bottom.
- In game tile data, `tile.left` is the visual top pip in the unrotated asset.
- In game tile data, `tile.right` is the visual bottom pip in the unrotated asset.
- Doubles should keep the same vertical source posture, even though the pip value is symmetric.

This convention matters because board geometry rotates assets so matching pips face the connected endpoint.

## Source Quality

- Recommended source size: 512x1024 or 320x640 vertical canvas.
- Transparent background is required.
- Use consistent canvas/crop, pip placement, lighting, and bevels.
- Avoid baked-in table shadows; CSS provides table shadows at runtime.
- Avoid perspective distortion. Assets should feel like clean top-down game pieces.
- Avoid gray halos; source assets should be cleanly masked before WebP export.
- Straighten tilted source pieces manually in Photopea, Photoshop, Figma, or a future asset-rendering pipeline.
- PNG is acceptable for source/master files.
- WebP is recommended for production delivery.

## Display Targets

- Board tile target: about 56px by 28px when horizontal, 28px by 56px when vertical.
- Hand tile target: larger and thumb-friendly, roughly 52px by 104px or larger depending on screen.
- Board rings, latest highlights, and selected states should use `box-shadow`, `outline`, or `ring` styling so they do not change the tile footprint.

## Scripts

Run the audit:

```bash
npm run assets:audit
```

Import and format the Sprint 22 real asset set:

```bash
npm run assets:import-real
```

Generate the visual contact sheet:

```bash
npm run assets:contact-sheet
```

Generate the real asset contact sheet:

```bash
npm run assets:contact-sheet-real
```

Create optimized WebP copies without overwriting PNG originals:

```bash
npm run assets:optimize
```

Create normalized same-canvas WebP copies without overwriting PNG originals:

```bash
npm run assets:normalize
```

Rotate exact incorrect source files only after visual inspection:

```bash
npm run assets:rotate -- 0-1 2-6
```

Do not commit Mac metadata files such as `.DS_Store`, `__MACOSX/`, or `._filename.png`.

## Future Production Asset Prompt Notes

For future AI-assisted art generation, request a consistent realistic 2.5D top-down cream domino set with transparent background, identical crop/canvas, no table surface, no baked-in cast shadow, black recessed pips, tactile bevel, subtle resin material, and low-on-top/high-on-bottom orientation for every non-double tile.
