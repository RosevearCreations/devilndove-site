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
  const state = { orders: [], workflow: new Map(), details: {}, selected: 0, stale: false, query: '', status: 'all', fulfillment: 'all', payment: 'all' };
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const txt = (v) => String(v ?? '').trim();
  const lower = (v) => txt(v).toLowerCase();
  const online = () => navigator.onLine !== false;
  const readJson = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch { return fallback; } };
  const writeJson = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  const money = (cents, currency='CAD') => { try { return new Intl.NumberFormat(undefined,{style:'currency',currency:currency||'CAD'}).format(Number(cents||0)/100); } catch { return `${(Number(cents||0)/100).toFixed(2)} ${currency||'CAD'}`; } };
  const when = (v) => { if (!v) return '—'; const d = new Date(v); return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString(); };
  const actionId = (kind, orderId) => { const bytes = new Uint32Array(2); crypto.getRandomValues(bytes); return `b150:${kind}:${orderId}:${Date.now().toString(36)}:${Array.from(bytes).map((n)=>n.toString(36)).join('')}`; };
  const drafts = () => readJson(DRAFT_KEY, {});
  const pending = () => readJson(PENDING_KEY, []);

  mount.innerHTML = `
    <section class="card b150-orders" data-release="467" data-build="150">
      <div class="b150-row"><div><p class="eyebrow">Release 467 Build 150</p><h2>Orders, Fulfillment &amp; Buyer Communication Workspace</h2><p class="small">Buyer identity, products, payment state, fulfilment, local drafts, tracking audit, packing slips and timeline in one seller workspace.</p></div><div class="b150-actions"><button class="btn" id="b150Refresh" type="button">Refresh</button><a class="btn secondary" href="/admin/order-fulfillment-care/">Fulfilment queue</a></div></div>
      <div id="b150Connectivity" class="small b150-message" aria-live="polite"></div>
      <div class="b150-toolbar">
        <label><span class="small">Search order, buyer, email, product or SKU</span><input id="b150Search" autocomplete="off" placeholder="Order #, buyer, email, product, SKU…"></label>
        <label><span class="small">Status</span><select id="b150Status"><option value="all">All statuses</option><option>pending</option><option>paid</option><option>preparing</option><option>making</option><option>packing</option><option>evidence</option><option>ready</option><option>fulfilled</option><option>returned</option><option>cancelled</option><option>refunded</option></select></label>
        <label><span class="small">Fulfilment</span><select id="b150Fulfillment"><option value="all">All fulfilment</option><option>shipping</option><option>pickup</option><option>digital</option><option>mixed</option></select></label>
        <label><span class="small">Payment</span><select id="b150Payment"><option value="all">All payment states</option><option>pending</option><option>authorized</option><option>paid</option><option>partially_refunded</option><option>refunded</option><option>failed</option></select></label>
      </div>
      <div class="b150-summary" id="b150Summary"></div>
      <div id="b150Pending" class="small"></div>
      <div class="b150-layout"><div><div class="small b150-muted" id="b150ListMeta"></div><div class="b150-list" id="b150List">Loading orders…</div></div><div class="b150-detail" id="b150Detail"><div class="b150-panel"><h3>Select an order</h3></div></div></div>
      <div class="b150-print-slip" id="b150PrintSlip"></div>
    </section>`;

  const message = (text, danger=false) => { const el=$('b150Connectivity'); if (!el) return; el.className=`small b150-message${danger?' b150-danger':''}`; el.textContent=text||''; };
  const workflowFor = (id) => state.workflow.get(Number(id)) || null;
  const saveSnapshot = () => writeJson(SNAPSHOT_KEY,{saved_at:new Date().toISOString(),orders:state.orders,workflows:Array.from(state.workflow.values()),details:state.details});

  function lifecycle(row) {
    const stage=lower(workflowFor(row.order_id)?.workflow_stage || row.order_status);
    if (['draft','pending','awaiting_payment'].includes(stage)) return 'Received';
    if (['paid','processing'].includes(stage)) return 'Confirmed';
    if (['preparing','making','packing','evidence'].includes(stage)) return 'In progress';
    if (stage==='ready') return 'Ready';
    if (['fulfilled','completed'].includes(stage)) return 'Complete';
    return 'Review';
  }

  function filtered() {
    const q=lower(state.query);
    return state.orders.filter((o)=>{
      const wf=workflowFor(o.order_id);
      const hay=[o.order_id,o.order_number,o.customer_name,o.customer_email,o.payment_method,o.product_search_text,o.order_status,wf?.workflow_stage_label].map(lower).join(' ');
      return (!q||hay.includes(q)) && (state.status==='all'||lower(o.order_status)===state.status||lower(wf?.workflow_stage)===state.status) && (state.fulfillment==='all'||lower(o.fulfillment_type)===state.fulfillment) && (state.payment==='all'||lower(o.derived_payment_status||o.payment_status)===state.payment);
    });
  }

  function renderList() {
    const rows=filtered().slice(0,80);
    const counts={Received:0,Confirmed:0,'In progress':0,Ready:0,Complete:0,Review:0};
    rows.forEach((r)=>{ counts[lifecycle(r)]=(counts[lifecycle(r)]||0)+1; });
    $('b150Summary').innerHTML=Object.entries(counts).map(([k,v])=>`<div class="b150-kpi"><span class="small">${esc(k)}</span><strong>${v}</strong></div>`).join('');
    $('b150ListMeta').textContent=`${rows.length} of ${state.orders.length} orders${state.stale?' • cached snapshot':''}`;
    $('b150List').innerHTML=rows.length?rows.map((o)=>{ const wf=workflowFor(o.order_id); return `<button class="b150-order" type="button" data-order-id="${Number(o.order_id)}" aria-current="${state.selected===Number(o.order_id)}"><div class="b150-row"><strong>${esc(o.order_number||`#${o.order_id}`)}</strong><span class="b150-pill">${esc(wf?.workflow_stage_label||o.order_status||'pending')}</span></div><div>${esc(o.customer_name||'Customer')} <span class="small b150-muted">${esc(o.customer_email||'')}</span></div><div class="small b150-muted">${esc(o.product_search_text||`${Number(o.item_count||0)} item(s)`)}</div><div class="b150-row small"><span>${esc(o.fulfillment_type||'shipping')} • ${esc(o.derived_payment_status||o.payment_status||'pending')}</span><strong>${esc(money(o.total_cents,o.currency))}</strong></div></button>`; }).join(''):'<div class="b150-order">No orders match these filters.</div>';
    $('b150List').querySelectorAll('[data-order-id]').forEach((btn)=>btn.addEventListener('click',()=>selectOrder(Number(btn.dataset.orderId))));
  }

  function draftFor(id,wf) {
    const d=drafts()[id]||{};
    return { packaging_note:txt(d.packaging_note), internal_note:txt(d.internal_note), buyer_subject:txt(d.buyer_subject||wf?.customer_communication?.subject), buyer_message:txt(d.buyer_message||wf?.customer_communication?.body), carrier:txt(d.carrier), tracking_number:txt(d.tracking_number), fulfillment_note:txt(d.fulfillment_note) };
  }

  function saveDraft(id) {
    const all=drafts();
    all[id]={packaging_note:$('b150PackagingNote')?.value||'',internal_note:$('b150InternalNote')?.value||'',buyer_subject:$('b150BuyerSubject')?.value||'',buyer_message:$('b150BuyerMessage')?.value||'',carrier:$('b150Carrier')?.value||'',tracking_number:$('b150Tracking')?.value||'',fulfillment_note:$('b150FulfillmentNote')?.value||'',saved_at:new Date().toISOString()};
    const ok=writeJson(DRAFT_KEY,all); if ($('b150DraftState')) $('b150DraftState').textContent=ok?`Saved locally ${new Date().toLocaleTimeString()}. Not sent to buyer.`:'Local draft could not be saved.';
  }

  function address(order) {
    if (lower(order.fulfillment_type)==='pickup') return 'Local pickup — use the verified pickup arrangement on file.';
    return [order.shipping_name,order.shipping_company,order.shipping_address1,order.shipping_address2,[order.shipping_city,order.shipping_province,order.shipping_postal_code].filter(Boolean).join(' '),order.shipping_country].filter(Boolean).map(esc).join('<br>')||'No shipping address recorded.';
  }

  function renderPrintSlip(order,items,draft) {
    // H2 is deliberate: the admin page keeps exactly one H1 even while print markup exists in the DOM.
    $('b150PrintSlip').innerHTML=`<h2>Devil n Dove — Packing Slip</h2><p><strong>Order:</strong> ${esc(order.order_number||order.order_id)}<br><strong>Buyer:</strong> ${esc(order.customer_name||'')}<br><strong>Fulfilment:</strong> ${esc(order.fulfillment_type||'')}</p><div>${address(order)}</div><h3>Items</h3><table><thead><tr><th>Item</th><th>SKU</th><th>Qty</th></tr></thead><tbody>${(items||[]).map((i)=>`<tr><td>${esc(i.product_name)}</td><td>${esc(i.sku||'')}</td><td>${Number(i.quantity||0)}</td></tr>`).join('')}</tbody></table>${draft.packaging_note?`<h3>Packaging note</h3><p>${esc(draft.packaging_note)}</p>`:''}<p>Printed ${esc(new Date().toLocaleString())}</p>`;
  }

  function trackingFromHistory(history) {
    const row=(history||[]).find((x)=>txt(x.note).includes('[Release 467 Build 150 tracking audit]'));
    return row?{note:txt(row.note),created_at:row.created_at}:null;
  }

  function renderDetail(detail) {
    const order=detail?.order||{}, items=detail?.items||[], history=detail?.status_history||[], wf=workflowFor(order.order_id), draft=draftFor(order.order_id,wf), tracking=trackingFromHistory(history), liveDisabled=!online()||state.stale, actions=Array.isArray(wf?.workflow_actions)?wf.workflow_actions:[];
    renderPrintSlip(order,items,draft);
    $('b150Detail').innerHTML=`
      <div class="b150-grid"><section class="b150-panel"><div class="b150-row"><div><h3>${esc(order.order_number||`Order #${order.order_id}`)}</h3><div>${esc(order.customer_name||'Customer')}</div><div class="small">${esc(order.customer_email||'')}</div></div><span class="b150-pill">${esc(wf?.workflow_stage_label||order.order_status||'pending')}</span></div><p class="small"><strong>Payment:</strong> ${esc(wf?.derived_payment_status||order.payment_status||'pending')} • <strong>Total:</strong> ${esc(money(order.total_cents,order.currency))}</p></section><section class="b150-panel"><h3>${lower(order.fulfillment_type)==='pickup'?'Pickup':'Shipping / handoff'}</h3><div class="small">${address(order)}</div>${tracking?`<p class="small"><strong>Latest tracking audit:</strong> ${esc(tracking.note)} • ${when(tracking.created_at)}</p>`:'<p class="small b150-muted">No Build 150 tracking audit recorded.</p>'}</section></div>
      <section class="b150-panel" style="margin-top:12px"><div class="b150-row"><h3>Line items</h3><button class="btn secondary" id="b150Print" type="button">Print packing slip</button></div><div class="b150-items">${items.length?items.map((i)=>`<div class="b150-item"><div class="b150-row"><strong>${esc(i.product_name)}</strong><span>${Number(i.quantity||0)} × ${esc(money(i.unit_price_cents,order.currency))}</span></div><div class="small b150-muted">${esc(i.sku||'No SKU')} • ${esc(i.product_type||'')}</div></div>`).join(''):'<p class="small">No line items were returned.</p>'}</div></section>
      <div class="b150-grid" style="margin-top:12px"><section class="b150-panel"><h3>Fulfilment actions</h3><p class="small">Uses the existing Operations-owned reviewed transition contract.</p><label class="small">Audit note<textarea class="b150-note" id="b150FulfillmentNote" rows="3">${esc(draft.fulfillment_note)}</textarea></label><div class="b150-actions" id="b150FulfillmentActions">${actions.length?actions.map((a)=>`<button class="btn b150-live-guard" type="button" data-fulfillment-status="${esc(a.new_status)}" data-note-required="${a.note_required?'1':'0'}" ${liveDisabled?'disabled':''}>${esc(a.label)}</button>`).join(''):'<span class="small">No reviewed next transition.</span>'}</div>${(wf?.blockers||[]).map((b)=>`<p class="small b150-danger">${esc(b)}</p>`).join('')}</section><section class="b150-panel"><h3>Tracking audit</h3><p class="small">Records the carrier/reference in the timeline only; no carrier call or buyer notification.</p><label class="small">Carrier<input id="b150Carrier" value="${esc(draft.carrier)}"></label><label class="small">Tracking / handoff reference<input id="b150Tracking" value="${esc(draft.tracking_number)}"></label><button class="btn b150-live-guard" id="b150RecordTracking" type="button" ${liveDisabled?'disabled':''}>Record live tracking audit</button></section></div>
      <div class="b150-grid" style="margin-top:12px"><section class="b150-panel"><h3>Packaging & internal notes</h3><div class="b150-drafts"><label class="small">Packaging note<textarea id="b150PackagingNote" rows="3">${esc(draft.packaging_note)}</textarea></label><label class="small">Internal note<textarea id="b150InternalNote" rows="3">${esc(draft.internal_note)}</textarea></label><button class="btn secondary" id="b150SaveDraft" type="button">Save local drafts</button><div id="b150DraftState" class="small">Local-only; not written to D1.</div></div></section><section class="b150-panel"><h3>Buyer message draft</h3><p class="small">Copy-only. Build 150 never sends automatically.</p><label class="small">Subject<input id="b150BuyerSubject" value="${esc(draft.buyer_subject)}"></label><label class="small">Message<textarea id="b150BuyerMessage" rows="5">${esc(draft.buyer_message)}</textarea></label><div class="b150-actions"><button class="btn secondary" id="b150CopyMessage" type="button">Copy message</button><a class="btn secondary" href="#ordersSection">Payment / refund details</a></div></section></div>
      <section class="b150-panel" style="margin-top:12px"><h3>Order timeline</h3><div class="b150-timeline">${history.length?history.map((h)=>`<div class="b150-event"><div class="b150-row"><strong>${esc(h.old_status||'—')} → ${esc(h.new_status||'—')}</strong><span class="small">${when(h.created_at)}</span></div><div class="small">${esc(h.note||'')}</div></div>`).join(''):'<p class="small">No status history returned.</p>'}</div></section>`;

    $('b150Print')?.addEventListener('click',()=>{ saveDraft(order.order_id); renderPrintSlip(order,items,draftFor(order.order_id,wf)); window.print(); });
    $('b150SaveDraft')?.addEventListener('click',()=>saveDraft(order.order_id));
    $('b150CopyMessage')?.addEventListener('click',async()=>{ const value=`${$('b150BuyerSubject')?.value||''}\n\n${$('b150BuyerMessage')?.value||''}`.trim(); try { await navigator.clipboard.writeText(value); message('Buyer message copied. Nothing was sent.'); } catch { message('Could not access the clipboard. Copy the draft manually.',true); } });
    $('b150RecordTracking')?.addEventListener('click',()=>recordTracking(order));
    $('b150FulfillmentActions')?.querySelectorAll('[data-fulfillment-status]').forEach((btn)=>btn.addEventListener('click',()=>advanceFulfillment(order,btn.dataset.fulfillmentStatus,btn.dataset.noteRequired==='1')));
  }

  async function selectOrder(id,force=false) {
    state.selected=Number(id||0); renderList(); if (!state.selected) return;
    if (!force && state.details[state.selected]) { renderDetail(state.details[state.selected]); return; }
    if (!online()||state.stale) { const cached=state.details[state.selected]; if (cached) renderDetail(cached); else $('b150Detail').innerHTML='<div class="b150-panel"><p class="small">Order detail is not cached. Reconnect to load it.</p></div>'; return; }
    try { const r=await apiFetch(`/api/admin/order-detail?order_id=${encodeURIComponent(state.selected)}`,{cache:'no-store'}); const d=await r.json(); if (!r.ok||!d?.ok) throw new Error(d?.error||`Order detail failed (${r.status}).`); state.details[state.selected]=d; saveSnapshot(); renderDetail(d); }
    catch (error) { const cached=state.details[state.selected]; if (cached) { state.stale=true; renderDetail(cached); message(`Live detail unavailable; showing cached detail. ${error.message||error}`,true); } else $('b150Detail').innerHTML=`<div class="b150-panel"><p class="small b150-danger">${esc(error.message||error)}</p></div>`; }
  }

  function renderPending() {
    const rows=pending();
    $('b150Pending').innerHTML=rows.length?`<div class="b150-offline"><strong>${rows.length} live action(s) awaiting confirmation.</strong> A response may have been lost after commit. <button class="btn secondary" id="b150RetryPending" type="button" ${online()?'':'disabled'}>Retry pending confirmation</button></div>`:'';
    $('b150RetryPending')?.addEventListener('click',retryPending);
  }

  async function postLiveAction(kind,route,body) {
    if (!online()||state.stale) throw new Error('Live authority is unavailable. Refresh after reconnecting first.');
    writeJson(PENDING_KEY,[...pending(),{kind,route,body,created_at:new Date().toISOString()}]); renderPending();
    try { const r=await apiFetch(route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); const d=await r.json().catch(()=>({})); if (!r.ok||!d?.ok) throw Object.assign(new Error(d?.error||`Live action failed (${r.status}).`),{confirmedFailure:r.status<500&&r.status!==408&&r.status!==429}); writeJson(PENDING_KEY,pending().filter((x)=>x.body?.client_action_id!==body.client_action_id)); renderPending(); return d; }
    catch (error) { if (error.confirmedFailure) { writeJson(PENDING_KEY,pending().filter((x)=>x.body?.client_action_id!==body.client_action_id)); renderPending(); } throw error; }
  }

  async function advanceFulfillment(order,newStatus,noteRequired) {
    const note=txt($('b150FulfillmentNote')?.value); if (noteRequired&&!note) { message('This fulfilment transition requires an audit note.',true); return; }
    if (!confirm(`Confirm live fulfilment change for ${order.order_number||order.order_id}: ${order.order_status} → ${newStatus}?`)) return;
    const client_action_id=actionId('fulfillment',order.order_id);
    try { const d=await postLiveAction('fulfillment','/api/admin/contracts/operations-order-fulfillment-workflow-write',{order_id:Number(order.order_id),new_status:newStatus,note,client_action_id}); message(d.idempotent_replay?'Previous fulfilment action confirmed safely after retry.':d.message||'Fulfilment updated.'); state.details={}; await loadLive(order.order_id); }
    catch (error) { message(`${error.message||error} If uncertain, use “Retry pending confirmation”; the same client_action_id prevents a duplicate write.`,true); }
  }

  async function recordTracking(order) {
    const carrier=txt($('b150Carrier')?.value), tracking_number=txt($('b150Tracking')?.value); if (!carrier||!tracking_number) { message('Carrier and tracking / handoff reference are required.',true); return; }
    if (!confirm(`Record this tracking audit for ${order.order_number||order.order_id}? This does not contact the carrier or buyer.`)) return;
    const client_action_id=actionId('tracking',order.order_id);
    try { const d=await postLiveAction('tracking','/api/admin/contracts/operations-order-tracking-audit-write',{order_id:Number(order.order_id),carrier,tracking_number,note:txt($('b150InternalNote')?.value),expected_order_status:lower(order.order_status||'pending'),client_action_id}); message(d.idempotent_replay?'Previous tracking audit confirmed safely after retry.':d.message||'Tracking audit recorded.'); state.details={}; await loadLive(order.order_id); }
    catch (error) { message(`${error.message||error} If uncertain, retry the pending confirmation instead of creating a new action.`,true); }
  }

  async function retryPending() {
    const rows=pending(); if (!online()||!rows.length) return; if (!confirm(`Retry ${rows.length} pending live action(s) with the same client_action_id values?`)) return;
    for (const action of rows) { try { const r=await apiFetch(action.route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action.body)}); const d=await r.json().catch(()=>({})); if ((r.ok&&d?.ok)||(r.status<500&&r.status!==408&&r.status!==429)) writeJson(PENDING_KEY,pending().filter((x)=>x.body?.client_action_id!==action.body?.client_action_id)); } catch { /* preserve uncertain action */ } }
    renderPending(); state.details={}; await loadLive(state.selected||0);
  }

  async function loadLive(reselect=0) {
    if (!online()) return loadSnapshot('Offline — showing the last saved Orders snapshot. Live fulfilment and tracking controls are disabled.');
    message('Loading live Orders workspace…');
    try {
      const [ordersResponse,workflowResponse]=await Promise.all([apiFetch('/api/admin/orders?limit=80',{cache:'no-store'}),apiFetch('/api/admin/order-fulfillment-workflow?limit=120',{cache:'no-store'})]);
      const ordersData=await ordersResponse.json(); if (!ordersResponse.ok||!ordersData?.ok) throw new Error(ordersData?.error||`Orders failed (${ordersResponse.status}).`);
      const workflowData=await workflowResponse.json().catch(()=>({}));
      state.orders=Array.isArray(ordersData.orders)?ordersData.orders:[]; state.workflow=new Map((workflowResponse.ok&&Array.isArray(workflowData?.workflow?.orders)?workflowData.workflow.orders:[]).map((x)=>[Number(x.order_id),x])); state.stale=false; saveSnapshot(); renderList(); renderPending(); message(ordersData.warning||`Live Orders workspace loaded • ${state.orders.length} orders.`);
      const target=Number(reselect||state.selected||state.orders[0]?.order_id||0); if (target) await selectOrder(target,true);
    } catch (error) { loadSnapshot(`Live Orders unavailable — cached snapshot shown. ${error.message||error}`); }
  }

  function loadSnapshot(reason) {
    const snap=readJson(SNAPSHOT_KEY,null); state.stale=true;
    if (!snap?.orders) { state.orders=[]; state.workflow=new Map(); renderList(); renderPending(); message(`${reason} No saved snapshot is available.`,true); return; }
    state.orders=Array.isArray(snap.orders)?snap.orders.slice(0,80):[]; state.workflow=new Map((snap.workflows||[]).map((x)=>[Number(x.order_id),x])); state.details=snap.details||{}; renderList(); renderPending(); message(`${reason} Snapshot saved ${when(snap.saved_at)}.`,true); const target=Number(state.selected||state.orders[0]?.order_id||0); if (target) selectOrder(target);
  }

  $('b150Search').addEventListener('input',(e)=>{state.query=e.target.value;renderList();});
  $('b150Status').addEventListener('change',(e)=>{state.status=e.target.value;renderList();});
  $('b150Fulfillment').addEventListener('change',(e)=>{state.fulfillment=e.target.value;renderList();});
  $('b150Payment').addEventListener('change',(e)=>{state.payment=e.target.value;renderList();});
  $('b150Refresh').addEventListener('click',()=>loadLive(state.selected));
  window.addEventListener('online',()=>{message('Connection restored. Refresh live Orders before making changes.');renderPending();});
  window.addEventListener('offline',()=>{state.stale=true;message('Offline — local drafts remain available; live fulfilment/tracking actions are disabled.',true);if(state.selected&&state.details[state.selected])renderDetail(state.details[state.selected]);});

  renderPending();
  void loadLive();
});
