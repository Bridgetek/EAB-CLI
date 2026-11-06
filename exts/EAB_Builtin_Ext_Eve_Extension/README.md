# EVE Extension

Generate **BT82x** extension patch files (.bin / .h / .c / .py / .json).
Ported from the EAB "EVE Extension" tab (`bt82x_extension_form.cpp`) and its
backend `extensionutil.py` (compiled as `ext_util.exe` in the reference EAB
`tools\` folder) into a native Rust DLL (`eve_extension_cvt.dll`).

> **Note:** The extension-patch feature is **BT82X-only** ("For Bridgetek BT82x
> series only"), so the GUI chip combo lists just BT82X — no Legacy/bt82x switch
> is needed. There is no `eve_extension` sub-command in `eab_tools.exe`; the
> reference executable is `ext_util.exe`.

## CLI Usage

```bash
eab_tools.exe eve_extension [-o <dir>] [-n <name>] (-a | -l | -b | -c | -p | -j) [-s] [-q] [extensions...]
```

| Argument | Default | Description |
|----------|---------|-------------|
| `extensions...` | — | Patches to include (without `patch-` prefix); `patch-base` always included |
| `-o, --output` | cwd | Output file directory |
| `-n, --name` | `patch` | Output file basename |
| `-a, --listall` | — | List all extension names + versions |
| `-l, --list` | — | List version string for the selected extensions |
| `-b, --binfile` | — | Generate `<name>.bin` |
| `-c, --cfiles` | — | Generate `<name>.h` + `<name>.c` |
| `-p, --pyfiles` | — | Generate `<name>.py` |
| `-j, --jsonfiles` | — | Generate `<name>.json` |
| `-s, --split` | — | Split the patch binary from C/Python code files (implies `-b`) |
| `-q, --quiet` | — | Do not print generated values |

Example (mirrors the reference `ext_util.exe`):
```bash
eab_tools.exe eve_extension -o out -n patch -c blur dialogs
```

## GUI

Reproduces `bt82x_extension_form`: a single **Chip** combo (BT82X only),
output folder + base name (default placeholder `patch` grows as patches are
selected, e.g. `patch_blur_dialogs`), output-style checkboxes (Binary / C /
Python / JSON), a Split checkbox (enabled for C/Python), a patch table with
name / version / description / mandatory `base` checkbox, warnings for the
fssnapshot+fswrite duplicate and >5 patches, a Generate button and a log panel.

## Building

```bash
cd dev
./release.sh          # builds eve_extension_cvt.dll + test loader, stages release/
cd dev/testscript
powershell -File testscript_eve_extension.ps1   # vs ext_util.exe
```
