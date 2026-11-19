const AUDIO_FILTERS = [
  { name: 'Audio files', extensions: ['wav', 'mp3', 'ogg', 'oga', 'flac', 'm4a', 'aac', 'opus', 'wma', 'aif', 'aiff', 'ac3', 'w64', 'mp2'] },
];
const AUDIO_EXTS = AUDIO_FILTERS[0].extensions;
const WAV_FILTERS = [
  { name: 'WAV audio', extensions: ['wav'] },
];
function pickInputFiles() {
  if (!isEmbedded()) {
    const raw = prompt('Enter audio file paths (separate several with ;):');
    if (raw) addInputFiles(raw.split(';').map(p => p.trim()).filter(Boolean));
    return;
  }
  API_EAB_pickFiles({ filters: AUDIO_FILTERS }).then(resp => {
    const paths = resp.paths || (resp.path ? [resp.path] : []);
    if (resp.ok && paths.length) addInputFiles(paths);
  }).catch(err => showError('error-panel', 'Failed to open file picker: ' + err));
}
function folderAudioFiles(resp) {
  if (!resp || !resp.ok) return [];
  return resp.files && resp.files.length ? resp.files : (resp.paths || []);
}
function pickInputFolder() {
  if (!isEmbedded()) {
    pickInputFiles();
    return;
  }
  API_EAB_pickFolder({ filters: AUDIO_FILTERS, extensions: AUDIO_EXTS, readBase64: false }).then(resp => {
    const files = folderAudioFiles(resp);
    if (files.length) addInputFiles(files);
  }).catch(err => showError('error-panel', 'Failed to open folder picker: ' + err));
}
function pickValidatorFiles() {
  if (!isEmbedded()) {
    const path = prompt('Enter path to a .wav file:');
    if (path) addValidatorFiles([path]);
    return;
  }
  API_EAB_pickFiles({ filters: WAV_FILTERS, multiple: true, readBase64: false }).then(resp => {
    const paths = (resp.ok && resp.paths) ? resp.paths : [];
    if (paths.length) addValidatorFiles(paths);
  }).catch(err => showError('error-panel-val', 'Failed to open file picker: ' + err));
}
function pickValidatorFolder() {
  if (!isEmbedded()) {
    pickValidatorFiles();
    return;
  }
  API_EAB_pickFolder({ extensions: ['wav'], readBase64: false }).then(resp => {
    const files = folderAudioFiles(resp);
    if (files.length) addValidatorFiles(files);
  }).catch(err => showError('error-panel-val', 'Failed to open folder picker: ' + err));
}
const WAV_FMT_NAMES = { 1: 'PCM', 3: 'IEEE float', 6: 'A-law', 7: 'µ-law', 0x11: 'IMA ADPCM', 0x55: 'MP3' };
let _mediaBlobUrl = '';
function setMediaSource(mediaId, boxId, dataUrl) {
  const media = document.getElementById(mediaId);
  if (!media) return;
  const box = boxId ? document.getElementById(boxId) : null;
  if (_mediaBlobUrl) {
    URL.revokeObjectURL(_mediaBlobUrl);
    _mediaBlobUrl = '';
  }
  if (!dataUrl) {
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
  _mediaBlobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
  media.src = _mediaBlobUrl;
  try { media.load(); } catch (e) { }
  if (box) box.classList.remove('hidden');
  if (typeof window.eabPreviewChanged === 'function') window.eabPreviewChanged();
}
