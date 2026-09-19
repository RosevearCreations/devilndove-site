// Release 467 Build 184 image-repair authority, extended by Build 190 media evidence closure.
// No startup read, no polling, no mutation. R2 evidence is one selected object HEAD at a time.
(()=>{
  'use strict';
  const mount=document.getElementById('catalogImageRepairMount');
  if(!mount)return;
  const $=(id)=>document.getElementById(id);
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=(v)=>Number(v||0);
  const state={mode:'products',q:'',kind:'',loading:false,summary:null};
  function message(text='',tone='info'){const el=$('catalogImageRepairMessage');if(!el)return;el.textContent=text;el.hidden=!text;el.dataset.tone=tone;}
  async function api(mode,params={}){
    if(!window.DDAuth?.apiFetch)throw new Error('Admin session helper is unavailable.');
    const query=new URLSearchParams({mode,...params});
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await window.DDAuth.apiFetch('/api/admin/catalog-image-repair?'+query,{cache:'no-store',signal:controller.signal});
      const data=await response.json().catch(()=>null);
      if(!response.ok||!data?.ok)throw new Error(data?.error||data?.detail||('Image repair request failed ('+response.status+').'));
      return data;
    }catch(error){
      if(error?.name==='AbortError')throw new Error('Live image evidence took too long to answer. Try again.');
      throw error;
    }finally{clearTimeout(timer);}
  }
  const chip=(label,tone='attention')=>'<span class="catalog-image-chip '+esc(tone)+'">'+esc(label)+'</span>';
  function issueLabel(code){
    return ({
      missing_featured:'missing featured image',no_gallery:'no gallery',shallow_gallery:'gallery under 3',
      alt_text:'alt text',image_role:'image role',image_role_ambiguous:'ambiguous approved image role',featured_not_in_gallery:'featured not in gallery',
      image_source:'image source',missing_url:'missing image URL',external_source:'external image source',
      missing_image:'missing image',catalog_image_candidate:'catalog image candidate',authority_drift:'Inventory/catalog drift'
    })[code]||String(code||'issue').replaceAll('_',' ');
  }
  function stat(label,value,note=''){return '<div class="card catalog-image-stat"><span class="small">'+esc(label)+'</span><strong>'+n(value).toLocaleString()+'</strong><span class="small">'+esc(note)+'</span></div>';}
  function renderSummary(summary={}){
    state.summary=summary;
    const p=summary.products||{},i=summary.inventory||{},el=$('catalogImageRepairSummary');
    if(!el)return;
    el.innerHTML=[
      stat('Active Products',p.active_products,'live Product rows'),
      stat('Missing featured',p.missing_featured,'Product Media repair'),
      stat('No gallery',p.no_gallery,'blocking visual proof'),
      stat('Gallery under 3',p.shallow_gallery,'add useful buyer views'),
      stat('Alt-text attention',p.products_with_alt_attention,'12+ useful characters'),
      stat('Role attention',p.products_with_role_attention,'explicit buyer-facing role'),
      stat('Featured drift',p.featured_not_in_gallery,'featured pointer not in gallery'),
      stat('External Product image source',p.products_with_external_image_source,'review before R2 evidence'),
      stat('Active Tool/Supply',i.active_inventory,'Inventory authority'),
      stat('Blank Tool/Supply image',i.blank_images,'Inventory image repair'),
      stat('Catalog image candidates',i.catalog_image_candidates,'review before copying reference'),
      stat('Inventory/catalog image drift',i.authority_drift,'choose canonical authority'),
      stat('External Tool/Supply image source',i.external_image_sources,'review source ownership')
    ].join('');
  }
  function evidenceButton(scope,id,key,token=''){
    if(!id)return '';
    const label=key?'Check R2 object / media evidence':'Check image source / metadata';
    return '<button class="btn" type="button" data-image-evidence-scope="'+esc(scope)+'" data-image-evidence-id="'+n(id)+'" data-image-evidence-token="'+esc(token)+'">'+label+'</button><span class="small catalog-image-evidence-result" data-image-evidence-result="'+esc(scope)+':'+n(id)+'"></span>';
  }
  function renderProductImages(product){
    const images=Array.isArray(product.images)?product.images:[];
    if(!images.length)return '<div class="small">No canonical gallery image rows. Open Product Media to add the first image.</div>';
    return '<div class="catalog-image-subrows">'+images.slice(0,8).map(img=>{
      const issues=Array.isArray(img.issues)?img.issues:[];
      const src=img.image_source_status==='r2_reference'?'R2 reference':img.image_source_status==='external_reference'?'external source':'missing source';
      return '<div class="catalog-image-subrow">'+
        '<div class="catalog-image-thumb">'+(img.image_url?'<img src="'+esc(img.image_url)+'" alt="" loading="lazy">':'<span>IMG</span>')+'</div>'+
        '<div class="catalog-image-subrow-main"><strong>Image #'+n(img.product_image_id)+'</strong><div class="small">'+esc(src)+(img.r2_key?' · '+esc(img.r2_key):'')+'</div><div class="small">Role evidence: '+esc(img.role_evidence_status||'not checked')+'</div><div class="catalog-image-chips">'+issues.map(code=>chip(issueLabel(code),code==='external_source'?'warning':'attention')).join('')+'</div></div>'+
        '<div class="catalog-image-evidence">'+evidenceButton('product_image',img.product_image_id,img.r2_key,img.evidence_token||'')+'</div>'+
      '</div>';
    }).join('')+'</div>';
  }
  function renderProducts(products=[]){
    const el=$('catalogImageRepairResults');
    if(!products.length){el.innerHTML='<div class="card"><strong>No Product image-repair issues match this view.</strong></div>';return;}
    el.innerHTML='<div class="catalog-image-product-list">'+products.map(p=>{
      const pid=n(p.product_id),issues=Array.isArray(p.issues)?p.issues:[];
      return '<article class="card catalog-image-product-card">'+
        '<div class="catalog-image-card-head"><div><strong>'+esc(p.name||('Product #'+pid))+'</strong><div class="small">#'+pid+' · '+esc(p.sku||'no SKU')+' · '+esc(p.status||'draft')+'</div></div>'+
        '<div class="catalog-image-actions"><a class="btn primary" href="/admin/catalog-media/?product_id='+pid+'">Open Product Media</a><a class="btn" href="/admin/product-editor/?product_id='+pid+'&tab=basics">Product Editor</a></div></div>'+
        '<div class="catalog-image-chips">'+issues.map(code=>chip(issueLabel(code),['no_gallery','missing_featured','featured_not_in_gallery'].includes(code)?'blocker':'attention')).join('')+'</div>'+
        '<div class="small">Gallery '+n(p.image_count)+' · alt attention '+n(p.alt_attention)+' · role attention '+n(p.role_attention)+'</div>'+
        renderProductImages(p)+
      '</article>';
    }).join('')+'</div>';
  }
  function renderInventory(items=[]){
    const el=$('catalogImageRepairResults');
    if(!items.length){el.innerHTML='<div class="card"><strong>No Tool/Supply image-repair issues match this view.</strong></div>';return;}
    el.innerHTML='<div class="catalog-image-table-wrap"><table class="catalog-image-table"><thead><tr><th>Tool / Supply</th><th>Image evidence</th><th>Issue</th><th>R2 evidence</th><th>Repair</th></tr></thead><tbody>'+
      items.map(item=>{
        const id=n(item.site_item_inventory_id),issues=Array.isArray(item.issues)?item.issues:[],key=item.external_key||item.item_name||String(id);
        const img=String(item.image_url||'').trim(),cat=String(item.catalog_image_url||'').trim();
        return '<tr><td><strong>'+esc(item.item_name||key)+'</strong><div class="small">#'+id+' · '+esc(item.item_kind||'')+' · '+esc(item.external_key||'no key')+'</div></td>'+
          '<td><div class="catalog-image-inventory-preview">'+(img?'<img src="'+esc(img)+'" alt="" loading="lazy">':'<span class="catalog-image-empty">No image</span>')+
          '<div class="small"><strong>Inventory:</strong> '+esc(img||'blank')+'</div><div class="small"><strong>Catalog:</strong> '+esc(cat||'blank')+'</div></div></td>'+
          '<td><div class="catalog-image-chips">'+issues.map(code=>chip(issueLabel(code),code==='missing_image'?'blocker':'attention')).join('')+'</div></td>'+
          '<td>'+evidenceButton('inventory',id,item.r2_key,item.evidence_token||'')+'</td>'+
          '<td><a class="btn primary" href="/admin/inventory-operations/?q='+encodeURIComponent(key)+'#siteInventoryAdminMount">Open Inventory repair</a></td></tr>';
      }).join('')+'</tbody></table></div>';
  }
  async function loadSummary(){
    if(state.loading)return;state.loading=true;message('Reading bounded live-D1 image health…');
    try{const data=await api('summary');renderSummary(data.summary||{});message('Image health loaded. No Product, Inventory, or R2 data was changed.','success');}
    catch(error){message(error.message||'Image health failed.','error');}
    finally{state.loading=false;}
  }
  async function loadRows(){
    if(state.loading)return;state.loading=true;
    const el=$('catalogImageRepairResults');el.innerHTML='<div class="card small">Loading up to 40 image-repair records…</div>';
    try{
      if(state.mode==='products'){const data=await api('products',{q:state.q,limit:'40'});renderProducts(data.products||[]);}
      else{const data=await api('inventory',{q:state.q,kind:state.kind,limit:'40'});renderInventory(data.inventory||[]);}
      message('Repair evidence loaded. Every correction remains an explicit action in the owning editor.','success');
    }catch(error){el.innerHTML='';message(error.message||'Image repair queue failed.','error');}
    finally{state.loading=false;}
  }
  async function checkEvidence(button){
    if(button.disabled)return;
    const scope=button.dataset.imageEvidenceScope||'',eid=n(button.dataset.imageEvidenceId);
    const out=mount.querySelector('[data-image-evidence-result="'+CSS.escape(scope+':'+eid)+'"]');
    const old=button.textContent;button.disabled=true;button.textContent='Checking…';if(out)out.textContent='';
    try{
      const data=await api('r2_evidence',{scope,id:String(eid),expected_token:String(button.dataset.imageEvidenceToken||'')}),e=data.evidence||{};
      if(out){
        const stale=e.stale_target?' · stale queue evidence':'';
        const role=e.role_evidence_status?' · role '+String(e.role_evidence_status):'';
        const size=e.object?.size?' · '+Number(e.object.size).toLocaleString()+' bytes':'';
        out.textContent='Media '+String(e.evidence_classification||'review')+' · metadata '+String(e.metadata_state||'unknown')+' · object '+String(e.object_state||e.state||'unknown')+size+role+stale;
      }
      button.dataset.imageEvidenceToken=String(e.current_token||'');
    }catch(error){if(out)out.textContent=error.message||'R2 evidence failed';}
    finally{button.disabled=false;button.textContent=old;}
  }
  function render(){
    mount.innerHTML='<section class="card catalog-image-repair" aria-labelledby="catalogImageRepairHeading">'+
      '<div class="section-heading-row"><div><p class="eyebrow">Release 467 • Build 190</p><h2 id="catalogImageRepairHeading">Product & Tool/Supply Image Repair</h2><p class="small">Build 190 separates metadata problems from missing R2-object evidence, flags approved-image role gaps/ambiguity, and rechecks one selected media record at a time without merging Product Media, Inventory media, or static-site Media Studio.</p></div><button class="btn primary" id="catalogImageRepairSummaryButton" type="button">Load image health</button></div>'+
      '<div id="catalogImageRepairSummary" class="catalog-image-summary"><div class="small">Build 184 image health is paused during page startup.</div></div>'+
      '<div class="catalog-image-controls"><label class="small">Repair queue<select class="input" id="catalogImageRepairMode"><option value="products">Products</option><option value="inventory">Tools & Supplies</option></select></label>'+
      '<label class="small">Tool/Supply kind<select class="input" id="catalogImageRepairKind" disabled><option value="">Tools & Supplies</option><option value="tool">Tools only</option><option value="supply">Supplies only</option></select></label>'+
      '<label class="small catalog-image-search">Search<input class="input" id="catalogImageRepairSearch" type="search" placeholder="Product, SKU, slug, Tool/Supply, key, category or supplier"></label>'+
      '<button class="btn" id="catalogImageRepairLoad" type="button">Load 40 repair records</button></div>'+
      '<div id="catalogImageRepairMessage" class="small" hidden aria-live="polite"></div>'+
      '<div id="catalogImageRepairResults"><div class="small">Choose Load 40 repair records when you are ready. R2 checks run only when you press a specific image’s evidence button.</div></div>'+
      '<details class="catalog-image-boundary"><summary>Image authority boundaries</summary><div class="small"><strong>Finished Products:</strong> Product Media & Image Editor owns gallery, alt text, role, crop, featured selection and Product image mutation. <strong>Tools/Supplies:</strong> Inventory Operations owns operational image_url and catalog reconciliation. <strong>Static pages:</strong> Media & Content Studio remains separate. Build 190 uses only one selected R2 object HEAD and never copies, uploads, reassigns or deletes R2 objects automatically.</div></details>'+
    '</section>';
    $('catalogImageRepairSummaryButton')?.addEventListener('click',loadSummary);
    $('catalogImageRepairLoad')?.addEventListener('click',()=>{state.q=String($('catalogImageRepairSearch')?.value||'').trim();loadRows();});
    $('catalogImageRepairMode')?.addEventListener('change',(event)=>{state.mode=String(event.target.value||'products');$('catalogImageRepairKind').disabled=state.mode!=='inventory';});
    $('catalogImageRepairKind')?.addEventListener('change',(event)=>{state.kind=String(event.target.value||'');});
    $('catalogImageRepairSearch')?.addEventListener('keydown',(event)=>{if(event.key!=='Enter')return;event.preventDefault();state.q=String(event.currentTarget.value||'').trim();loadRows();});
    mount.addEventListener('click',(event)=>{const button=event.target.closest('[data-image-evidence-scope]');if(button)checkEvidence(button);});
  }
  render();
})();
