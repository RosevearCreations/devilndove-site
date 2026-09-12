// Release 467 Build 111 — Orders-to-Fulfilment reconciliation UI.
// Read-only overlay over the existing Build 82 transition workflow. No POST/provider/message action exists here.

(() => {
  const mount = document.getElementById('orderFulfillmentReconciliationMount');
  const workflowMount = document.getElementById('orderFulfillmentWorkflowMount');
  if (!mount || !window.DDAuth) return;

  const READ_ROUTE = '/api/admin/order-fulfillment-reconciliation?limit=100';
  const HOLD_ATTRIBUTE = 'data-build111-reconciliation-hold';
  let state = null;
  let filter = 'attention';

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const title = (value) => String(value || '—').replaceAll('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase());

  function filteredOrders() {
    const rows = Array.isArray(state?.orders) ? state.orders : [];
    if (filter === 'all') return rows;
    if (filter === 'attention') return rows.filter((row) => ['blocked','review'].includes(row.reconciliation_state));
    return rows.filter((row) => row.reconciliation_state === filter);
  }

  function stat(label, value, note='') {
    return `<div class="ofr-stat"><span>${esc(label)}</span><strong>${Number(value || 0)}</strong>${note ? `<small>${esc(note)}</small>` : ''}</div>`;
  }

  function issueRows(rows, tone) {
    const items = Array.isArray(rows) ? rows : [];
    if (!items.length) return '';
    return `<div class="ofr-issues ${tone}">${items.map((row) => `<div><strong>${esc(row.code || tone)}</strong><span>${esc(row.detail || '')}</span>${row.href ? `<a href="${esc(row.href)}">${esc(row.owner || 'Open owner')} →</a>` : ''}</div>`).join('')}</div>`;
  }

  function orderCard(order) {
    const profile = order.item_profile || {};
    const history = order.history_evidence || {};
    const owners = Array.isArray(order.exception_owners) ? order.exception_owners : [];
    return `<article class="card ofr-order ${esc(order.reconciliation_state)}" data-ofr-order-id="${Number(order.order_id || 0)}">
      <header><div><div class="small">${esc(order.order_number || `Order ${order.order_id}`)} • ${esc(title(order.fulfillment_type))}</div><h3>${esc(order.workflow_stage_label || title(order.workflow_stage))}</h3></div><span class="ofr-state">${esc(title(order.reconciliation_state))}</span></header>
      <div class="ofr-profile">
        <span><strong>${Number(profile.total_units || 0)}</strong> total units</span>
        <span><strong>${Number(profile.physical_units || 0)}</strong> physical</span>
        <span><strong>${Number(profile.digital_units || 0)}</strong> digital</span>
        <span><strong>${Number(history.evidence_event_count || 0)}</strong> evidence event(s)</span>
      </div>
      ${issueRows(order.blockers, 'blocked')}
      ${issueRows(order.reviews, 'review')}
      ${(order.evidence || []).length ? `<details class="ofr-evidence"><summary>Supporting evidence (${order.evidence.length})</summary><ul class="small">${order.evidence.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></details>` : ''}
      <p class="small ofr-shared-note">${esc(order.shared_product_readiness_note || '')}</p>
      ${owners.length ? `<div class="ofr-owner-links">${owners.map((row) => `<a class="btn secondary" href="${esc(row.href)}">${esc(row.owner)}</a>`).join('')}</div>` : ''}
      <div class="small"><strong>Transition guard:</strong> ${order.transition_supported ? 'reconciliation clear — use the existing Build 82 reviewed transition controls below.' : 'held for reconciliation review — existing transition controls are disabled in this page until the current evidence clears.'}</div>
    </article>`;
  }

  function applyTransitionGuards() {
    if (!workflowMount || !state) return;
    const byId = new Map((state.orders || []).map((row) => [Number(row.order_id), row]));
    workflowMount.querySelectorAll('.ofw-action[data-order-id]').forEach((button) => {
      const order = byId.get(Number(button.dataset.orderId || 0));
      if (!order) return;
      const hold = order.transition_supported !== true;
      button.disabled = hold;
      button.setAttribute(HOLD_ATTRIBUTE, hold ? '1' : '0');
      if (hold) button.title = 'Build 111 reconciliation requires review before this transition.';
      else if (button.title === 'Build 111 reconciliation requires review before this transition.') button.removeAttribute('title');
    });
  }

  function render() {
    const summary = state?.summary || {};
    const list = filteredOrders();
    mount.innerHTML = `<section class="ofr-summary">
      ${stat('Ready', summary.ready, 'transition supported')}
      ${stat('Review', summary.review)}
      ${stat('Blocked', summary.blocked)}
      ${stat('Closed', summary.closed)}
      ${stat('Blockers', summary.blocker_count)}
      ${stat('Review items', summary.review_count)}
    </section>
    <section class="card ofr-controls"><div><strong>Build 111 reconciliation</strong><p class="small">Cross-checks the existing Build 82 workflow against Finance, shared Product/Inventory/Production readiness, order-item mode and status-history evidence. It does not create a second Orders workflow.</p></div><label>View<select id="ofrFilter"><option value="attention">Needs attention</option><option value="blocked">Blocked</option><option value="review">Review</option><option value="ready">Ready</option><option value="closed">Closed</option><option value="all">All</option></select></label><button class="btn" id="ofrRefresh" type="button">Refresh reconciliation</button></section>
    <div class="small ofr-boundary">The Build 82 write contract remains the sole non-financial fulfilment transition owner. Build 111 sends no message, reserves/deducts no inventory, starts no production, executes no payment/refund/provider action and posts no accounting entry.</div>
    <section class="ofr-orders">${list.length ? list.map(orderCard).join('') : '<div class="card"><strong>No orders match this reconciliation view.</strong></div>'}</section>`;
    document.getElementById('ofrFilter').value = filter;
    document.getElementById('ofrFilter').addEventListener('change', (event) => { filter = event.target.value; render(); applyTransitionGuards(); });
    document.getElementById('ofrRefresh').addEventListener('click', load);
    applyTransitionGuards();
  }

  async function load() {
    mount.innerHTML = '<div class="card"><strong>Loading Build 111 Orders-to-Fulfilment reconciliation…</strong></div>';
    try {
      const response = await window.DDAuth.apiFetch(READ_ROUTE, { method:'GET', headers:{ Accept:'application/json' } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `Reconciliation request failed (${response.status})`);
      state = data;
      render();
    } catch (error) {
      mount.innerHTML = `<div class="card ofr-error"><strong>Build 111 reconciliation is unavailable.</strong><p class="small">${esc(error.message || error)}</p><p class="small">The existing Build 82 workflow remains visible below; Build 111 has not supplied additional reconciliation clearance.</p><button class="btn" id="ofrRetry" type="button">Retry</button></div>`;
      document.getElementById('ofrRetry')?.addEventListener('click', load);
    }
  }

  if (workflowMount && typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => applyTransitionGuards());
    observer.observe(workflowMount, { childList:true, subtree:true });
  }
  document.addEventListener('dd:order-updated', () => load());
  load();
})();
