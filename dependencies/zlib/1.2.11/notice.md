# NOTICE — zlib 1.2.11

* **Software:** zlib
* **Source:** https://zlib.net/
* **License:** zlib

Payload: `zlib.dll`

zlib runtime DLL required by the Flash/audio helper executables.

Previously bundled per extension; it now lives once in the shared dependency
store and is linked into each consumer's `native/` folder by the Package
Manager.
