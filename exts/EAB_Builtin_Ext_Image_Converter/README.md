# Image Converter — BT82x & Legacy

Convert images for **BT82x** (BT820) and **Legacy** (FT8xx, BT81x, BT88x) EVE display chips.

The GUI and this documentation name the two chip **groups** `BT82x` and `Legacy`, and the
command line takes `bt82x` / `legacy` (plus any part or family name — `bt820`, `bt817`,
`bt81x`, `ft813`, `bt88x` …). The CLI still accepts the older wire tokens `bt82x` and
`legacy` — the spelling the extension DLLs and every `manifest.json` → `cli_commands`
entry answer to — so existing scripts keep working. Individual chip names (BT81x,
BT82x, FT8xx, FT813, BT820…) never change.

## Overview

This extension converts PNG/JPEG images to raw pixel formats understood by
EVE display controllers. It supports two conversion backends:

| Backend | Description |
|---------|-------------|
| **[Rust Native](#rust-native-primary)** | Self-contained DLL (`tauri/dist/img_cvt.dll`) — no external dependencies |
| **[External DLL Fallback](#external-dll-fallback-optional)** | Uses FFmpeg + astcenc DLLs for enhanced decoding and proper ASTC compression |

## Choosing a Backend

### Rust Native (Primary)

The Rust native DLL is built using the `image` crate and is fully self-contained.
It handles all non-ASTC formats (ARGB8, RGB565, L8, YCbCr, Paletted, etc.)
using pure Rust code.

**Build:**
```bash
cd exts/image_converter/img_cvt
cargo build --release
cp target/release/img_cvt.dll ../tauri/dist/
```

**Pros:**
- ✅ No external dependencies
- ✅ Small binary (~2 MB)
- ✅ Fast compilation
- ✅ All formats supported except high-quality ASTC

**Cons:**
- ❌ ASTC uses a simple average-color approximation (not pixel-accurate)
- ❌ Image decoding relies on Rust `image` crate codec support

### External DLL Fallback (Optional)

For production-quality ASTC compression and broader image format support,
you can build and use external DLLs.

**Components:**
- `convert_ffmpeg.dll` — Uses FFmpeg (libavcodec/libavformat/libswscale) for decoding
- `convert_astcenc.dll` — Uses astc-encoder for proper ASTC compression

**Build instructions:** See [`dll/README.md`](dll/README.md)

**Pros:**
- ✅ Full image format support via FFmpeg
- ✅ Proper ASTC compression (block-by-block, quality levels)
- ✅ Battle-tested decoders

**Cons:**
- ❌ Larger distribution (~15 MB extra for FFmpeg DLLs)
- ❌ More complex build process (MSYS2 + CMake + VS)
- ❌ Additional DLL dependencies at runtime

## Comparison

| Feature | Rust Native | FFmpeg Fallback | astcenc Fallback |
|---------|:-----------:|:----------------:|:----------------:|
| ARGB8 / RGB8 | ✅ | ✅ | — |
| RGB565 / ARGB1555 | ✅ | ✅ | — |
| RGB332 / ARGB2 / ARGB4 / ARGB6 / RGB6 | ✅ | ✅ | — |
| L8 / L4 / L2 / L1 / LA8 / LA4 / LA2 / LA1 | ✅ | ✅ | — |
| YCbCr | ✅ | ✅ | — |
| PALETTEDARGB8 | ✅ | ✅ | — |
| PALETTED / PALETTED565 / PALETTED4444 / PALETTED8 (pre-BT82x) | ✅ | ✅ | — |
| ASTC (all block sizes) | ⚠️ Approximate | — | ✅ Proper |
| PNG input | ✅ | ✅ | — |
| JPEG input | ✅ | ✅ | — |
| BMP input | ✅ | ✅ | — |
| TIFF input | — | ✅ | — |
| WEBP input | — | ✅ | — |
| Self-contained | ✅ | ❌ Needs FFmpeg DLLs | ❌ Needs astcenc DLL |

## CLI Usage

```bash
# Using Rust native (default)
eab_tools.exe bt81x img_cvt -i input.png -o ./output -f RGB565

# Specify ASTC effort
eab_tools.exe bt81x img_cvt -i input.png -o ./output -f ASTC_8X8 -e thorough

# Generate sample C source
eab_tools.exe bt81x img_cvt -i input.png -o ./output -f RGB565 -g
```

## Building

### Prerequisites

- [Rust](https://rustup.rs/) (stable toolchain)
- C/C++ compiler (MSVC or GCC) — for astc-encoder
- [MSYS2 + MinGW64](https://www.msys2.org/) — only if building FFmpeg from source

### Step 1 — Clone 3rd-party libraries

The `img_cvt/3rd libs/` directory contains git subprojects that are
**not checked into version control**. Clone them manually:

```bash
cd exts/image_converter/img_cvt/3rd\ libs

# ARM astc-encoder (required for ASTC compression)
git clone --depth 1 https://github.com/ARM-software/astc-encoder.git astc-encoder-src
# Pinned commit: f863361b26e73a7384cfe3a00ae9d2743c154a8f
#   (Clamp out-of-range unorm inputs, #651)

# FFmpeg (optional — enables FFmpeg-based JPEG decoding)
git clone --depth 1 --branch n7.1 https://github.com/FFmpeg/FFmpeg.git ffmpeg-src
# Pinned commit: <insert-after-cloning>
#   (n7.1 stable release)
```

### Step 2 — Build the Rust native DLL

```bash
cd exts/image_converter/image_converter
cargo build --release

# Copy the DLL to the extension root
cp target/release/img_cvt.dll ../
```

### Step 3 — (Optional) Build FFmpeg DLLs

FFmpeg DLLs are loaded **at runtime** by the Rust code. If they are not
available, the converter falls back to the `image` crate for JPEG decoding.

Build FFmpeg from source using MSYS2 MinGW64:

```bash
cd 3rd\ libs\ffmpeg-src
export PATH="/mingw64/bin:$PATH"
./configure --prefix=/mingw64 --enable-shared --disable-static
make -j$(nproc)
make install
# DLLs will be at: /mingw64/bin/avcodec-61.dll, avformat-61.dll,
#                  avutil-59.dll, swscale-8.dll
```

Copy the FFmpeg DLLs alongside `img_cvt.dll` or add them to
your system `PATH`.

### Running tests

```powershell
# All formats, native path
dev\testscript\testscript_image_converter.ps1

# The tools-only subsets (validator, JPEG optimizer, raw viewer)
dev\testscript\test_tools_full.ps1
dev\testscript\test_raw_viewer.ps1
```

## JPEG Decoder Backends

The JPEG decoder has three backends, tried in priority order:

| Priority | Backend | DLL | Pixel match with reference |
|:--------:|---------|:---:|:--------------------------:|
| **1** | **libjpeg-turbo** (preferred) | `turbojpeg.dll` | ✅ **Exact** — same as PIL |
| **2** | `image` crate (built-in) | None needed | ⚠️ Slight difference |
| **3** | FFmpeg DLLs | `avcodec-61.dll` + deps | ❌ Different decoder |

The Rust code tries each backend in order until one succeeds.

### libjpeg-turbo JPEG Decoder

The file `src/jpeg_ffi.rs` decodes JPEG using libjpeg-turbo's TurboJPEG C API,
loaded at runtime via `libloading`. This produces pixel values identical to
the Python reference tool (PIL/libjpeg-turbo).

`src/jpeg_lib.rs` uses the same DLL for the JPEG optimizer's encode step
(`tj3Compress8` with `TJPARAM_OPTIMIZE` and 4:2:2 subsampling), which is what
makes `jpeg_optimize` output byte-identical to the reference. The DLL is
shipped at `native/turbojpeg/turbojpeg.dll`.

**Build libjpeg-turbo DLL on Windows (CMake + MSVC):**

```bash
cd 3rd\ libs\libjpeg-turbo-src
mkdir build & cd build
cmake .. -G"Visual Studio 17 2022" -A x64 ^
    -DENABLE_SHARED=ON -DENABLE_STATIC=OFF ^
    -DCMAKE_INSTALL_PREFIX=install
cmake --build . --config Release
cmake --install . --config Release
# DLL: build\install\bin\turbojpeg.dll
```

Copy `turbojpeg.dll` alongside `img_cvt.dll` or add to PATH.

### pngquant Palette Quantizer

The paletted formats (`PALETTED`, `PALETTED565`, `PALETTED4444`, `PALETTED8`,
`PALETTEDARGB8`) need `pngquant.exe` to build the palette when the input is not
already an 8-bit palette PNG. It is shipped at `native/pngquant/pngquant.exe`
and spawned as a child process by `src/png_quant_exe.rs`.

If the payload is missing, paletted conversion of RGB/RGBA/JPEG input fails with
`Unable to quantize the image to a palette`. An input PNG that is already
palette-based is passed through without invoking pngquant.

### FFmpeg JPEG Decoder

### How it works

The file `src/ffmpeg_ffi.rs` implements a JPEG decoder that:

1. Tries to load FFmpeg DLLs (`avcodec-61.dll`, `avformat-61.dll`, `avutil-59.dll`,
   `swscale-8.dll`) at runtime using `libloading`.
2. If found, uses the FFmpeg decoding pipeline:
   `avformat_open_input` → `av_find_best_stream` → `avcodec_open2` →
   `avcodec_send_packet` / `avcodec_receive_frame` → `sws_scale` → RGBA.
3. If FFmpeg DLLs are **not** found, the caller falls back to the `image` crate.

### Advantages over the `image` crate

- Better handling of progressive JPEGs
- Better error recovery for corrupted JPEGs
- Supports more JPEG sub-formats (via libjpeg-turbo in FFmpeg)
- Can be extended to decode other formats (TIFF, WebP, etc.)

### Requirements

- **Runtime**: FFmpeg DLLs must be present (optional — graceful fallback)
- **Build time**: `libloading` crate (automatically fetched by Cargo)
    "img_cvt.dll",
    "convert_ffmpeg.dll",
    "convert_astcenc.dll",
    "FFmpeg/avcodec.dll",
    "FFmpeg/avformat.dll",
    "FFmpeg/avutil.dll",
    "FFmpeg/swscale.dll",
    "astc-encoder/astcenc.dll"
]
```

## Sample inputs — the ✨ Use Sample button

Every tab carries a **✨ Use Sample** button that queues the packaged sample
inputs and sets the mandatory options for that tab in one click:

- **Image Converter** — queues the sample images; when no chip is picked yet it
  selects the `BT81x / BT88x / FT8xx` group first, and the format list follows
  the chip.
- **Validator** — queues the same image samples.
- **JPEG Optimizer** — queues only the JPEG samples (its picker takes JPEGs).
- **Raw Viewer** — queues a golden `.raw` bitmap produced by `img_cvt` from
  `ducati.png` and sets the options that bitmap needs: `ARGB8 / 288 / 163` for
  the BT82X group, `RGB565 / 288 / 163` for the Legacy group.

The files live in `samples/<chip>/`, mirroring the chip subfolders of the
reference asset set (`Assets For Test`). The button follows the chip picked in
the options column and falls back to the **Legacy** group.

| Folder | Chip group | Files |
|---|---|---|
| `samples/BT82X` | `BT82x` (includes BT820) | `case.png`, `ducati.png`, `lighthouse.jpg`, `colorful-finch.jpg`, `ducati_288x163_ARGB8.raw` |
| `samples/Legacy` | `Legacy` (includes FT8xx, BT81x, BT88x) | `case.png`, `ducati.png`, `lighthouse.jpg`, `red-panda.bmp`, `ducati_288x163_RGB565.raw` |

The button sits to the right of **Add folder** in the input card, and to the
left of **Show options** while the drop area fills the screen.

## License

This extension uses the following components:

- **Rust native**: MIT (uses `image` crate, MIT/Apache 2.0)
- **FFmpeg** (optional): LGPL v2.1+ — see https://ffmpeg.org/legal.html
- **astc-encoder** (optional): Apache 2.0 — see https://github.com/ARM-software/astc-encoder
