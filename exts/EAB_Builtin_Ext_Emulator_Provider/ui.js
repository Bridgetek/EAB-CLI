/* Emulator Provider — configuration only.
 *
 * The provider publishes the eve.emulator service. Method names are not
 * hardcoded here: the UI asks the provider for its own descriptor and
 * forwards every advertised method straight through, so adding a method in
 * Rust needs no change in this file.
 */
(function () {
  'use strict';

  var SERVICE = 'eve.emulator';
  var COMMAND = 'emulator';

  function log(text) {
    var el = document.getElementById('log');
    if (!el) return;
    var line = '[' + new Date().toLocaleTimeString() + '] ' + text;
    el.textContent = (el.textContent ? el.textContent + '\n' : '') + line;
    el.scrollTop = el.scrollHeight;
  }

  function showError(text) {
    var el = document.getElementById('error-panel');
    if (!el) return;
    if (!text) {
      el.classList.add('hidden');
      el.textContent = '';
      return;
    }
    el.classList.remove('hidden');
    el.textContent = text;
  }

  function call(method, args) {
    return API_EAB_runCli({
      command: COMMAND,
      args: [method, JSON.stringify(args || {})],
    }).then(function (r) {
      if (!r || !r.ok) throw new Error((r && r.error) || 'host call failed');
      var parsed;
      try {
        parsed = JSON.parse(r.detail);
      } catch (e) {
        throw new Error('the provider answered with invalid JSON');
      }
      if (!parsed.success) throw new Error(parsed.error || 'the emulator call failed');
      return parsed.data;
    });
  }

  function renderKv(id, rows, empty) {
    var el = document.getElementById(id);
    if (!el) return;
    if (!rows || !rows.length) {
      el.innerHTML = '<span class="dim">' + (empty || '—') + '</span>';
      return;
    }
    el.innerHTML = rows.map(function (r) {
      return '<span class="k">' + r[0] + '</span><span>' + String(r[1]) + '</span>';
    }).join('');
  }

  function formatSize(bytes) {
    if (typeof bytes !== 'number' || !isFinite(bytes)) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KiB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MiB';
  }

  function formatPath(path) {
    if (!path) return '—';
    var parts = String(path).split(/[\\/]/);
    return parts.length > 3 ? '…/' + parts.slice(-2).join('/') : path;
  }

  // ---------------------------------------------------------------- config

  function renderConfig(cfg) {
    var input = document.getElementById('dll-path');
    if (input && !input.dataset.touched) input.value = cfg.dllPath || '';
    renderKv('info-kv', [
      ['resolved', formatPath(cfg.resolved)],
      ['source', cfg.dllPath ? 'custom' : 'bundled'],
    ], cfg.resolvedOk === false ? (cfg.resolvedError || 'unresolved') : 'not inspected yet');
  }

  function loadConfig() {
    return call('getConfig', {}).then(function (cfg) {
      renderConfig(cfg);
      return cfg;
    }).catch(function (err) {
      showError(err.message);
      log('config: ' + err.message);
      return null;
    });
  }

  function saveConfig() {
    showError('');
    var input = document.getElementById('dll-path');
    var path = input ? input.value.trim() : '';
    call('setConfig', { dllPath: path }).then(function (cfg) {
      renderConfig(cfg);
      log(path ? 'saved DLL path ' + path : 'reset to the bundled DLL');
      return inspectDll();
    }).catch(function (err) {
      showError(err.message);
      log('save failed: ' + err.message);
    });
  }

  function resetConfig() {
    var input = document.getElementById('dll-path');
    if (input) input.value = '';
    saveConfig();
  }

  function inspectDll() {
    showError('');
    var input = document.getElementById('dll-path');
    var path = input ? input.value.trim() : '';
    return call('inspectDll', path ? { path: path } : {}).then(function (info) {
      renderKv('info-kv', [
        ['path', formatPath(info.path)],
        ['exists', info.exists ? 'yes' : 'no'],
        ['size', formatSize(info.size)],
        ['version', info.version || '—'],
        ['emulator', info.isEmulator ? 'yes' : 'no'],
      ]);
      log('inspected ' + formatPath(info.path) + ' (version ' + (info.version || 'unknown') + ')');
      if (!info.exists) showError('the DLL does not exist: ' + info.path);
      else if (!info.isEmulator) showError('the file does not export the BT8XXEMU API');
      return info;
    }).catch(function (err) {
      renderKv('info-kv', null, 'inspection failed');
      showError(err.message);
      log('inspect failed: ' + err.message);
      return null;
    });
  }

  function pickInto(inputId, title) {
    return API_EAB_pickFile({
      multiple: false,
      readBase64: false,
      filters: [{ name: title, extensions: ['dll'] }],
    }).then(function (r) {
      if (r && r.ok && r.path) {
        var input = document.getElementById(inputId);
        if (input) input.value = r.path;
      }
    });
  }

  function browseDll() {
    pickInto('dll-path', 'Emulator DLL').then(inspectDll);
  }

  function browseUpdate() {
    pickInto('update-source', 'Emulator DLL');
  }

  function updateDll() {
    showError('');
    var input = document.getElementById('update-source');
    var source = input ? input.value.trim() : '';
    if (!source) {
      showError('pick the DLL to install first');
      return;
    }
    call('updateDll', { source: source }).then(function (info) {
      log('installed ' + formatPath(source) + ' as ' + formatPath(info.path));
      inspectDll();
    }).catch(function (err) {
      showError(err.message);
      log('update failed: ' + err.message);
    });
  }

  // --------------------------------------------------------------- service

  function publishService() {
    // Ask the provider which methods it implements so this UI never needs to
    // know the method names.
    return call('descriptor', {}).then(function (descriptor) {
      var handlers = {};
      (descriptor.methods || []).forEach(function (name) {
        handlers[name] = function (args) { return call(name, args); };
      });
      return API_EAB_serveService(
        {
          service: descriptor.service || SERVICE,
          version: descriptor.version || '1.0',
          description: descriptor.description || 'Headless EVE/BT8xx emulator service',
          methods: descriptor.methods || [],
          capabilities: descriptor.capabilities || {},
        },
        handlers,
      );
    }).then(function (r) {
      if (!r || !r.ok) throw new Error((r && r.error) || 'registration failed');
      var info = (r.services && r.services[0]) || {};
      var methods = info.methods || [];
      renderKv('service-kv', [
        ['service', info.service || SERVICE],
        ['methods', methods.length],
      ]);
      log('published ' + (info.service || SERVICE) + ' with ' + methods.length + ' methods');
    }).catch(function (err) {
      renderKv('service-kv', null, 'not published: ' + err.message);
      log('publish failed: ' + err.message);
    });
  }

  window.browseDll = browseDll;
  window.browseUpdate = browseUpdate;
  window.inspectDll = inspectDll;
  window.saveConfig = saveConfig;
  window.resetConfig = resetConfig;
  window.updateDll = updateDll;

  document.addEventListener('DOMContentLoaded', function () {
    loadConfig();
    inspectDll();
    publishService();
  });
})();
