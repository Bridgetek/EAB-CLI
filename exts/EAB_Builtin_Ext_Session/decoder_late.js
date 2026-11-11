async function loadSession(path) {
  busy(true);
  hideError();
  try {
    const r = await runCli(['-a', 'load', '-p', path]);
    log('Session loaded: ' + r.session.path);
    renderResult('Session loaded', [
      ['Size', r.size + ' bytes'],
      ['Utility Sections', String(r.utility_count)],
      ['Session File', r.session.path],
    ], [r.session.path]);
    showWarnings(r.warnings);
    setActiveSessionPath(r.session.path);
    clearRestorePending();
    state.current = r.session;
    renderCurrent();
    await refresh();
  } catch (err) {
    showError(err.message);
    log('ERROR: ' + err.message);
  } finally {
    busy(false);
  }
}

async function restoreSession(path) {
  const target = path || (state.current && state.current.path);
  if (!target) {
    showError('Create or open a session file before restoring it.');
    return;
  }
  hideError();
  try {
    if (!state.current || state.current.path !== target) {
      const loaded = await runCli(['-a', 'load', '-p', target]);
      state.current = loaded.session;
      renderCurrent();
    }
    const session = state.current;
    const restored = restoreSessionSnapshots(target, session.utility_info || {});
    closeRestoreDialog();
    renderResult('Session restored', [
      ['Session File', target],
      ['Extension States', String(restored)],
    ], [target]);
    showWarnings(restored
      ? ['Saved extension state will be applied when each extension is opened.']
      : ['This session contains no extension-specific snapshots; only its file was reloaded.']);
    log('Session restored: ' + target + ' (' + restored + ' extension state(s))');
    await refresh();
  } catch (err) {
    showError(err.message);
    log('ERROR: ' + err.message);
  }
}

async function saveCurrentSession(silent) {
  if (!state.current || !state.current.path) {
    if (!silent) showError('No session is open yet — create or open one first.');
    return;
  }
  if (!silent) busy(true);
  hideError();
  try {
    setActiveSessionPath(state.current.path);
    const utilityInfo = mergeSessionUtilityInfo(
      state.current.utility_info,
      state.current.path,
    );
    const r = await runCli([
      '-a', 'save',
      '-p', state.current.path,
      '-u', JSON.stringify(utilityInfo),
    ]);
    log('Session saved: ' + r.session.path);
    state.current = r.session;
    writeAutoSaveAt(Date.now());
    renderCurrent();
    if (!silent) {
      renderResult('Session saved', [
        ['Size', r.size + ' bytes'],
        ['Session File', r.session.path],
      ], [r.session.path]);
    }
    await refresh();
  } catch (err) {
    if (!silent) showError(err.message);
    log('ERROR: ' + err.message);
  } finally {
    if (!silent) busy(false);
  }
}
