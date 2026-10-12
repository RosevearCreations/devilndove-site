// BUILD377_PROJECT_ROUTING: Reusable workflow and evidence view, no mutation, user-triggered refresh only.
document.addEventListener('DOMContentLoaded',()=>{
 const root=document.getElementById('projectWorkflowMount'),refresh=document.getElementById('projectWorkflowRefresh'),search=document.getElementById('projectWorkflowSearch'),filter=document.getElementById('projectWorkflowFilter'),next=document.getElementById('projectWorkflowNext'),previous=document.getElementById('projectWorkflowPrevious');
 if(!root)return;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let rows=[],history=[0],cursor=0,nextCursor=null,loaded=false;
 const match=x=>{
  const q=String(search?.value||'').toLowerCase().trim(),kind=filter?.value||'all';
  if(q&&!((x.project_title+' '+x.project_key).toLowerCase().includes(q)))return false;
  if(kind==='needs_source'&&x.caip_workspaces>0&&x.active_events>0&&x.selected_evidence_rows>0)return false;
  if(kind==='needs_profile'&&x.maker_story_profiles>0)return false;
  if(kind==='human_review'&&x.maker_story_profiles===0)return false;
  return true;
 };
 function draw(){
  const visible=rows.filter(match);
  root.innerHTML='<p class="small">Routing uses existing Creative Process and CAIP records, not synthetic tasks. '+esc(visible.length)+' shown on this page. Search and filters apply to the loaded page only.</p>'+
   '<div class="admin-table-wrap"><table><thead><tr><th>Project</th><th>Observed evidence</th><th>Next safe step</th><th>Source</th></tr></thead><tbody>'+
   (visible.map(x=>'<tr><td><strong>'+esc(x.project_title)+'</strong><div class="small">'+esc(x.project_key)+'</div></td>'+
    '<td>Events: '+Number(x.active_events)+'; Selected: '+Number(x.selected_evidence_rows)+'; CAIP: '+Number(x.caip_workspaces)+'; Maker Story: '+Number(x.maker_story_profiles)+
    '<div class="small">'+esc(x.story_review_status||'No reviewed story')+'</div></td>'+
    '<td><strong>'+esc(x.next_action?.action||'Human review required')+'</strong><div class="small">'+
    esc((x.source_steps||[]).filter(s=>!s.complete).map(s=>s.code.replaceAll('_',' ')).join(' • ')||'Review rights and human publication decision separately')+
    '</div></td><td><a href="'+esc(x.workspace)+'">Open project</a></td></tr>').join('')||
    '<tr><td colspan="4">No matching projects on this page.</td></tr>')+'</tbody></table></div>';
  if(previous)previous.disabled=history.length<2;
  if(next)next.disabled=!nextCursor;
 }
 async function load(reset=false){
  if(reset){history=[0];cursor=0;}
  root.textContent='Loading current workflow state…';loaded=false;
  if(!window.DDAuth?.apiFetch){root.textContent='Admin authentication helper unavailable.';return;}
  try{
   const r=await window.DDAuth.apiFetch('/api/admin/project-workflow-routing?cursor='+cursor+'&limit=25',{cache:'no-store'});
   if(!(r.headers.get('content-type')||'').toLowerCase().includes('application/json'))throw new Error('Worker returned non-JSON response (HTTP '+r.status+')');
   const d=await r.json();if(!r.ok||!d?.ok)throw new Error(d?.error||'Routing unavailable');
   rows=Array.isArray(d.projects)?d.projects:[];nextCursor=d.has_more?d.next_cursor:null;loaded=true;draw();
  }catch(e){root.innerHTML='<p class="admin-error">'+esc(e.message||'Routing unavailable')+'</p>';}
 }
 refresh?.addEventListener('click',()=>load(true));search?.addEventListener('input',()=>{if(loaded)draw()});filter?.addEventListener('change',()=>{if(loaded)draw()});
 next?.addEventListener('click',()=>{if(nextCursor===null)return;history.push(nextCursor);cursor=nextCursor;load();});
 previous?.addEventListener('click',()=>{if(history.length<2)return;history.pop();cursor=history[history.length-1];load();});
 load();
});
