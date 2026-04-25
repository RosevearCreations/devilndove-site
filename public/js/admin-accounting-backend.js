// File: /public/js/admin-accounting-backend.js
// Brief description: Accounting backend UI with GL mapping, GIFI staging, and DB sanity tools.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('accountingBackendMount');
  if (!mount || !window.DDAuth) return;

  mount.innerHTML = `
    <div class="card">
      <h2 style="margin-top:0">Accounting Backend (Slow T2/GIFI Step)</h2>
      <p class="small">This pass keeps the accounting system moving slowly toward accountant-ready T2/GIFI support by adding explicit GIFI mapping fields on ledger accounts, a year-level staging summary, and a live DB sanity check for the current schema.</p>
      <div id="accountingBackendMessage" class="small" style="display:none;margin-top:10px"></div>
    </div>
    <div class="grid cols-2" style="gap:18px;margin-top:18px">
      <div class="card" id="gl-accounts">
        <h3 style="margin-top:0">General ledger accounts</h3>
        <form id="glAccountForm" class="grid" style="gap:8px">
          <div class="grid cols-2" style="gap:8px">
            <input name="code" type="text" placeholder="6100" />
            <input name="name" type="text" placeholder="Electricity" />
          </div>
          <div class="grid cols-3" style="gap:8px">
            <select name="category"><option value="expense">Expense</option><option value="income">Income</option><option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option></select>
            <input name="parent_group" type="text" placeholder="utilities / revenue / current_assets" />
            <select name="normal_balance"><option value="debit">Debit</option><option value="credit">Credit</option></select>
          </div>
          <div class="grid cols-3" style="gap:8px">
            <input name="gifi_code" type="text" placeholder="9221" />
            <input name="gifi_label" type="text" placeholder="Electricity" />
            <select name="gifi_section"><option value="income_statement">Income statement</option><option value="balance_sheet">Balance sheet</option><option value="retained_earnings">Retained earnings</option><option value="other">Other / review later</option></select>
          </div>
          <div class="grid cols-3" style="gap:8px">
            <input name="tax_deductibility_percent" type="number" min="0" max="100" step="1" placeholder="100" />
            <input name="sort_order" type="number" step="1" placeholder="0" />
            <select name="is_active"><option value="1">Active</option><option value="0">Inactive</option></select>
          </div>
          <button class="btn primary" type="submit">Save GL account</button>
        </form>
        <div id="glAccountsList" class="small" style="margin-top:10px"></div>
      </div>
      <div class="card" id="expense-entry">
        <h3 style="margin-top:0">Expense entry</h3>
        <form id="expenseForm" class="grid" style="gap:8px">
          <input name="expense_date" type="date"/>
          <input name="vendor_name" type="text" placeholder="Hydro One"/>
          <input name="amount" type="number" step="0.01" placeholder="0.00"/>
          <input name="tax_amount" type="number" step="0.01" placeholder="Tax amount"/>
          <select name="ledger_code" id="expenseLedgerCode"></select>
          <textarea name="notes" rows="3" placeholder="Bill, invoice, or cost notes"></textarea>
          <button class="btn primary" type="submit">Add expense</button>
        </form>
        <div id="expensesList" class="small" style="margin-top:10px"></div>
      </div>
      <div class="card" id="overhead-allocation">
        <h3 style="margin-top:0">Overhead allocation</h3>
        <form id="overheadForm" class="grid" style="gap:8px">
          <input name="period_month" type="month"/>
          <input name="ledger_code" type="text" placeholder="6200"/>
          <input name="ledger_name" type="text" placeholder="Rent allocation"/>
          <select name="allocation_basis"><option value="manual">Manual</option><option value="revenue">Revenue</option><option value="orders">Orders</option><option value="units">Units</option></select>
          <input name="amount" type="number" step="0.01" placeholder="Allocated amount"/>
          <textarea name="notes" rows="3" placeholder="How this overhead should flow into rough P&amp;L or later item costs"></textarea>
          <button class="btn primary" type="submit">Save overhead allocation</button>
        </form>
        <div id="overheadList" class="small" style="margin-top:10px"></div>
      </div>
      <div class="card" id="writeoff-entry">
        <h3 style="margin-top:0">Write-off entry</h3>
        <form id="writeoffForm" class="grid" style="gap:8px">
          <input name="writeoff_date" type="date"/>
          <input name="item_name" type="text" placeholder="Broken silicone mold"/>
          <input name="amount" type="number" step="0.01" placeholder="Total write-off"/>
          <select name="reason_code"><option value="damaged">Damaged</option><option value="obsolete">Obsolete</option><option value="gifted">Gifted</option><option value="lost">Lost</option><option value="other">Other</option></select>
          <textarea name="notes" rows="3" placeholder="Reason and details"></textarea>
          <button class="btn primary" type="submit">Add write-off</button>
        </form>
        <div id="writeoffsList" class="small" style="margin-top:10px"></div>
      </div>
      <div class="card" id="product-costs">
        <h3 style="margin-top:0">Product unit costs</h3>
        <form id="productCostForm" class="grid" style="gap:8px">
          <input name="product_number" type="text" placeholder="DD1000"/>
          <input name="cost_per_unit" type="number" step="0.01" placeholder="Cost per unit"/>
          <input name="effective_date" type="date"/>
          <textarea name="notes" rows="3" placeholder="Material, labour, overhead notes"></textarea>
          <button class="btn primary" type="submit">Add cost</button>
        </form>
        <div id="productCostsList" class="small" style="margin-top:10px"></div>
      </div>
      <div class="card" id="gifi-staging">
        <h3 style="margin-top:0">T2 / GIFI staging</h3>
        <p class="small">This summary is meant for accountant review. It groups mapped ledger activity by GIFI code and shows any ledger codes that still need mapping before year-end export.</p>
        <div class="grid cols-3" style="gap:8px;align-items:end">
          <div><label class="small" for="gifiYearInput">Tax year</label><input id="gifiYearInput" type="number" min="2000" max="2100" placeholder="2026"></div>
          <div><button class="btn primary" id="loadGifiButton" type="button">Refresh GIFI summary</button></div>
          <div><button class="btn" id="downloadGifiButton" type="button">Download GIFI staging CSV</button></div>
        </div>
        <div id="gifiSummaryMount" class="small" style="margin-top:12px"></div>
      </div>
      <div class="card" id="db-sanity">
        <h3 style="margin-top:0">DB sanity</h3>
        <p class="small">Checks the live D1 database for the expected tables and key columns used by the current build, with extra attention on the accounting tables that have drifted before.</p>
        <button class="btn primary" id="runDbSanityButton" type="button">Run live DB sanity</button>
        <div id="dbSanityMount" class="small" style="margin-top:12px"></div>
      </div>
    </div>
    <div class="card" id="export-presets" style="margin-top:18px">
      <h3 style="margin-top:0">Export presets</h3>
      <div class="grid cols-3" style="gap:12px;align-items:end">
        <div><label class="small" for="monthlyExportMonth">Month-end</label><input id="monthlyExportMonth" type="month"/></div>
        <div><label class="small" for="quarterExportPeriod">Quarter-end</label><input id="quarterExportPeriod" type="text" placeholder="2026-Q2"/></div>
        <div><label class="small" for="yearExportPeriod">Year-end</label><input id="yearExportPeriod" type="number" min="2000" max="2100" placeholder="2026"/></div>
      </div>
      <div style="display:flex;gap:10px;align-items:end;flex-wrap:wrap;margin-top:12px">
        <button class="btn" id="downloadMonthlyExportButton" type="button">Download Month CSV</button>
        <button class="btn" id="downloadQuarterExportButton" type="button">Download Quarter CSV</button>
        <button class="btn" id="downloadYearExportButton" type="button">Download Year CSV</button>
      </div>
    </div>`;

  const message = mount.querySelector('#accountingBackendMessage');
  const state = { gl: [] };

  function activeMonth() {
    return String(mount.querySelector('#monthlyExportMonth')?.value || new Date().toISOString().slice(0,7));
  }
  function activeYear() {
    return String(mount.querySelector('#gifiYearInput')?.value || new Date().getFullYear());
  }
  function centsToMoney(cents, currency = 'CAD') {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(Number(cents || 0) / 100);
  }
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function setMessage(text, isError = false) {
    message.textContent = text || '';
    message.style.display = text ? 'block' : 'none';
    message.style.color = isError ? '#b00020' : '';
  }
  function renderSmallList(el, rows, formatter) {
    if (!el) return;
    if (!rows.length) { el.innerHTML = '<div>No entries yet.</div>'; return; }
    el.innerHTML = rows.slice(0, 12).map(formatter).join('');
  }
  function glOptionsHtml(selected = '') {
    return state.gl.map((row) => `<option value="${row.code || ''}" ${String(row.code||'')===String(selected||'') ? 'selected' : ''}>${row.code || ''} — ${row.name || ''}</option>`).join('');
  }
  async function readJson(response, fallback) {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) throw new Error(fallback);
    return response.json();
  }
  async function loadGl() {
    const response = await window.DDAuth.apiFetch('/api/admin/general-ledger-accounts');
    const data = await readJson(response, 'General ledger endpoint is unavailable.');
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed loading GL accounts.');
    state.gl = Array.isArray(data.accounts) ? data.accounts : [];
    const select = mount.querySelector('#expenseLedgerCode');
    if (select) select.innerHTML = `<option value="">Select account</option>${glOptionsHtml()}`;
    renderSmallList(mount.querySelector('#glAccountsList'), state.gl, (row) => `
      <div style="padding:8px 0;border-bottom:1px solid #eee">
        <strong>${escapeHtml(row.code || '')}</strong> — ${escapeHtml(row.name || '')}
        <div class="small">${escapeHtml(row.category || 'expense')} · ${escapeHtml(row.parent_group || 'ungrouped')} · ${escapeHtml(row.normal_balance || '')}</div>
        <div class="small">GIFI ${escapeHtml(row.gifi_code || '—')} ${row.gifi_label ? `— ${escapeHtml(row.gifi_label)}` : ''} ${row.tax_deductibility_percent == null ? '' : `· ${escapeHtml(String(row.tax_deductibility_percent))}% deductible`}</div>
      </div>`);
  }
  async function loadExpenses() {
    const response = await window.DDAuth.apiFetch('/api/admin/accounting-expenses');
    const data = await readJson(response, 'Expenses endpoint is unavailable.');
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed loading expenses.');
    renderSmallList(mount.querySelector('#expensesList'), Array.isArray(data.expenses) ? data.expenses : [], (row) => `<div>${escapeHtml(row.expense_date || row.created_at || '')} — ${escapeHtml(row.vendor_name || '')} — ${escapeHtml(centsToMoney(Math.round(Number(row.amount || 0) * 100)))} ${row.ledger_code ? `(${escapeHtml(row.ledger_code)})` : ''}</div>`);
  }
  async function loadOverhead() {
    const response = await window.DDAuth.apiFetch(`/api/admin/accounting-overhead-allocations?month=${encodeURIComponent(activeMonth())}`);
    const data = await readJson(response, 'Overhead endpoint is unavailable.');
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed loading overhead allocations.');
    renderSmallList(mount.querySelector('#overheadList'), Array.isArray(data.allocations) ? data.allocations : [], (row) => `<div>${escapeHtml(row.period_month || '')} — ${escapeHtml(row.ledger_code || '')} — ${escapeHtml(centsToMoney(Number(row.amount_cents || 0)))} <span class="small">(${escapeHtml(row.allocation_basis || 'manual')})</span></div>`);
  }
  async function loadWriteoffs() {
    const response = await window.DDAuth.apiFetch('/api/admin/accounting-writeoffs');
    const data = await readJson(response, 'Write-off endpoint is unavailable.');
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed loading write-offs.');
    renderSmallList(mount.querySelector('#writeoffsList'), Array.isArray(data.writeoffs) ? data.writeoffs : [], (row) => `<div>${escapeHtml(row.writeoff_date || row.created_at || '')} — ${escapeHtml(row.item_name || '')} — ${escapeHtml(centsToMoney(Math.round(Number(row.amount || 0) * 100)))} (${escapeHtml(row.reason_code || 'other')})</div>`);
  }
  async function loadProductCosts() {
    const response = await window.DDAuth.apiFetch('/api/admin/product-costs');
    const data = await readJson(response, 'Product cost endpoint is unavailable.');
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed loading product costs.');
    renderSmallList(mount.querySelector('#productCostsList'), Array.isArray(data.product_costs) ? data.product_costs : [], (row) => `<div>${escapeHtml(row.product_number || '')} — ${escapeHtml(centsToMoney(Math.round(Number(row.cost_per_unit || 0) * 100)))} <span class="small">${escapeHtml(row.effective_date || '')}</span></div>`);
  }
  async function refreshAll() {
    await loadGl();
    await Promise.all([loadExpenses(), loadOverhead(), loadWriteoffs(), loadProductCosts(), loadGifiSummary(), loadDbSanity()]);
  }

  async function loadGifiSummary() {
    const mountPoint = mount.querySelector('#gifiSummaryMount');
    if (!mountPoint) return;
    mountPoint.innerHTML = '<div>Loading GIFI staging summary…</div>';
    try {
      const response = await window.DDAuth.apiFetch(`/api/admin/accounting-gifi-summary?year=${encodeURIComponent(activeYear())}`);
      const data = await readJson(response, 'GIFI summary endpoint is unavailable.');
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed loading GIFI summary.');
      const rows = Array.isArray(data.gifi_rows) ? data.gifi_rows : [];
      const unmapped = Array.isArray(data.unmapped_accounts) ? data.unmapped_accounts : [];
      mountPoint.innerHTML = `
        <div class="small" style="margin-bottom:8px">${escapeHtml(String(Number(data.summary?.readiness_percent || 0)))}% mapped · ${escapeHtml(String(Number(data.summary?.mapped_line_count || 0)))} mapped rows · ${escapeHtml(String(Number(data.summary?.unmapped_line_count || 0)))} unmapped · source ${escapeHtml(data.source_used || 'unknown')}</div>
        <div class="table-wrap"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">GIFI</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Ledgers</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Net</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Deductible</th></tr></thead><tbody>${rows.slice(0, 20).map((row) => `<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>${escapeHtml(row.gifi_code || 'UNMAPPED')}</strong><div class="small">${escapeHtml(row.gifi_label || 'Needs accountant mapping')}</div><div class="small">${escapeHtml(row.gifi_section || '')}</div></td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(row.ledger_codes || '')}</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(centsToMoney(Number(row.net_cents || 0)))}</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(centsToMoney(Number(row.deductible_cents || 0)))}</td></tr>`).join('') || '<tr><td colspan="4" style="padding:8px">No GIFI rows yet.</td></tr>'}</tbody></table></div>
        <div style="margin-top:10px">${unmapped.length ? `<strong>Accounts needing mapping:</strong><div class="small" style="margin-top:6px">${unmapped.slice(0, 10).map((row) => `${escapeHtml(row.ledger_code || '')} — ${escapeHtml(row.ledger_name || '')} (${escapeHtml(centsToMoney(Number(row.net_cents || 0)))})`).join('<br>')}</div>` : '<div class="small">No unmapped ledger activity was found in the current staging summary.</div>'}</div>`;
    } catch (error) {
      mountPoint.innerHTML = `<div style="color:#b00020">${escapeHtml(error.message || 'Failed loading GIFI summary.')}</div>`;
    }
  }

  async function loadDbSanity() {
    const mountPoint = mount.querySelector('#dbSanityMount');
    if (!mountPoint) return;
    mountPoint.innerHTML = '<div>Running DB sanity…</div>';
    try {
      const response = await window.DDAuth.apiFetch('/api/admin/db-sanity');
      const data = await readJson(response, 'DB sanity endpoint is unavailable.');
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed running DB sanity.');
      const stale = Array.isArray(data.stale_tables) ? data.stale_tables : [];
      const missing = Array.isArray(data.missing_tables) ? data.missing_tables : [];
      mountPoint.innerHTML = `
        <div class="small" style="margin-bottom:8px">Status: <strong>${escapeHtml(data.summary?.status || 'unknown')}</strong> · ${escapeHtml(String(Number(data.summary?.ok_table_count || 0)))} OK · ${escapeHtml(String(Number(data.summary?.stale_table_count || 0)))} stale · ${escapeHtml(String(Number(data.summary?.missing_table_count || 0)))} missing</div>
        ${missing.length ? `<div style="margin-bottom:10px"><strong>Missing tables</strong><div class="small">${missing.slice(0, 12).map((row) => `${escapeHtml(row.table_name)}${row.missing_columns?.length ? ` — needs ${escapeHtml(row.missing_columns.join(', '))}` : ''}`).join('<br>')}</div></div>` : ''}
        ${stale.length ? `<div><strong>Tables needing column upgrades</strong><div class="small">${stale.slice(0, 12).map((row) => `${escapeHtml(row.table_name)} — missing ${escapeHtml((row.missing_columns || []).join(', '))}`).join('<br>')}</div></div>` : '<div class="small">No missing key columns were found in the current sanity set.</div>'}`;
    } catch (error) {
      mountPoint.innerHTML = `<div style="color:#b00020">${escapeHtml(error.message || 'Failed running DB sanity.')}</div>`;
    }
  }

  mount.querySelector('#glAccountForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await window.DDAuth.apiFetch('/api/admin/general-ledger-accounts', { method: 'POST', body: JSON.stringify(payload) });
    const data = await readJson(response, 'GL account save failed.');
    if (!response.ok || !data?.ok) return setMessage(data?.error || 'Failed saving GL account.', true);
    form.reset();
    setMessage('General ledger account saved.');
    refreshAll().catch((error) => setMessage(String(error?.message || error), true));
  });
  mount.querySelector('#expenseForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await window.DDAuth.apiFetch('/api/admin/accounting-expenses', { method: 'POST', body: JSON.stringify(payload) });
    const data = await readJson(response, 'Expense save failed.');
    if (!response.ok || !data?.ok) return setMessage(data?.error || 'Failed saving expense.', true);
    form.reset();
    setMessage('Expense saved.');
    refreshAll().catch((error) => setMessage(String(error?.message || error), true));
  });
  mount.querySelector('#overheadForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await window.DDAuth.apiFetch('/api/admin/accounting-overhead-allocations', { method: 'POST', body: JSON.stringify(payload) });
    const data = await readJson(response, 'Overhead save failed.');
    if (!response.ok || !data?.ok) return setMessage(data?.error || 'Failed saving overhead allocation.', true);
    setMessage('Overhead allocation saved.');
    refreshAll().catch((error) => setMessage(String(error?.message || error), true));
  });
  mount.querySelector('#writeoffForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await window.DDAuth.apiFetch('/api/admin/accounting-writeoffs', { method: 'POST', body: JSON.stringify(payload) });
    const data = await readJson(response, 'Write-off save failed.');
    if (!response.ok || !data?.ok) return setMessage(data?.error || 'Failed saving write-off.', true);
    form.reset();
    setMessage('Write-off saved.');
    refreshAll().catch((error) => setMessage(String(error?.message || error), true));
  });
  mount.querySelector('#productCostForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await window.DDAuth.apiFetch('/api/admin/product-costs', { method: 'POST', body: JSON.stringify(payload) });
    const data = await readJson(response, 'Product cost save failed.');
    if (!response.ok || !data?.ok) return setMessage(data?.error || 'Failed saving product cost.', true);
    form.reset();
    setMessage('Product cost saved.');
    refreshAll().catch((error) => setMessage(String(error?.message || error), true));
  });

  async function downloadCsv(url, fallbackName) {
    const response = await window.DDAuth.apiFetch(url);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return setMessage(data?.error || 'Failed generating export.', true);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = fallbackName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  }
  mount.querySelector('#downloadMonthlyExportButton')?.addEventListener('click', async () => {
    const month = mount.querySelector('#monthlyExportMonth')?.value;
    if (!month) return setMessage('Choose a month before downloading the export.', true);
    await downloadCsv(`/api/admin/accounting-monthly-summary-export?month=${encodeURIComponent(month)}`, `devilndove-accounting-${month}.csv`);
  });
  mount.querySelector('#downloadQuarterExportButton')?.addEventListener('click', async () => {
    const quarter = String(mount.querySelector('#quarterExportPeriod')?.value || '').trim();
    if (!quarter) return setMessage('Enter a quarter like 2026-Q2.', true);
    await downloadCsv(`/api/admin/accounting-period-summary-export?scope=quarter&period=${encodeURIComponent(quarter)}`, `devilndove-accounting-${quarter}.csv`);
  });
  mount.querySelector('#downloadYearExportButton')?.addEventListener('click', async () => {
    const year = String(mount.querySelector('#yearExportPeriod')?.value || '').trim();
    if (!year) return setMessage('Choose a year first.', true);
    await downloadCsv(`/api/admin/accounting-period-summary-export?scope=year&period=${encodeURIComponent(year)}`, `devilndove-accounting-${year}.csv`);
  });
  mount.querySelector('#downloadGifiButton')?.addEventListener('click', async () => {
    const year = activeYear();
    if (!year) return setMessage('Choose a GIFI year first.', true);
    await downloadCsv(`/api/admin/accounting-gifi-summary?year=${encodeURIComponent(year)}&format=csv`, `devilndove-gifi-staging-${year}.csv`);
  });
  mount.querySelector('#loadGifiButton')?.addEventListener('click', () => { loadGifiSummary(); });
  mount.querySelector('#runDbSanityButton')?.addEventListener('click', () => { loadDbSanity(); });

  const monthlyInput = mount.querySelector('#monthlyExportMonth');
  if (monthlyInput && !monthlyInput.value) monthlyInput.value = new Date().toISOString().slice(0,7);
  const overheadMonth = mount.querySelector('#overheadForm [name=period_month]');
  if (overheadMonth && !overheadMonth.value) overheadMonth.value = activeMonth();
  const gifiYearInput = mount.querySelector('#gifiYearInput');
  if (gifiYearInput && !gifiYearInput.value) gifiYearInput.value = String(new Date().getFullYear());
  const yearExportInput = mount.querySelector('#yearExportPeriod');
  if (yearExportInput && !yearExportInput.value) yearExportInput.value = String(new Date().getFullYear());

  refreshAll().then(() => {
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }).catch((error) => setMessage(String(error?.message || error || 'Failed loading accounting tools.'), true));
});
