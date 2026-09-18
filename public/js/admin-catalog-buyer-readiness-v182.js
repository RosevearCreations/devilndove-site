// Release 467 Build 182 — explicit live-D1 Product buyer-readiness queue on Catalog Health.
// No automatic startup read, timer, polling, mutation, or retry loop.
(()=>{
  'use strict';
  const load=document.getElementById('catalogBuyerReadinessLoad');
  const form=document.getElementById('catalogBuyerReadinessSearchForm');
  const input=document.getElementById('catalogBuyerReadinessSearch');
  const mount=document.getElementById('catalogBuyerReadinessResults');
  const summary=document.getElementById('catalogBuyerReadinessSummary');
  if(!load||!mount||!summary||!window.DDAuth)return;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=(v)=>Number(v||0);
  let busy=false;
  function fixHref(productId,item={}){
    const tab=String(item?.fix?.tab||'basics'),field=String(item?.fix?.field||'name');
    return `/admin/product-editor/?product_id=${encodeURIComponent(productId)}&tab=${encodeURIComponent(tab)}&focus=${encodeURIComponent(field)}`;
  }
  function stat(label,value,note=''){return `<div class="card"><span class="small">${esc(label)}</span><strong>${n(value).toLocaleString()}</strong><span class="small">${esc(note)}</span></div>`;}
  async function run(){
    if(busy)return;busy=true;load.disabled=true;
    const q=String(input?.value||'').trim();
    mount.innerHTML='<div class="card small">Reading bounded Product buyer facts from live D1…</div>';
    try{
      const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
      let response;
      try{response=await window.DDAuth.apiFetch(`/api/admin/product-buyer-readiness?limit=40&q=${encodeURIComponent(q)}`,{cache:'no-store',signal:controller.signal});}
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
        stat('Tracked zero stock',s.tracked_zero_stock,'finished Product stock review')
      ].join('');
      const products=Array.isArray(data.products)?data.products:[];
      mount.innerHTML=products.length?`<div class="catalog-health-table-wrap"><table class="catalog-health-table"><thead><tr><th>Product</th><th>Readiness</th><th>Issues</th><th>Repair</th></tr></thead><tbody>${products.map(product=>{
        const r=product.buyer_readiness||{},issues=Array.isArray(r.issues)?r.issues:[],pid=n(product.product_id);
        return `<tr>
          <td><strong>${esc(product.name||`Product #${pid}`)}</strong><div class="small">#${pid} · ${esc(product.sku||'no SKU')} · ${esc(product.product_category||'no category')}</div></td>
          <td><strong>${n(r.score)}%</strong><div class="small">${n(r.blocker_count)} blocker(s) · ${n(r.attention_count)} attention</div></td>
          <td><div class="buyer-readiness-compact">${issues.slice(0,4).map(item=>`<span class="${item.severity==='blocker'?'is-blocker':'is-attention'}">${esc(item.label)}</span>`).join('')}${issues.length>4?`<span>+${issues.length-4} more</span>`:''}</div></td>
          <td><div class="catalog-health-actions">${issues.slice(0,3).map(item=>`<a class="btn" href="${fixHref(pid,item)}">${esc(item.fix?.label||'Fix')}</a>`).join('')}<a class="btn" href="/admin/product-editor/?product_id=${pid}&tab=buyer">Open buyer review</a></div></td>
        </tr>`;
      }).join('')}</tbody></table></div>`:'<div class="card"><strong>No buyer-readiness issues match this view.</strong></div>';
    }catch(error){
      const message=error?.name==='AbortError'?'Live D1 buyer readiness took too long to answer. Try again.':(error.message||'Buyer readiness failed.');
      mount.innerHTML=`<div class="card catalog-health-error"><strong>Buyer readiness could not load.</strong><div class="small">${esc(message)}</div></div>`;
    }finally{busy=false;load.disabled=false;}
  }
  load.addEventListener('click',run);
  form?.addEventListener('submit',(event)=>{event.preventDefault();run();});
})();