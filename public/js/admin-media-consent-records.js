// File: /public/js/admin-media-consent-records.js
// Brief description: Operations panel for tracking customer/job/product media consent before public/social use.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('mediaConsentRecordsAdminMount');
  if (!mount || !window.DDAuth) return;
  const esc = (value) => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  async function readJson(response) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || `Request failed (${response.status})`);
    return data;
  }
  function setMsg(message, isError = false) {
    const el = document.getElementById('mediaConsentMessage');
    if (!el) return;
    el.textContent = message || '';
    el.style.display = message ? 'block' : 'none';
    el.className = `small status-note ${isError ? 'error' : ''}`;
  }
  function render(data) {
    const rows = Array.isArray(data.records) ? data.records : [];
    const summary = data.summary || {};
    const out = document.getElementById('mediaConsentResults');
    if (!out) return;
    out.innerHTML = `
      <div class="competitive-summary-grid">
        <div class="metric-card"><strong>${esc(summary.total || 0)}</strong><span>Total</span></div>
        <div class="metric-card"><strong>${esc(summary.granted || 0)}</strong><span>Granted</span></div>
        <div class="metric-card"><strong>${esc(summary.requested || 0)}</strong><span>Requested</span></div>
        <div class="metric-card"><strong>${esc(summary.blocked || 0)}</strong><span>Blocked</span></div>
        <div class="metric-card"><strong>${esc(summary.public_allowed || 0)}</strong><span>Public OK</span></div>
        <div class="metric-card"><strong>${esc(summary.social_allowed || 0)}</strong><span>Social OK</span></div>
      </div>
      <div class="admin-table-wrap" style="margin-top:12px"><table>
        <thead><tr><th>ID</th><th>Subject/source</th><th>Media</th><th>Status</th><th>Scope</th><th>Allowed</th><th>Notes</th></tr></thead>
        <tbody>${rows.map((row) => `<tr>
          <td>${esc(row.consent_record_id || '')}</td>
          <td><strong>${esc(row.subject_label || '')}</strong><div class="small">${esc(row.source_type || '')}${row.source_id ? ` #${esc(row.source_id)}` : ''}</div></td>
          <td>${row.media_url ? `<a href="${esc(row.media_url)}" target="_blank" rel="noopener">Open media</a>` : '<span class="small">No URL</span>'}</td>
          <td>${esc(row.consent_status || 'unknown')}</td>
          <td>${esc(row.consent_scope || 'internal_only')}</td>
          <td class="small">Public: ${Number(row.public_use_allowed || 0) === 1 ? 'yes' : 'no'}<br/>Social: ${Number(row.social_use_allowed || 0) === 1 ? 'yes' : 'no'}</td>
          <td class="small">${esc(row.privacy_notes || '')}</td>
        </tr>`).join('') || '<tr><td colspan="7">No consent records yet.</td></tr>'}</tbody>
      </table></div>`;
  }
  async function load() {
    try { setMsg('Loading media consent records...'); const data = await readJson(await window.DDAuth.apiFetch('/api/admin/media-consent-records')); render(data); setMsg('Media consent records loaded.'); }
    catch (error) { setMsg(error.message || 'Failed to load media consent records.', true); }
  }
  async function save() {
    const payload = {
      action: 'create',
      subject_label: document.getElementById('mediaConsentSubject')?.value || '',
      source_type: document.getElementById('mediaConsentSourceType')?.value || 'product',
      source_id: document.getElementById('mediaConsentSourceId')?.value || '',
      media_url: document.getElementById('mediaConsentUrl')?.value || '',
      consent_status: document.getElementById('mediaConsentStatus')?.value || 'unknown',
      consent_scope: document.getElementById('mediaConsentScope')?.value || 'internal_only',
      public_use_allowed: document.getElementById('mediaConsentPublicOk')?.checked ? 1 : 0,
      social_use_allowed: document.getElementById('mediaConsentSocialOk')?.checked ? 1 : 0,
      privacy_notes: document.getElementById('mediaConsentNotes')?.value || ''
    };
    try { setMsg('Saving media consent record...'); const data = await readJson(await window.DDAuth.apiFetch('/api/admin/media-consent-records', { method:'POST', body: JSON.stringify(payload) })); render(data); setMsg('Media consent record saved.'); }
    catch (error) { setMsg(error.message || 'Failed to save media consent record.', true); }
  }
  mount.innerHTML = `
    <div class="card media-consent-admin-panel" style="margin-top:18px">
      <h2 style="margin-top:0">Media Consent Records</h2>
      <p class="small">Private registry for customer/job/product media permission. Use this before public product pages or social posts include customer-identifying, job, visitor, or private background media.</p>
      <div class="grid cols-3" style="gap:10px">
        <label><span class="small">Subject / label</span><input class="input" id="mediaConsentSubject" placeholder="Customer initials, product, job, or public-safe label"/></label>
        <label><span class="small">Source type</span><select class="input" id="mediaConsentSourceType"><option value="product">product</option><option value="social_post">social_post</option><option value="job">job</option><option value="creation">creation</option><option value="general">general</option></select></label>
        <label><span class="small">Source ID</span><input class="input" id="mediaConsentSourceId" placeholder="Product ID, queue ID, job ID, etc."/></label>
      </div>
      <label style="display:block;margin-top:10px"><span class="small">Media URL</span><input class="input" id="mediaConsentUrl" type="url" placeholder="https://assets.devilndove.com/..."/></label>
      <div class="grid cols-4" style="gap:10px;margin-top:10px">
        <label><span class="small">Consent status</span><select class="input" id="mediaConsentStatus"><option value="unknown">unknown</option><option value="requested">requested</option><option value="granted">granted</option><option value="revoked">revoked</option><option value="blocked">blocked</option><option value="not_required">not required/product only</option></select></label>
        <label><span class="small">Scope</span><select class="input" id="mediaConsentScope"><option value="internal_only">internal only</option><option value="product_page">product page</option><option value="social_post">social post</option><option value="website_gallery">website gallery</option><option value="all_public">all public</option></select></label>
        <label style="display:flex;align-items:end;gap:8px"><input id="mediaConsentPublicOk" type="checkbox"/> Public use OK</label>
        <label style="display:flex;align-items:end;gap:8px"><input id="mediaConsentSocialOk" type="checkbox"/> Social use OK</label>
      </div>
      <label style="display:block;margin-top:10px"><span class="small">Privacy notes</span><textarea class="input" id="mediaConsentNotes" rows="3" placeholder="What was approved, removed, or blocked?"></textarea></label>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px"><button class="btn primary" id="saveMediaConsentRecordButton" type="button">Save consent record</button><button class="btn" id="loadMediaConsentRecordsButton" type="button">Refresh</button></div>
      <div id="mediaConsentMessage" class="small status-note" style="display:none;margin-top:10px"></div>
      <div id="mediaConsentResults" style="margin-top:12px"></div>
    </div>`;
  mount.querySelector('#saveMediaConsentRecordButton')?.addEventListener('click', save);
  mount.querySelector('#loadMediaConsentRecordsButton')?.addEventListener('click', load);
  load();
});
