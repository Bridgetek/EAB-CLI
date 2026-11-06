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

function isEmbedded() {
  return window.parent !== window;
}
function pickFile(promptText, filters) {
  if (!isEmbedded()) {
    const answer = askStandalone(promptText);
    return Promise.resolve(answer || null);
  }
  return API_EAB_pickFile({ filters: filters })
    .then(resp => (resp.ok && resp.path) ? resp.path : null)
    .catch(() => null);
}
function pickFiles(filters) {
  if (!isEmbedded()) {
    const answer = askStandalone('Source file(s) — one per line:');
    if (!answer) return Promise.resolve([]);
    return Promise.resolve(answer.split(/[\r\n,]+/)
      .map((s) => s.trim()).filter((s) => s.length > 0));
  }
  return API_EAB_pickFile({ filters: filters, multiple: true })
    .then((resp) => {
      if (!resp.ok) return [];
      if (Array.isArray(resp.paths) && resp.paths.length) return resp.paths;
      return resp.path ? [resp.path] : [];
    })
    .catch(() => []);
}
function askStandalone(promptText) {
  try {
    return prompt(promptText, '') || null;
  } catch (err) {
    log('No file picker outside the app — type the path into the row instead.');
    return null;
  }
}
const MANIFEST_FILTERS = [
  { name: 'FlashGen manifests', extensions: ['json'] },
];
async function onBuildComplete(result) {
  if (!result || result.success !== true) {
    const msg = (result && result.error) || 'unknown error';
    showError(msg);
    log('ERROR: ' + msg);
    return;
  }
  const files = Array.isArray(result.output_files) ? result.output_files : [];
  const bin = result.output_path || '';
  $('#result-empty').addClass('hidden');
  $('#result-stats').removeClass('hidden');
  const stats = [
    ['Flash Image', shortName(bin) || '-'],
    ['Elapsed', ((result.elapsed_ms || 0) / 1000).toFixed(2) + 's'],
    ['Size', result.flash_size ? formatBytes(result.flash_size) : '-'],
    ['Assets', result.num_assets != null ? String(result.num_assets) : '-'],
  ];
  $('#result-stats').html(stats.map(([l, v]) => `
    <div class="stat-item">
      <span class="stat-label">${esc(l)}</span>
      <span class="stat-value path-value">${esc(v)}</span>
    </div>
  `).join(''));
  $('#result-files').html(files.length
    ? `<div style="font-size:12px;color:var(--text-dim);margin-bottom:4px;">Output files (click to reveal):</div>` +
      files.map((f) => `<div class="file-out" onclick="revealFile('${f.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')">📄 ${esc(shortName(f))}</div>`).join('')
    : '');
  log('Build finished.');
  for (const f of files) log('  ' + f);
  if (result.flash_map && String(result.flash_map).trim() !== '') {
    $('#flash-map').text(result.flash_map);
    $('#flash-map').removeClass('hidden');
    $('#map-empty').addClass('hidden');
  }
}
function clearBuildResults() {
  $('#result-empty').removeClass('hidden');
  $('#result-stats').addClass('hidden');
  $('#result-files').html('');
  $('#flash-map').text('');
  $('#flash-map').addClass('hidden');
  $('#map-empty').removeClass('hidden');
}
function formatBytes(n) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = Number(n) || 0;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return (i === 0 ? v : v.toFixed(1)) + ' ' + units[i];
}
function shortName(p) {
  if (!p) return '';
  const parts = String(p).split(/[\\/]/);
  return parts[parts.length - 1] || p;
}
function revealFile(path) {
  API_EAB_openOutputLocation({ path: path });
}
function log(msg) { console.log('[eab] ' + msg); }
function showError(msg) {
  const $panel = $('#error-panel');
  $panel.text(msg);
  $panel.removeClass('hidden');
}
function hideError() {
  $('#error-panel').addClass('hidden');
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
const MANIFEST_COMMENT =
  'EAB flashgen input. After running: the flash image, flash.json/.map/.edf/.c and the header (FLASH_ADDR_* constants)';
const GEN_FALLBACK_META = {
  devices: [
    { device: 'BT820', chip: 'bt82x' },
    { device: 'BT818', chip: 'legacy' }, { device: 'BT817', chip: 'legacy' },
    { device: 'BT816', chip: 'legacy' }, { device: 'BT815', chip: 'legacy' },
    { device: 'BT883', chip: 'legacy' }, { device: 'BT882', chip: 'legacy' },
    { device: 'BT881', chip: 'legacy' }, { device: 'BT880', chip: 'legacy' },
    { device: 'FT813', chip: 'legacy' }, { device: 'FT812', chip: 'legacy' },
    { device: 'FT811', chip: 'legacy' }, { device: 'FT810', chip: 'legacy' },
    { device: 'FT800', chip: 'legacy' }, { device: 'FT801', chip: 'legacy' },
  ],
  types: ['font', 'image', 'video', 'animation', 'audio', 'raw'],
  image_formats: {
    'bt82x': ['RGB6', 'RGB8', 'ARGB6', 'ARGB8', 'LA1', 'LA2', 'LA4', 'LA8', 'L1', 'L2', 'L4', 'L8',
      'YCBCR', 'PALETTEDARGB8', 'ASTC_4x4', 'ASTC_5x4', 'ASTC_5x5', 'ASTC_6x5', 'ASTC_6x6',
      'ASTC_8x5', 'ASTC_8x6', 'ASTC_8x8', 'ASTC_10x5', 'ASTC_10x6', 'ASTC_10x8', 'ASTC_10x10',
      'ASTC_12x10', 'ASTC_12x12'],
    'legacy': ['ARGB1555', 'RGB332', 'ARGB2', 'ARGB4', 'RGB565', 'PALETTED', 'PALETTED565',
      'PALETTED4444', 'PALETTED8', 'L1', 'L2', 'L4', 'L8', 'ASTC_4x4', 'ASTC_5x4', 'ASTC_5x5',
      'ASTC_6x5', 'ASTC_6x6', 'ASTC_8x5', 'ASTC_8x6', 'ASTC_8x8', 'ASTC_10x5', 'ASTC_10x6',
      'ASTC_10x8', 'ASTC_10x10', 'ASTC_12x10', 'ASTC_12x12', 'DXT1_L1_RGB565',
      'DXT1_L1_PALETTED565', 'DXT1_L2_RGB565', 'DXT1_L2_PALETTED565'],
  },
  font_formats: ['L1', 'L2', 'L4', 'L8', 'ASTC_4x4', 'ASTC_5x4', 'ASTC_5x5', 'ASTC_6x5', 'ASTC_6x6',
    'ASTC_8x5', 'ASTC_8x6', 'ASTC_8x8', 'ASTC_10x5', 'ASTC_10x6', 'ASTC_10x8', 'ASTC_10x10',
    'ASTC_12x10', 'ASTC_12x12'],
  asset_suffix: {
    'bt82x': { font: '.glyph', image: '.raw', video: '.avi', animation: '.anim.reloc', audio: '.wav', raw: '' },
    legacy: { font: '.glyph', image: '.raw', video: '.avi', animation: '.anim.ram_g', audio: '.raw', raw: '' },
  },
  defaults: { font_format: 'L4', font_size: 25, image_format: 'L8' },
  font_split: { chips: ['legacy'], format_prefix: 'ASTC' },
  entry_options: {},
};
const genState = {
  meta: null,
  entries: [],
  busy: false,
  manifestPath: '',
};
function planSetText(id, text) {
  $('#' + id).text(text);
}
function planBuild() {
  const entries = genState.entries || [];
  const chip = genChip();
  const device = genDevice() || '-';
  const assets = [];
  const warnings = [];
  const seen = {};
  let missingSrc = 0;
  let unnamed = 0;
  entries.forEach((entry, idx) => {
    const typed = String(entry.name || '').trim();
    let name = typed;
    if (!name && genAutoNameOn()) name = genAutoNameFor(entry, idx);
    if (!name) {
      unnamed++;
      name = 'entry#' + (idx + 1);
    }
    if (!String(entry.src || '').trim()) missingSrc++;
    const split = genSplits(entry);
    const pair = split
      ? (String(entry.outputs || '').trim() || genSplitDefault(entry)).split(',').map(s => s.trim()).filter(Boolean)
      : [name];
    pair.forEach(assetName => {
      const key = assetName.toUpperCase();
      if (seen[key] !== undefined) {
        warnings.push('Duplicate asset name "' + assetName + '" (entries ' + (seen[key] + 1) + ' and ' + (idx + 1) + ') — the second one overwrites the first.');
      } else {
        seen[key] = idx;
      }
      assets.push({ name: assetName, type: entry.type, split: split });
    });
  });
  if (missingSrc) warnings.push(missingSrc + ' entry(ies) have no source file yet.');
  if (unnamed) warnings.push(unnamed + ' entry(ies) have no name (they use the auto pattern).');
  return {
    device: device,
    chip: chip,
    entries: entries.length,
    assets: assets,
    warnings: warnings,
    image: $('#gen-output').val() || '-',
    header: $('#gen-header').val() || '-',
  };
}
function planRender() {
  const plan = planBuild();
  const $body = $('#plan-body');
  const $empty = $('#plan-empty');
  const count = plan.entries;
  planSetText('plan-device', plan.device + '  (' + (normChip(plan.chip) === 'bt82x' ? 'BT82X' : 'Pre-BT82x') + ')');
  planSetText('plan-entries', String(count));
  planSetText('plan-assets', String(plan.assets.length));
  planSetText('plan-image', plan.image);
  planSetText('plan-header', plan.header);
  const $names = $('#plan-names');
  if ($names.length) {
    $names.html(plan.assets.map((a, i) =>
      '<span class="plan-chip' + (a.split ? ' is-split' : '') + '" title="' +
        esc(a.type + (a.split ? ' — split into .glyph + .xfont' : '')) + '">' +
        '<span class="plan-chip-idx">' + (i + 1) + '</span>' + esc(a.name) + '</span>'
    ).join(''));
  }
  const $warn = $('#plan-warnings');
  if ($warn.length) {
    if (plan.warnings.length) {
      $warn.html(plan.warnings.map(w => '<div class="plan-warn">⚠ ' + esc(w) + '</div>').join(''));
      $warn.removeClass('hidden');
    } else {
      $warn.html('');
      $warn.addClass('hidden');
    }
  }
  if ($body.length) $body.toggleClass('hidden', count === 0 && plan.assets.length === 0);
  if ($empty.length) $empty.toggleClass('hidden', count > 0);
  syncGenBuild();
  syncNoPreviewRows();
}
const _planGenRender = genRender;
genRender = function () {
  _planGenRender();
  planRender();
};
function genPreviewReady() {
  const $body = $('#plan-body');
  return $body.length > 0 && !$body.hasClass('hidden');
}
function syncGenBuild() {
  const missing = genState.busy ? '' : !chipGeneration() ? '#chip-one' : genBuildMissing();
  $('#btn-gen-build').attr('data-eab-missing', missing)
    .prop('disabled', !!genState.busy || !!missing);
}
function genRunGroup(mid) {
  return $(mid).children().filter(function () {
    return !this.getAttribute('data-eab-role') && !$(this).hasClass('card');
  });
}
function syncNoPreviewRows() {
  $('.app-row').each(function () {
    const $row = $(this);
    const $mid = $row.children('.mid-col');
    const $right = $row.children('.right-col');
    if (!$mid.length || !$right.length) return;
    const on = !$row.hasClass('is-queue-empty') && !genPreviewReady();
    $row.toggleClass('no-preview', on);
    const group = genRunGroup($mid.get(0)).add(genRunGroup($right.get(0)));
    if (!group.length) return;
    const $target = on ? $right : $mid;
    if (group.parent().get(0) === $target.get(0)) return;
    const $anchor = on ? $right.children().not(group).first() : $mid.children().not(group).first();
    if ($anchor.length) group.insertBefore($anchor);
    else group.appendTo($target);
  });
}
let noPreviewQueued = false;
function queueNoPreviewSync() {
  if (noPreviewQueued) return;
  noPreviewQueued = true;
  setTimeout(function () { noPreviewQueued = false; syncNoPreviewRows(); }, 0);
}
$(document).ready(function () {
  syncNoPreviewRows();
  setTimeout(syncNoPreviewRows, 0);
  if (typeof MutationObserver !== 'function') return;
  new MutationObserver(function (records) {
    for (let i = 0; i < records.length; i++) {
      const cls = records[i].target && records[i].target.classList;
      if (cls && (cls.contains('app-row') || cls.contains('plan-body') || cls.contains('plan-empty'))) {
        queueNoPreviewSync();
        return;
      }
    }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
});
function normChip(v) {
  const c = String(v == null ? '' : v).trim().toLowerCase();
  return (c === 'bt82x' || c === 'bt820') ? 'bt82x' : (c || '');
}
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
var PART_OF_GENERATION = { ft80x: 'FT800', ft81x: 'FT810', bt88x: 'BT880', bt81x: 'BT817', bt82x: 'BT820' };
function chipRow(value) {
  const key = String(value || '').toUpperCase();
  return CHIP_TABLE[key] || CHIP_GEN[key] || null;
}
function chipGeneration() {
  let value = String($('#chip-gen').val() || '');
  if (!value) value = String($('#chip-name').val() || '');
  const row = chipRow(value);
  return row ? row[1] : '';
}
function chipGroup() {
  return chipGeneration() === 'bt82x' ? 'bt82x' : 'legacy';
}
function chipBoxLabel(which) {
  const $box = $('#' + CHIP_BOX[which]);
  return $box.length ? $box.parent().find('[data-chip-label="' + which + '"]').eq(0) : $();
}
function chipPicked() {
  for (let i = 0; i < CHIP_ORDER.length; i++) {
    const $sel = $('#' + CHIP_BOX[CHIP_ORDER[i]]);
    const value = $sel.length ? String($sel.val() || '') : '';
    if (value) return { kind: CHIP_ORDER[i], value: value };
  }
  return null;
}
function syncChipPicker() {
  const $picker = $('#chip-one');
  if (!$picker.length || !$picker.find('option[value=""]').length) return;
  const picked = chipPicked();
  $picker.val(picked ? picked.kind + ':' + picked.value : '');
}
function buildChipPicker() {
  const $picker = $('#chip-one');
  if (!$picker.length) return;
  $picker.find('optgroup').remove();
  CHIP_ORDER.forEach(function (kind) {
    const $box = $('#' + CHIP_BOX[kind]);
    if (!$box.length) return;
    const $label = chipBoxLabel(kind);
    const $group = $('<optgroup>').attr('label', $label.length ? $.trim($label.text()) : kind);
    $box.find('option').each(function () {
      const value = String($(this).val() || '');
      if (value) $group.append($('<option>').attr('value', kind + ':' + value).text($(this).text()));
    });
    $picker.append($group);
  });
  $picker.off('change').on('change', function () {
    const pick = String($(this).val() || '').split(':');
    const $box = $('#' + CHIP_BOX[pick[0]]);
    if (!$box.length || !pick[1]) return;
    $box.val(pick[1]).trigger('change');
  });
  syncChipPicker();
}
window.onChipPick = function (which) {
  const $boxes = {}, k = which;
  for (const kind in CHIP_BOX) $boxes[kind] = $('#' + CHIP_BOX[kind]);
  if (!$boxes.part.length || !$boxes.gen.length) return;
  for (const kind in CHIP_BOX) {
    const $lab = chipBoxLabel(kind);
    if ($lab.length) $lab.css('fontWeight', kind === k ? '700' : '');
    if (kind !== k) $boxes[kind].val('');
  }
  if (k === 'gen') {
    const part = PART_OF_GENERATION[chipGeneration()];
    const $part = $boxes.part;
    if (part && $part.find('option').filter(function () { return String($(this).val()).toUpperCase() === part; }).length) {
      $part.val(part);
    }
  }
  syncChipPicker();
  onGenDeviceChange();
};

function deviceChip(device, metaChip) {
  const dev = String(device || '').trim();
  if (/^BT82/i.test(dev)) return 'bt82x';
  return normChip(metaChip) || 'legacy';
}
async function genInit() {
  await genLoadMeta();
  genFillDevices();
  genFillBlobs();
  syncGenOutput();
  genSetManifestFile();
  onGenAlignChange();
}
async function genLoadMeta() {
  let meta = null;
  if (isEmbedded()) {
    try {
      const resp = await API_EAB_runCli({ command: 'flashgen', args: ['--print-meta'] });
      if (resp && resp.ok && resp.detail) {
        const parsed = JSON.parse(resp.detail);
        if (parsed && parsed.meta && Array.isArray(parsed.meta.devices)) meta = parsed.meta;
      }
    } catch (err) {
      log('WARN: could not read the vocabulary from the extension: ' + err.message);
    }
  }
  genState.meta = meta || GEN_FALLBACK_META;
  const note = meta
    ? 'Device and format lists are served by the extension (flashgen --print-meta).'
    : 'Device and format lists come from a built-in table (standalone preview only).';
  $('#gen-output-title').attr('title', note);
  log(note);
}
function genFillDevices() {
  const list = (genState.meta && genState.meta.devices) || [];
  const $sel = $('#chip-name');
  $sel.html('<option value=""></option>' + list
    .map((d) => `<option value="${esc(d.device)}">${esc(d.device)}</option>`)
    .join(''));
  if (list.some((d) => d.device === 'BT820')) $sel.val('BT820');
  buildChipPicker();
  syncChipPicker();
  onGenDeviceChange();
}
function genOutputName() {
  const $el = $('#gen-output-name');
  const value = ($el.length && $el.val() ? $el.val() : '').trim() || ($el.length && $el.attr('placeholder')) || 'flash';
  return value.replace(/\.bin$/i, '');
}
function genOutputDir() {
  const $el = $('#gen-output-dir');
  return ($el.length && $el.val() ? $el.val() : '').trim() || 'build';
}
function genJoinPath(dir, name) {
  const sep = dir.includes('\\') ? '\\' : '/';
  return dir.replace(/[\\/]+$/, '') + sep + name;
}
function genSplitOutput(path) {
  const text = String(path || '').trim() || 'build/flash.bin';
  const cut = Math.max(text.lastIndexOf('/'), text.lastIndexOf('\\'));
  if (cut < 0) return { dir: '.', name: text };
  return { dir: text.slice(0, cut) || '/', name: text.slice(cut + 1) };
}
function syncGenOutput() {
  const $hidden = $('#gen-output');
  if ($hidden.length) $hidden.val(genJoinPath(genOutputDir(), genOutputName() + '.bin'));
}
function genSetOutput(path) {
  const parts = genSplitOutput(path);
  $('#gen-output-dir').val(parts.dir);
  $('#gen-output-name').val(parts.name.replace(/\.bin$/i, ''));
  syncGenOutput();
}
function genPickOutputFolder() {
  const current = genOutputDir();
  if (!isEmbedded()) {
    let picked = null;
    try { picked = prompt('Output folder:', current); } catch (err) { picked = null; }
    if (picked) {
      $('#gen-output-dir').val(picked);
      syncGenOutput();
    }
    return;
  }
  API_EAB_pickFolder().then((resp) => {
    if (resp && resp.ok && resp.path) {
      $('#gen-output-dir').val(resp.path);
      syncGenOutput();
    }
  }).catch(() => { });
}
function genFillBlobs() {
  const $sel = $('#gen-blob');
  if (!$sel.length) return;
  const list = (genState.meta && genState.meta.blobs) || [];
  if (!list.length) {
    $sel.html('<option value="">(tool default)</option>');
    $sel.prop('disabled', true);
    return;
  }
  $sel.prop('disabled', false);
  $sel.html(list
    .map((b) => `<option value="${esc(b.path)}">${esc(b.label)}</option>`)
    .join(''));
  const preferred = genState.meta.default_blob
    || (list.find((b) => /bt82x/i.test(b.label)) || list[0]).path;
  if (preferred) $sel.val(preferred);
}
function genBlob() {
  const $sel = $('#gen-blob');
  return $sel.length && !$sel.prop('disabled') ? ($sel.val() || '') : '';
}
function genEdf() {
  const $box = $('#gen-edf');
  return $box.length ? $box.prop('checked') : true;
}
function genAlignment() {
  const $box = $('#gen-align');
  return $box.length ? $box.prop('checked') : true;
}
function genDevice() {
  return String($('#chip-name').val() || '');
}
function genChip() {
  const gen = chipGeneration();
  if (gen) return gen === 'bt82x' ? 'bt82x' : 'legacy';
  const dev = genDevice();
  const list = (genState.meta && genState.meta.devices) || [];
  const hit = list.filter((d) => d.device === dev)[0];
  return deviceChip(dev, hit && hit.chip);
}
function genFormatsFor(type, chip) {
  const m = genState.meta || {};
  if (type === 'font') return m.font_formats || [];
  if (type === 'image') {
    const im = m.image_formats || {};
    return (chip === 'bt82x' ? im['bt82x'] : im['legacy']) || [];
  }
  return [];
}
function genDefaultFormat(type) {
  const d = (genState.meta && genState.meta.defaults) || {};
  if (type === 'font') return d.font_format || 'L4';
  if (type === 'image') return d.image_format || 'L8';
  return '';
}
function genOutSuffix(entry, chip) {
  const o = entry.options || {};
  if (entry.type === 'raw') {
    const hit = String(entry.src || '').match(/(\.[^\\/]*)$/);
    return hit ? hit[1] : '';
  }
  if (entry.type === 'animation') {
    if (chip === 'bt82x') return genOptOff(o.reloc) ? '.anim.raw' : '.anim.reloc';
    return String(o.memory_type || 'RAM_G').toUpperCase() === 'FLASH' ? '.anim.flash' : '.anim.ram_g';
  }
  if (entry.type === 'audio') {
    if (chip === 'bt82x') return String(o.container || 'wav').toLowerCase() === 'raw' ? '.raw' : '.wav';
    return '.raw';
  }
  const table = (genState.meta && genState.meta.asset_suffix) || {};
  return (table[chip] || {})[entry.type] || '';
}
function genOptOn(v) {
  return v === true || v === 'true';
}
function genOptOff(v) {
  return v === false || v === 'false';
}
function genOptionSpecs(type, chip) {
  const table = (genState.meta && genState.meta.entry_options) || {};
  return ((table[chip] || {})[type]) || [];
}
function genInlineSpecs(type, chip) {
  return genOptionSpecs(type, chip).filter((s) => s.inline);
}
function genOptionSpec(key, type, chip) {
  const hit = genOptionSpecs(type, chip).filter((s) => s.key === key);
  return hit.length ? hit[0] : null;
}
function genOptionKeys(entry, chip) {
  const o = entry.options || {};
  return genOptionSpecs(entry.type, chip)
    .filter((s) => o[s.key] != null && String(o[s.key]) !== s.default)
    .map((s) => s.key);
}
function genAlignNum(sel, dflt) {
  const v = parseInt($(sel).val(), 10);
  return isNaN(v) || v < 0 ? dflt : v;
}
function genSetAlign(asset, image) {
  $('#gen-align-asset').val(asset == null ? 64 : asset);
  $('#gen-align-image').val(image == null ? 4096 : image);
}
function onGenAlignChange() {
  $('.gen-align-num').prop('disabled', !genAlignment());
}
function genSplits(entry) {
  const rule = (genState.meta && genState.meta.font_split) ||
    { chips: ['legacy'], format_prefix: 'ASTC' };
  if (entry.type !== 'font') return false;
  if ((rule.chips || []).indexOf(genChip()) < 0) return false;
  const prefix = String(rule.format_prefix || 'ASTC').toUpperCase();
  return String(entry.format || '').toUpperCase().indexOf(prefix) === 0;
}
function genSplitDefault(entry) {
  const n = (entry.name || 'NAME').trim() || 'NAME';
  return n + '_GLYPH,' + n + '_XFONT';
}
function onGenDeviceChange() {
  const gen = chipGeneration();
  const chip = genChip();
  const $badge = $('#gen-chip');
  $badge.text(gen ? gen.toUpperCase() : '-');
  $badge.attr('class', 'chip-badge' + (chip === 'bt82x' ? '' : ' pre'));
  genRender();
}
function genAddEntry() {
  const type = 'image';
  genState.entries.push({
    name: '',
    type: type,
    src: '',
    format: genDefaultFormat(type),
    size: ((genState.meta && genState.meta.defaults) || {}).font_size || 25,
    charset: '',
    outputs: '',
    options: {},
  });
  genRender();
  const $names = $('.gen-entry .gen-name');
  if ($names.length) $names.last().focus();
}
function genRemoveEntry(idx) {
  if (idx < 0 || idx >= genState.entries.length) return;
  genState.entries.splice(idx, 1);
  genRender();
}
function genField(idx, key, value) {
  const e = genState.entries[idx];
  if (!e) return;
  e[key] = value;
  if (key === 'type') {
    e.options = {};
    if (!genFormatsFor(value, genChip()).length) e.format = '';
  }
  if (key === 'type' || key === 'format') { genRender(); return; }
  if (key === 'src' && genAutoNameOn()) genRenameRow(idx);
}
function genAutoNameOn() {
  const $box = $('#gen-autoname');
  return !$box.length || $box.prop('checked');
}
function genAutoNameFor(entry, idx) {
  const parts = [String(idx + 1)];
  const stem = genFileStem(entry.src);
  if (stem) parts.push(stem);
  const format = String(entry.format || '').trim();
  if (format) parts.push(format);
  return parts.length > 1 ? parts.join('_') : '';
}
function genFileStem(path) {
  if (!path) return '';
  const file = String(path).split(/[\\/]/).pop() || '';
  const dot = file.lastIndexOf('.');
  const base = dot > 0 ? file.slice(0, dot) : file;
  return base.replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
}
function genRenameRow(idx) {
  const e = genState.entries[idx];
  if (!e) return;
  e.name = genAutoNameFor(e, idx);
  const $input = $('.gen-entry[data-idx="' + idx + '"] .gen-name');
  if ($input.length && $input.val() !== e.name) $input.val(e.name);
}
function onAutoNameChange() {
  genRender();
}
function genRender() {
  const $wrap = $('#gen-entries');
  $('#gen-count').text(String(genState.entries.length));
  $('#gen-empty').toggleClass('hidden', genState.entries.length > 0);
  $('#btn-clear-all').toggleClass('hidden', genState.entries.length === 0);
  if (genAutoNameOn()) {
    genState.entries.forEach((e, i) => { e.name = genAutoNameFor(e, i); });
  }
  const chip = genChip();
  $wrap.html(genState.entries.map((e, i) => genRowHtml(e, i, chip)).join(''));
  $wrap.find('.gen-remove').on('click', function (e) {
    e.stopPropagation();
    genRemoveEntry(Number($(this).closest('.gen-entry').attr('data-idx')));
  });
  window.eabPaintRows();
  if (typeof window.eabSyncQueueChrome === 'function') window.eabSyncQueueChrome();
}
function genRowHtml(e, idx, chip) {
  const fmts = genFormatsFor(e.type, chip);
  if (fmts.length && fmts.indexOf(e.format) < 0) e.format = genDefaultFormat(e.type);
  if (fmts.length && fmts.indexOf(e.format) < 0) e.format = fmts[0];
  const auto = genAutoNameOn();
  const formatOpts = fmts
    .map((f) => `<option value="${esc(f)}"${f === e.format ? ' selected' : ''}>${esc(f)}</option>`)
    .join('');
  const typeOpts = ((genState.meta && genState.meta.types) || ['font', 'image'])
    .map((t) => `<option value="${esc(t)}"${t === e.type ? ' selected' : ''}>${esc(t)}</option>`)
    .join('');
  const sizeInput = e.type === 'font' ? `<input class="input-field gen-size form-control" type="number"
        min="1" value="${esc(e.size)}" title="Point size" placeholder="pt"
        oninput="genField(${idx},'size',this.value)">` : '';
  const charsetInput = e.type === 'font' ? `<input class="input-field gen-charset form-control" type="text"
        value="${esc(e.charset)}" title="Charset: a charset file, or a range such as U+0030-U+0039 (empty = converter default)"
        placeholder="charset / U+..." oninput="genField(${idx},'charset',this.value)">` : '';
  const outputsInput = genSplits(e) ? `<input class="input-field gen-outputs form-control" type="text"
        value="${esc(e.outputs)}" title="Flash asset names for the split .glyph + .xfont pair"
        placeholder="${esc(genSplitDefault(e))}" oninput="genField(${idx},'outputs',this.value)">` : '';
  const formatCell = fmts.length
    ? `<select class="input-field gen-format form-select" title="Converter format"
            onchange="genField(${idx},'format',this.value)">${formatOpts}</select>`
    : `<span class="gen-format gen-out-ext" title="Suffix of the staged flash asset — what flash_gen types it by">${esc(genOutSuffix(e, chip) || '—')}</span>`;
  const setOpts = genOptionKeys(e, chip);
  const optCells = genInlineSpecs(e.type, chip).map((s) => genOptCellHtml(e, s, idx)).join('');
  const optsBtn = genOptionSpecs(e.type, chip).length
    ? `<button class="btn btn-secondary gen-opts${setOpts.length ? ' on' : ''}" type="button"
            title="All converter options for this entry${setOpts.length ? ' — set: ' + esc(setOpts.join(', ')) : ''}"
            onclick="genOptsOpen(${idx})">⚙</button>`
    : '';
  return `<div class="gen-entry" data-idx="${idx}">
    <div class="gen-entry-progress" aria-hidden="true"><div class="gen-entry-progress-fill"></div></div>
    <span class="gen-entry-no">#${idx + 1}</span>
    <button class="gen-remove" type="button" title="Remove this entry" aria-label="Remove entry ${idx + 1}">−</button>
    <input class="input-field gen-name form-control" type="text" placeholder="name" title="Flash asset name"
           value="${esc(e.name)}"${auto ? ' readonly title="Autogenerate name is on — clear the checkbox to edit"' : ''}
           oninput="genField(${idx},'name',this.value)">
    <select class="input-field gen-type form-select" title="Entry type"
            onchange="genField(${idx},'type',this.value)">${typeOpts}</select>
    ${formatCell}
    ${optCells}
    ${optsBtn}
    ${sizeInput}${charsetInput}${outputsInput}
    <input class="input-field gen-src form-control" type="text" placeholder="source file" title="Source file"
           value="${esc(e.src)}" oninput="genField(${idx},'src',this.value)">
    <button class="btn btn-secondary gen-browse" type="button" title="Pick one or more source files"
            onclick="genBrowseSource(${idx})">Browse…</button>
    <span class="gen-entry-status"></span>
  </div>`;
}
async function genBrowseSource(idx) {
  if (!genState.entries[idx]) return;
  const filters = [
    { name: 'All sources', extensions: GEN_SOURCE_EXTS },
    { name: 'Fonts', extensions: ['ttf', 'otf'] },
    { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp'] },
    { name: 'Videos', extensions: GEN_TYPE_EXTS.video },
    { name: 'Animations (GIF)', extensions: GEN_TYPE_EXTS.animation },
    { name: 'Audio', extensions: GEN_TYPE_EXTS.audio },
    { name: 'Flash assets (raw)', extensions: GEN_TYPE_EXTS.raw },
  ];
  const paths = await pickFiles(filters);
  if (!paths.length) return;
  const touched = genAddFiles(paths, idx);
  if (touched.length > 1) await genBatchSettings(touched, paths);
}
function genAddFiles(paths, idx) {
  const seed = genState.entries[idx];
  if (!seed || !paths.length) return [];
  const touched = [idx];
  seed.src = paths[0];
  for (let i = 1; i < paths.length; i++) {
    const at = idx + i;
    genState.entries.splice(at, 0, {
      name: '',
      type: seed.type,
      src: paths[i],
      format: seed.format,
      size: seed.size,
      charset: seed.charset,
      outputs: '',
      options: $.extend({}, seed.options),
    });
    touched.push(at);
  }
  genRender();
  return touched;
}
const genBatch = { idxs: [], resolve: null };
function genBatchSettings(idxs, paths) {
  return new Promise((resolve) => {
    genBatch.idxs = idxs;
    genBatch.resolve = resolve;
    const $typeSel = $('#batch-type');
    $typeSel.html(((genState.meta && genState.meta.types) || ['font', 'image'])
      .map((t) => `<option value="${esc(t)}">${esc(t)}</option>`)
      .join(''));
    $typeSel.val(genGuessType(paths));
    $('#batch-note').text(
      idxs.length + ' files selected — these settings are applied to all of them.');
    onBatchTypeChange();
    $('#batch-modal').removeClass('hidden');
  });
}
function genGuessType(paths) {
  const kinds = Object.keys(GEN_TYPE_EXTS);
  for (let k = 0; k < kinds.length; k++) {
    const kind = kinds[k];
    const exts = GEN_TYPE_EXTS[kind];
    const hits = paths.filter((p) => exts.indexOf(genExtOf(p)) >= 0).length;
    if (hits === paths.length) return kind;
  }
  return 'image';
}
function genExtOf(path) {
  const name = String(path).split(/[\\/]/).pop() || '';
  const dot = name.lastIndexOf('.');
  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase();
}
function onBatchTypeChange() {
  const type = $('#batch-type').val();
  const fmts = genFormatsFor(type, genChip());
  const dflt = genDefaultFormat(type);
  $('#batch-format').html(fmts
    .map((f) => `<option value="${esc(f)}"${f === dflt ? ' selected' : ''}>${esc(f)}</option>`)
    .join(''))
    .toggleClass('hidden', !fmts.length);
  $('#batch-format-label').toggleClass('hidden', !fmts.length);
}
function genBatchClose(apply) {
  $('#batch-modal').addClass('hidden');
  const idxs = genBatch.idxs;
  const resolve = genBatch.resolve;
  genBatch.idxs = [];
  genBatch.resolve = null;
  if (apply && idxs.length) {
    const type = $('#batch-type').val();
    const format = $('#batch-format').val() || '';
    idxs.forEach((i) => {
      const e = genState.entries[i];
      if (e) { e.type = type; e.format = format; }
    });
    genRender();
  }
  if (resolve) resolve(apply);
}
const genOpts = { idx: -1 };
function genOptCellHtml(e, s, idx) {
  const val = e.options && e.options[s.key] != null ? String(e.options[s.key]) : '';
  const key = esc(s.key);
  const hint = s.help ? ' — ' + s.help : '';
  const title = esc(s.label + ' (' + s.flag + ')' + hint + ' [default: ' + (s.default || '—') + ']');
  if (s.kind === 'choice') {
    if (val && (s.choices || []).indexOf(val) < 0) {
      delete e.options[s.key];
      return genOptCellHtml(e, s, idx);
    }
    const cur = val || s.default;
    const opts = (s.choices || [])
      .map((c) => `<option value="${esc(c)}"${c === cur ? ' selected' : ''}>${esc(c)}</option>`)
      .join('');
    return `<select class="input-field gen-opt-inline form-select" data-opt="${key}" title="${title}"
            onchange="genOptionInline(${idx},'${key}',this.value)">${opts}</select>`;
  }
  if (s.kind === 'int' || s.kind === 'num') {
    const min = s.min ? ` min="${s.min}"` : '';
    const max = s.max ? ` max="${s.max}"` : '';
    return `<input type="number" class="input-field gen-opt-inline form-control" data-opt="${key}"${min}${max}
            step="${s.kind === 'int' ? '1' : 'any'}" value="${esc(val)}" placeholder="${esc(s.default)}" title="${title}"
            oninput="genOptionInline(${idx},'${key}',this.value)">`;
  }
  return `<input type="text" class="input-field gen-opt-inline form-control" data-opt="${key}"
          value="${esc(val)}" placeholder="${esc(s.default)}" title="${title}"
          oninput="genOptionInline(${idx},'${key}',this.value)">`;
}
function genOptionInline(idx, key, raw) {
  const e = genState.entries[idx];
  if (!e) return;
  const spec = genOptionSpec(key, e.type, genChip());
  const text = String(raw == null ? '' : raw).trim();
  e.options = e.options || {};
  if (!text || (spec && text === spec.default)) {
    delete e.options[key];
  } else if (spec && (spec.kind === 'int' || spec.kind === 'num')) {
    const n = spec.kind === 'int' ? parseInt(text, 10) : parseFloat(text);
    if (isNaN(n)) return;
    e.options[key] = n;
  } else {
    e.options[key] = text;
  }
  genSyncOptionsChrome(idx);
}
function genSyncOptionsChrome(idx) {
  const e = genState.entries[idx];
  if (!e) return;
  const $row = $('.gen-entry[data-idx="' + idx + '"]');
  const set = genOptionKeys(e, genChip());
  $row.find('.gen-opts')
    .toggleClass('on', set.length > 0)
    .attr('title', 'All converter options for this entry' + (set.length ? ' — set: ' + set.join(', ') : ''));
  const $ext = $row.find('.gen-out-ext');
  if ($ext.length) $ext.text(genOutSuffix(e, genChip()) || '—');
}
function genOptsOpen(idx) {
  const e = genState.entries[idx];
  if (!e) return;
  const specs = genOptionSpecs(e.type, genChip());
  if (!specs.length) return;
  genOpts.idx = idx;
  $('#opts-title').text('Converter options — entry #' + (idx + 1) + ' (' + e.type + ')');
  $('#opts-body').html(specs.map((s) => genOptRowHtml(e, s)).join(''));
  $('#opts-modal').removeClass('hidden');
}
function genOptRowHtml(e, s) {
  const val = e.options && e.options[s.key] != null ? String(e.options[s.key]) : '';
  const key = esc(s.key);
  let control = '';
  if (s.kind === 'bool') {
    const on = val ? genOptOn(val) : s.default === 'true';
    control = `<input type="checkbox" class="form-check-input gen-opt" data-key="${key}"${on ? ' checked' : ''}>`;
  } else if (s.kind === 'choice') {
    const head = `<option value="">(default: ${esc(s.default || '—')})</option>`;
    const rest = (s.choices || [])
      .map((c) => `<option value="${esc(c)}"${c === val ? ' selected' : ''}>${esc(c)}</option>`)
      .join('');
    control = `<select class="form-select gen-opt" data-key="${key}">${head}${rest}</select>`;
  } else if (s.kind === 'int' || s.kind === 'num') {
    const min = s.min ? ` min="${s.min}"` : '';
    const max = s.max ? ` max="${s.max}"` : '';
    control = `<input type="number" class="form-control gen-opt" data-key="${key}"${min}${max}
      step="${s.kind === 'int' ? '1' : 'any'}" value="${esc(val)}" placeholder="${esc(s.default)}">`;
  } else {
    control = `<input type="text" class="form-control gen-opt" data-key="${key}"
      value="${esc(val)}" placeholder="${esc(s.default)}">`;
  }
  return `<label class="gen-opt-row" title="${esc(s.help || s.flag)} ${esc(s.flag)}">
    <span class="gen-opt-label">${esc(s.label)}</span>
    ${control}
  </label>`;
}
function genOptsClose(apply) {
  const idx = genOpts.idx;
  const e = genState.entries[idx];
  if (apply && e) {
    const bad = $('#opts-body .gen-opt').toArray().filter((el) => !el.checkValidity());
    if (bad.length) {
      bad[0].reportValidity();
      return;
    }
    e.options = e.options || {};
    genOptionSpecs(e.type, genChip()).forEach((s) => {
      const $c = $('#opts-body .gen-opt[data-key="' + s.key + '"]');
      if (!$c.length) return;
      let v = null;
      if (s.kind === 'bool') {
        const on = $c.prop('checked');
        v = on !== (s.default === 'true') ? on : null;
      } else {
        const text = String($c.val() || '').trim();
        if (text && text !== s.default) {
          if (s.kind === 'int') v = parseInt(text, 10);
          else if (s.kind === 'num') v = parseFloat(text);
          else v = text;
        }
      }
      if (v === null || (typeof v === 'number' && isNaN(v))) delete e.options[s.key];
      else e.options[s.key] = v;
    });
    genRender();
  }
  $('#opts-modal').addClass('hidden');
  genOpts.idx = -1;
}
function genProblems() {
  const problems = [];
  const seen = {};
  if (!genState.entries.length) problems.push('at least one entry is required');
  genState.entries.forEach((e, i) => {
    const label = 'entry #' + (i + 1);
    const name = String(e.name || '').trim();
    if (!name) problems.push(label + ' needs a name');
    else if (name.indexOf('/') >= 0 || name.indexOf('\\') >= 0) {
      problems.push(label + ': the name is a plain asset name, not a path');
    } else if (seen[name]) problems.push(label + ': the name "' + name + '" is already used');
    else seen[name] = true;
    if (!String(e.src || '').trim()) problems.push(label + ' needs a source file');
    if ((e.type === 'font' || e.type === 'image') && !String(e.format || '').trim()) {
      problems.push(label + ' needs a format');
    }
    genOptionKeys(e, genChip()).forEach((key) => {
      const spec = genOptionSpec(key, e.type, genChip());
      const n = Number(e.options[key]);
      if (!spec || (spec.kind !== 'int' && spec.kind !== 'num') || !isFinite(n)) return;
      if (n < spec.min || (spec.max && n > spec.max)) {
        problems.push(label + ': "' + key + '" must be ' + (spec.max
          ? 'between ' + spec.min + ' and ' + spec.max
          : spec.min + ' or more'));
      }
    });
  });
  return problems;
}
function genBuildMissing() {
  const problem = genProblems()[0];
  if (!problem) return '';
  const match = problem.match(/^entry #(\d+)/);
  if (!match) return '#gen-empty';
  const row = '.gen-entry[data-idx="' + (Number(match[1]) - 1) + '"]';
  if (/name/.test(problem)) return row + ' .gen-name';
  if (/source file/.test(problem)) return row + ' .gen-src';
  if (/format/.test(problem)) return row + ' .gen-format';
  return row;
}
function genDoc() {
  const doc = {
    _comment: MANIFEST_COMMENT,
    device: genDevice(),
    output: ($('#gen-output').val() || '').trim() || 'build/flash.bin',
  };
  const header = ($('#gen-header').val() || '').trim();
  if (header) doc.header = header;
  const blob = genBlob();
  if (blob) doc.blob = blob;
  doc.gen_edf = genEdf();
  doc.no_align = !genAlignment();
  doc.align_asset = genAlignNum('#gen-align-asset', 64);
  doc.align_image = genAlignNum('#gen-align-image', 4096);
  doc.entries = genState.entries.map((e) => {
    const name = String(e.name || '').trim();
    const o = {
      name: name,
      type: e.type,
      src: String(e.src || '').trim(),
    };
    if (e.type === 'font') {
      const size = parseInt(e.size, 10);
      o.size = isNaN(size) ? 25 : size;
    }
    if (e.type === 'font' || e.type === 'image') o.format = String(e.format || '').trim();
    const charset = String(e.charset || '').trim();
    if (e.type === 'font' && charset) o.charset = charset;
    if (genSplits(e)) {
      const raw = String(e.outputs || '').trim() || genSplitDefault(e);
      const outs = raw.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
      if (outs.length) o.outputs = outs;
    }
    const opts = e.options || {};
    const keys = Object.keys(opts).filter((k) => opts[k] != null && opts[k] !== '');
    if (keys.length) {
      o.options = {};
      keys.forEach((k) => { o.options[k] = opts[k]; });
    }
    return o;
  });
  return doc;
}
function genJobFailure(detail) {
  try {
    const r = JSON.parse(detail || '{}');
    if (typeof r.exit_code === 'number' && r.exit_code !== 0) return 'the build exited with code ' + r.exit_code;
    if (r.error) return r.error;
  } catch (e) {  }
  return 'the build failed';
}
async function genRunBuild(manifestPath) {
  showGenStop(true);
  setGenProgress(0);
  paintGenRows('converting', 'building…');
  try {
    const resp = await API_EAB_startJob({ command: 'flashgen', args: ['-j', manifestPath] });
    if (!resp || !resp.ok || !resp.jobId) throw new Error((resp && resp.error) || 'could not start the build');
    genJobId = resp.jobId;
    const json = await new Promise(function (resolve, reject) {
      const poll = setInterval(function () {
        API_EAB_pollJob({ jobId: genJobId }).then(function (p) {
          if (!p || !p.ok || !p.progress) return;
          const st = p.progress.status;
          setGenProgress(p.progress.progress || 0);
          if (st === 0 || st === 1) return;
          clearInterval(poll);
          if (st === 2) resolve(p.progress.result || '{}');
          else if (st === 4) reject(new Error('cancelled'));
          else reject(new Error(genJobFailure(p.progress.result)));
        }).catch(function () {  });
      }, 250);
    });
    const result = JSON.parse(json);
    if (!result || result.success !== true) throw new Error((result && result.error) || 'the build failed');
    setGenProgress(100);
    paintGenRows('done', '✓ built');
    await onBuildComplete(result);
  } catch (err) {
    const cancelled = err && err.message === 'cancelled';
    paintGenRows(cancelled ? 'cancelled' : 'failed', cancelled ? '⊘ cancelled' : '✗ ' + (err && err.message || 'failed'));
    throw err;
  } finally {
    genJobId = null;
    showGenStop(false);
  }
}
async function genSaveManifest(andBuild) {
  if (genState.busy) return;
  if (andBuild && !chipGeneration()) {
    const msg = 'Select an EVE chip before building the flash image.';
    genManifestStatus(msg, true);
    showError(msg);
    return;
  }
  hideError();
  const problems = genProblems();
  if (problems.length) {
    const msg = 'The manifest is not ready: ' + problems.join('; ') + '.';
    genManifestStatus(msg, true);
    showError(msg);
    log('ERROR: ' + msg);
    return;
  }
  if (andBuild) clearBuildResults();
  const doc = genDoc();
  const text = JSON.stringify(doc, null, 2) + '\n';
  const path = genManifestFile();
  genState.busy = true;
  $('#btn-gen-save').prop('disabled', true);
  $('#btn-gen-build').prop('disabled', true);
  genManifestStatus('Saving ' + path + '…');
  try {
    if (!isEmbedded()) {
      genPreviewDownload(path, text);
      genManifestStatus('Downloaded ' + shortName(path));
      return;
    }
    const target = await genResolveManifestPath(path);
    let written = await API_EAB_writeTextFile({ path: target, contents: text });
    if (written && !written.ok) {
      // A relative path can land in a folder the app cannot write to; fall back to
      // the native save dialog so the manifest is never silently lost.
      log('WARN: cannot write ' + target + ' (' + (written.error || 'unknown error') + ') — asking for a location.');
      written = await API_EAB_writeTextFile({
        contents: text,
        defaultPath: shortName(path) || 'flashgen.json',
        title: 'Save manifest',
        filters: MANIFEST_FILTERS,
      });
    }
    if (!written || !written.ok) throw new Error((written && written.error) || 'cannot write the manifest');
    if (written.canceled) {
      genManifestStatus('Save cancelled.');
      return;
    }
    const saved = written.path || target;
    genSetManifestFile(saved);
    $('#gen-manifest-file').val(saved);
    genManifestStatus('Saved ' + saved);
    log(`Wrote manifest ${saved} (${doc.entries.length} entr${doc.entries.length === 1 ? 'y' : 'ies'}, device ${doc.device}).`);
    if (!andBuild) return;
    await genRunBuild(saved);
  } catch (err) {
    const cancelled = (err && err.message) === 'cancelled';
    const message = cancelled
      ? 'Build cancelled.'
      : (andBuild ? 'Build failed: ' : 'Save failed: ') + (err.message || err);
    genManifestStatus(message, !cancelled);
    showError(message);
    log((cancelled ? '⊘ ' : 'ERROR: ') + (err.message || err));
  } finally {
    genState.busy = false;
    $('#btn-gen-save').prop('disabled', false);
    syncGenBuild();
  }
}
function genPreviewDownload(path, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const $a = $('<a>')
    .attr('href', URL.createObjectURL(blob))
    .attr('download', shortName(path) || 'flashgen.json')
    .appendTo('body');
  $a.get(0).click();
  $a.remove();
}
function genKnownType(type) {
  const list = (genState.meta && genState.meta.types) || ['font', 'image'];
  return list.indexOf(type) >= 0 ? type : 'image';
}
function genLoadedManifest() {
  return ($('#gen-path').val() || '').trim() || genState.manifestPath || '';
}
function genManifestFile() {
  return ($('#gen-manifest-file').val() || '').trim() || 'flashgen.json';
}
function genSetManifestFile(path) {
  if (path) {
    genState.manifestPath = path;
    $('#gen-path').val(path);
  }
  $('#manifest-name').text(shortName(genLoadedManifest()));
  syncUseCurrentManifest();
}
function syncUseCurrentManifest() {
  const current = genLoadedManifest();
  $('#btn-use-current-manifest')
    .prop('disabled', !current)
    .attr('title', current
      ? 'Point the manifest file at ' + current
      : 'Load a manifest in the 💾 Manifest zone first');
}
function genUseCurrentManifest() {
  const current = genLoadedManifest();
  if (!current) return;
  $('#gen-manifest-file').val(current);
  genManifestStatus('Manifest file set to ' + current);
}
function genManifestStatus(text, isError) {
  const $status = $('#gen-manifest-status');
  if (!$status.length) return;
  $status.text(text || '').toggleClass('is-error', !!isError);
}
function genIsAbsolutePath(path) {
  return /^([a-zA-Z]:[\\/]|[\\/])/.test(String(path || ''));
}
async function genResolveManifestPath(path) {
  if (genIsAbsolutePath(path) || !isEmbedded()) return path;
  try {
    const resp = await API_EAB_getWorkingDir({});
    if (resp && resp.ok && resp.folder) {
      const sep = String(resp.folder).includes('\\') ? '\\' : '/';
      return String(resp.folder).replace(/[\\/]+$/, '') + sep + path;
    }
  } catch (err) {  }
  return path;
}
async function genLoadFrom() {
  const path = await pickFile('Manifest to load into the form:', MANIFEST_FILTERS);
  if (!path) return;
  await genLoadManifest(path);
}
async function genLoadManifest(path) {
  if (!path) return;
  try {
    const resp = await eabSampleData(path);
    if (!resp.ok || !resp.data) throw new Error(resp.error || 'cannot read the file');
    const b64 = resp.data.split(',').pop();
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const doc = JSON.parse(new TextDecoder('utf-8').decode(bytes));
    genFromDoc(doc, path);
  } catch (err) {
    showError('Cannot load manifest: ' + err.message);
    log('ERROR: cannot load manifest ' + path + ' (' + err.message + ')');
  }
}
function genFromDoc(doc, path) {
  const dev = String(doc.device || '').toUpperCase();
  const $devSel = $('#chip-name');
  const hasDev = $devSel.find('option').filter(function () { return $(this).val() === dev; }).length > 0;
  if (hasDev) $devSel.val(dev);
  $('#chip-gen').val('');
  syncChipPicker();
  genSetOutput(doc.output || 'build/flash.bin');
  $('#gen-header').val(doc.header || '');
  if (path) genSetManifestFile(path);
  const $blobSel = $('#gen-blob');
  const hasBlob = $blobSel.find('option').filter(function () { return $(this).val() === doc.blob; }).length > 0;
  if (hasBlob) $blobSel.val(doc.blob);
  const $edfBox = $('#gen-edf');
  if ($edfBox.length) $edfBox.prop('checked', doc.gen_edf !== false);
  const $alignBox = $('#gen-align');
  if ($alignBox.length) {
    $alignBox.prop('checked', doc.no_align !== true);
    onGenAlignChange();
  }
  genSetAlign(doc.align_asset, doc.align_image);
  const $autoBox = $('#gen-autoname');
  if ($autoBox.length) $autoBox.prop('checked', false);
  genState.entries = (Array.isArray(doc.entries) ? doc.entries : []).map((e) => ({
    name: e.name || '',
    type: genKnownType(e.type),
    src: e.src || '',
    format: e.format || '',
    size: e.size != null ? e.size : 25,
    charset: e.charset || '',
    outputs: Array.isArray(e.outputs) ? e.outputs.join(', ') : (e.outputs || ''),
    options: e.options && typeof e.options === 'object' ? $.extend({}, e.options) : {},
  }));
  onGenDeviceChange();
  log(`Loaded ${genState.entries.length} entr${genState.entries.length === 1 ? 'y' : 'ies'} ` +
    `from ${shortName(path)} — autogenerate name off, the file's names are kept.`);
  hideError();
}
$(document).ready(genInit);
const GEN_TYPE_EXTS = {
  font: ['ttf', 'otf'],
  video: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'wmv', 'm4v', 'mpg', 'mpeg'],
  animation: ['gif'],
  audio: ['wav', 'mp3', 'ogg', 'aac', 'flac', 'm4a', 'wma'],
  raw: ['raw', 'reloc', 'glyph', 'xfont'],
};
const GEN_SOURCE_EXTS = ['png', 'jpg', 'jpeg', 'bmp']
  .concat(GEN_TYPE_EXTS.font, GEN_TYPE_EXTS.video, GEN_TYPE_EXTS.animation, GEN_TYPE_EXTS.audio, GEN_TYPE_EXTS.raw);
const GEN_FOLDER_EXTS = GEN_SOURCE_EXTS;
async function genAddFile() {
  if (!genState.entries.length) genAddEntry();
  await genBrowseSource(genState.entries.length - 1);
}
async function genAddFolder() {
  if (!isEmbedded()) {
    const path = askStandalone('Folder of fonts and images:');
    if (!path) return;
    if (!genState.entries.length) genAddEntry();
    genAddFiles([path], genState.entries.length - 1);
    return;
  }
  const resp = await API_EAB_pickFolder({
    extensions: GEN_FOLDER_EXTS,
    title: 'Select a folder of fonts and images',
    readBase64: false,
  }).catch(err => ({ ok: false, error: String(err) }));
  if (!resp || !resp.ok) {
    showError('Add folder failed: ' + ((resp && resp.error) || 'unknown error'));
    return;
  }
  if (!resp.paths || !resp.paths.length) {
    showError('No fonts or images matched in that folder.');
    return;
  }
  if (!genState.entries.length) genAddEntry();
  const touched = genAddFiles(resp.paths, genState.entries.length - 1);
  if (touched.length > 1) await genBatchSettings(touched, resp.paths);
}
function genClearAll() {
  genState.entries = [];
  clearBuildResults();
  genRender();
}
window.eabAddFiles = function (paths) {
  if (!paths || !paths.length) return 0;
  if (!genState.entries.length) genAddEntry();
  return genAddFiles(paths, genState.entries.length - 1).length;
};
(function dropAndPaste() {
  if (!$('.drop-zone[data-for]').length) return;
  function queueZone(el) {
    var input = document.getElementById(el.getAttribute('data-for'));
    return !input || (input.tagName !== 'INPUT' && input.tagName !== 'TEXTAREA');
  }
  function dropZone() {
    var $main = $('.app-row').filter(':visible').first();
    if (!$main.length) $main = $('.app-row').first();
    var $zones = $main.find('.drop-zone[data-for]');
    var $queue = $zones.filter(function () { return queueZone(this); }).first();
    if (!$queue.length) $queue = $zones.first();
    return $queue.length ? $queue.get(0) : null;
  }
  function queue(paths) {
    if (typeof window.eabOnDrop !== 'function') return false;
    try { window.eabOnDrop(paths, dropZone()); return true; } catch (e) { return false; }
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
    var $el = $(el);
    if (!$el.length) return false;
    var tag = $el.prop('tagName');
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') return false;
    if ($el.prop('readOnly') || $el.prop('disabled')) return false;
    if (tag === 'INPUT' && /^(checkbox|radio|button|submit|range|file)$/i.test($el.prop('type') || '')) return false;
    return true;
  }
  var pasteRun = null;
  var pasteSeq = 0;
  function pasteTextEl(zone) {
    if (!zone) return $();
    var $box = $(zone).find('.dz-paste').first();
    if (!$box.length) {
      $box = $('<div class="dz-paste" role="status" aria-live="polite">' +
        '<span class="dz-paste-spin" aria-hidden="true"></span>' +
        '<span class="dz-paste-text"></span></div>').appendTo(zone);
    }
    return $box.find('.dz-paste-text');
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
    if (zone) $(zone).addClass('is-pasting');
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
    if (!run.zone) return;
    setTimeout(function () {
      if (pasteSeq !== run.token) return;
      $(run.zone).removeClass('is-pasting');
      var $t = pasteTextEl(run.zone);
      if ($t.length) $t.text('');
    }, 1600);
  }
  $(document).on('paste', function (e) {
    var dt = (e.originalEvent || e).clipboardData;
    if (!dt) return;
    var zone = dropZone();
    var isTargetField = !!zone && $(e.target).attr('id') === $(zone).attr('data-for');
    if (editable(e.target) && !isTargetField) return;
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
    pasteBegin(zone, total);
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

function eabSampleQueue(tab, paths) {
  const sources = paths.filter((p) => !/\.json$/i.test(p));
  const zone = document.querySelector('.drop-zone[data-for="gen-entries"]');
  if (sources.length && typeof window.eabOnDrop === 'function') window.eabOnDrop(sources, zone);
}

var SAMPLE_GROUP_SELECT = '#chip-name';
var SAMPLE_DEFAULT_GROUP = 'legacy';
var SAMPLE_FOLDERS = {bt82x: 'BT82X', legacy: 'Legacy'};
var SAMPLE_TABS = {flashgen: {folders: {bt82x: 'BT82X', legacy: 'Legacy'}, default: 'legacy'}};
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
  if (typeof API_EAB_readFileAsBase64 === 'function') return API_EAB_readFileAsBase64({path: path});
  return Promise.resolve({});
}
function eabSampleGroup() {
  if (typeof chipGroup === 'function') return chipGroup();
  return SAMPLE_DEFAULT_GROUP;
}
function eabSampleFail(ev) {
  var $btn = $(ev && ev.target ? ev.target : $('[data-sample]').first());
  if (!$btn.length) return;
  var text = $btn.text();
  $btn.text('⚠ No samples');
  setTimeout(function () { $btn.text(text); }, 6000);
}
window.eabUseSample = function (tab, ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  if (ev && ev.preventDefault) ev.preventDefault();
  var group = eabSampleGroup();
  var folder = SAMPLE_FOLDERS[group] || SAMPLE_FOLDERS[SAMPLE_DEFAULT_GROUP];
  var base = 'samples/' + folder + '/';
  eabSampleList('samples/' + folder).then(function (resp) {
    // Only the folder's own files: build artefacts live in sub-folders
    // (build/.flashgen/…/*.json) and must never be queued or taken as the manifest.
    var files = (resp && resp.files ? resp.files : []).filter(function (name) {
      return name && !/[\\/]/.test(name);
    });
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
    var manifest = good.filter(function (p) { return /(^|[\\/])flashgen\.json$/i.test(p); })[0]
      || good.filter(function (p) { return /\.json$/i.test(p); })[0];
    eabSampleQueue(tab, good);
    if (manifest) {
      var device = $('#chip-name');
      if (device.length && !device.val()) {
        device.val(group === 'bt82x' ? 'BT820' : 'BT817');
        syncChipPicker();
        onGenDeviceChange();
      }
      genLoadManifest(manifest);
    }
  });
};