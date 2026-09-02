(() => {
  const mount = document.getElementById('fulfillmentCareMount');
  if (!mount) return;
  const apiFetch = window.DDAuth?.apiFetch || fetch;
  let state = null;
  let severity = 'all';
  let lane = 'all';

  function esc(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (ch) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' })[ch]);
  }
  function money(cents, currency='CAD') {
    return (Number(cents || 0) / 100).toLocaleString('en-CA', { style:'currency', currency: currency || 'CAD' });
  }
  function when(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? esc(value) : d.toLocaleString('en-CA', { dateStyle:'medium', timeStyle:'short' });
  }
  function badge(value, type='') { return `<span class="fc-badge ${esc(type || value || '')}">${esc(value || '—')}</span>`; }
  function summaryCard(label, value, note='') {
    return `<div class="fc-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong>${note ? `<small>${esc(note)}</small>` : ''}</div>`;
  }
  function laneLabel(value) {
    return ({ policy:'Policy',payment:'Payment',fulfillment:'Fulfillment',refund:'Refund',custom_order:'Custom order',customer_care:'Customer care',after_sale:'After sale' })[value] || value || 'Other';
  }
  function filteredQueue() {
    const list = Array.isArray(state?.queue) ? state.queue : [];
    return list.filter((item) => (severity === 'all' || item.severity === severity) && (lane === 'all' || item.lane === lane));
  }
  function queueHtml() {
    const list = filteredQueue();
    if (!list.length) return '<div class="card fc-empty">No attention items match the current filters.</div>';
    return `<div class="fc-queue">${list.map((item) => `
      <article class="card fc-attention severity-${esc(item.severity)}">
        <div class="fc-row fc-between"><div>${badge(item.severity, item.severity)} ${badge(laneLabel(item.lane), item.lane)}</div><small>${when(item.updated_at)}</small></div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.detail)}</p>
        <div class="fc-row fc-between"><small>${item.customer_email ? `Customer: ${esc(item.customer_email)}` : 'Customer email not recorded'}</small><a class="btn" href="${esc(item.owner_href)}">${esc(item.owner_label || 'Open owner')}</a></div>
      </article>`).join('')}</div>`;
  }
  function standardOrdersHtml() {
    const list = Array.isArray(state?.orders) ? state.orders.slice(0, 50) : [];
    if (!list.length) return '<p class="small">No standard orders returned.</p>';
    return `<div class="fc-table-wrap"><table class="fc-table"><thead><tr><th>Order</th><th>Customer</th><th>Order</th><th>Payment</th><th>Fulfillment</th><th>Total</th><th>Updated</th></tr></thead><tbody>${list.map((o) => `
      <tr><td><a href="/admin/stripe-purchases/?order_id=${Number(o.order_id || 0)}">${esc(o.order_number || o.order_id)}</a></td><td>${esc(o.customer_name || '—')}<br/><small>${esc(o.customer_email || '')}</small></td><td>${badge(o.order_status || 'pending')}</td><td>${badge(o.payment_status || 'pending')}<br/><small>Paid ${money(o.paid_total_cents,o.currency)}</small></td><td>${badge(o.fulfillment_type || 'shipping')}<br/><small>${esc(o.shipping_country || '')}</small></td><td>${money(o.total_cents,o.currency)}</td><td>${when(o.updated_at || o.created_at)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function customOrdersHtml() {
    const list = Array.isArray(state?.custom_orders) ? state.custom_orders.slice(0, 50) : [];
    if (!list.length) return '<p class="small">No active custom requests returned.</p>';
    return `<div class="fc-table-wrap"><table class="fc-table"><thead><tr><th>Request</th><th>Customer</th><th>Request</th><th>Order</th><th>Payment</th><th>Stage</th><th>Follow-up</th></tr></thead><tbody>${list.map((r) => `
      <tr><td><a href="/admin/custom-request/?custom_request_id=${Number(r.custom_request_id || 0)}">${esc(r.request_key || r.custom_request_id)}</a></td><td>${esc(r.customer_name || '—')}<br/><small>${esc(r.customer_email || '')}</small></td><td>${badge(r.request_status || 'new')}</td><td>${r.order_number ? `${esc(r.order_number)}<br/>${badge(r.order_status || 'pending')}` : badge(r.order_draft_status || 'no order')}</td><td>${badge(r.payment_status || 'not linked')}</td><td>${esc(r.latest_stage_label || r.latest_stage_key || 'Not recorded')}<br/><small>${when(r.latest_stage_at)}</small></td><td>${badge(r.latest_prompt_status || 'not started')}<br/><small>${esc(r.latest_prompt_response_status || '')}</small></td></tr>`).join('')}</tbody></table></div>`;
  }
  function customersHtml() {
    const list = Array.isArray(state?.customers) ? state.customers.slice(0, 30) : [];
    if (!list.length) return '<p class="small">No customer activity returned.</p>';
    return `<div class="fc-customer-grid">${list.map((c) => `<div class="card fc-customer"><div class="fc-between fc-row"><strong>${esc(c.customer_name || c.customer_email)}</strong>${c.open_attention ? badge(`${c.open_attention} open`, c.open_attention > 2 ? 'high':'medium') : badge('clear','low')}</div><small>${esc(c.customer_email)}</small><p>${Number(c.standard_orders || 0)} standard order(s) • ${Number(c.custom_requests || 0)} custom request(s)</p><small>Last activity ${when(c.last_activity_at)}</small></div>`).join('')}</div>`;
  }
  function render() {
    if (!state) return;
    const s = state.summary || {};
    const lanes = ['all','policy','payment','fulfillment','refund','custom_order','customer_care','after_sale'];
    mount.innerHTML = `
      <section class="fc-stats">
        ${summaryCard('Attention',s.attention_total || 0,'ranked read-only queue')}
        ${summaryCard('Critical',s.critical || 0,'policy / urgent')}
        ${summaryCard('High',s.high || 0,'operator review')}
        ${summaryCard('Payment',s.payment_attention || 0)}
        ${summaryCard('Fulfillment',s.fulfillment_attention || 0)}
        ${summaryCard('Customer care',s.customer_care_attention || 0)}
        ${summaryCard('Refund',s.refund_attention || 0,'review only')}
      </section>
      <section class="card fc-controls"><div><strong>Attention queue</strong><p class="small">Nothing below is changed automatically.</p></div><label>Severity<select id="fcSeverity"><option value="all">All</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label><label>Lane<select id="fcLane">${lanes.map(v=>`<option value="${v}">${esc(v==='all'?'All lanes':laneLabel(v))}</option>`).join('')}</select></label><button type="button" class="btn" id="fcRefresh">Refresh</button></section>
      <section id="fcQueueMount">${queueHtml()}</section>
      <details class="card fc-section" open><summary><strong>Standard orders</strong> <span class="small">${Number(s.standard_orders || 0)} loaded</span></summary>${standardOrdersHtml()}</details>
      <details class="card fc-section"><summary><strong>Custom-order progress</strong> <span class="small">${Number(s.custom_requests || 0)} active</span></summary>${customOrdersHtml()}</details>
      <details class="card fc-section"><summary><strong>Customer-care context</strong></summary>${customersHtml()}<p><a class="btn" href="/admin/customers/">Open Customers owner</a></p></details>
      <section class="card fc-owner-grid"><div><strong>Orders</strong><p>Order/payment/refund and fulfillment-owner actions.</p><a class="btn" href="/admin/orders/">Open Orders</a></div><div><strong>Custom Requests</strong><p>Quote, payment link, stage, consent and follow-up actions.</p><a class="btn" href="/admin/custom-request/">Open Custom Requests</a></div><div><strong>Accounting</strong><p>Financial truth remains in Accounting.</p><a class="btn" href="/admin/accounting/">Open Accounting</a></div></section>`;
    const severityEl = document.getElementById('fcSeverity');
    const laneEl = document.getElementById('fcLane');
    severityEl.value = severity; laneEl.value = lane;
    severityEl.addEventListener('change', () => { severity=severityEl.value; document.getElementById('fcQueueMount').innerHTML=queueHtml(); });
    laneEl.addEventListener('change', () => { lane=laneEl.value; document.getElementById('fcQueueMount').innerHTML=queueHtml(); });
    document.getElementById('fcRefresh').addEventListener('click', load);
  }
  async function load() {
    mount.innerHTML = '<div class="card"><strong>Loading fulfillment and customer-care intelligence…</strong></div>';
    try {
      const response = await apiFetch('/api/admin/order-fulfillment-care', { headers:{ Accept:'application/json' } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `Request failed (${response.status})`);
      state = data;
      render();
    } catch (error) {
      mount.innerHTML = `<div class="card fc-error"><strong>Could not load Order Fulfillment &amp; Customer Care.</strong><p>${esc(error.message || error)}</p><button class="btn" type="button" id="fcRetry">Retry</button></div>`;
      document.getElementById('fcRetry')?.addEventListener('click', load);
    }
  }
  load();
})();
