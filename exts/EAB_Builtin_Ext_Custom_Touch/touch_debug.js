/* Custom Touch — tab shell, Sample Code, Read Me and the Debug page.
 *
 * The Compile tab keeps the original three-column workbench; this file only
 * adds the three tabs the reference tool has and the live touch monitor that
 * talks to the board through touch_cvt.dll (which loads eve_hal.dll).
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------

  var currentTab = 'compile';

  window.switchTab = function (which) {
    currentTab = which;
    $('.tab-content').removeClass('active');
    $('#tab-' + which).addClass('active');
    $('.tab-btn').removeClass('active');
    $('.tab-btn[data-tab="' + which + '"]').addClass('active');

    if (which === 'samplecode') ensureTouchSamples();
    if (which === 'readme') ensureTouchReadme();
    if (which === 'debug') dbgOnShow();

    if (window.__EAB_WORKBENCH && typeof window.__EAB_WORKBENCH.relayout === 'function') {
      window.__EAB_WORKBENCH.relayout();
    }
  };

  // ---------------------------------------------------------------------
  // Sample Code
  // ---------------------------------------------------------------------

  var TOUCH_SAMPLES = null;
  var samplesPromise = null;
  var sampleKey = '';

  function readExtFile(rel) {
    if (typeof API_EAB_readExtFile !== 'function') return Promise.resolve(null);
    return API_EAB_readExtFile({ path: rel });
  }

  function ensureTouchSamples() {
    if (TOUCH_SAMPLES) return Promise.resolve(true);
    if (samplesPromise) return samplesPromise;
    samplesPromise = readExtFile('touch_samples.json').then(function (resp) {
      if (!resp || !resp.ok || !resp.data) throw new Error('could not read touch_samples.json');
      return fetch(resp.data).then(function (r) { return r.json(); });
    }).then(function (data) {
      TOUCH_SAMPLES = data;
      renderSampleTabs();
      showSample(sampleKey);
      return true;
    }).catch(function (err) {
      samplesPromise = null;
      $('#touch-sample-hint').text('Sample code could not be loaded: ' + err);
      return false;
    });
    return samplesPromise;
  }

  function renderSampleTabs() {
    var $tabs = $('#touch-sample-tabs');
    if (!$tabs.length || !TOUCH_SAMPLES) return;
    var html = Object.keys(TOUCH_SAMPLES).map(function (key) {
      var label = TOUCH_SAMPLES[key].label || key;
      var short = label.split(' ')[0];
      return '<button class="tab-sub-btn" type="button" role="tab" aria-selected="false"' +
        ' data-sample-key="' + key + '" onclick="showTouchSample(\'' + key + '\')">' + short + '</button>';
    }).join('');
    $tabs.html(html);
  }

  window.showTouchSample = function (key) {
    sampleKey = key;
    showSample(key);
  };

  function showSample(key) {
    if (!TOUCH_SAMPLES) return;
    if (!key || !TOUCH_SAMPLES[key]) key = Object.keys(TOUCH_SAMPLES)[0];
    sampleKey = key;
    var entry = TOUCH_SAMPLES[key];
    $('#touch-sample-tabs .tab-sub-btn').each(function () {
      var on = $(this).attr('data-sample-key') === key;
      $(this).toggleClass('active', on).attr('aria-selected', on ? 'true' : 'false');
    });
    $('#touch-sample-hint').text(entry.label || '');
    $('#touch-sample-code').text(entry.code || '');
  }

  window.copyTouchSample = function () {
    var text = $('#touch-sample-code').text();
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        $('#touch-sample-hint').text('Copied to the clipboard.');
      }, function () { });
      return;
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { }
    ta.remove();
  };

  window.openTouchSampleFolder = function () {
    if (!TOUCH_SAMPLES || !TOUCH_SAMPLES[sampleKey]) return;
    if (typeof openPrebuiltFolder === 'function') openPrebuiltFolder(TOUCH_SAMPLES[sampleKey].folder);
  };

  // ---------------------------------------------------------------------
  // Read Me
  // ---------------------------------------------------------------------

  var readmeLoaded = false;

  function ensureTouchReadme() {
    if (readmeLoaded) return;
    readmeLoaded = true;
    readExtFile('readme.html').then(function (resp) {
      if (!resp || !resp.ok || !resp.data) throw new Error('could not read readme.html');
      return fetch(resp.data).then(function (r) { return r.text(); });
    }).then(function (html) {
      var $body = $('#touch-readme');
      // The reference document is a full Qt rich-text export; only its body is
      // wanted, otherwise the <style> block renders as literal text.
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var inner = doc.body ? doc.body.innerHTML : html;
      $body.html(inner);
      // The reference document links to two pseudo-URLs; wire them to the
      // actions the reference performs.
      $body.find('a[href="jtcdebug_folder"]').on('click', function (e) {
        e.preventDefault();
        openTouchDebugFolder();
      });
      $body.find('a[href="printf_example"]').on('click', function (e) {
        e.preventDefault();
        switchTab('samplecode');
        ensureTouchSamples().then(function () { showSample('focaltech'); });
      });
    }).catch(function (err) {
      readmeLoaded = false;
      $('#touch-readme').text('Unable to load the Custom Touch Read Me: ' + err);
    });
  }

  window.openTouchDebugFolder = function () {
    if (typeof API_EAB_getAssetDir !== 'function') return;
    API_EAB_getAssetDir().then(function (resp) {
      if (!resp || !resp.ok || !resp.folder) throw new Error('asset folder not found');
      var sep = String(resp.folder).indexOf('/') >= 0 ? '/' : '\\';
      var path = String(resp.folder).replace(/[\\/]+$/, '') + sep +
        'Legacy' + sep + 'Custom Touch Test' + sep + 'debug';
      return API_EAB_openOutputLocation({ path: path });
    }).catch(function (err) {
      dbgLog('Could not open the debug folder: ' + err);
    });
  };

  // ---------------------------------------------------------------------
  // Debug — connection
  // ---------------------------------------------------------------------

  var dbg = {
    connected: false,
    status: null,
    monitoring: false,
    timer: null,
    sampleRate: 60,
    transform: { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0 },
    screen: null,
    busy: false,
    calibTimer: null,
  };

  /* The Debug tab has no Log card any more, so the trace goes to the devtools
     console only. */
  function dbgLog(msg) {
    console.log('[custom-touch] ' + msg);
  }
  window.dbgLog = dbgLog;

  /* Runs one touch-* command through the extension's own DLL. */
  function touchCmd(command, args) {
    if (typeof API_EAB_startJob !== 'function') {
      return Promise.reject(new Error('the host bridge is unavailable'));
    }
    return API_EAB_startJob({ command: command, args: args || [] }).then(function (resp) {
      if (!resp || !resp.ok || !resp.jobId) {
        throw new Error((resp && resp.error) || 'could not start the job');
      }
      return new Promise(function (resolve, reject) {
        var poll = setInterval(function () {
          API_EAB_pollJob({ jobId: resp.jobId }).then(function (p) {
            if (!p || !p.ok || !p.progress) return;
            var st = p.progress.status;
            if (st === 0 || st === 1) return;
            clearInterval(poll);
            var out = String(p.progress.result || '');
            var parsed = null;
            try { parsed = JSON.parse(out.trim()); } catch (e) { parsed = null; }
            if (!parsed) {
              reject(new Error(out.trim() || 'no answer from the touch layer'));
              return;
            }
            if (parsed.success === false) {
              reject(new Error(parsed.error || 'command failed'));
              return;
            }
            resolve(parsed.data);
          }).catch(function (err) {
            clearInterval(poll);
            reject(err);
          });
        }, 120);
      });
    });
  }

  /* The touch toolchain drives one adapter at a time, so the Connection card
     lists the programmers it can drive and keeps exactly one of them selected.
     The selected row names the target every Debug action runs against. The Pico
     is a USB CDC bridge running `eve_touch_bridge.uf2`: it owns the SPI bus, so
     it drives the same live monitor and settings pages as the FTDI adapters. */
  var DBG_DEVICES = [
    { id: 'FT4222', name: 'FT4222', note: 'USB-SPI bridge · ftd2xx' },
    { id: 'MPSSE', name: 'MPSSE', note: 'LibMPSSE adapter' },
    { id: 'Pico', name: 'Raspberry Pi Pico', note: 'USB CDC bridge · GP2 SCK, GP3 MOSI, GP4 MISO, GP5 CS#', cdc: true },
  ];
  var dbgDevStatus = {};   // id -> '' | 'checking' | 'connected' | 'offline'
  var dbgDevInfo = {};     // id -> { part, chip_id, width, height, spi_clock_mhz }
  var dbgSelected = '';    // the one device the Debug actions use

  function dbgDevice(id) {
    for (var i = 0; i < DBG_DEVICES.length; i++) {
      if (DBG_DEVICES[i].id === id) return DBG_DEVICES[i];
    }
    return null;
  }
  /* The Pico is not an FTDI adapter, so the HAL probe can never see it: it is
     reached through its own serial commands instead. */
  function dbgIsCdc(id) {
    var dev = dbgDevice(id);
    return !!(dev && dev.cdc);
  }
  function dbgDeviceName(id) {
    var info = dbgDevInfo[id];
    if (info && info.part) return info.part;
    var dev = dbgDevice(id);
    return dev ? dev.name : id;
  }
  function dbgIsDetected(id) {
    var state = dbgDevStatus[id] || '';
    return state === 'connected' || state === 'checking' || !!dbgDevInfo[id];
  }
  function dbgStatusText(state, selected) {
    if (state === 'checking') return 'Checking…';
    if (selected) return 'Selected';
    if (state === 'connected') return 'Connected';
    return 'Not connected';
  }
  function dbgDeviceRowHtml(id) {
    var dev = dbgDevice(id);
    if (!dev) return '';
    var state = dbgDevStatus[id] || '';
    var selected = dbgSelected === id;
    var connected = state === 'connected';
    var info = dbgDevInfo[id];
    var cls = ['dev-row', connected ? 'is-on' : '', selected ? 'is-selected' : ''].filter(Boolean).join(' ');
    var sub = connected && info && info.part
      ? info.part + (info.spi_clock_mhz ? ' · ' + info.spi_clock_mhz + ' MHz' : '')
      : dbgStatusText(state, selected);
    return '<div class="' + cls + '" data-device="' + id + '">' +
      '<div class="dev-main" title="' + dev.note + '">' +
        '<div class="dev-name">' + dbgDeviceName(id) + '</div>' +
        '<div class="dev-status' + (state === 'checking' ? ' is-busy' : '') + '">' +
          '<span class="dev-dot" aria-hidden="true"></span>' + sub +
          '<span class="dev-host">' + dev.name + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="dev-actions">' +
        '<button class="btn btn-secondary dev-connect" type="button" data-dev-act="connect"' +
          (connected || state === 'checking' ? ' disabled' : '') + ' title="' +
          (connected ? 'Already connected — press Reset to probe it again'
            : dev.cdc ? 'Open the Pico bridge port and boot the board'
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
          ' title="' + (connected ? 'Use this device for the monitor and the settings pages' : 'Connect the device first') +
          '">' + (selected ? 'Selected' : 'Select') + '</button>' +
      '</div>' +
    '</div>';
  }
  /* Repaints both lists. A row that is no longer detected keeps its element for
     one animation so an unplug reads as "this one went away". */
  function dbgSyncDevices() {
    var $detected = $('#dbg-dev-list');
    var $supported = $('#dbg-dev-supported');
    if (!$detected.length || !$supported.length) return;
    var found = DBG_DEVICES.map(function (d) { return d.id; }).filter(dbgIsDetected);
    var leaving = [];
    $detected.children('.dev-row').each(function () {
      var id = String($(this).attr('data-device') || '');
      if (id && found.indexOf(id) < 0 && !$(this).hasClass('is-leaving')) {
        leaving.push({ id: id, el: this });
      }
    });
    $detected.html(found.map(dbgDeviceRowHtml).join(''));
    leaving.forEach(function (row) {
      var $row = $(row.el).addClass('is-leaving');
      $detected.append($row);
      setTimeout(function () {
        $row.remove();
        dbgSyncDevEmpty();
      }, 600);
    });
    $supported.html(DBG_DEVICES.map(function (d) { return dbgDeviceRowHtml(d.id); }).join(''));
    dbgSyncDevEmpty();
    $('#dbg-dev-count').text(found.length ? '(' + found.length + ')' : '');
    dbgSaveCache();
  }
  function dbgSyncDevEmpty() {
    var $detected = $('#dbg-dev-list');
    if (!$detected.length) return;
    $('#dbg-dev-empty').toggleClass('hidden', $detected.children('.dev-row').length > 0);
  }
  window.dbgSyncDevices = dbgSyncDevices;

  /* The page is torn down when the host hides the extension, so the scan result
     is kept in sessionStorage: coming back shows the same list instead of
     probing the adapter again. */
  var DBG_CACHE_KEY = 'eab.custom_touch.devices';
  function dbgSaveCache() {
    try {
      sessionStorage.setItem(DBG_CACHE_KEY, JSON.stringify({
        status: dbgDevStatus,
        info: dbgDevInfo,
        selected: dbgSelected,
      }));
    } catch (e) { }
  }
  function dbgLoadCache() {
    var raw = null;
    try { raw = JSON.parse(sessionStorage.getItem(DBG_CACHE_KEY) || 'null'); } catch (e) { raw = null; }
    if (!raw || !raw.info) return false;
    Object.keys(raw.status || {}).forEach(function (k) {
      // a page torn down mid-scan must not come back stuck on "Checking…"
      var state = raw.status[k];
      dbgDevStatus[k] = state === 'checking' ? '' : state;
    });
    Object.keys(raw.info || {}).forEach(function (k) { dbgDevInfo[k] = raw.info[k]; });
    if (raw.selected && dbgDevStatus[raw.selected] === 'connected') dbgSelected = raw.selected;
    return Object.keys(dbgDevInfo).length > 0;
  }

  /* Hotplug notification: a short toast in the corner, so a plug or unplug is
     announced even while the Log card is collapsed. */
  var DBG_TOAST_MS = 6000;
  var DBG_TOAST_ICON = { on: '🔌', off: '⏏', info: 'ℹ' };
  function dbgPaintToast($toast, kind, title, text) {
    $toast.removeClass('is-on is-off is-info').addClass('is-' + kind)
      .find('.dev-toast-icon').text(DBG_TOAST_ICON[kind] || DBG_TOAST_ICON.info).end()
      .find('.dev-toast-title').text(title).end()
      .find('.dev-toast-text').text(text || '');
    return $toast;
  }
  function dbgToast(kind, title, text) {
    var $wrap = $('#dev-toast-wrap');
    if (!$wrap.length) return $();
    var $toast = dbgPaintToast($('<div>').addClass('dev-toast')
      .append($('<span>').addClass('dev-toast-icon'))
      .append($('<div>').addClass('dev-toast-body')
        .append($('<div>').addClass('dev-toast-title'))
        .append($('<div>').addClass('dev-toast-text'))), kind, title, text);
    $wrap.append($toast);
    var $all = $wrap.children('.dev-toast');
    if ($all.length > 3) $all.slice(0, $all.length - 3).remove();
    clearTimeout($toast.get(0).devToastTimer);
    var leave = function () {
      $toast.addClass('is-out');
      setTimeout(function () { $toast.remove(); }, 320);
    };
    $toast.get(0).devToastTimer = setTimeout(leave, DBG_TOAST_MS);
    $toast.on('click', leave);
    return $toast;
  }
  function dbgUpdateToast($toast, kind, title, text) {
    if (!$toast || !$toast.length || !$toast.parent().length) return dbgToast(kind, title, text);
    dbgPaintToast($toast.removeClass('is-out'), kind, title, text);
    clearTimeout($toast.get(0).devToastTimer);
    $toast.get(0).devToastTimer = setTimeout(function () {
      $toast.addClass('is-out');
      setTimeout(function () { $toast.remove(); }, 320);
    }, DBG_TOAST_MS);
    return $toast;
  }

  function dbgConnectArgs(host) {
    return [
      '--host', String(host || 'FT4222'),
      '--spi-clock', String($('#dbg-spi-clock').val() || 12),
      '--eve-clock', String($('#dbg-eve-clock').val() || 72),
      '--width', String(dbg.screen ? dbg.screen.width : 800),
      '--height', String(dbg.screen ? dbg.screen.height : 480),
      '--refresh', '60',
    ];
  }
  /* The Pico bridge is a USB CDC port, so it is found by asking the DLL which
     Raspberry Pi serial ports exist and then pinging the first one. A Pico still
     in BOOTSEL mode has no serial port and is reported as not connected.
     `boot` also opens the board over SPI, which is what Connect does. */
  function dbgProbePico(quiet, boot) {
    dbgDevStatus.Pico = 'checking';
    dbgSyncDevices();
    return touchCmd('touch-pico-ports').then(function (ports) {
      var list = ports || [];
      if (!list.length) {
        dbgDevStatus.Pico = '';
        delete dbgDevInfo.Pico;
        dbgSyncDevices();
        if (!quiet) $('#dbg-conn-detail').text('No Pico bridge found — flash eve_touch_bridge.uf2, then plug the Pico in.');
        return { ok: false, host: 'Pico' };
      }
      var port = list[0];
      return touchCmd('touch-pico-ping', ['--port', port.port]).then(function (info) {
        // The bridge answers, but the board is not booted yet: the row stays
        // "not connected" so Connect is still available.
        dbgDevInfo.Pico = { part: port.port, board: port.product || 'Raspberry Pi Pico', fw: (info && info.fw) || '' };
        if (!boot) {
          dbgDevStatus.Pico = '';
          dbgSyncDevices();
          if (!quiet) $('#dbg-conn-detail').text('Pico · ' + port.port + (info && info.fw ? ' · bridge ' + info.fw : '') + ' — press Connect to boot the board.');
          return { ok: true, host: 'Pico', part: port.port };
        }
        var args = ['--port', port.port].concat(dbgConnectArgs('Pico'));
        return touchCmd('touch-connect', args).then(function (status) {
          DBG_DEVICES.forEach(function (d) {
            if (d.id !== 'Pico') { dbgDevStatus[d.id] = ''; delete dbgDevInfo[d.id]; }
          });
          dbgDevStatus.Pico = 'connected';
          dbgDevInfo.Pico = {
            part: status.part || port.port,
            chip_id: status.chip_id || 0,
            width: status.width || 0,
            height: status.height || 0,
            spi_clock_mhz: status.spi_clock_mhz || 0,
          };
          dbgSelected = 'Pico';
          dbg.connected = true;
          dbg.status = status;
          dbgSyncDevices();
          paintStatus();
          if (!quiet) {
            dbgLog('Connected to ' + status.part + ' via Pico');
            $('#dbg-conn-detail').text(status.part + ' · Pico · ' + status.spi_clock_mhz + ' MHz SPI');
          }
          return { ok: true, host: 'Pico', part: status.part };
        });
      });
    }).catch(function (err) {
      // The port may still be there — only the board failed to answer — so the
      // row keeps its info and Connect stays available for a retry.
      dbgDevStatus.Pico = 'offline';
      if (dbgSelected === 'Pico') dbgSelected = '';
      dbg.connected = false;
      dbg.status = null;
      dbgSyncDevices();
      paintStatus();
      if (!quiet) {
        $('#dbg-conn-detail').text(String(err.message || err));
        dbgLog('Connect failed on Pico: ' + (err.message || err));
      }
      return { ok: false, host: 'Pico', error: String(err.message || err) };
    });
  }
  /* Copies the bundled bridge UF2 onto a Pico in BOOTSEL mode. The Pico reboots
     into the bridge as soon as the copy finishes, so the row is re-probed after
     a short wait for the serial port to enumerate. */
  window.dbgFlashPico = function () {
    var $btn = $('#dbg-btn-flash-pico');
    $btn.prop('disabled', true);
    $('#dbg-conn-detail').text('Looking for a Pico in BOOTSEL mode (RPI-RP2 drive)…');
    touchCmd('touch-pico-flash').then(function (res) {
      dbgLog('Pico bridge written to ' + (res && res.written));
      $('#dbg-conn-detail').text('Bridge written — waiting for the Pico to reboot…');
      setTimeout(function () {
        dbgProbePico(false, false).then(function () { $btn.prop('disabled', false); });
      }, 3000);
    }).catch(function (err) {
      $('#dbg-conn-detail').text(String(err.message || err));
      dbgLog('Flash failed: ' + (err.message || err));
      $btn.prop('disabled', false);
    });
  };

  /* Opens the board on one adapter and records what answered. Only one device is
     ever connected, so a success clears every other row. */
  function dbgProbe(id, quiet) {
    if (dbgIsCdc(id)) return dbgProbePico(quiet, true);
    dbgDevStatus[id] = 'checking';
    dbgSyncDevices();
    return touchCmd('touch-connect', dbgConnectArgs(id)).then(function (status) {
      DBG_DEVICES.forEach(function (d) {
        if (d.id !== id) { dbgDevStatus[d.id] = ''; delete dbgDevInfo[d.id]; }
      });
      dbgDevStatus[id] = 'connected';
      dbgDevInfo[id] = {
        part: status.part || '',
        chip_id: status.chip_id || 0,
        width: status.width || 0,
        height: status.height || 0,
        spi_clock_mhz: status.spi_clock_mhz || 0,
      };
      dbgSelected = id;
      dbg.connected = true;
      dbg.status = status;
      dbgSyncDevices();
      paintStatus();
      if (!quiet) {
        dbgLog('Connected to ' + status.part + ' via ' + status.host);
        $('#dbg-conn-detail').text(status.part + ' · ' + status.host + ' · ' + status.spi_clock_mhz + ' MHz SPI');
      }
      return { ok: true, host: id, part: status.part };
    }).catch(function (err) {
      dbgDevStatus[id] = 'offline';
      delete dbgDevInfo[id];
      if (dbgSelected === id) dbgSelected = '';
      // touch-connect closes any previous session before it opens the adapter,
      // so a failure means nothing is connected any more
      dbg.connected = false;
      dbg.status = null;
      dbgSyncDevices();
      paintStatus();
      if (!quiet) {
        $('#dbg-conn-detail').text(String(err.message || err));
        dbgLog('Connect failed on ' + id + ': ' + (err.message || err));
      }
      return { ok: false, host: id, error: String(err.message || err) };
    });
  }

  /* Scan asks the HAL which adapters are on the bus, then probes each one until a
     board answers. The first board found is connected and selected. The Pico is
     checked separately: it is a USB drive, so it never answers an SPI probe. */
  var dbgScanSeq = 0;
  window.dbgScan = function () {
    var run = ++dbgScanSeq;
    var stale = function () { return run !== dbgScanSeq; };
    $('#dbg-conn-detail').text('Scanning ' + DBG_DEVICES.map(function (d) { return d.id; }).join(' · ') + ' for an EVE device…');
    DBG_DEVICES.forEach(function (d) { dbgDevStatus[d.id] = 'checking'; });
    dbgSyncDevices();
    return touchCmd('touch-devices').then(function (list) {
      if (stale()) return null;
      var present = (list || []).map(function (d) { return String(d.host || '').toUpperCase(); });
      var notes = [];
      var chain = Promise.resolve();
      var found = false;
      DBG_DEVICES.filter(function (d) { return !d.cdc; }).forEach(function (d) {
        chain = chain.then(function () {
          if (stale() || found) return null;
          if (present.length && present.indexOf(d.id) < 0) {
            dbgDevStatus[d.id] = 'offline';
            notes.push(d.id + ' · not connected');
            return null;
          }
          return dbgProbe(d.id, true).then(function (res) {
            if (stale()) return;
            if (res && res.ok) {
              found = true;
              notes.push(d.id + ' · ' + (res.part || 'EVE') + ' detected');
            } else {
              notes.push(d.id + ' · no board answered');
            }
          });
        });
      });
      chain = chain.then(function () {
        if (stale()) return null;
        return dbgProbePico(true, false).then(function (res) {
          if (stale()) return;
          notes.push(res && res.ok ? 'Pico · ' + res.part + ' bridge detected' : 'Pico · not connected');
        });
      });
      return chain.then(function () {
        if (stale()) return;
        dbgSyncDevices();
        paintStatus();
        $('#dbg-conn-detail').text(notes.join('\n') || 'No interface answered.');
        if (found) {
          dbgLog('scan: ' + dbgDeviceName(dbgSelected) + ' on ' + dbgSelected);
          dbgReadScreen();
          dbgReadTransform();
        } else {
          dbgLog('scan: no device found');
        }
      });
    }).catch(function (err) {
      if (stale()) return;
      DBG_DEVICES.forEach(function (d) { dbgDevStatus[d.id] = ''; });
      dbgSyncDevices();
      $('#dbg-conn-detail').text('Scan failed: ' + String((err && err.message) || err));
      dbgLog('Scan failed: ' + (err.message || err));
    });
  };

  /* Update reconnects the selected adapter with the clock settings above it. The
     SPI and system clocks are only applied when the board is opened, so a change
     needs a fresh connect; the touch session is closed and reopened. */
  window.dbgUpdate = function () {
    if (dbg.busy) return;
    var id = dbgSelected || (DBG_DEVICES.filter(function (d) {
      return !d.cdc && dbgDevStatus[d.id] === 'connected';
    })[0] || {}).id || 'FT4222';
    dbg.busy = true;
    $('#dbg-btn-update').prop('disabled', true);
    $('#dbg-conn-detail').text('Applying ' + $('#dbg-spi-clock').val() + ' MHz SPI · ' +
      $('#dbg-eve-clock').val() + ' MHz system clock…');
    dbgStopMonitor();
    dbgProbe(id, false).then(function (res) {
      dbg.busy = false;
      $('#dbg-btn-update').prop('disabled', !dbg.connected);
      if (res && res.ok) {
        dbgReadScreen();
        dbgReadTransform();
      }
    });
  };

  function dbgHandleDeviceAction(id, act) {
    if (act === 'connect') {
      dbgProbe(id, false).then(function (res) {
        if (!res || !res.ok) {
          $('#dbg-conn-detail').text(id + ' did not answer. Check the adapter and the SPI clock.');
        } else if (dbgIsCdc(id)) {
          $('#dbg-conn-detail').text('Pico · ' + res.part + ' — bridge selected.');
          dbgReadScreen();
          dbgReadTransform();
        } else {
          $('#dbg-conn-detail').text(id + ' answered — selected.');
          dbgReadScreen();
          dbgReadTransform();
        }
        paintStatus();
      });
      return;
    }
    if (act === 'reset') {
      dbgDevStatus[id] = '';
      dbgProbe(id, false).then(function () { paintStatus(); });
      return;
    }
    if (act === 'disconnect') {
      if (dbgSelected === id) { dbgClearSession(); return; }
      dbgDevStatus[id] = '';
      delete dbgDevInfo[id];
      dbgSyncDevices();
      paintStatus();
      dbgLog('disconnected ' + id);
      return;
    }
    if (act === 'select') {
      if (dbgDevStatus[id] !== 'connected') return;
      dbgSelected = id;
      dbgSyncDevices();
      paintStatus();
      dbgLog('device: ' + id);
    }
  }
  $(document).on('click', '#dbg-conn-card [data-dev-act]', function () {
    var $row = $(this).closest('.dev-row');
    dbgHandleDeviceAction(String($row.attr('data-device') || ''), String($(this).attr('data-dev-act') || ''));
  });

  /* Closes the touch session and clears the selection. The Connection card has no
     Disconnect button any more, so this only runs from a row action. */
  function dbgClearSession() {
    dbgStopMonitor();
    touchCmd('touch-disconnect').then(function () {
      dbg.connected = false;
      dbg.status = null;
      dbgSelected = '';
      DBG_DEVICES.forEach(function (d) { dbgDevStatus[d.id] = ''; delete dbgDevInfo[d.id]; });
      dbgLog('Disconnected');
      $('#dbg-conn-detail').text('');
      dbgSyncDevices();
      paintStatus();
    }).catch(function (err) {
      dbgLog('Disconnect failed: ' + (err.message || err));
    });
  }

  function paintStatus() {
    var s = dbg.status || {};
    var on = !!dbg.connected;
    $('#dbg-btn-update').prop('disabled', !on || dbg.busy);
    $('#dbg-btn-monitor').prop('disabled', !on);
    $('#dbg-btn-load').prop('disabled', !on);
    $('#dbg-btn-calibrate').prop('disabled', !on || !!(s.debug_mode));
    $('#dbg-extended').prop('checked', !!(s.extended));
    if (s.calibrating) $('#dbg-monitor-hint').text('Calibration in progress — tap the dots on the screen.');
  }

  // ---------------------------------------------------------------------
  // Debug — USB hotplug watch
  // ---------------------------------------------------------------------

  /* A webview cannot see the USB bus, so the extension's own DLL does it: one
     `usb-watch <ms>` call blocks until a device comes or goes and answers with
     the list that is present. A plug or unplug then re-probes the adapter, so a
     board is noticed without pressing Scan. */
  var WATCH_WAIT_MS = 10000;
  var WATCH_RETRY_MS = 10000;
  var PROBE_RETRIES = 3;
  var PROBE_RETRY_MS = 1000;
  var watchUsbSig = null;
  var watchHasFtdi = false;
  var watchHasPico = false;
  var watchStarted = false;
  var watchToast = null;
  var bgProbeRunning = false;

  function usbSignature(list) {
    return (list || []).map(function (s) { return String(s).toLowerCase(); }).sort().join('|');
  }
  function ftdiCount(list) {
    return (list || []).filter(function (p) { return String(p).toLowerCase().indexOf('vid_0403') >= 0; }).length;
  }
  /* A Pico is a USB mass-storage device, not an FTDI adapter, so it never shows up
     in the FTDI count. Raspberry Pi's vendor id is the only bus-level signal that
     one was plugged in or pulled out. */
  function picoCount(list) {
    return (list || []).filter(function (p) { return String(p).toLowerCase().indexOf('vid_2e8a') >= 0; }).length;
  }
  function usbCountLabel(n) {
    return n + ' USB device' + (n === 1 ? '' : 's');
  }
  function usbWatchCall(timeoutMs) {
    return API_EAB_runCli({ command: 'usb-watch', args: [String(timeoutMs | 0)] }).then(function (resp) {
      if (!resp || !resp.ok) throw new Error(String((resp && (resp.error || resp.result)) || 'usb-watch failed'));
      var outer = JSON.parse(String(resp.detail || '{}'));
      if (outer && outer.success === false) throw new Error(String(outer.error || 'usb-watch failed'));
      return (outer && outer.data) || {};
    });
  }
  /* The adapter is gone, so nothing on the board can be reached any more. The
     Pico is a USB CDC device, not an FTDI adapter, so its row is left alone. */
  function clearSpiDevices() {
    var gone = [];
    DBG_DEVICES.filter(function (d) { return !d.cdc; }).forEach(function (d) {
      if (!dbgDevStatus[d.id] && !dbgDevInfo[d.id]) return;
      gone.push(dbgDeviceName(d.id));
      dbgDevStatus[d.id] = '';
      delete dbgDevInfo[d.id];
    });
    if (!gone.length) return gone;
    if (dbg.connected) {
      dbgStopMonitor();
      dbg.connected = false;
      dbg.status = null;
      dbgSelected = '';
      paintStatus();
    }
    dbgSyncDevices();
    return gone;
  }
  function backgroundProbe() {
    if (bgProbeRunning || !watchHasFtdi) return;
    if (DBG_DEVICES.some(function (d) { return dbgDevStatus[d.id] === 'checking'; })) return;
    if (DBG_DEVICES.some(function (d) { return !d.cdc && dbgDevStatus[d.id] === 'connected'; })) return;
    var id = dbgSelected || 'FT4222';
    bgProbeRunning = true;
    dbgLog('watch: checking for an EVE device on ' + id + '…');
    var attempt = function (n) {
      return dbgProbe(id, true).then(function (res) {
        if (res && res.ok) return res;
        if (n >= PROBE_RETRIES) return res;
        return new Promise(function (resolve) { setTimeout(resolve, PROBE_RETRY_MS); }).then(function () {
          if (!watchHasFtdi) return res;
          return attempt(n + 1);
        });
      });
    };
    attempt(0).then(function (res) {
      bgProbeRunning = false;
      if (!watchHasFtdi) return;
      if (res && res.ok) {
        dbgLog('watch: ' + id + ' answered — ' + (res.part || 'EVE') + '. Selected.');
        watchToast = dbgUpdateToast(watchToast, 'on', 'EVE device detected',
          (res.part || 'EVE') + ' on ' + id + ' — selected.');
        dbgReadScreen();
        dbgReadTransform();
      } else {
        dbgLog('watch: no EVE device answered');
        watchToast = dbgUpdateToast(watchToast, 'info', 'Programmer connected',
          'No EVE device answered on ' + id + '. Check the board is powered and the SPI wiring.');
      }
    }, function (err) {
      bgProbeRunning = false;
      dbgLog('watch: probe failed: ' + String((err && err.message) || err));
    });
  }
  function onUsbDevices(list) {
    var devices = list || [];
    var sig = usbSignature(devices);
    if (sig === watchUsbSig) return;
    var known = watchUsbSig !== null;
    var hadFtdi = watchHasFtdi;
    var hadPico = watchHasPico;
    watchUsbSig = sig;
    var ftdi = ftdiCount(devices);
    var pico = picoCount(devices);
    watchHasFtdi = ftdi > 0;
    watchHasPico = pico > 0;
    dbgLog('watch: USB ' + (known ? 'change' : 'state') + ' — ' + usbCountLabel(devices.length) +
      (ftdi ? ', ' + ftdi + ' FTDI adapter' + (ftdi === 1 ? '' : 's') : ', no FTDI adapter') +
      (pico ? ', ' + pico + ' Raspberry Pi Pico' : ''));
    // A Pico is a USB CDC device, so the FTDI probe can never see it: its row is
    // refreshed by asking the DLL which Raspberry Pi serial ports exist.
    if (watchHasPico !== hadPico) {
      if (watchHasPico) {
        watchToast = dbgUpdateToast(watchToast, 'on', 'Pico connected',
          'Raspberry Pi Pico detected — looking for the bridge port…');
      } else if (dbgDevStatus.Pico === 'connected') {
        dbgDevStatus.Pico = '';
        delete dbgDevInfo.Pico;
        if (dbgSelected === 'Pico') {
          dbgStopMonitor();
          dbg.connected = false;
          dbg.status = null;
          dbgSelected = '';
          paintStatus();
        }
        dbgSyncDevices();
        watchToast = dbgUpdateToast(watchToast, 'off', 'Pico disconnected',
          'The Raspberry Pi Pico is no longer connected.');
      }
      dbgProbePico(true, false);
    }
    if (!watchHasFtdi) {
      var gone = clearSpiDevices();
      if (gone.length) {
        $('#dbg-conn-detail').text('The programmer adapter was unplugged.');
        watchToast = dbgUpdateToast(watchToast, 'off', 'Device disconnected',
          gone.join(', ') + ' is no longer connected.');
      } else if (hadFtdi) {
        watchToast = dbgUpdateToast(watchToast, 'off', 'Programmer unplugged',
          'No FTDI adapter is connected any more.');
      }
      return;
    }
    if (!hadFtdi && known) {
      watchToast = dbgUpdateToast(watchToast, 'on', 'Programmer connected',
        'FTDI adapter detected — looking for an EVE device…');
    }
    backgroundProbe();
  }
  function startUsbWatch(tries) {
    if (watchStarted || !isEmbedded()) return;
    if (typeof API_EAB_runCli !== 'function') {
      if ((tries || 0) < 20) setTimeout(function () { startUsbWatch((tries || 0) + 1); }, 250);
      return;
    }
    watchStarted = true;
    var first = true;
    var warned = false;
    var tick = function (delay) {
      setTimeout(function () {
        usbWatchCall(first ? 0 : WATCH_WAIT_MS).then(function (payload) {
          first = false;
          warned = false;
          onUsbDevices(payload && payload.devices);
          tick(0);
        }, function (err) {
          if (!warned) dbgLog('watch: USB listener unavailable — ' + String((err && err.message) || err));
          warned = true;
          tick(WATCH_RETRY_MS);
        });
      }, delay);
    };
    tick(0);
  }

  // ---------------------------------------------------------------------
  // Debug — monitor
  // ---------------------------------------------------------------------

  var TOUCH_POINTS = 5;

  function buildTouchRows() {
    var $wrap = $('#dbg-touch-points');
    if ($wrap.children().length) return;
    var html = '';
    for (var i = 0; i < TOUCH_POINTS; i++) {
      html += '<div class="dbg-touch-row" data-point="' + i + '">' +
        '<span class="dbg-touch-dot">⭘</span>' +
        '<span class="dbg-touch-name">Touch ' + i + '</span>' +
        '<span class="dbg-touch-x">X: ---</span>' +
        '<span class="dbg-touch-y">Y: ---</span>' +
        '</div>';
    }
    $wrap.html(html);
  }

  function paintPoints(points) {
    buildTouchRows();
    var seen = {};
    (points || []).forEach(function (p) {
      seen[p.id] = true;
      var $row = $('#dbg-touch-points .dbg-touch-row[data-point="' + p.id + '"]');
      $row.toggleClass('is-active', !!p.active);
      $row.find('.dbg-touch-dot').text(p.active ? '⬤' : '⭘');
      $row.find('.dbg-touch-x').text('X: ' + (p.active ? p.x : '---'));
      $row.find('.dbg-touch-y').text('Y: ' + (p.active ? p.y : '---'));
    });
    $('#dbg-touch-points .dbg-touch-row').each(function () {
      var id = Number($(this).attr('data-point'));
      if (seen[id]) return;
      $(this).removeClass('is-active');
      $(this).find('.dbg-touch-dot').text('⭘');
      $(this).find('.dbg-touch-x').text('X: ---');
      $(this).find('.dbg-touch-y').text('Y: ---');
    });
  }

  function pollOnce() {
    if (!dbg.connected || !dbg.monitoring) return;
    touchCmd('touch-poll').then(function (res) {
      paintPoints(res && res.points);
    }).catch(function (err) {
      dbgLog('Poll failed: ' + (err.message || err));
      dbgStopMonitor();
    });
  }

  window.dbgToggleMonitor = function () {
    if (dbg.monitoring) dbgStopMonitor();
    else dbgStartMonitor();
  };

  function dbgStartMonitor() {
    if (!dbg.connected || dbg.monitoring) return;
    dbg.monitoring = true;
    $('#dbg-btn-monitor').text('⏹ Stop Monitor');
    $('#dbg-monitor-hint').text('Reading the touch registers at ' + dbg.sampleRate + ' Hz.');
    dbgLog('Started touch monitoring at ' + dbg.sampleRate + ' Hz');
    pollOnce();
    dbg.timer = setInterval(pollOnce, Math.max(16, Math.round(1000 / dbg.sampleRate)));
  }

  function dbgStopMonitor() {
    if (!dbg.monitoring) return;
    dbg.monitoring = false;
    if (dbg.timer) clearInterval(dbg.timer);
    dbg.timer = null;
    $('#dbg-btn-monitor').text('▶ Start Monitor');
    $('#dbg-monitor-hint').text('Monitoring stopped.');
    dbgLog('Stopped touch monitoring');
  }

  window.dbgSetSampleRate = function (value) {
    var rate = Math.max(1, Math.min(240, Number(value) || 60));
    dbg.sampleRate = rate;
    $('#dbg-sample-hint').text('Current: ' + rate + ' Hz');
    if (dbg.monitoring) {
      clearInterval(dbg.timer);
      dbg.timer = setInterval(pollOnce, Math.max(16, Math.round(1000 / rate)));
    }
  };

  window.dbgSetExtended = function (on) {
    if (!dbg.connected) return;
    touchCmd('touch-set-extended', ['--on', on ? '1' : '0']).then(function (status) {
      dbg.status = status;
      dbgLog('Extended mode ' + (on ? 'enabled' : 'disabled'));
      paintStatus();
    }).catch(function (err) {
      dbgLog('Could not change the touch mode: ' + (err.message || err));
    });
  };

  // ---------------------------------------------------------------------
  // Debug — firmware / calibration
  // ---------------------------------------------------------------------

  window.dbgPickFirmware = function () {
    if (typeof API_EAB_pickFile !== 'function') return;
    API_EAB_pickFile({
      title: 'Select Custom Touch FW File',
      filters: [{ name: 'Touch firmware', extensions: ['bin'] }],
    }).then(function (resp) {
      if (resp && resp.ok && resp.path) $('#dbg-fw-path').val(resp.path);
    });
  };

  window.dbgPickDebugFirmware = function () {
    if (typeof API_EAB_pickFile !== 'function') return;
    API_EAB_pickFile({
      title: 'Select Custom Touch Debug FW File',
      filters: [{ name: 'Debug firmware', extensions: ['bin'] }],
    }).then(function (resp) {
      if (resp && resp.ok && resp.path) $('#dbg-debug-fw-path').val(resp.path);
    });
  };

  window.dbgLoadFirmware = function () {
    if (!dbg.connected) return;
    var touch = String($('#dbg-fw-path').val() || '').trim();
    if (!touch) {
      dbgLog('Please specify the touch firmware file path in Settings.');
      dbgSwitchPage('settings');
      return;
    }
    var debugMode = String($('#dbg-debug-mode').val() || 'off') === 'on';
    var debug = String($('#dbg-debug-fw-path').val() || '').trim();
    if (debugMode && !debug) {
      dbgLog('Debug mode is ON but no debug firmware path is set.');
      dbgSwitchPage('settings');
      return;
    }
    var args = ['--touch', touch];
    if (debugMode) args.push('--debug', debug);
    dbgLog('Loading ' + touch + (debugMode ? ' + ' + debug : ''));
    touchCmd('touch-load-firmware', args).then(function (status) {
      dbg.status = status;
      dbgLog('Custom touch firmware is now active');
      paintStatus();
    }).catch(function (err) {
      dbgLog('Failed to load firmware: ' + (err.message || err));
    });
  };

  /* Fills the Debug FW path with the patch that matches the connected chip, so
     the user does not have to find it in the install folder. */
  window.dbgUseDebugPatch = function () {
    var part = (dbg.status && dbg.status.part) || '';
    if (!part) {
      dbgLog('Connect the board first so the patch can be matched to its chip.');
      return;
    }
    touchCmd('touch-debug-patch', ['--part', part]).then(function (path) {
      $('#dbg-debug-fw-path').val(path);
      $('#dbg-debug-mode').val('on');
      dbgLog('Debug patch: ' + path);
    }).catch(function (err) {
      dbgLog('No debug patch for ' + part + ': ' + (err.message || err));
    });
  };

  window.dbgCalibrate = function () {
    if (!dbg.connected) return;
    dbgLog('Calibration started — tap the dots on the screen');
    touchCmd('touch-calibrate').then(function (status) {
      dbg.status = status;
      paintStatus();
      dbgWatchCalibration();
    }).catch(function (err) {
      dbgLog('Calibration failed: ' + (err.message || err));
    });
  };

  /* CMD_CALIBRATE keeps the coprocessor busy until the user has tapped every
     dot, so completion is polled rather than awaited. */
  function dbgWatchCalibration() {
    if (dbg.calibTimer) clearInterval(dbg.calibTimer);
    var started = Date.now();
    dbg.calibTimer = setInterval(function () {
      touchCmd('touch-status').then(function (status) {
        dbg.status = status;
        paintStatus();
        if (!status.calibrating) {
          clearInterval(dbg.calibTimer);
          dbg.calibTimer = null;
          dbgLog('Calibration completed successfully');
          dbgReadTransform();
        } else if (Date.now() - started > 60000) {
          clearInterval(dbg.calibTimer);
          dbg.calibTimer = null;
          dbgLog('Calibration timed out');
        }
      }).catch(function () {
        clearInterval(dbg.calibTimer);
        dbg.calibTimer = null;
      });
    }, 500);
  }

  // ---------------------------------------------------------------------
  // Debug — transform
  // ---------------------------------------------------------------------

  var TRANSFORM_FIELDS = ['a', 'b', 'c', 'd', 'e', 'f'];

  function buildTransformFields() {
    var $wrap = $('#dbg-transform');
    if ($wrap.children().length) return;
    $wrap.html(TRANSFORM_FIELDS.map(function (k) {
      return '<div class="dbg-field"><label for="dbg-tf-' + k + '">' + k.toUpperCase() + '</label>' +
        '<input id="dbg-tf-' + k + '" type="text" class="input-field form-control" spellcheck="false"></div>';
    }).join(''));
  }

  window.dbgRenderTransform = function () {
    buildTransformFields();
    var hex = $('#dbg-hex').prop('checked');
    TRANSFORM_FIELDS.forEach(function (k) {
      var v = dbg.transform[k] | 0;
      $('#dbg-tf-' + k).val(hex ? '0x' + (v >>> 0).toString(16).toUpperCase() : String(v));
    });
  };

  window.dbgReadTransform = function () {
    if (!dbg.connected) return;
    touchCmd('touch-read-transform').then(function (t) {
      dbg.transform = t;
      dbgRenderTransform();
      dbgLog('Transform read');
    }).catch(function (err) {
      dbgLog('Could not read the transform: ' + (err.message || err));
    });
  };

  window.dbgWriteTransform = function () {
    if (!dbg.connected) return;
    var args = [];
    TRANSFORM_FIELDS.forEach(function (k) {
      var raw = String($('#dbg-tf-' + k).val() || '0').trim();
      var v = /^0x/i.test(raw) ? parseInt(raw, 16) : parseInt(raw, 10);
      if (isNaN(v)) v = 0;
      dbg.transform[k] = v | 0;
      args.push('--' + k, String(v | 0));
    });
    touchCmd('touch-write-transform', args).then(function () {
      dbgLog('Transform applied');
    }).catch(function (err) {
      dbgLog('Could not write the transform: ' + (err.message || err));
    });
  };

  // ---------------------------------------------------------------------
  // Debug — screen configuration
  // ---------------------------------------------------------------------

  var SCREEN_FIELDS = [
    ['width', 'Width'], ['height', 'Height'],
    ['hcycle', 'HCycle'], ['hsync0', 'HSync0'], ['hsync1', 'HSync1'], ['hoffset', 'HOffset'],
    ['vcycle', 'VCycle'], ['vsync0', 'VSync0'], ['vsync1', 'VSync1'], ['voffset', 'VOffset'],
    ['pclk', 'PCLK'], ['pclk_freq', 'PCLKFreq'], ['pclk_pol', 'PCLKPol'],
    ['swizzle', 'SWizzle'], ['cspread', 'CSpread'], ['dither', 'Dither'],
  ];

  var PRESETS = {
    '480x272': { width: 480, height: 272, hcycle: 548, hoffset: 43, hsync0: 0, hsync1: 41,
      vcycle: 292, voffset: 12, vsync0: 0, vsync1: 10, pclk: 3, pclk_pol: 0,
      swizzle: 0, cspread: 1, dither: 1, pclk_freq: 0 },
    '800x480': { width: 800, height: 480, hcycle: 928, hoffset: 88, hsync0: 0, hsync1: 48,
      vcycle: 525, voffset: 32, vsync0: 0, vsync1: 3, pclk: 2, pclk_pol: 0,
      swizzle: 0, cspread: 1, dither: 1, pclk_freq: 0 },
    '1024x600': { width: 1024, height: 600, hcycle: 1344, hoffset: 160, hsync0: 0, hsync1: 24,
      vcycle: 635, voffset: 23, vsync0: 0, vsync1: 12, pclk: 1, pclk_pol: 0,
      swizzle: 0, cspread: 1, dither: 1, pclk_freq: 0 },
    '1280x800': { width: 1280, height: 800, hcycle: 1440, hoffset: 0, hsync0: 0, hsync1: 48,
      vcycle: 823, voffset: 0, vsync0: 0, vsync1: 3, pclk: 1, pclk_pol: 0,
      swizzle: 0, cspread: 1, dither: 1, pclk_freq: 0 },
  };

  function buildScreenFields() {
    var $wrap = $('#dbg-screen');
    if ($wrap.children().length) return;
    $wrap.html(SCREEN_FIELDS.map(function (f) {
      return '<div class="dbg-field"><label for="dbg-sc-' + f[0] + '">' + f[1] + '</label>' +
        '<input id="dbg-sc-' + f[0] + '" type="number" class="input-field form-control" min="0"></div>';
    }).join(''));
  }

  function paintScreen(cfg) {
    buildScreenFields();
    if (!cfg) return;
    dbg.screen = cfg;
    SCREEN_FIELDS.forEach(function (f) {
      $('#dbg-sc-' + f[0]).val(cfg[f[0]]);
    });
    $('#dbg-brightness').val(cfg.brightness);
    $('#dbg-brightness-val').text(cfg.brightness);
  }

  window.dbgReadScreen = function () {
    if (!dbg.connected) return;
    touchCmd('touch-read-screen').then(function (cfg) {
      paintScreen(cfg);
      dbgLog('Screen configuration read');
    }).catch(function (err) {
      dbgLog('Could not read the screen configuration: ' + (err.message || err));
    });
  };

  window.dbgWriteScreen = function () {
    if (!dbg.connected) return;
    var args = [];
    SCREEN_FIELDS.forEach(function (f) {
      args.push('--' + f[0].replace(/_/g, '-'), String($('#dbg-sc-' + f[0]).val() || 0));
    });
    args.push('--brightness', String($('#dbg-brightness').val() || 0));
    touchCmd('touch-write-screen', args).then(function (cfg) {
      paintScreen(cfg);
      dbgLog('Screen configuration applied');
    }).catch(function (err) {
      dbgLog('Could not apply the screen configuration: ' + (err.message || err));
    });
  };

  window.dbgApplyPreset = function (name) {
    var preset = PRESETS[name];
    if (!preset) return;
    buildScreenFields();
    Object.keys(preset).forEach(function (k) {
      $('#dbg-sc-' + k).val(preset[k]);
    });
  };

  window.dbgSetBrightness = function (value) {
    $('#dbg-brightness-val').text(value);
  };

  // ---------------------------------------------------------------------
  // Debug — page switching
  // ---------------------------------------------------------------------

  window.dbgSwitchPage = function (which) {
    $('.dbg-page').removeClass('active');
    $('#dbg-page-' + which).addClass('active');
    $('#dbg-tabs .tab-sub-btn').removeClass('active').attr('aria-selected', 'false');
    $('#dbg-tabs .tab-sub-btn[data-dbg-tab="' + which + '"]').addClass('active').attr('aria-selected', 'true');
  };

  function dbgOnShow() {
    buildTouchRows();
    buildTransformFields();
    buildScreenFields();
    if (!dbg.status) dbgScan();
  }
  // ---------------------------------------------------------------------
  // Debug — column divider
  // ---------------------------------------------------------------------

  var DBG_SPLIT_KEY = 'eab_custom_touch_dbg_split';
  var DBG_SPLIT_DEFAULT = 41.6667;

  function dbgReadSplit() {
    try {
      var v = parseFloat(localStorage.getItem(DBG_SPLIT_KEY));
      if (!isNaN(v) && v >= 20 && v <= 80) return v;
    } catch (e) { }
    return DBG_SPLIT_DEFAULT;
  }

  function dbgApplySplit(percent) {
    var $row = $('.dbg-row');
    if (!$row.length) return;
    if ((window.innerWidth || 0) < 900) {
      $row[0].style.gridTemplateColumns = '';
      return;
    }
    $row[0].style.gridTemplateColumns =
      'minmax(0,' + percent + 'fr) 16px minmax(0,' + (100 - percent) + 'fr)';
  }

  function installDbgDivider() {
    var divider = document.getElementById('dbg-divider');
    if (!divider || divider.dataset.bound) return;
    divider.dataset.bound = '1';
    var split = dbgReadSplit();
    dbgApplySplit(split);
    var dragging = false;

    function setValue(percent) {
      split = Math.max(20, Math.min(80, Math.round(percent * 2) / 2));
      dbgApplySplit(split);
    }
    function save() {
      try { localStorage.setItem(DBG_SPLIT_KEY, String(split)); } catch (e) { }
    }

    divider.addEventListener('pointerdown', function (e) {
      dragging = true;
      divider.classList.add('is-dragging');
      document.body.classList.add('eab-split-dragging');
      if (divider.setPointerCapture) divider.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    divider.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var rect = divider.parentElement.getBoundingClientRect();
      if (rect.width) setValue(((e.clientX - rect.left) / rect.width) * 100);
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      divider.classList.remove('is-dragging');
      document.body.classList.remove('eab-split-dragging');
      save();
    }
    divider.addEventListener('pointerup', endDrag);
    divider.addEventListener('pointercancel', endDrag);
    divider.addEventListener('lostpointercapture', endDrag);
    divider.addEventListener('dblclick', function () {
      setValue(DBG_SPLIT_DEFAULT);
      save();
    });
    divider.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 5 : 2;
      if (e.key === 'ArrowLeft') setValue(split - step);
      else if (e.key === 'ArrowRight') setValue(split + step);
      else if (e.key === 'Home') setValue(DBG_SPLIT_DEFAULT);
      else return;
      save();
      e.preventDefault();
    });
    window.addEventListener('resize', function () { dbgApplySplit(split); });
  }

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------

  $(function () {
    installDbgDivider();
    buildTouchRows();
    buildTransformFields();
    buildScreenFields();
    dbgRenderTransform();
    dbgSetSampleRate($('#dbg-sample-rate').val() || 60);
    // Restore the last scan instead of probing the adapter again: the host tears
    // this page down whenever the extension is hidden. Press Scan to look again.
    if (dbgLoadCache()) {
      $('#dbg-conn-detail').text('Restored the last scan — press Scan to look again.');
    }
    dbgSyncDevices();
    paintStatus();
    // The DLL keeps the touch session between page loads, so the restored
    // "connected" state is only trusted once touch-status confirms it.
    if (dbgSelected) {
      touchCmd('touch-status').then(function (status) {
        if (status && status.connected) {
          dbg.connected = true;
          dbg.status = status;
          paintStatus();
        } else {
          dbg.connected = false;
          dbg.status = null;
          dbgSelected = '';
          dbgSyncDevices();
          paintStatus();
        }
      }).catch(function () {
        dbg.connected = false;
        dbg.status = null;
        dbgSelected = '';
        dbgSyncDevices();
        paintStatus();
      });
    }
    startUsbWatch();
  });
})();
