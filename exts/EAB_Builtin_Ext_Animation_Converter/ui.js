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

updatePreview = function () {
  pvDrawFrame(state.currentFrame);
};
function selectFrame(index) {
  if (!pvFrames.length) return;
  const i = Math.max(0, Math.min(pvFrames.length - 1, Number(index) | 0));
  state.currentFrame = i;
  pvDrawFrame(i);
}
prevFrame = function () {
  if (state.currentFrame > 0) selectFrame(state.currentFrame - 1);
};
nextFrame = function () {
  if (state.currentFrame < pvFrames.length - 1) selectFrame(state.currentFrame + 1);
};
function pvPlaybackTick() {
  selectFrame((state.currentFrame + 1) % pvFrames.length);
}
playAnim = function () {
  if (state.playing) return pvStopPlayback();
  if (pvFrames.length < 2) return;
  state.playing = true;
  const $btn = $('#pv-play');
  if ($btn.length) $btn.text('⏸ Pause');
  state.playTimer = setInterval(pvPlaybackTick, previewIntervalMs());
};
loadGifPreview = async function (path) {
  if (!path) { pvReset(); queuePreviewSync(); return; }
  pvReset('');
  queuePreviewSync();
  const token = pvToken;
  if (!isEmbedded()) {
    pvSetText('pv-note', 'Frame preview needs the EAB host.');
    return;
  }
  try {
    const resp = await eabSampleData(path);
    if (!resp || !resp.ok || !resp.data) throw new Error(resp && resp.error ? resp.error : 'read failed');
    const bytes = new Uint8Array(await (await fetch(resp.data)).arrayBuffer());
    if (token !== pvToken) return;
    pvSetText('pv-filesize', pvFormatBytes(bytes.byteLength));
    const frames = await decodeGifFrames(bytes, () => token !== pvToken);
    if (token !== pvToken) {
      for (const f of frames) { try { f.image.close(); } catch (e) {  } }
      return;
    }
    if (!frames || !frames.length) {
      pvSetText('pv-note', 'This host build cannot decode GIF frames; only the file size is shown.');
      return;
    }
    pvFrames = frames;
    state.gifFrames = frames;
    state.currentFrame = 0;
    const first = frames[0].image;
    pvSetText('pv-size', first.displayWidth + ' × ' + first.displayHeight);
    pvSetText('pv-frames', String(frames.length));
    $('#opt-frames').val(String(frames.length));
    const avg = pvAverageDelay();
    pvSetText('pv-delay', avg + ' ms  (~' + (1000 / avg).toFixed(1) + ' fps)');
    const total = frames.reduce((sum, f) => sum + (f.duration || 0), 0);
    pvSetText('pv-duration', (total / 1000).toFixed(2) + ' s');
    const $infoCount = $('#frame-count');
    if ($infoCount.length) $infoCount.text(frames.length + ' frame' + (frames.length > 1 ? 's' : ''));
    const $infoSize = $('#frame-size');
    if ($infoSize.length) $infoSize.text(first.displayWidth + '×' + first.displayHeight);
    const $info = $('#gif-info');
    if ($info.length) $info.removeClass('hidden');
    const $strip = $('#pv-strip');
    if ($strip.length) {
      $strip.html(frames.map((f, i) =>
        '<button type="button" class="pv-thumb" onclick="selectFrame(' + i + ')" title="Frame ' + (i + 1) + '">' +
        '<img alt="" src="' + pvThumb(f.image) + '"></button>'
      ).join(''));
    }
    const $scrub = $('#pv-scrub');
    if ($scrub.length) {
      $scrub.attr('max', String(frames.length - 1));
      $scrub.val('0');
      $scrub.prop('disabled', frames.length < 2);
    }
    const $note = $('#pv-note');
    if ($note.length) $note.addClass('hidden');
    queuePreviewSync();
    pvDrawFrame(0);
    updateBatchState();
  } catch (err) {
    if (token !== pvToken) return;
    pvSetText('pv-note', 'Could not read the GIF: ' + err);
  }
};
pvReset();
updateBatchState();
function showError(msg) {
  const $panel = $('#error-panel');
  $panel.text(msg);
  $panel.removeClass('hidden');
}
function invokeHost(cmd, args) {
  switch (cmd) {
    case 'execute_extension_command':
      return API_EAB_runCli({ command: args.cliCommand, args: args.cliArgs }).then(resp => {
        if (resp.ok && resp.detail) return resp.detail;
        return Promise.reject(resp.error || (resp.result || 'Command failed'));
      });
    case 'open_in_explorer':
      return API_EAB_openOutputLocation({ path: args.path }).then(resp => {
        if (resp.ok) return;
        return Promise.reject(resp.error || 'Failed to open location');
      });
    case 'cancel_job':
      return API_EAB_cancelJob({ jobId: args.jobId }).then(resp => {
        if (resp.ok) return;
        return Promise.reject(resp.error || 'Failed to cancel job');
      });
    case 'startJob':
      return API_EAB_startJob({ command: args.command, args: args.args });
    case 'pollJob':
      return API_EAB_pollJob({ jobId: args.jobId });
    default:
      return Promise.reject('Unknown host command: ' + cmd);
  }
}
function chipLabel(kind) {
  return $('[data-chip-label="' + kind + '"]');
}
function chipPicked() {
  const order = ['gen', 'part'];
  for (const kind of order) {
    const $sel = $('#' + CHIP_BOX[kind]);
    const value = $sel.length ? String($sel.val() || '') : '';
    if (value) return { kind: kind, value: value };
  }
  return null;
}
function syncChipPicker() {
  const $picker = $('#chip-one');
  if (!$picker.length || $picker.find('option[value=""]').length === 0) return;
  const picked = chipPicked();
  $picker.val(picked ? picked.kind + ':' + picked.value : '');
}
function buildChipPicker() {
  const $picker = $('#chip-one');
  if (!$picker.length || $picker.find('optgroup').length) return;
  for (const kind in CHIP_BOX) {
    const $box = $('#' + CHIP_BOX[kind]);
    if (!$box.length) continue;
    const $label = chipLabel(kind);
    const $group = $('<optgroup>').attr('label', $label.length ? $.trim($label.text()) : kind);
    $box.find('option').each(function () {
      const value = String($(this).val() || '');
      if (value) $group.append($('<option>').attr('value', kind + ':' + value).text($(this).text()));
    });
    $picker.append($group);
  }
  $picker.on('change', function () {
    const pick = String($(this).val() || '').split(':');
    const $box = $('#' + CHIP_BOX[pick[0]]);
    if (!$box.length || !pick[1]) return;
    $box.val(pick[1]).trigger('change');
  });
  syncChipPicker();
}
const chipPickBase = window.onChipPick;
window.onChipPick = function (which) {
  chipPickBase(which);
  syncChipPicker();
};
$(function () {
  buildChipPicker();
  onChipChange(chipGroup());
});
function clearAllInputs() {
  gifFiles.forEach(p => { delete rowMeta[p]; });
  gifFiles.length = 0;
  setCurrentGif(0);
  updateBatchState();
}
(function runBarAndPaste() {
  var $bar = $('#run-bar');
  var $btn = $('#btn-convert');
  if ($bar.length && $btn.length) {
    var $scope = $btn.closest('.app-main');
    var $root = $scope.length ? $scope : $(document);
    var $action = $root.find('.card.action-bar');
    var $wrap = $btn.closest('.btn-progress-wrap');
    if (!$wrap.length) $wrap = $('<div class="btn-progress-wrap overflow-hidden position-relative"></div>');
    var $fill = $action.find('.btn-progress-fill');
    if (!$fill.length) $fill = $wrap.find('.btn-progress-fill');
    $wrap.empty();
    if ($fill.length) $wrap.append($fill);
    $wrap.append($btn);
    if (!$wrap.parent().is($bar.first())) $bar.first().append($wrap);
    var $ctl = $action.find('.convert-controls');
    if ($ctl.length) $bar.first().append($ctl);
    if ($action.length) $action.remove();
    $root.find('.eab-card-actions').each(function () {
      var $el = $(this);
      if (!$el.find('button, input, select, textarea').length) $el.remove();
    });
  }
  if (!$('.drop-zone[data-for]').length) return;
  var ADDERS = ['eabAddFiles', 'addInputFiles', 'addFontFiles', 'addGifFiles', 'addFiles'];
  function dropZone() {
    var $main = $('.app-main:not(.hidden)');
    return ($main.length ? $main.first() : $(document)).find('.drop-zone[data-for]').first();
  }
  function queue(paths) {
    if (typeof window.eabOnDrop === 'function') {
      try { window.eabOnDrop(paths, dropZone().get(0) || null); return true; } catch (e) {  }
    }
    for (var i = 0; i < ADDERS.length; i++) {
      var fn = window[ADDERS[i]];
      if (typeof fn !== 'function') continue;
      try { fn(paths); } catch (e) { continue; }
      return true;
    }
    var $zone = dropZone();
    var $field = $zone.length ? $('#' + $zone.attr('data-for')) : $();
    if (!$field.length || !$field.is('input, textarea')) return false;
    $field.val(paths[0]).trigger('input').trigger('change');
    return true;
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
  function editable($el) {
    if (!$el || !$el.length) return false;
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
      $box = $('<div class="dz-paste" role="status" aria-live="polite"></div>');
      $box.html('<span class="dz-paste-spin" aria-hidden="true"></span>' +
        '<span class="dz-paste-text"></span>');
      $zone.append($box);
    }
    return $box.find('.dz-paste-text').first();
  }
  function pastePaint() {
    if (!pasteRun) return;
    var $text = pasteTextEl(pasteRun.$zone);
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
    var run = { $zone: $zone, done: [], total: total || 0, dots: 1, token: ++pasteSeq, ticker: null };
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
    var $text = pasteTextEl(run.$zone);
    if ($text.length) {
      $text.text(count
        ? 'Pasted ' + count + ' file' + (count === 1 ? '' : 's') + ' from clipboard'
        : 'Nothing usable on the clipboard');
    }
    if (!run.$zone || !run.$zone.length) return;
    setTimeout(function () {
      if (pasteSeq !== run.token) return;
      run.$zone.removeClass('is-pasting');
      var $t = pasteTextEl(run.$zone);
      if ($t.length) $t.text('');
    }, 1600);
  }
  $(document).on('paste', function (e) {
    var dt = e.originalEvent && e.originalEvent.clipboardData;
    if (!dt) return;
    var $zone = dropZone();
    if (editable($(e.target)) && (!$zone.length || e.target.id !== $zone.attr('data-for'))) return;
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
function runBarGroup(mid) {
  if (!mid) return $();
  return $(mid).children('.eab-run-bar, .control-row').filter(function () {
    return !this.getAttribute('data-eab-role') && !$(this).hasClass('card');
  });
}
function rowPreviewReady($row) {
  var $note = $row.find('#pv-note');
  return $note.length > 0 && $note.hasClass('hidden');
}
function startDisabled() {
  if (gifBatchRunning) return true;
  if (!gifFiles.length) return true;
  return !chipGeneration();
}
function syncStartDisabled() {
  var $btn = $('#btn-convert');
  if (!$btn.length) return;
  var off = startDisabled();
  var missing = !gifFiles.length ? '#input-card' : !chipGeneration() ? '#chip-one' : '';
  if (off && !gifBatchRunning) $btn.attr('data-eab-missing', missing);
  else $btn.removeAttr('data-eab-missing');
  if ($btn.prop('disabled') !== off) $btn.prop('disabled', off);
}
function syncPreviewColumns() {
  $('.mid-col').each(function () {
    var $mid = $(this);
    var $row = $mid.parent('.app-row');
    var $right = $row.children('.right-col');
    if (!$right.length) return;
    var noPreview = !$row.hasClass('is-queue-empty') && !rowPreviewReady($row);
    $row.toggleClass('no-preview', noPreview);
    var group = runBarGroup(this).add(runBarGroup($right.get(0)));
    if (!group.length) return;
    if (group.parent().get(0) !== $right.get(0) || group.index() !== 0) $right.prepend(group);
  });
  syncStartDisabled();
}
var previewSyncQueued = false;
function queuePreviewSync() {
  if (previewSyncQueued) return;
  previewSyncQueued = true;
  setTimeout(function () { previewSyncQueued = false; syncPreviewColumns(); }, 0);
}
var PREVIEW_SYNC_IDS = { 'pv-note': 1, 'input-list': 1, 'btn-convert': 1 };
var PREVIEW_SYNC_CLASSES = ['app-row', 'app-main', 'convert-controls', 'eab-run-bar'];
function previewSyncTarget(node) {
  if (!node || node.nodeType !== 1) return false;
  if (PREVIEW_SYNC_IDS[node.id]) return true;
  var cls = node.classList;
  if (!cls) return false;
  for (var i = 0; i < PREVIEW_SYNC_CLASSES.length; i++) {
    if (cls.contains(PREVIEW_SYNC_CLASSES[i])) return true;
  }
  return false;
}
$(document).ready(function () {
  syncPreviewColumns();
  setTimeout(syncPreviewColumns, 0);
  $('#chip-gen, #chip-name, #chip-one').on('change', queuePreviewSync);
  if (typeof MutationObserver !== 'function') return;
  new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      if (!previewSyncTarget(records[i].target)) continue;
      queuePreviewSync();
      return;
    }
  }).observe(document.body, { attributes: true, attributeFilter: ['class', 'disabled'], subtree: true });
});
var SAMPLE_TABS = {animation: {folders: {bt82x: 'BT82X', legacy: 'Legacy'}, default: 'legacy'}};


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
  var folder = conf.folders[chipGroup()] || SAMPLE_FOLDERS['legacy'];
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
