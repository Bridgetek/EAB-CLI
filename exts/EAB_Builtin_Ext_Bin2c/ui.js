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
            rowMeta[path].resultText = st === 2 ? '✓ success in ' + fmtSecs(ms)
              : st === 3 ? ('✗ ' + (code !== null ? 'failed, error code: ' + code : 'failed: ' + (reason || 'unknown error')))
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
function buildCliArgs(file) {
  const cliArgs = ['-i', file];
  const outputDir = $('#output-dir').val() || '.';
  cliArgs.push('-o', outputDir);
  cliArgs.push('-f', $('#notation').val());
  cliArgs.push('-t', $('#type').val());
  cliArgs.push('-e', $('#endian').val());
  cliArgs.push('-n', $('#num-per-line').val() || '80');
  const name = $('#array-name').val();
  const isSingle = (state.inputFiles ? state.inputFiles.length : 1) <= 1;
  if (name && isSingle) cliArgs.push('-a', name);
  return { command: 'bin2c', cliArgs };
}
async function startRun() {
  const files = (state.inputFiles && state.inputFiles.length)
    ? state.inputFiles.slice()
    : (state.inputFile ? [state.inputFile] : []);
  if (files.length === 0) {
    showError('Please select at least one input binary file.');
    return;
  }
  state.running = true;
  $('#btn-run').prop('disabled', true);
  $('#result-panel').addClass('hidden');
  $('#error-panel').addClass('hidden');
  const results = [];
  batchRunning = true;
  updateBatchState();
  setTotalProgress(0);
  try {
    for (let i = 0; i < files.length; i++) {
      if (!(await eabBatchGate())) break;
      const file = files[i];
      const { command, cliArgs } = buildCliArgs(file);
      try {
        const resultJson = await invokeHost('execute_extension_command', {
          extensionId: 'bin2c',
          cliCommand: command,
          cliArgs: cliArgs,
        });
        const result = JSON.parse(resultJson);
        results.push(result);
        if (!result.success) showError(result.error || 'Conversion failed');
      } catch (err) {
        results.push({ success: false, error: String(err) });
      }
      setTotalProgress(((i + 1) / files.length) * 100);
    }
    onRunComplete(results);
  } catch (err) {
    showError('Conversion failed: ' + err);
    log('ERROR: ' + err);
  } finally {
    state.running = false;
    batchRunning = false;
    updateBatchState();
  }
}
function onRunComplete(results) {
  const okResults = (results || []).filter(r => r && r.success);
  const failResults = (results || []).filter(r => !r || !r.success);
  if (okResults.length === 0) {
    const msg = (failResults[0] && failResults[0].error) || 'Unknown conversion error';
    showError(msg);
    return;
  }
  $('#result-panel').removeClass('hidden');
  const totalElements = okResults.reduce((a, r) => a + (r.array_size || 0), 0);
  const totalBytes = okResults.reduce((a, r) => a + (r.output_size || 0), 0);
  const stats = [['Files', String(okResults.length)]];
  if (failResults.length) stats.push(['Failed', String(failResults.length)]);
  if (okResults.length === 1 && okResults[0].array_name !== undefined) stats.push(['Array', okResults[0].array_name]);
  stats.push(['Elements', String(totalElements)]);
  stats.push(['Size', totalBytes + ' B']);
  $('#result-stats').html(stats.map(([l, v]) => `
    <div class="stat-item">
      <span class="stat-label">${l}</span>
      <span class="stat-value">${v}</span>
    </div>
  `).join(''));
  const allFiles = [];
  okResults.forEach(r => (r.output_files || []).forEach(f => allFiles.push(f)));
  if (allFiles.length > 0) {
    const filesHtml = allFiles.map(f =>
      `<div class="file-item list-group-item" onclick="openFile('${f.replace(/'/g, "\\'")}')">📄 ${f}</div>`
    ).join('');
    $('#result-files').html(`
      <div style="font-size:12px;color:var(--text-dim);margin-bottom:4px;">Output Files:</div>
      ${filesHtml}
    `);
  }
  log('Done. ' + okResults.length + ' file(s) written to output folder.');
}
const B2C_SNIPPET_LINES = 3;
const B2C_TYPES = {
  byte: { cType: 'unsigned char', size: 1 },
  word: { cType: 'unsigned short', size: 2 },
  long: { cType: 'unsigned int', size: 4 },
};
let b2cCurrent = 0;
let b2cLastCount = 0;
let b2cToken = 0;
let b2cData = null;
function b2cSetText(id, text) {
  $('#' + id).text(text);
}
function b2cFormatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}
function b2cReset(message) {
  b2cToken++;
  b2cData = null;
  ['b2c-name', 'b2c-kind', 'b2c-size', 'b2c-elems', 'b2c-outfile'].forEach(id => b2cSetText(id, '-'));
  const $meta = $('#b2c-meta');
  if ($meta.length) $meta.addClass('hidden');
  const $wrap = $('#b2c-snippet-wrap');
  if ($wrap.length) $wrap.addClass('hidden');
  const $snippet = $('#b2c-snippet');
  if ($snippet.length) $snippet.text('');
  const $empty = $('#b2c-empty');
  if ($empty.length) {
    $empty.text(message || 'No binary selected');
    $empty.removeClass('hidden');
  }
  const $note = $('#b2c-note');
  if ($note.length) {
    $note.text('Pick a file to see the array this format will produce.');
    $note.removeClass('hidden');
  }
}
function b2cDetect(bytes) {
  const has = (at, str) => {
    if (bytes.byteLength < at + str.length) return false;
    for (let i = 0; i < str.length; i++) if (bytes[at + i] !== str.charCodeAt(i)) return false;
    return true;
  };
  if (has(0, '\x89PNG\r\n\x1a\n')) return 'PNG image';
  if (has(0, 'GIF87a') || has(0, 'GIF89a')) return 'GIF image';
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'JPEG image';
  if (has(0, 'RIFF')) return 'RIFF container (WAV / AVI / WebP)';
  if (has(0, 'PK\x03\x04')) return 'ZIP container';
  if (has(0, '\x7fELF')) return 'ELF binary';
  if (has(0, 'EAB')) return 'EVE asset';
  if (!bytes.byteLength) return 'empty file';
  let printable = true;
  const probe = Math.min(bytes.byteLength, 256);
  for (let i = 0; i < probe; i++) {
    const c = bytes[i];
    if (c !== 9 && c !== 10 && c !== 13 && (c < 32 || c > 126)) { printable = false; break; }
  }
  return printable ? 'ASCII text' : 'raw binary data';
}
function b2cArrayName(path) {
  const $explicit = $('#array-name');
  const typed = $explicit.length ? $explicit.val().trim() : '';
  const files = state.inputFiles || [];
  if (typed && files.length <= 1) return typed;
  const base = (path.split(/[\\/]/).pop() || 'data').replace(/\.[^.]+$/, '');
  return base.replace(/[^A-Za-z0-9_]/g, '_') || 'data';
}
function b2cArrayHead(bytes, path) {
  const notation = $('#notation').val() || 'decimal';
  const typeKey = $('#type').val() || 'byte';
  const endian = $('#endian').val() || 'little';
  const perLineRaw = parseInt($('#num-per-line').val(), 10);
  const perLine = Math.max(1, Math.min(9999, isNaN(perLineRaw) ? 80 : perLineRaw));
  const type = B2C_TYPES[typeKey] || B2C_TYPES.byte;
  const count = Math.floor(bytes.byteLength / type.size);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const values = [];
  const shown = Math.min(count, perLine * B2C_SNIPPET_LINES);
  for (let i = 0; i < shown; i++) {
    const at = i * type.size;
    let v;
    if (type.size === 1) v = bytes[at];
    else if (type.size === 2) v = endian === 'big' ? view.getUint16(at, false) : view.getUint16(at, true);
    else v = endian === 'big' ? view.getUint32(at, false) : view.getUint32(at, true);
    values.push(notation === 'hexa'
      ? '0x' + v.toString(16).toUpperCase().padStart(type.size * 2, '0')
      : String(v));
  }
  const lines = ['const ' + type.cType + ' ' + b2cArrayName(path) + '[] = {'];
  for (let at = 0; at < values.length; at += perLine) {
    lines.push('    ' + values.slice(at, at + perLine).join(', ') + ',');
  }
  if (count > shown) lines.push('    … ' + (count - shown) + ' more value(s)');
  lines.push('};');
  return { text: lines.join('\n'), count: count, type: type, remainder: bytes.byteLength % type.size };
}
function b2cRenderFromCache() {
  if (!b2cData) return;
  const { text, count, type, remainder } = b2cArrayHead(b2cData.bytes, b2cData.path);
  b2cSetText('b2c-elems', String(count) + ' × ' + type.cType +
    (remainder ? '  (+' + remainder + ' trailing byte' + (remainder > 1 ? 's' : '') + ' ignored)' : ''));
  const $snippet = $('#b2c-snippet');
  if ($snippet.length) $snippet.text(text);
  const $head = $('#b2c-snippet-head');
  if ($head.length) {
    $head.text('Generated array (head) — ' + type.cType + ', ' +
      ($('#notation').val() === 'hexa' ? 'hexadecimal' : 'decimal') + ', ' +
      ($('#endian').val() === 'big' ? 'big' : 'little') + '-endian');
  }
}
async function updateB2cPreview(path) {
  if (!path) return b2cReset();
  b2cReset('');
  const token = b2cToken;
  b2cSetText('b2c-name', path.split(/[\\/]/).pop() || path);
  b2cSetText('b2c-outfile', (path.split(/[\\/]/).pop() || 'data').replace(/\.[^.]+$/, '') + '.c');
  const $meta = $('#b2c-meta');
  if ($meta.length) $meta.removeClass('hidden');
  const $empty = $('#b2c-empty');
  if ($empty.length) $empty.addClass('hidden');
  if (!isEmbedded()) {
    b2cSetText('b2c-note', 'Array preview needs the EAB host.');
    const $n = $('#b2c-note');
    if ($n.length) $n.removeClass('hidden');
    return;
  }
  try {
    const resp = await eabSampleData(path);
    if (!resp || !resp.ok || !resp.data) throw new Error(resp && resp.error ? resp.error : 'read failed');
    const bytes = new Uint8Array(await (await fetch(resp.data)).arrayBuffer());
    if (token !== b2cToken) return;
    b2cData = { path: path, bytes: bytes };
    b2cSetText('b2c-kind', b2cDetect(bytes));
    b2cSetText('b2c-size', b2cFormatBytes(bytes.byteLength));
    b2cRenderFromCache();
    const $wrap = $('#b2c-snippet-wrap');
    if ($wrap.length) $wrap.removeClass('hidden');
    const $note = $('#b2c-note');
    if ($note.length) $note.addClass('hidden');
  } catch (err) {
    if (token !== b2cToken) return;
    b2cSetText('b2c-note', 'Could not read the binary: ' + err);
    const $n = $('#b2c-note');
    if ($n.length) $n.removeClass('hidden');
  }
}
$('#notation, #type, #endian, #num-per-line, #array-name')
  .on('input', b2cRenderFromCache)
  .filter('select')
  .on('change', b2cRenderFromCache);
function b2cSelectFile(index) {
  const files = state.inputFiles || [];
  if (index < 0 || index >= files.length) return;
  b2cCurrent = index;
  b2cAnnotateList();
  updateB2cPreview(files[index]);
}
function b2cAnnotateList() {
  $('#input-list .file-item').each(function (i) {
    $(this).toggleClass('b2c-current', i === b2cCurrent)
      .css('cursor', 'pointer')
      .off('click.b2c')
      .on('click.b2c', function (ev) {
        if (ev.target && ev.target.tagName === 'BUTTON') return;
        b2cSelectFile(i);
      });
  });
}
const _b2cRenderInputFiles = renderInputFiles;
renderInputFiles = function () {
  _b2cRenderInputFiles();
  const files = state.inputFiles || [];
  if (!files.length) {
    b2cCurrent = 0;
    b2cLastCount = 0;
    b2cReset();
    return;
  }
  if (files.length > b2cLastCount) b2cCurrent = files.length - 1;
  b2cLastCount = files.length;
  if (b2cCurrent >= files.length) b2cCurrent = files.length - 1;
  b2cAnnotateList();
  updateB2cPreview(files[b2cCurrent]);
};
b2cReset();
function openFile(path) {
  invokeHost('open_in_explorer', { path });
}
(function pasteIntoQueue() {
  if (!$('.drop-zone[data-for]').length) return;
  function dropZone() {
    var $main = $('.app-main:not(.hidden)');
    if (!$main.length) $main = $('body');
    return $main.find('.drop-zone[data-for]').get(0) || null;
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
    var zone = dropZone();
    if (editable(e.target) && (!zone || e.target.id !== $(zone).attr('data-for'))) return;
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
(function previewColumns() {
  function runBarGroup(mid) {
    return $(mid).children().filter(function () {
      return !this.getAttribute('data-eab-role') && !$(this).hasClass('card');
    });
  }
  function previewReady($mid) {
    return $mid.find('#b2c-meta').not('.hidden').length > 0;
  }
  function syncRunGate() {
    var $btn = $('#btn-run');
    if (!$btn.length) return;
    var n = (state.inputFiles || []).length;
    $btn.attr('data-eab-missing', !batchRunning && n === 0 ? '#input-card' : '')
      .prop('disabled', batchRunning || n === 0);
  }
  function isSignal(el) {
    var id = el && el.id;
    return id === 'b2c-preview' || id === 'b2c-meta' || id === 'b2c-empty';
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
var SAMPLE_GROUP_SELECT = '#chip-select';
var SAMPLE_DEFAULT_GROUP = 'legacy';
var SAMPLE_TABS = {bin2c: {folders: {bt82x: 'BT82X', legacy: 'Legacy'}, default: 'legacy'}};
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
  if (kind === 'group') return value;
  if (kind === 'part' && typeof CHIP_TABLE !== 'undefined' && CHIP_TABLE[value]) return CHIP_TABLE[value][1];
  if (kind === 'gen' && typeof CHIP_GEN !== 'undefined' && CHIP_GEN[value]) return CHIP_GEN[value][1];
  var direct = String($(SAMPLE_GROUP_SELECT).val() || '');
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
    var $box = $(SAMPLE_GROUP_SELECT);
    if ($box.length && $box.val() !== group) $box.val(group).trigger('change');
    if (typeof syncChipPicker === 'function') syncChipPicker();
    eabSampleQueue(tab, good);
  });
};
