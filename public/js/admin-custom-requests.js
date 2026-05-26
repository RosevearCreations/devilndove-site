// File: /public/js/admin-custom-requests.js
// Brief description: Operations admin panel for reviewing custom requests and converting them into quote/job/product/payment planning records.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('customRequestsAdminMount');
  if (!mount || !window.DDAuth) return;

  function esc(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function money(cents) { const amount = Number(cents || 0) / 100; return amount > 0 ? amount.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' }) : '—'; }
  async function readJson(response) { const data = await response.json().catch(() => null); if (!response.ok || !data?.ok) throw new Error(data?.error || `Request failed (${response.status})`); return data; }
  function setMsg(text, isError = false) { const el = document.getElementById('customRequestsAdminMessage'); if (!el) return; el.textContent = text || ''; el.style.display = text ? 'block' : 'none'; el.style.color = isError ? '#b00020' : '#0a7a2f'; }
  function attachmentLinks(value) { try { const list = JSON.parse(value || '[]'); return Array.isArray(list) ? list.map((url) => `<a href="${esc(url)}" target="_blank" rel="noopener">reference</a>`).join(' ') : ''; } catch { return ''; } }
  function historyBadge(history, email) { const row = (Array.isArray(history) ? history : []).find((item) => String(item.email || '').toLowerCase() === String(email || '').toLowerCase()); if (!row) return ''; return `<span class="status-note small">Repeat requester: ${esc(row.request_count || 0)} request(s)</span>`; }
  function rowsForRequest(rows, id) { return (Array.isArray(rows) ? rows : []).filter((item) => Number(item.custom_request_id || 0) === Number(id || 0)); }

  function renderDraftSummary(row, data) {
    const id = Number(row.custom_request_id || 0);
    const quote = rowsForRequest(data.quote_drafts, id)[0];
    const job = rowsForRequest(data.job_drafts, id)[0];
    const product = rowsForRequest(data.product_drafts, id)[0];
    const reply = rowsForRequest(data.reply_templates, id)[0];
    const candidates = rowsForRequest(data.payment_candidates, id);
    const pills = [];
    if (quote) pills.push(`<span class="status-note small">Quote: ${esc(quote.quote_key)} / ${esc(quote.quote_status || 'draft')}</span>`);
    if (job) pills.push(`<span class="status-note small">Job: ${esc(job.job_key)} / ${esc(job.job_status || 'draft')}</span>`);
    if (product) pills.push(`<span class="status-note small">Product plan: ${esc(product.product_draft_key)} / ${esc(product.product_draft_status || 'draft')}</span>`);
    if (reply) pills.push(`<span class="status-note small">Reply template ready</span>`);
    candidates.forEach((candidate) => pills.push(`<span class="status-note small">${esc(candidate.candidate_type || 'payment')}: ${money(candidate.amount_cents)} / ${esc(candidate.candidate_status || 'draft')}</span>`));
    return pills.join(' ');
  }

  function renderReplyTemplates(data) {
    const rows = Array.isArray(data.reply_templates) ? data.reply_templates : [];
    if (!rows.length) return '<p class="small">No reply templates yet. Use “Create reply template” on a request row.</p>';
    return rows.slice(0, 15).map((template) => `<article class="card custom-request-template-card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;flex-wrap:wrap"><div><strong>${esc(template.subject || '')}</strong><div class="small">${esc(template.template_key || '')} • request #${esc(template.custom_request_id || '')}</div></div><button class="btn small" type="button" data-copy-reply-template="${esc(template.custom_request_reply_template_id || '')}">Copy body</button></div><textarea class="input" rows="8" readonly data-reply-template-body="${esc(template.custom_request_reply_template_id || '')}">${esc(template.body_text || '')}</textarea></article>`).join('');
  }

  function renderPaymentCandidates(data) {
    const rows = Array.isArray(data.payment_candidates) ? data.payment_candidates : [];
    if (!rows.length) return '<p class="small">No deposit or invoice candidates yet.</p>';
    return `<div class="admin-table-wrap"><table><thead><tr><th>Type</th><th>Amount</th><th>Customer</th><th>Status</th><th>Description</th></tr></thead><tbody>${rows.slice(0, 25).map((row) => `<tr><td>${esc(row.candidate_type || '')}<br><span class="small">${esc(row.candidate_key || '')}</span></td><td>${money(row.amount_cents)}</td><td>${esc(row.customer_name || '')}<br><span class="small">${esc(row.customer_email || '')}</span></td><td>${esc(row.candidate_status || '')}</td><td class="small">${esc(row.description || '')}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function render(data = {}) {
    const requests = Array.isArray(data.requests) ? data.requests : [];
    const summary = data.summary || {};
    const result = document.getElementById('customRequestsAdminRows');
    if (!result) return;
    result.innerHTML = `
      <div class="release-sanity-summary" style="margin-top:12px"><div><strong>${esc(summary.total || 0)}</strong> request(s)</div><div class="small">Open ${esc(summary.open_count || 0)} • Quote needed ${esc(summary.quote_needed_count || 0)} • Accepted ${esc(summary.accepted_count || 0)}</div></div>
      <div class="card" style="margin-top:12px"><strong>Conversion workflow</strong><p class="small">Turn an intake row into internal planning records: quote draft, manual reply template, deposit candidate, job draft, invoice candidate, and product draft plan. Nothing is automatically emailed, billed, or published.</p></div>
      <div class="admin-table-wrap" style="margin-top:12px"><table><thead><tr><th>Status</th><th>Request</th><th>Contact</th><th>Details</th><th>Review & convert</th></tr></thead><tbody>
        ${requests.map((row) => `<tr>
          <td><strong>${esc(row.status || 'new')}</strong><br><span class="small">${esc(row.created_at || '')}</span></td>
          <td><strong>${esc(row.request_type || '')}</strong><br><span class="small">${esc(row.product_interest || '')}</span><br><span class="small">Budget ${money(row.budget_cents)} • Deadline ${esc(row.deadline_date || '—')}</span><div style="margin-top:6px">${renderDraftSummary(row, data)}</div></td>
          <td>${esc(row.name || '')}<br><a href="mailto:${esc(row.email || '')}">${esc(row.email || '')}</a><br><span class="small">${esc(row.phone || '')}</span><div style="margin-top:6px">${historyBadge(data.customer_history || [], row.email)}</div></td>
          <td><div class="small" style="max-width:420px;white-space:pre-wrap">${esc(row.message || '')}</div>${attachmentLinks(row.attachment_urls_json)}</td>
          <td><select data-custom-request-status="${esc(row.custom_request_id)}"><option value="new" ${row.status === 'new' ? 'selected' : ''}>New</option><option value="reviewing" ${row.status === 'reviewing' ? 'selected' : ''}>Reviewing</option><option value="quote_needed" ${row.status === 'quote_needed' ? 'selected' : ''}>Quote needed</option><option value="quoted" ${row.status === 'quoted' ? 'selected' : ''}>Quoted</option><option value="accepted" ${row.status === 'accepted' ? 'selected' : ''}>Accepted</option><option value="declined" ${row.status === 'declined' ? 'selected' : ''}>Declined</option><option value="archived" ${row.status === 'archived' ? 'selected' : ''}>Archived</option></select><textarea data-custom-request-notes="${esc(row.custom_request_id)}" rows="3" placeholder="Admin notes">${esc(row.admin_notes || '')}</textarea><div class="custom-request-actions"><button class="btn small" data-custom-request-save="${esc(row.custom_request_id)}">Save review</button><button class="btn small" data-custom-request-action="create_quote_draft" data-custom-request-id="${esc(row.custom_request_id)}">Quote draft</button><button class="btn small" data-custom-request-action="create_reply_template" data-custom-request-id="${esc(row.custom_request_id)}">Reply template</button><button class="btn small" data-custom-request-action="create_deposit_candidate" data-custom-request-id="${esc(row.custom_request_id)}">Deposit candidate</button><button class="btn small" data-custom-request-action="create_job_draft" data-custom-request-id="${esc(row.custom_request_id)}">Job draft</button><button class="btn small" data-custom-request-action="create_invoice_candidate" data-custom-request-id="${esc(row.custom_request_id)}">Invoice candidate</button><button class="btn small" data-custom-request-action="create_product_draft" data-custom-request-id="${esc(row.custom_request_id)}">Product plan</button></div></td>
        </tr>`).join('') || '<tr><td colspan="5">No custom requests yet.</td></tr>'}
      </tbody></table></div>
      <details style="margin-top:12px" open><summary>Manual customer reply templates</summary>${renderReplyTemplates(data)}</details>
      <details style="margin-top:12px" open><summary>Deposit and invoice candidates</summary>${renderPaymentCandidates(data)}</details>
      <details style="margin-top:12px"><summary>Recent conversion events</summary><div class="small">${(data.conversion_events || []).slice(0, 30).map((event) => `${esc(event.created_at || '')} • request #${esc(event.custom_request_id || '')} • ${esc(event.conversion_type || '')} • ${esc(event.target_key || '')}`).join('<br>') || 'No conversion events yet.'}</div></details>`;
  }

  async function load() {
    try { setMsg('Loading custom requests...'); const data = await readJson(await window.DDAuth.apiFetch('/api/admin/custom-requests')); render(data); setMsg(`Loaded ${data.requests?.length || 0} custom request(s).`); }
    catch (error) { setMsg(error.message || 'Unable to load custom requests.', true); }
  }

  async function save(id) {
    const status = document.querySelector(`[data-custom-request-status="${CSS.escape(String(id))}"]`)?.value || 'reviewing';
    const admin_notes = document.querySelector(`[data-custom-request-notes="${CSS.escape(String(id))}"]`)?.value || '';
    try { const data = await readJson(await window.DDAuth.apiFetch('/api/admin/custom-requests', { method: 'POST', body: JSON.stringify({ custom_request_id: Number(id), status, admin_notes, action: 'update_review' }) })); render(data); setMsg('Custom request review saved.'); }
    catch (error) { setMsg(error.message || 'Unable to save custom request.', true); }
  }

  async function runAction(id, action) {
    try { setMsg('Saving custom request conversion...'); const data = await readJson(await window.DDAuth.apiFetch('/api/admin/custom-requests', { method: 'POST', body: JSON.stringify({ custom_request_id: Number(id), action }) })); render(data); setMsg(data.message || 'Custom request conversion saved.'); }
    catch (error) { setMsg(error.message || 'Unable to convert custom request.', true); }
  }

  mount.innerHTML = `<div class="card" style="margin-top:18px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h2 style="margin-top:0">Custom Requests</h2><p class="small" style="margin:0">Review engraving, personalized gift, and workshop-made commission requests before turning them into quotes, replies, deposits, jobs, invoices, or product draft plans.</p></div><button class="btn" type="button" id="customRequestsLoadButton">Refresh requests</button></div><div id="customRequestsAdminMessage" class="small" style="display:none;margin-top:10px"></div><div id="customRequestsAdminRows"></div></div>`;
  document.getElementById('customRequestsLoadButton')?.addEventListener('click', load);
  mount.addEventListener('click', async (event) => {
    const saveButton = event.target.closest('[data-custom-request-save]');
    if (saveButton) save(saveButton.getAttribute('data-custom-request-save'));
    const actionButton = event.target.closest('[data-custom-request-action]');
    if (actionButton) runAction(actionButton.getAttribute('data-custom-request-id'), actionButton.getAttribute('data-custom-request-action'));
    const copyButton = event.target.closest('[data-copy-reply-template]');
    if (copyButton) {
      const id = copyButton.getAttribute('data-copy-reply-template');
      const body = mount.querySelector(`[data-reply-template-body="${CSS.escape(String(id))}"]`)?.value || '';
      try { await navigator.clipboard.writeText(body); setMsg('Reply body copied.'); } catch { setMsg('Copy failed; select the template text manually.', true); }
    }
  });
  load();
});
