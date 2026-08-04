/* ==============================================
   IAS 2 — Inventory Workbench
   FIFO / LIFO / Weighted Average (Periodic & Perpetual)
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
    layersSection.style.display = (currentMethod === 'fifo' || currentMethod === 'lifo') ? '' : 'none';
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

  function calcWAPeriodic() {
    // First pass: compute single weighted average from all OPEN + PURCHASE
    var totalAvailableCost = 0, totalAvailableUnits = 0;
    transactions.forEach(function (tx) {
      if (tx.type === 'OPEN' || tx.type === 'PURCHASE') {
        var p = parseNum(tx.unitPrice);
        var q = parseNum(tx.quantity);
        totalAvailableCost += p * q;
        totalAvailableUnits += q;
      }
    });
    var avgCost = totalAvailableUnits > 0 ? totalAvailableCost / totalAvailableUnits : 0;

    var runningQty = 0;
    var totalRevenue = 0, totalCOGS = 0;
    var cumulativeWriteDown = 0;
    var results = [];

    transactions.forEach(function (tx) {
      var price = parseNum(tx.unitPrice);
      var qty   = parseNum(tx.quantity);
      var txVal = 0, cogs = 0;

      if (tx.type === 'OPEN' || tx.type === 'PURCHASE') {
        runningQty += qty;
        txVal = price * qty;
      } else if (tx.type === 'SALE') {
        runningQty -= qty;
        cogs = qty * avgCost;
        txVal = price * qty;
        totalRevenue += txVal;
        totalCOGS += cogs;
      } else if (tx.type === 'DAMAGE') {
        runningQty -= qty;
        cogs = qty * avgCost;
        txVal = cogs;
      } else if (tx.type === 'WRITE_DOWN') {
        cumulativeWriteDown += price;
        txVal = price;
      }

      var invQty = runningQty;
      var invVal = runningQty * avgCost - cumulativeWriteDown;
      results.push({
        id: tx.id,
        txValue: txVal,
        cogs: cogs,
        revenue: tx.type === 'SALE' ? txVal : 0,
        invQty: invQty,
        invVal: invVal,
        layers: []
      });
    });

    return { results: results, layers: [], totalRevenue: totalRevenue, totalCOGS: totalCOGS, avgCost: avgCost };
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
      case 'wa-periodic':  return calcWAPeriodic();
      case 'wa-perpetual': return calcWAPerpetual();
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

  function buildDateCell(tx) {
    var td = ce('td', 'col-date');
    var inp = ce('input');
    inp.type = 'date';
    inp.value = tx.date;
    inp.addEventListener('change', function () {
      tx.date = inp.value;
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
    var last = calcResult.results.length > 0 ? calcResult.results[calcResult.results.length - 1] : null;
    var revenue = calcResult.totalRevenue;
    var cogs = calcResult.totalCOGS;
    var gp = revenue - cogs;
    var gm = revenue > 0 ? (gp / revenue) * 100 : 0;

    sumEndQty.textContent  = last ? fmtInt(last.invQty) : '—';
    sumEndVal.textContent  = last ? fmt(last.invVal) : '—';
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
