// Release 467 Build 162 — dedicated single-Product editor.
// One Product startup read, no catalog bootstrap, no autosave loop and no background refresh.
(() => {
  'use strict';
  const form=document.getElementById('productEditorForm');
  const status=document.getElementById('productEditorStatus');
  const title=document.getElementById('productEditorTitle');
  const identity=document.getElementById('productEditorIdentity');
  const save=document.getElementById('productEditorSave');
  const tabs=document.getElementById('productEditorTabs');
  const mediaMount=document.getElementById('productEditorMediaMount');
  const mediaLink=document.getElementById('productEditorMediaManagerLink');
  if(!form||!status||!window.DDAuth)return;

  const params=new URLSearchParams(location.search);
  const productId=Number(params.get('product_id')||0);
  const state={productId:Number.isInteger(productId)&&productId>0?productId:0,product:null,images:[],mediaLoaded:false,inFlight:false,stoppedForQuota:false};
  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(ch)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
  const field=(name)=>form.elements.namedItem(name);
  const set=(name,value)=>{const el=field(name);if(el)el.value=value==null?'':String(value);};
  const get=(name)=>String(field(name)?.value??'').trim();
  const numOrNull=(value)=>{const text=String(value??'').trim();if(!text)return null;const n=Number(text);return Number.isFinite(n)?n:null;};
  const cents=(value)=>{const n=numOrNull(value);return n==null?0:Math.max(0,Math.round(n*100));};
  function setStatus(message,tone=''){status.textContent=message;status.dataset.tone=tone;status.hidden=!message;}
  async function readJson(response,fallback){const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok){const error=new Error(data?.error||fallback||`Request failed (${response.status}).`);error.code=data?.code||'';error.status=response.status;throw error;}return data;}
  function sameOriginMedia(raw){const value=String(raw||'').trim();if(!value)return '/assets/product-image-recovery-placeholder.svg';try{const url=new URL(value,location.origin);if(url.hostname==='assets.devilndove.com'||url.hostname.endsWith('.r2.dev')){const key=url.pathname.replace(/^\/+/, '');return `/api/product-media?key=${encodeURIComponent(key)}`;}return value;}catch{return '/assets/product-image-recovery-placeholder.svg';}}
  function fill(product){
    state.product=product||{};
    const map=['name','slug','sku','product_category','color_name','color_names_text','shipping_code','review_status','short_description','description','product_type','status','currency','tax_class_id','weight_grams','inventory_quantity','digital_file_url','featured_image_url','sort_order','meta_title','meta_description','keywords','h1_override','canonical_url','og_title','og_description','og_image_url','merchandise_origin','sale_channel','external_listing_url','external_listing_label','condition_summary','era_label','sourcing_notes'];
    map.forEach((key)=>set(key,product?.[key]));
    set('price',Number(product?.price_cents||0)/100);
    set('compare_at_price',product?.compare_at_price_cents==null?'':Number(product.compare_at_price_cents||0)/100);
    set('taxable',Number(product?.taxable??1)===0?'0':'1');
    set('requires_shipping',Number(product?.requires_shipping??1)===1?'1':'0');
    set('inventory_tracking',Number(product?.inventory_tracking??0)===1?'1':'0');
    identity.textContent=`Product #${Number(product?.product_id||state.productId)}${product?.product_number?` • No. ${product.product_number}`:''}${product?.sku?` • ${product.sku}`:''}`;
    title.textContent=product?.name?`Edit ${product.name}`:'Edit Product';
    const preview=document.getElementById('productEditorFeaturedPreview');
    if(preview){preview.src=sameOriginMedia(product?.featured_image_url);preview.alt=product?.name?`Featured image for ${product.name}`:'Product featured image';}
    if(mediaLink)mediaLink.href=`/admin/catalog-media/?product_id=${encodeURIComponent(state.productId)}`;
  }
  async function loadProduct(){
    if(!state.productId){title.textContent='Create Product';identity.textContent='New Product';setStatus('New Product mode. No Product catalog was loaded.','ok');return;}
    if(state.inFlight||state.stoppedForQuota)return;state.inFlight=true;save.disabled=true;setStatus('Loading this Product only…');
    try{
      const response=await window.DDAuth.apiFetch(`/api/admin/product-editor-detail?product_id=${encodeURIComponent(state.productId)}`,{method:'GET',cache:'no-store'});
      const data=await readJson(response,'Failed to load Product.');
      fill(data.product||{});setStatus('Product loaded. Supporting media, inventory, readiness and pricing evidence remain unloaded until requested.','ok');
    }catch(error){
      const quota=error?.code==='d1_read_capacity_unavailable'||error?.status===503&&/D1|read capacity|quota|rows/i.test(String(error?.message||''));
      if(quota)state.stoppedForQuota=true;
      setStatus(`${error?.message||'Could not load Product.'}${quota?' No automatic retry will run.':''}`,'error');
    }finally{state.inFlight=false;save.disabled=state.stoppedForQuota;}
  }
  function activateTab(id){
    document.querySelectorAll('[data-editor-panel]').forEach((panel)=>panel.hidden=panel.dataset.editorPanel!==id);
    document.querySelectorAll('[data-editor-tab]').forEach((button)=>button.setAttribute('aria-selected',button.dataset.editorTab===id?'true':'false'));
    if(id==='media')loadMedia();
  }
  async function loadMedia(){
    if(state.mediaLoaded)return;
    if(!state.productId){mediaMount.innerHTML='<p class="small">Save this Product first, then Media can be loaded on demand.</p>';return;}
    mediaMount.innerHTML='<p class="small">Loading this Product’s gallery only…</p>';
    try{
      const response=await window.DDAuth.apiFetch(`/api/admin/product-editor-media?product_id=${encodeURIComponent(state.productId)}`,{method:'GET',cache:'no-store'});
      const data=await readJson(response,'Failed to load Product media.');state.images=Array.isArray(data.images)?data.images:[];state.mediaLoaded=true;
      if(!state.images.length){mediaMount.innerHTML='<p class="small">No gallery images are attached to this Product.</p>';return;}
      mediaMount.innerHTML=`<div class="dd-media-grid">${state.images.map((row,index)=>`<div class="dd-media-card"><img loading="lazy" src="${esc(sameOriginMedia(row.image_url))}" alt="${esc(row.alt_text||`Product image ${index+1}`)}"><div class="small">${esc(row.alt_text||'No alt text')}</div></div>`).join('')}</div>`;
    }catch(error){mediaMount.innerHTML=`<p class="small">${esc(error?.message||'Media could not be loaded.')}</p>`;}
  }
  function payload(){
    const base=state.product||{};
    return {
      product_id:state.productId||undefined,
      product_number:base.product_number??null,
      name:get('name'),slug:get('slug'),sku:get('sku'),product_category:get('product_category'),color_name:get('color_name'),color_names_text:get('color_names_text'),shipping_code:get('shipping_code'),review_status:get('review_status')||'pending_review',
      short_description:get('short_description'),description:get('description'),product_type:get('product_type')||'physical',status:get('status')||'draft',
      price_cents:cents(get('price')),compare_at_price_cents:get('compare_at_price')===''?null:cents(get('compare_at_price')),currency:get('currency')||'CAD',taxable:get('taxable')==='0'?0:1,tax_class_id:numOrNull(get('tax_class_id')),
      requires_shipping:get('requires_shipping')==='1'?1:0,weight_grams:numOrNull(get('weight_grams')),inventory_tracking:get('inventory_tracking')==='1'?1:0,inventory_quantity:Math.max(0,Number(numOrNull(get('inventory_quantity'))||0)),digital_file_url:get('digital_file_url'),featured_image_url:get('featured_image_url'),sort_order:Math.max(0,Number(numOrNull(get('sort_order'))||0)),
      image_urls:state.mediaLoaded?state.images.map((row)=>String(row?.image_url||'').trim()).filter(Boolean):[],
      meta_title:get('meta_title'),meta_description:get('meta_description'),keywords:get('keywords'),h1_override:get('h1_override'),canonical_url:get('canonical_url'),og_title:get('og_title'),og_description:get('og_description'),og_image_url:get('og_image_url'),
      merchandise_origin:get('merchandise_origin')||base.merchandise_origin||'handmade',sale_channel:get('sale_channel')||base.sale_channel||'onsite',external_listing_url:get('external_listing_url'),external_listing_label:get('external_listing_label'),condition_summary:get('condition_summary'),era_label:get('era_label'),sourcing_notes:get('sourcing_notes'),
    };
  }
  async function saveProduct(event){
    event.preventDefault();if(state.inFlight||state.stoppedForQuota)return;
    if(!get('name')){setStatus('Product name is required.','error');field('name')?.focus();return;}
    state.inFlight=true;save.disabled=true;setStatus('Saving this Product…');
    const endpoint=state.productId?'/api/admin/update-product':'/api/admin/create-product';
    try{
      const response=await window.DDAuth.apiFetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload())});
      const data=await readJson(response,'Product save failed.');
      const savedId=Number(data?.product?.product_id||data?.product_id||state.productId||0);
      if(!state.productId&&savedId){location.replace(`/admin/product-editor/?product_id=${encodeURIComponent(savedId)}&created=1`);return;}
      if(data?.product)fill({...state.product,...data.product});
      setStatus('Saved. No catalog refresh or readiness scan was started.','ok');
    }catch(error){
      const quota=error?.code==='d1_read_capacity_unavailable'||error?.status===503&&/D1|read capacity|quota|rows/i.test(String(error?.message||''));if(quota)state.stoppedForQuota=true;
      setStatus(`${error?.message||'Product save failed.'}${quota?' Automatic retry is disabled.':''}`,'error');
    }finally{state.inFlight=false;save.disabled=state.stoppedForQuota;}
  }
  tabs?.addEventListener('click',(event)=>{const button=event.target.closest('[data-editor-tab]');if(button)activateTab(button.dataset.editorTab);});
  form.addEventListener('submit',saveProduct);
  document.getElementById('productEditorRetry')?.addEventListener('click',()=>{state.stoppedForQuota=false;loadProduct();});
  activateTab('basics');
  loadProduct();
})();
