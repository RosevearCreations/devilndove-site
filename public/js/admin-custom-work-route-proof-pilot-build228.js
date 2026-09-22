// Release 467 Build 228 — read-only Custom Work route-to-proof pilot UI.
(function(){
  const ENDPOINT='/api/admin/custom-work-route-proof-pilot';
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function badge(v){return '<span class="small" style="display:inline-block;padding:3px 8px;border:1px solid currentColor;border-radius:999px">'+esc(String(v||'').replace(/_/g,' '))+'</span>';}
  function render(d){
    const m=document.getElementById('customWorkPilot228Mount');if(!m)return;
    const c=d.counts||{},r=d.pilot_candidate;
    m.innerHTML='<section class="card"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><p class="small" style="font-weight:800;margin:0">Release 467 Build 228</p><h2 style="margin:4px 0">Pilot state: '+esc(String(d.classification||'UNKNOWN').replace(/_/g,' '))+'</h2><p class="small">'+esc(d.exit_condition||'')+'</p></div><button class="btn" id="pilot228Refresh" type="button">Refresh evidence</button></div>'+
      (d.classification==='HOLD_NO_REAL_REQUEST'?'<div class="card" style="margin-top:14px"><strong>HOLD — no real request available.</strong><p class="small" style="margin-bottom:0">This is a valid Build 228 exit. We do not create fake customers, routes, quotes or proofs to manufacture pilot evidence.</p></div>':'')+
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:14px">'+
      ['active_custom_requests','reviewed_triage_requests','routed_requests','quoted_requests','proofed_requests','customer_approved_requests'].map(k=>'<div class="card" style="margin:0"><div class="small">'+esc(k.replace(/_/g,' '))+'</div><strong style="font-size:1.4rem">'+Number(c[k]||0).toLocaleString('en-CA')+'</strong></div>').join('')+'</div></section>'+
      '<section class="card" style="margin-top:18px"><h2 style="margin-top:0">Route-to-proof path</h2>'+
      (r?'<div class="card" style="margin:0 0 12px"><strong>'+esc(r.name||r.request_key||('Request #'+r.custom_request_id))+'</strong><div class="small">'+badge(r.pilot_state)+' • next: '+esc(r.next_action?.label||'Continue reviewed workflow')+'</div></div>'+
        '<div style="display:grid;gap:10px">'+(r.steps||[]).map((s,i)=>'<div class="card" style="margin:0;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><strong>'+(i+1)+'. '+esc(s.label)+'</strong><div class="small">Build '+esc(s.build)+' • '+badge(s.state)+'</div></div><a class="btn" href="'+esc(s.href)+'">Open owner surface</a></div>').join('')+'</div>'
        :'<p class="small">No active Custom Request exists. The software path is ready and stays empty until a legitimate request is entered by an operator.</p><a class="btn primary" href="/admin/custom-request/">Open Custom Work Intake</a>')+
      '</section>'+
      '<section class="card" style="margin-top:18px"><h2 style="margin-top:0">Safety boundary</h2><p class="small" style="margin-bottom:0">Build 228 is GET-only. It cannot create or modify Custom Requests, triage, routes, quotes, proofs, approvals, Inventory, Finance, publications, provider actions or Production business data.</p></section>';
    document.getElementById('pilot228Refresh')?.addEventListener('click',load);
  }
  async function load(){
    const m=document.getElementById('customWorkPilot228Mount');if(!m||!window.DDAuth?.apiFetch)return;
    m.innerHTML='<section class="card"><p class="small">Reading route-to-proof pilot evidence…</p></section>';
    try{
      const r=await window.DDAuth.apiFetch(ENDPOINT,{headers:{Accept:'application/json'},cache:'no-store'});
      const d=await r.json().catch(()=>null);if(!r.ok||!d?.ok)throw new Error(d?.error||('Pilot read failed ('+r.status+').'));
      render(d);
    }catch(e){m.innerHTML='<section class="card"><h2>Pilot evidence unavailable</h2><p class="small">'+esc(e.message||'Read failed.')+'</p><p class="small">No business record was changed.</p><button class="btn" id="pilot228Retry" type="button">Retry</button></section>';document.getElementById('pilot228Retry')?.addEventListener('click',load);}
  }
  document.addEventListener('DOMContentLoaded',load);
})();
