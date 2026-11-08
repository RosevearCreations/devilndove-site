// Release 467 Build 398: no automatic fetches or observers on the admin home.
(()=>{'use strict';
 const button=document.getElementById('admin398LoadSnapshot');
 const status=document.getElementById('admin398SnapshotStatus');
 const mount=document.getElementById('admin398SnapshotMount');
 if(!button||!status||!mount)return;
 // Build 631: static, keyboard-accessible workspace finder; zero storage/API reads.
 const search=document.getElementById('dd631WorkspaceSearch');
 const clear=document.getElementById('dd631WorkspaceClear');
 const count=document.getElementById('dd631WorkspaceCount');
 const cards=[...document.querySelectorAll('#ddBrandV3AdminWorkspaces > a.dd-brand-v3-admin-card')];
 if(search&&clear&&count&&cards.length){
  const normalize=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const entries=cards.map(card=>({card,words:normalize([card.querySelector('strong')?.textContent,
   card.querySelector('small')?.textContent].join(' '))}));
  function filter(){
   const terms=normalize(search.value).trim().split(/\s+/).filter(Boolean);
   let visible=0;
   for(const entry of entries){entry.card.hidden=!terms.every(term=>entry.words.includes(term));
    if(!entry.card.hidden)visible++;}
   count.textContent=visible?`Showing ${visible} of ${entries.length} workspaces.`:
    'No matching workspace. Try Product, Orders, Maker or System.';
   clear.disabled=!search.value;
  }
  search.addEventListener('input',filter);
  clear.addEventListener('click',()=>{search.value='';filter();search.focus();});
  search.addEventListener('keydown',event=>{
   if(event.key==='Escape'){search.value='';filter();event.preventDefault();}
   else if(event.key==='Enter'&&search.value.trim()){
    const first=entries.find(entry=>!entry.card.hidden);
    if(first){first.card.focus();event.preventDefault();}
   }
  });
  document.addEventListener('keydown',event=>{
   const active=document.activeElement;
   if(event.key!=='/'||event.altKey||event.ctrlKey||event.metaKey||
      active?.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(active?.tagName||''))return;
   event.preventDefault();search.focus();
  });
  window.addEventListener('pageshow',filter);
  filter();
 }
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
