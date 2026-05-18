// File: /public/js/admin-search-console-import.js
// Brief description: Operations panel for importing and reviewing Search Console CSV exports.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('searchConsoleImportAdminMount');
  if (!mount || !window.DDAuth) return;
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const pct = (value) => `${(Number(value || 0) * 100).toFixed(2)}%`;
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
  function render(data) {
    const totals = data.totals || {};
    const rows = Array.isArray(data.top_pages) ? data.top_pages : [];
    const opps = Array.isArray(data.opportunity_queries) ? data.opportunity_queries : [];
    const batches = Array.isArray(data.batches) ? data.batches : [];
    document.getElementById('searchConsoleImportResults').innerHTML = `
      <div class="grid cols-4 media-diagnostic-metrics" style="margin-top:12px">
        <div class="card"><div class="small">Rows</div><strong>${esc(totals.row_count || 0)}</strong></div>
        <div class="card"><div class="small">Clicks</div><strong>${esc(totals.clicks || 0)}</strong></div>
        <div class="card"><div class="small">Impressions</div><strong>${esc(totals.impressions || 0)}</strong></div>
        <div class="card"><div class="small">Avg position</div><strong>${Number(totals.average_position || 0).toFixed(2)}</strong></div>
      </div>
      <h3>Top pages</h3>
      <div class="admin-table-wrap"><table><thead><tr><th>Page</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Avg position</th></tr></thead><tbody>
        ${rows.map((row) => `<tr><td><code>${esc(row.page_url)}</code></td><td>${esc(row.clicks)}</td><td>${esc(row.impressions)}</td><td>${pct(row.ctr)}</td><td>${esc(row.average_position)}</td></tr>`).join('') || '<tr><td colspan="5">No Search Console rows imported yet.</td></tr>'}
      </tbody></table></div>
      <h3>SEO opportunities</h3>
      <p class="small">Queries with impressions and average positions around 4-20 are good candidates for title/meta/internal-link refinement.</p>
      <div class="admin-table-wrap"><table><thead><tr><th>Query</th><th>Page</th><th>Clicks</th><th>Impressions</th><th>Avg position</th></tr></thead><tbody>
        ${opps.map((row) => `<tr><td>${esc(row.query_text)}</td><td><code>${esc(row.page_url)}</code></td><td>${esc(row.clicks)}</td><td>${esc(row.impressions)}</td><td>${esc(row.average_position)}</td></tr>`).join('') || '<tr><td colspan="5">No opportunity rows yet.</td></tr>'}
      </tbody></table></div>
      <details style="margin-top:12px"><summary>Recent imports</summary><div class="admin-table-wrap"><table><thead><tr><th>Batch</th><th>File</th><th>Rows</th><th>Imported</th></tr></thead><tbody>${batches.map((row) => `<tr><td><code>${esc(row.import_batch_key)}</code></td><td>${esc(row.source_file)}</td><td>${esc(row.row_count)}</td><td>${esc(row.imported_at)}</td></tr>`).join('') || '<tr><td colspan="4">No imports yet.</td></tr>'}</tbody></table></div></details>`;
  }
  async function load() {
    try {
      setMsg('Loading Search Console summary...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/search-console-import'));
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
      if (!file && !csvText.trim()) throw new Error('Choose a CSV file or paste CSV rows first.');
      setMsg('Importing Search Console CSV...');
      let response;
      if (file) {
        const form = new FormData();
        form.set('file', file);
        form.set('site_property', siteProperty);
        form.set('report_date', reportDate);
        form.set('notes', notes);
        response = await window.DDAuth.apiFetch('/api/admin/search-console-import', { method: 'POST', body: form });
      } else {
        response = await window.DDAuth.apiFetch('/api/admin/search-console-import', { method: 'POST', body: JSON.stringify({ csv_text: csvText, site_property: siteProperty, report_date: reportDate, notes }) });
      }
      const data = await readJson(response);
      render(data);
      setMsg(data.message || 'Search Console import complete.');
    } catch (error) { setMsg(error.message || 'Search Console import failed.', true); }
  }
  mount.innerHTML = `
    <div class="card search-console-admin-panel" style="margin-top:18px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><h2 style="margin-top:0">Search Console CSV Import</h2><p class="small" style="margin:8px 0 0 0">Private staging for Search Console exports. Use this to find pages/queries that need clearer titles, meta descriptions, headings, and internal links.</p></div>
        <button class="btn" type="button" id="searchConsoleLoadButton">Refresh summary</button>
      </div>
      <div class="search-console-import-grid" style="margin-top:12px">
        <label>CSV file<input type="file" id="searchConsoleCsvFile" accept=".csv,text/csv"></label>
        <label>Site property<input id="searchConsoleSiteProperty" placeholder="https://devilndove.com/"></label>
        <label>Fallback report date<input id="searchConsoleReportDate" type="date"></label>
        <label>Notes<input id="searchConsoleNotes" placeholder="Example: May performance export"></label>
      </div>
      <label style="display:block;margin-top:10px">Or paste CSV rows<textarea id="searchConsoleCsvText" rows="5" placeholder="Page,Query,Clicks,Impressions,CTR,Position"></textarea></label>
      <div class="dd-product-draft-media-actions" style="margin-top:10px"><button class="btn primary" type="button" id="searchConsoleUploadButton">Import Search Console CSV</button></div>
      <div id="searchConsoleImportMessage" class="small" style="display:none;margin-top:10px"></div>
      <div id="searchConsoleImportResults"></div>
    </div>`;
  document.getElementById('searchConsoleLoadButton')?.addEventListener('click', load);
  document.getElementById('searchConsoleUploadButton')?.addEventListener('click', upload);
  load();
});
