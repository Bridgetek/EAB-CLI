function showPatchWarning() {
  const selected = getSelectedPatches();
  const warnings = [];
  if (selected.includes('fssnapshot') && selected.includes('fswrite')) {
    warnings.push('fsWrite is already included in fsSnapshot; selecting both only adds overhead.');
  }
  if (selected.length >= 5) {
    warnings.push('Too many patches may exceed the 8192-byte limit and the generation will fail.');
  }
  warnings.forEach(w => log('WARNING: ' + w));
  const $hint = $('#name-hint');
  if ($hint.length) {
    $hint.find('.patch-warning').remove();
    warnings.forEach(w => $('<div class="patch-warning text-warning">').text('⚠ ' + w).appendTo($hint));
  }
}
