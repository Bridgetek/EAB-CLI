(function () {
  'use strict';
  function installTooltips() {
    var els = document.querySelectorAll('.form-label[title], .card-title[title], .input-group-text[title]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el.getAttribute('data-tip')) el.setAttribute('data-tip', el.getAttribute('title'));
      el.removeAttribute('title');
    }
  }
  function shellInit() {
    if (!window.__eabShellInitDone) {
      window.__eabShellInitDone = 1;
      if (window.eabChromeBeforeInit) {
        try { window.eabChromeBeforeInit(); } catch (e) { console.error('[eab] before-init hook failed:', e); }
      }
    }
    installTooltips();
  }
  if (document.readyState === 'loading') { $(shellInit); } else { shellInit(); }
})();
