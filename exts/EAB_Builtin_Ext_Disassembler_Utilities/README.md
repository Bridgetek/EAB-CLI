# Disassembler Utilities

Disassemble EVE display-list and coprocessor command streams into readable
text. Ported from the reference `disassembler.py` (BT82X) and
`disassembler_2x.py` (Legacy) into a native Rust DLL (`disasm_cvt.dll`).

- Single GUI chip combobox: **BT82X, BT81X, FT81X, FT80X, BT88X** (no separate
  bt82x / Legacy switch — the correct command is chosen from the chip).
- Shared JS handles file pickers / bridge / log; each chip group builds its own
  CLI (`bt82x disassembler` vs `Legacy disassembler -c <chip>`).

## CLI Usage

```bash
# BT82X
eab_tools.exe bt82x disassembler -i <input> -o <out> [-d]

# Pre-BT82x (chip-aware)
eab_tools.exe bt81x disassembler -i <input> -o <out> [-c BT81X|FT81X|FT80X|BT88X] [-d]
```

## Options

| Flag | Command | Default | Description |
|------|---------|---------|-------------|
| `-i, --input` | bt82x | — | Input file to disassemble (required) |
| `-i, --input-file` | Legacy | — | Input file to disassemble (required) |
| `-o, --output-dir` | both | — | Output folder (required; must exist) |
| `-c, --chip` | Legacy | `BT81X` | EVE chip: BT81X, FT81X, or FT80X |
| `-d, --detail` | both | off | Set detailed output format |

## Output

- Writes `<stem>.da.txt` into the output folder.
- Detailed rows: `Address  Value(Hex)  Instruction  Parameter  Interpretation`.
- Without `-d`, only the decoded instruction lines are written.

## Input Formats

- **Text**: hex words with optional `0x`, whitespace, `//` and `/* */` comments.
- **Binary**: raw 32-bit little-endian words (detected automatically).

## Building

```bash
cd dev
./release.sh          # builds disasm_cvt.dll + test loader, stages release/
cd dev/testscript
powershell -File testscript_disassembler_utilities.ps1   # 16/16 vs reference
```

## Sample inputs - the "Use Sample" button

`samples/BT82X/` and `samples/Legacy/` hold the reference inputs Input display lists loads for the
selected chip group (a tool without a chip has one folder per group anyway, a Legacy-only tool keeps
only `samples/Legacy/`). The button sits in the drop zone's `.dz-corner` while the zone fills the
frame (left of *Show options*) and in the input card's title row right of *Add folder* otherwise; on a
tabbed extension each tab has its own. Clicking it lists the folder through the host
(`API_EAB_listExtAssets`), reads each file with `API_EAB_readExtFile`, queues the paths, sets the chip
and any mandatory option, and leaves the tab's own run button enabled.
