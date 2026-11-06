# Session

Ports the reference EVE Asset Builder **session** feature — *New Session*,
*Load Session* and the recent-session list — to `eab_tools.exe`.

A session is a single `*.eab` file holding the workspace folders and (for EAB
Tools) saved extension UI state. This extension manages the session file only;
the input/output folders, log file names and other workspace settings keep
coming from wherever they already come from. Reference counterpart:
`EVE_Asset_Builder/session_manager.cpp` + `session_dialog.cpp`.

The session does not record a chip generation: `general_is_bt82x` is neither
written nor read. A reference session that still carries the key loads fine (it
is ignored), and the reference application falls back to its own default when it
opens a session written here.

Session files without EAB Tools workspace snapshots remain byte-compatible with
the reference. When workspace snapshots are saved, they are stored under the
custom `utility_info.eab_tools_workspace` key; those files are intended for EAB
Tools and may not be fully compatible with the reference application.

## GUI

Extension panel → **Session** 🗂️, or **Config → Session** in the menu bar. The page itself is
not in the toolbar strip (`"show_in_toolbar": false` in the manifest) — the menu entry is the
launcher.

* **Session File** card — the current session file
  path) plus the actions: *New Session*, *Save Session* and
  *Open / Restore Session…*.
* **New Session** — a dialog with one session-file path. It defaults to
  `./eab_session_[datetime].eab`; *Browse…* lets you choose an `.eab` file or
  a folder (which receives a generated session filename). Only the session
  file is managed here; input/output folders come from the existing workspace
  settings.
* **Recent Sessions** — newest first, click to load, ✕ to forget one entry,
  *Remove Missing* / *Clear List*. Each entry shows only its path.
* **Save Session** — rewrite the loaded session with the captured extension UI
  state.
* **Auto save** — a check item whose label carries the state and the time since
  the last save: `Auto save (enabled / just now)`, `Auto save (enabled / 5s ago)`,
  `Auto save (enabled / 20 days ago)`, or `Auto save (disabled)`. When on, the
  session is flushed on a timer and when the page closes.
* **Open / Restore Session…** — one dialog listing the current and recent
  session files (with *Browse…* for any other `*.eab` file); picking one loads
  it and applies its extension UI snapshots. Snapshots are applied as each
  extension is opened.

The host captures form controls, text log panels and the queued input file
lists while a session is active. Only light state is stored — control values,
text logs and file paths; images, video frames, fonts and other binary payloads
are never written into the session file. Browser file-picker selections and
extension-only in-memory data that is not reflected in the UI cannot be
reconstructed; reselect those files after restoring.

The reference brand mark is drawn by the host's menu bar, not by this page
(`BRT_LOGO_DATA_URI` in `src/views/MenuBar.tsx`) — a `srcDoc` iframe has no base
URL for relative assets. The page therefore carries no brand markup of its own;
`session -a logo` remains as a CLI action only.

The extension registers itself in the host menu bar from its manifest:

```json
"menus": [{
  "menu": "config", "label": "Session", "order": 10,
  "items": [
    { "id": "current", "label": "No session", "type": "info" },
    { "id": "new", "label": "New Session…", "type": "item" },
    { "id": "save", "label": "Save Session", "type": "item" },
    { "id": "autosave", "label": "Auto save (enabled)", "type": "check", "checked": true },
    { "id": "restore", "label": "Open / Restore Session…", "type": "item" }
  ]
}]
```

so the app shows **Config → Session** as a submenu; picking an entry delivers an
`eab-menu-action` message to this page (and opens it). At runtime the page
replaces the list with `API_EAB_setMenu` so the first entry shows the loaded
session file name and *Auto save* carries its state and the time since the last
save (`Auto save (enabled / 5s ago)`, `Auto save (disabled)`); the label is
re-sent every 15 s so the relative time stays current. Because the entry
already lives in the menu bar, the manifest also sets

```json
"show_in_toolbar": false
```

so the host keeps Session out of the toolbar strip (and out of the
previous/next-extension navigation) instead of duplicating the launcher.

The page is one **Session File** card: the current session facts with a
placeholder until one is open, the actions (*New Session*, *Save Session*,
*Open / Restore Session…*) and the recent-session list. *New Session* and
*Open / Restore Session…* open their own dialogs; outcomes go to the alerts at
the top and to the host log.

## CLI usage

```bash
eab_tools.exe session -a status
eab_tools.exe session -a new  -i <in> -o <out> -s <session dir>
eab_tools.exe session -a load -p <file>.eab
eab_tools.exe session -a save -p <file>.eab -i <in> -o <out> [-u <utility-info-json>]
eab_tools.exe session -a recent
eab_tools.exe session -a recent-remove -p <file>.eab
eab_tools.exe session -a recent-prune
eab_tools.exe session -a recent-clear
eab_tools.exe session -a defaults [-s <session dir>]
eab_tools.exe session -a logo          # reference artwork as a data: URI
```

| Flag | Meaning |
|------|---------|
| `-a, --action` | `status` (default), `defaults`, `new`, `load`, `save`, `recent`, `recent-add`, `recent-remove`, `recent-prune`, `recent-clear`, `logo` |
| `-p, --path` | session file (`*.eab`) to load / save / forget |
| `-i, --input` | default input folder stored in the session |
| `-o, --output` | default output folder stored in the session (must be empty) |
| `-s, --session-dir` | folder that holds the session file |
| `-n, --name` | session name; `.eab` is appended when missing |
| `-c, --chip` | accepted for compatibility with existing scripts; ignored — the session records no chip generation |
| `-t, --tab` | main tab recorded in the session |
| `-u, --utility-info` | utility state JSON object preserved in the `.eab` file |
| `-f, --force` | overwrite an existing session file |

> `session` is an **additive** command: the reference `eab_tools.exe` has no
> session CLI (the feature is GUI-only), so the parity harness and the
> `list-tools` output are unaffected.

## Files it touches

| Path | Purpose |
|------|---------|
| `<work_space>/session/*.eab` | the session files |
| `<work_space>/config.ini` | `Recent_Sessions` list (shared with **Preferences**) |
| `<work_space>/output` | default output folder |

`<work_space>` resolution, in order: `EAB_WORKSPACE` env var →
`<exe_dir>/work_space` → `<exe_dir>/../work_space` (EAB install layout, where
`eab_tools.exe` sits in `tools/`) → `%APPDATA%/EAB/tools/work_space`. The first
one that already holds a `config.ini` wins; otherwise `<exe_dir>/work_space` is
created.

## Building

```bash
cd dev
cargo build --release                # -> target/release/session_cvt.dll
cargo test --release                 # Qt-JSON writer + arg parser unit tests
cargo build --release -p session_test
copy target\release\session_cvt.dll ..\native\session_cvt.dll
```

Quick check without the GUI:

```bash
cd dev/test_app
..\target\release\session_test.exe session -a new -s ..\target\verify\ses
```
