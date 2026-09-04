// Release 467 Build 38 — current read-only Deployment Preflight renderer.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('deploymentPreflightMount');
  const message = document.getElementById('deploymentPreflightMessage');
  const runButton = document.getElementById('runDeploymentPreflightButton');
  const exportButton = document.getElementById('exportDeploymentPreflightButton');
  let latest = null;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const apiFetch = (...args) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(...args) : fetch(...args);
  const statusClass = (value) => {
    const state = String(value || '').toLowerCase();
    if (['pass', 'ready', 'green', 'current_read_only', 'production_green'].includes(state)) return 'status-pill status-pill-success';
    if (['fail', 'blocked', 'red'].includes(state)) return 'status-pill status-pill-error';
    return 'status-pill status-pill-warning';
  };
  const setMessage = (text, error = false) => {
    if (!message) return;
    message.textContent = text || '';
    message.style.display = text ? 'block' : 'none';
    message.style.color = error ? '#ffb4b4' : '';
  };

  function renderMigrationTruth(data) {
    const truth = data.canonical_migration_truth || {};
    const rows = Array.isArray(truth.migrations) ? truth.migrations : [];
    return `<section class="card" style="margin-top:14px">
      <h3 style="margin-top:0">Canonical D1 migration authority</h3>
      <p class="small"><code>${esc(truth.manifest_path || 'migrations/canonical/manifest.json')}</code> is the only forward schema authority. Applicator: <code>${esc(truth.applicator || 'scripts/d1_migrate.py')}</code>.</p>
      <div class="admin-summary-grid">
        <div class="admin-stat"><div class="admin-stat-label">Native ledger</div><div class="admin-stat-value">${esc(truth.native_applied_count ?? 0)} / ${esc(truth.expected_count ?? 0)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Proof rows</div><div class="admin-stat-value">${esc(truth.proof_recorded_count ?? 0)} / ${esc(truth.expected_count ?? 0)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">FK violations</div><div class="admin-stat-value">${esc(truth.foreign_key_violations ?? 0)}</div></div>
      </div>
      <div class="table-wrap" style="margin-top:12px"><table class="admin-table"><thead><tr><th>Version</th><th>Canonical migration</th><th>d1_migrations</th><th>Proof</th></tr></thead><tbody>
        ${rows.map((row) => `<tr><td>${esc(row.version)}</td><td><code>${esc(row.file)}</code></td><td><span class="${statusClass(row.native_applied ? 'pass' : 'fail')}">${row.native_applied ? 'applied' : 'missing'}</span></td><td><span class="${statusClass(row.proof_recorded ? 'pass' : 'fail')}">${row.proof_recorded ? 'recorded' : 'missing'}</span></td></tr>`).join('')}
      </tbody></table></div>
    </section>`;
  }

  function renderChecks(checks) {
    const rows = Array.isArray(checks) ? checks : [];
    return `<section class="card" style="margin-top:14px"><h3 style="margin-top:0">Current preflight checklist</h3>
      <div class="table-wrap"><table class="admin-table"><thead><tr><th>Status</th><th>Area</th><th>Details</th><th>Operator action</th></tr></thead><tbody>
      ${rows.map((row) => `<tr><td><span class="${statusClass(row.status)}">${esc(row.status || 'unknown')}</span></td><td><strong>${esc(row.label || row.code)}</strong><div class="small">${esc(row.code || '')}</div></td><td>${esc(row.detail || '')}</td><td>${esc(row.action || '—')}</td></tr>`).join('') || '<tr><td colspan="4">No checks returned.</td></tr>'}
      </tbody></table></div></section>`;
  }

  function renderHistoricalEvidence(data) {
    const runs = Array.isArray(data.recent_runs) ? data.recent_runs : [];
    const confirmations = Array.isArray(data.post_deploy_confirmations) ? data.post_deploy_confirmations : [];
    return `<section class="card" style="margin-top:14px"><h3 style="margin-top:0">Historical evidence visibility</h3>
      <p class="small">Previous saved snapshots and confirmation rows remain visible when their tables exist, but Build 38 does not create, update, or confirm them.</p>
      <details><summary><strong>Recent saved snapshots (${runs.length})</strong></summary><div class="table-wrap"><table class="admin-table"><thead><tr><th>When</th><th>Build label</th><th>Status</th><th>Blockers</th><th>Warnings</th></tr></thead><tbody>${runs.map((run) => `<tr><td>${esc(run.created_at || '')}</td><td>${esc(run.build_label || '')}</td><td>${esc(run.run_status || '')}</td><td>${esc(run.blocker_count ?? 0)}</td><td>${esc(run.warning_count ?? 0)}</td></tr>`).join('') || '<tr><td colspan="5">No historical snapshots returned.</td></tr>'}</tbody></table></div></details>
      <details style="margin-top:10px"><summary><strong>Post-deploy confirmation history (${confirmations.length})</strong></summary><div class="table-wrap"><table class="admin-table"><thead><tr><th>Item</th><th>Status</th><th>Notes</th></tr></thead><tbody>${confirmations.map((row) => `<tr><td>${esc(row.label || row.confirmation_label || row.confirmation_key || '')}</td><td>${esc(row.confirmation_status || 'pending')}</td><td>${esc(row.notes || row.detail || '')}</td></tr>`).join('') || '<tr><td colspan="3">No historical confirmation rows returned.</td></tr>'}</tbody></table></div></details>
    </section>`;
  }

  function render(data) {
    latest = data;
    if (!mount) return;
    const summary = data.summary || {};
    const production = data.release_authority?.production || {};
    mount.innerHTML = `<section class="card" style="margin-top:18px">
      <div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap"><div><p class="eyebrow">Release ${esc(data.release)} • Build ${esc(data.build)}</p><h2 style="margin:0">Current Deployment Preflight</h2><p class="small">Read-only deployment, schema, SEO, D1/R2 and runtime diagnostics. Missing schema fails closed; this page never repairs schema.</p></div><span class="${statusClass(summary.status)}">${esc(summary.status || 'unknown')}</span></div>
      <div class="admin-summary-grid" style="margin-top:14px"><div class="admin-stat"><div class="admin-stat-label">Blockers</div><div class="admin-stat-value">${esc(summary.blocker_count ?? 0)}</div></div><div class="admin-stat"><div class="admin-stat-label">Warnings</div><div class="admin-stat-value">${esc(summary.warning_count ?? 0)}</div></div><div class="admin-stat"><div class="admin-stat-label">Checks</div><div class="admin-stat-value">${esc(summary.check_count ?? 0)}</div></div><div class="admin-stat"><div class="admin-stat-label">Production baseline</div><div class="admin-stat-value">Build ${esc(production.build || '?')}</div></div></div>
      <p class="small" style="margin-bottom:0">Required Development proofs: ${esc((data.release_authority?.required_development_proofs || []).join(' • '))}</p>
      <p class="small" style="margin-bottom:0">Rollback readiness: ${esc(data.release_authority?.rollback_readiness || 'release-neutral-read-only')} • Mutation capability: ${esc(data.safety?.mutation_capability || 'none')}</p>
    </section>${renderMigrationTruth(data)}${renderChecks(data.checks)}${renderHistoricalEvidence(data)}<section class="card" style="margin-top:14px"><h3 style="margin-top:0">Truth boundaries</h3>${(data.truth_notes || []).map((note) => `<p class="small">• ${esc(note)}</p>`).join('')}</section>`;
  }

  async function load() {
    const original = runButton?.textContent || 'Run Preflight';
    try {
      setMessage('Running current read-only deployment preflight…');
      if (runButton) { runButton.disabled = true; runButton.textContent = 'Working…'; }
      const response = await apiFetch('/api/admin/current-deployment-preflight', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.ok === false) throw new Error(data?.error || `Deployment Preflight failed (${response.status}).`);
      render(data);
      setMessage(`Preflight complete: ${data.summary?.status || 'unknown'}.`, data.summary?.status === 'blocked');
    } catch (error) {
      setMessage(error?.message || 'Deployment Preflight failed.', true);
    } finally {
      if (runButton) { runButton.disabled = false; runButton.textContent = original; }
    }
  }

  async function exportMarkdown() {
    try {
      setMessage('Preparing current preflight Markdown…');
      const response = await apiFetch('/api/admin/current-deployment-preflight?format=markdown', { cache: 'no-store' });
      const text = await response.text();
      if (!response.ok) throw new Error(text || 'Markdown export failed.');
      const blob = new Blob([text], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `devilndove-release-${latest?.release || 467}-build-${latest?.build || 38}-deployment-preflight.md`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage('Current preflight Markdown exported.');
    } catch (error) {
      setMessage(error?.message || 'Markdown export failed.', true);
    }
  }

  runButton?.addEventListener('click', load);
  exportButton?.addEventListener('click', exportMarkdown);
  document.addEventListener('dd:admin-ready', (event) => {
    if (event?.detail?.ok) load();
    else setMessage('Please log in as admin to run Deployment Preflight.', true);
  });
});
