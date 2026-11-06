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
      if (!$left.length || !$right.length) return;
      $left.find('> #result-panel, > #error-panel, > #warn-panel, > .alert').appendTo($right);
    });
  }
  $('.dz-options').on('click', function (e) {
    e.stopPropagation();
    e.preventDefault();
    $(this).closest('.app-main').addClass('is-options-shown').removeClass('is-queue-empty');
  });
  window.eabChromeBeforeInit = function () {
    normaliseLegacyShell();
    syncQueueChrome();
  };
})();
