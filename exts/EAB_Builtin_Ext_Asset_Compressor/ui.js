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
    rowMeta[path] = {
      state: 'converting', resultText: '', t0: t0, ms: 0,
      label: 'Converting' + (f >= 0 && cliArgs[f + 1] ? ' to ' + cliArgs[f + 1] : '')
    };
    paintRow(path, t0);
    startRowTicker();
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
            try {
              const r = JSON.parse(p.progress.result || '{}');
              if (typeof r.exit_code === 'number') code = r.exit_code;
              reason = r.error || '';
            } catch (e) { }
            rowMeta[path].state = st === 2 ? 'done' : st === 3 ? 'failed' : 'cancelled';
            rowMeta[path].ms = ms;
            rowMeta[path].resultText = st === 2 ? '✓ success in ' + fmtSecs(ms)
              : st === 3 ? ('✗ ' + (code !== null ? 'failed, error code: ' + code : 'failed: ' + (reason || 'unknown error')))
              : '⊘ cancelled';
            paintRow(path);
            let why = '';
            if (st !== 2) {
              try { why = ' — ' + (JSON.parse(p.progress.result || '{}').error || 'failed'); }
              catch (e) { why = ' — failed'; }
            }
            log((st === 2 ? '✓ ' : st === 3 ? '✗ ' : '⊘ ') + baseName(path) + ' in ' + fmtSecs(Date.now() - t0) + why);
          }
          if (st === 2) resolve(p.progress.result || '{}');
          else reject('Conversion failed');
        }).catch(function () {});
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
function onLibChange() {
  const lib = $('#compress-lib').val();
  $('#compress-level').prop('disabled', lib !== 'zlib');
  $('#lib-hint').text(
    lib === 'zlib'
      ? 'zlib: level selects the compression effort (0 = stored, 6 = default).'
      : 'zopfli: maximum-effort compressor; level is not used.');
}
function readOutMode() {
  const $el = $('input[name="out-mode"]:checked');
  return $el.length ? $el.val() : 'combine';
}
function buildCliArgsList() {
  const outputDir = $('#output-dir').val() || '.';
  const lib = $('#compress-lib').val();
  const name = $('#output-name').val();
  const common = ['-a', lib];
  if (lib === 'zlib') common.push('-l', $('#compress-level').val() || '6');
  if ($('#validate-flag').prop('checked')) common.push('-v');
  if ($('#decompress-flag').prop('checked')) common.push('-d');
  if ($('#pad-64').prop('checked')) common.push('-p');
  if (readOutMode() === 'separate' && state.inputFiles.length > 1) {
    return state.inputFiles.map(f => ({
      command: 'compress',
      cliArgs: ['-i', f, ...common, '-o', outputDir],
    }));
  }
  const cliArgs = ['-i', state.inputFiles.join(';')];
  if (name) cliArgs.push('-n', name);
  cliArgs.push(...common);
  cliArgs.push('-o', outputDir);
  return [{ command: 'compress', cliArgs }];
}
async function startRun() {
  if (state.inputFiles.length === 0) {
    showError('Please select at least one input asset file.');
    return;
  }
  $('#btn-run').prop('disabled', true);
  $('#result-panel').addClass('hidden');
  $('#error-panel').addClass('hidden');
  const commands = buildCliArgsList();
  const results = [];
  batchRunning = true;
  updateBatchState();
  setTotalProgress(0);
  try {
    for (let i = 0; i < commands.length; i++) {
      if (!(await eabBatchGate())) break;
      const { command, cliArgs } = commands[i];
      try {
        const resultJson = await invokeHost('execute_extension_command', {
          extensionId: 'asset_compressor',
          cliCommand: command,
          cliArgs: cliArgs,
        });
        results.push(JSON.parse(resultJson));
      } catch (err) {
        results.push({ success: false, error: String(err) });
      }
      setTotalProgress(((i + 1) / commands.length) * 100);
    }
    onRunComplete(results);
  } catch (err) {
    showError('Compression failed: ' + err);
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
    showError((failResults[0] && failResults[0].error) || 'Unknown compression error');
    return;
  }
  $('#result-panel').removeClass('hidden');
  const totalInputs = okResults.reduce((a, r) => a + (r.input_count || 0), 0);
  const totalSize = okResults.reduce((a, r) => a + (r.output_size || 0), 0);
  const stats = [['Outputs', String(okResults.length)]];
  if (failResults.length) stats.push(['Failed', String(failResults.length)]);
  if (okResults[0].lib !== undefined) stats.push(['Library', okResults[0].lib]);
  if (okResults[0].valid !== undefined) stats.push(['Valid', okResults[0].valid ? 'YES' : 'NO']);
  stats.push(['Inputs', String(totalInputs)]);
  stats.push(['Size', totalSize + ' B']);
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
}
function openFile(path) {
  invokeHost('open_in_explorer', { path });
}
(function pasteIntoQueue() {
  if (!$('.drop-zone[data-for]').length) return;
  function dropZone() {
    var $main = $('.app-main:not(.hidden)');
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
      try { s = decodeURIComponent(s); } catch (e) {}
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
(function previewColumns() {
  function runBarGroup(mid) {
    return $(mid).children().filter(function () {
      return !this.getAttribute('data-eab-role') && !$(this).hasClass('card');
    });
  }
  function previewReady($mid) {
    return $mid.children('#result-panel, #error-panel').not('.hidden').length > 0;
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
    return id === 'result-panel' || id === 'error-panel';
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
var SAMPLE_TABS = {compress: {folders: {bt82x: 'BT82X', legacy: 'Legacy'}, default: 'legacy'}};
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
