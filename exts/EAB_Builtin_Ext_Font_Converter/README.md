# Font Converter

Convert OpenType / TrueType fonts into EVE-compatible glyph and metrics data, read
font information, and encode text. Ported from the reference `fnt_cvt.py`, `font_info.py`
and `font_encode.py` into a native Rust DLL (`font_cvt.dll`).

## CLI Usage

```bash
# BT82X font conversion
eab_tools.exe bt82x font -f <struct> -i <font.ttf> -s <size> -D <dpi> -r <range> -o <out> [options]

# Read font information (JSON or text)
eab_tools.exe font_info -i <font.ttf> [-j] [-o <out>]

# Encode text by font map
eab_tools.exe bt82x font_encode -i <text|utf8file> -j <cvt.json> [-u <unknown>]
```

## Options (bt82x font)

| Flag | Default | Description |
|------|---------|-------------|
| `-f, --font-struct` | `legacy` | Font structure: legacy, ext1, ext2 |
| `-i, --infile` | — | Input font file (TTF/OTF) |
| `-r, --input-range` | — | Character range (e.g. `U+0020-U+007F`) |
| `-u, --utf8-file` | — | UTF-8 text file listing characters to convert |
| `-o, --output-dir` | — | Output directory |
| `-s, --point-size` | `25` | Font point size |
| `-D, --dpi` | `72` | DPI setting |
| `-l, --first-character` | `1` | First character code |
| `-d, --address` | `0` | Start address |
| `-E, --bitmap-format` | `L4` | Bitmap format: ASTC, L1, L2, L4, L8 |
| `-b, --astc-block` | `auto` | ASTC block footprint |
| `-e, --astc-effort` | `fast` | ASTC effort: thorough, exhaustive, medium, fast, fastest |
| `-x, --astc-path` | — | Path to astcenc encoder |
| `-S, --add-space` | off | Assign space character to code point 0x20 |
| `-p, --gen-preview` | off | Generate font preview |
| `-K, --extended-kerning` | off | Enable extended kerning |
| `-L, --ordinal-mode` | off | Ordinal mode (the GUI offers UTF-8 / Ordinal; BT82x keeps UTF-8 and disables the choice, and the Legacy structure never emits it — there it only sets the First Character default and the input range) |
| `-B, --flag-bin` | off | Binary output flag |
| `-W, --flag-cjk` | off | Flag for CJK fonts |
| `-R, --relocate` | off | Relocate font |
| `-m, --symbol` | off | Symbol font encoding |
| `-g, --gen-source` | — | Generator source: FT4222 or MPSSE |

## Output Files

**Legacy structure** (BT82X):
- `<name>_<fmt>.raw` — Raw binary (128-byte header + 20-byte metric block + glyph bitmap)
- `<name>_<fmt>.json` — Font metadata (character map, metrics, RAM size)
- `<name>_<fmt>.rawh` — Human-readable raw dump (hex header + glyphs)
- `<name>_<fmt>_char_index.html` — Character index preview
- `_preview.png` — Font preview (with `-p`)

## Build

```bash
cd dev
cargo build --release -p font_cvt
copy target\release\font_cvt.dll ..\native\
```

## Test

```powershell
powershell -ExecutionPolicy Bypass -File dev\testscript\testscript_font_converter.ps1
```

## Sample inputs - the "Use Sample" button

`samples/BT82X/` and `samples/Legacy/` hold the reference inputs Converter (fonts + range file) and Encoder (font map JSON + text) tabs loads for the
selected chip group (a tool without a chip has one folder per group anyway, a Legacy-only tool keeps
only `samples/Legacy/`). `samples/Legacy/mssong_25_L4.json` is the decoder output for `mssong.ttf`
(25 pt, L4, U+0020-U+007E) and `samples/Legacy/encode_sample.txt` is the text the Encoder tab encodes
with it. The button sits in the drop zone's `.dz-corner` while the zone fills the
frame (left of *Show options*) and in the input card's title row right of *Add folder* otherwise; on a
tabbed extension each tab has its own. Clicking it lists the folder through the host
(`API_EAB_listExtAssets`), reads each file with `API_EAB_readExtFile`, queues the paths, sets the chip
and any mandatory option, and leaves the tab's own run button enabled.
