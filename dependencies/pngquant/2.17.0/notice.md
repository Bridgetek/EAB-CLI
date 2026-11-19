# NOTICE — pngquant 2.17.0

* **Software:** pngquant
* **Source:** https://pngquant.org
* **License:** GPL-3.0-or-later (or a commercial licence from the author)

Payload: `pngquant.exe`, `COPYRIGHT`, `notice.md`

pngquant palette quantizer used by the image converter for every paletted
output format.

Previously bundled per extension; it now lives once in the shared dependency
store and is linked into each consumer's `native/` folder by the Package
Manager.
