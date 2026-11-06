# Flash Generator

Build a flash image from a JSON project manifest: convert every source font,
image, video, animation (GIF), audio file — or stage an already-converted raw
asset — with the real converters, pack the results with `flash_gen`, and write a
C header with `FLASH_ADDR_*` / `FLASH_SIZE_*` constants. The manifest itself can
also be written interactively (`-m`) or built from the GUI.

## UI

One view, three columns: the run bar (**Build flash** / **Manifest file** /
**Save manifest**), the
device and the options (blob, header, EDF block, data alignment) on the left, the
manifest drop zone, the entry list and the output settings in the middle, the plan
preview, the result and the flash map on the right. The entry list is the
queue: dropping or picking files (`＋ Add files…` / `📁 Add folder`), or pasting
them, adds entries with the settings the batch dialog asks for — the type is
guessed from the file's extension, and a kind that takes no format
(video, animation, audio, raw) hides the format box. While the list is empty the
drop zone fills the frame; **Show options ▸** brings the columns back without
picking a file.

```
eab_tools.exe flashgen -j file_cli.json
eab_tools.exe bt82x flashgen -j file_cli.json
eab_tools.exe bt81x flashgen -j file_cli.json
eab_tools.exe flashgen --json file_cli.json
eab_tools.exe flashgen -m                       # write flashgen.json interactively
eab_tools.exe flashgen -m my_project.json       # ... to a chosen path
eab_tools.exe flashgen --manifest                # same as -m
eab_tools.exe flashgen --print-meta              # device/format vocabulary as JSON
eab_tools.exe flashgen --help
```

Additive tool: the reference EAB 4.5 CLI has no `flashgen`, so nothing about the
reference command set or the parity suite changes.

## The manifest

Exactly the schema from `dev/ticket_348.md` (see `examples/file_cli.json`):

| key | required | meaning |
|---|---|---|
| `_comment` | no | free text (any `_`-prefixed key is ignored) |
| `device` | yes | chip: `BT82x` → BT82X, `FT80x/FT81x/BT81x/BT88x` → Legacy |
| `output` | yes | final flash image, e.g. `build/flash.bin` |
| `header` | no | where to write `assets.h` |
| `blob` | no | blob firmware to write into the image (`flash_gen --blob`); the GUI offers the files from `<app>/flash_blob` |
| `gen_edf` | no | generate the EDF block (`flash_gen --gen-edf`); default off, the GUI writes `true` (Qt 4.5.0 had the box ticked) |
| `no_align` | no | disable data alignment (`flash_gen --no-align`); default off |
| `align_asset` | no | bytes every asset is padded to; recorded only — `flash_gen` always pads to 64 |
| `align_image` | no | bytes the finished image is rounded up to; recorded only — `flash_gen` always rounds to 4 K |
| `entries[]` | yes | ordered flash layout (one entry → one or two flash assets) |

Entry keys: `name`, `type`, `src`, `format`, `size`, `charset`, `outputs`,
`options`. Paths resolve against the manifest's folder; unknown keys are rejected
so a typo can never silently change the build.

| `type` | `src` | converts with | staged as (bt82x / Legacy) | other keys |
|---|---|---|---|---|
| `image` | PNG/JPG/BMP | `img_cvt` | `.raw` (+ a sidecar json) | `format` (required) |
| `font` | TTF/OTF | `font` | `.raw`, or `.glyph` + `.xfont` when it splits | `format`, `size` (required), `charset`, `outputs` |
| `video` | MP4/MOV/AVI… | `video` | `.avi` | `options` |
| `animation` | GIF | `animation` | `.anim.reloc` / `.anim.raw` (bt82x), `.anim.ram_g` / `.anim.flash` (Legacy) | `options` |
| `audio` | WAV/MP3… | `audio` | `.wav` / `.raw` (+ sidecar) | `options` |
| `raw` | any asset already in flash form | *nothing — staged unchanged* | its own suffix | — |

The four converter-run types carry **no** `format`: each runs its converter in the
one form a flash image can use — an bt82x animation is relocatable (`--reloc`), a
Legacy one is a RAM_G asset (`--memory-type RAM_G`, because a FLASH animation
needs a fixed address the packer cannot honour), and the Legacy audio converter
is given the sample rate it requires (`-s 0`, i.e. keep the source's).

`options` opens the rest of that converter's switches: **the key is the flag's
long name without its dashes** and the value's JSON type follows the flag, so
`{"quality": 7, "resolution": "320:240", "container": "raw",
"remove_list_chunk": true}` passes `--quality 7 --resolution 320:240
--container raw --remove-list-chunk`. An unset key passes no flag (the converter's
own default stands), it may override the family defaults above (`"reloc": false`
stages a plain `.anim.raw`), and any unknown key, wrong type or out-of-range value
is refused with the entry number. The schema lives in `meta.rs` and is served by
`--print-meta`; `docs/flashgen-entry-options.md` documents every switch.

A `raw` entry is the escape hatch for an asset another tool already produced:
the file is copied under the entry's name and keeps its suffix, plus a sidecar
`<name>.json` when one sits next to the source, which is how `flash_gen` learns
that a `.raw` is a bitmap (or an audio/`PALETTED` asset) and what its format is.

* `format` for a font is `ASTC_<w>x<h>` (e.g. `ASTC_4x4`) or `L1/L2/L4/L8`.
  ASTC implies the *extended* font structure (the ASTC block/effort options are
  extended-only), so a font entry with `outputs: ["X_GLYPH","X_XFONT"]` produces
  a `.glyph` + `.xfont` pair named exactly like `outputs`.
* `charset` is a path to a charset file when that file exists next to the
  manifest (`font -u`), otherwise it is a literal range string (`font -r`).
* `outputs` names the flash assets the entry produces; `flash_gen` then reports
  those names in `flash.json` / `flash.map` and in the generated header.

## Writing the manifest

### `flashgen -m [FILE]` — interactive wizard

Keeps the prompt alive and asks for every input, the same way the reference's
manifest generator does. Empty answers take the `[default]`; a menu accepts
either its number or the value itself:

```
- Select device:
1 - BT820  (BT82X)
2 - BT818  (Legacy)
...
- Output flash image (.bin) [build/flash.bin]:
- C header with FLASH_ADDR_* constants (empty = none):

Entry 1:
- Input name: IC_L8
- Select type:
1 - font
2 - image
3 - video
4 - animation
5 - audio
6 - raw
- Source file: ...\case.png
- Select format:            (font: L1/L2/L4/L8 + ASTC_<w>x<h>; image: per chip)
- Set video converter options [y/N]:         (video/animation/audio only)
- Quality (2 = best, 31 = worst) [3]:        (one prompt per switch of the type)
- Add another entry [y/N]:
- Manifest file to write [FILE | flashgen.json]:
- Build the flash image now [y/N]:
```

The format menus follow the chip of the selected device, and a type that takes no
format (video, animation, audio, raw) skips its prompt. The flash-asset
`outputs` prompt appears only where a font really splits (`Legacy` + `ASTC`).
`Set <type> converter options` gates the per-switch prompts (a menu for a choice,
a y/n for a flag); answering a switch's default leaves the key out of the
manifest, so only what the author changed is written.
Ending input early (EOF) aborts with exit 1 and writes nothing.

### `flashgen --print-meta`

Prints the device table (`device` → `chip`), the entry types, the per-chip image
formats, the font formats, the asset suffix each type stages, the prompt defaults,
the split rule and the per-entry converter-option schema (`entry_options[chip][type]`,
with the `inline` flag marking the switches the row renders as cells) as JSON — the
same tables `manifest.rs` validates against. The UI builds its comboboxes from it
(also returned in the result payload as `meta`), so the two front ends cannot drift.

### UI — the manifest form

`ui.html` is a **tool dashboard**, not a centred form: the three columns carry the
cards, the workbench module routes every card by its role and renders the options
column first, so the first column holds the run bar, the **🔳 EVE Device** and the
**⚙ Options** (blob, header, EDF block, data alignment — the two alignment numbers
are recorded in the manifest, `flash_gen` itself always pads to 64 B / 4 K), the
second the **💾 Manifest** drop zone, the **🗂 Input** entry list and the
**🎛 Output** settings, and the third the plan preview, the result and the flash
map:

```
┌ 🔨 Build flash ──────┐ ┌ 💾 Manifest ────────┐ ┌ plan preview ───────┐
│ Manifest file        │ │ drop a manifest json│ │ result + flash map  │
│  [flashgen.json]     │ ├─────────────────────┤ │                     │
│  Use current manifest│ │ 🗂 Input (entries)  │ │                     │
│  💾 Save manifest    │ ├─────────────────────┤ │                     │
│ 🔳 EVE Device        │ │ 🎛 Output           │ │                     │
│ ⚙ Options            │ │                     │ │                     │
│  blob / header       │ │                     │ │                     │
│  EDF / alignment     │ │                     │ │                     │
└──────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

* The **🎛 Output** card declares `data-eab-role="action"`: an input-column card and,
  unlike `output`, one the input/output merge leaves alone — the entry list is too
  wide to share its card with the output frame.
* The dashed frame sits on the input card, so it encloses the card header, its file
  buttons and the drop area. While the entry list is empty the drop zone fills that
  frame and the output card hides with it.
* Section widths come from the grid, never from stretching controls, and the
  columns stack below 900 px so a narrow window never clips a card.

**One line per entry** — index, **−**, name, type, format (a kind without one
shows the suffix it stages instead), the converter-option cells, the font-only
columns (`pt`, `charset`, and `outputs` where the font splits) and the source,
with **Browse…** flush against the right edge. A row that is too wide for the
panel wraps its cells rather than clipping them, and the list scrolls sideways if
one of them still sticks out; nothing leaks a horizontal scrollbar. The small
legend above the list names the columns.

A `video`, `animation` or `audio` row carries its **often-used converter switches
as cells** — video `quality` / `frame_rate` / `resolution`, animation
`astc_effort` / `astc_block`, audio `format` / `sample_rate` / `container` (bt82x) —
and a **⚙** button after them for the rest: a dialog of every switch
`--print-meta` lists for that chip and type, a checkbox for a flag, a menu for a
choice, a number for a range and a text box for the rest. A cell left at its
default keeps the key out of the manifest (a choice menu shows the default, the
others show it as a placeholder), and the button takes the accent colour once the
entry carries at least one non-default switch, so a row that looks plain really is
running the defaults.

**Browse picks one *or many* files** — the dialog is multi-select, and every
selected file becomes its own entry (the row you clicked takes the first one).
When more than one file comes back, the form asks once for the **type** and
**format** to apply to the whole batch, instead of leaving you to set N rows by
hand; cancelling keeps the rows as they were seeded. The type is guessed from the
extensions — `.ttf`/`.otf` `font`, a video `video`, `.gif` `animation`, an audio
file `audio`, an already-converted asset `raw`, anything else `image`.

**Autogenerate name** (ticked by default) names each entry
`<number>_<file>_<format>` — e.g. `2_Roboto-Regular_ASTC_4x4` — from the file and
format the row already points at, so nothing is typed twice. The name box is
read-only while it is on; untick it to type names yourself (loading a manifest
unticks it, so the file's own names are kept).

**💾 Save manifest** writes the JSON (**🔨 Build flash** also runs it and fills
the rail with the produced files and the flash map) to the path in the
**Manifest file** box under the run bar, which starts as `flashgen.json`; a
relative path is resolved against the working folder, and if that folder cannot
be written the native save dialog opens instead. **Use current manifest** copies
the manifest loaded in the 💾 Manifest zone into that box (it stays disabled
until a manifest is loaded). Dropping or picking a manifest JSON
into that zone loads it into every field of the form for editing; the zone takes
one `.json`, the fonts and images go to the input zone. Device and format lists are read
from the extension via `--print-meta`, never hard-coded.

## Output

`output` (`flash.bin`) plus `flash.json`, `flash.map`, `flash.edf`, `flash.c`
written by `flash_gen`, and `header` (`assets.h`) when requested.

## How it stays byte-identical

Flash Generator never re-implements a converter. It loads the sibling extension DLLs
(`image_converter/native/img_cvt.dll`, `font_converter/native/font_cvt.dll`,
`flash_utilities/native/flash_cvt.dll`) in-process and calls their public
`handle_cli_command` — the same FFI the host uses — so each tool prints its own
console block and writes its own bytes. Staged assets live in
`<output_dir>/.flashgen/` and are removed after a successful run.

Note: `img_cvt` writes no flash metadata sidecar, so Flash Generator writes the small
`.json` that `flash_gen` documents in its own `--help` ("place the corresponding
.json file in the same directory as the asset file") next to a staged bitmap.
`.glyph` / `.xfont` / `.index.raw` / `.lut.raw` need none — `flash_gen` types
them from the file extension.

## Testing against EAB 4.5.0

`dev/testscript/testscript_flashgen.ps1` is the parity suite. The reference CLI
has no `flashgen`, so the oracle is the equivalent *manual* reference pipeline —
reference `img_cvt` / `font`, then stage the assets under the names the manifest
asks for, then reference `flash_gen` — and every case also compares our
extension converters against the reference converters:

```powershell
pwsh -File dev/testscript/testscript_flashgen.ps1                  # 32/32
pwsh -File dev/testscript/testscript_flashgen.ps1 -Cases bt82x_*,err_* -debug
pwsh -File dev/testscript/testscript_flashgen.ps1 -Cases gen_*,meta_json
```

(the suite drives the host with `--ext_dir`, which needs no environment set-up.)

Compared byte-for-byte: `flash.bin`, `flash.json`, `flash.map`, `flash.edf`,
`flash.c` (bt82x) / `flash_map.c` (Legacy), plus the staged asset bytes; `assets.h`
is verified against the offsets/sizes in `flash.json`. The `gen_*` cases drive
`flashgen -m` with scripted answers on stdin: they check the manifest it writes
(including the empty-answer defaults and the per-entry `options` prompts), that a
plain `-j` run of that document succeeds, and — when the wizard also built — that
every artifact is byte-identical to rebuilding from that same manifest
(`assets.h` too; it embeds the flash image path, so the rebuild happens in place,
not in a copy folder). `ok_opt_audio` runs a build whose entry carries options
and checks that the switches reached the converter (the staged `.raw`, its
playback container, rate and channel).

Devices: `BT820`/`BT821`/`BT82x` are BT82X parts, `BT815`/`BT817`/`FT81x` are
previous-generation parts — the manifest's `device` selects the pipeline, and the
suite covers both plus the `bt82x`/`Legacy` prefix mismatch.

## Sample inputs - the "Use Sample" button

`samples/BT82X/` and `samples/Legacy/` hold the reference inputs Manifest JSON plus its sources loads for the
selected chip group (a tool without a chip has one folder per group anyway, a Legacy-only tool keeps
only `samples/Legacy/`). The button sits in the drop zone's `.dz-corner` while the zone fills the
frame (left of *Show options*) and in the input card's title row right of *Add folder* otherwise; on a
tabbed extension each tab has its own. Clicking it lists the folder through the host
(`API_EAB_listExtAssets`), reads each file with `API_EAB_readExtFile`, queues the paths, sets the chip
and any mandatory option, and leaves the tab's own run button enabled.
