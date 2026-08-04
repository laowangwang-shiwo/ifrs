/* ==============================================
   IAS 2 — Inventory Workbench
   FIFO / LIFO / Average (Perpetual, Weekly, Monthly, Yearly)
   ============================================== */

(function () {
  'use strict';

  // ── State ────────────────────────────────────
  let transactions = [];
  let currentMethod = 'fifo';
  let nextId = 1;

  // ── DOM refs ─────────────────────────────────
  const methodSelect  = document.getElementById('costingMethod');
  const tableBody     = document.getElementById('tableBody');
  const addBtn        = document.getElementById('addTransactionBtn');
  const layersSection = document.getElementById('layersSection');
  const layersTbody   = document.getElementById('layersTableBody');

  // Summary cells
  const sumEndQty = document.getElementById('sumEndQty');
  const sumEndVal = document.getElementById('sumEndVal');
  const sumRevenue = document.getElementById('sumRevenue');
  const sumCOGS  = document.getElementById('sumCOGS');
  const sumGP    = document.getElementById('sumGP');
  const sumGM    = document.getElementById('sumGM');

  // ── Init ─────────────────────────────────────
  function init() {
    addTransaction('OPEN');
    methodSelect.addEventListener('change', onMethodChange);
    addBtn.addEventListener('click', onAddClick);
    renderAllRows();
    recalcAndUpdate();
  }

  function onMethodChange() {
    currentMethod = methodSelect.value;
    var isLayered = currentMethod === 'fifo' || currentMethod === 'lifo';
    layersSection.style.display = isLayered ? '' : 'none';
    recalcAndUpdate();
  }

  function onAddClick() {
    addTransaction('PURCHASE');
  }

  function addTransaction(type) {
    var today = new Date().toISOString().slice(0, 10);
    var tx = {
      id: nextId++,
      type: type,
      date: today,
      unitPrice: type === 'DAMAGE' ? '' : '',
      quantity:  type === 'WRITE_DOWN' ? '' : ''
    };
    transactions.push(tx);
    appendRow(tx);
    recalcAndUpdate();
  }

  // ── Helpers ──────────────────────────────────
  function fmt(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toFixed(2);
  }

  function fmtInt(n) {
    if (n == null || isNaN(n)) return '—';
    return Math.round(n).toString();
  }

  function fmtPct(n) {
    if (n == null || isNaN(n)) return '—';
    return n.toFixed(1) + '%';
  }

  function parseNum(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  // ── Layer helpers ────────────────────────────
  function layersTotalQty(lyrs) {
    return lyrs.reduce(function (s, l) { return s + l.qty; }, 0);
  }
  function layersTotalVal(lyrs) {
    return lyrs.reduce(function (s, l) { return s + l.qty * l.cost; }, 0);
  }
  function cloneLayers(lyrs) {
    return lyrs.map(function (l) { return { qty: l.qty, cost: l.cost }; });
  }

  // ── Period key functions ────────────────────

  /**
   * ISO Week: "2025-W01", "2026-W52" etc.
   * Uses Date.UTC so the date components are treated literally
   * (local date = displayed date, no timezone shift).
   */
  function getISOWeekKey(dateStr) {
    if (!dateStr) return '0000-W00';
    var parts = dateStr.split('-');
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10) - 1;
    var d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return '0000-W00';

    // Construct as UTC so date components are exact — 所见即所得
    var dt = new Date(Date.UTC(y, m, d));
    var dayOfWeek = dt.getUTCDay() || 7; // Mon=1 … Sun=7
    // Move to Thursday of this week
    dt.setUTCDate(d + 4 - dayOfWeek);
    var isoYear = dt.getUTCFullYear();
    var jan1 = new Date(Date.UTC(isoYear, 0, 1));
    var weekNum = Math.ceil(((dt - jan1) / 86400000 + 1) / 7);
    return isoYear + '-W' + String(weekNum).padStart(2, '0');
  }

  function getMonthKey(dateStr) {
    if (!dateStr) return '0000-00';
    return dateStr.slice(0, 7); // "2025-03"
  }

  function getYearKey(dateStr) {
    if (!dateStr) return '0000';
    return dateStr.slice(0, 4); // "2025"
  }

  // ── Calculation engines ──────────────────────

  function calcFIFO() {
    var layers = [];
    var totalRevenue = 0, totalCOGS = 0;
    var cumulativeWD = 0;
    var results = [];

    transactions.forEach(function (tx) {
      var price = parseNum(tx.unitPrice);
      var qty   = parseNum(tx.quantity);
      var txVal = 0, cogs = 0;

      if (tx.type === 'OPEN' || tx.type === 'PURCHASE') {
        layers.push({ qty: qty, cost: price });
        txVal = price * qty;
      } else if (tx.type === 'SALE') {
        cogs = depleteLayers(layers, qty, 'oldest');
        txVal = price * qty;
        totalRevenue += txVal;
        totalCOGS += cogs;
      } else if (tx.type === 'DAMAGE') {
        cogs = depleteLayers(layers, qty, 'oldest');
        txVal = cogs;
      } else if (tx.type === 'WRITE_DOWN') {
        cumulativeWD += price;
        txVal = price;
      }

      var invQty = layersTotalQty(layers);
      var invVal = layersTotalVal(layers) - cumulativeWD;
      results.push({
        id: tx.id,
        txValue: txVal,
        cogs: cogs,
        revenue: tx.type === 'SALE' ? txVal : 0,
        invQty: invQty,
        invVal: invVal,
        layers: cloneLayers(layers)
      });
    });

    return { results: results, layers: layers, totalRevenue: totalRevenue, totalCOGS: totalCOGS };
  }

  function calcLIFO() {
    var layers = [];
    var totalRevenue = 0, totalCOGS = 0;
    var cumulativeWD = 0;
    var results = [];

    transactions.forEach(function (tx) {
      var price = parseNum(tx.unitPrice);
      var qty   = parseNum(tx.quantity);
      var txVal = 0, cogs = 0;

      if (tx.type === 'OPEN' || tx.type === 'PURCHASE') {
        layers.push({ qty: qty, cost: price });
        txVal = price * qty;
      } else if (tx.type === 'SALE') {
        cogs = depleteLayers(layers, qty, 'newest');
        txVal = price * qty;
        totalRevenue += txVal;
        totalCOGS += cogs;
      } else if (tx.type === 'DAMAGE') {
        cogs = depleteLayers(layers, qty, 'newest');
        txVal = cogs;
      } else if (tx.type === 'WRITE_DOWN') {
        cumulativeWD += price;
        txVal = price;
      }

      var invQty = layersTotalQty(layers);
      var invVal = layersTotalVal(layers) - cumulativeWD;
      results.push({
        id: tx.id,
        txValue: txVal,
        cogs: cogs,
        revenue: tx.type === 'SALE' ? txVal : 0,
        invQty: invQty,
        invVal: invVal,
        layers: cloneLayers(layers)
      });
    });

    return { results: results, layers: layers, totalRevenue: totalRevenue, totalCOGS: totalCOGS };
  }

  /**
   * Generic Periodic Weighted Average.
   * Groups transactions by period (week / month / year),
   * computes period avgCost from (beginning inventory + period OPEN/PURCHASE),
   * then applies that avgCost to all SALE/DAMAGE within the period.
   *
   * @param getPeriodKey  function(dateStr) → period key string
   */
  function calcPeriodicWA(getPeriodKey) {
    // 1. Group transactions by period key, preserving original index
    var groups = [];
    var groupMap = {};

    transactions.forEach(function (tx, idx) {
      var key = getPeriodKey(tx.date);
      if (!groupMap[key]) {
        var g = { key: key, entries: [] };
        groupMap[key] = g;
        groups.push(g);
      }
      groupMap[key].entries.push({ tx: tx, idx: idx });
    });

    // 2. Sort groups by period key (chronological)
    groups.sort(function (a, b) { return a.key < b.key ? -1 : a.key > b.key ? 1 : 0; });

    // 3. Process each period
    var resultMap = {};
    var runningQty = 0, runningVal = 0;
    var totalRevenue = 0, totalCOGS = 0;

    groups.forEach(function (group) {
      // Beginning inventory for this period = carry-over from previous period
      var begQty = runningQty;
      var begVal = runningVal;

      // Gather period's OPEN + PURCHASE
      var periodPurchQty = 0, periodPurchVal = 0;
      group.entries.forEach(function (e) {
        var t = e.tx;
        if (t.type === 'OPEN' || t.type === 'PURCHASE') {
          var p = parseNum(t.unitPrice), q = parseNum(t.quantity);
          periodPurchQty += q;
          periodPurchVal += p * q;
        }
      });

      // Period average cost
      var availableQty = begQty + periodPurchQty;
      var availableVal = begVal + periodPurchVal;
      var avgCost = availableQty > 0 ? availableVal / availableQty : 0;

      // Process each transaction in this period
      group.entries.forEach(function (e) {
        var tx = e.tx;
        var price = parseNum(tx.unitPrice);
        var qty   = parseNum(tx.quantity);
        var txVal = 0, cogs = 0, revenue = 0;

        if (tx.type === 'OPEN' || tx.type === 'PURCHASE') {
          runningQty += qty;
          runningVal += price * qty;
          txVal = price * qty;
        } else if (tx.type === 'SALE') {
          cogs = qty * avgCost;
          runningQty -= qty;
          runningVal -= cogs;
          txVal = price * qty;
          revenue = txVal;
          totalRevenue += revenue;
          totalCOGS += cogs;
        } else if (tx.type === 'DAMAGE') {
          cogs = qty * avgCost;
          runningQty -= qty;
          runningVal -= cogs;
          txVal = cogs;
        } else if (tx.type === 'WRITE_DOWN') {
          runningVal -= price;
          txVal = price;
        }

        resultMap[tx.id] = {
          id: tx.id,
          txValue: txVal,
          cogs: cogs,
          revenue: revenue,
          invQty: runningQty,
          invVal: runningVal,
          layers: []
        };
      });
    });

    // 4. Build results in original transaction order
    var results = transactions.map(function (tx) { return resultMap[tx.id]; });

    return {
      results: results,
      layers: [],
      totalRevenue: totalRevenue,
      totalCOGS: totalCOGS,
      endQty: runningQty,   // final state after all periods processed
      endVal: runningVal
    };
  }

  function calcWAPerpetual() {
    var runningQty = 0, runningVal = 0;
    var totalRevenue = 0, totalCOGS = 0;
    var results = [];

    transactions.forEach(function (tx) {
      var price = parseNum(tx.unitPrice);
      var qty   = parseNum(tx.quantity);
      var txVal = 0, cogs = 0;

      if (tx.type === 'OPEN' || tx.type === 'PURCHASE') {
        runningVal += price * qty;
        runningQty += qty;
        txVal = price * qty;
      } else if (tx.type === 'SALE') {
        var avg = runningQty > 0 ? runningVal / runningQty : 0;
        cogs = qty * avg;
        runningVal -= cogs;
        runningQty -= qty;
        txVal = price * qty;
        totalRevenue += txVal;
        totalCOGS += cogs;
      } else if (tx.type === 'DAMAGE') {
        var avgD = runningQty > 0 ? runningVal / runningQty : 0;
        cogs = qty * avgD;
        runningVal -= cogs;
        runningQty -= qty;
        txVal = cogs;
      } else if (tx.type === 'WRITE_DOWN') {
        runningVal -= price;
        txVal = price;
      }

      results.push({
        id: tx.id,
        txValue: txVal,
        cogs: cogs,
        revenue: tx.type === 'SALE' ? txVal : 0,
        invQty: runningQty,
        invVal: runningVal,
        layers: []
      });
    });

    return { results: results, layers: [], totalRevenue: totalRevenue, totalCOGS: totalCOGS };
  }

  /**
   * Deplete layers by quantity.
   * @param layers  Array of {qty, cost}
   * @param qty     Quantity to deplete
   * @param order   'oldest' (FIFO) or 'newest' (LIFO)
   * @returns Total cost of depleted units
   */
  function depleteLayers(layers, qty, order) {
    var remaining = qty;
    var totalCost = 0;
    while (remaining > 0 && layers.length > 0) {
      var idx = order === 'oldest' ? 0 : layers.length - 1;
      var layer = layers[idx];
      var taken = Math.min(remaining, layer.qty);
      totalCost += taken * layer.cost;
      layer.qty -= taken;
      remaining -= taken;
      if (layer.qty <= 0) layers.splice(idx, 1);
    }
    return totalCost;
  }

  // ── Master recalculation ─────────────────────
  function runCalc() {
    switch (currentMethod) {
      case 'fifo':         return calcFIFO();
      case 'lifo':         return calcLIFO();
      case 'wa-perpetual': return calcWAPerpetual();
      case 'wa-weekly':    return calcPeriodicWA(getISOWeekKey);
      case 'wa-monthly':   return calcPeriodicWA(getMonthKey);
      case 'wa-yearly':    return calcPeriodicWA(getYearKey);
      default:             return calcFIFO();
    }
  }

  // ── Render ───────────────────────────────────

  /** Full rebuild of table rows (only when adding/deleting) */
  function renderAllRows() {
    tableBody.innerHTML = '';
    transactions.forEach(function (tx, i) {
      appendRow(tx);
    });
  }

  /** Append a single row to the table */
  function appendRow(tx) {
    var row = document.createElement('tr');
    row.setAttribute('data-id', tx.id);

    // #
    var tdNum = ce('td', 'col-num');
    tdNum.textContent = transactions.indexOf(tx) + 1;
    row.appendChild(tdNum);

    // Type
    row.appendChild(buildTypeCell(tx));

    // Date
    row.appendChild(buildDateCell(tx));

    // Unit Price
    row.appendChild(buildPriceCell(tx));

    // Quantity
    row.appendChild(buildQtyCell(tx));

    // Transaction Value (computed)
    var tdTxVal = ce('td', 'col-txval cell-computed');
    tdTxVal.setAttribute('data-field', 'txValue');
    tdTxVal.textContent = '—';
    row.appendChild(tdTxVal);

    // Inventory Quantity (computed)
    var tdInvQty = ce('td', 'col-invqty cell-computed');
    tdInvQty.setAttribute('data-field', 'invQty');
    tdInvQty.textContent = '—';
    row.appendChild(tdInvQty);

    // Inventory Value (computed)
    var tdInvVal = ce('td', 'col-invval cell-computed');
    tdInvVal.setAttribute('data-field', 'invVal');
    tdInvVal.textContent = '—';
    row.appendChild(tdInvVal);

    // Delete button
    var tdDel = ce('td', 'col-del');
    var btnDel = ce('button', 'wb-row-del');
    btnDel.textContent = '×';
    btnDel.title = 'Delete transaction';
    btnDel.addEventListener('click', function () { deleteTx(tx.id); });
    tdDel.appendChild(btnDel);
    row.appendChild(tdDel);

    tableBody.appendChild(row);
  }

  function buildTypeCell(tx) {
    var td = ce('td', 'col-type');
    var sel = ce('select', 'wb-select');
    var types = [
      {v:'OPEN',       t:'OPEN — Opening Inventory'},
      {v:'PURCHASE',   t:'PURCHASE — Purchase'},
      {v:'SALE',       t:'SALE — Sale'},
      {v:'DAMAGE',     t:'DAMAGE — Loss / Scrap'},
      {v:'WRITE_DOWN', t:'WRITE-DOWN — IAS 2 Impairment'}
    ];
    types.forEach(function (opt) {
      var o = ce('option');
      o.value = opt.v;
      o.textContent = opt.t;
      if (tx.type === opt.v) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () {
      tx.type = sel.value;
      rebuildRow(tx); // rebuild inputs because field rules changed
      recalcAndUpdate();
    });
    td.appendChild(sel);
    return td;
  }

  /**
   * Enforce date-chain rule: each row's date must be >= previous row's date.
   * If a row's date is earlier, clamp it to the previous row's date.
   * Then cascade forward: push downstream rows' dates up if they now violate.
   */
  function enforceDateChain(changedIdx) {
    // Backward check: clamp to previous row
    if (changedIdx > 0) {
      var prevDate = transactions[changedIdx - 1].date;
      if (transactions[changedIdx].date < prevDate) {
        transactions[changedIdx].date = prevDate;
      }
    }

    // Forward cascade: ensure each row >= its predecessor
    for (var i = changedIdx + 1; i < transactions.length; i++) {
      var prev = transactions[i - 1].date;
      if (transactions[i].date < prev) {
        transactions[i].date = prev;
      }
    }

    // Refresh all date inputs to reflect adjusted values
    var rows = tableBody.querySelectorAll('tr');
    rows.forEach(function (row) {
      var id = parseInt(row.getAttribute('data-id'));
      var tx = null;
      for (var j = 0; j < transactions.length; j++) {
        if (transactions[j].id === id) { tx = transactions[j]; break; }
      }
      if (tx) {
        var dateInput = row.querySelector('td.col-date input');
        if (dateInput) dateInput.value = tx.date;
      }
    });
  }

  function buildDateCell(tx) {
    var td = ce('td', 'col-date');
    var inp = ce('input');
    inp.type = 'date';
    inp.value = tx.date;
    inp.addEventListener('change', function () {
      tx.date = inp.value;
      var idx = -1;
      for (var i = 0; i < transactions.length; i++) {
        if (transactions[i].id === tx.id) { idx = i; break; }
      }
      enforceDateChain(idx);
      recalcAndUpdate();
    });
    td.appendChild(inp);
    return td;
  }

  function buildPriceCell(tx) {
    var td = ce('td', 'col-price');
    var inp = ce('input');
    inp.type = 'number';
    inp.step = '0.01';
    inp.min = '0';
    inp.placeholder = tx.type === 'DAMAGE' ? 'N/A' : (tx.type === 'WRITE_DOWN' ? 'Write-down amount' : '0.00');

    if (tx.unitPrice !== '' && tx.unitPrice != null) inp.value = tx.unitPrice;

    if (tx.type === 'DAMAGE') {
      inp.disabled = true;
      inp.value = '';
    } else {
      inp.disabled = false;
    }

    inp.addEventListener('input', function () {
      tx.unitPrice = inp.value;
      recalcAndUpdate();
    });
    td.appendChild(inp);
    return td;
  }

  function buildQtyCell(tx) {
    var td = ce('td', 'col-qty');
    var inp = ce('input');
    inp.type = 'number';
    inp.step = 'any';
    inp.placeholder = tx.type === 'WRITE_DOWN' ? 'N/A' : '0';

    if (tx.quantity !== '' && tx.quantity != null) inp.value = tx.quantity;

    if (tx.type === 'WRITE_DOWN') {
      inp.disabled = true;
      inp.value = '';
    } else {
      inp.disabled = false;
    }

    inp.addEventListener('input', function () {
      tx.quantity = inp.value;
      recalcAndUpdate();
    });
    td.appendChild(inp);
    return td;
  }

  function rebuildRow(tx) {
    var row = document.querySelector('tr[data-id="' + tx.id + '"]');
    if (!row) return;
    // Replace the type, price, qty cells (cells at index 1,3,4)
    var cells = row.querySelectorAll('td');
    var newType  = buildTypeCell(tx);
    var newPrice = buildPriceCell(tx);
    var newQty   = buildQtyCell(tx);
    cells[1].replaceWith(newType);
    cells[3].replaceWith(newPrice);
    cells[4].replaceWith(newQty);
  }

  function deleteTx(id) {
    if (transactions.length <= 1) return; // keep at least one row
    var row = document.querySelector('tr[data-id="' + id + '"]');
    if (row) row.remove();
    transactions = transactions.filter(function (t) { return t.id !== id; });
    // Renumber rows
    var rows = tableBody.querySelectorAll('tr');
    rows.forEach(function (r, i) {
      r.querySelector('td.col-num').textContent = i + 1;
    });
    recalcAndUpdate();
  }

  /** Update computed cells without rebuilding inputs */
  function updateComputed(calcResult) {
    var rows = tableBody.querySelectorAll('tr');
    rows.forEach(function (row) {
      var id = parseInt(row.getAttribute('data-id'));
      var res = null;
      for (var i = 0; i < calcResult.results.length; i++) {
        if (calcResult.results[i].id === id) { res = calcResult.results[i]; break; }
      }
      if (!res) return;
      row.querySelector('td[data-field="txValue"]').textContent = fmt(res.txValue);
      row.querySelector('td[data-field="invQty"]').textContent  = fmtInt(res.invQty);
      row.querySelector('td[data-field="invVal"]').textContent  = fmt(res.invVal);
    });
  }

  /** Update summary section */
  function updateSummary(calcResult) {
    // Use explicit end state (calcPeriodicWA) or last result's state
    var endQty = calcResult.endQty;
    var endVal = calcResult.endVal;
    if (endQty == null) {
      var last = calcResult.results.length > 0 ? calcResult.results[calcResult.results.length - 1] : null;
      endQty = last ? last.invQty : null;
      endVal = last ? last.invVal : null;
    }

    var revenue = calcResult.totalRevenue;
    var cogs = calcResult.totalCOGS;
    var gp = revenue - cogs;
    var gm = revenue > 0 ? (gp / revenue) * 100 : 0;

    sumEndQty.textContent  = fmtInt(endQty);
    sumEndVal.textContent  = fmt(endVal);
    sumRevenue.textContent = fmt(revenue);
    sumCOGS.textContent    = fmt(cogs);
    sumGP.textContent      = fmt(gp);
    sumGM.textContent      = fmtPct(gm);
  }

  /** Update inventory layers display */
  function updateLayers(calcResult) {
    if (currentMethod !== 'fifo' && currentMethod !== 'lifo') {
      layersSection.style.display = 'none';
      return;
    }
    layersSection.style.display = '';
    var layers = calcResult.layers;
    layersTbody.innerHTML = '';

    if (layers.length === 0) {
      var tr = ce('tr');
      var td = ce('td');
      td.setAttribute('colspan', '4');
      td.style.textAlign = 'center';
      td.style.color = '#94a3b8';
      td.style.padding = '16px';
      td.textContent = 'No remaining layers';
      tr.appendChild(td);
      layersTbody.appendChild(tr);
      return;
    }

    layers.forEach(function (l, i) {
      var tr = ce('tr');
      tr.appendChild(buildTd(i + 1));
      tr.appendChild(buildTd(fmtInt(l.qty)));
      tr.appendChild(buildTd(fmt(l.cost)));
      tr.appendChild(buildTd(fmt(l.qty * l.cost)));
      layersTbody.appendChild(tr);
    });

    // Total row
    var trTotal = ce('tr');
    trTotal.className = 'wb-layers-total';
    trTotal.appendChild(buildTd('Total', true));
    trTotal.appendChild(buildTd(fmtInt(layersTotalQty(layers)), true));
    trTotal.appendChild(buildTd('', true));
    trTotal.appendChild(buildTd(fmt(layersTotalVal(layers)), true));
    layersTbody.appendChild(trTotal);
  }

  function buildTd(text, bold) {
    var td = ce('td');
    td.textContent = text;
    if (bold) td.style.fontWeight = '600';
    return td;
  }

  // ── Orchestration ────────────────────────────
  function recalcAndUpdate() {
    var result = runCalc();
    updateComputed(result);
    updateSummary(result);
    updateLayers(result);
  }

  // ── Utility ──────────────────────────────────
  function ce(tag, cls) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  }

  // ── Start ────────────────────────────────────
  init();

})();
