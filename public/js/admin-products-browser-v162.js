// Release 467 Build 170 — Product Browser one-query pages + explicit single-Product photo recovery.
// Fresh page authority is one bounded Product request. Secondary image recovery never runs automatically.
// Previous/revisit may reuse this browser-session snapshot. No timers, autoscan or second Product authority.
(() => {
  'use strict';
  const form=document.getElementById('productBrowserSearchForm');
  const query=document.getElementById('productBrowserQuery');
  const pageSize=document.getElementById('productBrowserPageSize');
  const category=document.getElementById('productBrowserCategory');
  const sort=document.getElementById('productBrowserSort');
  const photos=document.getElementById('productBrowserPhotos');
  const clearFilters=document.getElementById('productBrowserClear');
  const body=document.getElementById('productBrowserBody');
  const status=document.getElementById('productBrowserStatus');
  const next=document.getElementById('productBrowserNext');
  const prev=document.getElementById('productBrowserPrev');
  const refresh=document.getElementById('productBrowserRefresh');
  const pageLabel=document.getElementById('productBrowserPageLabel');
  const bulkCategory636=document.getElementById('dd636BulkCategory');
  const bulkReview636=document.getElementById('dd636BulkReviewState');
  const bulkCount636=document.getElementById('dd636SelectedCount');
  const bulkStatus636=document.getElementById('dd636BulkStatus');
  const bulkRows636=document.getElementById('dd636PreviewRows');
  const bulkPreviewButton636=document.getElementById('dd636Preview');
  const bulkApplyButton636=document.getElementById('dd636Apply');
  const bulkOwnerConfirmed636=document.getElementById('dd636OwnerConfirmed');
  if(!form||!body||!status||!window.DDAuth)return;

  const history=[];
  const pageCache=new Map();
  const imageRecoveryState=new Map();
  let cursor=null;
  let nextCursor=null;
  let page=1;
  let inFlight=false;
  let stoppedForQuota=false;
  let currentEntry=null;
  const bulkSelection636=new Map();let bulkPreview636=null,bulkBusy636=false,bulkBlocked636=false;

  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(ch)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
  const money=(cents,currency='CAD')=>{try{return new Intl.NumberFormat('en-CA',{style:'currency',currency:String(currency||'CAD')}).format(Number(cents||0)/100);}catch{return `$${(Number(cents||0)/100).toFixed(2)}`;}};
  const limit=()=>Math.max(1,Math.min(24,Number(pageSize?.value||8)||8));
  // Build 635: cache identity includes every server-side sort/filter and the
  // opaque keyset cursor, so revisiting a page cannot reuse another ordering.
  const sortValue=()=>String(sort?.value||'newest');
  const categoryValue=()=>String(category?.value||'').trim();
  const photoValue=()=>String(photos?.value||'all');
  const cacheKey=(q,pageLimit,requestedCursor)=>JSON.stringify([String(q||'').trim().toLowerCase(),Number(pageLimit||8),String(requestedCursor||''),sortValue(),categoryValue(),photoValue()]);
  const sortLabels={newest:'newest Product first',updated:'recently updated',name:'name A–Z',price:'price low–high'};
  function setStatus(message,tone=''){status.textContent=message;status.dataset.tone=tone;status.hidden=!message;}
  function bulkMessage636(message,tone=''){if(bulkStatus636){bulkStatus636.textContent=message;bulkStatus636.dataset.tone=tone;}}
  function syncBulkControls636(){
    if(bulkCount636)bulkCount636.textContent=bulkSelection636.size?`${bulkSelection636.size} of 8 draft Product${bulkSelection636.size===1?'':'s'} selected: ${[...bulkSelection636.keys()].join(', ')}.`:'No draft Products selected.';
    if(bulkPreviewButton636)bulkPreviewButton636.disabled=bulkBusy636||bulkBlocked636||bulkSelection636.size===0;
    if(bulkApplyButton636)bulkApplyButton636.disabled=bulkBusy636||bulkBlocked636||!bulkPreview636||!bulkOwnerConfirmed636?.checked;
    for(const element of [bulkCategory636,bulkReview636])if(element)element.disabled=bulkBusy636||bulkBlocked636;
    body.querySelectorAll('[data-dd636-select-id]').forEach(checkbox=>{
      checkbox.disabled=bulkBusy636||bulkBlocked636||checkbox.dataset.dd636Eligible!=='true';
    });
  }
  function invalidateBulkPreview636(message='Selection changed. Preview the saved draft values again before confirming.'){
    bulkPreview636=null;if(bulkOwnerConfirmed636){bulkOwnerConfirmed636.checked=false;bulkOwnerConfirmed636.disabled=true;}
    if(bulkRows636)bulkRows636.textContent='No verified preview. Choose Preview to compare the saved values with the proposed changes.';
    if(message)bulkMessage636(message,'warn');syncBulkControls636();
  }
  function selectedChanges636(){return {product_category:String(bulkCategory636?.value||''),review_status:String(bulkReview636?.value||'')};}
  function setBulkBusy636(value){bulkBusy636=Boolean(value);syncBulkControls636();}
  function selectBulk636(product,checked){
    const id=Number(product?.product_id||0);
    if(!id||String(product.status||'').toLowerCase()!=='draft')return;
    if(checked&&bulkSelection636.size>=8&&!bulkSelection636.has(id)){
      bulkMessage636('Select at most eight draft Products. Nothing was saved.','error');return;
    }
    if(checked)bulkSelection636.set(id,{name:product.name||''});else bulkSelection636.delete(id);
    invalidateBulkPreview636();if(currentEntry)render(currentEntry.products||[]);
  }
  async function previewBulk636(){
    if(bulkBusy636||bulkBlocked636||!bulkSelection636.size)return;
    const ids=[...bulkSelection636.keys()],changes=selectedChanges636();
    if(!changes.product_category&&!changes.review_status){bulkMessage636('Choose a category or review state before previewing. Nothing was saved.','warn');return;}
    invalidateBulkPreview636('Loading a fresh, read-only preview of these draft Products…');setBulkBusy636(true);
    try{
      const response=await window.DDAuth.apiFetch('/api/admin/product-bulk-draft',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'preview',product_ids:ids,changes}),cache:'no-store'});
      const data=await readJson(response);
      if(data.action!=='preview'||!Array.isArray(data.products)||data.products.length!==ids.length)throw new Error('The draft preview was incomplete. Nothing was saved.');
      bulkPreview636={ids,input:changes,changes:data.changes,snapshots:data.products.map(row=>row.snapshot),previewed_at:data.previewed_at};
      if(bulkRows636)bulkRows636.innerHTML=`<table><thead><tr><th>Product</th><th>Saved now</th><th>Proposed draft</th></tr></thead><tbody>${data.products.map(row=>`<tr>
        <td><strong>${esc(row.name||'Product')}</strong><div class="small">#${Number(row.product_id||0)} · ${esc(row.sku||'No SKU')}</div></td>
        <td>Category: ${esc(row.before?.product_category||'Unassigned')}<div>Review: ${esc(row.before?.review_status||'Unset')}</div></td>
        <td>Category: ${esc(row.after?.product_category||'Unassigned')}<div>Review: ${esc(row.after?.review_status||'Unset')}</div><div class="small">Status remains draft</div></td></tr>`).join('')}</tbody></table>`;
      if(bulkOwnerConfirmed636){bulkOwnerConfirmed636.checked=false;bulkOwnerConfirmed636.disabled=false;}
      bulkMessage636(`Preview ready for ${ids.length} saved draft Product${ids.length===1?'':'s'}. Nothing has been written. Review every row, then acknowledge deliberately.`,'ok');
    }catch(error){invalidateBulkPreview636(`${error.message||'Preview unavailable.'} No Product was saved.`);}
    finally{setBulkBusy636(false);}
  }
  async function applyBulk636(){
    if(bulkBusy636||bulkBlocked636||!bulkPreview636||!bulkOwnerConfirmed636?.checked)return;
    const preview=bulkPreview636;
    if(JSON.stringify([...bulkSelection636.keys()])!==JSON.stringify(preview.ids)||
      JSON.stringify(selectedChanges636())!==JSON.stringify(preview.input)){
      invalidateBulkPreview636('The proposal changed. Review the exact saved Product values again.');return;
    }
    setBulkBusy636(true);bulkMessage636('Saving only the owner-reviewed draft category/review changes once…','warn');
    try{
      const response=await window.DDAuth.apiFetch('/api/admin/product-bulk-draft',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'apply',product_ids:preview.ids,changes:preview.changes,snapshots:preview.snapshots,previewed_at:preview.previewed_at,
          owner_confirmed:true,acknowledgement:'I REVIEWED ALL DRAFT CHANGES'}),cache:'no-store'});
      const data=await readJson(response);
      if(data.action!=='apply'||data.confirmed!==true||Number(data.updated_count)!==preview.ids.length)
        throw new Error('Bulk save could not be confirmed. Reload original Products before another attempt.');
      pageCache.clear();bulkSelection636.clear();bulkPreview636=null;
      if(bulkOwnerConfirmed636){bulkOwnerConfirmed636.checked=false;bulkOwnerConfirmed636.disabled=true;}
      if(bulkRows636)bulkRows636.textContent='Saved draft fields confirmed. Press Refresh to verify the original Product rows.';
      bulkMessage636(`Saved ✓ ${Number(data.updated_count)} draft Product${data.updated_count===1?'':'s'} confirmed. Prices, stock, images and external destinations were unchanged. Press Refresh for live Product rows.`,'ok');
      if(currentEntry)render(currentEntry.products||[]);
    }catch(error){
      // Unknown write outcome is never retried. Require a deliberate fresh
      // Product read and a complete new selection/preview before another POST.
      bulkBlocked636=true;bulkSelection636.clear();invalidateBulkPreview636(`HOLD — ${error.message||'Save outcome unconfirmed.'} Press Refresh and review saved Products before any new attempt.`);
    }finally{setBulkBusy636(false);}
  }
  bulkCategory636?.addEventListener('change',()=>invalidateBulkPreview636());
  bulkReview636?.addEventListener('change',()=>invalidateBulkPreview636());
  bulkOwnerConfirmed636?.addEventListener('change',syncBulkControls636);
  bulkPreviewButton636?.addEventListener('click',()=>void previewBulk636());
  bulkApplyButton636?.addEventListener('click',()=>void applyBulk636());
  document.getElementById('dd636Clear')?.addEventListener('click',()=>{
    if(bulkBusy636)return;bulkSelection636.clear();invalidateBulkPreview636('Selection cleared. Nothing was saved.');
    if(currentEntry)render(currentEntry.products||[]);
  });
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
    const seed={product_id:id,product_number:product.product_number??null,name:product.name||'',slug:product.slug||'',sku:product.sku||'',status:product.status||'',review_status:product.review_status||'',price_cents:Number(product.price_cents||0),currency:product.currency||'CAD',inventory_tracking:Number(product.inventory_tracking||0),inventory_quantity:Number(product.inventory_quantity||0),featured_image_url:product.featured_image_url||'',updated_at:product.updated_at||'',captured_at:Date.now(),source:'product-browser-v170'};
    try{sessionStorage.setItem(`dnd:product-editor-seed:${id}`,JSON.stringify(seed));}catch{}
  }
  function armImages(){
    body.querySelectorAll('img[data-product-image-candidates]').forEach((img)=>{
      let candidates=[];try{candidates=JSON.parse(img.dataset.productImageCandidates||'[]');}catch{}
      let index=0;const use=()=>{img.src=candidates[index]||'/assets/product-image-recovery-placeholder.svg';};
      img.onerror=()=>{if(index<candidates.length-1){index+=1;use();}};use();
    });
  }
  function render(products){
    if(!products.length){body.innerHTML='<tr><td colspan="4" class="dd-empty">No Products match these filters on this page. Clear filters or try another search.</td></tr>';return;}
    const byId=new Map(products.map((p)=>[Number(p.product_id||0),p]));
    body.innerHTML=products.map((p)=>{
      const id=Number(p.product_id||0);const recovery=imageRecoveryState.get(id)||{status:'idle',image:null};const recovered=recovery.image||{};const featured=String(p.featured_image_url||'').trim();const fallback=featured?'':String(recovered.image_url||'').trim();const candidates=mediaCandidates(featured,fallback);
      const edit=`/admin/product-editor/?product_id=${encodeURIComponent(id)}`;const media=`/admin/catalog-media/?product_id=${encodeURIComponent(id)}`;const publicLink=p.slug?`/shop/product/?slug=${encodeURIComponent(p.slug)}`:'';
      const stock=Number(p.inventory_tracking||0)===1?String(Number(p.inventory_quantity||0)):'not tracked';
      let source='';let photoAction='';
      if(!featured){
        if(recovery.status==='loading'){source='Checking this Product only…';photoAction='<button class="btn" type="button" disabled>Loading photo…</button>';}
        else if(recovery.status==='done'&&fallback){source=`photo: ${esc(recovered.source||'recovered reference')}`;}
        else if(recovery.status==='done'){source='No fallback photo found. Use Images to add one.';}
        else {source=recovery.status==='error'?'Photo recovery failed; explicit retry is available.':'No featured image loaded. Secondary photo lookup is idle.';photoAction=`<button class="btn" type="button" data-recover-photo-id="${id}">${recovery.status==='error'?'Retry photo':'Recover photo'}</button>`;}
      }
      const photoReady=Boolean(featured);
      const photoLabel=photoReady?'Featured photo set':'Featured photo missing';
      return `<tr data-product-id="${id}">
        <td class="dd-product-image-cell"><img class="dd-product-thumb" loading="lazy" data-product-image-candidates='${esc(JSON.stringify(candidates))}' alt="${esc(p.name||'Product image')}"></td>
        <td><strong>${esc(p.name||`Product #${id}`)}</strong><div class="small">#${id}${p.product_number?` • No. ${esc(p.product_number)}`:''}${p.sku?` • ${esc(p.sku)}`:''}${p.product_category?` • ${esc(p.product_category)}`:''}</div><div class="dd-product-meta"><span>${esc(p.status||'draft')}</span><span>${esc(p.review_status||'pending')}</span></div><label class="dd636-bulk-choose"><input type="checkbox" data-dd636-select-id="${id}" data-dd636-eligible="${String(p.status||'').toLowerCase()==='draft'?'true':'false'}" ${String(p.status||'').toLowerCase()==='draft'?'':'disabled'} ${bulkSelection636.has(id)?'checked':''}/> ${String(p.status||'').toLowerCase()==='draft'?'Select draft for bulk review':'Not draft — bulk edit unavailable'}</label><div class="dd635-photo-label" data-ready="${photoReady?'set':'missing'}">${photoLabel}</div><div class="dd635-photo-note">Alt text / image rights: not checked in this list.</div><div class="small dd-product-photo-source">${source}</div></td>
        <td><strong>${money(p.price_cents,p.currency)}</strong><div class="small">Stock: ${esc(stock)}</div></td>
        <td class="dd-product-actions"><a class="btn" data-product-edit-id="${id}" href="${edit}">Edit</a><a class="btn" href="${media}">Images</a>${photoAction}${publicLink?`<a class="btn" href="${publicLink}" target="_blank" rel="noopener">View</a>`:''}</td>
      </tr>`;
    }).join('');
    body.querySelectorAll('[data-product-edit-id]').forEach((link)=>link.addEventListener('click',()=>rememberEditorSeed(byId.get(Number(link.dataset.productEditId||0)))));
    body.querySelectorAll('[data-recover-photo-id]').forEach((button)=>button.addEventListener('click',()=>recoverPhoto(Number(button.dataset.recoverPhotoId||0))));
    body.querySelectorAll('[data-dd636-select-id]').forEach((checkbox)=>checkbox.addEventListener('change',()=>{
      selectBulk636(byId.get(Number(checkbox.dataset.dd636SelectId||0)),checkbox.checked);
    }));
    armImages();
    syncBulkControls636();
  }
  async function readJson(response){const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok){const error=new Error(data?.error||`Product Browser request failed (${response.status}).`);error.code=data?.code||'';error.status=response.status;throw error;}return data;}
  async function recoverPhoto(productId){
    if(!Number.isInteger(productId)||productId<=0)return;const prior=imageRecoveryState.get(productId)||{};if(prior.status==='loading')return;
    imageRecoveryState.set(productId,{status:'loading',image:null});if(currentEntry)render(currentEntry.products||[]);setStatus(`Recovering one fallback photo for Product #${productId}…`);
    try{
      const response=await window.DDAuth.apiFetch('/api/admin/product-browser-images',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_ids:[productId],featured_missing_only:true,operator_triggered:true}),cache:'no-store'});
      const data=await readJson(response);const image=data.images_by_product?.[productId]||data.images_by_product?.[String(productId)]||null;imageRecoveryState.set(productId,{status:'done',image});
      setStatus(image?`Fallback photo recovered for Product #${productId} from ${image.source||'existing Product media'}. D1 rows read: ${Number(data.d1_rows_read||0)}.`:`No fallback photo was found for Product #${productId}. No automatic retry will run. D1 rows read: ${Number(data.d1_rows_read||0)}.`,'ok');
    }catch(error){imageRecoveryState.set(productId,{status:'error',image:null});setStatus(`${error?.message||'Could not recover Product photo.'} No automatic retry will run.`,'error');}
    finally{if(currentEntry)render(currentEntry.products||[]);}
  }
  function applyPage(entry,{fromCache=false}={}){
    currentEntry=entry;cursor=entry.cursor||null;nextCursor=entry.nextCursor||null;render(entry.products||[]);
    const rows=Number(entry.rows||0);const missing=(entry.products||[]).filter((p)=>!String(p?.featured_image_url||'').trim()).length;
    const context=`Sort: ${sortLabels[sortValue()]||'newest Product first'}${categoryValue()?`; category: ${categoryValue()}`:''}${photoValue()==='featured-missing'?'; missing featured photos only':''}. ${missing} visible Product${missing===1?'':'s'} lack a featured image. Gallery alt text and image rights are not checked.`;
    setStatus(fromCache?`${entry.products.length} Product${entry.products.length===1?'':'s'} reused from this browser session. D1 rows read: 0 for this navigation. ${context} Press Refresh for live authority.`:`${entry.products.length} Product${entry.products.length===1?'':'s'} loaded from one bounded Product query. Automatic secondary image recovery reads: 0. ${context} Use Recover photo only when needed.${Number.isFinite(rows)?` D1 rows read: ${rows}.`:''}`,'ok');
    pageLabel.textContent=`Page ${page} • ${entry.pageLimit} per page${fromCache?' • session reuse':''}`;
  }
  async function load({requestedCursor=cursor,remember=false,force=false}={}){
    if(inFlight||stoppedForQuota)return;
    const pageLimit=limit();const q=String(query.value||'').trim();const key=cacheKey(q,pageLimit,requestedCursor);
    if(!force&&pageCache.has(key)){
      if(remember)history.push(cursor);stoppedForQuota=false;applyPage(pageCache.get(key),{fromCache:true});next.disabled=!nextCursor;prev.disabled=history.length===0;refresh.disabled=false;if(pageSize)pageSize.disabled=false;return;
    }
    inFlight=true;next.disabled=true;prev.disabled=true;refresh.disabled=true;
    for(const control of [pageSize,category,sort,photos])if(control)control.disabled=true;
    setStatus('Loading one compact Product page…');
    try{
      const params=new URLSearchParams({limit:String(pageLimit),sort:sortValue(),photos:photoValue()});
      if(q)params.set('q',q);if(categoryValue())params.set('category',categoryValue());if(requestedCursor)params.set('cursor',String(requestedCursor));
      const response=await window.DDAuth.apiFetch(`/api/admin/product-browser?${params.toString()}`,{method:'GET',cache:'no-store'});
      const data=await readJson(response);const products=Array.isArray(data.products)?data.products:[];
      if(remember)history.push(cursor);
      const rows=Number.isFinite(Number(data.d1_rows_read))?Number(data.d1_rows_read):0;
      const entry={cursor:requestedCursor||null,nextCursor:data.next_cursor||null,products,rows,pageLimit};
      pageCache.set(key,entry);applyPage(entry);
    }catch(error){
      const quota=error?.code==='d1_read_capacity_unavailable'||error?.status===503&&/D1|read capacity|quota|rows/i.test(String(error?.message||''));
      if(quota){stoppedForQuota=true;setStatus(`${error.message} Automatic retries are stopped until we deliberately refresh after capacity returns.`,'error');}
      else setStatus(error?.message||'Could not load Products.','error');
      body.innerHTML='<tr><td colspan="4" class="dd-empty">Product Browser is unavailable. No automatic retry will run.</td></tr>';
    }finally{
      inFlight=false;next.disabled=stoppedForQuota||!nextCursor;prev.disabled=stoppedForQuota||history.length===0;refresh.disabled=stoppedForQuota;
      for(const control of [pageSize,category,sort,photos])if(control)control.disabled=stoppedForQuota;
    }
  }
  function resetAndLoad(){history.length=0;cursor=null;nextCursor=null;page=1;stoppedForQuota=false;load({requestedCursor:null});}
  form.addEventListener('submit',(event)=>{event.preventDefault();resetAndLoad();});
  next.addEventListener('click',()=>{if(!nextCursor)return;page+=1;load({requestedCursor:nextCursor,remember:true});});
  prev.addEventListener('click',()=>{if(!history.length)return;const prior=history.pop()??null;page=Math.max(1,page-1);stoppedForQuota=false;load({requestedCursor:prior});});
  refresh.addEventListener('click',()=>{
    stoppedForQuota=false;if(bulkBlocked636){bulkBlocked636=false;bulkSelection636.clear();invalidateBulkPreview636('Refreshed review authority. Select draft Products again before preparing a new change.');}
    const key=cacheKey(String(query.value||'').trim(),limit(),cursor);pageCache.delete(key);load({requestedCursor:cursor,force:true});
  });
  for(const input of [category,sort,photos])input?.addEventListener('change',resetAndLoad);
  clearFilters?.addEventListener('click',()=>{if(query)query.value='';if(category)category.value='';if(sort)sort.value='newest';if(photos)photos.value='all';resetAndLoad();query?.focus();});
  pageSize?.addEventListener('change',resetAndLoad);
  load({requestedCursor:null});
})();
