(function () {
  'use strict';
  var CLICK_HANDLED = '__eabPointerHandled';
  function handlerOf(el) {
    return (el && typeof el.onclick === 'function') ? el.onclick : null;
  }
  function controlOf(el) {
    if (!el || !el.closest) return null;
    return el.closest('button, [onclick]');
  }
  function installNoContextMenu() {
    document.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
  }
  function installClickSafety() {
    var down = null;
    document.addEventListener('mousedown', function (ev) {
      if (ev.button !== 0) return;
      var el = controlOf(ev.target);
      if (!el || el.disabled) return;
      ev.preventDefault();
    }, true);
    document.addEventListener('pointerdown', function (ev) {
      var el = controlOf(ev.target);
      // A new press always clears the mark left by the previous one: when a handler
      // calls preventDefault()/stopPropagation() the follow-up `click` never arrives,
      // so waiting for it would swallow every second press.
      if (el) delete el[CLICK_HANDLED];
      var fn = el ? handlerOf(el) : null;
      down = fn ? { el: el, fn: fn, id: ev.pointerId, x: ev.clientX, y: ev.clientY } : null;
    }, true);
    document.addEventListener('pointerup', function (ev) {
      var pending = down;
      down = null;
      if (!pending || pending.id !== ev.pointerId) return;
      if (pending.el.disabled || pending.el.isConnected === false) return;
      if (Math.abs(ev.clientX - pending.x) > 6 || Math.abs(ev.clientY - pending.y) > 6) return;
      if (pending.el[CLICK_HANDLED]) return;
      pending.el[CLICK_HANDLED] = 1;
      try {
        pending.fn.call(pending.el, ev);
      } catch (e) {
        console.error('[eab] pointerup fallback failed:', e);
      }
    }, true);
    document.addEventListener('click', function (ev) {
      var el = controlOf(ev.target);
      if (!el || !el[CLICK_HANDLED]) return;
      delete el[CLICK_HANDLED];
      ev.stopPropagation();
    }, true);
  }
  function shellInit() {
    if (!window.__eabShellInitDone) {
      window.__eabShellInitDone = 1;
      if (window.eabChromeBeforeInit) {
        try { window.eabChromeBeforeInit(); } catch (e) { console.error('[eab] before-init hook failed:', e); }
      }
    }
    installClickSafety();
    installNoContextMenu();
  }
  if (document.readyState === 'loading') { $(shellInit); } else { shellInit(); }
})();
