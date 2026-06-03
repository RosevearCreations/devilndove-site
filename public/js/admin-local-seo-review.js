// File: /public/js/admin-local-seo-review.js
// Brief description: Admin UI for local SEO landing-page review queue.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('localSeoReviewAdminMount');
  if (!mount || !window.DDAuth) return;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  async function read(res) { const data = await res.json().catch(() => null); if (!res.ok || !data?.ok) throw new Error(data?.error || 'SEO review request failed.'); return data; }
  function rowHtml(row) { return `<tr><td><a href="${esc(row.page_path)}" target="_blank" rel="noopener">${esc(row.page_label || row.page_path)}</a><div class="small">${esc(row.page_path)}</div></td><td><input data-seo-field="target_keyword" data-id="${esc(row.page_path)}" value="${esc(row.target_keyword || '')}"><div class="small">${esc(row.target_locality || '')}</div></td><td><select data-seo-field="review_status" data-id="${esc(row.page_path)}"><option value="needs_review" ${row.review_status==='needs_review'?'selected':''}>needs review</option><option value="in_progress" ${row.review_status==='in_progress'?'selected':''}>in progress</option><option value="complete" ${row.review_status==='complete'?'selected':''}>complete</option></select></td><td class="small">H1: ${esc(row.h1_status || 'unchecked')}<br>Title/meta: ${esc(row.title_meta_status || 'unchecked')}<br>Links: ${esc(row.internal_link_status || 'unchecked')}</td><td><textarea data-seo-field="notes" data-id="${esc(row.page_path)}" rows="2">${esc(row.notes || '')}</textarea><button class="btn small" data-save-seo-review="${esc(row.page_path)}" type="button">Save</button></td></tr>`; }
  async function load() {
    mount.innerHTML = '<section class="card"><p class="small">Loading local SEO queue…</p></section>';
    try {
      const data = await read(await window.DDAuth.apiFetch('/api/admin/local-seo-review'));
      mount.innerHTML = `<section class="card"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><h2 style="margin-top:0">Landing-page review queue</h2><p class="small">${esc(data.summary?.needs_review || 0)} page(s) still need review.</p></div><button class="btn" id="localSeoReloadButton" type="button">Reload</button></div><div class="admin-table-wrap"><table><thead><tr><th>Page</th><th>Keyword/locality</th><th>Status</th><th>Checks</th><th>Notes</th></tr></thead><tbody>${(data.reviews || []).map(rowHtml).join('')}</tbody></table></div></section>`;
      document.getElementById('localSeoReloadButton')?.addEventListener('click', load);
      mount.querySelectorAll('[data-save-seo-review]').forEach((button) => button.addEventListener('click', async () => {
        const page_path = button.getAttribute('data-save-seo-review');
        const payload = { page_path };
        mount.querySelectorAll(`[data-id="${CSS.escape(page_path)}"]`).forEach((field) => { payload[field.getAttribute('data-seo-field')] = field.value; });
        payload.h1_status = 'reviewed'; payload.title_meta_status = 'reviewed'; payload.internal_link_status = 'reviewed';
        await read(await window.DDAuth.apiFetch('/api/admin/local-seo-review', { method: 'POST', body: JSON.stringify(payload) }));
        await load();
      }));
    } catch (error) {
      mount.innerHTML = `<section class="card"><p class="small">${esc(error.message || 'Local SEO queue failed.')}</p></section>`;
    }
  }
  load();
});
