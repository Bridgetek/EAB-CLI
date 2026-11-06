function buildVideoArgs(file) {
  const chipFamily = chipGroup();
  const outputDir = $('#output-dir').val() || '.';
  const width = parseInt($('#width').val()) || 1920;
  const height = parseInt($('#height').val()) || 1200;
  const frameRate = parseFloat($('#frame-rate').val()) || 0;
  const ffmpegOptions = $('#ffmpeg-options').val().trim();
  const controlBitrate = $('#control-bitrate').prop('checked');
  const keepAudio = $('#keep-audio').prop('checked');
  const sampleRate = parseInt($('#sample-rate').val()) || 0;
  const audioFormat = parseInt($('#audio-format').val()) || 3;
  const audioChannel = $('#audio-channel').val();
  const cliArgs = [
    '-i', file,
    '-r', width + ':' + height,
    '-o', outputDir,
  ];
  if (controlBitrate) {
    const avg = $('#avg-bitrate').val() || '32000';
    const max = $('#max-bitrate').val() || '32000';
    const buf = $('#buffer-size').val() || '2048';
    cliArgs.push('-a', avg + 'k', '-m', max + 'k', '-b', buf + 'k');
  } else {
    const quality = parseInt($('#quality').val()) || 3;
    cliArgs.push('-q', String(quality));
  }
  if (keepAudio) {
    cliArgs.push('-s', String(sampleRate));
    if (chipFamily === 'bt82x') {
      cliArgs.push('-f', String(audioFormat));
      if (audioFormat === 3) cliArgs.push('-c', audioChannel);
    }
  } else {
    cliArgs.push('-s', '-1');
  }
  if (ffmpegOptions) cliArgs.push('-p', ffmpegOptions);
  if (frameRate > 0) cliArgs.push('-t', frameRate.toString());
  return {
    command: (chipGeneration() || 'ft80x') + ' video',
    cliArgs: cliArgs,
  };
}
async function convertViaJob(file) {
  const startedAt = Date.now();
  const { command, cliArgs } = buildVideoArgs(file);
  setRowState(file, 'converting', undefined, startedAt);
  if (rowMeta[file]) rowMeta[file].label = 'Converting to MJPEG';
  paintRow(file, startedAt);
  startRowTicker();
  const settle = (name, detail) => {
    const ms = Date.now() - startedAt;
    delete jobIds[file];
    setRowState(file, name, ms);
    if (rowMeta[file]) {
      rowMeta[file].resultText = name === 'done' ? 'success in ' + fmtSecs(ms)
        : name === 'cancelled' ? 'cancelled'
          : failureText(detail);
    }
    paintRow(file);
    log((name === 'done' ? '✓ ' : name === 'failed' ? '✗ ' : '⊘ ') + baseName(file) +
      ' in ' + fmtSecs(ms) + (name === 'failed' ? ' — ' + failureText(detail) : ''));
  };
  try {
    const resp = await invokeHost('startJob', { command: command, args: cliArgs });
    if (!resp || !resp.ok || !resp.jobId) {
      throw new Error((resp && resp.error) || 'Could not start the job');
    }
    state.jobId = resp.jobId;
    jobIds[file] = resp.jobId;
    for (;;) {
      await new Promise(r => setTimeout(r, 250));
      let p = null;
      try { p = await invokeHost('pollJob', { jobId: resp.jobId }); } catch (e) { continue; }
      if (!p || !p.ok || !p.progress) continue;
      const st = p.progress.status;
      if (st === 0 || st === 1) continue;
      if (st === 2) {
        settle('done', p.progress.result);
        try { return JSON.parse(p.progress.result || '{}'); } catch (e) { return { success: true }; }
      }
      if (st === 3) {
        settle('failed', p.progress.result);
        return { success: false, error: failureText(p.progress.result) };
      }
      settle('cancelled', '');
      return { success: false, error: 'Cancelled' };
    }
  } catch (err) {
    settle('failed', '');
    return { success: false, error: String(err && err.message ? err.message : err) };
  }
}
function invokeHost(cmd, args) {
  switch (cmd) {
    case 'execute_extension_command':
      return API_EAB_runCli({ command: args.cliCommand, args: args.cliArgs }).then(resp => {
        if (resp.ok && resp.detail) return resp.detail;
        return Promise.reject(resp.error || (resp.result || 'Command failed'));
      });
    case 'startJob':
      return API_EAB_startJob({ command: args.command, args: args.args });
    case 'pollJob':
      return API_EAB_pollJob({ jobId: args.jobId });
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
    default:
      return Promise.reject('Unknown host command: ' + cmd);
  }
}
