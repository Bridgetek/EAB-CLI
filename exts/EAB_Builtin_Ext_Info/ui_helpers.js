const EXT_ID = 'info';
function isEmbedded() {
  return window.parent !== window;
}
function pickDocument() {
  return API_EAB_pickFile({
    filters: [
      { name: 'Documents', extensions: ['pdf', 'md', 'html', 'txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    title: 'Select a document',
  }).then(resp => (resp.ok && resp.path) ? resp.path : null);
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function log(msg) { console.log('[eab] ' + msg); }
function showError(msg) {
  $('#error-panel').text(String(msg)).removeClass('hidden');
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
function busy(on) {
  state.busy = on;
  $('#btn-refresh').prop('disabled', on);
  $('#progress-fill').css('width', on ? '100%' : '0%');
}
function showTab(name) {
  const info = name === 'info';
  $('#tab-info').toggleClass('active', info);
  $('#tab-guide').toggleClass('active', !info);
  $('#tab-btn-info').toggleClass('active', info);
  $('#tab-btn-guide').toggleClass('active', !info);
}
