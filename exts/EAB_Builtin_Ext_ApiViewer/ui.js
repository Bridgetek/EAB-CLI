(function ($) {
  'use strict';

  var CATALOG = null;
  var SELECTED = null;
  var FILTER = { cat: 'all', q: '' };

  var STATUS_CLASS = { stable: 'api-badge-stable', beta: 'api-badge-beta', deprecated: 'api-badge-deprecated' };

  function embed() { return window.parent !== window; }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(text) {
    var $t = $('#api-toast').text(text).removeClass('hidden');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { $t.addClass('hidden'); }, 2200);
  }

  function fail(text) {
    $('#api-error').text(text).removeClass('hidden');
  }

  function note(text) {
    $('#api-list').html('<div class="file-list-empty">' + esc(text) + '</div>');
  }

  function sortHistory(entry) {
    return (entry.history || []).slice().sort(function (a, b) {
      var pa = String(a.version).split('.').map(Number);
      var pb = String(b.version).split('.').map(Number);
      for (var i = 0; i < 3; i++) {
        var d = (pb[i] || 0) - (pa[i] || 0);
        if (d) return d;
      }
      return 0;
    });
  }

  function latest(entry) {
    var list = sortHistory(entry);
    return list.length ? list[0] : null;
  }

  function isChanged(entry) {
    if (!CATALOG) return false;
    var top = latest(entry);
    return !!top && String(top.version).indexOf(String(CATALOG.version)) === 0;
  }

  function signature(entry) {
    var args = (entry.payload || []).map(function (p) { return p.name; }).join(', ');
    return entry.api + '(' + args + ');';
  }

  function cats() {
    var seen = {};
    var out = [];
    (CATALOG.apis || []).forEach(function (a) {
      if (a.kind === 'helper') return;
      if (!seen[a.category]) { seen[a.category] = 0; }
      seen[a.category]++;
    });
    Object.keys(seen).sort().forEach(function (key) { out.push({ id: key, count: seen[key] }); });
    return out;
  }

  function visible() {
    var q = FILTER.q.trim().toLowerCase();
    return (CATALOG.apis || []).filter(function (a) {
      if (FILTER.cat === 'helper' && a.kind !== 'helper') return false;
      if (FILTER.cat !== 'all' && FILTER.cat !== 'helper' && a.category !== FILTER.cat) return false;
      if (!q) return true;
      var hay = [a.api, a.command || '', a.summary, a.category, a.status,
        (a.history || []).map(function (h) { return h.change; }).join(' ')].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }

  function renderCats() {
    var all = cats();
    var items = [{ id: 'all', label: 'All', count: (CATALOG.apis || []).length }];
    all.forEach(function (c) { items.push({ id: c.id, label: c.id, count: c.count }); });
    var helpers = (CATALOG.apis || []).filter(function (a) { return a.kind === 'helper'; }).length;
    if (helpers) items.push({ id: 'helper', label: 'helpers', count: helpers });
    $('#api-cats').html(items.map(function (c) {
      return '<button type="button" class="cat-chip' + (c.id === FILTER.cat ? ' is-on' : '') +
        '" data-cat="' + esc(c.id) + '">' + esc(c.label) + ' · ' + c.count + '</button>';
    }).join(''));
  }

  function renderList() {
    var list = visible();
    $('#api-count').text(list.length + ' of ' + (CATALOG.apis || []).length + ' APIs · catalogue ' +
      CATALOG.version + (CATALOG.released ? ' · ' + CATALOG.released : ''));
    if (!list.length) return note('Nothing matches that filter.');
    $('#api-list').html(list.map(function (a) {
      var top = latest(a);
      return '<button type="button" class="api-row' + (SELECTED === a.api ? ' is-on' : '') +
        '" data-api="' + esc(a.api) + '" title="' + esc(a.summary) + '">' +
        '<span class="api-dot' + (isChanged(a) ? ' is-changed' : '') + '"></span>' +
        '<span class="api-row-name">' + esc(a.api) + '</span>' +
        '<span class="api-row-meta">' + esc(a.kind === 'helper' ? 'helper' : (a.command || '')) +
        ' · v' + esc(a.version) + (top && top.version !== a.version ? ' · ' + esc(top.version) : '') +
        '</span></button>';
    }).join(''));
  }

  function fieldTable(rows) {
    return (rows || []).map(function (f) {
      return '<div class="api-field">' +
        '<span class="api-field-name">' + esc(f.name) +
        (f.required ? '<span class="api-field-req"> *</span>' : '') + '</span>' +
        '<span class="api-field-type">' + esc(f.type) + '</span>' +
        '<span class="api-field-desc">' + esc(f.description) + '</span>' +
        '</div>';
    }).join('');
  }

  function renderDetail(entry) {
    SELECTED = entry ? entry.api : null;
    if (!entry) {
      $('#api-empty').removeClass('hidden');
      $('#api-body').addClass('hidden');
      $('#api-status').addClass('hidden');
      $('#api-title').text('📖 API detail');
      renderList();
      return;
    }
    $('#api-empty').addClass('hidden');
    $('#api-body').removeClass('hidden');
    $('#api-title').text('📖 ' + entry.api);
    $('#api-status').removeClass('hidden').text(entry.status)
      .attr('class', 'api-badge ' + (STATUS_CLASS[entry.status] || 'api-badge-muted'));
    $('#api-kind').text(entry.kind === 'helper' ? 'helper function' : 'bridge command');
    $('#api-category').text(entry.category);
    $('#api-since').text('since ' + entry.since);
    $('#api-detail-version').text('version ' + entry.version);
    $('#api-summary').text(entry.summary);
    $('#api-sig').text(signature(entry));
    $('#api-payload').html(fieldTable(entry.payload));
    $('#api-payload-block').toggleClass('hidden', !(entry.payload || []).length);
    $('#api-returns').html(fieldTable(entry.returns));
    $('#api-returns-block').toggleClass('hidden', !(entry.returns || []).length);
    $('#api-example').text(entry.example);
    var hist = sortHistory(entry);
    $('#api-history').html(hist.length ? hist.map(function (h) {
      return '<div class="hist-row">' +
        '<span class="hist-meta">' + (h.version ? 'v' + esc(h.version) : 'earlier') +
        (h.date ? ' · ' + esc(h.date) : '') + '</span>' +
        '<span class="hist-text">' + esc(h.change) + '</span></div>';
    }).join('') : '<div class="hint">No recorded change since it was introduced.</div>');
    renderList();
  }

  function renderReleases() {
    var rel = CATALOG.releases || [];
    $('#release-list').html(rel.length ? rel.map(function (r) {
      return '<div class="hist-row">' +
        '<span class="hist-meta">' + esc(r.version) + (r.date ? ' · ' + esc(r.date) : '') + '</span>' +
        '<span class="hist-text">' + r.changes.map(function (c) { return '• ' + esc(c); }).join('<br>') +
        '</span></div>';
    }).join('') : '<div class="hint">The host did not publish release notes.</div>');
    $('#api-note').text(CATALOG.note || '');
  }

  function select(api) {
    var entry = (CATALOG.apis || []).filter(function (a) { return a.api === api; })[0] || null;
    renderDetail(entry);
  }

  function copyExample() {
    var text = $('#api-example').text();
    if (!text) return;
    var done = function () { toast('Example copied.'); };
    var fallback = function () {
      var $ta = $('<textarea>').val(text).css({ position: 'fixed', top: '-1000px' }).appendTo('body');
      $ta[0].select();
      try { document.execCommand('copy'); done(); }
      catch (e) { toast('Select the example and copy it manually.'); }
      $ta.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else {
      fallback();
    }
  }

  function renderHead() {
    $('#api-version').text('v' + CATALOG.version);
    $('#api-version').attr('title', 'catalogue ' + CATALOG.version + ' · bridge ' + CATALOG.shell);
  }

  function loadApis() {
    $('#api-error').addClass('hidden');
    if (!embed()) {
      note('The API catalogue is answered by the host — open this page inside EAB Tools.');
      $('#api-count').text('');
      return;
    }
    note('Reading the host catalogue…');
    API_EAB_listApis({}).then(function (r) {
      if (!r || !r.ok || !r.apis) return fail(r && r.error ? r.error : 'The host did not answer listApis.');
      CATALOG = r;
      renderHead();
      renderCats();
      renderList();
      renderReleases();
      renderDetail(SELECTED ? (r.apis.filter(function (a) { return a.api === SELECTED; })[0] || null) : null);
    }).catch(function (e) {
      fail(String(e && e.message ? e.message : e));
    });
  }

  $(function () {
    $('#api-search').on('input', function () {
      FILTER.q = String($(this).val() || '');
      if (CATALOG) renderList();
    });
    $('#api-cats').on('click', '.cat-chip[data-cat]', function () {
      FILTER.cat = String($(this).attr('data-cat'));
      renderCats();
      renderList();
    });
    $('#api-list').on('click', '.api-row[data-api]', function () {
      select(String($(this).attr('data-api')));
    });
    loadApis();
  });

  window.loadApis = loadApis;
  window.copyExample = copyExample;

})(jQuery);
