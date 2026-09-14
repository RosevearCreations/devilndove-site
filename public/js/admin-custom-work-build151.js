// Release 467 Build 151 — seller Custom Work command surface.
// Read-only convergence over existing Operations authorities. No automatic write/polling/provider action.
(function () {
  const ENDPOINT = '/api/admin/contracts/operations-custom-work-build151-read';
  const esc = (v) => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const money = (c) => { try { return new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(c||0)/100); } catch { return `$${(Number(c||0)/100).toFixed(2)}`; } };
  const compact = (v,n=220) => { const s=String(v||'').trim(); return s.length>n ? `${s.slice(0,n-1)}…` : s; };
  let data = null;

  function contextFromMessage(message) {
    const text = String(message || '');
    const marker = '[Build 151 gift/pickup/event context]';
    const at = text.indexOf(marker);
    return at >= 0 ? text.slice(at + marker.length).trim() : '';
  }

  function render() {
    const mount = document.getElementById('customWorkBuild151Mount');
    if (!mount) return;
    if (!data) { mount.innerHTML = '<section class="card custom-work-b151"><p class="small">Loading Build 151 Custom Work authority…</p></section>'; return; }
    const work = Array.isArray(data.custom_work) ? data.custom_work : [];
    const pickup = Array.isArray(data.pickup_orders) ? data.pickup_orders : [];
    const open = work.filter((x) => !['declined','archived'].includes(String(x.status||'').toLowerCase()));
    const due = open.filter((x) => x.deadline_date).length;
    const quoteNeeded = open.filter((x) => ['new','reviewing','quote_needed'].includes(String(x.status||'').toLowerCase())).length;
    const refs = open.reduce((sum,x)=>sum+Number(x.reference_upload_count||0),0);
    const offline = navigator.onLine === false;
    mount.innerHTML = `
      <section class="card custom-work-b151" aria-labelledby="customWork151Heading">
        <div class="custom-work-b151__head"><div><p class="small" style="font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin:0">Release 467 Build 151</p><h2 id="customWork151Heading" style="margin:4px 0">Custom Work, gifting, pickup & event selling</h2><p class="small" style="margin:0">One read-only command view over the existing Custom Requests, Orders and Gift Card authorities.</p></div><button class="btn" id="customWork151Refresh" type="button">Refresh live view</button></div>
        <div class="small custom-work-b151__safety"><strong>Live-authority safety:</strong> ${offline ? '<span class="custom-work-b151__offline">Offline — cached/browser context is not stock authority.</span>' : 'Online.'} Event or market conversations never reserve unique stock offline. Availability must be revalidated live before a sale, reservation, fulfillment change or gift-card action.</div>
        <div class="custom-work-b151__stats"><div class="custom-work-b151__stat"><span class="small">Open custom work</span><strong>${open.length}</strong></div><div class="custom-work-b151__stat"><span class="small">Needs review / quote</span><strong>${quoteNeeded}</strong></div><div class="custom-work-b151__stat"><span class="small">Requested-by dates</span><strong>${due}</strong></div><div class="custom-work-b151__stat"><span class="small">Private reference images</span><strong>${refs}</strong></div></div>
        <div class="custom-work-b151__grid"><div><h3 style="margin-top:0">Custom Work queue</h3><div class="custom-work-b151__list">${open.length ? open.slice(0,30).map((x)=>{
          const ctx=contextFromMessage(x.message); const q=x.latest_quote||{}; const p=x.latest_payment_request||{}; const o=x.latest_order_draft||{};
          return `<article class="custom-work-b151__item"><div class="custom-work-b151__item-head"><div><strong>${esc(x.name||'Customer')} — ${esc(x.product_interest||x.request_type||'Custom request')}</strong><div class="small">${esc(x.email||'')} ${x.deadline_date?`• requested by ${esc(x.deadline_date)}`:''}</div></div><span class="custom-work-b151__pill">${esc(x.status||'new')}</span></div><div class="custom-work-b151__meta"><span class="custom-work-b151__pill">Quote: ${esc(q.quote_status||'not started')}</span><span class="custom-work-b151__pill">Quote total: ${money(q.quote_total_cents||0)}</span><span class="custom-work-b151__pill">Deposit/payment: ${esc(p.payment_request_status||'not started')}</span><span class="custom-work-b151__pill">Order: ${esc(o.order_draft_status||'not started')}</span><span class="custom-work-b151__pill">Refs: ${Number(x.reference_upload_count||0)}</span></div>${ctx?`<div class="small custom-work-b151__context"><strong>Gift / pickup / event context:</strong> ${esc(compact(ctx,420))}</div>`:`<div class="small custom-work-b151__context">${esc(compact(x.message,260))}</div>`}</article>`;
        }).join(''):'<p class="small">No open custom-work requests in this live read.</p>'}</div></div>
        <aside><h3 style="margin-top:0">Pickup & gift-card handoff</h3><div class="custom-work-b151__list">${pickup.length?pickup.slice(0,12).map((o)=>`<article class="custom-work-b151__item"><strong>${esc(o.order_number||`Order ${o.order_id}`)}</strong><div class="small">${esc(o.customer_name||o.customer_email||'Customer')} • ${esc(o.order_status||'pending')} • ${esc(o.payment_status||'pending')} • ${money(o.total_cents||0)}</div></article>`).join(''):'<p class="small">No active local-pickup orders.</p>'}<article class="custom-work-b151__item"><strong>Gift cards</strong><div class="small">Active ${Number(data.gift_cards?.active||0)} • pending activation ${Number(data.gift_cards?.pending_activation||0)} • 30-day redemptions ${Number(data.gift_cards?.recent_redemptions||0)}</div></article></div><div class="custom-work-b151__links" style="margin-top:10px"><a class="btn" href="/admin/gift-cards/">Gift cards</a><a class="btn" href="/admin/orders/">Orders</a><a class="btn" href="/events/">Events</a><a class="btn" href="/pickup/">Pickup guide</a></div></aside></div>
        <div class="small">Schema ready: <strong>${data.schema_ready?'yes':'no'}</strong>${data.missing_tables?.length?` • missing: ${esc(data.missing_tables.join(', '))}`:''} • request-time schema mutation: no • provider execution: no.</div>
      </section>`;
    document.getElementById('customWork151Refresh')?.addEventListener('click', load);
  }

  async function load() {
    const mount=document.getElementById('customWorkBuild151Mount'); if (!mount || !window.DDAuth?.apiFetch) return;
    mount.innerHTML='<section class="card custom-work-b151"><p class="small">Refreshing live Custom Work authority…</p></section>';
    try { const r=await window.DDAuth.apiFetch(ENDPOINT,{headers:{Accept:'application/json'}}); const d=await r.json().catch(()=>null); if(!r.ok||!d?.ok) throw new Error(d?.error||`Custom Work read failed (${r.status}).`); data=d; render(); }
    catch(error){ mount.innerHTML=`<section class="card custom-work-b151"><h2 style="margin-top:0">Custom Work view unavailable</h2><p class="small">${esc(error.message||'Read failed.')}</p><p class="small">No write, stock reservation, gift-card action or provider action was attempted.</p><button class="btn" id="customWork151Retry" type="button">Retry</button></section>`; document.getElementById('customWork151Retry')?.addEventListener('click',load); }
  }

  document.addEventListener('DOMContentLoaded', load);
  window.addEventListener('online', () => { if (data) render(); });
  window.addEventListener('offline', () => { if (data) render(); });
})();
