(function () {
  'use strict';
  var EVE_IMAGE_FORMAT_JSON = `
{
  "FT80X": {
    "formats": [
      { "name": "ARGB1555", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "ARGB4", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "ARGB2", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "RGB565", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "RGB332", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "PALETTED", "options": {} },
      { "name": "L8", "options": {} },
      { "name": "L4", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "L1", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "DXT1_L1_RGB565", "options": {} }
    ]
  },
  "FT81X/BT88X": {
    "formats": [
      { "name": "ARGB1555", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "ARGB4", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "ARGB2", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "RGB565", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "RGB332", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "PALETTED565", "options": {} },
      { "name": "PALETTED4444", "options": {} },
      { "name": "PALETTED8", "options": {} },
      { "name": "L8", "options": {} },
      { "name": "L4", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "L2", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "L1", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "DXT1_L2_RGB565", "options": {} },
      { "name": "DXT1_L2_PALETTED565", "options": {} },
      { "name": "DXT1_L1_RGB565", "options": {} },
      { "name": "DXT1_L1_PALETTED565", "options": {} }
    ]
  },
  "BT81X": {
    "formats": [
      { "name": "ASTC", "options": { "block": { "type": "enum", "enum": ["4x4", "5x4", "5x5", "6x5", "6x6", "8x5", "8x6", "8x8", "10x5", "10x6", "10x8", "10x10", "12x10", "12x12"], "default": "8x8" }, "efforts": { "type": "enum", "enum": ["fastest", "fast", "medium", "thorough", "exhaustive"], "default": "fastest" }, "extra_params": { "type": "input_text", "default": "-j <threads>" }, "multi_cell_height": { "type": "spinbox", "min": 0, "max": 9999, "default": 0 } } },
      { "name": "ARGB1555", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "ARGB4", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "ARGB2", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "RGB565", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "RGB332", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "PALETTED565", "options": {} },
      { "name": "PALETTED4444", "options": {} },
      { "name": "PALETTED8", "options": {} },
      { "name": "L8", "options": {} },
      { "name": "L4", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "L2", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "L1", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } } } },
      { "name": "DXT1_L2_RGB565", "options": {} },
      { "name": "DXT1_L2_PALETTED565", "options": {} },
      { "name": "DXT1_L1_RGB565", "options": {} },
      { "name": "DXT1_L1_PALETTED565", "options": {} }
    ]
  },
  "BT82X": {
    "formats": [
      { "name": "ASTC", "options": { "block": { "type": "enum", "enum": ["4x4", "5x4", "5x5", "6x5", "6x6", "8x5", "8x6", "8x8", "10x5", "10x6", "10x8", "10x10", "12x10", "12x12"], "default": "8x8" }, "efforts": { "type": "enum", "enum": ["fastest", "fast", "medium", "thorough", "exhaustive"], "default": "fastest" }, "extra_params": { "type": "input_text", "default": "-j <threads>" }, "multi_cell_height": { "type": "spinbox", "min": 0, "max": 9999, "default": 0 }, "zorder": { "enabled": { "type": "checkbox", "default": false }, "value": { "type": "spinbox", "min": 0, "max": 255, "default": 170 } } } },
      { "name": "YCBCR", "options": {} },
      { "name": "ARGB8", "options": { "zorder": { "enabled": { "type": "checkbox", "default": false }, "value": { "type": "spinbox", "min": 0, "max": 255, "default": 170 } } } },
      { "name": "ARGB6", "options": { "zorder": { "enabled": { "type": "checkbox", "default": false }, "value": { "type": "spinbox", "min": 0, "max": 255, "default": 170 } } } },
      { "name": "RGB8", "options": { "zorder": { "enabled": { "type": "checkbox", "default": false }, "value": { "type": "spinbox", "min": 0, "max": 255, "default": 170 } } } },
      { "name": "RGB6", "options": { "zorder": { "enabled": { "type": "checkbox", "default": false }, "value": { "type": "spinbox", "min": 0, "max": 255, "default": 170 } } } },
      { "name": "PALETTEDARGB8", "options": { "zorder": { "enabled": { "type": "checkbox", "default": false }, "value": { "type": "spinbox", "min": 0, "max": 255, "default": 170 } } } },
      { "name": "LA8", "options": { "zorder": { "enabled": { "type": "checkbox", "default": false }, "value": { "type": "spinbox", "min": 0, "max": 255, "default": 170 } }, "alpha_slider": { "type": "slider", "min": 0, "max": 100, "default": 100 } } },
      { "name": "LA4", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } }, "zorder": { "enabled": { "type": "checkbox", "default": false }, "value": { "type": "spinbox", "min": 0, "max": 255, "default": 170 } }, "alpha_slider": { "type": "slider", "min": 0, "max": 100, "default": 100 } } },
      { "name": "LA2", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } }, "zorder": { "enabled": { "type": "checkbox", "default": false }, "value": { "type": "spinbox", "min": 0, "max": 255, "default": 170 } }, "alpha_slider": { "type": "slider", "min": 0, "max": 100, "default": 100 } } },
      { "name": "LA1", "options": { "dithering": { "enabled": { "type": "checkbox", "default": true }, "mode": { "type": "enum", "enum": ["FLOYD_STEINBERG_SERPENTINE", "JARVIS_JUDICE_NINKE", "STUCKI", "ATKINSON", "BAYER_8x8", "BLUE_NOISE", "HALFTONE", "VOID_AND_CLUSTER", "DBS"], "default": "FLOYD_STEINBERG_SERPENTINE" } }, "zorder": { "enabled": { "type": "checkbox", "default": false }, "value": { "type": "spinbox", "min": 0, "max": 255, "default": 170 } }, "alpha_slider": { "type": "slider", "min": 0, "max": 100, "default": 100 } } }
    ]
  }
}
  `;
  var chipData = {};
  var formatDefs = {};
  var chipFormatLists = {};
  var chipDitherLists = {};
  var chipDitherDefault = {};
  function parseFormatData(jsonStr) {
    var data;
    try {
      data = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse EVE_IMAGE_FORMAT_JSON:', e);
      return;
    }
    chipData = data;
    for (var chip in data) {
      var formats = data[chip].formats || [];
      var expanded = [];
      var dithers = [];
      var ditherDefault = '';
      for (var i = 0; i < formats.length; i++) {
        var entry = formats[i];
        var name = entry.name;
        var options = entry.options || {};
        if (name === 'ASTC') {
          var blockObj = options.block;
          if (blockObj && blockObj.enum && Array.isArray(blockObj.enum)) {
            for (var j = 0; j < blockObj.enum.length; j++) {
              var blockName = blockObj.enum[j];
              var fmtName = 'ASTC_' + blockName.toUpperCase();
              expanded.push(fmtName);
              var parts = blockName.split('x');
              if (parts.length === 2) {
                formatDefs[fmtName] = {
                  family: 'astc',
                  bw: parseInt(parts[0], 10),
                  bh: parseInt(parts[1], 10)
                };
              } else {
                formatDefs[fmtName] = { family: 'astc' };
              }
            }
          } else {
            expanded.push('ASTC');
            formatDefs['ASTC'] = { family: 'astc' };
          }
        } else {
          expanded.push(name);
          if (!formatDefs[name]) {
            formatDefs[name] = { family: getFamily(name) };
          }
        }
        var ditherObj = options.dithering;
        if (ditherObj && ditherObj.mode && ditherObj.mode.enum && Array.isArray(ditherObj.mode.enum)) {
          for (var k = 0; k < ditherObj.mode.enum.length; k++) {
            var d = ditherObj.mode.enum[k];
            if (dithers.indexOf(d) === -1) dithers.push(d);
          }
          if (!ditherDefault && ditherObj.mode.default) ditherDefault = ditherObj.mode.default;
        }
      }
      expanded.sort();
      dithers.sort();
      chipFormatLists[chip] = expanded;
      chipDitherLists[chip] = dithers;
      chipDitherDefault[chip] = ditherDefault || 'FLOYD_STEINBERG';
    }
    var fallbackDefs = {
      'RGB565': { family: 'color', r:5, g:6, b:5 },
      'RGB8':   { family: 'color', r:8, g:8, b:8 },
      'RGB6':   { family: 'color', r:6, g:6, b:6 },
      'ARGB8':  { family: 'color', a:8, r:8, g:8, b:8 },
      'ARGB6':  { family: 'color', a:6, r:6, g:6, b:6 },
      'ARGB4':  { family: 'color', a:4, r:4, g:4, b:4 },
      'ARGB2':  { family: 'color', a:2, r:2, g:2, b:2 },
      'ARGB1555': { family: 'color', a:1, r:5, g:5, b:5 },
      'RGB332': { family: 'color', r:3, g:3, b:2 },
      'LA8':    { family: 'luma', l:8, a:8 },
      'LA4':    { family: 'luma', l:4, a:4 },
      'LA2':    { family: 'luma', l:2, a:2 },
      'LA1':    { family: 'luma', l:1, a:1 },
      'L8':     { family: 'luma', l:8 },
      'L4':     { family: 'luma', l:4 },
      'L2':     { family: 'luma', l:2 },
      'L1':     { family: 'luma', l:1 },
      'YCBCR':  { family: 'ycbcr' },
      'PALETTED': { family: 'paletted' },
      'PALETTED565': { family: 'paletted' },
      'PALETTED4444': { family: 'paletted' },
      'PALETTED8': { family: 'paletted' },
      'PALETTEDARGB8': { family: 'paletted' },
      'DXT1_L2_RGB565': { family: 'dxt1' },
      'DXT1_L2_PALETTED565': { family: 'dxt1' },
      'DXT1_L1_RGB565': { family: 'dxt1' },
      'DXT1_L1_PALETTED565': { family: 'dxt1' },
    };
    for (var f in fallbackDefs) {
      if (!formatDefs[f]) {
        formatDefs[f] = fallbackDefs[f];
      }
    }
  }
  function getFamily(name) {
    if (name.startsWith('ASTC_')) return 'astc';
    if (name === 'YCBCR') return 'ycbcr';
    if (name.startsWith('LA') || /^L[0-9]+$/.test(name)) return 'luma';
    if (name.startsWith('PALETTED')) return 'paletted';
    if (name.startsWith('DXT1_')) return 'dxt1';
    return 'color';
  }
  function populateSelect(id, options, defaultVal) {
    var $sel = $('#' + id);
    if (!$sel.length) return;
    $sel.html('');
    if (!options || options.length === 0) {
      $('<option>').val('').text('— No options —').appendTo($sel);
      return;
    }
    var found = false;
    for (var i = 0; i < options.length; i++) {
      var $opt = $('<option>').val(options[i]).text(options[i]);
      if (options[i] === defaultVal) {
        $opt.prop('selected', true);
        found = true;
      }
      $sel.append($opt);
    }
    if (!found && $sel.find('option').length > 0) {
      $sel.prop('selectedIndex', 0);
    }
  }
  function populateChips() {
    return Object.keys(chipData).indexOf('BT82X') >= 0 ? 'BT82X' : (Object.keys(chipData)[0] || '');
  }
  var lastDitherMode = null;
  function ensureDitherNoneOption($sel) {
    if ($sel.find('option[value="NONE"]').length) return;
    $('<option>').val('NONE').text('None (dithering off)').appendTo($sel);
  }
  function toggleDithering(enabled) {
    var $sel = $('#dither-select');
    if (!$sel.length) return;
    ensureDitherNoneOption($sel);
    if (!enabled) {
      if ($sel.val() && $sel.val() !== 'NONE') lastDitherMode = $sel.val();
      $sel.val('NONE');
    } else {
      var restore = lastDitherMode;
      if (!restore || restore === 'NONE') {
        var $opts = $sel.find('option').filter(function () { return $(this).val() !== 'NONE'; });
        restore = $opts.length ? $opts.eq(0).val() : 'NONE';
      }
      $sel.val(restore);
    }
    state.ditherAlgo = $sel.val();
  }
  window.toggleDithering = toggleDithering;
  window.syncDitherEnabled = syncDitherEnabled;
  function syncDitherEnabled() {
    var $sel = $('#dither-select');
    var $box = $('#dither-enabled');
    if (!$sel.length || !$box.length) return;
    ensureDitherNoneOption($sel);
    if ($sel.val() !== 'NONE' && $box.prop('checked')) lastDitherMode = $sel.val();
    $box.prop('checked', $sel.val() !== 'NONE');
    if (!$box.prop('checked') && $sel.val() !== 'NONE') $sel.val('NONE');
    state.ditherAlgo = $sel.val();
  }
  function onChipChange(chip) {
    $('#gen-src-platform').toggleClass('hidden', chip !== 'BT82X');
    var formats = chipFormatLists[chip] || [];
    var dithers = chipDitherLists[chip] || [];
    populateSelect('format-select', formats, formats[0] || '');
    populateSelect('dither-select', dithers, chipDitherDefault[chip] || dithers[0] || 'NONE');
    syncDitherEnabled();
    var $fmtSel = $('#format-select');
    var $dithSel = $('#dither-select');
    if ($fmtSel.length) {
      state.format = $fmtSel.val();
      window.onFormatChange($fmtSel.val());
    }
    if ($dithSel.length) {
      state.ditherAlgo = $dithSel.val();
    }
    var $pa = $('#preview-after-content');
    if ($pa.length) {
      $pa.html('<div class="preview-placeholder">No image loaded</div>');
      $pa.removeClass('has-image');
    }
  }
  var DITHER_DEFS = {
    'NONE':                       { type:'none' },
    'FLOYD_STEINBERG':            { type:'err-diff', serpentine:false, coeff:[[1,0,7/16],[-1,1,3/16],[0,1,5/16],[1,1,1/16]] },
    'FLOYD_STEINBERG_SERPENTINE': { type:'err-diff', serpentine:true, coeff:[[1,0,7/16],[-1,1,3/16],[0,1,5/16],[1,1,1/16]] },
    'JARVIS_JUDICE_NINKE':       { type:'err-diff', serpentine:false, coeff:[[1,0,7/48],[2,0,5/48],[-2,1,3/48],[-1,1,5/48],[0,1,7/48],[1,1,5/48],[2,1,3/48],[-2,2,1/48],[-1,2,3/48],[0,2,5/48],[1,2,3/48],[2,2,1/48]] },
    'STUCKI':                     { type:'err-diff', serpentine:false, coeff:[[1,0,8/42],[2,0,4/42],[-2,1,2/42],[-1,1,4/42],[0,1,8/42],[1,1,4/42],[2,1,2/42],[-2,2,1/42],[-1,2,2/42],[0,2,4/42],[1,2,2/42],[2,2,1/42]] },
    'ATKINSON':                   { type:'err-diff', serpentine:false, coeff:[[1,0,1/8],[2,0,1/8],[-1,1,1/8],[0,1,1/8],[1,1,1/8],[0,2,1/8]] },
    'BURKES':                     { type:'err-diff', serpentine:false, coeff:[[1,0,8/32],[2,0,4/32],[-2,1,2/32],[-1,1,4/32],[0,1,8/32],[1,1,4/32],[2,1,2/32]] },
    'SIERRA_3':                   { type:'err-diff', serpentine:false, coeff:[[1,0,5/32],[2,0,3/32],[-2,1,2/32],[-1,1,4/32],[0,1,5/32],[1,1,4/32],[2,1,2/32],[-1,2,2/32],[0,2,3/32],[1,2,2/32]] },
    'SIERRA_2':                   { type:'err-diff', serpentine:false, coeff:[[1,0,4/16],[2,0,3/16],[-2,1,1/16],[-1,1,2/16],[0,1,3/16],[1,1,2/16],[2,1,1/16]] },
    'SIERRA_LITE':                { type:'err-diff', serpentine:false, coeff:[[1,0,2/4],[-1,1,1/4],[0,1,1/4]] },
    'BAYER_2x2':                  { type:'ordered', size:2 },
    'BAYER_4x4':                  { type:'ordered', size:4 },
    'BAYER_8x8':                  { type:'ordered', size:8 },
    'WHITE_NOISE':                { type:'noise', noise:'white' },
    'BLUE_NOISE':                 { type:'noise', noise:'blue' },
    'VOID_AND_CLUSTER':           { type:'noise', noise:'blue' },
    'HALFTONE':                   { type:'ordered', size:4 },
    'DBS':                        { type:'err-diff', serpentine:false, coeff:[] }
  };
  function genBayer(n) {
    if (n===1) return [[0]];
    var p=genBayer(n/2), s=n/2, m=Array(n);
    for(var y=0;y<n;y++) m[y]=Array(n);
    for(var y=0;y<s;y++) for(var x=0;x<s;x++){
      m[y][x]=4*p[y][x]; m[y][x+s]=4*p[y][x]+2;
      m[y+s][x]=4*p[y][x]+3; m[y+s][x+s]=4*p[y][x]+1;
    }
    return m;
  }
  var BAYER = { 2:genBayer(2), 4:genBayer(4), 8:genBayer(8) };
  var _bnMask = null;
  function genBlueNoise() {
    var S=64, m=new Float32Array(S*S), seed=12345;
    for(var i=0;i<m.length;i++){seed=(seed*1664525+1013904223)&0xFFFFFFFF;m[i]=(seed>>>0)/4294967296;}
    for(var it=0;it<8;it++){
      var n=new Float32Array(S*S), R=12;
      for(var y=0;y<S;y++) for(var x=0;x<S;x++){
        var s=0,w=0;
        for(var dy=-R;dy<=R;dy++) for(var dx=-R;dx<=R;dx++){
          if(!dx&&!dy) continue;
          var d=Math.sqrt(dx*dx+dy*dy);
          if(d>R) continue;
          var wt=1/(d+0.01);
          s+=m[((y+dy+S)%S)*S+((x+dx+S)%S)]*wt; w+=wt;
        }
        n[y*S+x]=w>0?s/w:m[y*S+x];
      }
      m=n; var mn=1,mx=0;
      for(var i=0;i<m.length;i++){if(m[i]<mn)mn=m[i];if(m[i]>mx)mx=m[i];}
      var r=mx-mn; if(r>0) for(var i=0;i<m.length;i++) m[i]=(m[i]-mn)/r;
    }
    return m;
  }
  function qCh(v,b){if(b>=8)return v;var l=(1<<b)-1;return Math.round(v/255*l)/l*255;}
  function cl(v){return v<0?0:v>255?255:v;}
  function simpleQuantize(d,rB,gB,bB,aB){
    for(var i=0;i<d.length;i+=4){
      d[i]=qCh(d[i],rB); d[i+1]=qCh(d[i+1],gB); d[i+2]=qCh(d[i+2],bB);
      if(aB!==undefined) d[i+3]=qCh(d[i+3],aB);
    }
  }
  function errDiffuse(d,w,h,rB,gB,bB,aB,algo){
    var c=algo.coeff, s=algo.serpentine, cp=new Uint8ClampedArray(d);
    for(var y=0;y<h;y++){
      var ltr=!s||(y%2===0), xs=ltr?0:w-1, xe=ltr?w:-1, xp=ltr?1:-1;
      for(var x=xs;x!==xe;x+=xp){
        var i=(y*w+x)*4;
        var nr=qCh(cp[i],rB), ng=qCh(cp[i+1],gB), nb=qCh(cp[i+2],bB);
        var na=aB>0&&aB<8?qCh(cp[i+3],aB):cp[i+3];
        var er=cp[i]-nr, eg=cp[i+1]-ng, eb=cp[i+2]-nb;
        cp[i]=nr; cp[i+1]=ng; cp[i+2]=nb; cp[i+3]=na;
        for(var k=0;k<c.length;k++){
          var dx=ltr?c[k][0]:-c[k][0], dy=c[k][1], wt=c[k][2];
          var nx=x+dx, ny=y+dy;
          if(nx<0||nx>=w||ny<0||ny>=h) continue;
          var ni=(ny*w+nx)*4;
          cp[ni]=cl(cp[ni]+er*wt); cp[ni+1]=cl(cp[ni+1]+eg*wt); cp[ni+2]=cl(cp[ni+2]+eb*wt);
        }
      }
    }
    for(var i=0;i<d.length;i++) d[i]=cp[i];
  }
  function orderedDith(d,w,h,rB,gB,bB,aB,algo){
    var sz=algo.size, mx=BAYER[sz], tot=sz*sz;
    for(var y=0;y<h;y++) for(var x=0;x<w;x++){
      var i=(y*w+x)*4, thr=(mx[y%sz][x%sz]+0.5)/tot;
      for(var c=0;c<3;c++){
        var bits=[rB,gB,bB][c]; if(bits>=8) continue;
        var l=(1<<bits)-1, v=d[i+c]/255, q=Math.floor(v*l), f=v*l-q;
        d[i+c]=Math.round((f>thr?Math.min(q+1,l):q)/l*255);
      }
      if(aB!==undefined&&aB<8){
        var l=(1<<aB)-1, v=d[i+3]/255, q=Math.floor(v*l), f=v*l-q;
        d[i+3]=Math.round((f>thr?Math.min(q+1,l):q)/l*255);
      }
    }
  }
  function noiseDith(d,w,h,rB,gB,bB,aB,algo){
    var isBlue=algo.noise==='blue';
    if(isBlue&&!_bnMask) _bnMask=genBlueNoise();
    for(var y=0;y<h;y++) for(var x=0;x<w;x++){
      var i=(y*w+x)*4;
      var thr=isBlue?_bnMask[(y%64)*64+(x%64)]:Math.random();
      for(var c=0;c<3;c++){
        var bits=[rB,gB,bB][c]; if(bits>=8) continue;
        var l=(1<<bits)-1, v=d[i+c]/255, q=Math.floor(v*l), f=v*l-q;
        d[i+c]=Math.round((f>thr?Math.min(q+1,l):q)/l*255);
      }
      if(aB!==undefined&&aB<8){
        var l=(1<<aB)-1, v=d[i+3]/255, q=Math.floor(v*l), f=v*l-q;
        d[i+3]=Math.round((f>thr?Math.min(q+1,l):q)/l*255);
      }
    }
  }
  function processLuma(d,w,h,lB,aB,da){
    for(var i=0;i<d.length;i+=4){
      var l=((d[i]*19595+d[i+1]*38470+d[i+2]*7471+32768)/65536)|0;
      if(l>255)l=255;if(l<0)l=0;
      d[i]=d[i+1]=d[i+2]=l;
    }
    var algo=DITHER_DEFS[da]||DITHER_DEFS['NONE'];
    if(algo.type==='none'){
      for(var i=0;i<d.length;i+=4){
        var l=qCh(d[i],lB); d[i]=d[i+1]=d[i+2]=l;
        if(aB>0&&aB<8) d[i+3]=qCh(d[i+3],aB);
      }
    } else if(algo.type==='err-diff'){
      var c=algo.coeff, s=algo.serpentine, cp=new Uint8ClampedArray(d);
      for(var y=0;y<h;y++){
        var ltr=!s||(y%2===0), xs=ltr?0:w-1, xe=ltr?w:-1, xp=ltr?1:-1;
        for(var x=xs;x!==xe;x+=xp){
          var i=(y*w+x)*4, ol=cp[i], nl=qCh(ol,lB), er=ol-nl;
          cp[i]=cp[i+1]=cp[i+2]=nl;
          if(aB>0&&aB<8) cp[i+3]=qCh(cp[i+3],aB);
          for(var k=0;k<c.length;k++){
            var dx=ltr?c[k][0]:-c[k][0], dy=c[k][1], wt=c[k][2];
            var nx=x+dx, ny=y+dy;
            if(nx<0||nx>=w||ny<0||ny>=h) continue;
            cp[(ny*w+nx)*4]=cl(cp[(ny*w+nx)*4]+er*wt);
          }
        }
      }
      for(var i=0;i<d.length;i++) d[i]=cp[i];
    } else {
      var isBlue=algo.noise==='blue';
      if(isBlue&&!_bnMask) _bnMask=genBlueNoise();
      for(var y=0;y<h;y++) for(var x=0;x<w;x++){
        var i=(y*w+x)*4;
        var thr;
        if(algo.type==='ordered'){
          var mx=BAYER[algo.size];
          thr=(mx[y%algo.size][x%algo.size]+0.5)/(algo.size*algo.size);
        } else thr=isBlue?_bnMask[(y%64)*64+(x%64)]:Math.random();
        var l=(1<<lB)-1, v=d[i]/255, qq=Math.floor(v*l), f=v*l-qq;
        d[i]=d[i+1]=d[i+2]=Math.round((f>thr?Math.min(qq+1,l):qq)/l*255);
      }
    }
  }
  function processYCbCr(d){
    for(var i=0;i<d.length;i+=4){
      var r=d[i],g=d[i+1],b=d[i+2];
      var y=((r*19595+g*38470+b*7471+32768)/65536)|0;
      if(y>255)y=255;if(y<0)y=0;
      d[i]=d[i+1]=d[i+2]=y;
    }
  }
  function processPal(d,w,h){
    var px=[]; for(var i=0;i<d.length;i+=4) px.push([d[i],d[i+1],d[i+2],d[i+3]]);
    function makeBox(p){
      var mn=[255,255,255,255],mx=[0,0,0,0];
      for(var k=0;k<p.length;k++) for(var c=0;c<4;c++){
        if(p[k][c]<mn[c])mn[c]=p[k][c]; if(p[k][c]>mx[c])mx[c]=p[k][c];
      }
      return {p:p,mn:mn,mx:mx,vol:(mx[0]-mn[0]+1)*(mx[1]-mn[1]+1)*(mx[2]-mn[2]+1)*(mx[3]-mn[3]+1)};
    }
    function bestAxis(box){
      var r=box.mx[0]-box.mn[0],g=box.mx[1]-box.mn[1],bl=box.mx[2]-box.mn[2],a=box.mx[3]-box.mn[3];
      if(r>=g&&r>=bl&&r>=a)return 0; if(g>=bl&&g>=a)return 1; if(bl>=a)return 2; return 3;
    }
    var boxes=[makeBox(px)];
    while(boxes.length<256){
      var bi=-1,bv=-1;
      for(var i=0;i<boxes.length;i++) if(boxes[i].vol>bv){bv=boxes[i].vol;bi=i;}
      if(bi<0||boxes[bi].p.length<2) break;
      var box=boxes[bi],axis=bestAxis(box),mid=Math.floor(box.p.length/2);
      box.p.sort(function(a,b){return a[axis]-b[axis];});
      var L=box.p.slice(0,mid),R=box.p.slice(mid);
      boxes.splice(bi,1);
      if(L.length)boxes.push(makeBox(L)); if(R.length)boxes.push(makeBox(R));
    }
    var pal=[]; for(var i=0;i<boxes.length;i++){
      var s=[0,0,0,0],n=boxes[i].p.length;
      for(var k=0;k<n;k++)for(var c=0;c<4;c++)s[c]+=boxes[i].p[k][c];
      pal.push([Math.round(s[0]/n),Math.round(s[1]/n),Math.round(s[2]/n),Math.round(s[3]/n)]);
    }
    while(pal.length<256)pal.push([0,0,0,0]);
    pal=pal.slice(0,256);
    for(var i=0;i<d.length;i+=4){
      var bi=0,bd=Infinity;
      for(var j=0;j<pal.length;j++){
        var dr=d[i]-pal[j][0],dg=d[i+1]-pal[j][1],db=d[i+2]-pal[j][2],da=d[i+3]-pal[j][3];
        var dist=dr*dr+dg*dg+db*db+da*da;
        if(dist<bd){bd=dist;bi=j;}
      }
      d[i]=pal[bi][0];d[i+1]=pal[bi][1];d[i+2]=pal[bi][2];d[i+3]=pal[bi][3];
    }
  }
  var ASTC_EFFORT_MAP = { fastest:0.5, fast:0.7, medium:0.85, thorough:1.0, exhaustive:1.2 };
  function processASTC(d,w,h,bw,bh,eff){
    var em=ASTC_EFFORT_MAP[eff]||1, bp=bw*bh;
    var qb=Math.max(3,Math.min(8,Math.round(8-bp/16*(2-em))));
    for(var by=0;by<h;by+=bh) for(var bx=0;bx<w;bx+=bw){
      var rMin=255,gMin=255,bMin=255,rMax=0,gMax=0,bMax=0,cnt=0;
      for(var dy=0;dy<bh&&by+dy<h;dy++) for(var dx=0;dx<bw&&bx+dx<w;dx++){
        var i=((by+dy)*w+(bx+dx))*4;
        var r=d[i],g=d[i+1],b=d[i+2];
        if(r<rMin)rMin=r;if(g<gMin)gMin=g;if(b<bMin)bMin=b;
        if(r>rMax)rMax=r;if(g>gMax)gMax=g;if(b>bMax)bMax=b;
        cnt++;
      }
      if(!cnt) continue;
      rMin=qCh(rMin,qb);gMin=qCh(gMin,qb);bMin=qCh(bMin,qb);
      rMax=qCh(rMax,qb);gMax=qCh(gMax,qb);bMax=qCh(bMax,qb);
      var er=rMax-rMin,eg=gMax-gMin,eb=bMax-bMin;
      var elen=er*er+eg*eg+eb*eb;
      for(var dy=0;dy<bh&&by+dy<h;dy++) for(var dx=0;dx<bw&&bx+dx<w;dx++){
        var i=((by+dy)*w+(bx+dx))*4;
        var wgt=0.5;
        if(elen>0){
          var dot=(d[i]-rMin)*er+(d[i+1]-gMin)*eg+(d[i+2]-bMin)*eb;
          wgt=Math.max(0,Math.min(1,dot/elen));
        }
        var gridW=Math.max(1,Math.round(16/em));
        wgt=Math.round(wgt*gridW)/gridW;
        d[i]=Math.round(rMin+er*wgt);
        d[i+1]=Math.round(gMin+eg*wgt);
        d[i+2]=Math.round(bMin+eb*wgt);
      }
    }
  }
  function simulateConversion(srcUrl,fmt,da,ae){
    return new Promise(function(resolve){
      var img=new Image();
      img.onload=function(){
        try{
          var w=img.width,h=img.height,MAX=3840;
          if(w>MAX||h>MAX){var sc=Math.min(MAX/w,MAX/h);w=Math.round(w*sc);h=Math.round(h*sc);}
          var cv=$('<canvas>').get(0);cv.width=w;cv.height=h;
          var cx=cv.getContext('2d');cx.drawImage(img,0,0,w,h);
          var id=cx.getImageData(0,0,w,h), d=id.data, def=formatDefs[fmt];
          if(!def){resolve(null);return;}
          switch(def.family){
            case'color':
              if(da&&da!=='NONE'){
                var a=DITHER_DEFS[da];
                if(a.type==='err-diff') errDiffuse(d,w,h,def.r||8,def.g||8,def.b||8,def.a,a);
                else if(a.type==='ordered') orderedDith(d,w,h,def.r||8,def.g||8,def.b||8,def.a,a);
                else if(a.type==='noise') noiseDith(d,w,h,def.r||8,def.g||8,def.b||8,def.a,a);
              } else simpleQuantize(d,def.r||8,def.g||8,def.b||8,def.a);
              break;
            case'luma': processLuma(d,w,h,def.l||8,def.a||8,da); break;
            case'ycbcr': processYCbCr(d); break;
            case'paletted': processPal(d,w,h); break;
            case'astc': processASTC(d,w,h,def.bw,def.bh,ae); break;
            default: break;
          }
          id.data.set(d); cx.putImageData(id,0,0);
          resolve({dataUrl:cv.toDataURL('image/png'),w:w,h:h,fmt:fmt});
        }catch(e){console.error('[Sim]',e);resolve(null);}
      };
      img.onerror=function(){resolve(null);};
      img.src=srcUrl;
    });
  }
  function debounce(fn,ms){var t=null;return function(){var a=arguments,ctx=this;if(t)clearTimeout(t);t=setTimeout(function(){t=null;fn.apply(ctx,a);},ms);};}
  var images = [];
  function truncateLeft(text, maxLen) {
    if (!text) return '';
    if (text.length <= maxLen) return text;
    return '\u2026' + text.slice(-(maxLen - 1));
  }
  function esc(str) {
    return $('<div>').text(str || '').html();
  }
  function escAttr(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function addImages(items) {
    if (!items || items.length === 0) return;
    var added = 0;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var path = typeof item === 'string' ? item : (item.path || '');
      if (!path) continue;
      if (!images.some(function (im) { return im.path === path; })) {
        images.push({
          path: path,
          name: typeof item === 'string'
            ? path.split(/[/\\]/).pop() || path
            : (item.name || path.split(/[/\\]/).pop() || path),
          data: typeof item === 'string' ? null : (item.data || null),
        });
        added++;
      }
    }
    if (added > 0) {
      renderFileList();
      prefetchThumbnails();
    }
  }
  function removeImage(path) {
    images = images.filter(function (im) { return im.path !== path; });
    renderFileList();
  }
  function renderFileList() {
    var $fileList = $('#file-list');
    var $fileCount = $('#file-count');
    var $emptyMsg = $('#empty-msg');
    var $btnClear = $('#btn-clear-all');
    var $main = $('#file-list').closest('.app-main');
    $main.toggleClass('is-queue-empty', images.length === 0 && !$main.hasClass('is-options-shown'));
    if ($fileCount.length) $fileCount.text('(' + images.length + ')');
    if (images.length === 0) {
      if ($emptyMsg.length) $emptyMsg.removeClass('hidden');
      if ($fileList.length) $fileList.html('');
      if ($btnClear.length) $btnClear.addClass('hidden');
      setConvertEnabled(false);
      return;
    }
    if ($emptyMsg.length) $emptyMsg.addClass('hidden');
    if ($btnClear.length) $btnClear.removeClass('hidden');
    setConvertEnabled(true);
    var html = '';
    var maxLen = 72;
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      var display = truncateLeft(img.path, maxLen);
      var thumbnail = img.data
        ? '<img class="file-item-thumb" src="' + esc(img.data) + '" alt="">'
        : '<span class="file-item-thumb-placeholder">\uD83D\uDCC4</span>';
      html += '<div class="file-item list-group-item" data-path="' + escAttr(img.path) + '" title="' + escAttr(img.path) + '">'
        + thumbnail
        + '<span class="file-item-name">' + esc(display) + '</span>'
        + '<span class="file-item-remove" data-path="' + escAttr(img.path) + '" title="Remove from the queue">\u00d7</span>'
        + '</div>';
    }
    if (!$fileList.length) return;
    $fileList.html(html);
    $fileList.find('.file-item-remove').each(function () {
      var $el = $(this);
      $el.on('click', function () {
        removeImage($el.attr('data-path'));
      });
    });
    $fileList.find('.file-item').each(function (idx) {
      var $el = $(this);
      $el.on('click', function (e) {
        if ($(e.target).hasClass('file-item-remove')) return;
        showPreview(images[idx]);
      });
    });
  }
  function showError(msg) {
    var $panel = $('#error-panel');
    if ($panel.length) {
      $panel.text(msg);
      $panel.removeClass('hidden');
      setTimeout(function () { $panel.addClass('hidden'); }, 8000);
    }
    console.error('[UI]', msg);
    log('ERROR: ' + msg);
  }
  function markSampleFail(tab) {
    var $btn = $('.dz-sample[data-sample="' + tab + '"]');
    if (!$btn.length) return;
    $btn.text('⚠ No samples');
    setTimeout(function () { $btn.text('✨ Use Sample'); }, 6000);
  }
  function log(msg) { console.log('[eab] ' + msg); }
  window.log = log;
  function showPreview(img) {
    var $previewContent = $('#preview-content');
    if (!$previewContent.length) return;
    if (!img || !img.data) {
      $previewContent.html('<div class="preview-placeholder">No image loaded</div>');
      $previewContent.removeClass('has-image');
      return;
    }
    $previewContent.html(''
      + '<div style="padding:8px;text-align:left;word-break:break-all;width:100%;">'
      + '  <div style="font-weight:600;font-size:13px;margin-bottom:4px;">' + esc(img.name) + '</div>'
      + '  <img src="' + esc(img.data) + '" style="max-width:100%;max-height:320px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.25);">'
      + '</div>');
    $previewContent.addClass('has-image');
  }
  function formatLabel(fmt){
    var def=formatDefs[fmt];
    if(!def) return fmt;
    if(def.family==='color'){
      var parts=[];
      if(def.a) parts.push('A'+def.a);
      parts.push('R'+def.r); parts.push('G'+def.g); parts.push('B'+def.b);
      return fmt+' ('+parts.join(':')+')';
    }
    if(def.family==='luma') return fmt+' (L'+def.l+(def.a?':A'+def.a:'')+')';
    if(def.family==='astc') return fmt+' ('+def.bw+'\u00d7'+def.bh+' block)';
    if(def.family==='paletted') return fmt;
    if(def.family==='ycbcr') return fmt+' (Y only)';
    if(def.family==='dxt1') return fmt;
    return fmt;
  }
  var _previewIdx = -1;
  var _previewGen = 0;
  function updateAfterConvertPreview(idx){
    var $pa=$('#preview-after-content');
    if(!$pa.length) return;
    _previewIdx=idx;
    if(idx<0||!images[idx]||!images[idx].data){
      $pa.html('<div class="preview-placeholder">No image loaded</div>');
      $pa.removeClass('has-image');
      return;
    }
    if (batchState.formatOk === false) { stopAfterPreview(); return; }
    var gen = ++_previewGen;
    $pa.find('.preview-loading-overlay').remove();
    var $overlay = $('<div class="preview-loading-overlay">');
    $overlay.text('preview is loading...');
    $overlay.appendTo($pa);
    setTimeout(function(){
      if(_previewIdx!==idx || _previewGen!==gen) return;
      simulateConversion(images[idx].data,state.format,formatHasDither(state.format)?state.ditherAlgo:'NONE',state.astcEffort).then(function(r){
        if(_previewIdx!==idx || _previewGen!==gen) return;
        $pa.find('.preview-loading-overlay').remove();
        if(!r){$pa.html('<div class="preview-placeholder">Preview unavailable</div>');$pa.removeClass('has-image');return;}
        var fl=state.format;
        var dl=(formatHasDither(fl)&&state.ditherAlgo!=='NONE'&&DITHER_DEFS[state.ditherAlgo])?state.ditherAlgo:'';
        var labels=[formatLabel(fl)];
        if(dl) labels.push('Dither: '+dl);
        var infoLine=labels.join(' | ');
        $pa.html('<div style="padding:8px;text-align:left;word-break:break-all;width:100%;">'
          +'<div style="font-weight:600;font-size:13px;margin-bottom:4px;">'+esc(images[idx].name)+'</div>'
          +'<img src="'+esc(r.dataUrl)+'" style="max-width:100%;max-height:320px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.25);">'
          +'<div class="preview-info">'+esc(infoLine)+'</div>This preview is simulated by Javascript (not by an EVE engine)</div>');
        $pa.addClass('has-image');
      });
    },50);
  }
  var IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'jpe', 'jfif', 'bmp', 'tif', 'tiff', 'webp', 'gif', 'tga', 'ico', 'pnm', 'dds', 'hdr'];
  var IMAGES_FILTERS = [{ name: 'Images', extensions: IMAGE_EXTENSIONS }];
  var JPEG_FILTERS = [{ name: 'JPEG images', extensions: ['jpg', 'jpeg', 'jpe', 'jfif'] }];
  var RAW_FILTERS = [
    { name: 'Raw pixel data', extensions: ['raw'] },
    { name: 'Palette / LUT', extensions: ['lut'] }
  ];
  function isEmbedded() {
    return window.parent !== window;
  }
  function promptForPaths(what) {
    var raw = prompt('Enter ' + what + ' (separate several with ;):');
    if (!raw) return [];
    return raw.split(';').map(function (p) { return p.trim(); }).filter(Boolean);
  }
  function queuePickerResult(resp, label) {
    if (!resp || !resp.ok) {
      showError(label + ' failed: ' + ((resp && resp.error) || 'unknown error'));
      return;
    }
    var items = (resp.paths && resp.paths.length) ? resp.paths
      : (resp.files && resp.files.length) ? resp.files
        : (resp.path ? [resp.path] : []);
    if (!items.length) {
      return;
    }
    addImages(items);
  }
  window.pickFiles = function () {
    if (!isEmbedded()) {
      queuePickerResult({ ok: true, paths: promptForPaths('image file paths') }, 'Add files');
      return;
    }
    API_EAB_pickFiles({
      filters: IMAGES_FILTERS,
      title: 'Select images to convert',
      readBase64: false,
    }).then(function (resp) { queuePickerResult(resp, 'Add files'); });
  };
  window.pickFolder = function () {
    if (!isEmbedded()) {
      queuePickerResult({ ok: true, paths: promptForPaths('a folder path') }, 'Add folder');
      return;
    }
    API_EAB_pickFolder({
      extensions: IMAGE_EXTENSIONS,
      title: 'Select a folder of images',
      readBase64: false,
    }).then(function (resp) {
      queuePickerResult(resp, 'Add folder');
      if (resp && resp.ok && resp.folder) {
        var $dirInput = $('#output-dir');
        if ($dirInput.length && !$dirInput.val()) {
          $dirInput.val(resp.folder);
          state.outputDir = resp.folder;
          setConvertEnabled(images.length > 0);
        }
      }
    });
  };
  function imageFor(path) {
    for (var i = 0; i < images.length; i++) {
      if (images[i].path === path) return images[i];
    }
    return null;
  }
  var _dataQueue = [];
  var _dataBusy = false;
  function queueImageData(path, onReady) {
    var img = path ? imageFor(path) : null;
    if (!img) { if (onReady) onReady(null); return; }
    if (img.data) { if (onReady) onReady(img); return; }
    if (onReady) img._onReady = onReady;
    if (img._dataQueued) return;
    img._dataQueued = true;
    _dataQueue.push(img);
    pumpImageData();
  }
  function pumpImageData() {
    if (_dataBusy) return;
    var img = _dataQueue.shift();
    if (!img) return;
    _dataBusy = true;
    function done(ok) {
      img._dataQueued = false;
      img._dataTried = true;
      _dataBusy = false;
      if (ok) paintThumbnail(img);
      var cb = img._onReady;
      delete img._onReady;
      if (typeof cb === 'function') cb(img);
      pumpImageData();
    }
    readFileData(img.path).then(function (resp) {
      if (resp && resp.ok && resp.data) img.data = resp.data;
      done(!!img.data);
    }, function () { done(false); });
  }
  function paintThumbnail(img) {
    var $list = $('#file-list');
    if (!$list.length || !img.data) return;
    var $rows = $list.find('.file-item');
    for (var i = 0; i < $rows.length; i++) {
      var $row = $rows.eq(i);
      if ($row.attr('data-path') !== img.path) continue;
      var $slot = $row.find('.file-item-thumb, .file-item-thumb-placeholder').eq(0);
      if (!$slot.length) return;
      $slot.replaceWith($('<img class="file-item-thumb" alt="">').attr('src', img.data));
      return;
    }
  }
  function prefetchThumbnails() {
    var limit = Math.min(images.length, 40);
    for (var i = 0; i < limit; i++) queueImageData(images[i].path);
  }
  window.addImages = addImages;
  window.clearFiles = function () {
    images = [];
    renderFileList();
    showPreview(null);
    var $pa = $('#preview-after-content');
    if ($pa.length) {
      $pa.html('<div class="preview-placeholder">No image loaded</div>');
      $pa.removeClass('has-image');
    }
    var $pc = $('#preview-content');
    if ($pc.length) $pc.removeClass('has-image');
    _previewIdx = -1;
    API_EAB_clearTasks({});
  };
  window.pickOutput = function () {
    API_EAB_pickOutput({}).then(function (resp) {
      if (!resp.ok) {
        showError('pickOutput failed: ' + (resp.error || 'unknown error'));
        return;
      }
      if (resp.folder) {
        var $dirInput = $('#output-dir');
        if ($dirInput.length) {
          $dirInput.val(resp.folder);
          state.outputDir = resp.folder;
          setConvertEnabled(images.length > 0);
        }
      }
    });
  };
  window.openOutputLocation = function () {
    var $dir = $('#output-dir');
    var path = ($dir.length && $dir.val()) ? String($dir.val()) : '.';
    API_EAB_openOutputLocation({ path: path }).then(function (resp) {
      if (resp && resp.ok) return;
      showError('Open Output failed: ' + ((resp && resp.error) || 'no answer from the host'));
    });
  };
  function formatHasDither(format) {
    var f = String(format || '').toUpperCase();
    return /^(ARGB|LA|L|RGB)/.test(f) && f !== 'RGB8';
  }
  window.onFormatChange = function (val) {
    var $group = $('#astc-effort-group');
    if ($group.length) {
      if (val && val.indexOf('ASTC_') === 0) {
        $group.removeClass('hidden');
      } else {
        $group.addClass('hidden');
      }
    }
    var $dither = $('#dither-group');
    if ($dither.length) {
      var ditherOn = formatHasDither(val);
      $('#dither-enabled, #dither-select').prop('disabled', !ditherOn);
      $('#dither-hint').toggleClass('hidden', ditherOn);
    }
  };
  window.onChipChange = onChipChange;
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
  function chipRow(value) {
    var key = String(value || '').toUpperCase();
    return CHIP_TABLE[key] || CHIP_GEN[key] || null;
  }
  function chipGeneration() {
    var pick = chipPicked();
    var row = pick ? chipRow(pick.value) : null;
    return row ? row[1] : '';
  }
  function chipGroup() {
    return chipGeneration() === 'bt82x' ? 'bt82x' : 'legacy';
  }
  function chipLabel(which) {
    var $box = $('#' + CHIP_BOX[which]);
    return $box.length ? $box.parent().find('[data-chip-label="' + which + '"]').eq(0) : $();
  }
  window.onChipPick = function (which) {
    var boxes = {}, k;
    for (k in CHIP_BOX) boxes[k] = $('#' + CHIP_BOX[k]);
    if (!boxes.part.length || !boxes.gen.length) return;
    var row = null;
    if (which === 'part') row = CHIP_TABLE[String(boxes.part.val() || '').toUpperCase()];
    else if (which === 'gen') row = CHIP_GEN[String(boxes.gen.val() || '').toUpperCase()];
    for (k in CHIP_BOX) {
      var $lab = chipLabel(k);
      if ($lab.length) $lab.css('fontWeight', k === which ? '700' : '');
      if (k !== which) boxes[k].val('');
    }
    if (row && chipData[row[0]]) onChipChange(row[0]);
    else validateFormat();
  };
  function chipPicked() {
    var order = ['gen', 'part'], i;
    for (i = 0; i < order.length; i++) {
      var $sel = $('#' + CHIP_BOX[order[i]]);
      var value = $sel.length ? String($sel.val() || '') : '';
      if (value) return { kind: order[i], value: value };
    }
    return null;
  }
  function syncChipPicker() {
    var $picker = $('#chip-one');
    if (!$picker.length) return;
    var picked = chipPicked();
    $picker.val(picked ? picked.kind + ':' + picked.value : '');
    syncChipHint();
  }
  var CHIP_HINTS = {
    'bt82x': 'BT82x — includes BT820.',
    legacy: 'Pre-BT82x — includes FT80x, FT81x, BT88x and BT81x.'
  };
  function syncChipHint() {
    var $hint = $('#chip-hint');
    if (!$hint.length) return;
    $hint.text(CHIP_HINTS[sampleChipKey()] || 'Pick whichever one you know.');
  }
  function buildChipPicker() {
    var $picker = $('#chip-one');
    if (!$picker.length || $picker.find('optgroup').length) return;
    for (var k in CHIP_BOX) {
      var $box = $('#' + CHIP_BOX[k]);
      if (!$box.length) continue;
      var $label = chipLabel(k);
      var label = $label.length ? $.trim($label.text()) : '';
      var $group = $('<optgroup>').attr('label', label || k);
      $box.find('option').each(function () {
        var value = String($(this).val() || '');
        if (!value) return;
        var tip = $(this).attr('title');
        var $opt = $('<option>').attr('value', k + ':' + value).text($(this).text());
        if (tip) $opt.attr('title', tip);
        $group.append($opt);
      });
      $picker.append($group);
    }
    $picker.on('change', function () {
      var pick = String($(this).val() || '').split(':');
      var $box = $('#' + CHIP_BOX[pick[0]]);
      if ($box.length && pick[1]) {
        $box.val(pick[1]).trigger('change');
      } else {
        for (var k in CHIP_BOX) $('#' + CHIP_BOX[k]).val('');
        syncChipHint();
      }
      setConvertEnabled(images.length > 0);
    });
    syncChipPicker();
  }
  var chipPickBase = window.onChipPick;
  window.onChipPick = function (which) {
    chipPickBase(which);
    syncChipPicker();
  };
  var MAX_PARALLEL = 4;
  var RESULT_BADGE = 'c-result-badge';
  var batchState = {
    status: 'idle',
    total: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    nextIdx: 0,
    running: 0,
    formatCaps: null,
    formatOk: true,
    jobs: [],
    pollTimers: {},
    outcomes: [],
  };
  var formatValidationId = 0;
  function updateTotalProgress() {
    var $fill = $('#total-progress-fill, .dz-progress-fill');
    if (!$fill.length) return;
    if (batchState.status === 'idle' || batchState.total === 0) {
      $fill.css('width', '0%');
      return;
    }
    var done = batchState.completed + batchState.failed + batchState.cancelled;
    var pct = Math.round(done / batchState.total * 100);
    $fill.css('width', pct + '%');
  }
  function fileItemFor(path) {
    var $rows = $('.file-item');
    for (var i = 0; i < $rows.length; i++) {
      if ($rows.eq(i).attr('data-path') === path) return $rows.eq(i);
    }
    return $();
  }
  function jobFor(path) {
    for (var i = 0; i < batchState.jobs.length; i++) {
      if (batchState.jobs[i].path === path) return batchState.jobs[i];
    }
    return null;
  }
  function updateFileItemProgress(path, pct, statusText, isIndeterminate, state) {
    var $item = fileItemFor(path);
    if (!$item.length) return;
    $item.find('.file-item-progress-fill').css('width', Math.min(pct, 100) + '%');
    setText($item.find('.file-item-status'), statusText || '');
    $item.attr('class', 'file-item');
    if (state) $item.addClass(state);
    if (isIndeterminate && state === 'converting') $item.addClass('indeterminate');
    var $label = $item.find('.file-item-bar-label');
    if ($label.length) {
      var job = jobFor(path);
      setText($label, (state === 'converting' && job && job.t0)
        ? 'Converting to ' + ((window.state && window.state.format) || 'image') + ' ' + fmtSecs(Date.now() - job.t0) + '…' : '');
    }
  }
  function updateConvertingLabel(path) {
    var $item = fileItemFor(path);
    if (!$item.length) return;
    var job = jobFor(path);
    if (!job || job.settled || !job.t0) return;
    $item.addClass('converting');
    setText($item.find('.file-item-bar-label'),
      'Converting to ' + ((window.state && window.state.format) || 'image') + ' ' + fmtSecs(Date.now() - job.t0) + '…');
  }
  function startConvertingLabel(job) {
    stopConvertingLabel(job);
    if (!job || job.settled || job.paused) return;
    job.labelTimer = setInterval(function () { updateConvertingLabel(job.path); }, 200);
  }
  function stopConvertingLabel(job) {
    if (job && job.labelTimer) { clearInterval(job.labelTimer); job.labelTimer = null; }
  }
  function paintRowButtons($row, job) {
    if (!$row || !$row.length) return;
    job = job || {};
    var caps = batchState.formatCaps;
    var $pause = $row.find('.btn-pause-file');
    if ($pause.length) {
      var canPause = (!caps || caps.supportsPauseResume !== false) && !!job.jobId && !job.settled;
      $pause.prop('disabled', !canPause);
      setText($pause, job.paused ? '\u25B6' : '\u23F8');
      $pause.attr('title', job.paused ? 'Resume this file' : 'Pause this file');
      $pause.toggleClass('is-paused', !!job.paused);
    }
    var $stop = $row.find('.btn-stop-file');
    if ($stop.length) $stop.prop('disabled', !!job.settled);
  }
  function refreshRowButtons() {
    var $rows = $('.file-item');
    for (var i = 0; i < $rows.length; i++) {
      var $row = $rows.eq(i);
      paintRowButtons($row, jobFor($row.attr('data-path')));
    }
  }
  function setJobPaused(job, paused) {
    if (!job) return;
    job.paused = !!paused;
    paintRowButtons(fileItemFor(job.path), job);
    if (job.settled) return;
    if (job.paused) {
      stopConvertingLabel(job);
      updateFileItemProgress(job.path, job.progress || 0, 'paused', undefined, 'converting');
    } else {
      startConvertingLabel(job);
      updateFileItemProgress(job.path, job.progress || 0, '', undefined, 'converting');
    }
  }
  function queryFormatCaps(format) {
    var chip = chipGeneration();
    return API_EAB_getFormatCaps({ format: format, chip: chip }).then(function(resp) {
      if (resp.ok && resp.caps) {
        batchState.formatCaps = resp.caps;
        return resp.caps;
      }
      return { supportsProgress: true, supportsPauseResume: true, supportsCancel: true };
    });
  }
  var NOTICE_MS = 5000;
  var noticeTimer = null;
  function hideFormatNotice() {
    if (noticeTimer) { clearTimeout(noticeTimer); noticeTimer = null; }
    var $el = $('#format-notice');
    if ($el.length) $el.removeClass('visible');
  }
  function setFormatNotice(text) {
    var $el = $('#format-notice');
    if (!$el.length) {
      if (!text) return;
      $el = $('<div id="format-notice" class="format-notice" role="alert"></div>');
      $el.append('<span class="format-notice-text"></span>');
      $el.append($('<button type="button" class="format-notice-close" aria-label="Dismiss the warning">')
        .text('\u00d7').on('click', hideFormatNotice));
      $el.appendTo('body');
    }
    if (noticeTimer) { clearTimeout(noticeTimer); noticeTimer = null; }
    if (!text) { $el.removeClass('visible'); return; }
    $el.find('.format-notice-text').text(text);
    $el.addClass('visible');
    noticeTimer = setTimeout(hideFormatNotice, NOTICE_MS);
  }
  function stopAfterPreview() {
    _previewGen++;
    var $pa = $('#preview-after-content');
    if (!$pa.length) return;
    $pa.find('.preview-loading-overlay').remove();
    $pa.html('<div class="preview-placeholder">Format not supported for this chip</div>');
    $pa.removeClass('has-image');
  }
  function validateFormat() {
    var validationId = ++formatValidationId;
    var wasOk = batchState.formatOk === true;
    var $fmtSel = $('#format-select');
    var fmt = $fmtSel.length ? String($fmtSel.val() || '') : '';
    var picked = chipPicked();
    var row = picked ? chipRow(picked.value) : null;
    if (!fmt || !row || !chipData[row[0]] || (chipFormatLists[row[0]] || []).indexOf(fmt) < 0) {
      batchState.formatOk = false;
      setFormatNotice('');
      setConvertEnabled(images.length > 0);
      return;
    }
    batchState.formatOk = null;
    setConvertEnabled(images.length > 0);
    queryFormatCaps(fmt).then(function (caps) {
      if (validationId !== formatValidationId) return;
      var ok = !caps || caps.supported !== false;
      batchState.formatOk = ok;
      setFormatNotice(ok ? '' : fmt + ' is not supported for ' + row[0] + ' — pick another format.');
      setConvertEnabled(images.length > 0);
      if (!ok) stopAfterPreview();
      else if (!wasOk && _previewIdx >= 0) updateAfterConvertPreview(_previewIdx);
    });
  }
  function setConvertEnabled(on) {
    var $btn = $('#btn-convert');
    if (!$btn.length) return;
    var picked = chipPicked();
    var row = picked ? chipRow(picked.value) : null;
    var format = String($('#format-select').val() || '');
    var outputDir = $.trim(String($('#output-dir').val() || ''));
    var chipAvailable = !!(row && chipData[row[0]] &&
      (chipFormatLists[row[0]] || []).indexOf(format) >= 0);
    setActionDisabled($btn, !on || !images.length || !chipAvailable || !outputDir ||
      batchState.formatOk !== true);
  }
  function setActionDisabled($button, disabled) {
    $button.prop('disabled', disabled)
      .closest('.btn-progress-wrap')
      .toggleClass('eab-action-disabled', disabled);
  }
  function missingActionOption(button) {
    switch (button.id) {
      case 'btn-convert':
        if (!chipPicked()) return '#chip-one';
        if (!String($('#format-select').val() || '') ||
            batchState.formatOk !== true) return '#format-select';
        if (!images.length) return '#input-card';
        if (!$.trim(String($('#output-dir').val() || ''))) return '#output-dir';
        break;
      case 'btn-validate':
        if (!tabQueues.validator.length) return '#val-list';
        break;
      case 'btn-jpegopt-run':
        if (!tabQueues.jpegopt.length) return '#jpegopt-list';
        var quality = Number($('#jpegopt-quality').val());
        if (!Number.isInteger(quality) || quality < 1 || quality > 95) return '#jpegopt-quality';
        break;
      case 'btn-raw-run':
        if (!tabQueues.rawviewer.length) return '#raw-list';
        if (!String($('#raw-format').val() || '')) return '#raw-format';
        if (!(Number.isInteger(Number($('#raw-width').val())) && Number($('#raw-width').val()) > 0)) return '#raw-width';
        if (!(Number.isInteger(Number($('#raw-height').val())) && Number($('#raw-height').val()) > 0)) return '#raw-height';
        break;
    }
    return null;
  }
  function blinkMissingOption(selector) {
    var target = selector ? $(selector).get(0) : null;
    if (!target) return;
    clearTimeout(target.eabOptionBlinkTimer);
    target.classList.remove('eab-option-blink');
    void target.offsetWidth;
    target.classList.add('eab-option-blink');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.eabOptionBlinkTimer = setTimeout(function () {
      target.classList.remove('eab-option-blink');
    }, 3000);
  }
  $(document).on('click', '.btn-progress-wrap.eab-action-disabled', function (event) {
    var button = $(this).find('button.btn-primary:disabled').get(0);
    if (!button) return;
    var option = missingActionOption(button);
    if (!option) return;
    event.preventDefault();
    event.stopPropagation();
    blinkMissingOption(option);
  });
  window.demoConvert = function () {
    if (images.length === 0) return;
    if (batchState.formatOk === false) {
      showError('The selected format is not supported for this chip.');
      return;
    }
    if (!state.outputDir) {
      showError('Please select an output directory first.');
      return;
    }
    log('Converting ' + images.length + ' file(s) to ' + state.format +
        ' (chip ' + state.chip + ', output ' + state.outputDir + ')');
    batchState.status = 'running';
    batchState.total = images.length;
    batchState.completed = 0;
    batchState.failed = 0;
    batchState.cancelled = 0;
    batchState.nextIdx = 0;
    batchState.running = 0;
    batchState.jobs = images.map(function(im) {
      return { path: im.path, name: im.name, jobId: null, status: 'pending', progress: 0, result: null, settled: false, inFlight: false, t0: 0 };
    });
    batchState.pollTimers = {};
    batchState.outcomes = [];
    renderBatchResult();
    queryFormatCaps(state.format).then(function(caps) {
      setConvertEnabled(false);
      $('#running-controls').removeClass('hidden');
      $('#btn-pause').prop('disabled', !caps.supportsPauseResume);
      updateTotalProgress();
      pumpQueue();
    });
  };
  function maxParallel() {
    return /^ASTC_/i.test(state.format || '') ? 2 : (MAX_PARALLEL || 4);
  }
  function pumpQueue() {
    if (batchState.status !== 'running') return;
    while (batchState.running < maxParallel() && batchState.nextIdx < batchState.total) {
      startOne(batchState.nextIdx);
      batchState.nextIdx++;
    }
    if (batchState.running === 0 && batchState.nextIdx >= batchState.total) finishBatch();
  }
  function releaseSlot() {
    if (batchState.running > 0) batchState.running--;
    pumpQueue();
  }
  function startOne(idx) {
    var job = batchState.jobs[idx];
    if (!job) return;
    job.inFlight = true;
    job.t0 = Date.now();
    job.paused = false;
    batchState.running++;
    job.status = 'converting';
    updateFileItemProgress(job.path, 0, '', !batchState.formatCaps || !batchState.formatCaps.supportsProgress, 'converting');
    paintRowButtons(fileItemFor(job.path), job);
    startConvertingLabel(job);
    var payload = {
      inputFile: job.path,
      outputDir: state.outputDir,
      outputName: state.outputName || '',
      chip: chipGeneration(),
      format: state.format,
      ditherAlgo: formatHasDither(state.format) ? state.ditherAlgo : 'NONE',
      astcEffort: state.astcEffort,
      genSrc: !!state.genSrc,
      genSrcPlatform: state.genSrcPlatform,
      noJson: !state.genJson && !state.genSrc,
    };
    API_EAB_convertFile(payload).then(function(resp) {
      if (job.settled) return;
      if (resp.ok && resp.jobId) {
        job.jobId = resp.jobId;
        paintRowButtons(fileItemFor(job.path), job);
        startPolling(job);
      } else {
        job.progress = 0;
        settle(job, 'failed');
      }
    });
  }
  function startPolling(job) {
    var interval = setInterval(function() {
      if (job.settled) {
        clearInterval(interval);
        return;
      }
      API_EAB_pollJob({ jobId: job.jobId }).then(function(resp) {
        if (job.settled) return;
        if (!resp.ok || !resp.progress) {
          return;
        }
        var progress = resp.progress;
        job.progress = progress.progress || 0;
        var caps = batchState.formatCaps || {};
        if (progress.status === 2) {
          settle(job, resultFailed(progress.result) ? 'failed' : 'done', progress.result);
        } else if (progress.status === 3) {
          settle(job, 'failed', progress.result);
        } else if (progress.status === 4) {
          settle(job, 'cancelled');
        } else if (progress.status === 1) {
          if (!job.paused) setJobPaused(job, true);
        } else {
          if (job.paused) setJobPaused(job, false);
          if (caps.supportsProgress) {
            updateFileItemProgress(job.path, job.progress, '', undefined, 'converting');
          }
          updateTotalProgress();
        }
      });
    }, 200);
    batchState.pollTimers[job.jobId] = interval;
  }
  function safeResult(result) {
    if (!result) return null;
    if (typeof result !== 'string') return result;
    try { return JSON.parse(result); } catch (e) { return null; }
  }
  function resultFailed(result) {
    var r = safeResult(result);
    if (!r) return false;
    if (r.success === false) return true;
    return typeof r.exit_code === 'number' && r.exit_code !== 0;
  }
  function setText($el, text) {
    if (!$el || !$el.length) return;
    var $node = $el.contents().first();
    if ($node.length && $node[0].nodeType === 3) {
      if ($node[0].nodeValue !== text) $node[0].nodeValue = text;
    } else {
      $el.text(text);
    }
  }
  function verdictFor(result) {
    var r = safeResult(result);
    if (r && typeof r.exit_code === 'number' && r.exit_code !== 0) return 'failed, error code: ' + r.exit_code;
    var why = failureReason(result);
    return why ? 'failed: ' + why : 'failed';
  }
  function fmtSecs(ms) {
    var s = (ms || 0) / 1000;
    return s < 10 ? s.toFixed(1) + 's' : Math.round(s) + 's';
  }
  function jobName(job) {
    return String(job.path).split(/[\\/]/).pop() || job.name || '';
  }
  function failureReason(result) {
    var r = safeResult(result);
    if (!r) return '';
    if (r.error) return String(r.error);
    return typeof r.exit_code === 'number' ? ('exit code ' + r.exit_code) : '';
  }
  function pushBatchOutcome(status, text) {
    batchState.outcomes.push({ status: status, text: text });
  }
  function renderBatchResult() {
    var lines = batchState.outcomes || [];
    var $card = $('#result-panel');
    if ($card.length) $card.toggleClass('hidden', lines.length === 0);
    if (!lines.length) { setResultBadge(RESULT_BADGE, 'hidden'); return; }
    var summary = batchState.completed + ' of ' + batchState.total + ' converted';
    if (batchState.failed) summary += ', ' + batchState.failed + ' failed';
    if (batchState.cancelled) summary += ', ' + batchState.cancelled + ' cancelled';
    setResultBadge(RESULT_BADGE, batchState.failed ? 'fail' : 'success', summary,
      lines.map(function (o) { return { label: o.text, value: '' }; }));
  }
  function settle(job, status, result) {
    if (job.settled) return;
    job.settled = true;
    job.stopping = false;
    stopConvertingLabel(job);
    if (job.jobId && batchState.pollTimers[job.jobId]) {
      clearInterval(batchState.pollTimers[job.jobId]);
      delete batchState.pollTimers[job.jobId];
    }
    job.status = status;
    if (result != null) job.result = result;
    if (status === 'done') {
      batchState.completed++;
      updateFileItemProgress(job.path, 100, 'success in ' + fmtSecs(Date.now() - job.t0), undefined, 'done');
      var doneLine = '\u2713 ' + jobName(job) + ' in ' + fmtSecs(Date.now() - job.t0);
      log(doneLine);
      pushBatchOutcome('done', doneLine);
    } else if (status === 'failed') {
      batchState.failed++;
      var why = failureReason(result);
      updateFileItemProgress(job.path, 100, verdictFor(result), undefined, 'failed');
      var failLine = '\u2717 ' + jobName(job) + ' in ' + fmtSecs(Date.now() - job.t0) + (why ? ': ' + why : ' (no output produced)');
      log(failLine);
      pushBatchOutcome('failed', failLine);
    } else {
      batchState.cancelled++;
      updateFileItemProgress(job.path, 0, 'cancelled', undefined, 'cancelled');
    }
    paintRowButtons(fileItemFor(job.path), job);
    updateTotalProgress();
    renderBatchResult();
    if (job.inFlight) {
      job.inFlight = false;
      releaseSlot();
    }
  }
  function finishBatch() {
    for (var jobId in batchState.pollTimers) {
      clearInterval(batchState.pollTimers[jobId]);
    }
    batchState.pollTimers = {};
    setConvertEnabled(images.length > 0);
    $('#running-controls').addClass('hidden');
    $('#paused-controls').addClass('hidden');
    batchState.status = 'idle';
    batchState.nextIdx = 0;
    batchState.running = 0;
    updateTotalProgress();
    renderBatchResult();
  }
  window.demoPause = function() {
    batchState.status = 'paused';
    $('#running-controls').addClass('hidden');
    $('#paused-controls').removeClass('hidden');
    for (var i = 0; i < batchState.jobs.length; i++) {
      var job = batchState.jobs[i];
      if (job.inFlight && job.jobId) {
        API_EAB_pauseJob({ jobId: job.jobId });
        setJobPaused(job, true);
      }
    }
  };
  window.demoResume = function() {
    batchState.status = 'running';
    $('#paused-controls').addClass('hidden');
    $('#running-controls').removeClass('hidden');
    for (var i = 0; i < batchState.jobs.length; i++) {
      var job = batchState.jobs[i];
      if (job.inFlight && job.jobId) {
        API_EAB_resumeJob({ jobId: job.jobId });
        setJobPaused(job, false);
      }
    }
    pumpQueue();
  };
  window.demoCancel = function() {
    batchState.status = 'cancelled';
    for (var i = 0; i < batchState.jobs.length; i++) {
      var job = batchState.jobs[i];
      if (job.jobId) API_EAB_cancelJob({ jobId: job.jobId });
      settle(job, 'cancelled');
    }
    finishBatch();
  };
  function cancelFile(path) {
    var job = jobFor(path);
    if (!job || job.settled) return;
    if (!job.jobId) { settle(job, 'cancelled'); return; }
    job.stopping = true;
    stopConvertingLabel(job);
    updateFileItemProgress(job.path, job.progress || 0, 'stopping…', undefined, 'converting');
    API_EAB_cancelJob({ jobId: job.jobId });
  }
  window.eabStopFile = function (btn) {
    var $row = btn ? $(btn).closest('.file-item') : $();
    if ($row.length) cancelFile($row.attr('data-path'));
  };
  window.eabPauseFile = function (btn) {
    var $row = btn ? $(btn).closest('.file-item') : $();
    var job = $row.length ? jobFor($row.attr('data-path')) : null;
    if (!job || !job.jobId || job.settled) return;
    var pausing = !job.paused;
    if (pausing && batchState.formatCaps && batchState.formatCaps.supportsPauseResume === false) return;
      (pausing ? API_EAB_pauseJob : API_EAB_resumeJob)({ jobId: job.jobId });
    setJobPaused(job, pausing);
  };
  var _origRenderFileList = renderFileList;
  renderFileList = function() {
    _origRenderFileList();
    $('.file-item').each(function() {
      var $item = $(this);
      if ($item.find('.file-item-progress').length) return;
      var $progress = $('<div class="file-item-progress">');
      $progress.html('<div class="file-item-progress-fill"></div><span class="file-item-bar-label"></span>');
      $item.prepend($progress);
      $('<span class="file-item-controls">').html(
        '<button class="btn-icon btn-stop-file" type="button" title="Stop this file" aria-label="Stop" onclick="eabStopFile(this)">\u25A0</button>' +
        '<button class="btn-icon btn-pause-file" type="button" title="Pause this file" aria-label="Pause" onclick="eabPauseFile(this)">\u23F8</button>')
        .appendTo($item);
      var $name = $item.find('.file-item-name').eq(0);
      if (!$name.length) $name = $item.find('span').not('.file-item-bar-label').eq(0);
      if ($name.length) $('<span class="file-item-status">').insertAfter($name);
    });
    refreshRowButtons();
  };
  window.cancelFile = cancelFile;
  window.state = {
    format: 'RGB565',
    ditherAlgo: 'FLOYD_STEINBERG',
    astcEffort: 'fastest',
    genSrc: false,
    genSrcPlatform: 'FT4222',
    genJson: false,
    outputDir: '.',
    outputName: ''
  };
  $(function () {
    parseFormatData(EVE_IMAGE_FORMAT_JSON);
    var initialChip = populateChips();
    if (initialChip) {
      onChipChange(initialChip);
    }
    validateFormat();
    buildChipPicker();
    var $fmt = $('#format-select');
    var $dith = $('#dither-select');
    var $astc = $('#astc-effort');
    $fmt.on('change', function () {
      state.format = $(this).val();
      window.onFormatChange($(this).val());
    });
    $dith.on('change', function () { state.ditherAlgo = $(this).val(); });
    $astc.on('change', function () { state.astcEffort = $(this).val(); });
    $('#gen-src').on('change', function () { state.genSrc = $(this).prop('checked'); });
    $('#gen-src-platform').on('change', function () { state.genSrcPlatform = $(this).val(); });
    $('#gen-json').on('change', function () { state.genJson = $(this).prop('checked'); });
    $('#output-dir').on('input change', function () {
      state.outputDir = $(this).val();
      setConvertEnabled(images.length > 0);
    });
    $('#output-name').on('input', function () { state.outputName = $(this).val(); });
    var previewUpdater = debounce(function() {
      updateAfterConvertPreview(_previewIdx);
    }, 300);
    $fmt.on('change', previewUpdater);
    $dith.on('change', previewUpdater);
    $astc.on('change', previewUpdater);
    API_EAB_init({});
    $('.tab-btn').on('click', function() {
      var tab = $(this).attr('data-tab');
      $('.tab-btn').removeClass('active');
      $(this).addClass('active');
      $('.tab-content').removeClass('active');
      $('#tab-' + tab).addClass('active');
    });
  });
  var _origShowPreview = showPreview;
  showPreview = function(img) {
    _origShowPreview(img);
    if (!img) return;
    var idx = -1;
    for (var i = 0; i < images.length; i++) {
      if (images[i].path === img.path) { idx = i; break; }
    }
    if (!img.data) {
      if (!img._dataTried) queueImageData(img.path, function () { showPreview(img); });
      return;
    }
    updateAfterConvertPreview(idx);
  };
    function getFormatOptions(chip, formatName) {
      var chipEntry = chipData[chip];
      if (!chipEntry) return null;
      var formats = chipEntry.formats || [];
      for (var i = 0; i < formats.length; i++) {
        var f = formats[i];
        var baseName = f.name;
        if (baseName === 'ASTC') {
          if (formatName.startsWith('ASTC_')) return f.options || {};
        } else if (baseName === formatName) {
          return f.options || {};
        }
      }
      return null;
    }
    window.eabAlphaSliderInput = function (el) {
      var v = $(el).val();
      $('#alpha-value-display').text(v + '%');
      state.alphaSlider = parseInt(v);
    };
    window.eabZorderToggle = function (el) {
      $('#zorder-value').prop('disabled', !$(el).prop('checked'));
    };
    function renderDynamicOptions(options) {
      var $container = $('#dynamic-slot');
      if (!$container.length) return;
      if (!options || Object.keys(options).length === 0) { $container.html(''); return; }
      var html = '';
      function addGroup(label, content) {
        return '<div class="dynamic-option col-12 col-sm-12 col-md-12"><label>' + label + '</label>' + content + '</div>';
      }
      if (options.extra_params) {
        var def = options.extra_params.default || '';
              }
      if (options.multi_cell_height) {
        var min = options.multi_cell_height.min || 0;
        var max = options.multi_cell_height.max || 9999;
        var def = options.multi_cell_height.default || 0;
        html += addGroup('Multi‑Cell Height', '<input type="number" id="multi-cell-height" min="' + min + '" max="' + max + '" value="' + def + '" step="1" class="form-control">');
      }
      if (options.alpha_slider) {
        var minA = options.alpha_slider.min || 0;
        var maxA = options.alpha_slider.max || 100;
        var defA = options.alpha_slider.default || 100;
        html += '<div class="dynamic-option col-12 col-sm-12 col-md-12">';
        html += '  <label>Alpha Slider <span id="alpha-value-display" style="font-weight:600;">' + defA + '%</span></label>';
        html += '  <input type="range" id="alpha-slider" min="' + minA + '" max="' + maxA + '" value="' + defA + '" oninput="eabAlphaSliderInput(this)">';
        html += '</div>';
      }
      if (options.zorder) {
        var enabled = options.zorder.enabled ? options.zorder.enabled.default : false;
        var val = options.zorder.value ? options.zorder.value.default : 170;
        var minVal = options.zorder.value ? options.zorder.value.min : 0;
        var maxVal = options.zorder.value ? options.zorder.value.max : 255;
        var checkedAttr = enabled ? 'checked' : '';
        html += '<div class="dynamic-option col-12 col-sm-12 col-md-12">';
        html += '  <label>Z‑Order</label>';
        html += '  <div class="form-check">';
        html += '    <input type="checkbox" id="zorder-enabled" class="form-check-input" ' + checkedAttr + ' onchange="eabZorderToggle(this)">';
        html += '    <label class="form-check-label" for="zorder-enabled">Enable Z‑Order</label>';
        html += '  </div>';
        html += '  <input type="number" id="zorder-value" min="' + minVal + '" max="' + maxVal + '" value="' + val + '" step="1" ' + (enabled ? '' : 'disabled') + ' class="form-control">';
        html += '</div>';
      }
      $container.html(html);
      var $extraParams = $('#extra-params');
      if ($extraParams.length) {
        $extraParams.on('input', function() { state.extraParams = $(this).val(); });
        state.extraParams = $extraParams.val();
      }
      var $multiCell = $('#multi-cell-height');
      if ($multiCell.length) {
        $multiCell.on('input', function() { state.multiCellHeight = parseInt($(this).val()) || 0; });
        state.multiCellHeight = parseInt($multiCell.val()) || 0;
      }
      var $zorderEnabled = $('#zorder-enabled');
      if ($zorderEnabled.length) {
        $zorderEnabled.on('change', function() {
          $('#zorder-value').prop('disabled', !$(this).prop('checked'));
          state.zorderEnabled = $(this).prop('checked');
        });
        state.zorderEnabled = $zorderEnabled.prop('checked');
      }
      var $zorderVal = $('#zorder-value');
      if ($zorderVal.length) {
        $zorderVal.on('input', function() { state.zorderValue = parseInt($(this).val()) || 0; });
        state.zorderValue = parseInt($zorderVal.val()) || 0;
      }
      var $alphaSlider = $('#alpha-slider');
      if ($alphaSlider.length) {
        $alphaSlider.on('input', function() { state.alphaSlider = parseInt($(this).val()); });
        state.alphaSlider = parseInt($alphaSlider.val()) || 100;
      }
    }
    function updateDynamicOptions(chipMeta) {
      var chip = chipMeta || state.chipMeta || '';
      var format = $('#format-select').val();
      if (!chip || !format) {
        $('#dynamic-slot').html('');
        return;
      }
      var options = getFormatOptions(chip, format);
      renderDynamicOptions(options);
    }
    var _origOnChipChange = onChipChange;
    onChipChange = function(chip) {
      state.chipMeta = chip;
      state.chip = chip;
      _origOnChipChange(chip);
      updateDynamicOptions(chip);
      validateFormat();
    };
    var _origOnFormatChange = window.onFormatChange;
    window.onFormatChange = function(format) {
      _origOnFormatChange(format);
      updateDynamicOptions();
      validateFormat();
    };
    window.state = window.state || {};
    window.state.extraParams = '';
    window.state.multiCellHeight = 0;
    window.state.zorderEnabled = false;
    window.state.zorderValue = 170;
    window.state.alphaSlider = 100;
    window.state.jpegGray = false;
  var INPUT_FILTERS = {
    'val-input': IMAGES_FILTERS,
    'jpegopt-input': JPEG_FILTERS
  };
  window.pickFileFor = function(inputId) {
    if (!isEmbedded()) {
      var typed = prompt('Enter a file path:');
      if (!typed) return;
      var meta = tabMetaForField(inputId);
      if (meta) addTabFiles(meta, [typed]);
      else $('#' + inputId).val(typed);
      return;
    }
    API_EAB_pickFiles({
      filters: INPUT_FILTERS[inputId] || IMAGES_FILTERS,
      multiple: true,
      readBase64: false,
    }).then(function(resp) {
      if (!resp || !resp.ok) {
        showError('File picker failed: ' + ((resp && resp.error) || 'unknown error'));
        return;
      }
      var paths = resp.paths || [];
      var path = paths.length ? paths[0] : (resp.path || '');
      if (!path) return;
      var $field = $('#' + inputId);
      if (!$field.length) return;
      $field.val(path).trigger('input');
      var meta = tabMetaForField(inputId);
      if (meta) addTabFiles(meta, paths);
    });
  };
  function detectPalettedCompanion(rawPath) {
    var isIndex = IDX_RE.test(rawPath);
    var isLut   = LUT_RE.test(rawPath);
    if (!isIndex && !isLut) return;
    var $fmtSelect = $('#raw-format');
    for (var i = 0; i < PALETTED_FORMATS.length; i++) {
      var $pal = $fmtSelect.find('option[value="' + PALETTED_FORMATS[i] + '"]').eq(0);
      if ($pal.length) $fmtSelect.prop('selectedIndex', $pal.index());
    }
    var dimMatch = rawPath.match(/[_.](\d+)x(\d+)[_.]/i);
    if (dimMatch) {
      if (dimMatch[1]) $('#raw-width').val(dimMatch[1]);
      if (dimMatch[2]) $('#raw-height').val(dimMatch[2]);
    }
  }
  window.pickRawFileFor = function(inputId) {
    API_EAB_pickFiles({ filters: RAW_FILTERS, multiple: true, readBase64: false }).then(function(resp) {
      var paths = (resp && resp.paths) || [];
      if (!paths.length) return;
      $('#' + inputId).val(paths[0]).trigger('input');
      var meta = tabMetaForField(inputId);
      if (meta) addTabFiles(meta, paths);
    });
  };
  window.pickFolderFor = function(inputId) {
    API_EAB_pickOutput({}).then(function(resp) {
      if (resp.ok && resp.folder) {
        $('#' + inputId).val(resp.folder);
      }
    });
  };
  function setResultBadge(badgeId, state, text, detailLines) {
    var $badge = $('#' + badgeId);
    if (!$badge.length) return;
    $badge.attr('class', 'v-result-badge');
    if (state === 'hidden') { $badge.addClass('v-hidden'); return; }
    $badge.removeClass('v-hidden');
    $badge.addClass('v-' + state);
    var $txt = $badge.find('.v-result-text');
    if ($txt.length) $txt.text(text || '');
    var $err = $badge.find('.v-result-error');
    if ($err.length) {
      $err.html('');
      if (!detailLines || detailLines.length === 0) {
        $err.css('display', 'none');
      } else {
        var errorLines = detailLines.filter(function(l) {
          if (typeof l === 'string') return l.toLowerCase().indexOf('error') >= 0 || l.toLowerCase().indexOf('fail') >= 0;
          return (l.cls || '').indexOf('err') >= 0;
        });
        if (errorLines.length === 0) {
          $err.css('display', 'none');
        } else {
          $err.css('display', 'block');
          errorLines.forEach(function(line) {
            $('<div class="v-err-line">')
              .text(typeof line === 'string' ? line : (line.label || '') + ' ' + (line.value || ''))
              .appendTo($err);
          });
        }
      }
    }
    var $det = $badge.find('.v-result-detail');
    var $toggle = $badge.find('.v-detail-toggle');
    if ($det.length && $toggle.length) {
      $det.html('');
      if (detailLines && detailLines.length > 0) {
        $toggle.css('display', 'flex');
        $det.css('display', 'none');
        $toggle.removeClass('expanded');
        detailLines.forEach(function(line) {
          var $row = $('<div class="v-result-line">');
          if (typeof line === 'string') {
            $row.html('<span style="color:var(--text-dim)">' + line + '</span>');
          } else {
            $row.append($('<span class="v-label">').text(line.label || ''));
            $row.append($('<span class="v-value' + (line.cls ? ' ' + line.cls : '') + '">').text(line.value || ''));
          }
          $row.appendTo($det);
        });
      } else {
        $toggle.css('display', 'none');
        $det.css('display', 'none');
      }
    }
  }
  function setPreviewState(frameId, state, imagePath, loadingLabel) {
    var $frame = $('#' + frameId);
    if (!$frame.length) return;
    $frame.attr('class', 'preview-frame v-preview-frame');
    if (state) $frame.addClass('v-' + state);
    $frame.find('.v-preview-loading').remove();
    if (state === 'loading' || state === 'validating' || state === 'optimizing' || state === 'converting') {
      var label = loadingLabel || (state === 'loading' ? 'Loading image...' : (state === 'validating' ? 'Validating...' : (state === 'optimizing' ? 'Optimizing...' : 'Converting...')));
      $('<div class="v-preview-loading">')
        .append('<div class="v-spinner"></div>')
        .append($('<div class="v-spinner-label">').text(label))
        .appendTo($frame);
    }
    if (imagePath) {
      $frame.find('.v-preview-img, .preview-placeholder').remove();
      loadPreviewImage(imagePath, $frame);
      $frame.addClass('has-image');
    } else {
      $frame.find('.v-preview-img').remove();
      if (!$frame.find('.preview-placeholder').length) {
        $('<div class="preview-placeholder">').text('Select a file to preview').appendTo($frame);
      }
      $frame.removeClass('has-image');
    }
  }
  function imageMime(filePath) {
    var ext = String(filePath).split('.').pop().toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'bmp') return 'image/bmp';
    if (ext === 'webp') return 'image/webp';
    return 'image/png';
  }
  function readPreviewData(filePath) {
    return Promise.resolve().then(function () {
      return readFileData(filePath);
    }).catch(function () {
      return { ok: false };
    }).then(function (resp) {
      if (resp && resp.ok && resp.data) return resp;
      if (typeof API_EAB_readConvertedFile !== 'function') return resp;
      return API_EAB_readConvertedFile({ path: filePath, filePath: filePath }).then(function (alt) {
        if (!alt || !alt.ok || !alt.data) return resp;
        var data = String(alt.data);
        if (!/^data:/.test(data)) data = 'data:' + imageMime(filePath) + ';base64,' + data;
        return { ok: true, data: data };
      }, function () { return resp; });
    });
  }
  function loadPreviewImage(filePath, $frame) {
    readPreviewData(filePath).then(function(resp) {
      $frame.find('.v-preview-loading, .preview-placeholder, .v-preview-img').remove();
      if (resp.ok && resp.data) {
        $('<img class="preview-img v-preview-img" alt="">')
          .attr('src', resp.data)
          .attr('alt', filePath.split(/[/\\]/).pop())
          .appendTo($frame);
        $frame.addClass('has-image');
      } else {
        $('<div class="preview-placeholder">').text('⚠ Failed to load preview').appendTo($frame);
      }
    }).catch(function() {
      $frame.find('.v-preview-loading').remove();
      $('<div class="preview-placeholder">').text('⚠ Failed to load preview').appendTo($frame);
    });
  }
  function parseResultLines(resultText) {
    if (!resultText) return [];
    var lines = resultText.split('\n').filter(Boolean);
    return lines.map(function(l) {
      var idx = l.indexOf(':');
      if (idx > 0 && idx < 40) {
        return {
          label: l.substring(0, idx + 1),
          value: l.substring(idx + 1).trim(),
          cls: l.toLowerCase().indexOf('pass') >= 0 ? 'ok' :
               (l.toLowerCase().indexOf('fail') >= 0 || l.toLowerCase().indexOf('error') >= 0) ? 'err' : ''
        };
      }
      return l;
    });
  }
  function onValFileInput() {
    var path = $('#val-input').val();
    if (path) {
      setPreviewState('v-preview-frame', 'loading', path, 'Loading image...');
      setResultBadge('v-result-badge', 'hidden');
    } else {
      setPreviewState('v-preview-frame', null, null);
      setResultBadge('v-result-badge', 'hidden');
    }
  }
  function onJpegOptFileInput() {
    var path = $('#jpegopt-input').val();
    if (path) {
      setPreviewState('j-preview-frame', 'loading', path, 'Loading image...');
      setResultBadge('j-result-badge', 'hidden');
    } else {
      setPreviewState('j-preview-frame', null, null);
      setResultBadge('j-result-badge', 'hidden');
    }
  }
  var rawPreviewGeneration = 0;
  var RAW_BT82X_FORMATS = ['ARGB6', 'ARGB8', 'RGB6', 'RGB8', 'LA1', 'LA2', 'LA4', 'LA8', 'PALETTEDARGB8', 'YCBCR'];
  function rawViewerCommand() {
    var fmt = String($('#raw-format').val() || '').toUpperCase();
    if (/^ASTC_/.test(fmt) || RAW_BT82X_FORMATS.indexOf(fmt) >= 0) return 'raw_viewer';
    return 'ft81x raw_viewer';
  }
  function onRawFileInput() {
    var path = $('#raw-input').val();
    detectPalettedCompanion(path);
    setResultBadge('r-result-badge', 'hidden');
    var generation = ++rawPreviewGeneration;
    if (!path) {
      setPreviewState('r-preview-frame', null, null);
      return;
    }
    var width = parseInt($('#raw-width').val(), 10) || 0;
    var height = parseInt($('#raw-height').val(), 10) || 0;
    if (!width || !height || !$('#raw-format').val()) {
      setPreviewState('r-preview-frame', null, null);
      return;
    }

    setPreviewState('r-preview-frame', 'loading', null, 'Generating preview...');
    var outputPath = '';
    API_EAB_writeTempFile({ name: baseName(path) + '.preview.png', dataBase64: '' }).then(function (temp) {
      if (generation !== rawPreviewGeneration) return null;
      if (!temp || !temp.ok || !temp.path) throw new Error((temp && temp.error) || 'Could not create a temporary preview file.');
      outputPath = temp.path;
      var outputDir = outputPath.replace(/[\\/][^\\/]*$/, '');
      var pair = rawPairFor(path);
      var args = ['-i', path, '-f', $('#raw-format').val(), '-s', String(width) + 'x' + String(height), '-o', outputDir];
      if (pair && pair.lut) args.push('-l', pair.lut);
      return API_EAB_runCli({ command: rawViewerCommand(), args: args });
    }).then(function (resp) {
      if (generation !== rawPreviewGeneration || !resp) return;
      var result = {};
      try { result = JSON.parse(resp.detail || '{}'); } catch (_) { }
      if (!resp.ok || result.success !== true) {
        throw new Error(result.error || resp.error || resp.result || 'RAW preview conversion failed.');
      }
      setPreviewState('r-preview-frame', 'pass', result.output_file || outputPath);
    }).catch(function (error) {
      if (generation !== rawPreviewGeneration) return;
      var message = error && error.message ? error.message : String(error);
      setPreviewState('r-preview-frame', null, null);
      $('#r-preview-frame .preview-placeholder').text('⚠ Preview failed: ' + message);
    });
  }
  $(function() {
    var $valInput = $('#val-input');
    if ($valInput.length) $valInput.on('input', onValFileInput);
    var $jpegInput = $('#jpegopt-input');
    if ($jpegInput.length) $jpegInput.on('input', onJpegOptFileInput);
    var $rawInput = $('#raw-input');
    if ($rawInput.length) $rawInput.on('input', onRawFileInput);
    $('.v-detail-toggle').on('click', function() {
      var $detail = $(this).closest('.v-result-badge').find('.v-result-detail');
      if (!$detail.length) return;
      var isHidden = $detail.css('display') === 'none';
      $detail.css('display', isHidden ? 'block' : 'none');
      $(this).toggleClass('expanded', isHidden);
    });
  });
  var TAB_META = [
    { id: 'validator', list: '#val-list', field: '#val-input', wrap: '#val-progress-fill', count: '#val-count',
      empty: '#val-empty', clear: '#btn-val-clear', run: '#btn-validate',
      frame: 'v-preview-frame', badge: 'v-result-badge', busy: 'validating', verb: 'Validating',
      okState: 'pass', doneText: 'Validation Passed', failText: 'Validation Failed' },
    { id: 'jpegopt', list: '#jpegopt-list', field: '#jpegopt-input', wrap: '#jpeg-progress-fill', count: '#jpegopt-count',
      empty: '#jpegopt-empty', clear: '#btn-jpegopt-clear', run: '#btn-jpegopt-run',
      frame: 'j-preview-frame', badge: 'j-result-badge', busy: 'optimizing', verb: 'Optimizing',
      okState: 'success', doneText: 'Optimization Complete', failText: 'Optimization Failed' },
    { id: 'rawviewer', list: '#raw-list', field: '#raw-input', wrap: '#raw-progress-fill', count: '#raw-count',
      empty: '#raw-empty', clear: '#btn-raw-clear', run: '#btn-raw-run', pairs: true,
      frame: 'r-preview-frame', badge: 'r-result-badge', busy: 'converting', verb: 'Converting',
      okState: 'success', doneText: 'Conversion Complete', failText: 'Conversion Failed', rawPreview: true }
  ];
  var TAB_FOLDER_EXTS = {
    validator: IMAGE_EXTENSIONS,
    jpegopt: ['jpg', 'jpeg', 'jpe', 'jfif'],
    rawviewer: ['raw', 'lut']
  };
  var PALETTED_FORMATS = ['PALETTED565', 'PALETTED4444', 'PALETTED8', 'PALETTEDARGB8', 'PALETTED'];
  var IDX_RE = /[_\.]index\.raw$/i;
  var LUT_RE = /[_\.]lut\.raw$/i;
  var rawPairs = {};
  var tabQueues = { validator: [], jpegopt: [], rawviewer: [] };
  window.eabTabQueues = tabQueues;
  function baseName(p) { return String(p).split(/[\\/]/).pop() || String(p); }
  function tabMetaById(id) {
    for (var i = 0; i < TAB_META.length; i++) if (TAB_META[i].id === id) return TAB_META[i];
    return null;
  }
  function tabMetaFor(zone) {
    var pane = zone && zone.closest ? zone.closest('.tab-content') : null;
    var id = pane && pane.id ? pane.id.replace(/^tab-/, '') : '';
    return tabMetaById(id);
  }
  function tabMetaForField(fieldId) {
    for (var i = 0; i < TAB_META.length; i++) if (TAB_META[i].field === '#' + fieldId) return TAB_META[i];
    return null;
  }
  function rawPaletted() {
    return PALETTED_FORMATS.indexOf(String($('#raw-format').val())) >= 0;
  }
  function rawPairFor(path) {
    var isIndex = IDX_RE.test(path);
    var isLut   = LUT_RE.test(path);
    if (!isIndex && !isLut && !rawPaletted()) return null;

    var partner = rawPairs[path] ||
                  (isIndex ? path.replace(IDX_RE, '_lut.raw')
                          : path.replace(LUT_RE, '_index.raw'));

    var lutPath = isLut ? path : partner;

    var resolved = false;
    if (partner) {
      if (tabQueues.rawviewer.indexOf(partner) >= 0) resolved = true;
      else if (rawPairs[path] || rawPairs[partner])   resolved = true;
    }

    return {
      partner: partner || '',
      lut:     lutPath  || '',
      pending: !resolved
    };
  }
  function pickRawPartner(rowPath) {
    API_EAB_pickFiles({ filters: RAW_FILTERS, multiple: false, readBase64: false }).then(function (resp) {
      var picked = (resp && resp.paths && resp.paths.length) ? resp.paths[0] : '';
      if (!picked) return;
      rawPairs[rowPath] = picked;
      var meta = tabMetaById('rawviewer');
      if (meta) renderTabQueue(meta);
    });
  }
  function syncTabHero(meta) {
    var $row = $(meta.field).closest('.app-main');
    if (!$row.length) return;
    var empty = tabQueues[meta.id].length === 0 && !$.trim(String($(meta.field).val() || '')).length;
    $row.toggleClass('is-queue-empty', empty && !$row.hasClass('is-options-shown'));
  }
  function tabRowHtml(path) {
    return '<div class="file-item list-group-item" data-path="' + escAttr(path) + '" title="' + escAttr(path) + '">'
      + '<span class="file-item-thumb-placeholder">\uD83D\uDCC4</span>'
      + '<span class="file-item-name">' + esc(truncateLeft(path, 64)) + '</span>'
      + '<span class="file-item-status"></span>'
      + '<div class="file-item-progress"><div class="file-item-progress-fill"></div><span class="file-item-bar-label"></span></div>'
      + '<span class="file-item-remove" data-path="' + escAttr(path) + '" title="Remove from the list">\u00d7</span>'
      + '</div>';
  }
  function tabRunDisabled(meta) {
    if (!tabQueues[meta.id].length) return true;
    if (meta.id === 'jpegopt') {
      var quality = Number($('#jpegopt-quality').val());
      return !Number.isInteger(quality) || quality < 1 || quality > 95;
    }
    if (meta.id === 'rawviewer') {
      var width = Number($('#raw-width').val());
      var height = Number($('#raw-height').val());
      return !(Number.isInteger(width) && width > 0 &&
               Number.isInteger(height) && height > 0 &&
               !!String($('#raw-format').val() || ''));
    }
    return false;
  }
  function syncTabRun(meta) {
    if (meta && meta.run) setActionDisabled($(meta.run), tabRunDisabled(meta));
  }
  function renderTabQueue(meta) {
    var q = tabQueues[meta.id];
    var $list = $(meta.list);
    if (!$list.length) return;

    var html = '';
    var rendered = {};

    for (var i = 0; i < q.length; i++) {
      if (rendered[q[i]]) continue;

      var pair = meta.pairs ? rawPairFor(q[i]) : null;

      if (!pair) {
        html += tabRowHtml(q[i]);
        rendered[q[i]] = true;
        continue;
      }

      rendered[q[i]] = true;
      if (pair.partner && q.indexOf(pair.partner) >= 0) rendered[pair.partner] = true;

      html += '<div class="file-pair">' + tabRowHtml(q[i])
        + '<div class="file-item file-item-partner' + (pair.pending ? ' is-empty' : '') + '"'
        + ' data-partner-for="' + escAttr(q[i]) + '"'
        + ' title="' + escAttr(pair.lut || 'Pick the partner file for this input') + '">'
        + '<span class="file-item-thumb-placeholder">\uD83C\uDFA8</span>'
        + '<span class="file-item-name">'
        + (pair.lut ? esc(truncateLeft(pair.lut, 60))
                    : 'No palette file \u2014 click to choose')
        + '</span>'
        + '</div></div>';
    }

    $list.html(html);

    if (meta.count) $(meta.count).text('(' + q.length + ')');
    if (meta.empty) $(meta.empty).toggleClass('hidden', q.length > 0);
    if (meta.clear) $(meta.clear).toggleClass('hidden', q.length === 0);
    if (meta.run)   syncTabRun(meta);

    $list.find('.file-item-remove').on('click', function () {
      removeTabFile(meta.id, $(this).attr('data-path'));
    });
    $list.find('.file-item:not(.file-item-partner)').on('click', function (e) {
      if ($(e.target).hasClass('file-item-remove')) return;
      $(meta.field).val($(this).attr('data-path')).trigger('input');
    });
    $list.find('.file-item-partner').on('click', function () {
      pickRawPartner($(this).attr('data-partner-for'));
    });

    syncTabHero(meta);
  }
  function removeTabFile(id, path) {
    var meta = tabMetaById(id);
    if (!meta) return;
    var q = tabQueues[id];
    var idx = q.indexOf(path);
    if (idx >= 0) q.splice(idx, 1);
    delete rawPairs[path];
    renderTabQueue(meta);
    if ($(meta.field).val() === path) $(meta.field).val(q.length ? q[0] : '').trigger('input');
  }
  function addTabFiles(meta, paths) {
    if (!meta || !paths || !paths.length) return;
    if (meta.pairs) paths = paths.slice().sort(function (a, b) {
      return (LUT_RE.test(a) ? 1 : 0) - (LUT_RE.test(b) ? 1 : 0);
    });
    var added = 0;
    var changed = false;
    for (var i = 0; i < paths.length; i++) {
      var p = String(paths[i] || '');
      if (!p) continue;
      var partnerOf = meta.pairs && LUT_RE.test(p) ? p.replace(LUT_RE, '_index.raw') : '';
      if (partnerOf && tabQueues[meta.id].indexOf(partnerOf) >= 0) {
        rawPairs[partnerOf] = p;
        changed = true;
        continue;
      }
      if (tabQueues[meta.id].indexOf(p) >= 0) continue;
      tabQueues[meta.id].push(p);
      added++;
      changed = true;
    }
    if (!changed) return;
    var $field = $(meta.field);
    if (added && !$field.val()) $field.val(tabQueues[meta.id][0]).trigger('input');
    renderTabQueue(meta);
  }
  window.tabAddFolder = function (id) {
    var meta = tabMetaById(id);
    if (!meta) return;
    if (!isEmbedded()) {
      addTabFiles(meta, promptForPaths('a folder path'));
      return;
    }
    API_EAB_pickFolder({
      extensions: TAB_FOLDER_EXTS[id],
      title: 'Select a folder of inputs',
      readBase64: false
    }).then(function (resp) {
      if (!resp || !resp.ok) {
        showError('Add folder failed: ' + ((resp && resp.error) || 'unknown error'));
        return;
      }
      if (resp.paths && resp.paths.length) addTabFiles(meta, resp.paths);
      else showError('No matching files in that folder.');
    });
  };
  window.tabClearQueue = function (id) {
    var meta = tabMetaById(id);
    if (!meta) return;
    tabQueues[id] = [];
    $(meta.field).val('');
    setResultBadge(meta.badge, 'hidden');
    setPreviewState(meta.frame, null, null);
    renderTabQueue(meta);
  };
  function rowFor($list, path) {
    return $list.find('.file-item').filter(function () { return $(this).attr('data-path') === path; });
  }
  function runTabQueue(meta, perFile, judge) {
    var q = tabQueues[meta.id].slice();
    var typed = $.trim(String($(meta.field).val() || ''));
    if (typed && q.indexOf(typed) < 0) q.unshift(typed);
    if (!q.length) { showError('Please select an input file.'); return; }
    var $list = $(meta.list);
    var $fill = $(meta.wrap);
    var total = q.length;
    var verdicts = [];
    function setTotal(pct) { if ($fill.length) $fill.css('width', Math.min(pct, 100) + '%'); }
    setTotal(0);
    setResultBadge(meta.badge, meta.busy, meta.verb + ' 1/' + total + '\u2026');
    if (!meta.rawPreview) setPreviewState(meta.frame, 'loading', q[0], meta.verb + '\u2026');
    (function step(i) {
      if (i >= total) { finishTabQueue(meta, q, verdicts); return; }
      var path = q[i];
      var $row = rowFor($list, path);
      $row.addClass('converting indeterminate');
      $row.find('.file-item-bar-label').text(meta.verb + ' ' + (i + 1) + '/' + total);
      var t0 = Date.now();
      Promise.resolve(perFile(path)).then(function (resp) {
        var v = judge(resp, path);
        verdicts.push(v);
        $row.removeClass('converting indeterminate');
        $row.addClass(v.ok ? 'done' : 'failed');
        $row.find('.file-item-progress-fill').css('width', '100%');
        $row.find('.file-item-status')
          .text((v.ok ? '\u2713' : '\u2717') + ' ' + fmtSecs(Date.now() - t0))
          .attr('title', v.ok ? '' : (v.error || ''));
        setTotal(verdicts.length / total * 100);
        step(i + 1);
      });
    })(0);
  }
  function finishTabQueue(meta, paths, verdicts) {
    var passed = 0;
    var lines = [];
    for (var i = 0; i < verdicts.length; i++) {
      if (verdicts[i].ok) passed++;
      if (paths.length > 1) {
        lines.push({ label: baseName(paths[i]) + ':', value: verdicts[i].ok ? 'ok' : 'failed', cls: verdicts[i].ok ? 'ok' : 'err' });
      } else if (verdicts[i].lines && verdicts[i].lines.length) {
        lines = verdicts[i].lines;
      }
    }
    var all = passed === verdicts.length;
    var text = paths.length === 1 ? (all ? meta.doneText : meta.failText) : passed + '/' + paths.length + ' ' + (all ? 'ok' : 'failed');
    setResultBadge(meta.badge, all ? meta.okState : 'fail', text + ' ' + (all ? '\u2713' : '\u2717'), lines);
    if (meta.rawPreview) {
      var save = $('#raw-save-png').prop('checked');
      var outputFile = verdicts.length ? verdicts[verdicts.length - 1].outputFile : '';
      if (save && all && outputFile) setPreviewState(meta.frame, 'pass', outputFile);
    } else {
      setPreviewState(meta.frame, all ? 'pass' : 'fail', paths[paths.length - 1]);
    }
  }
  window.eabOnDrop = function (paths, zone) {
    var meta = tabMetaFor(zone);
    if (meta) { addTabFiles(meta, paths); return; }
    if (zone && zone.closest && zone.closest('#tab-converter') && typeof window.addImages === 'function') window.addImages(paths);
  };
  function cliVerdict(resp) {
    var detail = {};
    try { detail = JSON.parse((resp && resp.detail) || '{}'); } catch (_) { }
    var text = (resp && resp.result) ? String(resp.result) : '';
    var failedExit = typeof detail.exit_code === 'number' && detail.exit_code !== 0;
    return {
      ok: !!(resp && resp.ok) && detail.success === true && !failedExit,
      error: String(detail.error || ''),
      lines: parseResultLines(text)
    };
  }
  window.runValidate = function() {
    runTabQueue(TAB_META[0], function (path) {
      return API_EAB_runCli({ command: 'validate', args: ['-i', path] });
    }, function (resp) {
      return cliVerdict(resp);
    });
  };
  window.runJpegOptimize = function() {
    var $out = $('#jpegopt-outdir');
    var outdir = ($out.length ? $out.val() : '') || '.';
    var quality = parseInt($('#jpegopt-quality').val()) || 75;
    var gray = $('#jpegopt-gray').prop('checked');
    runTabQueue(TAB_META[1], function (path) {
      var args = ['-i', path, '-o', outdir, '-q', String(quality)];
      if (gray) args.push('--gray');
      return API_EAB_runCli({ command: 'jpeg_optimize', args: args });
    }, function (resp) {
      return cliVerdict(resp);
    });
  };
  window.runRawViewer = function() {
    var width = parseInt($('#raw-width').val()) || 0;
    var height = parseInt($('#raw-height').val()) || 0;
    if (!width || !height) { showError('Please enter width and height.'); return; }
    runTabQueue(TAB_META[2], function (path) {
      var pair = rawPairFor(path);
      var args = ['-i', path, '-f', $('#raw-format').val(), '-s', String(width) + 'x' + String(height)];
      args.push('-o', $('#raw-output').val() || '.');
      if (pair && pair.lut) args.push('-l', pair.lut);
      if (!$('#raw-save-png').prop('checked')) args.push('--no-save-png');
      return API_EAB_runCli({ command: rawViewerCommand(), args: args });
    }, function (resp) {
      var text = (resp && resp.result) ? String(resp.result) : '';
      var result = {};
      try { result = JSON.parse(resp && resp.detail || '{}'); } catch (_) { }
      return {
        ok: !!(resp && resp.ok) && result.success === true,
        error: String(result.error || ''),
        lines: parseResultLines(text),
        outputFile: result.output_file || '',
      };
    });
  };
  for (var mi = 0; mi < TAB_META.length; mi++) renderTabQueue(TAB_META[mi]);
  $('#raw-format').on('change', function () {
    var meta = tabMetaById('rawviewer');
    if (meta) renderTabQueue(meta);
  });
  $('#raw-width, #raw-height, #raw-format').on('input', function () {
    syncTabRun(tabMetaById('rawviewer'));
  });
  $('#raw-width, #raw-height, #raw-format').on('change', function () {
    var meta = tabMetaById('rawviewer');
    syncTabRun(meta);
    if ($('#raw-input').val()) onRawFileInput();
  });
  $('#jpegopt-quality').on('input change', function () {
    syncTabRun(tabMetaById('jpegopt'));
  });
  function runBarGroup(mid) {
    return $(mid).children().filter(function () {
      return !this.getAttribute('data-eab-role') && !$(this).hasClass('card');
    });
  }
  function syncPreviewColumns() {
    $('.mid-col').each(function () {
      var $mid = $(this);
      var $row = $mid.parent('.app-row');
      var $right = $row.children('.right-col');
      if (!$right.length) return;
      var group = runBarGroup(this).add(runBarGroup($right.get(0)));
      if (!group.length) return;
      var noPreview = !$row.hasClass('is-queue-empty') && !$mid.find('.preview-frame.has-image').length;
      $row.toggleClass('no-preview', noPreview);
      if (group.parent().get(0) !== $right.get(0) || group.index() !== 0) $right.prepend(group);
    });
  }
  var SAMPLE_SETS = {
    'bt82x':  { folder: 'BT82X',  files: ['case.png', 'ducati.png', 'lighthouse.jpg', 'colorful-finch.jpg'] },
    legacy: { folder: 'Legacy', files: ['case.png', 'ducati.png', 'lighthouse.jpg', 'red-panda.bmp'] }
  };
  var RAW_SAMPLE_SETS = {
    'bt82x':  { folder: 'BT82X',  name: 'ducati_288x163_ARGB8.raw',  format: 'ARGB8',  width: 288, height: 163 },
    legacy: { folder: 'Legacy', name: 'ducati_288x163_RGB565.raw', format: 'RGB565', width: 288, height: 163 }
  };
  var sampleRel = {};
  function sampleChipKey() {
    var group = chipGroup();
    return SAMPLE_SETS[group] ? group : '';
  }
  function readExtFile(path) {
    if (typeof API_EAB_readExtFile !== 'function') return Promise.resolve({});
    return API_EAB_readExtFile({ path: path });
  }
  function readFileData(path) {
    var rel = sampleRel[path];
    return rel ? readExtFile(rel) : API_EAB_readFileAsBase64({ path: path });
  }
  function resolveSample(key, name) {
    var rel = 'samples/' + SAMPLE_SETS[key].folder + '/' + name;
    return readExtFile(rel).then(function (resp) {
      if (!resp || !resp.ok || !resp.path) return '';
      sampleRel[resp.path] = rel;
      return resp.path;
    }, function () { return ''; });
  }
  function sampleSet() {
    var key = sampleChipKey() || 'legacy';
    return Promise.all(SAMPLE_SETS[key].files.map(function (name) {
      return resolveSample(key, name);
    })).then(function (paths) {
      for (var i = 0; i < paths.length; i++) if (!paths[i]) return null;
      return { key: key, paths: paths };
    });
  }
  function loadRawSample(key) {
    var spec = RAW_SAMPLE_SETS[key] || RAW_SAMPLE_SETS.legacy;
    var rel = 'samples/' + spec.folder + '/' + spec.name;
    return readExtFile(rel).then(function (resp) {
      if (!resp || !resp.ok || !resp.path) return '';
      sampleRel[resp.path] = rel;
      return resp.path;
    }, function () { return ''; });
  }
  function loadSamples(tab) {
    sampleSet().then(function (set) {
      if (!set) {
        showError('Sample files are missing — expected samples/' + SAMPLE_SETS.legacy.folder + ' next to the extension.');
        markSampleFail(tab);
        return;
      }
      if (!sampleChipKey()) {
        var $picker = $('#chip-one');
        if ($picker.length) $picker.val('group:' + set.key).trigger('change');
      }
      if (tab === 'converter') { addImages(set.paths); return; }
      if (tab === 'validator' || tab === 'jpegopt') {
        var exts = TAB_FOLDER_EXTS[tab] || [];
        addTabFiles(tabMetaById(tab), set.paths.filter(function (p) {
          return !exts.length || exts.indexOf(String(p).split('.').pop().toLowerCase()) >= 0;
        }));
        return;
      }
      if (tab !== 'rawviewer') return;
      var spec = RAW_SAMPLE_SETS[set.key] || RAW_SAMPLE_SETS.legacy;
      loadRawSample(set.key).then(function (path) {
        if (!path) { showError('Could not load the sample raw bitmap.'); markSampleFail(tab); return; }
        $('#raw-format').val(spec.format).trigger('change');
        $('#raw-width').val(String(spec.width)).trigger('input');
        $('#raw-height').val(String(spec.height)).trigger('input');
        addTabFiles(tabMetaById('rawviewer'), [path]);
        $('#raw-input').val(path).trigger('input');
      });
    });
  }
  function syncSampleButtons() {
    $('.tab-content').each(function () {
      var $pane = $(this);
      var $btn = $pane.find('.dz-sample').eq(0);
      if (!$btn.length) return;
      var $corner = $pane.find('.dz-corner').eq(0);
      var $addFolder = $pane.find('.card-title button').filter(function () {
        return /Add folder/.test($.trim($(this).text()));
      }).eq(0);
      if ($pane.find('.app-main').eq(0).hasClass('is-queue-empty') && $corner.length) {
        if ($btn.parent().get(0) !== $corner.get(0)) $corner.prepend($btn);
        return;
      }
      if ($addFolder.length && $btn.prev().get(0) !== $addFolder.get(0)) $btn.insertAfter($addFolder);
    });
  }
  window.eabUseSample = function (tab, ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    loadSamples(String(tab || ''));
  };
  var previewSyncQueued = false;
  function queuePreviewSync() {
    if (previewSyncQueued) return;
    previewSyncQueued = true;
    setTimeout(function () { previewSyncQueued = false; syncPreviewColumns(); syncSampleButtons(); }, 0);
  }
  $(document).ready(function () {
    syncPreviewColumns();
    syncSampleButtons();
    setTimeout(syncPreviewColumns, 0);
    setTimeout(syncSampleButtons, 0);
    if (typeof MutationObserver !== 'function') return;
    new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var target = records[i].target;
        var cls = target && target.classList;
        if (cls && (cls.contains('preview-frame') || cls.contains('app-row'))) {
          queuePreviewSync();
          return;
        }
      }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
  });
})();
