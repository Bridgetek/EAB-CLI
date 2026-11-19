(function () {
  'use strict';
  function buildAdvanced() {
    var cards = document.querySelectorAll('.card.advanced');
    if (!cards.length) return;
    var parents = [];
    for (var i = 0; i < cards.length; i++) {
      var p = cards[i].parentElement;
      if (p && parents.indexOf(p) === -1) parents.push(p);
    }
    for (var k = 0; k < parents.length; k++) {
      var parent = parents[k];
      var group = [];
      for (var c = 0; c < cards.length; c++) {
        if (cards[c].parentElement === parent) group.push(cards[c]);
      }
      if (!group.length) continue;
      var $details = $('<details class="adv-group border rounded mb-2">');
      var summary = document.createElement('summary');
      summary.className = 'px-3 py-2 fw-medium user-select-none';
      summary.textContent = 'Advanced Options';
      $details.append(summary);
      $details.insertBefore(group[0]);
      for (var g = 0; g < group.length; g++) {
        $details.append(group[g]);
      }
    }
  }
  var LEGACY_THEME = 'builtin-theme-legacy';
  function applyLegacy() {
    if (document.documentElement.getAttribute('data-eab-theme') !== LEGACY_THEME) return;
    var groups = document.querySelectorAll('details.adv-group');
    for (var i = 0; i < groups.length; i++) groups[i].open = true;
  }
  function shellInit() {
    if (!window.__eabShellInitDone) {
      window.__eabShellInitDone = 1;
      if (window.eabChromeBeforeInit) {
        try { window.eabChromeBeforeInit(); } catch (e) { console.error('[eab] before-init hook failed:', e); }
      }
    }
    buildAdvanced();
    applyLegacy();
    window.addEventListener('eab-theme-change', applyLegacy);
  }
  if (document.readyState === 'loading') { $(shellInit); } else { shellInit(); }
})();
