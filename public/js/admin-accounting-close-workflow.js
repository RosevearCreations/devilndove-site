// File: /public/js/admin-accounting-close-workflow.js
// Brief description: Accounting close workflow panel for payment application, HST/GST review, month-end close, and export manifest.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('accountingCloseWorkflowMount');
  if (!mount || !window.DDAuth) return;
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const money = (value) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format((Number(value || 0) || 0) / 100);
  const monthNow = () => new Date().toISOString().slice(0, 7);
  const setMsg = (text, error = false) => { const el = document.getElementById('accountingCloseWorkflowMessage'); if (!el) return; el.textContent = text || ''; el.style.display = text ? 'block' : 'none'; el.style.color = error ? '#b00020' : '#14532d'; };
  async function readJson(response) { const data = await response.json().catch(() => null); if (!response.ok || !data?.ok) throw new Error(data?.error || 'Accounting close workflow request failed.'); return data; }
  function period() { return document.getElementById('accountingClosePeriod')?.value || monthNow(); }

  function renderPaymentRows(rows) {
    return (rows || []).slice(0, 30).map((row) => `<tr><td><strong>${esc(row.order_number || `#${row.order_id}`)}</strong><div class="small">${esc(row.customer_name || row.customer_email || '')}</div></td><td>${money(row.total_cents)}</td><td>${money(row.paid_cents)}</td><td>${money(row.outstanding_cents)}</td><td><button class="btn small" type="button" data-apply-order-payment="${esc(row.order_id)}" data-amount="${esc(row.outstanding_cents || row.total_cents || 0)}">Apply</button></td></tr>`).join('') || '<tr><td colspan="5">No orders found for this period.</td></tr>';
  }
  function renderPackages(rows) {
    return (rows || []).slice(0, 10).map((row) => `<div class="card" style="margin-bottom:8px"><strong>${esc(row.package_key || '')}</strong><div class="small">${esc(row.package_status || '')} • ${esc(row.period_month || row.tax_year || '')} • ${esc(row.updated_at || row.created_at || '')}</div><details><summary>Manifest preview</summary><pre style="white-space:pre-wrap;max-height:240px;overflow:auto">${esc(row.manifest_json || '{}')}</pre></details></div>`).join('') || '<div class="small">No accountant export packages yet.</div>';
  }
  function checklistChecked(checklist, key) { return Number(checklist?.[key] || 0) === 1 ? 'checked' : ''; }

  function render(data) {
    const payment = data.payment || { summary: {}, pending_orders: [] };
    const hst = data.hst_review || {};
    const closure = data.closure || { close_checklist: {} };
    const checklist = closure.close_checklist || {};
    const readiness = data.close_readiness || { ready: false, blockers: [] };
    mount.innerHTML = `
      <div class="card" id="accountingCloseWorkflowCard" style="margin-top:18px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
          <div><h2 style="margin-top:0">Accounting Close Workflow</h2><p class="small" style="margin:8px 0 0 0">One place to review payment application, HST/GST, month-end close, and accountant export readiness.</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end"><label class="small">Period<input id="accountingClosePeriod" type="month" value="${esc(data.period_month || monthNow())}"></label><button class="btn" type="button" id="accountingCloseRefreshButton">Refresh</button></div>
        </div>
        <div id="accountingCloseWorkflowMessage" class="small" style="display:none;margin-top:10px"></div>
        <div class="grid cols-4 media-diagnostic-metrics" style="margin-top:12px">
          <div class="card"><div class="small">Orders</div><strong>${esc(payment.summary.order_count || 0)}</strong></div>
          <div class="card"><div class="small">Paid</div><strong>${money(payment.summary.paid_cents || 0)}</strong></div>
          <div class="card"><div class="small">Outstanding</div><strong>${money(payment.summary.outstanding_cents || 0)}</strong></div>
          <div class="card"><div class="small">Close readiness</div><strong>${readiness.ready ? 'Ready' : 'Review'}</strong></div>
        </div>
        ${readiness.blockers?.length ? `<div class="card" style="margin-top:12px"><strong>Close blockers</strong><ul class="small compact-list">${readiness.blockers.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : '<div class="card" style="margin-top:12px"><strong>Close blockers</strong><p class="small">No blockers detected by this helper.</p></div>'}
        <details style="margin-top:12px" open><summary>Payment application</summary>
          <p class="small">Use this to record which order balance, provider payment, fee, and tax component have been reviewed for the period.</p>
          <form id="paymentApplicationForm" class="admin-form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px">
            <input name="order_id" type="number" placeholder="Order ID"><input name="payment_id" type="number" placeholder="Payment ID optional"><input name="applied_amount_cents" type="number" placeholder="Applied cents"><input name="fee_amount_cents" type="number" placeholder="Fee cents"><input name="tax_component_cents" type="number" placeholder="Tax cents"><input name="provider" placeholder="stripe/paypal/manual"><input name="transaction_reference" placeholder="transaction/reference"><select name="application_status"><option value="draft">draft</option><option value="reviewed">reviewed</option><option value="applied">applied</option><option value="needs_review">needs_review</option></select><textarea name="application_notes" rows="2" placeholder="Application notes" style="grid-column:1/-1"></textarea><button class="btn primary" type="submit">Save payment application</button>
          </form>
          <div class="admin-table-wrap" style="margin-top:10px"><table><thead><tr><th>Order</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Action</th></tr></thead><tbody>${renderPaymentRows(payment.pending_orders)}</tbody></table></div>
        </details>
        <details style="margin-top:12px" open><summary>HST/GST review</summary>
          <form id="hstReviewForm" class="admin-form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px">
            <input name="sales_tax_collected_cents" type="number" value="${esc(hst.sales_tax_collected_cents || payment.summary.tax_cents || 0)}" placeholder="Tax collected cents"><input name="input_tax_credit_cents" type="number" value="${esc(hst.input_tax_credit_cents || 0)}" placeholder="ITC cents"><input name="net_tax_payable_cents" type="number" value="${esc(hst.net_tax_payable_cents || 0)}" placeholder="Net payable cents"><input name="filing_reference" value="${esc(hst.filing_reference || '')}" placeholder="Filing/remittance ref"><input name="filing_due_date" type="date" value="${esc(hst.filing_due_date || '')}"><input name="reminder_date" type="date" value="${esc(hst.reminder_date || '')}" title="Reminder date"><input name="remittance_evidence_url" value="${esc(hst.remittance_evidence_url || '')}" placeholder="Evidence URL / file link"><select name="review_status"><option value="draft" ${hst.review_status==='draft'?'selected':''}>draft</option><option value="reviewed" ${hst.review_status==='reviewed'?'selected':''}>reviewed</option><option value="finalized" ${hst.review_status==='finalized'?'selected':''}>finalized</option><option value="filed" ${hst.review_status==='filed'?'selected':''}>filed</option></select><select name="remittance_status"><option value="not_ready" ${hst.remittance_status==='not_ready'?'selected':''}>not_ready</option><option value="ready" ${hst.remittance_status==='ready'?'selected':''}>ready</option><option value="paid" ${hst.remittance_status==='paid'?'selected':''}>paid</option><option value="needs_accountant" ${hst.remittance_status==='needs_accountant'?'selected':''}>needs_accountant</option></select><textarea name="notes" rows="2" placeholder="HST/GST notes" style="grid-column:1/-1">${esc(hst.notes || '')}</textarea><button class="btn primary" type="submit">Save HST/GST review</button>
          </form>
        </details>
        <details style="margin-top:12px" open><summary>Month-end close checklist</summary>
          <form id="closeChecklistForm" class="admin-form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
            <label class="small"><input name="bank_reconciled" type="checkbox" ${checklistChecked(checklist,'bank_reconciled')}> Bank/reconciliation reviewed</label><label class="small"><input name="sales_tax_reviewed" type="checkbox" ${checklistChecked(checklist,'sales_tax_reviewed')}> HST/GST reviewed</label><label class="small"><input name="receipts_attached" type="checkbox" ${checklistChecked(checklist,'receipts_attached')}> Receipts/bills attached</label><label class="small"><input name="gifi_reviewed" type="checkbox" ${checklistChecked(checklist,'gifi_reviewed')}> GIFI reviewed</label><label class="small"><input name="schedule_141_notes_started" type="checkbox" ${checklistChecked(checklist,'schedule_141_notes_started')}> Schedule 141 notes started</label><label class="small"><input name="accountant_followup_flagged" type="checkbox" ${checklistChecked(checklist,'accountant_followup_flagged')}> Accountant follow-up flagged</label><textarea name="close_notes" rows="2" placeholder="Close notes" style="grid-column:1/-1">${esc(closure.close_notes || '')}</textarea><button class="btn primary" type="submit">Save close checklist</button>
          </form>
        </details>
        <details style="margin-top:12px" open><summary>Accountant export packaging</summary>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0"><button class="btn primary" type="button" id="createExportManifestButton">Create export manifest</button><a class="btn" href="/api/admin/accounting-close-workflow?period_month=${encodeURIComponent(data.period_month || monthNow())}&format=csv" target="_blank" rel="noopener">Download close CSV</a><a class="btn" href="/api/admin/accounting-period-summary-export" target="_blank" rel="noopener">Open period export endpoint</a><a class="btn" href="/api/admin/accounting-year-end-close" target="_blank" rel="noopener">Open year-end bundle endpoint</a></div>
          <div>${renderPackages(data.export_packages || [])}</div>
        </details>
      </div>`;
    wire();
  }

  async function post(payload) { payload.period_month = period(); const data = await readJson(await window.DDAuth.apiFetch('/api/admin/accounting-close-workflow', { method: 'POST', body: JSON.stringify(payload) })); render(data); setMsg(data.message || 'Saved.'); }
  function wire() {
    document.getElementById('accountingCloseRefreshButton')?.addEventListener('click', load);
    mount.querySelectorAll('[data-apply-order-payment]').forEach((button) => button.addEventListener('click', () => {
      const form = document.getElementById('paymentApplicationForm');
      if (!form) return;
      form.elements.order_id.value = button.getAttribute('data-apply-order-payment') || '';
      form.elements.applied_amount_cents.value = button.getAttribute('data-amount') || '0';
      form.elements.application_status.value = 'reviewed';
    }));
    document.getElementById('paymentApplicationForm')?.addEventListener('submit', async (event) => { event.preventDefault(); const payload = Object.fromEntries(new FormData(event.target).entries()); payload.action = 'save_payment_application'; await post(payload).catch((error) => setMsg(error.message, true)); });
    document.getElementById('hstReviewForm')?.addEventListener('submit', async (event) => { event.preventDefault(); const payload = Object.fromEntries(new FormData(event.target).entries()); payload.action = 'save_hst_review'; await post(payload).catch((error) => setMsg(error.message, true)); });
    document.getElementById('closeChecklistForm')?.addEventListener('submit', async (event) => { event.preventDefault(); const form = event.target; const payload = Object.fromEntries(new FormData(form).entries()); payload.action = 'save_close_checklist'; ['bank_reconciled','sales_tax_reviewed','receipts_attached','gifi_reviewed','schedule_141_notes_started','accountant_followup_flagged'].forEach((key) => { payload[key] = form.elements[key].checked ? 1 : 0; }); await post(payload).catch((error) => setMsg(error.message, true)); });
    document.getElementById('createExportManifestButton')?.addEventListener('click', async () => { await post({ action: 'create_export_manifest', package_status: 'draft' }).catch((error) => setMsg(error.message, true)); });
  }
  async function load() { try { setMsg('Loading accounting close workflow...'); const data = await readJson(await window.DDAuth.apiFetch(`/api/admin/accounting-close-workflow?period_month=${encodeURIComponent(period())}`)); render(data); setMsg('Accounting close workflow loaded.'); } catch (error) { mount.innerHTML = `<div class="card" style="margin-top:18px"><h2>Accounting Close Workflow</h2><p class="small">${esc(error.message || 'Unable to load accounting close workflow.')}</p></div>`; } }
  mount.innerHTML = `<div class="card" style="margin-top:18px"><h2>Accounting Close Workflow</h2><label class="small">Period<input id="accountingClosePeriod" type="month" value="${esc(monthNow())}"></label><div id="accountingCloseWorkflowMessage" class="small" style="display:none;margin-top:10px"></div></div>`;
  load();
});
