function isEmbedded() {
  return window.parent !== window;
}
const inputFiles = [];let batchRunning = false;
function addInputFiles(paths) {
  for (const p of paths) {
    if (p && inputFiles.indexOf(p) === -1) inputFiles.push(p);
  }
  setCurrentInput(0);
  updateBatchState();
}
function removeInputFile(index) {
  inputFiles.splice(index, 1);
  setCurrentInput(index >= inputFiles.length ? inputFiles.length - 1 : index);
  updateBatchState();
}
function setCurrentInput(index) {
  const $el = $('#input-path');
  if (!$el.length) return;
  $el.val(inputFiles[index >= 0 && index < inputFiles.length ? index : 0] || '');
  renderInputList();
}
function escAttr(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function renderInputList() {
  const $host = $('#input-list');
  if (!$host.length) return;
  const current = $('#input-path').val();
  $host.html(inputFiles.map((p, i) => {
    const name = baseName(p);
    const cls = 'file-item list-group-item' + (batchRunning && p === current ? ' current' : '');
    return '<div class="' + cls + '" data-path="' + escAttr(p) + '" title="' + escAttr(p) + '">' +
      '<span class="file-item-thumb-placeholder">🎵</span>' +
      '<span class="file-item-name">' + (i + 1) + '. ' + escAttr(name) + '</span>' +
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
    const idx = inputFiles.indexOf($(this).attr('data-path'));
    if (idx >= 0) setCurrentInput(idx);
  });
  $host.find('.file-item-remove').on('click', function (e) {
    e.stopPropagation();
    const idx = inputFiles.indexOf($(this).closest('.file-item').attr('data-path'));
    if (idx >= 0) removeInputFile(idx);
  });
  if (typeof window.eabPaintRows === 'function') window.eabPaintRows();
  if (typeof window.eabSyncQueueChrome === 'function') window.eabSyncQueueChrome();
}
function setTotalProgress(pct) {
  const $fill = $('#progress-fill, .dz-progress-fill');
  if (!$fill.length) return;
  $fill.css('width', Math.max(0, Math.min(100, pct)) + '%');
}
function updateBatchState() {
  eabPaintBatchPause(batchRunning);
  const $btn = $('#btn-convert');
  if (!$btn.length) return;
  $btn.prop('disabled', batchRunning || inputFiles.length === 0);
  $btn.text(inputFiles.length > 1 ? '🎵 Convert ' + inputFiles.length + ' files' : '🎵 Convert');
  renderInputList();
  if (!inputFiles.length) setTotalProgress(0);
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
    '<button id="btn-batch-pause" class="btn btn-secondary align-items-center justify-content-center" type="button" onclick="eabToggleBatchPause()">⏸ Pause</button>' +
    '<button id="btn-batch-stop" class="btn btn-secondary align-items-center justify-content-center" type="button" onclick="eabStopBatch()">■ Stop all</button>');
  return $box;
}
function eabPaintBatchPause(running) {
  const box = eabBatchControls();
  if (!box) return;
  $(box).toggleClass('hidden', !running);
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
  eabPaintBatchPause(batchRunning);
};
window.eabStopBatch = function () {
  eabReleaseBatchPause();
  if (typeof window.eabCancelBatch === 'function') window.eabCancelBatch();
  const $cur = $('#input-list .file-item.current .btn-stop-file').first();
  if ($cur.length) $cur.trigger('click');
  eabPaintBatchPause(batchRunning);
};
async function startBatch() {
  if (batchRunning) return;
  if (inputFiles.length <= 1) return startConvert();
  batchRunning = true;
  updateBatchState();
  for (let i = 0; i < inputFiles.length && batchRunning; i++) {
    if (!(await eabBatchGate())) break;
    setCurrentInput(i);
    await startConvert(true);
    setTotalProgress(((i + 1) / inputFiles.length) * 100);
  }
  batchRunning = false;
  eabReleaseBatchPause();
  updateBatchState();
}
window.eabCancelBatch = function () { batchRunning = false; };
function formatDuration(seconds) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  return m + ':' + rest.toFixed(2).padStart(5, '0');
}
