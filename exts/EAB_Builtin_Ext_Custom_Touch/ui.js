(function () {
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
})();

const state = {
  inputFile: null,
  running: false,
};
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
function log(msg) { console.log('[eab] ' + msg); }
function showError(msg) {
  const $panel = $('#error-panel');
  $panel.text(msg);
  $panel.removeClass('hidden');
}
const ROW_SEL = '#input-list .file-item';
const rowMeta = {};
const jobIds = {};
let rowTicker = null;
function rowPathOf($row) { return $row.attr('data-path') || $row.attr('title') || ''; }
function rowEl(path) {
  const $rows = $(ROW_SEL);
  const $hit = $rows.filter(function () { return rowPathOf($(this)) === path; }).first();
  if ($hit.length) return $hit;
  const base = baseName(path);
  if (!base) return $();
  return $rows.filter(function () {
    return !$(this).hasClass('done') && $(this).text().indexOf(base) >= 0;
  }).first();
}
function paintRow(path, startedAt) {
  const $row = rowEl(path);
  if (!$row.length) return;
  const m = rowMeta[path] || {};
  ['converting', 'done', 'failed', 'cancelled', 'current'].forEach(c => $row.removeClass(c));
  if (m.state) $row.addClass(m.state);
  if (m.state === 'converting') $row.addClass('indeterminate');
  if (batchRunning && path === $('#input-path').val()) $row.addClass('current');
  const since = m.t0 || startedAt;
  const live = m.state === 'converting' && since;
  setText($row.find('.file-item-bar-label').first(),
    live ? (m.label || 'Compiling') + ' ' + fmtSecs(Date.now() - since) + '…' : '');
  setText($row.find('.file-item-status').first(), live ? '' : (m.resultText || ''));
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
window.eabStopRow = function (btn) {
  const $btn = $(btn);
  const $row = $btn.closest('.file-item');
  $row.addClass('stopping');
  const path = rowPathOf($row);
  const id = path ? jobIds[path] : null;
  if (id) API_EAB_cancelJob({ jobId: id }).catch(function () {  });
};
function runCliJob(cliCommand, cliArgs) {
  const at = cliArgs.indexOf('-i');
  const path = at >= 0 ? cliArgs[at + 1] : '';
  const t0 = Date.now();
  if (path) {
    rowMeta[path] = { state: 'converting', status: '', resultText: '', t0: t0, ms: 0,
      label: 'Compiling' };
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
            rowMeta[path].resultText = st === 2 ? '✓ ' + fmtSecs(ms)
              : st === 3 ? (code !== null ? '✗ error code ' + code : '✗ ' + (reason || 'failed'))
              : '⊘ cancelled';
            paintRow(path);
          }
          if (path) {
            let why = '';
            if (st !== 2) { try { why = ' — ' + (JSON.parse(p.progress.result || '{}').error || 'failed'); } catch (e) { why = ' — failed'; } }
            log((st === 2 ? '✓ ' : st === 3 ? '✗ ' : '⊘ ') + baseName(path) + ' in ' + fmtSecs(Date.now() - t0) + why);
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
function chipInfo(chip) {
  if (chip === 'BT81X') {
    return { tool: 'jtc.exe (BT81X toolchain)', hint: 'Uses jtc.exe (BT81X toolchain).' };
  }
  return { tool: 'jtc_FT81X_BT88X.exe', hint: 'Uses jtc_FT81X_BT88X.exe (' + chip + ' toolchain).' };
}
var CHIP_TABLE = {
  FT800: ['FT80X', 'ft80x', 'FT80X'], FT801: ['FT80X', 'ft80x', 'FT80X'],
  FT810: ['FT81X/BT88X', 'ft81x', 'FT81X'], FT811: ['FT81X/BT88X', 'ft81x', 'FT81X'],
  FT812: ['FT81X/BT88X', 'ft81x', 'FT81X'], FT813: ['FT81X/BT88X', 'ft81x', 'FT81X'],
  BT880: ['FT81X/BT88X', 'bt88x', 'BT88X'], BT881: ['FT81X/BT88X', 'bt88x', 'BT88X'],
  BT882: ['FT81X/BT88X', 'bt88x', 'BT88X'], BT883: ['FT81X/BT88X', 'bt88x', 'BT88X'],
  BT815: ['BT81X', 'bt81x', 'BT81X'], BT816: ['BT81X', 'bt81x', 'BT81X'],
  BT817: ['BT81X', 'bt81x', 'BT81X'], BT818: ['BT81X', 'bt81x', 'BT81X'],
  BT820: ['BT82X', 'bt82x', '']
};
var CHIP_GEN = {
  FT80X: ['FT80X', 'ft80x', 'FT80X'], FT81X: ['FT81X/BT88X', 'ft81x', 'FT81X'],
  BT88X: ['FT81X/BT88X', 'bt88x', 'BT88X'], BT81X: ['BT81X', 'bt81x', 'BT81X'],
  BT82X: ['BT82X', 'bt82x', '']
};
var CHIP_GEN_FAMILY = { FT80X: 'FT80X', FT81X: 'FT81X', BT88X: 'BT88X', BT81X: 'BT81X', BT82X: 'BT82X' };
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
function currentChipFamily() {
  var part = $('#' + CHIP_BOX.part).val();
  if (part) {
    var row = CHIP_TABLE[String(part).toUpperCase()];
    return row ? row[2] : '';
  }
  var gen = $('#' + CHIP_BOX.gen).val();
  if (gen) return CHIP_GEN_FAMILY[String(gen).toUpperCase()] || '';
  return '';
}
function chipLabel(which) {
  return $('#' + CHIP_BOX[which]).parent().find('[data-chip-label="' + which + '"]');
}
window.onChipPick = function (which) {
  var $boxes = {}, k;
  for (k in CHIP_BOX) $boxes[k] = $('#' + CHIP_BOX[k]);
  if (!$boxes.part.length || !$boxes.gen.length) return;
  for (k in CHIP_BOX) {
    var $lab = chipLabel(k);
    if ($lab && $lab.length) $lab.css('fontWeight', k === which ? '700' : '');
    if (k !== which) $boxes[k].val('');
  }
  onChipChange();
};
function onChipChange() {
  $('#chip-hint').text(chipInfo(currentChipFamily() || 'BT81X').hint);
}
function buildCliArgs() {
  const cliArgs = [];
  const family = currentChipFamily();
  if (family) cliArgs.push('-c', family);
  cliArgs.push('-i', state.inputFile);
  const outputDir = $('#output-dir').val() || '.';
  cliArgs.push('-o', outputDir);
  return { command: (chipGeneration() || 'bt81x') + ' fwtouch', cliArgs };
}
async function startRun() {
  if (!state.inputFile) {
    showError('Please select an input C source file first.');
    return;
  }
  state.running = true;
  $('#btn-run').prop('disabled', true);
  $('#result-panel').addClass('hidden');
  $('#error-panel').addClass('hidden');
  const { command, cliArgs } = buildCliArgs();
  try {
    const resultJson = await invokeHost('execute_extension_command', {
      extensionId: 'custom_touch',
      cliCommand: command,
      cliArgs: cliArgs,
    });
    const result = JSON.parse(resultJson);
    onRunComplete(result);
  } catch (err) {
    showError('Compilation failed: ' + err);
    log('ERROR: ' + err);
  } finally {
    state.running = false;
    $('#btn-run').prop('disabled', false);
  }
}
function onRunComplete(result) {
  if (!result.success) {
    showError(result.error || 'Unknown compilation error');
    log('ERROR: ' + (result.error || 'Unknown compilation error'));
    return;
  }
  $('#result-panel').removeClass('hidden');
  const stats = [];
  if (result.chip !== undefined) stats.push(['Chip', result.chip]);
  if (result.jtc_tool !== undefined) stats.push(['Tool', result.jtc_tool.split(/[\\/]/).pop()]);
  if (result.load_h !== undefined) stats.push(['Header', result.load_h]);
  if (result.load_bin !== undefined) stats.push(['Binary', result.load_bin]);
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
    $('#result-files').html('<div class="result-label">Output files</div>' + filesHtml);
  }
  log('Done. Firmware written to output folder.');
}
function openFile(path) {
  invokeHost('open_in_explorer', { path });
}
const CT_SNIPPET_LINES = 40;
let ctToken = 0;
function ctSetText(id, text) {
  $('#' + id).text(text);
}
function ctFormatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}
function ctReset(message) {
  ctToken++;
  ['ct-name', 'ct-size', 'ct-lines', 'ct-declares'].forEach(id => ctSetText(id, '-'));
  const $meta = $('#ct-meta');
  if ($meta.length) $meta.addClass('hidden');
  const $wrap = $('#ct-snippet-wrap');
  if ($wrap.length) $wrap.addClass('hidden');
  const $snippet = $('#ct-snippet');
  if ($snippet.length) $snippet.text('');
  const $empty = $('#ct-empty');
  if ($empty.length) {
    $empty.text(message || 'No source file selected');
    $empty.removeClass('hidden');
  }
  const $note = $('#ct-note');
  if ($note.length) {
    $note.text('The queued file\'s header is shown here.');
    $note.removeClass('hidden');
  }
}
function ctDescribeSource(text) {
  const defines = (text.match(/^\s*#\s*define\b/gm) || []).length;
  const statics = (text.match(/^\s*static\b/gm) || []).length;
  const functions = (text.match(/^\s*[A-Za-z_][\w \t*]*\s+[A-Za-z_]\w*\s*\([^;]*\)\s*\{/gm) || []).length;
  const parts = [];
  if (functions) parts.push(functions + ' function' + (functions > 1 ? 's' : ''));
  if (statics) parts.push(statics + ' static');
  if (defines) parts.push(defines + ' #define');
  return parts.length ? parts.join(' · ') : 'no declarations found';
}
async function updateTouchPreview(path) {
  if (!path) return ctReset();
  ctReset('');
  const token = ctToken;
  const name = path.split(/[\\/]/).pop() || path;
  ctSetText('ct-name', name);
  const $meta = $('#ct-meta');
  if ($meta.length) $meta.removeClass('hidden');
  const $empty = $('#ct-empty');
  if ($empty.length) $empty.addClass('hidden');
  if (!isEmbedded()) {
    ctSetText('ct-note', 'Source preview needs the EAB host.');
    return;
  }
  try {
    const resp = await eabSampleData(path);
    if (!resp || !resp.ok || !resp.data) throw new Error(resp && resp.error ? resp.error : 'read failed');
    const bytes = new Uint8Array(await (await fetch(resp.data)).arrayBuffer());
    if (token !== ctToken) return;
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    const lines = text.length ? text.split(/\r\n|\r|\n/) : [];
    ctSetText('ct-size', ctFormatBytes(bytes.byteLength));
    ctSetText('ct-lines', String(lines.length));
    ctSetText('ct-declares', ctDescribeSource(text));
    const $snippet = $('#ct-snippet');
    if ($snippet.length) {
      let shown = lines.slice(0, CT_SNIPPET_LINES).join('\n');
      if (lines.length > CT_SNIPPET_LINES) {
        shown += '\n… ' + (lines.length - CT_SNIPPET_LINES) + ' more line(s)';
      }
      $snippet.text(shown);
    }
    const $wrap = $('#ct-snippet-wrap');
    if ($wrap.length) $wrap.removeClass('hidden');
    const $note = $('#ct-note');
    if ($note.length) $note.addClass('hidden');
  } catch (err) {
    if (token !== ctToken) return;
    ctSetText('ct-note', 'Could not read the source: ' + err);
  }
}
const _ctSetCurrentInput = setCurrentInput;
setCurrentInput = function (index) {
  _ctSetCurrentInput(index);
  const $el = $('#input-path');
  state.inputFile = $el.length ? ($el.val() || '') : '';
  updateTouchPreview(state.inputFile);
};
const _ctUpdateBatchState = updateBatchState;
updateBatchState = function () {
  _ctUpdateBatchState();
  if (inputFiles.length === 0) ctReset();
};
ctReset();
updateBatchState();
const PREBUILT_RELATIVE = 'Legacy/Custom Touch Test/PreBuildBin';
function setPrebuiltStatus(text) {
  const $el = $('#pb-status');
  if ($el.length) $el.text(text || '');
}
function openPrebuiltFolder(vendor) {
  if (!isEmbedded()) {
    setPrebuiltStatus('Assets folder is only available in the app.');
    return;
  }
  setPrebuiltStatus('Opening ' + vendor + '…');
  API_EAB_getAssetDir()
    .then(resp => {
      if (!resp || !resp.ok || !resp.folder) {
        throw new Error(resp && resp.error ? resp.error : 'asset folder not found');
      }
      const sep = String(resp.folder).includes('/') ? '/' : '\\';
      const path = String(resp.folder).replace(/[\\/]+$/, '') + sep + PREBUILT_RELATIVE + sep + vendor;
      return API_EAB_openOutputLocation({ path }).then(open => {
        if (open && open.ok) {
          setPrebuiltStatus('Opened ' + vendor);
          log('Prebuilt binaries: ' + path);
        } else {
          setPrebuiltStatus('Could not open ' + path);
        }
      });
    })
    .catch(err => setPrebuiltStatus(String(err && err.message ? err.message : err)));
}
(function pasteRouter() {
  if (!$('.drop-zone[data-for]').length) return;
  function dropZone() {
    var $main = $('.app-main:not(.hidden)');
    if (!$main.length) $main = $(document);
    var $zone = $main.find('.drop-zone[data-for]').first();
    return $zone.length ? $zone.get(0) : null;
  }
  function queue(paths) {
    if (typeof window.eabOnDrop !== 'function') return false;
    try { window.eabOnDrop(paths, dropZone()); return true; } catch (e) { return false; }
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
    var $el = $(el);
    if (!$el.length) return false;
    var tag = $el.prop('tagName');
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') return false;
    if ($el.prop('readOnly') || $el.prop('disabled')) return false;
    if (tag === 'INPUT' && /^(checkbox|radio|button|submit|range|file)$/i.test($el.prop('type') || '')) return false;
    return true;
  }
  var pasteRun = null;
  var pasteSeq = 0;
  function pasteTextEl($zone) {
    if (!$zone || !$zone.length) return $();
    var $box = $zone.find('.dz-paste').first();
    if (!$box.length) {
      $box = $('<div class="dz-paste" role="status" aria-live="polite">' +
        '<span class="dz-paste-spin" aria-hidden="true"></span>' +
        '<span class="dz-paste-text"></span></div>').appendTo($zone);
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
  function pasteBegin($zone, total) {
    if (pasteRun && pasteRun.ticker) clearInterval(pasteRun.ticker);
    var run = { zone: $zone, done: [], total: total || 0, dots: 1, token: ++pasteSeq, ticker: null };
    pasteRun = run;
    if ($zone && $zone.length) $zone.addClass('is-pasting');
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
    if (!run.zone.length) return;
    setTimeout(function () {
      if (pasteSeq !== run.token) return;
      run.zone.removeClass('is-pasting');
      pasteTextEl(run.zone).text('');
    }, 1600);
  }
  $(document).on('paste', function (e) {
    var dt = e.originalEvent.clipboardData;
    if (!dt) return;
    var $zone = dropZone();
    if (editable(e.target) && (!$zone.length || $(e.target).attr('id') !== $zone.attr('data-for'))) return;
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
    pasteBegin($zone, total);
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
(function previewColumns() {
  function runBarGroup(mid) {
    return $(mid).children().filter(function () {
      return !this.getAttribute('data-eab-role') && !$(this).hasClass('card');
    });
  }
  function previewReady($mid) {
    return $mid.find('#ct-meta').not('.hidden').length > 0;
  }
  function chipSelected() {
    var $picker = $('#chip-one');
    return !$picker.length || String($picker.val() || '').length > 0;
  }
  function syncRunGate() {
    var $btn = $('#btn-run');
    if (!$btn.length) return;
    var missing = inputFiles.length === 0 ? '#input-card' : !chipSelected() ? '#chip-one' : '';
    $btn.attr('data-eab-missing', !batchRunning ? missing : '')
      .prop('disabled', batchRunning || !!missing);
  }
  function isSignal(el) {
    var id = el && el.id;
    return id === 'ct-preview' || id === 'ct-meta' || id === 'ct-empty';
  }
  function syncPreviewColumns() {
    $('.mid-col').each(function () {
      var $mid = $(this);
      var $row = $mid.parent('.app-row');
      var $right = $row.children('.right-col');
      if (!$right.length) return;
      var group = runBarGroup(this).add(runBarGroup($right.get(0)));
      var noPreview = !$row.hasClass('is-queue-empty') && !previewReady($mid);
      $row.toggleClass('no-preview', noPreview);
      if (!group.length) return;
      if (group.parent().get(0) !== $right.get(0) || group.index() !== 0) $right.prepend(group);
    });
  }
  var previewSyncQueued = false;
  function queuePreviewSync() {
    if (previewSyncQueued) return;
    previewSyncQueued = true;
    setTimeout(function () {
      previewSyncQueued = false;
      syncPreviewColumns();
      syncRunGate();
    }, 0);
  }
  $(document).ready(function () {
    $('#chip-one, #chip-name, #chip-gen').on('change', function () { syncRunGate(); });
    syncPreviewColumns();
    syncRunGate();
    setTimeout(function () { syncPreviewColumns(); syncRunGate(); }, 0);
    if (typeof MutationObserver !== 'function') return;
    new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var target = records[i].target;
        if (!target || !target.classList) continue;
        if (isSignal(target) || target.classList.contains('app-row')) {
          queuePreviewSync();
          return;
        }
      }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
  });
})();
var SAMPLE_DEFAULT_GROUP = 'legacy';
var SAMPLE_TABS = {touch: {folders: {legacy: 'Legacy'}, default: 'legacy'}};
function eabSampleQueue(tab, paths) {
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
