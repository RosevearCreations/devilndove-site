// Release 467 Build 17 — Creator & Content Completeness admin UI.
(() => {
  const byId=(id)=>document.getElementById(id);
  const esc=(value)=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const money=(cents)=>{try{return (Number(cents||0)/100).toLocaleString('en-CA',{style:'currency',currency:'CAD'});}catch{return `${(Number(cents||0)/100).toFixed(2)} CAD`;}};
  const api=(url,options={})=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(url,options):fetch(url,options);
  const status=byId('creatorCompletenessStatus');
  const projectsMount=byId('creatorProjectCompletenessMount');
  const storiesMount=byId('creatorStoryCandidateMount');
  const mediaMount=byId('creatorMediaDiagnosticsMount');
  const presetsMount=byId('creatorMarketplacePresetsMount');
  let presetRows=[];

  function chips(items){return `<div class="creator-chip-row">${items.map(x=>`<span class="status-note">${esc(x)}</span>`).join('')}</div>`;}
  function renderProjects(list){
    if(!list.length){projectsMount.innerHTML='<p class="small">No Creative Process projects are available.</p>';return;}
    projectsMount.innerHTML=`<div class="creator-table-wrap"><table><thead><tr><th>Project</th><th>Completeness</th><th>Cost / result</th><th>Evidence</th><th>Next review</th></tr></thead><tbody>${list.map(row=>{
      const r=row.readiness||{}; const missing=Array.isArray(r.missing)?r.missing:[];
      const cost=Number(row.actual_cost_cents||0)||Number(r.tracked_material_cost_cents||0);
      return `<tr><td><strong>${esc(row.project_title||row.project_key||'Creative Project')}</strong><br><span class="small">${esc(row.project_status||'')} • updated ${esc(row.updated_at||'')}</span></td><td><strong>${esc(r.score||0)}%</strong>${missing.length?`<br><span class="small">Needs: ${esc(missing.join(', '))}</span>`:'<br><span class="small">Core completeness checks satisfied.</span>'}</td><td><span class="small">Cost ${money(cost)}<br>Revenue ${money(row.sales_revenue_cents)}<br>Rough project result ${money(r.rough_project_result_cents)}</span></td><td><span class="small">Materials ${esc(r.material_count||0)} • outputs ${esc(r.completed_output_count||0)}/${esc(r.output_count||0)} • lessons ${esc(r.knowledge_count||0)}</span></td><td><div class="creator-action-row"><a class="btn small" href="/admin/creative-process/?project_id=${encodeURIComponent(row.creative_work_project_id)}">Project</a><a class="btn small" href="/admin/content/?creative_work_project_id=${encodeURIComponent(row.creative_work_project_id)}">Content Studio</a></div><span class="small">Content handoffs: ${esc(r.handoff_count||0)}</span></td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  function renderStories(list){
    if(!list.length){storiesMount.innerHTML='<p class="small">No active CAIP evidence markers are currently flagged as story candidates.</p>';return;}
    storiesMount.innerHTML=`<div class="creator-story-grid">${list.slice(0,40).map((row,index)=>`<article class="creator-story-card"><div class="creator-rank">#${index+1} • ${esc(row.rank?.score||0)}/100</div><h3>${esc(row.title||row.evidence_category||'Story candidate')}</h3><p class="small">${esc(row.project_title||'CAIP project')} • ${esc(row.media_type||'media')} • ${esc(row.review_status||'needs_review')} • ${esc(row.verification_status||'')}</p>${chips(row.rank?.reasons||[])}<p class="small">${esc(row.note_text||row.transcript_excerpt||'No additional evidence note is recorded.')}</p><div class="creator-action-row"><a class="btn small" href="${esc(row.review_href||'/admin/caip/')}">Review evidence</a><a class="btn small" href="${esc(row.handoff_href||'/admin/content/')}">Content Studio handoff</a></div><p class="small">Ranking is prioritization only. Approval remains in CAIP/Content Studio.</p></article>`).join('')}</div>`;
  }

  function renderMedia(data){
    const unassigned=Array.isArray(data?.unassigned_media)?data.unassigned_media:[];
    const slots=Array.isArray(data?.unfilled_slots)?data.unfilled_slots:[];
    mediaMount.innerHTML=`${chips([`${unassigned.length} unassigned media shown`,`${slots.length} unfilled public/static slots shown`,'Automatic assignment: off'])}<div class="creator-media-grid"><div><h3>Unassigned media</h3>${unassigned.length?`<div class="creator-list">${unassigned.slice(0,30).map(row=>`<div class="creator-list-item"><strong>${esc(row.display_name||row.original_filename||row.object_key||`Media ${row.media_asset_id}`)}</strong><br><span class="small">${esc(row.media_type||'photo')} • ${esc(row.recommended_target||'Review in Media Studio')}</span></div>`).join('')}</div>`:'<p class="small">No unassigned media in the bounded diagnostic sample.</p>'}</div><div><h3>Unfilled visual slots</h3>${slots.length?`<div class="creator-list">${slots.slice(0,30).map(row=>`<div class="creator-list-item"><strong>${esc(row.slot_label||row.slot_key||'Visual slot')}</strong><br><span class="small">${esc(row.page_path||'/')} • ${esc(row.slot_type||'image')}${Number(row.is_required||0)===1?' • required':''}</span></div>`).join('')}</div>`:'<p class="small">No unfilled public/static slots in the bounded diagnostic sample.</p>'}</div></div><p class="small"><a href="/admin/media-content-studio/">Open Media Studio</a> to inspect usage and make any assignment explicitly.</p>`;
  }

  function input(name,value,label,extra=''){return `<label>${esc(label)}<input class="input" data-preset-field="${esc(name)}" value="${esc(value||'')}" ${extra}/></label>`;}
  function presetCard(row){
    const tags=Array.isArray(row.default_tags)?row.default_tags.join(', '):'';
    const materials=Array.isArray(row.default_materials)?row.default_materials.join(', '):'';
    const pre=row.preflight||{};
    return `<article class="creator-preset-card" data-channel="${esc(row.channel_key)}"><div class="creator-section-head"><div><h3>${esc(String(row.channel_key||'').replace(/_/g,' '))}</h3><p class="small">Status: ${esc(row.preset_status||'active')}</p></div><span class="status-note ${pre.ready?'is-ready':'is-blocked'}">${pre.ready?'Preflight ready':'Needs review'}</span></div><div class="creator-form-grid">${input('title_prefix',row.title_prefix,'Title prefix')}${input('title_suffix',row.title_suffix,'Title suffix')}${input('category_path',row.category_path,'Category / path')}${input('shipping_profile_reference',row.shipping_profile_reference,'Shipping profile reference')}${input('default_tags',tags,'Tags (comma separated)')}${input('default_materials',materials,'Materials (comma separated)')}<label class="creator-span-2">Description intro<textarea class="input" rows="3" data-preset-field="description_intro">${esc(row.description_intro||'')}</textarea></label><label class="creator-span-2">Content strategy<textarea class="input" rows="3" data-preset-field="content_strategy">${esc(row.content_strategy||'')}</textarea></label></div><div data-preset-preflight>${renderPreflight(pre)}</div><div class="creator-action-row"><button class="btn" type="button" data-preset-preflight-action>Run preflight</button><button class="btn primary" type="button" data-preset-save>Save reviewed preset</button></div><p class="small">Locked policy: Canada only • review before publish • no automatic posting. Provider execution/publication remain off.</p></article>`;
  }
  function renderPreflight(pre={}){const blockers=Array.isArray(pre.blockers)?pre.blockers:[];const warnings=Array.isArray(pre.warnings)?pre.warnings:[];return `<div class="creator-preflight ${pre.ready?'is-ready':'is-blocked'}"><strong>${pre.ready?'Ready for reviewed export preparation':'Preflight needs attention'}</strong>${blockers.length?`<div class="small">Blockers: ${esc(blockers.join(' • '))}</div>`:''}${warnings.length?`<div class="small">Warnings: ${esc(warnings.join(' • '))}</div>`:''}</div>`;}
  function renderPresets(list){presetRows=list||[];presetsMount.innerHTML=presetRows.length?`<div class="creator-preset-grid">${presetRows.map(presetCard).join('')}</div>`:'<p class="small">Marketplace presets are unavailable. Build 17 will not create missing rows at request time.</p>';bindPresetActions();}
  function cardPayload(card){const get=(name)=>card.querySelector(`[data-preset-field="${name}"]`)?.value||'';return {channel_key:card.dataset.channel,title_prefix:get('title_prefix'),title_suffix:get('title_suffix'),description_intro:get('description_intro'),category_path:get('category_path'),shipping_profile_reference:get('shipping_profile_reference'),content_strategy:get('content_strategy'),default_tags:get('default_tags').split(',').map(x=>x.trim()).filter(Boolean),default_materials:get('default_materials').split(',').map(x=>x.trim()).filter(Boolean)};}
  function bindPresetActions(){presetsMount.querySelectorAll('[data-channel]').forEach(card=>{
    card.querySelector('[data-preset-preflight-action]')?.addEventListener('click',()=>submitPreset(card,'preflight'));
    card.querySelector('[data-preset-save]')?.addEventListener('click',()=>submitPreset(card,'save'));
  });}
  async function submitPreset(card,action){const button=card.querySelector(action==='save'?'[data-preset-save]':'[data-preset-preflight-action]');if(button)button.disabled=true;try{const response=await api('/api/admin/marketplace-presets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...cardPayload(card),action})});const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw new Error(data?.error||'Preset action failed.');const pre=data.preflight||data.preset?.preflight||{};card.querySelector('[data-preset-preflight]').innerHTML=renderPreflight(pre);if(action==='save')status.textContent=`Saved ${card.dataset.channel} for reviewed preparation only. No publication occurred.`;}catch(error){status.textContent=error.message||'Preset action failed.';}finally{if(button)button.disabled=false;}}

  async function load(){status.textContent='Refreshing Creator & Content completeness…';try{
    const [coreResponse,presetResponse]=await Promise.all([api('/api/admin/creator-content-completeness',{headers:{Accept:'application/json'}}),api('/api/admin/marketplace-presets',{headers:{Accept:'application/json'}})]);
    const core=await coreResponse.json().catch(()=>null);const presets=await presetResponse.json().catch(()=>null);
    if(!coreResponse.ok||!core?.ok)throw new Error(core?.error||'Completeness data could not be loaded.');
    renderProjects(core.projects||[]);renderStories(core.story_candidates||[]);renderMedia(core.media_diagnostics||{});
    if(presetResponse.ok&&presets?.ok)renderPresets(presets.presets||[]);else presetsMount.innerHTML=`<p class="small">${esc(presets?.error||'Marketplace presets are unavailable.')}</p>`;
    status.textContent=`Loaded ${core.projects?.length||0} projects, ${core.story_candidates?.length||0} story candidates, and ${core.media_diagnostics?.unassigned_media?.length||0} unassigned media records. No automatic publication or assignment occurred.`;
  }catch(error){status.textContent=error.message||'Completeness data could not be loaded.';projectsMount.innerHTML='<p class="small">Creator completeness is unavailable.</p>';storiesMount.innerHTML='';mediaMount.innerHTML='';}}

  byId('creatorCompletenessRefresh')?.addEventListener('click',load);
  document.addEventListener('DOMContentLoaded',load,{once:true});
})();
