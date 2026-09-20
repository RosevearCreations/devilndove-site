// Release 467 Build 206 — Launch-Set Remediation Campaign.
document.addEventListener('DOMContentLoaded',()=>{
  const mount=document.getElementById('storefrontLaunchRemediationMount'); if(!mount)return;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
  const apiFetch=(...a)=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(...a):fetch(...a);
  let campaign=null;
  function statusPill(v){return `<span class="launch-remediation-status is-${esc(v)}">${esc(String(v||'unreviewed').replaceAll('_',' '))}</span>`;}
  function render(){
    if(!campaign)return;
    const b=campaign.baseline||{},c=campaign.current||{},m=campaign.movement||{},s=campaign.campaign_status||{},k=campaign.blocker_buckets||{};
    const cards=(campaign.products||[]).filter(p=>(p.blockers||[]).length).map(p=>`<article class="launch-remediation-product card">
      <div class="launch-remediation-product-head"><div><strong>${esc(p.name||`Product ${p.product_id}`)}</strong><div class="small">#${esc(p.product_id)} • ${esc(p.sku||'No SKU')} • ${esc(p.status)}</div></div><span class="status-pill">${esc((p.blockers||[]).length)} blocker(s)</span></div>
      <div class="launch-remediation-list">${(p.blockers||[]).map(r=>{
        const x=r.remediation||{}, owner=x.owner||r.suggested_owner||'';
        return `<div class="launch-remediation-row" data-product="${p.product_id}" data-code="${esc(r.code)}" data-area="${esc(r.area)}" data-label="${esc(r.label)}" data-token="${esc(p.evidence_token||'')}">
          <div class="launch-remediation-reason"><div><strong>${esc(r.label)}</strong> ${statusPill(r.reviewed?x.status:'unreviewed')}</div><div class="small">${esc(r.area)} • <code>${esc(r.code)}</code></div></div>
          <div class="launch-remediation-fields">
            <label><span class="small">Reviewed owner</span><input class="input" data-field="owner" value="${esc(owner)}" placeholder="${esc(r.suggested_owner||'Owner')}"></label>
            <label><span class="small">Status</span><select class="input" data-field="status">${['open','in_progress','blocked','resolved'].map(v=>`<option value="${v}" ${x.status===v?'selected':''}>${v.replaceAll('_',' ')}</option>`).join('')}</select></label>
            <label><span class="small">Due note</span><input class="input" data-field="due_note" value="${esc(x.due_note||'')}" placeholder="Date, dependency or next review"></label>
            <label class="wide"><span class="small">Notes</span><input class="input" data-field="notes" value="${esc(x.notes||'')}" placeholder="What remains to be done?"></label>
            <label class="wide"><span class="small">Completion evidence</span><input class="input" data-field="completion_evidence" value="${esc(x.completion_evidence||'')}" placeholder="Filled by official recheck when cleared; may be expanded"></label>
          </div>
          <div class="launch-remediation-actions">
            <a class="btn secondary" href="${esc(r.repair_href)}">Open owner workspace</a>
            <button class="btn secondary" type="button" data-recheck>Recheck official evidence</button>
            <button class="btn" type="button" data-save>Save campaign review</button>
            <span class="small" data-result>${x.last_recheck_result&&x.last_recheck_result!=='not_checked'?`Last recheck: ${esc(x.last_recheck_result)}`:'Not rechecked yet.'}</span>
          </div>
        </div>`;
      }).join('')}</div></article>`).join('');
    mount.innerHTML=`<section class="card launch-remediation-shell">
      <div class="section-heading-row"><div><p class="eyebrow">Build 206 • Launch-Set Remediation Campaign</p><h2>Owned launch blocker campaign</h2><p class="small">Uses the Build 204 readiness engine directly. We review owner/status/due notes here; Product facts still change only in Product Editor, Product Media or Inventory Operations.</p></div><button class="btn secondary" id="launchRemediationRefresh" type="button">Refresh campaign</button></div>
      <div class="launch-remediation-progress">
        <div><span>Build 204 baseline</span><strong>${esc(b.ready)} ready / ${esc(b.review_required)} review</strong></div>
        <div><span>Current live evidence</span><strong>${esc(c.ready)} ready / ${esc(c.review_required)} review</strong></div>
        <div><span>Movement</span><strong>${Number(m.ready_delta||0)>=0?'+':''}${esc(m.ready_delta||0)} ready</strong></div>
        <div><span>Campaign review</span><strong>${esc((s.open||0)+(s.in_progress||0)+(s.blocked||0)+(s.resolved||0))} reviewed / ${esc(s.unreviewed||0)} unreviewed blockers</strong></div>
      </div>
      <div class="launch-remediation-buckets small"><strong>Live blocker separation:</strong> Buyer ${esc(k.buyer||0)} • Media ${esc(k.media||0)} • Stock ${esc(k.stock||0)} • Linked cost ${esc(k.linked_cost||0)} • Publication ${esc(k.publication||0)} • Inventory link ${esc(k.inventory_link||0)} • Commerce ${esc(k.commerce||0)}.</div>
      <p class="small">“Ready” remains evidence-only. Nothing on this screen publishes/unpublishes Products, edits price/stock/media, moves Inventory, touches R2, or executes payments/providers.</p>
    </section><div class="launch-remediation-products">${cards||'<section class="card"><p>No live launch blockers are present in the current projection.</p></section>'}</div>`;
    mount.querySelector('#launchRemediationRefresh')?.addEventListener('click',load);
    mount.querySelectorAll('[data-save]').forEach(btn=>btn.addEventListener('click',()=>save(btn.closest('.launch-remediation-row'),null)));
    mount.querySelectorAll('[data-recheck]').forEach(btn=>btn.addEventListener('click',()=>recheck(btn.closest('.launch-remediation-row'))));
  }
  function payload(row,recheck){
    const val=(name)=>row.querySelector(`[data-field="${name}"]`)?.value||'';
    return {
      product_id:Number(row.dataset.product),blocker_code:row.dataset.code,blocker_area:row.dataset.area,blocker_label:row.dataset.label,
      owner:val('owner'),status:val('status'),due_note:val('due_note'),notes:val('notes'),
      baseline_evidence_token:row.dataset.token,last_recheck_evidence_token:recheck?.token||'',
      last_recheck_result:recheck?.result||'not_checked',completion_evidence:val('completion_evidence')
    };
  }
  async function save(row,recheck){
    const out=row.querySelector('[data-result]'); out.textContent='Saving campaign review…';
    try{
      const r=await apiFetch('/api/admin/storefront-launch-remediation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload(row,recheck))});
      const d=await r.json().catch(()=>({})); if(!r.ok||!d.ok)throw new Error(d.error||`Save failed (${r.status}).`);
      out.textContent='Saved. Refresh campaign to update totals.';
    }catch(e){out.textContent=e.message||String(e);}
  }
  async function recheck(row){
    const out=row.querySelector('[data-result]'); out.textContent='Rechecking through Build 204 authority…';
    const url=`/api/admin/storefront-launch-set?mode=product&product_id=${encodeURIComponent(row.dataset.product)}&expected_token=${encodeURIComponent(row.dataset.token||'')}`;
    try{
      const r=await apiFetch(url,{cache:'no-store'}),d=await r.json().catch(()=>({}));
      if(!r.ok||!d.ok)throw new Error(d.error||`Recheck failed (${r.status}).`);
      const stillOpen=(d.product?.all_reasons||[]).some(x=>String(x.code)===row.dataset.code);
      const result=d.stale_target?'stale':stillOpen?'open':'cleared';
      if(result==='cleared'){
        row.querySelector('[data-field="status"]').value='resolved';
        const evidence=row.querySelector('[data-field="completion_evidence"]');
        if(!evidence.value)evidence.value=`Official Build 204 recheck cleared ${row.dataset.code}; evidence token ${d.current_token||'unknown'}.`;
      }
      out.textContent=result==='cleared'?'Cleared by official evidence; saving resolution…':result==='stale'?'Evidence token changed; saving stale recheck for review…':'Blocker still present; saving recheck…';
      await save(row,{token:d.current_token||'',result});
    }catch(e){out.textContent=e.message||String(e);}
  }
  async function load(){
    mount.innerHTML='<section class="card"><p class="small">Loading one bounded Build 204 projection plus Build 206 campaign metadata…</p></section>';
    try{
      const r=await apiFetch('/api/admin/storefront-launch-remediation',{cache:'no-store'}),d=await r.json().catch(()=>({}));
      if(!r.ok||!d.ok)throw new Error(d.error||`Campaign load failed (${r.status}).`);
      campaign=d;render();
    }catch(e){mount.innerHTML=`<section class="card"><h2>Launch remediation unavailable</h2><p class="small">${esc(e.message||e)}</p><button class="btn" id="launchRemediationRetry">Retry</button></section>`;mount.querySelector('#launchRemediationRetry')?.addEventListener('click',load);}
  }
  mount.innerHTML='<section class="card"><div class="section-heading-row"><div><p class="eyebrow">Build 206</p><h2>Launch-Set Remediation Campaign</h2><p class="small">Explicit-only: no catalog read runs until we ask for the campaign.</p></div><button class="btn" id="launchRemediationLoad" type="button">Load remediation campaign</button></div></section>';
  mount.querySelector('#launchRemediationLoad')?.addEventListener('click',load);
});
