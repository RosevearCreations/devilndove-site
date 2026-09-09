// Release 467 Build 82 — Orders / Fulfilment workflow UI.
// Customer communication remains copy-only; no message is sent automatically.

(() => {
  const mount = document.getElementById('orderFulfillmentWorkflowMount');
  if (!mount || !window.DDAuth) return;

  const READ_ROUTE = '/api/admin/order-fulfillment-workflow?limit=100';
  const WRITE_ROUTE = '/api/admin/contracts/operations-order-fulfillment-workflow-write';
  let state = null;
  let stageFilter = 'all';
  let fulfillmentFilter = 'all';
  let search = '';
  let busyOrderId = 0;

  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (ch) => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
  })[ch]);
  const title = (value) => String(value || '—').replaceAll('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  const money = (cents, currency='CAD') => {
    try { return (Number(cents || 0) / 100).toLocaleString('en-CA', { style:'currency', currency:currency || 'CAD' }); }
    catch { return `${(Number(cents || 0) / 100).toFixed(2)} ${currency || 'CAD'}`; }
  };
  const when = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('en-CA', { dateStyle:'medium', timeStyle:'short' });
  };

  function filteredOrders() {
    const orders = Array.isArray(state?.orders) ? state.orders : [];
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (stageFilter !== 'all' && order.workflow_stage !== stageFilter) return false;
      if (fulfillmentFilter !== 'all' && order.fulfillment_type !== fulfillmentFilter) return false;
      if (!q) return true;
      const haystack = [
        order.order_number, order.customer_name, order.customer_email,
        order.order_status, order.payment_status, order.workflow_stage_label,
      ].map((value) => String(value || '').toLowerCase()).join(' ');
      return haystack.includes(q);
    });
  }

  function stat(label, value, note='') {
    return `<div class="ofw-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong>${note ? `<small>${esc(note)}</small>` : ''}</div>`;
  }

  function progress(stage) {
    const sequence = ['paid','preparing','making','packing','evidence','ready','fulfilled'];
    const index = sequence.indexOf(stage);
    if (stage === 'returned') return '<div class="ofw-progress returned"><span>Returned</span></div>';
    if (stage === 'refunded') return '<div class="ofw-progress refunded"><span>Refunded</span></div>';
    if (stage === 'cancelled') return '<div class="ofw-progress cancelled"><span>Cancelled</span></div>';
    if (stage === 'awaiting_payment' || index < 0) return `<div class="ofw-progress"><span class="active">${esc(title(stage))}</span></div>`;
    return `<div class="ofw-progress">${sequence.map((id, i) => `<span class="${i < index ? 'done' : i === index ? 'active' : ''}">${esc(id === 'ready' ? 'Ready' : title(id))}</span>`).join('')}</div>`;
  }

  function actionButtons(order) {
    const actions = Array.isArray(order.workflow_actions) ? order.workflow_actions : [];
    if (!actions.length) return '<span class="small">No reviewed forward transition.</span>';
    return actions.map((action) => `
      <button class="btn ofw-action" type="button"
        data-order-id="${Number(order.order_id || 0)}"
        data-new-status="${esc(action.new_status)}"
        data-note-required="${action.note_required ? '1' : '0'}"
        ${busyOrderId === Number(order.order_id || 0) ? 'disabled' : ''}>
        ${esc(action.label)}
      </button>`).join('');
  }

  function orderCard(order) {
    const comm = order.customer_communication || {};
    const blockers = Array.isArray(order.blockers) ? order.blockers : [];
    return `
      <article class="card ofw-order" data-stage="${esc(order.workflow_stage)}">
        <div class="ofw-head">
          <div>
            <div class="ofw-kicker">${esc(order.order_number || `Order ${order.order_id}`)} • ${esc(title(order.fulfillment_type))}</div>
            <h3>${esc(order.customer_name || 'Customer')} <small>${esc(order.customer_email || '')}</small></h3>
          </div>
          <div class="ofw-statuses">
            <span>${esc(order.workflow_stage_label || title(order.workflow_stage))}</span>
            <small>Order ${esc(title(order.order_status))} • Payment ${esc(title(order.derived_payment_status))}</small>
          </div>
        </div>
        ${progress(order.workflow_stage)}
        <div class="ofw-grid">
          <div><small>Total</small><strong>${esc(money(order.total_cents, order.currency))}</strong></div>
          <div><small>Paid</small><strong>${esc(money(order.paid_total_cents, order.currency))}</strong></div>
          <div><small>Outstanding</small><strong>${esc(money(order.outstanding_cents, order.currency))}</strong></div>
          <div><small>Latest audit</small><strong>${esc(when(order.audit?.latest_at))}</strong></div>
        </div>
        ${blockers.length ? `<div class="ofw-blockers">${blockers.map((item) => `<p>${esc(item)}</p>`).join('')}</div>` : ''}
        <div class="ofw-actions">
          <label class="small">Audit note
            <input type="text" maxlength="1200" data-workflow-note="${Number(order.order_id || 0)}" placeholder="Optional except evidence / return" />
          </label>
          <div>${actionButtons(order)}</div>
        </div>
        <details class="ofw-communication">
          <summary><strong>Customer update draft</strong> <span class="small">copy-only — never sent automatically</span></summary>
          <p><strong>Subject:</strong> ${esc(comm.subject || '—')}</p>
          <p>${esc(comm.body || 'No draft available.')}</p>
          <button class="btn" type="button" data-copy-order="${Number(order.order_id || 0)}">Copy customer update</button>
        </details>
        <details class="ofw-audit">
          <summary><strong>Latest audit history</strong> <span class="small">${Number(order.audit?.history_count || 0)} event(s)</span></summary>
          <p>${esc(order.audit?.latest_note || 'No status-history note is available.')}</p>
          <p class="small">Latest stored status: ${esc(title(order.audit?.latest_status || order.order_status))} • ${esc(when(order.audit?.latest_at))}</p>
          <a class="btn" href="/admin/orders/">Open Orders for full detail</a>
        </details>
      </article>`;
  }

  function renderOrders() {
    const list = filteredOrders();
    const target = document.getElementById('ofwOrders');
    if (!target) return;
    target.innerHTML = list.length
      ? list.map(orderCard).join('')
      : '<div class="card"><strong>No orders match the current workflow filters.</strong></div>';
    bindCardEvents();
  }

  function render() {
    const summary = state?.summary || {};
    const counts = summary.stage_counts || {};
    mount.innerHTML = `
      <section class="ofw-summary">
        ${stat('Active', summary.active_orders || 0, 'paid → ready')}
        ${stat('Ready', summary.ready || 0)}
        ${stat('Fulfilled', summary.fulfilled || 0)}
        ${stat('Returned', summary.returned || 0)}
        ${stat('Refunded', summary.refunded || 0, 'financial owner')}
        ${stat('Blocked', summary.blocked || 0)}
        ${stat('Review', summary.review || 0)}
      </section>
      <section class="card ofw-controls">
        <div>
          <strong>Build 82 fulfilment workflow</strong>
          <p class="small">Reviewed forward transitions write to Orders + order_status_history. Messages are drafts only; refunds and provider actions remain elsewhere.</p>
        </div>
        <label>Stage
          <select id="ofwStageFilter">
            <option value="all">All stages</option>
            ${Object.keys(counts).map((id) => `<option value="${esc(id)}">${esc(title(id))} (${Number(counts[id] || 0)})</option>`).join('')}
          </select>
        </label>
        <label>Fulfilment
          <select id="ofwFulfillmentFilter">
            <option value="all">All</option>
            <option value="shipping">Shipping</option>
            <option value="pickup">Pickup</option>
            <option value="digital">Digital</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>
        <label>Search
          <input id="ofwSearch" type="search" placeholder="Order, customer, email…" autocomplete="off"/>
        </label>
        <button class="btn" type="button" id="ofwRefresh">Refresh</button>
      </section>
      <div id="ofwMessage" class="small ofw-message" aria-live="polite"></div>
      <section id="ofwOrders" class="ofw-orders"></section>`;
    document.getElementById('ofwStageFilter').value = stageFilter;
    document.getElementById('ofwFulfillmentFilter').value = fulfillmentFilter;
    document.getElementById('ofwSearch').value = search;
    document.getElementById('ofwStageFilter').addEventListener('change', (event) => { stageFilter = event.target.value; renderOrders(); });
    document.getElementById('ofwFulfillmentFilter').addEventListener('change', (event) => { fulfillmentFilter = event.target.value; renderOrders(); });
    document.getElementById('ofwSearch').addEventListener('input', (event) => { search = event.target.value; renderOrders(); });
    document.getElementById('ofwRefresh').addEventListener('click', load);
    renderOrders();
  }

  function setMessage(message, tone='') {
    const el = document.getElementById('ofwMessage');
    if (!el) return;
    el.textContent = message || '';
    el.dataset.tone = tone;
  }

  async function transition(orderId, newStatus, noteRequired) {
    const noteEl = mount.querySelector(`[data-workflow-note="${orderId}"]`);
    const note = String(noteEl?.value || '').trim();
    if (noteRequired && !note) {
      setMessage(`${title(newStatus)} requires an audit note.`, 'error');
      noteEl?.focus();
      return;
    }
    busyOrderId = orderId;
    renderOrders();
    setMessage(`Updating order ${orderId} → ${title(newStatus)}…`);
    try {
      const response = await window.DDAuth.apiFetch(WRITE_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Accept:'application/json' },
        body: JSON.stringify({ order_id:orderId, new_status:newStatus, note }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `Update failed (${response.status})`);
      setMessage(data.message || `Order ${orderId} updated.`, 'success');
      await load(true);
      document.dispatchEvent(new CustomEvent('dd:order-updated', { detail:{ order_id:orderId, new_status:newStatus } }));
    } catch (error) {
      setMessage(error.message || String(error), 'error');
    } finally {
      busyOrderId = 0;
      renderOrders();
    }
  }

  async function copyCommunication(orderId) {
    const order = (state?.orders || []).find((row) => Number(row.order_id) === Number(orderId));
    const comm = order?.customer_communication || {};
    const textValue = [`Subject: ${comm.subject || ''}`, '', comm.body || ''].join('\n');
    try {
      await navigator.clipboard.writeText(textValue);
      setMessage(`Customer update for ${order?.order_number || orderId} copied. Nothing was sent.`, 'success');
    } catch {
      setMessage('Copy failed. Select the draft text manually; nothing was sent.', 'error');
    }
  }

  function bindCardEvents() {
    mount.querySelectorAll('.ofw-action').forEach((button) => {
      button.addEventListener('click', () => transition(
        Number(button.dataset.orderId || 0),
        String(button.dataset.newStatus || ''),
        button.dataset.noteRequired === '1',
      ));
    });
    mount.querySelectorAll('[data-copy-order]').forEach((button) => {
      button.addEventListener('click', () => copyCommunication(Number(button.dataset.copyOrder || 0)));
    });
  }

  async function load(preserveMessage=false) {
    if (!preserveMessage) {
      mount.innerHTML = '<div class="card"><strong>Loading Build 82 Orders / Fulfilment workflow…</strong></div>';
    }
    try {
      const response = await window.DDAuth.apiFetch(READ_ROUTE, { method:'GET', headers:{ Accept:'application/json' } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `Workflow request failed (${response.status})`);
      state = data;
      render();
      if (!preserveMessage) setMessage(`Loaded ${Number(data.summary?.total_orders || 0)} order workflow record(s).`, 'success');
    } catch (error) {
      if (state) {
        render();
        setMessage(`Live workflow refresh failed. The last in-page result remains visible: ${error.message || error}`, 'error');
      } else {
        mount.innerHTML = `<div class="card ofw-error"><strong>Could not load the Build 82 fulfilment workflow.</strong><p>${esc(error.message || error)}</p><button class="btn" type="button" id="ofwRetry">Retry</button></div>`;
        document.getElementById('ofwRetry')?.addEventListener('click', () => load(false));
      }
    }
  }

  load(false);
})();
