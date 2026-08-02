// File: /public/js/admin-go-live-execution.js
// Brief description: Renders Build 180 go-live execution controls and review rows.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('goLiveExecutionMount');
  if (!mount || !window.DDAuth?.apiFetch) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const rows = (data, key) => Array.isArray(data?.[key]) ? data[key] : [];
  const pill = (value) => `<span class="status-pill ${esc(String(value || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}">${esc(value || 'unknown')}</span>`;
  const table = (headers, bodyRows, empty) => bodyRows.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${bodyRows.join('')}</tbody></table></div>` : `<p class="small">${esc(empty || 'No rows yet.')}</p>`;
  async function post(action, extra = {}) {
    const response = await window.DDAuth.apiFetch('/api/admin/go-live-execution', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...extra }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.error || 'Action failed.');
    render(data);
  }
  function render(data) {
    const summary = data.summary || {};
    mount.innerHTML = `
      <div class="status-note ${summary.latest_promote_button === 'enabled' ? 'success' : 'warning'}">${esc(data.build_label || 'Build 180')} promote button: ${pill(summary.latest_promote_button || 'not_checked')} • QA runs: ${Number(summary.qa_apply_runs || 0)} • Marketplace blocks: ${Number(summary.marketplace_blocks || 0)} • Recall endpoint blocks: ${Number(summary.recall_endpoint_blocks || 0)}</div>
      <div class="admin-actions build180-actions" style="display:flex;flex-wrap:wrap;gap:10px;margin:14px 0">
        <button class="btn" data-action="seed_all" type="button">Refresh all Build 180 controls</button>
        <button class="btn secondary" data-action="render_seo_charts" type="button">Render SEO charts</button>
        <button class="btn secondary" data-action="bake_local_business_from_d1" type="button">Prepare LocalBusiness D1 bake</button>
        <button class="btn secondary" data-action="seed_provider_webhooks" type="button">Seed webhook verification rows</button>
        <button class="btn secondary" data-action="seed_r2_route_test" type="button">Seed signed-download route test</button>
        <button class="btn secondary" data-action="check_recall_gates" type="button">Check recall endpoint gates</button>
        <button class="btn secondary" data-action="log_accountant_zip" type="button">Log accountant ZIP link</button>
        <button class="btn secondary" data-action="seed_schema_excerpts" type="button">Refresh structured-data excerpts</button>
        <button class="btn secondary" data-action="run_manifest_drawer" type="button">Run manifest drawer filter</button>
        <button class="btn secondary" data-action="export_score_trend" type="button">Export score trend Markdown</button>
        <button class="btn secondary" data-action="update_promote_gate_state" type="button">Recheck Promote button state</button>
        <button class="btn secondary" data-action="schedule_incident_watcher" type="button">Queue incident watcher</button>
      </div>
      <div class="card"><h2 style="margin-top:0">Safe Product QA applies</h2><form id="safeApplyForm" class="admin-inline-form"><label>Approved queue ID <input name="queue_id" inputmode="numeric" placeholder="Product QA queue id"></label><label>Mode <select name="run_mode"><option value="preview">Preview only</option><option value="apply">Apply approved fix</option></select></label><button class="btn danger" type="submit">Run safe catalog fix</button></form>${table(['Queue','Blocker','Mode','Status','Affected','Skipped','When'], rows(data, 'qa_runs').map((row) => `<tr><td>${Number(row.product_qa_bulk_fix_queue_id || 0)}</td><td><code>${esc(row.blocker_code)}</code></td><td>${esc(row.run_mode)}</td><td>${pill(row.apply_status)}</td><td>${Number(row.affected_count || 0)}</td><td>${Number(row.skipped_count || 0)}</td><td>${esc(row.created_at)}</td></tr>`), 'No safe apply runs yet.')}</div>
      <div class="card"><h2 style="margin-top:0">Local SEO charts and graph clicks</h2>${table(['Page','Metric','Points','Min','Max','Preview'], rows(data, 'chart_runs').map((row) => `<tr><td><code>${esc(row.page_path)}</code></td><td>${esc(row.metric_kind)}</td><td>${Number(row.point_count || 0)}</td><td>${Number(row.min_value || 0)}</td><td>${Number(row.max_value || 0)}</td><td>${row.svg_markup || ''}</td></tr>`), 'No chart renders yet.')}${table(['Source','Target','Filter','Status','Notes'], rows(data, 'graph_interactions').map((row) => `<tr><td><code>${esc(row.source_path)}</code></td><td><code>${esc(row.target_path)}</code></td><td>${esc(row.filter_kind)}</td><td>${pill(row.interaction_status)}</td><td>${esc(row.notes)}</td></tr>`), 'No graph interactions yet.')}</div>
      <div class="card"><h2 style="margin-top:0">Recall, marketplace, and accountant gates</h2>${table(['Batch','Legacy lock','Release gate','Endpoint','Notes'], rows(data, 'recall_gates').map((row) => `<tr><td>${esc(row.batch_number)}</td><td>${pill(row.legacy_lock_status)}</td><td>${pill(row.release_gate_status)}</td><td>${pill(row.endpoint_gate_status)}</td><td>${esc(row.notes)}</td></tr>`), 'No recall endpoint gate checks yet.')}${table(['Channel','Gate','Hard blockers','Blocked','Notes'], rows(data, 'marketplace_blocks').map((row) => `<tr><td>${esc(row.channel)}</td><td>${pill(row.gate_status)}</td><td>${Number(row.hard_blocker_count || 0)}</td><td>${Number(row.blocked || 0) ? 'yes' : 'no'}</td><td>${esc(row.notes)}</td></tr>`), 'No marketplace download block events yet.')}${table(['Period','Bytes','Files','Status','SHA'], rows(data, 'accountant_logs').map((row) => `<tr><td>${esc(row.period_month)}</td><td>${Number(row.total_bytes || 0).toLocaleString()}</td><td>${Number(row.evidence_file_count || 0)}</td><td>${pill(row.log_status)}</td><td><code>${esc(String(row.zip_sha256 || '').slice(0, 20))}</code></td></tr>`), 'No accountant ZIP endpoint logs yet.')}</div>
      <div class="card"><h2 style="margin-top:0">Provider, R2, LocalBusiness, and structured data</h2>${table(['Provider','Endpoint','Signature','Status','Notes'], rows(data, 'webhook_runs').map((row) => `<tr><td>${esc(row.provider)}</td><td><code>${esc(row.endpoint_path)}</code></td><td>${esc(row.signature_header)}</td><td>${pill(row.verification_status)}</td><td>${esc(row.notes)}</td></tr>`), 'No provider verification runs yet.')}${table(['Route','Object','Token','Download','Expiry','Notes'], rows(data, 'r2_route_tests').map((row) => `<tr><td><code>${esc(row.route_path)}</code></td><td><code>${esc(row.object_key)}</code></td><td>${pill(row.token_status)}</td><td>${pill(row.download_status)}</td><td>${pill(row.expiry_status)}</td><td>${esc(row.notes)}</td></tr>`), 'No signed-download route tests yet.')}${table(['Output','Status','Schema excerpt'], rows(data, 'lb_bakes').map((row) => `<tr><td><code>${esc(row.output_path)}</code></td><td>${pill(row.bake_status)}</td><td><code>${esc(String(row.schema_json || '').slice(0, 180))}</code></td></tr>`), 'No LocalBusiness D1 bake rows yet.')}${table(['Page','Type','Status','Issues','Excerpt'], rows(data, 'schema_excerpts').map((row) => `<tr><td><code>${esc(row.page_path)}</code></td><td>${esc(row.schema_type)}</td><td>${pill(row.excerpt_status)}</td><td>${Number(row.issue_count || 0)}</td><td><code>${esc(String(row.jsonld_excerpt || '').slice(0, 160))}</code></td></tr>`), 'No structured-data excerpts yet.')}</div>
      <div class="card"><h2 style="margin-top:0">Promotion state, release rows, and watchers</h2>${table(['Build','Button','Score','Blockers','Notes'], rows(data, 'gate_states').map((row) => `<tr><td>${esc(row.build_label)}</td><td>${pill(row.promote_button_status)}</td><td>${Number(row.readiness_score || 0)}</td><td>${Number(row.blocker_count || 0)}</td><td>${esc(row.notes)}</td></tr>`), 'No promote UI gate state yet.')}${table(['Filter','Contains','Kind','Matches','Status'], rows(data, 'manifest_drawers').map((row) => `<tr><td>${esc(row.filter_key)}</td><td>${esc(row.path_contains)}</td><td>${esc(row.diff_kind)}</td><td>${Number(row.matched_count || 0)}</td><td>${pill(row.drawer_status)}</td></tr>`), 'No manifest drawer runs yet.')}${table(['Build','Points','Latest','Status'], rows(data, 'trend_exports').map((row) => `<tr><td>${esc(row.build_label)}</td><td>${Number(row.point_count || 0)}</td><td>${Number(row.latest_score || 0)}</td><td>${pill(row.export_status)}</td></tr>`), 'No score trend exports yet.')}${table(['Build','Window','Status','Trigger'], rows(data, 'watcher_schedules').map((row) => `<tr><td>${esc(row.build_label)}</td><td>${Number(row.watch_window_minutes || 0)} min</td><td>${pill(row.run_status)}</td><td><code>${esc(row.triggered_from_path)}</code></td></tr>`), 'No watcher schedule rows yet.')}</div>`;
    mount.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', async () => { try { await post(button.getAttribute('data-action')); } catch (error) { alert(error.message || 'Action failed.'); } }));
    mount.querySelector('#safeApplyForm')?.addEventListener('submit', async (event) => { event.preventDefault(); const form = event.currentTarget; try { await post('apply_safe_catalog_fixes', { product_qa_bulk_fix_queue_id: Number(form.queue_id.value || 0), run_mode: form.run_mode.value }); } catch (error) { alert(error.message || 'Safe apply failed.'); } });
  }
  async function load() {
    try {
      const response = await window.DDAuth.apiFetch('/api/admin/go-live-execution');
      const raw = await response.text();
      let data = null; try { data = raw ? JSON.parse(raw) : null; } catch { throw new Error('Go-Live Execution returned an invalid response.'); }
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Go-Live Execution could not load.');
      render(data);
    } catch (error) {
      mount.innerHTML = `<section class="card startup-degraded"><h2>Go-Live controls are unavailable</h2><p>${esc(error.message || 'Go-Live Execution failed.')}</p><p>No gate is being treated as passed. Return to the blocker register or another standalone stage while the API is corrected.</p><div class="admin-actions"><button class="btn" id="goLiveRetry" type="button">Retry</button> <a class="btn" href="/admin/startup-readiness/">Startup blockers</a> <a class="btn" href="/admin/prelaunch/">Process map</a></div></section>`;
      document.getElementById('goLiveRetry')?.addEventListener('click', load);
    }
  }
  load();
});
