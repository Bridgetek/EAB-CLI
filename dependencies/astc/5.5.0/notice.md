# NOTICE — astc 5.5.0

* **Software:** astc
* **Source:** https://github.com/ARM-software/astc-encoder
* **License:** Apache-2.0

Payload: `astcenc.exe`

ASTC texture encoder used for ASTC_* bitmap and extended-font formats. The reference binary is kept verbatim so encoded blocks stay byte-identical.

Previously bundled per extension; it now lives once in the shared dependency
store and is linked into each consumer's `native/` folder by the Package
Manager.
