# Raw Viewer sample inputs

One `.raw` per chip generation × bitmap format, produced from `ducati.png` by
`img_cvt`. The Raw Viewer's **Use Sample** button loads the entry matching the
chip and format currently picked in the UI.

## Naming

```
ducati_<CHIP>_<FORMAT>_<W>x<H>.raw
```

`<CHIP>` is one of `FT80X`, `FT81X`, `BT88X`, `BT81X`, `BT82X`.

Formats that need companion layers ship them alongside:

| Format | Files |
| --- | --- |
| `PALETTED`, `PALETTED565`, `PALETTED4444`, `PALETTED8`, `PALETTEDARGB8` | `.index.raw` + `.lut.raw` |
| `DXT1_L1_RGB565`, `DXT1_L2_RGB565` | `_DXT1_L1.raw` / `_DXT1_L2.raw` + `_DXT1_RGB565.raw` |
| `DXT1_L1_PALETTED565`, `DXT1_L2_PALETTED565` | `_DXT1_L1.raw` / `_DXT1_L2.raw` + `_DXT1_PAL565.index.raw` + `_DXT1_PAL565.lut.raw` |

The `.json` next to each file is the `img_cvt` metadata for that conversion.

## manifest.csv

`File,Image,Chip,Format,Width,Height,Suffix,Bytes` — one row per file on disk,
including companions. `ui.js`'s `RAW_SAMPLES` catalog is derived from it; if you
add or regenerate samples, update that table to match.

## Notes

- ASTC tiling differs between BT82x (linear blocks) and pre-BT82x (tiled
  blocks), so the same `ASTC_*` format exists once per generation and must be
  viewed with the matching `raw_viewer` command.
- ASTC and YCBCR samples are not 288×163 — the encoder pads to the block size,
  so read the width/height from `manifest.csv` (or the `.json`) rather than
  assuming.

