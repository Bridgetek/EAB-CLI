const TOUCH_SOURCE_FILTERS = [
  { name: 'C source', extensions: ['c', 'cpp', 'h', 'hpp'] },
  { name: 'Text', extensions: ['txt'] },
];
const TOUCH_SOURCE_EXTS = ['c', 'cpp', 'h', 'hpp', 'txt'];
function isEmbedded() {
  return window.parent !== window;
}
function baseName(p) { return String(p).split(/[\\/]/).pop() || ''; }
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escAttr(s) {
  return escHtml(String(s == null ? '' : s)).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function setText($el, text) {
  if (!$el || !$el.length) return;
  const node = $el.get(0).firstChild;
  if (!node || node.nodeType !== 3) { $el.text(text); return; }
  if (node.nodeValue !== text) node.nodeValue = text;
}
function fmtSecs(ms) {
  if (!(ms > 0)) return '';
  const s = ms / 1000;
  return s < 10 ? s.toFixed(1) + 's' : Math.round(s) + 's';
}
function touchSourceFiles(resp) {
  if (!resp || !resp.ok) return [];
  return resp.files && resp.files.length ? resp.files : (resp.paths || []);
}
function pickFiles(promptText, filters) {
  if (!isEmbedded()) {
    const raw = prompt(promptText);
    return Promise.resolve(raw ? raw.split(';').map(p => p.trim()).filter(Boolean) : []);
  }
  return API_EAB_pickFiles({ filters: filters, multiple: true, readBase64: false })
    .then(resp => touchSourceFiles(resp))
    .catch(() => []);
}
function pickInputFiles() {
  if (!isEmbedded()) {
    const raw = prompt('Enter touch C source paths (separate several with ;):');
    if (raw) addInputFiles(raw.split(';').map(p => p.trim()).filter(Boolean));
    return;
  }
  pickFiles('Enter path to touch C source files:', TOUCH_SOURCE_FILTERS).then(paths => {
    if (paths && paths.length) addInputFiles(paths);
  });
}
function pickInputFolder() {
  if (!isEmbedded()) {
    pickInputFiles();
    return;
  }
  API_EAB_pickFolder({ filters: TOUCH_SOURCE_FILTERS, extensions: TOUCH_SOURCE_EXTS, readBase64: false })
    .then(resp => {
      const files = touchSourceFiles(resp);
      if (files.length) addInputFiles(files);
    })
    .catch(err => showError('Failed to open folder picker: ' + err));
}
const inputFiles = [];
let batchRunning = false;
function addInputFiles(paths) {
  let added = 0;
  for (const p of paths) {
    if (p && inputFiles.indexOf(p) === -1) { inputFiles.push(p); added++; }
  }
  const first = added ? inputFiles.length - added : 0;
  setCurrentInput(first);
  updateBatchState();
}
function removeInputFile(index) {
  inputFiles.splice(index, 1);
  setCurrentInput(index >= inputFiles.length ? inputFiles.length - 1 : index);
  updateBatchState();
}
function setCurrentInput(index) {
  const path = inputFiles[index >= 0 && index < inputFiles.length ? index : 0] || '';
  const $el = $('#input-path');
  if ($el.length) $el.val(path);
  renderInputList();
}
function renderInputList() {
  const $host = $('#input-list');
  if (!$host.length) return;
  const current = $('#input-path').val();
  $host.html(inputFiles.map((p, i) => {
    const cls = 'file-item list-group-item' + (batchRunning && p === current ? ' current' : '');
    return '<div class="' + cls + '" data-path="' + escAttr(p) + '" title="' + escAttr(p) + '">' +
      '<span class="file-item-thumb-placeholder">📄</span>' +
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
function setBatchText(text) {
  $('#row-progress-status').text(text || '');
}
function updateBatchState() {
  eabPaintBatchPause(batchRunning);
  const $btn = $('#btn-run');
  if ($btn.length) {
    $btn.prop('disabled', batchRunning || inputFiles.length === 0);
    $btn.text(inputFiles.length > 1
      ? '🔄 Compile ' + inputFiles.length + ' files'
      : '🔄 Compile Firmware');
  }
  renderInputList();
  if (!inputFiles.length) {
    setTotalProgress(0);
    setBatchText('');
  } else {
    setBatchText(inputFiles.length + ' file' + (inputFiles.length === 1 ? '' : 's') + ' queued');
  }
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
  eabPaintBatchPause(batchRunning);
};
window.eabStopBatch = function () {
  eabReleaseBatchPause();
  window.eabCancelBatch();
  const $cur = $('#input-list .file-item.current .btn-stop-file').first();
  if ($cur.length) $cur.trigger('click');
  eabPaintBatchPause(batchRunning);
};
async function startBatch() {
  if (batchRunning) return;
  if (inputFiles.length <= 1) return startRun();
  const total = inputFiles.length;
  batchRunning = true;
  for (const p of inputFiles) delete rowMeta[p];
  updateBatchState();
  setTotalProgress(0);
  for (let i = 0; i < total && batchRunning; i++) {
    if (!(await eabBatchGate())) break;
    setCurrentInput(i);
    setBatchText((i + 1) + ' / ' + total + ' files');
    await startRun();
    delete rowMeta[inputFiles[i]];
    window.eabPaintRows();
    setTotalProgress(((i + 1) / total) * 100);
  }
  batchRunning = false;
  eabReleaseBatchPause();
  updateBatchState();
}
window.eabCancelBatch = function () { batchRunning = false; };
function clearAllInputs() {
  inputFiles.length = 0;
  setCurrentInput(0);
  updateBatchState();
}
