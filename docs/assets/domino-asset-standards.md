# Domino Asset Standards

Domino Vibes uses local public assets for fixed domino art. These standards keep board rotation, mobile loading, and visual polish predictable.

## Naming

- Source PNG files live in `public/assets/dominoes/`.
- Optimized WebP files live in `public/assets/dominoes-webp/`.
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

- Recommended source size: 512x1024 or 256x512 vertical canvas.
- Transparent background is required.
- Use consistent canvas/crop, pip placement, lighting, and bevels.
- Avoid baked-in table shadows; CSS provides table shadows at runtime.
- Avoid perspective distortion. Assets should feel like clean top-down game pieces.
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

Generate the visual contact sheet:

```bash
npm run assets:contact-sheet
```

Create optimized WebP copies without overwriting PNG originals:

```bash
npm run assets:optimize
```

Rotate exact incorrect source files only after visual inspection:

```bash
npm run assets:rotate -- 0-1 2-6
```

Do not commit Mac metadata files such as `.DS_Store`, `__MACOSX/`, or `._filename.png`.

## Future Production Asset Prompt Notes

For future AI-assisted art generation, request a consistent top-down cream domino set with transparent background, identical crop/canvas, no table surface, no baked-in cast shadow, black pips, subtle bevel, and low-on-top/high-on-bottom orientation for every non-double tile.
