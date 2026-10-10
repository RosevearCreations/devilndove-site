// BUILD370_CURRENT_CLIENT: Search Console Real Export & Fresh Discovery Intake X; real-only evidence, 30-day explicit report-date freshness, human review required.
// BUILD364_CURRENT_CLIENT: Search Console Real Export & Fresh Discovery Intake IX; real-only evidence, 30-day explicit report-date freshness, human review required.
// BUILD358_CURRENT_CLIENT: Search Console Real Export & Fresh Discovery Intake VIII; real-only evidence and explicit report-date freshness.
// Historical compatibility: Build 346 freshness
// BUILD352_CURRENT_CLIENT: Search Console Real Export & Fresh Discovery Intake VII; explicit report-date-only freshness.
// Historical regression token retained: Build 340 freshness
// BUILD346_CURRENT_CLIENT: Search Console Real Export & Fresh Discovery Intake VI; explicit report-date-only freshness.
// Historical regression token retained: Build 328 freshness
// File: /public/js/admin-search-console-import.js
// Brief description: Operations panel for importing, filtering, reverting, and turning Search Console CSV exports into SEO action items.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('searchConsoleImportAdminMount');
  if (!mount || !window.DDAuth) return;

  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const pct = (value) => `${(Number(value || 0) * 100).toFixed(2)}%`;
  const num = (value) => Number(value || 0).toLocaleString();
  const setMsg = (text, error = false) => {
    const el = document.getElementById('searchConsoleImportMessage');
    if (!el) return;
    el.style.display = text ? 'block' : 'none';
    el.style.color = error ? '#b00020' : '#14532d';
    el.textContent = text || '';
  };
  async function readJson(response) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Search Console request failed.');
    return data;
  }
  function currentFilters() {
    return {
      page_url: document.getElementById('searchConsoleFilterPage')?.value || '',
      query_text: document.getElementById('searchConsoleFilterQuery')?.value || '',
      country: document.getElementById('searchConsoleFilterCountry')?.value || '',
      device: document.getElementById('searchConsoleFilterDevice')?.value || '',
      date_from: document.getElementById('searchConsoleFilterDateFrom')?.value || '',
      date_to: document.getElementById('searchConsoleFilterDateTo')?.value || '',
      min_impressions: document.getElementById('searchConsoleFilterMinImpressions')?.value || '',
      position_from: document.getElementById('searchConsoleFilterPositionFrom')?.value || '',
      position_to: document.getElementById('searchConsoleFilterPositionTo')?.value || '',
      limit: document.getElementById('searchConsoleFilterLimit')?.value || '20',
    };
  }
  function queryString(filters = currentFilters()) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null && String(value).trim() !== '') params.set(key, String(value).trim());
    });
    return params.toString();
  }
  function renderStatusButton(action) {
    const applied = action.action_status === 'applied' || Number(action.applied_override_id || 0) > 0;
    const supported = Number(action.current_evidence_supported || 0) === 1;
    const apply = applied
      ? '<span class="admin-status-pill ok">applied</span>'
      : supported
        ? `<button class="btn small primary" type="button" data-seo-action-apply="${esc(action.action_key)}">Review & apply</button>`
        : '<span class="admin-status-pill">no current evidence</span>';
    return `<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn small" type="button" data-seo-action-status="${esc(action.action_key)}">Status</button>${apply}</div>`;
  }
  function render(data) {
    const totals = data.totals || {};
    const rows = Array.isArray(data.top_pages) ? data.top_pages : [];
    const opps = Array.isArray(data.opportunity_queries) ? data.opportunity_queries : [];
    const batches = Array.isArray(data.batches) ? data.batches : [];
    const actions = Array.isArray(data.seo_actions) ? data.seo_actions : [];
    const acceptance = data.operator_acceptance || {};
    const freshness = data.freshness || {};
    const acceptanceState = String(acceptance.state || 'UNKNOWN');
    const freshnessState = String(freshness.state || 'UNKNOWN');
    const evidenceMessage = acceptanceState === 'EVIDENCE_PENDING_NO_REAL_EXPORT'
      ? 'No real Search Console export is staged. Leave discovery evidence pending until we import a genuine operator export.'
      : acceptanceState === 'REAL_OPERATOR_EVIDENCE_PRESENT'
        ? 'Real Search Console evidence is staged with batch and audit traceability.'
        : acceptanceState === 'SCHEMA_BLOCKED'
          ? 'Canonical Search Console schema is not ready; import remains blocked.'
          : 'Search Console intake traceability needs operator review before interpreting discovery evidence.';
    document.getElementById('searchConsoleImportResults').innerHTML = `
      <div class="card" style="margin-top:12px">
        <div class="small"><strong>Operator intake:</strong> ${esc(acceptanceState)}</div>
        <p class="small" style="margin:8px 0 0">${esc(evidenceMessage)}</p>
        <p class="small" style="margin:8px 0 0">Current batches: <strong>${num(acceptance.import_batches||0)}</strong> • live staged rows: <strong>${num(acceptance.live_rows||0)}</strong> • import audits: <strong>${num(acceptance.import_audits||0)}</strong> • revert audits: <strong>${num(acceptance.revert_audits||0)}</strong>. The safe batch revert remains the explicit <code>delete_batch</code> action.</p>
        <p class="small" style="margin:8px 0 0"><strong>Build 370 freshness:</strong> ${esc(freshnessState)} • window <strong>${num(freshness.freshness_window_days||30)} days</strong> • recent rows <strong>${num(freshness.recent_rows||0)}</strong> • latest report <strong>${esc(freshness.latest_report_date||'none')}</strong>${freshness.latest_report_age_days == null ? '' : ` • age <strong>${esc(freshness.latest_report_age_days)} days</strong>`}. Stale evidence is non-actionable for queue/apply decisions.</p>
      </div>
      <div class="grid cols-4 media-diagnostic-metrics" style="margin-top:12px">
        <div class="card"><div class="small">Rows</div><strong>${num(totals.row_count || 0)}</strong></div>
        <div class="card"><div class="small">Clicks</div><strong>${num(totals.clicks || 0)}</strong></div>
        <div class="card"><div class="small">Impressions</div><strong>${num(totals.impressions || 0)}</strong></div>
        <div class="card"><div class="small">Avg position</div><strong>${Number(totals.average_position || 0).toFixed(2)}</strong></div>
      </div>
      <h3>Top pages</h3>
      <div class="admin-table-wrap"><table><thead><tr><th>Page</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Avg position</th></tr></thead><tbody>
        ${rows.map((row) => `<tr><td><code>${esc(row.page_url)}</code></td><td>${num(row.clicks)}</td><td>${num(row.impressions)}</td><td>${pct(row.ctr)}</td><td>${esc(row.average_position)}</td></tr>`).join('') || '<tr><td colspan="5">No Search Console rows match the current filters.</td></tr>'}
      </tbody></table></div>
      <h3>Evidence-backed SEO opportunities</h3>
      <p class="small">Only real Search Console page/query pairs within the current 30-day freshness window, with impressions and average positions around 4-20, qualify for the human SEO review queue. Public telemetry alone cannot create a query-level SEO action.</p>
      <div class="admin-table-wrap"><table><thead><tr><th>Query</th><th>Page</th><th>Clicks</th><th>Impressions</th><th>Avg position</th></tr></thead><tbody>
        ${opps.map((row) => `<tr><td>${esc(row.query_text)}</td><td><code>${esc(row.page_url)}</code></td><td>${num(row.clicks)}</td><td>${num(row.impressions)}</td><td>${esc(row.average_position)}</td></tr>`).join('') || '<tr><td colspan="5">No opportunity rows match the current filters.</td></tr>'}
      </tbody></table></div>
      <h3>SEO review queue</h3>
      <p class="small">Evidence-backed review rows contain the real query/page metrics only. Build 316 generates no title, meta description, H1, or internal-link wording. Manual SEO wording is entered only during Review & apply, and current evidence is rechecked before the override can be saved.</p>
      <div class="admin-table-wrap"><table><thead><tr><th>Status</th><th>Priority</th><th>Query/Page</th><th>Current evidence</th><th>Review note</th><th>Action</th></tr></thead><tbody>
        ${actions.map((action) => `<tr><td><strong>${esc(action.action_status)}</strong><div class="small">${action.applied_at ? `applied ${esc(action.applied_at)}` : ''}</div></td><td>${esc(action.priority_score)}</td><td><div>${esc(action.query_text)}</div><code>${esc(action.page_url)}</code></td><td><div>${num(action.evidence_impressions||0)} impressions • ${num(action.evidence_clicks||0)} clicks</div><div class="small">avg position ${esc(action.evidence_position||0)} • ${Number(action.current_evidence_supported||0)===1?'supported now':'not currently supported'}</div></td><td><div class="small">${esc(action.notes||'Evidence-backed review; human copy required.')}</div></td><td>${renderStatusButton(action)}</td></tr>`).join('') || '<tr><td colspan="6">No evidence-backed SEO review actions yet.</td></tr>'}
      </tbody></table></div>
      <details style="margin-top:12px" open><summary>Recent imports and safe revert</summary><div class="admin-table-wrap"><table><thead><tr><th>Batch</th><th>File</th><th>Rows</th><th>Live rows</th><th>Imported</th><th>Action</th></tr></thead><tbody>${batches.map((row) => `<tr><td><code>${esc(row.import_batch_key)}</code></td><td>${esc(row.source_file)}</td><td>${num(row.row_count)}</td><td>${num(row.live_rows)}</td><td>${esc(row.imported_at)}</td><td><button class="btn small danger" type="button" data-delete-search-console-batch="${esc(row.import_batch_key)}">Delete/revert batch</button></td></tr>`).join('') || '<tr><td colspan="6">No imports yet.</td></tr>'}</tbody></table></div></details>`;
  }
  async function load() {
    try {
      setMsg('Loading Search Console summary...');
      const qs = queryString();
      const data = await readJson(await window.DDAuth.apiFetch(`/api/admin/search-console-import${qs ? `?${qs}` : ''}`));
      render(data);
      setMsg('Search Console summary loaded.');
    } catch (error) { setMsg(error.message || 'Unable to load Search Console summary.', true); }
  }
  async function upload() {
    try {
      const file = document.getElementById('searchConsoleCsvFile')?.files?.[0];
      const csvText = document.getElementById('searchConsoleCsvText')?.value || '';
      const siteProperty = document.getElementById('searchConsoleSiteProperty')?.value || '';
      const reportDate = document.getElementById('searchConsoleReportDate')?.value || '';
      const notes = document.getElementById('searchConsoleNotes')?.value || '';
      const realExportConfirmed = document.getElementById('searchConsoleRealExportConfirm')?.checked === true;
      if (!realExportConfirmed) throw new Error('Confirm this is a real Google Search Console export before importing.');
      if (!file && !csvText.trim()) throw new Error('Choose a CSV file or paste CSV rows first.');
      setMsg('Importing Search Console CSV...');
      let response;
      if (file) {
        const form = new FormData();
        form.set('file', file);
        form.set('site_property', siteProperty);
        form.set('report_date', reportDate);
        form.set('notes', notes);
        form.set('confirm_real_export', 'true');
        response = await window.DDAuth.apiFetch('/api/admin/search-console-import', { method: 'POST', body: form });
      } else {
        response = await window.DDAuth.apiFetch('/api/admin/search-console-import', { method: 'POST', body: JSON.stringify({ csv_text: csvText, site_property: siteProperty, report_date: reportDate, notes, confirm_real_export: realExportConfirmed, filters: currentFilters() }) });
      }
      const data = await readJson(response);
      render(data);
      setMsg(data.message || 'Search Console import complete.');
    } catch (error) { setMsg(error.message || 'Search Console import failed.', true); }
  }
  async function deleteBatch(importBatchKey) {
    if (!importBatchKey) return;
    const confirmation = window.prompt(`Type DELETE to remove Search Console batch ${importBatchKey}. This removes staged rows for that batch only.`);
    if (confirmation !== 'DELETE') return;
    try {
      setMsg('Deleting Search Console import batch...');
      const response = await window.DDAuth.apiFetch('/api/admin/search-console-import', { method: 'POST', body: JSON.stringify({ action: 'delete_batch', import_batch_key: importBatchKey, filters: currentFilters() }) });
      const data = await readJson(response);
      render(data);
      setMsg(data.message || 'Batch deleted.');
    } catch (error) { setMsg(error.message || 'Unable to delete Search Console batch.', true); }
  }
  async function generateRecommendations() {
    try {
      setMsg('Queuing evidence-backed SEO reviews from current real Search Console rows...');
      const response = await window.DDAuth.apiFetch('/api/admin/search-console-import', { method: 'POST', body: JSON.stringify({ action: 'generate_recommendations', filters: currentFilters() }) });
      const data = await readJson(response);
      render(data);
      setMsg(data.message || 'Evidence-backed review queue updated.');
    } catch (error) { setMsg(error.message || 'Unable to update evidence-backed SEO review queue.', true); }
  }
  async function updateActionStatus(actionKey) {
    const next = window.prompt('Set action status to open, in_progress, done, ignored, or applied:', 'in_progress');
    if (!next) return;
    try {
      setMsg('Updating SEO action status...');
      const response = await window.DDAuth.apiFetch('/api/admin/search-console-import', { method: 'POST', body: JSON.stringify({ action: 'update_action_status', action_key: actionKey, action_status: next, filters: currentFilters() }) });
      const data = await readJson(response);
      render(data);
      setMsg(data.message || 'SEO action status updated.');
    } catch (error) { setMsg(error.message || 'Unable to update SEO action.', true); }
  }
  async function applySeoAction(actionKey) {
    if (!actionKey) return;
    const title = window.prompt('Reviewed title (leave blank to keep unchanged):', '');
    if (title === null) return;
    const metaDescription = window.prompt('Reviewed meta description (leave blank to keep unchanged):', '');
    if (metaDescription === null) return;
    const h1Suggestion = window.prompt('Reviewed H1 suggestion (leave blank to keep unchanged):', '');
    if (h1Suggestion === null) return;
    const internalLinkNote = window.prompt('Reviewed internal-link note (leave blank to keep unchanged):', '');
    if (internalLinkNote === null) return;
    if (![title, metaDescription, h1Suggestion, internalLinkNote].some((value) => String(value || '').trim())) {
      setMsg('Enter at least one piece of manual SEO wording before Apply.', true);
      return;
    }
    const note = window.prompt('Optional review note:', 'Human-reviewed from current Search Console evidence.');
    if (note === null) return;
    try {
      setMsg('Rechecking current evidence and applying human-reviewed SEO override...');
      const response = await window.DDAuth.apiFetch('/api/admin/search-console-import', { method: 'POST', body: JSON.stringify({
        action: 'apply_seo_action', action_key: actionKey, title, meta_description: metaDescription,
        h1_suggestion: h1Suggestion, internal_link_note: internalLinkNote, notes: note, filters: currentFilters()
      }) });
      const data = await readJson(response);
      render(data);
      setMsg(data.message || 'Human-reviewed SEO override applied.');
    } catch (error) { setMsg(error.message || 'Unable to apply SEO override.', true); }
  }

  mount.innerHTML = `
    <div class="card search-console-admin-panel" style="margin-top:18px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><h2 style="margin-top:0">Search Console CSV Import</h2><p class="small" style="margin:8px 0 0 0">Private staging for real Google Search Console exports. Build 370 keeps explicit real-export confirmation, measures a 30-day freshness window from the real report date only, and blocks stale evidence from queue/apply decisions. Import/creation time never substitutes for a report date. If the export has no Date column, enter its report end date explicitly.</p></div>
        <button class="btn" type="button" id="searchConsoleLoadButton">Refresh summary</button>
      </div>
      <div class="search-console-import-grid" style="margin-top:12px">
        <label>CSV file<input type="file" id="searchConsoleCsvFile" accept=".csv,text/csv"></label>
        <label>Site property<input id="searchConsoleSiteProperty" placeholder="https://devilndove.com/"></label>
        <label>Report end date / fallback date<input id="searchConsoleReportDate" type="date"><span class="small">Required when the CSV has no Date column.</span></label>
        <label>Notes<input id="searchConsoleNotes" placeholder="Example: May performance export"></label>
      </div>
      <label style="display:block;margin-top:10px">Or paste CSV rows<textarea id="searchConsoleCsvText" rows="5" placeholder="Page,Query,Clicks,Impressions,CTR,Position"></textarea></label>
      <label style="display:flex;gap:8px;align-items:flex-start;margin-top:10px"><input type="checkbox" id="searchConsoleRealExportConfirm"> <span>I confirm this CSV is a real Google Search Console Performance export, not generated or placeholder data.</span></label>\n      <div class="dd-product-draft-media-actions" style="margin-top:10px"><button class="btn primary" type="button" id="searchConsoleUploadButton">Import confirmed real Search Console CSV</button></div>
      <details class="search-console-filter-panel" style="margin-top:12px" open>
        <summary>Filters and review controls</summary>
        <div class="search-console-import-grid" style="margin-top:12px">
          <label>Page contains<input id="searchConsoleFilterPage" placeholder="/shop/ or product slug"></label>
          <label>Query contains<input id="searchConsoleFilterQuery" placeholder="polymer clay earrings"></label>
          <label>Country<input id="searchConsoleFilterCountry" placeholder="can"></label>
          <label>Device<input id="searchConsoleFilterDevice" placeholder="mobile / desktop"></label>
          <label>Date from<input id="searchConsoleFilterDateFrom" type="date"></label>
          <label>Date to<input id="searchConsoleFilterDateTo" type="date"></label>
          <label>Min impressions<input id="searchConsoleFilterMinImpressions" type="number" min="0" placeholder="10"></label>
          <label>Position from<input id="searchConsoleFilterPositionFrom" type="number" min="0" step="0.1" placeholder="4"></label>
          <label>Position to<input id="searchConsoleFilterPositionTo" type="number" min="0" step="0.1" placeholder="20"></label>
          <label>Rows to show<input id="searchConsoleFilterLimit" type="number" min="5" max="100" value="20"></label>
        </div>
        <div class="dd-product-draft-media-actions" style="margin-top:10px">
          <button class="btn" type="button" id="searchConsoleApplyFiltersButton">Apply filters</button>
          <button class="btn" type="button" id="searchConsoleClearFiltersButton">Clear filters</button>
          <button class="btn primary" type="button" id="searchConsoleGenerateRecommendationsButton">Queue evidence-backed reviews</button>
        </div>
      </details>
      <div id="searchConsoleImportMessage" class="small" style="display:none;margin-top:10px"></div>
      <div id="searchConsoleImportResults"></div>
    </div>`;
  document.getElementById('searchConsoleLoadButton')?.addEventListener('click', load);
  document.getElementById('searchConsoleUploadButton')?.addEventListener('click', upload);
  document.getElementById('searchConsoleApplyFiltersButton')?.addEventListener('click', load);
  document.getElementById('searchConsoleClearFiltersButton')?.addEventListener('click', () => {
    ['searchConsoleFilterPage', 'searchConsoleFilterQuery', 'searchConsoleFilterCountry', 'searchConsoleFilterDevice', 'searchConsoleFilterDateFrom', 'searchConsoleFilterDateTo', 'searchConsoleFilterMinImpressions', 'searchConsoleFilterPositionFrom', 'searchConsoleFilterPositionTo'].forEach((id) => { const el = document.getElementById(id); if (el) el.value = ''; });
    const limit = document.getElementById('searchConsoleFilterLimit');
    if (limit) limit.value = '20';
    load();
  });
  document.getElementById('searchConsoleGenerateRecommendationsButton')?.addEventListener('click', generateRecommendations);
  mount.addEventListener('click', (event) => {
    const deleteButton = event.target.closest('[data-delete-search-console-batch]');
    if (deleteButton) deleteBatch(deleteButton.getAttribute('data-delete-search-console-batch'));
    const statusButton = event.target.closest('[data-seo-action-status]');
    if (statusButton) updateActionStatus(statusButton.getAttribute('data-seo-action-status'));
    const applyButton = event.target.closest('[data-seo-action-apply]');
    if (applyButton) applySeoAction(applyButton.getAttribute('data-seo-action-apply'));
  });
  load();
});
