// Release 464 Update 2 — Operations "Today Needs Attention" with thresholds, safe recovery and retention review.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('runtimeIncidentsAdminMount');
  if (!mount || !window.DDAuth) return;
  function esc(value) { return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function pill(value) {
    const clean = String(value || 'unknown').toLowerCase();
    const cls = ['critical','error','fail','failed'].includes(clean) ? 'danger' : (['warning','warn','reviewing','archived_pending_approval'].includes(clean) ? 'warn' : (['resolved','ignored','approved','consumed','ok','verified'].includes(clean) ? 'ok' : 'muted'));
    return `<span class="admin-status-pill ${cls}">${esc(clean)}</span>`;
  }
  function message(text, error = false) {
    const el = document.getElementById('runtimeIncidentsMessage'); if (!el) return;
    el.textContent = text || ''; el.hidden = !text; el.setAttribute('role', error ? 'alert' : 'status');
  }
  function selectedIds() { return Array.from(document.querySelectorAll('[data-runtime-incident-check]:checked')).map((el)=>Number(el.value)).filter((id)=>Number.isInteger(id)&&id>0); }
  function filters() {
    const qs = new URLSearchParams({ group:'1', days:document.getElementById('runtimeIncidentDays')?.value || '7', limit:document.getElementById('runtimeIncidentLimit')?.value || '50' });
    const severity = document.getElementById('runtimeIncidentSeverity')?.value || '';
    const reviewStatus = document.getElementById('runtimeIncidentReviewStatus')?.value || 'open';
    if (severity) qs.set('severity', severity); if (reviewStatus) qs.set('review_status', reviewStatus); return qs;
  }
  async function post(body) {
    const response = await window.DDAuth.apiFetch('/api/admin/runtime-incidents', { method:'POST', body:JSON.stringify(body) });
    const data = await response.json().catch(()=>null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Operational action failed.');
    return data;
  }
  function render(data) {
    const summary = data.summary || {}; const attention = data.operational_attention || {};
    const breaches = Array.isArray(attention.breaches) ? attention.breaches : [];
    const groups = Array.isArray(data.groups) ? data.groups : [];
    const incidents = Array.isArray(data.incidents) ? data.incidents : [];
    const reviews = Array.isArray(data.retention_reviews) ? data.retention_reviews : [];
    const results = document.getElementById('runtimeIncidentsResults'); if (!results) return;
    results.innerHTML = `
      <section aria-labelledby="todayNeedsAttentionHeading"><h3 id="todayNeedsAttentionHeading">Today Needs Attention</h3>
        <div class="grid cols-4" style="gap:12px"><div class="card"><div class="small">Operational state</div><strong>${pill(attention.status || 'ok')}</strong></div><div class="card"><div class="small">Open incidents</div><strong>${esc(Number(summary.open_count || 0))}</strong></div><div class="card"><div class="small">Critical</div><strong>${esc(Number(summary.critical_count || 0))}</strong></div><div class="card"><div class="small">Threshold breaches</div><strong>${esc(breaches.length)}</strong></div></div>
        <div class="card" style="margin-top:10px"><strong>Attention thresholds</strong><ul class="small">${breaches.map((b)=>`<li>${pill(b.level)} ${esc(b.key)} — ${esc(b.count)}</li>`).join('') || '<li>No operational threshold is currently breached.</li>'}</ul></div>
      </section>
      <details open style="margin-top:12px"><summary><strong>Grouped recurring incidents</strong></summary><div class="admin-table-wrap" style="margin-top:10px"><table><thead><tr><th>Count</th><th>Severity</th><th>Scope</th><th>Code</th><th>Endpoint</th><th>Last seen</th></tr></thead><tbody>${groups.map((row)=>`<tr><td><strong>${esc(Number(row.incident_count||0))}</strong></td><td>${pill(row.severity)}</td><td>${esc(row.incident_scope)}</td><td>${esc(row.incident_code)}</td><td><code>${esc(row.endpoint_path)}</code></td><td>${esc(row.last_seen_at)}</td></tr>`).join('') || '<tr><td colspan="6">No matching grouped incidents.</td></tr>'}</tbody></table></div></details>
      <details open style="margin-top:12px"><summary><strong>Recent incident records and safe recovery</strong></summary>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin:10px 0"><button class="btn" type="button" data-runtime-action="reviewing">Mark reviewing</button><button class="btn" type="button" data-runtime-action="resolve">Resolve selected</button><button class="btn" type="button" data-runtime-action="ignore">Ignore selected</button><button class="btn" type="button" data-runtime-action="reopen">Reopen selected</button></div>
        <label class="small" style="display:block;margin-bottom:8px">Admin note <input class="input" id="runtimeIncidentAdminNote" aria-label="Runtime incident admin note" placeholder="Reason or corrective evidence"></label>
        <div class="admin-table-wrap"><table><thead><tr><th scope="col">Select</th><th scope="col">ID</th><th scope="col">Attention</th><th scope="col">Status</th><th scope="col">Scope / code</th><th scope="col">Message</th><th scope="col">Recovery</th></tr></thead><tbody>${incidents.map((row)=>`<tr><td><input type="checkbox" aria-label="Select incident ${esc(row.runtime_incident_id)}" data-runtime-incident-check value="${esc(row.runtime_incident_id)}"></td><td>${esc(row.runtime_incident_id)}</td><td>${pill(row.attention?.level || row.severity)}</td><td>${pill(row.review_status)}</td><td><strong>${esc(row.incident_scope)}</strong><br><span class="small">${esc(row.incident_code)}</span><br><code>${esc(row.request_method)} ${esc(row.endpoint_path)}</code></td><td>${esc(row.message)}<details><summary>details</summary><pre class="small" style="white-space:pre-wrap">${esc(row.details_json || '')}</pre></details></td><td>${row.recovery?.available ? `<button class="btn" type="button" data-safe-recheck="${esc(row.runtime_incident_id)}">Safe recheck</button><div class="small">${esc(row.recovery.kind)}</div>` : '<span class="small">Manual review only</span>'}</td></tr>`).join('') || '<tr><td colspan="7">No matching incidents.</td></tr>'}</tbody></table></div>
      </details>
      <details style="margin-top:12px"><summary><strong>Retention archive review</strong></summary><p class="small">Deletion is disabled until candidate rows are copied to the migration-owned archive, explicitly approved, and deleted by exact archived source ID.</p>
        <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap"><label class="small">Closed incidents older than <input class="input" id="runtimeIncidentCleanupDays" type="number" min="7" max="365" value="30" style="max-width:90px"> days</label><button class="btn" id="requestRuntimeRetentionButton" type="button">Archive & request review</button></div>
        <div class="admin-table-wrap" style="margin-top:10px"><table><thead><tr><th>ID</th><th>Status</th><th>Days</th><th>Candidate/archive</th><th>Archive reference</th><th>Action</th></tr></thead><tbody>${reviews.map((r)=>`<tr><td>${esc(r.operational_retention_review_id)}</td><td>${pill(r.review_status)}</td><td>${esc(r.older_than_days)}</td><td>${esc(r.candidate_count)} / ${esc(r.archive_item_count)}</td><td><code>${esc(r.archive_reference || '')}</code></td><td>${r.review_status === 'archived_pending_approval' ? `<button class="btn" type="button" data-retention-approve="${esc(r.operational_retention_review_id)}">Approve archive</button>` : ''}${r.review_status === 'approved' ? `<button class="btn" type="button" data-retention-cleanup="${esc(r.operational_retention_review_id)}">Delete archived rows</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="6">No retention reviews yet.</td></tr>'}</tbody></table></div>
      </details>
      <details style="margin-top:12px"><summary><strong>Orphaned storage diagnostics</strong></summary><p class="small">Read-only bounded R2 listing compared with active D1 references. No object bodies are read and deletion is unavailable.</p><button class="btn" id="runStorageOrphanDiagnostic" type="button">Run read-only storage scan</button><div id="storageOrphanDiagnosticResults" class="small" style="margin-top:10px"></div></details>`;
    results.querySelectorAll('[data-runtime-action]').forEach((button)=>button.addEventListener('click',()=>updateSelected(button.dataset.runtimeAction)));
    results.querySelectorAll('[data-safe-recheck]').forEach((button)=>button.addEventListener('click',()=>safeRecheck(Number(button.dataset.safeRecheck))));
    results.querySelectorAll('[data-retention-approve]').forEach((button)=>button.addEventListener('click',()=>retentionAction('approve_retention_review', Number(button.dataset.retentionApprove))));
    results.querySelectorAll('[data-retention-cleanup]').forEach((button)=>button.addEventListener('click',()=>retentionAction('cleanup_resolved', Number(button.dataset.retentionCleanup))));
    document.getElementById('requestRuntimeRetentionButton')?.addEventListener('click', requestRetention);
    document.getElementById('runStorageOrphanDiagnostic')?.addEventListener('click', runStorageDiagnostic);
  }
  async function load() {
    try { message('Loading operational attention...'); const response = await window.DDAuth.apiFetch(`/api/admin/runtime-incidents?${filters().toString()}`); const data = await response.json().catch(()=>null); if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to load operational attention.'); render(data); message('Operational attention loaded.'); }
    catch (error) { message(error.message || 'Failed to load operational attention.', true); }
  }
  async function updateSelected(action) { const ids = selectedIds(); if (!ids.length) return message('Select at least one incident first.', true); try { await post({ action, runtime_incident_ids:ids, admin_note:document.getElementById('runtimeIncidentAdminNote')?.value || '' }); message('Incident status updated.'); await load(); } catch (error) { message(error.message, true); } }
  async function safeRecheck(id) { try { message(`Running read-only recovery verification for incident ${id}...`); await post({ action:'safe_recheck', runtime_incident_id:id }); message(`Incident ${id} verified healthy and resolved.`); await load(); } catch (error) { message(error.message, true); await load(); } }
  async function runStorageDiagnostic() {
    const target = document.getElementById('storageOrphanDiagnosticResults');
    try { if (target) target.textContent = 'Scanning object metadata...'; const response = await window.DDAuth.apiFetch('/api/admin/storage-orphan-diagnostics?limit=50'); const data = await response.json().catch(()=>null); if (!response.ok || !data?.ok) throw new Error(data?.error || 'Storage diagnostic failed.'); const product = data.buckets?.product || {}; const caip = data.buckets?.caip || {}; if (target) target.innerHTML = `<strong>Product:</strong> scanned ${esc(product.scanned || 0)}, orphan candidates ${esc(product.orphan_candidate_count || 0)} · <strong>CAIP:</strong> scanned ${esc(caip.scanned || 0)}, orphan candidates ${esc(caip.orphan_candidate_count || 0)}.<br>Diagnostic only; no object was deleted.`; }
    catch (error) { if (target) target.textContent = error.message || 'Storage diagnostic failed.'; }
  }
  async function requestRetention() { const days = Math.max(7, Math.min(Number(document.getElementById('runtimeIncidentCleanupDays')?.value || 30),365)); try { const data = await post({ action:'request_retention_review', older_than_days:days, admin_note:'Release 464 Update 2 retention review.' }); message(`Archived ${data.archive_item_count || 0} row(s) into review ${data.review_id}. Approval is required before deletion.`); await load(); } catch (error) { message(error.message, true); } }
  async function retentionAction(action, reviewId) { try { const data = await post({ action, retention_review_id:reviewId, admin_note:'Release 464 Update 2 retention control.' }); message(action === 'cleanup_resolved' ? `Deleted ${data.deleted_count || 0} row(s) already preserved in approved archive ${reviewId}.` : `Archive review ${reviewId} approved.`); await load(); } catch (error) { message(error.message, true); } }
  mount.innerHTML = `<div class="card" style="margin-top:18px" aria-labelledby="runtimeIncidentsHeading"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h2 id="runtimeIncidentsHeading" style="margin-top:0">Today Needs Attention</h2><p class="small">Operational thresholds, recurring runtime incidents, audited safe recovery, and archive-before-delete retention control.</p></div><button class="btn primary" id="refreshRuntimeIncidentsButton" type="button">Refresh attention</button></div><div class="grid cols-4" style="gap:12px;margin-top:12px"><label class="small">Days <input class="input" id="runtimeIncidentDays" type="number" min="1" max="90" value="7"></label><label class="small">Limit <input class="input" id="runtimeIncidentLimit" type="number" min="1" max="100" value="50"></label><label class="small">Severity <select class="input" id="runtimeIncidentSeverity"><option value="">All</option><option>critical</option><option>error</option><option>warning</option><option>info</option></select></label><label class="small">Review status <select class="input" id="runtimeIncidentReviewStatus"><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="ignored">Ignored</option><option value="all">All</option></select></label></div><p id="runtimeIncidentsMessage" class="small" hidden aria-live="polite"></p><div id="runtimeIncidentsResults"></div></div>`;
  document.getElementById('refreshRuntimeIncidentsButton')?.addEventListener('click', load);
  ['runtimeIncidentDays','runtimeIncidentLimit','runtimeIncidentSeverity','runtimeIncidentReviewStatus'].forEach((id)=>document.getElementById(id)?.addEventListener('change',load));
  document.addEventListener('dd:admin-ready',(event)=>{ if (event?.detail?.ok) load(); });
  load();
});
