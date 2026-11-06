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
  function queueEntries(paths) {
    if (!paths || !paths.length) return 0;
    if (!genState.entries.length) genAddEntry();
    return genAddFiles(paths, genState.entries.length - 1).length;
  }
  window.eabAddFiles = queueEntries;
  function syncQueueChrome() {
    $('.app-row').each(function () {
      var $row = $(this);
      var $list = $row.find('#gen-entries');
      if (!$list.length) return;
      var n = $list.find('.gen-entry').length;
      $row.find('#gen-count').text(String(n));
      $row.find('#gen-empty').toggleClass('hidden', n > 0);
      $row.find('#btn-clear-all').toggleClass('hidden', n === 0);
      // The full-frame drop zone is only for a tool with nothing loaded at all. Once a
      // manifest is in, keep the normal layout even while the entry list is empty.
      var loaded = !!(genState && genState.manifestPath);
      $row.toggleClass('is-queue-empty', n === 0 && !loaded && !$row.hasClass('is-options-shown'));
    });
  }
  $('.dz-options').on('click', function (e) {
    e.stopPropagation();
    e.preventDefault();
    $(this).closest('.app-row').addClass('is-options-shown').removeClass('is-queue-empty');
  });
  function isManifestPath(p) { return /\.json$/i.test(String(p)); }
  function loadManifestDrop(paths) {
    var json = paths.filter(isManifestPath)[0];
    if (json) {
      genLoadManifest(json);
      return;
    }
    showError('The manifest drop zone takes one .json manifest — drop fonts and images in the input zone.');
  }
  window.eabOnDrop = function (paths, zone) {
    if (!paths || !paths.length) return;
    var target = zone && zone.getAttribute ? String(zone.getAttribute('data-for') || '') : '';
        if (target === 'gen-path' || paths.some(isManifestPath)) loadManifestDrop(paths);
    else queueEntries(paths);
    syncQueueChrome();
  };
  window.eabSyncQueueChrome = syncQueueChrome;
  window.eabChromeBeforeInit = function () {
    normaliseLegacyShell();
    syncQueueChrome();
  };
})();
