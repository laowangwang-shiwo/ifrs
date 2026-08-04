/* ==============================================
   IAS 1 — Investment Analysis
   NPV / IRR / Payback Period / DCF Value
   ============================================== */

(function () {
  'use strict';

  // ── State ────────────────────────────────────
  var cashFlows = [];
  var discountRate = 10;
  var nextId = 1;

  // ── DOM refs ─────────────────────────────────
  var cfBody    = document.getElementById('cfTableBody');
  var addCfBtn  = document.getElementById('addCfBtn');
  var rateInput = document.getElementById('discountRate');
  var sumNPV    = document.getElementById('sumNPV');
  var sumIRR    = document.getElementById('sumIRR');
  var sumPayback = document.getElementById('sumPayback');
  var sumDCF    = document.getElementById('sumDCF');
  var timeline  = document.getElementById('cfTimeline');
  var warningBanner = document.getElementById('invWarning');
  var warningText   = document.getElementById('invWarningText');

  // ── Init ─────────────────────────────────────
  function init() {
    // Guard: only run when IAS 1 panel elements exist
    if (!cfBody) return;

    // Default: Year 0 only
    addCF(0, 0);

    addCfBtn.addEventListener('click', onAddCF);
    rateInput.addEventListener('input', function () {
      discountRate = parseFloat(rateInput.value) || 0;
      recalcAll();
    });

    renderAllRows();
    recalcAll();
  }

  function onAddCF() {
    var nextYear = cashFlows.length > 0 ? cashFlows[cashFlows.length - 1].year + 1 : 0;
    addCF(nextYear, 0);
  }

  function addCF(year, amount) {
    var cf = { id: nextId++, year: year, amount: amount };
    cashFlows.push(cf);
    appendRow(cf);
  }

  // ── Helpers ──────────────────────────────────
  function fmt(n) {
    if (n == null || isNaN(n) || !isFinite(n)) return '—';
    return Math.abs(n) >= 1e6
      ? Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
      : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  function fmtPct(n) {
    if (n == null || isNaN(n) || !isFinite(n)) return '—';
    return n.toFixed(2) + '%';
  }

  function fmtYears(n) {
    if (n == null || isNaN(n) || !isFinite(n)) return '—';
    return n.toFixed(1) + ' Years';
  }

  // ── Calculation ──────────────────────────────

  function calcNPV(rate) {
    var r = rate / 100;
    var npv = 0;
    for (var i = 0; i < cashFlows.length; i++) {
      npv += cashFlows[i].amount / Math.pow(1 + r, cashFlows[i].year);
    }
    return npv;
  }

  function calcDCF(rate) {
    var r = rate / 100;
    var dcf = 0;
    for (var i = 0; i < cashFlows.length; i++) {
      if (cashFlows[i].year > 0) {
        dcf += cashFlows[i].amount / Math.pow(1 + r, cashFlows[i].year);
      }
    }
    return dcf;
  }

  /**
   * Newton-Raphson IRR solver.
   * Finds r such that NPV(r) = 0.
   */
  function calcIRR() {
    var guess = 0.1;
    var maxIter = 1000;
    var tol = 1e-7;

    for (var iter = 0; iter < maxIter; iter++) {
      var npv = 0, dnpv = 0;
      for (var i = 0; i < cashFlows.length; i++) {
        var t = cashFlows[i].year;
        var cf = cashFlows[i].amount;
        var denom = Math.pow(1 + guess, t);
        npv  += cf / denom;
        dnpv += (-t * cf) / Math.pow(1 + guess, t + 1);
      }

      if (Math.abs(npv) < tol) return guess * 100; // as percentage

      if (Math.abs(dnpv) < 1e-10) return null; // derivative too small, can't converge

      guess = guess - npv / dnpv;

      if (guess < -0.99) guess = -0.99;
      if (guess > 100) guess = 100;
    }

    return null; // did not converge
  }

  function calcPayback() {
    var cum = 0;
    var prevCum = 0;
    var prevYear = 0;

    for (var i = 0; i < cashFlows.length; i++) {
      var cf = cashFlows[i];
      prevCum = cum;
      cum += cf.amount;

      if (cum >= 0 && prevCum < 0) {
        // Interpolate
        var fraction = Math.abs(prevCum) / (cum - prevCum);
        return prevYear + fraction * (cf.year - prevYear);
      }

      prevYear = cf.year;
      prevCum = cum;
    }

    return null; // never pays back
  }

  function recalcAll() {
    var r = discountRate;
    var npv = calcNPV(r);
    var dcf = calcDCF(r);
    var irr = calcIRR();
    var payback = calcPayback();

    // Update summary
    sumNPV.textContent     = fmt(npv);
    sumDCF.textContent     = fmt(dcf);
    sumIRR.textContent     = irr != null ? fmtPct(irr) : '—';
    sumPayback.textContent = payback != null ? fmtYears(payback) : '—';

    // Validation
    var warnings = [];
    if (irr == null) {
      warnings.push('<strong>IRR cannot be determined</strong> for this cash flow pattern.');
    }
    if (payback == null && cashFlows.length > 1) {
      warnings.push('<strong>Payback period not reached.</strong> Cumulative cash flow never turns positive.');
    }

    if (warnings.length > 0) {
      warningText.innerHTML = warnings.map(function (m) { return '<span>' + m + '</span>'; }).join('');
      warningBanner.classList.add('visible');
    } else {
      warningBanner.classList.remove('visible');
    }

    // Timeline
    renderTimeline();
  }

  // ── Timeline ─────────────────────────────────
  function renderTimeline() {
    if (!timeline) return;

    var maxAbs = 0;
    cashFlows.forEach(function (cf) {
      if (Math.abs(cf.amount) > maxAbs) maxAbs = Math.abs(cf.amount);
    });
    if (maxAbs === 0) maxAbs = 1;

    var html = '<div class="timeline-bars">';
    cashFlows.forEach(function (cf) {
      var pct = Math.abs(cf.amount) / maxAbs * 100;
      var cls = cf.amount >= 0 ? 'timeline-bar-positive' : 'timeline-bar-negative';
      html += '<div class="timeline-row">';
      html += '<span class="timeline-label">Year ' + cf.year + '</span>';
      html += '<div class="timeline-bar-track">';
      html += '<div class="timeline-bar ' + cls + '" style="width:' + pct + '%"></div>';
      html += '</div>';
      html += '<span class="timeline-amount">' + fmt(cf.amount) + '</span>';
      html += '</div>';
    });
    html += '</div>';

    timeline.innerHTML = html;
  }

  // ── Render ───────────────────────────────────
  function renderAllRows() {
    cfBody.innerHTML = '';
    cashFlows.forEach(function (cf) { appendRow(cf); });
  }

  function appendRow(cf) {
    var tr = document.createElement('tr');
    tr.setAttribute('data-id', cf.id);

    // Year
    var tdYear = document.createElement('td');
    tdYear.className = 'col-num';
    tdYear.textContent = cf.year;
    tr.appendChild(tdYear);

    // Cash Flow
    var tdCF = document.createElement('td');
    tdCF.className = 'col-qty';
    var inp = document.createElement('input');
    inp.type = 'number';
    inp.step = 'any';
    inp.value = cf.amount;
    inp.addEventListener('input', function () {
      cf.amount = parseFloat(inp.value) || 0;
      recalcAll();
    });
    tdCF.appendChild(inp);
    tr.appendChild(tdCF);

    // Delete
    var tdDel = document.createElement('td');
    tdDel.className = 'col-del';
    var btn = document.createElement('button');
    btn.className = 'wb-row-del';
    btn.textContent = '×';
    btn.title = cf.year === 0 ? 'Year 0 cannot be removed' : 'Remove';
    if (cf.year === 0) {
      btn.style.opacity = '0.25';
      btn.style.cursor = 'not-allowed';
    }
    btn.addEventListener('click', function () {
      if (cf.year === 0) return;        // Year 0 is mandatory
      if (cashFlows.length <= 1) return;
      tr.remove();
      cashFlows = cashFlows.filter(function (c) { return c.id !== cf.id; });
      renumberRows();
      recalcAll();
    });
    tdDel.appendChild(btn);
    tr.appendChild(tdDel);

    cfBody.appendChild(tr);
  }

  /**
   * Renumber all rows: Year 0, 1, 2, ... consecutively.
   * Updates both the data model and the displayed year cells.
   */
  function renumberRows() {
    var rows = cfBody.querySelectorAll('tr');
    rows.forEach(function (row, i) {
      var id = parseInt(row.getAttribute('data-id'));
      var cf = null;
      for (var j = 0; j < cashFlows.length; j++) {
        if (cashFlows[j].id === id) { cf = cashFlows[j]; break; }
      }
      if (cf) cf.year = i;
      // Update display
      var yearCell = row.querySelector('td.col-num');
      if (yearCell) yearCell.textContent = i;
      // Update delete button: only Year 0 is protected
      var delBtn = row.querySelector('.wb-row-del');
      if (delBtn) {
        if (i === 0) {
          delBtn.style.opacity = '0.25';
          delBtn.style.cursor = 'not-allowed';
          delBtn.title = 'Year 0 cannot be removed';
        } else {
          delBtn.style.opacity = '';
          delBtn.style.cursor = '';
          delBtn.title = 'Remove';
        }
      }
    });
  }

  // ── Start ────────────────────────────────────
  init();

})();
