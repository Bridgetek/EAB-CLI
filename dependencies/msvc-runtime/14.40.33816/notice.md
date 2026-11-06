# NOTICE — msvc-runtime 14.40.33816

* **Software:** msvc-runtime
* **Source:** https://learn.microsoft.com/cpp/windows/latest-supported-vc-redist
* **License:** Microsoft Visual C++ Redistributable (redistributable terms)

Payload: `msvcp140.dll`, `vcruntime140.dll`, `vcruntime140_1.dll`, `concrt140.dll`

Visual C++ runtime DLLs required by the FTDI/EVE emulation DLLs and the bundled helper executables.

Previously bundled per extension; it now lives once in the shared dependency
store and is linked into each consumer's `native/` folder by the Package
Manager.
