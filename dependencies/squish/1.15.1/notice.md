# NOTICE — squish 1.15.1

* **Software:** libsquish (`Squish.dll`) + `squishpng.exe`
* **Source:** https://github.com/oblivioncth/libsquish/releases/tag/v1.15.1.4
* **License:** MIT

Payload: `squishpng.exe`, `Squish.dll`, `libpng16.dll`

`squishpng.exe` compresses the DXT1 tile PNG into raw S3TC blocks and is used by
the image converter for the legacy `DXT1_*` formats. `libpng16.dll` is required
by `squishpng.exe` to decode that PNG; `Squish.dll` is loaded through the FFI
path. Previously bundled per extension, they now live once in the shared
dependency store and are linked into the consumer's `native/` folder by the
Package Manager.
