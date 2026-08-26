// Devil n Dove Build 439 — read-only CAIP temporal-media storage integrity workspace.
// User-triggered only. No polling. D1 reads + R2 HEAD through the authenticated diagnostic API.
(() => {
  'use strict';

  const mount = document.getElementById('caipStorageAuditMount');
  if (!mount) return;

  const API = '/api/admin/caip-evidence-storage-diagnostic';
  const PAGE_SIZE = 8;
  const state = { busy: false, audit: null, error: '' };

  const text = (value) => String(value ?? '').trim();
  const esc = (value) => text(value).replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const num = (value) => Number(value || 0) || 0;

  async function apiJson(path) {
    if (!window.DDAuth?.apiFetch) throw new Error('Authentication helper is unavailable.');
    const response = await window.DDAuth.apiFetch(path, { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || `Storage audit failed with HTTP ${response.status}.`);
    return data;
  }

  function label(value) {
    return text(value).replace(/_/g, ' ') || 'unknown';
  }

  function classificationHelp(value) {
    switch (value) {
      case 'healthy_media_asset_binding':
        return 'Playable authority exists: the canonical media_assets key is present in its bound R2 bucket.';
      case 'recoverable_metadata_drift':
        return 'Another recorded CAIP candidate exists in R2, but the canonical media_assets linkage is stale or incomplete. This is repairable without re-uploading the binary.';
      case 'recorded_keys_missing_from_dev_r2':
        return 'D1 records R2 object keys, but none of those objects exist in the bound Development bucket. A proper Development re-upload/recovery is required; do not invent a D1-only link.';
      case 'r2_binding_unavailable':
        return 'The required R2 binding is unavailable in this Development runtime.';
      case 'no_recorded_r2_key':
        return 'The temporal asset has no recorded R2 object key and needs intake/linkage review.';
      default:
        return 'Storage state needs review.';
    }
  }

  function badge(value) {
    const ok = value === 'healthy_media_asset_binding';
    return `<span class="caip439-badge ${ok ? 'ok' : ''}">${esc(label(value))}</span>`;
  }

  function candidateLine(candidate) {
    const exists = candidate.exists ? 'exists' : 'missing';
    const binding = candidate.binding_available ? candidate.binding_route : 'binding unavailable';
    const bytes = candidate.head?.size ? ` · ${Number(candidate.head.size).toLocaleString()} bytes` : '';
    return `<li><strong>${esc(candidate.source)}</strong> · ${esc(binding)} · ${esc(exists)}${bytes}<br/><code>${esc(candidate.object_key || '')}</code>${candidate.error ? `<br/><small>${esc(candidate.error)}</small>` : ''}</li>`;
  }

  function auditRow(item) {
    return `<details class="caip439-row" style="display:block;padding:10px 0">
      <summary style="cursor:pointer"><strong>${esc(item.original_filename || item.asset_key || `Asset ${item.creative_asset_id}`)}</strong> · project ${num(item.creative_project_id)} / asset ${num(item.creative_asset_id)} · ${badge(item.classification)}</summary>
      <p class="small">${esc(classificationHelp(item.classification))}</p>
      <ul class="small">${(item.candidates || []).map(candidateLine).join('') || '<li>No recorded R2 candidates.</li>'}</ul>
      <div class="caip439-actions">
        <a class="btn secondary" href="/admin/creative-assets/?creative_project_id=${num(item.creative_project_id)}">Open project in CAIP</a>
      </div>
    </details>`;
  }

  function summaryCards(audit) {
    const counts = audit?.counts || {};
    const values = [
      ['Healthy', counts.healthy_media_asset_binding || 0],
      ['Recoverable drift', counts.recoverable_metadata_drift || 0],
      ['Missing Dev R2', counts.recorded_keys_missing_from_dev_r2 || 0],
      ['Binding unavailable', counts.r2_binding_unavailable || 0],
      ['No R2 key', counts.no_recorded_r2_key || 0],
    ];
    return `<div class="caip439-badges">${values.map(([name, count]) => `<span class="caip439-badge ${name === 'Healthy' && count ? 'ok' : ''}">${esc(name)}: ${num(count)}</span>`).join('')}</div>`;
  }

  function render() {
    const audit = state.audit;
    const health = audit?.items?.find((item) => item.classification === 'healthy_media_asset_binding');
    const recoverable = audit?.items?.find((item) => item.classification === 'recoverable_metadata_drift');
    const allMissing = audit && audit.total > 0 && !health && !recoverable;

    mount.innerHTML = `<section class="card" style="margin-top:18px">
      <div class="caip439-head">
        <div>
          <p class="eyebrow">Build 439 · Integrity gate</p>
          <h2 style="margin-top:0">CAIP Temporal Media Storage Audit</h2>
          <p class="small">Read-only Development audit of every active video/audio asset. It compares recorded media/upload/metadata/observation keys using R2 HEAD only. It never reads object bodies, changes D1/R2, executes providers, or publishes content.</p>
        </div>
        <div class="caip439-actions"><button class="btn" id="caip439RunStorageAudit" type="button" ${state.busy ? 'disabled' : ''}>${state.busy ? 'Auditing…' : 'Audit all temporal media'}</button></div>
      </div>
      ${state.error ? `<p class="small caip439-status" data-tone="error">${esc(state.error)}</p>` : ''}
      ${audit ? `<div style="margin-top:12px">${summaryCards(audit)}<p class="small">Audited ${num(audit.items?.length)} of ${num(audit.total)} active temporal asset${num(audit.total) === 1 ? '' : 's'}.</p></div>` : '<p class="small">Run this before CAIP browser acceptance or whenever secure playback reports a missing R2 object.</p>'}
      ${health ? `<p class="small"><strong>Playable Development candidate found:</strong> project ${num(health.creative_project_id)}, asset ${num(health.creative_asset_id)} (${esc(health.original_filename || health.asset_key)}).</p>` : ''}
      ${recoverable ? `<p class="small"><strong>Recoverable metadata drift exists.</strong> We can repair canonical linkage only after the existing R2 candidate is verified.</p>` : ''}
      ${allMissing ? `<p class="small"><strong>No healthy/recoverable Development temporal object was found.</strong> The next CAIP step is a proper Development media-intake/re-upload recovery, not a database-only link.</p>` : ''}
      <div>${(audit?.items || []).map(auditRow).join('')}</div>
    </section>`;

    document.getElementById('caip439RunStorageAudit')?.addEventListener('click', () => { void runAudit(); });
  }

  async function runAudit() {
    if (state.busy) return;
    state.busy = true;
    state.error = '';
    state.audit = null;
    render();
    try {
      let offset = 0;
      let total = 0;
      const items = [];
      const counts = {};
      for (;;) {
        const data = await apiJson(`${API}?scope=all&limit=${PAGE_SIZE}&offset=${offset}`);
        total = num(data.total);
        for (const item of data.items || []) {
          items.push(item);
          counts[item.classification] = num(counts[item.classification]) + 1;
        }
        if (data.next_offset == null) break;
        offset = num(data.next_offset);
        if (!offset || items.length >= 240) break;
      }
      state.audit = { total, items, counts };
    } catch (error) {
      state.error = error?.message || 'CAIP storage audit failed.';
    } finally {
      state.busy = false;
      render();
    }
  }

  render();
})();
