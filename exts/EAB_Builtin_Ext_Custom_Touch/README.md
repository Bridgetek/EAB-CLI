# Custom Touch

Compile EVE custom touch firmware (coprocessor loadable touch controller) from a
touch-controller C source file. Ported from the reference `custom_touch_2x.py`
into a native Rust DLL (`touch_cvt.dll`) that orchestrates the external
Bridgetek EVE **JTC** compiler.

The GUI mirrors the reference tool's four tabs:

| Tab | What it does |
|-----|--------------|
| **Compile** | Queue C sources, pick the chip, compile to `<base>.load.h` + `<base>.load.bin` |
| **Sample Code** | The six vendor examples (FocalTech, Ilitek, Sitronix, EETI, HYCON, Goodix) with Copy and Open Binary |
| **Read Me** | The reference `CustomTouch_ReadMe.html` document |
| **Debug** | Live touch monitor: connection panel + monitor/settings pages |

- Single GUI chip combobox: **BT81X, FT81X, BT88X** (the only supported chips —
  no separate bt82x / Legacy switch).
- Shared JS handles file pickers / bridge / log; each chip selects the matching
  `jtc` toolchain (`jtc.exe` vs `jtc_FT81X_BT88X.exe`).

## CLI Usage

```bash
eab_tools.exe bt81x fwtouch -i <input.c> -o <out> [-c BT81X|FT81X|BT88X]
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `-i, --input` | — | Input C source file (required) |
| `-o, --output` | — | Output folder (required; must exist) |
| `-c, --eve-chip` | `BT81X` | Chip select: BT81X, FT81X, BT88X (case-insensitive) |
| `-v, --version` | — | Show the version and exit |

## Output

- `<base>.load.h` and `<base>.load.bin` are copied into the output folder.
- These are the coprocessor loadable touch firmware files (the `.bin` is loaded
  via `CMD_LOAD_ASSET` / `CMD_APPEND`; the `.h` is a C header of the stream).

## Debug tab

The Debug tab talks to the board through the Bridgetek EVE HAL
(`eve_hal.dll`), the same library the reference `TouchBackend` uses. The DLL is
loaded by `touch_cvt.dll` and driven through these commands:

| Command | Purpose |
|---------|---------|
| `touch-devices` | List the adapters the HAL can see |
| `touch-pico-ports` | List the Raspberry Pi CDC ports a Pico bridge can be reached on |
| `touch-pico-ping [--port NAME]` | Open the bridge port and ask for its firmware version |
| `touch-pico-connect [--port NAME] --spi-clock N --eve-clock N --width W --height H` | Open the bridge and boot the board |
| `touch-pico-disconnect` | Close the bridge port |
| `touch-pico-bootsel` | List the `RPI-RP2` volumes (a Pico in BOOTSEL mode) |
| `touch-pico-flash` | Copy the bundled bridge UF2 onto those volumes |
| `touch-connect --host FT4222\|MPSSE --spi-clock N --eve-clock N --width W --height H` | Open, boot and configure the board |
| `touch-disconnect` | Close the session |
| `touch-status` | Connection state, chip, screen, debug/calibration flags |
| `touch-poll` | One sample of the touch registers (1 point, or 5 in extended mode) |
| `touch-load-firmware --touch <bin> [--debug <bin>]` | Push firmware into RAM_CMD |
| `touch-calibrate` | Queue `CMD_CALIBRATE`; completion shows up in `touch-status` |
| `touch-read-transform` / `touch-write-transform --a … --f` | Touch transform matrix |
| `touch-read-screen` / `touch-write-screen --width … --brightness` | Display timing registers |
| `touch-set-extended --on 0\|1` | Single-point vs 5-point touch mode |
| `touch-set-spi-clock --mhz N` | Change the SPI clock on a live session |
| `touch-debug-patch --part BT817` | Path of the debug patch for a chip |

The session lives in the DLL, so it survives between commands — the host keeps
`touch_cvt.dll` loaded for the lifetime of the app.

## Pico bridge

A Raspberry Pi Pico can replace the FTDI adapter. `pico/eve_touch_bridge.uf2`
turns it into a USB CDC bridge that owns the SPI bus, so the Debug tab drives
the live monitor, the firmware loader, calibration and the settings pages
through it exactly as it does through an FT4222 or an MPSSE adapter.

| Pico | EVE |
|------|-----|
| GP2 | SCK |
| GP3 | MOSI |
| GP4 | MISO |
| GP5 | CS# |

That is the pin map of the Bridgetek MM2040EV board and the GD3X dazzler.

Flash the UF2 once: hold BOOTSEL while plugging the Pico in, then press
**⚡ Flash Pico bridge** in the Debug tab (or drop `pico/eve_touch_bridge.uf2`
on the `RPI-RP2` drive by hand). Afterwards the Pico enumerates as a serial port
on every plug-in. In the Debug tab press **Scan** — the Pico row shows the
bridge port and its firmware version — then **Connect** to boot the board.

The bridge speaks a line protocol over the serial port: one ASCII request per
line, one JSON answer per line (`PING`, `CONNECT`, `POLL`, `LOAD <hex>`,
`CALIBRATE`, `READ-TRANSFORM`, `WRITE-TRANSFORM`, `READ-SCREEN`,
`WRITE-SCREEN`, `SET-EXTENDED`, `SET-SPI`, `DISCONNECT`). `pico.rs` in the DLL
translates the `touch-*` commands into it, so the page does not know which
transport is selected.

### Building the firmware

```bash
cd dev/pico
./build.ps1          # or ./build.sh — builds, converts to UF2, stages pico/
./build.ps1 -Check   # build only
```

The firmware is a `no_std` Rust binary for `thumbv6m-none-eabi`; `uf2gen/`
converts the ELF to UF2 (the RP2040 family id, 256-byte blocks).

## External tool (jtc)

`jtc.exe` (BT81X) or `jtc_FT81X_BT88X.exe` (FT81X/BT88X) must be available.
Discovery order: `EAB_CUSTOM_TOUCH_JTC` / `EAB_CUSTOM_TOUCH_JTC_DIR` env vars,
next to `touch_cvt.dll`, known EAB reference tools folders, CWD, then PATH.

## Runtime DLLs

`native/` holds `touch_cvt.dll`, the two `jtc` compilers and the debug patches'
sibling `debug/` folder. `pico/` holds the bridge firmware and its read-me. The HAL's own dependencies come from the shared
dependency store declared in `manifest.json` and are linked into `native/` when
the extension is scanned:

- `eve-emu` → `eve_hal.dll`, `bt8xxemu.dll`
- `ftdi` → `LibFT4222-64.dll`, `libMPSSE.dll`
- `zlib` → `zlib.dll` (imported by `bt8xxemu.dll`)
- `msvc-runtime` → `msvcp140.dll`, `vcruntime140.dll`, `vcruntime140_1.dll`, `concrt140.dll`

`ftd2xx.dll` is bundled directly because `eve_hal.dll` imports it by name.

## Building

```bash
cd dev
./release.sh          # builds touch_cvt.dll + test loader, stages release/
cd dev/testscript
powershell -File testscript_custom_touch.ps1   # 14/14 vs reference
```

## Sample inputs - the "Use Sample" button

`samples/Legacy/` holds the reference inputs (pre-BT82X only) the button loads
for the selected chip group. The button sits in the drop zone's `.dz-corner`
while the zone fills the frame (left of *Show options*) and in the input card's
title row right of *Add folder* otherwise. Clicking it lists the folder through
the host (`API_EAB_listExtAssets`), reads each file with `API_EAB_readExtFile`,
queues the paths, sets the chip and leaves the run button enabled.

