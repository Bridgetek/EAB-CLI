function isEmbedded() {
  return window.parent !== window;
}
function pickFiles(promptText, filters) {
  if (!isEmbedded()) {
    const path = prompt(promptText);
    return Promise.resolve(path ? [path] : []);
  }
  return API_EAB_pickFile({ filters: filters, multiple: true })
    .then(resp => (resp.ok && resp.paths) ? resp.paths : [])
    .catch(() => []);
}
function pickInputFile() {
  pickFiles('Enter path to binary file:', BINARY_FILTERS).then(addFiles);
}
function addInputFolder() {
  const extensions = BINARY_FILTERS.reduce((all, f) => all.concat(f.extensions), []);
  if (!isEmbedded()) {
    const folder = prompt('Enter the folder holding the binaries:');
    if (folder) addFiles([folder]);
    return;
  }
  API_EAB_pickFolder({ extensions: extensions, title: 'Select a folder of binaries', readBase64: false })
    .then(resp => {
      if (resp && resp.ok && resp.paths) addFiles(resp.paths);
    })
    .catch(err => showError('Failed to open folder picker: ' + err));
}
function addFiles(paths) {
  if (!state.inputFiles) state.inputFiles = [];
  (paths || []).forEach(path => {
    if (path && state.inputFiles.indexOf(path) === -1) state.inputFiles.push(path);
  });
  if (paths && paths.length) state.inputFile = state.inputFiles[0];
  updateBatchState();
}
function removeInputFile(index) {
  if (!state.inputFiles) return;
  state.inputFiles.splice(index, 1);
  state.inputFile = state.inputFiles.length ? state.inputFiles[0] : null;
  updateBatchState();
}
function clearInputFiles() {
  if (!state.inputFiles) state.inputFiles = [];
  state.inputFiles.length = 0;
  state.inputFile = null;
  updateBatchState();
}
function pickOutputDir() {
  if (!isEmbedded()) {
    const path = prompt('Enter output folder path:');
    if (path) $('#output-dir').val(path);
    return;
  }
  API_EAB_pickOutput({}).then(resp => {
    if (resp.ok && resp.folder) $('#output-dir').val(resp.folder);
  }).catch(err => showError('Failed to open folder picker: ' + err));
}
function escAttr(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function renderInputList() {
  const files = state.inputFiles || [];
  const $host = $('#input-list');
  $('#input-path').val(files.length === 1 ? files[0] : (files.length ? (files.length + ' files selected') : ''));
  if (!$host.length) return;
  $host.html(files.map((p, i) => {
    const name = baseName(p);
    return '<div class="file-item list-group-item" data-path="' + escAttr(p) + '" title="' + escAttr(p) + '">' +
      '<span class="file-item-thumb-placeholder">🔢</span>' +
      '<span class="file-item-name">' + (i + 1) + '. ' + escAttr(name) + '</span>' +
      '<span class="file-item-status"></span>' +
      '<div class="file-item-progress"><div class="file-item-progress-fill"></div><span class="file-item-bar-label"></span></div>' +
      '<span class="file-item-controls">' +
      '<button class="btn-icon btn-stop-file" type="button" title="Stop this file" aria-label="Stop this file" onclick="eabStopRow(this)">■</button>' +
      '</span>' +
      '<span class="file-item-remove" data-path="' + escAttr(p) + '" title="Remove from the list">×</span>' +
      '</div>';
  }).join(''));
  $host.find('.file-item-remove').on('click', function (e) {
    e.stopPropagation();
    const idx = state.inputFiles.indexOf($(this).closest('.file-item').attr('data-path'));
    if (idx >= 0) removeInputFile(idx);
  });
  if (typeof window.eabPaintRows === 'function') window.eabPaintRows();
  if (typeof window.eabSyncQueueChrome === 'function') window.eabSyncQueueChrome();
}
function renderInputFiles() {
  renderInputList();
}
function setTotalProgress(pct) {
  const $fill = $('#progress-fill, .dz-progress-fill');
  if (!$fill.length) return;
  $fill.css('width', Math.max(0, Math.min(100, pct)) + '%');
}
function updateBatchState() {
  eabPaintBatchPause(batchRunning);
  const $btn = $('#btn-run');
  if ($btn.length) {
    const base = $btn.attr('data-label') || '🔄 Convert';
    const n = (state.inputFiles || []).length;
    $btn.prop('disabled', batchRunning || n === 0);
    $btn.text(n > 1 ? base + ' ' + n + ' files' : base);
  }
  renderInputFiles();
  if (!(state.inputFiles || []).length) setTotalProgress(0);
}
let batchRunning = false;
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
window.eabCancelBatch = function () { batchRunning = false; };
function log(msg) { console.log('[eab] ' + msg); }
function showError(msg) {
  $('#error-panel').text(msg).removeClass('hidden');
}
const ROW_SEL = '#input-list .file-item';
const rowMeta = {};
const jobIds = {};
let rowTicker = null;
function fmtSecs(ms) {
  if (!(ms > 0)) return '';
  const s = ms / 1000;
  return s < 10 ? s.toFixed(1) + 's' : Math.round(s) + 's';
}
function rowPathOf(el) { return $(el).attr('data-path') || $(el).attr('title') || ''; }
function baseName(p) { return String(p).split(/[\\/]/).pop() || ''; }
function rowEl(path) {
  const $rows = $(ROW_SEL);
  const $exact = $rows.filter(function () { return rowPathOf(this) === path; }).first();
  if ($exact.length) return $exact;
  const base = baseName(path);
  if (!base) return null;
  const $loose = $rows.not('.done').filter(function () { return $(this).text().indexOf(base) >= 0; }).first();
  return $loose.length ? $loose : null;
}
function setText($el, text) {
  if (!$el || !$el.length) return;
  const node = $el.contents().get(0);
  if (!node || node.nodeType !== 3) { $el.text(text); return; }
  if (node.nodeValue !== text) node.nodeValue = text;
}
function paintRow(path, startedAt) {
  const $el = rowEl(path);
  if (!$el) return;
  const m = rowMeta[path] || {};
  ['converting', 'done', 'failed', 'cancelled', 'current', 'indeterminate'].forEach(c => $el.removeClass(c));
  if (m.state) $el.addClass(m.state);
  if (m.state === 'converting') $el.addClass('indeterminate');
  if (batchRunning && path === $('#input-path').val()) $el.addClass('current');
  const $st = $el.find('.file-item-status').first();
  const $lbl = $el.find('.file-item-bar-label').first();
  const since = m.t0 || startedAt;
  const live = m.state === 'converting' && since;
  setText($lbl, live ? 'converting ' + fmtSecs(Date.now() - since) + '…' : '');
  setText($st, live ? '' : (m.resultText || ''));
}
window.eabPaintRows = function () {
  (state.inputFiles || []).forEach(p => paintRow(p));
};
function startRowTicker() {
  if (rowTicker) return;
  rowTicker = setInterval(function () {
    let live = false;
    for (const p in rowMeta) {
      if (rowMeta[p].t0 && !rowMeta[p].ms) { paintRow(p, rowMeta[p].t0); live = true; }
    }
    if (!live) { clearInterval(rowTicker); rowTicker = null; }
  }, 200);
}
window.eabStopRow = window.eabCancelRow = window.eabStopFile = function (btn) {
  var stopRow = (arguments[0] && arguments[0].closest) ? arguments[0].closest('.file-item') : null;
  if (stopRow) $(stopRow).addClass('stopping');
  const row = btn && btn.closest ? btn.closest(ROW_SEL) : null;
  const path = row ? rowPathOf(row) : '';
  const id = path ? jobIds[path] : null;
  if (id) API_EAB_cancelJob({ jobId: id }).catch(function () { });
};
