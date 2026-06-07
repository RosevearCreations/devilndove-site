// File: /public/js/admin-release-control.js
// Brief description: Renders Build 176 release-control center for deployment safety, manifest diffs, safe ZIP export, QA previews, marketplace validation, recall locks, local SEO, and rollback checks.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('releaseControlMount');
  if (!mount || !window.DDAuth?.apiFetch) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const pill = (value) => `<span class="status-pill ${esc(String(value || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}">${esc(value || 'unknown')}</span>`;
  const table = (headers, rows, empty) => rows?.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : `<p class="small">${esc(empty || 'No rows yet.')}</p>`;
  async function post(action, extra = {}) {
    const response = await window.DDAuth.apiFetch('/api/admin/release-control', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...extra }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.error || 'Action failed.');
    render(data);
  }
  function rows(data, key) { return Array.isArray(data?.[key]) ? data[key] : []; }
  function render(data) {
    const lb = esc(data.build_label || 'Build 176');
    const local = rows(data, 'local_business_rows')[0];
    const zipUrl = esc(data.safe_deploy_zip_url || '/api/admin/safe-deploy-package?format=zip');
    mount.innerHTML = `
      <div class="admin-actions" style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px">
        <a class="btn" href="${zipUrl}">Download Safe Deploy ZIP</a>
        <button class="btn secondary" data-action="live_manifest_compare" type="button">Live Manifest Compare</button>
        <button class="btn secondary" data-action="queue_screenshot_jobs" type="button">Queue Dark Screenshot Jobs</button>
        <button class="btn secondary" data-action="seed_mobile_views" type="button">Seed Phone Views</button>
        <button class="btn secondary" data-action="seed_qa_bulk_preview" type="button">Build QA Preview Cards</button>
        <button class="btn secondary" data-action="record_marketplace_validation_preview" type="button">Marketplace Validation Preview</button>
        <button class="btn secondary" data-action="seed_recall_locks" type="button">Refresh Recall Locks</button>
        <button class="btn secondary" data-action="seed_local_seo_suggestions" type="button">Seed Local SEO Links</button>
        <button class="btn secondary" data-action="record_rollback_checklist" type="button">Create Rollback Checklist</button>
        <button class="btn secondary" data-action="import_cloudflare_deployments" type="button">Check Cloudflare Import Setup</button>
        <a class="btn secondary" href="/api/admin/release-control?format=local-business-json" target="_blank" rel="noopener">View LocalBusiness JSON</a>
      </div>
      <div class="grid four-col">
        <div class="admin-stat"><div class="admin-stat-label">Deployments</div><div class="admin-stat-value">${Number(data.summary?.deployment_count || 0)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Manifest Checks</div><div class="admin-stat-value">${Number(data.summary?.manifest_comparison_count || 0)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Safe Exports</div><div class="admin-stat-value">${Number(data.summary?.safe_export_count || 0)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Recall Locks</div><div class="admin-stat-value">${Number(data.summary?.recall_lock_count || 0)}</div></div>
      </div>
      <h2>${lb} deployment history</h2>
      ${table(['Build','Branch','Deploy URL','Status','Created'], rows(data, 'deployment_history').map((row) => `<tr><td>${esc(row.build_label)}</td><td>${esc(row.branch_name)}</td><td>${row.deploy_url ? `<a href="${esc(row.deploy_url)}" target="_blank" rel="noopener">open</a>` : '—'}</td><td>${pill(row.deployment_status)}</td><td>${esc(row.created_at)}</td></tr>`), 'No deployment history rows yet.')}
      <h2>Live manifest compare</h2>
      ${table(['Build','Status','Missing','Changed','Extra','Checked'], rows(data, 'live_manifest_diffs').map((row) => `<tr><td>${esc(row.build_label)}</td><td>${pill(row.diff_status)}</td><td>${Number(row.missing_file_count || 0)}</td><td>${Number(row.changed_file_count || 0)}</td><td>${Number(row.extra_file_count || 0)}</td><td>${esc(row.checked_at)}</td></tr>`), 'No live manifest diff rows yet.')}
      <h2>Manifest comparison records</h2>
      ${table(['Build','Status','Missing','Changed','Compared'], rows(data, 'manifest_comparisons').map((row) => `<tr><td>${esc(row.build_label)}</td><td>${pill(row.comparison_status)}</td><td>${Number(row.missing_file_count || 0)}</td><td>${Number(row.changed_file_count || 0)}</td><td>${esc(row.compared_at || row.created_at || '')}</td></tr>`), 'No deployed-manifest comparison rows yet.')}
      <h2>Safe deploy downloads</h2>
      ${table(['Build','Files','Bytes','Status','SHA-256'], rows(data, 'safe_downloads').map((row) => `<tr><td>${esc(row.build_label)}</td><td>${Number(row.file_count || 0)}</td><td>${Number(row.total_bytes || 0).toLocaleString()}</td><td>${pill(row.download_status)}</td><td><code>${esc(String(row.zip_sha256 || '').slice(0, 16))}</code></td></tr>`), 'No safe ZIP download records yet.')}
      <h2>Product QA bulk-fix preview cards</h2>
      ${table(['Product','Blocker','Field','Suggested','Fix'], rows(data, 'qa_preview_items').map((row) => `<tr><td>${esc(row.product_id)}</td><td><code>${esc(row.blocker_code)}</code></td><td>${esc(row.focus_field)}</td><td>${esc(row.suggested_value)}</td><td>${row.fix_url ? `<a href="${esc(row.fix_url)}">open field</a>` : '—'}</td></tr>`), 'No QA preview items yet. Run Product QA first, then build preview cards.')}
      <h2>Marketplace validation and visual diff safety</h2>
      ${table(['Channel','Status','Blockers','Warnings','Rows'], rows(data, 'marketplace_validations').map((row) => `<tr><td>${esc(row.channel)}</td><td>${pill(row.validation_status)}</td><td>${Number(row.blocker_count || 0)}</td><td>${Number(row.warning_count || 0)}</td><td>${Number(row.checked_rows || 0)}</td></tr>`), 'No marketplace validation preview runs yet.')}
      ${table(['Channel','Diff Status','Rows Changed','Fields Changed','Created'], rows(data, 'snapshot_diffs').map((row) => `<tr><td>${esc(row.channel)}</td><td>${pill(row.diff_status)}</td><td>${Number(row.changed_row_count || 0)}</td><td>${Number(row.changed_field_count || 0)}</td><td>${esc(row.created_at)}</td></tr>`), 'No marketplace snapshot diff rows yet.')}
      <h2 id="recall-locks">Recall compliance locks</h2>
      ${table(['Batch','Recall','Status','Review','Checked','Notes'], rows(data, 'recall_locks').map((row) => `<tr><td>${esc(row.batch_number)}</td><td>${esc(row.recall_id || '')}</td><td>${pill(row.lock_status)}</td><td>${esc(row.matching_review_id || '—')}</td><td>${esc(row.last_checked_at)}</td><td>${esc(row.notes)}</td></tr>`), 'No recall lock rows yet.')}
      <h2>Local SEO internal links and Search Console trends</h2>
      ${table(['Source','Target','Anchor','Score','Status'], rows(data, 'internal_links').map((row) => `<tr><td><code>${esc(row.source_path)}</code></td><td><code>${esc(row.target_path)}</code></td><td>${esc(row.suggested_anchor)}</td><td>${Number(row.score || 0)}</td><td>${pill(row.suggestion_status)}</td></tr>`), 'No local internal-link suggestions yet.')}
      ${table(['Page','Query','Clicks','Impressions','Avg Pos'], rows(data, 'search_trends').map((row) => `<tr><td><code>${esc(row.page_path)}</code></td><td>${esc(row.query_text)}</td><td>${Number(row.clicks || 0)}</td><td>${Number(row.impressions || 0)}</td><td>${Number(row.average_position || 0).toFixed(1)}</td></tr>`), 'No Search Console trend rows imported yet.')}
      <h2>Local business structured data</h2>
      <div class="status-note"><p><strong>${esc(local?.business_name || 'Devil n Dove')}</strong> — ${pill(local?.schema_status || 'draft')}</p><pre style="white-space:pre-wrap;overflow:auto">${esc(JSON.stringify(local?.schema_preview || {}, null, 2))}</pre></div>
      <h2>Rollback checklist</h2>
      ${table(['Build','Key','Label','Status','Required'], rows(data, 'rollback_rows').map((row) => `<tr><td>${esc(row.build_label)}</td><td><code>${esc(row.checklist_key)}</code></td><td>${esc(row.checklist_label)}</td><td>${pill(row.checklist_status)}</td><td>${Number(row.required_before_rollback || 0) ? 'Yes' : 'No'}</td></tr>`), 'No rollback checklist rows yet.')}
      <h2>Cloudflare deployment import setup</h2>
      ${table(['Status','Account ID','Project','Imported','Created'], rows(data, 'cf_imports').map((row) => `<tr><td>${pill(row.import_status)}</td><td>${Number(row.account_id_present || 0) ? 'Yes' : 'No'}</td><td>${Number(row.project_name_present || 0) ? 'Yes' : 'No'}</td><td>${Number(row.imported_count || 0)}</td><td>${esc(row.created_at)}</td></tr>`), 'No Cloudflare import setup check yet.')}
      <h2>Phone-first saved admin views</h2>
      ${table(['Key','Label','Page','Default'], rows(data, 'mobile_views').map((row) => `<tr><td><code>${esc(row.view_key)}</code></td><td>${esc(row.view_label)}</td><td><a href="${esc(row.page_path)}">${esc(row.page_path)}</a></td><td>${Number(row.is_default || 0) ? 'Yes' : 'No'}</td></tr>`), 'No mobile saved views yet.')}
      <h2>Dark-theme screenshot evidence jobs</h2>
      ${table(['Page','Viewport','Theme','Status','Evidence'], rows(data, 'screenshot_jobs').map((row) => `<tr><td><code>${esc(row.page_path)}</code></td><td>${Number(row.viewport_width || 0)}×${Number(row.viewport_height || 0)}</td><td>${esc(row.theme)}</td><td>${pill(row.capture_status)}</td><td>${row.evidence_url ? `<a href="${esc(row.evidence_url)}" target="_blank" rel="noopener">open</a>` : '—'}</td></tr>`), 'No screenshot evidence jobs yet.')}`;
    mount.querySelectorAll('button[data-action]').forEach((button) => {
      button.addEventListener('click', async () => {
        const original = button.textContent;
        try {
          button.disabled = true;
          button.textContent = 'Working…';
          const extra = button.dataset.action === 'live_manifest_compare' ? { deployed_manifest_url: prompt('Deployed manifest URL', `${location.origin}/data/site/release-package-manifest.json`) || '' } : {};
          await post(button.dataset.action, extra);
        } catch (error) { alert(error.message || 'Action failed.'); }
        finally { button.disabled = false; button.textContent = original; }
      });
    });
  }
  window.DDAuth.apiFetch('/api/admin/release-control').then((r) => r.json()).then((data) => { if (!data?.ok) throw new Error(data?.error || 'Load failed.'); render(data); }).catch((error) => { mount.textContent = error.message || 'Release control failed.'; });
});
