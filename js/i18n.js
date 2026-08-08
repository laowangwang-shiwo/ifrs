/* ==============================================
   IFRS Calculator — Internationalisation (EN / 中文)
   ============================================== */

(function () {
  'use strict';

  // ── Translation dictionary ───────────────────
  // Key = English text (also serves as fallback)
  var dict = {

    // ── Global / Sidebar ─────────────────────────
    'IFRS Calculator':                         { zh: 'IFRS 计算器' },
    'Collapse sidebar':                        { zh: '收起侧栏' },
    'Expand sidebar':                          { zh: '展开侧栏' },
    'Toggle sidebar':                          { zh: '切换侧栏' },
    '🏠 Home':                                  { zh: '🏠 首页' },
    'IAS Standards':                           { zh: 'IAS 准则' },
    'IFRS Standards':                          { zh: 'IFRS 准则' },

    // ── IAS/IFRS Standard names ────────────────
    'IAS 1 — Presentation of Financial Statements':          { zh: 'IAS 1 — 财务报表列报' },
    'IAS 2 — Inventories':                                   { zh: 'IAS 2 — 存货' },
    'IAS 7 — Statement of Cash Flows':                       { zh: 'IAS 7 — 现金流量表' },
    'IAS 8 — Accounting Policies & Estimates':               { zh: 'IAS 8 — 会计政策、会计估计变更' },
    'IAS 10 — Events After Reporting Period':                { zh: 'IAS 10 — 报告期后事项' },
    'IAS 12 — Income Taxes':                                 { zh: 'IAS 12 — 所得税' },
    'IAS 16 — Property, Plant & Equipment':                  { zh: 'IAS 16 — 不动产、厂场和设备' },
    'IAS 19 — Employee Benefits':                            { zh: 'IAS 19 — 雇员福利' },
    'IAS 21 — Foreign Exchange Rates':                       { zh: 'IAS 21 — 汇率变动的影响' },
    'IAS 23 — Borrowing Costs':                              { zh: 'IAS 23 — 借款费用' },
    'IAS 33 — Earnings Per Share':                           { zh: 'IAS 33 — 每股收益' },
    'IAS 36 — Impairment of Assets':                         { zh: 'IAS 36 — 资产减值' },
    'IAS 37 — Provisions & Contingencies':                   { zh: 'IAS 37 — 准备、或有负债和或有资产' },
    'IAS 38 — Intangible Assets':                            { zh: 'IAS 38 — 无形资产' },
    'IAS 40 — Investment Property':                          { zh: 'IAS 40 — 投资性房地产' },
    'IAS 41 — Agriculture':                                  { zh: 'IAS 41 — 农业' },
    'IFRS 2 — Share-based Payment':                          { zh: 'IFRS 2 — 以股份为基础的支付' },
    'IFRS 3 — Business Combinations':                        { zh: 'IFRS 3 — 企业合并' },
    'IFRS 5 — Non-current Assets Held for Sale':             { zh: 'IFRS 5 — 持有待售的非流动资产' },
    'IFRS 6 — Mineral Resources':                            { zh: 'IFRS 6 — 矿产资源的勘探和评价' },
    'IFRS 9 — Financial Instruments':                        { zh: 'IFRS 9 — 金融工具' },
    'IFRS 10 — Consolidated Financial Statements':           { zh: 'IFRS 10 — 合并财务报表' },
    'IFRS 13 — Fair Value Measurement':                      { zh: 'IFRS 13 — 公允价值计量' },
    'IFRS 15 — Revenue from Contracts':                      { zh: 'IFRS 15 — 客户合同收入' },
    'IFRS 16 — Leases':                                      { zh: 'IFRS 16 — 租赁' },

    // ── Panel headings (may differ from sidebar) ─
    'IAS 8 — Accounting Policies, Changes in Estimates & Errors':  { zh: 'IAS 8 — 会计政策、会计估计变更和差错' },
    'IAS 10 — Events After the Reporting Period':                  { zh: 'IAS 10 — 报告期后事项' },
    'IAS 21 — The Effects of Changes in Foreign Exchange Rates':   { zh: 'IAS 21 — 汇率变动的影响' },
    'IAS 37 — Provisions, Contingent Liabilities & Assets':        { zh: 'IAS 37 — 准备、或有负债和或有资产' },
    'IFRS 6 — Exploration for Mineral Resources':                  { zh: 'IFRS 6 — 矿产资源的勘探和评价' },
    'IFRS 15 — Revenue from Contracts with Customers':             { zh: 'IFRS 15 — 客户合同收入' },

    // ── Placeholder panels ──────────────────────
    '📋 Coming soon':                            { zh: '📋 即将推出' },
    '📅 Coming soon':                            { zh: '📅 即将推出' },
    '💰 Coming soon':                            { zh: '💰 即将推出' },
    '🏭 Coming soon':                            { zh: '🏭 即将推出' },
    '👥 Coming soon':                            { zh: '👥 即将推出' },
    '💱 Coming soon':                            { zh: '💱 即将推出' },
    '🏦 Coming soon':                            { zh: '🏦 即将推出' },
    '📊 Coming soon':                            { zh: '📊 即将推出' },
    '⚠️ Coming soon':                            { zh: '⚠️ 即将推出' },
    '🔮 Coming soon':                            { zh: '🔮 即将推出' },
    '💡 Coming soon':                            { zh: '💡 即将推出' },
    '🏢 Coming soon':                            { zh: '🏢 即将推出' },
    '🌾 Coming soon':                            { zh: '🌾 即将推出' },
    '📝 Coming soon':                            { zh: '📝 即将推出' },
    '🤝 Coming soon':                            { zh: '🤝 即将推出' },
    '🏷️ Coming soon':                            { zh: '🏷️ 即将推出' },
    '⛏️ Coming soon':                            { zh: '⛏️ 即将推出' },
    '💹 Coming soon':                            { zh: '💹 即将推出' },
    '🏛️ Coming soon':                            { zh: '🏛️ 即将推出' },
    '⚖️ Coming soon':                            { zh: '⚖️ 即将推出' },
    '📑 Coming soon':                            { zh: '📑 即将推出' },
    '🔑 Coming soon':                            { zh: '🔑 即将推出' },

    // ── IAS 2 — Inventory ───────────────────────
    'Inventory Management':                     { zh: '存货管理' },
    'Track inventory transactions and automatically calculate inventory value, COGS, revenue and profit based on IAS 2 inventory costing methods.': { zh: '记录存货交易，并基于 IAS 2 成本计算方法自动计算存货价值、销售成本、收入和利润。' },
    'Costing Method':                           { zh: '成本计算方法' },
    '#':                                        { zh: '序号' },
    'Type':                                     { zh: '类型' },
    'Date':                                     { zh: '日期' },
    'Unit Price':                               { zh: '单价' },
    'Quantity':                                 { zh: '数量' },
    'Transaction Value':                        { zh: '交易金额' },
    'Inventory Quantity':                       { zh: '库存数量' },
    'Inventory Value':                          { zh: '库存价值' },
    '+ Add Transaction':                        { zh: '+ 添加交易' },
    'Delete transaction':                       { zh: '删除交易' },
    'Remaining Inventory Layers':               { zh: '剩余库存层' },
    'Layer':                                    { zh: '层级' },
    'Unit Cost':                                { zh: '单位成本' },
    'Total Cost':                               { zh: '总成本' },
    'No remaining layers':                      { zh: '无剩余库存层' },
    'Total':                                    { zh: '合计' },
    'Period Summary':                           { zh: '期间摘要' },
    'Average Cost':                             { zh: '平均成本' },
    'Revenue':                                  { zh: '收入' },
    'COGS':                                     { zh: '销售成本' },
    'Gross Profit':                             { zh: '毛利润' },
    'Ending Inventory Quantity':                { zh: '期末库存数量' },
    'Ending Inventory Value':                   { zh: '期末库存价值' },
    'Gross Margin %':                           { zh: '毛利率' },
    'N/A':                                      { zh: '不适用' },
    'Write-down amount':                        { zh: '减值金额' },
    'Transaction date cannot be earlier than the previous row.': { zh: '交易日期不得早于前一行。' },

    // ── IAS 2 — Transaction types ──────────────
    'OPEN — Opening Inventory':                 { zh: 'OPEN — 期初库存' },
    'PURCHASE — Purchase':                      { zh: 'PURCHASE — 采购' },
    'SALE — Sale':                              { zh: 'SALE — 销售' },
    'DAMAGE — Loss / Scrap':                    { zh: 'DAMAGE — 损耗/报废' },
    'WRITE-DOWN — IAS 2 Impairment':            { zh: 'WRITE-DOWN — IAS 2 减值' },

    // ── IAS 2 — Validation warnings ────────────
    '⚠ Insufficient inventory.':               { zh: '⚠ 库存不足。' },
    'Sale or damage quantity exceeds available stock. The excess units were not fulfilled — review transaction quantities.': { zh: '销售或损耗数量超出可用库存，超出部分未被执行——请检查交易数量。' },
    '⚠ Negative inventory detected.':           { zh: '⚠ 检测到负库存。' },
    'Some transactions have caused inventory quantity to drop below zero. Review sale and damage quantities.': { zh: '部分交易导致库存数量低于零，请检查销售和损耗数量。' },

    // ── IAS 1 — Investment ─────────────────────
    'Investment Analysis':                      { zh: '投资分析' },
    'Evaluate investment projects using discounted cash flow techniques.': { zh: '使用折现现金流技术评估投资项目。' },
    'Cash Flow Schedule':                       { zh: '现金流量表' },
    'Year':                                     { zh: '年' },
    'Cash Flow':                                { zh: '现金流' },
    '+ Add Cash Flow':                          { zh: '+ 添加现金流' },
    'Assumptions':                              { zh: '假设参数' },
    'Discount Rate (%)':                        { zh: '折现率 (%)' },
    'Cash Flow Timeline':                       { zh: '现金流时间线' },
    'Payback Period':                           { zh: '投资回收期' },
    'DCF Value':                                { zh: 'DCF 价值' },
    'Year 0 cannot be removed':                 { zh: '第 0 年不可删除' },
    'Remove':                                   { zh: '删除' },
    'IRR cannot be determined':                 { zh: 'IRR 无法确定' },
    'for this cash flow pattern.':              { zh: '，当前现金流模式下无法计算。' },
    'Payback period not reached.':              { zh: '未达到回收期。' },
    'Cumulative cash flow never turns positive.': { zh: '累计现金流始终为负。' },

    // ── IAS 7 — Cash Flow Statement ────────────
    'Cash Flow Statement Builder':              { zh: '现金流量表编制' },
    'Build and reconcile cash flow statements using both direct and indirect methods.': { zh: '使用直接法和间接法编制并调节现金流量表。' },
    'Operating Activities':                     { zh: '经营活动' },
    'Investing Activities':                     { zh: '投资活动' },
    'Financing Activities':                     { zh: '筹资活动' },
    'Cash Flow Summary':                        { zh: '现金流量汇总' },
    'Direct Method':                            { zh: '直接法' },
    'Indirect Method':                          { zh: '间接法' },
    'Net Cash from Operating Activities':       { zh: '经营活动现金净额' },
    'Net Cash from Investing Activities':       { zh: '投资活动现金净额' },
    'Net Cash from Financing Activities':       { zh: '筹资活动现金净额' },
    'Net Increase / Decrease in Cash':          { zh: '现金净增加/减少' },
    'Closing Cash and Cash Equivalents':        { zh: '期末现金及现金等价物' },
    'Opening Cash and Cash Equivalents':        { zh: '期初现金及现金等价物' },

    // ── IAS 7 — Reconciliation ─────────────────
    'Reconciled':                               { zh: '已调节' },
    '— Direct and Indirect methods produce the same operating cash flow.': { zh: '—— 直接法与间接法产生的经营活动现金流量一致。' },
    'Difference Detected':                      { zh: '检测到差异' },
    'Direct OCF':                               { zh: '直接法 OCF' },
    'Indirect OCF':                             { zh: '间接法 OCF' },
    'Difference':                               { zh: '差异' },

    // ── IAS 7 — Field labels (科目名称) ────────
    'Cash Received from Customers':             { zh: '从客户收到的现金' },
    'Cash Paid to Suppliers':                   { zh: '向供应商支付的现金' },
    'Cash Paid to Employees':                   { zh: '向员工支付的现金' },
    'Interest Paid':                            { zh: '支付的利息' },
    'Income Tax Paid':                          { zh: '支付的所得税' },
    'Net Profit':                               { zh: '净利润' },
    'Depreciation':                             { zh: '折旧' },
    'Amortization':                             { zh: '摊销' },
    'Impairment Loss':                          { zh: '减值损失' },
    'Gain on Disposal':                         { zh: '处置收益' },
    'Loss on Disposal':                         { zh: '处置损失' },
    'Increase / Decrease in Inventory':         { zh: '存货增加/减少' },
    'Increase / Decrease in Receivables':       { zh: '应收账款增加/减少' },
    'Increase / Decrease in Payables':          { zh: '应付账款增加/减少' },
    'Purchase of PPE':                          { zh: '购买不动产、厂场和设备' },
    'Sale of PPE':                              { zh: '出售不动产、厂场和设备' },
    'Purchase of Investments':                  { zh: '购买投资' },
    'Sale of Investments':                      { zh: '出售投资' },
    'Loans Advanced':                           { zh: '发放贷款' },
    'Loans Repaid':                             { zh: '收回贷款' },
    'Issue of Shares':                          { zh: '发行股份' },
    'Borrowings Received':                      { zh: '取得借款' },
    'Repayment of Borrowings':                  { zh: '偿还借款' },
    'Dividends Paid':                           { zh: '支付的股利' },
    'Share Buybacks':                           { zh: '股份回购' },

  };

  // ── State ────────────────────────────────────
  var currentLang = localStorage.getItem('ifrs-lang') || 'en';

  // ── Public API ───────────────────────────────
  window.I18N = {

    get lang() { return currentLang; },

    /**
     * Translate a string.
     * Looks up the English text in the dictionary for the current language.
     * Falls back to the key itself (English) if no translation exists.
     */
    t: function (key) {
      if (currentLang === 'en') return key;
      var entry = dict[key];
      return (entry && entry.zh) ? entry.zh : key;
    },

    /**
     * Set language, persist, and refresh the UI.
     */
    setLang: function (lang) {
      currentLang = lang;
      localStorage.setItem('ifrs-lang', lang);
      applyToDOM();
      // Notify all registered listeners to re-render
      (window._i18nListeners || []).forEach(function (fn) { fn(lang); });
    },

    toggle: function () {
      this.setLang(currentLang === 'en' ? 'zh' : 'en');
    },

    /** Register a callback to be invoked on language change */
    onLangChange: function (fn) {
      if (!window._i18nListeners) window._i18nListeners = [];
      window._i18nListeners.push(fn);
    },

    /**
     * Format a number according to current locale.
     */
    fmtNum: function (n, decimals) {
      if (n == null || isNaN(n)) return '—';
      var loc = currentLang === 'zh' ? 'zh-CN' : 'en-US';
      return Number(n).toLocaleString(loc, {
        minimumFractionDigits: decimals != null ? decimals : 2,
        maximumFractionDigits: decimals != null ? decimals : 2
      });
    },

    /**
     * Format an integer according to current locale.
     */
    fmtInt: function (n) {
      if (n == null || isNaN(n)) return '—';
      var loc = currentLang === 'zh' ? 'zh-CN' : 'en-US';
      return Math.round(n).toLocaleString(loc, { maximumFractionDigits: 0 });
    }
  };

  // ── DOM application ──────────────────────────
  // Elements with data-i18n attribute get their textContent translated.
  // Elements with data-i18n-title get their title attribute translated.

  function applyToDOM() {
    // textContent
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      // If no explicit value, use the element's current text as the key
      // and store it so subsequent language switches still work
      if (!key) {
        key = el.textContent.trim();
        el.setAttribute('data-i18n', key);
      }
      el.textContent = window.I18N.t(key);
    });

    // title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (!key) {
        key = el.title;
        el.setAttribute('data-i18n-title', key);
      }
      el.title = window.I18N.t(key);
    });

    // placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (!key) {
        key = el.placeholder;
        el.setAttribute('data-i18n-placeholder', key);
      }
      el.placeholder = window.I18N.t(key);
    });

    // aria-label attribute
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (!key) {
        key = el.getAttribute('aria-label');
        el.setAttribute('data-i18n-aria', key);
      }
      el.setAttribute('aria-label', window.I18N.t(key));
    });

    // Update lang button text — shows the language you can switch TO
    var btn = document.getElementById('langToggle');
    if (btn) btn.textContent = currentLang === 'en' ? '中文' : 'English';

    // Update document title
    document.title = window.I18N.t('IFRS Calculator');
  }

  // ── Initial application ──────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    applyToDOM();
  });

  // Also apply immediately if DOM is already ready
  if (document.readyState !== 'loading') {
    applyToDOM();
  }

})();
