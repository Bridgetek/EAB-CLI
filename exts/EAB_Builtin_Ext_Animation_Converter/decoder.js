const ASTCENC_FILTERS = [
  { name: 'astcenc executable', extensions: ['exe'] },
];
function pickGifFolder() {
  if (!isEmbedded()) {
    const path = prompt('Enter PNG frames folder:');
    if (path) addGifFiles([path]);
    return;
  }
  API_EAB_pickFolder({ title: 'Select a folder of PNG frames', readBase64: false }).then(resp => {
    if (resp && resp.ok && resp.folder) addGifFiles([resp.folder]);
  }).catch(err => showError('Failed to open folder picker: ' + err));
}
function pickAstcenc() {
  if (!isEmbedded()) {
    const path = prompt('Enter path to astcenc.exe:');
    if (path) {
      $('#astcenc-path').val(path);
    }
    return;
  }
  API_EAB_pickFile({ filters: ASTCENC_FILTERS }).then(resp => {
    if (resp.ok && resp.path) {
      $('#astcenc-path').val(resp.path);
    }
  }).catch(err => showError('Failed to open file picker: ' + err));
}
function buildCliArgs(inputPath) {
  const chipFamily = chipGroup();
  const astcBlock = $('#astc-block').val();
  const astcEffort = $('#astc-effort').val();
  let tileSize = $('#tile-size').val();
  if (tileSize === 'manual') {
    const tw = $('#tile-w').val() || '4';
    const th = $('#tile-h').val() || '4';
    tileSize = tw + 'x' + th;
  }
  const outputDir = $('#output-dir').val() || '.';
  const outputName = $('#output-name').val() || 'animation';
  const memoryType = $('#memory-type').val();
  const addressValue = parseInt($('#address-value').val()) || 0;
  const addressEnabled = !$('#address-value').prop('disabled');
  const reloc = $('#reloc-check').prop('checked');
  const astcencPath = $('#astcenc-path').val();
  const cliArgs = [
    '-i', inputPath,
    '-o', outputDir,
    '-n', outputName,
    '--astc-block', astcBlock,
    '--astc-effort', astcEffort,
    '--tile-size', tileSize,
  ];
  if (addressEnabled) cliArgs.push('-v', String(addressValue));
  if (chipFamily === 'legacy') {
    cliArgs.push('--memory-type', memoryType);
  } else if (reloc) {
    cliArgs.push('--reloc');
  }
  if (astcencPath) {
    cliArgs.push('--astcenc', astcencPath);
  }
  const command = (chipGeneration() || 'ft80x') + ' animation';
  return { command, cliArgs };
}
function pickGifFiles() {
  if (!isEmbedded()) {
    const raw = prompt('Enter GIF file paths (separate several with ;):');
    if (raw) addGifFiles(raw.split(';').map(p => p.trim()).filter(Boolean));
    return;
  }
  API_EAB_pickFiles({ filters: GIF_FILTERS, multiple: true, readBase64: false }).then(resp => {
    const paths = resp.paths || (resp.path ? [resp.path] : []);
    if (resp.ok && paths.length) addGifFiles(paths);
  }).catch(err => showError('Failed to open file picker: ' + err));
}
function pvFormatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}
