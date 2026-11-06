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
  function queueSize($row) {
    if (!$row.find('#input-list').length) return -1;
    return (state.inputFiles || []).length;
  }
  function syncQueueChrome() {
    $('.app-row').each(function () {
      var $row = $(this);
      var n = queueSize($row);
      if (n < 0) return;
      $row.find('#file-count').text('(' + n + ')');
      $row.find('#empty-msg').toggleClass('hidden', n > 0);
      $row.find('#btn-clear-all').toggleClass('hidden', n === 0);
      $row.toggleClass('is-queue-empty', n === 0 && !$row.hasClass('is-options-shown'));
    });
  }
  $('.dz-options').on('click', function (e) {
    e.stopPropagation();
    e.preventDefault();
    $(this).closest('.app-main').addClass('is-options-shown').removeClass('is-queue-empty');
  });
  window.eabOnDrop = function (paths, zone) {
    if (!paths || !paths.length) return;
    addFiles(paths);
  };
  window.eabSyncQueueChrome = syncQueueChrome;
  window.eabChromeBeforeInit = function () {
    normaliseLegacyShell();
    syncQueueChrome();
  };
})();
