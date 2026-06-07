// File: /public/js/admin-release-control.js
// Brief description: Renders Build 175 release-control center for deployment history, manifest comparison, screenshot evidence jobs, mobile saved views, safe exports, and local business schema.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('releaseControlMount');
  if (!mount || !window.DDAuth?.apiFetch) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const pill = (value) => `<span class="status-pill ${esc(String(value || '').toLowerCase())}">${esc(value || 'unknown')}</span>`;
  const table = (headers, rows, empty) => rows?.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : `<p class="small">${esc(empty || 'No rows yet.')}</p>`;
  async function post(action, extra = {}) {
    const response = await window.DDAuth.apiFetch('/api/admin/release-control', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...extra }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.error || 'Action failed.');
    render(data);
  }
  function render(data) {
    const lb = esc(data.build_label || 'Build 175');
    const local = data.local_business_rows?.[0];
    mount.innerHTML = `
      <div class="admin-actions" style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px">
        <button class="btn" data-action="queue_screenshot_jobs" type="button">Queue Dark Screenshot Jobs</button>
        <button class="btn secondary" data-action="seed_mobile_views" type="button">Seed Phone Saved Views</button>
        <button class="btn secondary" data-action="record_safe_export" type="button">Record Safe Deploy Export</button>
        <a class="btn secondary" href="/api/admin/release-control?format=local-business-json" target="_blank" rel="noopener">View LocalBusiness JSON</a>
      </div>
      <div class="grid four-col">
        <div class="admin-stat"><div class="admin-stat-label">Deployments</div><div class="admin-stat-value">${Number(data.summary?.deployment_count || 0)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Manifest Checks</div><div class="admin-stat-value">${Number(data.summary?.manifest_comparison_count || 0)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Screenshot Jobs</div><div class="admin-stat-value">${Number(data.summary?.screenshot_job_count || 0)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Phone Views</div><div class="admin-stat-value">${Number(data.summary?.mobile_saved_view_count || 0)}</div></div>
      </div>
      <h2>${lb} deployment history</h2>
      ${table(['Build','Branch','Deploy URL','Status','Created'], (data.deployment_history || []).map((row) => `<tr><td>${esc(row.build_label)}</td><td>${esc(row.branch_name)}</td><td>${row.deploy_url ? `<a href="${esc(row.deploy_url)}" target="_blank" rel="noopener">open</a>` : '—'}</td><td>${pill(row.deployment_status)}</td><td>${esc(row.created_at)}</td></tr>`), 'No deployment history rows yet.')}
      <h2>Manifest comparison</h2>
      ${table(['Build','Status','Missing','Changed','Compared'], (data.manifest_comparisons || []).map((row) => `<tr><td>${esc(row.build_label)}</td><td>${pill(row.comparison_status)}</td><td>${Number(row.missing_file_count || 0)}</td><td>${Number(row.changed_file_count || 0)}</td><td>${esc(row.compared_at || row.created_at || '')}</td></tr>`), 'No deployed-manifest comparison rows yet.')}
      <h2>Dark-theme screenshot evidence jobs</h2>
      ${table(['Page','Viewport','Theme','Status','Evidence'], (data.screenshot_jobs || []).map((row) => `<tr><td><code>${esc(row.page_path)}</code></td><td>${Number(row.viewport_width || 0)}×${Number(row.viewport_height || 0)}</td><td>${esc(row.theme)}</td><td>${pill(row.capture_status)}</td><td>${row.evidence_url ? `<a href="${esc(row.evidence_url)}" target="_blank" rel="noopener">open</a>` : '—'}</td></tr>`), 'No screenshot evidence jobs yet.')}
      <h2>Phone-first saved admin views</h2>
      ${table(['Key','Label','Page','Default'], (data.mobile_views || []).map((row) => `<tr><td><code>${esc(row.view_key)}</code></td><td>${esc(row.view_label)}</td><td><a href="${esc(row.page_path)}">${esc(row.page_path)}</a></td><td>${Number(row.is_default || 0) ? 'Yes' : 'No'}</td></tr>`), 'No mobile saved views yet.')}
      <h2>Local business structured data</h2>
      <div class="status-note"><p><strong>${esc(local?.business_name || 'Devil n Dove')}</strong> — ${pill(local?.schema_status || 'draft')}</p><pre style="white-space:pre-wrap;overflow:auto">${esc(JSON.stringify(local?.schema_preview || {}, null, 2))}</pre></div>
      <h2>QA, marketplace, recall safety snapshots</h2>
      <div class="grid three-col">
        <div class="status-note"><h3>Product QA bulk queue</h3><p>${Number((data.qa_queue || []).length)} recent grouped blocker row(s).</p></div>
        <div class="status-note"><h3>Marketplace rules</h3><p>${Number((data.marketplace_rules || []).length)} channel validation rule row(s).</p></div>
        <div class="status-note"><h3>Recall compliance</h3><p>${Number((data.recall_reviews || []).length)} compliance review row(s).</p></div>
      </div>
      <h2>Safe deploy export records</h2>
      ${table(['Build','Label','Status','Manifest','Created'], (data.safe_exports || []).map((row) => `<tr><td>${esc(row.build_label)}</td><td>${esc(row.export_label)}</td><td>${pill(row.export_status)}</td><td><code>${esc(row.manifest_path)}</code></td><td>${esc(row.created_at)}</td></tr>`), 'No safe deploy export records yet.')}`;
    mount.querySelectorAll('button[data-action]').forEach((button) => {
      button.addEventListener('click', async () => {
        const original = button.textContent;
        try { button.disabled = true; button.textContent = 'Working…'; await post(button.dataset.action); }
        catch (error) { alert(error.message || 'Action failed.'); }
        finally { button.disabled = false; button.textContent = original; }
      });
    });
  }
  window.DDAuth.apiFetch('/api/admin/release-control').then((r) => r.json()).then((data) => { if (!data?.ok) throw new Error(data?.error || 'Load failed.'); render(data); }).catch((error) => { mount.textContent = error.message || 'Release control failed.'; });
});
