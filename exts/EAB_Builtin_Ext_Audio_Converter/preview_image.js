let _previewToken = 0;
function previewReset(message) {
  _previewToken++;
  const setText = (id, text) => { const $el = $('#' + id); if ($el.length) $el.text(text); };
  ['ap-name', 'ap-format', 'ap-rate', 'ap-channels', 'ap-duration', 'ap-size'].forEach(id => setText(id, '-'));
  const $meta = $('#ap-meta');
  if ($meta.length) $meta.addClass('hidden');
  const $empty = $('#ap-empty');
  if ($empty.length) {
    $empty.text(message || 'No audio file selected');
    $empty.removeClass('hidden');
  }
  setText('ap-note', WAVE_NOTE);
  clearWaveform();
  setMediaSource('ap-media', 'ap-player', '');
}
function clearWaveform() {
  const $canvas = $('#ap-wave');
  if (!$canvas.length) return;
  $canvas.addClass('hidden');
  const $note = $('#ap-note');
  if ($note.length) $note.removeClass('hidden');
}
function drawWaveform(bytes, info) {
  const canvas = $('#ap-wave').get(0);
  if (!canvas) return;
  const $note = $('#ap-note');
  const parent = canvas.parentElement;
  const cssW = parent ? Math.max(200, Math.round(parent.clientWidth)) : 480;
  canvas.width = cssW;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');
  const css = getComputedStyle($('html').get(0));
  const bg = (css.getPropertyValue('--bg-secondary') || '').trim() || '#1e1e1e';
  const accent = (css.getPropertyValue('--accent') || '').trim() || '#3b82f6';
  const dim = (css.getPropertyValue('--text-dim') || '').trim() || '#888';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = dim;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  const bytesPerSample = Math.max(1, info.bitsPerSample / 8);
  if (info.audioFormat !== 1 || bytesPerSample !== 2) {
    if ($note.length) $note.text('Waveform supports 16-bit PCM (this file is ' +
      (WAV_FMT_NAMES[info.audioFormat] || 'format ' + info.audioFormat) + ').');
    return;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const stepFrames = Math.max(1, Math.floor(info.frames / canvas.width));
  const mid = canvas.height / 2;
  ctx.fillStyle = accent;
  for (let x = 0; x < canvas.width; x++) {
    let peak = 0;
    const startFrame = x * stepFrames;
    for (let f = 0; f < stepFrames; f++) {
      const frame = startFrame + f;
      if (frame >= info.frames) break;
      const at = info.dataOffset + frame * bytesPerSample * info.channels;
      if (at + 2 > bytes.byteLength) break;
      const sample = Math.abs(view.getInt16(at, true)) / 32768;
      if (sample > peak) peak = sample;
    }
    const h = Math.max(1, Math.round(peak * (canvas.height - 8)));
    ctx.fillRect(x, mid - h / 2, 1, h);
  }
  if ($note.length) $note.text('Waveform: peak per column, 16-bit PCM.');
}
async function updateAudioPreview(path) {
  if (!path) return previewReset();
  previewReset('');
  const token = _previewToken;
  const name = path.split(/[\\/]/).pop() || path;
  const setText = (id, text) => { const $el = $('#' + id); if ($el.length) $el.text(text); };
  const $meta = $('#ap-meta');
  const $empty = $('#ap-empty');
  if ($meta.length) $meta.removeClass('hidden');
  if ($empty.length) $empty.addClass('hidden');
  setText('ap-name', name);
  setText('ap-format', (name.split('.').pop() || '').toUpperCase());
  if (!isEmbedded()) {
    setText('ap-rate', 'host only');
    return;
  }
  try {
    const resp = await eabSampleData(path);
    if (!resp || !resp.ok || !resp.data) throw new Error(resp && resp.error ? resp.error : 'read failed');
    if (token === _previewToken) setMediaSource('ap-media', 'ap-player', resp.data);
    const buffer = await (await fetch(resp.data)).arrayBuffer();
    if (token !== _previewToken) return;
    const bytes = new Uint8Array(buffer);
    setText('ap-size', formatBytes(bytes.byteLength));
    const info = parseWavHeader(bytes);
    if (!info) {
      setText('ap-rate', '-');
      setText('ap-channels', '-');
      setText('ap-duration', '-');
      clearWaveform();
      const $note = $('#ap-note');
      if ($note.length) $note.text('Not a RIFF/WAVE file — metadata is only read from WAV headers.');
      return;
    }
    setText('ap-format', (WAV_FMT_NAMES[info.audioFormat] || 'format ' + info.audioFormat) + ' · ' + info.bitsPerSample + '-bit');
    setText('ap-rate', info.sampleRate.toLocaleString() + ' Hz');
    setText('ap-channels', info.channels === 1 ? 'mono' : info.channels === 2 ? 'stereo' : info.channels + ' ch');
    setText('ap-duration', formatDuration(info.duration));
    const $canvas = $('#ap-wave');
    if ($canvas.length) $canvas.removeClass('hidden');
    drawWaveform(bytes, info);
  } catch (err) {
    setText('ap-rate', 'unreadable');
    clearWaveform();
    const $note = $('#ap-note');
    if ($note.length) $note.text('Could not read the file: ' + err);
  }
}
const _previewSetCurrentInput = setCurrentInput;
