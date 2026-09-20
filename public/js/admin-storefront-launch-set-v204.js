// Release 467 Build 204 — Storefront Launch Set & Autonomous Closure.
// Explicit-only read projection. No Product publication, Inventory/cost write, R2/provider/payment/accounting action.
(()=>{
  'use strict';
  const mount=document.getElementById('storefrontLaunchSetMount'); if(!mount)return;
  const $=(id)=>document.getElementById(id);
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=(v)=>Number(v||0);
  const state={loading:false,q:'',status:'all'};
  const statusLabel=(s)=>s==='ready'?'Ready':s==='externally_blocked'?'Externally blocked':'Review required';
  function msg(text='',tone='info'){const el=$('launchSetMessage');if(!el)return;el.textContent=text;el.hidden=!text;el.dataset.tone=tone;}
  async function api(mode,params={}){
    if(!window.DDAuth?.apiFetch)throw new Error('Admin session helper is unavailable.');
    const qs=new URLSearchParams({mode,...params}),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try{
      const response=await window.DDAuth.apiFetch('/api/admin/storefront-launch-set?'+qs,{cache:'no-store',signal:controller.signal});
      const data=await response.json().catch(()=>null);
      if(!response.ok||!data?.ok)throw new Error(data?.error||data?.detail||('Launch-set request failed ('+response.status+').'));
      return data;
    }catch(error){if(error?.name==='AbortError')throw new Error('Launch-set evidence took too long to answer. Try again.');throw error;}
    finally{clearTimeout(timer);}
  }
  const stat=(label,value,note)=>'<div class="card launch-set-stat"><span class="small">'+esc(label)+'</span><strong>'+n(value).toLocaleString()+'</strong><span class="small">'+esc(note)+'</span></div>';
  function renderSummary(s={}){
    $('launchSetSummary').innerHTML=[
      stat('Ready',s.ready,'all launch evidence currently clear'),
      stat('Review required',s.review_required,'human evidence or owner repair still required'),
      stat('Externally blocked',s.externally_blocked,'current commerce/sale-channel boundary'),
      stat('Publicly visible',s.publicly_visible,'current Product visibility rules')
    ].join('');
    $('launchSetSummaryDetail').textContent='Reviewed '+n(s.products_reviewed)+' Products · held from public '+n(s.held_from_public)+' · media ready '+n(s.media_ready)+' · tracked zero stock '+n(s.tracked_zero_stock)+' · unknown linked cost '+n(s.products_with_unknown_linked_cost)+'.';
  }
  const chip=(v)=>'<span class="launch-set-chip">'+esc(v)+'</span>';
  function renderRows(items=[]){
    const out=$('launchSetResults');
    if(!items.length){out.innerHTML='<div class="card"><strong>No Products match this launch-set view.</strong></div>';return;}
    out.innerHTML=items.map(p=>{
      const reasons=[...(p.external_reasons||[]),...(p.review_reasons||[])];
      const list=reasons.length?'<ul class="launch-set-reasons small">'+reasons.map(r=>'<li><strong>'+esc(r.area||'review')+':</strong> '+esc(r.label||r.code)+'</li>').join('')+'</ul>':'<p class="small">No launch-set exclusion reason is currently evidenced.</p>';
      const links=p.repair_hrefs||{};
      return '<article class="card launch-set-row">'+
        '<div><strong>'+esc(p.name||('Product #'+n(p.product_id)))+'</strong><div class="small">Product #'+n(p.product_id)+' · '+esc(p.sku||'no SKU')+' · '+esc(p.slug||'no slug')+'</div>'+
        chip(statusLabel(p.status))+chip('Buyer blockers '+n(p.buyer?.blocker_count))+chip('Images '+n(p.media?.image_count))+chip('Unknown cost '+n(p.cost?.unknown_cost_links))+list+'</div>'+
        '<div class="small"><div><strong>Publication:</strong> '+(p.publication?.currently_public?'currently public':'held from public')+'</div>'+
        '<div><strong>Media:</strong> '+(p.media?.ready?'ready':'review')+'</div>'+
        '<div><strong>Cost:</strong> '+esc(p.cost?.readiness||'unknown')+' — linked resources only</div>'+
        '<div><strong>Commerce:</strong> '+esc(p.commerce?.currency||'CAD')+' · Canada only · U.S. sales/shipping disabled</div>'+
        '<button class="btn" type="button" data-launch-recheck="'+n(p.product_id)+'" data-launch-token="'+esc(p.evidence_token||'')+'">Recheck Product</button>'+
        '<span class="launch-set-result small" data-launch-result="'+n(p.product_id)+'"></span></div>'+
        '<div class="launch-set-actions"><a class="btn primary" href="'+esc(links.product||'/admin/product-editor/')+'">Product Editor</a>'+
        '<a class="btn" href="'+esc(links.media||'/admin/catalog-media/')+'">Product Media</a>'+
        '<a class="btn" href="'+esc(links.inventory||'/admin/inventory-operations/')+'">Inventory / resources</a></div>'+
      '</article>';
    }).join('');
  }
  async function load(){
    if(state.loading)return;state.loading=true;msg('Reading bounded launch-set evidence…');
    $('launchSetResults').innerHTML='<div class="card small">Loading up to 40 Products from the launch-set projection…</div>';
    try{
      const data=await api('queue',{q:state.q,status:state.status,limit:'40'});
      renderSummary(data.summary||{});renderRows(data.products||[]);
      const policy=data.commerce_policy||{},lanes=data.external_lanes||{};
      $('launchSetPolicy').textContent='Commerce policy '+(policy.version||'current')+': Canada/CAD only; U.S. sales '+(policy.united_states_sales_enabled?'enabled':'disabled')+', U.S. shipping '+(policy.united_states_shipping_enabled?'enabled':'disabled')+'. External lanes remain '+Object.entries(lanes).map(([k,v])=>k+' '+v).join(' · ')+'.';
      msg('Launch-set evidence loaded. No Product, Inventory, media, provider, payment, or accounting state was changed.','success');
    }catch(error){$('launchSetResults').innerHTML='';msg(error.message||'Launch-set evidence failed.','error');}
    finally{state.loading=false;}
  }
  async function recheck(button){
    const id=n(button.dataset.launchRecheck),out=mount.querySelector('[data-launch-result="'+id+'"]'),old=button.textContent;
    button.disabled=true;button.textContent='Rechecking…';if(out)out.textContent='';
    try{
      const data=await api('product',{product_id:String(id),expected_token:String(button.dataset.launchToken||'')});
      const p=data.product||{};
      if(out)out.textContent=statusLabel(p.status)+(data.stale_target?' · stale queue evidence':'')+' · automatic publication none';
      button.dataset.launchToken=String(data.current_token||'');
    }catch(error){if(out)out.textContent=error.message||'Product recheck failed.';}
    finally{button.disabled=false;button.textContent=old;}
  }
  mount.innerHTML='<section class="card launch-set-workbench" aria-labelledby="launchSetHeading">'+
    '<div class="section-heading-row"><div><p class="eyebrow">Release 467 Build 204 • final planned autonomous build</p><h2 id="launchSetHeading">Storefront Launch Set & Autonomous Closure</h2>'+
    '<p class="small">Converges buyer, finished-stock, Product media, linked Inventory/cost, publication and Canada-only commerce evidence into an explainable launch view. Ready is evidence, not permission to publish.</p></div>'+
    '<button class="btn primary" id="launchSetLoad" type="button">Load launch set</button></div>'+
    '<div id="launchSetSummary" class="launch-set-summary"><div class="small">Launch-set reads are paused during page startup.</div></div>'+
    '<div id="launchSetSummaryDetail" class="small"></div>'+
    '<form id="launchSetForm" class="launch-set-toolbar"><label class="small">Search Products<input class="input" id="launchSetSearch" type="search" placeholder="Product, SKU, slug, number or ID"></label>'+
    '<label class="small">Status<select class="input" id="launchSetStatus"><option value="all">All statuses</option><option value="ready">Ready</option><option value="review_required">Review required</option><option value="externally_blocked">Externally blocked</option></select></label>'+
    '<button class="btn" type="submit">Apply</button></form>'+
    '<div id="launchSetMessage" class="small" hidden aria-live="polite"></div><div id="launchSetPolicy" class="small"></div>'+
    '<div id="launchSetResults" class="launch-set-results"><div class="small">Choose Load launch set when ready. No launch-set scan runs on page load.</div></div>'+
    '<details><summary>Closure boundary</summary><p class="small">No automatic publication/unpublication, Product price change, Inventory or cost mutation, R2 mutation, provider/social execution, payment/refund, accounting posting, U.S. sales/shipping re-enable, or Production business-data copy occurs here.</p></details>'+
    '</section>';
  $('launchSetLoad')?.addEventListener('click',()=>{state.q=String($('launchSetSearch')?.value||'').trim();state.status=String($('launchSetStatus')?.value||'all');load();});
  $('launchSetForm')?.addEventListener('submit',e=>{e.preventDefault();state.q=String($('launchSetSearch')?.value||'').trim();state.status=String($('launchSetStatus')?.value||'all');load();});
  mount.addEventListener('click',e=>{const b=e.target.closest('[data-launch-recheck]');if(b)recheck(b);});
})();
