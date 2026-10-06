// BUILD361_CURRENT_CLIENT: Release 467 Build 361 — Evidence Gap Execution Workbench & Input Completion Continuity VI.
// BUILD355_CURRENT_CLIENT: Release 467 Build 355 — Evidence Gap Execution Workbench & Input Completion Continuity V.
// HISTORICAL_BUILD337_CLIENT: Build 337 retained filename/provenance for regression compatibility.
// BUILD349_CURRENT_CLIENT: Release 467 Build 349 — Evidence Gap Execution Workbench & Input Completion Continuity IV.
// BUILD343_CURRENT_CLIENT: retained historical provenance.
// Release 467 Build 343 — read-only Evidence Gap Execution Workbench.
document.addEventListener('DOMContentLoaded',()=>{
 const mount=document.getElementById('evidenceGapExecutionWorkbenchMount');if(!mount||!window.DDAuth)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
 const label=v=>String(v||'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,m=>m.toUpperCase());
 const obs=o=>Object.entries(o||{}).map(([k,v])=>'<li><strong>'+esc(label(k))+':</strong> '+esc(v===''?'—':v)+'</li>').join('');
 async function load(){
  mount.innerHTML='<section class="card"><p class="small">Loading current evidence gaps, required inputs and source actions…</p></section>';
  try{
   const r=await window.DDAuth.apiFetch('/api/admin/evidence-gap-execution-workbench',{cache:'no-store'}),d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||'Execution workbench failed.');
   const q=Array.isArray(d.workbench)?d.workbench:[],sum=d.summary||{};
   const cards=q.map(x=>'<article class="card" style="min-width:0"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap"><div><p class="eyebrow">Priority '+Number(x.priority||0)+' • '+esc(label(x.gap_family))+'</p><h3 style="margin-top:0">'+esc(x.target_title)+'</h3></div><span class="admin-status-pill">'+esc(label(x.current_state))+'</span></div><p><strong>Required inputs</strong></p><ul>'+((x.required_inputs||[]).map(v=>'<li>'+esc(v)+'</li>').join(''))+'</ul><p><strong>Observed completion</strong></p><ul>'+obs(x.observed_completion)+'</ul><p><strong>Completion signal:</strong> '+esc(x.completion_signal)+'</p><p><strong>Next safe human action:</strong> '+esc(x.next_safe_human_action)+'</p><p class="small"><strong>Source authority:</strong> '+esc(x.source_authority)+'</p><p><a class="btn" href="'+esc(x.workspace_href)+'">Open authoritative workspace</a></p></article>').join('');
   mount.innerHTML='<section class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><p class="eyebrow">Build 361 • renewed source-authority execution view</p><h2 style="margin-top:0">Input completion workbench</h2><p class="small">This workbench tells you what is missing and where to do the real work. It cannot assign, acknowledge, resolve or complete a blocker itself.</p></div><button class="btn" id="evidenceGapExecutionReload" type="button">Reload</button></div><div class="grid cols-3" style="gap:12px"><div><strong>'+Number(sum.active_workbench_rows||0)+'</strong><div class="small">Open workbench rows</div></div><div><strong>'+Number(sum.active_gap_families||0)+'</strong><div class="small">Gap families</div></div><div><strong>'+Number(sum.unprofiled_projects||0)+'</strong><div class="small">Unprofiled projects</div></div></div><p class="small"><strong>Boundary:</strong> source workspaces remain authoritative; no shadow task table, completion flag, story approval, Search Console fabrication, SEO apply or provider execution.</p></section><section class="grid cols-2" style="gap:14px;margin-top:14px">'+(cards||'<article class="card"><h3>No current evidence gaps</h3><p class="small">All derived blockers are presently clear; source authorities remain the factual record.</p></article>')+'</section>';
   document.getElementById('evidenceGapExecutionReload')?.addEventListener('click',load);
  }catch(e){mount.innerHTML='<section class="card"><p class="error">'+esc(e.message)+'</p><button class="btn" id="evidenceGapExecutionReload" type="button">Retry</button></section>';document.getElementById('evidenceGapExecutionReload')?.addEventListener('click',load);}
 }load();
});
