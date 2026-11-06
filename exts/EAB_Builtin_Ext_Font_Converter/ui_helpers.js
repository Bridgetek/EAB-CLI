function escAttr(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
const fontFiles = [];
let fontBatchRunning = false;
function addFontFiles(paths) {
  for (const p of paths) {
    if (p && fontFiles.indexOf(p) === -1) fontFiles.push(p);
  }
  setCurrentFont(0);
  updateBatchState();
}
function removeFontFile(index) {
  fontFiles.splice(index, 1);
  setCurrentFont(index >= fontFiles.length ? fontFiles.length - 1 : index);
  updateBatchState();
}
function renderFontList() {
  const $host = $('#input-list');
  if (!$host.length) return;
  const current = $('#font-path').val();
  $host.html(fontFiles.map(function (p, i) {
    const cls = 'file-item list-group-item' + (fontBatchRunning && p === current ? ' current' : '');
    return '<div class="' + cls + '" data-path="' + escAttr(p) + '" title="' + escAttr(p) + '">' +
      '<span class="file-item-thumb-placeholder">🔤</span>' +
      '<span class="file-item-name">' + (i + 1) + '. ' + escAttr(baseName(p)) + '</span>' +
      '<span class="file-item-status"></span>' +
      '<div class="file-item-progress"><div class="file-item-progress-fill"></div><span class="file-item-bar-label"></span></div>' +
      '<span class="file-item-controls">' +
      '<button class="btn-icon btn-stop-file" type="button" title="Stop this file" aria-label="Stop this file" onclick="eabStopRow(this)">■</button>' +
      '</span>' +
      '<span class="file-item-remove" title="Remove from the list">×</span>' +
      '</div>';
  }).join(''));
  $host.find('.file-item').on('click', function (e) {
    if ($(e.target).closest('.file-item-remove, .file-item-controls').length) return;
    const idx = fontFiles.indexOf($(this).attr('data-path'));
    if (idx >= 0) setCurrentFont(idx);
  });
  $host.find('.file-item-remove').on('click', function (e) {
    e.stopPropagation();
    const idx = fontFiles.indexOf($(this).closest('.file-item').attr('data-path'));
    if (idx >= 0) removeFontFile(idx);
  });
  if (typeof window.eabPaintRows === 'function') window.eabPaintRows();
  if (typeof window.eabSyncQueueChrome === 'function') window.eabSyncQueueChrome();
}
function setTotalProgress(pct) {
  const $fill = $('#progress-fill, #tab-converter .dz-progress-fill');
  if (!$fill.length) return;
  $fill.css('width', Math.max(0, Math.min(100, pct)) + '%');
}
function updateBatchState() {
  eabPaintBatchPause(fontBatchRunning);
  const $btn = $('#btn-convert');
  if (!$btn.length) return;
  $btn.prop('disabled', fontBatchRunning || fontFiles.length === 0);
  $btn.text(fontFiles.length > 1
    ? '🔤 Convert ' + fontFiles.length + ' fonts'
    : '🔤 Convert');
  if (!fontFiles.length) setTotalProgress(0);
}
let eabBatchPaused = false;
let eabPauseWaiters = [];
function eabBatchGate() {
  if (!eabBatchPaused) return Promise.resolve(true);
  return new Promise(function (resolve) { eabPauseWaiters.push(resolve); });
}
function eabReleaseBatchPause() {
  eabBatchPaused = false;
  const waiters = eabPauseWaiters;
  eabPauseWaiters = [];
  waiters.forEach(function (r) { r(true); });
}
function eabBatchControls() {
  const $box = $('#convert-controls');
  if (!$box.length) return null;
  if ($box.find('#btn-batch-stop').length) return $box;
  $box.html(
    '<button id="btn-batch-pause" class="btn btn-secondary" type="button" onclick="eabToggleBatchPause()">⏸ Pause</button>' +
    '<button id="btn-batch-stop" class="btn btn-secondary" type="button" onclick="eabStopBatch()">■ Stop all</button>');
  return $box;
}
function eabPaintBatchPause(running) {
  const box = eabBatchControls();
  if (!box) return;
  box.toggleClass('hidden', !running);
  const $btn = $('#btn-batch-pause');
  if (!$btn.length) return;
  $btn.text(eabBatchPaused ? '▶ Resume' : '⏸ Pause');
  $btn.attr('title', eabBatchPaused
    ? 'Continue with the next file'
    : 'Pause after the file in flight finishes');
  $btn.toggleClass('is-paused', eabBatchPaused);
}
window.eabToggleBatchPause = function () {
  if (eabBatchPaused) eabReleaseBatchPause(); else eabBatchPaused = true;
  eabPaintBatchPause(fontBatchRunning);
};
window.eabStopBatch = function () {
  eabReleaseBatchPause();
  window.eabCancelBatch();
  const $cur = $('#input-list .file-item.current .btn-stop-file').first();
  if ($cur.length) $cur.trigger('click');
  else cancelConvert();
  eabPaintBatchPause(fontBatchRunning);
};
async function startBatch() {
  if (fontBatchRunning) return;
  if (fontFiles.length <= 1) return startConvert();
  fontBatchRunning = true;
  updateBatchState();
  for (let i = 0; i < fontFiles.length && fontBatchRunning; i++) {
    if (!(await eabBatchGate())) break;
    setCurrentFont(i);
    await startConvert();
    setTotalProgress(((i + 1) / fontFiles.length) * 100);
  }
  fontBatchRunning = false;
  eabReleaseBatchPause();
  updateBatchState();
}
window.eabCancelBatch = function () { fontBatchRunning = false; };
