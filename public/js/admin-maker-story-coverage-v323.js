// Release 467 Build 323 — read-only Maker Story coverage and publication readiness.
document.addEventListener('DOMContentLoaded',()=>{
  const mount=document.getElementById('makerStoryCoverageBuild323Mount');if(!mount||!window.DDAuth)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
  const label=v=>String(v||'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,m=>m.toUpperCase());
  async function load(){
    mount.innerHTML='<section class="card"><p class="small">Loading five-project readiness evidence…</p></section>';
    try{
      const r=await window.DDAuth.apiFetch('/api/admin/maker-story-coverage',{cache:'no-store'}),d=await r.json();
      if(!r.ok||!d.ok)throw new Error(d.error||'Maker Story coverage measurement failed.');
      const projects=d.projects||[],counts=d.readiness_counts||{};
      const cards=projects.map(p=>`<article class="card" style="min-width:0">
        <p class="eyebrow">${esc(p.project_key||('Project '+p.creative_work_project_id))}</p>
        <h3 style="margin-top:0">${esc(p.project_title||'Untitled project')}</h3>
        <p><strong>${esc(label(p.readiness_state))}</strong></p>
        <p class="small"><b>Identity:</b> CAIP ${Number(p.caip_workspaces||0)} • Content Studio ${Number(p.content_packages||0)} • Maker Story profile ${Number(p.maker_story_profiles||0)}</p>
        <p class="small"><b>Story facts:</b> review ${esc(p.story_review_status||'none')} • outcome ${esc(p.outcome_status||'none')} • public candidate ${Number(p.public_story_candidate||0)===1?'yes':'no'} • factual core ${Number(p.core_story_complete||0)>0?'complete':'incomplete'}</p>
        <p class="small"><b>Evidence:</b> ${Number(p.selected_evidence_rows||0)} selected • ${Number(p.approved_source_evidence||0)} approved source range(s) • ${Number(p.reviewed_story_plans||0)} reviewed plan(s) • ${Number(p.source_backed_story_items||0)} source-backed item(s)</p>
        <p class="small"><b>Copy/publication:</b> ${Number(p.approved_deliverables||0)} approved copy • ${Number(p.locked_deliverables||0)} locked • ${Number(p.published_journal_rows||0)} published Workshop Journal row(s)</p>
        <p class="small"><b>Media rights — separate:</b> ${esc(label(p.public_media_rights_state))} • ${Number(p.public_allowed_caip_assets||0)} public-allowed CAIP asset(s) • ${Number(p.public_allowed_private_uploads||0)} public-allowed private upload(s) • ${Number(p.non_public_caip_assets||0)} non-public CAIP asset(s)</p>
      </article>`).join('');
      mount.innerHTML=`<section class="card"><div style="display:flex;gap:12px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap"><div><p class="eyebrow">Build 323 • read-only continuity</p><h2 style="margin-top:0">Five-project coverage</h2><p class="small">Readiness moves only when factual prerequisites and explicit human review already exist. This view never auto-creates a Maker Story, changes review state, grants media rights, publishes a story or posts to a provider.</p></div><button class="btn" id="makerStoryCoverageReload" type="button">Reload</button></div>
      <div class="grid cols-3" style="gap:12px"><div><strong>${projects.length}</strong><div class="small">Active projects measured</div></div><div><strong>${Number(counts.PUBLISHED_REVIEWED_STORY||0)}</strong><div class="small">Published reviewed stories</div></div><div><strong>${Number(counts.PUBLICATION_REVIEW_READY||0)}</strong><div class="small">New publication-review ready</div></div></div>
      <p class="small"><strong>Permanent boundary:</strong> reviewed factual story text and media/public-use rights are separate authorities. Provider posting remains independent and manual.</p></section>
      <section class="grid cols-2" style="gap:14px;margin-top:14px">${cards}</section>`;
      document.getElementById('makerStoryCoverageReload')?.addEventListener('click',load);
    }catch(e){mount.innerHTML=`<section class="card"><p class="error">${esc(e.message)}</p><button class="btn" id="makerStoryCoverageReload" type="button">Retry</button></section>`;document.getElementById('makerStoryCoverageReload')?.addEventListener('click',load);}
  }
  load();
});
