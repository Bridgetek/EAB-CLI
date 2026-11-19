/* Playback speed for the preview: the Options "Playback FPS" field wins, otherwise the
   GIF's own frame delays. */
function previewIntervalMs() {
  const el = document.getElementById('opt-fps');
  const fps = el ? parseFloat(el.value) : 0;
  if (!isFinite(fps) || fps <= 0) return pvAverageDelay();
  return Math.max(16, Math.round(1000 / fps));
}
function restartPreviewTimer() {
  if (!state.playing || !pvFrames.length) return;
  clearInterval(state.playTimer);
  state.playTimer = setInterval(pvPlaybackTick, previewIntervalMs());
}
function setCurrentGif(index) {
  const i = (index >= 0 && index < gifFiles.length) ? index : 0;
  const path = gifFiles[i] || '';
  state.gifFile = path || null;
  const $el = $('#gif-path');
  if ($el.length) $el.val(path);
  renderGifList();
  if (path) loadGifPreview(path);
}
function pvCloseFrames() {
  for (const f of pvFrames) {
    try { f.image.close(); } catch (e) {  }
  }
  pvFrames = [];
  state.gifFrames = [];
}
function pvReset(message) {
  pvToken++;
  pvStopPlayback();
  pvCloseFrames();
  state.currentFrame = 0;
  ['pv-size', 'pv-frames', 'pv-delay', 'pv-duration', 'pv-filesize'].forEach(id => pvSetText(id, '-'));
  const canvas = $('#preview-canvas').get(0);
  if (canvas) {
    canvas.width = 320;
    canvas.height = 240;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }
  const $strip = $('#pv-strip');
  if ($strip.length) $strip.html('');
  const $scrub = $('#pv-scrub');
  if ($scrub.length) {
    $scrub.attr('max', '0');
    $scrub.val('0');
    $scrub.prop('disabled', true);
  }
  pvSetText('frame-indicator', '0 / 0');
  pvSetText('frame-count', '-');
  pvSetText('frame-size', '-');
  $('#opt-frames').val('-');
  const $info = $('#gif-info');
  if ($info.length) $info.addClass('hidden');
  const $note = $('#pv-note');
  if ($note.length) {
    $note.text(message || 'Select a GIF to preview its frames.');
    $note.removeClass('hidden');
  }
}
function pvThumb(image) {
  const h = Math.max(1, Math.round(PV_THUMB_W * (image.displayHeight / image.displayWidth)));
  const canvas = $('<canvas>').get(0);
  canvas.width = PV_THUMB_W;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, PV_THUMB_W, h);
  return canvas.toDataURL('image/png');
}
async function decodeGifFrames(bytes, aborted) {
  if (typeof ImageDecoder === 'undefined') return null;
  const decoder = new ImageDecoder({ data: bytes, type: 'image/gif' });
  await decoder.completed;
  if (decoder.tracks && decoder.tracks.ready) await decoder.tracks.ready;
  const track = decoder.tracks ? decoder.tracks.selectedTrack : null;
  const count = track ? track.frameCount : 0;
  const frames = [];
  for (let i = 0; i < count; i++) {
    if (aborted && aborted()) {
      for (const f of frames) { try { f.image.close(); } catch (e) {  } }
      return [];
    }
    const { image } = await decoder.decode({ frameIndex: i });
    frames.push({ image, duration: image.duration ? image.duration / 1000 : 0 });
  }
  return frames;
}
function pvDrawFrame(index) {
  const frame = pvFrames[index];
  const canvas = $('#preview-canvas').get(0);
  if (!frame || !canvas) return;
  if (canvas.width !== frame.image.displayWidth) canvas.width = frame.image.displayWidth;
  if (canvas.height !== frame.image.displayHeight) canvas.height = frame.image.displayHeight;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(frame.image, 0, 0);
  const $items = $('#pv-strip > *');
  $items.each(function (i) { $(this).toggleClass('current', i === index); });
  const cur = $items.get(index);
  if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  const $scrub = $('#pv-scrub');
  if ($scrub.length) $scrub.val(String(index));
  pvSetText('frame-indicator', (index + 1) + ' / ' + pvFrames.length);
}
