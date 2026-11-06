(function () {
  'use strict';
  var ORDER = ['compile', 'samplecode', 'readme', 'debug'];

  function currentIndex() {
    var active = document.querySelector('.tab-btn.active');
    var key = active ? active.getAttribute('data-tab') : '';
    var i = ORDER.indexOf(key);
    return i < 0 ? 0 : i;
  }

  function installTabNavKeys() {
    window.addEventListener('keydown', function (ev) {
      if (!ev.ctrlKey || ev.altKey || ev.metaKey) return;
      var dir = 0;
      if (ev.key === 'Tab') dir = ev.shiftKey ? -1 : 1;
      else if (ev.key === 'PageDown') dir = 1;
      else if (ev.key === 'PageUp') dir = -1;
      else if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
        var t = ev.target;
        var tag = t && t.tagName ? String(t.tagName).toUpperCase() : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
            || (t && t.isContentEditable)) return;
        dir = ev.key === 'ArrowRight' ? 1 : -1;
      }
      if (!dir) return;
      ev.preventDefault();
      var next = (currentIndex() + dir + ORDER.length) % ORDER.length;
      if (typeof window.switchTab === 'function') window.switchTab(ORDER[next]);
    });
  }

  function shellInit() {
    if (!window.__eabShellInitDone) {
      window.__eabShellInitDone = 1;
      if (window.eabChromeBeforeInit) {
        try { window.eabChromeBeforeInit(); } catch (e) { console.error('[eab] before-init hook failed:', e); }
      }
    }
    installTabNavKeys();
  }

  if (document.readyState === 'loading') { $(shellInit); } else { shellInit(); }
})();
