// Build 202 — CAIP admin workspace: source-safe intelligence, metadata probes,
// immutable derivative planning, and authenticated secure-review grants.
(() => {
  const mount = document.getElementById('creativeAssetIntelligenceMount');
  if (!mount) return;
  const query = new URLSearchParams(window.location.search);
  const requestedProjectId = Number(query.get('creative_project_id') || query.get('project_id') || 0);
  const requestedProductId = Number(query.get('product_id') || 0);
  const state = { projects: [], contentProjects: [], detail: null, operations: null, busy: false, reviewLink: null };

  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  const text = (value) => String(value ?? '').trim();
  const num = (value) => Number(value || 0) || 0;
  const safeJson = (value, fallback = {}) => { try { return JSON.parse(String(value || '')); } catch { return fallback; } };
  const array = (value) => Array.isArray(value) ? value : [];
  const statusText = (value) => text(value).replace(/_/g, ' ') || 'needs review';
  const statusClass = (value) => `status ${text(value).toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'pending'}`;
  const $ = (selector, root = mount) => root.querySelector(selector);
  const $$ = (selector, root = mount) => Array.from(root.querySelectorAll(selector));

  function message(value = '', tone = 'info', link = '') {
    const node = $('#caipMessage');
    if (!node) return;
    node.className = `content-studio-message ${tone}`;
    node.hidden = !value;
    node.textContent = value;
    if (link) {
      node.appendChild(document.createTextNode(' '));
      const anchor = document.createElement('a');
      anchor.href = link;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = 'Open secure review';
      node.appendChild(anchor);
    }
  }

  async function api(payload = null, projectId = 0) {
    const params = new URLSearchParams();
    if (projectId) params.set('creative_project_id', String(projectId));
    else if (requestedProductId) params.set('product_id', String(requestedProductId));
    const path = `/api/admin/creative-assets${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await window.DDAuth.apiFetch(path, payload ? { method: 'POST', body: JSON.stringify(payload) } : {});
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || 'CAIP request failed.');
    return data;
  }

  function apply(data) {
    state.projects = data.projects || state.projects;
    state.contentProjects = data.content_projects || state.contentProjects;
    if (data.detail !== undefined) state.detail = data.detail;
    if (data.operations !== undefined) state.operations = data.operations;
  }

  function placeholder(label, kind = 'image') {
    return `<div class="caip-placeholder" aria-label="${esc(label)}"><img src="/assets/caip-planning-placeholder.svg" alt="" aria-hidden="true"/><span aria-hidden="true">${kind === 'video' ? '▶' : '✦'}</span><small>${esc(label)}</small></div>`;
  }

  function contentOptions() {
    const options = state.contentProjects.map((item) => {
      const linked = num(item.creative_project_id);
      return `<option value="${num(item.content_project_id)}">${esc(item.product_name || item.project_title || item.content_project_key)}${linked ? ' — CAIP ready' : ''}</option>`;
    }).join('');
    return `<option value="">Choose a Content Studio project…</option>${options}`;
  }

  function projectsList() {
    if (!state.projects.length) return '<div class="content-empty-state">No CAIP projects yet. Choose an approved Content Studio package and create its reference-only intelligence record.</div>';
    return state.projects.map((project) => `<button class="caip-project-row ${num(state.detail?.project?.creative_project_id) === num(project.creative_project_id) ? 'is-active' : ''}" type="button" data-open-project="${num(project.creative_project_id)}"><strong>${esc(project.product_name || project.project_title)}</strong><small>${num(project.asset_count)} assets · ${num(project.evidence_count)} evidence records · ${esc(statusText(project.governance_status))}</small></button>`).join('');
  }

  function policyGrid(detail) {
    const policies = array(detail.policies);
    return `<section class="card caip-policy-card"><div class="section-title-row"><div><h3>Governance and readiness</h3><p class="small">Internal policy signals only. A pass never publishes content or grants source-media rights.</p></div><span class="${statusClass(detail.project.governance_status)}">${esc(statusText(detail.project.governance_status))}</span></div><div class="caip-policy-grid">${policies.map((policy) => `<article class="caip-policy ${esc(policy.severity || 'info')}"><div><strong>${esc(statusText(policy.policy_key))}</strong><span class="${statusClass(policy.decision_status)}">${esc(statusText(policy.decision_status))}</span></div><p>${esc(policy.rationale || '')}</p></article>`).join('') || '<p class="small">Policy signals appear after synchronization.</p>'}</div></section>`;
  }

  function observationFor(assetId) {
    return array(state.operations?.observations).find((item) => num(item.creative_asset_id) === num(assetId)) || null;
  }

  function observationText(observation) {
    if (!observation) return 'No technical probe has run. The source has not been fetched or altered.';
    const bits = [
      statusText(observation.probe_status), observation.mime_type || 'type unknown',
      observation.file_size_bytes ? `${Math.round(num(observation.file_size_bytes) / 1024)} KB` : '',
      observation.width_px && observation.height_px ? `${num(observation.width_px)}×${num(observation.height_px)}` : '',
      observation.orientation && observation.orientation !== 'unknown' ? observation.orientation : '',
      observation.probe_scope ? observation.probe_scope.replace(/_/g, ' ') : ''
    ].filter(Boolean);
    return bits.join(' · ');
  }

  function templateOptions() {
    const templates = array(state.operations?.templates);
    return templates.map((item) => `<option value="${esc(item.key)}">${esc(item.label)} · ${esc(item.aspect_ratio)} · ${num(item.width)}×${num(item.height)}</option>`).join('');
  }

  function assetCard(asset) {
    const analysis = { technical: num(asset.technical_score), story: num(asset.story_score), reuse: num(asset.reuse_score), total: num(asset.total_score), confidence: num(asset.confidence_score) };
    const analysisEvidence = safeJson(asset.analysis_evidence_json, {});
    const reasons = array(analysisEvidence.reasons);
    const tags = array(safeJson(asset.manual_tags_json, []));
    const isVideo = text(asset.media_type).toLowerCase() === 'video';
    const preview = text(asset.source_url) ? (isVideo ? `<video src="${esc(asset.source_url)}" preload="metadata" muted playsinline controls></video>` : `<img src="${esc(asset.source_url)}" alt="${esc(asset.manual_caption || asset.original_filename || 'Creative asset review preview')}" loading="lazy"/>`) : placeholder('Source preview unavailable', asset.media_type);
    const observation = observationFor(asset.creative_asset_id);
    return `<article class="caip-asset-card" data-caip-asset="${num(asset.creative_asset_id)}">
      <div class="caip-asset-preview">${preview}</div>
      <div class="caip-asset-content">
        <div class="section-title-row"><div><strong>${esc(asset.original_filename || asset.asset_key)}</strong><small>${esc(asset.logical_archive_path || 'Reference path pending')}</small></div><div class="caip-status-stack"><span class="${statusClass(asset.rights_status)}">${esc(statusText(asset.rights_status))}</span><span class="${statusClass(asset.asset_status)}">${esc(statusText(asset.asset_status))}</span></div></div>
        <div class="caip-score-strip"><span title="Recorded technical metadata score"><b>${analysis.technical}</b> technical</span><span title="Story-fit score"><b>${analysis.story}</b> story</span><span title="Reuse readiness score"><b>${analysis.reuse}</b> reuse</span><span title="Weighted review score"><b>${analysis.total}</b> review</span></div>
        <p class="small">${esc(reasons.join(' · ') || 'Metadata review pending.')} Confidence ${analysis.confidence}/100. This remains a review aid, not visual truth or rights proof.</p>
        <div class="caip-technical-strip"><strong>Technical observation</strong><span>${esc(observationText(observation))}</span><button class="btn small" type="button" data-probe-asset="${num(asset.creative_asset_id)}">Run safe probe</button></div>
        <div class="caip-derivative-actions"><label>Plan a future output<select class="input" data-template-for="${num(asset.creative_asset_id)}">${templateOptions()}</select></label><button class="btn" type="button" data-plan-derivative="${num(asset.creative_asset_id)}">Create immutable plan</button><button class="btn secondary" type="button" data-secure-review="${num(asset.creative_asset_id)}">Create 30m secure review</button></div>
        <details class="caip-editor"><summary>Review asset, rights and internal notes</summary><div class="caip-form-grid">
          <label>CAIP rights state<select class="input" data-asset-rights="${num(asset.creative_asset_id)}">${['needs_review','public_allowed','internal_only','blocked'].map((value) => `<option value="${value}" ${asset.rights_status === value ? 'selected' : ''}>${esc(statusText(value))}</option>`).join('')}</select></label>
          <label>Internal asset state<select class="input" data-asset-status="${num(asset.creative_asset_id)}">${['active','held','missing','archived'].map((value) => `<option value="${value}" ${asset.asset_status === value ? 'selected' : ''}>${esc(statusText(value))}</option>`).join('')}</select></label>
          <label>Internal tags<input class="input" data-asset-tags="${num(asset.creative_asset_id)}" value="${esc(tags.join(', '))}" placeholder="finished, process, detail"/></label>
          <label class="full">Internal caption/note<textarea class="input" data-asset-caption="${num(asset.creative_asset_id)}" rows="3" placeholder="Internal observation only; not a public claim.">${esc(asset.manual_caption || '')}</textarea></label>
        </div><button class="btn" type="button" data-save-asset="${num(asset.creative_asset_id)}">Save CAIP review</button></details>
      </div>
    </article>`;
  }

  function operationsPanel() {
    const ops = state.operations || {};
    const derivatives = array(ops.derivatives);
    const grants = array(ops.access_grants);
    const providers = array(ops.provider_profiles);
    const jobs = array(ops.probe_jobs);
    return `<section class="card caip-operations-card"><div class="section-title-row"><div><h3>Media operations — plan and verify</h3><p class="small">Build 202 records metadata and immutable planning only. No output file has been rendered, copied, or published unless a later verified provider records it.</p></div><span class="${statusClass('disabled')}">providers disabled</span></div>
      ${state.reviewLink ? `<div class="content-studio-message info">A 30-minute, administrator-bound review link was created. <a href="${esc(state.reviewLink)}" target="_blank" rel="noopener noreferrer">Open secure review</a></div>` : ''}
      <div class="caip-ops-grid">
        <article><h4>Probe runs</h4><p class="small">${jobs.length} recorded · only catalog metadata and bound R2 object headers are inspected.</p>${jobs.slice(0, 4).map((job) => `<div class="caip-ops-row"><strong>${esc(job.original_filename || job.asset_key)}</strong><span class="${statusClass(job.job_status)}">${esc(statusText(job.job_status))}</span></div>`).join('') || '<p class="small">No probe has run yet.</p>'}</article>
        <article><h4>Derivative plans</h4><p class="small">${derivatives.length} plan(s) · output status remains honest.</p>${derivatives.slice(0, 6).map((item) => `<div class="caip-ops-row"><div><strong>${esc(item.recipe_name)}</strong><small>${esc(item.original_filename || item.asset_key)} · ${esc(item.aspect_ratio || '')}</small></div><span class="${statusClass(item.derivative_status)}">${esc(statusText(item.derivative_status))}</span>${item.derivative_status === 'planned' ? `<button class="btn small" type="button" data-approve-derivative="${num(item.creative_asset_derivative_id)}">Approve plan</button>` : ''}</div>`).join('') || '<p class="small">No derivative plans yet.</p>'}</article>
        <article><h4>Secure review grants</h4><p class="small">Tokens are stored only as hashes and require the issuing administrator’s session.</p>${grants.slice(0, 5).map((grant) => `<div class="caip-ops-row"><div><strong>${esc(grant.grant_key)}</strong><small>Expires ${esc(grant.expires_at || 'unknown')} · ${num(grant.access_count)}/${num(grant.max_access_count)} views</small></div><span class="${statusClass(grant.revoked_at ? 'revoked' : 'active')}">${grant.revoked_at ? 'revoked' : 'active'}</span>${grant.revoked_at ? '' : `<button class="btn small danger" type="button" data-revoke-grant="${num(grant.creative_asset_access_grant_id)}">Revoke</button>`}</div>`).join('') || '<p class="small">No secure review grants created.</p>'}</article>
      </div>
      <details class="caip-provider-register"><summary>Provider and cost-control registry</summary><p class="small">No secrets are stored here. Every provider is disabled until a separately reviewed adapter, environment secret, consent rules, budget caps, output verification, and failure recovery exist.</p>${providers.map((provider) => `<div class="caip-ops-row"><div><strong>${esc(provider.display_name)}</strong><small>${esc(provider.capability_key)} · ${esc(provider.endpoint_policy)}</small></div><span class="${statusClass(provider.lifecycle_status)}">${esc(statusText(provider.lifecycle_status))}</span></div>`).join('')}</details>
    </section>`;
  }

  function evidenceSection(detail) {
    return `<section class="card caip-evidence-card"><div class="section-title-row"><div><h3>Evidence ledger</h3><p class="small">Review claim source, visibility, and status before any content use.</p></div></div><div class="caip-evidence-list">${array(detail.evidence).map((item) => `<article class="caip-evidence-row"><div><strong>${esc(item.evidence_key)}</strong><small>${esc(item.source_reference || 'Source reference pending')}</small></div><textarea class="input" rows="2" data-evidence-claim="${num(item.creative_story_evidence_id)}">${esc(item.claim_text || '')}</textarea><div class="caip-inline-controls"><label>Visibility<select class="input" data-evidence-visibility="${num(item.creative_story_evidence_id)}">${['internal','public_candidate'].map((value) => `<option value="${value}" ${item.visibility === value ? 'selected' : ''}>${esc(statusText(value))}</option>`).join('')}</select></label><label>Verification<select class="input" data-evidence-verification="${num(item.creative_story_evidence_id)}">${['source_record','confirmed','unverified','rejected'].map((value) => `<option value="${value}" ${item.verification_status === value ? 'selected' : ''}>${esc(statusText(value))}</option>`).join('')}</select></label><label>Review<select class="input" data-evidence-review="${num(item.creative_story_evidence_id)}">${['needs_review','approved','rejected'].map((value) => `<option value="${value}" ${item.review_status === value ? 'selected' : ''}>${esc(statusText(value))}</option>`).join('')}</select></label><label class="check"><input type="checkbox" data-evidence-lock="${num(item.creative_story_evidence_id)}" ${num(item.copy_locked) ? 'checked' : ''}/> Lock copy</label><button class="btn small" type="button" data-save-evidence="${num(item.creative_story_evidence_id)}">Save</button></div></article>`).join('') || '<p class="small">No source-backed evidence is available yet.</p>'}</div></section>`;
  }

  function segmentSection(detail) {
    return `<section class="card caip-segments-card"><div class="section-title-row"><div><h3>Reviewable story spine</h3><p class="small">Segments remain internal until their evidence and downstream release are approved.</p></div></div><div class="caip-segment-list">${array(detail.segments).map((item) => `<article class="caip-segment-row"><div class="caip-form-grid"><label>Section title<input class="input" data-segment-title="${num(item.creative_story_segment_id)}" value="${esc(item.title || '')}"/></label><label>Status<select class="input" data-segment-status="${num(item.creative_story_segment_id)}">${['draft','review','approved','rejected'].map((value) => `<option value="${value}" ${item.segment_status === value ? 'selected' : ''}>${esc(statusText(value))}</option>`).join('')}</select></label><label class="full">Evidence keys<input class="input" data-segment-evidence="${num(item.creative_story_segment_id)}" value="${esc(array(safeJson(item.evidence_keys_json, [])).join(', '))}"/></label><label class="full">Narrative<textarea class="input" rows="4" data-segment-body="${num(item.creative_story_segment_id)}">${esc(item.narrative_text || '')}</textarea></label><label class="full">Reviewer notes<textarea class="input" rows="2" data-segment-notes="${num(item.creative_story_segment_id)}">${esc(item.reviewer_notes || '')}</textarea></label></div><div class="caip-inline-controls"><label class="check"><input type="checkbox" data-segment-lock="${num(item.creative_story_segment_id)}" ${num(item.copy_locked) ? 'checked' : ''}/> Lock copy</label><button class="btn small" type="button" data-save-segment="${num(item.creative_story_segment_id)}">Save segment</button></div></article>`).join('') || '<p class="small">No story segments are available yet.</p>'}</div></section>`;
  }

  function recommendationsSection(detail) {
    return `<section class="card caip-recommendations-card"><div class="section-title-row"><div><h3>Reuse candidates</h3><p class="small">Candidates are selection aids. A recommendation does not mean public clearance, rendering, or publication.</p></div></div><div class="caip-recommendation-grid">${array(detail.recommendations).map((item) => `<article><strong>${esc(statusText(item.intended_role))}</strong><span class="${statusClass(item.recommendation_status)}">${esc(statusText(item.recommendation_status))}</span><p>${esc(item.original_filename || item.asset_key || 'Source asset')} · fit ${num(item.fit_score)}/100</p></article>`).join('') || '<p class="small">Recommendations appear after synchronization.</p>'}</div></section>`;
  }

  function renderDetail() {
    const detail = state.detail;
    if (!detail?.project) return `<section class="card caip-empty-detail"><h2>Choose a content package</h2><p>Select an existing CAIP project from the left, or create one from a reviewed Content Studio package. All CAIP records remain reference-only.</p></section>`;
    const project = detail.project;
    const counts = detail.counts || {};
    return `<div class="caip-detail">
      <section class="card caip-detail-hero"><div><p class="eyebrow">${esc(project.creative_project_key || 'CAIP project')}</p><h2>${esc(project.product_name || project.project_title)}</h2><p>${esc(project.factual_summary || 'Factual summary is available in Content Studio and source records.')}</p></div><div class="caip-project-actions"><button class="btn" type="button" data-approve-caip>Approve internal record</button><button class="btn secondary" type="button" data-download-manifest>Download manifest</button></div></section>
      <div class="caip-metric-grid"><article><strong>${num(counts.assets)}</strong><span>source references</span></article><article><strong>${num(counts.public_allowed)}</strong><span>public-cleared upstream</span></article><article><strong>${num(counts.evidence)}</strong><span>evidence records</span></article><article><strong>${num(counts.approved_segments)}</strong><span>approved segments</span></article></div>
      ${policyGrid(detail)}
      ${operationsPanel()}
      <section class="caip-assets-section"><div class="section-title-row"><div><h3>Canonical source assets</h3><p class="small">Run a metadata/R2 header probe, then create an immutable plan only after review. No source file is altered by these controls.</p></div></div><div class="caip-asset-grid">${array(detail.assets).map(assetCard).join('') || '<div class="content-empty-state">No source assets are linked yet.</div>'}</div></section>
      ${recommendationsSection(detail)}
      ${evidenceSection(detail)}
      ${segmentSection(detail)}
    </div>`;
  }

  function render() {
    const currentContentId = num(state.detail?.project?.content_project_id);
    mount.innerHTML = `${requestedProductId ? `<div class="card caip-product-bridge"><strong>Catalog product ${esc(String(requestedProductId))}</strong><span class="small">CAIP opened from the catalog media workspace. ${state.detail?.project ? 'Its linked creative intelligence record is selected below.' : 'No linked CAIP record exists yet; choose a reviewed Content Studio package to create one.'}</span><a class="btn secondary" href="/admin/catalog-media/?product_id=${encodeURIComponent(requestedProductId)}#product-media-workflow">Return to media workspace</a></div>` : ''}<div class="caip-page-grid">
      <aside class="card caip-sidebar"><h2>Creative projects</h2><p class="small">Sync an approved Content Studio package into CAIP. Existing source media stays in place.</p><label>Content Studio package<select class="input" id="caipContentProject">${contentOptions()}</select></label><div class="caip-sidebar-actions"><button class="btn" type="button" id="caipSync">Create or refresh CAIP</button><button class="btn secondary" type="button" id="caipRefresh">Refresh list</button></div><div class="caip-project-list">${projectsList()}</div></aside>
      <main class="caip-main"><div id="caipMessage" class="content-studio-message" hidden></div>${renderDetail()}</main>
    </div>`;
    const selected = $('#caipContentProject');
    if (selected && currentContentId) selected.value = String(currentContentId);
    bind();
  }

  async function downloadManifest() {
    const projectId = num(state.detail?.project?.creative_project_id);
    if (!projectId) return;
    try {
      const response = await window.DDAuth.apiFetch('/api/admin/creative-assets', { method: 'POST', body: JSON.stringify({ action: 'manifest', creative_project_id: projectId }) });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Manifest download failed.'); }
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = `${text(state.detail?.project?.creative_project_key) || 'caip-project'}-manifest.json`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(href);
      message('CAIP manifest downloaded. It includes source references and plans, not copied files.', 'success');
    } catch (error) { message(error.message, 'error'); }
  }

  function inputValue(prefix, id) { return text($(`[${prefix}="${num(id)}"]`)?.value); }
  function checked(prefix, id) { return Boolean($(`[${prefix}="${num(id)}"]`)?.checked); }

  async function perform(payload, success, options = {}) {
    if (state.busy) return;
    state.busy = true;
    try {
      const data = await api(payload);
      apply(data);
      if (data.result?.review_url) state.reviewLink = data.result.review_url;
      render();
      message(success || data.message || 'Saved.', 'success', options.openReview && data.result?.review_url ? data.result.review_url : '');
      if (options.openReview && data.result?.review_url) window.open(data.result.review_url, '_blank', 'noopener,noreferrer');
    } catch (error) { message(error.message || 'CAIP request failed.', 'error'); }
    finally { state.busy = false; }
  }

  function bind() {
    $('#caipSync')?.addEventListener('click', () => {
      const contentProjectId = num($('#caipContentProject')?.value);
      if (!contentProjectId) return message('Choose a Content Studio package first.', 'error');
      perform({ action: 'sync_project', content_project_id: contentProjectId }, 'CAIP synchronized. Source files remain untouched.');
    });
    $('#caipRefresh')?.addEventListener('click', () => load(num(state.detail?.project?.creative_project_id)));
    $$('[data-open-project]').forEach((button) => button.addEventListener('click', () => load(num(button.dataset.openProject))));
    $('[data-approve-caip]')?.addEventListener('click', () => perform({ action: 'approve_internal_project', creative_project_id: num(state.detail?.project?.creative_project_id) }, 'Internal CAIP record approved. Public release is unchanged.'));
    $('[data-download-manifest]')?.addEventListener('click', downloadManifest);
    $$('[data-probe-asset]').forEach((button) => button.addEventListener('click', () => perform({ action: 'probe_asset', creative_project_id: num(state.detail?.project?.creative_project_id), creative_asset_id: num(button.dataset.probeAsset) }, 'Technical observation recorded. Only catalog/R2 object metadata was inspected.')));
    $$('[data-plan-derivative]').forEach((button) => button.addEventListener('click', () => {
      const id = num(button.dataset.planDerivative);
      perform({ action: 'create_derivative_plan', creative_project_id: num(state.detail?.project?.creative_project_id), creative_asset_id: id, template_key: inputValue('data-template-for', id) }, 'Immutable derivative plan created. No output file was generated.');
    }));
    $$('[data-secure-review]').forEach((button) => button.addEventListener('click', () => perform({ action: 'create_secure_review_link', creative_project_id: num(state.detail?.project?.creative_project_id), creative_asset_id: num(button.dataset.secureReview), expires_in_minutes: 30, max_access_count: 25 }, 'Secure review link created for this administrator only.', { openReview: true })));
    $$('[data-save-asset]').forEach((button) => button.addEventListener('click', () => {
      const id = num(button.dataset.saveAsset);
      perform({ action: 'update_asset', creative_project_id: num(state.detail?.project?.creative_project_id), creative_asset_id: id, rights_status: inputValue('data-asset-rights', id), asset_status: inputValue('data-asset-status', id), manual_tags: inputValue('data-asset-tags', id), manual_caption: inputValue('data-asset-caption', id) }, 'Asset review saved. Original media remains unchanged.');
    }));
    $$('[data-save-evidence]').forEach((button) => button.addEventListener('click', () => {
      const id = num(button.dataset.saveEvidence);
      perform({ action: 'update_evidence', creative_project_id: num(state.detail?.project?.creative_project_id), creative_story_evidence_id: id, visibility: inputValue('data-evidence-visibility', id), verification_status: inputValue('data-evidence-verification', id), review_status: inputValue('data-evidence-review', id), claim_text: inputValue('data-evidence-claim', id), copy_locked: checked('data-evidence-lock', id) ? 1 : 0 }, 'Evidence review saved.');
    }));
    $$('[data-save-segment]').forEach((button) => button.addEventListener('click', () => {
      const id = num(button.dataset.saveSegment);
      perform({ action: 'update_segment', creative_project_id: num(state.detail?.project?.creative_project_id), creative_story_segment_id: id, title: inputValue('data-segment-title', id), segment_status: inputValue('data-segment-status', id), evidence_keys: inputValue('data-segment-evidence', id), narrative_text: inputValue('data-segment-body', id), reviewer_notes: inputValue('data-segment-notes', id), copy_locked: checked('data-segment-lock', id) ? 1 : 0 }, 'Story segment saved.');
    }));
    $$('[data-approve-derivative]').forEach((button) => button.addEventListener('click', () => perform({ action: 'approve_derivative_plan', creative_project_id: num(state.detail?.project?.creative_project_id), creative_asset_derivative_id: num(button.dataset.approveDerivative) }, 'Derivative plan approved internally. No provider has been scheduled.')));
    $$('[data-revoke-grant]').forEach((button) => button.addEventListener('click', () => perform({ action: 'revoke_secure_review_link', creative_project_id: num(state.detail?.project?.creative_project_id), creative_asset_access_grant_id: num(button.dataset.revokeGrant) }, 'Secure review grant revoked.')));
  }

  async function load(projectId = 0) {
    try { const data = await api(null, projectId); apply(data); render(); }
    catch (error) { mount.innerHTML = `<div class="content-studio-message error">${esc(error.message || 'CAIP could not load.')}</div>`; }
  }
  load(requestedProjectId);
})();
