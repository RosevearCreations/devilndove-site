// Release 467 Build 225 — Storefront Launch-Set Remediation Execution II.
// Prioritized operator execution over the existing Build 204 launch-set and Build 206 campaign metadata authorities.
// No Product, Inventory, media, cost, publication, R2, payment, provider or accounting mutation is introduced here.
document.addEventListener('DOMContentLoaded',()=>{
  const mount=document.getElementById('storefrontLaunchRemediationMount'); if(!mount)return;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
  const apiFetch=(...a)=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(...a):fetch(...a);
  const STAGES=[
    {id:1,key:'buyer',title:'Buyer-required facts',help:'Fix buyer/publication/commerce facts in Product Editor first.'},
    {id:2,key:'media',title:'Approved media readiness',help:'Complete featured image, gallery depth, alt text, image roles and canonical media review.'},
    {id:3,key:'stock',title:'Tracked-stock review',help:'Review zero tracked finished stock deliberately in the owning Product/Inventory workflow.'},
    {id:4,key:'cost',title:'Linked-resource & cost evidence',help:'Resolve Inventory links and unknown required resource cost without inventing cost.'},
    {id:5,key:'final',title:'Final buyer-readiness review',help:'Run the official one-Product launch-set recheck only after live blockers are cleared.'}
  ];
  let campaign=null;
  const stageOf=(r)=>{
    const area=String(r?.area||'').toLowerCase(),code=String(r?.code||'').toLowerCase();
    if(area==='buyer'||area==='publication'||area==='commerce')return 1;
    if(area==='media')return 2;
    if(code==='tracked_finished_stock_zero')return 3;
    if(area==='cost'||area==='inventory'||code.includes('linked_'))return 4;
    return 1;
  };
  const statusPill=(v)=>`<span class="launch225-status is-${esc(v||'unreviewed')}">${esc(String(v||'unreviewed').replaceAll('_',' '))}</span>`;
  const field=(row,name)=>row.querySelector(`[data-field="${name}"]`)?.value||'';
  const productById=(id)=>(campaign?.products||[]).find(p=>Number(p.product_id)===Number(id));
  function flatRows(){
    const rows=[];
    for(const p of campaign?.products||[]) for(const r of p.blockers||[]) rows.push({product:p,reason:r,stage:stageOf(r)});
    return rows.sort((a,b)=>a.stage-b.stage||String(a.product.name||'').localeCompare(String(b.product.name||''))||Number(a.product.product_id)-Number(b.product.product_id));
  }
  function productCounts(){
    const products=campaign?.products||[];
    return {
      buyer:products.filter(p=>(p.blockers||[]).some(r=>stageOf(r)===1)).length,
      media:products.filter(p=>!p.media?.ready).length,
      stock:products.filter(p=>(p.blockers||[]).some(r=>stageOf(r)===3)).length,
      cost:products.filter(p=>(p.blockers||[]).some(r=>stageOf(r)===4)).length,
      ready:products.filter(p=>(p.blockers||[]).length===0&&p.status==='ready').length
    };
  }
  function rowHtml(item){
    const p=item.product,r=item.reason,x=r.remediation||{},owner=x.owner||r.suggested_owner||'';
    const returned=x.status==='resolved';
    return `<article class="launch225-row ${returned?'is-returned':''}" data-product="${Number(p.product_id)}" data-code="${esc(r.code)}" data-area="${esc(r.area)}" data-label="${esc(r.label)}" data-token="${esc(p.evidence_token||'')}">
      <div class="launch225-row-head"><div><strong>${esc(p.name||`Product ${p.product_id}`)}</strong><div class="small">#${esc(p.product_id)} • ${esc(p.sku||'No SKU')} • ${esc(r.label)}</div><div class="small">${esc(r.area)} • <code>${esc(r.code)}</code></div></div>${statusPill(r.reviewed?x.status:'unreviewed')}</div>
      ${returned?'<p class="launch225-warning small">This blocker is live again even though its saved campaign status was resolved. Recheck before relying on the old resolution.</p>':''}
      <div class="launch225-fields">
        <label><span class="small">Reviewed owner</span><input class="input" data-field="owner" value="${esc(owner)}" placeholder="${esc(r.suggested_owner||'Owner')}"></label>
        <label><span class="small">Status</span><select class="input" data-field="status">${['open','in_progress','blocked','resolved'].map(v=>`<option value="${v}" ${x.status===v?'selected':''}>${v.replaceAll('_',' ')}</option>`).join('')}</select></label>
        <label><span class="small">Due / dependency</span><input class="input" data-field="due_note" value="${esc(x.due_note||'')}" placeholder="Date, dependency or next review"></label>
        <label class="wide"><span class="small">Notes</span><input class="input" data-field="notes" value="${esc(x.notes||'')}" placeholder="What remains to be done?"></label>
        <label class="wide"><span class="small">Completion evidence</span><input class="input" data-field="completion_evidence" value="${esc(x.completion_evidence||'')}" placeholder="Official cleared recheck evidence"></label>
      </div>
      <div class="launch225-actions">
        <a class="btn secondary" href="${esc(r.repair_href||'#')}">Open owning workspace</a>
        <button class="btn secondary" type="button" data-recheck>Recheck official evidence</button>
        <button class="btn" type="button" data-save>Save campaign review</button>
        <span class="small" data-result>${x.last_recheck_result&&x.last_recheck_result!=='not_checked'?`Last recheck: ${esc(x.last_recheck_result)}`:'Not rechecked yet.'}</span>
      </div>
    </article>`;
  }
  function stageHtml(stage,rows){
    const items=rows.filter(x=>x.stage===stage.id);
    const eligible=stage.id===5?(campaign?.products||[]).filter(p=>(p.blockers||[]).length===0&&p.status==='ready'):[];
    if(stage.id===5){
      return `<section class="card launch225-stage" data-stage="${stage.id}"><div class="launch225-stage-head"><div><p class="eyebrow">Priority ${stage.id}</p><h3>${esc(stage.title)}</h3><p class="small">${esc(stage.help)}</p></div><span class="status-pill">${eligible.length} eligible</span></div>
        <div class="launch225-final-list">${eligible.length?eligible.map(p=>`<div class="launch225-final-row" data-final-product="${Number(p.product_id)}" data-final-token="${esc(p.evidence_token||'')}"><div><strong>${esc(p.name||`Product ${p.product_id}`)}</strong><div class="small">#${esc(p.product_id)} • ${esc(p.sku||'No SKU')} • current projection: ready</div></div><button class="btn secondary" type="button" data-final-recheck>Run final official recheck</button><span class="small" data-final-result>Not rechecked in this session.</span></div>`).join(''):'<p class="small">No Product is eligible for final review until its earlier-stage blockers are cleared.</p>'}</div>
      </section>`;
    }
    return `<section class="card launch225-stage" data-stage="${stage.id}"><div class="launch225-stage-head"><div><p class="eyebrow">Priority ${stage.id}</p><h3>${esc(stage.title)}</h3><p class="small">${esc(stage.help)}</p></div><span class="status-pill">${items.length} blocker(s)</span></div><div class="launch225-stage-list">${items.length?items.map(rowHtml).join(''):'<p class="small">No live blocker remains in this priority stage.</p>'}</div></section>`;
  }
  function payload(row,recheck){
    return {
      product_id:Number(row.dataset.product),blocker_code:row.dataset.code,blocker_area:row.dataset.area,blocker_label:row.dataset.label,
      owner:field(row,'owner'),status:field(row,'status'),due_note:field(row,'due_note'),notes:field(row,'notes'),
      baseline_evidence_token:row.dataset.token,last_recheck_evidence_token:recheck?.token||'',
      last_recheck_result:recheck?.result||'not_checked',completion_evidence:field(row,'completion_evidence')
    };
  }
  async function save(row,recheck){
    const out=row.querySelector('[data-result]'); out.textContent='Saving campaign review…';
    try{
      const r=await apiFetch('/api/admin/storefront-launch-remediation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload(row,recheck))});
      const d=await r.json().catch(()=>({})); if(!r.ok||!d.ok)throw new Error(d.error||`Save failed (${r.status}).`);
      out.textContent='Saved. Refresh execution queue to update totals.';
    }catch(e){out.textContent=e.message||String(e);}
  }
  async function recheck(row){
    const out=row.querySelector('[data-result]'); out.textContent='Rechecking through the existing launch-set authority…';
    const url=`/api/admin/storefront-launch-set?mode=product&product_id=${encodeURIComponent(row.dataset.product)}&expected_token=${encodeURIComponent(row.dataset.token||'')}`;
    try{
      const r=await apiFetch(url,{cache:'no-store'}),d=await r.json().catch(()=>({}));
      if(!r.ok||!d.ok)throw new Error(d.error||`Recheck failed (${r.status}).`);
      const stillOpen=(d.product?.all_reasons||[]).some(x=>String(x.code)===row.dataset.code);
      const result=d.stale_target?'stale':stillOpen?'open':'cleared';
      if(result==='cleared'){
        row.querySelector('[data-field="status"]').value='resolved';
        const evidence=row.querySelector('[data-field="completion_evidence"]');
        if(!evidence.value)evidence.value=`Official launch-set recheck cleared ${row.dataset.code}; evidence token ${d.current_token||'unknown'}.`;
      }else if(result==='open'&&row.querySelector('[data-field="status"]').value==='resolved'){
        row.querySelector('[data-field="status"]').value='in_progress';
      }
      out.textContent=result==='cleared'?'Cleared by official evidence; saving resolution…':result==='stale'?'Evidence changed; saving stale recheck for review…':'Blocker remains; saving current evidence…';
      await save(row,{token:d.current_token||'',result});
    }catch(e){out.textContent=e.message||String(e);}
  }
  async function finalRecheck(row){
    const id=Number(row.dataset.finalProduct),out=row.querySelector('[data-final-result]');
    out.textContent='Running final one-Product readiness recheck…';
    const url=`/api/admin/storefront-launch-set?mode=product&product_id=${encodeURIComponent(id)}&expected_token=${encodeURIComponent(row.dataset.finalToken||'')}`;
    try{
      const r=await apiFetch(url,{cache:'no-store'}),d=await r.json().catch(()=>({}));
      if(!r.ok||!d.ok)throw new Error(d.error||`Final recheck failed (${r.status}).`);
      if(d.stale_target){out.textContent='Evidence changed since queue load. Refresh before final review.';return;}
      const reasons=d.product?.all_reasons||[];
      out.textContent=d.product?.status==='ready'&&reasons.length===0?'GREEN in the official current launch-set projection.':'Not ready: '+reasons.map(x=>x.label).join(' • ');
    }catch(e){out.textContent=e.message||String(e);}
  }
  function render(){
    const b=campaign?.baseline||{},c=campaign?.current||{},m=campaign?.movement||{},s=campaign?.campaign_status||{},pc=productCounts(),rows=flatRows();
    mount.innerHTML=`<section class="card launch225-shell">
      <div class="section-heading-row"><div><p class="eyebrow">Build 225 • Storefront Launch-Set Remediation Execution II</p><h2>Prioritized launch remediation execution</h2><p class="small">One bounded queue over the existing Product Editor, Product Media, Inventory and Build 206 campaign authorities. The queue orders work; it does not change Product facts itself.</p></div><div class="launch225-top-actions"><button class="btn" id="launch225Next" type="button">Open next priority</button><button class="btn secondary" id="launch225Refresh" type="button">Refresh execution queue</button></div></div>
      <div class="launch225-progress">
        <div><span>Build 204 baseline</span><strong>${esc(b.ready)} ready / ${esc(b.review_required)} review</strong></div>
        <div><span>Current evidence</span><strong>${esc(c.ready)} ready / ${esc(c.review_required)} review</strong></div>
        <div><span>Movement</span><strong>${Number(m.ready_delta||0)>=0?'+':''}${esc(m.ready_delta||0)} ready / ${Number(m.review_required_delta||0)>=0?'+':''}${esc(m.review_required_delta||0)} review</strong></div>
        <div><span>Campaign review</span><strong>${esc((s.open||0)+(s.in_progress||0)+(s.blocked||0)+(s.resolved||0))} reviewed / ${esc(s.unreviewed||0)} unreviewed blockers</strong></div>
      </div>
      <div class="launch225-measured-grid small"><div><strong>Buyer-blocked Products</strong><span>${pc.buyer}</span></div><div><strong>Media-blocked Products</strong><span>${pc.media}</span></div><div><strong>Tracked zero-stock</strong><span>${pc.stock}</span></div><div><strong>Linked-resource / cost</strong><span>${pc.cost}</span></div><div><strong>Final-review eligible</strong><span>${pc.ready}</span></div></div>
      <p class="small launch225-boundary">No automatic publication/unpublication, price rewrite, stock edit, media edit, cost invention, R2 mutation, payment/refund, provider execution or accounting posting. Unknown cost remains unknown until reviewed in its owning Inventory workflow.</p>
    </section>
    <div class="launch225-stages">${STAGES.map(stage=>stageHtml(stage,rows)).join('')}</div>`;
    mount.querySelector('#launch225Refresh')?.addEventListener('click',load);
    mount.querySelector('#launch225Next')?.addEventListener('click',()=>{
      const next=mount.querySelector('.launch225-stage-list .launch225-row')||mount.querySelector('[data-stage="5"]');
      next?.scrollIntoView({behavior:'smooth',block:'start'});
    });
    mount.querySelectorAll('[data-save]').forEach(btn=>btn.addEventListener('click',()=>save(btn.closest('.launch225-row'),null)));
    mount.querySelectorAll('[data-recheck]').forEach(btn=>btn.addEventListener('click',()=>recheck(btn.closest('.launch225-row'))));
    mount.querySelectorAll('[data-final-recheck]').forEach(btn=>btn.addEventListener('click',()=>finalRecheck(btn.closest('.launch225-final-row'))));
  }
  async function load(){
    mount.innerHTML='<section class="card"><p class="small">Loading one bounded launch-set projection plus existing campaign review metadata…</p></section>';
    try{
      const r=await apiFetch('/api/admin/storefront-launch-remediation',{cache:'no-store'}),d=await r.json().catch(()=>({}));
      if(!r.ok||!d.ok)throw new Error(d.error||`Execution queue load failed (${r.status}).`);
      campaign=d;render();
    }catch(e){
      mount.innerHTML=`<section class="card"><h2>Launch remediation execution unavailable</h2><p class="small">${esc(e.message||e)}</p><button class="btn" id="launch225Retry">Retry</button></section>`;
      mount.querySelector('#launch225Retry')?.addEventListener('click',load);
    }
  }
  mount.innerHTML='<section class="card"><div class="section-heading-row"><div><p class="eyebrow">Build 225</p><h2>Storefront Launch-Set Remediation Execution II</h2><p class="small">Explicit-only: the bounded Product projection does not run until we load the execution queue.</p></div><button class="btn" id="launch225Load" type="button">Load prioritized remediation queue</button></div></section>';
  mount.querySelector('#launch225Load')?.addEventListener('click',load);
});
