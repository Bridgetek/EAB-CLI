(function () {
  'use strict';
  function dropZones() {
    return document.querySelectorAll('.drop-zone[data-for]');
  }
  function markZones(on) {
    var zones = dropZones();
    for (var i = 0; i < zones.length; i++) {
      zones[i].classList.toggle('is-over', !!on);
    }
  }
  function activeZone() {
    var zones = dropZones();
    for (var i = 0; i < zones.length; i++) {
      if (zones[i].offsetWidth || zones[i].offsetHeight || zones[i].getClientRects().length) return zones[i];
    }
    return zones[0] || null;
  }
  function fillField(el, path) {
    el.value = path;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function applyDrop(paths) {
    if (!paths || !paths.length) return;
    var zone0 = activeZone();
    var input = zone0 ? document.getElementById(zone0.getAttribute('data-for')) : null;
    var single = (input && (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA')) ? input : null;
    if (typeof window.eabOnDrop === 'function') {
      if (single) fillField(single, paths[0]);
      try { window.eabOnDrop(paths, zone0); } catch (e) {  }
      return;
    }
    if (single) {
      fillField(single, paths[0]);
    } else {
      var added = false;
      for (var a = 0; a < WB_ADDERS.length && !added; a++) {
        var adder = window[WB_ADDERS[a]];
        if (typeof adder !== 'function') continue;
        try {
          adder(paths);
          added = true;
        } catch (e) {  }
      }
      if (!added && input) fillField(input, paths[0]);
    }
  }
  function installDropZones() {
    var zones = dropZones();
    for (var i = 0; i < zones.length; i++) {
      (function (zone) {
        if (zone.dataset.eabDropWired === '1') return;
        zone.dataset.eabDropWired = '1';
        zone.addEventListener('click', function () {
          var picker = zone.getAttribute('data-picker');
          var el = picker ? document.getElementById(picker) : null;
          if (el) el.click();
        });
      })(zones[i]);
    }
    window.addEventListener('dragover', function (e) {
      if (!dropZones().length) return;
      e.preventDefault();
      markZones(true);
    });
    window.addEventListener('dragleave', function () { markZones(false); });
    window.addEventListener('drop', function (e) {
      if (!dropZones().length) return;
      e.preventDefault();
      markZones(false);
    });
    API_EAB_onDrop(function (msg) { applyDrop(msg.paths); });
  }
  function setProgress(state, percent, text) {
    var $status = $('.progress-status');
    if ($status.length && typeof text === 'string') $status.text(text);
  }
  window.EAB_UI = {
    progress: setProgress
  };
  var WB_ADDERS = ['eabAddFiles', 'addInputFiles', 'addFontFiles', 'addGifFiles', 'addFiles'];
  function shellInit() {
    if (!window.__eabShellInitDone) {
      window.__eabShellInitDone = 1;
      if (window.eabChromeBeforeInit) {
        try { window.eabChromeBeforeInit(); } catch (e) { console.error('[eab] before-init hook failed:', e); }
      }
    }
    installDropZones();
  }
  if (document.readyState === 'loading') { $(shellInit); } else { shellInit(); }
})();
