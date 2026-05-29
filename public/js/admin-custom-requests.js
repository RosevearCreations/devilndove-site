// File: /public/js/admin-custom-requests.js
// Brief description: Operations admin panel for reviewing custom requests and converting them into quote/job/product/payment planning records with editable line items, revision history, consent review, and accepted-quote follow-through.

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
    const preview = rowsForRequest(data.quote_preview_links, id)[0];
    const payReq = rowsForRequest(data.payment_request_drafts, id)[0];
    const orderDraft = rowsForRequest(data.order_drafts, id)[0];
    const revisions = rowsForRequest(data.quote_revisions, id);
    const pills = [];
    if (quote) pills.push(`<span class="status-note small">Quote: ${esc(quote.quote_key)} / ${esc(quote.quote_status || 'draft')}</span>`);
    if (job) pills.push(`<span class="status-note small">Job: ${esc(job.job_key)} / ${esc(job.job_status || 'draft')}</span>`);
    if (product) pills.push(`<span class="status-note small">Product plan: ${esc(product.product_draft_key)} / ${esc(product.product_draft_status || 'draft')}</span>`);
    if (reply) pills.push(`<span class="status-note small">Reply template ready</span>`);
    candidates.forEach((candidate) => pills.push(`<span class="status-note small">${esc(candidate.candidate_type || 'payment')}: ${money(candidate.amount_cents)} / ${esc(candidate.candidate_status || 'draft')}</span>`));
    if (preview) pills.push(`<span class="status-note small">Preview: ${esc(preview.share_status || 'active')}</span>`);
    if (payReq) pills.push(`<span class="status-note small">Payment request draft: ${money(payReq.amount_cents)} / ${esc(payReq.payment_request_status || 'review_needed')}</span>`);
    if (orderDraft) pills.push(`<span class="status-note small">Order draft: ${money(orderDraft.total_cents)} / ${esc(orderDraft.order_draft_status || 'review_needed')}</span>`);
    rowsForRequest(data.payment_links, id).forEach((link) => pills.push(`<span class="status-note small">Payment link: ${esc(link.link_status || 'active')}</span>`));
    rowsForRequest(data.marketplace_export_packs, id).forEach((pack) => pills.push(`<span class="status-note small">Marketplace pack: ${esc(pack.export_status || 'draft')}</span>`));
    rowsForRequest(data.fulfillment_prompts, id).forEach((prompt) => pills.push(`<span class="status-note small">Fulfillment prompt: ${esc(prompt.prompt_status || 'draft')}</span>`));
    if (revisions.length) pills.push(`<span class="status-note small">Revisions: ${esc(revisions.length)}</span>`);
    return pills.join(' ');
  }

  function renderReplyTemplates(data) {
    const rows = Array.isArray(data.reply_templates) ? data.reply_templates : [];
    if (!rows.length) return '<p class="small">No reply templates yet. Use “Create reply template” on a request row.</p>';
    return rows.slice(0, 15).map((template) => `<article class="card custom-request-template-card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;flex-wrap:wrap"><div><strong>${esc(template.subject || '')}</strong><div class="small">${esc(template.template_key || '')} • request #${esc(template.custom_request_id || '')}</div></div><button class="btn small" type="button" data-copy-reply-template="${esc(template.custom_request_reply_template_id || '')}">Copy body</button></div><textarea class="input" rows="8" readonly data-reply-template-body="${esc(template.custom_request_reply_template_id || '')}">${esc(template.body_text || '')}</textarea></article>`).join('');
  }


  function renderQuotePreviewLinks(data) {
    const rows = Array.isArray(data.quote_preview_links) ? data.quote_preview_links : [];
    if (!rows.length) return '<p class="small">No private quote preview links yet.</p>';
    return `<div class="admin-table-wrap"><table><thead><tr><th>Quote</th><th>Customer</th><th>Status</th><th>Private link</th><th>Response</th></tr></thead><tbody>${rows.slice(0, 25).map((row) => {
      const url = `/custom-request/quote/?token=${encodeURIComponent(row.share_token || '')}`;
      return `<tr><td><strong>${esc(row.title || '')}</strong><br><span class="small">Request #${esc(row.custom_request_id || '')} • ${money(row.quote_total_cents)}</span></td><td>${esc(row.customer_name || '')}<br><span class="small">${esc(row.customer_email || '')}</span></td><td>${esc(row.share_status || '')}<br><span class="small">Expires ${esc(row.expires_at || '—')}</span></td><td><a href="${esc(url)}" target="_blank" rel="noopener">Open preview</a><br><button class="btn small" type="button" data-copy-preview-link="${esc(url)}">Copy link</button></td><td class="small">${row.accepted_at ? `Accepted ${esc(row.accepted_at)}` : row.declined_at ? `Declined ${esc(row.declined_at)}` : 'No response yet.'}<br>${esc(row.customer_response_note || '')}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }


  function renderApprovedPaymentLinks(data) {
    const rows = Array.isArray(data.payment_links) ? data.payment_links : [];
    if (!rows.length) return '<p class="small">No approved internal payment links yet. Use “Approve payment link” only after reviewing the payment-request draft.</p>';
    return `<div class="admin-table-wrap"><table><thead><tr><th>Payment link</th><th>Customer</th><th>Amount</th><th>Status</th><th>Private link</th></tr></thead><tbody>${rows.slice(0, 25).map((row) => {
      const url = row.link_path || `/custom-request/pay/?token=${encodeURIComponent(row.link_token || '')}`;
      return `<tr><td><strong>${esc(row.payment_link_key || '')}</strong><br><span class="small">Request #${esc(row.custom_request_id || '')}</span></td><td>${esc(row.customer_name || '')}<br><span class="small">${esc(row.customer_email || '')}</span></td><td>${money(row.amount_cents)}<br><span class="small">Tax ${money(row.tax_cents)}</span></td><td>${esc(row.link_status || '')}<br><span class="small">Viewed ${esc(row.customer_viewed_at || row.viewed_at || '—')}</span></td><td><a href="${esc(url)}" target="_blank" rel="noopener">Open payment review</a><br><button class="btn small" type="button" data-copy-payment-link="${esc(url)}">Copy link</button></td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  function renderMarketplaceExportPacks(data) {
    const rows = Array.isArray(data.marketplace_export_packs) ? data.marketplace_export_packs : [];
    if (!rows.length) return '<p class="small">No marketplace export packs yet. Use “Marketplace pack” after the product plan and quote scope are reviewed.</p>';
    return rows.slice(0, 12).map((pack) => `<article class="card custom-request-template-card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;flex-wrap:wrap"><div><strong>${esc(pack.export_key || '')}</strong><div class="small">Request #${esc(pack.custom_request_id || '')} • ${esc(pack.export_status || 'draft')}</div></div><button class="btn small" type="button" data-copy-marketplace-pack="${esc(pack.custom_request_marketplace_export_pack_id || '')}">Copy all copy</button></div><div class="admin-form-grid" style="margin-top:8px"><label class="small">Etsy<textarea class="input" rows="5" readonly data-marketplace-pack-body="${esc(pack.custom_request_marketplace_export_pack_id || '')}">${esc(pack.etsy_title || '')}

${esc(pack.etsy_description || '')}

Tags: ${esc(pack.etsy_tags || '')}</textarea></label><label class="small">Facebook<textarea class="input" rows="5" readonly>${esc(pack.facebook_title || '')}

${esc(pack.facebook_description || '')}</textarea></label><label class="small">Pinterest<textarea class="input" rows="5" readonly>${esc(pack.pinterest_title || '')}

${esc(pack.pinterest_description || '')}</textarea></label><label class="small">Manual listing<textarea class="input" rows="5" readonly>${esc(pack.manual_listing_title || '')}

${esc(pack.manual_listing_description || '')}

${esc(pack.suggested_local_keywords || '')}</textarea></label></div></article>`).join('');
  }

  function renderFulfillmentPrompts(data) {
    const rows = Array.isArray(data.fulfillment_prompts) ? data.fulfillment_prompts : [];
    if (!rows.length) return '<p class="small">No post-fulfillment review/photo/consent prompts yet. Generate one after the job/order is fulfilled.</p>';
    return rows.slice(0, 15).map((prompt) => `<article class="card custom-request-template-card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;flex-wrap:wrap"><div><strong>${esc(prompt.prompt_key || '')}</strong><div class="small">Request #${esc(prompt.custom_request_id || '')} • ${esc(prompt.prompt_status || 'draft')}</div></div><button class="btn small" type="button" data-copy-fulfillment-prompt="${esc(prompt.custom_request_fulfillment_prompt_id || '')}">Copy prompt</button></div><textarea class="input" rows="8" readonly data-fulfillment-prompt-body="${esc(prompt.custom_request_fulfillment_prompt_id || '')}">${esc(prompt.review_prompt_text || '')}

${esc(prompt.photo_prompt_text || '')}

${esc(prompt.consent_prompt_text || '')}</textarea></article>`).join('');
  }

  function renderPaymentCandidates(data) {
    const rows = Array.isArray(data.payment_candidates) ? data.payment_candidates : [];
    if (!rows.length) return '<p class="small">No deposit or invoice candidates yet.</p>';
    return `<div class="admin-table-wrap"><table><thead><tr><th>Type</th><th>Amount</th><th>Customer</th><th>Status</th><th>Description</th></tr></thead><tbody>${rows.slice(0, 25).map((row) => `<tr><td>${esc(row.candidate_type || '')}<br><span class="small">${esc(row.candidate_key || '')}</span></td><td>${money(row.amount_cents)}</td><td>${esc(row.customer_name || '')}<br><span class="small">${esc(row.customer_email || '')}</span></td><td>${esc(row.candidate_status || '')}</td><td class="small">${esc(row.description || '')}</td></tr>`).join('')}</tbody></table></div>`;
  }



  function renderQuoteLineItems(data) {
    const quotes = Array.isArray(data.quote_drafts) ? data.quote_drafts : [];
    if (!quotes.length) return '<p class="small">No quote drafts yet. Create a quote draft from a custom request first.</p>';
    const lines = Array.isArray(data.quote_line_items) ? data.quote_line_items : [];
    return quotes.slice(0, 20).map((quote) => {
      const quoteLines = lines.filter((line) => Number(line.quote_draft_id || 0) === Number(quote.custom_request_quote_draft_id || 0));
      return `<article class="card custom-request-template-card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;flex-wrap:wrap"><div><strong>${esc(quote.title || quote.quote_key || 'Quote')}</strong><div class="small">${esc(quote.quote_key || '')} • request #${esc(quote.custom_request_id || '')} • total ${money(quote.quote_total_cents || quote.estimated_budget_cents)}</div></div><button class="btn small" type="button" data-custom-request-action="create_accepted_payment_order_drafts" data-custom-request-id="${esc(quote.custom_request_id || '')}">Create accepted follow-through drafts</button></div>
      <div class="admin-table-wrap" style="margin-top:8px"><table><thead><tr><th>Type</th><th>Label</th><th>Qty</th><th>Unit</th><th>Total</th><th>Taxable</th></tr></thead><tbody>${quoteLines.map((line) => `<tr><td>${esc(line.line_type || '')}</td><td>${esc(line.line_label || '')}</td><td>${esc(line.quantity || 1)}</td><td>${money(line.unit_amount_cents)}</td><td>${money(line.line_amount_cents)}</td><td>${Number(line.is_taxable || 0) === 1 ? 'yes' : 'no'}</td></tr>`).join('') || '<tr><td colspan="6">No line items yet.</td></tr>'}</tbody></table></div>
      <form class="admin-form-grid quote-line-item-form" data-quote-line-item-form="${esc(quote.custom_request_id || '')}" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-top:8px"><select name="line_type"><option value="material">material</option><option value="labour">labour</option><option value="pickup_shipping">pickup/shipping</option><option value="custom">custom</option><option value="discount">discount</option></select><input name="line_label" placeholder="Line label"><input name="quantity" type="number" step="0.01" value="1" placeholder="Qty"><input name="unit_amount_cents" type="number" placeholder="Unit cents"><select name="is_taxable"><option value="1">taxable</option><option value="0">not taxable</option></select><input name="sort_order" type="number" value="100" placeholder="Sort"><button class="btn small primary" type="button" data-save-quote-line="${esc(quote.custom_request_id || '')}">Add line</button></form></article>`;
    }).join('');
  }

  function renderAcceptedDrafts(data) {
    const payment = Array.isArray(data.payment_request_drafts) ? data.payment_request_drafts : [];
    const orders = Array.isArray(data.order_drafts) ? data.order_drafts : [];
    if (!payment.length && !orders.length) return '<p class="small">No accepted quote follow-through drafts yet. They are created when a customer accepts a preview, or manually from the line-item section.</p>';
    return `<div class="admin-table-wrap"><table><thead><tr><th>Kind</th><th>Key</th><th>Customer</th><th>Status</th><th>Amount</th><th>Notes</th><th>Reviewed action</th></tr></thead><tbody>${payment.map((row) => `<tr><td>Payment request</td><td>${esc(row.payment_request_key || '')}</td><td>${esc(row.customer_name || '')}<br><span class="small">${esc(row.customer_email || '')}</span></td><td>${esc(row.payment_request_status || '')}<br><span class="small">${esc(row.approved_payment_link_url || '')}</span></td><td>${money(row.amount_cents)}</td><td class="small">${esc(row.review_notes || '')}</td><td><button class="btn small" type="button" data-custom-request-action="approve_payment_link" data-custom-request-id="${esc(row.custom_request_id || '')}">Approve payment link</button></td></tr>`).join('')}${orders.map((row) => `<tr><td>Order draft</td><td>${esc(row.order_draft_key || '')}</td><td>${esc(row.customer_name || '')}<br><span class="small">${esc(row.customer_email || '')}</span></td><td>${esc(row.order_draft_status || '')}<br><span class="small">Order ID ${esc(row.order_id || '—')}</span></td><td>${money(row.total_cents)}</td><td class="small">${esc(row.fulfillment_notes || '')}</td><td><button class="btn small" type="button" data-custom-request-action="convert_order_draft_to_order" data-custom-request-id="${esc(row.custom_request_id || '')}">Convert to order</button></td></tr>`).join('')}</tbody></table></div>`;
  }

  function renderQuoteRevisions(data) {
    const rows = Array.isArray(data.quote_revisions) ? data.quote_revisions : [];
    if (!rows.length) return '<p class="small">No quote revision history yet.</p>';
    return `<div class="admin-table-wrap"><table><thead><tr><th>Request</th><th>Type</th><th>Notes</th><th>When</th></tr></thead><tbody>${rows.slice(0, 40).map((row) => `<tr><td>#${esc(row.custom_request_id || '')}</td><td>${esc(row.revision_type || '')}</td><td class="small">${esc(row.revision_notes || '')}</td><td class="small">${esc(row.created_at || '')}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function renderReferenceUploads(data) {
    const rows = Array.isArray(data.reference_uploads) ? data.reference_uploads : [];
    if (!rows.length) return '<p class="small">No customer reference uploads yet.</p>';
    return `<div class="admin-table-wrap"><table><thead><tr><th>Request</th><th>File</th><th>Status</th><th>Review</th></tr></thead><tbody>${rows.slice(0, 40).map((row) => `<tr><td>#${esc(row.custom_request_id || '')}<br><span class="small">${esc(row.request_key || '')}</span></td><td><a href="${esc(row.public_url || '#')}" target="_blank" rel="noopener">${esc(row.original_filename || 'reference')}</a><br><span class="small">${esc(row.mime_type || '')} • ${esc(row.file_size_bytes || 0)} bytes</span></td><td>${esc(row.reference_use_status || 'private_review_only')}</td><td class="small">Consent record is created as requested/internal-only. Approve public/social use in Media Consent Records only after review.</td></tr>`).join('')}</tbody></table></div>`;
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
          <td><select data-custom-request-status="${esc(row.custom_request_id)}"><option value="new" ${row.status === 'new' ? 'selected' : ''}>New</option><option value="reviewing" ${row.status === 'reviewing' ? 'selected' : ''}>Reviewing</option><option value="quote_needed" ${row.status === 'quote_needed' ? 'selected' : ''}>Quote needed</option><option value="quoted" ${row.status === 'quoted' ? 'selected' : ''}>Quoted</option><option value="accepted" ${row.status === 'accepted' ? 'selected' : ''}>Accepted</option><option value="declined" ${row.status === 'declined' ? 'selected' : ''}>Declined</option><option value="archived" ${row.status === 'archived' ? 'selected' : ''}>Archived</option></select><textarea data-custom-request-notes="${esc(row.custom_request_id)}" rows="3" placeholder="Admin notes">${esc(row.admin_notes || '')}</textarea><div class="custom-request-actions"><button class="btn small" data-custom-request-save="${esc(row.custom_request_id)}">Save review</button><button class="btn small" data-custom-request-action="create_quote_draft" data-custom-request-id="${esc(row.custom_request_id)}">Quote draft</button><button class="btn small" data-custom-request-action="create_reply_template" data-custom-request-id="${esc(row.custom_request_id)}">Reply template</button><button class="btn small" data-custom-request-action="create_deposit_candidate" data-custom-request-id="${esc(row.custom_request_id)}">Deposit candidate</button><button class="btn small" data-custom-request-action="create_job_draft" data-custom-request-id="${esc(row.custom_request_id)}">Job draft</button><button class="btn small" data-custom-request-action="create_invoice_candidate" data-custom-request-id="${esc(row.custom_request_id)}">Invoice candidate</button><button class="btn small" data-custom-request-action="create_quote_preview_link" data-custom-request-id="${esc(row.custom_request_id)}">Quote preview link</button><button class="btn small" data-custom-request-action="create_quote_revision_link" data-custom-request-id="${esc(row.custom_request_id)}">Revision link</button><button class="btn small" data-custom-request-action="create_accepted_payment_order_drafts" data-custom-request-id="${esc(row.custom_request_id)}">Accepted follow-through</button><button class="btn small" data-custom-request-action="approve_payment_link" data-custom-request-id="${esc(row.custom_request_id)}">Approve payment link</button><button class="btn small" data-custom-request-action="convert_order_draft_to_order" data-custom-request-id="${esc(row.custom_request_id)}">Convert order</button><button class="btn small" data-custom-request-action="create_marketplace_export_pack" data-custom-request-id="${esc(row.custom_request_id)}">Marketplace pack</button><button class="btn small" data-custom-request-action="create_post_fulfillment_prompts" data-custom-request-id="${esc(row.custom_request_id)}">Fulfillment prompt</button><button class="btn small" data-custom-request-action="create_product_draft" data-custom-request-id="${esc(row.custom_request_id)}">Product plan</button></div></td>
        </tr>`).join('') || '<tr><td colspan="5">No custom requests yet.</td></tr>'}
      </tbody></table></div>
      <details style="margin-top:12px" open><summary>Manual customer reply templates</summary>${renderReplyTemplates(data)}</details>
      <details style="margin-top:12px" open><summary>Private quote preview links</summary>${renderQuotePreviewLinks(data)}</details>
      <details style="margin-top:12px" open><summary>Deposit and invoice candidates</summary>${renderPaymentCandidates(data)}</details>
      <details style="margin-top:12px" open><summary>Editable quote line items and estimates</summary>${renderQuoteLineItems(data)}</details>
      <details style="margin-top:12px" open><summary>Accepted quote payment/order drafts</summary>${renderAcceptedDrafts(data)}</details>
      <details style="margin-top:12px" open><summary>Approved payment review links</summary>${renderApprovedPaymentLinks(data)}</details>
      <details style="margin-top:12px" open><summary>Marketplace export packs</summary>${renderMarketplaceExportPacks(data)}</details>
      <details style="margin-top:12px" open><summary>Post-fulfillment review/photo/consent prompts</summary>${renderFulfillmentPrompts(data)}</details>
      <details style="margin-top:12px" open><summary>Quote revision history</summary>${renderQuoteRevisions(data)}</details>
      <details style="margin-top:12px" open><summary>Reference uploads and consent review</summary>${renderReferenceUploads(data)}</details>
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

  async function saveQuoteLine(id) {
    const form = mount.querySelector(`[data-quote-line-item-form="${CSS.escape(String(id))}"]`);
    if (!form) return;
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.custom_request_id = Number(id);
    payload.action = 'save_quote_line_item';
    try { setMsg('Saving quote line item...'); const data = await readJson(await window.DDAuth.apiFetch('/api/admin/custom-requests', { method: 'POST', body: JSON.stringify(payload) })); render(data); setMsg(data.message || 'Quote line item saved.'); }
    catch (error) { setMsg(error.message || 'Unable to save quote line item.', true); }
  }

  mount.innerHTML = `<div class="card" style="margin-top:18px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h2 style="margin-top:0">Custom Requests</h2><p class="small" style="margin:0">Review engraving, personalized gift, and workshop-made commission requests before turning them into quotes, replies, deposits, jobs, invoices, approved payment review links, marketplace copy packs, or product draft plans.</p></div><button class="btn" type="button" id="customRequestsLoadButton">Refresh requests</button></div><div id="customRequestsAdminMessage" class="small" style="display:none;margin-top:10px"></div><div id="customRequestsAdminRows"></div></div>`;
  document.getElementById('customRequestsLoadButton')?.addEventListener('click', load);
  mount.addEventListener('click', async (event) => {
    const saveButton = event.target.closest('[data-custom-request-save]');
    if (saveButton) save(saveButton.getAttribute('data-custom-request-save'));
    const actionButton = event.target.closest('[data-custom-request-action]');
    if (actionButton) runAction(actionButton.getAttribute('data-custom-request-id'), actionButton.getAttribute('data-custom-request-action'));
    const quoteLineButton = event.target.closest('[data-save-quote-line]');
    if (quoteLineButton) saveQuoteLine(quoteLineButton.getAttribute('data-save-quote-line'));
    const previewCopyButton = event.target.closest('[data-copy-preview-link]');
    if (previewCopyButton) {
      const path = previewCopyButton.getAttribute('data-copy-preview-link') || '';
      const link = `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
      try { await navigator.clipboard.writeText(link); setMsg('Quote preview link copied.'); } catch { setMsg(link, false); }
    }

    const paymentCopyButton = event.target.closest('[data-copy-payment-link]');
    if (paymentCopyButton) {
      const path = paymentCopyButton.getAttribute('data-copy-payment-link') || '';
      const link = `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
      try { await navigator.clipboard.writeText(link); setMsg('Payment review link copied.'); } catch { setMsg(link, false); }
    }
    const marketplaceCopyButton = event.target.closest('[data-copy-marketplace-pack]');
    if (marketplaceCopyButton) {
      const id = marketplaceCopyButton.getAttribute('data-copy-marketplace-pack');
      const body = mount.querySelector(`[data-marketplace-pack-body="${CSS.escape(String(id))}"]`)?.value || '';
      try { await navigator.clipboard.writeText(body); setMsg('Marketplace copy pack copied.'); } catch { setMsg('Copy failed; select the marketplace text manually.', true); }
    }
    const fulfillmentCopyButton = event.target.closest('[data-copy-fulfillment-prompt]');
    if (fulfillmentCopyButton) {
      const id = fulfillmentCopyButton.getAttribute('data-copy-fulfillment-prompt');
      const body = mount.querySelector(`[data-fulfillment-prompt-body="${CSS.escape(String(id))}"]`)?.value || '';
      try { await navigator.clipboard.writeText(body); setMsg('Fulfillment prompt copied.'); } catch { setMsg('Copy failed; select the prompt text manually.', true); }
    }
    const copyButton = event.target.closest('[data-copy-reply-template]');
    if (copyButton) {
      const id = copyButton.getAttribute('data-copy-reply-template');
      const body = mount.querySelector(`[data-reply-template-body="${CSS.escape(String(id))}"]`)?.value || '';
      try { await navigator.clipboard.writeText(body); setMsg('Reply body copied.'); } catch { setMsg('Copy failed; select the template text manually.', true); }
    }
  });
  load();
});
