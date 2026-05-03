# Domino Asset Convention

Domino tile fronts live in `public/assets/dominoes/`.

## File Naming

Tile files use the normalized low-high tile id:

```text
domino-low-high.png
```

Examples:

```text
domino-0-1.png
domino-2-6.png
domino-6-6.png
```

Do not rename files to high-low variants. The app maps tile ids to low-high filenames.

## Visual Orientation

Every non-double `domino-low-high.png` should visually show:

- Low value on top
- High value on bottom

Doubles can be visually symmetric, but keep them aligned with the same vertical asset posture.

This matters because board geometry rotates image assets to make the connected pip face the endpoint. If a file is visually reversed, the code can calculate the correct rotation while the artwork still shows the wrong pip touching.

## Generate Contact Sheet

Run:

```bash
npm run assets:contact-sheet
```

This creates:

```text
public/assets/dominoes/domino-contact-sheet.png
```

Use the sheet to visually inspect every tile and identify files where the high value appears on top.

## Rotate Incorrect Assets

After identifying exact incorrect files, rotate only those files:

```bash
npm run assets:rotate -- 0-1 2-6
```

or:

```bash
npm run assets:rotate -- domino-0-1.png domino-2-6.png
```

The script rotates listed PNGs in place and creates backups in:

```text
public/assets/dominoes/originals-backup/
```

Do not rotate `domino-back.png`.

## Metadata Warning

Do not commit Mac metadata files:

```text
.DS_Store
__MACOSX/
._filename.png
```
