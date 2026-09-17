// Release 467 Build 168 — Product Browser session reuse + missing-featured-only image recovery.
// Explicit operator reads only: initial page, Search, Next and deliberate Refresh.
// Previous/revisit may reuse this browser-session snapshot. No timers, autoscan or second authority.
(() => {
  'use strict';
  const form=document.getElementById('productBrowserSearchForm');
  const query=document.getElementById('productBrowserQuery');
  const pageSize=document.getElementById('productBrowserPageSize');
  const body=document.getElementById('productBrowserBody');
  const status=document.getElementById('productBrowserStatus');
  const next=document.getElementById('productBrowserNext');
  const prev=document.getElementById('productBrowserPrev');
  const refresh=document.getElementById('productBrowserRefresh');
  const pageLabel=document.getElementById('productBrowserPageLabel');
  if(!form||!body||!status||!window.DDAuth)return;

  const history=[];
  const pageCache=new Map();
  let cursor=null;
  let nextCursor=null;
  let page=1;
  let inFlight=false;
  let stoppedForQuota=false;

  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(ch)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
  const money=(cents,currency='CAD')=>{try{return new Intl.NumberFormat('en-CA',{style:'currency',currency:String(currency||'CAD')}).format(Number(cents||0)/100);}catch{return `$${(Number(cents||0)/100).toFixed(2)}`;}};
  const limit=()=>Math.max(1,Math.min(24,Number(pageSize?.value||8)||8));
  const cacheKey=(q,pageLimit,requestedCursor)=>JSON.stringify([String(q||'').trim().toLowerCase(),Number(pageLimit||8),Number(requestedCursor||0)]);
  function setStatus(message,tone=''){status.textContent=message;status.dataset.tone=tone;status.hidden=!message;}
  function mediaCandidates(primary,fallback){
    const values=[primary,fallback].map((value)=>String(value||'').trim()).filter(Boolean);const out=[];
    for(const value of values){
      try{
        const url=new URL(value,location.origin);
        if(url.pathname==='/api/product-media'){
          const key=String(url.searchParams.get('key')||'').trim();if(key)out.push(`/api/product-media?key=${encodeURIComponent(key)}&admin_recovery=1`);out.push(value);continue;
        }
        if(url.pathname==='/media/product'){
          const key=String(url.searchParams.get('key')||'').trim();if(key)out.push(`/api/product-media?key=${encodeURIComponent(key)}&admin_recovery=1`);continue;
        }
        if(url.hostname==='assets.devilndove.com'||url.hostname.endsWith('.r2.dev')){
          const key=url.pathname.replace(/^\/+/, '');if(key)out.push(`/api/product-media?key=${encodeURIComponent(key)}&admin_recovery=1`);out.push(value);continue;
        }
        out.push(value);
      }catch{}
    }
    out.push('/assets/product-image-recovery-placeholder.svg');return [...new Set(out)];
  }
  function rememberEditorSeed(product){
    const id=Number(product?.product_id||0);if(!id)return;
    const seed={product_id:id,product_number:product.product_number??null,name:product.name||'',slug:product.slug||'',sku:product.sku||'',status:product.status||'',review_status:product.review_status||'',price_cents:Number(product.price_cents||0),currency:product.currency||'CAD',inventory_tracking:Number(product.inventory_tracking||0),inventory_quantity:Number(product.inventory_quantity||0),featured_image_url:product.featured_image_url||'',updated_at:product.updated_at||'',captured_at:Date.now(),source:'product-browser-v168'};
    try{sessionStorage.setItem(`dnd:product-editor-seed:${id}`,JSON.stringify(seed));}catch{}
  }
  function armImages(){
    body.querySelectorAll('img[data-product-image-candidates]').forEach((img)=>{
      let candidates=[];try{candidates=JSON.parse(img.dataset.productImageCandidates||'[]');}catch{}
      let index=0;const use=()=>{img.src=candidates[index]||'/assets/product-image-recovery-placeholder.svg';};
      img.onerror=()=>{if(index<candidates.length-1){index+=1;use();}};use();
    });
  }
  function render(products,imageMap={}){
    if(!products.length){body.innerHTML='<tr><td colspan="4" class="dd-empty">No Products matched this page.</td></tr>';return;}
    const byId=new Map(products.map((p)=>[Number(p.product_id||0),p]));
    body.innerHTML=products.map((p)=>{
      const id=Number(p.product_id||0);const recovered=imageMap[id]||{};const fallback=recovered.image_url||'';const candidates=mediaCandidates(p.featured_image_url,fallback);
      const edit=`/admin/product-editor/?product_id=${encodeURIComponent(id)}`;const media=`/admin/catalog-media/?product_id=${encodeURIComponent(id)}`;const publicLink=p.slug?`/shop/product/?slug=${encodeURIComponent(p.slug)}`:'';
      const stock=Number(p.inventory_tracking||0)===1?String(Number(p.inventory_quantity||0)):'not tracked';
      const source=recovered.source?` • photo: ${esc(recovered.source)}`:'';
      return `<tr data-product-id="${id}">
        <td class="dd-product-image-cell"><img class="dd-product-thumb" loading="lazy" data-product-image-candidates='${esc(JSON.stringify(candidates))}' alt="${esc(p.name||'Product image')}"></td>
        <td><strong>${esc(p.name||`Product #${id}`)}</strong><div class="small">#${id}${p.product_number?` • No. ${esc(p.product_number)}`:''}${p.sku?` • ${esc(p.sku)}`:''}</div><div class="dd-product-meta"><span>${esc(p.status||'draft')}</span><span>${esc(p.review_status||'pending')}</span></div><div class="small dd-product-photo-source">${source.replace(/^ • /,'')}</div></td>
        <td><strong>${money(p.price_cents,p.currency)}</strong><div class="small">Stock: ${esc(stock)}</div></td>
        <td class="dd-product-actions"><a class="btn" data-product-edit-id="${id}" href="${edit}">Edit</a><a class="btn" href="${media}">Images</a>${publicLink?`<a class="btn" href="${publicLink}" target="_blank" rel="noopener">View</a>`:''}</td>
      </tr>`;
    }).join('');
    body.querySelectorAll('[data-product-edit-id]').forEach((link)=>link.addEventListener('click',()=>rememberEditorSeed(byId.get(Number(link.dataset.productEditId||0)))));
    armImages();
  }
  async function readJson(response){const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok){const error=new Error(data?.error||`Product Browser request failed (${response.status}).`);error.code=data?.code||'';error.status=response.status;throw error;}return data;}
  async function loadImageMap(products){
    const ids=products.filter((p)=>!String(p?.featured_image_url||'').trim()).map((p)=>Number(p.product_id||0)).filter((id)=>id>0).slice(0,24);
    if(!ids.length)return {images_by_product:{},d1_rows_read:0,recovered_count:0,requested_missing_featured:0};
    const response=await window.DDAuth.apiFetch('/api/admin/product-browser-images',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_ids:ids,featured_missing_only:true}),cache:'no-store'});
    return readJson(response);
  }
  function applyPage(entry,{fromCache=false}={}){
    cursor=entry.cursor||null;nextCursor=entry.nextCursor||null;render(entry.products||[],entry.imageMap||{});
    const recovered=Number(entry.recovered||0);const rows=Number(entry.rows||0);const missing=Number(entry.requestedMissingFeatured||0);
    setStatus(fromCache?`${entry.products.length} Product${entry.products.length===1?'':'s'} reused from this browser session. D1 rows read: 0 for this navigation. Press Refresh for live authority.`:`${entry.products.length} Product${entry.products.length===1?'':'s'} loaded. Secondary image lookup ran for ${missing} visible Product${missing===1?'':'s'} without a featured image; ${recovered} fallback photo reference${recovered===1?'':'s'} recovered.${Number.isFinite(rows)?` D1 rows read: ${rows}.`:''}`,'ok');
    pageLabel.textContent=`Page ${page} • ${entry.pageLimit} per page${fromCache?' • session reuse':''}`;
  }
  async function load({requestedCursor=cursor,remember=false,force=false}={}){
    if(inFlight||stoppedForQuota)return;
    const pageLimit=limit();const q=String(query.value||'').trim();const key=cacheKey(q,pageLimit,requestedCursor);
    if(!force&&pageCache.has(key)){
      if(remember)history.push(cursor);stoppedForQuota=false;applyPage(pageCache.get(key),{fromCache:true});next.disabled=!nextCursor;prev.disabled=history.length===0;refresh.disabled=false;if(pageSize)pageSize.disabled=false;return;
    }
    inFlight=true;next.disabled=true;prev.disabled=true;refresh.disabled=true;if(pageSize)pageSize.disabled=true;setStatus('Loading one compact Product page…');
    try{
      const params=new URLSearchParams({limit:String(pageLimit)});if(q)params.set('q',q);if(requestedCursor)params.set('cursor',String(requestedCursor));
      const response=await window.DDAuth.apiFetch(`/api/admin/product-browser?${params.toString()}`,{method:'GET',cache:'no-store'});
      const data=await readJson(response);const products=Array.isArray(data.products)?data.products:[];
      let imageData={images_by_product:{},d1_rows_read:0,recovered_count:0,requested_missing_featured:0};
      try{imageData=await loadImageMap(products);}catch(imageError){if(imageError?.code==='d1_read_capacity_unavailable')throw imageError;}
      if(remember)history.push(cursor);
      const rows=[data.d1_rows_read,imageData.d1_rows_read].filter((value)=>Number.isFinite(Number(value))).reduce((sum,value)=>sum+Number(value),0);
      const entry={cursor:requestedCursor||null,nextCursor:data.next_cursor||null,products,imageMap:imageData.images_by_product||{},recovered:Number(imageData.recovered_count||0),requestedMissingFeatured:Number(imageData.requested_missing_featured??products.filter((p)=>!String(p?.featured_image_url||'').trim()).length),rows,pageLimit};
      pageCache.set(key,entry);applyPage(entry);
    }catch(error){
      const quota=error?.code==='d1_read_capacity_unavailable'||error?.status===503&&/D1|read capacity|quota|rows/i.test(String(error?.message||''));
      if(quota){stoppedForQuota=true;setStatus(`${error.message} Automatic retries are stopped until we deliberately refresh after capacity returns.`,'error');}
      else setStatus(error?.message||'Could not load Products.','error');
      body.innerHTML='<tr><td colspan="4" class="dd-empty">Product Browser is unavailable. No automatic retry will run.</td></tr>';
    }finally{
      inFlight=false;next.disabled=stoppedForQuota||!nextCursor;prev.disabled=stoppedForQuota||history.length===0;refresh.disabled=stoppedForQuota;if(pageSize)pageSize.disabled=stoppedForQuota;
    }
  }
  function resetAndLoad(){history.length=0;cursor=null;nextCursor=null;page=1;stoppedForQuota=false;load({requestedCursor:null});}
  form.addEventListener('submit',(event)=>{event.preventDefault();resetAndLoad();});
  next.addEventListener('click',()=>{if(!nextCursor)return;page+=1;load({requestedCursor:nextCursor,remember:true});});
  prev.addEventListener('click',()=>{if(!history.length)return;const prior=history.pop()??null;page=Math.max(1,page-1);stoppedForQuota=false;load({requestedCursor:prior});});
  refresh.addEventListener('click',()=>{stoppedForQuota=false;const key=cacheKey(String(query.value||'').trim(),limit(),cursor);pageCache.delete(key);load({requestedCursor:cursor,force:true});});
  pageSize?.addEventListener('change',resetAndLoad);
  load({requestedCursor:null});
})();
