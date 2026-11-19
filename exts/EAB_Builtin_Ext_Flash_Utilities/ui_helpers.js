function escAttr(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function assetName(p) {
  return String(p == null ? '' : p).split(/[\\/]/).pop() || '';
}
function setText($el, text) {
  if (!$el || !$el.length) return;
  var node = $el.get(0).firstChild;
  if (!node || node.nodeType !== 3) { $el.text(text); return; }
  if (node.nodeValue !== text) node.nodeValue = text;
}
/* What the user must do before a disabled action can run, keyed by the same
   selector that data-eab-missing blinks, so the tooltip and the highlight
   always name the same control. */
var MISSING_HINT = {
  '#conn-card': 'Scan the Connection panel and select a device first',
  '#chip-one': 'Pick an EVE chip in the Generator panel first',
  '#input-card': 'Add at least one input asset first',
  '#fp-file-browse': 'Add a flash image first',
  '#fp-read-dir': 'Pick an output folder for the read file first',
  '#fp-map-bad': 'Enter the bad block number first',
  '#fp-map-good': 'Enter the good block number first',
  '#diag-tx': 'Enter the bytes to transmit first'
};
function missingHint(selector) {
  return MISSING_HINT[String(selector || '')] || '';
}
/* A disabled button inside .btn-progress-wrap is pointer-events:none (the wrapper
   takes the click), so the hover tooltip has to sit on the wrapper as well. */
function setHint($el, text) {
  if (!$el || !$el.length) return;
  $el.add($el.closest('.btn-progress-wrap')).each(function () {
    var $node = $(this);
    if ($node.attr('data-eab-idle-title') === undefined) {
      $node.attr('data-eab-idle-title', $node.attr('title') || '');
    }
    $node.attr('title', text || $node.attr('data-eab-idle-title') || '');
  });
}
let buildRunning = false;
const buildRows = {};
function setTotalProgress(pct) {
  var v = Math.max(0, Math.min(100, pct));
  $('#progress-fill, .dz-progress-fill, .file-item-progress-fill').css('width', v + '%');
  $('#progress-bar-fill').css('width', v + '%');
}
function paintBuildRows(stateName, text, label) {
  state.assetFiles.forEach(function (f) {
    buildRows[f.path] = { state: stateName, text: text || '', label: label || '' };
  });
  window.eabPaintRows();
}
window.eabPaintRows = function () {
  $('#file-list .file-item').each(function () {
    var $el = $(this);
    var m = buildRows[$el.attr('data-path')] || {};
    $el.removeClass('converting done failed cancelled current');
    if (m.state) $el.addClass(m.state);
    setText($el.find('.file-item-status').first(), m.text);
    setText($el.find('.file-item-bar-label').first(), m.state === 'converting' ? (m.label || 'building…') : '');
  });
};
function updateBatchState() {
  var n = state.assetFiles.length;
  var $btn = $('#btn-convert');
  if ($btn.length) {
    var missing = n === 0 ? '#input-card' : !chipGeneration() ? '#chip-one' : '';
    $btn.attr('data-eab-missing', buildRunning ? '' : missing)
      .prop('disabled', buildRunning || !!missing);
    setHint($btn, buildRunning
      ? 'A build is running — wait for it to finish'
      : missingHint(missing));
    $btn.text(n > 1 ? '🔄 Build Flash Image (' + n + ' assets)' : '🔄 Build Flash Image');
  }
  renderFileList();
  if (!n) setTotalProgress(0);
}
function showBuildStop(on) {
  var $box = $('#convert-controls');
  if (!$box.length) return;
  if (!$box.find('#btn-batch-stop').length) {
    $box.html('<button id="btn-batch-stop" class="btn btn-secondary" type="button" onclick="eabStopBatch()">■ Stop build</button>');
  }
  $box.toggleClass('hidden', !on);
}
window.eabStopBatch = function () {
  if (typeof window.eabCancelBatch === 'function') window.eabCancelBatch();
  showBuildStop(false);
};
window.eabStopRow = function (btn) {
  var $row = btn ? $(btn).closest('.file-item') : $();
  if ($row.length) $row.addClass('stopping');
  window.eabStopBatch();
};
