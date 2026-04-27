document.addEventListener('DOMContentLoaded', () => {
  if (!window.DDAuth) return;
  const mount = document.getElementById('accountingBackendMount');
  if (!mount) return;

  const state = {
    vendors: [],
    recurringRules: [],
    reconciliation: { type: 'sales_tax', period_month: new Date().toISOString().slice(0, 7), rows: [], reviews: [], summary: {} },
    yearEnd: null,
    attachments: [],
  };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function centsToMoney(cents) {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format((Number(cents || 0) || 0) / 100);
  }

  async function readJson(response, fallbackMessage) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || fallbackMessage || 'Request failed.');
    return data;
  }

  function setMessage(text, isError = false) {
    const box = document.getElementById('accountingBackendMessage');
    if (!box) return;
    box.style.display = text ? 'block' : 'none';
    box.style.color = isError ? '#b00020' : '#14532d';
    box.textContent = text || '';
  }

  function vendorOptions(selected = '') {
    return `<option value="">Choose vendor</option>${state.vendors.map((row) => `<option value="${esc(row.accounting_vendor_id)}" ${String(row.accounting_vendor_id) === String(selected) ? 'selected' : ''}>${esc(row.vendor_name)}</option>`).join('')}`;
  }

  function ruleOptions(selected = '') {
    return `<option value="">No recurring rule</option>${state.recurringRules.map((row) => `<option value="${esc(row.recurring_expense_rule_id)}" ${String(row.recurring_expense_rule_id) === String(selected) ? 'selected' : ''}>${esc(row.rule_name)}${row.vendor_name ? ` — ${esc(row.vendor_name)}` : ''}</option>`).join('')}`;
  }

  function injectExpenseEnhancements() {
    const expenseForm = document.getElementById('expenseForm');
    if (!expenseForm || document.getElementById('expenseEnhancementFields')) return;
    const notesField = expenseForm.querySelector('textarea[name="notes"]');
    const wrap = document.createElement('div');
    wrap.id = 'expenseEnhancementFields';
    wrap.className = 'grid';
    wrap.style.gap = '8px';
    wrap.innerHTML = `
      <div class="grid cols-3" style="gap:8px">
        <div>
          <label class="small" for="expenseVendorSelect">Vendor directory</label>
          <select id="expenseVendorSelect">${vendorOptions()}</select>
          <input type="hidden" name="vendor_id" value="" />
        </div>
        <div>
          <label class="small" for="expenseRecurringRuleSelect">Recurring rule</label>
          <select id="expenseRecurringRuleSelect">${ruleOptions()}</select>
          <input type="hidden" name="recurring_expense_rule_id" value="" />
        </div>
        <div>
          <label class="small" for="expenseReferenceNumber">Reference / invoice #</label>
          <input id="expenseReferenceNumber" name="reference_number" type="text" placeholder="INV-2026-001" />
        </div>
      </div>
      <input type="hidden" name="source_mode" value="manual" />
    `;
    if (notesField?.parentNode) expenseForm.insertBefore(wrap, notesField);
    else expenseForm.appendChild(wrap);

    wrap.querySelector('#expenseVendorSelect')?.addEventListener('change', (event) => {
      const id = String(event.target.value || '');
      const vendor = state.vendors.find((row) => String(row.accounting_vendor_id) === id) || null;
      const hidden = expenseForm.elements?.vendor_id;
      if (hidden) hidden.value = id;
      if (vendor) {
        if (expenseForm.elements?.vendor_name) expenseForm.elements.vendor_name.value = vendor.vendor_name || '';
        if (expenseForm.elements?.ledger_code && !expenseForm.elements.ledger_code.value) expenseForm.elements.ledger_code.value = vendor.default_ledger_code || '';
      }
    });

    wrap.querySelector('#expenseRecurringRuleSelect')?.addEventListener('change', (event) => {
      const id = String(event.target.value || '');
      const rule = state.recurringRules.find((row) => String(row.recurring_expense_rule_id) === id) || null;
      if (expenseForm.elements?.recurring_expense_rule_id) expenseForm.elements.recurring_expense_rule_id.value = id;
      if (expenseForm.elements?.source_mode) expenseForm.elements.source_mode.value = rule ? 'recurring_rule' : 'manual';
      if (rule) {
        if (expenseForm.elements?.vendor_name) expenseForm.elements.vendor_name.value = rule.vendor_name || '';
        if (expenseForm.elements?.ledger_code) expenseForm.elements.ledger_code.value = rule.ledger_code || '';
        if (expenseForm.elements?.amount && !expenseForm.elements.amount.value) expenseForm.elements.amount.value = String(rule.amount || '');
        if (expenseForm.elements?.tax_amount && !expenseForm.elements.tax_amount.value) expenseForm.elements.tax_amount.value = String(rule.tax_amount || '');
        if (expenseForm.elements?.notes && !expenseForm.elements.notes.value) expenseForm.elements.notes.value = rule.notes || '';
        if (expenseForm.elements?.vendor_id && rule.vendor_id) expenseForm.elements.vendor_id.value = String(rule.vendor_id);
      }
    });
  }

  function injectCards() {
    if (document.getElementById('accountingVendorsCard')) return;
    const block = document.createElement('div');
    block.id = 'accountingAdvancedMount';
    block.className = 'grid cols-2';
    block.style.gap = '18px';
    block.style.marginTop = '18px';
    block.innerHTML = `
      <div class="card" id="accountingVendorsCard">
        <h3 style="margin-top:0">Vendor directory</h3>
        <p class="small">Tie common vendors to default ledger codes and tax patterns so expense entry gets less repetitive.</p>
        <form id="accountingVendorForm" class="grid" style="gap:8px">
          <div class="grid cols-2" style="gap:8px"><input name="vendor_name" type="text" placeholder="Hydro One" /><input name="default_ledger_code" type="text" placeholder="6100" /></div>
          <div class="grid cols-3" style="gap:8px"><input name="default_tax_percent" type="number" min="0" max="100" step="0.01" placeholder="13" /><input name="payment_terms" type="text" placeholder="Net 30" /><select name="is_active"><option value="1">Active</option><option value="0">Inactive</option></select></div>
          <div class="grid cols-2" style="gap:8px"><input name="contact_email" type="email" placeholder="billing@example.com" /><input name="contact_phone" type="text" placeholder="Phone" /></div>
          <input name="website_url" type="url" placeholder="https://vendor.example" />
          <textarea name="notes" rows="3" placeholder="Notes about receipts, statements, or how this vendor is used"></textarea>
          <button class="btn primary" type="submit">Save vendor</button>
        </form>
        <div id="accountingVendorsList" class="small" style="margin-top:10px"></div>
      </div>

      <div class="card" id="accountingRecurringRulesCard">
        <h3 style="margin-top:0">Recurring expense rules</h3>
        <p class="small">Keep slow monthly items repeatable without pretending they are fully automated yet.</p>
        <form id="accountingRecurringRuleForm" class="grid" style="gap:8px">
          <input type="hidden" name="recurring_expense_rule_id" value="" />
          <div class="grid cols-2" style="gap:8px"><select name="vendor_id" id="recurringVendorSelect">${vendorOptions()}</select><input name="rule_name" type="text" placeholder="Monthly electricity" /></div>
          <div class="grid cols-2" style="gap:8px"><input name="vendor_name" type="text" placeholder="Vendor name override" /><input name="ledger_code" type="text" placeholder="6100" /></div>
          <div class="grid cols-3" style="gap:8px"><input name="amount" type="number" step="0.01" placeholder="0.00" /><input name="tax_amount" type="number" step="0.01" placeholder="Tax amount" /><select name="frequency"><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option><option value="manual">Manual</option></select></div>
          <div class="grid cols-3" style="gap:8px"><input name="next_due_date" type="date" /><select name="auto_create_mode"><option value="manual">Manual review</option><option value="draft_expense">Draft expense helper</option></select><select name="is_active"><option value="1">Active</option><option value="0">Inactive</option></select></div>
          <textarea name="notes" rows="3" placeholder="What this recurring rule covers"></textarea>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" type="submit">Save rule</button><button class="btn" type="button" id="clearRecurringRuleButton">Clear rule form</button></div>
        </form>
        <div id="accountingRecurringRulesList" class="small" style="margin-top:10px"></div>
      </div>

      <div class="card" id="accountingAttachmentsCard">
        <h3 style="margin-top:0">Bills / receipts / statements</h3>
        <p class="small">Upload source files and tie them to an expense, vendor, period, or reconciliation track so the year-end handoff is easier to review.</p>
        <form id="accountingAttachmentForm" class="grid" style="gap:8px" enctype="multipart/form-data">
          <div class="grid cols-2" style="gap:8px"><input name="file" type="file" /><select name="attachment_kind"><option value="bill">Bill</option><option value="receipt">Receipt</option><option value="statement">Statement</option><option value="workpaper">Workpaper</option><option value="other">Other</option></select></div>
          <div class="grid cols-2" style="gap:8px"><select name="vendor_id" id="attachmentVendorSelect">${vendorOptions()}</select><input name="expense_id" type="number" min="0" step="1" placeholder="Expense ID (optional)" /></div>
          <div class="grid cols-3" style="gap:8px"><select name="reconciliation_type"><option value="">No reconciliation link</option><option value="sales_tax">Sales tax</option><option value="processor_fees">Processor fees</option><option value="shipping">Shipping</option></select><input name="period_month" type="month" value="${esc(state.reconciliation.period_month)}" /><input name="tax_year" type="number" min="2000" max="2100" value="${new Date().getFullYear()}" /></div>
          <input name="statement_reference" type="text" placeholder="Statement reference / report name" />
          <textarea name="notes" rows="2" placeholder="Why this attachment matters"></textarea>
          <button class="btn primary" type="submit">Upload attachment</button>
        </form>
        <div id="accountingAttachmentsList" class="small" style="margin-top:10px"></div>
      </div>

      <div class="card" id="accountingReconciliationCard">
        <h3 style="margin-top:0">Reconciliation review</h3>
        <p class="small">Compare booked amounts against sales tax, payment-provider, and shipping views with notes, statement references, and attachment counts.</p>
        <div class="grid cols-3" style="gap:8px;align-items:end">
          <div><label class="small" for="reconciliationTypeInput">Type</label><select id="reconciliationTypeInput"><option value="sales_tax">Sales tax</option><option value="processor_fees">Processor fees</option><option value="shipping">Shipping</option></select></div>
          <div><label class="small" for="reconciliationMonthInput">Month</label><input id="reconciliationMonthInput" type="month" value="${esc(state.reconciliation.period_month)}" /></div>
          <div><button class="btn primary" type="button" id="loadReconciliationButton">Load reconciliation</button></div>
        </div>
        <div id="accountingReconciliationList" class="small" style="margin-top:10px"></div>
      </div>

      <div class="card" id="yearEndCloseCard">
        <h3 style="margin-top:0">Year-end close bundle</h3>
        <p class="small">This moves the handoff bundle closer to accountant review by including GL review status, reconciliation notes, and attachment coverage.</p>
        <div class="grid cols-3" style="gap:8px;align-items:end">
          <div><label class="small" for="yearEndCloseYearInput">Tax year</label><input id="yearEndCloseYearInput" type="number" min="2000" max="2100" value="${new Date().getFullYear()}" /></div>
          <div><button class="btn primary" type="button" id="loadYearEndCloseButton">Refresh close bundle</button></div>
          <div><button class="btn" type="button" id="downloadYearEndCloseButton">Download JSON bundle</button></div>
        </div>
        <div id="yearEndCloseList" class="small" style="margin-top:10px"></div>
      </div>
    `;
    mount.appendChild(block);
  }

  async function loadVendors() {
    const data = await readJson(await window.DDAuth.apiFetch('/api/admin/accounting-vendors?include_inactive=1'), 'Vendor directory endpoint is unavailable.');
    state.vendors = Array.isArray(data.vendors) ? data.vendors : [];
    renderVendors();
    syncSelects();
  }

  async function loadRecurringRules() {
    const data = await readJson(await window.DDAuth.apiFetch('/api/admin/accounting-recurring-expense-rules?include_inactive=1'), 'Recurring rule endpoint is unavailable.');
    state.recurringRules = Array.isArray(data.rules) ? data.rules : [];
    renderRecurringRules(data.summary || {});
    syncSelects();
  }

  async function loadAttachments() {
    const periodMonth = document.getElementById('reconciliationMonthInput')?.value || state.reconciliation.period_month;
    const taxYear = document.getElementById('yearEndCloseYearInput')?.value || String(new Date().getFullYear());
    const data = await readJson(await window.DDAuth.apiFetch(`/api/admin/accounting-attachments?period_month=${encodeURIComponent(periodMonth)}&tax_year=${encodeURIComponent(taxYear)}&limit=30`), 'Accounting attachments endpoint is unavailable.');
    state.attachments = Array.isArray(data.attachments) ? data.attachments : [];
    renderAttachments();
  }

  async function loadReconciliation(type = state.reconciliation.type, periodMonth = state.reconciliation.period_month) {
    const data = await readJson(await window.DDAuth.apiFetch(`/api/admin/accounting-reconciliation?type=${encodeURIComponent(type)}&period_month=${encodeURIComponent(periodMonth)}`), 'Reconciliation endpoint is unavailable.');
    state.reconciliation = { type, period_month: periodMonth, rows: Array.isArray(data.rows) ? data.rows : [], reviews: Array.isArray(data.reviews) ? data.reviews : [], summary: data.summary || {}, attachment_preview: Array.isArray(data.attachment_preview) ? data.attachment_preview : [] };
    renderReconciliation();
  }

  async function loadYearEndClose(yearValue) {
    const year = String(yearValue || new Date().getFullYear());
    const data = await readJson(await window.DDAuth.apiFetch(`/api/admin/accounting-year-end-close?year=${encodeURIComponent(year)}`), 'Year-end close endpoint is unavailable.');
    state.yearEnd = data;
    renderYearEndClose();
  }

  function renderVendors() {
    const el = document.getElementById('accountingVendorsList');
    if (!el) return;
    if (!state.vendors.length) { el.innerHTML = '<div>No vendors yet.</div>'; return; }
    el.innerHTML = state.vendors.slice(0, 20).map((row) => `
      <div style="padding:8px 0;border-bottom:1px solid #eee">
        <strong>${esc(row.vendor_name)}</strong>
        <div class="small">${esc(row.default_ledger_code || 'no ledger default')} • tax ${esc(String(Number(row.default_tax_percent || 0)))}%</div>
      </div>
    `).join('');
  }

  function renderRecurringRules(summary = {}) {
    const el = document.getElementById('accountingRecurringRulesList');
    if (!el) return;
    el.innerHTML = `
      <div class="small" style="margin-bottom:8px">Rules <strong>${esc(String(Number(summary.rule_count || state.recurringRules.length || 0)))}</strong> • due now <strong>${esc(String(Number(summary.due_rule_count || 0)))}</strong></div>
      ${state.recurringRules.length ? state.recurringRules.slice(0, 20).map((row) => `
        <div style="padding:8px 0;border-bottom:1px solid #eee">
          <strong>${esc(row.rule_name)}</strong>${row.vendor_name ? ` — ${esc(row.vendor_name)}` : ''}
          <div class="small">${esc(row.frequency || 'monthly')} • next due ${esc(row.next_due_date || '')} • ${esc(String(Number(row.amount || 0).toFixed(2)))}</div>
          <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" data-edit-recurring-rule="${esc(row.recurring_expense_rule_id)}">Edit</button><button class="btn" type="button" data-generate-recurring-rule="${esc(row.recurring_expense_rule_id)}">Generate expense</button></div>
        </div>
      `).join('') : '<div>No recurring rules yet.</div>'}
    `;
  }

  function renderAttachments() {
    const el = document.getElementById('accountingAttachmentsList');
    if (!el) return;
    if (!state.attachments.length) { el.innerHTML = '<div>No recent accounting attachments yet.</div>'; return; }
    el.innerHTML = state.attachments.map((row) => `
      <div style="padding:8px 0;border-bottom:1px solid #eee">
        <strong>${esc(row.original_filename || 'attachment')}</strong>
        <div class="small">${esc(row.attachment_kind || 'other')} • ${esc(row.period_month || row.tax_year || '')}${row.statement_reference ? ` • ${esc(row.statement_reference)}` : ''}</div>
        <div class="small">${row.public_url ? `<a href="${esc(row.public_url)}" target="_blank" rel="noopener">Open file</a>` : esc(row.object_key || '')}</div>
      </div>
    `).join('');
  }

  function renderReconciliation() {
    const el = document.getElementById('accountingReconciliationList');
    if (!el) return;
    const summary = state.reconciliation.summary || {};
    el.innerHTML = `
      <div class="small" style="margin-bottom:8px">Rows <strong>${esc(String(Number(summary.row_count || state.reconciliation.rows.length || 0)))}</strong> • reviewed <strong>${esc(String(Number(summary.reviewed_count || 0)))}</strong> • finalized <strong>${esc(String(Number(summary.finalized_count || 0)))}</strong> • attachments <strong>${esc(String(Number(summary.attachment_count || 0)))}</strong></div>
      ${state.reconciliation.attachment_preview?.length ? `<div class="small" style="margin-bottom:8px">Recent support files: ${state.reconciliation.attachment_preview.slice(0, 3).map((row) => esc(row.original_filename || 'attachment')).join(', ')}</div>` : ''}
      ${state.reconciliation.rows.length ? state.reconciliation.rows.map((row) => {
        const review = row.review || {};
        return `
          <form class="grid" style="gap:8px;padding:8px 0;border-bottom:1px solid #eee" data-reconciliation-review-form="1">
            <input type="hidden" name="reconciliation_type" value="${esc(state.reconciliation.type)}" />
            <input type="hidden" name="period_month" value="${esc(state.reconciliation.period_month)}" />
            <input type="hidden" name="scope_key" value="${esc(row.scope_key || 'all')}" />
            <input type="hidden" name="reference_amount_cents" value="${esc(row.reference_amount_cents || 0)}" />
            <input type="hidden" name="compared_amount_cents" value="${esc(row.compared_amount_cents || 0)}" />
            <input type="hidden" name="difference_cents" value="${esc(row.difference_cents || 0)}" />
            <input type="hidden" name="detail_json" value='${esc(row.detail_json || review.detail_json || "{}")}' />
            <div><strong>${esc(row.label || row.scope_key || '')}</strong></div>
            <div class="small">Reference ${esc(centsToMoney(row.reference_amount_cents || 0))} • Compared ${esc(centsToMoney(row.compared_amount_cents || 0))} • Difference ${esc(centsToMoney(row.difference_cents || 0))}</div>
            ${row.gross_sales_cents != null ? `<div class="small">Gross sales ${esc(centsToMoney(row.gross_sales_cents || 0))} • shipping ${esc(centsToMoney(row.shipping_cents || 0))} • discount ${esc(centsToMoney(row.discount_cents || 0))}</div>` : ''}
            ${row.fee_ratio_basis_points != null ? `<div class="small">Fee ratio ${(Number(row.fee_ratio_basis_points || 0) / 100).toFixed(2)}% • refunds ${esc(centsToMoney(row.refund_cents || 0))}</div>` : ''}
            ${row.fulfilled_order_count != null ? `<div class="small">Fulfilled orders ${esc(String(Number(row.fulfilled_order_count || 0)))} • shipping expense rows ${esc(String(Number(row.shipping_expense_count || 0)))} </div>` : ''}
            <div class="grid cols-2" style="gap:8px"><input name="statement_reference" type="text" value="${esc(review.statement_reference || '')}" placeholder="Statement reference" /><select name="review_status"><option value="draft" ${review.review_status === 'draft' ? 'selected' : ''}>Draft</option><option value="reviewed" ${review.review_status === 'reviewed' ? 'selected' : ''}>Reviewed</option><option value="needs_accountant" ${review.review_status === 'needs_accountant' ? 'selected' : ''}>Needs accountant</option><option value="finalized" ${review.review_status === 'finalized' ? 'selected' : ''}>Finalized</option></select></div>
            <input name="difference_reason" type="text" value="${esc(review.difference_reason || '')}" placeholder="Why there is a difference / what still needs follow-up" />
            <textarea name="note" rows="2" placeholder="Reconciliation note">${esc(review.note || '')}</textarea>
            <button class="btn primary" type="submit">Save review</button>
          </form>
        `;
      }).join('') : '<div class="small">No reconciliation rows available for this period.</div>'}`;
  }

  function renderYearEndClose() {
    const el = document.getElementById('yearEndCloseList');
    if (!el || !state.yearEnd) return;
    const checklist = state.yearEnd.checklist || {};
    const handoff = state.yearEnd.accountant_handoff || {};
    const gl = handoff.gl_review_summary || {};
    el.innerHTML = `
      <div class="small" style="margin-bottom:8px">Locked months <strong>${esc(String(Number(checklist.locked_month_count || 0)))}</strong> • attachments <strong>${esc(String(Number(checklist.attachment_count || 0)))}</strong> • GIFI finalized <strong>${esc(String(Number(checklist.gifi_finalized_count || 0)))}</strong></div>
      <div class="small">GL active ${esc(String(Number(gl.active_account_count || 0)))} • mapped ${esc(String(Number(gl.mapped_account_count || 0)))} • finalized ${esc(String(Number(gl.finalized_account_count || 0)))} • unmapped ${esc(String(Number(gl.unmapped_account_count || 0)))}</div>
      <div class="small" style="margin-top:8px">Attachment coverage: ${esc(JSON.stringify(handoff.attachment_summary?.by_kind || {}))}</div>
      <div class="small" style="margin-top:8px">Reconciliation coverage: ${esc(JSON.stringify(handoff.reconciliation_summary?.by_type || {}))}</div>
      ${(handoff.recommended_missing_items || []).length ? `<div class="small" style="margin-top:8px"><strong>Still needed:</strong><br>${handoff.recommended_missing_items.map((row) => esc(row)).join('<br>')}</div>` : ''}
    `;
  }

  function syncSelects() {
    const vendorSelect = document.getElementById('recurringVendorSelect');
    if (vendorSelect) vendorSelect.innerHTML = vendorOptions(vendorSelect.value || '');
    const expenseVendor = document.getElementById('expenseVendorSelect');
    if (expenseVendor) expenseVendor.innerHTML = vendorOptions(expenseVendor.value || '');
    const attachmentVendor = document.getElementById('attachmentVendorSelect');
    if (attachmentVendor) attachmentVendor.innerHTML = vendorOptions(attachmentVendor.value || '');
    const recurringSelect = document.getElementById('expenseRecurringRuleSelect');
    if (recurringSelect) recurringSelect.innerHTML = ruleOptions(recurringSelect.value || '');
  }

  function fillRecurringRuleForm(rule) {
    const form = document.getElementById('accountingRecurringRuleForm');
    if (!form || !rule) return;
    ['recurring_expense_rule_id','vendor_id','vendor_name','rule_name','ledger_code','amount','tax_amount','frequency','next_due_date','auto_create_mode','is_active','notes'].forEach((key) => {
      if (form.elements?.[key]) form.elements[key].value = rule[key] == null ? '' : String(rule[key]);
    });
  }

  async function bootstrap() {
    injectCards();
    injectExpenseEnhancements();
    await loadVendors();
    await loadRecurringRules();
    await loadAttachments();
    await loadReconciliation();
    await loadYearEndClose(new Date().getFullYear());
  }

  mount.addEventListener('submit', async (event) => {
    const vendorForm = event.target.closest('#accountingVendorForm');
    if (vendorForm) {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(vendorForm).entries());
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/accounting-vendors', { method: 'POST', body: JSON.stringify(payload) }), 'Failed saving vendor.').catch((error) => { setMessage(error.message, true); return null; });
      if (!data) return;
      vendorForm.reset();
      setMessage('Vendor saved.');
      await loadVendors().catch((error) => setMessage(error.message, true));
      return;
    }

    const ruleForm = event.target.closest('#accountingRecurringRuleForm');
    if (ruleForm) {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(ruleForm).entries());
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/accounting-recurring-expense-rules', { method: 'POST', body: JSON.stringify(payload) }), 'Failed saving recurring rule.').catch((error) => { setMessage(error.message, true); return null; });
      if (!data) return;
      ruleForm.reset();
      if (ruleForm.elements?.next_due_date) ruleForm.elements.next_due_date.value = new Date().toISOString().slice(0, 10);
      if (ruleForm.elements?.is_active) ruleForm.elements.is_active.value = '1';
      if (ruleForm.elements?.frequency) ruleForm.elements.frequency.value = 'monthly';
      setMessage('Recurring expense rule saved.');
      await loadRecurringRules().catch((error) => setMessage(error.message, true));
      return;
    }

    const attachmentForm = event.target.closest('#accountingAttachmentForm');
    if (attachmentForm) {
      event.preventDefault();
      const formData = new FormData(attachmentForm);
      const response = await window.DDAuth.apiFetch('/api/admin/accounting-attachments', { method: 'POST', body: formData, headers: {} });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) return setMessage(data?.error || 'Failed uploading attachment.', true);
      attachmentForm.reset();
      setMessage('Accounting attachment uploaded.');
      await loadAttachments().catch((error) => setMessage(error.message, true));
      await loadYearEndClose(document.getElementById('yearEndCloseYearInput')?.value || new Date().getFullYear()).catch((error) => setMessage(error.message, true));
      return;
    }

    const reviewForm = event.target.closest('[data-reconciliation-review-form="1"]');
    if (reviewForm) {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(reviewForm).entries());
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/accounting-reconciliation', { method: 'POST', body: JSON.stringify(payload) }), 'Failed saving reconciliation review.').catch((error) => { setMessage(error.message, true); return null; });
      if (!data) return;
      setMessage('Reconciliation review saved.');
      await loadReconciliation(state.reconciliation.type, state.reconciliation.period_month).catch((error) => setMessage(error.message, true));
      await loadYearEndClose(document.getElementById('yearEndCloseYearInput')?.value || new Date().getFullYear()).catch((error) => setMessage(error.message, true));
    }
  });

  mount.addEventListener('click', async (event) => {
    const editRule = event.target.closest('[data-edit-recurring-rule]');
    if (editRule) {
      const id = String(editRule.getAttribute('data-edit-recurring-rule') || '');
      const rule = state.recurringRules.find((row) => String(row.recurring_expense_rule_id) === id);
      fillRecurringRuleForm(rule);
      document.getElementById('accountingRecurringRulesCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const generateRule = event.target.closest('[data-generate-recurring-rule]');
    if (generateRule) {
      const id = String(generateRule.getAttribute('data-generate-recurring-rule') || '');
      const payload = { action: 'generate_due', recurring_expense_rule_id: id };
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/accounting-recurring-expense-rules', { method: 'POST', body: JSON.stringify(payload) }), 'Failed generating recurring expense.').catch((error) => { setMessage(error.message, true); return null; });
      if (!data) return;
      setMessage(`Recurring expense generated for ${data.generated?.expense_date || 'today'}.`);
      await loadRecurringRules().catch((error) => setMessage(error.message, true));
      return;
    }
    if (event.target.id === 'clearRecurringRuleButton') {
      const form = document.getElementById('accountingRecurringRuleForm');
      form?.reset();
      if (form?.elements?.next_due_date) form.elements.next_due_date.value = new Date().toISOString().slice(0, 10);
      if (form?.elements?.frequency) form.elements.frequency.value = 'monthly';
      if (form?.elements?.auto_create_mode) form.elements.auto_create_mode.value = 'manual';
      if (form?.elements?.is_active) form.elements.is_active.value = '1';
      return;
    }
    if (event.target.id === 'loadReconciliationButton') {
      const type = document.getElementById('reconciliationTypeInput')?.value || 'sales_tax';
      const periodMonth = document.getElementById('reconciliationMonthInput')?.value || new Date().toISOString().slice(0, 7);
      loadReconciliation(type, periodMonth).catch((error) => setMessage(error.message, true));
      loadAttachments().catch((error) => setMessage(error.message, true));
      return;
    }
    if (event.target.id === 'loadYearEndCloseButton') {
      const year = document.getElementById('yearEndCloseYearInput')?.value || new Date().getFullYear();
      loadYearEndClose(year).catch((error) => setMessage(error.message, true));
      loadAttachments().catch((error) => setMessage(error.message, true));
      return;
    }
    if (event.target.id === 'downloadYearEndCloseButton') {
      const year = document.getElementById('yearEndCloseYearInput')?.value || new Date().getFullYear();
      window.open(`/api/admin/accounting-year-end-close?year=${encodeURIComponent(year)}&format=json`, '_blank');
    }
  });

  bootstrap().catch((error) => setMessage(error.message || String(error), true));
});
