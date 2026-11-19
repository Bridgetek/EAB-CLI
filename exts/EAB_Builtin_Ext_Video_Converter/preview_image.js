function setPreviewStatus(text) {
  const $el = $('#pv-status');
  if ($el.length) $el.text(text);
}
async function startConvert(batch) {
  const input = state.videoFile;
  if (!input) {
    showError('Select at least one input video before converting.');
    return;
  }
  const batchRun = batch === true;
  state.converting = true;
  $('#btn-convert').prop('disabled', true);
  $('#error-panel').addClass('hidden');
  if (!batchRun) {
    state.results = [];
    state.batchTotal = 1;
    state.batchIndex = 0;
    setTotalProgress(0);
    updateBatchState();
  }
  setPreviewStatus('Converting…');
  await convertOne(input, state.batchIndex, state.batchTotal);
  if (batchRun) return;
  state.converting = false;
  updateBatchState();
}
async function convertOne(file, index, total) {
  setProgress('running', (index / total) * 100, 'File ' + (index + 1) + '/' + total + ' — converting (ffmpeg)…');
  const result = await convertViaJob(file);
  onConvertComplete(result);
  return result;
}
function onConvertComplete(result) {
  const total = state.batchTotal || 1;
  const idx = state.batchIndex || 0;
  const failed = !!result && result.success === false;
  state.results.push(result);
  const pct = ((idx + 1) / total) * 100;
  setTotalProgress(pct);
  setProgress(failed ? 'failed' : 'done', pct, (idx + 1) + '/' + total + (failed ? ' failed' : ' converted'));
  setPreviewStatus(failed ? 'Failed' : 'Completed');
  if (idx < total - 1) return;
  if (failed) {
    showError(result.error || 'Unknown conversion error');
    resetConvertState();
    return;
  }
  $('#btn-open-dir').prop('disabled', false);
  resetConvertState();
}
function cancelConvert() {
  state.converting = false;
  updateBatchState();
}
function resetConvertState() {
  state.jobId = null;
  updateBatchState();
}
function loadMediaPreview(path) {
  if (!path) {
    _mediaPath = '';
    _mediaToken++;
    setMediaSource('pv-media', 'pv-player', '');
    return;
  }
  if (path === _mediaPath) return;
  _mediaPath = path;
  resetMediaProxyFlags();
  const token = ++_mediaToken;
  eabSampleData(path).then((res) => {
    if (token !== _mediaToken) return;
    // A too-large or unreadable file still gets a chance through the ffmpeg proxy.
    if (!res || !res.ok || !res.data) return requestMediaProxy(token);
    setMediaSource('pv-media', 'pv-player', res.data);
  });
}
