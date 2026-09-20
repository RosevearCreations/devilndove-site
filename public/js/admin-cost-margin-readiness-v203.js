// Release 467 Build 203 — Cost Evidence & Margin Readiness.
// Explicit-only read workbench. Inventory/Product Resources remain the mutation owners.
(()=>{
  'use strict';
  const mount=document.getElementById('costMarginReadinessMount');
  if(!mount)return;
  const $=(id)=>document.getElementById(id);
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=(v)=>Number(v||0);
  const state={loading:false,q:''};

  function money(cents,currency='CAD'){
    const value=Number(cents);
    if(!Number.isFinite(value))return 'Unknown';
    try{return new Intl.NumberFormat(undefined,{style:'currency',currency:String(currency||'CAD')}).format(value/100);}
    catch{return '$'+(value/100).toFixed(2);}
  }
  function message(text='',tone='info'){
    const el=$('costMarginMessage'); if(!el)return;
    el.textContent=text; el.hidden=!text; el.dataset.tone=tone;
  }
  async function api(mode,params={}){
    if(!window.DDAuth?.apiFetch)throw new Error('Admin session helper is unavailable.');
    const query=new URLSearchParams({mode,...params});
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await window.DDAuth.apiFetch('/api/admin/cost-margin-readiness?'+query,{cache:'no-store',signal:controller.signal});
      const data=await response.json().catch(()=>null);
      if(!response.ok||!data?.ok)throw new Error(data?.error||data?.detail||('Cost evidence request failed ('+response.status+').'));
      return data;
    }catch(error){
      if(error?.name==='AbortError')throw new Error('Live cost evidence took too long to answer. Try again.');
      throw error;
    }finally{clearTimeout(timer);}
  }
  const stat=(label,value,note)=>'<div class="card cost-margin-stat"><span class="small">'+esc(label)+'</span><strong>'+n(value).toLocaleString()+'</strong><span class="small">'+esc(note)+'</span></div>';
  const chip=(label)=>'<span class="cost-margin-chip">'+esc(label)+'</span>';

  function renderSummary(s={}){
    const el=$('costMarginSummary'); if(!el)return;
    el.innerHTML=[
      stat('Missing-cost links',s.missing_cost_links,'required linked resources with unknown Inventory cost'),
      stat('Missing Inventory matches',s.missing_inventory_matches,'repair identity before cost can be relied on'),
      stat('Margin-ready Products',s.margin_ready_products,'linked-resource cost evidence complete'),
      stat('Margin-review Products',s.margin_review_products,'resource cost evidence incomplete')
    ].join('');
    const detail=$('costMarginSummaryDetail');
    if(detail)detail.textContent='Linked resources '+n(s.linked_resources)+' · known-cost '+n(s.known_cost_links)+' · reusable/story-only N/A '+n(s.nondepleting_links)+' · margin scope: linked resources only, not full accounting profit.';
  }

  async function loadSummary(){
    if(state.loading)return;state.loading=true;message('Reading bounded live cost evidence…');
    try{
      const data=await api('summary');renderSummary(data.summary||{});
      message('Cost evidence loaded. Missing cost remains unknown; no Inventory, Product, price, or accounting data was changed.','success');
    }catch(error){message(error.message||'Cost evidence summary failed.','error');}
    finally{state.loading=false;}
  }

  function issueLabel(state){
    return state==='unknown_inventory_match'?'Inventory match missing':state==='unknown_missing_cost'?'Inventory cost missing':state==='not_applicable'?'Not applicable — reusable/story-only':state==='known'?'Known cost':'Unknown';
  }
  function renderRows(items=[]){
    const out=$('costMarginResults');
    if(!items.length){out.innerHTML='<div class="card"><strong>No missing cost-evidence links match this view.</strong></div>';return;}
    out.innerHTML=items.map(item=>{
      const id=n(item.product_resource_link_id),inventoryId=n(item.site_item_inventory_id);
      return '<article class="card cost-margin-row">'+
        '<div class="cost-margin-row-main"><strong>'+esc(item.product_name||('Product #'+n(item.product_id)))+'</strong>'+
        '<div class="small">Product #'+n(item.product_id)+' · '+esc(item.sku||'no SKU')+' · price '+esc(money(item.price_cents,item.currency))+'</div>'+
        '<div><strong>'+esc(item.resource_name||item.source_key||('Link #'+id))+'</strong> <span class="small">('+esc(item.resource_kind||'resource')+')</span></div>'+
        '<div class="small">Uses '+esc(item.quantity_used)+' '+esc(item.usage_unit_label||'unit')+' per '+esc(item.consumption_mode||'per_unit')+
        ' · '+esc(item.usage_units_per_stock_unit)+' '+esc(item.usage_unit_label||'unit')+' / '+esc(item.stock_unit_label||'unit')+'</div>'+
        chip(issueLabel(item.cost_evidence_state))+(inventoryId?chip('Inventory #'+inventoryId):chip('no Inventory match'))+
        '</div>'+
        '<div class="cost-margin-row-evidence"><div class="small">Current purchase-unit cost: '+esc(item.cost_evidence_state==='known'?money(item.unit_cost_cents,item.currency):'Unknown')+'</div>'+
        '<div class="small">Per-product linked-resource cost: '+esc(item.evidenced_cost_per_product_cents==null?'Unknown':money(item.evidenced_cost_per_product_cents,item.currency))+'</div>'+
        '<button class="btn" type="button" data-cost-recheck="'+id+'" data-cost-token="'+esc(item.evidence_token||'')+'">Recheck cost evidence</button>'+
        '<span class="small cost-margin-result" data-cost-result="'+id+'"></span></div>'+
        '<div class="cost-margin-actions"><a class="btn primary" href="'+esc(item.inventory_repair_href||'#siteInventoryAdminMount')+'">'+(inventoryId?'Open Inventory cost':'Repair Inventory match')+'</a>'+
        '<a class="btn" href="'+esc(item.product_resource_href||'#productResourcesAdminMount')+'">Open Product resources</a></div>'+
      '</article>';
    }).join('');
  }

  async function loadRows(){
    if(state.loading)return;state.loading=true;
    const out=$('costMarginResults');out.innerHTML='<div class="card small">Loading up to 40 missing cost-evidence links…</div>';
    message('Reading the bounded missing-cost queue…');
    try{
      const data=await api('issues',{q:state.q,limit:'40'});renderRows(data.items||[]);
      message('Missing-cost queue loaded. Corrections remain deliberate actions in Inventory or Product Resources.','success');
    }catch(error){out.innerHTML='';message(error.message||'Missing-cost queue failed.','error');}
    finally{state.loading=false;}
  }

  async function recheck(button){
    const id=n(button.dataset.costRecheck),out=mount.querySelector('[data-cost-result="'+id+'"]');
    const old=button.textContent;button.disabled=true;button.textContent='Rechecking…';if(out)out.textContent='';
    try{
      const data=await api('record',{link_id:String(id),expected_token:String(button.dataset.costToken||'')});
      const e=data.evidence||{};
      const cost=e.cost_evidence_state==='known'?money(e.unit_cost_cents,e.currency):'Unknown';
      if(out)out.textContent=issueLabel(e.cost_evidence_state)+' · purchase cost '+cost+(e.stale_target?' · stale queue evidence':'')+' · automatic write none';
      button.dataset.costToken=String(e.current_token||'');
    }catch(error){if(out)out.textContent=error.message||'Cost evidence recheck failed';}
    finally{button.disabled=false;button.textContent=old;}
  }

  function render(){
    mount.innerHTML='<section class="card cost-margin-workbench" aria-labelledby="costMarginHeading">'+
      '<div class="section-heading-row"><div><p class="inventory-operations-eyebrow">Release 467 Build 203</p><h2 id="costMarginHeading">Cost Evidence & Margin Readiness</h2>'+
      '<p class="small">Find required Product-resource links whose Inventory cost evidence is still unknown. Inventory Operations owns cost corrections; Product Resources owns link/usage corrections. Margin here is linked-resource evidence only, never full accounting profit.</p></div>'+
      '<button class="btn primary" id="costMarginSummaryButton" type="button">Load cost summary</button></div>'+
      '<div id="costMarginSummary" class="cost-margin-summary"><div class="small">Cost evidence is paused during page startup.</div></div>'+
      '<div id="costMarginSummaryDetail" class="small"></div>'+
      '<div class="cost-margin-toolbar"><label class="small">Search missing-cost links<input class="input" id="costMarginSearch" type="search" placeholder="Product, SKU, resource, key or ID"></label>'+
      '<button class="btn" id="costMarginLoad" type="button">Load 40 missing-cost links</button></div>'+
      '<div id="costMarginMessage" class="small" hidden aria-live="polite"></div>'+
      '<div id="costMarginResults" class="cost-margin-results"><div class="small">Choose Load 40 missing-cost links when ready. No background cost scan runs on page load.</div></div>'+
      '<details><summary>Cost and margin boundary</summary><p class="small">Unknown required cost never becomes zero. Reusable/log-only Tools and story-only links are not applicable. Resource margin excludes labour, overhead, marketplace/payment fees, shipping, tax and accounting adjustments. Build 203 does not post accounting, change Product price, buy supplies, change stock, or write cost automatically.</p></details>'+
    '</section>';
    $('costMarginSummaryButton')?.addEventListener('click',loadSummary);
    $('costMarginLoad')?.addEventListener('click',()=>{state.q=String($('costMarginSearch')?.value||'').trim();loadRows();});
    $('costMarginSearch')?.addEventListener('keydown',event=>{if(event.key!=='Enter')return;event.preventDefault();state.q=String(event.currentTarget.value||'').trim();loadRows();});
    mount.addEventListener('click',event=>{const button=event.target.closest('[data-cost-recheck]');if(button)recheck(button);});
  }
  render();
})();
