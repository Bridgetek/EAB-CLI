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
  function heroEmpty($row) {
    if ($row.find('#file-list').length) return $row.find('#file-list .file-item').length === 0;
    if ($row.find('#fp-file-list').length) return $row.find('#fp-file-list .fp-file-item').length === 0;
    return null;
  }
  function syncQueueChrome() {
    if (typeof placeRunBars === 'function') placeRunBars();
    $('.app-row').each(function () {
      var $row = $(this);
      var empty = heroEmpty($row);
      if (empty === null) return;
      if ($row.find('#file-list').length) {
        var n = $row.find('#file-list .file-item').length;
        $row.find('#file-count').text('(' + n + ')');
        $row.find('#empty-msg').toggleClass('hidden', n > 0);
        $row.find('#btn-clear-all').toggleClass('hidden', n === 0);
      }
      $row.toggleClass('is-queue-empty', empty && !$row.hasClass('is-options-shown'));
    });
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
    $(this).closest('.app-row').addClass('is-options-shown').removeClass('is-queue-empty');
  });
  window.eabOnDrop = function (paths, zone) {
    if (!paths || !paths.length) return;
    var target = zone && zone.getAttribute ? String(zone.getAttribute('data-for') || '') : '';
    if (target === 'file-list') addAssetFiles(paths);
    else if (target === 'fp-file-list' && typeof setFpImages === 'function') setFpImages(paths);
    else if (target === 'list-path' && typeof addInputListFrom === 'function') addInputListFrom(paths[0]);
    else if (target === 'blob-path') {
      $('.app-row.is-queue-empty').addClass('is-options-shown').removeClass('is-queue-empty');
      if (typeof updateBatchState === 'function') updateBatchState();
    }
    syncQueueChrome();
  };
  window.eabSyncQueueChrome = syncQueueChrome;
  function installShellSplit() {
    var grid = document.querySelector('.shell-grid');
    var divider = document.querySelector('.shell-divider');
    if (!grid || !divider) return;
    var KEY = 'eab_flash_shell_width';
    var MIN = 220, MAX = 620;
    function apply(px) {
      px = Math.max(MIN, Math.min(MAX, Math.round(px)));
      grid.style.gridTemplateColumns = px + 'px 16px minmax(0, 1fr)';
      return px;
    }
    var saved = parseFloat(localStorage.getItem(KEY));
    if (!isNaN(saved)) apply(saved);
    var width = 0;
    function move(ev) { width = apply(ev.clientX - grid.getBoundingClientRect().left); }
    function up() {
      divider.removeEventListener('pointermove', move);
      divider.removeEventListener('pointerup', up);
      document.body.classList.remove('eab-split-dragging');
      if (!width) return;
      try { localStorage.setItem(KEY, String(width)); } catch (e) { }
    }
    divider.addEventListener('pointerdown', function (ev) {
      width = 0;
      if (divider.setPointerCapture) divider.setPointerCapture(ev.pointerId);
      document.body.classList.add('eab-split-dragging');
      divider.addEventListener('pointermove', move);
      divider.addEventListener('pointerup', up);
      ev.preventDefault();
    });
    divider.addEventListener('dblclick', function () {
      grid.style.gridTemplateColumns = '';
      width = 0;
      try { localStorage.removeItem(KEY); } catch (e) { }
    });
  }
  window.eabChromeBeforeInit = function () {
    normaliseLegacyShell();
    buildChipPicker();
    syncQueueChrome();
    installShellSplit();
  };
})();
