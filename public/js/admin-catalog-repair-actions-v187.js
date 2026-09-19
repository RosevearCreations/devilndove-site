// Release 467 Build 187 — explicit one-record Catalog Health repair recheck UI.
(()=>{
  'use strict';
  const mount=document.getElementById('catalogRepairActionEvidence');
  const results=document.getElementById('catalogHealthResults');
  if(!mount||!results)return;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let inFlight=false;
  async function recheck(button){
    if(inFlight)return;
    const scope=String(button.dataset.catalogRecheck||'');
    const id=Number(button.dataset.targetId||0);
    const expected=String(button.dataset.expectedUpdatedAt||'');
    if(!['product','inventory'].includes(scope)||!Number.isInteger(id)||id<=0)return;
    inFlight=true;button.disabled=true;mount.textContent='Rechecking one live D1 target…';
    try{
      const params=new URLSearchParams({mode:scope==='product'?'repair_product':'repair_inventory',expected_updated_at:expected});
      params.set(scope==='product'?'product_id':'inventory_id',String(id));
      const res=await window.DDAuth.apiFetch('/api/admin/catalog-health?'+params.toString(),{cache:'no-store'});
      const raw=await res.text().catch(()=>''),data=raw?JSON.parse(raw):null;
      if(!res.ok||!data?.ok)throw new Error(data?.error||data?.detail||('Repair recheck failed ('+res.status+').'));
      const e=data.evidence||{},actions=Array.isArray(e.repair_actions)?e.repair_actions:[];
      mount.innerHTML=`<div class="catalog-health-actions"><strong>${esc(e.target_name||('Target #'+id))}</strong><span class="small">${e.stale_target?'Stale evidence detected — reopen the owning editor before relying on the prior snapshot.':'Current target matches the recorded timestamp.'}</span>${actions.map(a=>`<a class="btn" href="${esc(a.href||'#')}" title="${esc(a.note||'')}">${esc(a.owner||'Open owner')}</a>`).join('')}</div><pre class="small" style="white-space:pre-wrap;overflow:auto">${esc(JSON.stringify({stale_target:e.stale_target,safe_to_apply:e.safe_to_apply,expected_updated_at:e.expected_updated_at,current_updated_at:e.current_updated_at,snapshot:e.snapshot},null,2))}</pre>`;
      button.dataset.expectedUpdatedAt=String(e.current_updated_at||'');
    }catch(error){mount.textContent=error?.message||'Repair recheck failed.';}
    finally{button.disabled=false;inFlight=false;}
  }
  results.addEventListener('click',(event)=>{
    const button=event.target.closest('[data-catalog-recheck]');
    if(button){event.preventDefault();recheck(button);}
  });
})();
