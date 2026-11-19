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
