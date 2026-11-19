async function startConvert() {
  if (gifBatchRunning) return;
  const path = state.gifFile || gifFiles[0];
  if (!path) {
    showError('Please select a GIF file first.');
    return;
  }
  $('#error-panel').addClass('hidden');
  gifBatchRunning = true;
  updateBatchState();
  setTotalProgress(0);
  const ok = await convertViaJob(path);
  gifBatchRunning = false;
  updateBatchState();
  if (ok) setTotalProgress(100);
}
function convertViaJob(path) {
  return new Promise((resolve) => {
    const { command, cliArgs } = buildCliArgs(path);
    const total = gifFiles.length;
    const index = gifFiles.indexOf(path) + 1;
    const step = total > 1 ? index + '/' + total + ' — ' : '';
    const name = fileName(path);
    const t0 = Date.now();
    rowMeta[path] = { state: 'converting', resultText: '', label: 'Converting animation', running: true, t0: t0, ms: 0 };
    paintRow(path);
    setRunStatus('Converting ' + step + name + '…');
    const tick = setInterval(() => {
      paintRow(path);
      setRunStatus('Converting ' + step + name + ' — ' + fmtSecs(Date.now() - t0) + '…');
    }, 200);
    let settled = false;
    const finish = (ok, state, detail) => {
      if (settled) return;
      settled = true;
      clearInterval(tick);
      const m = rowMeta[path];
      m.running = false;
      m.ms = Date.now() - m.t0;
      m.state = state;
      m.resultText = ok ? 'success in ' + fmtSecs(m.ms)
        : state === 'cancelled' ? 'cancelled' : failureText(detail);
      paintRow(path);
      setRunStatus(ok ? '✓ ' + step + name + ' — ' + m.resultText
        : (state === 'cancelled' ? '⊘ ' + step + name + ' — cancelled' : '✗ ' + step + name + ' — ' + m.resultText));
      console.log('[eab] ' + (ok ? '✓ ' : state === 'cancelled' ? '⊘ ' : '✗ ') + name + ' in ' + fmtSecs(m.ms));
      resolve(ok);
    };
    invokeHost('startJob', { command, args: cliArgs }).then((resp) => {
      if (!resp || !resp.ok || !resp.jobId) { finish(false, 'failed', (resp && resp.error) || ''); return; }
      rowMeta[path].jobId = resp.jobId;
      const poll = setInterval(() => {
        invokeHost('pollJob', { jobId: resp.jobId }).then((p) => {
          if (settled || !p || !p.ok || !p.progress) return;
          const st = p.progress.status;
          if (st === 2) { clearInterval(poll); finish(true, 'done', p.progress.result); }
          else if (st === 3) { clearInterval(poll); finish(false, 'failed', p.progress.result); }
          else if (st === 4) { clearInterval(poll); finish(false, 'cancelled', ''); }
        }).catch(() => {  });
      }, 250);
    }).catch((err) => finish(false, 'failed', String(err || '')));
  });
}
