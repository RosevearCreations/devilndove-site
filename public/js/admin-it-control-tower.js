// Release 467 Build 10 — consolidated I.T. operations control tower renderer.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('itControlTowerMount');
  if (!mount) return;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  const apiFetch = (...args) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(...args) : fetch(...args);
  const stateClass = (value) => value === 'green' ? 'good' : value === 'red' ? 'bad' : 'warn';
  const stateLabel = (value) => String(value || 'unknown').toUpperCase();
  const shortSha = (value) => /^[0-9a-f]{40}$/i.test(String(value || '')) ? String(value).slice(0, 12) : (value || 'unavailable');

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
      external_acceptance: 'External acceptance evidence',
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

  function recoverySection(queue) {
    const items = Array.isArray(queue) ? queue : [];
    if (!items.length) {
      return `<section class="card" style="margin-top:14px"><h3 style="margin-top:0">Prioritized recovery queue</h3><p class="small">No blocking or attention findings are currently reported by the read-only preflight engine.</p></section>`;
    }
    return `<section class="card" style="margin-top:14px">
      <h3 style="margin-top:0">Prioritized recovery queue</h3>
      <p class="small">Blocking findings come first, followed by bounded attention items. The Control Tower never performs these repairs automatically.</p>
      ${items.map((item, index) => `<div class="card" style="margin:10px 0;padding:14px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
          <div><strong>${index + 1}. ${esc(item.label)}</strong><div class="small">${esc(item.subsystem)} • ${esc(item.detail || '')}</div></div>
          <span class="badge ${stateClass(item.state)}">${esc(item.priority || stateLabel(item.state))}</span>
        </div>
        <div class="small" style="margin-top:8px"><strong>Do next:</strong> ${esc(item.correction || '')}</div>
        <a class="small" href="${esc(item.href || '/admin/it/')}">Open corrective workspace →</a>
      </div>`).join('')}
    </section>`;
  }

  function externalPolicySection(policy) {
    const rows = Array.isArray(policy) ? policy : [];
    return `<section class="card" style="margin-top:14px">
      <h3 style="margin-top:0">External acceptance policy</h3>
      <p class="small">These are policy states, not inferred runtime success. Provider or Access acceptance remains separate from a green source/deployment build.</p>
      <div class="admin-compact-tool-grid">
        ${rows.map((item) => `<div><strong>${esc(item.label)}</strong><small>${esc(item.state)} • ${esc(item.authority)}</small><a class="small" href="${esc(item.href || '/admin/it/')}">Open authority →</a></div>`).join('')}
      </div>
    </section>`;
  }

  async function load() {
    mount.innerHTML = '<section class="card" style="margin-top:18px"><p class="small">Running consolidated I.T. preflight…</p></section>';
    try {
      const response = await apiFetch('/api/admin/it-operations-control-tower', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.error || `I.T. control tower failed (${response.status}).`);

      const ready = data.readiness || {};
      const metrics = data.headline_metrics || {};
      const release = data.release_authority || {};
      const current = release.current || {};
      const lastGreen = release.last_green || {};
      const development = data.development || {};
      const subsystems = data.subsystems || {};
      const ordered = ['database', 'admin_authority', 'storage', 'configuration', 'provider_configuration', 'external_acceptance', 'deployment_ancestry'];
      const runtimeSha = development.runtime_source_sha;

      mount.innerHTML = `
        <section class="card" style="margin-top:18px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap">
            <div>
              <p class="eyebrow">Release ${esc(current.release || data.release)} • Build ${esc(current.build || data.build)}</p>
              <h2 style="margin:0">I.T. Operations Control Tower</h2>
              <p class="small">Current release, Development deployment ancestry, D1/R2 readiness, administrator authority, external HOLDs and one prioritized recovery queue.</p>
            </div>
            <div style="text-align:right">
              <div style="font-size:2rem;font-weight:800">${esc(metrics.readiness_score ?? ready.score ?? 0)}%</div>
              <span class="badge ${stateClass(metrics.readiness_state || ready.overall)}">${esc(stateLabel(metrics.readiness_state || ready.overall))}</span>
            </div>
          </div>
          <div class="admin-compact-tool-grid" style="margin-top:14px">
            <div><strong>Current authority</strong><small>R${esc(current.release || data.release)} B${esc(current.build || data.build)} • ${esc(data.state || 'CANDIDATE')}</small></div>
            <div><strong>Last green Development</strong><small>Build ${esc(lastGreen.build || '?')} • ${esc(shortSha(lastGreen.dev_sha))}</small></div>
            <div><strong>Runtime deployed SHA</strong><small>${esc(shortSha(runtimeSha))}</small></div>
            <div><strong>System Gate predecessor</strong><small>${esc(lastGreen.system_gate_run || 'unknown')}</small></div>
            <div><strong>Root admin</strong><small>${metrics.root_admin_full_manage ? 'FULL MANAGE' : 'HOLD'}</small></div>
            <div><strong>Profiles / admins</strong><small>${esc(metrics.active_profiles ?? '?')} / ${esc(metrics.active_admins ?? '?')}</small></div>
            <div><strong>Enabled modules</strong><small>${esc(metrics.enabled_modules ?? '?')} / 5</small></div>
            <div><strong>D1 tables</strong><small>${esc(metrics.d1_tables ?? 'unknown')}</small></div>
            <div><strong>Migrations / proofs</strong><small>${esc(metrics.canonical_migrations ?? '?')} / ${esc(metrics.migration_proofs ?? '?')}</small></div>
            <div><strong>FK violations</strong><small>${esc(metrics.foreign_key_violations ?? 'unknown')}</small></div>
            <div><strong>Blocking / attention</strong><small>${esc(metrics.blocking_actions ?? 0)} / ${esc(metrics.attention_actions ?? 0)}</small></div>
            <div><strong>Launch state</strong><small>${esc(metrics.launch_state || ready.launch_state || 'UNKNOWN')}</small></div>
          </div>
          <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn" id="refreshItControlTower" type="button">Refresh control tower</button>
            <a class="btn secondary" href="/admin/application-modules/">Application Modules</a>
            <a class="btn secondary" href="/admin/release-control/external-commercial-readiness/">External acceptance</a>
            <a class="btn secondary" href="/admin/deployment-preflight/">Deployment preflight</a>
          </div>
          <p class="small" style="margin-bottom:0;margin-top:12px">Development: ${esc(development.target || '')} • D1 ${esc(development.d1_name || '')} • R2 ${esc(development.product_r2 || '')} / ${esc(development.caip_r2 || '')}</p>
          <p class="small" style="margin-bottom:0">Runtime header Release ${esc(release.compatibility_runtime_release_header || 466)} remains explicitly classified as inherited runtime compatibility; it does not override the Release 467 Build 10 operator/restart authority.</p>
        </section>
        ${recoverySection(data.recovery_queue)}
        ${externalPolicySection(data.external_policy)}
        <section class="card" style="margin-top:14px">
          <h3 style="margin-top:0">Detailed subsystem evidence</h3>
          <p class="small">Use these cards to verify why a recovery action is present. Exact bucket identities and promotion ancestry remain System Gate/control-plane evidence where runtime bindings are opaque.</p>
        </section>
        ${ordered.map((key) => subsystemCard(key, subsystems[key] || { state: 'amber', findings: [] })).join('')}
      `;
      document.getElementById('refreshItControlTower')?.addEventListener('click', load);
    } catch (error) {
      mount.innerHTML = `<section class="card" style="margin-top:18px"><h2>I.T. Control Tower unavailable</h2><p class="small">${esc(error?.message || 'Unable to load the control tower.')}</p><button class="btn" id="retryItControlTower" type="button">Retry</button></section>`;
      document.getElementById('retryItControlTower')?.addEventListener('click', load);
    }
  }

  void load();
});
