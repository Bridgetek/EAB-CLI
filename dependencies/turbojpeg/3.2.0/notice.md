# NOTICE — turbojpeg 3.2.0

* **Software:** libjpeg-turbo (`turbojpeg.dll`)
* **Source:** https://github.com/libjpeg-turbo/libjpeg-turbo/releases/tag/3.2.0
* **License:** BSD-3-Clause / IJG (see `LICENSE.md`)

Payload: `turbojpeg.dll`, `LICENSE.md`, `notice.md`

libjpeg-turbo runtime used by the image converter for JPEG decode/encode.

Previously bundled per extension; it now lives once in the shared dependency
store and is linked into each consumer's `native/` folder by the Package
Manager.
