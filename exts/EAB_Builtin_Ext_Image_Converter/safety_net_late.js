(function pointerupFallback() {
  'use strict';
  var HANDLED = '__eabPointerHandled';
  var down = null;
  function control(el) {
    var $el = $(el);
    return $el.length ? $el.closest('button, [onclick]') : $();
  }
  function handler($el) {
    var fn = $el.prop('onclick');
    return (typeof fn === 'function') ? fn : null;
  }
  $(document).on('mousedown', function (ev) {
    if (ev.button !== 0) return;
    var $el = control(ev.target);
    if (!$el.length || $el.prop('disabled')) return;
    ev.preventDefault();
  });
  $(document).on('pointerdown', function (ev) {
    var $el = control(ev.target);
    // A new press always clears the mark left by the previous one: when a handler
    // calls preventDefault()/stopPropagation() the follow-up `click` never arrives,
    // so waiting for it would swallow every second press.
    if ($el.length) $el.prop(HANDLED, false);
    var fn = $el.length ? handler($el) : null;
    down = fn ? { el: $el.get(0), fn: fn, id: ev.pointerId, x: ev.clientX, y: ev.clientY } : null;
  });
  $(document).on('pointerup', function (ev) {
    var pending = down;
    down = null;
    if (!pending || pending.id !== ev.pointerId) return;
    var $el = $(pending.el);
    if ($el.prop('disabled') || !$.contains(document, pending.el)) return;
    if (Math.abs(ev.clientX - pending.x) > 6 || Math.abs(ev.clientY - pending.y) > 6) return;
    if ($el.prop(HANDLED)) return;
    $el.prop(HANDLED, true);
    try {
      pending.fn.call(pending.el, ev);
    } catch (e) {
      console.error('[eab] pointerup fallback failed:', e);
    }
  });
  $(document).on('click', function (ev) {
    var $el = control(ev.target);
    if (!$el.length || !$el.prop(HANDLED)) return;
    $el.prop(HANDLED, false);
    ev.stopPropagation();
  });
})();
