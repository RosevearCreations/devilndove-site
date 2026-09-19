// Release 467 Build 182 queue, extended by Build 188 closure and Build 199 Buyer Readiness Repair Workbench.
// Retained endpoint contract: /api/admin/product-buyer-readiness?limit=40
// No automatic startup read, timer, polling, mutation, or retry loop.
(()=>{
  'use strict';
  const load=document.getElementById('catalogBuyerReadinessLoad');
  const form=document.getElementById('catalogBuyerReadinessSearchForm');
  const input=document.getElementById('catalogBuyerReadinessSearch');
  const mount=document.getElementById('catalogBuyerReadinessResults');
  const summary=document.getElementById('catalogBuyerReadinessSummary');
  const evidence=document.getElementById('catalogBuyerReadinessEvidence');
  const severityFilter=document.getElementById('catalogBuyerReadinessSeverity');
  const issueFilter=document.getElementById('catalogBuyerReadinessIssue');
  const nextButton=document.getElementById('catalogBuyerReadinessNext');
  if(!load||!mount||!summary||!window.DDAuth)return;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=(v)=>Number(v||0);
  let busy=false,queueProducts=[],queueCursor=0,queueKey='';
  function fixHref(productId,item={}){
    const tab=String(item?.fix?.tab||'basics'),field=String(item?.fix?.field||'name');
    return `/admin/product-editor/?product_id=${encodeURIComponent(productId)}&tab=${encodeURIComponent(tab)}&focus=${encodeURIComponent(field)}`;
  }
  function stat(label,value,note=''){return `<div class="card"><span class="small">${esc(label)}</span><strong>${n(value).toLocaleString()}</strong><span class="small">${esc(note)}</span></div>`;}
  function selectedIssues(product={}){
    const r=product.buyer_readiness||{};
    return Array.isArray(r.workbench_issues)?r.workbench_issues:(Array.isArray(r.issues)?r.issues:[]);
  }
  function currentQueueKey(){
    return [String(input?.value||'').trim().toLowerCase(),String(severityFilter?.value||'all'),String(issueFilter?.value||'all')].join('|');
  }
  function updateNextButton(){
    if(!nextButton)return;
    nextButton.disabled=!queueProducts.length;
    nextButton.textContent=queueProducts.length?`Open next unresolved (${(queueCursor%queueProducts.length)+1}/${queueProducts.length})`:'Open next unresolved';
  }
  function rememberQueue(products){
    queueProducts=Array.isArray(products)?products:[];
    queueKey=currentQueueKey();
    const stored=Number(sessionStorage.getItem('ddBuyerWorkbenchCursor:'+queueKey)||0);
    queueCursor=queueProducts.length&&Number.isInteger(stored)&&stored>=0?stored%queueProducts.length:0;
    updateNextButton();
  }
  function openNextUnresolved(){
    if(!queueProducts.length)return;
    const product=queueProducts[queueCursor%queueProducts.length]||{};
    const issues=selectedIssues(product),pid=n(product.product_id);
    const href=issues.length?fixHref(pid,issues[0]):`/admin/product-editor/?product_id=${encodeURIComponent(pid)}&tab=buyer`;
    queueCursor=(queueCursor+1)%queueProducts.length;
    sessionStorage.setItem('ddBuyerWorkbenchCursor:'+queueKey,String(queueCursor));
    updateNextButton();
    window.location.assign(href);
  }
  async function run(){
    if(busy)return;busy=true;load.disabled=true;
    const q=String(input?.value||'').trim();
    const severity=String(severityFilter?.value||'all');
    const issue=String(issueFilter?.value||'all');
    mount.innerHTML='<div class="card small">Reading bounded Product buyer facts from live D1…</div>';
    try{
      const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
      let response;
      try{
        const requestParams=new URLSearchParams({limit:'40',q,severity,issue});
        response=await window.DDAuth.apiFetch('/api/admin/product-buyer-readiness?'+requestParams.toString(),{cache:'no-store',signal:controller.signal});
      }
      finally{clearTimeout(timer);}
      const raw=await response.text().catch(()=>''),data=raw?JSON.parse(raw):null;
      if(!response.ok||!data?.ok)throw new Error(data?.error||data?.detail||`Buyer readiness request failed (${response.status}).`);
      const s=data.summary||{};
      summary.innerHTML=[
        stat('Products reviewed',s.products_reviewed,'bounded live D1 source'),
        stat('Buyer-review ready',s.ready_for_buyer_review,'no blocking Product facts'),
        stat('With blockers',s.products_with_blockers,'direct repair needed'),
        stat('Description attention',s.description_attention,'short/long copy'),
        stat('Pricing blockers',s.pricing_blockers,'positive selling price'),
        stat('Shipping blockers',s.shipping_blockers,'weight/code/digital delivery'),
        stat('Condition attention',s.condition_attention,'found/vintage buyer facts'),
        stat('Tracked zero stock',s.tracked_zero_stock,'finished Product stock review'),
        stat('Publicly visible',s.publicly_visible,'active + publication review state'),
        stat('Held from public',s.held_from_public,'draft/review/slug rule'),
        stat('Matching queue',s.workbench_matching_products,'current explicit filters'),
        stat('Matching blockers',s.workbench_matching_blockers,'selected blocker evidence'),
        stat('Matching advisory',s.workbench_matching_advisories,'selected advisory evidence'),
        '<div class="card"><span class="small">Profitability</span><strong>Separate</strong><span class="small">not evaluated in this buyer-facts workbench</span></div>'
      ].join('');
      const products=Array.isArray(data.products)?data.products:[];
      rememberQueue(products);
      mount.innerHTML=products.length?`<div class="catalog-health-table-wrap"><table class="catalog-health-table"><thead><tr><th>Product</th><th>Buyer facts</th><th>Publication</th><th>Issues</th><th>Repair</th></tr></thead><tbody>${products.map(product=>{
        const r=product.buyer_readiness||{},issues=selectedIssues(product),pid=n(product.product_id);
        const blockers=Array.isArray(r.workbench_blocking_issues)?r.workbench_blocking_issues:issues.filter(item=>item.severity==='blocker');
        const advisory=Array.isArray(r.workbench_advisory_issues)?r.workbench_advisory_issues:issues.filter(item=>item.severity!=='blocker');
        const visibility=r.public_visibility||{};
        return `<tr data-buyer-product-row="${pid}">
          <td><strong>${esc(product.name||`Product #${pid}`)}</strong><div class="small">#${pid} · ${esc(product.sku||'no SKU')} · ${esc(product.product_category||'no category')}</div></td>
          <td><strong>${n(r.score)}%</strong><div class="small">${n(r.blocker_count)} blocker(s) · ${n(r.attention_count)} advisory overall</div><div class="small">${blockers.length} blocker(s) · ${advisory.length} advisory in this view</div></td>
          <td><strong>${visibility.catalog_search_visible?'Eligible':'Held'}</strong><div class="small">Shop/search/detail publication evidence only</div><div class="small">${esc(visibility.review_status||'unknown review')}</div></td>
          <td><div class="buyer-readiness-compact">${blockers.slice(0,3).map(item=>`<span class="is-blocker">Blocker: ${esc(item.label)}</span>`).join('')}${advisory.slice(0,3).map(item=>`<span class="is-attention">Advisory: ${esc(item.label)}</span>`).join('')}${issues.length>6?`<span>+${issues.length-6} more</span>`:''}</div></td>
          <td><div class="catalog-health-actions">${issues.slice(0,3).map(item=>`<a class="btn" href="${fixHref(pid,item)}">${esc(item.fix?.label||'Fix')}</a>`).join('')}<a class="btn" href="/admin/product-editor/?product_id=${pid}&tab=buyer">Open buyer review</a><button class="btn" type="button" data-buyer-recheck="${pid}" data-expected-updated-at="${esc(product.updated_at||'')}">Recheck Product</button></div></td>
        </tr>`;
      }).join('')}</tbody></table></div>`:'<div class="card"><strong>No buyer-readiness issues match this view.</strong></div>';
    }catch(error){
      rememberQueue([]);
      const message=error?.name==='AbortError'?'Live D1 buyer readiness took too long to answer. Try again.':(error.message||'Buyer readiness failed.');
      mount.innerHTML=`<div class="card catalog-health-error"><strong>Buyer readiness could not load.</strong><div class="small">${esc(message)}</div></div>`;
    }finally{busy=false;load.disabled=false;}
  }
  async function recheck(button){
    const productId=n(button?.dataset?.buyerRecheck);
    if(!productId||busy)return;
    button.disabled=true;
    if(evidence)evidence.textContent='Rechecking one Product from live D1…';
    try{
      const expected=String(button.dataset.expectedUpdatedAt||'');
      const params=new URLSearchParams({mode:'product',product_id:String(productId),expected_updated_at:expected});
      const response=await window.DDAuth.apiFetch('/api/admin/product-buyer-readiness?'+params.toString(),{cache:'no-store'});
      const raw=await response.text().catch(()=>''),data=raw?JSON.parse(raw):null;
      if(!response.ok||!data?.ok)throw new Error(data?.error||data?.detail||`Buyer readiness recheck failed (${response.status}).`);
      const product=data.product||{},r=product.buyer_readiness||{},v=r.public_visibility||{};
      if(evidence)evidence.innerHTML=`<strong>${esc(product.name||('Product #'+productId))}</strong><div class="small">${data.stale_target?'Stale queue evidence detected; use this current snapshot before deciding the next repair.':'Queue timestamp still matches this Product.'}</div><div class="small">${n(r.blocker_count)} blocker(s) · ${n(r.attention_count)} advisory · ${v.catalog_search_visible?'public Shop/search eligible':'held from public Shop/search'}</div>`;
      button.dataset.expectedUpdatedAt=String(data.current_updated_at||'');
    }catch(error){if(evidence)evidence.textContent=error?.message||'Buyer readiness recheck failed.';}
    finally{button.disabled=false;}
  }
  load.addEventListener('click',run);
  nextButton?.addEventListener('click',openNextUnresolved);
  form?.addEventListener('submit',(event)=>{event.preventDefault();run();});
  mount.addEventListener('click',(event)=>{const button=event.target.closest('[data-buyer-recheck]');if(button){event.preventDefault();recheck(button);}});
})();