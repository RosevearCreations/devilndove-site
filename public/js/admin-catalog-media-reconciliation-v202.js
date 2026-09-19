// Release 467 Build 202 — Catalog Reference & Media Reconciliation.
// Read-only orchestration only: no startup reads, no polling, no mutation.
// Repairs remain in Catalog, Inventory Operations, and Product Media.
(()=>{
  'use strict';
  const mount=document.getElementById('catalogMediaReconciliationMount');
  if(!mount)return;
  const $=(id)=>document.getElementById(id);
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=(v)=>Number(v||0);
  const state={queue:'catalog_reference',q:'',loading:false,summary:null};

  function message(text='',tone='info'){
    const el=$('catalogReconMessage'); if(!el)return;
    el.textContent=text; el.hidden=!text; el.dataset.tone=tone;
  }
  async function getJson(path,params={}){
    if(!window.DDAuth?.apiFetch)throw new Error('Admin session helper is unavailable.');
    const query=new URLSearchParams(params);
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await window.DDAuth.apiFetch(path+'?'+query.toString(),{cache:'no-store',signal:controller.signal});
      const data=await response.json().catch(()=>null);
      if(!response.ok||!data?.ok)throw new Error(data?.error||data?.detail||('Reconciliation request failed ('+response.status+').'));
      return data;
    }catch(error){
      if(error?.name==='AbortError')throw new Error('Live reconciliation evidence took too long to answer. Try again.');
      throw error;
    }finally{clearTimeout(timer);}
  }
  const chip=(label)=>'<span class="catalog-recon-chip">'+esc(label)+'</span>';
  const stat=(label,value,note)=>'<div class="card catalog-recon-stat"><span class="small">'+esc(label)+'</span><strong>'+n(value).toLocaleString()+'</strong><span class="small">'+esc(note)+'</span></div>';

  function renderSummary(inventory={},media={}){
    const box=$('catalogReconSummary'); if(!box)return;
    const mi=media.inventory||{},mp=media.products||{};
    box.innerHTML=[
      stat('Unmatched catalog references',inventory.catalog_reference_not_matched,'Inventory ↔ Catalog identity review'),
      stat('Blank Inventory images',mi.blank_images,'Inventory image owner'),
      stat('External Inventory image refs',mi.external_image_sources,'review source before relying on R2'),
      stat('Product alt-text attention',mp.products_with_alt_attention,'Product Media owner')
    ].join('');
  }

  async function loadSummary(){
    if(state.loading)return; state.loading=true; message('Reading bounded reconciliation counts…');
    try{
      const [inventory,media]=await Promise.all([
        getJson('/api/admin/inventory-identity-health',{mode:'summary'}),
        getJson('/api/admin/catalog-image-repair',{mode:'summary'})
      ]);
      state.summary={inventory:inventory.summary||{},media:media.summary||{}};
      renderSummary(state.summary.inventory,state.summary.media);
      message('Reconciliation counts loaded. No catalog, Inventory, Product Media, or R2 data was changed.','success');
    }catch(error){message(error.message||'Reconciliation counts failed.','error');}
    finally{state.loading=false;}
  }

  function repairKey(item){return String(item.external_key||item.item_name||item.site_item_inventory_id||'').trim();}
  function inventoryRepairHref(item){
    return '/admin/inventory-operations/?q='+encodeURIComponent(repairKey(item))+'&repair_from=build202#siteInventoryForm';
  }
  function catalogRepairHref(item){
    return '/admin/catalog/?q='+encodeURIComponent(repairKey(item))+'&repair_from=build202';
  }

  function renderCatalog(items=[]){
    const out=$('catalogReconResults');
    if(!items.length){out.innerHTML='<div class="card"><strong>No unmatched catalog-reference rows match this view.</strong></div>';return;}
    out.innerHTML=items.map(item=>{
      const id=n(item.site_item_inventory_id),status=String(item.catalog_reference_status||'missing');
      return '<article class="card catalog-recon-row">'+
        '<div class="catalog-recon-row-main"><strong>'+esc(item.item_name||repairKey(item)||('Inventory #'+id))+'</strong>'+
        '<div class="small">#'+id+' · '+esc(item.source_type||'')+' · key '+esc(item.external_key||'missing')+'</div>'+
        '<div class="catalog-recon-chips">'+chip('catalog '+status)+(n(item.key_duplicate_count)>1?chip('duplicate identity evidence'):'')+'</div></div>'+
        '<div class="catalog-recon-row-evidence"><span class="small">Use Recheck after reviewing the owning editor. It compares the recorded Inventory timestamp and catalog identity without writing.</span>'+
        '<button class="btn" type="button" data-catalog-recheck="'+id+'" data-expected-updated="'+esc(item.updated_at||'')+'">Recheck catalog reference</button>'+
        '<span class="small catalog-recon-result" data-catalog-recheck-result="'+id+'"></span></div>'+
        '<div class="catalog-recon-actions"><a class="btn primary" href="'+esc(inventoryRepairHref(item))+'">Open Inventory</a><a class="btn" href="'+esc(catalogRepairHref(item))+'">Open Catalog</a></div>'+
      '</article>';
    }).join('');
  }

  function renderInventoryMedia(items=[],queue){
    const out=$('catalogReconResults');
    if(!items.length){out.innerHTML='<div class="card"><strong>No Inventory media rows match this queue.</strong></div>';return;}
    out.innerHTML=items.map(item=>{
      const id=n(item.site_item_inventory_id),issues=Array.isArray(item.issues)?item.issues:[],img=String(item.image_url||'').trim();
      return '<article class="card catalog-recon-row">'+
        '<div class="catalog-recon-row-main"><strong>'+esc(item.item_name||repairKey(item)||('Inventory #'+id))+'</strong>'+
        '<div class="small">#'+id+' · '+esc(item.item_kind||'')+' · '+esc(item.external_key||'no key')+'</div>'+
        '<div class="catalog-recon-chips">'+issues.map(x=>chip(String(x).replaceAll('_',' '))).join('')+'</div>'+
        '<div class="small">'+(img?'Current: '+esc(img):'Current image is blank')+'</div></div>'+
        '<div class="catalog-recon-row-evidence"><button class="btn" type="button" data-media-recheck-scope="inventory" data-media-recheck-id="'+id+'" data-media-token="'+esc(item.evidence_token||'')+'">Recheck media evidence</button>'+
        '<span class="small catalog-recon-result" data-media-recheck-result="inventory:'+id+'"></span></div>'+
        '<div class="catalog-recon-actions"><a class="btn primary" href="'+esc(inventoryRepairHref(item))+'">Open Inventory repair</a></div>'+
      '</article>';
    }).join('');
  }

  function renderProductAlt(products=[]){
    const out=$('catalogReconResults');
    if(!products.length){out.innerHTML='<div class="card"><strong>No Product alt-text attention rows match this view.</strong></div>';return;}
    out.innerHTML=products.map(product=>{
      const pid=n(product.product_id);
      const images=(Array.isArray(product.images)?product.images:[]).filter(img=>Array.isArray(img.issues)&&img.issues.includes('alt_text'));
      const evidence=images.slice(0,6).map(img=>{
        const iid=n(img.product_image_id);
        return '<div class="small">Image #'+iid+' · alt '+esc(img.alt_text||'missing')+
          ' <button class="btn" type="button" data-media-recheck-scope="product_image" data-media-recheck-id="'+iid+'" data-media-token="'+esc(img.evidence_token||'')+'">Recheck</button>'+
          '<span class="catalog-recon-result" data-media-recheck-result="product_image:'+iid+'"></span></div>';
      }).join('');
      return '<article class="card catalog-recon-row">'+
        '<div class="catalog-recon-row-main"><strong>'+esc(product.name||('Product #'+pid))+'</strong><div class="small">#'+pid+' · '+esc(product.sku||'no SKU')+'</div>'+
        '<div class="catalog-recon-chips">'+chip(n(product.alt_attention)+' alt-text attention')+'</div></div>'+
        '<div class="catalog-recon-row-evidence">'+(evidence||'<span class="small">Open Product Media to inspect the gallery.</span>')+'</div>'+
        '<div class="catalog-recon-actions"><a class="btn primary" href="/admin/catalog-media/?product_id='+pid+'&repair_from=build202">Open Product Media</a></div>'+
      '</article>';
    }).join('');
  }

  async function loadQueue(){
    if(state.loading)return; state.loading=true;
    const out=$('catalogReconResults'); out.innerHTML='<div class="card small">Loading up to 40 reconciliation rows…</div>';
    message('Reading the selected bounded queue…');
    try{
      if(state.queue==='catalog_reference'){
        const data=await getJson('/api/admin/inventory-identity-health',{mode:'issues',queue:'catalog',q:state.q,limit:'40'});
        renderCatalog(data.items||[]);
      }else if(state.queue==='inventory_blank_image'){
        const data=await getJson('/api/admin/catalog-image-repair',{mode:'inventory',inventory_issue:'missing_image',q:state.q,limit:'40'});
        renderInventoryMedia(data.inventory||[],state.queue);
      }else if(state.queue==='inventory_external_image'){
        const data=await getJson('/api/admin/catalog-image-repair',{mode:'inventory',inventory_issue:'external_source',q:state.q,limit:'40'});
        renderInventoryMedia(data.inventory||[],state.queue);
      }else{
        const data=await getJson('/api/admin/catalog-image-repair',{mode:'products',product_issue:'alt_text',q:state.q,limit:'40'});
        renderProductAlt(data.products||[]);
      }
      message('Queue loaded. Every correction remains an explicit action in the existing owning editor.','success');
    }catch(error){out.innerHTML='';message(error.message||'Reconciliation queue failed.','error');}
    finally{state.loading=false;}
  }

  async function recheckCatalog(button){
    const id=n(button.dataset.catalogRecheck),out=mount.querySelector('[data-catalog-recheck-result="'+id+'"]');
    const old=button.textContent; button.disabled=true; button.textContent='Rechecking…'; if(out)out.textContent='';
    try{
      const data=await getJson('/api/admin/inventory-identity-health',{mode:'record',inventory_id:String(id),expected_updated_at:String(button.dataset.expectedUpdated||'')});
      const e=data.evidence||{};
      if(out)out.textContent='Catalog '+String(e.catalog_reference_status||'unknown')+(e.stale_target?' · stale queue evidence':'')+' · mutation none';
      button.dataset.expectedUpdated=String(e.current_updated_at||'');
    }catch(error){if(out)out.textContent=error.message||'Catalog recheck failed';}
    finally{button.disabled=false;button.textContent=old;}
  }

  async function recheckMedia(button){
    const scope=String(button.dataset.mediaRecheckScope||''),id=n(button.dataset.mediaRecheckId);
    const out=mount.querySelector('[data-media-recheck-result="'+CSS.escape(scope+':'+id)+'"]');
    const old=button.textContent; button.disabled=true; button.textContent='Rechecking…'; if(out)out.textContent='';
    try{
      const data=await getJson('/api/admin/catalog-image-repair',{mode:'r2_evidence',scope,id:String(id),expected_token:String(button.dataset.mediaToken||'')});
      const e=data.evidence||{};
      if(out)out.textContent='metadata '+String(e.metadata_state||'unknown')+' · object '+String(e.object_state||e.state||'unknown')+(e.stale_target?' · stale queue evidence':'')+' · mutation none';
      button.dataset.mediaToken=String(e.current_token||'');
    }catch(error){if(out)out.textContent=error.message||'Media recheck failed';}
    finally{button.disabled=false;button.textContent=old;}
  }

  function render(){
    mount.innerHTML='<section class="card catalog-recon-workbench" aria-labelledby="catalogReconHeading">'+
      '<div class="section-heading-row"><div><p class="eyebrow">Release 467 • Build 202</p><h2 id="catalogReconHeading">Catalog Reference & Media Reconciliation</h2>'+
      '<p class="small">Separate catalog-reference, blank Inventory image, external Inventory image, and Product alt-text work. This workbench is read-only and routes every repair to Catalog, Inventory Operations, or Product Media.</p></div>'+
      '<button class="btn primary" id="catalogReconSummaryButton" type="button">Load reconciliation counts</button></div>'+
      '<div id="catalogReconSummary" class="catalog-recon-summary"><div class="small">Reconciliation counts are paused during page startup.</div></div>'+
      '<div class="catalog-recon-toolbar"><label class="small">Queue<select class="input" id="catalogReconQueue">'+
      '<option value="catalog_reference">Unmatched catalog references</option><option value="inventory_blank_image">Blank Inventory images</option>'+
      '<option value="inventory_external_image">External Inventory image references</option><option value="product_alt_text">Product alt-text attention</option></select></label>'+
      '<label class="small">Search<input class="input" id="catalogReconSearch" type="search" placeholder="name, key, SKU, slug or ID"></label>'+
      '<button class="btn" id="catalogReconLoad" type="button">Load 40 rows</button></div>'+
      '<div id="catalogReconMessage" class="small" hidden aria-live="polite"></div>'+
      '<div id="catalogReconResults" class="catalog-recon-results"><div class="small">Choose Load 40 rows when ready. No background scan runs on page load.</div></div>'+
      '<details><summary>Authority boundary</summary><p class="small">Catalog identity is repaired only in the existing Catalog or Inventory authority. Tool/Supply image references are repaired only in Inventory Operations. Finished-Product alt text remains owned by Product Media. A selected R2 check uses one object HEAD only; Build 202 never lists, uploads, copies, reassigns, deletes, or publishes R2 objects.</p></details>'+
    '</section>';
    $('catalogReconSummaryButton')?.addEventListener('click',loadSummary);
    $('catalogReconLoad')?.addEventListener('click',()=>{state.q=String($('catalogReconSearch')?.value||'').trim();loadQueue();});
    $('catalogReconQueue')?.addEventListener('change',event=>{state.queue=String(event.target.value||'catalog_reference');});
    $('catalogReconSearch')?.addEventListener('keydown',event=>{if(event.key!=='Enter')return;event.preventDefault();state.q=String(event.currentTarget.value||'').trim();loadQueue();});
    mount.addEventListener('click',event=>{
      const catalog=event.target.closest('[data-catalog-recheck]'); if(catalog){recheckCatalog(catalog);return;}
      const media=event.target.closest('[data-media-recheck-scope]'); if(media)recheckMedia(media);
    });
  }
  render();
})();
