# NOTICE — eve-emu 5.0.25

* **Software:** eve-emu
* **Source:** EVE Asset Builder 4.5.0 reference install
* **License:** Bridgetek (reference bundle)

Payload: `bt8xxemu.dll`, `eve_hal.dll`

BT8xx/EVE emulation DLLs used by the reference helper binaries (audio verification).

Previously bundled per extension; it now lives once in the shared dependency
store and is linked into each consumer's `native/` folder by the Package
Manager.
