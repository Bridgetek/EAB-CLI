# NOTICE — ffmpeg 4.3

This dependency package contains the FFmpeg shared build that ships with the
EVE Asset Builder 4.5.0 reference install. It is redistributed unmodified.

* **Software:** FFmpeg
* **Version string:** `git-2020-08-06-2c35797`
* **Libraries:** libavcodec 58.99.100, libavformat 58.49.100, libavfilter 7.87.100,
  libavdevice 58.11.101, libavutil 58.100, libswscale 5.8.100, libswresample 3.8.100
* **Source:** https://ffmpeg.org/
* **License:** GPL-3.0-or-later (the reference build is configured with `--enable-gpl`)

The binaries are the exact files the reference `eab_tools` uses, so converted
output is byte-identical to EAB 4.5.0. Do not substitute another FFmpeg build
without re-validating the video/audio comparison testscripts.

Previously every consumer extension bundled its own copy of this payload
(`audio_utilities/native/ffmpeg`, `video_converter/native/ffmpeg` — 2 × 74.2 MB).
It now lives once in the shared dependency store and is linked into each
extension's `native/ffmpeg` by the host Package Manager.
