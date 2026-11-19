function runCliJob(cliCommand, cliArgs) {
  return API_EAB_startJob({ command: cliCommand, args: cliArgs }).then(function (resp) {
    if (!resp || !resp.ok || !resp.jobId) throw new Error((resp && resp.error) || 'Could not start the job');
    return new Promise(function (resolve, reject) {
      const poll = setInterval(function () {
        API_EAB_pollJob({ jobId: resp.jobId }).then(function (p) {
          if (!p || !p.ok || !p.progress) return;
          const st = p.progress.status;
          if (st === 0 || st === 1) return;
          clearInterval(poll);
          if (st === 2) {
            resolve(p.progress.result || '{}');
            return;
          }
          let msg = 'Generation failed';
          try {
            const parsed = JSON.parse(p.progress.result || '{}');
            if (parsed && parsed.error) msg = parsed.error;
          } catch (e) { }
          reject(new Error(msg));
        }).catch(function (err) {
          clearInterval(poll);
          reject(new Error((err && err.message) || String(err)));
        });
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
function loadPatches() {
  invokeHost('execute_extension_command', {
    extensionId: 'eve_extension',
    cliCommand: 'eve_extension',
    cliArgs: ['-a'],
  }).then(resultJson => {
    let lines;
    try {
      const obj = JSON.parse(resultJson);
      lines = (obj.error) ? [] : (obj.list_text || '');
      if (!obj.error && !obj.list_text) lines = '';
    } catch (e) {
      lines = resultJson;
    }
    state.patches = parsePatchLines(lines);
    if (state.patches.length === 0) {
      state.patches = FALLBACK_PATCHES.slice();
    }
    renderPatchTable();
  }).catch(() => {
    state.patches = FALLBACK_PATCHES.slice();
    renderPatchTable();
  });
}
function buildJobs() {
  const outDir = $('#output-dir').val() || '.';
  let name = $('#output-name').val();
  if (!name) name = $('#output-name').attr('placeholder');
  const selected = getSelectedPatches();
  const split = $('#split').prop('checked');
  const styles = [];
  if ($('#style-bin').prop('checked')) styles.push('style-bin');
  if ($('#style-c').prop('checked')) styles.push('style-c');
  if ($('#style-py').prop('checked')) styles.push('style-py');
  if ($('#style-json').prop('checked')) styles.push('style-json');
  const jobs = [];
  styles.forEach(id => {
    const cliArgs = ['-o', outDir, '-n', name, styleParam(id)];
    if (split && (id === 'style-c' || id === 'style-py')) {
      cliArgs.push('--split');
    }
    cliArgs.push(...selected);
    jobs.push({ label: $('#' + id).parent().text().trim(), cliArgs });
  });
  return jobs;
}
async function startRun() {
  const jobs = buildJobs();
  if (jobs.length === 0) {
    showError('Please select at least one output style and an output folder.');
    return;
  }
  if (getSelectedPatches().length === 0) {
    showError('Please select at least one patch (base is mandatory and auto-included).');
    return;
  }
  $('#btn-run').prop('disabled', true);
  $('#result-panel').addClass('hidden');
  $('#error-panel').addClass('hidden');
  runBarStart();
  const generated = [];
  let failed = null;
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const started = Date.now();
    runBarStep(i + 1, jobs.length);
    try {
      const resultJson = await invokeHost('execute_extension_command', {
        extensionId: 'eve_extension',
        cliCommand: 'eve_extension',
        cliArgs: job.cliArgs,
      });
      const result = JSON.parse(resultJson);
      if (!result.success) {
        showError('Generation failed: ' + (result.error || 'unknown error'));
        log('ERROR: ' + (result.error || 'unknown error'));
        failed = result.error || 'unknown error';
        break;
      }
      (result.output_files || []).forEach(f => generated.push(f));
      (result.generated || []).forEach(g => log('Generated: ' + g));
      log('✓ step ' + (i + 1) + '/' + jobs.length + ' in ' + ((Date.now() - started) / 1000).toFixed(1) + 's');
    } catch (err) {
      showError('Generation failed: ' + err);
      log('ERROR: ' + err);
      failed = String(err);
      break;
    }
  }
  runBarStop(!failed);
  if (!failed) {
    $('#result-panel').removeClass('hidden');
    const uniq = Array.from(new Set(generated));
    $('#result-stats').html(`
      <div class="stat-item"><span class="stat-label">Styles</span><span class="stat-value">${jobs.length}</span></div>
      <div class="stat-item"><span class="stat-label">Files</span><span class="stat-value">${uniq.length}</span></div>
    `);
    $('#result-files').html('<div class="result-label">Output files</div>' +
      uniq.map(f => `<div class="file-out" onclick="openFile('${f.replace(/'/g, "\\'")}')">📄 ${f}</div>`).join(''));
    log('✓ ' + uniq.length + ' file(s) generated');
  }
  $('#btn-run').prop('disabled', false);
  updateEnable();
}
