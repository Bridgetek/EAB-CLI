async function removeRecent(path) {
  try {
    const r = await runCli(['-a', 'recent-remove', '-p', path]);
    state.recent = r.recent || [];
    renderRecent();
  } catch (err) {
    showError(err.message);
  }
}
async function pruneRecent() {
  try {
    const r = await runCli(['-a', 'recent-prune']);
    state.recent = r.recent || [];
    renderRecent();
  } catch (err) {
    showError(err.message);
  }
}
async function clearRecent() {
  const ok = await askConfirm('Clear the recent list?',
    'The session files themselves are not deleted.', 'Clear');
  if (!ok) return;
  try {
    await runCli(['-a', 'recent-clear']);
    state.recent = [];
    renderRecent();
  } catch (err) {
    showError(err.message);
  }
}

function sessionChoices() {
  const seen = new Set();
  const list = [];
  const add = (path) => {
    if (!path) return;
    const key = String(path).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    list.push(path);
  };
  if (state.current && state.current.path) add(state.current.path);
  (state.recent || []).forEach(item => add(item && item.path));
  return list;
}
function renderRestoreList() {
  const $list = $('#restore-list');
  const choices = sessionChoices();
  if (!choices.length) {
    $list.html('<div class="file-list-empty">No session files found yet.</div>');
    return;
  }
  $list.html(choices.map((path, index) => {
    const quoted = JSON.stringify(path).replace(/"/g, '&quot;');
    return '' +
      '<div class="file-item clickable">' +
        '<span class="lbl" onclick="restoreSession(' + quoted + ')" title="' + escapeHtml(path) + '">' +
          '<strong>' + (index + 1) + '.</strong> ' + escapeHtml(path) +
        '</span>' +
      '</div>';
  }).join(''));
}
function openRestoreDialog() {
  hideError();
  renderRestoreList();
  $('#restore-overlay').removeClass('hidden');
}
function closeRestoreDialog() {
  $('#restore-overlay').addClass('hidden');
}
async function browseRestoreSession() {
  const path = await pickFile('Select Session File', ['eab']);
  if (!path) return;
  closeRestoreDialog();
  await restoreSession(path);
}

function installAutoSave() {
  // Extension snapshots land in localStorage from other windows, so the
  // session flushes on a timer instead of reacting to local UI events.
  setInterval(() => {
    if (state.autoSave && state.current && state.current.path) saveCurrentSession(true);
  }, 60000);
  // The menu label carries a relative time, so it has to be re-sent as it ages.
  setInterval(syncHostMenu, 15000);
}

function renderResult(title, rows, files) {
  const detail = rows.map(([label, value]) => label + '=' + (value || '—')).join(', ');
  log(title + (detail ? ' (' + detail + ')' : '') +
    (files && files.length ? ' → ' + files.join(', ') : ''));
}
$(function () {
  $('#modal-overlay').on('click', ev => {
    if (ev.target === $('#modal-overlay').get(0)) closeModal();
  });
  $('#restore-overlay').on('click', ev => {
    if (ev.target === $('#restore-overlay').get(0)) closeRestoreDialog();
  });
  installHostMenuActions();
  installAutoSave();
  refresh();
});
