// PROJECT_DISCOVERY_PORTFOLIO — Release 467 Build 376; cross-project read-only, not a Grey Hair-only workflow.
document.addEventListener('DOMContentLoaded',()=>{
 const mount=document.getElementById('projectDiscoveryMount'),reload=document.getElementById('projectDiscoveryRefresh');
 if(!mount)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
 const num=v=>Number(v||0).toLocaleString();
 const flag=(v)=>v?'Present':'Not yet';
 async function load(){
  if(!window.DDAuth?.apiFetch){mount.innerHTML='<section class="card"><p class="admin-error">Admin authentication helper is unavailable.</p></section>';return;}
  mount.innerHTML='<section class="card"><p>Loading all active projects and real Search Console freshness…</p></section>';
  try{
   const r=await window.DDAuth.apiFetch('/api/admin/project-discovery-overview',{cache:'no-store'});
   if(!(r.headers.get('content-type')||'').toLowerCase().includes('application/json'))throw new Error('Portfolio endpoint returned HTTP '+r.status+' instead of JSON. Check Cloudflare Worker logs.');
   const d=await r.json();if(!r.ok||!d?.ok)throw new Error(d?.error||'Portfolio request failed.');
   const p=d.portfolio||{},s=d.discovery||{},projects=Array.isArray(p.projects)?p.projects:[];
   mount.innerHTML=`<section class="card"><h2>Creative Process portfolio — all active projects</h2>
    <p class="small">One system for every project. Workstation, content, inventory and evidence steps remain in their authoritative workspaces; this overview is read-only.</p>
    <div class="grid cols-3"><div><strong>${num(p.total_active_projects)}</strong><small> active projects</small></div>
    <div><strong>${num(p.profiled_in_loaded_projects)}</strong><small> Maker Story profiles (loaded)</small></div>
    <div><strong>${num(p.projects_with_caip)}</strong><small> projects with CAIP workspace</small></div></div>
    ${p.has_more?'<p class="admin-error">Showing first 100 projects only. Use Creative Process for the remainder.</p>':''}
    <div class="admin-table-wrap" style="margin-top:16px"><table><thead><tr><th>Project</th><th>Status</th><th>Events</th><th>Selected evidence</th><th>Maker Story</th><th>CAIP</th><th>Workspace</th></tr></thead><tbody>
    ${projects.map(x=>`<tr><td><strong>${esc(x.project_title)}</strong><div class="small">${esc(x.project_key)}</div></td><td>${esc(x.project_status)}</td>
    <td>${num(x.active_events)}</td><td>${num(x.selected_evidence_rows)}</td>
    <td>${esc(flag(x.maker_story_profiles>0))}${x.story_review_status?' • '+esc(x.story_review_status):''}</td>
    <td>${esc(flag(x.caip_workspaces>0))}</td><td><a href="/admin/creative-process/?project_id=${encodeURIComponent(x.creative_work_project_id)}">Open project</a></td></tr>`).join('')||'<tr><td colspan="7">No active projects yet.</td></tr>'}
    </tbody></table></div></section>
    <section class="card"><h2>Real discovery evidence — across the storefront</h2>
    <p class="small">Only user-confirmed Google Search Console Performance exports with real report dates qualify. This is not a claim that an import has occurred.</p>
    <div class="grid cols-3"><div><strong>${num(s.total_rows)}</strong><small> imported search rows</small></div><div><strong>${num(s.recent_rows)}</strong><small> rows within 30 days</small></div><div><strong>${num(s.recent_impressions)}</strong><small> recent impressions</small></div></div>
    <p><strong>Latest report date:</strong> ${esc(s.latest_report_date||'No real report recorded')}</p>
    <p><strong>Evidence:</strong> ${s.actionable?'Recent factual Search Console rows are available for human review.':'No fresh factual search evidence to justify automatic SEO action.'}</p>
    <div class="button-row"><a class="btn secondary" href="/admin/release-control/runtime-storefront-intelligence/">Open Search Console intake &amp; discovery review</a>
    <a class="btn secondary" href="/admin/evidence-gap-execution-workbench/">Open cross-project evidence workbench</a>
    <a class="btn secondary" href="/admin/creative-process/">Manage all projects</a></div></section>`;
  }catch(e){mount.innerHTML='<section class="card"><p class="admin-error">'+esc(e.message||'Portfolio unavailable')+'</p></section>';}
 }
 reload?.addEventListener('click',load);load();
});
