# NOTICE — sampleapp 4.5.0

* **Software:** SampleApp (EVE application template)
* **Source:** EVE Asset Builder 4.5.0 reference install
* **License:** Bridgetek (reference bundle)

Payload: the `SampleApp` project tree (`common/`, `Flash/`, `Hdr/`,
`Project/`, `Src/`, `ReadMe.txt`).

The Pre-BT82X font converter clones this tree next to the generated font when
`--gen-source` is given, then patches `Src/eab.c` and registers the generated
`.c` file in the MSVC and emulator project files. The tree is kept verbatim so
the cloned project is byte-identical to the reference output.
