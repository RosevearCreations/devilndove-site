// Release 467 Build 1 — I.T. readiness control tower renderer.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('itControlTowerMount');
  if (!mount) return;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  const apiFetch = (...args) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(...args) : fetch(...args);
  const stateClass = (value) => value === 'green' ? 'good' : value === 'red' ? 'bad' : 'warn';
  const stateLabel = (value) => String(value || 'unknown').toUpperCase();

  function findingRow(item) {
    const href = item?.href || '/admin/it/';
    return `<div class="card" style="margin:10px 0;padding:14px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><strong>${esc(item?.label || item?.code || 'Readiness check')}</strong><div class="small">${esc(item?.detail || '')}</div></div>
        <span class="badge ${stateClass(item?.state)}">${esc(stateLabel(item?.state))}</span>
      </div>
      ${item?.correction ? `<div class="small" style="margin-top:8px"><strong>Correction:</strong> ${esc(item.correction)}</div>` : ''}
      <a class="small" href="${esc(href)}">Open corrective workspace →</a>
    </div>`;
  }

  function subsystemCard(key, item) {
    const labels = {
      database: 'D1 & migration authority',
      admin_authority: 'Administrator & module authority',
      storage: 'R2 storage authority',
      configuration: 'Development configuration',
      provider_configuration: 'Provider configuration',
      external_acceptance: 'External acceptance',
      deployment_ancestry: 'Exact-SHA / deployment ancestry',
    };
    const findings = Array.isArray(item?.findings) ? item.findings : [];
    return `<section class="card" style="margin-top:14px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
        <h3 style="margin:0">${esc(labels[key] || key)}</h3>
        <span class="badge ${stateClass(item?.state)}">${esc(stateLabel(item?.state))}</span>
      </div>
      ${findings.map(findingRow).join('') || '<p class="small">No findings returned.</p>'}
    </section>`;
  }

  async function load() {
    mount.innerHTML = '<section class="card" style="margin-top:18px"><p class="small">Running I.T. preflight…</p></section>';
    try {
      const response = await apiFetch('/api/admin/it-control-tower', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.error || `I.T. preflight failed (${response.status}).`);
      const ready = data.readiness || {};
      const subsystems = data.subsystems || {};
      const ordered = ['database', 'admin_authority', 'storage', 'configuration', 'provider_configuration', 'external_acceptance', 'deployment_ancestry'];
      const db = subsystems.database?.metrics || {};
      const admin = subsystems.admin_authority?.metrics || {};
      mount.innerHTML = `
        <section class="card" style="margin-top:18px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap">
            <div>
              <p class="eyebrow">Release 467 • Build 1</p>
              <h2 style="margin:0">I.T. Preflight Command Center</h2>
              <p class="small">One read-only view across database, administrator/module authority, storage, configuration, provider readiness, external acceptance and exact-SHA evidence.</p>
            </div>
            <div style="text-align:right">
              <div style="font-size:2rem;font-weight:800">${esc(ready.score ?? 0)}%</div>
              <span class="badge ${stateClass(ready.overall)}">${esc(stateLabel(ready.overall))}</span>
            </div>
          </div>
          <div class="admin-compact-tool-grid" style="margin-top:14px">
            <div><strong>Launch state</strong><small>${esc(ready.launch_state || 'UNKNOWN')}</small></div>
            <div><strong>Root admin</strong><small>${admin.root_admin_full_manage ? 'FULL MANAGE' : 'HOLD'}</small></div>
            <div><strong>Active profiles</strong><small>${esc(admin.active_profile_count ?? 'unknown')}</small></div>
            <div><strong>D1 tables</strong><small>${esc(db.tables ?? 'unknown')}</small></div>
            <div><strong>Migrations / proofs</strong><small>${esc(db.canonical_migrations ?? '?')} / ${esc(db.migration_proofs ?? '?')}</small></div>
            <div><strong>FK violations</strong><small>${esc(db.foreign_key_violations ?? 'unknown')}</small></div>
          </div>
          <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn" id="refreshItControlTower" type="button">Refresh preflight</button>
            <a class="btn secondary" href="/admin/application-modules/">Application Modules</a>
            <a class="btn secondary" href="/admin/release-control/external-commercial-readiness/">External acceptance</a>
            <a class="btn secondary" href="/admin/deployment-preflight/">Deployment preflight</a>
          </div>
          <p class="small" style="margin-bottom:0;margin-top:12px">${esc(data.drift_policy || '')}</p>
        </section>
        ${ordered.map((key) => subsystemCard(key, subsystems[key] || { state: 'amber', findings: [] })).join('')}
      `;
      document.getElementById('refreshItControlTower')?.addEventListener('click', load);
    } catch (error) {
      mount.innerHTML = `<section class="card" style="margin-top:18px"><h2>I.T. preflight unavailable</h2><p class="small">${esc(error?.message || 'Unable to load the control tower.')}</p><button class="btn" id="retryItControlTower" type="button">Retry</button></section>`;
      document.getElementById('retryItControlTower')?.addEventListener('click', load);
    }
  }

  void load();
});
