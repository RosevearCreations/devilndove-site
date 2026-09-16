// Release 467 Build 162 — Product Browser client.
// Explicit operator reads only: initial page, Search, Next, Previous, Refresh. No timers.
(() => {
  'use strict';
  const form=document.getElementById('productBrowserSearchForm');
  const query=document.getElementById('productBrowserQuery');
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
  function setStatus(message,tone=''){status.textContent=message;status.dataset.tone=tone;status.hidden=!message;}
  function imageUrl(raw){const value=String(raw||'').trim();if(!value)return '/assets/product-image-recovery-placeholder.svg';try{const url=new URL(value,location.origin);if(url.hostname==='assets.devilndove.com'||url.hostname.endsWith('.r2.dev')){const key=url.pathname.replace(/^\/+/, '');return `/api/product-media?key=${encodeURIComponent(key)}`;}return value;}catch{return '/assets/product-image-recovery-placeholder.svg';}}
  function render(products){
    if(!products.length){body.innerHTML='<tr><td colspan="9" class="dd-empty">No Products matched this page.</td></tr>';return;}
    body.innerHTML=products.map((p)=>{
      const id=Number(p.product_id||0);
      const edit=`/admin/product-editor/?product_id=${encodeURIComponent(id)}`;
      const publicLink=p.slug?`/shop/product/?slug=${encodeURIComponent(p.slug)}`:'';
      const stock=Number(p.inventory_tracking||0)===1?String(Number(p.inventory_quantity||0)):'Not tracked';
      return `<tr>
        <td><img class="dd-product-thumb" loading="lazy" src="${esc(imageUrl(p.featured_image_url))}" alt=""></td>
        <td><strong>${esc(p.name||`Product #${id}`)}</strong><div class="small">#${id}${p.product_number?` • No. ${esc(p.product_number)}`:''}</div></td>
        <td>${esc(p.sku||'—')}</td>
        <td><div class="dd-product-meta"><span>${esc(p.status||'draft')}</span><span>${esc(p.review_status||'pending')}</span></div></td>
        <td>${money(p.price_cents,p.currency)}</td>
        <td>${esc(stock)}</td>
        <td>${esc(p.updated_at||'—')}</td>
        <td class="dd-product-actions"><a class="btn" href="${edit}">Edit</a>${publicLink?`<a class="btn" href="${publicLink}" target="_blank" rel="noopener">View</a>`:''}</td>
      </tr>`;
    }).join('');
  }
  async function readJson(response){const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok){const error=new Error(data?.error||`Product Browser request failed (${response.status}).`);error.code=data?.code||'';error.status=response.status;throw error;}return data;}
  async function load({requestedCursor=cursor,remember=false}={}){
    if(inFlight||stoppedForQuota)return;
    inFlight=true;next.disabled=true;prev.disabled=true;refresh.disabled=true;setStatus('Loading one bounded Product page…');
    try{
      const params=new URLSearchParams({limit:'40'});const q=String(query.value||'').trim();if(q)params.set('q',q);if(requestedCursor)params.set('cursor',String(requestedCursor));
      const response=await window.DDAuth.apiFetch(`/api/admin/products-browser?${params.toString()}`,{method:'GET',cache:'no-store'});
      const data=await readJson(response);
      if(remember)history.push(cursor);
      cursor=requestedCursor||null;nextCursor=data.next_cursor||null;
      render(Array.isArray(data.products)?data.products:[]);
      setStatus(`${data.products?.length||0} Product${data.products?.length===1?'':'s'} loaded. No readiness, media-library, inventory-resource or quality scans were run.`,'ok');
      pageLabel.textContent=`Page ${page}`;
    }catch(error){
      const quota=error?.code==='d1_read_capacity_unavailable'||error?.status===503&&/D1|read capacity|quota|rows/i.test(String(error?.message||''));
      if(quota){stoppedForQuota=true;setStatus(`${error.message} Automatic retries are stopped until we deliberately refresh after capacity returns.`,'error');}
      else setStatus(error?.message||'Could not load Products.','error');
      body.innerHTML='<tr><td colspan="9" class="dd-empty">Product Browser is unavailable. No automatic retry will run.</td></tr>';
    }finally{
      inFlight=false;next.disabled=stoppedForQuota||!nextCursor;prev.disabled=stoppedForQuota||history.length===0;refresh.disabled=stoppedForQuota;
    }
  }
  form.addEventListener('submit',(event)=>{event.preventDefault();history.length=0;cursor=null;nextCursor=null;page=1;stoppedForQuota=false;load({requestedCursor:null});});
  next.addEventListener('click',()=>{if(!nextCursor)return;page+=1;load({requestedCursor:nextCursor,remember:true});});
  prev.addEventListener('click',()=>{if(!history.length)return;const prior=history.pop()??null;page=Math.max(1,page-1);cursor=prior;stoppedForQuota=false;load({requestedCursor:prior});});
  refresh.addEventListener('click',()=>{stoppedForQuota=false;load({requestedCursor:cursor});});
  load({requestedCursor:null});
})();
