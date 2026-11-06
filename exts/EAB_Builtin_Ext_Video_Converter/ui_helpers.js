function isEmbedded() {
  return window.parent !== window;
}
function joinPath(dir, name) {
  if (!dir || dir === '.') return name;
  const sep = /\\/.test(dir) ? '\\' : '/';
  return dir.replace(/[\\/]+$/, '') + sep + name;
}
function baseName(p) {
  return String(p == null ? '' : p).split(/[\\/]/).pop() || '';
}
function escHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escAttr(s) {
  return escHtml(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function setText($el, text) {
  if (!$el || !$el.length) return;
  const node = $el.get(0).firstChild;
  if (!node || node.nodeType !== 3) { $el.text(text); return; }
  if (node.nodeValue !== text) node.nodeValue = text;
}
function log(msg) {
  console.log('[eab] ' + msg);
}
function fmtSecs(ms) {
  if (!(ms > 0)) return '';
  const s = ms / 1000;
  return s < 10 ? s.toFixed(1) + 's' : Math.round(s) + 's';
}
function failureText(detail) {
  try {
    const r = JSON.parse(detail || '{}');
    if (typeof r.exit_code === 'number') return 'failed, error code: ' + r.exit_code;
    if (r.error) return 'failed: ' + r.error;
  } catch (e) {  }
  return 'failed';
}
function showError(msg) {
  const $panel = $('#error-panel');
  if (!$panel.length) return;
  $panel.text(msg);
  $panel.removeClass('hidden');
  setPreviewStatus('Error');
  log('ERROR: ' + msg);
}
const VIDEO_FILTERS = [
  { name: 'Video files', extensions: ['mp4', 'm4v', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv', 'mpg', 'mpeg', 'm2ts', 'ts', '3gp', 'ogv', 'gif'] },
];
function pickVideoFiles() {
  if (!isEmbedded()) {
    const path = prompt('Enter paths to one or more video files (separate with ;):');
    if (path) addInputFiles(path.split(';').map(s => s.trim()).filter(Boolean));
    return;
  }
  API_EAB_pickFiles({ filters: VIDEO_FILTERS }).then(resp => {
    const paths = (resp && resp.paths) || (resp && resp.path ? [resp.path] : []);
    if (resp && resp.ok && paths.length) addInputFiles(paths);
  }).catch(err => showError('Failed to open file picker: ' + err));
}
function pickVideoFolder() {
  if (!isEmbedded()) {
    const path = prompt('Enter a folder path:');
    if (path) addInputFiles([path]);
    return;
  }
  API_EAB_pickFolder({
    extensions: VIDEO_FILTERS[0].extensions,
    title: 'Select a folder of videos',
    readBase64: false,
  }).then(resp => {
    if (!resp || !resp.ok) { showError('Add folder failed: ' + ((resp && resp.error) || 'unknown error')); return; }
    if (resp.paths && resp.paths.length) addInputFiles(resp.paths);
    else showError('No video files in that folder.');
  }).catch(err => showError('Failed to open folder picker: ' + err));
}
function addInputFiles(paths) {
  if (!paths || !paths.length) return;
  let added = 0;
  for (const p of paths) {
    if (p && state.videoFiles.indexOf(p) === -1) { state.videoFiles.push(p); added++; }
  }
  setCurrentInput(added ? state.videoFiles.length - added : state.batchIndex);
  updateBatchState();
}
function removeInputFile(index) {
  state.videoFiles.splice(index, 1);
  setCurrentInput(index >= state.videoFiles.length ? state.videoFiles.length - 1 : index);
  updateBatchState();
}
function setCurrentInput(index) {
  const path = state.videoFiles[index];
  state.batchIndex = path ? index : 0;
  state.videoFile = path || null;
  $('#video-path').val(path || '');
  renderPickedFile(path || '');
  renderInputList();
  setPreviewStatus('Ready');
  if (!path) {
    syncOutputPath('');
    updateConvertEnabled();
    return;
  }
  const base = baseName(path).replace(/\.[^.]+$/, '') || 'video';
  syncOutputPath(joinPath($('#output-dir').val() || '.', base + '.avi'));
}
const ROW_SEL = '#input-list .file-item';
const rowMeta = {};
const jobIds = {};
let rowTicker = null;
function rowEl(path) {
  const $rows = $(ROW_SEL);
  const $exact = $rows.filter(function () { return ($(this).attr('data-path') || '') === path; }).first();
  if ($exact.length) return $exact;
  const base = baseName(path);
  if (!base) return null;
  const $loose = $rows.not('.done').filter(function () { return $(this).text().indexOf(base) >= 0; }).first();
  return $loose.length ? $loose : null;
}
function setRowState(path, name, ms, t0) {
  const m = rowMeta[path] || (rowMeta[path] = { ms: 0 });
  if (name !== undefined) m.state = name;
  if (t0 !== undefined) m.t0 = t0;
  if (ms !== undefined) m.ms = ms;
}
function paintRow(path, startedAt) {
  const $el = rowEl(path);
  if (!$el) return;
  const m = rowMeta[path] || {};
  ['converting', 'done', 'failed', 'cancelled', 'current', 'indeterminate'].forEach(c => $el.removeClass(c));
  if (m.state) $el.addClass(m.state);
  if (m.state === 'converting') $el.addClass('indeterminate');
  if (state.converting && path === state.videoFile) $el.addClass('current');
  const since = m.t0 || startedAt;
  const live = m.state === 'converting' && since;
  setText($el.find('.file-item-bar-label').first(), live ? (m.label || 'Converting') + ' ' + fmtSecs(Date.now() - since) + '…' : '');
  setText($el.find('.file-item-status').first(), live ? '' : (m.resultText || ''));
}
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
function renderInputList() {
  const $host = $('#input-list');
  if (!$host.length) return;
  const current = state.converting ? state.videoFile : null;
  $host.html(state.videoFiles.map((p, i) => {
    const cls = 'file-item list-group-item' + (current === p ? ' current' : '');
    return '<div class="' + cls + '" data-path="' + escAttr(p) + '" title="' + escAttr(p) + '">' +
      '<span class="file-item-thumb-placeholder">🎬</span>' +
      '<span class="file-item-name">' + (i + 1) + '. ' + escHtml(baseName(p)) + '</span>' +
      '<span class="file-item-status"></span>' +
      '<div class="file-item-progress"><div class="file-item-progress-fill"></div><span class="file-item-bar-label"></span></div>' +
      '<span class="file-item-controls">' +
      '<button class="btn-icon btn-stop-file" type="button" title="Stop this file" aria-label="Stop this file" onclick="eabStopFile(this)">■</button>' +
      '</span>' +
      '<span class="file-item-remove" title="Remove from the list">×</span>' +
      '</div>';
  }).join(''));
  $host.find('.file-item').on('click', function (e) {
    if ($(e.target).closest('.file-item-remove, .file-item-controls').length) return;
    const idx = state.videoFiles.indexOf($(this).attr('data-path'));
    if (idx >= 0) setCurrentInput(idx);
  });
  $host.find('.file-item-remove').on('click', function (e) {
    e.stopPropagation();
    const idx = state.videoFiles.indexOf($(this).closest('.file-item').attr('data-path'));
    if (idx >= 0) removeInputFile(idx);
  });
  state.videoFiles.forEach(p => paintRow(p));
  syncQueueChrome();
}
function syncQueueChrome() {
  const n = state.videoFiles.length;
  const $count = $('#file-count');
  if ($count.length) $count.text('(' + n + ')');
  const $empty = $('#empty-msg');
  if ($empty.length) $empty.toggleClass('hidden', n > 0);
  const $clear = $('#btn-clear-all');
  if ($clear.length) $clear.toggleClass('hidden', n === 0);
  const $row = $('.app-main').first();
  if ($row.length) $row.toggleClass('is-queue-empty', n === 0 && !$row.hasClass('is-options-shown'));
}
window.eabSyncQueueChrome = syncQueueChrome;
function setTotalProgress(pct) {
  const value = Math.max(0, Math.min(100, pct)) + '%';
  $('#progress-fill, .dz-progress-fill').css('width', value);
}
function setProgress(progressState, percent, text) {
  if (typeof percent === 'number') setTotalProgress(percent);
  if (window.EAB_UI && window.EAB_UI.progress) {
    window.EAB_UI.progress(progressState, percent, text);
    return;
  }
  const $status = $('#row-progress-status');
  if ($status.length && text) $status.text(text);
}
function updateConvertEnabled() {
  const $btn = $('#btn-convert');
  if (!$btn.length) return;
  $btn.text(state.videoFiles.length > 1
    ? '🎬 Convert ' + state.videoFiles.length + ' files'
    : '🎬 Convert');
  syncStartDisabled();
}
function updateBatchState() {
  eabPaintBatchPause(state.converting);
  updateConvertEnabled();
  syncQueueChrome();
  if (!state.videoFiles.length) setTotalProgress(0);
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
  const $box = eabBatchControls();
  if (!$box || !$box.length) return;
  $box.toggleClass('hidden', !running);
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
  eabPaintBatchPause(state.converting);
};
window.eabStopBatch = function () {
  eabReleaseBatchPause();
  if (typeof window.eabCancelBatch === 'function') window.eabCancelBatch();
  const $cur = $(ROW_SEL + '.current .btn-stop-file').first();
  if ($cur.length) $cur.trigger('click');
  else if (typeof cancelConvert === 'function') cancelConvert();
  eabPaintBatchPause(state.converting);
};
window.eabStopFile = window.eabCancelFile = function (btn) {
  const $stop = btn && btn.closest ? $(btn).closest('.file-item') : $();
  if ($stop.length) $stop.addClass('stopping');
  const path = $stop.length ? ($stop.attr('data-path') || '') : '';
  const id = path ? jobIds[path] : null;
  if (id) API_EAB_cancelJob({ jobId: id }).catch(function () {  });
  state.converting = false;
};
window.eabCancelBatch = function () { state.converting = false; };
async function startBatch() {
  if (state.converting) return;
  if (state.videoFiles.length <= 1) return startConvert();
  state.converting = true;
  state.results = [];
  state.batchTotal = state.videoFiles.length;
  state.videoFiles.forEach(p => { delete rowMeta[p]; });
  renderInputList();
  updateBatchState();
  setTotalProgress(0);
  for (let i = 0; i < state.videoFiles.length && state.converting; i++) {
    if (!(await eabBatchGate())) break;
    setCurrentInput(i);
    await startConvert(true);
    setTotalProgress(((i + 1) / state.videoFiles.length) * 100);
  }
  state.converting = false;
  eabReleaseBatchPause();
  updateBatchState();
}
const QUALITY_TICKS = [2, 10, 20, 31];
function renderQualityTicks() {
  const $host = $('#quality-ticks');
  if (!$host.length) return;
  $host.html(QUALITY_TICKS.map(t => `<span>${t}</span>`).join(''));
}
function onQualityInput() {
  const v = parseInt($('#quality').val(), 10) || 3;
  $('#quality-value').text(String(v));
  const what = v <= 5 ? 'best quality, largest file'
    : v <= 12 ? 'high quality'
      : v <= 22 ? 'balanced'
        : 'smallest file, lowest quality';
  $('#quality-hint').text(v + ' = ' + what + ' · range 2-31.');
}
function onControlBitrateToggle() {
  const on = $('#control-bitrate').prop('checked');
  $('#bitrate-options').toggleClass('hidden', !on);
  $('#quality-options').toggleClass('hidden', on);
}
function pickOutputFile() {
  if (!isEmbedded()) {
    const path = prompt('Enter the output folder path:');
    if (path) syncOutputPath(joinPath(path, $('#output-name').val() || 'output.avi'));
    return;
  }
  API_EAB_pickOutput({}).then(resp => {
    if (resp && resp.ok && resp.folder) {
      syncOutputPath(joinPath(resp.folder, $('#output-name').val() || 'output.avi'));
    }
  }).catch(err => showError('Failed to open folder picker: ' + err));
}
function syncOutputPath(fullPath) {
  const value = (fullPath || '').trim();
  $('#output-path').val(value);
  const idx = Math.max(value.lastIndexOf('\\'), value.lastIndexOf('/'));
  $('#output-dir').val(idx > 0 ? value.slice(0, idx) : '.');
  $('#output-name').val(idx >= 0 ? value.slice(idx + 1) : value);
  updateConvertEnabled();
}
function clearAllInputs() {
  state.videoFiles.length = 0;
  for (const p in rowMeta) delete rowMeta[p];
  setCurrentInput(0);
  updateBatchState();
}
function openFile(path) {
  invokeHost('open_in_explorer', { path });
}
function openOutputDir() {
  invokeHost('open_in_explorer', { path: $('#output-dir').val() || '.' });
}
