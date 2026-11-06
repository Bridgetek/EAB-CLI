# Asset Compressor

Compress, validate and decompress EVE asset files using zlib or zopfli.
Ported from the reference `ast_cpr.py` into a native Rust DLL
(`compress_cvt.dll`). The tool is chip-agnostic ("Both"), so the GUI has no
chip selector — it applies to all EVE chips.

## CLI Usage

```bash
eab_tools.exe compress -i <file1;file2;...> [-a zlib|zopfli] [-l 0-9] [-o <dir>] [-n <name>] [-v] [-d] [-p]
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `-a, --compress-lib` | `zlib` | Compressor library: zlib or zopfli |
| `-l, --compress-level` | `6` | Compression level from 0 to 9 |
| `-o, --output-dir` | — | Output folder (optional when validating only) |
| `-n, --name` | first stem | Output file name |
| `-v, --validate` | off | Validate the compressed files |
| `-d, --decompress` | off | Decompress if input files are validated |
| `-i, --inputs` | — | List of asset files separated by semicolon (required) |
| `-p, --pad-64` | off | Align input file size to a 64-byte boundary |

## Output

- `<name>.zlib` or `<name>.zopfli` — the compressed stream (padded to a
  multiple of 4 bytes).
- With `-v -d`: `<name>.inf.raw` — the inflated content of the first input.

## Compression cores

- **zlib** uses the real C zlib algorithm (`flate2` + `libz-sys`) so the output
  is byte-identical to the reference's Python `zlib.compressobj`.
- **zopfli** uses the `zopfli` Rust crate (byte-identical to the C zopfli used
  by the reference).

## Building

```bash
cd dev
./release.sh          # builds compress_cvt.dll + test loader, stages release/
cd dev/testscript
powershell -File testscript_asset_compressor.ps1   # 14/14 vs reference
```

## Sample inputs - the "Use Sample" button

`samples/BT82X/` and `samples/Legacy/` hold the reference inputs Input assets loads for the
selected chip group (a tool without a chip has one folder per group anyway, a Legacy-only tool keeps
only `samples/Legacy/`). The button sits in the drop zone's `.dz-corner` while the zone fills the
frame (left of *Show options*) and in the input card's title row right of *Add folder* otherwise; on a
tabbed extension each tab has its own. Clicking it lists the folder through the host
(`API_EAB_listExtAssets`), reads each file with `API_EAB_readExtFile`, queues the paths, sets the chip
and any mandatory option, and leaves the tab's own run button enabled.
