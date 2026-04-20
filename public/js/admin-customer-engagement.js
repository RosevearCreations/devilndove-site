document.addEventListener('DOMContentLoaded', () => {
  const mountEl = document.getElementById('customerEngagementAdminMount');
  if (!mountEl || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  let rendered = false;
  let payloadState = null;

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
    const date = new Date(String(value).includes('T') ? value : String(value).replace(' ', 'T'));
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
  function getCheckedValues(name) {
    return Array.from(mountEl.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => Number(el.value || 0)).filter((value) => value > 0);
  }

  function render() {
    if (rendered) return;
    rendered = true;
    mountEl.innerHTML = `
      <div class="card" style="margin-top:18px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
          <div>
            <h3 style="margin:0">Customer engagement review board</h3>
            <p class="small" style="margin:6px 0 0 0">Review wishlist demand, back-in-stock requests, abandoned checkout recovery leads, gift cards, review requests, and testimonials in one place.</p>
          </div>
          <button class="btn" type="button" id="refreshCustomerEngagementButton">Refresh Board</button>
        </div>
        <div id="customerEngagementMessage" class="small" style="display:none;margin:12px 0"></div>
        <div class="grid cols-6" id="customerEngagementSummary" style="gap:12px;margin-bottom:12px"></div>

        <div class="card" style="margin-top:12px">
          <h4 style="margin-top:0">Gift cards</h4>
          <p class="small">Purchaser and recipient can be different people. Issue the card to the recipient while still tracking who bought it.</p>
          <form id="giftCardIssueForm" class="grid" style="gap:10px;margin-bottom:12px">
            <div class="grid cols-2" style="gap:10px">
              <input id="giftCardPurchaserEmail" type="email" placeholder="Purchaser email"/>
              <input id="giftCardPurchaserName" type="text" placeholder="Purchaser name"/>
            </div>
            <div class="grid cols-2" style="gap:10px">
              <input id="giftCardRecipientEmail" type="email" placeholder="Recipient email"/>
              <input id="giftCardRecipientName" type="text" placeholder="Recipient name"/>
            </div>
            <div class="grid cols-4" style="gap:10px">
              <input id="giftCardAmount" type="number" min="1" step="0.01" placeholder="Amount"/>
              <input id="giftCardExpires" type="date"/>
              <input id="giftCardNote" type="text" placeholder="Internal note"/>
              <input id="giftCardRecipientNote" type="text" placeholder="Message for recipient"/>
            </div>
            <button class="btn" type="submit">Issue Gift Card</button>
          </form>
          <div id="customerEngagementGiftCards" class="small">Loading…</div>
        </div>

        <div class="grid cols-2" style="gap:18px;margin-top:18px">
          <div class="card">
            <h4 style="margin-top:0">Wishlist demand</h4>
            <div id="customerEngagementWishlist" class="small">Loading…</div>
          </div>
          <div class="card">
            <h4 style="margin-top:0">Back-in-stock requests</h4>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
              <button class="btn" type="button" data-bulk-interest-status="reviewed">Mark reviewed</button>
              <button class="btn" type="button" data-bulk-interest-status="done">Close selected</button>
            </div>
            <div id="customerEngagementInterest" class="small">Loading…</div>
          </div>
          <div class="card">
            <h4 style="margin-top:0">Abandoned checkout recovery</h4>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
              <button class="btn" type="button" data-bulk-recovery-email="1">Queue email for selected</button>
              <button class="btn" type="button" data-bulk-recovery-status="closed">Close selected</button>
            </div>
            <div id="customerEngagementRecovery" class="small">Loading…</div>
          </div>
          <div class="card">
            <h4 style="margin-top:0">Testimonials & reviews</h4>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
              <button class="btn" type="button" data-bulk-review-status="approved">Approve selected</button>
              <button class="btn" type="button" data-bulk-review-status="rejected">Reject selected</button>
              <button class="btn" type="button" data-bulk-review-featured="1">Approve + feature</button>
            </div>
            <div id="customerEngagementReviews" class="small">Loading…</div>
          </div>
        </div>

        <div class="grid cols-2" style="gap:18px;margin-top:18px">
          <div class="card">
            <h4 style="margin-top:0">Recent orders ready for review-request emails</h4>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
              <button class="btn" type="button" id="queueSelectedReviewOrdersButton">Queue review email for selected</button>
            </div>
            <div id="customerEngagementReviewOrders" class="small">Loading…</div>
          </div>
          <div class="card">
            <h4 style="margin-top:0">Notification queue</h4>
            <div id="customerEngagementNotifications" class="small">Loading…</div>
          </div>
        </div>
      </div>`;

    document.getElementById('refreshCustomerEngagementButton')?.addEventListener('click', load);
    document.getElementById('giftCardIssueForm')?.addEventListener('submit', onIssueGiftCard);
    document.getElementById('queueSelectedReviewOrdersButton')?.addEventListener('click', onBulkQueueReviewRequests);
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
    const purchaser_email = String(document.getElementById('giftCardPurchaserEmail')?.value || '').trim();
    const purchaser_name = String(document.getElementById('giftCardPurchaserName')?.value || '').trim();
    const recipient_email = String(document.getElementById('giftCardRecipientEmail')?.value || '').trim();
    const recipient_name = String(document.getElementById('giftCardRecipientName')?.value || '').trim();
    const amount = Number(document.getElementById('giftCardAmount')?.value || 0);
    const expires_at = String(document.getElementById('giftCardExpires')?.value || '').trim();
    const note = String(document.getElementById('giftCardNote')?.value || '').trim();
    const recipient_note = String(document.getElementById('giftCardRecipientNote')?.value || '').trim();
    if (!recipient_email || !amount) {
      setMessage('Recipient email and amount are required.', true);
      return;
    }
    await postAction({ action: 'issue_gift_card', purchaser_email, purchaser_name, recipient_email, recipient_name, amount_cents: Math.round(amount * 100), expires_at, note, recipient_note }, 'Gift card issued and email queued.');
    event.target.reset();
  }

  async function onBulkQueueReviewRequests() {
    const orderIds = getCheckedValues('review-order-select');
    if (!orderIds.length) return setMessage('Select one or more orders first.', true);
    await postAction({ action: 'bulk_queue_review_requests', order_ids: orderIds }, `Queued ${orderIds.length} review request email(s).`);
  }

  async function onClick(event) {
    const bulkInterest = event.target.closest('[data-bulk-interest-status]');
    const bulkRecoveryEmail = event.target.closest('[data-bulk-recovery-email]');
    const bulkRecoveryStatus = event.target.closest('[data-bulk-recovery-status]');
    const bulkReviewStatus = event.target.closest('[data-bulk-review-status]');
    const bulkReviewFeatured = event.target.closest('[data-bulk-review-featured]');
    const resendGiftCard = event.target.closest('[data-resend-gift-card]');
    const updateGiftCard = event.target.closest('[data-gift-card-status]');
    const singleInterest = event.target.closest('[data-interest-status]');
    const singleRecovery = event.target.closest('[data-recovery-email]');
    const singleReview = event.target.closest('[data-review-status]');
    const singleReviewOrder = event.target.closest('[data-review-order-id]');

    if (bulkInterest) {
      const ids = getCheckedValues('interest-select');
      if (!ids.length) return setMessage('Select one or more interest requests first.', true);
      await postAction({ action: 'bulk_set_interest_status', product_interest_request_ids: ids, status: bulkInterest.getAttribute('data-bulk-interest-status') || 'reviewed' }, 'Interest requests updated.');
      return;
    }
    if (bulkRecoveryEmail) {
      const ids = getCheckedValues('recovery-select');
      if (!ids.length) return setMessage('Select one or more recovery leads first.', true);
      await postAction({ action: 'bulk_queue_recovery_emails', checkout_recovery_lead_ids: ids }, 'Recovery emails queued.');
      return;
    }
    if (bulkRecoveryStatus) {
      const ids = getCheckedValues('recovery-select');
      if (!ids.length) return setMessage('Select one or more recovery leads first.', true);
      await postAction({ action: 'set_recovery_status', checkout_recovery_lead_ids: ids, status: bulkRecoveryStatus.getAttribute('data-bulk-recovery-status') || 'closed' }, 'Recovery lead statuses updated.');
      return;
    }
    if (bulkReviewStatus) {
      const ids = getCheckedValues('review-select');
      if (!ids.length) return setMessage('Select one or more reviews first.', true);
      await postAction({ action: 'bulk_set_review_status', product_review_ids: ids, status: bulkReviewStatus.getAttribute('data-bulk-review-status') || 'approved', is_featured: 0 }, 'Reviews updated.');
      return;
    }
    if (bulkReviewFeatured) {
      const ids = getCheckedValues('review-select');
      if (!ids.length) return setMessage('Select one or more reviews first.', true);
      await postAction({ action: 'bulk_set_review_status', product_review_ids: ids, status: 'approved', is_featured: Number(bulkReviewFeatured.getAttribute('data-bulk-review-featured') || 0) === 1 ? 1 : 0 }, 'Reviews updated and featured.');
      return;
    }
    if (resendGiftCard) {
      await postAction({ action: 'resend_gift_card', gift_card_id: Number(resendGiftCard.getAttribute('data-resend-gift-card') || 0) }, 'Gift card email queued again.');
      return;
    }
    if (updateGiftCard) {
      await postAction({ action: 'set_gift_card_status', gift_card_id: Number(updateGiftCard.getAttribute('data-gift-card-status') || 0), status: updateGiftCard.getAttribute('data-status-value') || 'inactive' }, 'Gift card status updated.');
      return;
    }
    if (singleInterest) {
      await postAction({ action: 'set_interest_status', product_interest_request_id: Number(singleInterest.getAttribute('data-interest-status') || 0), status: singleInterest.getAttribute('data-status-value') || 'reviewed' }, 'Interest request updated.');
      return;
    }
    if (singleRecovery) {
      await postAction({ action: 'queue_recovery_email', checkout_recovery_lead_id: Number(singleRecovery.getAttribute('data-recovery-email') || 0) }, 'Recovery email queued.');
      return;
    }
    if (singleReview) {
      await postAction({ action: 'set_review_status', product_review_id: Number(singleReview.getAttribute('data-review-status') || 0), status: singleReview.getAttribute('data-status-value') || 'approved', is_featured: Number(singleReview.getAttribute('data-review-featured') || 0) }, 'Review updated.');
      return;
    }
    if (singleReviewOrder) {
      await postAction({ action: 'queue_review_request', order_id: Number(singleReviewOrder.getAttribute('data-review-order-id') || 0) }, 'Review request queued.');
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
      ['Pending Reviews', summary.pending_review_count],
      ['Outbox Queue', summary.notification_queue_count]
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
      payloadState = data;
      renderSummary(data.summary || {});
      renderList('customerEngagementWishlist', (data.wishlist_products || []).map((row) => `
        <div class="card" style="margin-bottom:10px"><strong>${esc(row.name || 'Unnamed product')}</strong><div class="small">${esc(String(row.saved_count || 0))} saves • ${esc(fmtDate(row.last_saved_at))}</div>${row.slug ? `<div class="small"><a href="/shop/product/?slug=${encodeURIComponent(row.slug)}" target="_blank" rel="noopener">Open product</a></div>` : ''}</div>`).join(''), 'No wishlist activity yet.');
      renderList('customerEngagementInterest', (data.interest_requests || []).map((row) => `
        <div class="card" style="margin-bottom:10px"><label style="display:flex;gap:10px;align-items:flex-start"><input type="checkbox" name="interest-select" value="${esc(row.product_interest_request_id)}"/><span><strong>${esc(row.product_name || 'Unknown product')}</strong><div class="small">${esc(row.request_type)} • ${esc(row.email || 'member account')} • ${esc(fmtDate(row.created_at))}</div><div class="small">Status: ${esc(row.status || 'open')}</div>${row.notes ? `<div class="small">${esc(row.notes)}</div>` : ''}</span></label><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn" type="button" data-interest-status="${esc(row.product_interest_request_id)}" data-status-value="reviewed">Mark Reviewed</button><button class="btn" type="button" data-interest-status="${esc(row.product_interest_request_id)}" data-status-value="done">Close</button></div></div>`).join(''), 'No interest requests yet.');
      renderList('customerEngagementRecovery', (data.checkout_recovery_leads || []).map((row) => `
        <div class="card" style="margin-bottom:10px"><label style="display:flex;gap:10px;align-items:flex-start"><input type="checkbox" name="recovery-select" value="${esc(row.checkout_recovery_lead_id)}"/><span><strong>${esc(row.customer_email || 'No email')}</strong><div class="small">${esc(row.customer_name || 'Guest')} • ${esc(String(row.cart_count || 0))} item(s) • ${esc(money(row.cart_value_cents || 0, row.currency || 'CAD'))}</div><div class="small">${esc(fmtDate(row.created_at))} • status ${esc(row.status || 'open')}</div>${row.last_recovery_email_at ? `<div class="small">Last emailed ${esc(fmtDate(row.last_recovery_email_at))}</div>` : ''}</span></label><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn" type="button" data-recovery-email="${esc(row.checkout_recovery_lead_id)}">Queue Recovery Email</button></div></div>`).join(''), 'No recovery leads yet.');
      renderList('customerEngagementGiftCards', (data.gift_cards || []).map((row) => `
        <div class="card" style="margin-bottom:10px"><strong>${esc(row.code || '')}</strong><div class="small">Recipient: ${esc(row.recipient_name || row.recipient_email || '')}</div><div class="small">Purchaser: ${esc(row.purchaser_name || row.purchaser_email || 'Not recorded')}</div><div class="small">${esc(money(row.remaining_amount_cents || 0, row.currency || 'CAD'))} remaining of ${esc(money(row.initial_amount_cents || 0, row.currency || 'CAD'))}</div><div class="small">${esc(row.status || 'active')}${row.expires_at ? ` • expires ${esc(row.expires_at)}` : ''}</div>${row.recipient_note ? `<div class="small">Recipient note: ${esc(row.recipient_note)}</div>` : ''}<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn" type="button" data-resend-gift-card="${esc(row.gift_card_id)}">Resend Email</button><button class="btn" type="button" data-gift-card-status="${esc(row.gift_card_id)}" data-status-value="inactive">Deactivate</button><button class="btn" type="button" data-gift-card-status="${esc(row.gift_card_id)}" data-status-value="active">Activate</button></div></div>`).join(''), 'No gift cards issued yet.');
      renderList('customerEngagementReviews', (data.reviews || []).map((row) => `
        <div class="card" style="margin-bottom:10px"><label style="display:flex;gap:10px;align-items:flex-start"><input type="checkbox" name="review-select" value="${esc(row.product_review_id)}"/><span><strong>${esc(row.product_name || 'Store review')}</strong><div class="small">${esc(row.reviewer_name || 'Customer')} • ${esc(String(row.rating || 0))}/5 • ${esc(row.review_kind || 'testimonial')}</div><div class="small">${esc(fmtDate(row.created_at))} • status ${esc(row.status || 'pending_review')}${Number(row.is_featured || 0) === 1 ? ' • featured' : ''}</div><div style="margin-top:6px">${esc(row.review_text || '')}</div></span></label><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn" type="button" data-review-status="${esc(row.product_review_id)}" data-status-value="approved" data-review-featured="0">Approve</button><button class="btn" type="button" data-review-status="${esc(row.product_review_id)}" data-status-value="approved" data-review-featured="1">Feature</button><button class="btn" type="button" data-review-status="${esc(row.product_review_id)}" data-status-value="rejected" data-review-featured="0">Reject</button></div></div>`).join(''), 'No testimonials or reviews yet.');
      renderList('customerEngagementReviewOrders', (data.recent_review_orders || []).map((row) => `
        <div class="card" style="margin-bottom:10px"><label style="display:flex;gap:10px;align-items:flex-start"><input type="checkbox" name="review-order-select" value="${esc(row.order_id)}"/><span><strong>${esc(row.order_number || '')}</strong><div class="small">${esc(row.customer_name || row.customer_email || '')} • ${esc(money(row.total_cents || 0, row.currency || 'CAD'))}</div><div class="small">${esc(fmtDate(row.created_at))}</div><div class="small">${esc(row.product_names || '')}</div></span></label><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn" type="button" data-review-order-id="${esc(row.order_id)}">Queue Review Email</button></div></div>`).join(''), 'No recent fulfilled orders found.');
      renderList('customerEngagementNotifications', (data.notification_queue || []).map((row) => `
        <div class="card" style="margin-bottom:10px"><strong>${esc(row.notification_kind || '')}</strong><div class="small">${esc(row.destination || '')}</div><div class="small">${esc(row.status || '')} • created ${esc(fmtDate(row.created_at))}${row.last_attempt_at ? ` • last attempt ${esc(fmtDate(row.last_attempt_at))}` : ''}</div>${row.error_text ? `<div class="small">${esc(row.error_text)}</div>` : ''}</div>`).join(''), 'No queued customer notifications right now.');
      setMessage('Customer engagement board updated.');
    } catch (error) {
      setMessage(error.message || 'Failed to load customer engagement board.', true);
    }
  }

  document.addEventListener('dd:admin-ready', (event) => {
    if (!event?.detail?.ok) return;
    render();
    load();
  });

  render();
  load();
});
