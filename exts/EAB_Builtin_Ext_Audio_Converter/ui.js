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

var CHIP_TABLE = {
  FT800: ['FT80X', 'ft80x'], FT801: ['FT80X', 'ft80x'],
  FT810: ['FT81X/BT88X', 'ft81x'], FT811: ['FT81X/BT88X', 'ft81x'],
  FT812: ['FT81X/BT88X', 'ft81x'], FT813: ['FT81X/BT88X', 'ft81x'],
  BT880: ['FT81X/BT88X', 'bt88x'], BT881: ['FT81X/BT88X', 'bt88x'],
  BT882: ['FT81X/BT88X', 'bt88x'], BT883: ['FT81X/BT88X', 'bt88x'],
  BT815: ['BT81X', 'bt81x'], BT816: ['BT81X', 'bt81x'],
  BT817: ['BT81X', 'bt81x'], BT818: ['BT81X', 'bt81x'],
  BT820: ['BT82X', 'bt82x']
};
var CHIP_GEN = {
  FT80X: ['FT80X', 'ft80x'], FT81X: ['FT81X/BT88X', 'ft81x'],
  BT88X: ['FT81X/BT88X', 'bt88x'], BT81X: ['BT81X', 'bt81x'], BT82X: ['BT82X', 'bt82x']
};
var CHIP_BOX = { gen: 'chip-gen', part: 'chip-name' };
const CHIP_ORDER = ['gen', 'part'];
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
setCurrentInput = function (index) {
  _previewSetCurrentInput(index);
  const $el = $('#input-path');
  updateAudioPreview($el.length ? $el.val() : '');
  syncPreviewColumns();
};
const _previewUpdateBatchState = updateBatchState;
updateBatchState = function () {
  _previewUpdateBatchState();
  if (inputFiles.length === 0) previewReset();
  syncConvertGate();
  syncPreviewColumns();
};
previewReset();
syncConvertGate();
syncPreviewColumns();
function pickOutputDir() {
  if (!isEmbedded()) {
    const path = prompt('Enter output folder path:');
    if (path) $('#output-dir').val(path);
    return;
  }
  API_EAB_pickOutput({}).then(resp => {
    if (resp.ok && resp.folder) {
      $('#output-dir').val(resp.folder);
    }
  }).catch(err => showError('Failed to open folder picker: ' + err));
}
function log(_id, msg) { console.log('[eab] ' + msg); }
function showError(id, msg) {
  $('#' + id).text(msg).removeClass('hidden');
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
  inputFiles.forEach(p => paintRow(p));
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
window.eabStopRow = window.eabCancelRow = function (btn) {
  var __stopRow = (arguments[0] && arguments[0].closest)
    ? arguments[0].closest('.file-item') : null;
  if (__stopRow) $(__stopRow).addClass('stopping');
  const row = btn && btn.closest ? btn.closest(ROW_SEL) : null;
  const path = row ? rowPathOf(row) : '';
  const id = path ? jobIds[path] : null;
  if (id) API_EAB_cancelJob({ jobId: id }).catch(function () {  });
};
function runCliJob(cliCommand, cliArgs) {
  const at = cliArgs.indexOf('-i');
  const path = at >= 0 ? cliArgs[at + 1] : '';
  const t0 = Date.now();
  if (path) {
    const f = cliArgs.indexOf('-f');
    rowMeta[path] = { state: 'converting', status: '', resultText: '', t0: t0, ms: 0,
      label: 'Converting' + (f >= 0 && cliArgs[f + 1] ? ' to ' + cliArgs[f + 1] : '') };
    paintRow(path, t0); startRowTicker();
  }
  return API_EAB_startJob({ command: cliCommand, args: cliArgs }).then(function (resp) {
    if (!resp || !resp.ok || !resp.jobId) throw new Error((resp && resp.error) || 'Could not start the job');
    if (path) jobIds[path] = resp.jobId;
    return new Promise(function (resolve, reject) {
      const poll = setInterval(function () {
        API_EAB_pollJob({ jobId: resp.jobId }).then(function (p) {
          if (!p || !p.ok || !p.progress) return;
          const st = p.progress.status;
          if (st === 0 || st === 1) return;
          clearInterval(poll);
          if (path) {
            delete jobIds[path];
            const ms = Date.now() - t0;
            let code = null, reason = '';
            try { const r = JSON.parse(p.progress.result || '{}'); if (typeof r.exit_code === 'number') code = r.exit_code; reason = r.error || ''; } catch (e) {}
            rowMeta[path].state = st === 2 ? 'done' : st === 3 ? 'failed' : 'cancelled';
            rowMeta[path].ms = ms;
            rowMeta[path].resultText = st === 2 ? 'success in ' + fmtSecs(ms)
              : st === 3 ? (code !== null ? 'failed, error code: ' + code : 'failed: ' + (reason || 'unknown error'))
              : 'cancelled';
            paintRow(path);
          }
          if (path) {
            let why = '';
            if (st !== 2) { try { why = ' — ' + (JSON.parse(p.progress.result || '{}').error || 'failed'); } catch (e) { why = ' — failed'; } }
            log('log', (st === 2 ? '✓ ' : st === 3 ? '✗ ' : '⊘ ') + baseName(path) + ' in ' + fmtSecs(Date.now() - t0) + why);
          }
          if (st === 2) resolve(p.progress.result || '{}');
          else reject('Conversion failed');
        }).catch(function () {  });
      }, 250);
    });
  });
}
function invokeHost(cmd, args) {
  switch (cmd) {
    case 'execute_extension_command':
      return runCliJob(args.cliCommand, args.cliArgs);
    case 'open_in_explorer':
      return API_EAB_openOutputLocation({ path: args.path }).then(() => {});
    default:
      return Promise.reject('Unknown host command: ' + cmd);
  }
}
function switchTab(which) {
  $('.tab-content').removeClass('active');
  $('#tab-' + which).addClass('active');
  $('.tab-btn').removeClass('active');
  $('.tab-btn[data-tab="' + which + '"]').addClass('active');
  if (typeof window.eabSyncQueueChrome === 'function') window.eabSyncQueueChrome();
}
function chipLabel(which) {
  const $box = $('#' + CHIP_BOX[which]);
  return $box.length && $box.parent().length ? $box.parent().find('[data-chip-label="' + which + '"]') : null;
}
window.onChipPick = function (which) {
  var $boxes = {}, k;
  for (k in CHIP_BOX) $boxes[k] = $('#' + CHIP_BOX[k]);
  if (!$boxes.part.length || !$boxes.gen.length) return;
  for (k in CHIP_BOX) {
    var $lab = chipLabel(k);
    if ($lab) $lab.css('fontWeight', k === which ? '700' : '');
    if (k !== which) $boxes[k].val('');
  }
  onChipChange();
};
function onChipChange() {
  const chip = chipGroup();
  $('#opts-bt82x').toggleClass('hidden', chip !== 'bt82x');
  $('#opts-legacy').toggleClass('hidden', chip !== 'legacy');
  update82x();
  updatePre();
}
function update82x() {
  const fmt = $('#fmt-bt82x').val();
  const isS16 = fmt === '3';
  const container = $('#container').val();
  $('#channel').prop('disabled', !isS16);
  const $hint = $('#hint-bt82x');
  if (container === 'wav') {
    $hint.text('WAV container supports S16/S16S formats (ULAW/ADPCM not allowed in WAV).');
  } else {
    $hint.text(isS16 ? 'Mono 16-bit; channel selection applies when the input is multi-channel.' : 'Stereo 2×16-bit raw output.');
  }
}
function updatePre() {
  const fmt = $('#fmt-pre').val();
  $('#writehdr').prop('disabled', (fmt === '2'));
}
function buildConvertArgs() {
  const chip = chipGroup();
  const input = $('#input-path').val();
  const outDir = $('#output-dir').val() || '.';
  if (chip === 'bt82x') {
    const cliArgs = [
      '-i', input,
      '-o', outDir,
      '-f', $('#fmt-bt82x').val(),
      '-s', $('#rate-bt82x').val(),
      '-c', $('#container').val(),
    ];
    const channel = $('#channel').val();
    if ($('#fmt-bt82x').val() === '3' && channel !== 'mix') {
      cliArgs.push('-m', channel);
    }
    if ($('#container').val() === 'wav' && $('#remove-list').prop('checked')) {
      cliArgs.push('-r');
    }
    const ffopts = $('#ffopts').val().trim();
    if (ffopts) cliArgs.push('-p', ffopts);
    return { command: 'bt82x audio', cliArgs };
  } else {
    const cliArgs = [
      '-i', input,
      '-o', outDir,
      '-f', $('#fmt-pre').val(),
      '-s', $('#rate-pre').val(),
    ];
    const ffopts = $('#ffopts-pre').val().trim();
    if (ffopts) cliArgs.push('-p', ffopts);
    if ($('#writehdr').prop('checked')) cliArgs.push('-w');
    return { command: (chipGeneration() || 'ft80x') + ' audio', cliArgs };
  }
}
async function startConvert(keepLog) {
  const input = $('#input-path').val();
  if (!input) {
    showError('error-panel', 'Please select an input audio file.');
    return;
  }
  state.running = true;
  $('#btn-convert').prop('disabled', true);
  $('#result-panel').addClass('hidden');
  $('#error-panel').addClass('hidden');
  const { command, cliArgs } = buildConvertArgs();
  try {
    const resultJson = await invokeHost('execute_extension_command', {
      extensionId: 'audio_converter',
      cliCommand: command,
      cliArgs: cliArgs,
    });
    const result = JSON.parse(resultJson);
    if (!result.success) {
      showError('error-panel', 'Conversion failed: ' + (result.error || 'unknown error'));
    } else {
      if (result.summary) {
        result.summary.split('\n').forEach(l => log('log', l));
      }
      if (!batchRunning) setTotalProgress(100);
      $('#result-panel').removeClass('hidden');
      const files = result.output_files || [];
      $('#result-stats').html(`
        <div class="stat-item"><span class="stat-label">Files</span><span class="stat-value">${files.length}</span></div>
        <div class="stat-item"><span class="stat-label">Status</span><span class="stat-value">OK</span></div>
      `);
      $('#result-files').html(files.length
        ? files.map(f => `<div class="file-out" onclick="openFile('${f.replace(/'/g, "\\'")}')">📄 ${f}</div>`).join('')
        : '<div class="file-list-empty">No files.</div>');
    }
  } catch (err) {
    showError('error-panel', 'Conversion failed: ' + err);
    log('log', 'ERROR: ' + err);
  }
  state.running = false;
  $('#btn-convert').prop('disabled', false);
}
function addValidatorFiles(paths) {
  for (const p of paths) {
    if (p && state.validatorFiles.indexOf(p) === -1) state.validatorFiles.push(p);
  }
  renderValidatorFiles();
}
function addValidatorFile() {
  pickValidatorFiles();
}
function clearValidatorFiles() {
  state.validatorFiles = [];
  renderValidatorFiles();
}
function removeValidatorFile(idx) {
  state.validatorFiles.splice(idx, 1);
  renderValidatorFiles();
}
function valRow(path) {
  return $('#val-files .file-item').filter(function () { return $(this).attr('data-path') === path; }).first();
}
function valPaint(path, stateName, text) {
  const $el = valRow(path);
  if (!$el.length) return;
  ['done', 'failed', 'converting'].forEach(c => $el.removeClass(c));
  if (stateName) $el.addClass(stateName);
  $el.find('.file-item-status').text(text || '');
}
function renderValidatorFiles() {
  const $el = $('#val-files');
  $el.html(state.validatorFiles.map((f, i) => `
    <div class="file-item list-group-item" data-path="${escAttr(f)}" title="${escAttr(f)}">
      <span class="file-item-thumb-placeholder">🎵</span>
      <span class="file-item-name">${i + 1}. ${escAttr(baseName(f))}</span>
      <span class="file-item-status"></span>
      <span class="file-item-remove" title="Remove from the list">×</span>
    </div>`).join(''));
  $el.find('.file-item-remove').on('click', function () {
    const idx = state.validatorFiles.indexOf($(this).closest('.file-item').attr('data-path'));
    if (idx >= 0) removeValidatorFile(idx);
  });
  syncValidatorGate();
  if (typeof window.eabSyncQueueChrome === 'function') window.eabSyncQueueChrome();
}
function syncValidatorGate() {
  const missing = state.validatorFiles.length ? '' : '#val-files-card';
  $('#btn-validate').attr('data-eab-missing', state.running ? '' : missing)
    .prop('disabled', state.running || !!missing);
}
function setValProgress(pct) {
  $('#val-progress-fill').css('width', Math.max(0, Math.min(100, pct)) + '%');
}
async function startValidate() {
  const files = state.validatorFiles.slice();
  if (files.length === 0) return;
  state.running = true;
  syncValidatorGate();
  $('#error-panel-val').addClass('hidden').text('');
  setValProgress(0);
  let pass = 0;
  for (let n = 0; n < files.length; n++) {
    const file = files[n];
    valPaint(file, 'converting', 'validating…');
    let ok = false;
    let why = '';
    try {
      // Validation plays the file on the shared emulator, so the audio engine
      // itself decides whether the buffer is loadable.
      const resp = await API_EAB_callService({
        service: 'eve.emulator',
        method: 'audioValidate',
        args: { path: file, waitMs: 500 },
      });
      if (!resp || !resp.ok) throw new Error((resp && resp.error) || 'the emulator service is unavailable');
      ok = resp.result && resp.result.valid === true;
      if (!ok) why = (resp.result && resp.result.reason) || 'invalid audio';
    } catch (err) {
      why = String(err && err.message ? err.message : err);
    }
    if (ok) {
      pass++;
      valPaint(file, 'done', '✓ valid');
    } else {
      valPaint(file, 'failed', '✗ ' + why);
    }
    log('log-val', (ok ? 'PASS ' : 'FAIL ') + baseName(file) + (ok ? '' : ' — ' + why));
    setValProgress(((n + 1) / files.length) * 100);
  }
  const fail = files.length - pass;
  if (fail) {
    $('#error-panel-val').removeClass('hidden')
      .text(fail + ' of ' + files.length + ' file(s) failed validation — see the reason in each row.');
  }
  log('log-val', `Summary: PASS: ${pass}  FAIL: ${fail}`);
  state.running = false;
  syncValidatorGate();
}
function openFile(path) {
  invokeHost('open_in_explorer', { path });
}
$(function () {
  switchTab('converter');
  onChipChange();
  renderValidatorFiles();
});
function clearAllInputs() {
  inputFiles.length = 0;
  setCurrentInput(0);
  updateBatchState();
}
(function pasteRouter() {
  if (!$('.drop-zone[data-for]').length) return;
  var waiting = {};
  $(window).on('message', function (e) {
    var d = e.data;
    if (!d || !d.msgId || !waiting[d.msgId]) return;
    var done = waiting[d.msgId];
    delete waiting[d.msgId];
    done(d);
  });
  function dropZone() {
    var $main = $('.tab-content.active .app-main');
    if (!$main.length) $main = $('.app-main:not(.hidden)');
    if (!$main.length) $main = $(document);
    return $main.find('.drop-zone[data-for]').first();
  }
  function queue(paths) {
    if (typeof window.eabOnDrop !== 'function') return false;
    try { window.eabOnDrop(paths, dropZone().get(0) || null); return true; } catch (e) { return false; }
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
    var tag = el.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') return false;
    if (el.readOnly || el.disabled) return false;
    if (tag === 'INPUT' && /^(checkbox|radio|button|submit|range|file)$/i.test(el.type || '')) return false;
    return true;
  }
  var pasteRun = null;
  var pasteSeq = 0;
  function pasteTextEl($zone) {
    if (!$zone || !$zone.length) return null;
    var $box = $zone.find('.dz-paste').first();
    if (!$box.length) {
      $box = $('<div class="dz-paste" role="status" aria-live="polite">' +
        '<span class="dz-paste-spin" aria-hidden="true"></span>' +
        '<span class="dz-paste-text"></span></div>').appendTo($zone);
    }
    var $text = $box.find('.dz-paste-text').first();
    return $text.length ? $text : null;
  }
  function pastePaint() {
    if (!pasteRun) return;
    var text = pasteTextEl(pasteRun.zone);
    if (!text) return;
    var dots = new Array(pasteRun.dots + 1).join('.');
    var n = pasteRun.done.length;
    if (!n) {
      text.text('Pasting… reading the clipboard' + dots);
      return;
    }
    text.text('Pasting ' + pasteRun.done.join('.') +
      (pasteRun.total > 1 ? ' of ' + pasteRun.total : '') +
      ' file' + (pasteRun.total === 1 ? '' : 's') + ' from clipboard' + dots);
  }
  function pasteBegin(zone, total) {
    if (pasteRun && pasteRun.ticker) clearInterval(pasteRun.ticker);
    var run = { zone: zone, done: [], total: total || 0, dots: 1, token: ++pasteSeq, ticker: null };
    pasteRun = run;
    if (zone && zone.length) zone.addClass('is-pasting');
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
    var text = pasteTextEl(run.zone);
    if (text) {
      text.text(count
        ? 'Pasted ' + count + ' file' + (count === 1 ? '' : 's') + ' from clipboard'
        : 'Nothing usable on the clipboard');
    }
    if (!run.zone || !run.zone.length) return;
    setTimeout(function () {
      if (pasteSeq !== run.token) return;
      run.zone.removeClass('is-pasting');
      var t = pasteTextEl(run.zone);
      if (t) t.text('');
    }, 1600);
  }
  $(document).on('paste', function (e) {
    var dt = e.clipboardData;
    if (!dt) return;
    var zone = dropZone();
    if (editable(e.target) && (!zone.length || $(e.target).attr('id') !== zone.attr('data-for'))) return;
    var files = [];
    try { files = Array.prototype.slice.call(dt.files || []); } catch (err) { files = []; }
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
function syncConvertGate() {
  var $btn = $('#btn-convert');
  if (!$btn.length) return;
  var chip = chipGeneration();
  var fmt = String((chipGroup() === 'legacy' ? $('#fmt-pre').val() : $('#fmt-bt82x').val()) || '');
  var missing = !inputFiles.length ? '#input-card' : !chip ? '#chip-one' :
    !fmt ? (chipGroup() === 'legacy' ? '#fmt-pre' : '#fmt-bt82x') : '';
  var disabled = batchRunning || !!missing;
  $btn.attr('data-eab-missing', disabled && !batchRunning ? missing : '')
    .prop('disabled', disabled);
}
function runBarGroup(mid) {
  return $(mid).children().filter(function () {
    return !this.getAttribute('data-eab-role') && !$(this).hasClass('card');
  });
}
function rowPreviewReady($row) {
  var $meta = $row.find('#ap-meta');
  return !$meta.length || !$meta.hasClass('hidden');
}
function syncPreviewColumns() {
  $('.app-main').each(function () {
    var $row = $(this);
    var $mid = $row.children('.mid-col');
    var $right = $row.children('.right-col');
    var group = runBarGroup($mid.get(0)).add(runBarGroup($right.get(0)));
    if (!$mid.length || !$right.length || !group.length) {
      $row.removeClass('no-preview');
      return;
    }
    var noPreview = !$row.hasClass('is-queue-empty') && !rowPreviewReady($row);
    $row.toggleClass('no-preview', noPreview);
    if (group.parent().get(0) !== $right.get(0) || group.index() !== 0) $right.prepend(group);
  });
}
var previewSyncQueued = false;
window.eabPreviewChanged = queuePreviewSync;
function queuePreviewSync() {
  if (previewSyncQueued) return;
  previewSyncQueued = true;
  setTimeout(function () { previewSyncQueued = false; syncPreviewColumns(); }, 0);
}
$(function () {
  syncConvertGate();
  syncPreviewColumns();
  setTimeout(syncPreviewColumns, 0);
  $('#chip-one, #chip, #fmt-bt82x, #fmt-pre, #container').on('change', function () { syncConvertGate(); });
  $(window).on('resize', function () { queuePreviewSync(); });
  if (typeof MutationObserver !== 'function') return;
  new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      var target = records[i].target;
      var cls = target && target.classList;
      if (cls && (cls.contains('ap-meta') || cls.contains('ap-empty') || cls.contains('app-row'))) {
        queuePreviewSync();
        return;
      }
    }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
});
var SAMPLE_DEFAULT_GROUP = 'legacy';
var SAMPLE_TABS = {converter: {folders: {bt82x: 'BT82X', legacy: 'Legacy'}, default: 'legacy'}, validator: {folders: {bt82x: 'BT82X', legacy: 'Legacy'}, default: 'legacy'}};


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
function eabSampleQueue(tab, paths) {
  var zone = document.querySelector('#tab-' + tab + ' .drop-zone[data-for]')
    || document.querySelector('#tab-' + tab + ' .drop-zone')
    || document.querySelector('.drop-zone[data-for]');
  if (typeof window.eabOnDrop === 'function') window.eabOnDrop(paths, zone);
  if (typeof syncStartDisabled === 'function') syncStartDisabled();
}

window.eabUseSample = function (tab, ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  if (ev && ev.preventDefault) ev.preventDefault();
  var conf = SAMPLE_TABS[tab];
  if (!conf) return;
  var group = eabSampleGroup();
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
    eabSampleQueue(tab, good);
  });
};
