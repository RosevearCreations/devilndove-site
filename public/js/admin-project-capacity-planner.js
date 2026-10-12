// Release 467 Build 378 — safe cross-project workstation demand display.
document.addEventListener('DOMContentLoaded',()=>{
 const el=id=>document.getElementById(id),root=el('capacityMount');
 if(!root)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const search=el('capacitySearch'),filter=el('capacityFilter'),next=el('capacityNext'),previous=el('capacityPrevious');
 let data=null,cursors=[0],cursor=0;
 const link=id=>'/admin/creative-process/?project_id='+encodeURIComponent(id);
 function paint(){
  if(!data)return;
  const q=String(search?.value||'').trim().toLowerCase(),kind=filter?.value||'all';
  const projectName=id=>data.projects.find(p=>p.id===id)?.title||('Project '+id);
  const visible=data.workstations.filter(s=>{
   if(kind==='shared'&&!s.shared_demand)return false;
   if(kind==='used'&&!s.demand_project_ids.length)return false;
   return !q||(s.name+' '+s.process_name+' '+s.demand_project_ids.map(projectName).join(' ')).toLowerCase().includes(q);
  });
  root.innerHTML='<p><strong>'+Number(data.summary?.loaded_projects||0)+'</strong> loaded projects; <strong>'+Number(data.summary?.station_tools||0)+'</strong> active station tools; <strong>'+Number(data.summary?.shared_demand_stations||0)+'</strong> stations referenced by multiple projects.</p>'+
   '<p class="small">Availability: <strong>Not verified</strong>. No time-based bookings, machine occupancy, or free slots can be inferred from these sources. Filters search this loaded page only.</p>'+
   (Object.values(data.completeness||{}).some(Boolean)?'<p class="admin-error">Some source rows exceed this page\'s read limits. Results are incomplete; do not conclude a station is unused.</p>':'')+
   '<div class="admin-table-wrap"><table><thead><tr><th>Workstation tool</th><th>Referenced projects</th><th>Capacity signal</th><th>Inventory</th></tr></thead><tbody>'+
   (visible.map(s=>'<tr><td><strong>'+esc(s.name)+'</strong><div class="small">'+esc(s.process_name)+'</div></td><td>'+
    (s.demand_project_ids.map(id=>'<div><a href="'+esc(link(id))+'">'+esc(projectName(id))+'</a></div>').join('')||'No references on this page')+
    '</td><td>'+ (s.shared_demand?'<strong>Shared demand—coordinate use</strong>':(s.demand_project_ids.length?'Referenced':'No recorded reference on page'))+
    '<div class="small">Actual time availability unverified</div></td><td><a href="/admin/inventory-operations/">Review station</a></td></tr>').join('')||
    '<tr><td colspan="4">No matching workstation records on this page.</td></tr>')+'</tbody></table></div>'+
    '<h2>Project equipment requirements</h2><div class="admin-table-wrap"><table><thead><tr><th>Project</th><th>Station references</th><th>Equipment needing assignment</th><th>Open</th></tr></thead><tbody>'+
    (data.projects.map(p=>'<tr><td>'+esc(p.title)+'</td><td>'+p.workstation_ids.length+'</td><td>'+
      (p.unmapped_equipment.map(x=>esc(x.name)).join(', ')||'None in loaded requirements')+
      '</td><td><a href="'+esc(link(p.id))+'">Creative Process</a></td></tr>').join('')||
     '<tr><td colspan="4">No active projects on this page.</td></tr>')+'</tbody></table></div>';
  next.disabled=!data.has_more;previous.disabled=cursors.length<2;
 }
 async function load(reset=false){
  if(reset){cursors=[0];cursor=0;}
  root.textContent='Reading live source records…';
  if(!window.DDAuth?.apiFetch){root.textContent='Admin authentication helper unavailable.';return;}
  try{
   const r=await window.DDAuth.apiFetch('/api/admin/project-capacity-planner?cursor='+cursor+'&limit=20',{cache:'no-store'});
   if(!(r.headers.get('content-type')||'').includes('application/json'))throw new Error('Unexpected server response (HTTP '+r.status+')');
   const value=await r.json();if(!r.ok||!value?.ok)throw new Error(value?.error||'Capacity read unavailable');
   data=value;paint();
  }catch(e){data=null;root.textContent='Capacity data unavailable: '+(e.message||'Unknown error');next.disabled=true;previous.disabled=cursors.length<2;}
 }
 el('capacityRefresh')?.addEventListener('click',()=>load(true));
 search?.addEventListener('input',paint);filter?.addEventListener('change',paint);
 next?.addEventListener('click',()=>{if(!data?.has_more)return;cursors.push(data.next_cursor);cursor=data.next_cursor;load();});
 previous?.addEventListener('click',()=>{if(cursors.length<2)return;cursors.pop();cursor=cursors[cursors.length-1];load();});
 load();
});
