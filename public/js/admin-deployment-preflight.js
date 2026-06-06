// File: /public/js/admin-deployment-preflight.js
// Brief description: Renders the Deployment Preflight admin page, detail drawers, Markdown export, post-deploy confirmations, and saved preflight snapshots.

document.addEventListener('DOMContentLoaded', () => {
  const messageEl = document.getElementById('deploymentPreflightMessage');
  const runButton = document.getElementById('runDeploymentPreflightButton');
  const saveButton = document.getElementById('saveDeploymentPreflightButton');
  const exportButton = document.getElementById('exportDeploymentPreflightButton');
  const summaryEl = document.getElementById('deploymentPreflightSummary');
  const checksEl = document.getElementById('deploymentPreflightChecks');
  const detailsEl = document.getElementById('deploymentPreflightDetails');
  const confirmationsEl = document.getElementById('deploymentPostDeployConfirmations');
  const runsEl = document.getElementById('deploymentPreflightRuns');
  let latestData = null;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function setMessage(text, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = text || '';
    messageEl.style.display = text ? 'block' : 'none';
    messageEl.style.color = isError ? '#ffb4b4' : '';
  }

  function statusClass(status) {
    if (status === 'fail' || status === 'blocked' || status === 'missing_table') return 'status-pill status-pill-error';
    if (status === 'warn' || status === 'review' || status === 'pending') return 'status-pill status-pill-warning';
    return 'status-pill status-pill-success';
  }

  function linkForCheck(check = {}) {
    const evidence = check.evidence || {};
    const page = Array.isArray(evidence.page_results) ? evidence.page_results.find((row) => row.status !== 'pass') : null;
    if (page?.path) return page.path;
    const admin = Array.isArray(evidence.admin_pages) ? evidence.admin_pages.find((row) => !row.ok || row.h1_count !== 1) : null;
    if (admin?.path) return admin.path;
    if (check.code && String(check.code).includes('smoke')) return '/admin/post-deploy-smoke-tests/';
    if (String(check.code || '').includes('schema') || String(check.code || '').includes('migration')) return '/admin/deployment-preflight/';
    return '';
  }

  function renderSummary(summary = {}) {
    if (!summaryEl) return;
    summaryEl.innerHTML = `
      <div class="admin-summary-grid">
        <div class="admin-stat"><div class="admin-stat-label">Status</div><div class="admin-stat-value"><span class="${statusClass(summary.status)}">${esc(summary.status || 'unknown')}</span></div></div>
        <div class="admin-stat"><div class="admin-stat-label">Blockers</div><div class="admin-stat-value">${Number(summary.blocker_count || 0).toLocaleString()}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Warnings</div><div class="admin-stat-value">${Number(summary.warning_count || 0).toLocaleString()}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Checks</div><div class="admin-stat-value">${Number(summary.check_count || 0).toLocaleString()}</div></div>
      </div>`;
  }

  function renderChecks(checks = []) {
    if (!checksEl) return;
    if (!checks.length) {
      checksEl.innerHTML = '<p class="small">No checks returned yet.</p>';
      return;
    }
    checksEl.innerHTML = `
      <h3>Checklist</h3>
      <p class="small">Failed or warning checks include direct quick links when a page can be opened for review.</p>
      <div class="table-wrap"><table class="admin-table"><thead><tr><th>Status</th><th>Area</th><th>Details</th><th>Next action</th><th>Open</th></tr></thead><tbody>
        ${checks.map((check) => {
          const link = linkForCheck(check);
          return `<tr>
          <td><span class="${statusClass(check.status)}">${esc(check.status)}</span></td>
          <td><strong>${esc(check.label)}</strong><div class="small">${esc(check.code)}</div></td>
          <td>${esc(check.detail)}</td>
          <td>${esc(check.action || '—')}</td>
          <td>${link ? `<a class="btn small" href="${esc(link)}" target="_blank" rel="noopener">Open</a>` : '<span class="small">—</span>'}</td>
        </tr>`;
        }).join('')}
      </tbody></table></div>`;
  }

  function renderDetails(data = {}) {
    if (!detailsEl) return;
    const pages = data.page_results || [];
    const schemaRows = data.expected_schema || [];
    const migrations = data.ledger?.expected || [];
    const recentMigrations = data.ledger?.recent || [];
    const plan = data.migration_plan || {};
    const duplicateGroups = data.duplicate_ownership || [];
    const integrity = data.data_integrity || {};
    const routeRows = data.r2_health?.route_rows || [];
    detailsEl.innerHTML = `
      <details class="card" open>
        <summary><strong>Public page SEO, schema.org, canonical, image-alt, and fallback detail</strong></summary>
        <div class="table-wrap"><table class="admin-table"><thead><tr><th>Page</th><th>Status</th><th>Title/meta</th><th>Canonical</th><th>Images</th><th>Schema</th><th>Fallback</th></tr></thead><tbody>
          ${pages.map((row) => `<tr>
            <td><a href="${esc(row.path)}" target="_blank" rel="noopener">${esc(row.label || row.path)}</a><div class="small">${esc(row.missing_terms?.length ? `Missing terms: ${row.missing_terms.join(', ')}` : 'Local terms ok')}</div></td>
            <td><span class="${statusClass(row.status)}">${esc(row.status)}</span></td>
            <td>${esc(row.title_length)} / ${esc(row.meta_description_length)}<div class="small">Title ${row.title_ok ? 'ok' : 'review'} · Meta ${row.meta_description_ok ? 'ok' : 'review'}</div></td>
            <td>${row.canonical_url ? 'Yes' : 'No'}</td>
            <td>${esc(row.image_count)} image(s)<div class="small">Missing alt: ${esc(row.images_missing_alt)}</div></td>
            <td>${esc(row.structured_data_count)} block(s)<div class="small">${esc((row.structured_data_types || []).join(', ') || 'none')}</div></td>
            <td>${row.has_low_bandwidth_fallback ? 'Yes' : 'Review'}</td>
          </tr>`).join('')}
        </tbody></table></div>
      </details>

      <details class="card">
        <summary><strong>D1 migration detail and safe SQL planner</strong></summary>
        <h4>Expected markers</h4>
        <div class="table-wrap"><table class="admin-table"><thead><tr><th>Order</th><th>Marker</th><th>SQL file</th><th>Status</th><th>Notes</th></tr></thead><tbody>
          ${migrations.map((row) => `<tr><td>${esc(row.order)}</td><td><code>${esc(row.migration_key)}</code></td><td><code>${esc(row.file_name)}</code>${row.fallback_file ? `<div class="small">Repair: <code>${esc(row.fallback_file)}</code></div>` : ''}</td><td><span class="${statusClass(row.recorded ? 'pass' : 'warn')}">${row.recorded ? esc(row.status || 'recorded') : 'missing'}</span></td><td>${esc(row.notes || row.note || '')}</td></tr>`).join('')}
        </tbody></table></div>
        <h4>Safe planner</h4>
        ${Object.entries(plan).map(([key, items]) => `<h5>${esc(key.replace(/_/g, ' '))}</h5><ol>${(items || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ol>`).join('')}
        <h4>Recent ledger rows</h4>
        <div class="table-wrap"><table class="admin-table"><thead><tr><th>Created/applied</th><th>Marker</th><th>File</th><th>Status</th><th>Operator notes</th></tr></thead><tbody>${recentMigrations.map((row) => `<tr><td>${esc(row.applied_at || row.created_at || '')}</td><td><code>${esc(row.migration_key)}</code></td><td><code>${esc(row.file_name)}</code></td><td>${esc(row.status || '')}</td><td>${esc(row.notes || '')}</td></tr>`).join('') || '<tr><td colspan="5">No recent ledger rows returned.</td></tr>'}</tbody></table></div>
      </details>

      <details class="card">
        <summary><strong>Expected schema diff, duplicate ownership, and relationship integrity</strong></summary>
        <h4>Schema groups</h4>
        <div class="table-wrap"><table class="admin-table"><thead><tr><th>Status</th><th>Area</th><th>Table</th><th>Missing columns</th></tr></thead><tbody>${schemaRows.map((row) => `<tr><td><span class="${statusClass(row.status)}">${esc(row.status)}</span></td><td>${esc(row.area)}</td><td><code>${esc(row.table)}</code></td><td>${esc((row.missing_columns || []).join(', ') || '—')}</td></tr>`).join('')}</tbody></table></div>
        <h4>Duplicate ownership</h4>
        ${duplicateGroups.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr><th>Table</th><th>Kind</th><th>Key</th><th>Count</th></tr></thead><tbody>${duplicateGroups.map((row) => `<tr><td>${esc(row.source_table)}</td><td>${esc(row.owner_kind)}</td><td><code>${esc(row.owner_key)}</code></td><td>${esc(row.duplicate_count)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small">No duplicate ownership groups returned.</p>'}
        <h4>Relationship integrity</h4>
        <ul>${Object.entries(integrity).map(([key, row]) => `<li><strong>${esc(key.replace(/_/g, ' '))}</strong>: ${esc(row?.count || 0)}</li>`).join('')}</ul>
      </details>

      <details class="card">
        <summary><strong>R2 derivative route health and mobile/offline checklist rows</strong></summary>
        <p class="small">Binding visible: ${data.r2_health?.bucket_configured ? 'yes' : 'no'}. Use this with the R2 Derivative Settings page for the live create/get/delete test.</p>
        ${routeRows.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr><th>Route</th><th>URL</th><th>Status</th><th>Last health</th></tr></thead><tbody>${routeRows.map((row) => `<tr><td>${esc(row.route_label || '')}</td><td>${esc(row.route_url || '')}</td><td>${esc(row.route_status || '')}</td><td>${esc(row.last_health_status || '')}<div class="small">${esc(row.last_health_at || '')}</div></td></tr>`).join('')}</tbody></table></div>` : '<p class="small">No derivative route rows returned yet.</p>'}
        <ul class="small">
          <li>Mobile header, hero, gallery cards, and admin tables should be checked at phone width.</li>
          <li>Shop, product detail, and gallery pages should have loading/empty-state fallbacks for slow data fetches.</li>
          <li>Dark theme screenshots should include home, shop, gallery, product detail, and every local landing page.</li>
        </ul>
      </details>`;
  }

  function renderConfirmations(rows = [], buildLabel = 'Build 174') {
    if (!confirmationsEl) return;
    confirmationsEl.innerHTML = `
      <section class="card">
        <h3 style="margin-top:0">Post-deploy confirmation workflow</h3>
        <p class="small">After deployment, mark each item complete so the release record shows what was actually verified.</p>
        ${(rows || []).map((row) => `<article class="status-note" style="margin-top:8px">
          <strong>${esc(row.label || row.confirmation_label || row.confirmation_key)}</strong>
          <span class="${statusClass(row.confirmation_status || 'pending')}">${esc(row.confirmation_status || 'pending')}</span>
          <p class="small">${esc(row.detail || row.notes || '')}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><input type="text" placeholder="Optional note" data-confirm-note="${esc(row.key || row.confirmation_key)}"><button class="btn small" type="button" data-confirm-post-deploy="${esc(row.key || row.confirmation_key)}">Mark confirmed</button></div>
        </article>`).join('')}
      </section>`;
    confirmationsEl.querySelectorAll('[data-confirm-post-deploy]').forEach((button) => {
      button.addEventListener('click', async () => {
        const key = button.getAttribute('data-confirm-post-deploy');
        const note = confirmationsEl.querySelector(`[data-confirm-note="${CSS.escape(key)}"]`)?.value || '';
        await confirmPostDeploy(key, note, buildLabel);
      });
    });
  }

  function renderRuns(runs = []) {
    if (!runsEl) return;
    if (!runs.length) {
      runsEl.innerHTML = '<h3>Saved snapshots</h3><p class="small">No saved preflight snapshots yet.</p>';
      return;
    }
    runsEl.innerHTML = `
      <h3>Saved snapshots</h3>
      <div class="table-wrap"><table class="admin-table"><thead><tr><th>When</th><th>Build</th><th>Status</th><th>Blockers</th><th>Warnings</th></tr></thead><tbody>
      ${runs.map((run) => `<tr>
        <td>${esc(run.created_at || '')}</td>
        <td>${esc(run.build_label || '')}</td>
        <td><span class="${statusClass(run.run_status)}">${esc(run.run_status || '')}</span></td>
        <td>${Number(run.blocker_count || 0).toLocaleString()}</td>
        <td>${Number(run.warning_count || 0).toLocaleString()}</td>
      </tr>`).join('')}
      </tbody></table></div>`;
  }

  async function callPreflight(save = false) {
    if (!window.DDAuth?.apiFetch) throw new Error('Auth helper is not loaded.');
    const response = await window.DDAuth.apiFetch('/api/admin/deployment-preflight', {
      method: save ? 'POST' : 'GET',
      headers: save ? { 'Content-Type': 'application/json' } : undefined,
      body: save ? JSON.stringify({ build_label: 'Build 174', action: 'save_snapshot' }) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.error || 'Preflight request failed.');
    return data;
  }

  async function confirmPostDeploy(key, notes, buildLabel) {
    try {
      setMessage('Saving post-deploy confirmation…');
      const response = await window.DDAuth.apiFetch('/api/admin/deployment-preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ build_label: buildLabel || 'Build 174', action: 'confirm_post_deploy', confirmation_key: key, notes })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.ok === false) throw new Error(data?.error || 'Confirmation failed.');
      renderAll(data);
      setMessage('Post-deploy confirmation saved.');
    } catch (error) {
      setMessage(error.message || 'Confirmation failed.', true);
    }
  }

  function renderAll(data) {
    latestData = data;
    renderSummary(data.summary || {});
    renderChecks(data.checks || []);
    renderDetails(data);
    renderConfirmations(data.post_deploy_confirmations || [], data.build_label || 'Build 174');
    renderRuns(data.recent_runs || []);
  }

  async function load(save = false) {
    const activeButton = save ? saveButton : runButton;
    const originalText = activeButton?.textContent || '';
    try {
      setMessage(save ? 'Saving preflight snapshot…' : 'Running deployment preflight…');
      if (activeButton) { activeButton.disabled = true; activeButton.textContent = 'Working…'; }
      const data = await callPreflight(save);
      renderAll(data);
      setMessage(save ? 'Snapshot saved.' : `Preflight complete: ${data.summary?.status || 'unknown'}.`, (data.summary?.status === 'blocked'));
    } catch (error) {
      setMessage(error.message || 'Preflight failed.', true);
    } finally {
      if (activeButton) { activeButton.disabled = false; activeButton.textContent = originalText; }
    }
  }

  async function exportMarkdown() {
    try {
      setMessage('Preparing Markdown export…');
      const response = await window.DDAuth.apiFetch('/api/admin/deployment-preflight?format=markdown');
      const text = await response.text();
      if (!response.ok) throw new Error(text || 'Markdown export failed.');
      const blob = new Blob([text], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devilndove-${(latestData?.build_label || 'build-174').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-preflight.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage('Markdown export downloaded.');
    } catch (error) {
      setMessage(error.message || 'Markdown export failed.', true);
    }
  }

  runButton?.addEventListener('click', () => load(false));
  saveButton?.addEventListener('click', () => load(true));
  exportButton?.addEventListener('click', exportMarkdown);
  document.addEventListener('dd:admin-ready', (event) => {
    if (event?.detail?.ok) load(false);
    else setMessage('Please log in as admin to run deployment preflight.', true);
  });
});
