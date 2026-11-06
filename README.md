# EAB CLI — EVE Asset Builder Commandline Interface

Command-line distribution of **EVE Asset Builder (EAB)** for Bridgetek EVE display
controllers (FT80x, FT81x, BT88x, BT81x, BT82x).

This repository is the **shipped, ready-to-run package**: the `eab_tools.exe`
binary, the built-in extension set under `exts/`, and the shared third-party
dependency store under `dependencies/`.

---

## Contents

```
EAB-CLI/
├── eab_tools.exe        Main application (CLI + GUI host)
├── exts/                Built-in extensions (converters, utilities, themes)
├── dependencies/        Shared third-party payload store
│   ├── catalogue.json   Registry of available packages
│   └── deps.lock.json   Resolved state (digests, required_by)
└── test/                Test report for the current release
```

---

## Quick start

```cmd
eab_tools.exe --help
eab_tools.exe --version
eab_tools.exe list-tools
```

`--version` reports the build version`.

Convert an image for a BT82x target:

```cmd
eab_tools.exe bt82x img_cvt -i input.png -o .\out -f RGB8
```

Convert an image for an FT80x target:

```cmd
eab_tools.exe ft80x img_cvt -i input.png -o .\out -f RGB565
```

Every tool prints its own options with `--help`:

```cmd
eab_tools.exe bt82x img_cvt --help
eab_tools.exe ft80x font --help
```

---

## Chip selection

The first argument selects the target chip. It may be a **family**, a **part
number**, or omitted entirely.

| Token | Chip family |
| --- | --- |
| `ft80x` | FT80X (FT800, FT801) |
| `ft81x` | FT81X (FT81X family) |
| `bt88x` | BT88X |
| `bt81x` | BT81X |
| `bt82x` | BT82X (default) |

Part names are accepted too and map to their family: `ft800`, `ft813`, `bt815`,
`bt817`, `bt880`, `bt820`, plus the generation aliases `eve1`…`eve5`.

When no chip token is given, the command runs against **BT82X**. Tools that only
exist for some families (`jpeg_optimize` and `fwtouch` on pre-BT82x,
`font_encode` on BT82x only) are resolved per chip — see the table below.

```cmd
eab_tools.exe bt817 img_cvt --help   REM same tool set as bt81x
eab_tools.exe img_cvt --help         REM defaults to BT82X
```

> The legacy `legacy` / `82x` / `pre82x` group tokens are **not** accepted by this
> build; use a chip family or part name instead.

---

## Tools

`eab_tools.exe list-tools` prints the live list. Summary:

| Tool | Description | ft80x | ft81x | bt88x | bt81x | bt82x |
| --- | --- | :-: | :-: | :-: | :-: | :-: |
| `animation` | Convert GIF / image folder to ASTC animation | ✔ | ✔ | ✔ | ✔ | ✔ |
| `audio` | Convert / validate audio | ✔ | ✔ | ✔ | ✔ | ✔ |
| `bin2c` | Convert a binary file to a C array | ✔ | ✔ | ✔ | ✔ | ✔ |
| `compress` | Compress / decompress assets (zlib, zopfli) | ✔ | ✔ | ✔ | ✔ | ✔ |
| `disassembler` | Disassemble EVE display lists | ✔ | ✔ | ✔ | ✔ | ✔ |
| `flash_gen` | Build a flash image from assets | ✔ | ✔ | ✔ | ✔ | ✔ |
| `flash_prog` | Program SPI flash | ✔ | ✔ | ✔ | ✔ | ✔ |
| `font` | Convert fonts (legacy / extended structures) | ✔ | ✔ | ✔ | ✔ | ✔ |
| `font_encode` | Encode text using a font JSON map | — | — | — | — | ✔ |
| `font_info` | Read font information | ✔ | ✔ | ✔ | ✔ | ✔ |
| `img_cvt` | Convert images to EVE bitmap formats | ✔ | ✔ | ✔ | ✔ | ✔ |
| `img_val` | Validate image compatibility | ✔ | ✔ | ✔ | ✔ | ✔ |
| `jpeg_optimize` | Optimize JPEG files | ✔ | ✔ | ✔ | ✔ | — |
| `raw_viewer` | Render raw pixel data to PNG | ✔ | ✔ | ✔ | ✔ | ✔ |
| `video` | Convert video to MJPEG AVI | ✔ | ✔ | ✔ | ✔ | ✔ |
| `fwtouch` | Compile custom touch firmware | ✔ | ✔ | ✔ | ✔ | — |

### Common options

Most tools share these flags:

| Flag | Meaning |
| --- | --- |
| `-i, --input` | Input file |
| `-o, --output-dir` | Output folder |
| `-n, --output-name` | Output asset name (no extension) |
| `-g, --gen-app` / `--gen-source` | Generate a sample FT4222 / MPSSE project |
| `-v, --version` | Tool version |
| `-h, --help` | Tool help |

### Image formats (`img_cvt`)

| Format | Bits/pixel | Notes |
| --- | --- | --- |
| `ARGB1555`, `RGB565`, `ARGB4` | 16 | |
| `RGB332`, `ARGB2`, `L8`, `LA8` | 8 | |
| `L4`, `LA4` | 4 | packed |
| `L1`, `LA1` | 1 | packed |
| `ARGB8`, `RGB8`, `ARGB6`, `RGB6` | 24–32 | |
| `YCBCR` | 24 | YUV 4:4:4 |
| `PALETTED*` | 8 + LUT | `PALETTED` (FT80x), `PALETTED565/4444/8` (FT81x/BT81x), `PALETTEDARGB8` (BT82x) |
| `ASTC_4x4` … `ASTC_12x12` | varies | BT81x / BT82x |

Dithering is selectable with `-d/--dither-algo` (Floyd–Steinberg, Jarvis, Stucki,
Atkinson, Burkes, Sierra, Ostromoukhov, Riemersma, Bayer 2×2/4×4/8×8, noise,
DBS, …). ASTC encoding is delegated to `astcenc` and tuned with `-e/--astc-effort`
and `-a/--astc-params`.

---

## Global flags

| Flag | Meaning |
| --- | --- |
| `-g`, `--gui` | Launch the desktop GUI (same as `EAB_TOOLS_GUI=1`) |
| `--ext_dir <folder>` | Use a different extensions folder |


```cmd
eab_tools.exe -g
```

---

## Dependency store

Third-party payloads are installed once and linked into every extension that
declares them, instead of being duplicated per extension:

```
dependencies/<name>/<version>/<platform>-<arch>/
```

| Package | Version | Used by |
| --- | --- | --- |
| `astc` | 5.5.0 | animation, font, image converters |
| `eve-emu` | 5.0.25 | audio, custom touch, flash utilities |
| `ffmpeg` | 4.3 | audio, video converters |
| `ftdi` | 3.2.14 | audio, custom touch, flash utilities |
| `jtc` | 4.5 | custom touch |
| `msvc-runtime` | 14.40.33816 | transitive (audio, custom touch, flash utilities) |
| `zlib` | 1.2.11 | audio, custom touch, flash utilities |

```sh
# resolved packages + requirements
eab_tools.exe deps list       

# check digests against deps.lock.json
eab_tools.exe deps verify     

# install missing packages
eab_tools.exe deps install    

# regenerate catalogue.json
eab_tools.exe deps catalog    

# refresh the store
eab_tools.exe deps update     

# remove extension links
eab_tools.exe deps unlink     

# drop unreferenced packages
eab_tools.exe deps prune      
```

Extensions declare requirements in `manifest.json`:

```json
{
  "dependencies": {
    "astc": "^5.5",
    "ffmpeg": { "version": "^4.3", "optional": true }
  }
}
```

---

## Built-in extensions

| Extension | Type | Commands |
| --- | --- | --- |
| Animation Converter | app | `animation` |
| API Reference | app | — (GUI only) |
| Asset Compressor | app | `compress` |
| Audio Converter | app | `audio`, `audio_validate` |
| Bin2C | app | `bin2c` |
| Custom Touch | app | `fwtouch`, `touch-*`, `usb-watch` |
| Disassembler Utilities | app | `disassembler` |
| EVE Extension | app | `eve_extension` |
| Flash Generator | app | `flashgen` |
| Flash Utilities | app | `flash_gen`, `flash_prog` |
| Font Converter | app | `font`, `font_info`, `font_encode` |
| Image Converter | app | `img_cvt`, `img_val`, `validate`, `jpeg_optimize`, `raw_viewer` |
| Info | app | `info` |
| Register Validator | app | `register_validator` |
| Themes | theme | — (GUI only) |
| Video Converter | app | `video` |

Each extension folder contains a `manifest.json`, its UI (`ui.html`, `ui.js`,
`ui.css`) and a `native/` folder with the DLLs and linked dependencies.

### Extension package format

An extension is a folder (or `.eabapk` ZIP) with:

```
my-extension/
├── manifest.json    metadata, permissions, CLI commands, dependencies
├── ui.html          optional iframe UI
├── main.js          optional JavaScript entry point
├── native/          DLLs and linked dependency payloads
└── assets/          icons and images
```

Minimal `manifest.json`:

```json
{
  "id": "my-extension",
  "name": "My Extension",
  "version": "1.0.0",
  "extension_type": "app",
  "engine": "native",
  "author": "Author Name",
  "description": "What it does",
  "ui": "ui.html",
  "permissions": ["gui.render", "fs.read", "fs.write"],
  "cli_commands": ["mycmd"],
  "app_dlls": ["native/my.dll"],
  "api_version": "2.0"
}
```

`extension_type` is one of `app`, `theme`, `launcher`, `widget`. `engine` is
`native` (the only implemented engine). `api_version` is checked against the
host's API major on install.

---

## Additional commands

Beyond the per-chip tools, the built-in extensions register a few standalone
commands:

| Command | Description |
| --- | --- |
| `flashgen -j <manifest.json>` | Build a flash image from a JSON project manifest (fonts, images, videos, animations, audio, raw assets) |
| `flashgen -m` | Interactive manifest wizard |
| `eve_extension` | Generate BT82x extension patch files (`.bin`, `.h`, `.c`, `.py`, `.json`) |
| `info` | Print build info, docs and paths |
| `register_validator` | Validate display timing registers — all of `--so-mode`, `--hsize`, `--vsize`, `--hcycle`, `--hoffset`, `--hsync0`, `--hsync1` must be supplied |
| `audio_validate` | Validate audio files for EVE |
| `validate` | Alias of `img_val` |

```cmd
eab_tools.exe flashgen -j project.json
eab_tools.exe info -a about
eab_tools.exe register_validator --so-mode 3 --hsize 1920 --vsize 1200 ^
    --hcycle 2080 --hoffset 52 --hsync0 0 --hsync1 32
```

---

## GUI mode

The same executable hosts the desktop GUI:

```cmd
eab_tools.exe -g
eab_tools.exe --gui
set EAB_TOOLS_GUI=1 && eab_tools.exe
```

The GUI provides the extension taskbar, marketplace, theme/launcher selection
and the per-extension panels. A bare `eab_tools.exe` always prints the CLI help.

---

## System requirements

- **OS:** Windows 10/11 64-bit
- **WebView2:** required for GUI mode (preinstalled on Windows 10+)
- **Disk:** ~260 MB (`eab_tools.exe` ~20 MB, `exts/` ~140 MB, `dependencies/` ~100 MB)

---

## License

MIT
