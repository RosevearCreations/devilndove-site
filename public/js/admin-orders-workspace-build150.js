// Release 467 Build 150 — Orders, Fulfillment & Buyer Communication Workspace.
// Reuses canonical Orders, Build 82 fulfilment authority and order_status_history.
// Draft notes/messages stay local. Live fulfilment/tracking writes require explicit clicks and stable client_action_id values.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('orderWorkspaceMount');
  if (!mount || !window.DDAuth) return;

  const SNAPSHOT_KEY = 'dd_admin_orders_b150_snapshot_v1';
  const DRAFT_KEY = 'dd_admin_orders_b150_drafts_v1';
  const PENDING_KEY = 'dd_admin_orders_b150_pending_actions_v1';
  const apiFetch = (...args) => window.DDAuth.apiFetch(...args);
  const state = { orders: [], workflow: new Map(), details: {}, selected: 0, stale: false, warning: '', query: '', status: 'all', fulfillment: 'all', payment: 'all' };

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const txt = (value) => String(value ?? '').trim();
  const lower = (value) => txt(value).toLowerCase();
  const money = (cents, currency = 'CAD') => { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'CAD' }).format(Number(cents || 0) / 100); } catch { return `${(Number(cents || 0) / 100).toFixed(2)} ${currency || 'CAD'}`; } };
  const date = (value) => { if (!value) return '—'; const d = new Date(String(value).replace(' ', 'T') + (String(value).includes('T') ? '' : 'Z')); return Number.isNaN(d.getTime()) ? esc(value) : d.toLocaleString(); };
  const readJson = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch { return fallback; } };
  const writeJson = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  const drafts = () => readJson(DRAFT_KEY, {});
  const pending = () => readJson(PENDING_KEY, []);
  const online = () => navigator.onLine !== false;
  const actionId = (kind, orderId) => { const bytes = new Uint32Array(2); crypto.getRandomValues(bytes); return `b150:${kind}:${orderId}:${Date.now().toString(36)}:${Array.from(bytes).map((n) => n.toString(36)).join('')}`; };

  mount.innerHTML = `
    <section class="card b150-orders" data-release="467" data-build="150">
      <div class="b150-row"><div><p class="eyebrow">Release 467 Build 150</p><h2 style="margin:.2rem 0">Orders, Fulfillment &amp; Buyer Communication Workspace</h2><p class="small">One seller workspace for buyer/order identity, products, payment state, fulfilment, pickup/shipping, notes, copy-only buyer message drafts, tracking audit, packing slips and timeline.</p></div><div class="b150-actions"><button class="btn" id="b150Refresh" type="button">Refresh</button><a class="btn secondary" href="/admin/order-fulfillment-care/">Fulfilment queue</a></div></div>
      <div id="b150Connectivity" class="small b150-message" aria-live="polite"></div>
      <div class="b150-toolbar">
        <label><span class="small">Search order, buyer, email, product or SKU</span><input id="b150Search" autocomplete="off" placeholder="Order #, buyer, email, product, SKU…"></label>
        <label><span class="small">Status</span><select id="b150Status"><option value="all">All statuses</option><option>pending</option><option>paid</option><option>preparing</option><option>making</option><option>packing</option><option>evidence</option><option>ready</option><option>fulfilled</option><option>returned</option><option>cancelled</option><option>refunded</option></select></label>
        <label><span class="small">Fulfilment</span><select id="b150Fulfillment"><option value="all">All fulfilment</option><option>shipping</option><option>pickup</option><option>digital</option><option>mixed</option></select></label>
        <label><span class="small">Payment</span><select id="b150Payment"><option value="all">All payment states</option><option>pending</option><option>authorized</option><option>paid</option><option>partially_refunded</option><option>refunded</option><option>failed</option></select></label>
      </div>
      <div class="b150-summary" id="b150Summary"></div>
      <div id="b150Pending" class="small"></div>
      <div class="b150-layout">
        <div><div class="small b150-muted" id="b150ListMeta"></div><div class="b150-list" id="b150List"><div class="b150-order">Loading orders…</div></div></div>
        <div class="b150-detail" id="b150Detail"><div class="b150-panel"><h3>Select an order</h3><p class="small">Choose an order to open its seller workspace.</p></div></div>
      </div>
      <div class="b150-print-slip" id="b150PrintSlip"></div>
    </section>`;

  const $ = (id) => document.getElementById(id);
  const message = (text, danger = false) => { const el = $('b150Connectivity'); if (!el) return; el.className = `small b150-message${danger ? ' b150-danger' : ''}`; el.textContent = text || ''; };

  function saveSnapshot() {
    writeJson(SNAPSHOT_KEY, { saved_at: new Date().toISOString(), orders: state.orders, workflows: Array.from(state.workflow.values()), details: state.details });
  }

  function orderWorkflow(orderId) { return state.workflow.get(Number(orderId)) || null; }
  function lifecycleGroup(row) {
    const stage = lower(orderWorkflow(row.order_id)?.workflow_stage || row.order_status);
    if (['draft', 'pending', 'awaiting_payment'].includes(stage)) return 'Received';
    if (['paid', 'processing'].includes(stage)) return 'Confirmed';
    if (['preparing', 'making', 'packing', 'evidence'].includes(stage)) return 'In progress';
    if (stage === 'ready') return 'Ready';
    if (['fulfilled', 'completed'].includes(stage)) return 'Complete';
    return 'Review';
  }

  function filteredOrders() {
    const q = lower(state.query);
    return state.orders.filter((o) => {
      const wf = orderWorkflow(o.order_id);
      const haystack = [o.order_id, o.order_number, o.customer_name, o.customer_email, o.payment_method, o.product_search_text, o.order_status, wf?.workflow_stage_label].map(lower).join(' ');
      if (q && !haystack.includes(q)) return false;
      if (state.status !== 'all' && lower(o.order_status) !== state.status && lower(wf?.workflow_stage) !== state.status) return false;
      if (state.fulfillment !== 'all' && lower(o.fulfillment_type) !== state.fulfillment) return false;
      if (state.payment !== 'all' && lower(o.derived_payment_status || o.payment_status) !== state.payment) return false;
      return true;
    });
  }

  function renderSummary(rows) {
    const counts = { Received: 0, Confirmed: 0, 'In progress': 0, Ready: 0, Complete: 0, Review: 0 };
    rows.forEach((r) => { counts[lifecycleGroup(r)] = (counts[lifecycleGroup(r)] || 0) + 1; });
    $('b150Summary').innerHTML = Object.entries(counts).map(([k, v]) => `<div class="b150-kpi"><span class="small">${esc(k)}</span><strong>${v}</strong></div>`).join('');
  }

  function renderList() {
    const rows = filteredOrders();
    renderSummary(rows);
    $('b150ListMeta').textContent = `${rows.length} of ${state.orders.length} orders${state.stale ? ' • cached snapshot' : ''}`;
    $('b150List').innerHTML = rows.length ? rows.map((o) => {
      const wf = orderWorkflow(o.order_id);
      const status = wf?.workflow_stage_label || o.order_status || 'pending';
      const products = txt(o.product_search_text) || `${Number(o.item_count || 0)} item(s)`;
      return `<button class="b150-order" type="button" data-order-id="${Number(o.order_id)}" aria-current="${state.selected === Number(o.order_id)}"><div class="b150-row"><strong>${esc(o.order_number || `#${o.order_id}`)}</strong><span class="b150-pill">${esc(status)}</span></div><div>${esc(o.customer_name || 'Customer')} <span class="small b150-muted">${esc(o.customer_email || '')}</span></div><div class="small b150-muted">${esc(products)}</div><div class="b150-row small"><span>${esc(o.fulfillment_type || 'shipping')} • ${esc(o.derived_payment_status || o.payment_status || 'pending')}</span><strong>${esc(money(o.total_cents, o.currency))}</strong></div></button>`;
    }).join('') : '<div class="b150-order">No orders match these filters.</div>';
    $('b150List').querySelectorAll('[data-order-id]').forEach((btn) => btn.addEventListener('click', () => selectOrder(Number(btn.dataset.orderId))));
  }

  function draftFor(id, wf) {
    const all = drafts();
    const existing = all[id] || {};
    return {
      packaging_note: txt(existing.packaging_note),
      internal_note: txt(existing.internal_note),
      buyer_subject: txt(existing.buyer_subject || wf?.customer_communication?.subject),
      buyer_message: txt(existing.buyer_message || wf?.customer_communication?.body),
      carrier: txt(existing.carrier),
      tracking_number: txt(existing.tracking_number),
      fulfillment_note: txt(existing.fulfillment_note)
    };
  }

  function saveDraft(id) {
    const all = drafts();
    all[id] = {
      packaging_note: $('b150PackagingNote')?.value || '',
      internal_note: $('b150InternalNote')?.value || '',
      buyer_subject: $('b150BuyerSubject')?.value || '',
      buyer_message: $('b150BuyerMessage')?.value || '',
      carrier: $('b150Carrier')?.value || '',
      tracking_number: $('b150Tracking')?.value || '',
      fulfillment_note: $('b150FulfillmentNote')?.value || '',
      saved_at: new Date().toISOString()
    };
    const ok = writeJson(DRAFT_KEY, all);
    const out = $('b150DraftState');
    if (out) out.textContent = ok ? `Saved locally ${new Date().toLocaleTimeString()}. Not sent to buyer.` : 'Local draft could not be saved.';
  }

  function trackingFromHistory(history) {
    const row = (history || []).find((x) => txt(x.note).includes('[Release 467 Build 150 tracking audit]'));
    if (!row) return null;
    const note = txt(row.note);
    const carrier = (note.match(/carrier=([^\[]+?)\s+tracking=/) || [])[1]?.trim() || '';
    const tracking = (note.match(/tracking=([^\[]+?)(?:\s+\[client_action_id:|$)/) || [])[1]?.trim() || '';
    return { carrier, tracking, created_at: row.created_at };
  }

  function address(order) {
    if (lower(order.fulfillment_type) === 'pickup') return 'Local pickup — use the verified pickup arrangement on file.';
    return [order.shipping_name, order.shipping_company, order.shipping_address1, order.shipping_address2, [order.shipping_city, order.shipping_province, order.shipping_postal_code].filter(Boolean).join(' '), order.shipping_country].filter(Boolean).map(esc).join('<br>') || 'No shipping address recorded.';
  }

  function renderPrintSlip(order, items, draft) {
    $('b150PrintSlip').innerHTML = `<h1>Devil n Dove — Packing Slip</h1><p><strong>Order:</strong> ${esc(order.order_number || order.order_id)}<br><strong>Buyer:</strong> ${esc(order.customer_name || '')}<br><strong>Fulfilment:</strong> ${esc(order.fulfillment_type || '')}</p><div>${address(order)}</div><h2>Items</h2><table><thead><tr><th>Item</th><th>SKU</th><th>Qty</th></tr></thead><tbody>${(items || []).map((i) => `<tr><td>${esc(i.product_name)}</td><td>${esc(i.sku || '')}</td><td>${Number(i.quantity || 0)}</td></tr>`).join('')}</tbody></table>${draft.packaging_note ? `<h2>Packaging note</h2><p>${esc(draft.packaging_note)}</p>` : ''}<p>Printed ${esc(new Date().toLocaleString())}</p>`;
  }

  function renderDetail(detail) {
    const order = detail?.order || {};
    const items = detail?.items || [];
    const history = detail?.status_history || [];
    const wf = orderWorkflow(order.order_id);
    const draft = draftFor(order.order_id, wf);
    const track = trackingFromHistory(history);
    const liveDisabled = !online() || state.stale;
    const actions = Array.isArray(wf?.workflow_actions) ? wf.workflow_actions : [];
    renderPrintSlip(order, items, draft);

    $('b150Detail').innerHTML = `
      <div class="b150-grid">
        <section class="b150-panel"><div class="b150-row"><div><h3>${esc(order.order_number || `Order #${order.order_id}`)}</h3><div>${esc(order.customer_name || 'Customer')}</div><div class="small">${esc(order.customer_email || '')}</div></div><span class="b150-pill">${esc(wf?.workflow_stage_label || order.order_status || 'pending')}</span></div><p class="small"><strong>Payment:</strong> ${esc(wf?.derived_payment_status || order.payment_status || 'pending')} • <strong>Total:</strong> ${esc(money(order.total_cents, order.currency))}</p><p class="small"><strong>Order notes:</strong> ${esc(order.notes || 'None')}</p></section>
        <section class="b150-panel"><h3>${lower(order.fulfillment_type)==='pickup'?'Pickup':'Shipping / handoff'}</h3><div class="small">${address(order)}</div>${track ? `<p class="small"><strong>Latest tracking audit:</strong> ${esc(track.carrier)} — ${esc(track.tracking)} • ${date(track.created_at)}</p>` : '<p class="small b150-muted">No Build 150 tracking audit recorded.</p>'}</section>
      </div>
      <section class="b150-panel" style="margin-top:12px"><div class="b150-row"><h3>Line items</h3><button class="btn secondary" id="b150Print" type="button">Print packing slip</button></div><div class="b150-items">${items.length ? items.map((i) => `<div class="b150-item"><div class="b150-row"><strong>${esc(i.product_name)}</strong><span>${Number(i.quantity || 0)} × ${esc(money(i.unit_price_cents, order.currency))}</span></div><div class="small b150-muted">${esc(i.sku || 'No SKU')} • ${esc(i.product_type || '')}</div></div>`).join('') : '<p class="small">No line items were returned.</p>'}</div></section>
      <div class="b150-grid" style="margin-top:12px">
        <section class="b150-panel"><h3>Fulfilment actions</h3><p class="small">Uses the existing Operations-owned reviewed transition contract. Payment/refund/provider/accounting actions remain separate.</p><label class="small">Audit note<textarea class="b150-note" id="b150FulfillmentNote" rows="3" placeholder="Required for evidence/return; useful for other transitions">${esc(draft.fulfillment_note)}</textarea></label><div class="b150-actions" id="b150FulfillmentActions">${actions.length ? actions.map((a) => `<button class="btn b150-live-guard" type="button" data-fulfillment-status="${esc(a.new_status)}" data-note-required="${a.note_required ? '1' : '0'}" ${liveDisabled ? 'disabled' : ''}>${esc(a.label)}</button>`).join('') : '<span class="small">No reviewed next transition.</span>'}</div>${(wf?.blockers || []).map((b) => `<p class="small b150-danger">${esc(b)}</p>`).join('')}</section>
        <section class="b150-panel"><h3>Tracking audit</h3><p class="small">Records the carrier/reference in the order timeline only. It does not call the carrier or notify the buyer.</p><label class="small">Carrier<input id="b150Carrier" value="${esc(draft.carrier)}" placeholder="Canada Post, UPS, pickup…"></label><label class="small">Tracking / handoff reference<input id="b150Tracking" value="${esc(draft.tracking_number)}"></label><button class="btn b150-live-guard" id="b150RecordTracking" type="button" ${liveDisabled ? 'disabled' : ''}>Record live tracking audit</button></section>
      </div>
      <div class="b150-grid" style="margin-top:12px">
        <section class="b150-panel"><h3>Packaging & internal notes</h3><div class="b150-drafts"><label class="small">Packaging note<textarea id="b150PackagingNote" rows="3">${esc(draft.packaging_note)}</textarea></label><label class="small">Internal note<textarea id="b150InternalNote" rows="3">${esc(draft.internal_note)}</textarea></label><button class="btn secondary" id="b150SaveDraft" type="button">Save local drafts</button><div id="b150DraftState" class="small">Local-only; not written to D1.</div></div></section>
        <section class="b150-panel"><h3>Buyer message draft</h3><p class="small">Copy-only. Build 150 never sends a buyer message automatically.</p><label class="small">Subject<input id="b150BuyerSubject" value="${esc(draft.buyer_subject)}"></label><label class="small">Message<textarea id="b150BuyerMessage" rows="5">${esc(draft.buyer_message)}</textarea></label><div class="b150-actions"><button class="btn secondary" id="b150CopyMessage" type="button">Copy message</button><a class="btn secondary" href="#ordersSection">Payment / refund details</a></div></section>
      </div>
      <section class="b150-panel" style="margin-top:12px"><h3>Order timeline</h3><div class="b150-timeline">${history.length ? history.map((h) => `<div class="b150-event"><div class="b150-row"><strong>${esc(h.old_status || '—')} → ${esc(h.new_status || '—')}</strong><span class="small">${date(h.created_at)}</span></div><div class="small">${esc(h.note || '')}</div></div>`).join('') : '<p class="small">No status history returned.</p>'}</div></section>`;

    $('b150Print')?.addEventListener('click', () => { saveDraft(order.order_id); renderPrintSlip(order, items, draftFor(order.order_id, wf)); window.print(); });
    $('b150SaveDraft')?.addEventListener('click', () => saveDraft(order.order_id));
    $('b150CopyMessage')?.addEventListener('click', async () => { const value = `${$('b150BuyerSubject')?.value || ''}\n\n${$('b150BuyerMessage')?.value || ''}`.trim(); try { await navigator.clipboard.writeText(value); message('Buyer message copied. Nothing was sent.'); } catch { message('Could not access the clipboard. Copy the draft manually.', true); } });
    $('b150RecordTracking')?.addEventListener('click', () => recordTracking(order, wf));
    $('b150FulfillmentActions')?.querySelectorAll('[data-fulfillment-status]').forEach((btn) => btn.addEventListener('click', () => advanceFulfillment(order, btn.dataset.fulfillmentStatus, btn.dataset.noteRequired === '1')));
  }

  async function selectOrder(id, force = false) {
    state.selected = Number(id || 0);
    renderList();
    if (!state.selected) return;
    if (!force && state.details[state.selected]) { renderDetail(state.details[state.selected]); return; }
    $('b150Detail').innerHTML = '<div class="b150-panel"><p class="small">Loading order detail…</p></div>';
    if (!online() || state.stale) {
      const cached = state.details[state.selected];
      if (cached) renderDetail(cached); else $('b150Detail').innerHTML = '<div class="b150-panel"><p class="small">Order detail is not cached. Reconnect to load it.</p></div>';
      return;
    }
    try {
      const r = await apiFetch(`/api/admin/order-detail?order_id=${encodeURIComponent(state.selected)}`, { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok || !d?.ok) throw new Error(d?.error || `Order detail failed (${r.status}).`);
      state.details[state.selected] = d;
      saveSnapshot();
      renderDetail(d);
    } catch (error) {
      const cached = state.details[state.selected];
      if (cached) { state.stale = true; renderDetail(cached); message(`Live detail unavailable; showing cached detail. ${error.message || error}`, true); }
      else $('b150Detail').innerHTML = `<div class="b150-panel"><p class="small b150-danger">${esc(error.message || error)}</p></div>`;
    }
  }

  async function postLiveAction(kind, route, body) {
    if (!online() || state.stale) throw new Error('Live authority is unavailable. Refresh after reconnecting before changing fulfilment or tracking.');
    const action = { kind, route, body, created_at: new Date().toISOString() };
    const list = pending();
    list.push(action);
    writeJson(PENDING_KEY, list);
    renderPending();
    try {
      const r = await apiFetch(route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d?.ok) throw Object.assign(new Error(d?.error || `Live action failed (${r.status}).`), { confirmedFailure: r.status < 500 && r.status !== 408 && r.status !== 429 });
      writeJson(PENDING_KEY, pending().filter((x) => x.body?.client_action_id !== body.client_action_id));
      renderPending();
      return d;
    } catch (error) {
      if (error.confirmedFailure) {
        writeJson(PENDING_KEY, pending().filter((x) => x.body?.client_action_id !== body.client_action_id));
        renderPending();
      }
      throw error;
    }
  }

  async function advanceFulfillment(order, newStatus, noteRequired) {
    const note = txt($('b150FulfillmentNote')?.value);
    if (noteRequired && !note) { message('This fulfilment transition requires an audit note.', true); return; }
    if (!confirm(`Confirm live fulfilment change for ${order.order_number || order.order_id}: ${order.order_status} → ${newStatus}?`)) return;
    const id = actionId('fulfillment', order.order_id);
    message(`Confirming ${newStatus}…`);
    try {
      const d = await postLiveAction('fulfillment', '/api/admin/contracts/operations-order-fulfillment-workflow-write', { order_id: Number(order.order_id), new_status: newStatus, note, client_action_id: id });
      message(d.idempotent_replay ? 'Previous fulfilment action confirmed safely after retry.' : d.message || 'Fulfilment updated.');
      state.details = {};
      await loadLive(order.order_id);
    } catch (error) {
      message(`${error.message || error} If the outcome is uncertain, use “Retry pending confirmation”; the same client_action_id prevents a duplicate write.`, true);
    }
  }

  async function recordTracking(order) {
    const carrier = txt($('b150Carrier')?.value);
    const tracking = txt($('b150Tracking')?.value);
    if (!carrier || !tracking) { message('Carrier and tracking / handoff reference are required.', true); return; }
    if (!confirm(`Record this tracking audit for ${order.order_number || order.order_id}? This does not contact the carrier or buyer.`)) return;
    const id = actionId('tracking', order.order_id);
    try {
      const d = await postLiveAction('tracking', '/api/admin/contracts/operations-order-tracking-audit-write', { order_id: Number(order.order_id), carrier, tracking_number: tracking, note: txt($('b150InternalNote')?.value), expected_order_status: lower(order.order_status || 'pending'), client_action_id: id });
      message(d.idempotent_replay ? 'Previous tracking audit confirmed safely after retry.' : d.message || 'Tracking audit recorded.');
      state.details = {};
      await loadLive(order.order_id);
    } catch (error) {
      message(`${error.message || error} If the outcome is uncertain, retry the pending confirmation instead of creating a new action.`, true);
    }
  }

  function renderPending() {
    const rows = pending();
    $('b150Pending').innerHTML = rows.length ? `<div class="b150-offline"><strong>${rows.length} live action(s) awaiting confirmation.</strong> A request may have reached the server even if its response was lost. <button class="btn secondary" id="b150RetryPending" type="button" ${online() ? '' : 'disabled'}>Retry pending confirmation</button></div>` : '';
    $('b150RetryPending')?.addEventListener('click', retryPending);
  }

  async function retryPending() {
    if (!online()) { message('Reconnect before retrying pending confirmations.', true); return; }
    const rows = pending();
    if (!rows.length) return;
    if (!confirm(`Retry ${rows.length} pending live action(s) with the same client_action_id values?`)) return;
    for (const action of rows) {
      try {
        const r = await apiFetch(action.route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action.body) });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d?.ok) writeJson(PENDING_KEY, pending().filter((x) => x.body?.client_action_id !== action.body?.client_action_id));
        else if (r.status < 500 && r.status !== 408 && r.status !== 429) writeJson(PENDING_KEY, pending().filter((x) => x.body?.client_action_id !== action.body?.client_action_id));
      } catch { /* Preserve uncertain action for another explicit retry. */ }
    }
    renderPending();
    state.details = {};
    await loadLive(state.selected || 0);
  }

  async function loadLive(reselect = 0) {
    if (!online()) return loadSnapshot('Offline — showing the last saved Orders snapshot. Live fulfilment and tracking controls are disabled.');
    message('Loading live Orders workspace…');
    try {
      const [ordersResponse, workflowResponse] = await Promise.all([
        apiFetch('/api/admin/orders', { cache: 'no-store' }),
        apiFetch('/api/admin/order-fulfillment-workflow?limit=120', { cache: 'no-store' })
      ]);
      const ordersData = await ordersResponse.json();
      if (!ordersResponse.ok || !ordersData?.ok) throw new Error(ordersData?.error || `Orders failed (${ordersResponse.status}).`);
      let workflowData = {};
      try { workflowData = await workflowResponse.json(); } catch { workflowData = {}; }
      state.orders = Array.isArray(ordersData.orders) ? ordersData.orders : [];
      state.workflow = new Map((workflowResponse.ok && Array.isArray(workflowData?.workflow?.orders) ? workflowData.workflow.orders : []).map((x) => [Number(x.order_id), x]));
      state.stale = false;
      state.warning = ordersData.warning || (!workflowResponse.ok ? 'Fulfilment workflow projection is temporarily unavailable.' : '');
      saveSnapshot();
      renderList();
      renderPending();
      message(state.warning || `Live Orders workspace loaded • ${state.orders.length} orders.`);
      const target = Number(reselect || state.selected || state.orders[0]?.order_id || 0);
      if (target) await selectOrder(target, true);
    } catch (error) {
      loadSnapshot(`Live Orders unavailable — cached snapshot shown. ${error.message || error}`);
    }
  }

  function loadSnapshot(reason) {
    const snap = readJson(SNAPSHOT_KEY, null);
    if (!snap?.orders) {
      state.orders = [];
      state.workflow = new Map();
      state.stale = true;
      renderList();
      renderPending();
      message(`${reason} No saved snapshot is available.`, true);
      return;
    }
    state.orders = snap.orders || [];
    state.workflow = new Map((snap.workflows || []).map((x) => [Number(x.order_id), x]));
    state.details = snap.details || {};
    state.stale = true;
    renderList();
    renderPending();
    message(`${reason} Snapshot saved ${date(snap.saved_at)}.`, true);
    const target = Number(state.selected || state.orders[0]?.order_id || 0);
    if (target) selectOrder(target);
  }

  $('b150Search').addEventListener('input', (e) => { state.query = e.target.value; renderList(); });
  $('b150Status').addEventListener('change', (e) => { state.status = e.target.value; renderList(); });
  $('b150Fulfillment').addEventListener('change', (e) => { state.fulfillment = e.target.value; renderList(); });
  $('b150Payment').addEventListener('change', (e) => { state.payment = e.target.value; renderList(); });
  $('b150Refresh').addEventListener('click', () => loadLive(state.selected));
  window.addEventListener('online', () => { message('Connection restored. Refresh live Orders before making changes.'); renderPending(); });
  window.addEventListener('offline', () => { state.stale = true; message('Offline — local drafts remain available; live fulfilment/tracking actions are disabled.', true); if (state.selected && state.details[state.selected]) renderDetail(state.details[state.selected]); });

  renderPending();
  void loadLive();
});
