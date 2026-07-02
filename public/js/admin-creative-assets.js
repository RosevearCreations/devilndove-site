// Build 201 — Creative Asset Intelligence Platform admin workspace.
// All changes are review metadata on CAIP records; source files remain untouched.
(() => {
  const mount = document.getElementById('creativeAssetIntelligenceMount');
  if (!mount) return;
  const state = { projects: [], contentProjects: [], detail: null, busy: false };
  const query = new URLSearchParams(window.location.search);
  const requestedContentProjectId = Number(query.get('content_project_id') || 0);

  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  const clean = (value) => String(value ?? '').trim();
  const num = (value) => Number(value || 0) || 0;
  const json = (value, fallback = {}) => { try { return JSON.parse(String(value || '')); } catch { return fallback; } };
  const list = (value) => Array.isArray(value) ? value : [];
  const statusText = (value) => clean(value).replace(/_/g, ' ') || 'needs review';
  const statusClass = (value) => `status ${clean(value).toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'pending'}`;
  const mediaUrl = (asset) => clean(asset?.source_url);
  const imageish = (asset) => clean(asset?.media_type).toLowerCase() !== 'video';
  const byId = (id) => document.getElementById(id);

  function message(text, tone = 'info') {
    const node = byId('caipMessage');
    if (!node) return;
    node.className = `content-studio-message ${tone}`;
    node.textContent = text;
    node.hidden = !text;
  }

  async function api(payload = null, projectId = 0) {
    const path = projectId ? `/api/admin/creative-assets?creative_project_id=${encodeURIComponent(projectId)}` : '/api/admin/creative-assets';
    const response = await window.DDAuth.apiFetch(path, payload ? { method: 'POST', body: JSON.stringify(payload) } : {});
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || 'CAIP request failed.');
    return data;
  }

  function apply(data) {
    state.projects = data.projects || state.projects;
    state.contentProjects = data.content_projects || state.contentProjects;
    if (data.detail) state.detail = data.detail;
  }

  function caipPlaceholder(label, kind = 'image') {
    return `<div class="caip-placeholder" aria-label="${esc(label)}"><span aria-hidden="true">${kind === 'video' ? '▶' : '✦'}</span><small>${esc(label)}</small></div>`;
  }

  function contentProjectOptions() {
    const options = state.contentProjects.map((item) => {
      const linked = num(item.creative_project_id);
      return `<option value="${num(item.content_project_id)}">${esc(item.product_name || item.project_title || item.content_project_key)}${linked ? ' — CAIP ready' : ''}</option>`;
    }).join('');
    return `<option value="">Choose a Content Studio project…</option>${options}`;
  }

  function projectRows() {
    if (!state.projects.length) return '<div class="content-empty-state">No CAIP projects exist yet. Choose a Content Studio package to create its reference-only intelligence record.</div>';
    return state.projects.map((project) => `<button class="caip-project-row ${num(state.detail?.project?.creative_project_id) === num(project.creative_project_id) ? 'is-active' : ''}" type="button" data-open-caip-project="${num(project.creative_project_id)}"><strong>${esc(project.product_name || project.project_title)}</strong><small>${num(project.asset_count)} assets · ${num(project.evidence_count)} evidence records · ${statusText(project.governance_status)}</small></button>`).join('');
  }

  function policyGrid(detail) {
    const policies = detail.policies || [];
    return `<section class="card caip-policy-card"><div class="section-title-row"><div><h3>Governance and readiness</h3><p class="small">These are internal policy signals. A pass never publishes content or grants media rights.</p></div><span class="${statusClass(detail.project.governance_status)}">${esc(statusText(detail.project.governance_status))}</span></div><div class="caip-policy-grid">${policies.map((policy) => `<article class="caip-policy ${esc(policy.severity || 'info')}"><div><strong>${esc(statusText(policy.policy_key))}</strong><span class="${statusClass(policy.decision_status)}">${esc(statusText(policy.decision_status))}</span></div><p>${esc(policy.rationale || '')}</p></article>`).join('') || '<p class="small">Policy signals will appear after a project synchronization.</p>'}</div></section>`;
  }

  function assetCard(asset) {
    const analysis = { technical: num(asset.technical_score), story: num(asset.story_score), reuse: num(asset.reuse_score), total: num(asset.total_score), confidence: num(asset.confidence_score) };
    const evidence = json(asset.analysis_evidence_json, {});
    const reasons = list(evidence.reasons);
    const tags = list(json(asset.manual_tags_json, []));
    const preview = mediaUrl(asset) ? (imageish(asset) ? `<img src="${esc(mediaUrl(asset))}" alt="${esc(asset.manual_caption || asset.original_filename || 'Creative asset review preview')}" loading="lazy"/>` : `<video src="${esc(mediaUrl(asset))}" preload="metadata" muted playsinline controls></video>`) : caipPlaceholder('Source preview unavailable', asset.media_type);
    return `<article class="caip-asset-card">
      <div class="caip-asset-preview">${preview}</div>
      <div class="caip-asset-content"><div class="section-title-row"><div><strong>${esc(asset.original_filename || asset.asset_key)}</strong><small>${esc(asset.logical_archive_path || 'Reference path pending')}</small></div><div class="caip-status-stack"><span class="${statusClass(asset.rights_status)}">${esc(statusText(asset.rights_status))}</span><span class="${statusClass(asset.asset_status)}">${esc(statusText(asset.asset_status))}</span></div></div>
      <div class="caip-score-strip"><span title="Recorded technical metadata score"><b>${analysis.technical}</b> technical</span><span title="Story-fit score"><b>${analysis.story}</b> story</span><span title="Reuse readiness score"><b>${analysis.reuse}</b> reuse</span><span title="Weighted review score"><b>${analysis.total}</b> review</span></div>
      <p class="small">${esc(reasons.join(' · ') || 'Metadata review pending.')} Confidence ${analysis.confidence}/100. This is a review aid, not visual truth or rights proof.</p>
      <details class="caip-editor"><summary>Review asset, rights and internal notes</summary><div class="caip-form-grid"><label>CAIP rights state<select class="input" data-asset-rights="${num(asset.creative_asset_id)}">${['needs_review','public_allowed','internal_only','blocked'].map((value) => `<option value="${value}" ${asset.rights_status === value ? 'selected' : ''}>${esc(statusText(value))}</option>`).join('')}</select></label><label>Internal asset state<select class="input" data-asset-status="${num(asset.creative_asset_id)}">${['active','held','missing','archived'].map((value) => `<option value="${value}" ${asset.asset_status === value ? 'selected' : ''}>${esc(statusText(value))}</option>`).join('')}</select></label><label>Tags (comma-separated)<input class="input" data-asset-tags="${num(asset.creative_asset_id)}" value="${esc(tags.join(', '))}" placeholder="finished, close-up, process"/></label></div><label>Internal caption / review note<textarea class="input" rows="3" data-asset-caption="${num(asset.creative_asset_id)}">${esc(asset.manual_caption || '')}</textarea></label><button class="btn primary" type="button" data-save-asset="${num(asset.creative_asset_id)}">Save asset review</button><p class="small">CAIP accepts public allowed only when Content Studio already records public source clearance. This does not alter the source consent record.</p></details></div>
    </article>`;
  }

  function recommendations(detail) {
    const items = detail.recommendations || [];
    return `<section class="card"><div class="section-title-row"><div><h3>Reusable asset candidates</h3><p class="small">Candidates come from source order and recorded metadata. Confirm each destination separately before use.</p></div><span class="small">${items.length} candidate${items.length === 1 ? '' : 's'}</span></div><div class="caip-recommendation-grid">${items.map((item) => `<article><div><b>${esc(statusText(item.intended_role))}</b><span class="${statusClass(item.recommendation_status)}">${esc(statusText(item.recommendation_status))}</span></div><p>${esc(item.asset_key || 'No active source asset')} · ${esc(statusText(item.destination_key))}</p><strong>${num(item.fit_score)}/100 fit</strong></article>`).join('') || '<div class="content-empty-state">Sync the CAIP project after adding or selecting source media.</div>'}</div></section>`;
  }

  function evidenceCard(item) {
    return `<details class="caip-evidence-card"><summary><span><strong>${esc(statusText(item.evidence_key))}</strong><small>${esc(item.source_reference || 'No source reference')}</small></span><span class="${statusClass(item.review_status)}">${esc(statusText(item.review_status))}</span></summary><div class="caip-evidence-body"><div class="caip-form-grid"><label>Visibility<select class="input" data-evidence-visibility="${num(item.creative_story_evidence_id)}">${['internal','public_candidate'].map((value) => `<option value="${value}" ${item.visibility === value ? 'selected' : ''}>${esc(statusText(value))}</option>`).join('')}</select></label><label>Verification<select class="input" data-evidence-verification="${num(item.creative_story_evidence_id)}">${['unverified','source_record','confirmed','rejected'].map((value) => `<option value="${value}" ${item.verification_status === value ? 'selected' : ''}>${esc(statusText(value))}</option>`).join('')}</select></label><label>Review<select class="input" data-evidence-review="${num(item.creative_story_evidence_id)}">${['needs_review','approved','rejected'].map((value) => `<option value="${value}" ${item.review_status === value ? 'selected' : ''}>${esc(statusText(value))}</option>`).join('')}</select></label></div><label>Evidence-backed statement<textarea class="input" rows="4" data-evidence-claim="${num(item.creative_story_evidence_id)}">${esc(item.claim_text || '')}</textarea></label><label class="content-check"><input type="checkbox" data-evidence-lock="${num(item.creative_story_evidence_id)}" ${num(item.copy_locked) === 1 ? 'checked' : ''}/> Keep this edited evidence wording on a refresh</label><button class="btn" type="button" data-save-evidence="${num(item.creative_story_evidence_id)}">Save evidence review</button></div></details>`;
  }

  function segmentCard(item) {
    const keys = list(json(item.evidence_keys_json, [])).join(', ');
    return `<details class="caip-segment-card"><summary><span><strong>${esc(item.title || item.segment_key)}</strong><small>${esc(statusText(item.segment_type))} · evidence: ${esc(keys || 'none')}</small></span><span class="${statusClass(item.segment_status)}">${esc(statusText(item.segment_status))}</span></summary><div class="caip-segment-body"><div class="caip-form-grid"><label>Title<input class="input" data-segment-title="${num(item.creative_story_segment_id)}" value="${esc(item.title || '')}"/></label><label>Segment state<select class="input" data-segment-status="${num(item.creative_story_segment_id)}">${['draft','review','approved','rejected'].map((value) => `<option value="${value}" ${item.segment_status === value ? 'selected' : ''}>${esc(statusText(value))}</option>`).join('')}</select></label><label>Evidence keys (comma-separated)<input class="input" data-segment-evidence="${num(item.creative_story_segment_id)}" value="${esc(keys)}"/></label></div><label>Storyboard / narrative text<textarea class="input" rows="6" data-segment-body="${num(item.creative_story_segment_id)}">${esc(item.narrative_text || '')}</textarea></label><label>Reviewer notes<textarea class="input" rows="3" data-segment-notes="${num(item.creative_story_segment_id)}">${esc(item.reviewer_notes || '')}</textarea></label><label class="content-check"><input type="checkbox" data-segment-lock="${num(item.creative_story_segment_id)}" ${num(item.copy_locked) === 1 ? 'checked' : ''}/> Keep edited segment copy on a refresh</label><button class="btn" type="button" data-save-segment="${num(item.creative_story_segment_id)}">Save story segment</button></div></details>`;
  }

  function detailView(detail) {
    if (!detail?.project) return `<section class="card content-studio-welcome"><div>${caipPlaceholder('Creative intelligence visual placeholder')}</div><div><h2>Turn retained source media into a governed project record</h2><p>Choose a Content Studio package. CAIP builds a reference-only asset registry, deterministic metadata review, evidence ledger, story outline, and reuse candidates without touching source files.</p><ul><li>One canonical asset record per source reference</li><li>Rights, evidence, and policy gates remain separate from publishing</li><li>Every recommendation is visible and reviewable</li></ul></div></section>`;
    const project = detail.project;
    return `<section class="caip-detail"><div class="card caip-detail-header"><div><p class="eyebrow">${esc(project.creative_project_key || '')}</p><h2>${esc(project.project_title || 'Creative project')}</h2><p class="small">Linked to ${esc(project.content_project_key || 'Content Studio')} · source media remains unchanged.</p></div><div class="content-studio-toolbar"><button id="syncCaipProject" class="btn" type="button">Refresh references and metadata</button><button id="approveCaipProject" class="btn primary" type="button">Approve internal record</button><button id="downloadCaipManifest" class="btn secondary" type="button">Download CAIP manifest</button><a class="btn secondary" href="/admin/content-studio/">Open Content Studio</a></div></div><div class="content-metric-grid"><div><strong>${num(detail.counts?.assets)}</strong><small>Canonical source assets</small></div><div><strong>${num(detail.counts?.public_allowed)}</strong><small>CAIP public-use candidates</small></div><div><strong>${num(detail.counts?.evidence)}</strong><small>Evidence records</small></div><div><strong>${num(detail.counts?.approved_segments)}</strong><small>Approved story segments</small></div></div>${policyGrid(detail)}<section class="card"><div class="section-title-row"><div><h3>Canonical asset registry</h3><p class="small">Each row points to existing Content Studio/product/R2 media. It is not a duplicate upload or a content export.</p></div><span class="small">${num(detail.counts?.needs_review)} rights reviews remaining</span></div><div class="caip-asset-grid">${(detail.assets || []).map(assetCard).join('') || '<div class="content-empty-state">No source media is available. Add and retain media in the product/Content Studio record, then refresh CAIP.</div>'}</div></section>${recommendations(detail)}<section class="card"><div class="section-title-row"><div><h3>Evidence ledger</h3><p class="small">Use these source-backed statements to keep story copy, captions, SEO, and public claims grounded.</p></div><span class="small">No evidence is automatically public.</span></div><div class="caip-evidence-list">${(detail.evidence || []).map(evidenceCard).join('') || '<div class="content-empty-state">No source evidence has been collected yet.</div>'}</div></section><section class="card"><div class="section-title-row"><div><h3>Story spine</h3><p class="small">CAIP drafts a truthful sequence from evidence. Content Studio and the Release Board still control deliverables and public release.</p></div></div><div class="caip-segment-list">${(detail.segments || []).map(segmentCard).join('') || '<div class="content-empty-state">No story segments have been prepared.</div>'}</div></section><section class="card"><h3>CAIP activity</h3><div class="content-event-list">${(detail.events || []).map((event) => `<div><strong>${esc(statusText(event.event_type))}</strong><span>${esc(event.created_at || '')}</span></div>`).join('') || '<p class="small">No CAIP activity is recorded yet.</p>'}</div></section></section>`;
  }

  function render() {
    mount.innerHTML = `<div id="caipMessage" class="content-studio-message" hidden></div><section class="caip-layout"><aside class="card caip-sidebar"><h2>Start or open CAIP</h2><p class="small">Synchronize an existing Content Studio package. A new CAIP record is created once and refreshed safely thereafter.</p><label><span class="small">Content Studio package</span><select class="input" id="caipContentProjectSelect">${contentProjectOptions()}</select></label><button class="btn primary" id="syncCaipFromContent" type="button">Create / refresh CAIP project</button><hr/><h3>Existing CAIP projects</h3><div class="content-project-list">${projectRows()}</div></aside><main class="caip-main">${detailView(state.detail)}</main></section>`;
    const select = byId('caipContentProjectSelect');
    if (select && state.detail?.project?.content_project_id) select.value = String(state.detail.project.content_project_id);
    else if (select && requestedContentProjectId) select.value = String(requestedContentProjectId);
    wire();
  }

  function field(selector, id) { return mount.querySelector(`${selector}="${id}"]`)?.value || ''; }
  function checked(selector, id) { return Boolean(mount.querySelector(`${selector}="${id}"]`)?.checked); }
  async function perform(payload, success) { if (state.busy) return; state.busy = true; try { const data = await api(payload); apply(data); render(); message(success || data.message || 'Saved.', 'success'); } catch (error) { message(error.message, 'error'); } finally { state.busy = false; } }

  async function downloadManifest() {
    const id = num(state.detail?.project?.creative_project_id); if (!id) return;
    const response = await window.DDAuth.apiFetch('/api/admin/creative-assets', { method: 'POST', body: JSON.stringify({ action: 'manifest', creative_project_id: id }) });
    if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Could not download the CAIP manifest.'); }
    const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${state.detail.project.creative_project_key || 'caip-project'}-manifest.json`; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function wire() {
    byId('syncCaipFromContent')?.addEventListener('click', () => { const id = num(byId('caipContentProjectSelect')?.value); if (!id) return message('Choose a Content Studio package first.', 'error'); perform({ action: 'sync_project', content_project_id: id }, 'CAIP reference record synchronized. No source media was copied or changed.'); });
    byId('syncCaipProject')?.addEventListener('click', () => perform({ action: 'sync_project', content_project_id: num(state.detail?.project?.content_project_id) }, 'CAIP references, metadata score, evidence, and candidate roles refreshed.'));
    byId('approveCaipProject')?.addEventListener('click', () => perform({ action: 'approve_internal_project', creative_project_id: num(state.detail?.project?.creative_project_id) }, 'CAIP internal record approved. It is still not public and nothing was published.'));
    byId('downloadCaipManifest')?.addEventListener('click', () => downloadManifest().catch((error) => message(error.message, 'error')));
    mount.querySelectorAll('[data-open-caip-project]').forEach((button) => button.addEventListener('click', () => load(num(button.dataset.openCaipProject))));
    mount.querySelectorAll('[data-save-asset]').forEach((button) => button.addEventListener('click', () => { const id = num(button.dataset.saveAsset); perform({ action: 'update_asset', creative_project_id: num(state.detail?.project?.creative_project_id), creative_asset_id: id, rights_status: field('[data-asset-rights', id), asset_status: field('[data-asset-status', id), manual_tags: field('[data-asset-tags', id), manual_caption: field('[data-asset-caption', id) }, 'Asset review saved. The original file remains unchanged.'); }));
    mount.querySelectorAll('[data-save-evidence]').forEach((button) => button.addEventListener('click', () => { const id = num(button.dataset.saveEvidence); perform({ action: 'update_evidence', creative_project_id: num(state.detail?.project?.creative_project_id), creative_story_evidence_id: id, visibility: field('[data-evidence-visibility', id), verification_status: field('[data-evidence-verification', id), review_status: field('[data-evidence-review', id), claim_text: field('[data-evidence-claim', id), copy_locked: checked('[data-evidence-lock', id) ? 1 : 0 }, 'Evidence review saved.'); }));
    mount.querySelectorAll('[data-save-segment]').forEach((button) => button.addEventListener('click', () => { const id = num(button.dataset.saveSegment); perform({ action: 'update_segment', creative_project_id: num(state.detail?.project?.creative_project_id), creative_story_segment_id: id, title: field('[data-segment-title', id), segment_status: field('[data-segment-status', id), evidence_keys: field('[data-segment-evidence', id), narrative_text: field('[data-segment-body', id), reviewer_notes: field('[data-segment-notes', id), copy_locked: checked('[data-segment-lock', id) ? 1 : 0 }, 'Story segment saved.'); }));
  }

  async function load(projectId = 0) { try { const data = await api(null, projectId); apply(data); render(); } catch (error) { mount.innerHTML = `<div class="content-studio-message error">${esc(error.message)}</div>`; } }
  load();
})();
