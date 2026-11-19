function onKeepAudioToggle() {
  const on = $('#keep-audio').prop('checked');
  $('#audio-options').toggleClass('hidden', !on);
}
let _media = null;
let _mediaPath = '';
let _mediaToken = 0;
let _mediaBlobUrl = '';
let _mediaStaleBlobUrl = '';
let _mediaIsProxy = false;
let _mediaProxyFor = '';
function resetMediaProxyFlags() {
  _mediaIsProxy = false;
  _mediaProxyFor = '';
}
function mediaNote(text) {
  const note = document.getElementById('pv-note');
  const media = document.getElementById('pv-media');
  if (note) {
    note.textContent = text || '';
    note.classList.toggle('hidden', !text);
  }
  if (media) media.classList.toggle('hidden', !!text);
}
function mediaName(path) {
  const s = String(path || '');
  const at = Math.max(s.lastIndexOf('/'), s.lastIndexOf('\\'));
  return at >= 0 ? s.slice(at + 1) : s;
}
function mediaUnsupportedNote(path, detail) {
  const why = detail ? ' (' + String(detail).slice(0, 160) + ')' : '';
  mediaNote('“' + mediaName(path) + '” cannot be played in this window: its codec is not one the built-in '
    + 'player decodes, and the ffmpeg preview could not be built' + why + '. The file is still valid — '
    + 'press Convert to build the EVE video.');
  if (typeof setPreviewStatus === 'function') setPreviewStatus('Preview unavailable');
}
/* The webview decodes H.264/VP8/VP9/AV1 only. For anything else (AVI with MS-MPEG4,
   WMV, DV…) ask the host to re-encode a proxy with the bundled ffmpeg. */
function requestMediaProxy(token) {
  const path = _mediaPath;
  if (_mediaIsProxy) return mediaUnsupportedNote(path);
  if (!path || _mediaProxyFor === path || typeof window.API_EAB_getMediaPreview !== 'function') {
    return mediaUnsupportedNote(path);
  }
  _mediaProxyFor = path;
  mediaNote('Preparing a playable preview of “' + mediaName(path) + '” with ffmpeg…');
  if (typeof setPreviewStatus === 'function') setPreviewStatus('Preparing preview…');
  window.API_EAB_getMediaPreview({ path: path }).then(function (res) {
    if (token !== _mediaToken) return;
    if (!res || !res.ok || !res.data) return mediaUnsupportedNote(path, res && res.error);
    _mediaIsProxy = true;
    setMediaSource('pv-media', 'pv-player', res.data);
    if (typeof setPreviewStatus === 'function') setPreviewStatus('Preview (converted)');
  }, function () {
    if (token !== _mediaToken) return;
    mediaUnsupportedNote(path);
  });
}
function setMediaSource(mediaId, boxId, dataUrl) {
  const media = document.getElementById(mediaId);
  if (!media) return;
  // Detach first, and only recycle the blob the element has already left behind:
  // revoking the blob it is still playing makes the element fire `error`, which would
  // start a proxy for the file that is about to load normally.
  media.onerror = null;
  media.onloadedmetadata = null;
  const box = boxId ? document.getElementById(boxId) : null;
  if (_mediaStaleBlobUrl) {
    URL.revokeObjectURL(_mediaStaleBlobUrl);
    _mediaStaleBlobUrl = '';
  }
  _mediaStaleBlobUrl = _mediaBlobUrl;
  _mediaBlobUrl = '';
  if (!dataUrl) {
    mediaNote('');
    media.removeAttribute('src');
    try { media.load(); } catch (e) { }
    if (box) box.classList.add('hidden');
    return;
  }
  const text = String(dataUrl);
  const comma = text.indexOf(',');
  const head = text.slice(0, comma);
  const mime = (head.split(':')[1] || '').split(';')[0] || 'application/octet-stream';
  const binary = atob(text.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  mediaNote('');
  media.onloadedmetadata = function () {
    if (typeof setPreviewStatus === 'function') setPreviewStatus(_mediaIsProxy ? 'Preview (converted)' : 'Ready');
  };
  media.onerror = function () {
    requestMediaProxy(_mediaToken);
  };
  _mediaBlobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
  media.src = _mediaBlobUrl;
  try { media.load(); } catch (e) { }
  if (box) box.classList.remove('hidden');
  if (typeof window.eabPreviewChanged === 'function') window.eabPreviewChanged();
}
