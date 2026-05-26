// File: /public/js/admin-testimonial-trust-blocks.js
// Brief description: Operations panel for approved testimonial and local trust block workflow.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('testimonialTrustBlocksAdminMount');
  if (!mount || !window.DDAuth) return;

  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const short = (value, limit = 170) => { const text = String(value || '').trim(); return text.length > limit ? `${text.slice(0, limit - 1).trim()}…` : text; };
  const num = (value) => Number(value || 0).toLocaleString();
  const setMsg = (message, error = false) => { const el = document.getElementById('testimonialTrustBlocksMessage'); if (!el) return; el.textContent = message || ''; el.style.display = message ? 'block' : 'none'; el.style.color = error ? '#b00020' : '#14532d'; };
  async function readJson(response) { const data = await response.json().catch(() => null); if (!response.ok || !data?.ok) throw new Error(data?.error || 'Trust block request failed.'); return data; }

  function reviewRows(reviews) {
    return (reviews || []).slice(0, 60).map((row) => `<tr>
      <td><input type="radio" name="trustReviewSource" value="${esc(row.product_review_id)}"></td>
      <td><strong>${esc(row.reviewer_name || 'Customer')}</strong><div class="small">${esc(row.status || '')} • ${esc(row.rating || '')}/5 ${Number(row.is_featured || 0) ? '• featured' : ''}</div></td>
      <td><div>${esc(short(row.review_text || '', 220))}</div><div class="small">${esc(row.product_name || 'Store review')}</div></td>
      <td>${['approved','published'].includes(String(row.status || '').toLowerCase()) ? '<span class="admin-status-pill ok">usable</span>' : '<span class="admin-status-pill warning">approve first</span>'}</td>
    </tr>`).join('') || '<tr><td colspan="4">No product reviews/testimonials found yet.</td></tr>';
  }

  function itemRows(items) {
    return (items || []).map((row) => `<tr>
      <td><strong>${esc(row.title || 'Trust item')}</strong><div class="small">${esc(row.item_kind || '')} • ${esc(row.display_context || 'sitewide')}</div></td>
      <td><div>${esc(short(row.body || '', 180))}</div><div class="small">${esc(row.attribution_label || '')}${row.rating_label ? ` • ${esc(row.rating_label)}` : ''}</div></td>
      <td><strong>${esc(row.status || '')}</strong><div class="small">public ${Number(row.approved_for_public_use || 0) ? 'yes' : 'no'} • privacy ${esc(row.privacy_review_status || '')}</div></td>
      <td><button class="btn small" type="button" data-edit-trust-item="${esc(row.trust_block_item_id)}">Edit</button></td>
    </tr>`).join('') || '<tr><td colspan="4">No trust block items have been created yet.</td></tr>';
  }

  function fillForm(row = {}) {
    const form = document.getElementById('trustBlockItemForm');
    if (!form) return;
    Object.entries(row).forEach(([key, value]) => {
      const field = form.elements.namedItem(key);
      if (!field) return;
      if (field.type === 'checkbox') field.checked = Number(value || 0) === 1;
      else field.value = value == null ? '' : String(value);
    });
  }

  function render(data) {
    const summary = data.summary || {};
    const reviews = Array.isArray(data.reviews) ? data.reviews : [];
    const items = Array.isArray(data.items) ? data.items : [];
    mount.innerHTML = `
      <div class="card testimonial-trust-admin-panel" style="margin-top:18px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
          <div><h2 style="margin-top:0">Testimonials & Local Trust Blocks</h2><p class="small" style="margin:8px 0 0 0">Approve public-safe review snippets, local proof notes, and buyer confidence blocks before they appear across storefront pages.</p></div>
          <button class="btn" type="button" id="trustBlocksRefreshButton">Refresh</button>
        </div>
        <div class="grid cols-4 media-diagnostic-metrics" style="margin-top:12px">
          <div class="card"><div class="small">Items</div><strong>${num(summary.item_count || 0)}</strong></div>
          <div class="card"><div class="small">Public ready</div><strong>${num(summary.public_ready_count || 0)}</strong></div>
          <div class="card"><div class="small">Privacy review</div><strong>${num(summary.privacy_review_count || 0)}</strong></div>
          <div class="card"><div class="small">Featured</div><strong>${num(summary.featured_count || 0)}</strong></div>
        </div>
        <div id="testimonialTrustBlocksMessage" class="small" style="display:none;margin-top:10px"></div>
        <details style="margin-top:12px" open><summary>Create/edit a trust block item</summary>
          <form id="trustBlockItemForm" class="admin-form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:12px">
            <input type="hidden" name="trust_block_item_id" value="">
            <label class="small">Kind<select name="item_kind"><option value="testimonial">testimonial</option><option value="local_proof">local proof</option><option value="policy">policy</option><option value="process_note">process note</option><option value="buyer_note">buyer note</option></select></label>
            <label class="small">Display context<input name="display_context" placeholder="sitewide, shop, about, gallery" value="sitewide"></label>
            <label class="small">Status<select name="status"><option value="draft">draft</option><option value="reviewing">reviewing</option><option value="approved">approved</option><option value="published">published</option><option value="archived">archived</option></select></label>
            <label class="small">Privacy<select name="privacy_review_status"><option value="needs_review">needs_review</option><option value="cleared">cleared</option><option value="blocked">blocked</option></select></label>
            <label class="small" style="grid-column:1/-1">Title<input name="title" placeholder="Why buyers feel safer here"></label>
            <label class="small" style="grid-column:1/-1">Body<textarea name="body" rows="3" placeholder="Approved public-safe testimonial or trust note"></textarea></label>
            <label class="small">Attribution<input name="attribution_label" placeholder="Devil n Dove customer"></label>
            <label class="small">Rating label<input name="rating_label" placeholder="5/5"></label>
            <label class="small">Product slug<input name="related_product_slug" placeholder="optional-product-slug"></label>
            <label class="small">Product name<input name="related_product_name" placeholder="optional product name"></label>
            <label class="small">Locality<input name="locality_label" placeholder="Southern Ontario" value="Southern Ontario"></label>
            <label class="small">Sort<input name="sort_order" type="number" value="0"></label>
            <label class="small"><input name="is_featured" type="checkbox"> Featured</label>
            <label class="small"><input name="approved_for_public_use" type="checkbox"> Approved for public use</label>
            <label class="small" style="grid-column:1/-1">Internal notes<textarea name="internal_notes" rows="2" placeholder="Privacy, source, or approval notes"></textarea></label>
            <div style="grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" type="submit">Save trust block</button><button class="btn" type="button" id="trustBlockClearButton">Clear form</button></div>
          </form>
        </details>
        <details style="margin-top:12px"><summary>Approved reviews available for trust blocks</summary>
          <p class="small">Select an approved review, then create a review-based trust item for public placement.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0"><input id="trustBlockReviewTitle" placeholder="Optional trust block title" style="min-width:260px"><button class="btn" type="button" id="createTrustFromReviewButton">Create from selected review</button></div>
          <div class="admin-table-wrap"><table><thead><tr><th></th><th>Reviewer</th><th>Text/Product</th><th>Ready</th></tr></thead><tbody>${reviewRows(reviews)}</tbody></table></div>
        </details>
        <h3>Current trust block items</h3>
        <div class="admin-table-wrap"><table><thead><tr><th>Title/context</th><th>Copy</th><th>Status</th><th>Action</th></tr></thead><tbody>${itemRows(items)}</tbody></table></div>
      </div>`;
    document.getElementById('trustBlocksRefreshButton')?.addEventListener('click', load);
    document.getElementById('trustBlockClearButton')?.addEventListener('click', () => fillForm({ display_context: 'sitewide', status: 'draft', privacy_review_status: 'needs_review', locality_label: 'Southern Ontario', sort_order: 0 }));
    document.getElementById('createTrustFromReviewButton')?.addEventListener('click', async () => {
      const selected = document.querySelector('input[name="trustReviewSource"]:checked')?.value || '';
      if (!selected) return setMsg('Select an approved review first.', true);
      try {
        const title = document.getElementById('trustBlockReviewTitle')?.value || '';
        const data2 = await readJson(await window.DDAuth.apiFetch('/api/admin/testimonial-trust-blocks', { method: 'POST', body: JSON.stringify({ action: 'create_from_review', product_review_id: Number(selected), title, display_context: 'sitewide', status: 'reviewing', is_featured: 1, approved_for_public_use: 0 }) }));
        render(data2); setMsg(data2.message || 'Created trust item from review.');
      } catch (error) { setMsg(error.message || 'Could not create trust item.', true); }
    });
    const form = document.getElementById('trustBlockItemForm');
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      payload.action = 'save_item';
      payload.is_featured = form.elements.is_featured.checked ? 1 : 0;
      payload.approved_for_public_use = form.elements.approved_for_public_use.checked ? 1 : 0;
      payload.trust_block_item_id = Number(payload.trust_block_item_id || 0) || 0;
      try { const data2 = await readJson(await window.DDAuth.apiFetch('/api/admin/testimonial-trust-blocks', { method: 'POST', body: JSON.stringify(payload) })); render(data2); setMsg(data2.message || 'Trust block saved.'); }
      catch (error) { setMsg(error.message || 'Trust block save failed.', true); }
    });
    mount.querySelectorAll('[data-edit-trust-item]').forEach((button) => button.addEventListener('click', () => {
      const id = Number(button.getAttribute('data-edit-trust-item') || 0);
      const row = items.find((item) => Number(item.trust_block_item_id || 0) === id);
      if (row) { fillForm(row); window.scrollTo({ top: mount.offsetTop, behavior: 'smooth' }); }
    }));
  }

  async function load() {
    try { setMsg('Loading testimonial/trust workflow...'); const data = await readJson(await window.DDAuth.apiFetch('/api/admin/testimonial-trust-blocks')); render(data); setMsg('Testimonial/trust workflow loaded.'); }
    catch (error) { mount.innerHTML = `<div class="card" style="margin-top:18px"><h2>Testimonials & Local Trust Blocks</h2><p class="small">${esc(error.message || 'Unable to load testimonial/trust workflow.')}</p></div>`; }
  }
  load();
});
