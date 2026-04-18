document.addEventListener('DOMContentLoaded', () => {
  const mountEl = document.getElementById('customerEngagementAdminMount');
  if (!mountEl || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  let rendered = false;

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
  function money(cents, currency = 'CAD') {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(cents || 0) / 100);
  }
  function fmtDate(value) {
    if (!value) return '—';
    const date = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }
  function setMessage(message, isError = false) {
    const el = document.getElementById('customerEngagementMessage');
    if (!el) return;
    el.textContent = message;
    el.style.display = message ? 'block' : 'none';
    el.style.color = isError ? '#b00020' : '#0a7a2f';
  }
  async function readJson(response, fallback) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || fallback);
    return data;
  }
  function render() {
    if (rendered) return;
    rendered = true;
    mountEl.innerHTML = `
      <div class="card" style="margin-top:18px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
          <div>
            <h3 style="margin:0">Customer engagement review board</h3>
            <p class="small" style="margin:6px 0 0 0">Review wishlist demand, back-in-stock requests, abandoned checkout recovery leads, gift cards, and submitted testimonials in one place.</p>
          </div>
          <button class="btn" type="button" id="refreshCustomerEngagementButton">Refresh Board</button>
        </div>
        <div id="customerEngagementMessage" class="small" style="display:none;margin:12px 0"></div>
        <div class="grid cols-5" id="customerEngagementSummary" style="gap:12px;margin-bottom:12px"></div>
        <div class="grid cols-2" style="gap:18px">
          <div class="card"><h4 style="margin-top:0">Wishlist demand</h4><div id="customerEngagementWishlist" class="small">Loading…</div></div>
          <div class="card"><h4 style="margin-top:0">Back-in-stock requests</h4><div id="customerEngagementInterest" class="small">Loading…</div></div>
          <div class="card"><h4 style="margin-top:0">Abandoned checkout recovery</h4><div id="customerEngagementRecovery" class="small">Loading…</div></div>
          <div class="card"><h4 style="margin-top:0">Gift cards</h4><form id="giftCardIssueForm" class="grid" style="gap:10px;margin-bottom:12px"><div class="grid cols-2" style="gap:10px"><input id="giftCardEmail" type="email" placeholder="Recipient email"/><input id="giftCardName" type="text" placeholder="Recipient name"/></div><div class="grid cols-3" style="gap:10px"><input id="giftCardAmount" type="number" min="1" step="0.01" placeholder="Amount"/><input id="giftCardExpires" type="date"/><input id="giftCardNote" type="text" placeholder="Note"/></div><button class="btn" type="submit">Issue Gift Card</button></form><div id="customerEngagementGiftCards" class="small">Loading…</div></div>
          <div class="card"><h4 style="margin-top:0">Testimonials & reviews</h4><div class="grid cols-2" style="gap:10px;margin-bottom:12px"><input id="reviewRequestOrderId" type="number" min="1" step="1" placeholder="Order ID for review email"/><button class="btn" type="button" id="queueReviewRequestButton">Queue Review Request</button></div><div id="customerEngagementReviews" class="small">Loading…</div></div>
        </div>
      </div>`;
    document.getElementById('refreshCustomerEngagementButton')?.addEventListener('click', load);
    document.getElementById('giftCardIssueForm')?.addEventListener('submit', onIssueGiftCard);
    document.getElementById('queueReviewRequestButton')?.addEventListener('click', onQueueReviewRequest);
    mountEl.addEventListener('click', onClick);
  }

  async function postAction(payload, successMessage) {
    const response = await window.DDAuth.apiFetch('/api/admin/customer-engagement', { method: 'POST', body: JSON.stringify(payload) });
    await readJson(response, 'Customer engagement action failed.');
    setMessage(successMessage || 'Saved.');
    await load();
  }

  async function onIssueGiftCard(event) {
    event.preventDefault();
    const email = String(document.getElementById('giftCardEmail')?.value || '').trim();
    const name = String(document.getElementById('giftCardName')?.value || '').trim();
    const amount = Number(document.getElementById('giftCardAmount')?.value || 0);
    const expires = String(document.getElementById('giftCardExpires')?.value || '').trim();
    const note = String(document.getElementById('giftCardNote')?.value || '').trim();
    if (!email || !amount) {
      setMessage('Gift card email and amount are required.', true);
      return;
    }
    await postAction({ action: 'issue_gift_card', issued_to_email: email, issued_to_name: name, amount_cents: Math.round(amount * 100), expires_at: expires, note }, 'Gift card issued and email queued.');
    event.target.reset();
  }

  async function onQueueReviewRequest() {
    const orderId = Number(document.getElementById('reviewRequestOrderId')?.value || 0);
    if (!orderId) {
      setMessage('Enter an order ID first.', true);
      return;
    }
    await postAction({ action: 'queue_review_request', order_id: orderId }, 'Review request queued.');
  }

  async function onClick(event) {
    const interestBtn = event.target.closest('[data-interest-status]');
    const recoveryBtn = event.target.closest('[data-recovery-email]');
    const reviewBtn = event.target.closest('[data-review-status]');
    if (interestBtn) {
      await postAction({ action: 'set_interest_status', product_interest_request_id: Number(interestBtn.getAttribute('data-interest-status') || 0), status: interestBtn.getAttribute('data-status-value') || 'reviewed' }, 'Interest request updated.');
      return;
    }
    if (recoveryBtn) {
      await postAction({ action: 'queue_recovery_email', checkout_recovery_lead_id: Number(recoveryBtn.getAttribute('data-recovery-email') || 0) }, 'Recovery email queued.');
      return;
    }
    if (reviewBtn) {
      await postAction({ action: 'set_review_status', product_review_id: Number(reviewBtn.getAttribute('data-review-status') || 0), status: reviewBtn.getAttribute('data-status-value') || 'approved', is_featured: Number(reviewBtn.getAttribute('data-review-featured') || 0) }, 'Review updated.');
    }
  }

  function renderSummary(summary = {}) {
    const mount = document.getElementById('customerEngagementSummary');
    if (!mount) return;
    const cards = [
      ['Wishlist Products', summary.wishlist_products_count],
      ['Back in Stock Open', summary.back_in_stock_open_count],
      ['Recovery Leads', summary.checkout_recovery_open_count],
      ['Active Gift Cards', summary.gift_card_active_count],
      ['Pending Reviews', summary.pending_review_count]
    ];
    mount.innerHTML = cards.map(([label, value]) => `<div class="card"><div class="small">${esc(label)}</div><div style="font-size:1.3rem;font-weight:800">${esc(String(value || 0))}</div></div>`).join('');
  }

  function renderList(id, html, emptyText) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = html || `<div class="small">${esc(emptyText)}</div>`;
  }

  async function load() {
    try {
      setMessage('Loading customer engagement board...');
      const response = await window.DDAuth.apiFetch('/api/admin/customer-engagement');
      const data = await readJson(response, 'Failed to load customer engagement board.');
      renderSummary(data.summary || {});
      renderList('customerEngagementWishlist', (data.wishlist_products || []).map((row) => `
        <div class="card" style="margin-bottom:10px"><strong>${esc(row.name || 'Unnamed product')}</strong><div class="small">${esc(String(row.saved_count || 0))} saves • ${esc(fmtDate(row.last_saved_at))}</div>${row.slug ? `<div class="small"><a href="/shop/product/?slug=${encodeURIComponent(row.slug)}" target="_blank" rel="noopener">Open product</a></div>` : ''}</div>`).join(''), 'No wishlist activity yet.');
      renderList('customerEngagementInterest', (data.interest_requests || []).map((row) => `
        <div class="card" style="margin-bottom:10px"><strong>${esc(row.product_name || 'Unknown product')}</strong><div class="small">${esc(row.request_type)} • ${esc(row.email || 'member account')} • ${esc(fmtDate(row.created_at))}</div><div class="small">Status: ${esc(row.status || 'open')}</div>${row.notes ? `<div class="small">${esc(row.notes)}</div>` : ''}<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn" type="button" data-interest-status="${esc(row.product_interest_request_id)}" data-status-value="reviewed">Mark Reviewed</button><button class="btn" type="button" data-interest-status="${esc(row.product_interest_request_id)}" data-status-value="done">Close</button></div></div>`).join(''), 'No interest requests yet.');
      renderList('customerEngagementRecovery', (data.checkout_recovery_leads || []).map((row) => `
        <div class="card" style="margin-bottom:10px"><strong>${esc(row.customer_email || 'No email')}</strong><div class="small">${esc(row.customer_name || 'Guest')} • ${esc(String(row.cart_count || 0))} item(s) • ${esc(money(row.cart_value_cents || 0, row.currency || 'CAD'))}</div><div class="small">${esc(fmtDate(row.created_at))} • status ${esc(row.status || 'open')}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn" type="button" data-recovery-email="${esc(row.checkout_recovery_lead_id)}">Queue Recovery Email</button></div></div>`).join(''), 'No checkout recovery leads yet.');
      renderList('customerEngagementGiftCards', (data.gift_cards || []).map((row) => `
        <div class="card" style="margin-bottom:10px"><strong>${esc(row.code || '')}</strong><div class="small">${esc(row.issued_to_email || '')} • ${esc(money(row.remaining_amount_cents || 0, row.currency || 'CAD'))} remaining of ${esc(money(row.initial_amount_cents || 0, row.currency || 'CAD'))}</div><div class="small">${esc(row.status || 'active')}${row.expires_at ? ` • expires ${esc(row.expires_at)}` : ''}</div></div>`).join(''), 'No gift cards issued yet.');
      renderList('customerEngagementReviews', (data.reviews || []).map((row) => `
        <div class="card" style="margin-bottom:10px"><strong>${esc(row.reviewer_name || 'Customer')}</strong><div class="small">${esc(row.product_name || 'General testimonial')} • ${'★'.repeat(Math.max(1, Number(row.rating || 0)))}</div><div class="small">${esc(row.status || 'pending_review')} • ${esc(fmtDate(row.created_at))}</div><div style="margin-top:8px">${esc(row.review_text || '')}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn" type="button" data-review-status="${esc(row.product_review_id)}" data-status-value="approved" data-review-featured="1">Approve & Feature</button><button class="btn" type="button" data-review-status="${esc(row.product_review_id)}" data-status-value="approved" data-review-featured="0">Approve</button><button class="btn" type="button" data-review-status="${esc(row.product_review_id)}" data-status-value="rejected" data-review-featured="0">Reject</button></div></div>`).join(''), 'No testimonials or reviews yet.');
      setMessage('');
    } catch (error) {
      setMessage(error.message || 'Failed to load customer engagement board.', true);
    }
  }

  document.addEventListener('dd:admin-ready', async (event) => {
    if (!event?.detail?.ok) return;
    render();
    await load();
  });

  render();
});
