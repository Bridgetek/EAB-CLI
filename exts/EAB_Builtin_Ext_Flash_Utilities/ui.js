$(document).on('click', '.btn-progress-wrap.eab-action-disabled', function (event) {
  var button = $(this).find('button.btn-primary:disabled').get(0);
  if (!button) return;
  var selectors = (button.getAttribute('data-eab-missing') || '').split('|');
  var target = null;
  for (var i = 0; i < selectors.length; i++) {
    if (!selectors[i]) continue;
    target = document.querySelector(selectors[i]);
    if (target && !target.disabled && target.getClientRects().length) break;
    target = null;
  }
  if (!target) return;
  event.preventDefault();
  event.stopPropagation();
  clearTimeout(target.eabOptionBlinkTimer);
  target.classList.remove('eab-option-blink');
  void target.offsetWidth;
  target.classList.add('eab-option-blink');
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.eabOptionBlinkTimer = setTimeout(function () {
    target.classList.remove('eab-option-blink');
  }, 3000);
});
/* Blinks the control a locked action is waiting for — the Connection card while
   no device is selected, the image queue while it is empty. */
function blinkMissing(selector) {
  var target = selector ? document.querySelector(selector) : null;
  if (!target) return;
  clearTimeout(target.eabOptionBlinkTimer);
  target.classList.remove('eab-option-blink');
  void target.offsetWidth;
  target.classList.add('eab-option-blink');
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.eabOptionBlinkTimer = setTimeout(function () {
    target.classList.remove('eab-option-blink');
  }, 3000);
}
/* A disabled action is pointer-events:none, so the press lands on the row: the
   row hit-tests the coordinates and blinks the control the action waits for. */
function disabledActionAt(row, x, y) {
  var found = null;
  $(row).find('button:disabled').each(function () {
    var r = this.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) found = this;
  });
  return found;
}
$(document).on('pointerdown', '#tab-programmer .fp-actions', function (event) {
  var button = disabledActionAt(this, event.clientX, event.clientY);
  if (!button) return;
  var missing = String(button.getAttribute('data-eab-missing') || '').split('|')[0];
  if (!missing) return;
  event.preventDefault();
  blinkMissing(missing);
});

const state = {
  assetFiles: [],
  fpFiles: [],
};
let currentJobId = null;
let lastJobStatus = 0;
let diagPlaceholder = null;
let fpRunning = false;
function isEmbedded() {
  return window.parent !== window;
}
function pickFile(promptText, filters) {
  if (!isEmbedded()) {
    const path = prompt(promptText);
    return Promise.resolve(path || null);
  }
  return API_EAB_pickFile({ filters: filters })
    .then(resp => (resp.ok && resp.path) ? resp.path : null)
    .catch(() => null);
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
const FLASH_ASSET_FILTERS = [
  { name: 'EVE assets', extensions: ['bin', 'eab', 'pkm', 'astc', 'raw', 'zlib', 'lut', 'dat', 'blob'] },
  { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'tif', 'tiff', 'webp'] },
  { name: 'Media', extensions: ['gif', 'wav', 'mp3', 'avi', 'mp4'] },
  { name: 'Fonts', extensions: ['ttf', 'otf', 'fnt', 'json'] },
];
const FLASH_FOLDER_EXTS = ['bin', 'eab', 'pkm', 'astc', 'raw', 'zlib', 'lut', 'dat', 'blob',
  'png', 'jpg', 'jpeg', 'bmp', 'tif', 'tiff', 'webp', 'gif', 'wav', 'mp3', 'avi', 'mp4',
  'ttf', 'otf', 'fnt', 'json'];
const FLASH_BLOB_FILTERS = [
  { name: 'Flash blob', extensions: ['blob', 'bin', 'img', 'eab', 'raw'] },
];
const INPUT_LIST_FILTERS = [
  { name: 'Input lists', extensions: ['txt', 'list', 'lst', 'csv'] },
];
const FLASH_PROG_FILTERS = [
  { name: 'Flash image', extensions: ['bin', 'img', 'blob', 'eab', 'raw', 'hex'] },
];
function pickOutputDir() {
  if (!isEmbedded()) {
    const path = prompt('Enter output folder path:');
    if (path) $('#output-dir').val(path);
    return;
  }
  API_EAB_pickOutput().then(resp => {
    if (resp.ok && resp.folder) {
      $('#output-dir').val(resp.folder);
    }
  }).catch(err => showError('Failed to open folder picker: ' + err));
}
async function addAssetFile() {
  const paths = await pickFiles('Enter path to asset file:', FLASH_ASSET_FILTERS);
  addAssetFiles(paths);
}
async function addAssetFolder() {
  if (!isEmbedded()) {
    const path = prompt('Enter a folder path:');
    if (path) addAssetFiles([path]);
    return;
  }
  const resp = await API_EAB_pickFolder({
    extensions: FLASH_FOLDER_EXTS,
    title: 'Select a folder of assets',
    readBase64: false,
  }).catch(err => ({ ok: false, error: String(err) }));
  if (!resp || !resp.ok) {
    showError('Add folder failed: ' + ((resp && resp.error) || 'unknown error'));
    return;
  }
  if (resp.paths && resp.paths.length) {
    addAssetFiles(resp.paths);
    return;
  }
  showError('No asset files matched in that folder.');
}
async function pickBlobFile() {
  const path = await pickFile('Enter path to blob file:', FLASH_BLOB_FILTERS);
  if (!path) return;
  const $sel = $('#blob-path');
  if (!$sel.find('option').filter(function () { return $(this).val() === path; }).length) {
    $sel.append('<option value="' + escAttr(path) + '">' + escAttr(path) + '</option>');
  }
  $sel.val(path);
}
function addInputListFrom(path) {
  if (!path) return;
  const at = state.assetFiles.findIndex(f => f.path === path);
  if (at < 0) state.assetFiles.push({ path: path, asList: true });
  renderFileList();
  updateBatchState();
}
function addInputList() {
  return pickFile('Enter path to input-list file (one asset per line):', INPUT_LIST_FILTERS).then(path => addInputListFrom(path));
}
function addAssetFiles(paths) {
  let added = 0;
  (paths || []).forEach(p => {
    if (!p) return;
    if (state.assetFiles.some(f => f.path === p)) return;
    state.assetFiles.push({ path: p, asList: false });
    added++;
  });
  if (added) {
    renderFileList();
    updateBatchState();
  }
  return added;
}
window.eabAddFiles = function (paths) {
  return addAssetFiles(paths);
};
function removeFile(index) {
  state.assetFiles.splice(index, 1);
  renderFileList();
  updateBatchState();
}
function clearAllInputs() {
  state.assetFiles.length = 0;
  renderFileList();
  updateBatchState();
}
function renderFileList() {
  const $list = $('#file-list');
  if (!$list.length) return;
  const n = state.assetFiles.length;
  $('#file-count').text('(' + n + ')');
  $list.html(state.assetFiles.map((f, i) => {
    return '<div class="file-item list-group-item" data-path="' + escAttr(f.path) + '" title="' + escAttr(f.path) + '">' +
      '<span class="file-item-thumb-placeholder">' + (f.asList ? '📄' : '📦') + '</span>' +
      '<span class="file-item-name">' + (i + 1) + '. ' + escAttr(assetName(f.path)) + '</span>' +
      '<span class="file-item-status"></span>' +
      '<div class="file-item-progress"><div class="file-item-progress-fill"></div><span class="file-item-bar-label"></span></div>' +
      '<span class="file-item-controls">' +
      '<button class="btn-icon btn-stop-file" type="button" title="Stop the build" aria-label="Stop the build" onclick="eabStopRow(this)">■</button>' +
      '</span>' +
      '<span class="file-item-remove" data-path="' + escAttr(f.path) + '" title="Remove from the list">×</span>' +
      '</div>';
  }).join(''));
  $list.find('.file-item-remove').on('click', function (e) {
    e.stopPropagation();
    const at = state.assetFiles.findIndex(f => f.path === $(this).attr('data-path'));
    if (at >= 0) removeFile(at);
  });
  window.eabPaintRows();
  planRender();
  if (typeof window.eabSyncQueueChrome === 'function') window.eabSyncQueueChrome();
}
function planRender() {
  syncFpRun();
  syncNoPreviewRows();
}
function fpFileMissing(action) {
  const act = action || $('#fp-action').val();
  return !!act && FP_FILE_OPS.indexOf(act) >= 0 && !state.fpFiles.length;
}
function picoSelected() {
  return selectedDevices.has('Pico');
}
/* uf2conv4eve only converts an image to UF2 and copies it to the Pico's USB
   drive: it has no detect, read, verify, erase or NAND command, so a Pico can
   program an image and nothing else. An FT4222/MPSSE row selected alongside it
   still runs the other actions. */
const PICO_ACTIONS = ['--program'];
const PICO_WHY = 'A Pico only programs an image over USB — uf2conv4eve has no ' +
  'detect, read, verify, erase or NAND command. Select an FT4222 or MPSSE adapter for this action.';
function picoCantRun(dev, action) {
  return dev === 'Pico' && PICO_ACTIONS.indexOf(action) < 0;
}
function picoBlocksAction(action) {
  return selectedDevices.has('Pico') && !selectedSpiDevice() && picoCantRun('Pico', action);
}
function syncDetectMode(changed) {
  const $safe = $('#fp-detect-safe');
  const $write = $('#fp-detect-write');
  if (!$safe.length || !$write.length) return;
  if (changed === 'safe' && $safe.prop('checked')) $write.prop('checked', false);
  if (changed === 'write' && $write.prop('checked')) $safe.prop('checked', false);
  if (!$safe.prop('checked') && !$write.prop('checked')) $safe.prop('checked', true);
}
window.syncDetectMode = syncDetectMode;
function fpActionMissing(action) {
  if (!targetDevice()) return '#conn-card';
  if (FP_FILE_OPS.indexOf(action) >= 0 && fpFileMissing(action)) return '#fp-file-browse';
  if (action === '--read' && !fpReadPath()) return '#fp-read-dir';
  if (action === '--map-nand') {
    if ($.trim(String($('#fp-map-bad').val() || '')) === '') return '#fp-map-bad';
    if ($.trim(String($('#fp-map-good').val() || '')) === '') return '#fp-map-good';
  }
  return '';
}
/* Options only one EVE family or one transport can run follow the selection.
   Returns true when the chosen action no longer exists, so the caller can
   refresh the page. */
function syncFpActionOptions() {
  const $sel = $('#fp-action');
  if (!$sel.length) return false;
  $sel.find('option').each(function () {
    const action = String($(this).val() || '');
    const only = $(this).attr('data-chip');
    const ok = (!only || anyDeviceFamily(only)) && !programOff(action) &&
      !picoBlocksAction(action);
    $(this).prop('disabled', !ok).prop('hidden', !ok);
  });
  const $cur = $sel.find('option:selected');
  const cur = String($cur.val() || '');
  // a page that this chip cannot drive is not a valid landing action either
  const pageOn = cur && !fpPageOff(fpPageForAction(cur));
  if ($cur.length && cur && !$cur.prop('disabled') && pageOn) return false;
  $sel.val(defaultFpAction());
  return true;
}
/* Falls back to the first action this transport can actually run. */
function defaultFpAction() {
  let pick = '';
  $('#fp-action option').each(function () {
    if (pick) return;
    const action = String($(this).val() || '');
    if (!action || $(this).prop('disabled')) return;
    if (fpPageOff(fpPageForAction(action))) return;
    pick = action;
  });
  return pick || '--program';
}
/* Program writes a factory-state chip, which the vendor tools only offer for
   BT817, BT818 and BT82X. A Pico deploys the image built for the chip the board
   reported, so it follows the same rule. */
const PROGRAM_PARTS = { BT817: true, BT818: true, BT820: true };
function canProgram(info) {
  if (!info || !info.gen) return false;
  const target = runTarget(info);
  return target.gen === 'bt82x' || !!PROGRAM_PARTS[target.part];
}
function programOff(action) {
  if (action !== '--program' || !selectedDevices.size) return false;
  let ok = false;
  selectedDevices.forEach(function (id) {
    if (!ok && canProgram(infoFor(id))) ok = true;
  });
  return !ok;
}
/* Why this action is greyed out, in the same order syncFpRun gates it, so the
   tooltip never names a condition that is already met. */
function fpOptionHint(action) {
  if (programOff(action)) return 'Program needs a BT817, BT818 or BT82X board';
  const $opt = $('#fp-action option[value="' + action + '"]');
  const only = $opt.attr('data-chip');
  if (!only || anyDeviceFamily(only)) return '';
  return $.trim($opt.text()) + ' needs a ' +
    (only === 'bt82x' ? 'BT82X' : 'BT81X / BT88X / FT81X') + ' board';
}
function fpRunHint(action, picoOff, missing) {
  if (picoOff) return PICO_WHY;
  if (fpRunning) return 'A flash command is running — wait for it to finish';
  // the chip reason wins: the action cannot run whatever is filled in
  const why = fpOptionHint(action);
  if (why) return why;
  if (missing) return missingHint(missing);
  return '';
}
function syncFpRun() {
  const changed = syncFpActionOptions();
  // the rail is gated per chip too, so it is repainted even when the action
  // stayed the same (a newly selected board can open Detect / Read / Scan / Fix)
  syncFpView();
  if (changed) syncNoPreviewRows();
  $('[data-fp-run]').each(function () {
    const action = String($(this).attr('data-fp-run') || '');
    // a Pico cannot run this one, so a click points back at the device list
    const picoOff = picoBlocksAction(action);
    const off = fpOptionOff(action);
    // a chip the action is not available on has nothing to fill in first
    const missing = picoOff || off ? '' : fpActionMissing(action);
    $(this).prop('disabled', fpRunning || off || !!missing)
      .attr('data-eab-missing', fpRunning ? '' : missing);
    setHint($(this), fpRunHint(action, picoOff, missing));
  });
}
function syncDiagnosticGate() {
  const noDevice = !targetDevice();
  // both diagnostics need an SPI bridge, so a Pico-only selection blocks both
  const picoOff = picoBlocksAction('--readinfo');
  const missing = noDevice ? '#conn-card'
    : $.trim(String($('#diag-tx').val() || '')) ? '' : '#diag-tx';
  $('#btn-diag-tx').attr('data-eab-missing', fpRunning ? '' : (picoOff ? '#conn-card' : missing))
    .prop('disabled', fpRunning || picoOff || !!missing);
  setHint($('#btn-diag-tx'), fpRunHint('--tx', picoOff, missing));
  const infoMissing = noDevice || picoOff ? '#conn-card' : '';
  $('#btn-diag-info').attr('data-eab-missing', fpRunning ? '' : infoMissing)
    .prop('disabled', fpRunning || !!infoMissing);
  setHint($('#btn-diag-info'), fpRunHint('--readinfo', picoOff, infoMissing));
}
function placeRunBars() {
  $('.app-row').each(function () {
    const $row = $(this);
    const $target = $row.children('.right-col').first().length
      ? $row.children('.right-col').first()
      : $row.children('.left-col').first();
    if (!$target.length) return;
    $row.children('.left-col, .mid-col, .right-col').children('.eab-run-bar').each(function () {
      $target.prepend(this);
    });
    $target.children('.eab-run-bar').each(function () {
      if ($target.children().first().get(0) !== this) $target.prepend(this);
    });
  });
}
function syncNoPreviewRows() {
  placeRunBars();
}
/* Drag a separator to resize the pane before it; the pane is fed by a CSS
   custom property so the grid keeps the rest of the width. */
function installSplitDivider(divider, box, cssVar, opts) {
  if (!divider || !box) return;
  const clamp = function (px) { return Math.max(opts.min, Math.min(opts.max, Math.round(px))); };
  const apply = function (px) { box.style.setProperty(cssVar, clamp(px) + 'px'); };
  try {
    const saved = parseFloat(localStorage.getItem(opts.key) || '');
    if (!isNaN(saved)) apply(saved);
  } catch (e) { }
  const pane = function () { return divider.previousElementSibling; };
  let drag = null;
  divider.addEventListener('pointerdown', function (ev) {
    const target = pane();
    if (!target) return;
    drag = { x: ev.clientX, width: target.getBoundingClientRect().width };
    divider.classList.add('is-dragging');
    document.body.classList.add('eab-split-dragging');
    if (divider.setPointerCapture) divider.setPointerCapture(ev.pointerId);
    ev.preventDefault();
  });
  divider.addEventListener('pointermove', function (ev) {
    if (!drag) return;
    apply(drag.width + ev.clientX - drag.x);
  });
  function endDrag(ev) {
    if (!drag) return;
    drag = null;
    divider.classList.remove('is-dragging');
    document.body.classList.remove('eab-split-dragging');
    if (divider.releasePointerCapture && ev && ev.pointerId >= 0) {
      try { divider.releasePointerCapture(ev.pointerId); } catch (e) { }
    }
    const target = pane();
    if (!target) return;
    try { localStorage.setItem(opts.key, String(Math.round(target.getBoundingClientRect().width))); } catch (e) { }
  }
  divider.addEventListener('pointerup', endDrag);
  divider.addEventListener('pointercancel', endDrag);
  divider.addEventListener('lostpointercapture', function () { endDrag(null); });
  divider.addEventListener('dblclick', function () {
    try { localStorage.removeItem(opts.key); } catch (e) { }
    box.style.removeProperty(cssVar);
  });
  divider.addEventListener('keydown', function (ev) {
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight' && ev.key !== 'Home') return;
    ev.preventDefault();
    if (ev.key === 'Home') {
      try { localStorage.removeItem(opts.key); } catch (e) { }
      box.style.removeProperty(cssVar);
      return;
    }
    const target = pane();
    if (!target) return;
    const width = target.getBoundingClientRect().width + (ev.key === 'ArrowRight' ? 16 : -16);
    apply(width);
    try { localStorage.setItem(opts.key, String(clamp(width))); } catch (e) { }
  });
}
let noPreviewQueued = false;
function queueNoPreviewSync() {
  if (noPreviewQueued) return;
  noPreviewQueued = true;
  setTimeout(function () { noPreviewQueued = false; syncNoPreviewRows(); }, 0);
}
const FP_FILE_OPS = ['--program', '--program-verify', '--verify',
                     '--newblob', '--update', '--update-verify'];
/* These write the flash, so they run once per queued image. */
const FP_PROGRAM_OPS = ['--program', '--program-verify'];
function currentChip() {
  return chipGroup();
}
var CHIP_TABLE = {
  FT800: ['FT80X', 'ft80x', ''], FT801: ['FT80X', 'ft80x', ''],
  FT810: ['FT81X/BT88X', 'ft81x', ''], FT811: ['FT81X/BT88X', 'ft81x', ''],
  FT812: ['FT81X/BT88X', 'ft81x', ''], FT813: ['FT81X/BT88X', 'ft81x', ''],
  BT880: ['FT81X/BT88X', 'bt88x', ''], BT881: ['FT81X/BT88X', 'bt88x', ''],
  BT882: ['FT81X/BT88X', 'bt88x', ''], BT883: ['FT81X/BT88X', 'bt88x', ''],
  BT815: ['BT81X', 'bt81x', 'BT815/6'], BT816: ['BT81X', 'bt81x', 'BT815/6'],
  BT817: ['BT81X', 'bt81x', 'BT817/8'], BT818: ['BT81X', 'bt81x', 'BT817/8'],
  BT820: ['BT82X', 'bt82x', '']
};
var CHIP_GEN = {
  FT80X: ['FT80X', 'ft80x', ''], FT81X: ['FT81X/BT88X', 'ft81x', ''],
  BT88X: ['FT81X/BT88X', 'bt88x', ''], BT81X: ['BT81X', 'bt81x', ''],
  BT82X: ['BT82X', 'bt82x', '']
};
var CHIP_PROG_GEN = { BT81X: 'BT81X' };
var CHIP_BOX = { gen: 'chip-gen', part: 'chip-name' };
var CHIP_ORDER = ['gen', 'part'];
function chipRow(value) {
  var key = String(value || '').toUpperCase();
  return CHIP_TABLE[key] || CHIP_GEN[key] || null;
}
function chipGeneration() {
  var value = String($('#chip-gen').val() || '');
  if (!value) value = String($('#chip-name').val() || '');
  var row = chipRow(value);
  return row ? row[1] : '';
}
function chipGroup() {
  return chipGeneration() === 'bt82x' ? 'bt82x' : 'legacy';
}
function chipLabel(which) {
  var $box = $('#' + CHIP_BOX[which]);
  return $box.length ? $box.parent().find('[data-chip-label="' + which + '"]') : $();
}
window.onChipPick = function (which) {
  var $boxes = {}, k;
  for (k in CHIP_BOX) $boxes[k] = $('#' + CHIP_BOX[k]);
  if (!$boxes.part.length || !$boxes.gen.length) return;
  var value = String($boxes[which].val() || '');
  var row = chipRow(value);
  for (k in CHIP_BOX) {
    if (k !== which) $boxes[k].val('');
  }
  var prog = row ? row[2] : '';
  if (prog) {
    var $fp = $('#fp-chip');
    if ($fp.length) $fp.val(prog);
  }
  onChipChange();
};
function onChipChange() {
  // The chip card only builds the image; the programmer and diagnostic tabs read
  // the device selected in Connection, so nothing here touches them.
  planRender();
  updateBatchState();
  syncFlashSampleScope();
  syncBlobChoices(true);
  syncBlobRelease();
  syncTabAvailability();
  saveChipCache();
}
var FP_PROG_PAGES = [
  { key: 'detect', label: '🔎 Detect' },
  { key: 'program', label: '⬇ Program' },
  { key: 'read', label: '⬆ Read' },
  { key: 'scan', label: '🔍 Scan Block' },
  { key: 'fix', label: '🛠 Fix Block' }
];
var FP_PAGE_ACTIONS = {
  detect: ['--detect', '--check-type', '--readinfo', '--readsfdp', '--chip-id', '--tx'],
  program: ['--newblob', '--program', '--program-verify', '--update', '--update-verify',
            '--verify', '--erase'],
  read: ['--read'],
  scan: ['--scan-nand', '--sanitize-nand'],
  fix: ['--map-nand']
};
function fpOptionOff(action) {
  return !!$('#fp-action option[value="' + action + '"]').prop('disabled');
}
function fpPageForAction(action) {
  for (const key in FP_PAGE_ACTIONS) {
    if (FP_PAGE_ACTIONS[key].indexOf(action) >= 0) return key;
  }
  return 'detect';
}
/* Detect, Read, Scan Block and Fix Block belong to the BT82X toolchain; the
   legacy part is only programmed, updated, verified and erased. */
const FP_BT82X_PAGES = { detect: true, read: true, scan: true, fix: true };
function targetChipLabel() {
  const t = targetDevice();
  if (!t) return '';
  const info = t.info || {};
  if (CHIP_TABLE[info.part]) return info.part + ' on ' + t.id;
  const dev = FP_DEVICES.find(d => d.id === t.id);
  return (dev ? dev.name : t.id) + (info.gen ? ' · ' + info.gen.toUpperCase() : '');
}
/* Why a page is unusable — also the tooltip shown on its rail button. */
function fpPageHint(key) {
  const actions = FP_PAGE_ACTIONS[key] || [];
  if (actions.length && actions.every(a => picoBlocksAction(a))) return PICO_WHY;
  if (FP_BT82X_PAGES[key] && !anyDeviceFamily('bt82x')) {
    const chip = targetChipLabel();
    return 'Detect, Read, Scan Block and Fix Block need a BT82X chip — ' +
      (chip ? chip + ' is not one, so use Program, Update, Verify or Erase'
            : 'no BT82X board is selected');
  }
  if (actions.every(a => fpOptionOff(a))) return 'NAND operations — BT82X only';
  return '';
}
function fpPageOff(key) {
  return !!fpPageHint(key);
}
function fpShowPage(key) {
  const action = (FP_PAGE_ACTIONS[key] || []).filter(a => !fpOptionOff(a))[0];
  if (!action) return;
  $('#fp-action').val(action);
  onFpActionChange();
}
window.fpShowPage = fpShowPage;
/* The page to show: the action's own page, or the first page this chip can
   open when that one is off (a legacy board has no Detect page to land on). */
function currentFpPage() {
  const page = fpPageForAction(String($('#fp-action').val() || ''));
  if (!fpPageOff(page)) return page;
  const keys = Object.keys(FP_PAGE_ACTIONS);
  for (let i = 0; i < keys.length; i++) {
    if (!fpPageOff(keys[i])) return keys[i];
  }
  return page;
}
function syncFpView() {
  const $row = $('#fp-tabs');
  if (!$row.length) return;
  if (!$row.children().length) {
    $row.html(FP_PROG_PAGES.map(p =>
      '<button class="tab-sub-btn" type="button" data-page="' + p.key + '">' + p.label + '</button>'
    ).join(''));
    $row.find('.tab-sub-btn').on('click', function () {
      if ($(this).hasClass('is-off')) {
        // a locked page still says why; with no device it points at Connection
        if (!targetDevice()) blinkMissing('#conn-card');
        return;
      }
      fpShowPage(String($(this).attr('data-page')));
    });
  }
  const page = currentFpPage();
  $row.find('.tab-sub-btn').each(function () {
    const key = String($(this).attr('data-page'));
    const hint = fpPageHint(key);
    // a page that cannot run is shown greyed but stays hoverable, so its reason
    // is readable (a disabled button swallows the tooltip in the webview)
    $(this).toggleClass('active', key === page)
      .toggleClass('is-off', !!hint)
      .attr('aria-disabled', hint ? 'true' : 'false')
      .prop('disabled', false)
      .attr('title', hint || '');
  });
  $('.fp-page').each(function () {
    $(this).toggleClass('hidden', String($(this).attr('data-fp-page')) !== page);
  });
}
window.syncFpView = syncFpView;
/* A tab bar entry may need a selected device or a BT82X board specifically
   (Flash Diagnostic only speaks the BT82X tool). The entry always opens — only
   the actions inside are locked — so it is dimmed and says what is missing. */
function tabNeedsMet(need) {
  if (need === 'device') return !!targetDevice();
  if (need === 'bt82x') return anyDeviceFamily('bt82x');
  return true;
}
function syncTabAvailability() {
  $('.tab-btn[data-needs]').each(function () {
    const need = String($(this).attr('data-needs'));
    const off = !tabNeedsMet(need);
    $(this).prop('disabled', false)
      .toggleClass('is-locked', off)
      .attr('aria-disabled', 'false');
    setHint($(this), off
      ? (need === 'bt82x'
        ? 'Flash Diagnostic needs a BT82X board — scan a BT82X device and select it'
        : missingHint('#conn-card'))
      : '');
  });
}
function onFpActionChange() {
  syncFpView();
  planRender();
}
function pickFpFile() {
  if (!isEmbedded()) {
    const path = prompt('Enter file path (separate several with ";"):');
    if (path) setFpImages(path.split(';'));
    return;
  }
  pickFiles('Enter path to a flash image:', FLASH_PROG_FILTERS).then(addFpImages)
    .catch(err => showError('Failed to open file picker: ' + err));
}
/* Every queued image goes to the tool as its own flash_prog run, so each one
   gets a row and a progress state of its own. #fp-pad pads an image up to a
   multiple of that many bytes before the next one starts. */
function fpPadBytes() {
  const n = parseInt(String($('#fp-pad').val() || ''), 10);
  return isNaN(n) || n < 0 ? 0 : n;
}
function padLength(size, pad) {
  return pad > 0 ? Math.ceil(size / pad) * pad : size;
}
function fpStartOffset() {
  const raw = $.trim(String($('#fp-offset').val() || ''));
  if (!raw) return 0;
  const n = /^0x/i.test(raw) ? parseInt(raw, 16) : parseInt(raw, 10);
  return isNaN(n) || n < 0 ? 0 : n;
}
function addrHex(value) {
  return '0x' + Math.max(0, Math.round(value)).toString(16).toUpperCase();
}
function b64Size(dataUrl) {
  const raw = String(dataUrl || '');
  const at = raw.indexOf('base64,');
  const b64 = (at >= 0 ? raw.slice(at + 7) : raw).replace(/=+$/, '');
  return Math.floor(b64.length * 3 / 4);
}
async function fpFileSize(path) {
  const resp = await API_EAB_readFileAsBase64({ path: path }).catch(() => null);
  if (!resp || !resp.ok || !resp.data) throw new Error('could not read ' + assetName(path));
  return b64Size(resp.data);
}
/* The vendor tools print the detected capacity ("Flash size    : 8 Mbytes (64
   Mbits)" from a detect, "Flash size: 8 MBytes" from read-info), so a queue that
   would run past the chip stops before the write instead of after the error. */
function parseFlashSize(text) {
  const body = String(text || '');
  const mbytes = body.match(/Flash size\s*:\s*(\d+(?:\.\d+)?)\s*Mbytes?/i);
  if (mbytes) return Math.round(parseFloat(mbytes[1]) * 1024 * 1024);
  const mbits = body.match(/\(\s*(\d+)\s*Mbits\s*\)/i);
  return mbits ? Math.round(parseInt(mbits[1], 10) * 1024 * 1024 / 8) : 0;
}
function flashSizeOf(id) {
  const info = deviceInfo[id];
  return info && info.flashSize > 0 ? info.flashSize : 0;
}
function mbText(bytes) {
  return (Math.round((bytes / (1024 * 1024)) * 10) / 10) + ' MB';
}
/* Keeps the capacity the tool just printed, so the next image knows the limit. */
function recordFlashSize(id, text) {
  const size = parseFlashSize(text);
  if (!id || !size || !deviceInfo[id] || deviceInfo[id].flashSize === size) return size;
  deviceInfo[id].flashSize = size;
  saveDeviceCache();
  return size;
}
function setFpImages(paths) {
  state.fpFiles.length = 0;
  (paths || []).forEach(function (p) {
    const path = String(p || '').trim();
    if (path && state.fpFiles.indexOf(path) < 0) state.fpFiles.push(path);
  });
  renderFpFiles();
  syncFpRun();
  syncNoPreviewRows();
  if (typeof window.eabSyncQueueChrome === 'function') window.eabSyncQueueChrome();
}
function addFpImages(paths) { setFpImages(state.fpFiles.concat(paths || [])); }
function clearFpImages() { setFpImages([]); }
function removeFpImage(index) {
  const rest = state.fpFiles.slice();
  rest.splice(index, 1);
  setFpImages(rest);
}
const fpRowState = {};
/* Every row keeps its own clock, so the bar can report the time like the other
   progress bars do (label while writing, total once it settles). */
function fpFmtSecs(ms) {
  const s = Math.max(0, ms || 0) / 1000;
  return s < 10 ? s.toFixed(1) + 's' : Math.round(s) + 's';
}
function fpPaintRow(path, stateName, text, label) {
  const prev = fpRowState[path] || {};
  const st = stateName || '';
  let t0 = 0;
  let secs = 0;
  if (st === 'converting') {
    t0 = prev.state === 'converting' && prev.t0 ? prev.t0 : Date.now();
  } else if (st) {
    secs = prev.t0 ? Date.now() - prev.t0 : 0;
  }
  fpRowState[path] = { state: st, text: text || '', label: label || '', t0: t0, secs: secs };
  fpPaintRows();
}
/* Same row vocabulary the generator uses: converting / done / failed. */
function fpPaintRows() {
  $('#fp-file-list .fp-file-item').each(function () {
    const $el = $(this);
    const path = String($el.attr('data-path') || '');
    const m = fpRowState[path] || {};
    const converting = m.state === 'converting';
    const secs = converting && m.t0 ? Date.now() - m.t0 : (m.secs || 0);
    $el.removeClass('converting done failed cancelled');
    if (m.state) $el.addClass(m.state);
    $el.find('.file-item-status').first().text(
      m.text ? m.text + (m.state === 'converting' ? '' : (secs ? ' · ' + fpFmtSecs(secs) : '')) : '');
    $el.find('.file-item-bar-label').first().text(converting
      ? (m.label || 'programming…') + ' · ' + fpFmtSecs(secs) : '');
    $el.find('.file-item-progress-fill').first().css('width', m.state ? '100%' : '0%');
  });
  syncFpControls();
}
/* The queue clock: the vendor tool runs each flash_prog to the end and takes no
   pause / stop / cancel control, so the queue only reports where it is. */
const fpBatch = {
  status: 'idle',   // idle | running
  total: 0,
  done: 0,
  current: '',
  t0: 0,
  endAt: 0,
  ticker: null,
};
function fpBatchActive() {
  return fpBatch.status === 'running';
}
function fpBatchElapsed() {
  if (!fpBatch.t0) return 0;
  return Math.max(0, (fpBatch.endAt || Date.now()) - fpBatch.t0);
}
function syncFpControls() {
  const active = fpBatchActive();
  $('#fp-file-browse, #fp-file-clear').prop('disabled', active);
  setHint($('#fp-file-browse, #fp-file-clear'), active
    ? 'A programming run is using this queue — wait for it to finish' : '');
  const total = fpBatch.total;
  const time = active || fpBatch.done
    ? '⏱ ' + fpFmtSecs(fpBatchElapsed()) + (total ? ' · ' + fpBatch.done + '/' + total : '')
    : '';
  $('#fp-batch-time').text(time);
}
function fpBatchTick() {
  if (fpBatch.ticker) return;
  fpBatch.ticker = setInterval(function () {
    if (!fpBatchActive() && fpBatch.done >= fpBatch.total) {
      clearInterval(fpBatch.ticker);
      fpBatch.ticker = null;
    }
    fpPaintRows();
  }, 200);
}
function fpBatchBegin(total) {
  fpBatch.status = 'running';
  fpBatch.total = total;
  fpBatch.done = 0;
  fpBatch.current = '';
  fpBatch.t0 = Date.now();
  fpBatch.endAt = 0;
  fpBatchTick();
  syncFpControls();
  fpPaintRows();
}
function fpBatchEnd() {
  if (fpBatch.ticker) { clearInterval(fpBatch.ticker); fpBatch.ticker = null; }
  fpBatch.endAt = Date.now();
  fpBatch.current = '';
  fpBatch.status = 'idle';
  syncFpControls();
  fpPaintRows();
}
function fpPaintRest(paths, stateName, text) {
  paths.forEach(function (p) { fpPaintRow(p, stateName, text); });
}
function fpDropProgress(pct) {
  const v = Math.max(0, Math.min(100, pct || 0));
  $('#fp-drop-zone .dz-progress-fill').css('width', v + '%');
}
function renderFpFiles() {
  const $list = $('#fp-file-list');
  if (!$list.length) return;
  Object.keys(fpRowState).forEach(function (k) {
    if (state.fpFiles.indexOf(k) < 0) delete fpRowState[k];
  });
  $list.toggleClass('hidden', !state.fpFiles.length);
  $list.html(state.fpFiles.map(function (path, i) {
    return '<div class="file-item fp-file-item" data-path="' + escAttr(path) + '" title="' + escAttr(path) + '">' +
      '<span class="file-item-thumb-placeholder">🔌</span>' +
      '<span class="file-item-name">' + (i + 1) + '. ' + escAttr(assetName(path)) + '</span>' +
      '<span class="file-item-status"></span>' +
      '<div class="file-item-progress"><div class="file-item-progress-fill"></div><span class="file-item-bar-label"></span></div>' +
      '<span class="file-item-remove" data-path="' + escAttr(path) + '" title="Remove this image">×</span>' +
      '</div>';
  }).join(''));
  $list.find('.file-item-remove').on('click', function (e) {
    e.stopPropagation();
    if (fpBatchActive()) return;
    const at = state.fpFiles.indexOf(String($(this).attr('data-path') || ''));
    if (at >= 0) removeFpImage(at);
  });
  fpPaintRows();
}
window.eabSetFpImages = setFpImages;
window.eabAddFpImages = addFpImages;
window.clearFpImages = clearFpImages;
window.pickFpFile = pickFpFile;
function fpReadName() {
  const typed = $.trim(String($('#fp-read-name').val() || ''));
  const name = typed || ($('#fp-read-entire').prop('checked')
    ? 'flash_read_full'
    : 'flash_read_' + ($('#fp-read-start').val() || '0') + '_' + ($('#fp-read-length').val() || '4096'));
  return /\.bin$/i.test(name) ? name : name + '.bin';
}
function fpReadPath() {
  const dir = $.trim(String($('#fp-read-dir').val() || ''));
  return dir ? dir.replace(/[\\/]+$/, '') + '\\' + fpReadName() : '';
}
function pickFpReadDir() {
  if (!isEmbedded()) {
    const path = prompt('Enter output folder:');
    if (path) { $('#fp-read-dir').val(path); syncFpRun(); }
    return;
  }
  API_EAB_pickOutput({}).then(resp => {
    if (resp && resp.ok && resp.folder) {
      $('#fp-read-dir').val(resp.folder);
      syncFpRun();
    }
  }).catch(err => showError('Failed to open folder picker: ' + err));
}
function openFpReadDir() {
  const path = $.trim(String($('#fp-read-dir').val() || ''));
  if (path) API_EAB_openOutputLocation({ path: path });
}
function clearFpOut() { $('#fp-out').text(''); }
function clearDetectOut() { $('#fp-detect-out').text(''); }
const FP_ACTION_LABEL = {
  '--detect': 'Detecting flash chip',
  '--check-type': 'Checking flash type',
  '--readinfo': 'Reading flash info',
  '--readsfdp': 'Reading SFDP',
  '--chip-id': 'Reading chip ID',
  '--newblob': 'Installing blob',
  '--program': 'Programming flash',
  '--program-verify': 'Programming and verifying',
  '--update': 'Updating flash',
  '--update-verify': 'Updating and verifying',
  '--verify': 'Verifying flash',
  '--erase': 'Erasing flash',
  '--read': 'Reading flash',
  '--tx': 'Sending bytes',
  '--scan-nand': 'Scanning for bad blocks',
  '--sanitize-nand': 'Sanitizing bad blocks',
  '--map-nand': 'Mapping bad block'
};
let fpBusyTimer = null;
function fpBusyStart(action, cliArgs, deviceLabel, command) {
  const $busy = $('#fp-busy');
  if (!$busy.length) return;
  $('#fp-busy-label').text((FP_ACTION_LABEL[action] || 'Running command') +
    (deviceLabel ? ' · ' + deviceLabel : '') + '…');
  $('#fp-busy-sub').text((command || 'flash_prog') + ' ' + (cliArgs || []).join(' '));
  $('#fp-busy-time').text('0.0s');
  $busy.removeClass('hidden');
  const started = Date.now();
  clearInterval(fpBusyTimer);
  fpBusyTimer = setInterval(function () {
    $('#fp-busy-time').text(((Date.now() - started) / 1000).toFixed(1) + 's');
  }, 100);
  $('[data-fp-run]').removeClass('is-busy').removeAttr('aria-busy');
  if (action) $('[data-fp-run="' + action + '"]').addClass('is-busy').attr('aria-busy', 'true');
}
function fpBusyStop() {
  clearInterval(fpBusyTimer);
  fpBusyTimer = null;
  $('#fp-busy').addClass('hidden');
  $('[data-fp-run]').removeClass('is-busy').removeAttr('aria-busy');
}
function fpFlash($out) {
  if (!$out || !$out.length) return;
  $out.removeClass('is-fresh');
  void $out[0].offsetWidth;
  $out.addClass('is-fresh');
}
/* Every argument comes from the chip the run targets (runTarget): the part decides
   the tool family and the legacy --chip value, and the module is the device row. */
function flashProgArgs(action, dev, info, file, offsetAt) {
  const target = runTarget(info);
  const is82x = target.gen === 'bt82x';
  const cliArgs = [action];
  if (action === '--detect') {
    cliArgs.push($('#fp-detect-write').prop('checked') ? 'all' : 'safe');
  } else if (action === '--map-nand') {
    cliArgs.push($('#fp-map-bad').val().trim(), $('#fp-map-good').val());
  } else if (action === '--tx') {
    cliArgs.push($('#diag-tx').val().trim());
  } else if (action === '--read') {
    cliArgs.push(fpReadPath());
  } else if (FP_FILE_OPS.includes(action)) {
    cliArgs.push(String(file || ''));
  }
  if (dev) cliArgs.push('--module', dev);
  const frequency = devFreq(dev);
  if (frequency) cliArgs.push('--frequency', String(frequency));
  if (!is82x && target.prog) cliArgs.push('--chip', target.prog);
  if (action === '--tx') {
    const rx = $('#diag-rx').val().trim();
    cliArgs.push('--rx', rx === '' ? '1' : rx);
  }
  if (action === '--read') {
    if ($('#fp-read-entire').prop('checked')) {
      cliArgs.push('--offset', '0', '--length', '0');
    } else {
      cliArgs.push('--offset', $.trim(String($('#fp-read-start').val() || '')) || '0');
      cliArgs.push('--length', $.trim(String($('#fp-read-length').val() || '')) || '4096');
    }
  } else {
    const offset = offsetAt == null
      ? $.trim(String($('#fp-offset').val() || ''))
      : String(offsetAt);
    if (offset) cliArgs.push('--offset', offset);
  }
  return cliArgs;
}
/* The chip a run will use, in precedence order:
   1. the part the board itself reported (every FTDI device),
   2. a part another connected board reported — a Pico has no probe of its own and
      is wired to the same EVE, so the FTDI adapter that did probe it is the best
      evidence there is,
   3. the part picked in the Generator's chip card (the image format).
   The tool family drives the command name (the host only registers bt82x/bt81x/
   ft80x/flash_prog style names), the part only the legacy --chip. */
function runTarget(info) {
  let part = String((info && info.part) || '');
  if (!CHIP_TABLE[part]) {
    part = '';
    Object.keys(deviceInfo).forEach(function (id) {
      const p = String((deviceInfo[id] || {}).part || '');
      if (!part && CHIP_TABLE[p]) part = p;
    });
  }
  if (!CHIP_TABLE[part]) part = selectedChipPart();
  const row = part ? CHIP_TABLE[part] : null;
  const gen = row ? row[1] : String((info && info.gen) || chipGeneration() || 'ft80x');
  return {
    part: part,
    gen: gen,
    prog: row ? row[2] : String((info && info.prog) || ''),
    command: gen + ' flash_prog',
  };
}
function selectedChipPart() {
  const part = String($('#chip-name').val() || '');
  return CHIP_TABLE[part] ? part : '';
}
async function runFlashCommand(cliArgs, $out, opts) {
  const append = !!(opts && opts.append);
  const gen = (opts && opts.gen) || 'ft80x';
  const command = (opts && opts.command) || gen + ' flash_prog';
  const header = '▶ ' + command + ' ' + cliArgs.join(' ');
  const prev = append && $.trim($out.text()) ? $out.text().replace(/\s+$/, '') + '\n\n' : '';
  let ok = true;
  fpRunning = true;
  syncFpRun();
  syncDiagnosticGate();
  hideError();
  fpBusyStart(cliArgs[0], cliArgs, opts && opts.label, command);
  $out.text(prev + header);
  fpFlash($out);
  log(header);
  try {
    const resultJson = await invokeHost('execute_extension_command', {
      extensionId: 'flash_utilities',
      cliCommand: command,
      cliArgs: cliArgs,
    });
    const result = JSON.parse(resultJson);
    const body = result && typeof result.output === 'string' ? result.output.replace(/\s+$/, '') : '';
    if (body !== '') {
      $out.text(prev + header + '\n' + body);
      fpFlash($out);
      log(body);
      if (opts && opts.device) recordFlashSize(opts.device, body);
    }
    if (result && result.success === false) {
      const msg = 'flash_prog failed: ' + fpFailure(
        typeof result.exit_code === 'number' ? result.exit_code : null,
        result.error || '',
        result.output || '');
      showError(msg);
      $out.text($out.text().replace(/\s+$/, '') + '\n✗ ' + msg);
      fpFlash($out);
      log('✗ ' + msg);
      ok = false;
    } else {
      // The vendor tool can finish silently, so the console always ends on a
      // result line instead of leaving the user with only the command echo.
      const ms = result && typeof result.elapsed_ms === 'number' ? result.elapsed_ms : 0;
      $out.text($out.text().replace(/\s+$/, '') + '\n✓ done' + (ms ? ' in ' + (ms / 1000).toFixed(1) + 's' : ''));
      fpFlash($out);
      log('✓ flash_prog finished');
    }
  } catch (err) {
    const cancelled = String(err) === 'cancelled';
    if (cancelled) {
      $out.text($out.text().replace(/\s+$/, '') + '\n■ cancelled');
      fpFlash($out);
      log('■ flash_prog cancelled');
      ok = 'cancelled';
    } else {
      const msg = 'flash_prog failed: ' + err;
      showError(msg);
      $out.text($out.text().replace(/\s+$/, '') + '\n✗ ' + msg);
      fpFlash($out);
      log('✗ flash_prog: ' + err);
      ok = false;
    }
  } finally {
    fpRunning = false;
    fpBusyStop();
    syncFpRun();
    syncDiagnosticGate();
  }
  return ok;
}
async function runFlashProg(logTo) {
  const action = String($('#fp-action').val() || '');
  if (!action) { showError('Please choose an operation.'); return; }
  if (!selectedDevices.size) { showError('Scan the Connection panel and select a device first.'); return; }
  if (action === '--map-nand') {
    if ($('#fp-map-bad').val().trim() === '' || !$('#fp-map-good').val()) {
      showError('Map NAND needs both a bad-block and a good-block number.');
      return;
    }
  } else if (action === '--tx') {
    if (!$('#diag-tx').val().trim()) { showError('Enter the bytes to transmit.'); return; }
  } else if (action === '--read') {
    if (!fpReadPath()) { showError('Pick an output folder for the read.'); return; }
  } else if (FP_FILE_OPS.includes(action)) {
    if (!state.fpFiles.length) { showError('Please select a flash image for this operation.'); return; }
  }
  const devices = Array.from(selectedDevices);
  const $out = $(logTo || fpOutSelector(action));
  if (FP_PROGRAM_OPS.indexOf(action) >= 0) {
    await runFlashImages(action, devices, $out);
    return;
  }
  const file = FP_FILE_OPS.includes(action) ? state.fpFiles[0] : '';
  let ran = 0;
  for (let i = 0; i < devices.length; i++) {
    const dev = devices[i];
    const info = infoFor(dev);
    if (picoCantRun(dev, action)) {
      log('skip ' + dev + ': a Pico only programs an image');
      continue;
    }
    if (!info.gen) {
      log('skip ' + dev + ': no EVE chip detected — connect it again');
      continue;
    }
    const only = $('#fp-action option[value="' + action + '"]').attr('data-chip');
    if (only && !genInFamily(info.gen, only)) {
      log('skip ' + dev + ': ' + action + ' is not available on ' + info.gen.toUpperCase());
      continue;
    }
    if (action === '--program' && !canProgram(info)) {
      log('skip ' + dev + ': Program is only available on BT817, BT818 and BT82X');
      continue;
    }
    await runFlashCommand(flashProgArgs(action, dev, info, file), $out, {
      append: ran > 0,
      label: devices.length > 1 ? dev + ' (' + (i + 1) + '/' + devices.length + ')' : dev,
      gen: info.gen,
      command: runTarget(info).command,
    });
    ran++;
  }
  if (!ran) showError('No selected device can run this action.');
}
/* Program runs once per queued image, one after the other: image n starts where
   image n-1 ended (padded to #fp-pad), so every image keeps its own flash_prog
   call, its own offset, its own row and its own clock. */
async function runFlashImages(action, devices, $out) {
  const files = state.fpFiles.slice();
  const pad = fpPadBytes();
  const start = fpStartOffset();
  const runs = devices.length * files.length;
  const sizes = {};
  let done = 0;
  let ran = 0;
  let unreadable = false;
  let overrun = false;
  fpBatchBegin(runs);
  fpDropProgress(0);
  try {
    for (const path of files) {
      try {
        sizes[path] = await fpFileSize(path);
      } catch (err) {
        sizes[path] = -1;
        unreadable = true;
        fpPaintRow(path, 'failed', 'unreadable');
        log('✗ ' + ((err && err.message) || err));
      }
    }
    for (let d = 0; d < devices.length; d++) {
      const dev = devices[d];
      const info = infoFor(dev);
      if (picoCantRun(dev, action)) {
        log('skip ' + dev + ': a Pico only programs an image');
        continue;
      }
      if (!info.gen) {
        log('skip ' + dev + ': no EVE chip detected — connect it again');
        continue;
      }
      const only = $('#fp-action option[value="' + action + '"]').attr('data-chip');
      if (only && !genInFamily(info.gen, only)) {
        log('skip ' + dev + ': ' + action + ' is not available on ' + info.gen.toUpperCase());
        continue;
      }
      if (action === '--program' && !canProgram(info)) {
        log('skip ' + dev + ': Program is only available on BT817, BT818 and BT82X');
        continue;
      }
      let offset = start;
      for (let i = 0; i < files.length; i++) {
        const path = files[i];
        const size = sizes[path];
        const step = files.length > 1 ? (i + 1) + '/' + files.length + ' · ' : '';
        if (size < 0) {
          done++;
          fpBatch.done = done;
          fpDropProgress(runs ? done / runs * 100 : 0);
          continue;
        }
        /* Never write past the end of the flash: the rest of the queue is marked
           as not fitting instead of asking the tool to write out of range. The
           limit can also come from the previous run's own output. */
        const capacity = flashSizeOf(dev);
        if (capacity && offset + size > capacity) {
          overrun = true;
          log('✗ ' + dev + ': ' + assetName(path) + ' at ' + addrHex(offset) + ' + ' + size +
            ' B does not fit in ' + mbText(capacity));
          fpPaintRest(files.slice(i), '', 'does not fit · beyond ' + mbText(capacity));
          break;
        }
        const at = offset;
        fpBatch.current = path;
        fpPaintRow(path, 'converting', 'programming…', step + addrHex(at));
        const res = await runFlashCommand(
          flashProgArgs(action, dev, info, path, at), $out, {
            append: ran > 0,
            label: (devices.length > 1 ? dev + ' · ' : '') + (step || '') + addrHex(at),
            gen: info.gen,
            command: runTarget(info).command,
            device: dev,
          });
        fpBatch.current = '';
        offset += padLength(size, pad);
        done++;
        fpBatch.done = done;
        fpDropProgress(runs ? done / runs * 100 : 0);
        /* 'cancelled' only comes back when the host cancelled the job itself (from
           its own task list) — the queue still moves on to the next image. */
        if (res === 'cancelled') {
          fpPaintRow(path, 'cancelled', 'cancelled · ' + addrHex(at));
          continue;
        }
        fpPaintRow(path, res ? 'done' : 'failed',
          (res ? 'done' : 'failed') + ' · ' + addrHex(at));
        ran++;
      }
    }
  } finally {
    fpBatch.done = done;
    fpBatchEnd();
  }
  if (!ran && !unreadable && !overrun) showError('No selected device can run this action.');
}
function fpOutSelector(action) {
  return fpPageForAction(action) === 'detect' ? '#fp-detect-out' : '#fp-out';
}
function fpRunAction(action) {
  if (fpRunning || !action) return;
  $('#fp-action').val(action);
  onFpActionChange();
  runFlashProg();
}
function fpReadLut() {
  const t = targetDevice();
  if (!t) { showError('Scan the Connection panel and select a device first.'); return; }
  const info = t.info;
  const target = runTarget(info);
  const args = ['--tx', '0xa5, 0', '--rx', '80'];
  if (t.id !== 'Pico') args.push('--module', t.id);
  const frequency = devFreq(t.id);
  if (frequency) args.push('--frequency', String(frequency));
  if (target.gen !== 'bt82x' && target.prog) args.push('--chip', target.prog);
  runFlashCommand(args, $('#fp-out'), { gen: target.gen, command: target.command, label: t.id });
}
window.fpRunAction = fpRunAction;
window.fpReadLut = fpReadLut;
window.pickFpReadDir = pickFpReadDir;
window.openFpReadDir = openFpReadDir;
window.clearFpOut = clearFpOut;
window.clearDetectOut = clearDetectOut;
function buildFlashArgs() {
  const outputDir = $('#output-dir').val() || '.';
  const outputName = $('#output-name').val() || 'flash';
  const blobPath = $('#blob-path').val();
  const cliArgs = ['-o', outputDir, '-n', outputName];
  if (blobPath) cliArgs.push('-b', blobPath);
  if (!$('#align-check').prop('checked')) cliArgs.push('-k');
  if ($('#edf-check').prop('checked')) cliArgs.push('-d');
  const listFiles = state.assetFiles.filter(f => f.asList);
  const plainFiles = state.assetFiles.filter(f => !f.asList);
  if (listFiles.length > 0) cliArgs.push('-I', listFiles[0].path);
  plainFiles.forEach(f => cliArgs.push(f.path));
  return cliArgs;
}
async function startBatch() {
  if (buildRunning) return;
  if (state.assetFiles.length === 0) {
    showError('Please add at least one input asset file.');
    return;
  }
  if (!chipGeneration()) {
    showError('Please select an EVE chip.');
    return;
  }
  buildRunning = true;
  lastJobStatus = 0;
  showBuildStop(true);
  updateBatchState();
  hideError();
  $('#result-panel').addClass('hidden');
  setTotalProgress(0);
  paintBuildRows('converting', '', 'building…');
  try {
    const resultJson = await invokeHost('execute_extension_command', {
      extensionId: 'flash_utilities',
      cliCommand: (chipGeneration() || 'ft80x') + ' flash_gen',
      cliArgs: buildFlashArgs(),
    }, function (status, pct) {
      lastJobStatus = status;
      if (pct) setTotalProgress(pct);
    });
    onConvertComplete(JSON.parse(resultJson));
  } catch (err) {
    const cancelled = lastJobStatus === 4;
    paintBuildRows(cancelled ? 'cancelled' : 'failed', cancelled ? '⊘ cancelled' : '✗ ' + err);
    showError(cancelled ? 'Build cancelled.' : 'Build failed: ' + err);
    log((cancelled ? '⊘ ' : '✗ ') + 'flash image: ' + (cancelled ? 'cancelled' : err));
  } finally {
    buildRunning = false;
    showBuildStop(false);
    updateBatchState();
  }
}
function onConvertComplete(result) {
  if (!result || result.success !== true) {
    const reason = (result && result.error) || 'unknown conversion error';
    paintBuildRows('failed', '✗ ' + reason);
    showError(reason);
    log('✗ flash image: ' + reason);
    return;
  }
  const n = state.assetFiles.length;
  paintBuildRows('done', '✓ ' + n + (n === 1 ? ' asset' : ' assets'));
  setTotalProgress(100);
  $('#result-panel').removeClass('hidden');
  const stats = [];
  if (result.output_size !== undefined) stats.push(['Flash Size', result.output_size + ' B']);
  if (result.num_assets !== undefined) stats.push(['Assets', result.num_assets]);
  if (result.elapsed_ms !== undefined) stats.push(['Time', (result.elapsed_ms / 1000).toFixed(2) + 's']);
  $('#result-stats').html(stats.map(([l, v]) => `
    <div class="stat-item">
      <span class="stat-label">${l}</span>
      <span class="stat-value">${v}</span>
    </div>
  `).join(''));
  if (result.output_files && result.output_files.length > 0) {
    const filesHtml = result.output_files.map(f =>
      `<div class="file-out" onclick="openFile('${f.replace(/'/g, "\\'")}')">📄 ${f}</div>`
    ).join('');
    $('#result-files').html(`<div class="result-files-head">Output Files:</div>${filesHtml}`);
  }
  log('✓ flash image built in ' + ((result.elapsed_ms || 0) / 1000).toFixed(1) + 's');
}
function openFile(path) {
  invokeHost('open_in_explorer', { path });
}
/* The sidebar log keeps the last N lines, so a long scan does not grow the DOM. */
const CONN_LOG_MAX = 500;
function log(msg) {
  console.log('[eab] ' + msg);
  const $log = $('#conn-log');
  if (!$log.length) return;
  const lines = ($log.text().replace(/\n+$/, '') + '\n' + String(msg)).replace(/^\n+/, '').split(/\r?\n/);
  $log.text(lines.slice(-CONN_LOG_MAX).join('\n') + '\n');
  $log[0].scrollTop = $log[0].scrollHeight;
  // the log is collapsed by default, so the summary carries a dot for the
  // activity a user would otherwise miss
  if (!$('#conn-log-card').prop('open')) $('#conn-log-dot').removeClass('hidden');
}
window.clearConnLog = function (event) {
  if (event) { event.preventDefault(); event.stopPropagation(); }
  $('#conn-log').text('');
  $('#conn-log-dot').addClass('hidden');
};
function showError(msg) {
  const $panel = $('.tab-content.active .error-panel').first();
  if (!$panel.length) return;
  if (!$panel.closest('#tab-programmer').length) {
    $panel.text(msg).removeClass('hidden');
    return;
  }
  if (!$panel.children().length) {
    $panel.html('<span class="fp-error-icon" aria-hidden="true">!</span>' +
      '<span class="fp-error-text"></span>' +
      '<button class="fp-error-close" type="button" aria-label="Dismiss message">×</button>');
    $panel.find('.fp-error-close').on('click', hideError);
  }
  $panel.removeClass('hidden is-in');
  void $panel[0].offsetWidth;
  $panel.addClass('is-in');
  const parts = String(msg || '').split(/,\s*detail:\s*/i);
  const $text = $panel.find('.fp-error-text').empty();
  if (parts.length > 1) {
    $text.append($('<b>').text(parts[0]))
      .append($('<span>').addClass('fp-error-detail').text('detail: ' + parts.slice(1).join(', ')));
  } else {
    $text.text(parts[0]);
  }
}
function hideError() {
  $('.error-panel').addClass('hidden').removeClass('is-in');
}
function toolDetail(output) {
  const lines = String(output || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    .filter(l => !/^BT81[57] blob path:/.test(l) && !/^EVE flash pico path:/.test(l));
  return lines.length ? lines[lines.length - 1] : '';
}
function fpFailure(code, reason, output) {
  const parts = ['failed'];
  if (typeof code === 'number') parts.push('error code: ' + code);
  const tail = toolDetail(output);
  let detail = String(reason || '')
    .replace(/^[^:]*\.exe exited with code \d+:\s*/i, '')
    .replace(/^[^:]*\.exe exited with code \d+\.?\s*$/i, '');
  if (!detail) {
    detail = tail;
  } else if (tail && !/[.!?](\s|$)/.test(detail) &&
             detail.toLowerCase().indexOf(tail.toLowerCase()) < 0) {
    detail = detail.replace(/[.\s]+$/, '') + '. ' + tail;
  }
  parts.push('detail: ' + (detail ||
    'the programmer stopped without a message. Check the board connection and the selected host interface.'));
  return parts.join(', ');
}
function runCliJob(cliCommand, cliArgs, onProgress) {
  return API_EAB_startJob({ command: cliCommand, args: cliArgs }).then(function (resp) {
    if (!resp || !resp.ok || !resp.jobId) throw new Error((resp && resp.error) || 'Could not start the job');
    currentJobId = resp.jobId;
    const t0 = Date.now();
    return new Promise(function (resolve, reject) {
      const poll = setInterval(function () {
        API_EAB_pollJob({ jobId: resp.jobId }).then(function (p) {
          if (!p || !p.ok || !p.progress) return;
          const st = p.progress.status;
          if (typeof onProgress === 'function') onProgress(st, p.progress.progress || 0);
          if (st === 0 || st === 1) return;
          clearInterval(poll);
          currentJobId = null;
          const ms = Date.now() - t0;
          let code = null, reason = '', output = '';
          try {
            const r = JSON.parse(p.progress.result || '{}');
            if (typeof r.exit_code === 'number') code = r.exit_code;
            reason = r.error || '';
            output = r.output || '';
          } catch (e) { }
          if (st === 2) {
            resolve(p.progress.result || '{}');
          } else {
            reject(st === 3 ? fpFailure(code, reason, output) : 'cancelled');
          }
        }).catch(function () {  });
      }, 250);
    });
  });
}
function invokeHost(cmd, args, onProgress) {
  switch (cmd) {
    case 'execute_extension_command':
      return runCliJob(args.cliCommand, args.cliArgs, onProgress);
    case 'open_in_explorer':
      return API_EAB_openOutputLocation({ path: args.path }).then(resp => {
        if (resp.ok) return;
        return Promise.reject(resp.error || 'Failed to open location');
      });
    default:
      return Promise.reject('Unknown command: ' + cmd);
  }
}
window.eabCancelBatch = function () {
  const id = currentJobId;
  if (!id) return;
  currentJobId = null;
  lastJobStatus = 4;
  API_EAB_cancelJob({ jobId: id }).catch(function () {  });
};
function switchTab(which) {
  $('.tab-content').removeClass('active');
  $('#tab-' + which).addClass('active');
  $('.tab-btn').removeClass('active');
  const $tab = $('.tab-btn[data-tab="' + which + '"]').addClass('active');
  if (which === 'samplecode') ensureFlashSamples();
  // a locked tab still opens so its tooltip and controls are readable; the
  // Connection card blinks to show what has to happen before anything runs
  if ($tab.hasClass('is-locked')) blinkMissing('#conn-card');
  if (which === 'blobrelease' && typeof syncBlobRelease === 'function') syncBlobRelease();
  if (which === 'generator' && typeof syncBlobChoices === 'function') syncBlobChoices();
  // repaint the image rows: a generator build writes every .file-item-progress-fill
  if (which === 'programmer' && typeof renderFpFiles === 'function') renderFpFiles();
  if (typeof window.eabSyncQueueChrome === 'function') window.eabSyncQueueChrome();
  if (window.__EAB_WORKBENCH && typeof window.__EAB_WORKBENCH.relayout === 'function') {
    window.__EAB_WORKBENCH.relayout();
  }
}
var FLASH_SAMPLES = window.FLASH_SAMPLES || {};
var flashSamplesPromise = null;
var FLASH_SCOPE_NOTE = {
  bt82x: 'NAND flash extension samples',
  legacy: 'NOR flash samples'
};
var flashSampleScope = 'bt82x';
var flashSampleKey = '';
function ensureFlashSamples() {
  if (window.FLASH_SAMPLES) {
    FLASH_SAMPLES = window.FLASH_SAMPLES;
    return Promise.resolve(true);
  }
  if (flashSamplesPromise) return flashSamplesPromise;
  if (typeof API_EAB_readExtFile !== 'function') {
    $('#sample-hint').text('Sample code is unavailable.');
    console.error('[Flash Utilities] readExtFile API is unavailable.');
    return Promise.resolve(false);
  }
  flashSamplesPromise = API_EAB_readExtFile({path: 'flash_samples.js'}).then(function (resp) {
    if (!resp || !resp.ok || !resp.data) throw new Error(resp && resp.error || 'Could not read flash_samples.js');
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.async = true;
      script.src = resp.data;
      script.onload = function () {
        script.remove();
        if (!window.FLASH_SAMPLES) reject(new Error('flash_samples.js did not define FLASH_SAMPLES'));
        else resolve();
      };
      script.onerror = function () {
        script.remove();
        reject(new Error('Could not execute flash_samples.js'));
      };
      document.head.appendChild(script);
    });
  }).then(function () {
    FLASH_SAMPLES = window.FLASH_SAMPLES;
    renderFlashSampleTabs();
    showFlashSample(flashSampleKey);
    return true;
  }).catch(function (error) {
    flashSamplesPromise = null;
    $('#sample-hint').text('Sample code could not be loaded.');
    console.error('[Flash Utilities] Failed to load sample code:', error);
    return false;
  });
  return flashSamplesPromise;
}
function flashSampleSet() {
  return FLASH_SAMPLES[flashSampleScope] || {};
}
function renderFlashSampleTabs() {
  var set = flashSampleSet();
  var keys = Object.keys(set);
  var $row = $('#sample-tabs');
  if (!$row.length) return;
  if (!set[flashSampleKey]) flashSampleKey = keys[0] || '';
  $row.html(keys.map(function (key) {
    var label = $('<span>').text(set[key].label || key).html();
    return '<button class="tab-sub-btn" type="button" data-sample="' + key + '">' + label + '</button>';
  }).join(''));
  $row.find('.tab-sub-btn').on('click', function () {
    showFlashSample(String($(this).attr('data-sample')));
  });
}
function setFlashSampleScope(scope) {
  ensureFlashSamples().then(function (loaded) {
    if (!loaded) return;
    flashSampleScope = FLASH_SAMPLES[scope] ? scope : 'bt82x';
    $('.sample-scope-btn').each(function () {
      var on = String($(this).attr('data-scope')) === flashSampleScope;
      $(this).toggleClass('active', on).attr('aria-selected', on ? 'true' : 'false');
    });
    $('#sample-scope-note').text(FLASH_SCOPE_NOTE[flashSampleScope] || '');
    renderFlashSampleTabs();
    showFlashSample(flashSampleKey);
  });
}
function syncFlashSampleScope() {
  if (!chipGeneration()) return;
  var scope = chipGroup();
  if (scope !== flashSampleScope) setFlashSampleScope(scope);
}
window.setFlashSampleScope = setFlashSampleScope;
function showFlashSample(key) {
  var set = flashSampleSet();
  var s = set[key] || set[flashSampleKey];
  if (!s) return;
  flashSampleKey = set[key] ? key : flashSampleKey;
  $('#sample-hint').text(s.hint);
  $('#sample-code').text(s.code);
  $('.tab-sub-btn').each(function () {
    $(this).toggleClass('active', $(this).attr('data-sample') === flashSampleKey);
  });
}
function copySample() {
  var $code = $('#sample-code');
  if (!$code.length) return;
  var text = $code.text() || '';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(function () {});
  } else {
    var $t = $('<textarea>').val(text);
    $('body').append($t);
    $t.get(0).select();
    try { document.execCommand('copy'); } catch (e) {  }
    $t.remove();
  }
  var $hint = $('#sample-hint');
  if ($hint.length) {
    $hint.text('📋 Copied to the clipboard.');
    setTimeout(function () { showFlashSample(flashSampleKey); }, 1200);
  }
}
/* The bundled blobs live in flash_blob/, one folder per chip family, and the
   folder name is the only thing that ties a blob to a chip. */
var BLOB_ROOT = 'flash_blob';
var BLOB_FAMILIES = [
  { key: 'bt82x', label: 'BT82X · BT820', dir: 'bt82x' },
  { key: 'BT815/6', label: 'BT815/6 · BT815 / BT816', dir: 'bt815_6-blob' },
  { key: 'BT817/8', label: 'BT817/8 · BT817 / BT818', dir: 'bt817_8-blob' }
];
var blobScan = null;
var blobScanPromise = null;
var blobReleaseDir = '';
var blobFolderAbs = '';
function blobFamily(key) {
  for (var i = 0; i < BLOB_FAMILIES.length; i++) {
    if (BLOB_FAMILIES[i].key === key) return BLOB_FAMILIES[i];
  }
  return null;
}
/* The chip picked in the generator decides the family; the legacy programmer
   chip only stands in when no chip is picked at all. */
function blobFamilyKey() {
  if (chipGeneration()) return chipGroup() === 'bt82x' ? 'bt82x' : String($('#fp-chip').val() || 'BT815/6');
  return String($('#fp-chip').val() || 'BT815/6');
}
function blobFamilyDir() {
  var fam = blobFamily(blobFamilyKey()) || BLOB_FAMILIES[1];
  return fam.dir;
}
function blobScanFiles() {
  return (blobScan && blobScan.files) || [];
}
function blobScanIn(dir) {
  return blobScanFiles().filter(function (f) { return f.folder === dir; });
}
function blobScanLoad() {
  if (blobScanPromise) return blobScanPromise;
  if (typeof API_EAB_listExtAssets !== 'function') return Promise.reject(new Error('no host scan'));
  blobScanPromise = API_EAB_listExtAssets({ path: BLOB_ROOT }).then(function (resp) {
    if (!resp || !resp.ok) throw new Error((resp && resp.error) || 'list failed');
    var files = (resp.files || []).map(function (rel) {
      var at = String(rel).lastIndexOf('/');
      return { folder: at < 0 ? '' : rel.slice(0, at), name: at < 0 ? rel : rel.slice(at + 1), rel: rel };
    });
    blobScan = { files: files };
    return blobScan;
  }).catch(function (err) {
    blobScanPromise = null;
    throw err;
  });
  return blobScanPromise;
}
/* The generator runs the CLI from the app folder, not the extension folder, so a
   scanned blob is handed over as an absolute path: reading its README tells the
   host's absolute folder once per chip folder. */
var blobAbsDirs = {};
function blobAbsDir(dir) {
  if (blobAbsDirs[dir] !== undefined) return Promise.resolve(blobAbsDirs[dir]);
  var probe = blobReadmeName(dir) || (blobScanIn(dir)[0] || {}).name;
  if (!probe) { blobAbsDirs[dir] = ''; return Promise.resolve(''); }
  return API_EAB_readExtFile({ path: BLOB_ROOT + '/' + dir + '/' + probe }).then(function (resp) {
    var abs = (resp && resp.ok && resp.path) ? String(resp.path).replace(/[\\/][^\\/]+$/, '') : '';
    blobAbsDirs[dir] = abs;
    return abs;
  }).catch(function () { blobAbsDirs[dir] = ''; return ''; });
}
function blobPathOf(dir, name) {
  var abs = blobAbsDirs[dir];
  if (abs) return abs + '\\' + name;
  return BLOB_ROOT + '/' + dir + '/' + name;
}
/* The generator's Blob File list: every scanned blob, the selected chip's
   folder first, plus whatever the user browsed to on the PC. A chip change
   forces the chip's default blob, so the image never keeps another chip's. */
function renderBlobChoices(force) {
  var $sel = $('#blob-path');
  if (!$sel.length) return Promise.resolve();
  var dir = blobFamilyDir();
  var dirs = {};
  blobScanFiles().forEach(function (f) { if (f.folder) dirs[f.folder] = 1; });
  var resolve = Object.keys(dirs).map(blobAbsDir);
  return Promise.all(resolve).then(function () {
    var current = String($sel.val() || '');
    var files = blobScanFiles().filter(function (f) { return /\.blob$/i.test(f.name); })
      .slice().sort(function (a, b) {
        var fa = a.folder === dir ? 0 : 1, fb = b.folder === dir ? 0 : 1;
        return fa - fb || a.rel.localeCompare(b.rel);
      });
    var html = '<option value="">(none — no blob in the image)</option>';
    files.forEach(function (f) {
      var path = blobPathOf(f.folder, f.name);
      var label = f.folder ? f.folder + '/' + f.name : f.name;
      html += '<option value="' + escAttr(path) + '">' + escAttr(label) + '</option>';
    });
    $sel.html(html);
    if (current && !files.some(function (f) { return blobPathOf(f.folder, f.name) === current; })) {
      $sel.append('<option value="' + escAttr(current) + '">' + escAttr(current) + '</option>');
    }
    /* A blob from another chip folder is replaced by this chip's default; a path
       the user browsed to on the PC is not in the scan and stays. */
    var mine = files.filter(function (f) { return f.folder === dir; })
      .map(function (f) { return blobPathOf(f.folder, f.name); });
    var scanned = files.some(function (f) { return blobPathOf(f.folder, f.name) === current; });
    /* Nothing scanned (no flash_blob/ next to the extension) leaves the box as
       it was, so a browsed path is never dropped. */
    var keep = !files.length || (!force && (mine.indexOf(current) >= 0 || (!scanned && current)));
    $sel.val(keep ? current : blobDefaultFor(dir));
  });
}
function blobDefaultFor(dir) {
  var files = blobScanIn(dir).filter(function (f) { return /\.blob$/i.test(f.name); });
  if (!files.length) return '';
  var def = files.filter(function (f) { return /^default/i.test(f.name); })[0];
  return blobPathOf(dir, (def || files[0]).name);
}
function syncBlobChoices(force) {
  var ready = blobScan ? Promise.resolve(blobScan) : blobScanLoad().catch(function () { return null; });
  return ready.then(function () { return renderBlobChoices(force); });
}
function onBlobReleaseChip() {
  var key = String($('#blob-release-chip').val() || '');
  var fam = blobFamily(key);
  if (!fam) return;
  var $name = $('#chip-name');
  if (fam.key === 'bt82x') {
    if ($name.length) $name.val('BT820');
  } else if ($name.length) {
    $name.val(fam.key === 'BT817/8' ? 'BT817' : 'BT815');
  }
  window.onChipPick('part');
}
function syncBlobReleaseChip() {
  var $sel = $('#blob-release-chip');
  if (!$sel.length) return;
  if (!$sel.find('option').length) {
    $sel.html(BLOB_FAMILIES.map(function (f) {
      return '<option value="' + escAttr(f.key) + '">' + escAttr(f.label) + '</option>';
    }).join(''));
  }
  $sel.val(blobFamilyKey());
}
function textFromDataUrl(dataUrl) {
  var raw = String(dataUrl || '');
  var at = raw.indexOf('base64,');
  if (at < 0) return raw;
  var bin = atob(raw.slice(at + 7));
  var bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}
function renderBlobFiles(files) {
  var $box = $('#blob-files');
  if (!$box.length) return;
  var names = (files || []).filter(function (name) { return /\.blob$/i.test(name); });
  if (!names.length) {
    $box.html('<span class="blob-files-empty">No .blob files in this folder yet — browse to one on the Generator tab, or drop the vendor blobs in here.</span>');
    return;
  }
  $box.html(names.map(function (name) {
    return '<span class="blob-file">💾 ' + escAttr(name) + '</span>';
  }).join(''));
}
/* The release notes are what the vendor README says, unchanged: the scan tells
   which file in the folder is the README (README or README.txt). */
function blobReadmeName(dir) {
  var hit = blobScanIn(dir).filter(function (f) {
    return /^README(\.[A-Za-z0-9]+)?$/i.test(f.name);
  })[0];
  return hit ? hit.name : '';
}
function syncBlobRelease() {
  syncBlobReleaseChip();
  var dir = blobFamilyDir();
  var folder = BLOB_ROOT + '/' + dir;
  if (!blobReleaseDir && !$('#tab-blobrelease').hasClass('active')) return;
  if (folder === blobReleaseDir) return;
  blobReleaseDir = folder;
  blobFolderAbs = '';
  $('#blob-folder-line').text('Bundled folder: ' + folder);
  $('#blob-files').empty();
  $('#blob-notes').text('Loading release notes…');
  var ready = blobScan ? Promise.resolve(blobScan) : blobScanLoad().catch(function () { return null; });
  ready.then(function () {
    if (blobReleaseDir !== folder) return null;
    renderBlobFiles(blobScanIn(dir).map(function (f) { return f.name; }));
    var readme = blobReadmeName(dir);
    if (!readme) throw new Error('no README in ' + folder);
    return API_EAB_readExtFile({ path: folder + '/' + readme });
  }).then(function (resp) {
    if (!resp || blobReleaseDir !== folder) return null;
    if (!resp.ok) throw new Error(resp.error || 'read failed');
    blobFolderAbs = String(resp.path || '').replace(/[\\/][^\\/]+$/, '');
    $('#blob-folder-line').text('Bundled folder: ' + (blobFolderAbs || folder));
    return textFromDataUrl(resp.data);
  }).then(function (text) {
    if (text == null || blobReleaseDir !== folder) return;
    var notes = String(text).replace(/\r\n/g, '\n').trim();
    $('#blob-notes').text(notes || 'No release notes bundled for this chip group.');
  }).catch(function (err) {
    if (blobReleaseDir !== folder) return;
    $('#blob-notes').text('No release notes bundled for this chip group.\n' + String((err && err.message) || err));
  });
}
window.openBlobFolder = function () {
  if (!blobFolderAbs) { showError('The bundled blob folder could not be resolved.'); return; }
  API_EAB_openOutputLocation({ path: blobFolderAbs }).then(function (resp) {
    if (!resp || !resp.ok) showError((resp && resp.error) || 'Could not open the blob folder.');
  }).catch(function (err) {
    showError(String((err && err.message) || err));
  });
};
/* Scan asks the tool itself which EVE is on the wire, so it never reads the chip
   picker. The BT82X tool has no --chip switch; the legacy tool takes BT815/6 or
   BT817/8, so the chip families are tried in that order. */
const SCAN_STEPS = [
  /* The legacy tool is asked first: it is the only one that names the board
     ("Detected EVE Chip: BT817"), while the BT82X tool answers for any EVE board
     with just "Found device:", which would mislabel a BT817 as BT82X. */
  { gen: 'bt81x', prog: 'BT815/6' },
  { gen: 'bt81x', prog: 'BT817/8' },
  { gen: 'bt82x', prog: '' }
];
function scanArgs(module, step) {
  const args = ['--detect', 'safe'];
  if (module && module !== 'Pico') args.push('--module', module);
  const freq = devFreq(module);
  if (freq) args.push('--frequency', String(freq));
  if (step && step.prog) args.push('--chip', step.prog);
  return args;
}

/* The vendor tool targets one adapter per module and takes no device selector,
   so the list holds the programmers this extension can actually drive. The
   selected rows name the target the flash actions run against. */
const FP_DEVICES = [
  { id: 'FT4222', name: 'FT4222', note: 'USB-SPI bridge · ftd2xx' },
  { id: 'MPSSE', name: 'MPSSE', note: 'LibMPSSE adapter' },
  { id: 'Pico', name: 'Raspberry Pi Pico', note: 'RPI-RP2 / BTEVE-FLASH drive', manual: true }
];
const deviceStatus = {};
const deviceInfo = {};
const selectedDevices = new Set();
/* Connection ▸ Options: one SPI clock for the FT4222 / MPSSE adapters (the
   Pico writes over USB and takes none) and the flash type the scan read, which
   only a BT82X board reports. */
const DEFAULT_FREQ = '12';
function isSpiModule(id) {
  return id === 'FT4222' || id === 'MPSSE';
}
function fpClockValue() {
  return $.trim(String($('#fp-frequency').val() || '')) || DEFAULT_FREQ;
}
function devFreq(id) {
  return isSpiModule(id) ? fpClockValue() : '';
}
function selectedSpiDevice() {
  let out = '';
  selectedDevices.forEach(function (id) { if (!out && isSpiModule(id)) out = id; });
  return out;
}
/* Enables each Options row only where it means something and says why. */
function syncConnOptions() {
  const $clock = $('#fp-frequency');
  const $type = $('#flash-type');
  if (!$clock.length || !$type.length) return;
  const spi = selectedSpiDevice();
  const b82 = anyDeviceFamily('bt82x');
  // The clock is the one setting a scan may have to change — a board that does
  // not answer at the default — so it stays editable before any device connects.
  $clock.prop('disabled', false).attr('aria-disabled', 'false');
  $type.prop('disabled', !b82).attr('aria-disabled', b82 ? 'false' : 'true');
  setHint($clock, spi ? '' : 'Used once an FT4222 or MPSSE adapter connects. A lower value can help a board that does not answer at 12 MHz');
  setHint($type, b82 ? '' : 'Scan a BT82X board to read its flash chip type');
  const t = targetDevice();
  const info = t ? (t.info || {}) : {};
  if (b82 && info.flashType) $type.val(info.flashType);
  else if (!b82) $type.val('');
  $('#opt-hint').text(
    (spi ? 'SPI clock: ' + spi + ' at ' + fpClockValue() + ' MHz.' : 'SPI clock rate applies to FT4222 / MPSSE adapters only.') +
    ' ' +
    (b82 ? 'Flash chip type comes from the BT82X detect.' : 'Flash chip type needs a BT82X chip.'));
}
/* What the scan learned about each connected board: the tool family, the legacy
   --chip value and the EVE part the tool reported. The programmer and diagnostic
   tabs run against this, never against the generator's chip card. */
function infoFor(id) {
  if (deviceInfo[id]) return deviceInfo[id];
  // the Pico has no probe: it flashes the image built for the generator's chip
  if (id === 'Pico') return { gen: chipGeneration() || 'bt82x', prog: '', part: 'Pico' };
  return {};
}
function targetDevice() {
  let out = null;
  selectedDevices.forEach(function (id) {
    const info = infoFor(id);
    if (!out && info.gen) out = { id: id, info: info };
  });
  return out;
}
function targetGen() {
  const t = targetDevice();
  return t ? t.info.gen : '';
}
/* True when any selected device belongs to the option's EVE family. */
function anyDeviceFamily(family) {
  let ok = false;
  selectedDevices.forEach(function (id) {
    const gen = infoFor(id).gen;
    if (!gen) return;
    if (family === 'bt82x' ? gen === 'bt82x' : gen !== 'bt82x') ok = true;
  });
  return ok;
}
function genInFamily(gen, family) {
  if (!gen) return false;
  return family === 'bt82x' ? gen === 'bt82x' : gen !== 'bt82x';
}
function targetProgChip() {
  const t = targetDevice();
  return t ? (t.info.prog || '') : '';
}
function deviceStatusText(state, selected) {
  if (state === 'checking') return 'Checking…';
  if (selected) return 'Selected';
  if (state === 'connected') return 'Connected';
  return 'Not connected';
}
function deviceName(id) {
  const info = deviceInfo[id];
  const dev = FP_DEVICES.find(d => d.id === id);
  if (info && info.board) return info.board;
  return dev ? dev.name : id;
}
function isDetected(id) {
  const state = deviceStatus[id] || '';
  return state === 'connected' || state === 'checking' || !!deviceInfo[id];
}
function deviceRowHtml(id) {
  const dev = FP_DEVICES.find(d => d.id === id);
  if (!dev) return '';
  const state = deviceStatus[id] || '';
  const selected = selectedDevices.has(id);
  const connected = state === 'connected';
  const info = deviceInfo[id];
  const cls = ['dev-row', connected ? 'is-on' : '', selected ? 'is-selected' : ''].filter(Boolean).join(' ');
  const sub = connected && info && info.part
    ? info.part + (info.flashType ? ' · ' + info.flashType : '')
    : deviceStatusText(state, selected);
  return '<div class="' + cls + '" data-device="' + id + '">' +
    '<div class="dev-main" title="' + dev.note + '">' +
      '<div class="dev-name">' + deviceName(id) + '</div>' +
      '<div class="dev-status' + (state === 'checking' ? ' is-busy' : '') + '">' +
        '<span class="dev-dot" aria-hidden="true"></span>' + sub +
        (dev.manual ? '' : '<span class="dev-host">' + dev.name + '</span>') +
      '</div>' +
    '</div>' +
    '<div class="dev-actions">' +
      '<button class="btn btn-secondary dev-connect" type="button" data-dev-act="connect"' +
        (connected || state === 'checking' ? ' disabled' : '') + ' title="' +
        (connected ? 'Already connected — press Reset to probe it again'
          : dev.manual ? 'Open the BOOTSEL guide and look for the Pico USB drive'
          : 'Probe this programmer for a board') +
        '">Connect</button>' +
      '<button class="btn btn-secondary" type="button" data-dev-act="disconnect"' +
        (connected ? '' : ' disabled') + ' title="' +
        (connected ? 'Clear this device and stop using it' : 'Connect the device first') +
        '">Disconnect</button>' +
      '<button class="btn btn-secondary" type="button" data-dev-act="reset"' +
        (connected ? '' : ' disabled') + ' title="' +
        (connected ? 'Clear the cached state and probe again' : 'Connect the device first') +
        '">Reset</button>' +
      '<button class="btn btn-secondary dev-select" type="button" data-dev-act="select" aria-pressed="' + (selected ? 'true' : 'false') +
        '"' + (connected ? '' : ' disabled') +
        ' title="' + (connected ? 'Use this device for detect, program, update and the other actions' : 'Connect the device first') +
        '">' + (selected ? 'Selected' : 'Select') + '</button>' +
    '</div>' +
  '</div>';
}
function syncDevices() {
  const $detected = $('#dev-detected');
  const $supported = $('#dev-supported');
  if (!$detected.length || !$supported.length) return;
  const pico = picoSelected();
  $('#pico-hint').toggleClass('hidden', !pico);
  if (pico) {
    const target = runTarget(infoFor('Pico'));
    $('#pico-chip').text(target.part || target.gen.toUpperCase());
  }
  const found = FP_DEVICES.map(d => d.id).filter(isDetected);
  // A row that is no longer detected keeps its old element for one animation so
  // an unplug reads as "this one went away" instead of the list jumping.
  const leaving = [];
  $detected.children('.dev-row').each(function () {
    const id = String($(this).attr('data-device') || '');
    if (id && found.indexOf(id) < 0 && !$(this).hasClass('is-leaving')) {
      leaving.push({ id: id, el: this });
    }
  });
  paintDeviceLists(found, leaving);
}
/* A row that is still fading out counts as "something is there", so the empty
   hint does not flash underneath it; once it is removed the hint appears. */
function syncDevEmpty() {
  const $detected = $('#dev-detected');
  if (!$detected.length) return;
  $('#dev-empty').toggleClass('hidden', $detected.children('.dev-row').length > 0);
}
function paintDeviceLists(found, leaving) {
  const $detected = $('#dev-detected');
  const $supported = $('#dev-supported');
  if (!$detected.length || !$supported.length) return;
  $detected.html(found.map(deviceRowHtml).join(''));
  (leaving || []).forEach(function (row) {
    const $row = $(row.el).addClass('is-leaving');
    $detected.append($row);
    setTimeout(function () {
      $row.remove();
      syncDevEmpty();
    }, 600);
  });
  $supported.html(FP_DEVICES.map(d => deviceRowHtml(d.id)).join(''));
  syncDevEmpty();
  $('#dev-detected-count').text(found.length ? '(' + found.length + ')' : '');
  saveDeviceCache();
  syncTabAvailability();
  syncConnOptions();
}
window.syncDevices = syncDevices;
/* Hotplug notification: a short toast in the corner, so a plug or unplug is
   announced even while the Log card is collapsed. */
const DEV_TOAST_MS = 6000;
const DEV_TOAST_ICON = { on: '🔌', off: '⏏', info: 'ℹ' };
/* Fills a toast that is already on screen — a plug shows "looking for an EVE
   device" at once and the same card turns into the result a few seconds later,
   so one hotplug never leaves two cards behind. */
function paintDeviceToast($toast, kind, title, text) {
  $toast.removeClass('is-on is-off is-info').addClass('is-' + kind)
    .find('.dev-toast-icon').text(DEV_TOAST_ICON[kind] || DEV_TOAST_ICON.info).end()
    .find('.dev-toast-title').text(title).end()
    .find('.dev-toast-text').text(text || '');
  return $toast;
}
function deviceToast(kind, title, text) {
  const $wrap = $('#dev-toast-wrap');
  if (!$wrap.length) return $();
  const $toast = paintDeviceToast($('<div>').addClass('dev-toast')
    .append($('<span>').addClass('dev-toast-icon'))
    .append($('<div>').addClass('dev-toast-body')
      .append($('<div>').addClass('dev-toast-title'))
      .append($('<div>').addClass('dev-toast-text'))), kind, title, text);
  $wrap.append($toast);
  // keep the stack short: the oldest toast leaves first
  const $all = $wrap.children('.dev-toast');
  if ($all.length > 3) $all.slice(0, $all.length - 3).remove();
  clearTimeout($toast.get(0).devToastTimer);
  const leave = function () {
    $toast.addClass('is-out');
    setTimeout(function () { $toast.remove(); }, 320);
  };
  $toast.get(0).devToastTimer = setTimeout(leave, DEV_TOAST_MS);
  $toast.on('click', leave);
  return $toast;
}
/* Repaints a toast already on screen; a no-op when it has closed itself. */
function updateDeviceToast($toast, kind, title, text) {
  if (!$toast || !$toast.length || !$toast.parent().length) return deviceToast(kind, title, text);
  paintDeviceToast($toast.removeClass('is-out'), kind, title, text);
  clearTimeout($toast.get(0).devToastTimer);
  $toast.get(0).devToastTimer = setTimeout(function () {
    $toast.addClass('is-out');
    setTimeout(function () { $toast.remove(); }, 320);
  }, DEV_TOAST_MS);
  return $toast;
}
window.deviceToast = deviceToast;
/* The page is torn down when the host hides the extension, so the scan result is
   kept in sessionStorage: coming back shows the same list instead of probing the
   adapter again. */
const DEV_CACHE_KEY = 'eab.flash.devices';
function saveDeviceCache() {
  try {
    sessionStorage.setItem(DEV_CACHE_KEY, JSON.stringify({
      status: deviceStatus,
      info: deviceInfo,
      selected: Array.from(selectedDevices),
      family: familyCache,
      clock: fpClockValue(),
    }));
  } catch (e) { }
}
function loadDeviceCache() {
  let raw = null;
  try { raw = JSON.parse(sessionStorage.getItem(DEV_CACHE_KEY) || 'null'); } catch (e) { raw = null; }
  if (!raw || !raw.info) return false;
  Object.keys(raw.status || {}).forEach(k => { deviceStatus[k] = raw.status[k]; });
  Object.keys(raw.info || {}).forEach(k => { deviceInfo[k] = raw.info[k]; });
  Object.keys(raw.family || {}).forEach(k => { familyCache[k] = raw.family[k]; });
  if (raw.clock) $('#fp-frequency').val(raw.clock);
  (raw.selected || []).forEach(id => { if (deviceStatus[id] === 'connected') selectedDevices.add(id); });
  return Object.keys(deviceInfo).length > 0;
}
/* The generator's chip card is a user choice, so it is kept on its own and
   restored once the picker has been built. */
const CHIP_CACHE_KEY = 'eab.flash.chip';
function saveChipCache() {
  const value = String($('#chip-one').val() || '');
  if (!value) return;
  try { sessionStorage.setItem(CHIP_CACHE_KEY, value); } catch (e) { }
}
function restoreChipCache() {
  let value = '';
  try { value = sessionStorage.getItem(CHIP_CACHE_KEY) || ''; } catch (e) { }
  if (value && $('#chip-one option[value="' + value + '"]').length) {
    $('#chip-one').val(value).trigger('change');
  }
}
function setDeviceStatus(id, state) {
  deviceStatus[id] = state;
  if (state !== 'connected') {
    selectedDevices.delete(id);
    delete deviceInfo[id];
  }
  syncDevices();
  syncFpRun();
  syncDiagnosticGate();
}
/* Runs one flash_prog command and resolves with its output; gen picks the tool
   family so a probe never depends on the chip picked in the UI. A quiet probe is
   the background watch re-checking the bus, which must not fill the log with the
   commands it tries. */
function probeCommand(args, gen, quiet) {
  const command = (gen || 'ft80x') + ' flash_prog';
  if (!quiet) log('→ ' + command + ' ' + args.join(' '));
  try {
    return invokeHost('execute_extension_command', {
      extensionId: 'flash_utilities',
      cliCommand: command,
      cliArgs: args,
    }).then(function (resultJson) {
      const result = JSON.parse(resultJson);
      const text = String((result && (result.output || result.error)) || '').trim();
      if (!quiet) log(text || '(no output)');
      return { ok: !!(result && result.success !== false), text: text };
    });
  } catch (err) {
    return Promise.reject(err);
  }
}
/* The vendor tools only say a board answered in words, so the strings are the
   only signal: a plain "no compatible EVE device" or a chip mismatch means this
   chip family is not the one on the wire. The legacy tool lists the adapter
   before it boots the EVE, so a failed boot still carries its "Found device"
   lines and must not be taken as an answer. The BT82X tool names no board at
   all — it answers with the flash info block. */
function scanAnswered(res) {
  const text = String((res && res.text) || '');
  if (!text) return false;
  if (/no compatible eve device/i.test(text)) return false;
  if (/chip mismatch/i.test(text)) return false;
  if (/Failed to boot up EVE chip/i.test(text)) return false;
  if (/Total EVE devices found:\s*0\b/i.test(text)) return false;
  if (!res || !res.ok) return false;
  return /(Detected EVE Chip|Found device|Total EVE devices found|Fetching basic information|Flash size)/i.test(text);
}
/* The tools report the adapter name and, in the debug lines, the EVE ChipId they
   read off the wire (BT816 → 0x30816). Both are parsed so the Detected list can
   name the board without the user picking a chip. */
var CHIP_IDS = {
  0x0810: 'FT810', 0x0811: 'FT811', 0x0812: 'FT812', 0x0813: 'FT813',
  0x0880: 'BT880', 0x0881: 'BT881', 0x0882: 'BT882', 0x0883: 'BT883',
  0x0815: 'BT815', 0x0816: 'BT816', 0x0817: 'BT817', 0x0818: 'BT818',
  0x0820: 'BT820'
};
function scanBoardName(text) {
  const match = String(text).match(/(?:Found device:\s*|Device \[\d+\]:\s*)([^(\r\n]+?) \(/i);
  return match ? match[1].trim() : '';
}
function chipPartFromId(text) {
  let part = '';
  (String(text).match(/ChipId=0x[0-9A-Fa-f]+/gi) || []).forEach(function (raw) {
    const code = parseInt(raw.replace(/^ChipId=0x/i, ''), 16) & 0xFFFF;
    part = CHIP_IDS[code] || part;
  });
  return part;
}
/* Reads the reported board as a chip-picker part without touching the picker. */
function parseChipPart(text, step) {
  let part = chipPartFromId(text);
  if (!part) {
    const match = String(text).match(/Detected EVE Chip:\s*([A-Za-z0-9\/]+)/i);
    if (match) part = match[1].toUpperCase().replace(/\/\d+$/, '');
  }
  if (!part && step) part = step.gen === 'bt82x' ? 'BT820' : (step.prog === 'BT817/8' ? 'BT817' : 'BT815');
  return part && CHIP_TABLE[part] ? part : '';
}
/* Maps the reported board onto a part in the chip picker. */
function scanApplyChip(text, step) {
  const part = parseChipPart(text, step);
  if (!part) return '';
  $('#chip-one').val('part:' + part).trigger('change');
  return part;
}
function scanInfo(hit, part) {
  return {
    gen: hit.step.gen,
    prog: hit.step.prog,
    part: part,
    flashType: hit.flashType || '',
    flashSize: parseFlashSize(hit.text),
    board: scanBoardName(hit.text),
  };
}
/* The CLI family follows the part the board reported, not the tool that
   answered: the BT82X tool also names a BT817, and that board has to be driven
   through the legacy tool with --chip BT817/8. */
function familyForPart(part) {
  const row = chipRow(part);
  return row ? { gen: row[1], prog: row[2] } : null;
}
/* The tools fall back to another host when the requested one is missing
   ("Target host FT4222 not found, trying MPSSE..."), so the interface that
   actually answered has to be read out of the log — otherwise one board shows up
   once per interface we asked for. */
function scanHost(text) {
  const body = String(text);
  const fallback = body.match(/Target host \S+ not found, trying (\w+)/i);
  if (fallback) return fallback[1].toUpperCase();
  const line = body.match(/^\s*Host:\s*([A-Za-z0-9]+)\s*$/mi);
  if (line) return line[1].toUpperCase();
  const listed = body.match(/Host:\s*\d+\s*\(([^)]+)\)/i);
  if (listed) return listed[1].toUpperCase();
  return '';
}
function hostId(text, requested, present) {
  const host = scanHost(text);
  if (host && FP_DEVICES.some(d => d.id === host)) return host;
  /* BT82X flash.exe often names no Host and may still succeed for --module MPSSE
     when only an FT4222 is plugged in (and the other way around). Prefer the
     adapter the earlier enumeration already listed. */
  if (present && present.length && present.indexOf(requested) < 0) {
    if (present.length === 1) return present[0];
    const spi = present.filter(isSpiModule);
    if (spi.length === 1) return spi[0];
  }
  return requested;
}
/* Every module the tool says it can see, so interfaces that are not there are
   not probed again in the same scan. */
function presentHosts(text) {
  const body = String(text);
  const out = [];
  const add = function (name) {
    const id = String(name || '').toUpperCase();
    if (id && FP_DEVICES.some(d => d.id === id) && out.indexOf(id) < 0) out.push(id);
  };
  (body.match(/Host:\s*\d+\s*\(([^)]+)\)/gi) || []).forEach(function (raw) {
    add((raw.match(/\(([^)]+)\)/) || [])[1]);
  });
  (body.match(/^\s*Host:\s*([A-Za-z0-9]+)\s*$/gmi) || []).forEach(function (raw) {
    add(raw.replace(/^\s*Host:\s*/i, ''));
  });
  const fallback = body.match(/Target host \S+ not found, trying (\w+)/i);
  if (fallback) add(fallback[1]);
  return out;
}
function mergePresent(present, text) {
  if (!present) return;
  presentHosts(text).forEach(function (h) {
    if (present.indexOf(h) < 0) present.push(h);
  });
}
/* Files a hit under the interface that really answered and reports it. The EVE
   family and the legacy --chip value come from the part that answered, so a
   BT817 is never driven by bt82x flash_prog. */
function applyHit(id, hit, present, opts) {
  const host = hostId(hit.text, id, present);
  // the background watch reports the board but leaves the generator's chip
  // choice alone: it is a user decision, not something a hotplug should rewrite
  const part = opts && opts.passive
    ? parseChipPart(hit.text, hit.step)
    : scanApplyChip(hit.text, hit.step);
  const fam = familyForPart(part);
  const step = fam ? { gen: fam.gen, prog: fam.prog } : hit.step;
  const known = {
    step: step,
    text: hit.text,
    flashType: step.gen === 'bt82x' ? hit.flashType : '',
  };
  deviceInfo[host] = scanInfo(known, part);
  familyCache[host] = { gen: step.gen, prog: step.prog };
  // a board that just answered is the one the user wants to drive, so it is
  // selected right away instead of waiting for a Select click
  selectedDevices.add(host);
  setDeviceStatus(host, 'connected');
  if (host !== id) {
    deviceStatus[id] = '';
    selectedDevices.delete(id);
    delete deviceInfo[id];
    syncDevices();
  }
  return { host: host, part: part, gen: step.gen, prog: step.prog };
}
/* A family that already answered on an interface is tried first next time, so a
   repeat scan costs one command instead of three. */
const familyCache = {};
function scanStepsFor(id, full) {
  const steps = full === false ? SCAN_STEPS.slice(0, 1) : SCAN_STEPS.slice();
  const known = familyCache[id];
  if (!known) return steps;
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].gen === known.gen && steps[i].prog === known.prog) {
      steps.unshift(steps.splice(i, 1)[0]);
      break;
    }
  }
  return steps;
}
/* Tries each chip family on one interface and stops at the first board found.
   present (when given) collects Host: lines from every probe — including a
   legacy boot failure — so Scan can skip adapters that are not on the bus. */
function scanInterface(id, steps, present, quiet) {
  let hit = null;
  let chain = Promise.resolve();
  steps.forEach(function (step) {
    chain = chain.then(function () {
      if (hit) return null;
      // A family the board is not in exits non-zero, so a rejection here only
      // means "try the next family" — never abort the sweep.
      return probeCommand(scanArgs(id, step), step.gen, quiet).then(function (res) {
        if (res) mergePresent(present, res.text);
        if (!res || !scanAnswered(res)) return null;
        hit = { step: step, text: res.text };
        // Only a BT82X board shows a Flash Type row, so the extra --check-type
        // run is skipped everywhere else — and skipped again once the type is known.
        if (step.gen !== 'bt82x') return null;
        const known = deviceInfo[id] && deviceInfo[id].flashType;
        if (known) { hit.flashType = known; return null; }
        return probeCommand(checkTypeArgs(id, step), step.gen, quiet).then(function (type) {
          if (type) mergePresent(present, type.text);
          const match = type.text.match(/Flash type:\s*(NOR|NAND)/i);
          hit.flashType = match ? match[1].toUpperCase() : '';
        }).catch(function () { });
      }, function () { return null; });
    });
  });
  return chain.then(function () { return hit; }, function () { return hit; });
}
/* The Pico has no FTDI-style enumeration, so its row is only "Connected" when
   uf2conv4eve lists a mounted RPI-RP2 / BTEVE-FLASH volume. Clicking Connect
   opens the BOOTSEL guide and asks that list — it never marks the row by itself. */
function probePico() {
  deviceStatus.Pico = 'checking';
  syncDevices();
  picoGuideStatus('busy', 'Looking for an RPI-RP2 or BTEVE-FLASH USB drive…');
  return probeCommand(['--module', 'Pico', '--pico-list'], 'bt81x').then(function (res) {
    if (!res || !res.ok) {
      setDeviceStatus('Pico', '');
      picoGuideStatus('off', 'No Pico found — hold BOOTSEL while plugging the Pico in, wait for the RPI-RP2 drive, then check again.');
      log('connection (Pico): no USB drive mounted');
      return { ok: false, host: 'Pico' };
    }
    const drive = (res.text.match(/Pico found:\s*(.+)/i) || [])[1] || '';
    deviceInfo.Pico = { gen: chipGeneration() || 'bt81x', prog: '', part: drive || 'USB drive', board: 'Raspberry Pi Pico' };
    selectedDevices.add('Pico');
    setDeviceStatus('Pico', 'connected');
    picoGuideStatus('ok', 'Pico connected' + (drive ? ' · ' + drive : '') + ' — selected; press Program on the Flash Programmer tab.');
    $('#conn-detail').text('Pico · ' + (drive || 'USB drive mounted'));
    log('connection (Pico): ' + (drive || 'found'));
    return { ok: true, host: 'Pico' };
  }, function (err) {
    setDeviceStatus('Pico', '');
    picoGuideStatus('off', String((err && err.message) || err));
    return { ok: false, host: 'Pico' };
  });
}
function picoGuideStatus(kind, text) {
  const $box = $('#pico-guide-status');
  if (!$box.length) return;
  $box.removeClass('is-busy is-ok is-off').addClass('is-' + kind);
  $box.find('.pico-status-text').text(text || '');
}
function openPicoGuide() {
  $('#pico-guide').removeClass('hidden');
  probePico();
}
function closePicoGuide() {
  $('#pico-guide').addClass('hidden');
}
window.openPicoGuide = openPicoGuide;
/* opts.quick keeps the sweep to one chip family, opts.quiet drops the command
   echo and opts.passive leaves the chip picker and the connection detail line
   alone. The last two are the background hotplug probe: it only reports whether
   a board answers. */
function probeDevice(id, opts) {
  const dev = FP_DEVICES.find(d => d.id === id);
  if (!dev) return Promise.resolve({ ok: false, host: id });
  if (dev.manual) return probePico();
  const quiet = !!(opts && opts.quiet);
  const passive = !!(opts && opts.passive);
  deviceStatus[id] = 'checking';
  syncDevices();
  const steps = (opts && opts.quick) ? scanStepsFor(id, false) : scanStepsFor(id, true);
  const present = [];
  return scanInterface(id, steps, present, quiet).then(function (hit) {
    if (!hit) {
      setDeviceStatus(id, 'offline');
      if (!quiet) log('connection (' + id + '): none');
      return { ok: false, host: id };
    }
    const found = applyHit(id, hit, present, opts);
    if (!passive) {
      if (found.host !== id) {
        $('#conn-detail').text('No ' + id + ' board answered — the board on ' + found.host +
          ' was detected instead (' + (found.part || hit.step.gen.toUpperCase()) +
          (hit.flashType ? ' · ' + hit.flashType : '') + ').');
      } else {
        $('#conn-detail').text(id + ' · ' + (found.part || hit.step.gen.toUpperCase()) +
          (hit.flashType ? ' · ' + hit.flashType : ''));
      }
    }
    if (!quiet) log('connection (' + id + '): detected ' + hit.step.gen + ' on ' + found.host);
    return { ok: true, host: found.host, part: found.part, gen: found.gen, flashType: hit.flashType };
  }).catch(function (err) {
    setDeviceStatus(id, 'offline');
    if (!passive) $('#conn-detail').text(String((err && err.message) || err));
    return { ok: false, host: id };
  });
}
/* Scan probes every interface instead of trusting the current selection: each
   one is asked which EVE answers and the reported chip fills the chip picker.
   Steps are ordered so a family that already worked is tried first. */
let scanSeq = 0;
function scanDevices(full) {
  if (fpRunning) return Promise.resolve();
  const run = ++scanSeq;
  const stale = function () { return run !== scanSeq; };
  // an interface that already answered is probed first; a repeat scan then costs one command
  const targets = FP_DEVICES.filter(d => !d.manual).map(d => d.id)
    .sort(function (a, b) { return (familyCache[b] ? 1 : 0) - (familyCache[a] ? 1 : 0); });
  const present = [];
  $('#conn-detail').text('Scanning ' + targets.concat(['Pico']).join(' · ') + ' for an EVE device…');
  targets.forEach(function (id) { deviceStatus[id] = 'checking'; });
  syncDevices();
  const notes = [];
  let chip = '';
  let chain = Promise.resolve();
  targets.forEach(function (id) {
    chain = chain.then(function () {
      if (stale()) return null;
      // a board found through another interface's fallback is already listed
      if (deviceStatus[id] === 'connected') return null;
      // the tool listed the interfaces it can see: this one is not among them
      if (present.length && present.indexOf(id) < 0) {
        setDeviceStatus(id, 'offline');
        notes.push(id + ' · not connected');
        return null;
      }
      return scanInterface(id, scanStepsFor(id, full), present).then(function (hit) {
        if (stale()) return;
        if (!hit) {
          setDeviceStatus(id, 'offline');
          notes.push(id + ' · not connected');
          return;
        }
        const found = applyHit(id, hit, present);
        mergePresent(present, hit.text);
        // BT82X flash.exe prints no Host: lines — lock onto the adapter that
        // answered so the other SPI module is not probed as a second board.
        if (present.indexOf(found.host) < 0) present.push(found.host);
        chip = chip || found.part;
        notes.push(found.host + ' · ' + (found.part || hit.step.gen.toUpperCase()) + ' detected' +
          (hit.flashType ? ' · ' + hit.flashType : '') +
          (found.host !== id ? ' (no ' + id + ' board)' : ''));
      });
    });
  });
  // The Pico has no FTDI enumeration of its own, so Scan looks for its USB
  // volume too instead of leaving the row to the BOOTSEL guide.
  chain = chain.then(function () {
    if (stale() || deviceStatus.Pico === 'connected') return null;
    return probePico().then(function (res) {
      if (stale()) return;
      if (res && res.ok) {
        notes.push('Pico · ' + ((deviceInfo.Pico && deviceInfo.Pico.part) || 'USB drive') + ' detected');
      } else {
        notes.push('Pico · not connected');
      }
    }, function () { notes.push('Pico · not connected'); });
  });
  return chain.then(function () {
    if (stale()) return;
    const firstConnected = FP_DEVICES.find(d => deviceStatus[d.id] === 'connected');
    if (firstConnected && !selectedDevices.size) selectedDevices.add(firstConnected.id);
    syncDevices();
    syncFpRun();
    syncDiagnosticGate();
    $('#conn-detail').text(notes.join('\n') || 'No interface answered.');
    if (firstConnected) log('scan: ' + (chip ? chip + ' on ' : '') + firstConnected.id);
    else log('scan: no device found');
  }).catch(function (err) {
    if (stale()) return;
    targets.forEach(function (id) { deviceStatus[id] = ''; });
    syncDevices();
    syncFpRun();
    syncDiagnosticGate();
    $('#conn-detail').text('Scan failed: ' + String((err && err.message) || err));
  });
}
window.scanDevices = scanDevices;

/* Background device watch. The extension's own DLL listens to the OS for device
   changes (`usb-watch <ms>` blocks until a device comes or goes and answers with
   the USB list that is present), so a board that is plugged in or pulled out is
   noticed without pressing Scan and without any host support. Each change runs
   one quiet probe and only the outcome reaches the log; a probe is skipped while
   a flash command owns the adapter, and a board that already answered is left
   alone so the watch never fights the programmer. */
const WATCH_WAIT_MS = 10000;
const WATCH_RETRY_MS = 10000;
/* A plug event arrives before the FTDI driver has bound the new interface, so the
   first probe can fail on a healthy board: retry a few times before giving up. */
const PROBE_RETRIES = 3;
const PROBE_RETRY_MS = 1000;
let watchUsbSig = null;
let watchHasFtdi = false;
let watchHasPico = false;
let watchPendingScan = false;
let watchStarted = false;
let bgProbeRunning = false;
let watchToast = null;
function usbSignature(list) {
  return (list || []).map(s => String(s).toLowerCase()).sort().join('|');
}
/* The tools only drive FTDI adapters, so the watch reports everything the OS has
   on the bus but only a plugged adapter is worth probing for an EVE. */
function ftdiCount(list) {
  return (list || []).filter(p => String(p).toLowerCase().indexOf('vid_0403') >= 0).length;
}
/* A Pico is a USB mass-storage device, not an FTDI adapter, so it never shows up
   in the FTDI count. Raspberry Pi's vendor id is the only bus-level signal that
   one was plugged in or pulled out. */
function picoCount(list) {
  return (list || []).filter(p => String(p).toLowerCase().indexOf('vid_2e8a') >= 0).length;
}
function usbCountLabel(n) {
  return n + ' USB device' + (n === 1 ? '' : 's');
}
/* One wait cycle in the DLL: it returns as soon as a device interface changes or
   the timeout runs out, and always carries the current list. */
function usbWatchCall(timeoutMs) {
  return API_EAB_runCli({ command: 'usb-watch', args: [String(timeoutMs | 0)] }).then(function (resp) {
    if (!resp || !resp.ok) throw new Error(String((resp && (resp.error || resp.result)) || 'usb-watch failed'));
    const outer = JSON.parse(String(resp.detail || '{}'));
    if (outer && outer.success === false) throw new Error(String(outer.error || 'usb-watch failed'));
    return JSON.parse(String((outer && outer.output) || '{}'));
  });
}
/* The adapter is gone, so nothing on the board can be reached any more. The Pico
   is a USB drive, not an FTDI adapter, so its row is left as it is. Returns the
   names of the rows that were cleared, so the caller can say what went away. */
function clearSpiDevices() {
  const gone = [];
  FP_DEVICES.filter(d => !d.manual).forEach(function (d) {
    if (!deviceStatus[d.id] && !deviceInfo[d.id]) return;
    gone.push(deviceName(d.id));
    deviceStatus[d.id] = '';
    selectedDevices.delete(d.id);
    delete deviceInfo[d.id];
  });
  if (!gone.length) return gone;
  syncDevices();
  syncFpRun();
  syncDiagnosticGate();
  return gone;
}
function backgroundProbe() {
  if (bgProbeRunning || fpRunning || !watchHasFtdi) return;
  if (FP_DEVICES.some(d => deviceStatus[d.id] === 'checking')) return;
  if (FP_DEVICES.some(d => !d.manual && deviceStatus[d.id] === 'connected')) return;
  // one adapter probe covers both modules: the tools fall back to the other host
  // and report which one answered, so the second sweep would only repeat it
  const id = selectedSpiDevice() || 'FT4222';
  bgProbeRunning = true;
  log('watch: checking for an EVE device on ' + id + '…');
  // The USB interface shows up before the FTDI driver has finished binding, so a
  // probe fired the instant the plug event arrives can fail on a board that is
  // perfectly fine. Retry a few times with a growing pause before giving up.
  const attempt = function (n) {
    return probeDevice(id, { quiet: true, passive: true }).then(function (res) {
      if (res && res.ok) return res;
      if (n >= PROBE_RETRIES) return res;
      return new Promise(function (resolve) {
        setTimeout(resolve, PROBE_RETRY_MS);
      }).then(function () {
        // the adapter was pulled out mid-probe, or a flash command took it
        if (fpRunning || !watchHasFtdi) return res;
        return attempt(n + 1);
      });
    });
  };
  attempt(0).then(function (res) {
    bgProbeRunning = false;
    // an unplug already told the user what happened — retrying after it would
    // only add a "programmer connected" card that is no longer true
    if (!watchHasFtdi) return;
    if (res && res.ok) {
      log('watch: ' + (deviceName(res.host) || res.host) + ' answered — ' +
        (res.part || String(res.gen || '').toUpperCase()) +
        (res.flashType ? ' · ' + res.flashType : '') + '. Selected.');
      watchToast = updateDeviceToast(watchToast, 'on', 'EVE device detected',
        (res.part || String(res.gen || '').toUpperCase()) +
        (res.flashType ? ' · ' + res.flashType : '') +
        ' on ' + (deviceName(res.host) || res.host) + ' — selected.');
    } else {
      log('watch: no EVE device answered');
      watchToast = updateDeviceToast(watchToast, 'info', 'Programmer connected',
        'No EVE device answered on ' + id + '. Check the board is powered and the SPI wiring.');
    }
  }, function (err) {
    bgProbeRunning = false;
    log('watch: probe failed: ' + String((err && err.message) || err));
  });
}
/* One scan at a time: a change that arrives while a flash command owns the
   adapter is remembered and picked up by the drain timer instead of racing it. */
function drainWatchScan() {
  if (!watchPendingScan || fpRunning || bgProbeRunning) return;
  watchPendingScan = false;
  backgroundProbe();
}
function onUsbDevices(list) {
  const devices = list || [];
  const sig = usbSignature(devices);
  if (sig === watchUsbSig) return;
  const known = watchUsbSig !== null;
  const hadFtdi = watchHasFtdi;
  const hadPico = watchHasPico;
  watchUsbSig = sig;
  const ftdi = ftdiCount(devices);
  const pico = picoCount(devices);
  watchHasFtdi = ftdi > 0;
  watchHasPico = pico > 0;
  log('watch: USB ' + (known ? 'change' : 'state') + ' — ' + usbCountLabel(devices.length) +
    (ftdi ? ', ' + ftdi + ' FTDI adapter' + (ftdi === 1 ? '' : 's') : ', no FTDI adapter') +
    (pico ? ', ' + pico + ' Raspberry Pi Pico' : ''));
  // A Pico is a USB drive, so the FTDI probe below can never see it: its row is
  // only refreshed by asking uf2conv4eve whether a volume is mounted.
  if (watchHasPico !== hadPico) {
    if (watchHasPico) {
      watchToast = updateDeviceToast(watchToast, 'on', 'Pico connected',
        'Raspberry Pi Pico detected — checking for its USB drive…');
    } else if (deviceStatus.Pico === 'connected') {
      setDeviceStatus('Pico', '');
      watchToast = updateDeviceToast(watchToast, 'off', 'Pico disconnected',
        'The Raspberry Pi Pico is no longer connected.');
    }
    probePico();
  }
  if (!watchHasFtdi) {
    const gone = clearSpiDevices();
    if (gone.length) {
      $('#conn-detail').text('The programmer adapter was unplugged.');
      watchToast = updateDeviceToast(watchToast, 'off', 'Device disconnected',
        gone.join(', ') + ' is no longer connected.');
    } else if (hadFtdi) {
      watchToast = updateDeviceToast(watchToast, 'off', 'Programmer unplugged',
        'No FTDI adapter is connected any more.');
    }
    return;
  }
  if (!hadFtdi && known) {
    watchToast = updateDeviceToast(watchToast, 'on', 'Programmer connected',
      'FTDI adapter detected — looking for an EVE device…');
  }
  watchPendingScan = true;
  drainWatchScan();
}
/* The watch loop never runs twice: it waits in the DLL, hands what changed to
   onUsbDevices and starts the next wait. A failed call backs off and retries
   quietly, because the adapter may simply be in a bad state. */
function startUsbWatch(tries) {
  if (watchStarted || !isEmbedded()) return;
  if (typeof API_EAB_runCli !== 'function') {
    // eab-api.js is injected at the end of <body>, so the bridge can still be
    // missing when the document is ready — wait for it rather than give up
    if ((tries || 0) < 20) setTimeout(function () { startUsbWatch((tries || 0) + 1); }, 250);
    return;
  }
  watchStarted = true;
  setInterval(drainWatchScan, 1000);
  let first = true;
  let warned = false;
  const tick = function (delay) {
    setTimeout(function () {
      usbWatchCall(first ? 0 : WATCH_WAIT_MS).then(function (payload) {
        first = false;
        warned = false;
        onUsbDevices(payload && payload.devices);
        tick(0);
      }, function (err) {
        if (!warned) log('watch: USB listener unavailable — ' + String((err && err.message) || err));
        warned = true;
        tick(WATCH_RETRY_MS);
      });
    }, delay);
  };
  tick(0);
}
function handleDeviceAction(id, act) {
  if (act === 'connect') {
    const dev = FP_DEVICES.find(d => d.id === id);
    if (dev && dev.manual) { openPicoGuide(); return; }
    probeDevice(id).then(function (res) {
      if (!res || !res.ok) {
        $('#conn-detail').text(id + ' did not answer. Check the adapter and the SPI clock.');
      } else if (res.host && res.host !== id) {
        $('#conn-detail').text('No ' + id + ' board answered — the board on ' + res.host +
          ' was detected instead and selected.');
      } else {
        $('#conn-detail').text(id + ' answered — selected.');
      }
      syncFpRun();
      syncDiagnosticGate();
    });
    return;
  }
  if (act === 'reset') {
    deviceStatus[id] = '';
    probeDevice(id);
    return;
  }
  if (act === 'disconnect') {
    selectedDevices.delete(id);
    deviceStatus[id] = '';
    syncDevices();
    syncFpRun();
    syncDiagnosticGate();
    log('disconnected ' + id);
    return;
  }
  if (act === 'select') {
    if (selectedDevices.has(id)) selectedDevices.delete(id);
    else if (deviceStatus[id] === 'connected') selectedDevices.add(id);
    syncDevices();
    syncFpRun();
    syncDiagnosticGate();
    log('devices: ' + (selectedDevices.size ? Array.from(selectedDevices).join(' + ') : 'none'));
  }
}
$(document).on('click', '#conn-card [data-dev-act]', function () {
  const $row = $(this).closest('.dev-row');
  handleDeviceAction(String($row.attr('data-device') || ''), String($(this).attr('data-dev-act') || ''));
});
/* Connection ▸ Options: the clock is shared by the FT4222 / MPSSE adapters and
   the flash type mirrors the BT82X board that answered. */
$(document).on('input change', '#fp-frequency', function () {
  saveDeviceCache();
  syncConnOptions();
  syncFpRun();
});
$(document).on('change', '#flash-type', function () {
  const t = targetDevice();
  const value = String($(this).val() || '');
  if (t && deviceInfo[t.id]) {
    deviceInfo[t.id].flashType = value;
    saveDeviceCache();
    syncDevices();
  }
  syncConnOptions();
});
$(document).on('click', '#pico-guide [data-pico-close]', closePicoGuide);
$(document).on('click', '#pico-guide [data-pico-act="check"]', probePico);
$(document).on('click', '#pico-guide', function (e) {
  if (e.target === this) closePicoGuide();
});
$(document).on('keydown', function (e) {
  if (e.key === 'Escape' && !$('#pico-guide').hasClass('hidden')) closePicoGuide();
});
function checkTypeArgs(module, step) {
  const args = [];
  if (module && module !== 'Pico') args.push('--module', module);
  const freq = devFreq(module);
  if (freq) args.push('--frequency', String(freq));
  if (step && step.gen !== 'bt82x') {
    const chip = step.prog || $('#fp-chip').val();
    if (chip) args.push('--chip', chip);
  }
  args.push('--check-type');
  return args;
}
function runDiagnostic(mode) {
  $('#fp-action').val(mode);
  onFpActionChange();
  syncDiagnosticGate();
  runFlashProg('#diag-out');
}
$(function () {
  diagPlaceholder = $.trim($('#diag-out').text());
  onChipChange();
  renderFileList();
  updateBatchState();
  syncFpRun();
  syncDiagnosticGate();
  syncNoPreviewRows();
  installSplitDivider(document.getElementById('shell-divider'), document.querySelector('.shell-body'),
    '--shell-side-w', { key: 'eab_flash_side_width', min: 220, max: 620 });
  installSplitDivider(document.getElementById('fp-rail-divider'), document.querySelector('#tab-programmer .fp-split'),
    '--fp-rail-w', { key: 'eab_flash_rail_width', min: 110, max: 340 });
  installSplitDivider(document.getElementById('gen-divider'), document.querySelector('#tab-generator .gen-split'),
    '--gen-side-w', { key: 'eab_flash_gen_side_width', min: 200, max: 460 });
  setTimeout(syncNoPreviewRows, 0);
  // Restore the last scan instead of probing the adapter again: the host tears
  // this page down whenever the extension is hidden, and a fresh probe per
  // switch costs seconds. Press Scan to look again.
  if (loadDeviceCache()) $('#conn-detail').text('Restored the last scan — press Scan to look again.');
  syncDevices();
  setTimeout(restoreChipCache, 0);
  setTimeout(syncBlobChoices, 0);
  renderFpFiles();
  $('#fp-pad').on('input change', function () { syncFpRun(); });
  $('#diag-tx, #fp-map-bad, #fp-read-dir, #fp-read-name, #fp-read-start, #fp-read-length')
    .on('input', function () {
      syncFpRun();
    });
  $('#fp-map-good').on('change', function () { syncFpRun(); });
  $('#fp-detect-safe').on('change', function () { syncDetectMode('safe'); });
  $('#fp-detect-write').on('change', function () { syncDetectMode('write'); });
  // opening the log clears the unread dot; the toggle event does not bubble, so
  // it is bound directly instead of delegated
  $('#conn-log-card').on('toggle', function () {
    if (this.open) $('#conn-log-dot').addClass('hidden');
  });
  startUsbWatch();
  $('#fp-read-entire').on('change', function () {
    $('#fp-read-range').toggleClass('hidden', $(this).prop('checked'));
    syncFpRun();
  });
  const $goodBlock = $('#fp-map-good');
  if ($goodBlock.length && !$goodBlock.children().length) {
    for (let b = 1023; b > 1003; b--) $goodBlock.append('<option value="' + b + '">' + b + '</option>');
  }
  syncFpRun();
  $('#diag-tx').on('input', syncDiagnosticGate);
  if (typeof MutationObserver !== 'function') return;
  new MutationObserver(function (records) {
    for (let i = 0; i < records.length; i++) {
      const cls = records[i].target && records[i].target.classList;
      if (cls && (cls.contains('app-row') || cls.contains('tab-content'))) {
        queueNoPreviewSync();
        return;
      }
    }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
  const diagOut = $('#diag-out').get(0);
  if (diagOut) {
    new MutationObserver(queueNoPreviewSync).observe(diagOut, { childList: true, characterData: true, subtree: true });
  }
});
(function pasteRouter() {
  if (!$('.drop-zone[data-for]').length) return;
  function activeZone() {
    var $pane = $('.tab-content.active').eq(0);
    // the zone of the tab that is open wins, so a paste on the Program page
    // fills the flash image queue instead of the generator's asset list
    var $own = $pane.find('.drop-zone[data-for]').filter(':visible').eq(0);
    if ($own.length) return $own;
    var $main = $pane.length ? $pane.find('.app-row').eq(0) : $('.app-row').filter(':visible').eq(0);
    if (!$main.length) $main = $('.app-row').eq(0);
    return $main.find('.drop-zone[data-for]').eq(0);
  }
  function queue(paths) {
    var $zone = activeZone();
    if (typeof window.eabOnDrop !== 'function') return false;
    try { window.eabOnDrop(paths, $zone.get(0) || null); return true; } catch (e) { return false; }
  }
  function unquote(s) { return String(s == null ? '' : s).trim().replace(/^"(.*)"$/, '$1'); }
  function looksLikePath(s) {
    s = unquote(s);
    return /^file:\/\//i.test(s)
      || /^[a-zA-Z]:[\\/]/.test(s)
      || /^\\\\[^\\]/.test(s)
      || /^\//.test(s);
  }
  function asPath(s) {
    s = unquote(s);
    if (/^file:\/\//i.test(s)) {
      s = s.replace(/^file:\/\/\/?/i, '');
      try { s = decodeURIComponent(s); } catch (e) {  }
    }
    if (/^\/[a-zA-Z]:\//.test(s)) s = s.slice(1);
    return s.replace(/\//g, '\\');
  }
  function park(blob) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function () {
        var url = String(reader.result || '');
        var comma = url.indexOf(',');
        var b64 = comma >= 0 ? url.slice(comma + 1) : '';
        if (!b64) { resolve(''); return; }
        API_EAB_writeTempFile({ name: blob.name || 'paste.png', dataBase64: b64 }).then(function (resp) {
          resolve(resp && resp.ok && resp.path ? resp.path : '');
        });
      };
      reader.onerror = function () { resolve(''); };
      reader.readAsDataURL(blob);
    });
  }
  function editable(el) {
    if (!el) return false;
    var $el = $(el);
    var tag = $el.prop('tagName');
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') return false;
    if ($el.prop('readOnly') || $el.prop('disabled')) return false;
    if (tag === 'INPUT' && /^(checkbox|radio|button|submit|range|file)$/i.test($el.prop('type') || '')) return false;
    return true;
  }
  var pasteRun = null;
  var pasteSeq = 0;
  function pasteTextEl(zone) {
    if (!zone) return $();
    var $zone = $(zone);
    var $box = $zone.find('> .dz-paste');
    if (!$box.length) {
      $box = $('<div class="dz-paste" role="status" aria-live="polite">' +
        '<span class="dz-paste-spin" aria-hidden="true"></span>' +
        '<span class="dz-paste-text"></span></div>');
      $zone.append($box);
    }
    return $box.find('.dz-paste-text');
  }
  function pastePaint() {
    if (!pasteRun) return;
    var $text = pasteTextEl(pasteRun.zone);
    if (!$text.length) return;
    var dots = new Array(pasteRun.dots + 1).join('.');
    var n = pasteRun.done.length;
    if (!n) {
      $text.text('Pasting… reading the clipboard' + dots);
      return;
    }
    $text.text('Pasting ' + pasteRun.done.join('.') +
      (pasteRun.total > 1 ? ' of ' + pasteRun.total : '') +
      ' file' + (pasteRun.total === 1 ? '' : 's') + ' from clipboard' + dots);
  }
  function pasteBegin(zone, total) {
    if (pasteRun && pasteRun.ticker) clearInterval(pasteRun.ticker);
    var run = { zone: zone, done: [], total: total || 0, dots: 1, token: ++pasteSeq, ticker: null };
    pasteRun = run;
    if (zone) $(zone).addClass('is-pasting');
    pastePaint();
    run.ticker = setInterval(function () {
      if (pasteRun !== run) return;
      run.dots = (run.dots % 5) + 1;
      pastePaint();
    }, 240);
  }
  function pasteStep(n, total) {
    if (!pasteRun) return;
    pasteRun.total = total;
    pasteRun.done.push(n);
    pastePaint();
  }
  function pasteDone(count) {
    if (!pasteRun) return;
    var run = pasteRun;
    pasteRun = null;
    clearInterval(run.ticker);
    var $text = pasteTextEl(run.zone);
    if ($text.length) {
      $text.text(count
        ? 'Pasted ' + count + ' file' + (count === 1 ? '' : 's') + ' from clipboard'
        : 'Nothing usable on the clipboard');
    }
    if (!run.zone) return;
    setTimeout(function () {
      if (pasteSeq !== run.token) return;
      $(run.zone).removeClass('is-pasting');
      pasteTextEl(run.zone).text('');
    }, 1600);
  }
  $(document).on('paste', function (e) {
    var dt = (e.originalEvent || e).clipboardData;
    if (!dt) return;
    var $zone = activeZone();
    var zone = $zone.get(0) || null;
    if (editable(e.target) && (!zone || e.target.id !== $zone.attr('data-for'))) return;
    var files = [];
    try { files = $.makeArray(dt.files || []); } catch (err) { files = []; }
    if (!files.length && dt.items) {
      for (var i = 0; i < dt.items.length; i++) {
        if (dt.items[i].kind === 'file') {
          var f = dt.items[i].getAsFile();
          if (f) files.push(f);
        }
      }
    }
    var paths = [];
    var blobs = [];
    files.forEach(function (f) { if (f.path) paths.push(f.path); else blobs.push(f); });
    if (!paths.length && !blobs.length) {
      var text = '';
      try { text = dt.getData('text/plain') || ''; } catch (err) { text = ''; }
      paths = text.split(/\r?\n/).map(unquote).filter(looksLikePath).map(asPath);
    }
    var total = paths.length + blobs.length;
    if (!total) return;
    e.preventDefault();
    pasteBegin(zone, total);
    var landed = 0;
    if (paths.length) {
      if (queue(paths)) landed += paths.length;
      for (var k = 0; k < paths.length; k++) pasteStep(k + 1, total);
    }
    if (!blobs.length) {
      setTimeout(function () { pasteDone(landed); }, 450);
      return;
    }
    var parked = 0;
    var parkedPaths = [];
    Promise.all(blobs.map(function (blob) {
      return park(blob).then(function (path) {
        parked++;
        pasteStep(paths.length + parked, total);
        if (path) parkedPaths.push(path);
      });
    })).then(function () {
      var all = paths.concat(parkedPaths);
      if (all.length && queue(all)) landed = all.length;
      pasteDone(landed);
    }, function () { pasteDone(landed); });
  });
})();
var SAMPLE_DEFAULT_GROUP = 'legacy';
var SAMPLE_TABS = {generator: {folders: {bt82x: 'BT82X', legacy: 'Legacy'}, default: 'legacy'}, programmer: {folders: {bt82x: 'BT82X', legacy: 'Legacy'}, default: 'legacy'}};
var SAMPLE_CHIP = {bt82x: 'BT820', legacy: 'BT815'};
function eabSampleChip(group) {
  if (chipGeneration() && chipGroup() === group) return;
  var $name = $('#chip-name');
  if (!$name.length) return;
  $name.val(SAMPLE_CHIP[group] || SAMPLE_CHIP.legacy);
  window.onChipPick('part');
}
function eabSampleQueue(tab, paths) {
  if (tab === 'programmer') {
    var file = paths[0];
    if (/BT817/.test(String($('#fp-chip').val() || ''))) {
      var want817 = paths.filter(function (p) { return /817/.test(p); });
      if (want817.length) file = want817[0];
    }
    var $action = $('#fp-action');
    if ($action.length && FP_FILE_OPS.indexOf(String($action.val() || '')) < 0) {
      var $program = $action.find('option[value="--program"]');
      if ($program.length && !$program.prop('disabled')) {
        $action.val('--program');
        onFpActionChange();
      }
    }
    if (typeof setFpImages === 'function' && file) setFpImages([file]);
    if (typeof planRender === 'function') planRender();
    if (typeof syncFpRun === 'function') syncFpRun();
    if (typeof window.eabSyncQueueChrome === 'function') window.eabSyncQueueChrome();
    return;
  }
  var zone = document.querySelector('#tab-' + tab + ' .drop-zone[data-for]')
    || document.querySelector('#tab-' + tab + ' .drop-zone')
    || document.querySelector('.drop-zone[data-for]');
  if (typeof window.eabOnDrop === 'function') window.eabOnDrop(paths, zone);
  if (typeof syncStartDisabled === 'function') syncStartDisabled();
}


var SAMPLE_FOLDERS = {bt82x: 'BT82X', legacy: 'Legacy'};
var sampleRel = {};
function eabSampleRead(rel) {
  if (typeof API_EAB_readExtFile !== 'function') return Promise.resolve({});
  return API_EAB_readExtFile({path: rel});
}
function eabSampleList(rel) {
  if (typeof API_EAB_listExtAssets !== 'function') return Promise.resolve({});
  return API_EAB_listExtAssets({path: rel});
}
function eabSampleData(path) {
  var rel = sampleRel[path];
  if (rel) return eabSampleRead(rel);
  return API_EAB_readFileAsBase64({path: path});
}
function eabSampleGroup() {
  var $picker = $('#chip-one');
  var pick = $picker.length ? String($picker.val() || '').split(':') : [];
  var kind = String(pick[0] || '');
  var value = String(pick[1] || '');
  if (kind === 'part' && typeof CHIP_TABLE !== 'undefined' && CHIP_TABLE[value]) return CHIP_TABLE[value][1];
  if (kind === 'gen' && typeof CHIP_GEN !== 'undefined' && CHIP_GEN[value]) return CHIP_GEN[value][1];
  var direct = chipGroup();
  if (SAMPLE_FOLDERS[direct]) return direct;
  return SAMPLE_DEFAULT_GROUP;
}
function eabSampleFail(ev) {
  var $btn = $(ev && ev.target ? ev.target : $('[data-sample]').first());
  if (!$btn.length) return;
  var text = $btn.text();
  $btn.text('\u26a0 No samples');
  setTimeout(function () { $btn.text(text); }, 6000);
}
window.eabUseSample = function (tab, ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  if (ev && ev.preventDefault) ev.preventDefault();
  var conf = SAMPLE_TABS[tab];
  if (!conf) return;
  var group = eabSampleGroup() === 'bt82x' ? 'bt82x' : SAMPLE_DEFAULT_GROUP;
  var folder = conf.folders[group] || SAMPLE_FOLDERS[SAMPLE_DEFAULT_GROUP];
  var base = 'samples/' + folder + '/';
  eabSampleList('samples/' + folder).then(function (resp) {
    var files = resp && resp.files ? resp.files : [];
    if (!files.length) return [];
    return Promise.all(files.map(function (name) {
      var rel = base + name;
      return eabSampleRead(rel).then(function (r) {
        if (r && r.ok && r.path) { sampleRel[r.path] = rel; return r.path; }
        return '';
      }, function () { return ''; });
    }));
  }).then(function (paths) {
    var good = (paths || []).filter(Boolean);
    if (!good.length) { eabSampleFail(ev); return; }
    eabSampleChip(group);
    eabSampleQueue(tab, good);
  });
};

/* Keep a combobox focused after a pick so the arrow keys keep changing it. */
document.addEventListener('change', function (event) {
  var el = event.target;
  if (event.isTrusted === false) return;
  if (!el || el.tagName !== 'SELECT' || el.disabled || el.multiple) return;
  var id = el.id;
  setTimeout(function () {
    var target = (id && document.getElementById(id)) || el;
    if (!target.isConnected || target.disabled || document.activeElement === target) return;
    try { target.focus({ preventScroll: true }); } catch (err) { try { target.focus(); } catch (e2) { } }
  }, 0);
}, true);
