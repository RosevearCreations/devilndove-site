// File: /public/js/admin-accounting-backend.js
// Brief description: Starter accounting backend tools (expenses + product costs) to pair with accounting shadow records.

(function () {
  const mountEl = document.getElementById('adminAccountingBackendMount');
  if (!mountEl || !window.DDAuth) return;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }

  function centsToMoney(cents, currency = 'CAD') {
    const value = Number(cents || 0) / 100;
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value); }
    catch { return `${currency} ${value.toFixed(2)}`; }
  }

  function setMessage(id, message, isError = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = message ? 'block' : 'none';
    el.textContent = message || '';
    el.style.color = isError ? '#b91c1c' : '';
  }

  function renderShell() {
    mountEl.innerHTML = `
      <div class="card" style="margin-top:18px">
        <h3 style="margin-top:0">Accounting Backend (Starter)</h3>
        <p class="small" style="margin-top:0">Capture expenses and unit costs now so later COGS, write-offs, and profitability can be added without rebuilding history.</p>
        <div class="grid cols-2" style="gap:14px">
          <div class="card" style="margin:0">
            <h4 style="margin-top:0">Expenses</h4>
            <div id="accExpenseMessage" class="small" style="display:none;margin-bottom:10px"></div>
            <form id="accExpenseForm" class="grid" style="gap:10px">
              <div class="grid cols-2" style="gap:10px">
                <div><label class="small">Date</label><input name="expense_date" type="date" required /></div>
                <div><label class="small">Vendor</label><input name="vendor" type="text" placeholder="Amazon, Home Depot..." /></div>
              </div>
              <div><label class="small">Category</label><input name="category" type="text" placeholder="Supplies, Tools, Shipping, Equipment..." /></div>
              <div><label class="small">Description</label><input name="description" type="text" placeholder="Silver clay, burs, packaging..." /></div>
              <div class="grid cols-3" style="gap:10px">
                <div><label class="small">Amount</label><input name="amount" type="number" step="0.01" min="0" required /></div>
                <div><label class="small">Tax</label><input name="tax" type="number" step="0.01" min="0" /></div>
                <div><label class="small">Currency</label><input name="currency" type="text" value="CAD" /></div>
              </div>
              <div><label class="small">Receipt URL (optional)</label><input name="receipt_url" type="url" placeholder="https://..." /></div>
              <div><label class="small">Notes</label><input name="notes" type="text" /></div>
              <button class="btn" type="submit">Add Expense</button>
            </form>
            <div id="accExpenseList" style="margin-top:12px"></div>
          </div>
          <div class="card" style="margin:0">
            <h4 style="margin-top:0">Product Unit Costs</h4>
            <div id="accCostMessage" class="small" style="display:none;margin-bottom:10px"></div>
            <form id="accCostForm" class="grid" style="gap:10px">
              <div class="grid cols-2" style="gap:10px">
                <div><label class="small">Product ID</label><input name="product_id" type="number" min="1" required /></div>
                <div><label class="small">Effective Date</label><input name="effective_date" type="date" required /></div>
              </div>
              <div class="grid cols-3" style="gap:10px">
                <div><label class="small">Unit Cost</label><input name="unit_cost" type="number" step="0.01" min="0" required /></div>
                <div><label class="small">Currency</label><input name="currency" type="text" value="CAD" /></div>
                <div><label class="small">Vendor</label><input name="vendor" type="text" /></div>
              </div>
              <div><label class="small">Notes</label><input name="notes" type="text" /></div>
              <button class="btn" type="submit">Add Unit Cost</button>
            </form>
            <div id="accCostList" style="margin-top:12px"></div>
          </div>
        </div>
        <div class="small" style="margin-top:12px;opacity:.85">Tip: Start by logging your last few supply/tool purchases and the current unit cost for your top-selling items.</div>
      </div>
    `;
  }

  async function loadExpenses() {
    const list = document.getElementById('accExpenseList');
    if (!list) return;
    try {
      const res = await window.DDAuth.apiFetch('/api/admin/accounting-expenses?limit=25');
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load expenses.');
      const rows = Array.isArray(data.expenses) ? data.expenses : [];
      list.innerHTML = rows.length ? `
        <div class="table-wrap"><table style="width:100%;border-collapse:collapse">
          <thead><tr>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Date</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Vendor</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Category</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Amount</th>
          </tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(r.expense_date || '')}</td>
                <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(r.vendor || '—')}</td>
                <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(r.category || '—')}</td>
                <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(centsToMoney(r.amount_cents, r.currency || 'CAD'))}</td>
              </tr>`).join('')}
          </tbody>
        </table></div>
      ` : '<div class="small">No expenses logged yet.</div>';
    } catch (err) {
      list.innerHTML = `<div class="small">${escapeHtml(err.message || 'Failed to load expenses.')}</div>`;
    }
  }

  async function loadCosts(productId) {
    const list = document.getElementById('accCostList');
    if (!list) return;
    const pid = Number(productId || 0);
    if (!pid) {
      list.innerHTML = '<div class="small">Enter a Product ID to view its cost history.</div>';
      return;
    }
    try {
      const res = await window.DDAuth.apiFetch(`/api/admin/product-costs?product_id=${encodeURIComponent(pid)}&limit=25`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load costs.');
      const rows = Array.isArray(data.costs) ? data.costs : [];
      list.innerHTML = rows.length ? `
        <div class="table-wrap"><table style="width:100%;border-collapse:collapse">
          <thead><tr>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Effective</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Unit Cost</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Vendor</th>
          </tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(r.effective_date || '')}</td>
                <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(centsToMoney(r.unit_cost_cents, r.currency || 'CAD'))}</td>
                <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(r.vendor || '—')}</td>
              </tr>`).join('')}
          </tbody>
        </table></div>
      ` : '<div class="small">No unit cost entries yet for this product.</div>';
    } catch (err) {
      list.innerHTML = `<div class="small">${escapeHtml(err.message || 'Failed to load costs.')}</div>`;
    }
  }

  function hookForms() {
    const expenseForm = document.getElementById('accExpenseForm');
    const costForm = document.getElementById('accCostForm');

    if (expenseForm) {
      expenseForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setMessage('accExpenseMessage', '');
        const form = new FormData(expenseForm);
        const payload = Object.fromEntries(form.entries());
        try {
          const res = await window.DDAuth.apiFetch('/api/admin/accounting-expenses', { method: 'POST', body: JSON.stringify(payload) });
          const data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to add expense.');
          setMessage('accExpenseMessage', 'Expense added.');
          expenseForm.reset();
          await loadExpenses();
        } catch (err) {
          setMessage('accExpenseMessage', err.message || 'Failed to add expense.', true);
        }
      });
    }

    if (costForm) {
      const productInput = costForm.querySelector('input[name="product_id"]');
      const refreshCosts = () => loadCosts(productInput?.value);
      productInput?.addEventListener('change', refreshCosts);
      productInput?.addEventListener('blur', refreshCosts);

      costForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setMessage('accCostMessage', '');
        const form = new FormData(costForm);
        const payload = Object.fromEntries(form.entries());
        try {
          const res = await window.DDAuth.apiFetch('/api/admin/product-costs', { method: 'POST', body: JSON.stringify(payload) });
          const data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to add unit cost.');
          setMessage('accCostMessage', 'Unit cost saved.');
          await loadCosts(payload.product_id);
        } catch (err) {
          setMessage('accCostMessage', err.message || 'Failed to add unit cost.', true);
        }
      });
    }
  }

  renderShell();
  loadExpenses();
  hookForms();
})();
