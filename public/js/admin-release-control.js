// File: /public/js/admin-release-control.js
// Brief description: Renders Build 178 release-control center for deployment safety, manifest diffs, safe ZIP export, QA previews, marketplace validation, recall locks, local SEO, and rollback checks.

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
    const lb = esc(data.build_label || 'Build 178');
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
        <button class="btn secondary" data-action="import_cloudflare_deployments" type="button">Import Cloudflare deployments</button>
        <button class="btn secondary" data-action="calculate_deploy_readiness" type="button">Calculate deploy score</button>
        <button class="btn secondary" data-action="generate_recall_customer_previews" type="button">Generate recall customers</button>
        <button class="btn secondary" data-action="run_r2_signed_download_test" type="button">Run R2 private test</button>
        <button class="btn secondary" data-action="seed_local_business_injection_targets" type="button">Seed JSON-LD targets</button>
        <button class="btn secondary" data-action="approve_internal_links" type="button">Approve link suggestions</button>
        <button class="btn secondary" data-action="create_dashboard_cards" type="button">Create dashboard cards</button>
        <a class="btn secondary" href="/api/admin/release-control?format=local-business-json" target="_blank" rel="noopener">View LocalBusiness JSON</a>
        <a class="btn secondary" href="/admin/deploy-readiness/">Open Deploy Readiness</a>
        <a class="btn secondary" href="/admin/promotion-control/">Open Promotion Control</a>
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

      <h2>Deploy readiness score</h2>
      ${table(['Build','Score','Status','Blockers','Warnings','Scored'], rows(data, 'readiness_scores').map((row) => `<tr><td>${esc(row.build_label)}</td><td><strong>${Number(row.score || 0)}/100</strong></td><td>${pill(row.score_status)}</td><td>${Number(row.blocker_count || 0) + Number(row.manifest_blocker_count || 0) + Number(row.smoke_blocker_count || 0) + Number(row.rollback_blocker_count || 0)}</td><td>${Number(row.warning_count || 0)}</td><td>${esc(row.scored_at)}</td></tr>`), 'No deploy readiness score has been calculated yet.')}
      <h2>Exact manifest diff items</h2>
      ${table(['Kind','File','Expected SHA','Deployed SHA','Status'], rows(data, 'diff_items').map((row) => `<tr><td>${pill(row.diff_kind)}</td><td><code>${esc(row.file_path)}</code></td><td><code>${esc(String(row.expected_sha256 || '').slice(0, 16))}</code></td><td><code>${esc(String(row.deployed_sha256 || '').slice(0, 16))}</code></td><td>${pill(row.item_status)}</td></tr>`), 'Run live manifest compare to populate exact file-path diff rows.')}
      <h2>Product QA approvals and safe apply</h2>
      ${table(['Queue','Status','Scope','Notes','Approved'], rows(data, 'qa_approvals').map((row) => `<tr><td>${esc(row.product_qa_bulk_fix_queue_id)}</td><td>${pill(row.approval_status)}</td><td>${esc(row.approval_scope)}</td><td>${esc(row.approval_notes)}</td><td>${esc(row.approved_at)}</td></tr>`), 'No Product QA preview approvals yet.')}
      <div class="status-note small">To approve a preview group, use the queue ID from Product QA queue and call the approval controls below.</div>
      <form id="qaApprovalForm" class="inline-form"><input name="queue_id" placeholder="QA queue ID"><select name="approval_status"><option value="manual_only">manual_only</option><option value="safe">safe</option><option value="skipped">skipped</option></select><button class="btn small" type="submit">Save QA approval</button><button class="btn small secondary" id="applyAltTextFixes" type="button">Apply approved alt text</button></form>
      <h2>Marketplace rule editor rows</h2>
      <form id="marketplaceRuleForm" class="inline-form"><select name="channel"><option>etsy</option><option>facebook</option><option>pinterest</option><option>manual</option></select><input name="column_key" placeholder="column_key"><select name="severity"><option>blocker</option><option>warn</option></select><button class="btn small" type="submit">Save rule</button></form>
      ${table(['Channel','Column','Required','Severity','Status'], rows(data, 'rule_edits').map((row) => `<tr><td>${esc(row.channel)}</td><td><code>${esc(row.column_key)}</code></td><td>${Number(row.is_required || 0) ? 'Yes' : 'No'}</td><td>${pill(row.severity)}</td><td>${pill(row.rule_status)}</td></tr>`), 'No edited marketplace validation rules yet.')}
      <h2>Recall customer preview matches</h2>
      ${table(['Batch','Product','Order','Customer','Status'], rows(data, 'recall_matches').map((row) => `<tr><td>${esc(row.batch_number)}</td><td>${esc(row.product_id || '')}</td><td>${esc(row.order_id || '')}</td><td>${esc(row.customer_name || row.customer_email || '')}</td><td>${pill(row.preview_status)}</td></tr>`), 'No recall customer match previews yet.')}
      <h2>R2 private evidence tests and accounting checksum links</h2>
      ${table(['Object','Create','Get','Delete','Bytes','Checked'], rows(data, 'r2_signed_tests').map((row) => `<tr><td><code>${esc(row.object_key)}</code></td><td>${pill(row.create_status)}</td><td>${pill(row.get_status)}</td><td>${pill(row.delete_status)}</td><td>${Number(row.bytes_tested || 0)}</td><td>${esc(row.checked_at)}</td></tr>`), 'No R2 private evidence test has run yet.')}
      ${table(['Period','SHA','Status','Notes'], rows(data, 'checksum_links').map((row) => `<tr><td>${esc(row.period_month || '')}</td><td><code>${esc(String(row.zip_sha256 || '').slice(0, 16))}</code></td><td>${pill(row.link_status)}</td><td>${esc(row.notes)}</td></tr>`), 'No accounting ZIP checksum links yet.')}
      <h2>LocalBusiness JSON-LD injection targets</h2>
      ${table(['Page','Status','Source','Last Baked'], rows(data, 'injection_targets').map((row) => `<tr><td><code>${esc(row.page_path)}</code></td><td>${pill(row.injection_status)}</td><td><code>${esc(row.schema_source)}</code></td><td>${esc(row.last_baked_at || '')}</td></tr>`), 'No LocalBusiness injection target rows yet.')}
      <h2>Dashboard notification cards</h2>
      ${table(['Kind','Title','Severity','Destination','Status'], rows(data, 'dashboard_cards').map((row) => `<tr><td>${esc(row.source_kind)}</td><td>${esc(row.card_title)}</td><td>${pill(row.severity)}</td><td><a href="${esc(row.destination_page)}">open</a></td><td>${pill(row.card_status)}</td></tr>`), 'No dashboard notification cards yet.')}
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
    mount.querySelector('#qaApprovalForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      await post('approve_qa_preview', { product_qa_bulk_fix_queue_id: Number(form.queue_id.value || 0), approval_status: form.approval_status.value, notes: 'Reviewed from Release Control.' });
    });
    mount.querySelector('#applyAltTextFixes')?.addEventListener('click', async () => {
      const queueId = Number(mount.querySelector('#qaApprovalForm [name="queue_id"]')?.value || 0);
      if (!queueId) return alert('Enter an approved missing_image_alt QA queue ID first.');
      await post('apply_qa_alt_text', { product_qa_bulk_fix_queue_id: queueId });
    });
    mount.querySelector('#marketplaceRuleForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      await post('save_marketplace_rule', { channel: form.channel.value, column_key: form.column_key.value, severity: form.severity.value, is_required: 1, rule_status: 'active' });
    });
  }
  window.DDAuth.apiFetch('/api/admin/release-control').then((r) => r.json()).then((data) => { if (!data?.ok) throw new Error(data?.error || 'Load failed.'); render(data); }).catch((error) => { mount.textContent = error.message || 'Release control failed.'; });
});
