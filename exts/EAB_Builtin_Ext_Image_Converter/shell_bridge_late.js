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
      if ($mid.length && $row.find('.file-list, .input-list, .gen-entries').length) $row.addClass('is-queue-empty');
      if (!$left.length || !$right.length) return;
      $left.find('> #result-panel, > #error-panel, > #warn-panel, > .alert').appendTo($right);
    });
  }
  var INPUT_HERO = [['#tab-validator', '#val-input'], ['#tab-jpegopt', '#jpegopt-input'], ['#tab-rawviewer', '#raw-input']];
  function syncInputHero() {
    for (var i = 0; i < INPUT_HERO.length; i++) {
      var $field = $(INPUT_HERO[i][1]);
      var $row = $(INPUT_HERO[i][0]).find('.app-main').eq(0);
      if (!$field.length || !$row.length) continue;
      var id = INPUT_HERO[i][0].replace('#tab-', '');
      var queued = (window.eabTabQueues && window.eabTabQueues[id]) ? window.eabTabQueues[id].length : 0;
      var empty = queued === 0 && $.trim(String($field.val() || '')).length === 0;
      $row.toggleClass('is-queue-empty', empty && !$row.hasClass('is-options-shown'));
    }
  }
  $(document).on('input', '#val-input, #jpegopt-input, #raw-input', syncInputHero);
  $(document).on('change', '#val-input, #jpegopt-input, #raw-input', syncInputHero);
  $('.dz-options').on('click', function (e) {
    e.stopPropagation();
    e.preventDefault();
    $(this).closest('.app-main').addClass('is-options-shown').removeClass('is-queue-empty');
  });
  window.eabChromeBeforeInit = function () {
    normaliseLegacyShell();
    syncInputHero();
  };
})();
