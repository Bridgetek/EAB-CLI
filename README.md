# EVE Asset Builder (EAB) 

**EVE Asset Builder (EAB)** is a desktop and command-line utility for preparing images, fonts, audio, animations, videos, and flash images for Bridgetek EVE display controllers (**FT80x, FT81x, BT88x, BT81x, and BT82x**).

This is a **Rust-based update** compared to the previous version.

---

## System Requirements

* **Operating System:** Windows 10 or Windows 11 (64-bit)
* **Disk Space:** ~260 MB
* **Runtime:** Microsoft Edge WebView2 (preinstalled on Windows 10/11; required for GUI mode)

---


## Getting Started

### Option 1: Launch the Desktop App (GUI)
1. Open a terminal or Command Prompt in the `EAB-CLI` folder.
2. Run:
   ```cmd
   eab_tools.exe --gui
   ```
   *(Or use the shorthand `eab_tools.exe -g`)*

### Option 2: Use the Command Line (CLI)
To convert assets via scripts or terminal commands, run `eab_tools.exe` followed by your target chip and desired tool:

```cmd
eab_tools.exe <chip> <tool> [options]
```

**Common Examples:**
```cmd
:: Convert a PNG image to RGB8 format for a BT82x display
eab_tools.exe bt82x img_cvt -i logo.png -o .\output -f RGB8

:: Convert a PNG image to RGB565 format for an FT80x display
eab_tools.exe ft80x img_cvt -i logo.png -o .\output -f RGB565

:: View all available tools or check the app version
eab_tools.exe list-tools
eab_tools.exe --version
```

> **Tip:** Add `--help` after any command to see all available settings and options for that specific tool (e.g., `eab_tools.exe bt82x img_cvt --help`).

---

## Selecting Your Target Chip

Specify your EVE chip family or exact part number as the first argument. If omitted, EAB defaults to **BT82X**.

| Chip Token | Supported Hardware |
| :--- | :--- |
| `ft80x` | FT800, FT801 (or `eve1`) |
| `ft81x` | FT810, FT811, FT812, FT813 (or `eve2`) |
| `bt88x` | BT880, BT881, BT882, BT883 |
| `bt81x` | BT815, BT816 (or `eve3`), BT817, BT818 (or `eve4`) |
| `bt82x` | BT820 (or `eve5`) — **Default** |

```cmd
:: Both commands target the same BT81x toolset
eab_tools.exe bt817 img_cvt -i icon.png -o .\out
eab_tools.exe bt81x img_cvt -i icon.png -o .\out
```

---

## Folder Overview


```text
EAB-CLI/
├── eab_tools.exe     # Main application (CLI and GUI)
├── exts/             # Built-in converters, utilities, and GUI themes
└── dependencies/     # Bundled encoders and runtimes (FFmpeg, ASTC, FTDI, etc.)
```

---

