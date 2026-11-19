(function runBarAndPaste() {
  var $bar = $('#convert-bar');
  var $btn = $('#btn-convert');
  if ($bar.length && $btn.length) {
    var $scope = $btn.closest('.app-main');
    if (!$scope.length) $scope = $(document);
    var $action = $scope.find('.card.action-bar').eq(0);
    var $wrap = $btn.closest('.btn-progress-wrap');
    if (!$wrap.length) $wrap = $('<div class="btn-progress-wrap overflow-hidden position-relative">');
    var $fill = $action.find('.btn-progress-fill').eq(0);
    if (!$fill.length) $fill = $wrap.find('.btn-progress-fill').eq(0);
    $wrap.empty();
    if ($fill.length) $fill.appendTo($wrap);
    $btn.appendTo($wrap);
    $wrap.appendTo($bar);
    var $ctl = $action.find('.convert-controls').eq(0);
    if ($ctl.length) $ctl.appendTo($bar);
    $action.remove();
    $scope.find('.eab-card-actions').each(function () {
      var $el = $(this);
      if (!$el.find('button, input, select, textarea').length) $el.remove();
    });
  }
  if (!$('.drop-zone[data-for]').length) return;
  var ADDERS = ['eabAddFiles', 'addInputFiles', 'addFontFiles', 'addGifFiles', 'addFiles'];
  function activeMain() {
    var $pane = $('.tab-content.active').eq(0);
    var $main = $pane.length ? $pane.find('.app-main').eq(0) : $('.app-main').filter(':visible').eq(0);
    if (!$main.length) $main = $('.app-main').eq(0);
    return $main.length ? $main : $(document);
  }
  function dropZone() {
    return activeMain().find('.drop-zone[data-for]').eq(0);
  }
  function notifyDrop(paths, $zone) {
    if (typeof window.eabOnDrop !== 'function') return false;
    try {
      window.eabOnDrop(paths, $zone && $zone.length ? $zone.get(0) : null);
      return true;
    } catch (e) { return false; }
  }
  function queue(paths) {
    var $zone = dropZone();
    var $field = $zone.length ? $('#' + $zone.attr('data-for')) : $();
    if ($field.is('input, textarea')) {
      $field.val(paths[0]).trigger('input').trigger('change');
      notifyDrop(paths, $zone);
      return true;
    }
    if (notifyDrop(paths, $zone)) return true;
    for (var i = 0; i < ADDERS.length; i++) {
      var fn = window[ADDERS[i]];
      if (typeof fn !== 'function') continue;
      try { fn(paths); } catch (e) { continue; }
      return true;
    }
    if (!$field.length) return false;
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
    var $box = $zone.find('.dz-paste').eq(0);
    if (!$box.length) {
      $box = $('<div class="dz-paste" role="status" aria-live="polite">')
        .append('<span class="dz-paste-spin" aria-hidden="true"></span>')
        .append('<span class="dz-paste-text"></span>');
      $box.appendTo($zone);
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
    $zone.addClass('is-pasting');
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
    if (!run.zone || !run.zone.length) return;
    setTimeout(function () {
      if (pasteSeq !== run.token) return;
      run.zone.removeClass('is-pasting');
      pasteTextEl(run.zone).text('');
    }, 1600);
  }
  $(document).on('paste', function (e) {
    var native = e.originalEvent || e;
    var dt = native.clipboardData;
    if (!dt) return;
    var $zone = dropZone();
    var $target = $(native.target);
    if (editable(native.target) && (!$zone.length || $target.attr('id') !== $zone.attr('data-for'))) return;
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
(function wirePickerButtons() {
  var EXTS = ['png', 'jpg', 'jpeg', 'jpe', 'jfif', 'bmp', 'tif', 'tiff', 'webp', 'gif', 'tga', 'ico', 'pnm', 'dds', 'hdr'];
  var FILTERS = [{ name: 'Images', extensions: EXTS }];
  function report(text, isError) {
    console.log('[eab] ' + text);
    if (isError) {
      var $panel = $('#error-panel');
      if ($panel.length) { $panel.text(text); $panel.removeClass('hidden'); }
      console.error('[image_converter] ' + text);
    }
  }
  function activeTabZone() {
    var $pane = $('.tab-content.active').eq(0);
    var $main = $pane.length ? $pane.find('.app-main').eq(0) : $('.app-main').filter(':visible').eq(0);
    if (!$main.length) $main = $(document);
    return $main.find('.drop-zone[data-for]').eq(0);
  }
  function queueItems(items) {
    var names = ['eabAddFiles', 'addImages', 'addFiles', 'addInputFiles'];
    var $zone = activeTabZone();
    var $field = $zone.length ? $('#' + $zone.attr('data-for')) : $();
    var tag = $field.length ? $field.prop('tagName') : undefined;
    if (items.length && (tag === 'INPUT' || tag === 'TEXTAREA')) {
      $field.val((items[0] && items[0].path) || items[0]).trigger('input').trigger('change');
      return 'field';
    }
    if (typeof window.eabOnDrop === 'function') {
      try {
        window.eabOnDrop(items.map(function (it) { return (it && it.path) || it; }), $zone.get(0));
        return 'queued';
      } catch (e) {  }
    }
    for (var i = 0; i < names.length; i++) {
      var fn = window[names[i]];
      if (typeof fn !== 'function') continue;
      try { fn(items); return 'queued'; } catch (e) {  }
    }
    return 'none';
  }
  function queueReport(label, count, how) {
    if (how === 'queued') return label + ': ' + count + ' file(s) queued';
    if (how === 'field') return label + ': ' + count + ' file(s) put in the path field (the queue itself is not loaded)';
    return label + ': the host returned ' + count + ' file(s) but there is no queue to add them to';
  }
  function itemsOf(resp) {
    if (!resp || !resp.ok) return [];
    if (resp.files && resp.files.length) return resp.files;
    if (resp.paths && resp.paths.length) return resp.paths;
    if (resp.path) return [resp.path];
    return [];
  }
  function outputField() { return $('#output-dir'); }
  function takeItems(label, resp) {
    var items = itemsOf(resp);
    if (!items.length) {
      report(label + ': ' + ((resp && resp.error) || 'nothing selected'), !!(resp && resp.error));
      return;
    }
    var how = queueItems(items);
    report(queueReport(label, items.length, how), how === 'none');
  }
  function fieldPicker(call, extra) {
    return function (fieldId) {
      var payload = { multiple: true, readBase64: false };
      for (var k in extra) payload[k] = extra[k];
      report('Browse: asking the host for one path', false);
      return call(payload).then(function (resp) {
        var paths = (resp && resp.paths) || [];
        var path = paths[0] || (resp && (resp.path || resp.folder)) || '';
        if (!path) {
          report('Browse: ' + ((resp && resp.error) || 'nothing selected'), !!(resp && resp.error));
          return;
        }
        var $field = fieldId ? $('#' + fieldId) : $();
        if ($field.length) $field.val(path).trigger('input').trigger('change');
        report('Browse: ' + path, false);
      });
    };
  }
  var ACTIONS = {
    pickFiles: function () {
      report('Add files: the controller did not load, picking through the host directly', false);
      return API_EAB_pickFiles({ filters: FILTERS, title: 'Select images to convert', readBase64: false })
        .then(function (resp) { takeItems('Add files', resp); });
    },
    pickFolder: function () {
      report('Add folder: picking through the host directly', false);
      return API_EAB_pickFolder({ extensions: EXTS, title: 'Select a folder of images', readBase64: false })
        .then(function (resp) {
          var $dir = outputField();
          if (resp && resp.ok && resp.folder && $dir.length && !$dir.val()) $dir.val(resp.folder);
          takeItems('Add folder', resp);
        });
    },
    pickOutput: function () {
      report('Browse output: asking the host for a folder', false);
      return API_EAB_pickOutput({}).then(function (resp) {
        var $dir = outputField();
        if (resp && resp.ok && resp.folder && $dir.length) $dir.val(resp.folder);
        report('Browse output: ' + ((resp && resp.folder) || (resp && resp.error) || 'nothing selected'),
          !!(resp && resp.error));
      });
    },
    openOutputLocation: function () {
      var $dir = outputField();
      var path = ($dir.length && $dir.val()) ? String($dir.val()) : '.';
      report('Open Output: ' + path, false);
      return API_EAB_openOutputLocation({ path: path }).then(function (resp) {
        if (resp && resp.ok) return;
        report('Open Output failed: ' + ((resp && resp.error) || 'no answer from the host'), true);
      });
    },
    pickFileFor: fieldPicker(function (p) { return API_EAB_pickFiles(p); }, { filters: FILTERS }),
    pickFile: fieldPicker(function (p) { return API_EAB_pickFiles(p); }, { filters: FILTERS }),
    pickRawFileFor: fieldPicker(function (p) { return API_EAB_pickFiles(p); }, { filters: FILTERS }),
    pickRawFile: fieldPicker(function (p) { return API_EAB_pickFiles(p); }, { filters: FILTERS }),
    pickFolderFor: fieldPicker(function (p) { return API_EAB_pickFolder(p); }, { extensions: EXTS, title: 'Select a folder' }),
  };
  var CALL = /^\s*([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*;?\s*$/;
  var rescued = [];
  $('[onclick]').each(function () {
    var $el = $(this);
    var m = CALL.exec($el.attr('onclick') || '');
    if (!m) return;
    var name = m[1];
    var fn = ACTIONS[name];
    if (!fn) return;
    if (typeof window[name] === 'function') return;
    var quoted = m[2].trim().match(/^(['"])([\s\S]*)\1$/);
    var arg = quoted ? quoted[2] : m[2].trim();
    $el.removeAttr('onclick');
    $el.on('click', function () { fn(arg); });
    rescued.push(name + '(' + arg + ')');
  });
  if (rescued.length) {
    report('The controller did not finish loading; these buttons were re-wired to call the host directly: '
      + rescued.join(', '), false);
  }
})();
