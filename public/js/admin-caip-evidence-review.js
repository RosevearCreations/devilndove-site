// Devil n Dove Build 439 — CAIP temporal media evidence review UI.
// No polling. No provider execution. Private originals are viewed only through the existing authenticated proxy.
(() => {
  'use strict';
  const mount = document.getElementById('caipEvidenceReviewMount');
  if (!mount) return;

  const BUILD = 439;
  const API = '/api/admin/caip-evidence-review';
  const LEGACY_CAIP_API = '/api/admin/creative-assets';
  const OUTPUT_JOB_TYPES = new Set(['proxy_video','thumbnail','frame_extract','audio_extract','transcript']);
  const CATEGORY_OPTIONS = ['technique','problem','result','lesson','material_proof','process_proof','safety_quality','context','other'];
  const state = {
    projects: [], bundle: null, projectId: 0, assetId: 0, busy: false,
    capturedStart: null, capturedEnd: null, secureUrls: new Map(), message: '', tone: 'info',
  };

  const text = (value) => String(value ?? '').trim();
  const num = (value) => Number(value || 0) || 0;
  const esc = (value) => text(value).replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const statusText = (value) => text(value).replace(/_/g, ' ') || 'not set';
  const array = (value) => Array.isArray(value) ? value : [];
  const q = (selector, root = mount) => root.querySelector(selector);
  const qa = (selector, root = mount) => Array.from(root.querySelectorAll(selector));

  function setMessage(message = '', tone = 'info') {
    state.message = message;
    state.tone = tone;
    const node = q('#caip439Status');
    if (node) { node.textContent = message; node.dataset.tone = tone; }
  }

  function formatTime(value) {
    const total = Math.max(0, Number(value || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = Math.floor(total % 60);
    const fraction = Math.round((total - Math.floor(total)) * 10);
    const base = hours > 0 ? `${hours}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}` : `${minutes}:${String(seconds).padStart(2,'0')}`;
    return fraction ? `${base}.${fraction}` : base;
  }

  async function apiFetch(path, options = {}) {
    if (!window.DDAuth?.apiFetch) throw new Error('Authentication helper is unavailable.');
    return window.DDAuth.apiFetch(path, options);
  }

  async function apiJson(path, options = {}) {
    const response = await apiFetch(path, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      const error = new Error(data.error || data.message || `Request failed with HTTP ${response.status}.`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  function projectLabel(project) {
    const title = project.product_name || project.project_title || project.creative_project_key || `CAIP project ${project.creative_project_id}`;
    const media = Number(project.temporal_asset_count || 0);
    return `${title} · ${media} video/audio`;
  }

  function projectOptions() {
    return `<option value="">Choose a CAIP project…</option>${state.projects.map((project) => `<option value="${num(project.creative_project_id)}" ${num(project.creative_project_id) === state.projectId ? 'selected' : ''}>${esc(projectLabel(project))}</option>`).join('')}`;
  }

  function temporalAssets() {
    return array(state.bundle?.assets).filter((asset) => asset.can_temporal_review);
  }

  function selectedAsset() {
    return temporalAssets().find((asset) => num(asset.creative_asset_id) === state.assetId) || temporalAssets()[0] || null;
  }

  function assetOptions() {
    return `<option value="">Choose video/audio…</option>${temporalAssets().map((asset) => `<option value="${num(asset.creative_asset_id)}" ${num(asset.creative_asset_id) === state.assetId ? 'selected' : ''}>${esc(asset.original_filename || asset.asset_key)} · ${esc(statusText(asset.media_type))}${asset.duration_seconds ? ` · ${esc(formatTime(asset.duration_seconds))}` : ''}${asset.private_object ? ' · private R2' : ''}</option>`).join('')}`;
  }

  function badge(label, ok = false) {
    return `<span class="caip439-badge ${ok ? 'ok' : ''}">${esc(label)}</span>`;
  }

  function renderPlayer(asset) {
    if (!asset) return '<div class="caip439-player-empty">Choose a video or audio source.</div>';
    const secure = state.secureUrls.get(num(asset.creative_asset_id)) || '';
    const src = text(asset.source_url) || secure;
    if (!src) {
      return `<div class="caip439-player-empty"><strong>${esc(asset.original_filename || asset.asset_key)}</strong><p>This is a private CAIP original. Create a short-lived authenticated review stream to play and scrub it without making the raw object public.</p><button class="btn" type="button" data-caip439-secure-review="${num(asset.creative_asset_id)}">Start secure private review</button></div>`;
    }
    if (text(asset.media_type).toLowerCase() === 'audio') {
      return `<audio id="caip439Player" controls preload="metadata" src="${esc(src)}"></audio>`;
    }
    return `<video id="caip439Player" controls preload="metadata" playsinline src="${esc(src)}"></video>`;
  }

  function newMarkerForm(asset) {
    const duration = asset?.duration_seconds || null;
    return `<section class="card caip439-form-card">
      <h3 style="margin-top:0">Capture reviewed evidence</h3>
      <p class="caip439-help">Capture the current playhead as a point, or capture start and end for a range. Saving evidence records review metadata only; it never edits the source file.</p>
      <div class="caip439-timebar">
        <button class="btn secondary" type="button" id="caip439CaptureStart">Capture start</button>
        <button class="btn secondary" type="button" id="caip439CaptureEnd">Capture end</button>
        <button class="btn secondary" type="button" id="caip439ClearEnd">Point only</button>
        <span class="caip439-timecode">start <b id="caip439StartDisplay">${state.capturedStart == null ? '—' : esc(formatTime(state.capturedStart))}</b> · end <b id="caip439EndDisplay">${state.capturedEnd == null ? '—' : esc(formatTime(state.capturedEnd))}</b></span>
      </div>
      <div class="caip439-form-grid" style="margin-top:10px">
        <label>Category<select class="input" id="caip439NewCategory">${CATEGORY_OPTIONS.map((value) => `<option value="${value}">${esc(statusText(value))}</option>`).join('')}</select></label>
        <label>Confidence<input class="input" id="caip439NewConfidence" type="number" min="0" max="100" value="100"/></label>
        <label class="full">Evidence title<input class="input" id="caip439NewTitle" maxlength="240" placeholder="What is proven at this moment?"/></label>
        <label class="full">Observation / lesson<textarea class="input" id="caip439NewNote" rows="3" maxlength="5000" placeholder="Describe only what you can support from the source."></textarea></label>
        <label class="full">Transcript excerpt / spoken words (optional)<textarea class="input" id="caip439NewTranscript" rows="2" maxlength="5000" placeholder="Manual excerpt now; provider transcript remains a separately verified future artifact."></textarea></label>
        <label>Verification<select class="input" id="caip439NewVerification"><option value="source_observed">source observed</option><option value="confirmed">confirmed</option><option value="unverified">unverified</option></select></label>
        <label>Review<select class="input" id="caip439NewReview"><option value="needs_review">needs review</option><option value="approved">approved</option><option value="rejected">rejected</option></select></label>
        <label>Visibility<select class="input" id="caip439NewVisibility"><option value="internal">internal</option><option value="public_candidate">public candidate</option></select></label>
        <label class="check"><input id="caip439NewStoryCandidate" type="checkbox" checked/> Story candidate</label>
      </div>
      <div class="caip439-actions"><button class="btn" type="button" id="caip439SaveNewMarker" ${!asset ? 'disabled' : ''}>Save temporal evidence</button></div>
      ${duration ? `<p class="caip439-help">Recorded source duration: ${esc(formatTime(duration))}. Browser metadata can refine the duration while reviewing.</p>` : ''}
    </section>`;
  }

  function markerCard(marker) {
    const id = num(marker.creative_media_evidence_range_id);
    const archived = marker.marker_status === 'archived';
    const linked = num(marker.linked_story_evidence_id);
    const evidenceApproved = marker.linked_evidence_review_status === 'approved';
    const draftEligible = marker.review_status === 'approved' && linked && evidenceApproved && !archived;
    return `<article class="caip439-marker ${archived ? 'is-archived' : ''}" data-caip439-marker="${id}">
      <div class="caip439-marker-top"><div><strong>${esc(marker.title)}</strong><small>${esc(marker.original_filename || marker.asset_key)} · <span class="caip439-timecode">${esc(formatTime(marker.start_seconds))}${marker.end_seconds != null ? `–${esc(formatTime(marker.end_seconds))}` : ''}</span></small></div><div class="caip439-marker-meta">${badge(statusText(marker.evidence_category), true)}${badge(statusText(marker.review_status), marker.review_status === 'approved')}${badge(statusText(marker.verification_status), marker.verification_status === 'confirmed')}${archived ? badge('archived') : ''}</div></div>
      <div class="caip439-marker-fields">
        <label>Title<input class="input" data-caip439-title value="${esc(marker.title)}"/></label>
        <label>Category<select class="input" data-caip439-category>${CATEGORY_OPTIONS.map((value) => `<option value="${value}" ${marker.evidence_category === value ? 'selected' : ''}>${esc(statusText(value))}</option>`).join('')}</select></label>
        <label>Review<select class="input" data-caip439-review>${['needs_review','approved','rejected'].map((value) => `<option value="${value}" ${marker.review_status === value ? 'selected' : ''}>${esc(statusText(value))}</option>`).join('')}</select></label>
        <label>Start seconds<input class="input" data-caip439-start type="number" step="0.1" min="0" value="${esc(marker.start_seconds)}"/></label>
        <label>End seconds<input class="input" data-caip439-end type="number" step="0.1" min="0" value="${marker.end_seconds == null ? '' : esc(marker.end_seconds)}"/></label>
        <label>Verification<select class="input" data-caip439-verification>${['source_observed','confirmed','unverified','rejected'].map((value) => `<option value="${value}" ${marker.verification_status === value ? 'selected' : ''}>${esc(statusText(value))}</option>`).join('')}</select></label>
        <label class="wide">Observation<textarea class="input" rows="2" data-caip439-note>${esc(marker.note_text || '')}</textarea></label>
        <label>Visibility<select class="input" data-caip439-visibility><option value="internal" ${marker.visibility === 'internal' ? 'selected' : ''}>internal</option><option value="public_candidate" ${marker.visibility === 'public_candidate' ? 'selected' : ''}>public candidate</option></select></label>
      </div>
      <div class="caip439-actions">
        <button class="btn secondary" type="button" data-caip439-seek="${id}">Seek</button>
        ${archived ? '' : `<button class="btn" type="button" data-caip439-save="${id}">Save review</button>`}
        ${!archived && marker.review_status === 'approved' && !linked ? `<button class="btn secondary" type="button" data-caip439-promote="${id}">Promote to story evidence</button>` : ''}
        ${linked && !evidenceApproved ? `<button class="btn secondary" type="button" data-caip439-approve-evidence="${id}" data-evidence-id="${linked}">Approve linked story evidence</button>` : ''}
        ${linked ? `<span class="caip439-badge ${evidenceApproved ? 'ok' : ''}">story evidence ${esc(marker.linked_evidence_key || linked)} · ${esc(statusText(marker.linked_evidence_review_status))}</span>` : ''}
        ${!archived ? `<button class="btn danger" type="button" data-caip439-archive="${id}">Archive marker</button>` : ''}
        <label class="check"><input type="checkbox" data-caip439-story-select="${id}" ${draftEligible ? '' : 'disabled'}/> Use in story draft</label>
      </div>
    </article>`;
  }

  function markersSection() {
    const markers = array(state.bundle?.markers);
    return `<section class="card caip439-markers"><div class="caip439-head"><div><h3>Temporal evidence ledger</h3><p class="small">Approved marker → story evidence review → optional story draft. Nothing here publishes content.</p></div>${badge(`${markers.filter((m) => m.marker_status === 'active').length} active`, true)}</div><div class="caip439-marker-list">${markers.map(markerCard).join('') || '<p class="small">No timecode evidence yet.</p>'}</div></section>`;
  }

  function storySection() {
    const segments = array(state.bundle?.segments);
    return `<section class="card caip439-story"><div class="caip439-head"><div><h3>Reviewed evidence → story draft</h3><p class="small">Only markers whose temporal review and linked story evidence are approved can be selected. The draft stays internal.</p></div>${badge(`${segments.length} segment${segments.length === 1 ? '' : 's'}`)}</div><div class="caip439-story-grid"><div><label>Draft title<input class="input" id="caip439DraftTitle" placeholder="Optional; otherwise generated from reviewed evidence"/></label><label>Draft narrative override (optional)<textarea class="input" id="caip439DraftNarrative" rows="4" placeholder="Leave blank to assemble a deterministic internal draft from selected reviewed observations."></textarea></label><div class="caip439-actions"><button class="btn" id="caip439DraftSegment" type="button">Create internal story draft</button><button class="btn secondary" id="caip439DownloadManifest" type="button">Download evidence manifest</button></div></div><div class="caip439-segment-list">${segments.slice().reverse().slice(0,8).map((segment) => `<div class="caip439-row"><div><strong>${esc(segment.title)}</strong><small>${esc(statusText(segment.segment_status))} · ${num(segment.temporal_link_count)} temporal link${num(segment.temporal_link_count) === 1 ? '' : 's'}</small></div></div>`).join('') || '<p class="small">No story segments yet.</p>'}</div></div></section>`;
  }

  function processingSection() {
    const jobs = array(state.bundle?.processing?.jobs);
    const artifacts = array(state.bundle?.processing?.artifacts);
    const outputJobs = jobs.filter((job) => OUTPUT_JOB_TYPES.has(text(job.job_type)));
    return `<section class="card caip439-processing"><details><summary><strong>Processing artifacts and provider verification</strong> · ${jobs.length} job${jobs.length === 1 ? '' : 's'} / ${artifacts.length} artifact${artifacts.length === 1 ? '' : 's'}</summary><p class="caip439-help">Providers remain disabled unless separately configured. This area registers metadata for a future provider output and verifies the bound R2 object. Media-output jobs cannot be marked complete without a verified artifact.</p><div class="caip439-processing-grid"><div><h4>Jobs</h4><div class="caip439-job-list">${outputJobs.map((job) => `<div class="caip439-row"><div><strong>${esc(statusText(job.job_type))}</strong><small>${esc(job.original_filename || job.asset_key)} · ${esc(statusText(job.job_status))} · ${num(job.verified_artifact_count)}/${num(job.artifact_count)} verified</small></div>${job.job_status !== 'complete' && num(job.verified_artifact_count) > 0 ? `<button class="btn small" type="button" data-caip439-complete-job="${num(job.caip_media_processing_job_id)}">Complete verified job</button>` : ''}</div>`).join('') || '<p class="small">No media-output processing plans yet.</p>'}</div></div><div><h4>Register output metadata</h4><label>Processing job<select class="input" id="caip439ArtifactJob"><option value="">Choose job…</option>${outputJobs.map((job) => `<option value="${num(job.caip_media_processing_job_id)}">${esc(statusText(job.job_type))} · ${esc(job.original_filename || job.asset_key)}</option>`).join('')}</select></label><label>Private R2 object key<input class="input" id="caip439ArtifactObjectKey" placeholder="projects/.../derived/..."/></label><label>MIME type<input class="input" id="caip439ArtifactMime" placeholder="video/mp4"/></label><label>Expected bytes<input class="input" id="caip439ArtifactBytes" type="number" min="0" placeholder="optional"/></label><div class="caip439-actions"><button class="btn secondary" id="caip439RegisterArtifact" type="button">Register artifact metadata</button></div><div class="caip439-artifact-list">${artifacts.slice(0,10).map((artifact) => `<div class="caip439-row"><div><strong>${esc(statusText(artifact.artifact_role))}</strong><small>${esc(artifact.object_key || '')} · ${esc(statusText(artifact.verification_status))}</small></div>${['pending','missing','mismatch'].includes(text(artifact.verification_status)) ? `<button class="btn small" type="button" data-caip439-verify-artifact="${num(artifact.caip_media_processing_artifact_id)}">Verify R2 HEAD</button>` : ''}</div>`).join('') || '<p class="small">No processing artifacts registered.</p>'}</div></div></div></details></section>`;
  }

  function body() {
    const bundle = state.bundle;
    const asset = selectedAsset();
    if (asset && !state.assetId) state.assetId = num(asset.creative_asset_id);
    if (!bundle) return '<section class="card"><p>Choose a CAIP project to start temporal evidence review.</p></section>';
    if (!bundle.schema_ready) {
      return `<section class="card caip439-migration"><h3>Build 439 migration required</h3><p>Existing CAIP remains available, but temporal evidence writes are blocked until <code>database_build439_caip_temporal_evidence_review.sql</code> is applied through the normal Development migration process.</p><p class="small">Missing: ${esc(array(bundle.missing_tables).join(', ') || 'Build 439 authority')}</p></section>`;
    }
    return `<div class="caip439-grid"><section class="card caip439-player-card"><div class="caip439-head"><div><h3>Media review</h3><p class="small">Scrub the source, then capture exact evidence points/ranges.</p></div>${asset?.private_object ? badge('private R2', true) : badge('reference source')}</div><div class="caip439-player-wrap">${renderPlayer(asset)}</div><div class="caip439-timebar"><span>Playhead <b class="caip439-timecode" id="caip439Playhead">0:00</b></span>${asset?.duration_seconds ? `<span>recorded duration <b class="caip439-timecode">${esc(formatTime(asset.duration_seconds))}</b></span>` : ''}</div></section>${newMarkerForm(asset)}</div>${markersSection()}${storySection()}${processingSection()}`;
  }

  function render() {
    const bundle = state.bundle;
    const counts = bundle?.counts || {};
    mount.innerHTML = `<section class="caip439-shell"><section class="card"><div class="caip439-head"><div><p class="eyebrow">Build 439 · Creative & Production</p><h2>CAIP Media Evidence Review</h2><p class="small">Play and scrub video/audio, capture exact source-backed evidence, promote reviewed markers into the existing story ledger, and draft internal story structure without publishing or changing the original.</p></div><div class="caip439-badges">${badge(`Build ${BUILD}`, true)}${badge(bundle?.schema_ready ? 'schema ready' : 'migration pending', Boolean(bundle?.schema_ready))}${bundle?.schema_ready ? badge(`${num(counts.approved_markers)}/${num(counts.markers)} markers approved`) : ''}</div></div><div class="caip439-controls"><label>CAIP project<select class="input" id="caip439Project">${projectOptions()}</select></label><label>Video / audio<select class="input" id="caip439Asset" ${!state.projectId ? 'disabled' : ''}>${assetOptions()}</select></label></div><p id="caip439Status" class="small caip439-status" data-tone="${esc(state.tone)}">${esc(state.message)}</p></section>${body()}</section>`;
    bind();
  }

  function apply(data) {
    if (Array.isArray(data.projects)) state.projects = data.projects;
    if (data.project !== undefined) {
      state.bundle = data;
      state.projectId = num(data.project?.creative_project_id || state.projectId);
      const assets = array(data.assets).filter((asset) => asset.can_temporal_review);
      if (!assets.some((asset) => num(asset.creative_asset_id) === state.assetId)) state.assetId = num(assets[0]?.creative_asset_id);
    }
  }

  async function loadProject(projectId) {
    state.projectId = num(projectId);
    state.capturedStart = null;
    state.capturedEnd = null;
    if (!state.projectId) { state.bundle = null; render(); return; }
    setMessage('Loading Build 439 evidence review…');
    const data = await apiJson(`${API}?creative_project_id=${encodeURIComponent(state.projectId)}`, { cache: 'no-store' });
    apply(data);
    const url = new URL(location.href);
    url.searchParams.set('creative_project_id', String(state.projectId));
    history.replaceState(null, '', url);
    setMessage(data.schema_ready ? 'Evidence review ready. Source originals remain unchanged.' : 'Build 439 migration is not applied yet.', data.schema_ready ? 'ok' : 'warning');
    render();
  }

  async function post(payload, successMessage = 'Saved.') {
    if (state.busy) return null;
    state.busy = true;
    setMessage('Saving…');
    try {
      const data = await apiJson(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creative_project_id: state.projectId, ...payload }),
      });
      apply(data);
      setMessage(successMessage, 'ok');
      render();
      return data;
    } catch (error) {
      setMessage(error.message || 'Build 439 request failed.', 'error');
      throw error;
    } finally {
      state.busy = false;
    }
  }

  function player() { return q('#caip439Player'); }
  function playerTime() { return Math.max(0, Number(player()?.currentTime || 0)); }
  function playerDuration() {
    const media = player();
    if (media && Number.isFinite(Number(media.duration)) && Number(media.duration) > 0) return Number(media.duration);
    return Number(selectedAsset()?.duration_seconds || 0) || null;
  }
  function updateCapturedDisplays() {
    const start = q('#caip439StartDisplay'); const end = q('#caip439EndDisplay');
    if (start) start.textContent = state.capturedStart == null ? '—' : formatTime(state.capturedStart);
    if (end) end.textContent = state.capturedEnd == null ? '—' : formatTime(state.capturedEnd);
  }

  async function createSecureReview(assetId) {
    if (!state.projectId || !assetId) return;
    setMessage('Creating short-lived authenticated review stream…');
    const data = await apiJson(LEGACY_CAIP_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_secure_review_link', creative_project_id: state.projectId, creative_asset_id: assetId, expires_in_minutes: 60, max_access_count: 100 }),
    });
    const url = text(data.result?.review_url);
    if (!url) throw new Error('Secure review URL was not returned.');
    state.secureUrls.set(assetId, url);
    setMessage('Secure private review ready. The raw R2 object remains private.', 'ok');
    render();
  }

  async function saveNewMarker() {
    const asset = selectedAsset();
    if (!asset) throw new Error('Choose video or audio first.');
    const start = state.capturedStart == null ? playerTime() : state.capturedStart;
    const end = state.capturedEnd;
    await post({
      action: 'save_marker', creative_asset_id: num(asset.creative_asset_id), caip_media_upload_file_id: num(asset.caip_media_upload_file_id) || null,
      start_seconds: start, end_seconds: end, source_duration_seconds: playerDuration(),
      evidence_category: q('#caip439NewCategory')?.value || 'process_proof', confidence_score: num(q('#caip439NewConfidence')?.value || 100),
      title: q('#caip439NewTitle')?.value || '', note_text: q('#caip439NewNote')?.value || '', transcript_excerpt: q('#caip439NewTranscript')?.value || '',
      verification_status: q('#caip439NewVerification')?.value || 'source_observed', review_status: q('#caip439NewReview')?.value || 'needs_review',
      visibility: q('#caip439NewVisibility')?.value || 'internal', story_candidate: q('#caip439NewStoryCandidate')?.checked ? 1 : 0,
    }, 'Temporal evidence saved.');
    state.capturedStart = null; state.capturedEnd = null;
  }

  function markerPayload(id) {
    const row = q(`[data-caip439-marker="${id}"]`);
    const original = array(state.bundle?.markers).find((item) => num(item.creative_media_evidence_range_id) === num(id));
    if (!row || !original) throw new Error('Temporal marker is unavailable.');
    return {
      action: 'save_marker', creative_media_evidence_range_id: id, creative_asset_id: num(original.creative_asset_id), caip_media_upload_file_id: num(original.caip_media_upload_file_id) || null,
      start_seconds: q('[data-caip439-start]', row)?.value, end_seconds: q('[data-caip439-end]', row)?.value,
      source_duration_seconds: original.source_duration_seconds,
      title: q('[data-caip439-title]', row)?.value, evidence_category: q('[data-caip439-category]', row)?.value,
      review_status: q('[data-caip439-review]', row)?.value, verification_status: q('[data-caip439-verification]', row)?.value,
      visibility: q('[data-caip439-visibility]', row)?.value, note_text: q('[data-caip439-note]', row)?.value,
      transcript_excerpt: original.transcript_excerpt || '', confidence_score: original.confidence_score, story_candidate: original.story_candidate,
    };
  }

  function seekMarker(id) {
    const marker = array(state.bundle?.markers).find((item) => num(item.creative_media_evidence_range_id) === num(id));
    const asset = marker && array(state.bundle?.assets).find((item) => num(item.creative_asset_id) === num(marker.creative_asset_id));
    if (!marker || !asset) return;
    state.assetId = num(asset.creative_asset_id);
    render();
    const media = player();
    if (media) {
      const seek = () => { try { media.currentTime = Math.max(0, Number(marker.start_seconds || 0)); } catch {} };
      if (media.readyState >= 1) seek(); else media.addEventListener('loadedmetadata', seek, { once: true });
    }
  }

  async function draftSegment() {
    const markerIds = qa('[data-caip439-story-select]:checked').map((input) => num(input.dataset.caip439StorySelect)).filter(Boolean);
    if (!markerIds.length) throw new Error('Select at least one approved marker with approved linked story evidence.');
    await post({ action: 'draft_story_segment', marker_ids: markerIds, title: q('#caip439DraftTitle')?.value || '', narrative_text: q('#caip439DraftNarrative')?.value || '' }, 'Internal story draft created from reviewed evidence.');
  }

  async function downloadManifest() {
    const response = await apiFetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'manifest', creative_project_id: state.projectId }),
    });
    if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Manifest download failed.'); }
    const blob = await response.blob();
    const href = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = href; anchor.download = `${text(state.bundle?.project?.creative_project_key) || 'caip-project'}-temporal-evidence.json`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(href);
    setMessage('Build 439 temporal-evidence manifest downloaded.', 'ok');
  }

  function bind() {
    q('#caip439Project')?.addEventListener('change', (event) => { void loadProject(event.target.value).catch((error) => setMessage(error.message, 'error')); });
    q('#caip439Asset')?.addEventListener('change', (event) => { state.assetId = num(event.target.value); state.capturedStart = null; state.capturedEnd = null; render(); });
    q('[data-caip439-secure-review]')?.addEventListener('click', (event) => { void createSecureReview(num(event.currentTarget.dataset.caip439SecureReview)).catch((error) => setMessage(error.message, 'error')); });
    q('#caip439CaptureStart')?.addEventListener('click', () => { state.capturedStart = playerTime(); if (state.capturedEnd != null && state.capturedEnd < state.capturedStart) state.capturedEnd = null; updateCapturedDisplays(); });
    q('#caip439CaptureEnd')?.addEventListener('click', () => { const value = playerTime(); state.capturedEnd = state.capturedStart != null && value <= state.capturedStart ? null : value; updateCapturedDisplays(); });
    q('#caip439ClearEnd')?.addEventListener('click', () => { state.capturedEnd = null; updateCapturedDisplays(); });
    q('#caip439SaveNewMarker')?.addEventListener('click', () => { void saveNewMarker().catch((error) => setMessage(error.message, 'error')); });
    q('#caip439DraftSegment')?.addEventListener('click', () => { void draftSegment().catch((error) => setMessage(error.message, 'error')); });
    q('#caip439DownloadManifest')?.addEventListener('click', () => { void downloadManifest().catch((error) => setMessage(error.message, 'error')); });
    q('#caip439RegisterArtifact')?.addEventListener('click', () => {
      const jobId = num(q('#caip439ArtifactJob')?.value); const objectKey = q('#caip439ArtifactObjectKey')?.value || '';
      void post({ action: 'register_processing_artifact', caip_media_processing_job_id: jobId, object_key: objectKey, mime_type: q('#caip439ArtifactMime')?.value || '', file_size_bytes: q('#caip439ArtifactBytes')?.value || null, storage_provider: 'r2_private_caip', bucket_alias: 'CAIP_PRIVATE_MEDIA_BUCKET' }, 'Processing artifact metadata registered; R2 verification still required.').catch((error) => setMessage(error.message, 'error'));
    });

    qa('[data-caip439-seek]').forEach((button) => button.addEventListener('click', () => seekMarker(num(button.dataset.caip439Seek))));
    qa('[data-caip439-save]').forEach((button) => button.addEventListener('click', () => { const id = num(button.dataset.caip439Save); void post(markerPayload(id), 'Temporal evidence review saved.').catch((error) => setMessage(error.message, 'error')); }));
    qa('[data-caip439-promote]').forEach((button) => button.addEventListener('click', () => { void post({ action: 'promote_marker', creative_media_evidence_range_id: num(button.dataset.caip439Promote) }, 'Marker promoted to the existing story evidence ledger for human review.').catch((error) => setMessage(error.message, 'error')); }));
    qa('[data-caip439-approve-evidence]').forEach((button) => button.addEventListener('click', () => { void post({ action: 'review_story_evidence', creative_story_evidence_id: num(button.dataset.evidenceId), review_status: 'approved' }, 'Linked story evidence approved.').catch((error) => setMessage(error.message, 'error')); }));
    qa('[data-caip439-archive]').forEach((button) => button.addEventListener('click', () => { if (!confirm('Archive this temporal evidence marker? The source media and any existing story evidence remain unchanged.')) return; void post({ action: 'archive_marker', creative_media_evidence_range_id: num(button.dataset.caip439Archive) }, 'Temporal marker archived.').catch((error) => setMessage(error.message, 'error')); }));
    qa('[data-caip439-verify-artifact]').forEach((button) => button.addEventListener('click', () => { void post({ action: 'verify_processing_artifact', caip_media_processing_artifact_id: num(button.dataset.caip439VerifyArtifact) }, 'Processing artifact R2 HEAD verification completed.').catch((error) => setMessage(error.message, 'error')); }));
    qa('[data-caip439-complete-job]').forEach((button) => button.addEventListener('click', () => { void post({ action: 'complete_processing_job', caip_media_processing_job_id: num(button.dataset.caip439CompleteJob) }, 'Verified processing job marked complete.').catch((error) => setMessage(error.message, 'error')); }));

    const media = player();
    if (media) {
      const update = () => { const node = q('#caip439Playhead'); if (node) node.textContent = formatTime(media.currentTime || 0); };
      media.addEventListener('timeupdate', update);
      media.addEventListener('seeked', update);
      media.addEventListener('loadedmetadata', update);
    }
  }

  async function init() {
    setMessage('Loading CAIP projects…');
    const data = await apiJson(API, { cache: 'no-store' });
    state.projects = array(data.projects);
    const params = new URLSearchParams(location.search);
    const requested = num(params.get('creative_project_id') || params.get('project_id'));
    const preferred = requested || num(state.projects.find((project) => num(project.temporal_asset_count) > 0)?.creative_project_id) || num(state.projects[0]?.creative_project_id);
    if (preferred) await loadProject(preferred);
    else { setMessage('No CAIP projects are available yet.'); render(); }
  }

  document.addEventListener('DOMContentLoaded', () => { void init().catch((error) => { console.error('[Build 439 CAIP evidence review]', error); setMessage(error.message || 'CAIP evidence review could not load.', 'error'); render(); }); }, { once: true });
})();
