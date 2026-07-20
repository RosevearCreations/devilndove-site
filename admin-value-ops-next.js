// File: /public/js/admin-value-ops-next.js
// Build 192 follow-through panels for the existing Admin Command Center.

document.addEventListener('DOMContentLoaded', () => {
  const host = document.getElementById('valueOpsNextMount');
  if (!host || !window.DDAuth) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const pill = (value) => `<span class="status-pill status-${esc(String(value || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g,'-'))}">${esc(String(value || 'unknown').replace(/_/g,' '))}</span>`;
  const arr = (data, key) => Array.isArray(data?.[key]) ? data[key] : [];
  const table = (headers, body, empty='No rows yet.') => `<div class="table-wrap"><table class="admin-table"><thead><tr>${headers.map((h)=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${body || `<tr><td colspan="${headers.length}" class="small">${esc(empty)}</td></tr>`}</tbody></table></div>`;
  async function read(response) { const raw = await response.text(); let data={}; try { data = raw ? JSON.parse(raw) : {}; } catch {} if (!response.ok || data.ok === false) throw new Error(data.error || 'Build 192 request failed.'); return data; }
  async function loadData() { return read(await window.DDAuth.apiFetch('/api/admin/value-ops-next')); }
  async function post(payload) { return read(await window.DDAuth.apiFetch('/api/admin/value-ops-next', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })); }
  function notify(message, isError=false) { const node = document.getElementById('build192Message'); if (!node) return; node.textContent = message; node.className = `status-note ${isError ? 'danger' : 'success'}`; node.hidden = false; }
  function metrics(snapshot={}) {
    const cards = [
      ['Fee rows needing review', snapshot.fee_needs_review_count], ['Cost rows needing review', snapshot.cost_needs_review_count],
      ['R2 derivative checks open', snapshot.r2_derivative_open_count], ['Mobile uploads open', snapshot.mobile_upload_open_count],
      ['Duplicate candidates', snapshot.duplicate_candidate_count], ['SEO schedules open', snapshot.seo_schedule_open_count],
      ['GBP evidence rows', snapshot.gbp_evidence_count], ['Lighthouse schedules open', snapshot.performance_import_open_count],
      ['Legacy admin pages under review', snapshot.legacy_admin_review_count]
    ];
    return cards.map(([label,value])=>`<article class="value-metric-card"><span>${esc(label)}</span><strong>${Number(value || 0)}</strong></article>`).join('');
  }
  function envRows(env={}) {
    return Object.entries(env).map(([key,value]) => `<tr><td>${esc(key.replace(/_/g,' '))}</td><td>${pill(value === true ? 'configured' : value === false ? 'missing' : value)}</td></tr>`).join('');
  }
  function derivativeRows(data) { return arr(data,'derivative_checks').map((row)=>`<tr><td><code>${esc(row.check_key)}</code><div class="small">${esc(row.check_label)}</div></td><td>${pill(row.check_status)}</td><td>${esc(row.expected_binding||'')}</td><td><code>${esc(row.route_path||'')}</code></td><td>${esc(row.notes||'')}</td><td><button class="btn small" data-derivative-pass="${esc(row.check_key)}" type="button">Mark passed</button></td></tr>`).join(''); }
  function mediaRows(data) { return arr(data,'media_replacements').map((row)=>`<tr><td><code>${esc(row.route_path)}</code></td><td>${esc(row.desired_media_role)}</td><td><code>${esc(row.placeholder_asset_path||'')}</code></td><td>${pill(row.public_use_status)}</td><td>${pill(row.compression_status)}</td><td>${pill(row.alt_text_status)}</td><td>${pill(row.publication_status)}</td><td>${esc(row.approved_media_url||'')}</td></tr>`).join(''); }
  function scheduleRows(data) { return arr(data,'search_console_schedules').map((row)=>`<tr><td>${esc(row.schedule_label)}</td><td>${esc(row.expected_frequency)}</td><td>${esc(row.target_report)}</td><td>${esc(row.next_due_at||'')}</td><td>${pill(row.schedule_status)}</td><td>${esc(row.notes||'')}</td></tr>`).join(''); }
  function gbpRows(data) { return arr(data,'gbp_evidence').map((row)=>`<tr><td>${esc(row.observation_month)}</td><td>${esc(row.evidence_label)}</td><td><code>${esc(row.page_path||'')}</code></td><td>${esc(row.observed_value||'')}</td><td>${row.evidence_url ? `<a href="${esc(row.evidence_url)}" target="_blank" rel="noopener">Evidence</a>` : '—'}</td><td>${pill(row.observation_status)}</td></tr>`).join(''); }
  function duplicateRows(data) { return arr(data,'duplicate_candidates').map((row)=>`<tr><td>${esc(row.match_kind)}</td><td>${esc(row.match_value)}</td><td>${Number(row.confidence_score||0)}</td><td>${pill(row.merge_status)}</td><td><details><summary>Sources</summary><pre>${esc(row.source_summary_json||'{}')}</pre></details></td><td>${esc(row.notes||'')}</td></tr>`).join(''); }
  function uploadRows(data) { return arr(data,'upload_sessions').map((row)=>`<tr><td><code>${esc(row.upload_key)}</code></td><td>${esc(row.file_name||'')}</td><td>${Number(row.uploaded_bytes||0)} / ${Number(row.expected_bytes||0)}</td><td>${Number(row.chunk_count||0)}</td><td>${pill(row.upload_status)}</td><td>${pill(row.conflict_status)}</td><td>${esc(row.updated_at||'')}</td></tr>`).join(''); }
  function providerRows(data) { return arr(data,'provider_tests').map((row)=>`<tr><td>${esc(row.provider_key)}</td><td>${esc(row.test_kind)}</td><td>${pill(row.test_status)}</td><td>${esc(row.response_summary||'')}</td><td>${esc(row.tested_at||'')}</td></tr>`).join(''); }
  function lighthouseRows(data) { return arr(data,'lighthouse_schedules').map((row)=>`<tr><td><code>${esc(row.route_path)}</code></td><td>${esc(row.device_profile)}</td><td>${esc(row.next_due_at||'')}</td><td>${pill(row.schedule_status)}</td><td>${esc(row.notes||'')}</td></tr>`).join(''); }
  function legacyRows(data) { return arr(data,'legacy_admin_rows').map((row)=>`<tr><td><code>${esc(row.route_path)}</code><div class="small">${esc(row.route_label)}</div></td><td>${esc(row.command_center_area||'')}</td><td>${Number(row.usage_count_30d||0)}</td><td>${pill(row.consolidation_status)}</td><td><code>${esc(row.recommended_destination||'')}</code></td><td>${esc(row.notes||'')}</td></tr>`).join(''); }
  function render(data) {
    host.innerHTML = `<section class="card build192-header"><div class="value-card-head"><div><h2 style="margin-top:0">Build 192 — Operational Data Connection</h2><p>Connect the highest-value work: actual fees/costs, R2 derivatives, resumable mobile uploads, approved real-media replacement, Search Console schedules, GBP evidence, customer duplicate review, provider tests, Lighthouse imports, and low-use admin consolidation.</p></div><div class="build191-actions"><button class="btn" data-build192-action="seed_next_rows" type="button">Refresh Build 192 rows</button><button class="btn secondary" data-build192-action="refresh_duplicates" type="button">Find duplicate customers</button><button class="btn secondary" data-build192-action="save_snapshot" type="button">Save snapshot</button></div></div><p id="build192Message" class="status-note" hidden></p></section>
      <section class="value-metric-grid">${metrics(data.snapshot)}</section>
      <section class="card"><h2>Environment presence for live checks</h2>${table(['Setting','Status'], envRows(data.environment_presence), 'No environment status available.')}</section>
      <section class="card"><h2>R2 derivative worker readiness</h2>${table(['Check','Status','Binding','Route','Notes','Action'], derivativeRows(data), 'No derivative checks seeded yet.')}</section>
      <section class="card"><h2>Approved real-media replacement plan</h2>${table(['Route','Role','Placeholder','Public use','Compression','Alt text','Publication','Approved media'], mediaRows(data), 'No media replacement rows yet.')}</section>
      <section class="card"><h2>Scheduled Search Console imports</h2>${table(['Schedule','Frequency','Report','Next due','Status','Notes'], scheduleRows(data), 'No Search Console schedules yet.')}</section>
      <section class="card"><h2>Google Business Profile evidence</h2><form id="build192GbpForm" class="value-form-grid"><input name="observation_month" placeholder="YYYY-MM"><input name="evidence_key" placeholder="e.g. fresh_photos"><input name="evidence_label" placeholder="Evidence label"><input name="page_path" placeholder="/gallery/"><input name="observed_value" placeholder="What changed?"><input name="evidence_url" placeholder="Evidence URL"><button class="btn" type="submit">Record GBP evidence</button></form>${table(['Month','Evidence','Page','Observed value','URL','Status'], gbpRows(data), 'No GBP evidence recorded yet.')}</section>
      <section class="card"><h2>Customer duplicate / merge review</h2>${table(['Kind','Match value','Confidence','Status','Sources','Notes'], duplicateRows(data), 'No duplicate candidates found yet.')}</section>
      <section class="card"><h2>Mobile resumable upload sessions</h2><form id="build192UploadForm" class="value-form-grid"><input name="draft_key" placeholder="Draft key"><input name="file_name" placeholder="image.jpg"><input name="mime_type" placeholder="image/jpeg"><input name="expected_bytes" type="number" placeholder="Expected bytes"><input name="device_key" placeholder="Phone/device"><button class="btn" type="submit">Create upload session</button></form>${table(['Upload','File','Bytes','Chunks','Status','Conflict','Updated'], uploadRows(data), 'No resumable upload sessions yet.')}</section>
      <section class="card"><h2>Provider live-test records</h2><form id="build192ProviderForm" class="value-form-grid"><select name="provider_key"><option value="stripe">Stripe</option><option value="email">Email</option><option value="r2">R2</option><option value="cloudflare">Cloudflare</option></select><input name="test_kind" placeholder="webhook_signature"><select name="test_status"><option value="not_run">not run</option><option value="passed">passed</option><option value="failed">failed</option><option value="manual_review">manual review</option></select><input name="response_summary" placeholder="Result summary"><button class="btn" type="submit">Record test</button></form>${table(['Provider','Kind','Status','Summary','Tested'], providerRows(data), 'No provider tests recorded yet.')}</section>
      <section class="card"><h2>Lighthouse / PageSpeed import schedules</h2>${table(['Route','Device','Next due','Status','Notes'], lighthouseRows(data), 'No schedules yet.')}</section>
      <section class="card"><h2>Legacy admin consolidation review</h2>${table(['Route','Area','30-day use','Status','Destination','Notes'], legacyRows(data), 'No legacy admin rows yet.')}</section>`;
    bind(data);
  }
  function serialize(form) { return Object.fromEntries(new FormData(form).entries()); }
  function bind() {
    host.querySelectorAll('[data-build192-action]').forEach((button)=>button.addEventListener('click', async()=>{ try { const data = await post({ action:button.dataset.build192Action }); notify(data.message || 'Action completed.'); render(data); } catch(error) { notify(error.message, true); } }));
    host.querySelectorAll('[data-derivative-pass]').forEach((button)=>button.addEventListener('click', async()=>{ try { const data = await post({ action:'update_derivative_check', check_key:button.dataset.derivativePass, check_status:'passed', notes:'Manually marked passed from Command Center.' }); notify(data.message || 'Derivative check updated.'); render(data); } catch(error) { notify(error.message, true); } }));
    const gbp = document.getElementById('build192GbpForm'); if (gbp) gbp.addEventListener('submit', async(event)=>{ event.preventDefault(); try { const data = await post({ action:'record_gbp_evidence', ...serialize(gbp) }); notify(data.message || 'GBP evidence recorded.'); render(data); } catch(error) { notify(error.message, true); } });
    const upload = document.getElementById('build192UploadForm'); if (upload) upload.addEventListener('submit', async(event)=>{ event.preventDefault(); try { const data = await post({ action:'create_upload_session', ...serialize(upload) }); notify(data.message || 'Upload session created.'); render(data); } catch(error) { notify(error.message, true); } });
    const provider = document.getElementById('build192ProviderForm'); if (provider) provider.addEventListener('submit', async(event)=>{ event.preventDefault(); try { const data = await post({ action:'record_provider_test', ...serialize(provider) }); notify(data.message || 'Provider test recorded.'); render(data); } catch(error) { notify(error.message, true); } });
  }
  async function load() {
    host.innerHTML = '<section class="card"><p class="small">Loading Build 192 operational data connection…</p></section>';
    try { render(await loadData()); }
    catch(error) { host.innerHTML = `<section class="card"><p class="status-note danger">${esc(error.message || 'Could not load Build 192 panels.')}</p><p class="small">Confirm the Build 192 D1 migration and Pages Functions deployment.</p></section>`; }
  }
  load();
});
