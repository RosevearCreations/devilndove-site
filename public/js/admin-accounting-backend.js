// File: /public/js/admin-accounting-backend.js
// Brief description: Starter accounting admin UI for GL accounts, expenses, write-offs, costs, and monthly CSV export.

document.addEventListener("DOMContentLoaded", () => {
  const mount = document.getElementById("accountingBackendMount");
  if (!mount || !window.DDAuth) return;

  mount.innerHTML = `
    <div class="card">
      <h2 style="margin-top:0">Accounting Backend (Starter)</h2>
      <p class="small">Capture general ledger categories, operating expenses, write-offs, and item costs. Export monthly CSV summaries for accountants while the fuller accounting application grows.</p>
      <div class="small" id="accountingBackendMessage" style="display:none;margin-bottom:10px"></div>
      <div class="department-grid">
        <div class="card">
          <h3 style="margin-top:0">General Ledger</h3>
          <form id="glAccountForm" class="grid" style="gap:8px">
            <input name="code" type="text" placeholder="6100"/>
            <input name="name" type="text" placeholder="Electricity"/>
            <select name="category"><option value="expense">Expense</option><option value="income">Income</option><option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option></select>
            <button class="btn primary" type="submit">Add GL account</button>
          </form>
          <div id="glAccountsList" class="small" style="margin-top:10px"></div>
        </div>
        <div class="card">
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
        <div class="card">
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
        <div class="card">
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
      </div>
      <div class="card" style="margin-top:18px">
        <h3 style="margin-top:0">Monthly export</h3>
        <div style="display:flex;gap:10px;align-items:end;flex-wrap:wrap">
          <div><label class="small" for="monthlyExportMonth">Month</label><input id="monthlyExportMonth" type="month"/></div>
          <button class="btn" id="downloadMonthlyExportButton" type="button">Download CSV</button>
        </div>
      </div>
    </div>`;

  const message = mount.querySelector('#accountingBackendMessage');
  const state = { gl: [] };

  function setMessage(text, isError = false) {
    message.textContent = text || '';
    message.style.display = text ? 'block' : 'none';
    message.style.color = isError ? '#b00020' : '';
  }

  function renderSmallList(el, rows, formatter) {
    if (!el) return;
    if (!rows.length) { el.innerHTML = '<div>No entries yet.</div>'; return; }
    el.innerHTML = rows.slice(0, 8).map(formatter).join('');
  }

  function glOptionsHtml(selected = '') {
    return state.gl.map((row) => `<option value="${row.code || ''}" ${String(row.code||'')===String(selected||'') ? 'selected' : ''}>${row.code || ''} — ${row.name || ''}</option>`).join('');
  }

  async function loadGl() {
    const response = await window.DDAuth.apiFetch('/api/admin/general-ledger-accounts');
    const data = await response.json();
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed loading GL accounts.');
    state.gl = Array.isArray(data.accounts) ? data.accounts : [];
    const select = mount.querySelector('#expenseLedgerCode');
    if (select) select.innerHTML = `<option value="">Select account</option>${glOptionsHtml()}`;
    renderSmallList(mount.querySelector('#glAccountsList'), state.gl, (row) => `<div>${row.code || ''} — ${row.name || ''} <span class="small">(${row.category || 'expense'})</span></div>`);
  }

  async function loadExpenses() {
    const response = await window.DDAuth.apiFetch('/api/admin/accounting-expenses');
    const data = await response.json();
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed loading expenses.');
    renderSmallList(mount.querySelector('#expensesList'), Array.isArray(data.expenses) ? data.expenses : [], (row) => `<div>${row.expense_date || row.created_at || ''} — ${row.vendor_name || ''} — $${Number(row.amount || 0).toFixed(2)} ${row.ledger_code ? `(${row.ledger_code})` : ''}</div>`);
  }

  async function loadWriteoffs() {
    const response = await window.DDAuth.apiFetch('/api/admin/accounting-writeoffs');
    const data = await response.json();
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed loading write-offs.');
    renderSmallList(mount.querySelector('#writeoffsList'), Array.isArray(data.writeoffs) ? data.writeoffs : [], (row) => `<div>${row.writeoff_date || row.created_at || ''} — ${row.item_name || ''} — $${Number(row.amount || 0).toFixed(2)} (${row.reason_code || 'other'})</div>`);
  }

  async function loadProductCosts() {
    const response = await window.DDAuth.apiFetch('/api/admin/product-costs');
    const data = await response.json();
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed loading product costs.');
    renderSmallList(mount.querySelector('#productCostsList'), Array.isArray(data.product_costs) ? data.product_costs : [], (row) => `<div>${row.product_number || ''} — $${Number(row.cost_per_unit || 0).toFixed(2)} <span class="small">${row.effective_date || ''}</span></div>`);
  }

  async function refreshAll() {
    await loadGl();
    await Promise.all([loadExpenses(), loadWriteoffs(), loadProductCosts()]);
  }

  mount.querySelector('#glAccountForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = { code: form.code.value, name: form.name.value, category: form.category.value };
    const response = await window.DDAuth.apiFetch('/api/admin/general-ledger-accounts', { method: 'POST', body: JSON.stringify(payload) });
    const data = await response.json();
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
    const data = await response.json();
    if (!response.ok || !data?.ok) return setMessage(data?.error || 'Failed saving expense.', true);
    form.reset();
    setMessage('Expense saved.');
    refreshAll().catch((error) => setMessage(String(error?.message || error), true));
  });

  mount.querySelector('#writeoffForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await window.DDAuth.apiFetch('/api/admin/accounting-writeoffs', { method: 'POST', body: JSON.stringify(payload) });
    const data = await response.json();
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
    const data = await response.json();
    if (!response.ok || !data?.ok) return setMessage(data?.error || 'Failed saving product cost.', true);
    form.reset();
    setMessage('Product cost saved.');
    refreshAll().catch((error) => setMessage(String(error?.message || error), true));
  });

  mount.querySelector('#downloadMonthlyExportButton')?.addEventListener('click', async () => {
    const month = mount.querySelector('#monthlyExportMonth')?.value;
    if (!month) return setMessage('Choose a month before downloading the export.', true);
    const response = await window.DDAuth.apiFetch(`/api/admin/accounting-monthly-summary-export?month=${encodeURIComponent(month)}`);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return setMessage(data?.error || 'Failed generating monthly export.', true);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devilndove-accounting-${month}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  refreshAll().catch((error) => setMessage(String(error?.message || error || 'Failed loading accounting tools.'), true));
});