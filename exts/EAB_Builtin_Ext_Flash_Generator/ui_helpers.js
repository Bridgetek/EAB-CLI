function setText($el, text) {
  if (!$el || !$el.length) return;
  var node = $el.get(0).firstChild;
  if (!node || node.nodeType !== 3) { $el.text(text); return; }
  if (node.nodeValue !== text) node.nodeValue = text;
}
function setGenProgress(pct) {
  var v = Math.max(0, Math.min(100, pct));
  $('#gen-progress-fill, .dz-progress-fill, .gen-entry-progress-fill').css('width', v + '%');
}
let genBuildRunning = false;
let genJobId = null;
const genRowState = {};
function paintGenRows(stateName, text) {
  genState.entries.forEach(function (e, i) {
    genRowState[i] = { state: stateName, text: text || '' };
  });
  window.eabPaintRows();
}
window.eabPaintRows = function () {
  $('#gen-entries .gen-entry').each(function () {
    var $el = $(this);
    var m = genRowState[Number($el.attr('data-idx'))] || {};
    $el.removeClass('converting done failed cancelled');
    if (m.state) $el.addClass(m.state);
    setText($el.find('.gen-entry-status'), m.text || '');
  });
};
function showGenStop(on) {
  var $box = $('#convert-controls');
  if (!$box.length) return;
  if (!$box.find('#btn-batch-stop').length) {
    $box.html('<button id="btn-batch-stop" class="btn btn-secondary" type="button" onclick="eabStopBatch()">■ Stop build</button>');
  }
  $box.toggleClass('hidden', !on);
}
window.eabStopBatch = function () {
  var id = genJobId;
  genBuildRunning = false;
  genJobId = null;
  if (id) API_EAB_cancelJob({ jobId: id }).catch(function () {  });
};
window.eabCancelBatch = function () { window.eabStopBatch(); };
