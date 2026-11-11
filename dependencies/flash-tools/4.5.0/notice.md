# NOTICE — flash-tools 4.5.0

* **Software:** flash-tools (`flash.exe`, `flash_2x.exe`, `patch_nand.bin`)
* **Source:** EVE Asset Builder 4.5.0 reference install
* **License:** Bridgetek (reference bundle)

Payload: `flash.exe`, `flash_2x.exe`, `patch_nand.bin`

SPI flash programmers for BT82X (`flash.exe`) and pre-BT82X (`flash_2x.exe`),
plus the NAND patch blob `flash.exe` loads at start-up.

Previously bundled per extension; it now lives once in the shared dependency
store and is linked into each consumer's `native/` folder by the Package
Manager.
