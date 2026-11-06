var state = {
  videoFile: '',
  videoFiles: [],
  converting: false,
  results: [],
  batchTotal: 0,
  batchIndex: 0,
  jobId: null
};
var CHIP_TABLE = {
  FT800: ['FT80X', 'ft80x'], FT801: ['FT80X', 'ft80x'],
  FT810: ['FT81X/BT88X', 'ft81x'], FT811: ['FT81X/BT88X', 'ft81x'],
  FT812: ['FT81X/BT88X', 'ft81x'], FT813: ['FT81X/BT88X', 'ft81x'],
  BT880: ['FT81X/BT88X', 'bt88x'], BT881: ['FT81X/BT88X', 'bt88x'],
  BT882: ['FT81X/BT88X', 'bt88x'], BT883: ['FT81X/BT88X', 'bt88x'],
  BT815: ['BT81X', 'bt81x'], BT816: ['BT81X', 'bt81x'],
  BT817: ['BT81X', 'bt81x'], BT818: ['BT81X', 'bt81x'],
  BT820: ['BT82X', 'bt82x']
};
var CHIP_GEN = {
  FT80X: ['FT80X', 'ft80x'], FT81X: ['FT81X/BT88X', 'ft81x'],
  BT88X: ['FT81X/BT88X', 'bt88x'], BT81X: ['BT81X', 'bt81x'], BT82X: ['BT82X', 'bt82x']
};
var CHIP_BOX = { gen: 'chip-gen', part: 'chip-name' };
var CHIP_ORDER = ['gen', 'part'];
function chipLabel(which) {
  var $box = $('#' + CHIP_BOX[which]);
  return $box.length ? $box.parent().find('[data-chip-label="' + which + '"]').eq(0) : $();
}
function chipRow(value) {
  var key = String(value || '').toUpperCase();
  return CHIP_TABLE[key] || CHIP_GEN[key] || null;
}
function chipGeneration() {
  var value = String($('#chip-gen').val() || '');
  if (!value) value = String($('#chip-name').val() || '');
  var row = chipRow(value);
  return row ? row[1] : '';
}
function chipGroup() {
  return chipGeneration() === 'bt82x' ? 'bt82x' : 'legacy';
}
window.onChipPick = function (which) {
  var boxes = {}, k;
  for (k in CHIP_BOX) boxes[k] = $('#' + CHIP_BOX[k]);
  if (!boxes.part.length || !boxes.gen.length) return;
  for (k in CHIP_BOX) {
    var $lab = boxes[k].length ? boxes[k].parent().find('[data-chip-label="' + k + '"]') : $();
    if ($lab.length) $lab.css('font-weight', k === which ? '700' : '');
    if (k !== which) boxes[k].val('');
  }
  onChipChange(chipGroup());
};
function onChipChange(chip) {
  if (chip === 'legacy') {
    $('#width').val(800);
    $('#height').val(480);
  } else {
    $('#width').val(1920);
    $('#height').val(1200);
  }
}
$(function () {
  onChipChange('bt82x');
  onControlBitrateToggle();
  onKeepAudioToggle();
  renderQualityTicks();
  onQualityInput();
  renderInputList();
  updateBatchState();
  setPreviewStatus('Ready');
});
