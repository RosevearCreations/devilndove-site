// Release 467 Build 45 — Grey Hair Media Intelligence workspace.
(() => {
  'use strict';
  const RELEASE = 467;
  const BUILD = 45;
  const ENDPOINT = '/api/admin/grey-hair-media-intelligence';
  const byId = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const apiFetch = (...args) => globalThis.DDAuth?.apiFetch ? globalThis.DDAuth.apiFetch(...args) : fetch(...args);
  let data = null;

  function badge(value) {
    const label = String(value || 'unknown').replaceAll('_', ' ');
    const cls = value === 'intelligence_ready' ? 'good' : String(value || '').startsWith('blocked') ? 'bad' : 'warn';
    return `<span class="badge ${cls}">${esc(label)}</span>`;
  }

  function projectOptions(projects, selected) {
    return (projects || []).map((row) => `<option value="${Number(row.creative_project_id)}" ${Number(row.creative_project_id) === Number(selected) ? 'selected' : ''}>${esc(row.project_title || row.creative_project_key || `Project ${row.creative_project_id}`)}</option>`).join('');
  }

  function assetCard(row) {
    const size = row.width_px && row.height_px ? `${row.width_px}×${row.height_px}` : 'dimensions pending';
    const duration = row.duration_seconds ? `${Math.round(row.duration_seconds)}s` : 'duration pending';
    const categories = (row.evidence_categories || []).join(', ') || 'none yet';
    return `<article class="card" style="padding:14px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><strong>${esc(row.filename || row.asset_key)}</strong><div class="small">${esc(row.media_type)} • ${esc(duration)} • ${esc(size)}</div></div>${badge(row.readiness)}</div>
      <div class="small" style="margin-top:8px">Private source: <strong>${row.private_object ? 'proven' : 'not proven'}</strong> • Coverage: <strong>${Number(row.coverage_score || 0)}%</strong></div>
      <div class="small">Evidence markers: ${Number(row.evidence_marker_count || 0)} • approved: ${Number(row.approved_marker_count || 0)} • transcript excerpts: ${Number(row.transcript_excerpt_count || 0)} • verified artifacts: ${Number(row.verified_artifact_count || 0)}</div>
      <div class="small">Evidence categories: ${esc(categories)}</div>
      <div class="small">Build 46 input: ${row.build46_sync_ready_input ? 'ready' : 'not ready'} • Build 47 evidence input: ${row.build47_story_ready_input ? 'ready' : 'not ready'}</div>
    </article>`;
  }

  function render(payload) {
    data = payload;
    const select = byId('greyHairProject');
    if (select) select.innerHTML = projectOptions(payload.projects, payload.creative_project_id);
    const summary = payload.summary || {};
    byId('greyHairSummary').innerHTML = [
      ['Media assets', summary.asset_count || 0],
      ['Private assets', summary.private_asset_count || 0],
      ['Evidence ready', summary.evidence_ready_count || 0],
      ['Transcript covered', summary.transcript_covered_count || 0],
      ['Reviewed evidence', summary.reviewed_evidence_count || 0],
      ['Coverage', `${summary.intelligence_coverage_percent || 0}%`],
    ].map(([label, value]) => `<div><strong>${esc(value)}</strong><small>${esc(label)}</small></div>`).join('');
    byId('greyHairAssets').innerHTML = (payload.assets || []).map(assetCard).join('') || '<div class="card"><p class="small">No Grey Hair video/audio assets are registered in this project yet.</p></div>';
    byId('greyHairPolicy').textContent = 'Private originals remain immutable. No provider execution, publication, camera synchronization, audio alignment, story editing, script generation, R2 mutation, schema mutation, main mutation or Production contact occurs in Build 45.';
    byId('greyHairMessage').textContent = `Build ${BUILD} read-only intelligence loaded from current CAIP evidence authority.`;
  }

  async function load(projectId = '') {
    byId('greyHairMessage').textContent = 'Loading private CAIP media intelligence…';
    const suffix = projectId ? `?creative_project_id=${encodeURIComponent(projectId)}` : '';
    try {
      const response = await apiFetch(`${ENDPOINT}${suffix}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || `Grey Hair Media Intelligence failed (${response.status}).`);
      render(payload);
    } catch (error) {
      byId('greyHairMessage').textContent = error?.message || 'Grey Hair Media Intelligence could not load.';
      byId('greyHairAssets').innerHTML = `<div class="card"><strong>Fail-closed</strong><p class="small">${esc(error?.message || 'Current CAIP evidence authority is unavailable.')}</p></div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!byId('greyHairMediaIntelligenceMount')) return;
    byId('greyHairProject')?.addEventListener('change', (event) => void load(event.target.value));
    byId('greyHairRefresh')?.addEventListener('click', () => void load(byId('greyHairProject')?.value || ''));
    void load();
    globalThis.DDGreyHairMediaIntelligence = Object.freeze({ release: RELEASE, build: BUILD, endpoint: ENDPOINT, providerExecution: false, publication: false, cameraSync: false, storyEditing: false, schemaChange: false, productionContacted: false });
    document.dispatchEvent(new CustomEvent('dd:grey-hair-media-intelligence-active', { detail: { release: RELEASE, build: BUILD } }));
  });
})();
