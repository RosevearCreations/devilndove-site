// File: /public/js/admin-product-draft-checklist.js
// Brief description: Product editor draft checklist, review helper, and reusable image library picker.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('createProductForm');
  if (!form || !window.DDAuth) return;

  const field = (name) => form.elements.namedItem(name);
  const text = (name) => String(field(name)?.value || '').trim();
  const numberValue = (name) => Number(String(field(name)?.value || '').trim() || 0);
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  function findMountAnchor() {
    return document.getElementById('productDraftImageUploader') || form;
  }

  function ensurePanel() {
    let panel = document.getElementById('productDraftChecklistPanel');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'productDraftChecklistPanel';
    panel.className = 'dd-product-draft-checklist-panel';
    const anchor = findMountAnchor();
    anchor.parentNode?.insertBefore(panel, anchor.nextSibling);
    return panel;
  }

  function firstEmptyImageField(preferGallery = false) {
    if (!preferGallery) {
      const featured = field('featured_image_url');
      if (featured && !String(featured.value || '').trim()) return featured;
    }
    for (let i = 1; i <= 6; i += 1) {
      const candidate = field(`image_url_${i}`);
      if (candidate && !String(candidate.value || '').trim()) return candidate;
    }
    return field('featured_image_url') || field('image_url_1') || null;
  }

  function setFormMessage(message, isError = false) {
    const target = document.getElementById('createProductMessage');
    if (!target) return;
    target.textContent = message || '';
    target.style.display = message ? 'block' : 'none';
    target.style.color = isError ? '#ffb4c1' : '#9ef0b4';
  }

  function getChecks() {
    const imageUrls = [text('featured_image_url'), text('image_url_1'), text('image_url_2'), text('image_url_3'), text('image_url_4'), text('image_url_5'), text('image_url_6')].filter(Boolean);
    const checks = [
      { key: 'draft-name', label: 'Draft name', pass: !!text('name'), blocker: 'draft', action: 'Add a product name.' },
      { key: 'draft-type', label: 'Product type', pass: !!text('product_type'), blocker: 'draft', action: 'Choose physical or digital.' },
      { key: 'slug', label: 'Slug', pass: !!text('slug'), blocker: 'review', action: 'Add a clean URL slug or let the editor generate one from the name.' },
      { key: 'category', label: 'Category', pass: !!text('product_category'), blocker: 'review', action: 'Choose the best storefront category.' },
      { key: 'price', label: 'Price', pass: numberValue('price') > 0, blocker: 'review', action: 'Add a real CAD price before review.' },
      { key: 'image', label: 'Featured or gallery image', pass: imageUrls.length > 0, blocker: 'review', action: 'Upload or reuse at least one product image.' },
      { key: 'seo-title', label: 'SEO title', pass: !!text('meta_title'), blocker: 'publish', action: 'Add a clear SEO title before publishing.' },
      { key: 'seo-description', label: 'SEO description', pass: !!text('meta_description'), blocker: 'publish', action: 'Add a concise search description before publishing.' },
      { key: 'external-url', label: 'External listing link only if needed', pass: !['hybrid', 'external_only'].includes(text('sale_channel')) || !!text('external_listing_url') || text('status') === 'draft', blocker: 'publish', action: 'Leave blank for normal Devil n Dove shop listings. Add a full https:// Etsy/Facebook/etc. URL only for Hybrid or External-only active listings.' }
    ];
    return checks;
  }

  function renderChecklist() {
    const panel = ensurePanel();
    const checks = getChecks();
    const draftOk = checks.filter((row) => row.blocker === 'draft').every((row) => row.pass);
    const reviewOk = checks.filter((row) => ['draft', 'review'].includes(row.blocker)).every((row) => row.pass);
    const publishOk = checks.every((row) => row.pass);
    panel.innerHTML = `
      <div class="dd-draft-checklist-head">
        <div>
          <h3 style="margin:0 0 6px 0">Draft readiness checklist</h3>
          <p class="small" style="margin:0">Save rough drafts with only name/type. Use this card to see what is missing before moving into review or publishing.</p>
        </div>
        <div class="dd-draft-checklist-actions">
          <button class="btn" type="button" id="ddFillSlugFromNameButton">Fill slug from name</button>
          <button class="btn" type="button" id="ddMoveDraftToReviewButton">Move draft to review</button>
        </div>
      </div>
      <div class="dd-draft-checklist-summary">
        <span class="admin-status-pill ${draftOk ? 'ok' : 'warn'}">Draft ${draftOk ? 'ready' : 'needs name/type'}</span>
        <span class="admin-status-pill ${reviewOk ? 'ok' : 'warn'}">Review ${reviewOk ? 'ready' : 'not ready'}</span>
        <span class="admin-status-pill ${publishOk ? 'ok' : 'warn'}">Publish ${publishOk ? 'ready' : 'not ready'}</span>
      </div>
      <div class="dd-draft-checklist-grid">
        ${checks.map((row) => `<div class="dd-draft-check ${row.pass ? 'is-pass' : 'is-missing'}"><strong>${row.pass ? '✓' : '•'} ${esc(row.label)}</strong><span class="small">${row.pass ? esc(row.blocker === 'draft' ? 'Draft requirement complete.' : 'Ready item complete.') : esc(row.action)}</span></div>`).join('')}
      </div>
      <div class="dd-image-library" id="ddImageLibraryPicker">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap">
          <div><h3 style="margin:0 0 6px 0">Reuse uploaded images</h3><p class="small" style="margin:0">Search the media library and place an existing R2 image into the featured/gallery URL fields.</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><input class="input" id="ddImageLibrarySearch" type="search" placeholder="Search filename/product" style="max-width:230px"><button class="btn" type="button" id="ddImageLibraryLoadButton">Load images</button></div>
        </div>
        <div id="ddImageLibraryStatus" class="small" style="margin-top:8px"></div>
        <div id="ddImageLibraryResults" class="dd-image-library-grid" hidden></div>
      </div>`;
  }

  function slugify(value) {
    return String(value || '').trim().toLowerCase().replace(/["']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 180);
  }

  async function loadImageLibrary() {
    const status = document.getElementById('ddImageLibraryStatus');
    const results = document.getElementById('ddImageLibraryResults');
    if (!status || !results) return;
    const q = String(document.getElementById('ddImageLibrarySearch')?.value || '').trim();
    const currentProductId = Number(form.dataset.productId || window.DDCurrentProductEditorId || 0);
    const params = new URLSearchParams({ limit: '40' });
    if (q) params.set('q', q);
    if (!q && currentProductId > 0) params.set('product_id', String(currentProductId));
    status.textContent = 'Loading media library...';
    results.hidden = true;
    results.innerHTML = '';
    try {
      const response = await window.DDAuth.apiFetch(`/api/admin/media-assets?${params.toString()}`, { method: 'GET' });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to load media assets.');
      const assets = (Array.isArray(data.assets) ? data.assets : []).filter((row) => row.public_url);
      status.textContent = assets.length ? `${assets.length} reusable image(s) loaded.` : 'No reusable image URLs found yet.';
      results.hidden = !assets.length;
      results.innerHTML = assets.map((asset) => `
        <button type="button" class="dd-image-library-tile" data-use-media-url="${esc(asset.public_url)}" title="Use ${esc(asset.original_filename || asset.object_key || '')}">
          <span class="dd-image-library-thumb"><img src="${esc(asset.public_url)}" alt="${esc(asset.original_filename || 'Uploaded media asset')}" loading="lazy"></span>
          <strong>${esc(asset.original_filename || asset.object_key || 'Uploaded image')}</strong>
          <span class="small">${asset.product_name ? esc(asset.product_name) : 'Unassigned'}${asset.image_orientation ? ` • ${esc(asset.image_orientation)}` : ''}</span>
        </button>`).join('');
    } catch (error) {
      status.textContent = error.message || 'Failed to load media library.';
    }
  }

  function moveDraftToReview() {
    const checks = getChecks();
    const missing = checks.filter((row) => ['draft', 'review'].includes(row.blocker) && !row.pass);
    if (missing.length) {
      setFormMessage(`Not ready for review yet: ${missing.map((row) => row.label).join(', ')}.`, true);
      renderChecklist();
      return;
    }
    if (field('status')) field('status').value = 'draft';
    if (field('review_status')) field('review_status').value = 'pending_review';
    setFormMessage('Checklist is ready for review. Press Save/Update Product to store this review-ready draft.');
    renderChecklist();
  }

  document.addEventListener('click', (event) => {
    const slugButton = event.target.closest('#ddFillSlugFromNameButton');
    if (slugButton) {
      const slugField = field('slug');
      if (slugField && !String(slugField.value || '').trim()) slugField.value = slugify(text('name'));
      renderChecklist();
      return;
    }
    if (event.target.closest('#ddMoveDraftToReviewButton')) {
      moveDraftToReview();
      return;
    }
    if (event.target.closest('#ddImageLibraryLoadButton')) {
      loadImageLibrary();
      return;
    }
    const tile = event.target.closest('[data-use-media-url]');
    if (tile) {
      const url = tile.getAttribute('data-use-media-url') || '';
      const target = firstEmptyImageField(false);
      if (target) {
        target.value = url;
        target.dispatchEvent(new Event('input', { bubbles: true }));
        setFormMessage('Existing image URL added to the product form.');
      }
      renderChecklist();
    }
  });

  ['input', 'change'].forEach((name) => form.addEventListener(name, () => renderChecklist()));
  document.addEventListener('dd:product-editor-target', () => setTimeout(renderChecklist, 50));
  document.addEventListener('dd:product-created', () => setTimeout(renderChecklist, 100));
  document.addEventListener('dd:product-updated', () => setTimeout(renderChecklist, 100));
  renderChecklist();
});
