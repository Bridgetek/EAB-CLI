# Video Converter Extension

Converts a video file into an MJPEG-encoded AVI file (optionally with mono/stereo audio) for EVE display chips.

## Commands

| Command         | Description                                            |
|-----------------|--------------------------------------------------------|
| `bt82x video`     | Convert video to MJPEG AVI for BT82X (EVE 4+)          |
| `bt81x video`  | Convert video to MJPEG AVI for the pre-BT82X chips (BT81X/BT88X/FT8XX) |

## Native implementation

The native DLL (`native/vid_cvt.dll`) implements the same CLI as the reference
`eab_tools.exe` (ported from the Python `vid_cvt.py` / `vid_cvt_2x.py`). It
invokes the bundled/reference `ffmpeg` with identical arguments so the output
binary (`.avi`) and report (`.json`) match the reference tool byte-for-byte.

### ffmpeg discovery

The DLL locates `ffmpeg.exe` in this order:

1. `EAB_VIDEO_FFMPEG` environment variable (path to `ffmpeg.exe`)
2. `<extension>/native/ffmpeg/ffmpeg.exe` (bundled copy)
3. `<extension>/native/ffmpeg.exe`
4. Reference installs:
   - `C:\Users\Public\Documents\EVE Asset Builder 4.3.0_rc1_Apr03\tools\ffmpeg\ffmpeg.exe`
   - `C:\Users\Public\Documents\EVE Asset Builder 4.3.0\tools\ffmpeg\ffmpeg.exe`
5. `PATH`

`ffprobe.exe` (used to read the source sample rate) is expected next to `ffmpeg.exe`.

> For a byte-identical output binary, the ffmpeg used must be the **same build**
> as the reference tool (git-2020-08-06 bundled build). Copy the reference
> `ffmpeg` folder into `native/ffmpeg/` when packaging.

## Sample project generation (`-g`)

The reference tool generates a full EVE HAL C project via its Python `generator`
template system. This extension performs the video conversion (`.avi` + `.json`)
identically, but the C sample-project generation is currently **not** replicated;
`-g` is accepted but only creates a placeholder note. The automated test does not
exercise `-g`.

## Build

See `dev/README.md` for build + test instructions.

## Sample inputs - the "Use Sample" button

`samples/BT82X/` and `samples/Legacy/` hold the reference inputs Input videos loads for the
selected chip group (a tool without a chip has one folder per group anyway, a Legacy-only tool keeps
only `samples/Legacy/`). The button sits in the drop zone's `.dz-corner` while the zone fills the
frame (left of *Show options*) and in the input card's title row right of *Add folder* otherwise; on a
tabbed extension each tab has its own. Clicking it lists the folder through the host
(`API_EAB_listExtAssets`), reads each file with `API_EAB_readExtFile`, queues the paths, sets the chip
and any mandatory option, and leaves the tab's own run button enabled.
