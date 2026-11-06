# Info

Ports the reference EVE Asset Builder **Info** page to `eab_tools.exe`:

* the **Info** tab — `doc/EAB_About.txt` with `###VERSION###` substituted
  (credits, licences, open-source components) and the three links the reference
  routes from it;
* the **User Guide** tab — the shipped documentation (`EAB User Guide.pdf`,
  `BRT_AN_095_BT82X Firmware Update and Extension Guide.pdf`, `EXTENSIONUTIL.md`,
  `CustomTouch_ReadMe.html`);
* the **Open Command Prompt** button — `mainwindow.cpp`
  `processOpenEabTools_Button_clicked()`, which writes `eab_tools.bat` (tools and
  FFmpeg on `PATH`) and opens it in a console.

Reference counterparts: `info_form.cpp` + `.ui`, `pdf_widget.*`,
`mainwindow.cpp`, `def.h` (`DOC_USER_GUIDE`, `DOC_BT82X_EXTENSION`,
`DOC_BT82X_EXTENSION_GUIDE`, `DOC_ABOUT`).

## GUI

Extension panel → **Info** ℹ️

* Tabs **Info** / **User Guide**, mirroring the reference `QTabWidget`.
* The About page is rendered verbatim (its own white page, Segoe UI typography
  and blue links) in an isolated document, with anchor clicks forwarded so the
  `open_commmand_prompt`, `eab_user_guide` and `extension_user_guide` links open
  the right thing — exactly like `InfoForm`'s `anchorClicked` handler.
* The single card grid keeps the About page and the links side by side; Refresh
  lives in the toolbar above it.

The reference brand mark is drawn by the host's menu bar, not by this page
(`BRT_LOGO_DATA_URI` in `src/views/MenuBar.tsx`), so the page carries no brand
markup of its own; `-a logo` stays as a CLI action only.

The extension registers itself in the host menu bar from its manifest:

```json
"menus": [{ "menu": "help", "label": "Info", "order": 10 }]
```

so the app shows **Help → Info**, above the built-in *About EAB Tools* item.

## CLI usage

```bash
eab_tools.exe info -a about                    # page content + document list
eab_tools.exe info -a docs                     # document catalogue only
eab_tools.exe info -a open -k user_guide       # EAB User Guide.pdf
eab_tools.exe info -a open -k extension_guide  # BRT_AN_095 guide
eab_tools.exe info -a open -p "C:/x/y.pdf"     # any file or URL
eab_tools.exe info -a terminal                 # write + launch eab_tools.bat
eab_tools.exe info -a terminal -c "eab_tools list-tools"
eab_tools.exe info -a logo
```

| Flag | Meaning |
|------|---------|
| `-a, --action` | `about` (default), `docs`, `open`, `terminal`, `logo` |
| `-k, --doc` | document key: `user_guide`, `extension_guide`, `extensionutil`, `custom_touch`, `about` |
| `-p, --path` | file or URL to open |
| `-c, --command` | command placed in the generated `eab_tools.bat` |

> `info` is an **additive** command — the reference keeps this page in the GUI
> only, so the CLI parity inventory is unchanged.

## Where the guides come from

The PDFs are ~11 MB and ~2 MB, so they are **not** bundled; they are located in
this order:

1. `EAB_DOC_DIR` (environment variable),
2. `<install>/doc` — the reference layout, where `<install>` is derived from the
   `work_space` folder,
3. `<exe_dir>/doc` and `<exe_dir>/../doc`,
4. `%PUBLIC%/Documents/EVE Asset Builder*/doc`,
5. the same `Users\Public\Documents` tree on every other **local fixed** drive,
   so an install on another partition is still found.

Installs found in (4) and (5) are ordered newest first. `EAB_About.txt` is
embedded in the DLL **and is the copy that is rendered**, so the Info tab always
shows the About page of *this* product even when a reference install is present.
`Browse for a document…` opens any file you point it at.

### Why the embedded About copy wins

The reference's `doc/EAB_About.txt` lists the toolchain of its **Python** build —
Python, Nuitka, Pillow, fonttools, pypng, tinynumpy, zopflipy, tqdm, OptiPNG,
JPEGTran, QtProgressCircle and FriBidi — none of which the Rust EAB Tools uses,
and that file is exactly what the document search finds on a machine with the
reference installed. Our copy lists what is really shipped instead:

| listed | why |
|---|---|
| Rust + crates (`serde`, `image`, `png`, `flate2`, `zopfli`, `regex`, `libloading`, `hex`, …) | the toolchain, replacing "Python and its packages" |
| FreeType (`freetype-rs`) / `ttf-parser` | font utilities |
| FFmpeg | video, audio and animation conversion |
| ASTC Encoder | `ASTC_*` bitmaps and extended fonts |
| zlib | compression and the bundled helper executables |
| Tauri / React | desktop shell and user interface |
| FTDI D2XX/FT4222, MSVC + WebView2 runtimes, `jtc.exe`/`bt8xxemu.dll`/`eve_hal.dll` | *Third-party components* paragraph — not open source, so listed separately |

The on-disk file is still shown in the *User Guide* tab with its path and size. A unit test
(`docs::tests::about_lists_only_the_software_this_build_uses`) keeps the removed
names from coming back.

## Building

```bash
cd dev
cargo build --release                # -> target/release/info_cvt.dll
cargo test --release
cargo build --release -p info_test
copy target\release\info_cvt.dll ..\native\info_cvt.dll
```
