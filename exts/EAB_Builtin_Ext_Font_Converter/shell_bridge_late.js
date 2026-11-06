(function () {
  function normaliseLegacyShell() {
    $('.app-row').each(function () {
      var $row = $(this);
      $row.addClass('app-main');
      var $left = $row.find('> .left-col').eq(0);
      var $mid = $row.find('> .mid-col').eq(0);
      var $right = $row.find('> .right-col').eq(0);
      if ($left.length) $left.addClass('left-panel');
      if ($mid.length) $mid.addClass('mid-panel overflow-y-auto');
      if ($right.length) $right.addClass('right-panel overflow-y-auto');
    });
  }
  function syncInputHero() {
    var $row = $('#tab-encoder .app-row').eq(0);
    if (!$row.length) return;
    var filled = $.trim(String($('#enc-input').val() || '')).length > 0;
    $row.toggleClass('is-queue-empty', !filled && !$row.hasClass('is-options-shown'));
    $row.find('#btn-enc-clear-all').toggleClass('hidden', !filled);
  }
  function syncQueueChrome() {
    $('.app-row').each(function () {
      var $row = $(this);
      if (!$row.find('#input-list').length) return;
      var n = fontFiles.length;
      $row.find('#file-count').text('(' + n + ')');
      $row.find('#empty-msg').toggleClass('hidden', n > 0);
      $row.find('#btn-clear-all').toggleClass('hidden', n === 0);
      $row.toggleClass('is-queue-empty', n === 0 && !$row.hasClass('is-options-shown'));
    });
    syncInputHero();
  }
  function chipPicked() {
    for (var i = 0; i < CHIP_ORDER.length; i++) {
      var $sel = $('#' + CHIP_BOX[CHIP_ORDER[i]]);
      var value = $sel.length ? String($sel.val() || '') : '';
      if (value) return { kind: CHIP_ORDER[i], value: value };
    }
    return null;
  }
  function syncChipPicker() {
    var $picker = $('#chip-one');
    if (!$picker.length || !$picker.find('option[value=""]').length) return;
    var picked = chipPicked();
    $picker.val(picked ? picked.kind + ':' + picked.value : '');
  }
  function buildChipPicker() {
    var $picker = $('#chip-one');
    if (!$picker.length || $picker.find('optgroup').length) return;
    CHIP_ORDER.forEach(function (kind) {
      var $box = $('#' + CHIP_BOX[kind]);
      if (!$box.length) return;
      var $label = chipLabel(kind);
      var $group = $('<optgroup>').attr('label', $label.length ? $.trim($label.text()) : kind);
      $box.find('option').each(function () {
        var value = String($(this).val() || '');
        if (value) $group.append($('<option>').attr('value', kind + ':' + value).text($(this).text()));
      });
      $picker.append($group);
    });
    $picker.on('change', function () {
      var pick = String($(this).val() || '').split(':');
      var $box = $('#' + CHIP_BOX[pick[0]]);
      if (!$box.length || !pick[1]) return;
      $box.val(pick[1]).trigger('change');
    });
    syncChipPicker();
  }
  var chipPickBase = window.onChipPick;
  window.onChipPick = function (which) {
    chipPickBase(which);
    syncChipPicker();
  };
  $('.dz-options').on('click', function (e) {
    e.stopPropagation();
    e.preventDefault();
    $(this).closest('.app-main').addClass('is-options-shown').removeClass('is-queue-empty');
  });
  $(document).on('input', '#enc-input', syncInputHero);
  $(document).on('change', '#enc-input', syncInputHero);
  window.eabOnDrop = function (paths, zone) {
    if (!paths || !paths.length) return;
    if (zone && zone.closest && zone.closest('#tab-encoder')) return;
    addFontFiles(paths);
  };
  window.eabSyncQueueChrome = syncQueueChrome;
  window.eabChromeBeforeInit = function () {
    normaliseLegacyShell();
    buildChipPicker();
    syncQueueChrome();
  };
})();
