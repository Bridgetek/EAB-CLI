# Flash Utilities

Build EVE flash images and program SPI flash. Ported from the reference
`genflash.py`, `genflash_2x.py` and `flash_program_2x.py` into a native Rust DLL
(`flash_cvt.dll`).

## CLI Usage

```bash
# Build a flash image (BT82X)
eab_tools.exe bt82x flash_gen <asset1> [asset2 ...] -o <out> [-n flash] [options]

# Build a flash image (Legacy)
eab_tools.exe bt81x flash_gen <asset1> [asset2 ...] -o <out> [-n flash] [options]

# Program SPI flash (requires hardware + the vendor programmer)
eab_tools.exe bt82x flash_prog --detect safe
```

## flash_prog

`flash_prog` builds the programmer's command line, launches it, forwards its
stdout/stderr and returns **its** exit code.

The two chip families drive two *different* vendor executables with two
different command grammars — the reference does the same
(`flash_program.py` vs `flash_program_2x.py`):

| | BT82X | Legacy |
|---|---|---|
| executable | `flash.exe` | `flash_2x.exe` |
| style | `--module` / `--erase` | `module` / `erase` |
| chip select | — | `chip BT815/6\|BT817/8` |
| start address | `--offset N` | `address N` |
| blob | `new-blob F` | `newblob F` |
| SFDP / info | `--read-sfdp` / `--read-info` | `readSFDP` / `readinfo` |
| NAND verbs | yes | — |
| chip id / verbose | — / `--verbose` | `--chip-id` / — |

Operations: `--detect [all|safe]`, `--check-type` (bt82x), `--erase`, `--read`,
`--verify`, `--program`, `--program-verify` (bt82x), `--update`,
`--update-verify`, `--newblob`, `--read-info`, `--read-sfdp`, `--chip-id`
(Legacy), `--tx/--rx`, and the NAND set (`--scan-nand`, `--sanitize-nand`,
`--map-nand`, bt82x). `--write-nand` / `--write-nand-verify` still work from the
command line for parity with the reference, but the UI no longer exposes them.

`--module Pico` programs over USB instead of SPI: `uf2conv4eve.exe --input <file>
--deploy` (`--firmware EVE3|EVE4 <file>` is added for BT815/6 and BT817/8). Only
`--program` is accepted on that host — `flash_prog.rs` returns
`Pico programming supports --program <file> only.` for every other verb, which is
what `uf2conv4eve` can do anyway (its switches are `--input/--firmware/--output/
--device/--list/--convert/--deploy/--carray/--wait/--keep/--pin`, i.e. convert and
copy an image to the drive; the Pico-side `eve_flash_pico.uf2` firmware is a UF2
writer only). The reference EAB 4.5 does not have this rule because it has no Pico
transport at all: its `--module` choice is `FT4222|MPSSE` only.
`uf2conv4eve.exe` is bundled in `native/`
with its `pico/eve_flash_pico.uf2` and `flash_blob/*` resources one level up.

`--module Pico --pico-list` is the Pico's only probe: it runs `uf2conv4eve
--list` and fails with "Pico not detected" unless a mounted volume is listed.
`uf2conv4eve --list` prints one `<drive> <board-id> (<kind>)` line per volume
after its three `… path:` preamble lines, and the board id is `RPI-RP2` only in
BOOTSEL mode — once the EVE firmware runs it is `BT81x` / `BT8XX`. The probe
therefore keys on the drive prefix (`D:` or `/…`), not on the volume label, so a
Pico that is already running the EVE firmware is still reported. A missing or
unlaunchable `uf2conv4eve.exe` is reported as itself instead of being mistaken
for "no Pico mounted". `EAB` / UI uses it so a Pico row is never shown
as connected without the board actually attached.

### Locating the programmer

The vendor programmer is **bundled in this extension's `native/` folder**, next
to `flash_cvt.dll`, so flash_prog works without an EAB install. Its runtime
dependency DLLs do not live here: they come from the shared dependency store
(`dependencies/`) declared in `manifest.json` and are linked into `native/` when
the extension is scanned. Resolution order:

1. `EAB_FLASH_TOOL` — full path to the exe, or a folder holding it
2. `EAB_FLASH_TOOL_DIR` — a folder holding it
3. **this extension's own `native/` folder** (the bundled copy)
4. the folder of the running `eab_tools.exe` (the reference layout)
5. bare name via `PATH`

The reference relies on step 4 implicitly: Windows searches the calling
executable's own directory first, and its `eab_tools.exe` sits beside
`flash.exe`. Step 3 uses the same Windows rule in reverse — when the bundled
`flash.exe` is launched, Windows resolves *its* imports from the folder the
executable lives in, so the co-located helper DLLs are found automatically.

Bundled payload (`native/`): `flash.exe`, `flash_2x.exe`, `patch_nand.bin`,
`ftd2xx.dll` — single-owner files that stay with the extension. The rest is
provided by the store and linked into `native/` (`eve-emu` → `eve_hal.dll`,
`bt8xxemu.dll`; `ftdi` → `libMPSSE.dll`, `LibFT4222-64.dll`; `zlib` →
`zlib.dll`; `msvc-runtime` → `concrt140.dll`, `msvcp140.dll`,
`vcruntime140.dll`, `vcruntime140_1.dll`).

`patch_nand.bin` must sit next to `flash.exe`: the BT82X programmer loads it at
startup and every action (including `--detect`) fails with
`ERROR: Failed to load NAND patch!` when it is missing. `LibFT4222-64.dll`,
`libMPSSE.dll` and `eve_hal.dll` import `FTD2XX.dll`, so the co-located
`ftd2xx.dll` keeps enumeration working on a machine where the FTDI driver
package did not put it in `System32`.

#### Hardware driver requirement (MPSSE / FT4222)

`libMPSSE.dll` talks to the FTDI chip through **D2XX**, so the FTDI device must
be bound to the FTDI D2XX/bus driver (`ftdibus.inf`). If the device was
re-bound with **Zadig/libwdi** to a WinUSB/`usbser` ("USB COM Port") driver,
both this tool and the reference EAB 4.5.0 tool report
`No compatible EVE device found!` — the fix is to rebind the device to
"USB Serial Converter" (FTDI) in Device Manager.

## Options (flash_gen)

| Flag | Default | Description |
|------|---------|-------------|
| `(arg)` `input_files` | — | Input asset files (positional; multiple allowed) |
| `-o, --output-dir` | (required) | Output folder |
| `-n, --output-name` | `flash` | Output name |
| `-b, --blob` | — | Flash driver blob file (occupies first 4096 bytes) |
| `-d, --gen-edf` | off | Generate EDF block |
| `-k, --no-align` | off | Disable alignment (64-byte / 4K) |
| `-I, --input-list` | — | Text file listing all input files |
| `-g, --gen-source` | `FT4222` | Generator source: FT4222 or MPSSE (CLI only — the GUI builds with the default) |

Asset types are detected from a sidecar `.json` (bitmap, legacy font, animation,
audio, video) or from the file extension (`.wav`, `.avi`, `.index.raw`, `.lut.raw`,
`.reloc`).

## Output Files

- `{name}.bin` — flash image binary
- `{name}.json` — asset metadata (eab_version, chip_gen, assets[])
- `{name}.map` — flash map (name / offset / padded size)
- `{name}.edf` — EDF block description
- `{name}.c` — C map source (flash_asset_list)
- `SampleApp_FlashGen/` — generated EVE HAL project template

## Build

```bash
cd dev
cargo build --release -p flash_cvt
copy target\release\flash_cvt.dll ..\native\
```

## Test

CLI parity against the reference release (flash_gen + flash_prog) is covered by
the shared harness:

```powershell
pwsh -File dev\test\test_and_compare_eab_tools.ps1 -Tools flash_gen,flash_prog
```

The flash_prog cases are hardware-free: with no SPI adapter attached both our
exe and the reference print `ERROR: No compatible EVE device found!` and exit 1,
so the whole build-command → execute → forward-exit-code path is compared.

Extension-local script:

```powershell
powershell -ExecutionPolicy Bypass -File dev\testscript\testscript_flash_utilities.ps1
```

## Blob Release tab

`flash_blob/` is the reference layout: `bt815_6-blob/`, `bt817_8-blob/` and
`bt82x/`. Each folder holds the vendor `README` with the blob release notes and
the `*.blob` files themselves. The tab is one column with the EVE chip picker on
top; picking a chip there also sets the Generator's chip, so both pages always
agree. Below the picker it lists the folder's `.blob` files and shows the README
verbatim, read through `API_EAB_readExtFile`; *Open blob folder* opens that
folder via `API_EAB_openOutputLocation`.

The Generator's **Blob File** box is a combobox filled from the same scan
(`API_EAB_listExtAssets` over `flash_blob/`), the selected chip's folder first.
Changing the chip switches the box to that chip's `default-fl.blob` (or the
first blob in the folder); *Browse…* adds any blob from the PC to the list and
selects it. Scanned blobs are passed to the CLI as absolute paths, because the
tool runs from the app folder rather than the extension folder.

## Sample inputs - the "Use Sample" button

`samples/BT82X/` and `samples/Legacy/` hold the reference inputs Generator (assets) and Programmer (flash image) tabs loads for the
selected chip group (a tool without a chip has one folder per group anyway, a Legacy-only tool keeps
only `samples/Legacy/`). The button sits in the input card's title row, right of *Add folder*; on a
tabbed extension each tab has its own. Clicking it lists the folder through the host
(`API_EAB_listExtAssets`), reads each file with `API_EAB_readExtFile`, queues the paths, sets the chip
and any mandatory option, and leaves the tab's own run button enabled.

`BT820` is selected on load, so the button keeps that chip and only fills in a chip when the tab's
group has none (`BT815` for `samples/Legacy`); it never overrides a chip the user already picked. On the
Programmer tab it also switches the operation to *Program factory-state chip* when the current
operation takes no file, picks `flash-817-default.bin` when the chip is a BT817/8, and refreshes the
preview so the loaded image shows up immediately.

## Layout

The extension is a two-column shell: the left column (`#shell-side`, 300 px by default) holds the
Connection panel and nothing else — it is the only place a programmer is chosen — and the right column
(`#shell-main`) holds the tab bar and every tab. The
`#shell-divider` between them drags to resize (220–620 px, persisted in `eab_flash_side_width`,
double-click or Home resets; arrow keys nudge 16 px). Under the Connection card sits the **⚙ Options**
card: **SPI clock rate (Mhz)** — always editable, because a board that does not answer at the 12 MHz
default may need a slower clock before it can be scanned (a Pico writes over USB and ignores it) — and
**Flash chip type** — enabled only for a BT82X board, where Detect reports NOR/NAND; the hint under the
two rows says which of them has no effect and why. The connection card keeps no shared controls of its
own.

The **Flash Image Generator** tab is itself a split: the EVE chip card and the Options card sit in a
left column, then the `#gen-divider` drags to resize that column (200–460 px, persisted in
`eab_flash_gen_side_width`, double-click or Home resets, arrow keys nudge 16 px), then the right
column holds the Build run bar with the input and output cards. The EVE chip card belongs to this tab
alone: it picks the target format of the image being built (`flash_gen`), and no other tab reads it.
Below 1100 px the split stacks into one column and the divider hides.

**Flash Programmer** is one full-width panel: the five reference operation tabs — Detect, Program,
Read, Scan Block, Fix Block — form a vertical rail down the left edge, with the selected tab's card on
the right. A second divider (`#fp-rail-divider`) sits between the rail and the tab content and drags
to resize the rail (110–340 px, persisted in `eab_flash_rail_width`, double-click or Home resets).
Each tab has its own inputs and action buttons (no shared run bar and no side column):
Detect (safe / measure write speed, Read Info, Read SFDP, Chip ID, then the **Detect Result** console
with Clear), Program (card title + Use Sample, a multi-image queue — drop zone, **＋ Add images…**,
Clear, **Padding bytes** (64 by default) and Offset, then Install Blob, Program, Update, Update +
Verify, Verify, Erase), Read (Output
Folder + Browse, Output Name, Start/Length, Read Entire Flash, Read, Open Folder), Scan Block (Scan,
Sanitize) and Fix Block (Read BBM LUT, Bad block, Good block, Connect). Every button sets the hidden
`#fp-action` select, so there is still one CLI path. All five rail entries are enabled on a **BT82X**
board; Detect, Read, Scan Block and Fix Block need the BT82X toolchain, so for any other chip (a BT817,
a BT81X/BT88X/FT8XX part, or a Pico whose generator
chip is not BT82X) those four rail entries are greyed out and their tooltip says why — the part the
scan reported is named in the hint — leaving Program, Update, Verify and Erase. **Program** itself is
gated by chip: only a BT817, BT818 or BT82X board may run it (the vendor tool only writes a
factory-state flash on those parts), so on a BT815/BT816, BT88X or FT8XX board the button and its
`#fp-action` entry stay disabled with *Program needs a BT817, BT818 or BT82X board*, and a selected
device outside that set is skipped per device with
`skip <dev>: Program is only available on BT817, BT818 and BT82X`. The Program page no longer carries
Write NAND / Write NAND + Verify — NAND writing is only reachable through Scan Block / Fix Block. While a command runs, a sticky run strip above the page
content names the operation, echoes the command line and counts elapsed time, and the button that
started it keeps a sheen; each page writes its log into its own console (Detect Result, Programmer
Output). The Program page stacks its images above the **Programmer Output** panel, which sits in a
darker panel directly below them so the result of the run is readable under the images that produced
it. Failures surface as a dismissible banner at the top of the
tab content, so the page never shifts the rail; it shows the exit code as a headline and the
programmer's own explanation on a second line (for example `detail: No compatible EVE device found.`),
falling back to a connection/interface hint when the tool prints nothing.

**Flash Diagnostic** is two columns: run bar + TX/RX inputs on the left, output and the explanation on
the right, with the usual draggable divider. **Sample Code** is one full-width card whose code block
grows with the code instead of scrolling inside a 340 px box.

`BT820` is picked by default, so the Generator tab starts ready. Every other tab runs against the
devices selected in Connection: Flash Programmer needs at least one selected device ("Scan a device in
the Connection panel first" tooltip otherwise), and the operations, `--chip` value and NAND pages
follow each device's own detected family — several selected devices each get their own run with their
own family, and an action family a device cannot do is skipped for that device. Flash Diagnostic needs
a **BT82X** board (its TX/RX and Read Info runs go through the BT82X tool). Both tabs always open and
look like any other tab: every action inside stays locked until the condition is met, and a click on a
locked action blinks the Connection card, the same highlight a missing option gets elsewhere.
Supported Devices, Sample Code and Blob Release are always available.

**Supported Devices** is the fixed list of 23 parts the bundled blob drivers cover — 11 NAND
(Alliance, Macronix, Micron, Winbond) and 12 NOR (Cypress, Gigadevice, ISSI, Macronix, Micron,
Winbond) — with the reference column set: Device Prefix (the string the blob matches), Technology,
Manufacturer, Size (Mbits), Size (MBytes).

**Connection** has two lists. **Detected** holds the boards the scan actually found — the adapter name
the tool reported, its EVE part and flash type, with Connect, Disconnect, Reset and Select on the
right; it is empty (with a hint to press Scan) until something answers. **Supported device list** is a
collapsed list of every transport the extension can drive — FT4222, MPSSE and Raspberry Pi Pico — with
the same four buttons, so a known adapter can be probed by hand. **Scan** (the card title button)
ignores the EVE chip picker and asks the board itself: each FTDI interface is probed with the **legacy**
tool first — `flash_prog --detect safe` with `--chip BT815/6`, then `--chip BT817/8` — because that is
the only tool that names the part (`Detected EVE Chip: BT817`), while the BT82X tool answers for any
EVE board with just `Found device:`. Only when both legacy chips report a mismatch is the BT82X family
probed. A family the board is not in exits
non-zero, which only means "try the next family" — the sweep never stops at the first miss. The
answer is remembered per device — that is what the Programmer and Diagnostic tabs run with — and its
part comes from the `ChipId=0x…` the tool reads off the wire (BT816 → `0x30816`), falling back to
`Detected EVE Chip:`, and also seeds the Generator's chip card. The **command names the tool family**
— `bt82x flash_prog`, `bt81x flash_prog` — because those are the only names the host registers, and it
forwards them to the DLL unchanged, so a part name (`bt820 flash_prog`) comes back as `unknown
command`. The **family and the legacy `--chip` value come from the part the board reported, not from
the tool that answered** — a BT817 is driven by the legacy tool with `--chip BT817/8` (a BT815/816 by
`--chip BT815/6`, BT82X without `--chip`), so the family that answered is remembered with the board.
`--check-type` fills the
**Flash chip type** row of the Options card — only BT82X shows it, so every other family skips the extra run — and every device
that answers is selected automatically, so a fresh session needs no chip picked by hand and no Select click. Because
the tools fall back to another host when the requested interface is missing
(`Target host FT4222 not found, trying MPSSE...`), every hit is filed under the interface the log says
actually answered — so one board never shows up once per interface that was asked. Host names are also
harvested from failed legacy probes (`Host: 2 (FT4222)` even when EVE boot fails), and when BT82X
`flash.exe` succeeds for `--module MPSSE` with only an FT4222 on the bus (no `Host:` line, no fallback
message), Scan keeps the enumerated adapter and skips the other SPI module.
*Connect* runs the same chip-ID probe for just that row and is disabled once the row is connected;
*Disconnect*, *Reset* and *Select* are disabled until a device actually answers (*Reset* clears the
cached state and probes again).
*Select* is a toggle, so several rows can be selected at once — every detect / program / update /
verify / erase action then runs once per selected device with that device's own `--module`,
`--frequency` and `--chip`, appending each log under its command line. A device that is newly detected
(by Scan, Connect or the background USB watch) starts out selected; *Select* is only needed to drop a
device from the run or to add one back.

Scan also looks for a **Pico**: its row has no chip-ID probe — `uf2conv4eve` is the only thing that can
see it — so the sweep ends with the same `--module Pico --pico-list` check the guide's *Check
connection* button runs, and the row lands in Detected without opening the guide. Connect still opens
the **BOOTSEL guide**: a modal that lists what ships with the extension
(`native/uf2conv4eve.exe`, `pico/eve_flash_pico.uf2`, `flash_blob/` — nothing to download), the Pico ↔ EVE
wiring (GP2 SCK, GP3 MOSI, GP4 MISO, GP5 CS#, power, GND), the BOOTSEL steps, and a *Check connection*
button that runs `--module Pico --pico-list` (`uf2conv4eve --list`). Only a mounted volume turns the row
Connected and selects it, so the row can never claim a Pico that is not plugged in; the guide stays
one click away from the Pico hint under the lists. The background USB watch also refreshes this row: a
Pico is a USB mass-storage device rather than an FTDI adapter, so the watch counts Raspberry Pi's vendor
id (`vid_2e8a`) separately and re-runs the Pico probe when one appears or goes away.

A Pico can only deploy an image, so while it is the only selected transport every action but **Program**
stays greyed out with a tooltip and `data-eab-missing="#conn-card"` (a click on a wrapped action blinks
the device list), the Detect / Read / Scan / Fix pages grey out with the same reason, and the Pico hint
says why. An FT4222 or MPSSE row selected next to the Pico keeps every action it can run, and the Pico
is skipped per device with `skip Pico: a Pico only programs an image`. The backend keeps its
`Pico programming supports --program <file> only.` guard for direct CLI use.

Every disabled control says what it waits for: `ui_helpers.js` holds one `MISSING_HINT` map keyed by the
selector that `data-eab-missing` blinks (Connection device, `#chip-one`, input assets, flash image, read
folder, NAND block numbers, TX bytes) and `setHint()` puts that text on the control's `title` — and on its
`.btn-progress-wrap`, because the wrapped primary button is `pointer-events:none` while disabled. Running
jobs, chip-family-only actions (`Read chip ID needs a BT81X / BT88X / FT81X board`) and the Pico rule each
add their own reason on top, in the same order the button is gated.

A Pico has no probe, so the chip it writes for is resolved by `runTarget()` in this order: the part the
board itself reported (any FTDI adapter) → a part another **connected** board reported (a Pico is wired
to the same EVE) → the Generator's chip card. The result is used for three things at once — the tool
family that picks the command name (`bt81x flash_prog`), the legacy `--chip BT817/8` that picks the
EVE3/EVE4 firmware blob for the UF2, and the part that the Pico hint under the lists spells out
(*"The image is built for BT817"*), so a wrong chip is visible before the run instead of only in the
log.

The **Program** page holds a queue: drop one or more images on the drop zone, or press **＋ Add images…**.
**Program** / **Program, then verify** then run `flash_prog` once per image, one after another (never
in parallel) until the end of the queue: image *n* is written at **Offset** + the padded sizes of the
images before it, where each image is padded up to a multiple of **Padding bytes** (64 by default, 0 =
the next image starts straight after). Each call is echoed with the command it ran —
`▶ bt81x flash_prog --program <file> --chip BT817/8 --offset …` — where the command name is the tool
family that answered the scan and `--chip` carries the part it reported. Every row shows its own progress bar with its own clock —
`1/3 · 0x1000 · 4.2s` in the bar while it writes, `done · 0x1000 · 6.1s` once it settles — and the drop
zone carries the overall bar, while `⏱ 12.4s · 2/3` under the list is the whole-queue clock and freezes
at the total when the run ends. There are **no** pause / resume / stop / cancel controls: the vendor
tool runs each `flash_prog` to completion and honours none of them, so the queue only reports progress
(Add/Clear and the row × are disabled while a run is in flight). The capacity the tool reports
(`Flash size    : 8 Mbytes (64 Mbits)` from detect / read-info) bounds the queue: as soon as the next
image would end past the end of the flash, that image and the rest are marked `does not fit · beyond
8 MB` and nothing more is written. Every other file action (`Verify`, `Update`, `Install Blob`, the NAND
writes) uses the first image only. Dropping, pasting or sampling replaces the queue, and each row has
a × to remove it.

Scanning is deliberately cheap, because each `flash_prog` run takes seconds: the interface that
answered last is probed first with the family that worked there (so a repeat scan is one command, not
three), interfaces the tool's own device list omits are skipped, and the Flash Type probe is only run
once per BT82X device. Nothing is probed when the extension opens — the last scan, selection, flash
type and generator chip are restored from `sessionStorage`, which is what makes switching away from
the extension and back instant; press **Scan** to look at the hardware again. Without a selected
device the action buttons stay disabled and point at the panel.

### Background USB watch

The extension watches the OS USB bus itself — nothing in the host is involved. The native
side (`dev/rust/src/usb.rs`, built into `native/flash_cvt.dll`) answers one command,
`usb-watch <ms>`: it registers for device-interface notifications (`CM_Register_Notification`,
all interface classes), blocks until the set of USB devices changes or the timeout expires, and
returns `{ "devices": [...], "changed": bool }` with every USB device present — not only the
FTDI adapters. `ui.js` (`startUsbWatch`) runs that call in a loop through `API_EAB_runCli`
(10 s wait, 10 s back-off after a failure), diffs the list against the last one and treats any
plug or unplug as a reason to look at the board again.

A changed list runs one quiet probe (`probeDevice` with `{ quiet, passive }`) and writes only the
outcome to the **Log** card — `watch: USB change — 2 USB devices, 1 FTDI adapter` then
`watch: checking for an EVE device on FT4222…` and `watch: BT817 answered …` or
`watch: no EVE device answered`. When no FTDI adapter is left on the bus the FT4222 / MPSSE rows
are cleared and the probe is skipped, because the vendor tools can only drive those adapters. A
passive probe never rewrites the Generator's chip card and never touches the connection detail
line, and only one probe runs at a time: a change that arrives while a flash command owns the
adapter is remembered and picked up by the 1 s drain timer. A board that already answered is left
alone, so the watch cannot fight the programmer for the adapter. The **Log** card is a
`<details>` collapsed by default; the dot on its summary marks lines that arrived while it was
shut.

Two things tell the user what changed without opening the log. An unplugged row stays in the
Detected list for one fade (`0.55s`, `.dev-row.is-leaving`) before it is removed, so the row that
went away is the one that animates. A corner toast (`#dev-toast-wrap`, six seconds, click to
dismiss) announces the change: *Programmer connected* on a plug, *EVE device detected* once the
board answers, *Device disconnected* naming the rows that were cleared. One hotplug reuses the
same toast card — it is repainted rather than stacked — so a plug shows *FTDI adapter detected —
looking for an EVE device…* at once and the card turns into the result a few seconds later.

A plug event reaches the OS before the FTDI driver has bound the new interface, so the first
probe can fail on a healthy board. The background probe therefore retries up to
`PROBE_RETRIES = 3` times at `PROBE_RETRY_MS = 1000` intervals, and the wait stops as soon as a
flash command starts.

## Sample Code tab

One full-width card; the code is grouped per chip family with the scope switch and page pills.
