# NOTICE — ftdi 3.2.14

* **Software:** ftdi
* **Source:** EVE Asset Builder 4.5.0 reference install
* **License:** FTDI (reference bundle)

Payload: `libMPSSE.dll`, `LibFT4222-64.dll`

FTDI MPSSE / FT4222 driver DLLs used to talk to the EVE hardware.

Previously bundled per extension; it now lives once in the shared dependency
store and is linked into each consumer's `native/` folder by the Package
Manager.
