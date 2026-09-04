// Release 467 Build 47 — review-first Grey Hair story/edit planning UI.
// Consumes only confirmed Build 46 sync groups and approved source evidence.
// No provider execution, rendering, publication or R2 mutation is exposed here.
document.addEventListener('DOMContentLoaded', () => {
  const projectEl = document.getElementById('greyHairStoryProject');
  const groupEl = document.getElementById('greyHairStoryGroup');
  const messageEl = document.getElementById('greyHairStoryMessage');
  const summaryEl = document.getElementById('greyHairStorySummary');
  const evidenceEl = document.getElementById('greyHairStoryEvidence');
  const storiesEl = document.getElementById('greyHairStoryPlans');
  const editsEl = document.getElementById('greyHairEditPlans');
  if (!projectEl || !groupEl || !window.DDAuth) return;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = (value) => Number(value || 0);
  const clean = (value) => String(value ?? '').trim();
  let state = { projects: [], groups: [], evidence: [], stories: [], timelines: [], summary: {} };
  let projectId = num(new URLSearchParams(location.search).get('creative_project_id')) || 0;
  let groupId = num(new URLSearchParams(location.search).get('caip_capture_group_id')) || 0;

  function status(text, error = false) {
    if (!messageEl) return;
    messageEl.textContent = text || '';
    messageEl.className = `small ${error ? 'danger' : ''}`;
  }
  function pill(value) {
    const good = ['approved', 'review', 'confirmed'].includes(clean(value).toLowerCase());
    return `<span class="status-pill ${good ? 'ok' : ''}">${esc(value || 'draft')}</span>`;
  }
  function seconds(value) {
    const n = Number(value);
    return Number.isFinite(n) ? `${n.toFixed(3)}s` : '—';
  }
  function projectOptions() {
    return (state.projects || []).map((p) => `<option value="${num(p.creative_project_id)}" ${num(p.creative_project_id) === projectId ? 'selected' : ''}>#${num(p.creative_project_id)} · ${esc(p.project_title || p.creative_project_key)}</option>`).join('');
  }
  function readyGroups() {
    return (state.groups || []).filter((g) => g?.readiness?.ready_for_build47);
  }
  function groupOptions() {
    const ready = readyGroups();
    if (!ready.length) return '<option value="">No confirmed Build 46 group available</option>';
    return ready.map((g) => `<option value="${num(g.caip_capture_group_id)}" ${num(g.caip_capture_group_id) === groupId ? 'selected' : ''}>#${num(g.caip_capture_group_id)} · ${esc(g.title || g.capture_group_key)} · 4 cameras${num(g.readiness?.audio_count) ? ' + audio' : ''}</option>`).join('');
  }
  function syncUrl() {
    const q = new URLSearchParams();
    if (projectId) q.set('creative_project_id', String(projectId));
    return `/admin/grey-hair-sync-alignment/${q.toString() ? `?${q}` : ''}`;
  }

  async function api(method = 'GET', body = null) {
    const q = new URLSearchParams();
    if (projectId) q.set('creative_project_id', String(projectId));
    if (groupId) q.set('caip_capture_group_id', String(groupId));
    const response = await window.DDAuth.apiFetch(`/api/admin/grey-hair-story-edit-planning${method === 'GET' && q.toString() ? `?${q}` : ''}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify({ ...body, creative_project_id: projectId, caip_capture_group_id: groupId }) : undefined,
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.error || `Build 47 request failed (${response.status}).`);
    return data;
  }

  function renderSummary() {
    const s = state.summary || {};
    const active = state.active_group;
    summaryEl.innerHTML = `
      <div><strong>${num(s.confirmed_build46_groups)}</strong><small>confirmed Build 46 groups</small></div>
      <div><strong>${num(s.approved_source_evidence)}</strong><small>approved source evidence</small></div>
      <div><strong>${num(s.semantic_approved_evidence)}</strong><small>semantic approved</small></div>
      <div><strong>${num(s.transcript_backed_evidence)}</strong><small>transcript backed</small></div>
      <div><strong>${num(s.build47_story_plans)}</strong><small>Build 47 story plans</small></div>
      <div><strong>${num(s.reviewed_story_plans)}</strong><small>reviewed story plans</small></div>
      <div><strong>${num(s.build47_edit_plans)}</strong><small>Build 47 edit plans</small></div>
      <div><strong>${num(s.approved_edit_plans)}</strong><small>approved edit plans</small></div>`;
    if (!active) summaryEl.insertAdjacentHTML('afterend', `<p class="status-note danger" data-b47-no-sync><strong>Build 47 blocked:</strong> confirm a four-camera group in <a href="${esc(syncUrl())}">Build 46 Sync &amp; Audio Alignment</a> first.</p>`);
    else document.querySelector('[data-b47-no-sync]')?.remove();
  }

  function renderEvidence() {
    const evidence = state.evidence || [];
    if (!evidence.length) {
      evidenceEl.innerHTML = '<div class="card"><p class="small">No approved source-backed camera evidence is available for the selected confirmed group.</p></div>';
      return;
    }
    evidenceEl.innerHTML = evidence.map((row) => `<article class="b47-evidence">
      <div class="b47-status-row"><div><strong>${esc(row.title || row.evidence_category || 'Reviewed evidence')}</strong><div class="small">${esc(row.evidence_category || 'evidence')} · ${esc(row.camera_label || 'camera')}</div></div><div class="b47-score">${num(row.planner_score)}</div></div>
      <p class="small">${esc(row.planner_text || '')}</p>
      <div class="small b47-source">Evidence #${num(row.creative_media_evidence_range_id)} · asset #${num(row.creative_asset_id)} · ${seconds(row.start_seconds)}–${seconds(row.end_seconds)} · sync ${seconds(row.sync_offset_seconds)}</div>
      <div class="small">quality ${num(row.overall_quality_score || 0)} · source confidence ${num(row.confidence_score || 0)} · semantic ${esc(row.semantic_review_status || 'not reviewed')}</div>
    </article>`).join('');
  }

  function beatMarkup(item, index) {
    const roles = ['opening', 'story_beat', 'lesson', 'result', 'closing'];
    return `<div class="b47-beat" data-b47-beat data-evidence-id="${num(item.creative_media_evidence_range_id)}">
      <div class="b47-status-row"><strong>Beat ${index + 1} · evidence #${num(item.creative_media_evidence_range_id)}</strong><div><button class="btn secondary" type="button" data-move="up">↑</button> <button class="btn secondary" type="button" data-move="down">↓</button> <button class="btn secondary" type="button" data-remove>Remove</button></div></div>
      <div class="admin-form-grid"><label>Role<select data-beat-role>${roles.map((r) => `<option value="${r}" ${r === item.item_role ? 'selected' : ''}>${esc(r.replace('_', ' '))}</option>`).join('')}</select></label><label>Beat title<input data-beat-title value="${esc(item.item_title || '')}"></label></div>
      <label>Script / story beat<textarea data-beat-text rows="3">${esc(item.item_text || '')}</textarea></label>
      <div class="small b47-source">${esc(item.original_filename || '')} · ${seconds(item.start_seconds)}–${seconds(item.end_seconds)} · ${esc(item.evidence_category || '')}</div>
    </div>`;
  }

  function storyMarkup(story) {
    const reviewed = ['review', 'approved'].includes(clean(story.story_status).toLowerCase());
    return `<section class="card" style="margin-top:12px" data-b47-story="${num(story.caip_story_builder_draft_id)}">
      <div class="b47-status-row"><div><h3 style="margin:0">${esc(story.title || `Story #${num(story.caip_story_builder_draft_id)}`)}</h3><div class="small">Story #${num(story.caip_story_builder_draft_id)} · ${num(story.item_count)} source beat(s) · ${esc(story.generated_by)}</div></div>${pill(story.story_status)}</div>
      <div class="admin-form-grid" style="margin-top:10px"><label>Title<input data-story-title value="${esc(story.title || '')}"></label><label>Review status<select data-story-status><option value="draft" ${story.story_status === 'draft' ? 'selected' : ''}>Draft</option><option value="review" ${story.story_status === 'review' ? 'selected' : ''}>Reviewed</option><option value="approved" ${story.story_status === 'approved' ? 'selected' : ''}>Approved</option></select></label></div>
      <label>Opening summary<textarea data-story-opening rows="2">${esc(story.opening_summary || '')}</textarea></label>
      <div class="admin-form-grid"><label>Lesson summary<textarea data-story-lesson rows="2">${esc(story.lesson_summary || '')}</textarea></label><label>Result / recommendation summary<textarea data-story-recommendation rows="2">${esc(story.recommendation_summary || '')}</textarea></label></div>
      <label>Private storyboard notes<textarea data-story-notes rows="2">${esc(story.private_storyboard_notes || '')}</textarea></label>
      <h4>Source-backed beats</h4><div data-story-beats>${(story.items || []).map(beatMarkup).join('')}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn primary" type="button" data-save-story>Save story review</button></div>
      <div class="card" style="margin-top:12px;padding:12px"><strong>Edit-plan handoff</strong><p class="small">A human-reviewed or approved story is required before Build 47 can create a timeline.</p><div class="admin-form-grid"><label>Aspect ratio<select data-edit-aspect><option>16:9</option><option>9:16</option><option>1:1</option></select></label><label>Target seconds<input data-edit-duration type="number" min="15" max="900" value="90"></label></div><button class="btn" type="button" data-generate-edit ${reviewed ? '' : 'disabled'}>Generate source-backed edit plan</button></div>
    </section>`;
  }

  function renderStories() {
    storiesEl.innerHTML = (state.stories || []).length ? state.stories.map(storyMarkup).join('') : '<section class="card"><p class="small">No Build 47 story plans yet.</p></section>';
  }

  function clipMarkup(clip, index) {
    return `<div class="b47-clip" data-b47-clip data-evidence-id="${num(clip.creative_media_evidence_range_id)}">
      <div><strong>Clip ${index + 1}</strong><div class="small">evidence #${num(clip.creative_media_evidence_range_id)} · ${esc(clip.camera_label || 'camera')} · sync ${seconds(clip.sync_offset_seconds)}</div><div><button class="btn secondary" type="button" data-move="up">↑</button> <button class="btn secondary" type="button" data-move="down">↓</button> <button class="btn secondary" type="button" data-remove>Remove</button></div></div>
      <label>Source in<input data-clip-in type="number" step="0.001" value="${num(clip.source_in_seconds)}"></label>
      <label>Source out<input data-clip-out type="number" step="0.001" value="${num(clip.source_out_seconds)}"></label>
      <label>Caption / script<textarea data-clip-caption rows="2">${esc(clip.caption_text || '')}</textarea></label>
    </div>`;
  }

  function timelineMarkup(timeline) {
    const plan = timeline.plan || {};
    return `<section class="card" style="margin-top:12px" data-b47-timeline="${num(timeline.caip_edit_timeline_draft_id)}">
      <div class="b47-status-row"><div><h3 style="margin:0">${esc(timeline.title || `Edit plan #${num(timeline.caip_edit_timeline_draft_id)}`)}</h3><div class="small">Timeline #${num(timeline.caip_edit_timeline_draft_id)} · story #${num(timeline.caip_story_builder_draft_id)} · ${num(timeline.clips?.length)} clip(s) · ${Number(timeline.total_planned_seconds || 0).toFixed(2)}s planned / ${num(timeline.target_duration_seconds)}s target</div></div>${pill(timeline.timeline_status)}</div>
      ${plan.target_exceeded ? '<p class="status-note">Planned evidence duration exceeds the target. Review clip in/out points; Build 47 never silently drops approved story beats.</p>' : ''}
      <div class="admin-form-grid"><label>Title<input data-timeline-title value="${esc(timeline.title || '')}"></label><label>Review status<select data-timeline-status><option value="draft" ${timeline.timeline_status === 'draft' ? 'selected' : ''}>Draft</option><option value="review" ${timeline.timeline_status === 'review' ? 'selected' : ''}>Reviewed</option><option value="approved" ${timeline.timeline_status === 'approved' ? 'selected' : ''}>Approved</option></select></label></div>
      <div data-timeline-clips>${(timeline.clips || []).map(clipMarkup).join('')}</div>
      <button class="btn primary" type="button" data-save-edit style="margin-top:12px">Save edit review</button>
      <p class="small">Provider execution: <strong>${esc(timeline.provider_execution_status || 'closed')}</strong>. This plan is metadata only; it does not render, publish or mutate source media.</p>
    </section>`;
  }

  function renderEdits() {
    editsEl.innerHTML = (state.timelines || []).length ? state.timelines.map(timelineMarkup).join('') : '<section class="card"><p class="small">No Build 47 edit plans yet. Review a story plan first.</p></section>';
  }

  function wireMoveAndRemove(container) {
    container.querySelectorAll('[data-move]').forEach((button) => button.addEventListener('click', () => {
      const row = button.closest('[data-b47-beat],[data-b47-clip]'); if (!row) return;
      if (button.dataset.move === 'up' && row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling);
      if (button.dataset.move === 'down' && row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row);
    }));
    container.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => button.closest('[data-b47-beat],[data-b47-clip]')?.remove()));
  }

  function render() {
    projectEl.innerHTML = projectOptions();
    const ready = readyGroups();
    if (!groupId || !ready.some((g) => num(g.caip_capture_group_id) === groupId)) groupId = num(ready[0]?.caip_capture_group_id) || 0;
    groupEl.innerHTML = groupOptions();
    renderSummary(); renderEvidence(); renderStories(); renderEdits();
    wireMoveAndRemove(storiesEl); wireMoveAndRemove(editsEl);
    bindDynamic();
  }

  function storyPayload(card) {
    const beats = [...card.querySelectorAll('[data-b47-beat]')].map((row) => ({
      creative_media_evidence_range_id: num(row.dataset.evidenceId), item_role: row.querySelector('[data-beat-role]')?.value || 'story_beat',
      item_title: row.querySelector('[data-beat-title]')?.value || '', item_text: row.querySelector('[data-beat-text]')?.value || '',
    }));
    return {
      caip_story_builder_draft_id: num(card.dataset.b47Story), title: card.querySelector('[data-story-title]')?.value || '',
      story_status: card.querySelector('[data-story-status]')?.value || 'review', opening_summary: card.querySelector('[data-story-opening]')?.value || '',
      lesson_summary: card.querySelector('[data-story-lesson]')?.value || '', recommendation_summary: card.querySelector('[data-story-recommendation]')?.value || '',
      private_storyboard_notes: card.querySelector('[data-story-notes]')?.value || '', beats,
    };
  }

  function editPayload(card) {
    const clips = [...card.querySelectorAll('[data-b47-clip]')].map((row) => ({
      creative_media_evidence_range_id: num(row.dataset.evidenceId), source_in_seconds: num(row.querySelector('[data-clip-in]')?.value),
      source_out_seconds: num(row.querySelector('[data-clip-out]')?.value), caption_text: row.querySelector('[data-clip-caption]')?.value || '',
    }));
    return { caip_edit_timeline_draft_id: num(card.dataset.b47Timeline), title: card.querySelector('[data-timeline-title]')?.value || '', timeline_status: card.querySelector('[data-timeline-status]')?.value || 'review', clips };
  }

  async function post(body, success) {
    try {
      status('Saving Build 47 review-first plan…');
      const data = await api('POST', body); state = data; render(); status(success || data.message || 'Saved.');
    } catch (error) { status(error.message || 'Build 47 action failed.', true); }
  }

  function bindDynamic() {
    storiesEl.querySelectorAll('[data-save-story]').forEach((button) => button.addEventListener('click', () => {
      const card = button.closest('[data-b47-story]'); if (!card) return;
      return post({ action: 'save_story_review', ...storyPayload(card) }, 'Story review saved with source provenance intact.');
    }));
    storiesEl.querySelectorAll('[data-generate-edit]').forEach((button) => button.addEventListener('click', () => {
      const card = button.closest('[data-b47-story]'); if (!card) return;
      return post({ action: 'generate_edit_plan', caip_story_builder_draft_id: num(card.dataset.b47Story), aspect_ratio: card.querySelector('[data-edit-aspect]')?.value || '16:9', target_duration_seconds: num(card.querySelector('[data-edit-duration]')?.value) || 90 }, 'Source-backed edit plan generated for human review.');
    }));
    editsEl.querySelectorAll('[data-save-edit]').forEach((button) => button.addEventListener('click', () => {
      const card = button.closest('[data-b47-timeline]'); if (!card) return;
      return post({ action: 'save_edit_review', ...editPayload(card) }, 'Edit plan review saved; provider execution remains closed.');
    }));
  }

  async function load() {
    try {
      status('Loading Build 47 planning authority…');
      state = await api('GET');
      if (!projectId && state.projects?.length) {
        projectId = num(state.projects[0].creative_project_id); state = await api('GET');
      }
      const ready = (state.groups || []).filter((g) => g?.readiness?.ready_for_build47);
      if ((!groupId || !ready.some((g) => num(g.caip_capture_group_id) === groupId)) && ready.length) {
        groupId = num(ready[0].caip_capture_group_id); state = await api('GET');
      }
      render(); status(state.active_group ? 'Build 47 planning authority loaded.' : 'Build 47 is waiting for a confirmed Build 46 four-camera group.', !state.active_group);
    } catch (error) { status(error.message || 'Build 47 planning authority is unavailable.', true); }
  }

  projectEl.addEventListener('change', async () => { projectId = num(projectEl.value); groupId = 0; history.replaceState(null, '', `${location.pathname}?creative_project_id=${projectId}`); await load(); });
  groupEl.addEventListener('change', async () => { groupId = num(groupEl.value); const q = new URLSearchParams({ creative_project_id: String(projectId), caip_capture_group_id: String(groupId) }); history.replaceState(null, '', `${location.pathname}?${q}`); await load(); });
  document.getElementById('greyHairStoryRefresh')?.addEventListener('click', load);
  document.getElementById('greyHairGenerateStory')?.addEventListener('click', () => post({
    action: 'generate_story_plan', title: document.getElementById('greyHairStoryTitle')?.value || '',
    target_beats: num(document.getElementById('greyHairStoryTargetBeats')?.value) || 7,
    private_storyboard_notes: document.getElementById('greyHairStoryNotes')?.value || '',
  }, 'Source-backed story plan generated. Review it before creating an edit plan.'));

  void load();
});
