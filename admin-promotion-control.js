// File: /public/js/admin-promotion-control.js
// Brief description: Renders Build 179 final promotion-control and go-live gate rows.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('promotionControlMount');
  if (!mount || !window.DDAuth?.apiFetch) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const pill = (value) => `<span class="status-pill ${esc(String(value || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}">${esc(value || 'unknown')}</span>`;
  const rows = (data, key) => Array.isArray(data?.[key]) ? data[key] : [];
  const table = (headers, bodyRows, empty) => bodyRows?.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${bodyRows.join('')}</tbody></table></div>` : `<p class="small">${esc(empty || 'No rows yet.')}</p>`;
  const spark = (values) => {
    const nums = values.map((v) => Number(v || 0));
    const max = Math.max(1, ...nums);
    return `<div class="mini-chart" aria-label="trend chart">${nums.map((n) => `<span style="height:${Math.max(12, Math.round((n / max) * 42))}px"></span>`).join('')}</div>`;
  };
  async function post(action, extra = {}) {
    const response = await window.DDAuth.apiFetch('/api/admin/promotion-control', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...extra }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.error || 'Action failed.');
    render(data);
  }
  function render(data) {
    const summary = data.summary || {};
    mount.innerHTML = `
      <div class="status-note ${summary.latest_promote_status === 'ready_to_promote' ? 'success' : 'warning'}">${esc(data.build_label || 'Build 179')} final gate status: ${pill(summary.latest_promote_status || 'not_attempted')} • QA rules: ${Number(summary.qa_rule_count || 0)} • Recall blockers: ${Number(summary.recall_blockers || 0)} • Marketplace blockers: ${Number(summary.marketplace_blockers || 0)}</div>
      <div class="admin-actions" style="display:flex;flex-wrap:wrap;gap:10px;margin:14px 0">
        <button class="btn" data-action="seed_all" type="button">Seed/refresh all final controls</button>
        <button class="btn secondary" data-action="seed_qa_rules" type="button">Seed QA safe rules</button>
        <button class="btn secondary" data-action="seed_local_seo_visuals" type="button">Build SEO charts/graph</button>
        <button class="btn secondary" data-action="approve_local_business_bake" type="button">Approve LocalBusiness bake</button>
        <button class="btn secondary" data-action="verify_provider_signatures" type="button">Check webhook signatures</button>
        <button class="btn secondary" data-action="run_r2_signed_url_expiry_test" type="button">Run signed URL expiry test</button>
        <button class="btn secondary" data-action="upload_recall_signature_evidence" type="button">Add recall evidence placeholder</button>
        <button class="btn secondary" data-action="refresh_recall_gates" type="button">Refresh recall gates</button>
        <button class="btn secondary" data-action="link_accounting_zip" type="button">Link accountant ZIP checksum</button>
        <button class="btn secondary" data-action="seed_marketplace_gates" type="button">Refresh marketplace gates</button>
        <button class="btn secondary" data-action="run_manifest_filters" type="button">Run manifest filters</button>
        <button class="btn secondary" data-action="export_readiness_markdown" type="button">Export readiness Markdown</button>
        <button class="btn secondary" data-action="match_cloudflare_deployments" type="button">Match Cloudflare releases</button>
        <button class="btn danger" data-action="attempt_promote_live" type="button">Attempt Promote Live</button>
        <button class="btn secondary" data-action="run_incident_watch" type="button">Run incident watcher</button>
      </div>
      <div class="grid four-col">
        <div class="admin-stat"><div class="admin-stat-label">QA Rules</div><div class="admin-stat-value">${Number(summary.qa_rule_count || 0)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Recall Blockers</div><div class="admin-stat-value">${Number(summary.recall_blockers || 0)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Marketplace Blockers</div><div class="admin-stat-value">${Number(summary.marketplace_blockers || 0)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Promote</div><div class="admin-stat-value">${esc(summary.latest_promote_status || '—')}</div></div>
      </div>
      <h2>Product QA safe apply rules</h2>
      ${table(['Blocker','Field','Status','Max Rows','Notes'], rows(data, 'qa_rules').map((row) => `<tr><td><code>${esc(row.blocker_code)}</code></td><td>${esc(row.apply_field)}</td><td>${pill(row.rule_status)}</td><td>${Number(row.max_rows_per_run || 0)}</td><td>${esc(row.safety_notes)}</td></tr>`), 'No QA safe apply rules yet.')}
      <h2>Local SEO mini charts and internal-link graph snapshots</h2>
      ${table(['Page','Chart','Metric','Preview','Status'], rows(data, 'chart_configs').map((row, i) => `<tr><td><code>${esc(row.page_path)}</code></td><td>${esc(row.chart_label)}</td><td>${esc(row.metric_kind)}</td><td>${spark([12 + i, 18 + i * 2, 15 + i, 24 + i * 3, 30 + i])}</td><td>${pill(row.chart_status)}</td></tr>`), 'No chart configs yet.')}
      ${table(['Snapshot','Nodes','Edges','Missing Links','Status'], rows(data, 'graph_snapshots').map((row) => `<tr><td>${esc(row.snapshot_label)}</td><td>${Number(row.node_count || 0)}</td><td>${Number(row.edge_count || 0)}</td><td>${Number(row.missing_link_count || 0)}</td><td>${pill(row.snapshot_status)}</td></tr>`), 'No internal-link graph snapshots yet.')}
      <h2>LocalBusiness approve-and-bake rows</h2>
      ${table(['Draft','Status','Output','Targets','Notes'], rows(data, 'lb_bake_approvals').map((row) => `<tr><td>${esc(row.local_business_schema_edit_draft_id || 'latest')}</td><td>${pill(row.approval_status)}</td><td><code>${esc(row.output_path)}</code></td><td><code>${esc(row.target_paths_json)}</code></td><td>${esc(row.bake_notes)}</td></tr>`), 'No LocalBusiness bake approvals yet.')}
      <h2>Provider webhook and R2 signed URL verification</h2>
      ${table(['Provider','Secret','Signature Header','Timestamp Header','Status','Notes'], rows(data, 'webhook_checks').map((row) => `<tr><td>${esc(row.provider)}</td><td>${Number(row.secret_present || 0) ? 'present' : 'missing'}</td><td>${Number(row.signature_header_present || 0) ? 'present' : esc(row.signature_header_name)}</td><td>${esc(row.timestamp_header_name || '—')}</td><td>${pill(row.verification_status)}</td><td>${esc(row.verification_notes)}</td></tr>`), 'No webhook signature checks yet.')}
      ${table(['Bucket','Object','Create','Signed URL','Expiry','Notes'], rows(data, 'r2_expiry_tests').map((row) => `<tr><td>${esc(row.bucket_label)}</td><td><code>${esc(row.object_key)}</code></td><td>${pill(row.create_status)}</td><td>${pill(row.signed_url_status)}</td><td>${pill(row.expiry_status)}</td><td>${esc(row.notes)}</td></tr>`), 'No signed URL expiry test rows yet.')}
      <h2>Recall evidence and release gates</h2>
      ${table(['Batch','Filename','Bytes','Status','Object'], rows(data, 'recall_uploads').map((row) => `<tr><td>${esc(row.batch_number)}</td><td>${esc(row.original_filename)}</td><td>${Number(row.file_size_bytes || 0)}</td><td>${pill(row.upload_status)}</td><td><code>${esc(row.r2_object_key)}</code></td></tr>`), 'No recall signature evidence uploads yet.')}
      ${table(['Batch','Copy','Signature','Customer Match','Release','Notes'], rows(data, 'recall_gates').map((row) => `<tr><td>${esc(row.batch_number)}</td><td>${pill(row.copy_review_status)}</td><td>${pill(row.signature_status)}</td><td>${pill(row.customer_match_status)}</td><td>${pill(row.release_status)}</td><td>${esc(row.gate_notes)}</td></tr>`), 'No recall release gates yet.')}
      <h2>Marketplace download gates and accountant ZIP links</h2>
      ${table(['Channel','Status','Hard Blockers','Override','Notes'], rows(data, 'marketplace_gates').map((row) => `<tr><td>${esc(row.channel)}</td><td>${pill(row.gate_status)}</td><td>${Number(row.hard_blocker_count || 0)}</td><td>${Number(row.manual_override_required || 0) ? 'required' : 'not needed'}</td><td>${esc(row.gate_notes)}</td></tr>`), 'No marketplace download gates yet.')}
      ${table(['Period','Bytes','Evidence Files','Status','SHA'], rows(data, 'accounting_links').map((row) => `<tr><td>${esc(row.period_month)}</td><td>${Number(row.total_bytes || 0).toLocaleString()}</td><td>${Number(row.evidence_file_count || 0)}</td><td>${pill(row.link_status)}</td><td><code>${esc(String(row.zip_sha256 || '').slice(0, 18))}</code></td></tr>`), 'No accountant ZIP checksum links yet.')}
      <h2>Manifest, previous ZIP, rollback, and readiness exports</h2>
      ${table(['Previous','Current','Added','Changed','Removed','Status'], rows(data, 'previous_zip_imports').map((row) => `<tr><td>${esc(row.previous_build_label)}</td><td>${esc(row.current_build_label)}</td><td>${Number(row.added_count || 0)}</td><td>${Number(row.changed_count || 0)}</td><td>${Number(row.removed_count || 0)}</td><td>${pill(row.import_status)}</td></tr>`), 'No previous ZIP manifest imports yet.')}
      ${table(['Filter','Kind','Contains','Matches','Status'], rows(data, 'manifest_filter_runs').map((row) => `<tr><td>${esc(row.filter_key)}</td><td>${esc(row.diff_kind)}</td><td>${esc(row.path_contains)}</td><td>${Number(row.matched_count || 0)}</td><td>${pill(row.run_status)}</td></tr>`), 'No manifest filter runs yet.')}
      ${table(['Rollback Row','Status','Note','Acted'], rows(data, 'rollback_actions').map((row) => `<tr><td>${Number(row.deployment_rollback_checklist_row_id || 0)}</td><td>${pill(row.action_status)}</td><td>${esc(row.action_note)}</td><td>${esc(row.acted_at)}</td></tr>`), 'No rollback row actions yet.')}
      ${table(['Export','Build','Score','Status','Created'], rows(data, 'markdown_exports').map((row) => `<tr><td>${Number(row.deployment_readiness_markdown_export_id || 0)}</td><td>${esc(row.build_label)}</td><td>${Number(row.score || 0)}</td><td>${pill(row.export_status)}</td><td>${esc(row.created_at)}</td></tr>`), 'No readiness Markdown exports yet.')}
      <h2>Cloudflare release matching, promote-live attempts, and incident watch</h2>
      ${table(['Build','Branch','Commit','Manifest','Score','Status'], rows(data, 'cf_matches').map((row) => `<tr><td>${esc(row.build_label)}</td><td>${esc(row.branch_name)}</td><td><code>${esc(String(row.commit_sha || '').slice(0, 10))}</code></td><td><code>${esc(String(row.manifest_hash || '').slice(0, 12))}</code></td><td>${Number(row.match_score || 0)}</td><td>${pill(row.match_status)}</td></tr>`), 'No Cloudflare deployment-release matches yet.')}
      ${table(['Build','Status','Score','Blockers','Checklist','Smoke','Manifest','D1','Notes'], rows(data, 'promote_attempts').map((row) => `<tr><td>${esc(row.build_label)}</td><td>${pill(row.attempt_status)}</td><td>${Number(row.readiness_score || 0)}</td><td>${Number(row.blocker_count || 0)}</td><td>${Number(row.checklist_blocker_count || 0)}</td><td>${Number(row.smoke_blocker_count || 0)}</td><td>${Number(row.manifest_blocker_count || 0)}</td><td>${Number(row.d1_marker_blocker_count || 0)}</td><td>${esc(row.notes)}</td></tr>`), 'No promote-live attempts yet.')}
      ${table(['Build','Status','404','500/Error','Provider','Incidents','Notes'], rows(data, 'incident_watch').map((row) => `<tr><td>${esc(row.build_label)}</td><td>${pill(row.watch_status)}</td><td>${Number(row.runtime_404_count || 0)}</td><td>${Number(row.runtime_500_count || 0)}</td><td>${Number(row.provider_failure_count || 0)}</td><td>${Number(row.incident_rows_created || 0)}</td><td>${esc(row.notes)}</td></tr>`), 'No post-promotion incident watch rows yet.')}
      <h2>Structured-data page previews and mobile render preferences</h2>
      ${table(['Page','Schema','Status','Issues','Excerpt'], rows(data, 'schema_previews').map((row) => `<tr><td><code>${esc(row.page_path)}</code></td><td>${esc(row.schema_type)}</td><td>${pill(row.preview_status)}</td><td>${Number(row.issue_count || 0)}</td><td><code>${esc(String(row.jsonld_excerpt || '').slice(0, 120))}</code></td></tr>`), 'No schema preview rows yet.')}
      ${table(['User','Compact','Large Taps','Cards'], rows(data, 'mobile_preferences').map((row) => `<tr><td>${esc(row.user_id)}</td><td>${Number(row.compact_mode || 0) ? 'Yes' : 'No'}</td><td>${Number(row.large_tap_targets || 0) ? 'Yes' : 'No'}</td><td><code>${esc(row.visible_cards_json)}</code></td></tr>`), 'No mobile release render preferences yet.')}`;
    mount.querySelectorAll('button[data-action]').forEach((button) => button.addEventListener('click', async () => {
      const action = button.dataset.action;
      const original = button.textContent;
      const extra = {};
      if (action === 'attempt_promote_live' && !confirm('Attempt Promote Live? This will stay blocked unless all required gates pass.')) return;
      if (action === 'upload_recall_signature_evidence') {
        extra.batch_number = prompt('Batch number for recall evidence placeholder', 'manual-review') || 'manual-review';
        extra.original_filename = 'manual-signature-placeholder.txt';
        extra.text_content = 'Manual recall signature evidence placeholder created from Promotion Control.';
      }
      try { button.disabled = true; button.textContent = 'Working…'; await post(action, extra); }
      catch (error) { alert(error.message || 'Action failed.'); }
      finally { button.disabled = false; button.textContent = original; }
    }));
  }
  window.DDAuth.apiFetch('/api/admin/promotion-control').then((r) => r.json()).then((data) => { if (!data?.ok) throw new Error(data?.error || 'Load failed.'); render(data); }).catch((error) => { mount.textContent = error.message || 'Promotion Control failed.'; });
});
