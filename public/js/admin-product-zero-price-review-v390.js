// Build390: explicit read-only zero-price review. No automatic background D1 reads or changes.
(()=>{'use strict';
const button=document.getElementById('productBrowser390PriceAudit'),container=document.getElementById('productBrowser390PriceAuditRows'),status=document.getElementById('productBrowser390PriceAuditStatus');
if(!button||!container||!status||!window.DDAuth)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
button.addEventListener('click',async()=>{
 if(button.disabled)return;button.disabled=true;button.textContent='Checking prices…';status.textContent='Reviewing 25 recent zero-priced Product rows (read-only)…';
 try{
  const response=await window.DDAuth.apiFetch('/api/admin/product-zero-price-review',{method:'GET',cache:'no-store'});
  const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw Error(data?.error||'Review failed');
  container.replaceChildren();
  if(!data.items.length){status.textContent='No zero-priced Products in the checked source rows.';return;}
  const table=document.createElement('table');table.className='dd-product-table';
  table.innerHTML='<thead><tr><th>Product</th><th>Price</th><th>Action</th></tr></thead><tbody>'+
   data.items.map(item=>'<tr><td>'+esc(item.name)+' <small>#'+Number(item.product_id)+' · '+esc(item.sku)+'</small></td>'+
   '<td>$0.00 — '+(item.drift_confirmed?'verified drift':'approved source required; not a confirmed price error')+'</td><td><button class="btn" type="button" data-price-source-product="'+Number(item.product_id)+'">Source review</button> <a class="btn" href="/admin/product-editor/?product_id='+Number(item.product_id)+'&tab=pricing">Review &amp; edit</a></td></tr>').join('')+'</tbody>';
  container.append(table);
  status.textContent=data.items.length+' zero-priced Products found'+(data.has_more?' (more may exist)':'')+'. This is a source-review queue, not a drift claim: a legitimate $0.00 price may be correct. Use independently approved original prices; no source value was inferred and none were changed.';
 }catch(error){status.textContent='Price review could not load: '+error.message;}
 finally{button.disabled=false;button.textContent='Refresh zero-priced Product review';}
});
})();
