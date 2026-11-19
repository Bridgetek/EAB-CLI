function renderRecent() {
  const $list = $('#recent-list');
  if (!state.recent.length) {
    $list.html('<div class="file-list-empty">No recent sessions yet.</div>');
    return;
  }
  $list.html(state.recent.map((item, index) => {
    return '' +
      '<div class="file-item clickable' + (item.exists ? '' : ' missing') + ' list-group-item">' +
        '<span class="lbl" onclick="loadSession(' + JSON.stringify(item.path).replace(/"/g, '&quot;') + ')" ' +
              'title="' + escapeHtml(item.path) + '">' +
          '<strong>' + (index + 1) + '.</strong> ' + escapeHtml(item.path) +
        '</span>' +
        '<button class="remove" title="Remove from list" ' +
                'onclick="removeRecent(' + JSON.stringify(item.path).replace(/"/g, '&quot;') + ')">✕</button>' +
      '</div>';
  }).join(''));
}
function renderCurrent() {
  const $empty = $('#session-empty');
  const s = state.current;
  if (!s) {
    $empty.removeClass('hidden');
    $('#session-stats').empty();
    return;
  }
  $empty.addClass('hidden');
  $('#session-stats').html([
    ['Session File', s.path],
  ].map(([label, value]) => `
    <div class="stat-item wide">
      <span class="stat-label">${escapeHtml(label)}</span>
      <span class="stat-value">${escapeHtml(value || '—')}</span>
    </div>
  `).join(''));
}
