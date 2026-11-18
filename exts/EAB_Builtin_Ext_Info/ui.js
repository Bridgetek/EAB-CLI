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
    renderAbout();
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
    "    if (n.nodeName === 'A') {",
    '      e.preventDefault();',
    "      var href = n.getAttribute('href') || '';",
    "      window.parent.postMessage({ type: 'about-link', href: href }, '*');",
    '      return;',
    '    }',
    '  }',
    '};',
    '</scr' + 'ipt>',
  ].join('\n');
  return (state.about || '<p>About information is not available.</p>') + shim;
}

function renderAbout() {
  $('#about-frame').prop('srcdoc', aboutHtml());
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

async function openExternalUrl(url) {
  if (isEmbedded() && typeof API_EAB_openUrl === 'function') {
    const resp = await API_EAB_openUrl({ url: url });
    if (resp && resp.ok) return;
  }
  await openPath(url);
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

function base64ToBlobUrl(b64, mime) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mime || 'application/pdf' });
  return URL.createObjectURL(blob);
}

async function loadUserGuide() {
  if (state.guideBlobUrl) {
    $('#guide-status').addClass('hidden');
    $('#guide-frame').removeClass('hidden');
    return;
  }
  if (state.guideLoading) return;
  state.guideLoading = true;
  const $status = $('#guide-status');
  const $frame = $('#guide-frame');
  $frame.addClass('hidden');
  $status.removeClass('error').text('Loading EAB User Guide…').removeClass('hidden');
  try {
    const r = await runCli(['-a', 'pdf', '-k', 'user_guide']);
    if (!r || !r.base64) {
      throw new Error('EAB User Guide PDF content is empty.');
    }
    state.guideBlobUrl = base64ToBlobUrl(r.base64, r.mime_type || 'application/pdf');
    $frame.attr('src', state.guideBlobUrl).removeClass('hidden');
    $status.addClass('hidden');
  } catch (err) {
    $status.addClass('error').text('⚠ ' + (err && err.message ? err.message : String(err))).removeClass('hidden');
    log('ERROR: ' + (err && err.message ? err.message : String(err)));
  } finally {
    state.guideLoading = false;
  }
}

window.addEventListener('message', function (e) {
  const data = e && e.data;
  if (!data || data.type !== 'about-link') return;
  const href = String(data.href || '').trim();
  if (!href) return;
  if (href === 'open_commmand_prompt') {
    openTerminal();
  } else if (href === 'eab_user_guide') {
    openDoc('user_guide');
  } else if (href === 'extension_user_guide') {
    openDoc('extension_guide');
  } else if (/^https?:\/\//i.test(href)) {
    openExternalUrl(href);
  }
});

function init() {
  refresh();
}

if (document.readyState === 'loading') {
  $(init);
} else {
  init();
}
