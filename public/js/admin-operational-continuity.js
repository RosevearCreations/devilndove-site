// Build 240 — mobile-safe Operational Continuity UI with explicit degraded fallback.
(() => {
  const mount = document.getElementById('operationalContinuityMount');
  const fallback = document.getElementById('operationalStaticFallback');
  const messageNode = document.getElementById('operationalContinuityMessage');
  let state = null;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  const rows = (key) => Array.isArray(state?.[key]) ? state[key] : [];
  const pill = (value) => `<span class="status-pill status-${esc(String(value || 'unknown').replace(/[^a-z0-9]+/gi,'_').toLowerCase())}">${esc(value || 'unknown')}</span>`;
  const fmt = (value) => value ? new Date(value).toLocaleString('en-CA') : '—';
  const formData = (form) => Object.fromEntries(new FormData(form).entries());
  function message(text = '', kind = '') {
    if (!messageNode) return;
    messageNode.hidden = !text;
    messageNode.textContent = text;
    messageNode.className = `card small ${kind === 'error' ? 'is-error' : kind === 'success' ? 'is-success' : ''}`;
  }
  async function read(response) {
    const type = response.headers.get('content-type') || '';
    const data = type.includes('json') ? await response.json().catch(() => null) : null;
    if (!response.ok || !data?.ok) throw new Error(data?.error || `Operational request failed (${response.status}).`);
    return data;
  }
  async function api(body = null) {
    const response = await window.DDAuth.apiFetch('/api/admin/operational-continuity', body ? { method:'POST', body:JSON.stringify(body) } : undefined);
    return read(response);
  }
  function table(headings, body, empty = 'No rows yet.') {
    return `<div class="admin-table-wrap"><table><thead><tr>${headings.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${body || `<tr><td colspan="${headings.length}" class="small">${esc(empty)}</td></tr>`}</tbody></table></div>`;
  }
  function metrics() {
    const data = state?.metrics || {};
    const fields = [
      ['Workstreams',data.workstream_total],['Complete',data.workstream_complete],['Blocked',data.workstream_blocked],['Evidence open',data.evidence_open],['Reservations open',data.reservations_open],['Provider mismatches',data.provider_mismatches],['Notification failures',data.notification_failures],['Phone unsynced',data.mobile_unsynced],['Asset warnings',data.asset_failures],['Media roles missing',data.missing_media_roles],['Support open',data.support_open],['Close blocked',data.close_blocked],['Page audit failures',data.page_audit_failures]
    ];
    return `<div class="operational-metric-grid">${fields.map(([label,value]) => `<article class="card"><strong>${Number(value || 0)}</strong><span>${esc(label)}</span></article>`).join('')}</div>`;
  }
  function workstreams() {
    const body = rows('workstreams').map((row) => `<article class="card operational-workstream-card">
      <div class="operational-workstream-head"><div><p class="eyebrow">${esc(row.priority)} • ${esc(row.workstream_group)}</p><h3>${esc(row.workstream_title)}</h3></div>${pill(row.workstream_status)}</div>
      <p class="small">${esc(row.completion_rule)}</p>
      <form data-workstream-form class="operational-inline-form">
        <input type="hidden" name="action" value="update_workstream"/><input type="hidden" name="workstream_key" value="${esc(row.workstream_key)}"/>
        <label><span>Status</span><select class="input" name="workstream_status">${['planned','ready_to_test','in_progress','blocked','complete','not_applicable'].map((value) => `<option value="${value}" ${row.workstream_status===value?'selected':''}>${value}</option>`).join('')}</select></label>
        <label><span>Owner</span><input class="input" name="owner_name" value="${esc(row.owner_name || '')}" placeholder="Owner"/></label>
        <label><span>Due</span><input class="input" name="due_at" type="date" value="${esc(String(row.due_at || '').slice(0,10))}"/></label>
        <label class="operational-wide"><span>Evidence / blocker note</span><input class="input" name="evidence_summary" value="${esc(row.evidence_summary || row.blocker_text || '')}" placeholder="Safe evidence summary or blocker"/></label>
        <button class="btn" type="submit">Save</button>
      </form>
    </article>`).join('');
    return `<section class="operational-section"><div class="section-heading-row"><div><h2>Twenty operational workstreams</h2><p class="small">Two are code-complete in this build; the others are ready for controlled live or operator evidence.</p></div><span class="status-pill">${rows('workstreams').length} rows</span></div><div class="operational-workstream-grid">${body}</div></section>`;
  }
  function evidence() {
    const caseRows = rows('evidence_cases');
    const cards = caseRows.map((row) => `<article class="card operational-record-card"><div class="operational-workstream-head"><div><p class="eyebrow">${esc(row.case_type)} • ${esc(row.environment_name)}</p><h3>${esc(row.case_title)}</h3></div>${pill(row.case_status)}</div><p class="small"><strong>Expected:</strong> ${esc(row.expected_result || 'Not recorded')}</p><p class="small"><strong>Actual:</strong> ${esc(row.actual_result || 'Not recorded')}</p><p class="small">${esc(row.safe_reference || '')}</p><button class="btn" type="button" data-open-evidence="${Number(row.production_evidence_case_id || 0)}">Add result</button></article>`).join('');
    return `<section class="operational-section"><div class="section-heading-row"><div><h2>Production evidence cases</h2><p class="small">Use safe IDs, timestamps and URLs only. Never store credentials or full payment data.</p></div></div>
      <form id="createEvidenceCaseForm" class="card operational-form-grid"><input type="hidden" name="action" value="create_evidence_case"/><label><span>Case title</span><input class="input" name="case_title" required placeholder="Stripe duplicate webhook rehearsal"/></label><label><span>Type</span><select class="input" name="case_type"><option>login</option><option>autosave</option><option>payment_webhook</option><option>concurrency</option><option>refund</option><option>email</option><option>restore</option><option>packaging</option><option>controlled_opening</option></select></label><label><span>Workstream key</span><input class="input" name="related_workstream_key" placeholder="production_evidence_cases"/></label><label><span>Owner</span><input class="input" name="owner_name" placeholder="Owner"/></label><label class="operational-wide"><span>Expected result</span><textarea class="input" name="expected_result" rows="3" required></textarea></label><button class="btn primary" type="submit">Create evidence case</button></form>
      <div class="operational-record-grid">${cards || '<p class="small">No evidence cases yet.</p>'}</div></section>`;
  }
  function quickActions() {
    return `<section class="operational-section"><h2>Controlled quick actions</h2><div class="operational-tools-grid">
      <form class="card operational-tool-form" data-action-form><h3>Idempotency claim</h3><input type="hidden" name="action" value="claim_idempotency"/><label><span>Operation kind</span><input class="input" name="operation_kind" required value="payment_webhook"/></label><label><span>Unique key</span><input class="input" name="idempotency_key" required placeholder="provider:event-id"/></label><button class="btn" type="submit">Claim once</button></form>
      <form class="card operational-tool-form" data-action-form><h3>Packaging reservation</h3><input type="hidden" name="action" value="create_packaging_reservation"/><label><span>Packaging project ID</span><input class="input" name="packaging_project_id" type="number" min="1" required/></label><label><span>Finished units</span><input class="input" name="quantity_finished_units" type="number" min=".001" step=".001" value="1"/></label><label><span>Idempotency key</span><input class="input" name="idempotency_key" placeholder="Optional; generated when blank"/></label><button class="btn" type="submit">Reserve BOM</button></form>
      <form class="card operational-tool-form" data-action-form><h3>Formula authority link</h3><input type="hidden" name="action" value="save_formula_link"/><label><span>Packaging project ID</span><input class="input" name="packaging_project_id" type="number" min="1" required/></label><label><span>Formula source key</span><input class="input" name="formula_source_key" required placeholder="soap-formula-glacial-purple"/></label><label><span>Version</span><input class="input" name="formula_version" placeholder="v1"/></label><label><span>Checksum</span><input class="input" name="source_checksum" placeholder="SHA-256"/></label><label><span>Status</span><select class="input" name="verification_status"><option>needs_review</option><option>verified</option><option>blocked</option><option>superseded</option></select></label><button class="btn" type="submit">Save formula link</button></form>
      <form class="card operational-tool-form" data-action-form><h3>Prepress result</h3><input type="hidden" name="action" value="save_prepress_check"/><label><span>Packaging project ID</span><input class="input" name="packaging_project_id" type="number" min="1" required/></label><label><span>Text fit</span><select class="input" name="text_fit_status"><option>passed</option><option>needs_review</option><option>failed</option></select></label><label><span>Region overflow</span><select class="input" name="region_overflow_status"><option>passed</option><option>needs_review</option><option>overflow</option></select></label><label><span>QR destination</span><select class="input" name="qr_destination_status"><option>not_applicable</option><option>passed</option><option>failed</option></select></label><label><span>Fonts</span><select class="input" name="font_embedding_status"><option>passed</option><option>not_checked</option><option>failed</option></select></label><button class="btn" type="submit">Record prepress</button></form>
      <form class="card operational-tool-form" data-action-form><h3>Provider reconciliation</h3><input type="hidden" name="action" value="save_provider_result"/><label><span>Provider</span><input class="input" name="provider_name" required placeholder="Meta / Stripe / email"/></label><label><span>Action</span><input class="input" name="provider_action" required placeholder="publish_product"/></label><label><span>Provider reference ID</span><input class="input" name="provider_reference_id"/></label><label><span>Result URL</span><input class="input" name="provider_result_url" type="url"/></label><label><span>Status</span><select class="input" name="reconciliation_status"><option>needs_review</option><option>matched</option><option>mismatch</option><option>failed</option><option>not_found</option></select></label><button class="btn" type="submit">Record provider result</button></form>
      <form class="card operational-tool-form" data-action-form><h3>Phone evidence draft</h3><input type="hidden" name="action" value="save_mobile_draft"/><label><span>Evidence kind</span><input class="input" name="evidence_kind" required value="photo"/></label><label><span>Draft key</span><input class="input" name="draft_key" placeholder="Optional recovery key"/></label><label><span>Privacy</span><select class="input" name="privacy_review_status"><option>needs_review</option><option>approved</option><option>blocked</option></select></label><label><span>Unsynced reason</span><input class="input" name="unsynced_reason" placeholder="Weak connection"/></label><button class="btn" type="submit">Save recovery draft</button></form>
      <form class="card operational-tool-form" data-action-form><h3>Support follow-up</h3><input type="hidden" name="action" value="save_support_interaction"/><label><span>Private reference</span><input class="input" name="customer_reference" placeholder="Order # or initials"/></label><label><span>Summary</span><textarea class="input" name="summary_text" required rows="2"></textarea></label><label><span>Next action</span><input class="input" name="next_action_text"/></label><label><span>Follow-up</span><input class="input" name="follow_up_at" type="datetime-local"/></label><button class="btn" type="submit">Add support item</button></form>
      <form class="card operational-tool-form" data-action-form><h3>Accounting close</h3><input type="hidden" name="action" value="seed_accounting_close"/><label><span>Period</span><input class="input" name="period_key" type="month"/></label><button class="btn" type="submit">Create eight-item close list</button></form>
      <form class="card operational-tool-form" data-action-form><h3>Local SEO observation</h3><input type="hidden" name="action" value="save_seo_observation"/><label><span>Page path</span><input class="input" name="page_path" required value="/"/></label><label><span>Location</span><input class="input" name="target_location" value="Southern Ontario"/></label><label><span>Target query</span><input class="input" name="target_query" placeholder="handmade jewelry Ontario"/></label><label><span>Impressions</span><input class="input" name="search_console_impressions" type="number" step=".01" value="0"/></label><label><span>Clicks</span><input class="input" name="search_console_clicks" type="number" step=".01" value="0"/></label><label><span>Average position</span><input class="input" name="average_position" type="number" step=".01"/></label><button class="btn" type="submit">Save observation</button></form>
      <form class="card operational-tool-form" data-action-form><h3>Product media roles</h3><input type="hidden" name="action" value="generate_media_roles"/><p class="small">Adds missing feature, detail, scale and packaging requirement rows to active/draft products without copying product facts.</p><button class="btn" type="submit">Generate missing role rows</button></form>
    </div></section>`;
  }
  function operationalTables() {
    const reservations = rows('reservations').map((r) => `<tr><td>${esc(r.reservation_key)}</td><td>${r.packaging_project_id}</td><td>${pill(r.reservation_status)}</td><td>${Number(r.quantity_finished_units||0)}</td><td>${fmt(r.created_at)}</td><td>${['reserved','consumed'].includes(r.reservation_status)?`<button class="btn small" data-reservation-action="released" data-reservation-id="${r.packaging_inventory_reservation_id}">Release</button> <button class="btn small" data-reservation-action="reversed" data-reservation-id="${r.packaging_inventory_reservation_id}">Reverse</button>`:'—'}</td></tr>`).join('');
    const provider = rows('provider_rows').map((r) => `<tr><td>${esc(r.provider_name)}</td><td>${esc(r.provider_action)}</td><td>${pill(r.reconciliation_status)}</td><td>${esc(r.provider_reference_id||'')}</td><td>${r.provider_result_url?`<a href="${esc(r.provider_result_url)}" target="_blank" rel="noopener">open</a>`:'—'}</td></tr>`).join('');
    const notifications = rows('notification_attempts').map((r) => `<tr><td>${r.notification_outbox_id||'—'}</td><td>${esc(r.provider_name||'')}</td><td>${pill(r.attempt_status)}</td><td>${esc(r.provider_message_id||'')}</td><td>${fmt(r.attempted_at)}</td></tr>`).join('');
    const support = rows('support_rows').map((r) => `<tr><td>${pill(r.interaction_status)}</td><td>${esc(r.interaction_channel)}</td><td>${esc(r.summary_text)}</td><td>${esc(r.next_action_text||'')}</td><td>${fmt(r.follow_up_at)}</td></tr>`).join('');
    const closeRows = rows('close_rows').map((r) => `<tr><td>${esc(r.period_key)}</td><td>${esc(r.checklist_label)}</td><td>${pill(r.checklist_status)}</td><td>${esc(r.owner_name||'')}</td><td>${esc(r.blocker_text||'')}</td></tr>`).join('');
    const seo = rows('seo_observations').map((r) => `<tr><td>${esc(r.snapshot_date)}</td><td><code>${esc(r.page_path)}</code></td><td>${esc(r.target_location)}</td><td>${esc(r.target_query||'')}</td><td>${Number(r.search_console_impressions||0)}</td><td>${Number(r.search_console_clicks||0)}</td><td>${r.average_position??'—'}</td></tr>`).join('');
    const audits = rows('page_audits').map((r) => `<tr><td><code>${esc(r.page_path)}</code></td><td>${pill(r.audit_status)}</td><td>${Number(r.h1_count||0)}</td><td>${Number(r.missing_alt_count||0)}</td><td>${Number(r.missing_asset_count||0)}</td><td>${esc(r.mobile_overflow_status)}</td></tr>`).join('');
    return `<section class="operational-section"><h2>Operational queues and evidence summaries</h2>
      <details class="card" open><summary>Packaging reservations</summary>${table(['Key','Project','Status','Units','Created','Action'],reservations,'No packaging reservations yet.')}</details>
      <details class="card"><summary>Provider reconciliation</summary>${table(['Provider','Action','Status','Provider ID','URL'],provider,'No provider results yet.')}</details>
      <details class="card"><summary>Notification attempts</summary>${table(['Outbox','Provider','Status','Provider ID','Attempted'],notifications,'No notification delivery attempts yet.')}</details>
      <details class="card"><summary>Customer support follow-up</summary>${table(['Status','Channel','Summary','Next action','Follow-up'],support,'No support interactions yet.')}</details>
      <details class="card"><summary>Accounting close</summary>${table(['Period','Item','Status','Owner','Blocker'],closeRows,'No close checklist rows yet.')}</details>
      <details class="card"><summary>Local SEO observations</summary>${table(['Date','Page','Location','Query','Impressions','Clicks','Position'],seo,'No SEO observation snapshots yet.')}</details>
      <details class="card"><summary>Public-page audits</summary>${table(['Page','Status','H1','Missing alt','Missing assets','Mobile overflow'],audits,'Run and import the Build 240 public-page audit.')}</details>
    </section>`;
  }
  function mobileCards() {
    return `<section class="operational-section"><h2>Phone operations cards</h2><div class="operational-mobile-card-grid">${rows('mobile_cards').map((row) => `<a class="card" href="${esc(row.destination_path)}"><strong>${esc(row.card_title)}</strong><span class="small">${esc(row.card_group)} • ${esc(row.badge_query||'')}</span></a>`).join('')}</div></section>`;
  }
  function render() {
    fallback.hidden = true;
    mount.innerHTML = `${metrics()}${workstreams()}${evidence()}${quickActions()}${operationalTables()}${mobileCards()}`;
    bind();
  }
  async function post(body, success = 'Saved.') {
    message('Saving…');
    try { state = await api(body); render(); message(success,'success'); }
    catch (error) { message(error.message,'error'); }
  }
  function bind() {
    document.querySelectorAll('[data-workstream-form],[data-action-form],#createEvidenceCaseForm').forEach((form) => form.addEventListener('submit', (event) => { event.preventDefault(); const data=formData(form); for(const key of ['packaging_project_id','quantity_finished_units','search_console_impressions','search_console_clicks','average_position']) if(data[key] !== '') data[key]=Number(data[key]); post(data); }));
    document.querySelectorAll('[data-reservation-action]').forEach((button) => button.addEventListener('click', () => post({ action:'change_packaging_reservation', packaging_inventory_reservation_id:Number(button.dataset.reservationId||0), reservation_status:button.dataset.reservationAction, reason_text:`${button.dataset.reservationAction} from Operational Continuity` })));
    document.querySelectorAll('[data-open-evidence]').forEach((button) => button.addEventListener('click', () => {
      const actual = prompt('Record the actual result. Do not include secrets or full payment/customer data.'); if(actual == null)return;
      const status = prompt('Case status: running, passed, failed, blocked or cancelled','passed') || 'running';
      const reference = prompt('Safe evidence reference (ID, timestamp or URL only):','') || '';
      post({ action:'append_evidence_event', production_evidence_case_id:Number(button.dataset.openEvidence||0), event_type:'operator_result', event_status:'recorded', actual_text:actual, case_status:status, safe_reference:reference },'Evidence result recorded.');
    }));
  }
  async function load() {
    message('');
    fallback.hidden = true;
    try { state = await api(); render(); }
    catch (error) {
      mount.innerHTML = '';
      fallback.hidden = false;
      message(error.message || 'Operational Continuity failed to load. No success is being inferred.','error');
    }
  }
  document.getElementById('refreshOperationalContinuity')?.addEventListener('click',load);
  document.getElementById('retryOperationalContinuity')?.addEventListener('click',load);
  load();
})();
