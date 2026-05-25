// File: /public/js/admin-custom-requests.js
// Brief description: Operations admin panel for reviewing custom gift, engraving, and personalized work requests.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('customRequestsAdminMount');
  if (!mount || !window.DDAuth) return;

  function esc(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function money(cents) { const amount = Number(cents || 0) / 100; return amount > 0 ? amount.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' }) : '—'; }
  async function readJson(response) { const data = await response.json().catch(() => null); if (!response.ok || !data?.ok) throw new Error(data?.error || `Request failed (${response.status})`); return data; }
  function setMsg(text, isError = false) { const el = document.getElementById('customRequestsAdminMessage'); if (!el) return; el.textContent = text || ''; el.style.display = text ? 'block' : 'none'; el.style.color = isError ? '#b00020' : '#0a7a2f'; }
  function attachmentLinks(value) { try { const list = JSON.parse(value || '[]'); return Array.isArray(list) ? list.map((url) => `<a href="${esc(url)}" target="_blank" rel="noopener">reference</a>`).join(' ') : ''; } catch { return ''; } }

  function render(data = {}) {
    const rows = Array.isArray(data.requests) ? data.requests : [];
    const summary = data.summary || {};
    const result = document.getElementById('customRequestsAdminRows');
    if (!result) return;
    result._rows = rows;
    result.innerHTML = `
      <div class="release-sanity-summary" style="margin-top:12px"><div><strong>${esc(summary.total || 0)}</strong> request(s)</div><div class="small">Open ${esc(summary.open_count || 0)} • Quote needed ${esc(summary.quote_needed_count || 0)} • Accepted ${esc(summary.accepted_count || 0)}</div></div>
      <div class="admin-table-wrap" style="margin-top:12px"><table><thead><tr><th>Status</th><th>Request</th><th>Contact</th><th>Details</th><th>Review</th></tr></thead><tbody>
        ${rows.map((row) => `<tr>
          <td><strong>${esc(row.status || 'new')}</strong><br><span class="small">${esc(row.created_at || '')}</span></td>
          <td><strong>${esc(row.request_type || '')}</strong><br><span class="small">${esc(row.product_interest || '')}</span><br><span class="small">Budget ${money(row.budget_cents)} • Deadline ${esc(row.deadline_date || '—')}</span></td>
          <td>${esc(row.name || '')}<br><a href="mailto:${esc(row.email || '')}">${esc(row.email || '')}</a><br><span class="small">${esc(row.phone || '')}</span></td>
          <td><div class="small" style="max-width:420px;white-space:pre-wrap">${esc(row.message || '')}</div>${attachmentLinks(row.attachment_urls_json)}</td>
          <td><select data-custom-request-status="${esc(row.custom_request_id)}"><option value="new" ${row.status === 'new' ? 'selected' : ''}>New</option><option value="reviewing" ${row.status === 'reviewing' ? 'selected' : ''}>Reviewing</option><option value="quote_needed" ${row.status === 'quote_needed' ? 'selected' : ''}>Quote needed</option><option value="quoted" ${row.status === 'quoted' ? 'selected' : ''}>Quoted</option><option value="accepted" ${row.status === 'accepted' ? 'selected' : ''}>Accepted</option><option value="declined" ${row.status === 'declined' ? 'selected' : ''}>Declined</option><option value="archived" ${row.status === 'archived' ? 'selected' : ''}>Archived</option></select><textarea data-custom-request-notes="${esc(row.custom_request_id)}" rows="3" placeholder="Admin notes">${esc(row.admin_notes || '')}</textarea><button class="btn small" data-custom-request-save="${esc(row.custom_request_id)}">Save review</button></td>
        </tr>`).join('') || '<tr><td colspan="5">No custom requests yet.</td></tr>'}
      </tbody></table></div>`;
  }

  async function load() {
    try { setMsg('Loading custom requests...'); const data = await readJson(await window.DDAuth.apiFetch('/api/admin/custom-requests')); render(data); setMsg(`Loaded ${data.requests?.length || 0} custom request(s).`); }
    catch (error) { setMsg(error.message || 'Unable to load custom requests.', true); }
  }

  async function save(id) {
    const status = document.querySelector(`[data-custom-request-status="${CSS.escape(String(id))}"]`)?.value || 'reviewing';
    const admin_notes = document.querySelector(`[data-custom-request-notes="${CSS.escape(String(id))}"]`)?.value || '';
    try { const data = await readJson(await window.DDAuth.apiFetch('/api/admin/custom-requests', { method: 'POST', body: JSON.stringify({ custom_request_id: Number(id), status, admin_notes }) })); render(data); setMsg('Custom request review saved.'); }
    catch (error) { setMsg(error.message || 'Unable to save custom request.', true); }
  }

  mount.innerHTML = `<div class="card" style="margin-top:18px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h2 style="margin-top:0">Custom Requests</h2><p class="small" style="margin:0">Review engraving, personalized gift, and workshop-made commission requests before turning them into quotes or jobs.</p></div><button class="btn" type="button" id="customRequestsLoadButton">Refresh requests</button></div><div id="customRequestsAdminMessage" class="small" style="display:none;margin-top:10px"></div><div id="customRequestsAdminRows"></div></div>`;
  document.getElementById('customRequestsLoadButton')?.addEventListener('click', load);
  mount.addEventListener('click', (event) => { const button = event.target.closest('[data-custom-request-save]'); if (button) save(button.getAttribute('data-custom-request-save')); });
  load();
});
