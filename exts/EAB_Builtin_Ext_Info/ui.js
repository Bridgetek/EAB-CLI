async function refresh() {
  busy(true);
  hideError();
  try {
    const r = await runCli(['-a', 'about']);
    state.about = r.about_html || '';
    state.aboutSource = r.about_source || '';
    state.documents = r.documents || [];
    state.paths = r.paths || {};
    state.terminal = r.terminal || null;
    state.links = r.links || null;
    $('#app-version').text(r.version || '—');
    $('#app-subtitle').text(r.app_subtitle || '');
    $('#app-title').text(r.app_name || 'EVE Asset Builder');
    if (state.terminal && state.terminal.batch_path) {
      $('#batch-path').text(state.terminal.batch_path);
    }
    renderAbout();
    renderDocs();
    showWarnings(r.warnings);
  } catch (err) {
    showError(err.message);
  } finally {
    busy(false);
  }
}
function aboutHtml() {
  const shim = [
    '<scr' + 'ipt>',
    'window.onclick = function (e) {',
    '  for (var n = e.target; n; n = n.parentNode) {',
    "    if (n.nodeName === 'A') { e.preventDefault(); return; }",
    '  }',
    '};',
    '</scr' + 'ipt>',
  ].join('\n');
  return (state.about || '<p>About information is not available.</p>') + shim;
}
function renderAbout() {
  $('#about-frame').prop('srcdoc', aboutHtml());
  $('#about-source').text(state.aboutSource ? ('Source: ' + state.aboutSource) : '');
}
async function openPath(path) {
  busy(true);
  hideError();
  try {
    await runCli(['-a', 'open', '-p', path]);
  } catch (err) {
    showError(err.message);
    log('ERROR: ' + err.message);
  } finally {
    busy(false);
  }
}
async function openDoc(key) {
  busy(true);
  hideError();
  try {
    await runCli(['-a', 'open', '-k', key]);
  } catch (err) {
    showError(err.message);
    log('ERROR: ' + err.message);
  } finally {
    busy(false);
  }
}
async function openTerminal() {
  busy(true);
  hideError();
  try {
    await runCli(['-a', 'terminal']);
  } catch (err) {
    showError(err.message);
    log('ERROR: ' + err.message);
  } finally {
    busy(false);
  }
}
async function browseDocument() {
  const path = await pickDocument();
  if (!path) return;
  await openPath(path);
}
async function openDocDir() {
  const dir = state.paths.doc_dir;
  if (!dir) {
    showError('No documentation folder was found. Set EAB_DOC_DIR to a folder holding the guides.');
    return;
  }
  API_EAB_openOutputLocation({ path: dir });
}
function docsHtml() {
  if (!state.documents.length) {
    return '<div class="file-list-empty">No documentation catalogue available.</div>';
  }
  return state.documents.map(doc => {
    const meta = doc.exists ? humanSize(doc.size) : 'not found';
    const button = doc.exists
      ? '<button class="open" onclick="openDoc(' +
          JSON.stringify(doc.key).replace(/"/g, '&quot;') + ')">Open</button>'
      : '';
    const title = doc.path ? (' title="' + escapeHtml(doc.path) + '"') : '';
    return '<div class="file-item' + (doc.exists ? '' : ' missing') + '"' + title + '>' +
      '<span class="lbl">' + (doc.exists ? '📘 ' : '◻ ') + escapeHtml(doc.title) + '</span>' +
      '<span class="meta">' + escapeHtml(doc.kind) + ' · ' + meta + '</span>' +
      button +
      '</div>';
  }).join('');
}
function renderDocs() {
  $('#doc-list').html(docsHtml());
}
function init() {
  refresh();
}
if (document.readyState === 'loading') {
  $(init);
} else {
  init();
}
