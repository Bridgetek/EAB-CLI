# EVE Asset Builder Extensions (`exts/`)

This folder is where **EVE Asset Builder (EAB)** stores its extensions.

---

## Adding & Managing Extensions

### Option 1: From the Desktop App (GUI)
1. Launch **EVE Asset Builder** (`EVE Asset Builder.exe` or `eab_tools.exe --gui`).
2. Open the **Extensions** or **Marketplace** panel to browse, install, enable, disable, or remove extensions.

### Option 2: From the Command Line (CLI)
Run `eab_tools.exe` in a terminal from the EAB folder:

```cmd
:: List all installed extensions
eab_tools.exe list

:: Install an extension package (.eabapk file or URL)
eab_tools.exe install path\to\extension.eabapk

:: Enable or disable an extension
eab_tools.exe enable <extension_id>
eab_tools.exe disable <extension_id>

:: Uninstall an extension
eab_tools.exe uninstall <extension_id>
```

### Option 3: Manual Installation
If you have an `.eabapk` file or an unpacked extension folder (a folder containing a `manifest.json` file), copy it directly into this `exts/` folder and restart EVE Asset Builder.

---

## Good to Know

- **Built-in tools:** In a release installation of EAB, the built-in converters and themes are stored in this folder. Avoid deleting or renaming them unless you intend to remove those features.
- **Shared tools (`dependencies/`):** Extensions rely on shared encoders and runtimes (such as FFmpeg and ASTC) in the `dependencies/` folder next to `eab_tools.exe`. Keep that folder intact so extensions continue to work properly.
- **Troubleshooting:** If an extension stops responding or causes issues, you can stop its background job from **Menu → Config → Task Manager** in the GUI, or disable/uninstall it using the Extensions panel or CLI.
