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

function log(msg) { console.log('[eab] ' + msg); }
function showError(msg) {
  const $panel = $('#error-panel');
  $panel.text(msg);
  $panel.removeClass('hidden');
}
function soToPixelsPerClock(mode) {
  const m = parseInt(mode, 10);
  if (m === 1 || m === 2) return 2;
  if (m === 3) return 4;
  return 1;
}
function updateSoHint() {
  const mode = $('#so-mode').val();
  const ppc = soToPixelsPerClock(mode);
  $('#so-hint').text(
    `Selected: ${ppc} pixel${ppc > 1 ? 's' : ''} per clock. HCYCLE/HOFFSET/HSYNC0/HSYNC1 must be multiples of ${ppc}.`);
}
function buildCliArgs() {
  const cliArgs = [
    '--so-mode', $('#so-mode').val(),
    '--hsize', $('#hsize').val(),
    '--vsize', $('#vsize').val(),
    '--hcycle', $('#hcycle').val(),
    '--hoffset', $('#hoffset').val(),
    '--hsync0', $('#hsync0').val(),
    '--hsync1', $('#hsync1').val(),
  ];
  return { command: 'register_validator', cliArgs };
}
let runActive = false;
function syncRunGate() {
  const fields = ['hsize', 'vsize', 'hcycle', 'hoffset', 'hsync0', 'hsync1'];
  const missing = fields.find(id => {
    const input = document.getElementById(id);
    return !input.value.trim() || !input.checkValidity();
  });
  const selector = missing ? '#' + missing : '';
  $('#btn-run').attr('data-eab-missing', runActive ? '' : selector)
    .prop('disabled', runActive || !!missing);
}
async function startRun() {
  if (runActive) return;
  runActive = true;
  syncRunGate();
  $('#result-panel').addClass('hidden');
  $('#error-panel').addClass('hidden');
  const { command, cliArgs } = buildCliArgs();
  try {
    const resultJson = await API_EAB_runCli({ command: command, args: cliArgs }).then(resp => {
      if (resp.ok && resp.detail) return resp.detail;
      return Promise.reject(resp.error || 'Command failed');
    });
    const result = JSON.parse(resultJson);
    onRunComplete(result);
  } catch (err) {
    showError('Validation failed: ' + err);
    log('ERROR: ' + err);
  } finally {
    runActive = false;
    syncRunGate();
  }
}
function onRunComplete(result) {
  if (!result.success) {
    showError(result.error || 'Unknown validation error');
    log('ERROR: ' + (result.error || 'Unknown validation error'));
    return;
  }
  $('#result-panel').removeClass('hidden');
  const stats = [];
  if (result.valid !== undefined) {
    stats.push(['Valid', result.valid ? '✓ Yes' : '✗ No']);
  }
  if (result.so_value !== undefined) stats.push(['Pixels/Clock', result.so_value]);
  if (result.elapsed_ms !== undefined) stats.push(['Time', (result.elapsed_ms / 1000).toFixed(3) + 's']);
  $('#result-stats').html(stats.map(([l, v]) => `
    <div class="stat-item">
      <span class="stat-label">${l}</span>
      <span class="stat-value">${v}</span>
    </div>
  `).join(''));
  if (result.messages && result.messages.length > 0) {
    result.messages.forEach(m => log(m));
  }
  log(result.valid ? 'All display configuration registers are valid.' : 'Registers contain errors — fix them and validate again.');
}
$(function () {
  $('#hsize, #vsize, #hcycle, #hoffset, #hsync0, #hsync1').on('input change', syncRunGate);
  syncRunGate();
});
