# Audio Converter

Convert and validate audio for EVE display chips. Ported from the EAB "Audio
Utilities" tab (`audcvt.cpp` = BT82X, `audcvt_2x.cpp` = Legacy,
`audio_validator_form.cpp` = validator) and the Python converters
(`aud_cvt.py`, `aud_cvt_2x.py`) into a native Rust DLL (`audio_cvt.dll`).

The converters invoke **ffmpeg** (the reference-bundled `ffmpeg\ffmpeg.exe`)
with the exact same command line as the reference, so the generated
`.wav`/`.raw`/`.mov` files and the metadata `.json` are byte-identical.

Validation is no longer done here. The reference spawned `AudioVerify.exe`, which
needed its own `eve_hal.dll` + `bt8xxemu.dll`; this extension now asks the
**Emulator Provider** extension to play the file on the shared emulator instead
(`API_EAB_callService` → `eve.emulator` → `audioValidate`). That removed the
`eve-emu` and `ftdi` dependencies and the two emulator DLLs from `native/`.

## Commands

| Command | Chip | Description |
|---------|------|-------------|
| `bt82x audio` | BT82X | Convert audio (ffmpeg) — formats LINEAR/ULAW/ADPCM/S16/S16S |
| `bt81x audio` | Legacy | Convert audio (ffmpeg) — PCM/uLaw/ADPCM, optional .mov |

## CLI Usage

```bash
eab_tools.exe bt82x audio -i <in> -o <dir> [-f 0..4] [-s rate] [-c wav|raw] [-m mix|left|right] [-r] [-p opts]
eab_tools.exe bt81x audio -i <in> -o <dir> -f 0..2 -s <rate> [-w] [-p opts]
```

| Arg (bt82x) | Default | Description |
|-----------|---------|-------------|
| `-i, --infile` | — | Input audio file (required) |
| `-o, --outfolder` | — | Output folder (required) |
| `-f, --outformat` | `0` | 0=LINEAR, 1=ULAW, 2=ADPCM, 3=S16, 4=S16S |
| `-s, --sample-rate` | `0` | 0 or one of 8000…48000 (0 = auto) |
| `-c, --container` | `wav` | wav or raw |
| `-m, --channel` | `mix` | mix, left, right |
| `-r, --remove-list-chunk` | — | Remove LIST chunk from WAV |
| `-p, --ffmpeg-options` | — | Extra FFmpeg options |

| Arg (Legacy) | Default | Description |
|--------------|---------|-------------|
| `-i, --input` | — | Input audio file (required) |
| `-o, --output` | — | Output folder (required) |
| `-f, --audio-codec` | `0` | 0=PCM s8, 1=uLaw, 2=IMA ADPCM |
| `-s, --sample-rate` | — | 0 or one of 8000…48000 (required) |
| `-w, --writehdr` | — | Write header (output `.mov`) |
| `-p, --ffmpeg-options` | — | Extra FFmpeg options |

## GUI

Reproduces the EAB tab: an Audio Converter view (Chip combo BT82X /
Legacy that switches the per-chip option panels) and an Audio Validator view
(multi-file list + Validate). The BT82X panel offers container / S16S / S16 /
channel / sample rate / remove-LIST / ffmpeg options; the Legacy panel
offers PCM/uLaw/ADPCM, sample rate, write-header and ffmpeg options.

## Notes

- `-g/--gen-src` (bt82x) and `-g/--gen-app` (Legacy) sample-app generation is
  **not supported** in this port (the reference uses the large EVE HAL project
  generator / a 105-file SampleApp template clone). Passing `-g` returns an
  error.
- The validator has no reference CLI sub-command; it is compared against
  running `AudioVerify.exe <file>` directly. In this port the Validator tab calls
  the `eve.emulator` service's `audioValidate` method instead, so the comparison
  is against the emulator's own audio engine.

## Building

```bash
cd dev
./release.sh          # builds audio_cvt.dll + test loader, stages release/
cd dev/testscript
powershell -File testscript_audio_converter.ps1   # vs reference eab_tools.exe + AudioVerify.exe
```

## Sample inputs - the "Use Sample" button

`samples/BT82X/` and `samples/Legacy/` hold the reference inputs Converter and Validator tabs loads for the
selected chip group (a tool without a chip has one folder per group anyway, a Legacy-only tool keeps
only `samples/Legacy/`). The button sits in the drop zone's `.dz-corner` while the zone fills the
frame (left of *Show options*) and in the input card's title row right of *Add folder* otherwise; on a
tabbed extension each tab has its own. Clicking it lists the folder through the host
(`API_EAB_listExtAssets`), reads each file with `API_EAB_readExtFile`, queues the paths, sets the chip
and any mandatory option, and leaves the tab's own run button enabled.
