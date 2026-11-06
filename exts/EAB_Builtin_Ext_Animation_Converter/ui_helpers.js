function onTileChange() {
  const manual = $('#tile-size').val() === 'manual';
  const $el = $('#tile-manual');
  if ($el.length) $el.toggleClass('hidden', !manual);
}
function isEmbedded() {
  return window.parent !== window;
}
const GIF_FILTERS = [
  { name: 'GIF animation', extensions: ['gif'] },
];
function pickOutputDir() {
  if (!isEmbedded()) {
    const path = prompt('Enter output folder path:');
    if (path) {
      $('#output-dir').val(path);
    }
    return;
  }
  API_EAB_pickOutput({}).then(resp => {
    if (resp.ok && resp.folder) {
      $('#output-dir').val(resp.folder);
    }
  }).catch(err => showError('Failed to open folder picker: ' + err));
}
function openFile(path) {
  invokeHost('open_in_explorer', { path });
}
function cancelConvert() {
  resetConvertState();
}
function resetConvertState() {
  $('#btn-convert').prop('disabled', false);
  $('#convert-controls').addClass('hidden');
  updateBatchState();
}
const gifFiles = [];
let gifBatchRunning = false;
function addGifFiles(paths) {
  let added = 0;
  for (const p of paths) {
    if (p && gifFiles.indexOf(p) === -1) { gifFiles.push(p); added++; }
  }
  setCurrentGif(added ? gifFiles.length - added : 0);
  updateBatchState();
}
function removeGifFile(index) {
  gifFiles.splice(index, 1);
  setCurrentGif(index >= gifFiles.length ? gifFiles.length - 1 : index);
  updateBatchState();
}
const rowMeta = {};
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escAttr(s) {
  return escHtml(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function setText($el, text) {
  if (!$el || !$el.length) return;
  var node = $el.get(0).firstChild;
  if (!node || node.nodeType !== 3) { $el.text(text); return; }
  if (node.nodeValue !== text) node.nodeValue = text;
}
function failureText(detail) {
  try {
    const r = JSON.parse(detail || '{}');
    const code = typeof r.exit_code === 'number' ? ' (code ' + r.exit_code + ')' : '';
    if (r.error) return 'failed: ' + r.error + code;
    if (code) return 'failed,' + code;
  } catch (e) {  }
  return 'failed';
}
function fmtSecs(ms) {
  if (!(ms > 0)) return '';
  const s = ms / 1000;
  return s < 10 ? s.toFixed(1) + 's' : Math.round(s) + 's';
}
function truncateLeft(text, maxLen) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return '\u2026' + text.slice(-(maxLen - 1));
}
function fileName(path) {
  const parts = String(path || '').split(/[\\/]/);
  return parts[parts.length - 1] || String(path || '');
}
/* One-line status under the run button: what is converting, how long, and how it ended. */
function setRunStatus(text) {
  const $el = $('#run-status');
  if (!$el.length) return;
  $el.text(text || '');
  $el.toggleClass('hidden', !text);
}
function setTotalProgress(pct) {
  const $fill = $('#progress-fill, .dz-progress-fill');
  if (!$fill.length) return;
  $fill.css('width', Math.max(0, Math.min(100, pct)) + '%');
}
function syncQueueChrome() {
  const n = gifFiles.length;
  const $count = $('#file-count');
  if ($count.length) $count.text('(' + n + ')');
  const $empty = $('#empty-msg');
  if ($empty.length) $empty.toggleClass('hidden', n > 0);
  const $clear = $('#btn-clear-all');
  if ($clear.length) $clear.toggleClass('hidden', n === 0);
  const $row = $('.app-main').first();
  if ($row.length) $row.toggleClass('is-queue-empty', n === 0 && !$row.hasClass('is-options-shown'));
}
function rowEl(path) {
  var $row = $();
  $('#input-list .file-item').each(function () {
    if ($(this).attr('data-path') === path) { $row = $(this); return false; }
  });
  return $row;
}
function paintRow(path) {
  const $el = rowEl(path);
  if (!$el.length) return;
  const m = rowMeta[path] || {};
  ['converting', 'done', 'failed', 'cancelled', 'current'].forEach(c => $el.removeClass(c));
  if (m.state) $el.addClass(m.state);
  if (m.current) $el.addClass('current');
  const $st = $el.find('.file-item-status');
  const $lbl = $el.find('.file-item-bar-label');
  setText($lbl, m.running ? (m.label || 'Converting') + ' ' + fmtSecs(Date.now() - m.t0) + '\u2026' : '');
  setText($st, m.running ? '' : (m.resultText || ''));
  $st.attr('title', m.running ? '' : (m.resultText || ''));
  if (m.running) $el.addClass('converting indeterminate');
}
function renderGifList() {
  const $host = $('#input-list');
  if (!$host.length) return;
  $host.html(gifFiles.map((p) => {
    const current = gifBatchRunning && p === state.gifFile ? ' current' : '';
    return '<div class="file-item list-group-item' + current + '" data-path="' + escAttr(p) + '" title="' + escAttr(p) + '">' +
      '<span class="file-item-thumb-placeholder">\uD83C\uDFAC</span>' +
      '<span class="file-item-name">' + escHtml(truncateLeft(p, 64)) + '</span>' +
      '<span class="file-item-status"></span>' +
      '<div class="file-item-progress"><div class="file-item-progress-fill"></div><span class="file-item-bar-label"></span></div>' +
      '<span class="file-item-controls">' +
      '<button class="btn-icon btn-stop-file" type="button" title="Stop this file" aria-label="Stop this file" onclick="eabStopFile(this)">\u25A0</button>' +
      '</span>' +
      '<span class="file-item-remove" data-path="' + escAttr(p) + '" title="Remove from the list">\u00d7</span>' +
      '</div>';
  }).join(''));
  $host.find('.file-item-remove').on('click', function (e) {
    e.stopPropagation();
    const idx = gifFiles.indexOf($(this).attr('data-path'));
    if (idx >= 0) removeGifFile(idx);
  });
  $host.find('.file-item').on('click', function (e) {
    if ($(e.target).closest('.file-item-remove, .file-item-controls').length) return;
    const idx = gifFiles.indexOf($(this).attr('data-path'));
    if (idx >= 0) setCurrentGif(idx);
  });
  gifFiles.forEach(paintRow);
  syncQueueChrome();
}
function updateBatchState() {
  eabPaintBatchPause(gifBatchRunning);
  const $btn = $('#btn-convert');
  if (!$btn.length) return;
  $btn.prop('disabled', gifBatchRunning || gifFiles.length === 0);
  $btn.text(gifFiles.length > 1
    ? '🔄 Convert ' + gifFiles.length + ' GIFs'
    : '🔄 Convert Animation');
  syncQueueChrome();
  if (!gifFiles.length) { setTotalProgress(0); setRunStatus(''); pvReset(); }
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
  let $box = $('#convert-controls');
  if ($box.length && $box.find('#btn-batch-stop').length) return $box;
  if (!$box.length) {
    let $bar = $('.eab-run-bar');
    if (!$bar.length) $bar = $('.card.action-bar');
    if (!$bar.length) return null;
    $box = $('<div class="convert-controls" id="convert-controls"></div>');
    $bar.first().append($box);
  }
  $box.html(
    '<button id="btn-batch-pause" class="btn btn-secondary align-items-center justify-content-center" type="button" onclick="eabToggleBatchPause()">⏸ Pause</button>' +
    '<button id="btn-batch-stop" class="btn btn-secondary btn-danger align-items-center justify-content-center" type="button" onclick="eabStopBatch()">■ Stop all</button>');
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
  eabPaintBatchPause(gifBatchRunning);
};
window.eabStopBatch = function () {
  eabReleaseBatchPause();
  if (typeof window.eabCancelBatch === 'function') window.eabCancelBatch();
  const $cur = $('.input-row-item.current .irl-stop, .file-item.current .irl-stop').first();
  if ($cur.length) {
    $cur.trigger('click');
  } else if (typeof cancelConvert === 'function') {
    cancelConvert();
  }
  eabPaintBatchPause(gifBatchRunning);
};
async function startBatch() {
  if (gifBatchRunning) return;
  if (gifFiles.length <= 1) return startConvert();
  gifBatchRunning = true;
  gifFiles.forEach(p => { delete rowMeta[p]; });
  renderGifList();
  updateBatchState();
  setTotalProgress(0);
  setRunStatus('');
  let done = 0;
  for (let i = 0; i < gifFiles.length && gifBatchRunning; i++) {
    if (!(await eabBatchGate())) break;
    const path = gifFiles[i];
    setCurrentGif(i);
    if (await convertViaJob(path)) done++;
    setTotalProgress((i + 1) / gifFiles.length * 100);
  }
  gifBatchRunning = false;
  eabReleaseBatchPause();
  updateBatchState();
  setRunStatus(done === gifFiles.length
    ? '✓ All ' + gifFiles.length + ' GIFs converted'
    : '✗ ' + done + ' of ' + gifFiles.length + ' GIFs converted — see the rows for the reason');
}
window.eabStopFile = function (btn) {
  const $stop = btn ? $(btn).closest('.file-item') : $();
  if ($stop.length) $stop.addClass('stopping');
  const path = $stop.length ? ($stop.attr('data-path') || '') : '';
  const m = path ? rowMeta[path] : null;
  if (m && m.jobId) invokeHost('cancel_job', { jobId: m.jobId }).catch(() => {  });
  gifBatchRunning = false;
};
window.eabCancelBatch = function () { gifBatchRunning = false; };
const PV_THUMB_W = 36;
let pvFrames = [];
let pvToken = 0;
function pvSetText(id, text) {
  const $el = $('#' + id);
  if ($el.length) $el.text(text);
}
function pvAverageDelay() {
  if (!pvFrames.length) return 100;
  const withDelay = pvFrames.filter(f => f.duration > 0);
  if (!withDelay.length) return 100;
  const avg = withDelay.reduce((sum, f) => sum + f.duration, 0) / withDelay.length;
  return Math.max(20, Math.min(1000, Math.round(avg)));
}
