let creatingSession = false;

function openNewSessionDialog() {
  $('#new-session-path').val('./' + defaultSessionFileName());
  updatePathHint();
  $('#new-session-overlay').removeClass('hidden');
  $('#new-session-path').trigger('focus');
}
function closeNewSessionDialog() {
  if (creatingSession) return;
  $('#new-session-overlay').addClass('hidden');
}
async function browseNewSessionPath() {
  $('#browse-session-overlay').removeClass('hidden');
}
function closeBrowseSession() {
  $('#browse-session-overlay').addClass('hidden');
}
async function selectNewSessionFile() {
  closeBrowseSession();
  const selected = await pickFile('Select session file', ['eab']);
  if (!selected) return;
  $('#new-session-path').val(selected);
  updatePathHint();
}
async function selectNewSessionFolder() {
  closeBrowseSession();
  const selected = await pickFolder('Select session folder');
  if (!selected) return;
  const path = selected.replace(/[\\/]+$/, '') + '\\' + defaultSessionFileName();
  $('#new-session-path').val(path);
  updatePathHint();
}

async function createSession(force) {
  if (creatingSession) return;
  const path = newSessionPath();
  if (!path) {
    showError('Select a session file path.');
    return;
  }
  const separator = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  const folder = separator < 0 ? '.' : path.slice(0, separator) || path.slice(0, 1);
  const name = path.slice(separator + 1);
  if (!name || !name.toLowerCase().endsWith('.eab')) {
    showError('The session file name must end with .eab.');
    return;
  }
  let retry = false;
  creatingSession = true;
  busy(true);
  hideError();
  const args = ['-a', 'new', '-s', folder, '-n', name];
  if (force) args.push('-f');
  try {
    const r = await runCli(args);
    log('Session created: ' + r.session.path);
    showWarnings(r.warnings);
    setActiveSessionPath(r.session.path);
    renderResult('Session created', [
      ['Size', r.size + ' bytes'],
      ['Session File', r.session.path],
    ], [r.session.path]);
    state.current = r.session;
    $('#new-session-overlay').addClass('hidden');
    renderCurrent();
    await refresh();
  } catch (err) {
    if (/refuses to overwrite/i.test(err.message)) {
      const ok = await askConfirm(
        'Session file exists',
        newSessionPath() + ' already exists. Overwrite it?',
        'Overwrite',
      );
      retry = ok;
    } else {
      showError(err.message);
      showWarnings(err.result && err.result.warnings);
      log('ERROR: ' + err.message);
    }
  } finally {
    busy(false);
    creatingSession = false;
  }
  if (retry) return createSession(true);
}

$(function () {
  $('#new-session-folder, #new-session-name').on('input', updatePathHint);
  $('#new-session-overlay').on('click', ev => {
    if (ev.target === $('#new-session-overlay').get(0)) closeNewSessionDialog();
  });
});
