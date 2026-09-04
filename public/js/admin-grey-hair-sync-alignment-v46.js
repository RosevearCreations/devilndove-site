// Release 467 Build 46 — Four-Camera Synchronization & Audio Alignment client.
// Reviewed DB metadata only; no source-media, R2, provider or publication execution.
document.addEventListener('DOMContentLoaded', () => {
  const project = document.getElementById('greyHairSyncProject');
  const refresh = document.getElementById('greyHairSyncRefresh');
  const message = document.getElementById('greyHairSyncMessage');
  const summary = document.getElementById('greyHairSyncSummary');
  const builder = document.getElementById('greyHairSyncBuilder');
  const groupsMount = document.getElementById('greyHairSyncGroups');
  if (!project || !builder || !groupsMount || !window.DDAuth) return;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const num = (value) => Number(value || 0);
  const truthy = (value) => value === true || value === 1 || value === '1';
  let state = { projects: [], assets: [], groups: [], summary: {} };
  let projectId = Number(new URLSearchParams(location.search).get('creative_project_id') || 0) || 0;

  function setMessage(text, error = false) {
    message.textContent = text || '';
    message.className = `small${error ? ' danger' : ''}`;
  }
  async function api(method = 'GET', body = null) {
    const suffix = method === 'GET' && projectId ? `?creative_project_id=${projectId}` : '';
    const response = await window.DDAuth.apiFetch(`/api/admin/grey-hair-sync-alignment${suffix}`, {
      method,
      headers: body ? { 'Content-Type':'application/json' } : undefined,
      body: body ? JSON.stringify({ ...body, creative_project_id: projectId }) : undefined,
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.error || `Build 46 request failed (${response.status}).`);
    return data;
  }
  const cameraAssets = () => (state.assets || []).filter((row) => row.media_type === 'video' && truthy(row.private_original) && truthy(row.build45_sync_ready_input));
  const audioAssets = () => (state.assets || []).filter((row) => row.media_type === 'audio' && truthy(row.private_original));
  function optionList(rows, placeholder = 'Choose source') {
    return `<option value="">${esc(placeholder)}</option>${rows.map((row) => `<option value="${Number(row.creative_asset_id)}">#${Number(row.creative_asset_id)} · ${esc(row.original_filename || row.asset_key)} · B45 ${Number(row.build45_coverage_score || 0)}%</option>`).join('')}`;
  }
  function summaryHtml() {
    const s = state.summary || {};
    const items = [
      ['Private media', s.private_media_assets || 0], ['Build 45 ready', s.build45_ready_assets || 0],
      ['Video sources', s.video_assets || 0], ['Audio sources', s.audio_assets || 0],
      ['Sync groups', s.sync_groups || 0], ['Confirmed groups', s.confirmed_groups || 0],
    ];
    return items.map(([label, value]) => `<div><strong>${esc(value)}</strong><small>${esc(label)}</small></div>`).join('');
  }
  function builderHtml() {
    const cameras = cameraAssets();
    const audio = audioAssets();
    return `<p class="small">Choose exactly four distinct Build-45-ready video sources. The anchor is fixed to 0.000 seconds. Initial suggestions use capture timestamps first, then source timecode; anything else remains manual-review.</p>
      <div class="sync-grid">${[0,1,2,3].map((index) => `<div class="sync-track"><label>Camera ${String.fromCharCode(65 + index)}<select data-camera-slot="${index}">${optionList(cameras, `Camera ${String.fromCharCode(65 + index)}`)}</select></label><label>Label<input data-camera-label="${index}" value="Camera ${String.fromCharCode(65 + index)}"></label></div>`).join('')}</div>
      <div class="admin-form-grid" style="margin-top:12px"><label>Anchor camera<select id="greyHairSyncAnchor"><option value="0">Camera A</option><option value="1">Camera B</option><option value="2">Camera C</option><option value="3">Camera D</option></select></label><label>Dedicated audio (optional)<select id="greyHairSyncAudio">${optionList(audio, 'No dedicated audio')}</select></label><label>Audio label<input id="greyHairSyncAudioLabel" value="Master audio"></label><label>Group title<input id="greyHairSyncTitle" value="Grey Hair four-camera alignment"></label></div>
      <label>Notes<textarea id="greyHairSyncNotes" rows="2" placeholder="Capture/session context or alignment notes"></textarea></label>
      <button class="btn primary" id="greyHairSyncCreate" type="button">Create reviewed alignment group</button>`;
  }
  function trackHtml(track, group) {
    const isAnchor = Number(track.creative_asset_id) === Number(group.anchor_creative_asset_id);
    const role = String(track.source_role || 'camera');
    return `<div class="sync-track" data-track="${Number(track.caip_capture_track_id)}">
      <div class="sync-status-row"><div><strong>${esc(track.camera_label || track.original_filename || role)}</strong><div class="small">${esc(role)} · #${Number(track.creative_asset_id)} · ${esc(track.original_filename || '')}</div></div><span class="badge ${track.review_status === 'confirmed' ? 'good' : track.review_status === 'rejected' ? 'bad' : 'warn'}">${esc(track.review_status || 'needs_review')}</span></div>
      <label>Label<input data-track-label value="${esc(track.camera_label || '')}" ${isAnchor ? 'readonly' : ''}></label>
      <label>Offset seconds<input class="sync-offset" data-track-offset type="number" step="0.001" value="${Number(track.sync_offset_seconds || 0).toFixed(3)}" ${isAnchor ? 'readonly' : ''}></label>
      <label>Confidence<input data-track-confidence type="number" min="0" max="100" value="${Number(track.sync_confidence || 0)}" ${isAnchor ? 'readonly' : ''}></label>
      <label>Method<select data-track-method ${isAnchor ? 'disabled' : ''}><option value="capture_timestamp" ${track.sync_method === 'capture_timestamp' ? 'selected' : ''}>Capture timestamp</option><option value="source_timecode" ${track.sync_method === 'source_timecode' ? 'selected' : ''}>Source timecode</option><option value="manual_review" ${track.sync_method === 'manual_review' ? 'selected' : ''}>Manual reviewed offset</option><option value="manual_required" ${track.sync_method === 'manual_required' ? 'selected' : ''}>Manual required</option></select></label>
      <label>Review<select data-track-review ${isAnchor ? 'disabled' : ''}><option value="needs_review" ${track.review_status === 'needs_review' ? 'selected' : ''}>Needs review</option><option value="confirmed" ${track.review_status === 'confirmed' ? 'selected' : ''}>Confirmed</option><option value="rejected" ${track.review_status === 'rejected' ? 'selected' : ''}>Rejected</option></select></label>
      <label>Notes<input data-track-notes value="${esc(track.notes || '')}" ${isAnchor ? 'readonly' : ''}></label>
      ${isAnchor ? '<p class="small"><strong>Anchor:</strong> locked at 0.000 seconds / 100% confidence.</p>' : '<button class="btn" data-track-save type="button">Save reviewed offset</button>'}
    </div>`;
  }
  function groupHtml(group) {
    const ready = group.readiness || {};
    const blockers = Array.isArray(ready.blockers) ? ready.blockers : [];
    return `<section class="card" style="margin-top:14px" data-group="${Number(group.caip_capture_group_id)}">
      <div class="sync-status-row"><div><h3 style="margin:0">${esc(group.title || group.capture_group_key)}</h3><p class="small">Group #${Number(group.caip_capture_group_id)} · anchor #${Number(group.anchor_creative_asset_id || 0)} · ${esc(group.sync_method || '')}</p></div><span class="badge ${group.sync_status === 'confirmed' && ready.ready_for_build47 ? 'good' : group.sync_status === 'rejected' ? 'bad' : 'warn'}">${esc(group.sync_status || 'needs_review')}</span></div>
      <div class="admin-compact-tool-grid"><div><strong>${Number(ready.camera_count || 0)}/4</strong><small>camera tracks</small></div><div><strong>${Number(ready.audio_count || 0)}</strong><small>audio tracks</small></div><div><strong>${Number(ready.confirmed_track_count || 0)}</strong><small>confirmed tracks</small></div><div><strong>${ready.ready_for_build47 ? 'YES' : 'NO'}</strong><small>Build 47 ready</small></div></div>
      ${blockers.length ? `<div class="status-note warn"><strong>Confirmation blockers</strong><ul class="sync-blockers">${blockers.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : '<div class="status-note success">All four camera offsets and included audio are review-confirmed. Group can be confirmed for Build 47.</div>'}
      <div class="sync-grid" style="margin-top:12px">${(group.tracks || []).map((track) => trackHtml(track, group)).join('')}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn primary" data-group-confirm type="button" ${ready.confirmation_ready ? '' : 'disabled'}>Confirm four-camera alignment</button><button class="btn" data-group-reject type="button">Reject group</button></div>
    </section>`;
  }
  function render() {
    project.innerHTML = (state.projects || []).map((row) => `<option value="${Number(row.creative_project_id)}" ${Number(row.creative_project_id) === projectId ? 'selected' : ''}>#${Number(row.creative_project_id)} · ${esc(row.project_title || row.creative_project_key)}</option>`).join('');
    summary.innerHTML = summaryHtml();
    builder.innerHTML = builderHtml();
    groupsMount.innerHTML = (state.groups || []).map(groupHtml).join('') || '<section class="card"><p class="small">No Build 46 alignment group exists yet.</p></section>';
    bind();
  }
  async function post(body, success) {
    try {
      setMessage('Saving reviewed synchronization metadata…');
      state = await api('POST', body);
      render();
      setMessage(success || state.message || 'Saved.');
    } catch (error) { setMessage(error?.message || 'Could not save synchronization metadata.', true); }
  }
  function bind() {
    document.getElementById('greyHairSyncCreate')?.addEventListener('click', () => {
      const slots = [0,1,2,3].map((index) => Number(builder.querySelector(`[data-camera-slot="${index}"]`)?.value || 0));
      const labels = [0,1,2,3].map((index) => builder.querySelector(`[data-camera-label="${index}"]`)?.value || `Camera ${String.fromCharCode(65 + index)}`);
      const anchorIndex = Number(document.getElementById('greyHairSyncAnchor')?.value || 0);
      return post({ action:'create_or_refresh_group', camera_asset_ids:slots, camera_labels:labels, anchor_creative_asset_id:slots[anchorIndex] || 0, audio_asset_id:Number(document.getElementById('greyHairSyncAudio')?.value || 0), audio_label:document.getElementById('greyHairSyncAudioLabel')?.value || 'Master audio', title:document.getElementById('greyHairSyncTitle')?.value || '', notes:document.getElementById('greyHairSyncNotes')?.value || '' }, 'Four-camera alignment suggestions created. Review every non-anchor offset before confirmation.');
    });
    groupsMount.querySelectorAll('[data-track-save]').forEach((button) => button.addEventListener('click', () => {
      const trackNode = button.closest('[data-track]'); const groupNode = button.closest('[data-group]');
      return post({ action:'save_track_adjustment', caip_capture_group_id:Number(groupNode?.dataset.group || 0), caip_capture_track_id:Number(trackNode?.dataset.track || 0), camera_label:trackNode?.querySelector('[data-track-label]')?.value || '', sync_offset_seconds:Number(trackNode?.querySelector('[data-track-offset]')?.value || 0), sync_confidence:Number(trackNode?.querySelector('[data-track-confidence]')?.value || 0), sync_method:trackNode?.querySelector('[data-track-method]')?.value || 'manual_review', review_status:trackNode?.querySelector('[data-track-review]')?.value || 'needs_review', notes:trackNode?.querySelector('[data-track-notes]')?.value || '' }, 'Reviewed track offset saved; group returned to review until all tracks are confirmed.');
    }));
    groupsMount.querySelectorAll('[data-group-confirm]').forEach((button) => button.addEventListener('click', () => post({ action:'confirm_group', caip_capture_group_id:Number(button.closest('[data-group]')?.dataset.group || 0) }, 'Four-camera alignment confirmed and ready as a Build 47 input.')));
    groupsMount.querySelectorAll('[data-group-reject]').forEach((button) => button.addEventListener('click', () => post({ action:'reject_group', caip_capture_group_id:Number(button.closest('[data-group]')?.dataset.group || 0), notes:'Rejected during Build 46 operator review.' }, 'Synchronization group rejected.')));
  }
  async function load() {
    try {
      setMessage('Loading private synchronization metadata…');
      state = await api('GET');
      if (!projectId && state.projects?.length) { projectId = Number(state.projects[0].creative_project_id || 0); state = await api('GET'); }
      render();
      setMessage('Build 46 synchronization authority loaded. Source media remains private and unchanged.');
    } catch (error) { setMessage(error?.message || 'Build 46 synchronization workspace is unavailable.', true); builder.innerHTML = ''; groupsMount.innerHTML = ''; }
  }
  project.addEventListener('change', async () => { projectId = Number(project.value || 0); history.replaceState(null, '', `${location.pathname}?creative_project_id=${projectId}`); await load(); });
  refresh?.addEventListener('click', load);
  void load();
});
