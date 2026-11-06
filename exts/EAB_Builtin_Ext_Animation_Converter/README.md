# Animation Converter

Convert GIF animations for EVE display chips.

## CLI Usage

```bash
# BT82X animation
eab_tools.exe bt82x animation <gif_file> -o <output_folder> [options]

# Pre-BT82x animation  
eab_tools.exe bt81x animation <gif_file> -o <output_folder> [options]
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `-o, --output-folder` | (required) | Output directory |
| `-n, --output-name` | `output` | Asset name (no extension) |
| `-e, --astc-effort` | `fastest` | Encoding quality: thorough, exhaustive, medium, fast, fastest |
| `-f, --astc-block` | `8x8` | ASTC block footprint (4x4 to 12x12) |
| `-t, --tile-size` | `auto` | Tile size: auto, not-apply, or WxH |
| `-x, --astcenc` | auto-detect | Path to astcenc.exe |
| `-v, --address-value` | `0` | Memory address (bt82x: mult 4, Legacy: mult 64) |
| `-r, --reloc` | off | Enable relocation (bt82x only) |
| `-g, --gen-source` | none | Generate C source (bt82x: FT4222/MPSSE) |
| `-a, --memory-type` | FLASH | FLASH or RAM_G (pre-BT82X only) |
| `-g, --gen-app` | off | Generate sample app (pre-BT82X only) |

## Build

```
build.cmd
```

## Output Files

**BT82X:**
- `{name}.anim.raw` - Raw animation binary
- `{name}.anim.reloc` - Relocatable format (with --reloc)
- `{name}.anim.json` - Metadata

**Legacy:**
- `{name}.anim.flash` - FLASH binary
- `{name}.anim.ram_g` - RAM_G binary
- `{name}.json` - Metadata

## Sample inputs - the "Use Sample" button

`samples/BT82X/` and `samples/Legacy/` hold the reference inputs Input GIFs loads for the
selected chip group (a tool without a chip has one folder per group anyway, a Legacy-only tool keeps
only `samples/Legacy/`). The button sits in the drop zone's `.dz-corner` while the zone fills the
frame (left of *Show options*) and in the input card's title row right of *Add folder* otherwise; on a
tabbed extension each tab has its own. Clicking it lists the folder through the host
(`API_EAB_listExtAssets`), reads each file with `API_EAB_readExtFile`, queues the paths, sets the chip
and any mandatory option, and leaves the tab's own run button enabled.
