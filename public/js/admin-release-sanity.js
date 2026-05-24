// File: /public/js/admin-release-sanity.js
// Brief description: Admin release sanity checker for H1/meta, catalog/inventory counts, accounting blockers, and recent runtime incidents.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('releaseSanityAdminMount');
  if (!mount || !window.DDAuth) return;

  mount.innerHTML = `
    <div class="card" id="release-sanity-card" style="margin-top:18px">
      <h2 style="margin-top:0">Release Sanity Checklist</h2>
      <p class="small">Run this after each deploy or ZIP handoff. It checks public page title/meta/H1 basics, Tools/Supplies D1 sync, inventory stock defaults, journal balance blockers, reconciliation exceptions, runtime errors, and migration-ledger status, and competitive roadmap readiness.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn primary" id="runReleaseSanityButton" type="button">Run release sanity</button><a class="btn" href="/admin/catalog/">Open Catalog Sync</a><a class="btn" href="/admin/accounting/#db-sanity">Open DB Sanity</a><a class="btn" href="#schemaDriftAdminMount">Schema Drift</a><a class="btn" href="#publicApiHealthAdminMount">API Health</a><a class="btn" href="#competitiveRoadmapAdminMount">Competitive Roadmap</a></div>
      <div id="releaseSanityMessage" class="small" style="display:none;margin-top:10px"></div>
      <div id="releaseSanityResults" style="margin-top:12px"></div>
    </div>`;

  const message = mount.querySelector('#releaseSanityMessage');
  const results = mount.querySelector('#releaseSanityResults');

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function setMessage(text, isError = false) {
    message.textContent = text || '';
    message.style.display = text ? 'block' : 'none';
    message.style.color = isError ? '#b00020' : '#0a7a2f';
  }

  function statusPill(status) {
    const clean = String(status || 'unknown');
    const cls = clean === 'pass' || clean === 'ok' ? 'ok' : (clean === 'fail' ? 'danger' : (clean === 'warn' || clean === 'warning' ? 'warn' : 'muted'));
    return `<span class="admin-status-pill ${cls}">${escapeHtml(clean)}</span>`;
  }

  async function readJson(response, fallbackMessage) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || fallbackMessage);
    return data;
  }

  function render(data) {
    const summary = data.summary || {};
    const checks = Array.isArray(data.checks) ? data.checks : [];
    const pages = Array.isArray(data.page_checks) ? data.page_checks : [];
    const catalogs = Array.isArray(data.catalog_counts) ? data.catalog_counts : [];
    const inventory = Array.isArray(data.inventory_counts) ? data.inventory_counts : [];

    results.innerHTML = `
      <div class="release-sanity-summary">
        <div>${statusPill(summary.status || 'unknown')} <strong>${escapeHtml(data.generated_at || '')}</strong></div>
        <div class="small">Pass ${escapeHtml(String(Number(summary.pass_count || 0)))} • Warn ${escapeHtml(String(Number(summary.warning_count || 0)))} • Fail ${escapeHtml(String(Number(summary.fail_count || 0)))}</div>
      </div>
      <div class="admin-table-wrap" style="margin-top:10px"><table><thead><tr><th>Status</th><th>Check</th><th>Detail</th><th>Action</th></tr></thead><tbody>${checks.map((row) => `
        <tr><td>${statusPill(row.status)}</td><td><strong>${escapeHtml(row.label || '')}</strong></td><td>${escapeHtml(row.detail || '')}</td><td>${escapeHtml(row.action || '')}</td></tr>
      `).join('') || '<tr><td colspan="4">No checks returned.</td></tr>'}</tbody></table></div>
      <details style="margin-top:12px"><summary>Public page checks</summary><div class="admin-table-wrap"><table><thead><tr><th>Path</th><th>Status</th><th>H1</th><th>Title</th><th>Description</th></tr></thead><tbody>${pages.map((row) => `
        <tr><td>${escapeHtml(row.path || '')}</td><td>${escapeHtml(String(row.status_code || ''))}</td><td>${escapeHtml(String(row.h1_count || 0))}</td><td>${escapeHtml(row.title || (row.has_title ? 'yes' : 'missing'))}</td><td>${escapeHtml(row.meta_description || (row.has_meta_description ? 'yes' : 'missing'))}</td></tr>
      `).join('')}</tbody></table></div></details>
      <details style="margin-top:8px"><summary>D1 catalog/inventory counts</summary><pre class="small" style="white-space:pre-wrap">${escapeHtml(JSON.stringify({ catalog_counts: catalogs, inventory_counts: inventory }, null, 2))}</pre></details>`;
  }

  async function runReleaseSanity() {
    try {
      setMessage('Running release sanity checks...');
      results.innerHTML = '';
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/release-sanity'), 'Release sanity endpoint is unavailable.');
      render(data);
      setMessage(data.summary?.status === 'fail' ? 'Release sanity found blockers.' : 'Release sanity completed.', data.summary?.status === 'fail');
    } catch (error) {
      setMessage(error.message || 'Failed to run release sanity.', true);
    }
  }

  mount.querySelector('#runReleaseSanityButton')?.addEventListener('click', runReleaseSanity);
});
