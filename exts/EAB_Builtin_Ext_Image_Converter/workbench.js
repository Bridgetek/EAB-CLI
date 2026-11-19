(function () {
  'use strict';
  var SPLIT_KEY = 'eab_workbench_split';
  var SPLIT_MIN = 20;
  var SPLIT_MAX = 80;
  var STACK_AT = 900;
  function wbTitle(card) {
    var t = card.querySelector('.card-title');
    if (!t && card.tagName === 'DETAILS') t = card.querySelector('summary');
    return t ? $(t).text().trim() : '';
  }
  function wbHas(card, sel) {
    try { return !!card.querySelector(sel); } catch (e) { return false; }
  }
  function wbRole(card) {
    var explicit = card.getAttribute && card.getAttribute('data-eab-role');
    if (explicit) return explicit;
    var title = wbTitle(card);
    if (/log/i.test(title)) return 'log';
    if (/preview/i.test(title) || wbHas(card, 'canvas')) return 'preview';
    if (/input|files\b|assets\b/i.test(title)) return 'input';
    if (/output/i.test(title)) return 'output';
    if (/target|chip|device/i.test(title)) return 'chip';
    if (card.classList && $(card).hasClass('action-bar')) return 'action';
    if (card.classList && $(card).hasClass('alert')) return 'alert';
    var ids = '';
    var nodes = card.querySelectorAll('[id]');
    for (var i = 0; i < nodes.length; i++) ids += ' ' + nodes[i].id + ' ';
    if (/input-path|input-list|file-list|input-file|files?-list|assets?-list|validator-list/.test(ids)) return 'input';
    if (/output-dir|out-dir|outfile|output-path|gen-output/.test(ids)) return 'output';
    if (/chip-select|gen-device|target-chip/.test(ids)) return 'chip';
    return 'options';
  }
  var WB_WRAPPERS = '.app-col, .col';
  function wbIsUnit(el) {
    if (el.nodeType !== 1) return false;
    if ($(el).hasClass('workbench-divider')) return false;
    if (el.tagName === 'DETAILS') return true;
    if ($(el).hasClass('card') || $(el).hasClass('alert')) return true;
                return $(el).hasClass('row') && !!(el.querySelector('.card, details'));
  }
  function wbPanelCards(panel) {
    if (!panel) return [];
    var out = [];
    var kids = panel.children;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (el.nodeType !== 1) continue;
      if (wbIsUnit(el)) { out.push(el); continue; }
      if (wbIsTabPanel(el)) continue;
      if (el.matches(WB_WRAPPERS) || (el.children.length && el.tagName !== 'SCRIPT')) {
        var inner = wbPanelCards(el);
        for (var j = 0; j < inner.length; j++) out.push(inner[j]);
      }
    }
    return out;
  }
  function wbIsTabPanel(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.getAttribute('role') === 'tabpanel') return true;
    if ($(el).hasClass('tab-content') || $(el).hasClass('tab-panel')) return true;
    return el.tagName === 'DIV' && (el.id || '').indexOf('tab-') === 0;
  }
  function wbApplyOrder(container, desired) {
    if (!container || !desired.length) return false;
    var same = container.children.length === desired.length;
    if (same) {
      for (var i = 0; i < desired.length; i++) {
        if (container.children[i] !== desired[i]) { same = false; break; }
      }
    }
    if (same) return false;
    for (var j = 0; j < desired.length; j++) container.appendChild(desired[j]);
    return true;
  }
  function wbIsAlert(card) {
    return $(card).hasClass('alert') || card.id === 'error-panel' ||
      card.id === 'warn-panel' || !!(card.querySelector && card.querySelector('.alert'));
  }
  function wbRightRank(card, movedOutput) {
    if (card === movedOutput) return 0;
    var title = wbTitle(card).toLowerCase();
    if (/preview/.test(title) || wbHas(card, 'canvas')) return 1;
    if (wbRole(card) === 'queue') return 1.5;
    if (/progress/.test(title)) return 3;
    if (/result/.test(title)) return 4;
    if (/\bmap\b/.test(title)) return 5;
    if (/log/.test(title)) return 6;
    if (wbIsAlert(card)) return 7;
    return 2;
  }
  var WB_ADDERS = ['eabAddFiles', 'addInputFiles', 'addFontFiles', 'addGifFiles', 'addFiles'];
  function wbQueueList(scope) {
    var nodes = scope.querySelectorAll('.file-list, .input-list, .gen-entries');
    for (var i = 0; i < nodes.length; i++) {
      var tag = nodes[i].tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') continue;
      return nodes[i];
    }
    return null;
  }
  function wbInputQueue(panels) {
    for (var i = 0; i < panels.length; i++) {
      var list = wbQueueList(panels[i]);
      if (!list) continue;
      var card = list.closest ? list.closest('.card') : null;
      if (card) return { card: card, list: list };
    }
    return null;
  }
  function wbOutputCard(panels, skip) {
    var ids = WB_OUT_FIELD.folder.concat(WB_OUT_FIELD.name);
    var cards = [];
    for (var i = 0; i < panels.length; i++) cards = cards.concat(wbPanelCards(panels[i]));
    for (var j = 0; j < cards.length; j++) {
      if (cards[j] !== skip && wbRole(cards[j]) === 'output') return cards[j];
    }
    for (var k = 0; k < cards.length; k++) {
      var card = cards[k];
      if (card === skip) continue;
            var declared = card.getAttribute && card.getAttribute('data-eab-role');
      if (declared && declared !== 'left') continue;
      if (wbCardField(card, ids)) return card;
    }
    return null;
  }
  function mergeInputOutput() {
    var mains = wbMains();
    for (var m = 0; m < mains.length; m++) {
      var main = mains[m];
      var panels = wbPanels(main);
      if (!panels.length) continue;
      var queue = wbInputQueue(panels);
      var output = queue && wbOutputCard(panels, queue.card);
      if (!queue || !output) continue;
      var zone = queue.card.querySelector('.drop-zone');
      var $row = $('<div class="row eab-io-split">');
      var $in = $('<div class="col-12 eab-io-in">');
      var $out = $('<div class="col-12 eab-io-out">');
      $row.append($in).append($out);
      if (zone) {
        $(zone).before($row);
        var node = zone;
        while (node) {
          var next = node.nextElementSibling;
          $in.append(node);
          if (node === queue.list) break;
          node = next;
        }
      } else {
        $(queue.list).before($row);
        $in.append(queue.list);
      }
      var kids = Array.prototype.slice.call(output.children);
      for (var k = 0; k < kids.length; k++) $out.append(kids[k]);
      var $wrapper = $(output).parent();
      $(output).remove();
      while ($wrapper.length && !$wrapper.children().length &&
             !$wrapper.is('.left-panel, .right-panel') && $wrapper.parent().length) {
        var $next = $wrapper.parent();
        $wrapper.remove();
        $wrapper = $next;
      }
    }
  }
  var WB_OUT_FIELD = {
    folder: ['output-dir', 'output-path', 'output-folder', 'gen-output'],
    name: ['output-name', 'output-file'],
  };
  function wbCardField(card, ids) {
    var visible = null;
    var any = null;
    for (var i = 0; i < ids.length; i++) {
      var el = card.querySelector('#' + ids[i]);
      if (!el || el.tagName !== 'INPUT') continue;
      if (!any) any = el;
      if (el.offsetParent !== null) { visible = el; break; }
    }
    return visible || any;
  }
  function wbFieldRow(card, field) {
    var node = field;
    while (node && node.parentElement && node.parentElement !== card) node = node.parentElement;
    return node && node.parentElement === card ? node : null;
  }
  function wbBrowseForOutput(field) {
    var scope = field.closest('.app-main') || document;
    return scope.querySelector('#btn-output-browse, #btn-browse-output, #btn-out-browse');
  }
  function wbPickOutput(field) {
    if (typeof window.pickOutputDir === 'function') {
      try { window.pickOutputDir(); return; } catch (e) {  }
    }
    API_EAB_pickOutput({}).then(function (resp) {
      if (resp && resp.ok && resp.folder && field) {
        field.value = resp.folder;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }
  function wbLabelRow(card, field, text) {
    var row = wbFieldRow(card, field);
    if (!row) return null;
            var group = $(field).closest('.input-group').get(0);
    if (group && group !== row && $.contains(row, group)) row = group;
    $(row).addClass('input-group eab-output-row');
    var label = row.querySelector(':scope > .input-group-text, :scope > label');
    if (!label) {
      label = document.createElement('span');
      label.className = 'input-group-text';
      label.textContent = text;
      row.insertBefore(label, row.firstChild);
    } else {
      label.className = 'input-group-text';
    }
    return row;
  }
  function installOutputCard(card) {
    if (card.dataset.eabOutputCard === '1') return;
    card.dataset.eabOutputCard = '1';
    var folder = wbCardField(card, WB_OUT_FIELD.folder);
    var name = wbCardField(card, WB_OUT_FIELD.name);
    if (!folder && !name) return;
    $(card).addClass('eab-output-card');
    var folderRow = folder ? wbLabelRow(card, folder, '📁 Output folder') : null;
    if (folder) {
      var browse = (folderRow && folderRow.querySelector('button')) || wbBrowseForOutput(folder);
      if (browse && !browse.id) browse.id = 'btn-output-browse';
    }
    if (name && name !== folder) wbLabelRow(card, name, '📝 Output name');
  }
  function installOutputCards() {
    var mains = wbMains();
    for (var m = 0; m < mains.length; m++) {
      var cards = [];
      var panels = wbPanels(mains[m]);
      for (var p = 0; p < panels.length; p++) cards = cards.concat(wbPanelCards(panels[p]));
      for (var c = 0; c < cards.length; c++) {
        if (wbRole(cards[c]) === 'output') installOutputCard(cards[c]);
      }
    }
  }
  var wbLastSignature = '';
  function wbMains() {
    return document.querySelectorAll('.app-main');
  }
  function wbPanels(main) {
    var out = [];
    var kids = main.children;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (el.nodeType !== 1) continue;
      if ($(el).hasClass('left-panel') || $(el).hasClass('mid-panel') || $(el).hasClass('right-panel')) out.push(el);
    }
    return out;
  }
  function layoutWorkbench() {
    var mains = wbMains();
    for (var m = 0; m < mains.length; m++) layoutWorkbenchPanel(mains[m]);
  }
  function layoutWorkbenchPanel(main) {
    var panels = wbPanels(main);
    if (panels.length < 2) return;
    var left = main.querySelector(':scope > .left-panel') || panels[0];
    var right = main.querySelector(':scope > .right-panel') || panels[panels.length - 1];
    var cards = [];
    for (var pn = 0; pn < panels.length; pn++) cards = cards.concat(wbPanelCards(panels[pn]));
    if (cards.length < 2) return;
    if (panels.length > 2) { layoutColumns(panels, cards, main); return; }
    var groups = { chip: [], input: [], output: [], left: [], action: [], right: [] };
    for (var i = 0; i < cards.length; i++) {
      var role = wbRole(cards[i]);
      if (role === 'chip') groups.chip.push(cards[i]);
      else if (role === 'input') groups.input.push(cards[i]);
      else if (role === 'output') groups.output.push(cards[i]);
      else if (role === 'left') groups.left.push(cards[i]);
      else if (role === 'action') groups.action.push(cards[i]);
      else groups.right.push(cards[i]);
    }
    var inputCard = groups.input[0] || null;
    var inputTall = !!inputCard && inputCard.offsetHeight > (window.innerHeight || 0) + 8;
    var movedOutput = (inputTall && groups.output.length) ? groups.output[0] : null;
    var leftDesired = groups.chip.concat(groups.input);
    if (!inputTall) leftDesired = leftDesired.concat(groups.output);
    leftDesired = leftDesired.concat(groups.left);
    leftDesired = leftDesired.concat(groups.action);
    var ranked = groups.right.map(function (card, idx) {
      return { card: card, idx: idx, rank: wbRightRank(card, movedOutput) };
    });
    if (movedOutput) ranked.push({ card: movedOutput, idx: -1, rank: 0 });
    ranked.sort(function (a, b) { return a.rank - b.rank || a.idx - b.idx; });
    var rightDesired = ranked.map(function (o) { return o.card; });
    var vSignature = (inputTall ? 'tall' : 'flat') + '|' + (inputCard ? inputCard.offsetHeight : 0) +
      '|s' + Math.round(wbSplit * 2) + '|h' + wbHeightBucket(left, right);
    var signature = leftDesired.length + ':' + rightDesired.length + '|' +
      leftDesired.map(function (c) { return wbRole(c); }).join(',') + '|' +
      rightDesired.map(function (c) { return wbRightRank(c, movedOutput); }).join(',') + '|' + vSignature;
    var mainKey = mainWbKey(main);
    var seen = wbSignatures[mainKey];
    if (seen === signature) return;
    wbSignatures[mainKey] = signature;
    if (wbBalanceKey[mainKey] === signature) {
      wbApplyOrder(left, wbWithDecision(leftDesired, mainKey, 'left'));
      wbApplyOrder(right, wbWithDecision(rightDesired, mainKey, 'right'));
      return;
    }
    wbBalanceKey[mainKey] = signature;
    wbRelocated[mainKey] = [];
    wbApplyOrder(left, leftDesired);
    wbApplyOrder(right, rightDesired);
    wbRelocated[mainKey] = wbBalanceColumns(left, right, {
      left: inputTall ? null : (groups.output[0] || null),
      right: wbFirstOfRole(rightDesired, 'preview'),
    });
    wbApplyOrder(left, wbWithDecision(leftDesired, mainKey, 'left'));
    wbApplyOrder(right, wbWithDecision(rightDesired, mainKey, 'right'));
  }
  var WB3_PANEL = {
    chip: 0, options: 0,
    input: 1, output: 1, action: 1,
    preview: 2, result: 2, log: 2, progress: 2, alert: 2,
  };
  function wbSortRank(list, rank) {
    return list.map(function (card, idx) { return { card: card, idx: idx, rank: rank(card) }; })
      .sort(function (a, b) { return a.rank - b.rank || a.idx - b.idx; })
      .map(function (o) { return o.card; });
  }
  function layoutColumns(panels, cards, main) {
    var lists = [[], [], []];
    for (var i = 0; i < cards.length; i++) {
      var col = WB3_PANEL[wbRole(cards[i])];
      lists[col === undefined ? 2 : col].push(cards[i]);
    }
    lists[2] = wbSortRank(lists[2], function (card) { return wbRightRank(card, null); });
    var signature = '3|' + lists.map(function (list) {
      return list.map(function (card) { return wbRole(card); }).join(',');
    }).join('|');
    var mainKey = mainWbKey(main);
    if (wbSignatures[mainKey] === signature) return;
    wbSignatures[mainKey] = signature;
    for (var pn = 0; pn < panels.length; pn++) wbApplyOrder(panels[pn], lists[pn]);
  }
  function wbFirstOfRole(desired, role) {
    for (var i = 0; i < desired.length; i++) {
      if (wbRole(desired[i]) === role) return desired[i];
    }
    return null;
  }
  function wbHeightBucket(left, right) {
    return Math.round(Math.max(left.offsetHeight, right.offsetHeight) / 16);
  }
  var wbSignatures = {};
  var wbRelocated = {};
  var wbBalanceKey = {};
  function wbWithout(list, el) {
    var out = [];
    for (var i = 0; i < list.length; i++) if (list[i] !== el) out.push(list[i]);
    return out;
  }
  function wbWithDecision(desired, mainKey, side) {
    var rel = wbRelocated[mainKey] || [];
    var out = desired.slice();
    for (var i = 0; i < rel.length; i++) {
      out = wbWithout(out, rel[i].unit);
      if (rel[i].to === side) out.push(rel[i].unit);
    }
    return out;
  }
  function wbVisibleUnits(panel) {
    var units = wbPanelCards(panel);
    var out = [];
    for (var i = 0; i < units.length; i++) {
      if (units[i].offsetParent !== null) out.push(units[i]);
    }
    return out;
  }
  var WB_SWING_BLOCKED = { chip: 1, input: 1, preview: 1, left: 1 };
  function wbSwingCandidates(panel, anchor) {
    var units = wbVisibleUnits(panel);
    var out = [];
    var below = !anchor;
    for (var i = 0; i < units.length; i++) {
      var u = units[i];
      if (u === anchor) { below = true; continue; }
      if (!below || i === 0) continue;
      if (u.getAttribute('data-eab-pin') === '1') continue;
      if (WB_SWING_BLOCKED[wbRole(u)]) continue;
      out.push(u);
    }
    return out;
  }
  function wbBalanceColumns(left, right, anchors) {
    var cand = {
      left: wbSwingCandidates(left, anchors.left),
      right: wbSwingCandidates(right, anchors.right),
    };
    var moved = [];
    for (var step = 0; step < cand.left.length + cand.right.length; step++) {
      var fromLeft = left.offsetHeight >= right.offsetHeight;
      var from = fromLeft ? left : right;
      var to = fromLeft ? right : left;
      var list = cand[fromLeft ? 'left' : 'right'];
      if (!list.length) break;
      var before = Math.max(left.offsetHeight, right.offsetHeight);
      var unit = list.shift();
      to.appendChild(unit);
      if (Math.max(left.offsetHeight, right.offsetHeight) < before) {
        moved.push({ unit: unit, to: fromLeft ? 'right' : 'left' });
      } else {
        from.appendChild(unit);
      }
    }
    return moved;
  }
  function mainWbKey(main) {
    if (!main.id) main.id = 'eab-main-' + (++wbMainSeq);
    return main.id;
  }
  var wbMainSeq = 0;
  var WB_QUEUE = '.file-list, .input-list, .gen-entries, #input-list, #file-list, #gen-entries';
  function wbInputListChanged(records) {
    for (var i = 0; i < records.length; i++) {
      var t = records[i].target;
      if (t && t.nodeType === 1 && t.closest(WB_QUEUE)) return true;
    }
    return false;
  }
  function requestWorkbenchRelayout() {
    wbLastSignature = '';
    wbSignatures = {};
    layoutWorkbench();
    if (wbDomObserver) wbDomObserver.takeRecords();
  }
  function wbOutputField(scope) {
    var root = scope || document;
    var ids = ['output-dir', 'output', 'out-dir', 'output-path', 'gen-output', 'enc-output'];
    for (var i = 0; i < ids.length; i++) {
      var el = root.querySelector('#' + ids[i]);
      if (el) return el;
    }
    var any = root.querySelector('input[id*="output"], input[id*="out-"]');
    if (any) return any;
    if (root !== document) return wbOutputField(document);
    return null;
  }
  function openOutputFolder(field) {
    var scope = field && field.closest ? (field.closest('.app-main') || document) : document;
    var target = wbOutputField(scope);
    var path = target && target.value ? String(target.value) : '.';
    API_EAB_openOutputLocation({ path: path });
  }
  function wbApplyOutputDefaults() {
    var mains = wbMains();
    var fields = [];
    for (var m = 0; m < mains.length; m++) {
      var f = wbOutputField(mains[m]);
      if (f && fields.indexOf(f) === -1) fields.push(f);
    }
    var global = wbOutputField(document);
    if (global && fields.indexOf(global) === -1) fields.push(global);
    if (!fields.length) return;
    API_EAB_getWorkingDir({}).then(function (resp) {
      if (!resp || !resp.ok || !resp.folder) return;
      var dir = String(resp.folder);
      for (var i = 0; i < fields.length; i++) {
        var v = String(fields[i].value || '').trim();
        if (v === '' || v === '.' || v === './') {
          fields[i].value = dir;
          fields[i].dispatchEvent(new Event('input', { bubbles: true }));
          fields[i].dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
  }
  function wbStacked() {
    return (window.innerWidth || 0) < STACK_AT;
  }
  function wbReadSplit() {
    try {
      var v = parseFloat(localStorage.getItem(SPLIT_KEY));
      if (!isNaN(v) && v >= SPLIT_MIN && v <= SPLIT_MAX) return v;
    } catch (e) {  }
    return 50;
  }
  var wbSplit = wbReadSplit();
  var SPLIT3_KEY = 'eab_workbench_split3';
  var SPLIT3_DEFAULT = [50, 83.3333];
  var SPLIT3_MIN = 12;
  var SPLIT3_MAX = 88;
  function wbReadSplit3() {
    try {
      var parts = String(localStorage.getItem(SPLIT3_KEY) || '').split(',');
      var first = parseFloat(parts[0]);
      var second = parseFloat(parts[1]);
      if (first >= SPLIT3_MIN && second <= SPLIT3_MAX && second - first >= SPLIT3_MIN) {
        return [first, second];
      }
    } catch (e) { }
    return SPLIT3_DEFAULT.slice();
  }
  var wbSplit3 = wbReadSplit3();
  function wbApplySplit() {
    var mains = wbMains();
    for (var m = 0; m < mains.length; m++) wbApplySplitFor(mains[m]);
  }
  function wbApplySplitFor(main) {
    if (!main) return;
    var panels = wbPanels(main);
    var dividers = main.querySelectorAll(':scope > .workbench-divider');
    if (panels.length < 2 || !dividers.length) return;
    if (wbStacked()) {
      main.style.gridTemplateColumns = '';
      $(main).removeClass('is-split');
      for (var d = 0; d < dividers.length; d++) dividers[d].style.height = '';
      return;
    }
    $(main).addClass('is-split');
    var want;
    if (main.classList.contains('no-preview')) {
      var col1 = panels.length > 2 ? wbSplit3[0] : wbSplit;
      want = 'minmax(0,' + col1 + 'fr) 16px minmax(0,' + (100 - col1) + 'fr) 16px minmax(0,0fr)';
    } else if (panels.length > 2) {
      want = 'minmax(0,' + wbSplit3[0] + 'fr) 16px minmax(0,' + (wbSplit3[1] - wbSplit3[0]) + 'fr) 16px minmax(0,' + (100 - wbSplit3[1]) + 'fr)';
    } else {
      want = 'minmax(0,' + wbSplit + 'fr) 16px minmax(0,' + (100 - wbSplit) + 'fr)';
    }
    if (main.style.gridTemplateColumns !== want) main.style.gridTemplateColumns = want;
    wbFitDivider(main);
  }
  function wbFitDivider(main) {
    var panels = wbPanels(main);
    var dividers = main.querySelectorAll(':scope > .workbench-divider');
    var prev = [];
    for (var d = 0; d < dividers.length; d++) {
      prev.push(dividers[d].style.height);
      dividers[d].style.height = '';
    }
    var h = 0;
    for (var p = 0; p < panels.length; p++) h = Math.max(h, panels[p].offsetHeight);
    for (var k = 0; k < dividers.length; k++) {
      dividers[k].style.height = h > 0 ? h + 'px' : prev[k];
    }
  }
  function wbSaveSplit() {
    try { localStorage.setItem(SPLIT_KEY, String(Math.round(wbSplit * 10) / 10)); } catch (e) { }
    try {
      var pair = wbSplit3.map(function (v) { return Math.round(v * 10) / 10; });
      localStorage.setItem(SPLIT3_KEY, pair.join(','));
    } catch (e) { }
  }
  function installSplit() {
    var mains = wbMains();
    for (var m = 0; m < mains.length; m++) installSplitFor(mains[m]);
  }
  function installSplitFor(main) {
    if (!main) return;
    var panels = wbPanels(main);
    if (panels.length < 2) return;
    for (var i = 1; i < panels.length; i++) {
      var divider = main.querySelector(':scope > .workbench-divider[data-eab-boundary="' + i + '"]');
      if (divider) continue;
      divider = document.createElement('div');
      divider.className = 'workbench-divider align-self-stretch';
      divider.setAttribute('data-eab-boundary', String(i));
      divider.setAttribute('role', 'separator');
      divider.setAttribute('aria-orientation', 'vertical');
      divider.setAttribute('tabindex', '0');
      divider.title = 'Drag to resize the columns · double-click to reset';
      main.insertBefore(divider, panels[i]);
      wireDivider(main, divider, i);
    }
    wbApplySplit();
  }
  function wireDivider(main, divider, boundary) {
    var dragging = false;
    function three() { return wbPanels(main).length > 2; }
    function bounds() {
      if (!three()) return [SPLIT_MIN, SPLIT_MAX];
      if (boundary === 1) return [SPLIT3_MIN, wbSplit3[1] - SPLIT3_MIN];
      return [wbSplit3[0] + SPLIT3_MIN, SPLIT3_MAX];
    }
    function value() {
      return three() ? wbSplit3[boundary - 1] : wbSplit;
    }
    function setValue(percent) {
      var range = bounds();
      var clamped = Math.max(range[0], Math.min(range[1], Math.round(percent * 2) / 2));
      if (three()) wbSplit3[boundary - 1] = clamped;
      else wbSplit = clamped;
      wbApplySplit();
    }
    function reset() {
      if (three()) wbSplit3 = SPLIT3_DEFAULT.slice();
      else wbSplit = 50;
      wbApplySplit();
      wbSaveSplit();
      requestWorkbenchRelayout();
    }
    divider.addEventListener('pointerdown', function (e) {
      dragging = true;
      $(divider).addClass('is-dragging');
      document.body.classList.add('eab-split-dragging');
      if (divider.setPointerCapture) divider.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    divider.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var rect = main.getBoundingClientRect();
      if (rect.width) setValue(((e.clientX - rect.left) / rect.width) * 100);
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      $(divider).removeClass('is-dragging');
      document.body.classList.remove('eab-split-dragging');
      wbSaveSplit();
      requestWorkbenchRelayout();
    }
    divider.addEventListener('pointerup', endDrag);
    divider.addEventListener('pointercancel', endDrag);
    divider.addEventListener('lostpointercapture', endDrag);
    divider.addEventListener('dblclick', reset);
    divider.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 5 : 2;
      if (e.key === 'ArrowLeft') setValue(value() - step);
      else if (e.key === 'ArrowRight') setValue(value() + step);
      else if (e.key === 'Home') { reset(); return; }
      else return;
      wbSaveSplit();
      requestWorkbenchRelayout();
      e.preventDefault();
    });
  }
  var wbObserver = null;
  var wbDomObserver = null;
  var wbClassObserver = null;
  var wbObserved = [];
  var wbResObserved = [];
  var wbSizeSig = '';
  function wbSizeOf(el) { return el.offsetWidth + 'x' + el.offsetHeight; }
  function wbSizes() {
    var parts = [];
    for (var i = 0; i < wbResObserved.length; i++) parts.push(wbSizeOf(wbResObserved[i]));
    return parts.join('|');
  }
  function wbWatchCards() {
    if (!wbObserver) return;
    var mains = wbMains();
    for (var m = 0; m < mains.length; m++) {
      var cards = [];
      var panels = wbPanels(mains[m]);
      for (var p = 0; p < panels.length; p++) cards = cards.concat(wbPanelCards(panels[p]));
      for (var i = 0; i < cards.length; i++) {
        if (wbObserved.indexOf(cards[i]) === -1) {
          wbObserved.push(cards[i]);
          wbObserver.observe(cards[i]);
        }
      }
    }
  }
  var WB_PREVIEW = '.preview-frame, .preview-container, .preview-row, [id^="preview-card"], [id$="-preview"]';
  function wbWatchPreviews(main) {
    if (!wbObserver) return;
    var found = main.querySelectorAll(WB_PREVIEW);
    for (var i = 0; i < found.length; i++) {
      if (wbResObserved.indexOf(found[i]) !== -1) continue;
      wbResObserved.push(found[i]);
      wbObserver.observe(found[i]);
    }
  }
  function rotateColumns(main) {
    var order = ['.right-panel', '.left-panel', '.mid-panel'];
    var panels = [];
    for (var i = 0; i < order.length; i++) {
      var panel = main.querySelector(':scope > ' + order[i]);
      if (panel) panels.push(panel);
    }
    if (panels.length < 2 || main.firstElementChild === panels[0]) return;
    for (var p = panels.length - 2; p >= 0; p--) main.insertBefore(panels[p], panels[p + 1]);
  }
  function buildWorkbench() {
        mergeInputOutput();
        var mains0 = wbMains();
        for (var r = 0; r < mains0.length; r++) rotateColumns(mains0[r]);
    layoutWorkbench();
    installSplit();
    var mains = wbMains();
    layoutWorkbench();
    wbApplyOutputDefaults();
    if (!wbObserver) {
      wbObserver = new ResizeObserver(function () {
        var sig = wbSizes();
        if (sig === wbSizeSig) return;
        wbSizeSig = sig;
        wbApplySplit();
        requestWorkbenchRelayout();
        wbSizeSig = wbSizes();
      });
      for (var o = 0; o < mains.length; o++) {
        wbResObserved.push(mains[o]);
        wbObserver.observe(mains[o]);
        var cols = wbPanels(mains[o]);
        for (var q = 0; q < cols.length; q++) {
          wbResObserved.push(cols[q]);
          wbObserver.observe(cols[q]);
        }
      }
      wbSizeSig = wbSizes();
    }
    wbWatchCards();
    for (var p = 0; p < mains.length; p++) wbWatchPreviews(mains[p]);
    if (!wbDomObserver) {
      var wbFitPending = null;
      wbDomObserver = new MutationObserver(function (records) {
        if (!wbInputListChanged(records)) return;
        if (wbFitPending) return;
        wbFitPending = setTimeout(function () {
          wbFitPending = null;
          wbApplySplit();
          requestWorkbenchRelayout();
        }, 0);
      });
      for (var d = 0; d < mains.length; d++) {
        wbDomObserver.observe(mains[d], { childList: true, subtree: true });
      }
    }
    if (!wbClassObserver) {
      var wbClassPending = null;
      wbClassObserver = new MutationObserver(function () {
        if (wbClassPending) return;
        wbClassPending = setTimeout(function () {
          wbClassPending = null;
          wbApplySplit();
        }, 0);
      });
      for (var co = 0; co < mains.length; co++) {
        wbClassObserver.observe(mains[co], { attributes: true, attributeFilter: ['class'] });
      }
    }
    window.addEventListener('resize', function () {
      wbApplySplit();
      requestWorkbenchRelayout();
    });
  }
  window.eabOpenOutputFolder = function () { openOutputFolder(null); };
  window.eabPickOutputFolder = function () { wbPickOutput(wbOutputField(document)); };
  window.__EAB_WORKBENCH = {
    relayout: requestWorkbenchRelayout,
    applyOutputDefaults: wbApplyOutputDefaults,
    fields: function () { return wbMains().length; },
    previews: function () {
      return wbResObserved.filter(function (el) {
        return el && el.matches && el.matches(WB_PREVIEW);
      }).length;
    },
    split: function (percent) {
      if (typeof percent === 'number') {
        wbSplit = Math.max(SPLIT_MIN, Math.min(SPLIT_MAX, percent));
        wbApplySplit();
        wbSaveSplit();
        requestWorkbenchRelayout();
      }
      return wbSplit;
    },
    split3: function (first, second) {
      if (typeof first === 'number' && typeof second === 'number') {
        wbSplit3 = [first, second];
        wbApplySplit();
        wbSaveSplit();
        requestWorkbenchRelayout();
      }
      return wbSplit3.slice();
    },
    state: function () {
      var main = document.querySelector('.app-main:not(.hidden)') || document.querySelector('.app-main');
      var left = main ? main.querySelector(':scope > .left-panel') : null;
      var mid = main ? main.querySelector(':scope > .mid-panel') : null;
      var right = main ? main.querySelector(':scope > .right-panel') : null;
      var name = function (card) {
        var t = card.querySelector('.card-title');
        return t ? $(t).text().trim() : (card.id || card.className);
      };
      return {
        stacked: wbStacked(),
        split: wbSplit,
        split3: wbSplit3.slice(),
        hero: $(main).hasClass('is-queue-empty'),
        template: main ? main.style.gridTemplateColumns : '',
        divider: main ? main.querySelectorAll(':scope > .workbench-divider').length : 0,
        left: wbPanelCards(left).map(function (c) { return wbRole(c) + ':' + name(c); }),
        mid: wbPanelCards(mid).map(function (c) { return wbRole(c) + ':' + name(c); }),
        right: wbPanelCards(right).map(function (c) { return name(c); }),
        leftWidth: left ? Math.round(left.getBoundingClientRect().width) : 0,
        midWidth: mid ? Math.round(mid.getBoundingClientRect().width) : 0,
        rightWidth: right ? Math.round(right.getBoundingClientRect().width) : 0,
        headerActions: (function () {
          var host = document.querySelector('.eab-card-actions');
          return host ? host.children.length : 0;
        })(),
      };
    },
  };
  function shellInit() {
    if (!window.__eabShellInitDone) {
      window.__eabShellInitDone = 1;
      if (window.eabChromeBeforeInit) {
        try { window.eabChromeBeforeInit(); } catch (e) { console.error('[eab] before-init hook failed:', e); }
      }
    }
    buildWorkbench();
  }
  if (document.readyState === 'loading') { $(shellInit); } else { shellInit(); }
})();
