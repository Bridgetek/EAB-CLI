# Bin2C

Convert a binary file into a C array initializer. Ported from the reference
`bin2c.py` into a native Rust DLL (`bin2c_cvt.dll`). The tool is chip-agnostic
("Both"), so it applies to all EVE chips (no chip selector in the GUI).

## CLI Usage

```bash
eab_tools.exe bin2c -i <input.bin> -o <out> [-f decimal|hexa] [-t byte|word|long] [-e little|big] [-n 1-9999] [-a <name>]
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `-i, --input-file` | — | Path to the input binary file (required) |
| `-o, --output-dir` | — | Output folder (required; must exist) |
| `-f, --notation` | `decimal` | Format of array items: decimal or hexadecimal |
| `-t, --type` | `byte` | Data type: byte (uint8_t), word (uint16_t), long (uint32_t) |
| `-e, --endian` | `little` | Byte order: little or big |
| `-n, --num-per-line` | `80` | Number of array elements per line |
| `-a, --array-name` | stem | Name of the output array |

## Output

- `<stem>.c` — a C header-style initializer with `#include <stdint.h>`,
  a `<name>_size` constant and the array `const <type> <name> [<N>] = { … };`
  where `N = ceil(file_size / type_size)`.

## Building

```bash
cd dev
./release.sh          # builds bin2c_cvt.dll + test loader, stages release/
cd dev/testscript
powershell -File testscript_bin2c.ps1   # 15/15 vs reference
```

## Sample inputs - the "Use Sample" button

`samples/BT82X/` and `samples/Legacy/` hold the reference inputs Input binaries loads for the
selected chip group (a tool without a chip has one folder per group anyway, a Legacy-only tool keeps
only `samples/Legacy/`). The button sits in the drop zone's `.dz-corner` while the zone fills the
frame (left of *Show options*) and in the input card's title row right of *Add folder* otherwise; on a
tabbed extension each tab has its own. Clicking it lists the folder through the host
(`API_EAB_listExtAssets`), reads each file with `API_EAB_readExtFile`, queues the paths, sets the chip
and any mandatory option, and leaves the tab's own run button enabled.
