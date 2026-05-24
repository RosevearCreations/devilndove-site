// File: /public/js/admin-product-story-notes.js
// Brief description: Admin panel for product_story_public_notes so public product stories can be drafted,
// privacy-reviewed, approved, and published without hand-editing D1.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('productStoryNotesAdminMount');
  if (!mount || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  let products = [];
  let notes = [];
  let selectedNoteId = '';

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function normalizeText(value) {
    return String(value || '').trim();
  }

  function setMessage(message, tone = 'info') {
    const el = document.getElementById('productStoryNotesMessage');
    if (!el) return;
    el.textContent = message || '';
    el.className = `status-note ${tone}`;
    el.style.display = message ? 'block' : 'none';
  }

  async function apiFetchJson(url, options = {}) {
    const response = await window.DDAuth.apiFetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; }
    catch { throw new Error(`Server returned non-JSON response (${response.status}).`); }
    if (!response.ok || data?.ok === false) throw new Error(data?.error || `Request failed (${response.status}).`);
    return data;
  }

  function productOptions() {
    return products.map((product) => {
      const label = [product.name || `Product #${product.product_id}`, product.sku ? `SKU ${product.sku}` : '', product.status || ''].filter(Boolean).join(' · ');
      return `<option value="${escapeHtml(product.product_id)}">${escapeHtml(label)}</option>`;
    }).join('');
  }

  function findProduct(id) {
    const productId = Number(id || 0);
    return products.find((product) => Number(product.product_id) === productId) || null;
  }

  function summarizeProduct(product) {
    if (!product) return '';
    return [product.short_description, product.sourcing_notes, product.condition_summary, product.era_label]
      .map(normalizeText)
      .filter(Boolean)
      .slice(0, 3)
      .join(' — ');
  }

  function renderNoteRows() {
    if (!notes.length) {
      return '<p class="small">No product story notes yet. Choose a product and seed a draft from product fields.</p>';
    }

    return `<div class="admin-table-wrap"><table class="products-admin-table">
      <thead><tr><th>Product</th><th>Status</th><th>Privacy</th><th>Heading</th><th>Updated</th><th>Actions</th></tr></thead>
      <tbody>${notes.map((note) => `
        <tr>
          <td>${escapeHtml(note.product_name || `Product #${note.product_id}`)}</td>
          <td><span class="pill">${escapeHtml(note.display_status || 'draft')}</span></td>
          <td><span class="pill">${escapeHtml(note.privacy_status || 'needs_review')}</span></td>
          <td>${escapeHtml(note.story_heading || note.story_summary || 'Untitled story')}</td>
          <td class="small">${escapeHtml(note.updated_at || '')}</td>
          <td><button class="btn" type="button" data-edit-story-note="${escapeHtml(note.product_story_public_note_id)}">Edit</button></td>
        </tr>`).join('')}</tbody>
    </table></div>`;
  }

  function render() {
    mount.innerHTML = `
      <div class="card dd-product-story-notes-panel" style="margin:18px 0">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
          <div>
            <h2 style="margin:0 0 6px 0">Product story notes</h2>
            <p class="small" style="margin:0">Draft and approve public-safe story copy for product pages. Approved/published notes feed the “story behind this piece” block.</p>
          </div>
          <button class="btn" type="button" id="refreshProductStoryNotesButton">Refresh story notes</button>
        </div>
        <div id="productStoryNotesMessage" class="status-note" style="display:none;margin-top:12px"></div>
        <div class="grid cols-2" style="gap:12px;margin-top:14px">
          <div>
            <label><span class="small">Product</span><select class="input" id="productStoryProductSelect"><option value="">Choose a product…</option>${productOptions()}</select></label>
            <div class="small" id="productStoryProductSummary" style="margin-top:8px"></div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
              <button class="btn" type="button" id="seedProductStoryButton">Seed draft from product</button>
              <button class="btn" type="button" id="clearProductStoryButton">New blank note</button>
            </div>
          </div>
          <div class="small" style="padding:10px 12px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.03)">
            <strong>Privacy rule:</strong> only approve product-safe copy. Avoid customer names, addresses, private workshop paperwork, sensitive health details, and anything that should stay behind the scenes.
          </div>
        </div>
        <form id="productStoryNotesForm" style="margin-top:14px">
          <input type="hidden" name="product_story_public_note_id" value=""/>
          <div class="grid cols-3" style="gap:10px">
            <label><span class="small">Display status</span><select class="input" name="display_status"><option value="draft">Draft</option><option value="review">Review</option><option value="approved">Approved</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
            <label><span class="small">Privacy status</span><select class="input" name="privacy_status"><option value="needs_review">Needs review</option><option value="safe">Safe</option><option value="private_detail_removed">Private detail removed</option><option value="blocked">Blocked</option></select></label>
            <label><span class="small">Story source</span><input class="input" name="story_source" maxlength="80" value="admin_editor"/></label>
          </div>
          <label style="display:block;margin-top:10px"><span class="small">Story heading</span><input class="input" name="story_heading" maxlength="180" placeholder="The story behind this piece"/></label>
          <label style="display:block;margin-top:10px"><span class="small">Short public summary</span><textarea class="input" name="story_summary" rows="2" maxlength="500"></textarea></label>
          <label style="display:block;margin-top:10px"><span class="small">Public story body</span><textarea class="input" name="story_body" rows="5" maxlength="5000"></textarea></label>
          <div class="grid cols-3" style="gap:10px;margin-top:10px">
            <label><span class="small">Process notes</span><textarea class="input" name="process_notes" rows="3" maxlength="2000"></textarea></label>
            <label><span class="small">Care notes</span><textarea class="input" name="care_notes" rows="3" maxlength="1200"></textarea></label>
            <label><span class="small">Local pickup / shipping note</span><textarea class="input" name="local_pickup_note" rows="3" maxlength="800"></textarea></label>
          </div>
          <div class="grid cols-2" style="gap:10px;margin-top:10px">
            <label><span class="small">Review notes</span><textarea class="input" name="review_notes" rows="3" maxlength="1200"></textarea></label>
            <label><span class="small">Internal notes</span><textarea class="input" name="internal_notes" rows="3" maxlength="1200"></textarea></label>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
            <button class="btn primary" type="submit">Save story note</button>
            <button class="btn" type="button" id="markStoryReviewButton">Mark review</button>
            <button class="btn" type="button" id="approveStoryButton">Approve safe story</button>
            <button class="btn" type="button" id="publishStoryButton">Mark published</button>
          </div>
        </form>
        <div id="productStoryNotesRows" style="margin-top:14px">${renderNoteRows()}</div>
      </div>
    `;

    bindEvents();
  }

  function fillForm(note = {}) {
    const form = document.getElementById('productStoryNotesForm');
    if (!form) return;
    form.product_story_public_note_id.value = note.product_story_public_note_id || '';
    form.story_heading.value = note.story_heading || '';
    form.story_summary.value = note.story_summary || '';
    form.story_body.value = note.story_body || '';
    form.process_notes.value = note.process_notes || '';
    form.care_notes.value = note.care_notes || '';
    form.local_pickup_note.value = note.local_pickup_note || '';
    form.display_status.value = note.display_status || 'draft';
    form.privacy_status.value = note.privacy_status || 'needs_review';
    form.story_source.value = note.story_source || 'admin_editor';
    form.review_notes.value = note.review_notes || '';
    form.internal_notes.value = note.internal_notes || '';
    const productSelect = document.getElementById('productStoryProductSelect');
    if (productSelect && note.product_id) productSelect.value = String(note.product_id);
    updateProductSummary();
    selectedNoteId = String(note.product_story_public_note_id || '');
  }

  function updateProductSummary() {
    const select = document.getElementById('productStoryProductSelect');
    const summary = document.getElementById('productStoryProductSummary');
    const product = findProduct(select?.value);
    if (summary) summary.textContent = product ? summarizeProduct(product) || 'No source story fields yet.' : 'Choose a product to write or seed story copy.';
  }

  async function loadData() {
    setMessage('Loading product story notes…', 'info');
    try {
      const data = await apiFetchJson('/api/admin/product-story-notes');
      products = Array.isArray(data.products) ? data.products : [];
      notes = Array.isArray(data.notes) ? data.notes : [];
      render();
      setMessage(`Loaded ${notes.length} story note(s).`, 'success');
    } catch (error) {
      setMessage(error.message || 'Could not load story notes.', 'error');
    }
  }

  async function saveForm(statusOverride = null) {
    const form = document.getElementById('productStoryNotesForm');
    const productSelect = document.getElementById('productStoryProductSelect');
    if (!form || !productSelect) return;
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.product_id = Number(productSelect.value || 0);
    if (statusOverride) payload.display_status = statusOverride;

    setMessage('Saving story note…', 'info');
    const data = await apiFetchJson('/api/admin/product-story-notes', { method: 'POST', body: JSON.stringify(payload) });
    setMessage(data.message || 'Story note saved.', 'success');
    await loadData();
  }

  async function updateSelectedStatus(status) {
    const noteId = selectedNoteId || document.querySelector('#productStoryNotesForm [name="product_story_public_note_id"]')?.value;
    if (!noteId) {
      await saveForm(status);
      return;
    }
    const form = document.getElementById('productStoryNotesForm');
    const data = await apiFetchJson('/api/admin/product-story-notes', {
      method: 'POST',
      body: JSON.stringify({
        action: 'status',
        product_story_public_note_id: Number(noteId),
        display_status: status,
        privacy_status: form?.privacy_status?.value || 'needs_review',
        review_notes: form?.review_notes?.value || ''
      })
    });
    setMessage(data.message || 'Status updated.', 'success');
    await loadData();
  }

  function bindEvents() {
    document.getElementById('refreshProductStoryNotesButton')?.addEventListener('click', loadData);
    document.getElementById('productStoryProductSelect')?.addEventListener('change', updateProductSummary);
    document.getElementById('clearProductStoryButton')?.addEventListener('click', () => fillForm({}));
    document.getElementById('seedProductStoryButton')?.addEventListener('click', async () => {
      const productId = Number(document.getElementById('productStoryProductSelect')?.value || 0);
      if (!productId) return setMessage('Choose a product before seeding a story.', 'error');
      try {
        const data = await apiFetchJson('/api/admin/product-story-notes', { method: 'POST', body: JSON.stringify({ action: 'seed_from_product', product_id: productId }) });
        setMessage(data.message || 'Seeded story draft.', 'success');
        await loadData();
      } catch (error) {
        setMessage(error.message || 'Could not seed story.', 'error');
      }
    });
    document.getElementById('productStoryNotesForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      try { await saveForm(); }
      catch (error) { setMessage(error.message || 'Could not save story note.', 'error'); }
    });
    document.getElementById('markStoryReviewButton')?.addEventListener('click', async () => updateSelectedStatus('review').catch((error) => setMessage(error.message, 'error')));
    document.getElementById('approveStoryButton')?.addEventListener('click', async () => updateSelectedStatus('approved').catch((error) => setMessage(error.message, 'error')));
    document.getElementById('publishStoryButton')?.addEventListener('click', async () => updateSelectedStatus('published').catch((error) => setMessage(error.message, 'error')));
    mount.querySelectorAll('[data-edit-story-note]').forEach((button) => {
      button.addEventListener('click', () => {
        const note = notes.find((row) => String(row.product_story_public_note_id) === String(button.dataset.editStoryNote));
        if (note) fillForm(note);
      });
    });
    updateProductSummary();
  }

  render();
  loadData();
});
