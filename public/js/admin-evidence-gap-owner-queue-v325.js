// Release 467 Build 325 — read-only Evidence Gap Owner Queue.
document.addEventListener('DOMContentLoaded',()=>{
 const mount=document.getElementById('evidenceGapOwnerQueueMount');if(!mount||!window.DDAuth)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
 const label=v=>String(v||'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,m=>m.toUpperCase());
 const when=v=>String(v||'').trim()||'No recorded operator activity yet';
 async function load(){
  mount.innerHTML='<section class="card"><p class="small">Loading current evidence gaps and source traceability…</p></section>';
  try{
   const r=await window.DDAuth.apiFetch('/api/admin/evidence-gap-owner-queue',{cache:'no-store'}),d=await r.json();
   if(!r.ok||!d.ok)throw new Error(d.error||'Evidence Gap Owner Queue failed.');
   const q=Array.isArray(d.queue)?d.queue:[],sum=d.summary||{};
   const cards=q.map(x=>`<article class="card" style="min-width:0">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap"><div><p class="eyebrow">Priority ${Number(x.priority||0)} • ${esc(x.owner_label)}</p><h3 style="margin-top:0">${esc(x.target_title)}</h3></div><span class="admin-status-pill">${esc(label(x.current_state))}</span></div>
    <p><strong>Blocker:</strong> ${esc(x.blocker)}</p><p><strong>Next operator action:</strong> ${esc(x.action_text)}</p>
    <p class="small"><b>Trace:</b> ${esc(x.traceability_source)} • last observed: ${esc(when(x.last_observed_at))}</p>
    <p class="small"><b>Queue authority:</b> read-only • no user assignment • no acknowledgement/resolution persistence • queue state cannot mark source work complete.</p>
    <p><a class="btn" href="${esc(x.workspace_href)}">Open source workspace</a></p>
   </article>`).join('');
   mount.innerHTML=`<section class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><p class="eyebrow">Build 325 • derived queue</p><h2 style="margin-top:0">Current operator action routing</h2><p class="small">This is a view over existing factual authorities, not a second task system. Completion only occurs in the source workspace when real evidence/review state actually changes.</p></div><button class="btn" id="evidenceGapQueueReload" type="button">Reload</button></div>
    <div class="grid cols-3" style="gap:12px"><div><strong>${Number(sum.active_queue_rows||0)}</strong><div class="small">Active queue rows</div></div><div><strong>${Number(sum.active_gap_families||0)}</strong><div class="small">Gap families</div></div><div><strong>${Number(sum.unprofiled_projects||0)}</strong><div class="small">Unprofiled projects</div></div></div>
    <p class="small"><strong>Permanent boundary:</strong> no owner assignment persistence, no queue acknowledgement persistence, no automatic evidence/story/publication/SEO/provider action.</p></section>
    <section class="grid cols-2" style="gap:14px;margin-top:14px">${cards||'<article class="card"><h3>No current evidence gaps</h3><p class="small">No queue rows were derived from the current source authorities.</p></article>'}</section>`;
   document.getElementById('evidenceGapQueueReload')?.addEventListener('click',load);
  }catch(e){mount.innerHTML=`<section class="card"><p class="error">${esc(e.message)}</p><button class="btn" id="evidenceGapQueueReload" type="button">Retry</button></section>`;document.getElementById('evidenceGapQueueReload')?.addEventListener('click',load);}
 }
 load();
});
