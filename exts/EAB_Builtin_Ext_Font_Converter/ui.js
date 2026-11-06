$(document).on('click', '.btn-progress-wrap.eab-action-disabled', function (event) {
  var button = $(this).find('button.btn-primary:disabled').get(0);
  if (!button) return;
  var selectors = (button.getAttribute('data-eab-missing') || '').split('|');
  var target = null;
  for (var i = 0; i < selectors.length; i++) {
    if (!selectors[i]) continue;
    target = document.querySelector(selectors[i]);
    if (target && !target.disabled && target.getClientRects().length) break;
    target = null;
  }
  if (!target) return;
  event.preventDefault();
  event.stopPropagation();
  clearTimeout(target.eabOptionBlinkTimer);
  target.classList.remove('eab-option-blink');
  void target.offsetWidth;
  target.classList.add('eab-option-blink');
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.eabOptionBlinkTimer = setTimeout(function () {
    target.classList.remove('eab-option-blink');
  }, 3000);
});

const state = {
  fontFile: null,
  charFile: null,
  jobId: null,
  fontStruct: 'legacy',
  lastJson: null,
  previewTab: 'font',
  blocks: {},
  faceReady: false,
  fontLoading: false,
  fontBytes: null,
  stamp: 0,
  fcMode: '',
};
let encoderRunning = false;
function isEmbedded() {
  return window.parent !== window;
}
const FONT_FILTERS = [
  { name: 'Font files', extensions: ['ttf', 'otf', 'ttc', 'woff', 'woff2'] },
];
const TEXT_FILTERS = [
  { name: 'UTF-8 text', extensions: ['txt', 'utf8', 'csv', 'lst'] },
];
const JSON_FILTERS = [
  { name: 'JSON', extensions: ['json'] },
];
const ASTCENC_FILTERS = [
  { name: 'astcenc executable', extensions: ['exe'] },
];
function pickCharFile() {
  if (!isEmbedded()) {
    const path = prompt('Enter path to UTF-8 text file:');
    if (path) useCharFile(path);
    return;
  }
  API_EAB_pickFile({ filters: TEXT_FILTERS }).then(resp => {
    if (resp.ok && resp.path) useCharFile(resp.path);
  }).catch(err => showError('Failed to open file picker: ' + err));
}
function useCharFile(path) {
  state.charFile = path;
  const $field = $('#char-file');
  if ($field.length) $field.val(path);
  const $box = $('#use-utf8');
  if ($box.length) $box.prop('checked', true);
  syncConvertGate();
}
function pickOutputDir() {
  if (!isEmbedded()) {
    const path = prompt('Enter output folder path:');
    if (path) $('#output-dir').val(path);
    return;
  }
  API_EAB_pickOutput({}).then(resp => {
    if (resp.ok && resp.folder) {
      $('#output-dir').val(resp.folder);
    }
  }).catch(err => showError('Failed to open folder picker: ' + err));
}
function pickEncoderJson() {
  if (!isEmbedded()) {
    const path = prompt('Enter path to font JSON (.json):');
    if (path) { $('#enc-json').val(path); syncEncoderRun(); }
    return;
  }
  API_EAB_pickFile({ filters: JSON_FILTERS }).then(resp => {
    if (resp.ok && resp.path) { $('#enc-json').val(resp.path); syncEncoderRun(); }
  }).catch(err => showError('Failed to open file picker: ' + err));
}
function pickEncoderText() {
  if (!isEmbedded()) {
    const path = prompt('Enter path to UTF-8 text file:');
    if (path) { $('#enc-input').val(path); syncEncoderRun(); }
    return;
  }
  API_EAB_pickFile({ filters: TEXT_FILTERS }).then(resp => {
    if (resp.ok && resp.path) { $('#enc-input').val(resp.path); syncEncoderRun(); }
  }).catch(err => showError('Failed to open file picker: ' + err));
}
function pickEncoderOut() {
  if (!isEmbedded()) {
    const path = prompt('Enter output folder path:');
    if (path) $('#enc-output').val(path);
    return;
  }
  API_EAB_pickOutput({}).then(resp => {
    if (resp.ok && resp.folder) $('#enc-output').val(resp.folder);
  }).catch(err => showError('Failed to open folder picker: ' + err));
}
async function runEncoder() {
  if (encoderRunning) return;
  const json = $('#enc-json').val().trim();
  const textFile = $('#enc-input').val().trim();
  const outDir = $('#enc-output').val().trim();
  if (!json) { showError('Please select the font JSON produced by the converter.'); return; }
  if (!textFile) { showError('Please select the UTF-8 text file to encode.'); return; }
  if (!outDir) { showError('Please choose an output folder.'); return; }
  const cliArgs = ['-i', textFile, '-j', json, '-o', outDir, '-e', $('#enc-prefix').val()];
  const unknown = $('#enc-unknown').val();
  if (unknown) cliArgs.push('-u', unknown);
  encoderRunning = true;
  syncEncoderRun();
  const $fill = $('#enc-progress-fill');
  if ($fill.length) $fill.css('width', '0%');
  const $encErr = $('#enc-error-panel');
  if ($encErr.length) $encErr.addClass('hidden');
  try {
    const resultJson = await invokeHost('execute_extension_command', {
      extensionId: 'font_converter',
      cliCommand: 'bt82x font_encode',
      cliArgs: cliArgs,
    });
    const result = JSON.parse(resultJson);
    if (!result.success) {
      showError(result.error || 'Encode failed', 'enc-error-panel');
      log('ERROR: ' + (result.error || 'Encode failed'));
      return;
    }
    const files = result.output_files || [];
    if ($fill.length) $fill.css('width', '100%');
    $('#enc-result-files').html(files.length
      ? files.map(f => `<div class="file-item list-group-item" onclick="openFile('${f.replace(/'/g, "\\'")}')">📄 ${f}</div>`).join('')
      : '<div class="preview-placeholder">(done)</div>');
    log('Encoded OK: ' + (files.join(', ') || '(done)'));
  } catch (err) {
    showError('Encode failed: ' + err, 'enc-error-panel');
    log('ERROR: ' + err);
  } finally {
    encoderRunning = false;
    syncEncoderRun();
  }
}
function pickAstcenc() {
  if (!isEmbedded()) {
    const path = prompt('Enter path to astcenc.exe:');
    if (path) $('#astcenc-path').val(path);
    return;
  }
  API_EAB_pickFile({ filters: ASTCENC_FILTERS }).then(resp => {
    if (resp.ok && resp.path) {
      $('#astcenc-path').val(resp.path);
    }
  }).catch(err => showError('Failed to open file picker: ' + err));
}
function switchTab(which) {
  const name = which === 'encoder' ? 'encoder' : 'converter';
  $('.app-header .tab-btn').each(function () {
    $(this).toggleClass('active', $(this).attr('data-tab') === name);
  });
  $('.tab-content').each(function () {
    $(this).toggleClass('active', $(this).attr('id') === 'tab-' + name);
  });
  if (typeof window.eabSyncQueueChrome === 'function') window.eabSyncQueueChrome();
  if (window.__EAB_WORKBENCH && window.__EAB_WORKBENCH.relayout) window.__EAB_WORKBENCH.relayout();
}
const CHIP_TABLE = {
  FT800: 'ft80x', FT801: 'ft80x',
  FT810: 'ft81x', FT811: 'ft81x', FT812: 'ft81x', FT813: 'ft81x',
  BT880: 'bt88x', BT881: 'bt88x', BT882: 'bt88x', BT883: 'bt88x',
  BT815: 'bt81x', BT816: 'bt81x', BT817: 'bt81x', BT818: 'bt81x',
  BT820: 'bt82x',
};
const CHIP_GEN = { FT80X: 'ft80x', FT81X: 'ft81x', BT88X: 'bt88x', BT81X: 'bt81x', BT82X: 'bt82x' };
const CHIP_BOX = { gen: 'chip-gen', part: 'chip-name' };
const CHIP_ORDER = ['gen', 'part'];
function chipGeneration() {
  const $gen = $('#chip-gen');
  const gen = ($gen.length && $gen.val()) || '';
  if (gen && CHIP_GEN[String(gen).toUpperCase()]) return CHIP_GEN[String(gen).toUpperCase()];
  const $part = $('#chip-name');
  const part = ($part.length && String($part.val() || '').toUpperCase()) || '';
  return part && CHIP_TABLE[part] ? CHIP_TABLE[part] : '';
}
function chipGroup() {
  return chipGeneration() === 'bt82x' ? 'bt82x' : 'legacy';
}
const STRUCTS = { 'bt82x': ['legacy', 'ext1', 'ext2'], legacy: ['legacy', 'extended'] };
const STRUCT_WHY = {
  'bt82x': 'Extended is the Legacy structure — pick a Legacy chip to use it.',
  legacy: 'Extended 1/2 belong to the bt82x converter — pick BT820 (or bt82x).',
};
const STRUCT_HINT = {
  legacy: 'Legacy writes the ASCII code points with a 148-byte metric block.',
  ext1: 'Extended 1 covers every code point of the input.',
  ext2: 'Extended 2 adds kerning (the font needs a GPOS or legacy kern table).',
  extended: 'Extended covers every code point of the input.',
};
function chipLabel(which) {
  const $box = $('#' + CHIP_BOX[which]);
  return $box.length ? $box.parent().find('[data-chip-label="' + which + '"]') : $();
}
function generation() {
  const group = chipGroup();
  return STRUCTS[group] ? group : 'bt82x';
}
function onChipPick(which) {
  const boxes = {};
  for (const k in CHIP_BOX) boxes[k] = $('#' + CHIP_BOX[k]);
  if (!boxes.part.length || !boxes.gen.length) return;
  for (const k in CHIP_BOX) {
    if (k !== which) boxes[k].val('');
  }
  applyGeneration();
}
function structAllowed(el, gen, struct) {
  const spec = $(el).attr('data-when');
  if (!spec) return true;
  return spec.trim().split(/\s+/).some(function (part) {
    const bits = part.split(':');
    if (bits[0] !== gen && bits[0] !== '*') return false;
    return bits[1].split(',').indexOf('*') >= 0 || bits[1].split(',').indexOf(struct) >= 0;
  });
}
function bitmapFormats() {
  const picked = [];
  $('#bitmap-picks input[data-bp-item]').each(function () {
    const $box = $(this);
    const $pick = $box.closest('.bitmap-pick');
    if ($box.prop('checked') && !$box.prop('disabled') && $pick.length && !$pick.hasClass('hidden')) picked.push($box.attr('data-bp-item'));
  });
  return picked.length ? picked.join(',') : 'L4';
}
function isAstcPicked() { return bitmapFormats().split(',').indexOf('ASTC') >= 0; }
function formatChips() {
  return $('#bitmap-picks input[data-bp-item]').filter(function () {
    const $pick = $(this).closest('.bitmap-pick');
    return $pick.length > 0 && !$pick.hasClass('hidden') && !$(this).prop('disabled');
  });
}
function syncAllFormat() {
  const $all = $('#bp-all');
  if (!$all.length) return;
  const $boxes = formatChips();
  const on = $boxes.filter(function () { return $(this).prop('checked'); }).length;
  $all.prop('checked', $boxes.length > 0 && on === $boxes.length);
  $all.prop('indeterminate', on > 0 && on < $boxes.length);
}
function toggleAllFormats(on) {
  formatChips().prop('checked', !!on);
  syncAllFormat();
  refreshOptions();
}
function refreshOptions() {
  const gen = generation();
  const struct = state.fontStruct;
  const $astcItem = $('#bitmap-picks input[data-bp-item="ASTC"]');
  const $astcPick = $astcItem.closest('.bitmap-pick');
  if ($astcPick.length) {
    const allowed = STRUCTS[gen].indexOf(struct) >= 0 && struct !== 'legacy';
    $astcPick.toggleClass('is-off', !allowed);
    $astcItem.prop('disabled', !allowed);
    if (!allowed) $astcItem.prop('checked', false);
  }
  const astc = isAstcPicked();
  $('#options-card [data-when], #options-card [data-needs]').each(function () {
    const $row = $(this);
    let show = structAllowed(this, gen, struct);
    if (show && $row.attr('data-needs') === 'astc') show = astc;
    if ($row.attr('data-lock') === gen) {
      show = false;
      $row.find('select').val('utf8');
    }
    if ($row.hasClass('check-cell') || $row.attr('data-off') === 'disable') {
      $row.toggleClass('is-off', !show);
      $row.find('input, select, .spin-btn').prop('disabled', !show);
    } else {
      $row.toggleClass('hidden', !show);
    }
  });
  const $hint = $('#struct-hint');
  if ($hint.length) $hint.text(STRUCT_HINT[struct] || '');
  syncAllFormat();
  if (window.__EAB_WORKBENCH && window.__EAB_WORKBENCH.relayout) window.__EAB_WORKBENCH.relayout();
}
function applyGeneration() {
  const gen = generation();
  const supported = STRUCTS[gen] || STRUCTS['bt82x'];
  $('.struct-tab').each(function () {
    const $b = $(this);
    const kind = $b.attr('data-struct');
    const ok = supported.indexOf(kind) >= 0;
    $b.prop('disabled', !ok)
      .attr('title', ok ? ('Convert with the ' + $b.text().trim() + ' structure')
        : (STRUCT_WHY[gen] || 'Not available for this chip'));
  });
  if (supported.indexOf(state.fontStruct) < 0) state.fontStruct = 'legacy';
  switchStruct(state.fontStruct);
}
function switchStruct(struct) {
  const gen = generation();
  const supported = STRUCTS[gen] || STRUCTS['bt82x'];
  const name = supported.indexOf(struct) >= 0 ? struct : 'legacy';
  state.fontStruct = name;
  $('.struct-tab').each(function () {
    const $b = $(this);
    const on = $b.attr('data-struct') === name;
    $b.toggleClass('active', on);
    $b.attr('aria-selected', on ? 'true' : 'false');
  });
  refreshOptions();
  onCodePointModeChange();
}
/* The Legacy structure has no -L flag: the mode only sets the First Character
   default and the input range, exactly like the reference Legacy tab. */
function onCodePointModeChange() {
  const legacy = state.fontStruct === 'legacy';
  const mode = legacy ? (generation() === 'bt82x' ? 'ascii' : String($('#codepoint-mode').val())) : '';
  const ascii = legacy && (generation() === 'bt82x' || $('#codepoint-mode').val() !== 'ordinal');
  const $fc = $('#first-char');
  const $range = $('#char-range');
  const changed = state.fcMode !== mode;
  state.fcMode = mode;
  $range.prop('readonly', ascii);
  $fc.prop('readonly', false);
  if (ascii) {
    $fc.attr({ min: 1, max: 127, step: 1 });
    if (changed) $fc.val(32);
    $range.val('U+0000-U+007F');
    $('#use-range').prop('checked', true).trigger('change');
  } else if (legacy) {
    $fc.attr({ min: 1, max: 127, step: 1 });
    if (changed) $fc.val(1);
  } else {
    $fc.attr({ min: 0, max: 65535, step: 1 });
  }
  clampSpin($fc);
  syncConvertGate();
}
/* Numeric stepper: ▲/▼ and the arrow keys step the value, typing stays possible,
   so First Character behaves like an editable combobox. */
function stepSpin($input, dir) {
  const el = $input.get(0);
  if (!el || el.disabled || el.readOnly) return;
  if (dir > 0) el.stepUp(); else el.stepDown();
  $input.trigger('input').trigger('change');
}
function clampSpin($input) {
  const el = $input.get(0);
  if (!el) return;
  const min = el.min === '' ? -Infinity : Number(el.min);
  const max = el.max === '' ? Infinity : Number(el.max);
  let v = Number(el.value);
  if (el.value === '' || isNaN(v)) v = isNaN(min) ? 0 : min;
  $input.val(Math.min(max, Math.max(min, v)));
}
$(document).on('mousedown', '.spin-btn', function (e) {
  e.preventDefault(); /* keep the caret in the input so typing works right after clicking */
});
$(document).on('click', '.spin-btn', function () {
  const $box = $(this).closest('.spin-box');
  stepSpin($box.find('.spin-input'), Number($(this).attr('data-spin-step')) || 1);
  $box.find('.spin-input').trigger('focus');
});
$(document).on('keydown', '.spin-input', function (e) {
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
  e.preventDefault();
  stepSpin($(this), e.key === 'ArrowUp' ? 1 : -1);
});
$(document).on('change blur', '.spin-input', function () { clampSpin($(this)); });
function hostVar(name, fallback) {
  const v = getComputedStyle($('html').get(0)).getPropertyValue(name).trim();
  return v || fallback;
}
function readFontBytes(path, stamp) {
  const cached = state.fontBytes;
  if (cached && cached.path === path && cached.stamp === stamp) return cached.promise;
  const promise = invokeHost('read_file_base64', { path }).then(function (dataUrl) {
    const bin = atob(String(dataUrl).split(',')[1] || '');
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  });
  state.fontBytes = { path: path, stamp: stamp, promise: promise };
  return promise;
}
const FONT_BLOCKS = `Basic Latin|0000|007F
Latin-1 Supplement|0080|00FF
Latin Extended-A|0100|017F
Latin Extended-B|0180|024F
IPA Extensions|0250|02AF
Spacing Modifier Letters|02B0|02FF
Combining Diacritical Marks|0300|036F
Greek and Coptic|0370|03FF
Cyrillic|0400|04FF
Cyrillic Supplement|0500|052F
Armenian|0530|058F
Hebrew|0590|05FF
Arabic|0600|06FF
Syriac|0700|074F
Arabic Supplement|0750|077F
Thaana|0780|07BF
NKo|07C0|07FF
Samaritan|0800|083F
Mandaic|0840|085F
Syriac Supplement|0860|086F
Arabic Extended-A|08A0|08FF
Devanagari|0900|097F
Bengali|0980|09FF
Gurmukhi|0A00|0A7F
Gujarati|0A80|0AFF
Oriya|0B00|0B7F
Tamil|0B80|0BFF
Telugu|0C00|0C7F
Kannada|0C80|0CFF
Malayalam|0D00|0D7F
Sinhala|0D80|0DFF
Thai|0E00|0E7F
Lao|0E80|0EFF
Tibetan|0F00|0FFF
Myanmar|1000|109F
Georgian|10A0|10FF
Hangul Jamo|1100|11FF
Ethiopic|1200|137F
Ethiopic Supplement|1380|139F
Cherokee|13A0|13FF
Unified Canadian Aboriginal Syllabics|1400|167F
Ogham|1680|169F
Runic|16A0|16FF
Tagalog|1700|171F
Hanunoo|1720|173F
Buhid|1740|175F
Tagbanwa|1760|177F
Khmer|1780|17FF
Mongolian|1800|18AF
Unified Canadian Aboriginal Syllabics Extended|18B0|18FF
Limbu|1900|194F
Tai Le|1950|197F
New Tai Lue|1980|19DF
Khmer Symbols|19E0|19FF
Buginese|1A00|1A1F
Tai Tham|1A20|1AAF
Combining Diacritical Marks Extended|1AB0|1AFF
Balinese|1B00|1B7F
Sundanese|1B80|1BBF
Batak|1BC0|1BFF
Lepcha|1C00|1C4F
Ol Chiki|1C50|1C7F
Cyrillic Extended-C|1C80|1C8F
Georgian Extended|1C90|1CBF
Sundanese Supplement|1CC0|1CCF
Vedic Extensions|1CD0|1CFF
Phonetic Extensions|1D00|1D7F
Phonetic Extensions Supplement|1D80|1DBF
Combining Diacritical Marks Supplement|1DC0|1DFF
Latin Extended Additional|1E00|1EFF
Greek Extended|1F00|1FFF
General Punctuation|2000|206F
Superscripts and Subscripts|2070|209F
Currency Symbols|20A0|20CF
Combining Diacritical Marks for Symbols|20D0|20FF
Letterlike Symbols|2100|214F
Number Forms|2150|218F
Arrows|2190|21FF
Mathematical Operators|2200|22FF
Miscellaneous Technical|2300|23FF
Control Pictures|2400|243F
Optical Character Recognition|2440|245F
Enclosed Alphanumerics|2460|24FF
Box Drawing|2500|257F
Block Elements|2580|259F
Geometric Shapes|25A0|25FF
Miscellaneous Symbols|2600|26FF
Dingbats|2700|27BF
Miscellaneous Mathematical Symbols-A|27C0|27EF
Supplemental Arrows-A|27F0|27FF
Braille Patterns|2800|28FF
Supplemental Arrows-B|2900|297F
Miscellaneous Mathematical Symbols-B|2980|29FF
Supplemental Mathematical Operators|2A00|2AFF
Miscellaneous Symbols and Arrows|2B00|2BFF
Glagolitic|2C00|2C5F
Latin Extended-C|2C60|2C7F
Coptic|2C80|2CFF
Georgian Supplement|2D00|2D2F
Tifinagh|2D30|2D7F
Ethiopic Extended|2D80|2DDF
Cyrillic Extended-A|2DE0|2DFF
Supplemental Punctuation|2E00|2E7F
CJK Radicals Supplement|2E80|2EFF
Kangxi Radicals|2F00|2FDF
Ideographic Description Characters|2FF0|2FFF
CJK Symbols and Punctuation|3000|303F
Hiragana|3040|309F
Katakana|30A0|30FF
Bopomofo|3100|312F
Hangul Compatibility Jamo|3130|318F
Kanbun|3190|319F
Bopomofo Extended|31A0|31BF
CJK Strokes|31C0|31EF
Katakana Phonetic Extensions|31F0|31FF
Enclosed CJK Letters and Months|3200|32FF
CJK Compatibility|3300|33FF
CJK Unified Ideographs Extension A|3400|4DBF
Yijing Hexagram Symbols|4DC0|4DFF
CJK Unified Ideographs|4E00|9FFF
Yi Syllables|A000|A48F
Yi Radicals|A490|A4CF
Lisu|A4D0|A4FF
Vai|A500|A63F
Cyrillic Extended-B|A640|A69F
Bamum|A6A0|A6FF
Modifier Tone Letters|A700|A71F
Latin Extended-D|A720|A7FF
Syloti Nagri|A800|A82F
Common Indic Number Forms|A830|A83F
Phags-pa|A840|A87F
Saurashtra|A880|A8DF
Devanagari Extended|A8E0|A8FF
Kayah Li|A900|A92F
Rejang|A930|A95F
Hangul Jamo Extended-A|A960|A97F
Javanese|A980|A9DF
Myanmar Extended-B|A9E0|A9FF
Cham|AA00|AA5F
Myanmar Extended-A|AA60|AA7F
Tai Viet|AA80|AADF
Meetei Mayek Extensions|AAE0|AAFF
Ethiopic Extended-A|AB00|AB2F
Latin Extended-E|AB30|AB6F
Cherokee Supplement|AB70|ABBF
Meetei Mayek|ABC0|ABFF
Hangul Syllables|AC00|D7AF
Hangul Jamo Extended-B|D7B0|D7FF
High Surrogates|D800|DB7F
High Private Use Surrogates|DB80|DBFF
Low Surrogates|DC00|DFFF
Private Use Area|E000|F8FF
CJK Compatibility Ideographs|F900|FAFF
Alphabetic Presentation Forms|FB00|FB4F
Arabic Presentation Forms-A|FB50|FDFF
Variation Selectors|FE00|FE0F
Vertical Forms|FE10|FE1F
Combining Half Marks|FE20|FE2F
CJK Compatibility Forms|FE30|FE4F
Small Form Variants|FE50|FE6F
Arabic Presentation Forms-B|FE70|FEFF
Halfwidth and Fullwidth Forms|FF00|FFEF
Specials|FFF0|FFFF`.split('\n').map(function (row) {
  const p = row.split('|');
  return [p[0], parseInt(p[1], 16), parseInt(p[2], 16)];
});
const CMAP_PREFS = [[3, 10], [0, 6], [0, 4], [3, 1], [0, 3], [0, 2], [0, 1], [0, 0]];
function be16(b, o) { return (b[o] << 8) | b[o + 1]; }
function be32(b, o) { return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0; }
function hex4(n) { return n.toString(16).toUpperCase().padStart(4, '0'); }
function sfntTables(b) {
  if (!b || b.length < 12) return null;
  const v = String.fromCharCode(b[0], b[1], b[2], b[3]);
  let base = 0;
  if (v === 'ttcf') base = be32(b, 12);
  else if (v.charCodeAt(0) !== 0 && v !== 'OTTO' && v !== 'true') return null;
  const n = be16(b, base + 4);
  const out = {};
  for (let i = 0; i < n; i++) {
    const r = base + 12 + i * 16;
    if (r + 16 > b.length) break;
    out[String.fromCharCode(b[r], b[r + 1], b[r + 2], b[r + 3])] = [be32(b, r + 8), be32(b, r + 12)];
  }
  return out;
}
function cmapSubtable(b, o) {
  const fmt = be16(b, o);
  const cps = [];
  if (fmt === 0) {
    for (let i = 0; i < 256; i++) if (b[o + 6 + i]) cps.push(i);
  } else if (fmt === 4) {
    const segX2 = be16(b, o + 6);
    const segs = segX2 >> 1;
    const endAt = o + 14;
    const startAt = endAt + segX2 + 2;
    const deltaAt = startAt + segX2;
    const rangeAt = deltaAt + segX2;
    for (let i = 0; i < segs; i++) {
      const start = be16(b, startAt + i * 2);
      const end = be16(b, endAt + i * 2);
      if (start === 0xFFFF && end === 0xFFFF) break;
      const delta = be16(b, deltaAt + i * 2);
      const ro = be16(b, rangeAt + i * 2);
      for (let cp = start; cp <= end; cp++) {
        if (ro === 0) { cps.push(cp); continue; }
        if (ro === 0xFFFF) continue;
        const at = rangeAt + i * 2 + ro + (cp - start) * 2;
        if (at + 1 >= b.length) continue;
        const raw = be16(b, at);
        if (!raw) continue;
        if (((raw << 16) >> 16) + ((delta << 16) >> 16) < 0) continue;
        cps.push(cp);
      }
    }
  } else if (fmt === 6) {
    const first = be16(b, o + 6);
    const n = be16(b, o + 8);
    for (let i = 0; i < n && first + i <= 0xFFFF; i++) cps.push(first + i);
  } else if (fmt === 12 || fmt === 13) {
    const groups = be32(b, o + 12);
    for (let g = 0; g < groups; g++) {
      const r = o + 16 + g * 12;
      if (r + 12 > b.length) break;
      const from = be32(b, r);
      const to = be32(b, r + 4);
      const gid = be32(b, r + 8);
      for (let cp = from; cp <= to; cp++) {
        if ((fmt === 13 ? gid : gid + (cp - from)) <= 0xFFFF) cps.push(cp);
      }
    }
  }
  return cps;
}
function fontCodePoints(b) {
  const tables = sfntTables(b);
  if (!tables || !tables.cmap) return null;
  const cmap = tables.cmap[0];
  const n = be16(b, cmap + 2);
  const subs = [];
  for (let i = 0; i < n; i++) {
    const r = cmap + 4 + i * 8;
    if (r + 8 > b.length) break;
    subs.push({ pid: be16(b, r), eid: be16(b, r + 2), at: cmap + be32(b, r + 4) });
  }
  const unicode = s => s.pid === 0 || (s.pid === 3 && (s.eid === 1 || s.eid === 10));
  for (const s of subs) {
    if (!unicode(s)) continue;
    if (!CMAP_PREFS.some(p => p[0] === s.pid && p[1] === s.eid)) continue;
    const cps = cmapSubtable(b, s.at);
    if (cps.length) return Array.from(new Set(cps)).sort((x, y) => x - y);
  }
  const merge = [];
  for (const s of subs) merge.push(...cmapSubtable(b, s.at));
  return Array.from(new Set(merge)).sort((x, y) => x - y);
}
function fontBlockInfo(b) {
  const cps = fontCodePoints(b);
  if (!cps) return null;
  const out = [];
  let i = 0;
  for (const block of FONT_BLOCKS) {
    let count = 0;
    while (i < cps.length && cps[i] < block[2]) { count++; i++; }
    if (count) {
      out.push({
        block_name: block[0],
        unicode_range: 'U+' + hex4(block[1]) + '-U+' + hex4(block[2]),
        valid_glyphs: count,
        all_glyphs: block[2] - block[1] + 1,
      });
    }
  }
  return { num_glyph: cps.length, block_info: out };
}
async function loadFontPreview(path) {
  const stamp = state.stamp;
  state.faceReady = false;
  state.fontLoading = true;
  setPreviewLoading('font', true);
  if (state.previewTab === 'chars') renderCharPreview();
  try {
    const bytes = await readFontBytes(path, stamp);
    if (stamp !== state.stamp) return;
    const canvas = $('#preview-canvas').get(0);
    canvas.width = 640;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    const bg = hostVar('--bg-card', '#fff');
    const fg = hostVar('--text', '#111');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const fontFace = new FontFace('previewFont', bytes);
    await fontFace.load();
    if (stamp !== state.stamp) return;
    document.fonts.add(fontFace);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = fg;
    ctx.font = '48px previewFont';
    ctx.fillText('AaBbCcDd 0123 @#$%', 20, 90);
    $('#preview-info').text('Font loaded');
    state.faceReady = true;
  } catch (err) {
    if (stamp !== state.stamp) return;
    console.error('Failed to load font preview:', err);
    $('#preview-info').text('Preview unavailable');
  }
  setPreviewLoading('font', false);
  state.fontLoading = false;
  if (state.previewTab === 'chars') renderCharPreview();
}
function setPreviewLoading(which, on) {
  $('#pv-' + which + '-loading').toggleClass('hidden', !on);
}
function switchPreview(which) {
  const name = ['font', 'blocks', 'chars'].indexOf(which) >= 0 ? which : 'font';
  state.previewTab = name;
  $('#preview-tabs .tab-btn').each(function () {
    $(this).toggleClass('active', $(this).attr('data-preview') === name);
  });
  ['pv-font', 'pv-blocks', 'pv-chars'].forEach(function (id) {
    $('#' + id).toggleClass('hidden', id !== 'pv-' + name);
  });
  if (name === 'blocks') loadBlockInfo();
  if (name === 'chars') renderCharPreview();
  if (window.__EAB_WORKBENCH && window.__EAB_WORKBENCH.relayout) window.__EAB_WORKBENCH.relayout();
}
function loadBlockInfo(fromDialog) {
  const $body = $('#block-info-body');
  const $status = $('#block-info-status');
  if (!$body.length || !$status.length) return;
  const path = state.fontFile;
  if (!path) { $status.text('No font loaded'); $body.html(''); return; }
  const stamp = state.stamp;
  const done = (blocks) => {
    if (stamp !== state.stamp) return;
    renderBlockInfo(blocks);
    if (fromDialog) fillRangeRows(blocks);
    setPreviewLoading('blocks', false);
  };
  if (state.blocks[path]) { done(state.blocks[path]); return; }
  $status.text('Reading the font…');
  $body.html('');
  setPreviewLoading('blocks', true);
  readFontBytes(path, stamp).then(function (bytes) {
    if (stamp !== state.stamp) return;
    setPreviewLoading('blocks', false);
    const info = fontBlockInfo(bytes);
    if (!info) {
      state.blocks[path] = [];
      $status.text('No Unicode table in this file (TTF/OTF/TTC only).');
      if (fromDialog) fillRangeRows(null);
      return;
    }
    state.blocks[path] = info.block_info;
    done(info.block_info);
  }).catch(function (err) {
    if (stamp !== state.stamp) return;
    setPreviewLoading('blocks', false);
    $status.text('Could not read the font: ' + err);
  });
}
function renderBlockInfo(blocks) {
  const $body = $('#block-info-body');
  const $status = $('#block-info-status');
  const rows = blocks.filter(function (b) { return b.unicode_range; });
  $body.html(rows.map(function (b) {
    const valid = Number(b.valid_glyphs || 0);
    const all = Number(b.all_glyphs || 0);
    return '<tr><td>' + String(b.block_name || '') + '</td>' +
      '<td class="rt-range">' + String(b.unicode_range) + '</td>' +
      '<td class="rt-count">' + valid + '</td>' +
      '<td class="rt-count"' + (all && valid < all ? ' title="some code points are not covered"' : '') + '>' + all + '</td></tr>';
  }).join(''));
  const total = rows.reduce(function (a, b) { return a + Number(b.valid_glyphs || 0); }, 0);
  $status.text(rows.length + (rows.length === 1 ? ' block · ' : ' blocks · ') + total + ' glyphs');
}
const CHAR_PREVIEW_MAX = 400;
function uCode(n) { return 'U+' + n.toString(16).toUpperCase().padStart(4, '0'); }
function textRanges(raw) {
  const out = [];
  const re = /U\+([0-9a-fA-F]{1,6})(?:\s*-\s*U\+([0-9a-fA-F]{1,6}))?/g;
  let m;
  while ((m = re.exec(String(raw || '')))) {
    const from = parseInt(m[1], 16);
    const to = m[2] ? parseInt(m[2], 16) : from;
    out.push([Math.min(from, to), Math.max(from, to)]);
  }
  return out;
}
function rangesText(rng) { return rng.map(r => uCode(r[0]) + '-' + uCode(r[1])).join(','); }
async function charSources() {
  const $rangeBox = $('#use-range');
  const $utf8Box = $('#use-utf8');
  const raw = ($('#char-range').val() || '').trim();
  const rangeOn = !$rangeBox.length || $rangeBox.prop('checked');
  const rng = rangeOn ? textRanges(raw) : [];
  const literal = (rangeOn && !rng.length) ? raw : '';
  const file = ((!$utf8Box.length || $utf8Box.prop('checked')) && state.charFile) ? state.charFile : '';
  return { rng, literal, file };
}
function writeTempText(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return API_EAB_writeTempFile({ name: 'font_chars.txt', dataBase64: btoa(binary) })
    .then(resp => (resp && resp.ok && resp.path) ? resp.path : '');
}
async function selectedChars() {
  const src = await charSources();
  const chars = [];
  src.rng.forEach(r => {
    for (let c = r[0]; c <= r[1] && chars.length < CHAR_PREVIEW_MAX; c++) {
      try { chars.push(String.fromCodePoint(c)); } catch (e) {  }
    }
  });
  if (src.file) {
    try {
      const dataUrl = await invokeHost('read_file_base64', { path: src.file });
      const base64 = String(dataUrl).split(',')[1] || '';
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const text = new TextDecoder('utf-8').decode(bytes);
      Array.from(text).forEach(ch => { if (ch !== '\r' && ch !== '\n' && chars.length < CHAR_PREVIEW_MAX) chars.push(ch); });
    } catch (err) {  }
  } else if (src.literal) {
    Array.from(src.literal).forEach(ch => {
      if (ch !== '\r' && ch !== '\n' && chars.length < CHAR_PREVIEW_MAX) chars.push(ch);
    });
  }
  return chars;
}
async function renderCharPreview() {
  const canvas = $('#char-canvas').get(0);
  const $info = $('#char-info');
  if (!canvas || !$info.length) return;
  if (!state.faceReady) {
    setPreviewLoading('chars', !!state.fontLoading);
    $info.text(!state.fontFile ? 'Load a font first'
      : state.fontLoading ? 'Reading the font…'
        : 'The font could not be previewed');
    return;
  }
  const stamp = state.stamp;
  setPreviewLoading('chars', true);
  const chars = await selectedChars();
  if (stamp !== state.stamp) return;
  if (!chars.length) {
    setPreviewLoading('chars', false);
    $info.text('No characters selected');
    return;
  }
  const width = Math.max(Math.round(canvas.clientWidth || canvas.width || 600), 200);
  if (canvas.width !== width) canvas.width = width;
  const ctx = canvas.getContext('2d');
  const bg = hostVar('--bg-card', '#fff');
  const fg = hostVar('--text', '#111');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = fg;
  ctx.font = '28px previewFont';
  ctx.textBaseline = 'middle';
  const step = 26;
  let x = 8;
  let y = step;
  for (const ch of chars) {
    const width = Math.max(ctx.measureText(ch).width, 6);
    if (x + width > canvas.width - 8) { x = 8; y += step; }
    if (y > canvas.height - 8) {
      setPreviewLoading('chars', false);
      $info.text(chars.length + ' characters (first ' + CHAR_PREVIEW_MAX + ' shown)');
      return;
    }
    ctx.fillText(ch, x, y);
    x += width + 2;
  }
  setPreviewLoading('chars', false);
  $info.text(chars.length + ' characters');
}
function setProgressStatus(text) {
  const $el = $('#row-progress-status');
  if ($el.length) $el.text(text);
}
async function startConvert() {
  if (!state.fontFile) {
    showError('Please select a font file first.');
    return;
  }
  $('#btn-convert').prop('disabled', true);
  $('#convert-controls').removeClass('hidden');
  setTotalProgress(0);
  $('#result-panel').addClass('hidden');
  $('#error-panel').addClass('hidden');
  setProgressStatus('Preparing…');
  const struct = state.fontStruct || 'legacy';
  const gen = generation();
  const legacy = struct === 'legacy';
  const outputDir = $('#output-dir').val() || '.';
  const src = await charSources();
  const utf8Path = src.file || (src.literal ? await writeTempText(src.literal) : '');
  if (!src.rng.length && !utf8Path) {
    showError('Type characters, a U+xxxx-U+yyyy range, or pick a UTF-8 text file.');
    $('#btn-convert').prop('disabled', false);
    $('#convert-controls').addClass('hidden');
    return;
  }
  const cliArgs = ['-f', struct, '-i', state.fontFile];
  if (utf8Path) cliArgs.push('-u', utf8Path);
  if (src.rng.length) cliArgs.push('-r', rangesText(src.rng));
  cliArgs.push('-o', outputDir);
  cliArgs.push('-s', $('#point-size').val() || '25');
  cliArgs.push('-D', $('#dpi').val() || '72');
  cliArgs.push('-E', bitmapFormats());
  const shown = (id) => {
    const $el = $('#' + id);
    if (!$el.length || $el.prop('disabled')) return false;
    const $row = $el.closest('[data-when]');
    return !$row.length || !$row.hasClass('hidden');
  };
  const checked = (id) => shown(id) && !!$('#' + id).prop('checked');
  if (legacy) cliArgs.push('-l', String(parseInt($('#first-char').val(), 10) || 1));
  if (!legacy && shown('codepoint-mode') && $('#codepoint-mode').val() === 'ordinal') cliArgs.push('-L');
  if (shown('address')) cliArgs.push('-d', $('#address').val() || '0');
  if (shown('eve-command')) cliArgs.push('-c', $('#eve-command').val() || 'setfont2');
  if (checked('escape-line-break')) cliArgs.push('-N');
  if (checked('add-space')) cliArgs.push('-S');
  if (checked('flag-bin')) cliArgs.push('-B');
  if (checked('flag-cjk')) cliArgs.push('-W');
  if (checked('relocate') || checked('ram-address')) cliArgs.push('-R');
  if (checked('ext-kerning')) cliArgs.push('-K');
  if (checked('gen-preview')) cliArgs.push('-p');
  if (isAstcPicked()) {
    cliArgs.push('-b', $('#astc-block').val());
    cliArgs.push('-e', $('#astc-effort').val());
    const astcencPath = $('#astcenc-path').val();
    if (astcencPath) cliArgs.push('-x', astcencPath);
  }
  try {
    setProgressStatus('Running conversion…');
    const resultJson = await invokeHost('execute_extension_command', {
      extensionId: 'font_converter',
      cliCommand: gen + ' font',
      cliArgs: cliArgs,
    });
    const result = JSON.parse(resultJson);
    onConvertComplete(result);
  } catch (err) {
    showError('Conversion failed: ' + err);
    log('ERROR: ' + err);
    resetConvertState();
  }
}
function onConvertComplete(result) {
  setProgressStatus('Done!');
  if (!fontBatchRunning) setTotalProgress(100);
  if (!result.success) {
    showError(result.error || 'Unknown conversion error');
    log('ERROR: ' + (result.error || 'Unknown conversion error'));
    resetConvertState();
    return;
  }
  $('#result-panel').removeClass('hidden');
  const stats = [];
  if (result.asset_ram_size !== undefined) stats.push(['RAM Size', result.asset_ram_size + ' B']);
  if (result.glyph_width !== undefined) stats.push(['Glyph Size', result.glyph_width + 'x' + result.glyph_height]);
  if (result.font_point_size !== undefined) stats.push(['Point Size', result.font_point_size]);
  if (result.num_chars !== undefined) stats.push(['Characters', result.num_chars]);
  if (result.elapsed_ms !== undefined) stats.push(['Time', (result.elapsed_ms / 1000).toFixed(2) + 's']);
  $('#result-stats').html(stats.map(([l, v]) => `
    <div class="stat-item">
      <span class="stat-label">${l}</span>
      <span class="stat-value">${v}</span>
    </div>
  `).join(''));
  if (result.output_files && result.output_files.length > 0) {
    const filesHtml = result.output_files.map(f =>
      `<div class="file-item list-group-item" onclick="openFile('${f.replace(/'/g, "\\'")}')">📄 ${f}</div>`
    ).join('');
    $('#result-files').html('<div class="hint">Output files</div>' + filesHtml);
    const sidecarJson = result.output_files.find(f => /\.json$/i.test(String(f)));
    if (sidecarJson) {
      state.lastJson = sidecarJson;
      updateEncoderState();
    }
  }
  resetConvertState();
}
function openFile(path) {
  invokeHost('open_in_explorer', { path });
}
function updateEncoderState() {
  const $btn = $('#btn-receive-last');
  if (!$btn.length) return;
  $btn.prop('disabled', !state.lastJson);
  $btn.attr('title', state.lastJson ? 'Use ' + state.lastJson : 'No conversion JSON yet');
  syncEncoderRun();
}
function receiveLastConversion() {
  if (!state.lastJson) {
    showError('No conversion JSON yet — convert a font first.', 'enc-error-panel');
    return;
  }
  $('#enc-json').val(state.lastJson);
  syncEncoderRun();
}
function clearEncoderInput() {
  $('#enc-input, #enc-json').val('');
  const $fill = $('#enc-progress-fill');
  if ($fill.length) $fill.css('width', '0%');
  updateEncoderState();
  if (typeof window.eabSyncQueueChrome === 'function') window.eabSyncQueueChrome();
}
function resetEncoder() {
  $('#enc-input, #enc-json, #enc-unknown').val('');
  const $out = $('#enc-output');
  if ($out.length) $out.val('.');
  const $pre = $('#enc-prefix');
  if ($pre.length) $pre.val('0');
  const $files = $('#enc-result-files');
  if ($files.length) $files.html('<div class="preview-placeholder">No output yet</div>');
  const $fill = $('#enc-progress-fill');
  if ($fill.length) $fill.css('width', '0%');
  const $err = $('#enc-error-panel');
  if ($err.length) $err.addClass('hidden');
  syncEncoderRun();
  if (typeof window.eabSyncQueueChrome === 'function') window.eabSyncQueueChrome();
}
let rangeRows = [];
let rangeTicked = new Set();
const UNICODE_BLOCKS = [
  ['Basic Latin', 0x0000, 0x007F],
  ['Latin-1 Supplement', 0x0080, 0x00FF],
  ['Latin Extended-A', 0x0100, 0x017F],
  ['Latin Extended-B', 0x0180, 0x024F],
  ['IPA Extensions', 0x0250, 0x02AF],
  ['Spacing Modifier Letters', 0x02B0, 0x02FF],
  ['Combining Diacritical Marks', 0x0300, 0x036F],
  ['Greek and Coptic', 0x0370, 0x03FF],
  ['Cyrillic', 0x0400, 0x04FF],
  ['Cyrillic Supplement', 0x0500, 0x052F],
  ['Armenian', 0x0530, 0x058F],
  ['Hebrew', 0x0590, 0x05FF],
  ['Arabic', 0x0600, 0x06FF],
  ['Syriac', 0x0700, 0x074F],
  ['Arabic Supplement', 0x0750, 0x077F],
  ['Thaana', 0x0780, 0x07BF],
  ['Devanagari', 0x0900, 0x097F],
  ['Bengali', 0x0980, 0x09FF],
  ['Gurmukhi', 0x0A00, 0x0A7F],
  ['Gujarati', 0x0A80, 0x0AFF],
  ['Oriya', 0x0B00, 0x0B7F],
  ['Tamil', 0x0B80, 0x0BFF],
  ['Telugu', 0x0C00, 0x0C7F],
  ['Kannada', 0x0C80, 0x0CFF],
  ['Malayalam', 0x0D00, 0x0D7F],
  ['Sinhala', 0x0D80, 0x0DFF],
  ['Thai', 0x0E00, 0x0E7F],
  ['Lao', 0x0E80, 0x0EFF],
  ['Tibetan', 0x0F00, 0x0FFF],
  ['Myanmar', 0x1000, 0x109F],
  ['Georgian', 0x10A0, 0x10FF],
  ['Hangul Jamo', 0x1100, 0x11FF],
  ['Ethiopic', 0x1200, 0x137F],
  ['Cherokee', 0x13A0, 0x13FF],
  ['Unified Canadian Aboriginal Syllabics', 0x1400, 0x167F],
  ['Khmer', 0x1780, 0x17FF],
  ['Mongolian', 0x1800, 0x18AF],
  ['Latin Extended Additional', 0x1E00, 0x1EFF],
  ['Greek Extended', 0x1F00, 0x1FFF],
  ['General Punctuation', 0x2000, 0x206F],
  ['Superscripts and Subscripts', 0x2070, 0x209F],
  ['Currency Symbols', 0x20A0, 0x20CF],
  ['Letterlike Symbols', 0x2100, 0x214F],
  ['Number Forms', 0x2150, 0x218F],
  ['Arrows', 0x2190, 0x21FF],
  ['Mathematical Operators', 0x2200, 0x22FF],
  ['Miscellaneous Technical', 0x2300, 0x23FF],
  ['Control Pictures', 0x2400, 0x243F],
  ['Box Drawing', 0x2500, 0x257F],
  ['Block Elements', 0x2580, 0x259F],
  ['Geometric Shapes', 0x25A0, 0x25FF],
  ['Miscellaneous Symbols', 0x2600, 0x26FF],
  ['Dingbats', 0x2700, 0x27BF],
  ['CJK Symbols and Punctuation', 0x3000, 0x303F],
  ['Hiragana', 0x3040, 0x309F],
  ['Katakana', 0x30A0, 0x30FF],
  ['Bopomofo', 0x3100, 0x312F],
  ['Hangul Compatibility Jamo', 0x3130, 0x318F],
  ['Kanbun', 0x3190, 0x319F],
  ['Enclosed CJK Letters and Months', 0x3200, 0x32FF],
  ['CJK Compatibility', 0x3300, 0x33FF],
  ['CJK Unified Ideographs', 0x4E00, 0x9FFF],
  ['Hangul Syllables', 0xAC00, 0xD7AF],
  ['Private Use Area', 0xE000, 0xF8FF],
  ['CJK Compatibility Ideographs', 0xF900, 0xFAFF],
  ['Alphabetic Presentation Forms', 0xFB00, 0xFB4F],
  ['Arabic Presentation Forms-A', 0xFB50, 0xFDFF],
  ['Small Form Variants', 0xFE50, 0xFE6F],
  ['Arabic Presentation Forms-B', 0xFE70, 0xFEFF],
  ['Halfwidth and Fullwidth Forms', 0xFF00, 0xFFEF],
  ['Specials', 0xFFF0, 0xFFFF],
  ['Mathematical Alphanumeric Symbols', 0x1D400, 0x1D7FF],
  ['Mahjong Tiles', 0x1F000, 0x1F02F],
  ['Domino Tiles', 0x1F030, 0x1F09F],
  ['Miscellaneous Symbols and Pictographs', 0x1F300, 0x1F5FF],
  ['Emoticons', 0x1F600, 0x1F64F],
  ['Transport and Map Symbols', 0x1F680, 0x1F6FF],
];
function openRangeDialog() {
  const $dlg = $('#range-dialog');
  if (!$dlg.length) return;
  $dlg.removeClass('hidden');
  if (!rangeTicked.size) {
    const $field = $('#char-range');
    textRanges($field.length ? $field.val() : '').forEach(r => rangeTicked.add(uCode(r[0]) + '-' + uCode(r[1])));
  }
  fillRangeRows(state.fontFile ? state.blocks[state.fontFile] : null);
  if (state.fontFile && !state.blocks[state.fontFile]) loadBlockInfo(true);
}
function fillRangeRows(blocks) {
  const $status = $('#range-status');
  const byRange = {};
  (blocks || []).forEach(b => { byRange[String(b.unicode_range || '').toUpperCase()] = b; });
  rangeRows = UNICODE_BLOCKS.map(b => {
    const range = uCode(b[1]) + '-' + uCode(b[2]);
    const info = byRange[range] || null;
    return { name: b[0], range, valid: info ? Number(info.valid_glyphs || 0) : null, all: info ? Number(info.all_glyphs || 0) : null };
  });
  renderRangeRows();
  const covered = rangeRows.filter(r => r.valid !== null).length;
  $status.text(rangeRows.length + ' ranges' +
    (blocks ? ' · ' + covered + ' covered by this font' : ' · pick a font to see its coverage'));
}
function renderRangeRows() {
  const $body = $('#range-body');
  $body.html(rangeRows.map((r, i) =>
    '<tr' + (r.valid ? '' : ' class="uncovered"') + '><td class="rt-check"><input type="checkbox" data-range-row="' + i + '"' +
    (rangeTicked.has(r.range) ? ' checked' : '') + ' onchange="syncRangeSelectAll()"></td>' +
    '<td>' + r.name + '</td><td class="rt-range">' + r.range + '</td>' +
    '<td class="rt-count">' + (r.valid === null ? '—' : r.valid + '/' + r.all) + '</td></tr>'
  ).join(''));
  syncRangeSelectAll();
}
function toggleAllRanges(checked) {
  $('#range-body input[data-range-row]').prop('checked', !!checked);
  syncRangeSelectAll();
}
function syncRangeSelectAll() {
  const $boxes = $('#range-body input[data-range-row]');
  const $on = $boxes.filter(function () { return $(this).prop('checked'); });
  rangeTicked = new Set($on.map(function () {
    return (rangeRows[Number($(this).attr('data-range-row'))] || {}).range;
  }).get().filter(Boolean));
  $('#range-select-all')
    .prop('checked', $boxes.length > 0 && $on.length === $boxes.length)
    .prop('indeterminate', $on.length > 0 && $on.length < $boxes.length);
}
function applyRangeSelection() {
  const picked = [];
  $('#range-body input[data-range-row]:checked').each(function () {
    const row = rangeRows[Number($(this).attr('data-range-row'))];
    if (row) picked.push(row.range);
  });
  if (!picked.length) { closeRangeDialog(); return; }
  $('#char-range').val(picked.join(',')).trigger('input');
  $('#use-range').prop('checked', true);
  closeRangeDialog();
}
function closeRangeDialog() {
  const $dlg = $('#range-dialog');
  if ($dlg.length) $dlg.addClass('hidden');
}
window.receiveLastConversion = receiveLastConversion;
window.resetEncoder = resetEncoder;
window.openRangeDialog = openRangeDialog;
window.closeRangeDialog = closeRangeDialog;
window.applyRangeSelection = applyRangeSelection;
window.toggleAllRanges = toggleAllRanges;
window.syncRangeSelectAll = syncRangeSelectAll;
window.switchTab = switchTab;
window.switchStruct = switchStruct;
/* Font type tabs react on pointerdown: the host's click_safety layer prevents the
   default on mousedown, so the click event is not reliable inside the webview.
   Keyboard activation is kept for buttons. */
function pickStructTab(btn) {
  if (!btn || btn.disabled) return;
  switchStruct(String(btn.getAttribute('data-struct') || 'legacy'));
}
$('#options-card')
  .on('pointerdown', '.struct-tab', function (ev) {
    if (ev.button === 0) pickStructTab(this);
  })
  .on('keydown', '.struct-tab', function (ev) {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    ev.preventDefault();
    pickStructTab(this);
  });
window.onChipPick = onChipPick;
window.refreshOptions = refreshOptions;
window.toggleAllFormats = toggleAllFormats;
window.syncAllFormat = syncAllFormat;
window.switchPreview = switchPreview;
function cancelConvert() {
  if (state.jobId) {
    invokeHost('cancel_job', { extensionId: 'font_converter', jobId: state.jobId });
  }
  resetConvertState();
  setProgressStatus('Cancelled');
}
function resetConvertState() {
  state.jobId = null;
  $('#btn-convert').prop('disabled', false);
  $('#convert-controls').addClass('hidden');
}
function log(msg) { console.log('[eab] ' + msg); }
function showError(msg, panelId) {
  const $panel = $('#' + (panelId || 'error-panel'));
  if (!$panel.length) return;
  $panel.text(msg).removeClass('hidden');
}
const ROW_SEL = '#input-list .file-item';
const rowMeta = {};
const jobIds = {};
let rowTicker = null;
function fmtSecs(ms) {
  if (!(ms > 0)) return '';
  const s = ms / 1000;
  return s < 10 ? s.toFixed(1) + 's' : Math.round(s) + 's';
}
function rowPathOf(el) { return $(el).attr('data-path') || $(el).attr('title') || ''; }
function baseName(p) { return String(p).split(/[\\/]/).pop() || ''; }
function rowEl(path) {
  const $rows = $(ROW_SEL);
  const $exact = $rows.filter(function () { return rowPathOf(this) === path; }).first();
  if ($exact.length) return $exact;
  const base = baseName(path);
  if (!base) return null;
  const $loose = $rows.not('.done').filter(function () { return $(this).text().indexOf(base) >= 0; }).first();
  return $loose.length ? $loose : null;
}
function setText($el, text) {
  if (!$el || !$el.length) return;
  const node = $el.contents().get(0);
  if (!node || node.nodeType !== 3) { $el.text(text); return; }
  if (node.nodeValue !== text) node.nodeValue = text;
}
function paintRow(path, startedAt) {
  const $el = rowEl(path);
  if (!$el) return;
  const m = rowMeta[path] || {};
  ['converting', 'done', 'failed', 'cancelled', 'current', 'stopping'].forEach(c => $el.removeClass(c));
  if (m.state) $el.addClass(m.state);
  if (fontBatchRunning && path === $('#font-path').val()) $el.addClass('current');
  const $st = $el.find('.file-item-status').first();
  const $lbl = $el.find('.file-item-bar-label').first();
  const since = m.t0 || startedAt;
  const live = m.state === 'converting' && since;
  setText($lbl, live ? 'converting ' + fmtSecs(Date.now() - since) + '…' : '');
  setText($st, live ? '' : (m.resultText || ''));
}
window.eabPaintRows = function () {
  fontFiles.forEach(p => paintRow(p));
};
function startRowTicker() {
  if (rowTicker) return;
  rowTicker = setInterval(function () {
    let live = false;
    for (const p in rowMeta) {
      if (rowMeta[p].t0 && !rowMeta[p].ms) { paintRow(p, rowMeta[p].t0); live = true; }
    }
    if (!live) { clearInterval(rowTicker); rowTicker = null; }
  }, 200);
}
window.eabStopRow = function (btn) {
  const $stopRow = btn && btn.closest ? btn.closest('.file-item') : null;
  if ($stopRow) $($stopRow).addClass('stopping');
  const row = btn && btn.closest ? btn.closest(ROW_SEL) : null;
  const path = row ? rowPathOf(row) : '';
  const id = path ? jobIds[path] : null;
  if (id) API_EAB_cancelJob({ jobId: id }).catch(function () {  });
};
function runCliJob(cliCommand, cliArgs) {
  const at = cliArgs.indexOf('-i');
  const path = at >= 0 ? cliArgs[at + 1] : '';
  const t0 = Date.now();
  if (path) {
    const f = cliArgs.indexOf('-f');
    rowMeta[path] = { state: 'converting', status: '', resultText: '', t0: t0, ms: 0,
      label: 'Converting' + (f >= 0 && cliArgs[f + 1] ? ' to ' + cliArgs[f + 1] : '') };
    paintRow(path, t0); startRowTicker();
  }
  return API_EAB_startJob({ command: cliCommand, args: cliArgs }).then(function (resp) {
    if (!resp || !resp.ok || !resp.jobId) throw new Error((resp && resp.error) || 'Could not start the job');
    if (path) jobIds[path] = resp.jobId;
    return new Promise(function (resolve, reject) {
      const poll = setInterval(function () {
        API_EAB_pollJob({ jobId: resp.jobId }).then(function (p) {
          if (!p || !p.ok || !p.progress) return;
          const st = p.progress.status;
          if (st === 0 || st === 1) return;
          clearInterval(poll);
          if (path) {
            delete jobIds[path];
            const ms = Date.now() - t0;
            let code = null, reason = '';
            try { const r = JSON.parse(p.progress.result || '{}'); if (typeof r.exit_code === 'number') code = r.exit_code; reason = r.error || ''; } catch (e) {}
            rowMeta[path].state = st === 2 ? 'done' : st === 3 ? 'failed' : 'cancelled';
            rowMeta[path].ms = ms;
            rowMeta[path].resultText = st === 2 ? 'success in ' + fmtSecs(ms)
              : st === 3 ? (code !== null ? 'failed, error code: ' + code : 'failed: ' + (reason || 'unknown error'))
              : 'cancelled';
            paintRow(path);
          }
          if (path) {
            let why = '';
            if (st !== 2) { try { why = ' — ' + (JSON.parse(p.progress.result || '{}').error || 'failed'); } catch (e) { why = ' — failed'; } }
            log((st === 2 ? '✓ ' : st === 3 ? '✗ ' : '⊘ ') + baseName(path) + ' in ' + fmtSecs(Date.now() - t0) + why);
          }
          if (st === 2) resolve(p.progress.result || '{}');
          else reject('Conversion failed');
        }).catch(function () {  });
      }, 250);
    });
  });
}
function invokeHost(cmd, args) {
  switch (cmd) {
    case 'read_file_base64':
      return eabSampleData(args.path).then(resp => {
        if (resp.ok && resp.data) return resp.data;
        return Promise.reject(resp.error || 'Failed to read file');
      });
    case 'execute_extension_command':
      return runCliJob(args.cliCommand, args.cliArgs);
    case 'open_in_explorer':
      return API_EAB_openOutputLocation({ path: args.path }).then(resp => {
        if (resp.ok) return;
        return Promise.reject(resp.error || 'Failed to open location');
      });
    case 'cancel_job':
      return API_EAB_cancelJob({ jobId: args.jobId }).then(resp => {
        if (resp.ok) return;
        return Promise.reject(resp.error || 'Failed to cancel');
      });
    default:
      return Promise.reject('Unknown command: ' + cmd);
  }
}
function pickFontFiles() {
  if (!isEmbedded()) {
    const raw = prompt('Enter font file paths (separate several with ;):');
    if (raw) addFontFiles(raw.split(';').map(p => p.trim()).filter(Boolean));
    return;
  }
  API_EAB_pickFiles({ filters: FONT_FILTERS }).then(resp => {
    const paths = resp.paths || (resp.path ? [resp.path] : []);
    if (resp.ok && paths.length) addFontFiles(paths);
  }).catch(err => showError('Failed to open file picker: ' + err));
}
function pickFontFolder() {
  if (!isEmbedded()) {
    const path = prompt('Enter the folder holding the fonts:');
    if (path) addFontFiles([path]);
    return;
  }
  API_EAB_pickFolder({ extensions: FONT_FILTERS[0].extensions, readBase64: false }).then(resp => {
    if (!resp || !resp.ok || !resp.folder) return;
    const paths = resp.paths || [];
    if (paths.length) addFontFiles(paths);
    else showError('No font file in that folder.');
  }).catch(err => showError('Failed to open folder picker: ' + err));
}
function setCurrentFont(index) {
  const i = (index >= 0 && index < fontFiles.length) ? index : 0;
  const path = fontFiles[i] || '';
  state.fontFile = path || null;
  state.stamp++;
  delete state.blocks[path];
  const $el = $('#font-path');
  if ($el.length) $el.val(path);
  renderFontList();
  if (path) {
    loadFontPreview(path);
    loadBlockInfo();
  } else {
    setPreviewLoading('font', false);
    setPreviewLoading('blocks', false);
    setPreviewLoading('chars', false);
    loadBlockInfo();
  }
  syncConvertGate();
  syncPreviewColumns();
}
const _fontUpdateBatchState = updateBatchState;
updateBatchState = function () {
  _fontUpdateBatchState();
  syncConvertGate();
  syncPreviewColumns();
};
const _fontResetConvertState = resetConvertState;
resetConvertState = function () {
  _fontResetConvertState();
  updateBatchState();
};
updateBatchState();
function clearAllInputs() {
  fontFiles.length = 0;
  setCurrentFont(0);
  updateBatchState();
}
(function pasteRouter() {
  if (!$('.drop-zone[data-for]').length) return;
  function dropZone() {
    var $main = $('.tab-content.active .app-main').first();
    if (!$main.length) $main = $('.app-main:not(.hidden)');
    if (!$main.length) $main = $(document);
    return $main.find('.drop-zone[data-for]').first();
  }
  function queue(paths) {
    var $zone = dropZone();
    var field = $zone.length ? document.getElementById($zone.attr('data-for')) : null;
    var single = field && (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') ? field : null;
    if (single) {
      single.value = paths[0];
      single.dispatchEvent(new Event('input', { bubbles: true }));
      single.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (typeof window.eabOnDrop !== 'function') return !!single;
    try { window.eabOnDrop(paths, $zone.get(0) || null); return true; } catch (e) { return !!single; }
  }
  function unquote(s) { return String(s == null ? '' : s).trim().replace(/^"(.*)"$/, '$1'); }
  function looksLikePath(s) {
    s = unquote(s);
    return /^file:\/\//i.test(s)
      || /^[a-zA-Z]:[\\/]/.test(s)
      || /^\\\\[^\\]/.test(s)
      || /^\//.test(s);
  }
  function asPath(s) {
    s = unquote(s);
    if (/^file:\/\//i.test(s)) {
      s = s.replace(/^file:\/\/\/?/i, '');
      try { s = decodeURIComponent(s); } catch (e) {  }
    }
    if (/^\/[a-zA-Z]:\//.test(s)) s = s.slice(1);
    return s.replace(/\//g, '\\');
  }
  function park(blob) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function () {
        var url = String(reader.result || '');
        var comma = url.indexOf(',');
        var b64 = comma >= 0 ? url.slice(comma + 1) : '';
        if (!b64) { resolve(''); return; }
        API_EAB_writeTempFile({ name: blob.name || 'paste.png', dataBase64: b64 }).then(function (resp) {
          resolve(resp && resp.ok && resp.path ? resp.path : '');
        });
      };
      reader.onerror = function () { resolve(''); };
      reader.readAsDataURL(blob);
    });
  }
  function editable(el) {
    const $el = $(el);
    if (!$el.length) return false;
    const tag = $el.prop('tagName');
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') return false;
    if ($el.prop('readOnly') || $el.prop('disabled')) return false;
    if (tag === 'INPUT' && /^(checkbox|radio|button|submit|range|file)$/i.test($el.prop('type') || '')) return false;
    return true;
  }
  var pasteRun = null;
  var pasteSeq = 0;
  function pasteTextEl($zone) {
    if (!$zone || !$zone.length) return $();
    var $box = $zone.find('> .dz-paste');
    if (!$box.length) {
      $box = $('<div class="dz-paste" role="status" aria-live="polite">').html(
        '<span class="dz-paste-spin" aria-hidden="true"></span><span class="dz-paste-text"></span>');
      $zone.append($box);
    }
    return $box.find('.dz-paste-text').first();
  }
  function pastePaint() {
    if (!pasteRun) return;
    var $text = pasteTextEl(pasteRun.zone);
    if (!$text.length) return;
    var dots = new Array(pasteRun.dots + 1).join('.');
    var n = pasteRun.done.length;
    if (!n) {
      $text.text('Pasting… reading the clipboard' + dots);
      return;
    }
    $text.text('Pasting ' + pasteRun.done.join('.') +
      (pasteRun.total > 1 ? ' of ' + pasteRun.total : '') +
      ' file' + (pasteRun.total === 1 ? '' : 's') + ' from clipboard' + dots);
  }
  function pasteBegin(zone, total) {
    if (pasteRun && pasteRun.ticker) clearInterval(pasteRun.ticker);
    var run = { zone: zone, done: [], total: total || 0, dots: 1, token: ++pasteSeq, ticker: null };
    pasteRun = run;
    zone.addClass('is-pasting');
    pastePaint();
    run.ticker = setInterval(function () {
      if (pasteRun !== run) return;
      run.dots = (run.dots % 5) + 1;
      pastePaint();
    }, 240);
  }
  function pasteStep(n, total) {
    if (!pasteRun) return;
    pasteRun.total = total;
    pasteRun.done.push(n);
    pastePaint();
  }
  function pasteDone(count) {
    if (!pasteRun) return;
    var run = pasteRun;
    pasteRun = null;
    clearInterval(run.ticker);
    var $text = pasteTextEl(run.zone);
    if ($text.length) {
      $text.text(count
        ? 'Pasted ' + count + ' file' + (count === 1 ? '' : 's') + ' from clipboard'
        : 'Nothing usable on the clipboard');
    }
    if (!run.zone.length) return;
    setTimeout(function () {
      if (pasteSeq !== run.token) return;
      run.zone.removeClass('is-pasting');
      var $t = pasteTextEl(run.zone);
      if ($t.length) $t.text('');
    }, 1600);
  }
  $(document).on('paste', function (e) {
    var dt = (e.originalEvent || e).clipboardData;
    if (!dt) return;
    var $zone = dropZone();
    if (editable(e.target) && (!$zone.length || $(e.target).attr('id') !== $zone.attr('data-for'))) return;
    var files = [];
    try { files = Array.prototype.slice.call(dt.files || []); } catch (err) { files = []; }
    if (!files.length && dt.items) {
      for (var i = 0; i < dt.items.length; i++) {
        if (dt.items[i].kind === 'file') {
          var f = dt.items[i].getAsFile();
          if (f) files.push(f);
        }
      }
    }
    var paths = [];
    var blobs = [];
    files.forEach(function (f) { if (f.path) paths.push(f.path); else blobs.push(f); });
    if (!paths.length && !blobs.length) {
      var text = '';
      try { text = dt.getData('text/plain') || ''; } catch (err) { text = ''; }
      paths = text.split(/\r?\n/).map(unquote).filter(looksLikePath).map(asPath);
    }
    var total = paths.length + blobs.length;
    if (!total) return;
    e.preventDefault();
    pasteBegin($zone, total);
    var landed = 0;
    if (paths.length) {
      if (queue(paths)) landed += paths.length;
      for (var k = 0; k < paths.length; k++) pasteStep(k + 1, total);
    }
    if (!blobs.length) {
      setTimeout(function () { pasteDone(landed); }, 450);
      return;
    }
    var parked = 0;
    var parkedPaths = [];
    Promise.all(blobs.map(function (blob) {
      return park(blob).then(function (path) {
        parked++;
        pasteStep(paths.length + parked, total);
        if (path) parkedPaths.push(path);
      });
    })).then(function () {
      var all = paths.concat(parkedPaths);
      if (all.length && queue(all)) landed = all.length;
      pasteDone(landed);
    }, function () { pasteDone(landed); });
  });
})();
applyGeneration();
switchPreview('font');
updateEncoderState();
(function charSourcesFeedPreview() {
  function refreshCharPreview() {
    if (state.previewTab === 'chars') renderCharPreview();
  }
  $('#char-range, #use-range, #use-utf8').on('input change', refreshCharPreview);
})();
function chipReady() {
  var ok = false;
  $.each(CHIP_BOX, function (kind, id) {
    if (String($('#' + id).val() || '')) ok = true;
  });
  return ok;
}
function charSourcesReady() {
  var rangeOn = !$('#use-range').length || $('#use-range').prop('checked');
  var utf8On = !$('#use-utf8').length || $('#use-utf8').prop('checked');
  if (rangeOn && $.trim(String($('#char-range').val() || ''))) return true;
  return utf8On && !!state.charFile;
}
function syncConvertGate() {
  var $btn = $('#btn-convert');
  if (!$btn.length) return;
  var rangeOn = $('#use-range').prop('checked');
  var utf8On = $('#use-utf8').prop('checked');
  var missingChars = !rangeOn && !utf8On ? '#use-range' :
    rangeOn && !$.trim(String($('#char-range').val() || '')) ? '#char-range' : '#char-file';
  var missing = !fontFiles.length ? '#input-card' : !chipReady() ? '#chip-one' :
    !charSourcesReady() ? missingChars : '';
  $btn.attr('data-eab-missing', !fontBatchRunning ? missing : '')
    .prop('disabled', fontBatchRunning || !!missing);
}
function syncEncoderRun() {
  var $btn = $('#btn-encode');
  if (!$btn.length) return;
  var json = $.trim(String($('#enc-json').val() || ''));
  var text = $.trim(String($('#enc-input').val() || ''));
  var out = $.trim(String($('#enc-output').val() || ''));
  var missing = !json ? '#enc-json' : !text ? '#enc-input' : !out ? '#enc-output' : '';
  $btn.attr('data-eab-missing', encoderRunning ? '' : missing)
    .prop('disabled', encoderRunning || !!missing);
}
function runBarGroup(mid) {
  return $(mid).children().filter(function () {
    return !this.getAttribute('data-eab-role') && !$(this).hasClass('card');
  });
}
function rowPreviewReady($row) {
  var $info = $row.find('#preview-info');
  if ($info.length) return $.trim($info.text()) === 'Font loaded';
  var $result = $row.find('#enc-result-files');
  if ($result.length) return $result.children().not('.preview-placeholder').length > 0;
  return true;
}
function syncPreviewColumns() {
  $('.app-main').each(function () {
    var $row = $(this);
    var $mid = $row.children('.mid-col');
    var $right = $row.children('.right-col');
    var group = runBarGroup($mid.get(0)).add(runBarGroup($right.get(0)));
    if (!$mid.length || !$right.length || !group.length) {
      $row.removeClass('no-preview');
      return;
    }
    var noPreview = !$row.hasClass('is-queue-empty') && !rowPreviewReady($row);
    $row.toggleClass('no-preview', noPreview);
    if (group.parent().get(0) !== $right.get(0) || group.index() !== 0) $right.prepend(group);
  });
}
var previewSyncQueued = false;
function queuePreviewSync() {
  if (previewSyncQueued) return;
  previewSyncQueued = true;
  setTimeout(function () { previewSyncQueued = false; syncPreviewColumns(); }, 0);
}
$(document).ready(function () {
  syncConvertGate();
  syncEncoderRun();
  syncPreviewColumns();
  setTimeout(syncPreviewColumns, 0);
  $('#char-range, #use-range, #use-utf8, #char-file, #chip-one').on('input change', function () { syncConvertGate(); });
  $('#enc-json, #enc-input, #enc-output, #enc-prefix, #enc-unknown').on('input change', function () { syncEncoderRun(); });
  $(window).on('resize', function () { queuePreviewSync(); });
  if (typeof MutationObserver !== 'function') return;
  new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      var target = records[i].target;
      var cls = target && target.classList;
      if (!cls) continue;
      if (records[i].type === 'attributes') {
        if (cls.contains('preview-info') || cls.contains('pv-font-loading') || cls.contains('app-row')) {
          queuePreviewSync();
          return;
        }
      } else if (target.id === 'preview-info' || cls.contains('result-files')) {
        queuePreviewSync();
        return;
      }
    }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
});
var SAMPLE_DEFAULT_GROUP = 'legacy';
var SAMPLE_TABS = {converter: {folders: {bt82x: 'BT82X', legacy: 'Legacy'}, default: 'legacy'}, encoder: {folders: {legacy: 'Legacy'}, default: 'legacy'}};


var SAMPLE_FOLDERS = {bt82x: 'BT82X', legacy: 'Legacy'};
var sampleRel = {};
function eabSampleRead(rel) {
  if (typeof API_EAB_readExtFile !== 'function') return Promise.resolve({});
  return API_EAB_readExtFile({path: rel});
}
function eabSampleList(rel) {
  if (typeof API_EAB_listExtAssets !== 'function') return Promise.resolve({});
  return API_EAB_listExtAssets({path: rel});
}
function eabSampleData(path) {
  var rel = sampleRel[path];
  if (rel) return eabSampleRead(rel);
  return API_EAB_readFileAsBase64({path: path});
}
function eabSampleGroup() {
  var $picker = $('#chip-one');
  var pick = $picker.length ? String($picker.val() || '').split(':') : [];
  var kind = String(pick[0] || '');
  var value = String(pick[1] || '');
  if (kind === 'part' && typeof CHIP_TABLE !== 'undefined' && CHIP_TABLE[value]) return CHIP_TABLE[value][1];
  if (kind === 'gen' && typeof CHIP_GEN !== 'undefined' && CHIP_GEN[value]) return CHIP_GEN[value][1];
  var direct = chipGroup();
  if (SAMPLE_FOLDERS[direct]) return direct;
  return SAMPLE_DEFAULT_GROUP;
}
function eabSampleFail(ev) {
  var $btn = $(ev && ev.target ? ev.target : $('[data-sample]').first());
  if (!$btn.length) return;
  var text = $btn.text();
  $btn.text('\u26a0 No samples');
  setTimeout(function () { $btn.text(text); }, 6000);
}
function eabSampleQueue(tab, paths) {
  if (tab === 'encoder') {
    var json = paths.filter(function (p) { return /[.]json$/i.test(p); })[0] || '';
    var text = paths.filter(function (p) { return /encode.*[.]txt$/i.test(p); })[0]
      || paths.filter(function (p) { return /[.]txt$/i.test(p); })[0] || '';
    if (json) $('#enc-json').val(json);
    if (text) $('#enc-input').val(text).trigger('input');
    if (!$('#enc-output').val()) $('#enc-output').val('.');
    if (typeof syncEncoderRun === 'function') syncEncoderRun();
    return;
  }
  var zone = document.querySelector('#tab-' + tab + ' .drop-zone[data-for]')
    || document.querySelector('#tab-' + tab + ' .drop-zone')
    || document.querySelector('.drop-zone[data-for]');
  var fonts = paths.filter(function (p) { return /[.](ttf|otf|ttc|woff2?)$/i.test(p); });
  if (typeof window.eabOnDrop === 'function') window.eabOnDrop(fonts.length ? fonts : paths, zone);
  if (typeof syncStartDisabled === 'function') syncStartDisabled();
}

window.eabUseSample = function (tab, ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  if (ev && ev.preventDefault) ev.preventDefault();
  var conf = SAMPLE_TABS[tab];
  if (!conf) return;
  var group = eabSampleGroup();
  var folder = conf.folders[group] || SAMPLE_FOLDERS[SAMPLE_DEFAULT_GROUP];
  var base = 'samples/' + folder + '/';
  eabSampleList('samples/' + folder).then(function (resp) {
    var files = resp && resp.files ? resp.files : [];
    if (!files.length) return [];
    return Promise.all(files.map(function (name) {
      var rel = base + name;
      return eabSampleRead(rel).then(function (r) {
        if (r && r.ok && r.path) { sampleRel[r.path] = rel; return r.path; }
        return '';
      }, function () { return ''; });
    }));
  }).then(function (paths) {
    var good = (paths || []).filter(Boolean);
    if (!good.length) { eabSampleFail(ev); return; }
    eabSampleQueue(tab, good);
  });
};
