(function () {
  'use strict';
  var HANDLED = '__eabThemeTile';
  var $grid = $('#theme-grid');
  var themes = [];
  var active = '';
  var pending = null;

  function dot(color) {
    return $('<span>').css('background-color', color || 'transparent');
  }

  function token(css, name) {
    var m = new RegExp('--' + name + ':\\s*([^;]+)').exec(css || '');
    return m ? m[1].trim() : '';
  }

  function tile(theme) {
    var css = theme.css || '';
    var $swatch = $('<div class="theme-swatch">')
      .append(dot(token(css, 'eab-bg')), dot(token(css, 'eab-surface')), dot(token(css, 'eab-accent')), dot(token(css, 'eab-border')));
    return $('<button type="button" class="theme-tile">')
      .attr('data-theme', theme.id)
      .append($swatch)
      .append($('<div class="theme-name">').text(theme.name || theme.id))
      .append($('<div class="theme-meta">')
        .append($('<span>').text(theme.mode || ''))
        .append($('<span class="is-active-mark">')));
  }

  function mark() {
    $grid.find('button.theme-tile').each(function () {
      var $tile = $(this);
      var on = $tile.attr('data-theme') === active;
      $tile.toggleClass('is-active', on);
      $tile.find('.is-active-mark').text(on ? 'active' : '');
    });
  }

  function render() {
    $grid.empty();
    for (var i = 0; i < themes.length; i++) $grid.append(tile(themes[i]));
    mark();
  }

  function apply(id) {
    if (!id || id === active) return;
    active = id;
    mark();
    API_EAB_setTheme({ theme: id });
  }

  function tileOf(target) {
    return $(target).closest('button.theme-tile');
  }

  $grid.on('pointerdown', function (ev) {
    var $tile = tileOf(ev.target);
    pending = $tile.length ? { el: $tile[0], id: $tile.attr('data-theme'), x: ev.clientX, y: ev.clientY } : null;
  });

  $grid.on('pointerup', function (ev) {
    var p = pending;
    pending = null;
    if (!p || !$.contains(document, p.el)) return;
    if (Math.abs(ev.clientX - p.x) > 6 || Math.abs(ev.clientY - p.y) > 6) return;
    if ($(p.el).prop(HANDLED)) return;
    $(p.el).prop(HANDLED, true);
    apply(String(p.id));
  });

  $grid.on('click', function (ev) {
    var $tile = tileOf(ev.target);
    if (!$tile.length) return;
    if ($tile.prop(HANDLED)) {
      $tile.prop(HANDLED, false);
      ev.stopPropagation();
      return;
    }
    apply(String($tile.attr('data-theme')));
  });

  function follow(theme) {
    active = (theme && theme.id) || '';
    mark();
  }

  $grid.on('keydown', function (ev) {
    if (ev.key === 'Enter' || ev.key === ' ') return;
    var $tile = tileOf(ev.target);
    if (!$tile.length || (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft')) return;
    ev.preventDefault();
    var $all = $grid.find('button.theme-tile');
    var i = $all.index($tile) + (ev.key === 'ArrowRight' ? 1 : -1);
    $all.eq((i + $all.length) % $all.length).trigger('focus');
  });

  $(function () {
    API_EAB_getThemes({}).then(function (resp) {
      themes = (resp && resp.themes) || [];
      if (!themes.length) $grid.append($('<div class="eab-hint">').text('No theme extension is installed.'));
      render();
    });
    API_EAB_getHostTheme({}).then(function (resp) {
      follow(resp && resp.theme);
    });
    if (window.eab && typeof window.eab.onThemeChange === 'function') {
      window.eab.onThemeChange(follow);
    }
  });
})();
