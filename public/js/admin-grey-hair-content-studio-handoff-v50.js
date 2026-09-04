// Release 467 Build 50 — Reviewed CAIP to Content Studio Handoff UI.
// Explicit operator action only. No polling, rendering, provider execution, publication, social queueing or R2 mutation.
(() => {
  const byId = (id) => document.getElementById(id);
  const project = byId('b50Project');
  const group = byId('b50Group');
  const timeline = byId('b50Timeline');
  const refresh = byId('b50Refresh');
  const handoff = byId('b50Handoff');
  const message = byId('b50Message');
  const summary = byId('b50Summary');
  if (!project || !group || !timeline || !window.DDAuth) return;

  const state = { data: null, busy: false };
  const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const integer = (value) => { const n = Number(value || 0); return Number.isInteger(n) && n > 0 ? n : 0; };
  const plain = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const setMessage = (text, type = '') => { message.textContent = text || ''; message.className = `small ${type}`.trim(); };

  async function getData(params = {}) {
    const url = new URL('/api/admin/grey-hair-content-studio-handoff', window.location.origin);
    Object.entries(params).forEach(([key, value]) => { if (value) url.searchParams.set(key, String(value)); });
    const response = await window.DDAuth.apiFetch(`${url.pathname}${url.search}`);
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || `Build 50 authority failed (${response.status}).`);
    return data;
  }

  function projectOptions(data) {
    const rows = Array.isArray(data?.projects) ? data.projects : [];
    project.innerHTML = `<option value="">Choose Grey Hair project…</option>${rows.map((row) => `<option value="${esc(row.creative_project_id)}">${esc(row.project_title || row.creative_project_key || `Project ${row.creative_project_id}`)}</option>`).join('')}`;
  }

  function groupOptions(data, selected = 0) {
    const rows = Array.isArray(data?.groups) ? data.groups : [];
    const active = integer(data?.active_group?.caip_capture_group_id);
    group.innerHTML = `<option value="">Choose confirmed group…</option>${rows.map((row) => {
      const id = integer(row.caip_capture_group_id);
      const readiness = row?.readiness?.ready_for_build47 === true ? 'confirmed' : plain(row.sync_status || 'not ready');
      return `<option value="${id}" ${id === (selected || active) ? 'selected' : ''}>Group ${id} — ${esc(readiness)}</option>`;
    }).join('')}`;
  }

  function timelineOptions(data, selected = 0) {
    const rows = Array.isArray(data?.timelines) ? data.timelines : [];
    const decisions = new Map((data?.acceptances || []).map((row) => [integer(row.caip_edit_timeline_draft_id), row]));
    timeline.innerHTML = `<option value="">Choose accepted timeline…</option>${rows.map((row) => {
      const id = integer(row.caip_edit_timeline_draft_id);
      const acceptance = decisions.get(id);
      const decision = acceptance?.decision || 'HOLD';
      const duration = Number(row.total_planned_seconds || 0).toFixed(1);
      return `<option value="${id}" ${id === selected ? 'selected' : ''} ${decision !== 'ACCEPTED_FOR_CONTROLLED_PRODUCTION' ? 'disabled' : ''}>${esc(row.title || `Timeline ${id}`)} — ${esc(row.aspect_ratio || '')} • ${duration}s • ${esc(decision)}</option>`;
    }).join('')}`;
  }

  function selectedAcceptance(data) {
    const id = integer(timeline.value);
    return (data?.acceptances || []).find((row) => integer(row.caip_edit_timeline_draft_id) === id) || null;
  }

  function renderSummary(data) {
    const acceptance = selectedAcceptance(data);
    const timelineRow = (data?.timelines || []).find((row) => integer(row.caip_edit_timeline_draft_id) === integer(timeline.value)) || null;
    const cards = [];
    cards.push(`<div class="b50-status"><strong>Build 48 decision</strong><span class="small">${esc(acceptance?.decision || 'Choose an accepted timeline')}</span></div>`);
    cards.push(`<div class="b50-status"><strong>Content Studio package</strong><span class="small">${data?.existing_content_project_id ? `Existing #${esc(data.existing_content_project_id)}` : 'Will create / resolve existing package'}</span></div>`);
    cards.push(`<div class="b50-status"><strong>Creative Process source</strong><span class="small">${data?.creative_work_project_id ? `#${esc(data.creative_work_project_id)}` : 'Must resolve before handoff'}</span></div>`);
    cards.push(`<div class="b50-status"><strong>Timeline</strong><span class="small">${timelineRow ? `${esc(timelineRow.aspect_ratio || '')} • ${Number(timelineRow.total_planned_seconds || 0).toFixed(3)}s planned / ${Number(timelineRow.target_duration_seconds || 0).toFixed(3)}s target` : 'No timeline selected'}</span></div>`);
    if (acceptance?.package_id) cards.push(`<div class="b50-status"><strong>Immutable planning package</strong><span class="small b50-code">${esc(acceptance.package_id)}</span></div>`);
    cards.push(`<div class="b50-status"><strong>Execution boundary</strong><span class="small">Review metadata only — no renderer, provider, publication, social queue or R2 write.</span></div>`);
    summary.innerHTML = cards.join('');
    handoff.disabled = state.busy || !acceptance || acceptance.decision !== 'ACCEPTED_FOR_CONTROLLED_PRODUCTION' || !integer(data?.creative_work_project_id);
  }

  async function loadRoot() {
    state.busy = true; handoff.disabled = true; setMessage('Loading Build 50 authority…');
    try {
      const data = await getData();
      state.data = data; projectOptions(data); group.innerHTML = '<option value="">Choose project first</option>'; timeline.innerHTML = '<option value="">Choose group first</option>';
      renderSummary(data); setMessage('Choose the Grey Hair project.', 'success');
    } catch (error) { setMessage(error.message || 'Could not load Build 50.', 'error'); }
    finally { state.busy = false; renderSummary(state.data || {}); }
  }

  async function loadProject(preferredGroup = 0, preferredTimeline = 0) {
    const projectId = integer(project.value);
    if (!projectId) return loadRoot();
    state.busy = true; handoff.disabled = true; setMessage('Re-proving Build 48 acceptance…');
    try {
      const params = { creative_project_id: projectId };
      if (preferredGroup) params.caip_capture_group_id = preferredGroup;
      if (preferredTimeline) params.caip_edit_timeline_draft_id = preferredTimeline;
      const data = await getData(params);
      state.data = data;
      const active = preferredGroup || integer(data?.active_group?.caip_capture_group_id);
      groupOptions(data, active);
      timelineOptions(data, preferredTimeline);
      if (!preferredTimeline) {
        const firstAccepted = (data.acceptances || []).find((row) => row.decision === 'ACCEPTED_FOR_CONTROLLED_PRODUCTION');
        if (firstAccepted) timeline.value = String(integer(firstAccepted.caip_edit_timeline_draft_id));
      }
      renderSummary(data);
      const accepted = Number(data?.summary?.accepted || 0);
      setMessage(accepted ? `${accepted} Build 48 accepted timeline${accepted === 1 ? '' : 's'} available for review handoff.` : 'No Build 48 accepted timeline is currently eligible.', accepted ? 'success' : 'error');
    } catch (error) {
      setMessage(error.message || 'Could not re-prove Build 48 acceptance.', 'error');
    } finally { state.busy = false; renderSummary(state.data || {}); }
  }

  async function runHandoff() {
    const projectId = integer(project.value), groupId = integer(group.value), timelineId = integer(timeline.value);
    if (!projectId || !groupId || !timelineId || state.busy) return;
    state.busy = true; handoff.disabled = true; setMessage('Creating the review-first Content Studio handoff…');
    try {
      const response = await window.DDAuth.apiFetch('/api/admin/grey-hair-content-studio-handoff', {
        method: 'POST',
        body: JSON.stringify({ creative_project_id: projectId, caip_capture_group_id: groupId, caip_edit_timeline_draft_id: timelineId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || `Handoff failed (${response.status}).`);
      setMessage(`Content Studio package #${data.result?.content_project_id || '?'} is ready for human review. No rendering or publication was authorized.`, 'success');
      await loadProject(groupId, timelineId);
    } catch (error) { setMessage(error.message || 'Content Studio handoff failed.', 'error'); }
    finally { state.busy = false; renderSummary(state.data || {}); }
  }

  project.addEventListener('change', () => loadProject());
  group.addEventListener('change', () => loadProject(integer(group.value)));
  timeline.addEventListener('change', () => renderSummary(state.data || {}));
  refresh.addEventListener('click', () => loadProject(integer(group.value), integer(timeline.value)));
  handoff.addEventListener('click', runHandoff);
  loadRoot();
})();
