// File: /public/js/admin-deploy-readiness.js
// Brief description: Build 178 deploy-readiness UI with promote-live checklist controls, blocker drilldowns, manifest copy helpers, recall copy review, LocalBusiness draft status, and mobile release cards.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('deployReadinessMount');
  if (!mount || !window.DDAuth?.apiFetch) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const pill = (value) => `<span class="status-pill ${esc(String(value || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}">${esc(value || 'unknown')}</span>`;
  const table = (headers, body, empty) => body?.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${body.join('')}</tbody></table></div>` : `<p class="small">${esc(empty || 'No rows yet.')}</p>`;
  async function read(response) { const data = await response.json().catch(() => ({})); if (!response.ok || data?.ok === false) throw new Error(data?.error || 'Deploy-readiness request failed.'); return data; }
  async function post(action, extra = {}) {
    mount.querySelector('[data-deploy-message]')?.replaceChildren(document.createTextNode('Working…'));
    const data = await read(await window.DDAuth.apiFetch('/api/admin/deploy-readiness', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...extra }) }));
    render(data);
  }
  function rows(data, key) { return Array.isArray(data?.[key]) ? data[key] : []; }
  function copyButton(text) { return `<button class="btn small secondary" data-copy-path="${esc(text)}" type="button">Copy</button>`; }
  function render(data) {
    const summary = data.summary || {};
    mount.innerHTML = `
      <div class="status-note info" data-deploy-message>Build ${esc(data.build_label || '178')} final promotion guard. Score: <strong>${Number(summary.score || 0)}/100</strong> ${pill(summary.score_status || 'not_scored')} • Promote blockers: ${Number(summary.promote_blockers || 0)} • Open manifest rows: ${Number(summary.manifest_open || 0)}</div>
      <div class="admin-actions" style="display:flex;flex-wrap:wrap;gap:10px;margin:14px 0">
        <button class="btn" data-action="seed_promote_checklist" type="button">Build promote-live checklist</button>
        <button class="btn secondary" data-action="seed_drilldowns" type="button">Refresh drilldowns</button>
        <button class="btn secondary" data-action="seed_recall_copy_reviews" type="button">Seed recall copy reviews</button>
        <button class="btn secondary" data-action="seed_signature_placeholder" type="button">Add signature placeholder</button>
        <button class="btn secondary" data-action="seed_webhook_signature_logs" type="button">Seed webhook signature logs</button>
        <button class="btn secondary" data-action="run_r2_signed_url_check" type="button">Run R2 signed URL check</button>
        <button class="btn secondary" data-action="seed_local_seo_visuals" type="button">Build SEO charts/link map</button>
        <button class="btn secondary" data-action="seed_local_business_draft" type="button">Create LocalBusiness draft</button>
        <button class="btn secondary" data-action="seed_schema_hints" type="button">Seed schema hints</button>
        <a class="btn" href="${esc(data.safe_deploy_zip_url || '/api/admin/safe-deploy-package?format=zip')}">Download Safe Deploy ZIP</a>
      </div>
      <div class="grid four-col">
        <div class="admin-stat"><div class="admin-stat-label">Score</div><div class="admin-stat-value">${Number(summary.score || 0)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Promote Blockers</div><div class="admin-stat-value">${Number(summary.promote_blockers || 0)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Drilldowns</div><div class="admin-stat-value">${Number(summary.drilldown_open || 0)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Schema Hints</div><div class="admin-stat-value">${Number(summary.schema_hint_open || 0)}</div></div>
      </div>
      <h2 id="promote-live">Final promote-live checklist</h2>
      ${table(['Item','Status','Required','Reason','Actions'], rows(data, 'checklist').map((row) => `<tr><td>${esc(row.checklist_label)}</td><td>${pill(row.checklist_status)}</td><td>${Number(row.required_to_promote || 0) ? 'Yes' : 'No'}</td><td>${esc(row.blocking_reason || '')}</td><td><button class="btn small" data-promote-pass="${esc(row.deployment_promote_live_checklist_id)}" type="button">Pass</button> <button class="btn small secondary" data-promote-block="${esc(row.deployment_promote_live_checklist_id)}" type="button">Block</button></td></tr>`), 'No checklist rows yet. Build the promote-live checklist first.')}
      <h2>Score history</h2>
      ${table(['Build','Score','Status','Blockers','Warnings','Scored'], rows(data, 'score_history').map((row) => `<tr><td>${esc(row.build_label)}</td><td><strong>${Number(row.score || 0)}/100</strong></td><td>${pill(row.score_status)}</td><td>${Number(row.blocker_count || 0) + Number(row.manifest_blocker_count || 0) + Number(row.smoke_blocker_count || 0) + Number(row.rollback_blocker_count || 0)}</td><td>${Number(row.warning_count || 0)}</td><td>${esc(row.scored_at)}</td></tr>`), 'No score rows yet. Calculate deploy score from Release Control.')}
      <h2>Blocker source drilldowns</h2>
      ${table(['Source','Severity','Label','Detail','Destination'], rows(data, 'drilldowns').map((row) => `<tr><td>${esc(row.source_kind)}</td><td>${pill(row.severity)}</td><td>${esc(row.row_label)}</td><td>${esc(row.row_detail)}</td><td>${row.destination_page ? `<a href="${esc(row.destination_page)}">open</a>` : '—'}</td></tr>`), 'No drilldown rows yet.')}
      <h2 id="manifest-diff">Exact manifest diff paths</h2>
      ${table(['Kind','Path','Status','Copy'], rows(data, 'diff_items').map((row) => `<tr><td>${pill(row.diff_kind)}</td><td><code>${esc(row.file_path)}</code></td><td>${pill(row.item_status)}</td><td>${copyButton(row.file_path || '')}</td></tr>`), 'No manifest diff path rows yet.')}
      <h2>Product QA confirmations</h2>
      ${table(['Queue','Blocker','Products','Approval','Confirm'], rows(data, 'qa_queue').map((row) => `<tr><td>${esc(row.product_qa_bulk_fix_queue_id)}</td><td><code>${esc(row.blocker_code)}</code></td><td>${Number(row.product_count || 0)}</td><td>${pill(row.approval_status)}</td><td><button class="btn small" data-confirm-qa="${esc(row.product_qa_bulk_fix_queue_id)}" type="button">Confirm apply</button></td></tr>`), 'No Product QA queue rows yet.')}
      <h2>Marketplace row validation</h2>
      ${table(['Channel','Product','Status','Blockers','Missing Fields'], rows(data, 'marketplace_rows').map((row) => `<tr><td>${esc(row.channel)}</td><td>${esc(row.product_id || '')}</td><td>${pill(row.validation_status)}</td><td>${Number(row.blocker_count || 0)}</td><td><code>${esc(row.missing_fields_json || '[]')}</code></td></tr>`), 'No row validation results yet. Use the marketplace export page validation button.')}
      <h2>Recall copy review and signature evidence</h2>
      ${table(['Batch','Customer','Status','Subject'], rows(data, 'recall_copy_reviews').map((row) => `<tr><td>${esc(row.batch_number)}</td><td>${esc(row.customer_email)}</td><td>${pill(row.review_status)}</td><td>${esc(row.subject_preview)}</td></tr>`), 'No recall copy review rows yet.')}
      ${table(['Batch','Signer','Status','Evidence'], rows(data, 'recall_signatures').map((row) => `<tr><td>${esc(row.batch_number)}</td><td>${esc(row.signer_name)}</td><td>${pill(row.attachment_status)}</td><td>${row.evidence_url ? `<a href="${esc(row.evidence_url)}">open</a>` : 'needs upload'}</td></tr>`), 'No signature evidence rows yet.')}
      <h2>Provider and R2 verification logs</h2>
      ${table(['Provider','Status','Algorithm','Notes'], rows(data, 'webhook_logs').map((row) => `<tr><td>${esc(row.provider)}</td><td>${pill(row.signature_status)}</td><td>${esc(row.algorithm)}</td><td>${esc(row.verification_notes)}</td></tr>`), 'No webhook verification logs yet.')}
      ${table(['Bucket','Signed URL','Put','Get','Delete','Notes'], rows(data, 'r2_signed').map((row) => `<tr><td>${esc(row.bucket_label)}</td><td>${pill(row.signed_url_status)}</td><td>${pill(row.put_status)}</td><td>${pill(row.get_status)}</td><td>${pill(row.delete_status)}</td><td>${esc(row.notes)}</td></tr>`), 'No R2 signed URL verification rows yet.')}
      <h2>Local SEO charts and internal-link map</h2>
      ${table(['Page','Query','Metric','Value','Period'], rows(data, 'seo_charts').map((row) => `<tr><td><code>${esc(row.page_path)}</code></td><td>${esc(row.query_text)}</td><td>${esc(row.metric_kind)}</td><td>${Number(row.metric_value || 0).toFixed(2)}</td><td>${esc(row.period_end || '')}</td></tr>`), 'No SEO chart points yet.')}
      ${table(['Source','Target','Anchor','Status','Score'], rows(data, 'link_edges').map((row) => `<tr><td><code>${esc(row.source_path)}</code></td><td><code>${esc(row.target_path)}</code></td><td>${esc(row.anchor_text)}</td><td>${pill(row.edge_status)}</td><td>${Number(row.score || 0)}</td></tr>`), 'No internal-link map edges yet.')}
      <h2>LocalBusiness drafts and structured-data hints</h2>
      ${table(['Draft','Business','URL','Status','Services'], rows(data, 'lb_drafts').map((row) => `<tr><td>${esc(row.local_business_schema_edit_draft_id)}</td><td>${esc(row.business_name)}</td><td><code>${esc(row.canonical_url)}</code></td><td>${pill(row.draft_status)}</td><td><code>${esc(row.service_types_json)}</code></td></tr>`), 'No LocalBusiness drafts yet.')}
      ${table(['Page','Schema','Severity','Hint'], rows(data, 'schema_hints').map((row) => `<tr><td><code>${esc(row.page_path)}</code></td><td>${esc(row.schema_type)}</td><td>${pill(row.hint_severity)}</td><td>${esc(row.hint_label)} — ${esc(row.hint_detail)}</td></tr>`), 'No schema hints yet.')}
      <h2>Mobile release cards</h2>
      ${table(['Card','Destination','Status'], rows(data, 'mobile_cards').map((row) => `<tr><td>${esc(row.card_label)}</td><td><a href="${esc(row.destination_page)}">open</a></td><td>${pill(row.card_status)}</td></tr>`), 'No mobile release cards yet.')}`;
    mount.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => post(button.getAttribute('data-action'))));
    mount.querySelectorAll('[data-promote-pass]').forEach((button) => button.addEventListener('click', () => post('mark_promote_item', { deployment_promote_live_checklist_id: Number(button.getAttribute('data-promote-pass') || 0), checklist_status: 'passed', resolved_note: 'Marked passed from Deploy Readiness.' })));
    mount.querySelectorAll('[data-promote-block]').forEach((button) => button.addEventListener('click', () => post('mark_promote_item', { deployment_promote_live_checklist_id: Number(button.getAttribute('data-promote-block') || 0), checklist_status: 'blocked', resolved_note: 'Marked blocked from Deploy Readiness.' })));
    mount.querySelectorAll('[data-confirm-qa]').forEach((button) => button.addEventListener('click', () => { if (confirm('Confirm this Product QA apply group as safe to run?')) post('confirm_qa_apply', { product_qa_bulk_fix_queue_id: Number(button.getAttribute('data-confirm-qa') || 0) }); }));
    mount.querySelectorAll('[data-copy-path]').forEach((button) => button.addEventListener('click', async () => { await navigator.clipboard?.writeText(button.getAttribute('data-copy-path') || ''); button.textContent = 'Copied'; }));
  }
  window.DDAuth.apiFetch('/api/admin/deploy-readiness').then(read).then(render).catch((error) => { mount.textContent = error.message || 'Deploy-readiness failed.'; });
});
