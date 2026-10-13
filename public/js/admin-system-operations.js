// Build 384 — passive bounded snapshot, does not authorize database writes.
document.addEventListener('DOMContentLoaded',()=>{
 const $=id=>document.getElementById(id),mount=$('opsMount'),status=$('opsStatus'),refresh=$('opsRefresh');
 if(!mount||!status||!refresh)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const pairs={
  projects:[['Projects observed','sample_count'],['Active','active'],['Archived','archived']],
  custom_requests:[['Requests observed','sample_count'],['Pending review','pending_review'],['Accepted','accepted']],
  work:[['Work events','sample_count'],['Time entries','time_entries'],['Minutes recorded','work_minutes'],['Milestones','milestones']],
  materials:[['Reservations observed','reservation_rows'],['Open reservations','open_reservations'],['Unreleased stock units (mixed units)','unreleased_stock_units']],
  calendar:[['Calendar events','sample_count'],['Active','active_events'],['Maintenance holds','maintenance_holds'],['Explicit overrides','overrides']],
  customer_review:[['Commission review events','sample_count'],['Progress approvals','customer_progress_approvals']],
  finance_reviews:[['Financial review events','sample_count'],['Source verified reviews','source_verified'],['Need reconciliation','needs_reconciliation']]
 };
 const labels={projects:'Creative projects',custom_requests:'Customer requests',work:'Work orders and time',materials:'Material reservations',calendar:'Production calendar',customer_review:'Commission decisions',finance_reviews:'Finance review'};
 const limits={customer_review:'commission',finance_reviews:'finance',custom_requests:'requests'};
 async function load(){
  refresh.disabled=true;refresh.textContent='Checking…';status.textContent='Reading canonical sources…';
  try{
   const response=await (window.DDAuth?.apiFetch?window.DDAuth.apiFetch('/api/admin/system-operations-analytics',{cache:'no-store'}):fetch('/api/admin/system-operations-analytics',{credentials:'same-origin',cache:'no-store'}));
   const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'Read failed');
   mount.innerHTML='<h2>Observed operational sample</h2><p>Snapshot: '+esc(data.snapshot_at)+'. Each module: newest 100 source records maximum. '+(data.any_truncated?'Some modules are truncated.':'No sampled module reached the truncation threshold.')+'</p>'+
    Object.entries(pairs).map(([k,metrics])=>{const src=limits[k]||k;const count=data.sample_limits[src]||{};return '<section class="card" style="margin:12px 0"><h3>'+esc(labels[k])+(count.truncated?' — 100-row sample only':'')+'</h3><dl>'+
     metrics.map(([label,name])=>'<div style="display:flex;justify-content:space-between;gap:12px;padding:3px 0"><dt>'+esc(label)+'</dt><dd>'+esc(data.modules[k]?.[name]??'Unknown')+'</dd></div>').join('')+'</dl></section>'}).join('');
   status.textContent='OK — bounded system report refreshed (read only).';
  }catch(e){mount.textContent='No reliable report available.';status.textContent='Unable to confirm report: '+e.message;}
  finally{refresh.disabled=false;refresh.textContent='Refresh bounded report';}
 }
 const receiptButton=$('receiptCheck');
 if(receiptButton)receiptButton.addEventListener('click',async()=>{
  const scope=$('receiptScope')?.value||'',key=($('receiptKey')?.value||'').trim(),result=$('receiptResult');
  if(!/^[A-Za-z0-9_-]{16,80}$/.test(key)){result.textContent='Enter the original 16–80 character request key.';return;}
  receiptButton.disabled=true;receiptButton.textContent='Checking…';result.textContent='Reading this administrator\'s committed receipt…';
  try{
   const url='/api/admin/write-operation-receipt?scope='+encodeURIComponent(scope)+'&request_key='+encodeURIComponent(key);
   const r=await (window.DDAuth?.apiFetch?window.DDAuth.apiFetch(url,{cache:'no-store'}):fetch(url,{credentials:'same-origin',cache:'no-store'}));
   const v=await r.json();if(!r.ok||!v.ok)throw Error(v.error||'Receipt check failed');
   result.textContent=v.found?'OK — committed receipt #'+v.receipt_id+' (source record #'+v.source_record_id+') at '+v.committed_at+'. Do not repeat the write.':
    'No committed receipt found for this user. The outcome may still be uncertain; inspect the original source before retrying.';
  }catch(e){result.textContent='Receipt status unknown: '+e.message+'. Do not blindly retry.';}
  finally{receiptButton.disabled=false;receiptButton.textContent='Check original receipt';}
 });
 refresh.addEventListener('click',load);load();
});
