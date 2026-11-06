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
    rowMeta[path] = { state: 'converting', resultText: '', t0: t0, ms: 0, label: 'Converting' };
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
function chipInfo(group, family) {
  if (group === 'bt82x') {
    return { command: 'bt82x disassembler', cliArgs: [], hint: 'Decodes with the BT82X command set (no -c chip flag).' };
  }
  const args = family ? ['-c', family] : [];
  return {
    command: (chipGeneration() || 'ft80x') + ' disassembler',
    cliArgs: args,
    hint: 'Decodes with the pre-BT82X (BT81X / FT81X / FT80X / BT88X) command set'
      + (family ? ' via -c ' + family + '.' : ' (tool default).'),
  };
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
function currentChipGroup() {
  return chipGroup();
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
  $('#chip-hint').text(chipInfo(currentChipGroup(), currentChipFamily()).hint);
}
function buildCliArgs(file) {
  const info = chipInfo(currentChipGroup(), currentChipFamily());
  const cliArgs = [...info.cliArgs];
  cliArgs.push('-i', file);
  const outputDir = $('#output-dir').val() || '.';
  cliArgs.push('-o', outputDir);
  if ($('#detail-flag').prop('checked')) cliArgs.push('-d');
  return { command: info.command, cliArgs };
}
async function startRun() {
  const files = (state.inputFiles && state.inputFiles.length)
    ? state.inputFiles.slice()
    : (state.inputFile ? [state.inputFile] : []);
  if (files.length === 0) {
    showError('Please select at least one input file.');
    return;
  }
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
          extensionId: 'disassembler_utilities',
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
    showError('Disassembly failed: ' + err);
    log('ERROR: ' + err);
  } finally {
    batchRunning = false;
    updateBatchState();
  }
}
function onRunComplete(results) {
  const okResults = (results || []).filter(r => r && r.success);
  const failResults = (results || []).filter(r => !r || !r.success);
  if (okResults.length === 0) {
    const msg = (failResults[0] && failResults[0].error) || 'Unknown disassembly error';
    showError(msg);
    return;
  }
  $('#result-panel').removeClass('hidden');
  const totalWords = okResults.reduce((a, r) => a + (r.num_words || 0), 0);
  const stats = [['Files', String(okResults.length)]];
  if (failResults.length) stats.push(['Failed', String(failResults.length)]);
  stats.push(['Words', String(totalWords)]);
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
  log('Done. ' + allFiles.length + ' output file(s) in ' + ($('#output-dir').val() || '.'));
}
function openFile(path) {
  invokeHost('open_in_explorer', { path });
}
const DISC_SNIPPET_LINES = 24;
const DISC_WORDS_PER_LINE = 4;
let discCurrent = 0;
let discLastCount = 0;
let discToken = 0;
function discSetText(id, text) {
  $('#' + id).text(text);
}
function discFormatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}
function discReset(message) {
  discToken++;
  ['disc-name', 'disc-kind', 'disc-size', 'disc-words', 'disc-chip'].forEach(id => discSetText(id, '-'));
  const $meta = $('#disc-meta');
  if ($meta.length) $meta.addClass('hidden');
  const $wrap = $('#disc-snippet-wrap');
  if ($wrap.length) $wrap.addClass('hidden');
  const $snippet = $('#disc-snippet');
  if ($snippet.length) $snippet.text('');
  discSetText('disc-snippet-head', 'First lines');
  const $empty = $('#disc-empty');
  if ($empty.length) {
    $empty.text(message || 'No file selected');
    $empty.removeClass('hidden');
  }
  const $note = $('#disc-note');
  if ($note.length) {
    $note.text('Select a display list to inspect it before decoding.');
    $note.removeClass('hidden');
  }
}
function discClassify(bytes) {
  if (bytes.byteLength === 0) return { kind: 'empty file', words: 0, text: '' };
  let text = null;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (e) {
    text = null;
  }
  const printable = text !== null && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text);
  if (printable) {
    const tokens = text.match(/0x[0-9A-Fa-f]{1,8}\b|\b[0-9A-Fa-f]{4,8}\b/g) || [];
    return { kind: 'hex text', words: tokens.length, text: text };
  }
  return {
    kind: 'raw 32-bit LE binary',
    words: Math.floor(bytes.byteLength / 4),
    remainder: bytes.byteLength % 4,
    bytes: bytes,
  };
}
function discBinaryDump(bytes, maxLines) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const lines = [];
  const total = Math.floor(bytes.byteLength / 4);
  const shown = Math.min(total, maxLines * DISC_WORDS_PER_LINE);
  for (let at = 0; at < shown; at += DISC_WORDS_PER_LINE) {
    const parts = [];
    for (let w = 0; w < DISC_WORDS_PER_LINE && at + w < total; w++) {
      parts.push(view.getUint32((at + w) * 4, true).toString(16).toUpperCase().padStart(8, '0'));
    }
    lines.push(String(at).padStart(4, '0') + ': ' + parts.join(' '));
  }
  if (total > shown) lines.push('… ' + (total - shown) + ' more word(s)');
  return lines.join('\n');
}
function discChipLabel() {
  return chipGroup();
}
async function updateDiscPreview(path) {
  if (!path) return discReset();
  discReset('');
  const token = discToken;
  discSetText('disc-name', path.split(/[\\/]/).pop() || path);
  discSetText('disc-chip', discChipLabel());
  const $meta = $('#disc-meta');
  if ($meta.length) $meta.removeClass('hidden');
  const $empty = $('#disc-empty');
  if ($empty.length) $empty.addClass('hidden');
  if (!isEmbedded()) {
    discSetText('disc-note', 'File inspection needs the EAB host.');
    return;
  }
  try {
    const resp = await eabSampleData(path);
    if (!resp || !resp.ok || !resp.data) throw new Error(resp && resp.error ? resp.error : 'read failed');
    const bytes = new Uint8Array(await (await fetch(resp.data)).arrayBuffer());
    if (token !== discToken) return;
    const info = discClassify(bytes);
    discSetText('disc-size', discFormatBytes(bytes.byteLength));
    discSetText('disc-kind', info.kind);
    discSetText('disc-words', String(info.words) + (info.remainder ? '  (+' + info.remainder + ' byte tail)' : ''));
    const $snippet = $('#disc-snippet');
    if ($snippet.length) {
      if (info.text !== undefined) {
        const lines = info.text.split(/\r\n|\r|\n/);
        const head = lines.slice(0, DISC_SNIPPET_LINES).join('\n');
        $snippet.text(head + (lines.length > DISC_SNIPPET_LINES
          ? '\n… ' + (lines.length - DISC_SNIPPET_LINES) + ' more line(s)' : ''));
      } else {
        $snippet.text(discBinaryDump(info.bytes, DISC_SNIPPET_LINES));
      }
    }
    discSetText('disc-snippet-head', info.text !== undefined ? 'First lines' : 'First words (little-endian)');
    const $wrap = $('#disc-snippet-wrap');
    if ($wrap.length) $wrap.removeClass('hidden');
    const $note = $('#disc-note');
    if ($note.length) $note.addClass('hidden');
    if (info.words === 0) {
      discSetText('disc-note', 'No command words found — is this really a display list?');
      const $n = $('#disc-note');
      if ($n.length) $n.removeClass('hidden');
    }
  } catch (err) {
    if (token !== discToken) return;
    discSetText('disc-note', 'Could not read the file: ' + err);
    const $n = $('#disc-note');
    if ($n.length) $n.removeClass('hidden');
  }
}
function discSelectFile(index) {
  const files = state.inputFiles || [];
  if (index < 0 || index >= files.length) return;
  discCurrent = index;
  discAnnotateList();
  updateDiscPreview(files[index]);
}
function discAnnotateList() {
  $('#input-list .file-item').each(function (i) {
    const $row = $(this);
    $row.toggleClass('disc-current', i === discCurrent);
    $row.css('cursor', 'pointer');
    $row.off('click.disc').on('click.disc', function (ev) {
      if (ev.target && ev.target.tagName === 'BUTTON') return;
      discSelectFile(i);
    });
  });
}
const _discRenderInputFiles = renderInputFiles;
renderInputFiles = function () {
  _discRenderInputFiles();
  const files = state.inputFiles || [];
  if (!files.length) {
    discCurrent = 0;
    discLastCount = 0;
    discReset();
    return;
  }
  if (files.length > discLastCount) discCurrent = files.length - 1;
  discLastCount = files.length;
  if (discCurrent >= files.length) discCurrent = files.length - 1;
  discAnnotateList();
  updateDiscPreview(files[discCurrent]);
};
discReset();
(function pasteIntoQueue() {
  if (!$('.drop-zone[data-for]').length) return;
  function dropZone() {
    var $main = $('.app-main:not(.hidden)');
    return ($main.length ? $main : $(document)).find('.drop-zone[data-for]').get(0) || null;
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
    var $box = $(zone).find('.dz-paste').first();
    if (!$box.length) {
      $box = $('<div class="dz-paste" role="status" aria-live="polite">' +
        '<span class="dz-paste-spin" aria-hidden="true"></span>' +
        '<span class="dz-paste-text"></span>').appendTo(zone);
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
    var dt = e.clipboardData;
    if (!dt) return;
    var zone = dropZone();
    if (editable(e.target) && (!zone || e.target.id !== $(zone).attr('data-for'))) return;
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
(function previewColumns() {
  function runBarGroup(mid) {
    return $(mid).children().filter(function () {
      return !this.getAttribute('data-eab-role') && !$(this).hasClass('card');
    });
  }
  function previewReady($mid) {
    return $mid.find('#disc-meta').not('.hidden').length > 0;
  }
  function chipSelected() {
    var $picker = $('#chip-one');
    return !$picker.length || String($picker.val() || '').length > 0;
  }
  function syncRunGate() {
    var $btn = $('#btn-run');
    if (!$btn.length) return;
    var n = (state.inputFiles || []).length;
    var missing = n === 0 ? '#input-card' : !chipSelected() ? '#chip-one' : '';
    $btn.attr('data-eab-missing', !batchRunning ? missing : '')
      .prop('disabled', batchRunning || !!missing);
  }
  function isSignal(el) {
    var id = el && el.id;
    return id === 'disc-preview' || id === 'disc-meta' || id === 'disc-empty';
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
var SAMPLE_TABS = {disassembler: {folders: {bt82x: 'BT82X', legacy: 'Legacy'}, default: 'legacy'}};
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
