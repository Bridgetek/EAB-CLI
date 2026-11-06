const EXT_ID = 'session';
const SESSION_UI_STORAGE_PREFIX = 'eab.session.ui.v1:';
const ACTIVE_SESSION_PATH_KEY = 'eab.session.active-path.v1';
const AUTO_SAVE_KEY = 'eab.session.autosave.v1';
const AUTO_SAVE_AT_KEY = 'eab.session.autosave-at.v1';
const PENDING_MENU_ACTION_KEY = 'eab.menu.pending.session';
const SESSION_UI_UTILITY_KEY = 'eab_tools_workspace';
// v1 stored canvas data: URIs; v2 keeps only light text/control/list state.
const SESSION_UI_VERSIONS = [1, 2];
function isSessionSnapshot(snapshot) {
  return !!snapshot && SESSION_UI_VERSIONS.indexOf(snapshot.version) >= 0;
}
// A v1 snapshot may carry base64 canvas images; the session file must stay
// light, so only the text/control/list parts are kept when it is written.
const SNAPSHOT_MAX_TEXT = 8000;
const SNAPSHOT_MAX_VALUE = 4096;
function lightControl(control) {
  if (!control || typeof control !== 'object') return null;
  const value = typeof control.value === 'string' ? control.value : '';
  const light = value.length <= SNAPSHOT_MAX_VALUE && value.indexOf('data:') !== 0;
  return Object.assign({}, control, { value: light ? value : '' });
}
function lightSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const controls = (Array.isArray(snapshot.controls) ? snapshot.controls : [])
    .map(lightControl)
    .filter(Boolean);
  if (snapshot.version === 2) {
    return Object.assign({}, snapshot, { controls });
  }
  const texts = (Array.isArray(snapshot.outputs) ? snapshot.outputs : [])
    .filter(item => item && item.kind === 'text' && typeof item.data === 'string')
    .map(item => ({
      id: item.id,
      text: item.data.length > SNAPSHOT_MAX_TEXT ? item.data.slice(0, SNAPSHOT_MAX_TEXT) : item.data,
    }));
  return { version: 2, controls, texts, lists: [] };
}

function readAutoSave() {
  try {
    return localStorage.getItem(AUTO_SAVE_KEY) !== '0';
  } catch (err) {
    return true;
  }
}
function writeAutoSave(on) {
  try {
    localStorage.setItem(AUTO_SAVE_KEY, on ? '1' : '0');
  } catch (err) {
    log('Cannot persist auto save: ' + err.message);
  }
}
function readAutoSaveAt() {
  try {
    const at = Number(localStorage.getItem(AUTO_SAVE_AT_KEY));
    return Number.isFinite(at) && at > 0 ? at : 0;
  } catch (err) {
    return 0;
  }
}
function writeAutoSaveAt(at) {
  try {
    localStorage.setItem(AUTO_SAVE_AT_KEY, String(at));
  } catch (err) {
    log('Cannot persist the auto save time: ' + err.message);
  }
}
// "just now", "5s ago", "1 min ago", "20 days ago", "1 year ago"…
function relativeTime(ms) {
  if (!ms) return '';
  const secs = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (secs < 5) return 'just now';
  if (secs < 60) return secs + 's ago';
  const mins = Math.round(secs / 60);
  if (mins < 60) return mins + (mins === 1 ? ' min ago' : ' mins ago');
  const hours = Math.round(mins / 60);
  if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
  const days = Math.round(hours / 24);
  if (days < 30) return days + (days === 1 ? ' day ago' : ' days ago');
  const months = Math.round(days / 30);
  if (months < 12) return months + (months === 1 ? ' month ago' : ' months ago');
  const years = Math.round(months / 12);
  return years + (years === 1 ? ' year ago' : ' years ago');
}
function autoSaveLabel() {
  if (!state.autoSave) return 'Auto save (disabled)';
  const at = readAutoSaveAt();
  return at ? 'Auto save (enabled / ' + relativeTime(at) + ')' : 'Auto save (enabled)';
}
function currentSessionLabel() {
  const path = state.current && state.current.path;
  if (!path) return 'No session';
  const slash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return slash >= 0 ? path.slice(slash + 1) : path;
}
function syncHostMenu() {
  if (!isEmbedded() || typeof API_EAB_setMenu !== 'function') return;
  API_EAB_setMenu({
    menu: 'config',
    label: 'Session',
    items: [
      { id: 'current', label: currentSessionLabel(), type: 'info' },
      { id: 'new', label: 'New Session…', type: 'item' },
      { id: 'save', label: 'Save Session', type: 'item' },
      { id: 'autosave', label: autoSaveLabel(), type: 'check', checked: state.autoSave },
      { id: 'restore', label: 'Open / Restore Session…', type: 'item' },
    ],
  }).catch(err => log('Cannot update the Session menu: ' + err.message));
}
function installHostMenuActions() {
  if (typeof API_EAB_onMessage !== 'function') return;
  API_EAB_onMessage('eab-menu-action', msg => handleHostMenuAction(msg && msg.id));
}
// The host stores a menu click made while this page was not open; run it once
// the status call has filled in the session, never before.
function consumePendingMenuAction() {
  let pending = null;
  try {
    pending = localStorage.getItem(PENDING_MENU_ACTION_KEY);
    if (pending) localStorage.removeItem(PENDING_MENU_ACTION_KEY);
  } catch (err) {
    pending = null;
  }
  if (pending) handleHostMenuAction(pending);
}
function handleHostMenuAction(id) {
  switch (id) {
    case 'new':
      openNewSessionDialog();
      break;
    case 'save':
      saveCurrentSession();
      break;
    case 'autosave':
      state.autoSave = !state.autoSave;
      writeAutoSave(state.autoSave);
      syncHostMenu();
      if (state.autoSave) saveCurrentSession(true);
      break;    case 'restore':
      openRestoreDialog();
      break;
    default:
      break;
  }
}

function sessionUiStorageKey(path, extensionId) {
  return SESSION_UI_STORAGE_PREFIX + encodeURIComponent(path) + ':' +
    encodeURIComponent(extensionId);
}
function setActiveSessionPath(path) {
  try {
    localStorage.setItem(ACTIVE_SESSION_PATH_KEY, path);
  } catch (err) {
    throw new Error('Cannot set the active session: ' + err.message);
  }
}
function readSessionSnapshots(path) {
  const snapshots = {};
  const prefix = SESSION_UI_STORAGE_PREFIX + encodeURIComponent(path) + ':';
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const extensionId = decodeURIComponent(key.slice(prefix.length));
      const snapshot = JSON.parse(localStorage.getItem(key));
      const light = isSessionSnapshot(snapshot) ? lightSnapshot(snapshot) : null;
      if (light) snapshots[extensionId] = light;
    }
  } catch (err) {
    throw new Error('Cannot read saved extension state: ' + err.message);
  }
  return snapshots;
}
function mergeSessionUtilityInfo(current, path) {
  const utilityInfo = current && typeof current === 'object' && !Array.isArray(current)
    ? Object.assign({}, current)
    : {};
  const saved = utilityInfo[SESSION_UI_UTILITY_KEY];
  const snapshots = saved && typeof saved === 'object' && !Array.isArray(saved)
    ? Object.assign({}, saved)
    : {};
  const currentSnapshots = readSessionSnapshots(path);
  Object.assign(snapshots, currentSnapshots);
  if (Object.keys(snapshots).length) {
    utilityInfo[SESSION_UI_UTILITY_KEY] = snapshots;
  }
  return utilityInfo;
}
function restoreSessionSnapshots(path, utilityInfo) {
  const snapshots = utilityInfo && utilityInfo[SESSION_UI_UTILITY_KEY];
  if (!snapshots || typeof snapshots !== 'object' || Array.isArray(snapshots)) {
    setActiveSessionPath(path);
    return 0;
  }
  let restored = 0;
  try {
    for (const [extensionId, snapshot] of Object.entries(snapshots)) {
      if (!extensionId || !isSessionSnapshot(snapshot)) continue;
      const light = lightSnapshot(snapshot);
      if (!light) continue;
      localStorage.setItem(sessionUiStorageKey(path, extensionId), JSON.stringify(light));
      restored++;
    }
    setActiveSessionPath(path);
  } catch (err) {
    throw new Error('Cannot restore extension state: ' + err.message);
  }
  return restored;
}

function isEmbedded() {
  return window.parent !== window;
}
function pickFile(title, extensions) {
  if (!isEmbedded()) {
    const path = prompt(title);
    return Promise.resolve(path || null);
  }
  return API_EAB_pickFile({
    filters: [{ name: 'Session file', extensions: extensions }],
    title: title,
  }).then(resp => (resp.ok && resp.path) ? resp.path : null);
}
function pickFolder(title) {
  if (!isEmbedded()) {
    const path = prompt(title);
    return Promise.resolve(path || null);
  }
  return API_EAB_pickFolder({ title: title, extensions: [] })
    .then(resp => (resp.ok && resp.folder) ? resp.folder : null);
}
function log(msg) { console.log('[eab] ' + msg); }
function showError(msg) {
  $('#error-panel').text(String(msg)).removeClass('hidden').trigger('focus');
}
function hideError() {
  $('#error-panel').addClass('hidden');
}
function showWarnings(list) {
  const $panel = $('#warn-panel');
  const items = (list || []).filter(Boolean);
  if (!items.length) {
    $panel.addClass('hidden');
    return;
  }
  $panel.html(items.map(w => '⚠ ' + escapeHtml(w)).join('<br>')).removeClass('hidden');
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function busy(on) {
  $('#progress-fill').css('width', on ? '100%' : '0%');
}
function askConfirm(title, text, okLabel) {
  return new Promise(resolve => {
    state.pendingConfirm = resolve;
    $('#modal-title').text(title);
    $('#modal-text').text(text);
    $('#modal-ok').text(okLabel || 'OK');
    $('#modal-overlay').removeClass('hidden');
  });
}
function closeModal() {
  $('#modal-overlay').addClass('hidden');
  if (state.pendingConfirm) {
    const resolve = state.pendingConfirm;
    state.pendingConfirm = null;
    resolve(false);
  }
}
function confirmModal() {
  $('#modal-overlay').addClass('hidden');
  if (state.pendingConfirm) {
    const resolve = state.pendingConfirm;
    state.pendingConfirm = null;
    resolve(true);
  }
}
function defaultSessionFileName() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const stamp = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) +
    '_' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
  return 'eab_session_' + stamp + '.eab';
}
function newSessionPath() {
  return String($('#new-session-path').val() || '').trim();
}
function updatePathHint() {
  const path = newSessionPath();
  $('#new-session-path-hint').text(path ? ('Will be written to: ' + path) : '');
}
function applyDefaults() {
  updatePathHint();
}
async function refresh() {
  busy(true);
  hideError();
  try {
    const r = await runCli(['-a', 'status']);
    state.defaults = r.defaults || null;
    state.recent = r.recent || [];
    state.current = r.current || null;
    if (state.current && state.current.path) setActiveSessionPath(state.current.path);
    state.autoSave = readAutoSave();
    applyDefaults();
    renderRecent();
    renderCurrent();
    showWarnings(r.warnings);
  } catch (err) {
    showError(err.message);
  } finally {
    busy(false);
  }
  syncHostMenu();
  consumePendingMenuAction();
}
