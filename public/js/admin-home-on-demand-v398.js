// Release 467 Build 398: no automatic fetches or observers on the admin home.
(()=>{'use strict';
 const button=document.getElementById('admin398LoadSnapshot');
 const status=document.getElementById('admin398SnapshotStatus');
 const mount=document.getElementById('admin398SnapshotMount');
 if(!button||!status||!mount)return;
 const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 button.addEventListener('click',async()=>{
  if(button.disabled)return;
  button.disabled=true;button.textContent='Loading bounded snapshot…';
  status.textContent='One read requested; no automatic retry or secondary provider reads.';
  const controller=new AbortController(),abort=setTimeout(()=>controller.abort(),8000);
  try{
   const res=await fetch('/api/admin/dashboard-summary?view=seller_daily',
    {method:'GET',credentials:'same-origin',cache:'no-store',signal:controller.signal});
   const json=await res.json().catch(()=>null);
   if(!res.ok||!json?.ok)throw Error(json?.error||('Snapshot unavailable: HTTP '+res.status));
   const data=json.summary||{};
   const fields=[['Orders',data.orders_count],['Low stock',data.low_stock_count],
     ['Visitors',data.active_visitor_sessions_count],['Failed webhooks',data.failed_webhooks_count]];
   mount.innerHTML='<div class="grid cols-2">'+fields.map(([label,value])=>
    '<article class="card"><strong>'+escape(label)+'</strong><p>'+escape(value??'—')+'</p></article>').join('')+'</div>';
   status.textContent='Snapshot loaded. No background reads are scheduled.';
  }catch(e){status.textContent='Snapshot not available: '+String(e?.message||'Timed out')+'. Navigation remains usable; no automatic retry.';}
  finally{clearTimeout(abort);button.disabled=false;button.textContent='Load current Seller snapshot';}
 });
})();