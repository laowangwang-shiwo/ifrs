/* ==============================================
   IAS 7 — Cash Flow Statement Builder
   Direct Method / Indirect Method / Reconciliation
   ============================================== */

(function () {
  'use strict';

  // ── Guard ────────────────────────────────────
  if (!document.getElementById('cfDirectInputs')) return;

  // ── Data model ───────────────────────────────
  // Each field: { id, label, sign: +1 inflow / -1 outflow, value }
  // User always enters positive numbers; sign determines cash direction.

  var directFields = [
    { id: 'cashFromCustomers',  label: 'Cash Received from Customers',  sign:  1 },
    { id: 'cashToSuppliers',    label: 'Cash Paid to Suppliers',        sign: -1 },
    { id: 'cashToEmployees',    label: 'Cash Paid to Employees',        sign: -1 },
    { id: 'interestPaid_dir',   label: 'Interest Paid',                 sign: -1 },
    { id: 'incomeTaxPaid_dir',  label: 'Income Tax Paid',               sign: -1 }
  ];

  var indirectFields = [
    { id: 'netProfit',          label: 'Net Profit',                          sign:  1 },
    { id: 'depreciation',       label: 'Depreciation',                        sign:  1 },
    { id: 'amortization',       label: 'Amortization',                        sign:  1 },
    { id: 'impairmentLoss',     label: 'Impairment Loss',                     sign:  1 },
    { id: 'gainOnDisposal',     label: 'Gain on Disposal',                    sign: -1 },
    { id: 'lossOnDisposal',     label: 'Loss on Disposal',                    sign:  1 },
    { id: 'deltaInventory',     label: 'Increase / Decrease in Inventory',    sign: -1 },
    { id: 'deltaReceivables',   label: 'Increase / Decrease in Receivables',  sign: -1 },
    { id: 'deltaPayables',      label: 'Increase / Decrease in Payables',     sign:  1 },
    { id: 'interestPaid_ind',   label: 'Interest Paid',                       sign: -1 },
    { id: 'incomeTaxPaid_ind',  label: 'Income Tax Paid',                     sign: -1 }
  ];

  var investingFields = [
    { id: 'purchasePPE',        label: 'Purchase of PPE',               sign: -1 },
    { id: 'salePPE',            label: 'Sale of PPE',                   sign:  1 },
    { id: 'purchaseInvestments',label: 'Purchase of Investments',       sign: -1 },
    { id: 'saleInvestments',    label: 'Sale of Investments',           sign:  1 },
    { id: 'loansAdvanced',      label: 'Loans Advanced',                sign: -1 },
    { id: 'loansRepaid',        label: 'Loans Repaid',                  sign:  1 }
  ];

  var financingFields = [
    { id: 'issueShares',        label: 'Issue of Shares',               sign:  1 },
    { id: 'borrowingsReceived', label: 'Borrowings Received',           sign:  1 },
    { id: 'repaymentBorrowings',label: 'Repayment of Borrowings',       sign: -1 },
    { id: 'dividendsPaid',      label: 'Dividends Paid',                sign: -1 },
    { id: 'shareBuybacks',      label: 'Share Buybacks',                sign: -1 }
  ];

  var cashFields = [
    { id: 'openingCash',        label: 'Opening Cash and Cash Equivalents', sign: 1 }
  ];

  // values stored by id
  var values = {};

  // ── Init ─────────────────────────────────────
  function init() {
    // Initialise all values to 0
    [directFields, indirectFields, investingFields, financingFields, cashFields].forEach(function (list) {
      list.forEach(function (f) { values[f.id] = 0; });
    });

    renderInputs('cfDirectInputs',    directFields);
    renderInputs('cfIndirectInputs',  indirectFields);
    renderInputs('cfInvestingInputs', investingFields);
    renderInputs('cfFinancingInputs', financingFields);
    renderInputs('cfCashInputs',      cashFields);

    recalcAll();
  }

  function renderInputs(containerId, fieldList) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    fieldList.forEach(function (f) {
      var row = document.createElement('div');
      row.className = 'cf-input-row';

      var label = document.createElement('label');
      label.textContent = I18N.t(f.label);
      row.appendChild(label);

      var inp = document.createElement('input');
      inp.type = 'number';
      inp.step = 'any';
      inp.value = values[f.id] || 0;
      inp.setAttribute('data-field', f.id);
      inp.addEventListener('input', function () {
        values[f.id] = parseFloat(inp.value) || 0;
        recalcAll();
      });
      row.appendChild(inp);

      container.appendChild(row);
    });
  }

  // ── Computation ──────────────────────────────

  function sumFields(fieldList) {
    var total = 0;
    fieldList.forEach(function (f) {
      total += (values[f.id] || 0) * f.sign;
    });
    return total;
  }

  function getVal(id) { return values[id] || 0; }

  function recalcAll() {
    var directOCF   = sumFields(directFields);
    var indirectOCF = sumFields(indirectFields);
    var investingCF = sumFields(investingFields);
    var financingCF = sumFields(financingFields);
    var openingCash = getVal('openingCash');
    var netChange   = directOCF + investingCF + financingCF;
    var closingCash = openingCash + netChange;

    // Update displays
    document.getElementById('cfDirectOCF').textContent   = fmt(directOCF);
    document.getElementById('cfIndirectOCF').textContent  = fmt(indirectOCF);
    document.getElementById('cfInvestingCF').textContent  = fmt(investingCF);
    document.getElementById('cfFinancingCF').textContent  = fmt(financingCF);
    document.getElementById('cfClosingCash').textContent   = fmt(closingCash);

    var netEl = document.getElementById('cfNetChange');
    if (netEl) netEl.textContent = fmt(netChange);

    // Reconciliation
    var diff = directOCF - indirectOCF;
    var recIcon  = document.getElementById('cfReconcileIcon');
    var recText  = document.getElementById('cfReconcileText');
    var recBlock = document.getElementById('cfReconcile');

    if (Math.abs(diff) < 0.005) {
      recBlock.className = 'cf-reconcile cf-reconcile-ok';
      recIcon.textContent = '✅';
      recText.innerHTML = '<strong>' + I18N.t('Reconciled') + '</strong> ' + I18N.t('— Direct and Indirect methods produce the same operating cash flow.');
    } else {
      recBlock.className = 'cf-reconcile cf-reconcile-err';
      recIcon.textContent = '⚠';
      recText.innerHTML = '<strong>' + I18N.t('Difference Detected') + '</strong> &nbsp; ' + I18N.t('Direct OCF') + ': <b>' + fmt(directOCF) + '</b> &nbsp;|&nbsp; ' + I18N.t('Indirect OCF') + ': <b>' + fmt(indirectOCF) + '</b> &nbsp;|&nbsp; ' + I18N.t('Difference') + ': <b>' + fmt(diff) + '</b>';
    }
  }

  // ── Helpers ──────────────────────────────────
  function fmt(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  // ── Language change handler ─────────────────
  I18N.onLangChange(function () {
    renderInputs('cfDirectInputs',    directFields);
    renderInputs('cfIndirectInputs',  indirectFields);
    renderInputs('cfInvestingInputs', investingFields);
    renderInputs('cfFinancingInputs', financingFields);
    renderInputs('cfCashInputs',      cashFields);
    recalcAll(); // update reconciliation text
  });

  // ── Start ────────────────────────────────────
  init();

})();
