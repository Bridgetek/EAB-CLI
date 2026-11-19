function isEmbedded() {
  return window.parent !== window;
}
function pickOutputDir() {
  if (!isEmbedded()) {
    const path = prompt('Enter output folder path:');
    if (path) $('#output-dir').val(path);
    updateEnable();
    return;
  }
  API_EAB_pickOutput({}).then(resp => {
    if (resp.ok && resp.folder) {
      $('#output-dir').val(resp.folder);
      updateEnable();
    }
  }).catch(err => showError('Failed to open folder picker: ' + err));
}
function log(msg) { console.log('[eab] ' + msg); }
function showError(msg) {
  const $panel = $('#error-panel');
  $panel.text(msg);
  $panel.removeClass('hidden');
}
function parsePatchLines(text) {
  const result = [];
  String(text).split('\n').forEach(line => {
    const m = line.match(/^\s*patch-([^:]+):\s*([^;\r\n]+);?\s*$/);
    if (m) result.push({ name: m[1], version: m[2].trim() });
  });
  return result;
}
function renderPatchTable() {
  const $tbody = $('#patch-tbody');
  $tbody.html('');
  state.patches.forEach((p, idx) => {
    const $tr = $('<tr>').html(`
      <td>${p.name}</td>
      <td>${p.version}</td>
      <td>${PATCH_DESCRIPTIONS[p.name] || ''}</td>
      <td class="chk-cell"></td>
    `);
    const mandatory = idx === 0 && p.name === 'base';
    const $chkCell = $tr.find('.chk-cell');
    const $cb = $('<input>').attr('type', 'checkbox').addClass('patch-cb').attr('data-name', p.name);
    if (mandatory) {
      $cb.prop({ checked: true, disabled: true }).appendTo($chkCell);
      $('<span class="mandatory">').text('(mandatory)').appendTo($chkCell);
    } else {
      $cb.on('change', function () {
        updateNamePlaceholder();
        updateEnable();
      }).appendTo($chkCell);
    }
    $tbody.append($tr);
  });
  updateNamePlaceholder();
  updateEnable();
}
function getSelectedPatches() {
  const selected = [];
  $('.patch-cb:checked').each(function () {
    if (!$(this).prop('disabled')) selected.push($(this).attr('data-name'));
  });
  return selected;
}
function updateNamePlaceholder() {
  const $input = $('#output-name');
  let phn = 'patch';
  getSelectedPatches().forEach(n => { phn += '_' + n; });
  $input.attr('placeholder', phn);
  $('#name-hint').html(
    `Output base name (default: patch). Unchecked: <b>${phn}</b>`);
  showPatchWarning();
}
function toggleAll() {
  const all = $('#check-all').prop('checked');
  $('.patch-cb').each(function () {
    if (!$(this).prop('disabled')) $(this).prop('checked', all);
  });
  updateNamePlaceholder();
  updateEnable();
}
function updateEnable() {
  const bin = $('#style-bin').prop('checked');
  const c = $('#style-c').prop('checked');
  const py = $('#style-py').prop('checked');
  const json = $('#style-json').prop('checked');
  const $split = $('#split');
  $split.prop('disabled', !(c || py));
  const outDir = String($('#output-dir').val() || '').trim();
  const hasStyle = bin || c || py || json;
  const hasPatch = getSelectedPatches().length > 0;
  const missing = !hasStyle ? '#style-bin' : !outDir ? '#output-dir' :
    !hasPatch ? '#patch-table' : '';
  $('#btn-run').attr('data-eab-missing', missing).prop('disabled', !!missing);
}
function styleParam(id) {
  switch (id) {
    case 'style-bin': return '--binfile';
    case 'style-c': return '--cfiles';
    case 'style-py': return '--pyfiles';
    case 'style-json': return '--jsonfiles';
  }
  return '';
}
const RUN_LABEL = '🧩 Generate Patch';
let runTick = null;
function runStatusEl() {
  const $bar = $('#run-bar');
  if (!$bar.length) return null;
  let $el = $('#run-status');
  if (!$el.length) {
    $el = $('<div id="run-status" class="eab-run-status" hidden>').appendTo($bar);
  }
  return $el;
}
function runBarStart() {
  const $fill = $('#progress-fill');
  if ($fill.length) { $fill.css('width', '0%'); $fill.addClass('is-running'); }
  runStatusEl();
}
function runBarStep(done, total) {
  const $fill = $('#progress-fill');
  if ($fill.length) $fill.css('width', (total ? Math.round(((done - 1) / total) * 100) : 0) + '%');
  const $btn = $('#btn-run');
  if ($btn.length) $btn.text('🧩 Generating… ' + done + '/' + total);
  const $el = runStatusEl();
  if (!$el) return;
  $el.prop('hidden', false);
  $el.text('Step ' + done + ' of ' + total);
  if (runTick) clearInterval(runTick);
  const t0 = Date.now();
  runTick = setInterval(function () {
    $el.text('Step ' + done + ' of ' + total + ' — ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
  }, 200);
}
function runBarStop(ok) {
  if (runTick) { clearInterval(runTick); runTick = null; }
  const $fill = $('#progress-fill');
  if ($fill.length) {
    $fill.css('width', '100%');
    $fill.removeClass('is-running');
    $fill.addClass(ok ? 'is-done' : 'is-failed');
    setTimeout(function () {
      $fill.css('width', '0%');
      $fill.removeClass('is-done is-failed');
    }, 900);
  }
  const $btn = $('#btn-run');
  if ($btn.length) $btn.text(RUN_LABEL);
  const $el = runStatusEl();
  if ($el) {
    $el.text(ok ? 'Finished' : 'Failed — see the result');
    setTimeout(function () { $el.prop('hidden', true); $el.text(''); }, 4000);
  }
}
function openFile(path) {
  invokeHost('open_in_explorer', { path });
}
$(function () {
  loadPatches();
  updateNamePlaceholder();
  updateEnable();
  $('#output-dir').on('input change', updateEnable);
});

function openOutputDir() {
  const path = ($('#output-dir').val() || '').trim() || '.';
  API_EAB_openOutputLocation({ path: path });
}
