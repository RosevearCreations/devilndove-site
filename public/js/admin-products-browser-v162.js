// Release 467 Build 166 — compact Product Browser with bounded multi-source image recovery.
// Explicit operator reads only: initial page, Search, Next, Previous, Refresh. No timers.
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
  let cursor=null;
  let nextCursor=null;
  let page=1;
  let inFlight=false;
  let stoppedForQuota=false;

  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(ch)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
  const money=(cents,currency='CAD')=>{try{return new Intl.NumberFormat('en-CA',{style:'currency',currency:String(currency||'CAD')}).format(Number(cents||0)/100);}catch{return `$${(Number(cents||0)/100).toFixed(2)}`;}};
  const limit=()=>Math.max(1,Math.min(24,Number(pageSize?.value||8)||8));
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
  function armImages(){
    body.querySelectorAll('img[data-product-image-candidates]').forEach((img)=>{
      let candidates=[];try{candidates=JSON.parse(img.dataset.productImageCandidates||'[]');}catch{}
      let index=0;const use=()=>{img.src=candidates[index]||'/assets/product-image-recovery-placeholder.svg';};
      img.onerror=()=>{if(index<candidates.length-1){index+=1;use();}};use();
    });
  }
  function render(products,imageMap={}){
    if(!products.length){body.innerHTML='<tr><td colspan="4" class="dd-empty">No Products matched this page.</td></tr>';return;}
    body.innerHTML=products.map((p)=>{
      const id=Number(p.product_id||0);const recovered=imageMap[id]||{};const fallback=recovered.image_url||'';const candidates=mediaCandidates(p.featured_image_url,fallback);
      const edit=`/admin/product-editor/?product_id=${encodeURIComponent(id)}`;const media=`/admin/catalog-media/?product_id=${encodeURIComponent(id)}`;const publicLink=p.slug?`/shop/product/?slug=${encodeURIComponent(p.slug)}`:'';
      const stock=Number(p.inventory_tracking||0)===1?String(Number(p.inventory_quantity||0)):'not tracked';
      const source=recovered.source?` • photo: ${esc(recovered.source)}`:'';
      return `<tr data-product-id="${id}">
        <td class="dd-product-image-cell"><img class="dd-product-thumb" loading="lazy" data-product-image-candidates='${esc(JSON.stringify(candidates))}' alt="${esc(p.name||'Product image')}"></td>
        <td><strong>${esc(p.name||`Product #${id}`)}</strong><div class="small">#${id}${p.product_number?` • No. ${esc(p.product_number)}`:''}${p.sku?` • ${esc(p.sku)}`:''}</div><div class="dd-product-meta"><span>${esc(p.status||'draft')}</span><span>${esc(p.review_status||'pending')}</span></div><div class="small dd-product-photo-source">${source.replace(/^ • /,'')}</div></td>
        <td><strong>${money(p.price_cents,p.currency)}</strong><div class="small">Stock: ${esc(stock)}</div></td>
        <td class="dd-product-actions"><a class="btn" href="${edit}">Edit</a><a class="btn" href="${media}">Images</a>${publicLink?`<a class="btn" href="${publicLink}" target="_blank" rel="noopener">View</a>`:''}</td>
      </tr>`;
    }).join('');
    armImages();
  }
  async function readJson(response){const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok){const error=new Error(data?.error||`Product Browser request failed (${response.status}).`);error.code=data?.code||'';error.status=response.status;throw error;}return data;}
  async function loadImageMap(products){
    const ids=products.map((p)=>Number(p.product_id||0)).filter((id)=>id>0).slice(0,24);if(!ids.length)return {images_by_product:{},d1_rows_read:0};
    const response=await window.DDAuth.apiFetch('/api/admin/product-browser-images',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_ids:ids}),cache:'no-store'});
    return readJson(response);
  }
  async function load({requestedCursor=cursor,remember=false}={}){
    if(inFlight||stoppedForQuota)return;
    inFlight=true;next.disabled=true;prev.disabled=true;refresh.disabled=true;if(pageSize)pageSize.disabled=true;setStatus('Loading one compact Product page…');
    try{
      const pageLimit=limit();const params=new URLSearchParams({limit:String(pageLimit)});const q=String(query.value||'').trim();if(q)params.set('q',q);if(requestedCursor)params.set('cursor',String(requestedCursor));
      const response=await window.DDAuth.apiFetch(`/api/admin/product-browser?${params.toString()}`,{method:'GET',cache:'no-store'});
      const data=await readJson(response);const products=Array.isArray(data.products)?data.products:[];
      let imageData={images_by_product:{},d1_rows_read:0};
      try{imageData=await loadImageMap(products);}catch(imageError){if(imageError?.code==='d1_read_capacity_unavailable')throw imageError;}
      if(remember)history.push(cursor);cursor=requestedCursor||null;nextCursor=data.next_cursor||null;
      render(products,imageData.images_by_product||{});
      const rows=[data.d1_rows_read,imageData.d1_rows_read].filter((value)=>Number.isFinite(Number(value))).reduce((sum,value)=>sum+Number(value),0);
      const recovered=Number(imageData.recovered_count||0);setStatus(`${products.length} Product${products.length===1?'':'s'} loaded. ${recovered} visible photo reference${recovered===1?'':'s'} resolved from existing Product media authority.${rows?` D1 rows read: ${rows}.`:''}`,'ok');
      pageLabel.textContent=`Page ${page} • ${pageLimit} per page`;
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
  prev.addEventListener('click',()=>{if(!history.length)return;const prior=history.pop()??null;page=Math.max(1,page-1);cursor=prior;stoppedForQuota=false;load({requestedCursor:prior});});
  refresh.addEventListener('click',()=>{stoppedForQuota=false;load({requestedCursor:cursor});});
  pageSize?.addEventListener('change',resetAndLoad);
  load({requestedCursor:null});
})();
