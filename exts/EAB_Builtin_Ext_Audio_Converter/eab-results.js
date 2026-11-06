(function () {
  'use strict';

  function initResults() {
  var actionPattern = /(?:startRun|startBatch|startValidate|run[A-Z]|convert[A-Z]|demoConvert|generate[A-Z]|build[A-Z]|genSaveManifest|createSession)\s*\(/;
  var jobResults = {};
  var currentAction = null;
  var panelAction = null;
  var actionNumber = 0;
  var suppressApiTracking = false;

  function isActionButton(button) {
    return button.matches('button.btn-primary') &&
      (button.closest('.eab-run-bar,.btn-progress-wrap') ||
        actionPattern.test(button.getAttribute('onclick') || ''));
  }

  function addViewButton(button) {
    if (button.eabResultButton) return;
    var view = document.createElement('button');
    view.type = 'button';
    view.className = 'btn btn-secondary eab-result-view-button';
    view.textContent = 'View Result';
    view.disabled = true;
    view.setAttribute('aria-label', 'View results for ' + (button.textContent || 'this action').trim());
    view.addEventListener('click', function () {
      showPanel(button);
    });
    var runBar = button.closest('.eab-run-bar');
    var anchor = button.closest('.btn-progress-wrap') || button;
    if (runBar) {
      var actions = document.createElement('div');
      actions.className = 'eab-result-actions';
      if (runBar) actions.classList.add('eab-result-run-bar');
      anchor.parentNode.insertBefore(actions, anchor);
      actions.append(anchor, view);
    } else {
      anchor.insertAdjacentElement('afterend', view);
    }
    button.eabResultButton = view;
  }

  function installButtons(root) {
    root = root || document;
    if (root.matches && root.matches('button.btn-primary') && isActionButton(root)) addViewButton(root);
    root.querySelectorAll('button.btn-primary').forEach(function (button) {
      if (isActionButton(button)) addViewButton(button);
    });
  }

  function clearRowErrors() {
    Array.prototype.forEach.call(document.querySelectorAll('.eab-row-error'), function (node) {
      node.remove();
    });
  }

  function entryError(entry) {
    var detail = null;
    try { detail = JSON.parse(String(entry.output || '')); } catch (_) { detail = null; }
    if (detail && typeof detail.error === 'string' && detail.error) return detail.error;
    var text = String(entry.output || '').split('\n').filter(Boolean)[0] || '';
    if (/^(fail|error|cancelled)\b/i.test(text)) return text.replace(/^fail[: ]*/i, '');
    return '';
  }

  function markRowError(entry) {
    if (!entry || entry.status !== 'Failed') return;
    var reason = entryError(entry);
    if (!reason) return;
    var rows = document.querySelectorAll('.file-item[data-path]');
    (entry.inputs || []).forEach(function (input) {
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].getAttribute('data-path') !== input) continue;
        var badge = rows[i].querySelector('.eab-row-error');
        if (!badge) {
          badge = element('span', 'eab-row-error');
          rows[i].appendChild(badge);
        }
        badge.textContent = reason;
        badge.title = reason;
      }
    });
  }

  function newAction(button) {
    clearRowErrors();
    addViewButton(button);
    var id = button.getAttribute('data-eab-result-id');
    if (!id) {
      id = 'eab-result-' + (++actionNumber);
      button.setAttribute('data-eab-result-id', id);
    }
    button.eabResultEntries = [];
    button.eabResultButton.disabled = false;
    currentAction = button;
    return button;
  }

  document.addEventListener('pointerdown', function (event) {
    var button = event.target.closest && event.target.closest('button.btn-primary');
    if (button && isActionButton(button) && !button.disabled) newAction(button);
  }, true);

  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('button.btn-primary');
    if (event.detail === 0 && button && isActionButton(button) && !button.disabled) newAction(button);
  }, true);

  function missingOption(button) {
    var selectors = (button.getAttribute('data-eab-missing') || '').split('|');
    for (var i = 0; i < selectors.length; i++) {
      if (!selectors[i]) continue;
      var target = document.querySelector(selectors[i]);
      if (target && !target.disabled && target.getClientRects().length) return target;
    }
    var scope = button.closest('.app-container') || document;
    var target = scope.querySelector('[required]:invalid:not(:disabled),[aria-required="true"]:invalid:not(:disabled)');
    if (target) return target;
    var emptyQueue = Array.from(scope.querySelectorAll('.file-list-empty:not(.hidden),.dz-empty:not(.hidden)'))
      .find(function (item) { return item.getClientRects().length > 0; });
    if (emptyQueue) return emptyQueue;
    var emptySelect = Array.from(scope.querySelectorAll('select:not(:disabled)'))
      .find(function (item) { return item.getClientRects().length > 0 && !String(item.value || '').trim(); });
    if (emptySelect) return emptySelect;
    return Array.from(scope.querySelectorAll('input.is-path:not(:disabled)'))
      .find(function (item) { return item.getClientRects().length > 0 && !String(item.value || '').trim(); }) || null;
  }

  function blinkOption(target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.clearTimeout(target.eabOptionBlinkTimer);
    target.classList.remove('eab-option-blink');
    void target.offsetWidth;
    target.classList.add('eab-option-blink');
    target.eabOptionBlinkTimer = window.setTimeout(function () {
      target.classList.remove('eab-option-blink');
    }, 3000);
  }

  document.addEventListener('pointerdown', function (event) {
    var wrap = event.target.closest && event.target.closest('.btn-progress-wrap');
    if (!wrap) return;
    if (wrap.classList.contains('eab-action-disabled')) return;
    var button = wrap.querySelector('button.btn-primary:disabled');
    if (!button || !isActionButton(button)) return;
    var target = missingOption(button);
    if (target) {
      event.preventDefault();
      blinkOption(target);
    }
  }, true);

  function quote(value) {
    var text = String(value);
    return /\s|"/.test(text) ? '"' + text.replace(/"/g, '\\"') + '"' : text;
  }

  function commandLine(command, args) {
    var name = String(command || '');
    var separator = name.indexOf(' ');
    var head = (separator < 0 ? name : name.slice(0, separator)).toLowerCase();
    if (chipGenerations[head]) name = chipGenerations[head] + name.slice(head.length);
    return ['eab_tools', name].concat(args || []).map(quote).join(' ');
  }

  function inputPaths(command, args) {
    var paths = [];
    for (var i = 0; i < args.length; i++) {
      if (['-i', '--input', '--infile', '--input-file', '-j', '--input-list',
        '-I', '--input_files', '--inputs', '--program', '--program-verify', '--read', '--verify', '--newblob',
        '--update', '--update-verify', '--write-nand', '--write-nand-verify'].indexOf(args[i]) >= 0 && args[i + 1]) {
        var input = String(args[++i]);
        var values = args[i - 1] === '--inputs' ? input.split(';').filter(Boolean) : [input];
        values.forEach(function (value) { paths.push(value); });
      }
    }
    var leafCommand = String(command || '').trim().split(/\s+/).pop().toLowerCase();
    if (!paths.length && leafCommand === 'audio_validate' && args[0]) {
      paths.push(String(args[0]));
    }
    if (leafCommand === 'flash_gen') {
      var valueFlags = ['-o', '--output-dir', '-n', '--output-name', '-b', '--blob', '-g', '--gen-source'];
      var inputFlags = ['-i', '--input', '--infile', '--input-file', '-j', '--input-list',
        '-I', '--input_files', '--inputs', '--program', '--program-verify', '--read', '--verify',
        '--newblob', '--update', '--update-verify', '--write-nand', '--write-nand-verify'];
      for (var j = 0; j < args.length; j++) {
        if (valueFlags.indexOf(args[j]) >= 0 || inputFlags.indexOf(args[j]) >= 0) {
          j++;
        } else if (args[j] && String(args[j]).charAt(0) !== '-') {
          var positional = String(args[j]);
          if (paths.indexOf(positional) < 0) paths.push(positional);
        }
      }
    }
    return paths;
  }

  function openPath(path) {
    if (!path) return;
    if (typeof window.invokeHost === 'function') {
      try { window.invokeHost('open_in_explorer', { path: path }); return; } catch (_) { }
    }
    if (typeof API_EAB_openOutputLocation === 'function') API_EAB_openOutputLocation({ path: path });
  }

  function parentFolder(path) {
    var p = String(path || '');
    var cut = Math.max(p.lastIndexOf('\\'), p.lastIndexOf('/'));
    return cut > 0 ? p.slice(0, cut) : p;
  }

  function outputDirOf(entry) {
    var args = entry.args || [];
    for (var i = 0; i < args.length; i++) {
      if (['-o', '--output-dir', '--output'].indexOf(args[i]) >= 0 && args[i + 1]) return String(args[i + 1]);
    }
    return '';
  }

  function resolveFile(entry, file) {
    if (!file) return file;
    if (/^([a-zA-Z]:[\\/]|[\\/])/.test(file)) return file;
    if (file.split(/[\\/]/).length > 1) return file;
    var dir = outputDirOf(entry);
    return dir ? dir.replace(/[\\/]+$/, '') + '/' + file : file;
  }

  function entryFiles(entry) {
    var detail = null;
    try { detail = JSON.parse(String(entry.output || '')); } catch (_) { detail = null; }
    var files = [];
    if (detail && typeof detail === 'object') {
      if (Array.isArray(detail.output_files)) files = files.concat(detail.output_files);
      if (typeof detail.output_file === 'string' && detail.output_file) files.push(detail.output_file);
    }
    var label = 'Result files';
    if (!files.length) {
      files = (entry.inputs || []).slice();
      label = 'Input files';
    }
    return {
      label: label,
      files: files.filter(function (file, index) {
        return typeof file === 'string' && file && files.indexOf(file) === index;
      }).map(function (file) { return resolveFile(entry, file); })
    };
  }

  function renderOutputFiles(card, entry) {
    var found = entryFiles(entry);
    var files = found.files;
    if (!files.length) return;
    card.appendChild(element('strong', '', found.label));
    var list = element('div', 'eab-result-files');
    files.forEach(function (file) {
      var row = element('div', 'eab-result-file');
      var open = element('button', 'eab-result-file-open', file);
      open.type = 'button';
      open.title = 'Open ' + file;
      open.addEventListener('click', function () { openPath(file); });
      var folder = element('button', 'eab-result-file-folder', '\uD83D\uDCC2 Open folder');
      folder.type = 'button';
      folder.title = 'Open the folder that contains ' + file;
      folder.addEventListener('click', function () { openPath(parentFolder(file)); });
      row.append(open, folder);
      list.appendChild(row);
    });
    card.appendChild(list);
  }

  function addEntry(command, args, paths) {
    if (!currentAction) return null;
    var entry = {
      command: commandLine(command, args),
      args: args || [],
      inputs: paths && paths.length ? paths : inputPaths(command, args || []),
      status: 'Running',
      output: '',
      action: currentAction
    };
    currentAction.eabResultEntries.push(entry);
    return entry;
  }

  function detailResult(response) {
    var detail = response && response.detail;
    if (typeof detail === 'string') {
      try { return JSON.parse(detail); } catch (_) { return null; }
    }
    return detail && typeof detail === 'object' ? detail : null;
  }

  function finishEntry(entry, response) {
    if (!entry) return;
    var detail = detailResult(response);
    var succeeded = !!(response && response.ok) &&
      !(detail && (detail.success === false ||
        (typeof detail.exit_code === 'number' && detail.exit_code !== 0) ||
        detail.valid === false));
    entry.status = response && response.error === 'Cancelled' ? 'Cancelled' : succeeded ? 'Succeeded' : 'Failed';
    entry.output = (response && (response.error || response.detail || response.result)) || '';
    if (entry.output && typeof entry.output !== 'string') {
      try { entry.output = JSON.stringify(entry.output, null, 2); }
      catch (_) { entry.output = String(entry.output); }
    }
    if (panelAction === entry.action) {
      var list = document.getElementById('eab-result-list');
      if (list) renderEntries(panelAction, list);
    }
    markRowError(entry);
  }

  function wrapApi(name, onCall, onResponse) {
    var original = window[name];
    if (typeof original !== 'function') return;
    window[name] = function (payload) {
      var context = onCall(payload || {});
      var promise = original.apply(this, arguments);
      if (!context || !promise || typeof promise.then !== 'function') return promise;
      return promise.then(function (response) {
        onResponse(context, response);
        return response;
      }, function (error) {
        onResponse(context, null, error);
        throw error;
      });
    };
  }

  wrapApi('API_EAB_runCli', function (payload) {
    if (suppressApiTracking) return null;
    return addEntry(payload.command || '', payload.args || []);
  }, function (entry, response, error) {
    finishEntry(entry, error ? { ok: false, error: String(error) } : response);
  });

  wrapApi('API_EAB_startJob', function (payload) {
    if (suppressApiTracking) return null;
    var command = payload.command || '';
    var args = payload.args || [];
    return addEntry(command, args);
  }, function (entry, response, error) {
    if (!entry) return;
    if (error || !response || !response.ok || !response.jobId) {
      finishEntry(entry, { ok: false, error: String(error || (response && response.error) || 'Could not start job') });
    } else {
      jobResults[response.jobId] = entry;
    }
  });

  var chipGenerations = {
    ft800: 'ft80x', ft801: 'ft80x', ft80x: 'ft80x', eve1: 'ft80x',
    ft810: 'ft81x', ft811: 'ft81x', ft812: 'ft81x', ft813: 'ft81x', ft81x: 'ft81x', eve2: 'ft81x',
    bt880: 'bt88x', bt881: 'bt88x', bt882: 'bt88x', bt883: 'bt88x', bt88x: 'bt88x',
    bt815: 'bt81x', bt816: 'bt81x', bt817: 'bt81x', bt818: 'bt81x', bt81x: 'bt81x',
    eve3: 'bt81x', eve4: 'bt81x', bt820: 'bt82x', bt82x: 'bt82x', eve5: 'bt82x'
  };

  wrapApi('API_EAB_convertFile', function (payload) {
    if (suppressApiTracking) return null;
    var chip = String(payload.chip || '').toLowerCase();
    var command = (chipGenerations[chip] || 'ft80x') + ' img_cvt';
    var args = ['-i', payload.inputFile || '', '-o', payload.outputDir || '.', '-f', payload.format || 'RGB565'];
    if (payload.ditherAlgo) args.push('-d', payload.ditherAlgo);
    if (payload.astcEffort) args.push('-e', payload.astcEffort);
    if (payload.outputName) args.push('-n', payload.outputName);
    if (payload.genSrc) args.push('-g');
    if (payload.noJson) args.push('--no-json');
    return addEntry(command, args, [payload.inputFile || '']);
  }, function (entry, response, error) {
    if (error || !response || !response.ok || !response.jobId) {
      finishEntry(entry, { ok: false, error: String(error || (response && response.error) || 'Could not start job') });
    } else if (entry) {
      jobResults[response.jobId] = entry;
    }
  });

  wrapApi('API_EAB_pollJob', function (payload) {
    return jobResults[payload.jobId] || null;
  }, function (entry, response, error) {
    if (!entry) return;
    var progress = response && response.progress;
    if (error || !response || !response.ok) {
      finishEntry(entry, { ok: false, error: String(error || (response && response.error) || 'Could not read job status') });
    } else if (progress && [2, 3, 4].indexOf(progress.status) >= 0) {
      var result = progress.result || '';
      var parsed = result;
      if (typeof result === 'string') {
        try { parsed = JSON.parse(result); } catch (_) { parsed = null; }
      }
      var success = progress.status === 2 &&
        !(parsed && (parsed.success === false ||
          (typeof parsed.exit_code === 'number' && parsed.exit_code !== 0)));
      finishEntry(entry, {
        ok: success,
        detail: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        error: progress.status === 4 ? 'Cancelled' : ''
      });

      Object.keys(jobResults).forEach(function (key) {
        if (jobResults[key] === entry) delete jobResults[key];
      });
    }
  });

  if (typeof window.invokeHost === 'function') {
    var originalInvokeHost = window.invokeHost;
    window.invokeHost = function (command, payload) {
      if (command !== 'execute_extension_command' || !currentAction) {
        return originalInvokeHost.apply(this, arguments);
      }
      payload = payload || {};
      var entry = addEntry(payload.cliCommand || '', payload.cliArgs || []);
      var wasSuppressed = suppressApiTracking;
      suppressApiTracking = true;
      var result;
      try {
        result = originalInvokeHost.apply(this, arguments);
      } catch (error) {
        suppressApiTracking = wasSuppressed;
        finishEntry(entry, { ok: false, error: String(error) });
        throw error;
      }
      suppressApiTracking = wasSuppressed;
      function complete(value) {
        var parsed = value;
        if (typeof value === 'string') {
          try { parsed = JSON.parse(value); } catch (_) { parsed = null; }
        }
        finishEntry(entry, {
          ok: !(parsed && (parsed.success === false ||
            (typeof parsed.exit_code === 'number' && parsed.exit_code !== 0))),
          detail: typeof value === 'string' ? value : JSON.stringify(value, null, 2)
        });
        return value;
      }
      if (result && typeof result.then === 'function') {
        return result.then(complete, function (error) {
          finishEntry(entry, { ok: false, error: String(error) });
          throw error;
        });
      }
      return complete(result);
    };
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderEntries(button, list) {
    list.replaceChildren();
    var entries = button.eabResultEntries || [];
    if (!entries.length) {
      list.appendChild(element('p', 'eab-result-empty', 'No command-line action was recorded for this operation.'));
      return;
    }
    entries.forEach(function (entry, index) {
      var card = element('section', 'eab-result-entry');
      var heading = element('h3', '', 'Input ' + (index + 1) + ': ' +
        (entry.inputs.length ? entry.inputs.join(', ') : 'No input file'));
      var status = element('p', 'eab-result-status eab-result-' + entry.status.toLowerCase(), entry.status);
      var commandLabel = element('strong', '', 'Equivalent command line');
      var command = element('pre', '', entry.command);
      card.append(heading, status, commandLabel, command);
      renderOutputFiles(card, entry);
      if (entry.output) {
        card.appendChild(element('strong', '', 'Output'));
        card.appendChild(element('pre', '', entry.output));
      }
      list.appendChild(card);
    });
  }

  function showPanel(button) {
    panelAction = button;
    var overlay = document.getElementById('eab-result-overlay');
    if (!overlay) {
      overlay = element('div', 'eab-result-overlay');
      overlay.id = 'eab-result-overlay';
      overlay.setAttribute('role', 'presentation');
      var dialog = element('section', 'eab-result-dialog');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'eab-result-title');
      var header = element('header', 'eab-result-header');
      header.appendChild(element('h2', '', 'Action results')).id = 'eab-result-title';
      var close = element('button', 'btn btn-secondary', 'Close');
      close.type = 'button';
      close.addEventListener('click', function () { overlay.remove(); });
      header.appendChild(close);
      var list = element('div', 'eab-result-list');
      list.id = 'eab-result-list';
      dialog.append(header, list);
      overlay.appendChild(dialog);
      overlay.addEventListener('click', function (event) {
        if (event.target === overlay) overlay.remove();
      });
      document.body.appendChild(overlay);
    }
    renderEntries(button, overlay.querySelector('#eab-result-list'));
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      var overlay = document.getElementById('eab-result-overlay');
      if (overlay) overlay.remove();
    }
  });

  var css = document.createElement('style');
  css.id = 'eab-results-css';
  css.textContent = [
    '.eab-result-view-button{margin-left:8px;white-space:nowrap}',
    '.eab-result-actions{display:inline-flex;align-items:stretch;gap:8px;min-width:0}',
    '.eab-result-actions.eab-result-run-bar{display:flex;width:100%}',
    '.eab-result-actions > .btn-progress-wrap,.eab-result-actions > .btn-primary{flex:1 1 auto;min-width:0;width:auto!important}',
    '.eab-result-actions .eab-result-view-button{flex:0 0 auto;margin-left:0}',
    '.eab-result-overlay{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:rgba(0,0,0,.58)}',
    '.eab-result-dialog{box-sizing:border-box;width:90%;height:90%;display:flex;flex-direction:column;overflow:hidden;padding:16px;border:1px solid var(--eab-border,#39445e);border-radius:12px;background:var(--eab-bg,#1a1a2e);color:var(--eab-text,#e2e8f0);box-shadow:0 16px 48px rgba(0,0,0,.45)}',
    '.eab-result-header{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--eab-border,#39445e);padding-bottom:10px}',
    '.eab-result-header h2{margin:0;font-size:18px}',
    '.eab-result-list{overflow:auto;padding:12px 2px}',
    '.eab-result-entry{padding:12px;margin-bottom:10px;border:1px solid var(--eab-border,#39445e);border-radius:8px;background:var(--eab-card-bg,#1e2a4a)}',
    '.eab-result-entry h3{margin:0 0 8px;font-size:14px;overflow-wrap:anywhere}',
    '.eab-result-entry pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:6px 0 12px;padding:8px;border-radius:5px;background:rgba(0,0,0,.2);font:12px var(--eab-mono,monospace)}',
    '.eab-result-entry strong{display:block;margin-top:8px}',
    '.eab-result-files{margin:4px 0 12px;border:1px solid var(--eab-border,#39445e);border-radius:6px;overflow:hidden}',
    '.eab-result-file{display:flex;align-items:center;gap:8px;padding:6px 8px;border-top:1px solid var(--eab-border,#39445e)}',
    '.eab-result-file:first-child{border-top:0}',
    '.eab-result-file-open{flex:1 1 auto;min-width:0;text-align:left;background:none;border:0;padding:0;color:var(--eab-link,#6ea8fe);font:inherit;cursor:pointer;overflow-wrap:anywhere}',
    '.eab-result-file-open:hover{text-decoration:underline}',
    '.eab-result-file-folder{flex:0 0 auto;background:none;border:1px solid var(--eab-border,#39445e);border-radius:5px;color:inherit;font-size:12px;padding:2px 8px;cursor:pointer}',
    '.eab-result-file-folder:hover{border-color:var(--eab-accent,#4a6cf7)}',
    '.eab-result-status{font-weight:600;margin:0 0 8px}',
    '.eab-result-succeeded{color:var(--eab-success,#22c55e)}.eab-result-failed{color:var(--eab-danger,#ef4444)}',
    '.eab-result-running,.eab-result-cancelled{color:var(--eab-warning,#f59e0b)}',
    '.btn-progress-wrap button.btn-primary:disabled{pointer-events:none}',
    '.eab-option-blink{animation:eab-option-blink .33s ease-in-out 3}',
    '@keyframes eab-option-blink{0%,100%{outline:2px solid transparent;outline-offset:1px}50%{outline:2px solid #ef4444;outline-offset:1px}}',
    '.eab-result-empty{padding:12px;color:var(--eab-text-dim,#8899b4)}',
    '.eab-row-error{margin-left:auto;flex:0 1 auto;min-width:0;max-width:48%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--eab-danger,#ef4444)}'
  ].join('');
  document.head.appendChild(css);
  installButtons(document);
  new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.nodeType === 1) installButtons(node);
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResults, { once: true });
  } else {
    initResults();
  }
})();
