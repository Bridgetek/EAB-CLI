# Register Validator

Validate EVE display configuration registers against the scaling option.
Ported from the GUI-only C++ Qt form `display_register_validator_form.cpp`
in EVE Asset Builder into a native Rust DLL (`regval_cvt.dll`). The tool is
chip-agnostic ("Both"), so it applies to all EVE chips.

> **Note:** The reference `eab_tools.exe` has **no CLI** for this tool — it is
> a GUI-only form. The Rust backend re-implements the exact validation rules
> from the C++ form, and the test script is self-contained (no reference exe
> comparison).

## CLI Usage

```bash
eab_tools.exe register_validator [--so-mode 0|1|2|3] [--hsize N] [--vsize N] [--hcycle N] [--hoffset N] [--hsync0 N] [--hsync1 N]
```

## Options

| Argument | Default | Description |
|----------|---------|-------------|
| `--so-mode` | `3` | REG_SO_MODE: 0→1ppc, 1→2ppc, 2→2ppc, 3→4ppc |
| `--hsize` | `1920` | REG_HSIZE (must be a multiple of 16) |
| `--vsize` | `1200` | REG_VSIZE |
| `--hcycle` | `2080` | REG_HCYCLE (must be a multiple of pixels-per-clock) |
| `--hoffset` | `50` | REG_HOFFSET (must be a multiple of pixels-per-clock) |
| `--hsync0` | `0` | REG_HSYNC0 (must be a multiple of pixels-per-clock) |
| `--hsync1` | `30` | REG_HSYNC1 (must be a multiple of pixels-per-clock) |

## Validation rules

`so` (pixels per clock) from REG_SO_MODE: `0 -> 1`, `1 -> 2`, `2 -> 2`, `3 -> 4`.

1. `HSIZE % 16 != 0` → `REG_HSIZE must be a multiple of 16.`
2. `(HSIZE*VSIZE) % 128 != 0` → `(REG_HSIZE x REG_VSIZE) must be a multiple of 128.`
3. `HCYCLE % so != 0` → `REG_HCYCLE must be a multiple of {so}.`
4. `HOFFSET % so != 0` → `REG_HOFFSET must be a multiple of {so}.`
5. `HSYNC0 % so != 0` → `REG_HSYNC0 must be a multiple of {so}.`
6. `HSYNC1 % so != 0` → `REG_HSYNC1 must be a multiple of {so}.`

Final message: `Display configuration registers are well set.` when all pass,
otherwise `Change the registers and then validate them again.`

## Building

```bash
cd dev
./release.sh          # builds regval_cvt.dll + test loader, stages release/
cd dev/testscript
powershell -File testscript_register_validator.ps1   # self-contained
```
