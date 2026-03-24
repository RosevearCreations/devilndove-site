// File: /public/js/admin-product-images.js
// Brief description: Adds a product media editor to the admin area so ordered image URLs,
// direct uploads, alt text, captions, and focal-point metadata can be managed together.

document.addEventListener('DOMContentLoaded', () => {
  const mountEl = document.getElementById('productMediaAdminMount');
  if (!mountEl || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  let rendered = false;

  function setMessage(message, isError = false) {
    const el = document.getElementById('adminProductImagesMessage');
    if (!el) return;
    el.textContent = message;
    el.style.display = message ? 'block' : 'none';
    el.style.color = isError ? '#b00020' : '#0a7a2f';
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function rowTemplate(row = {}, index = 0) {
    return `
      <div class="card" data-product-image-row style="margin-top:12px">
        <div class="grid cols-2" style="gap:12px">
          <div>
            <label class="small">Image URL</label>
            <input type="text" data-field="image_url" value="${escapeHtml(row.image_url || '')}" placeholder="https://..." />
          </div>
          <div>
            <label class="small">Alt Text</label>
            <input type="text" data-field="alt_text" value="${escapeHtml(row.alt_text || '')}" placeholder="Describe the image clearly" />
          </div>
        </div>
        <div class="grid cols-3" style="gap:12px;margin-top:12px">
          <div>
            <label class="small">Image Title</label>
            <input type="text" data-field="image_title" value="${escapeHtml(row.image_title || '')}" />
          </div>
          <div>
            <label class="small">Caption</label>
            <input type="text" data-field="caption" value="${escapeHtml(row.caption || '')}" />
          </div>
          <div>
            <label class="small">Sort Order</label>
            <input type="number" data-field="sort_order" min="0" step="1" value="${escapeHtml(String(row.sort_order ?? index))}" />
          </div>
        </div>
        <div class="grid cols-3" style="gap:12px;margin-top:12px">
          <div>
            <label class="small">Focal X</label>
            <input type="number" data-field="focal_point_x" min="0" max="1" step="0.01" value="${escapeHtml(row.focal_point_x ?? '')}" />
          </div>
          <div>
            <label class="small">Focal Y</label>
            <input type="number" data-field="focal_point_y" min="0" max="1" step="0.01" value="${escapeHtml(row.focal_point_y ?? '')}" />
          </div>
          <div>
            <label class="small">Notes</label>
            <input type="text" data-field="annotation_notes" value="${escapeHtml(row.annotation_notes || '')}" />
          </div>
        </div>
      </div>
    `;
  }

  function collectRows() {
    return Array.from(document.querySelectorAll('[data-product-image-row]')).map((row) => {
      const value = (field) => row.querySelector(`[data-field="${field}"]`)?.value ?? '';
      return {
        image_url: String(value('image_url') || '').trim(),
        alt_text: String(value('alt_text') || '').trim(),
        image_title: String(value('image_title') || '').trim(),
        caption: String(value('caption') || '').trim(),
        sort_order: Number(value('sort_order') || 0),
        focal_point_x: String(value('focal_point_x') || '').trim() === '' ? null : Number(value('focal_point_x')),
        focal_point_y: String(value('focal_point_y') || '').trim() === '' ? null : Number(value('focal_point_y')),
        annotation_notes: String(value('annotation_notes') || '').trim()
      };
    }).filter((row) => row.image_url);
  }

  function render() {
    if (rendered) return;
    rendered = true;
    mountEl.innerHTML = `
      <div class="card" style="margin-top:18px">
        <h3 style="margin-top:0">Product Media Workflow</h3>
        <p class="small" style="margin-top:0">Manage ordered image URLs, direct uploads, alt text, captions, focal points, and featured image behavior together.</p>
        <div id="adminProductImagesMessage" class="small" style="display:none;margin-bottom:12px"></div>
        <form id="adminProductImagesForm" class="grid" style="gap:12px">
          <div class="grid cols-2" style="gap:12px">
            <div>
              <label class="small" for="productImagesProductId">Product ID</label>
              <input id="productImagesProductId" type="number" min="1" step="1" required />
            </div>
            <div style="display:flex;gap:10px;align-items:end;flex-wrap:wrap">
              <button class="btn" type="button" id="loadProductImagesButton">Load Images</button>
              <button class="btn" type="button" id="addProductImageRowButton">Add Row</button>
              <button class="btn" type="submit" id="saveProductImagesButton">Save Images</button>
            </div>
          </div>

          <div class="card" style="margin-top:4px">
            <h4 style="margin-top:0">Direct Upload to R2</h4>
            <p class="small" style="margin-top:0">Upload an image here to get a product-ready URL automatically added into a new row.</p>
            <div class="grid cols-2" style="gap:12px;align-items:end">
              <div>
                <label class="small" for="productImageUploadInput">Image File</label>
                <input id="productImageUploadInput" type="file" accept="image/*" />
              </div>
              <div>
                <button class="btn" type="button" id="uploadProductImageButton">Upload Image</button>
              </div>
            </div>
          </div>

          <div id="productImagesRows"></div>
        </form>
      </div>
    `;

    document.getElementById('loadProductImagesButton')?.addEventListener('click', loadImages);
    document.getElementById('addProductImageRowButton')?.addEventListener('click', () => addRow());
    document.getElementById('uploadProductImageButton')?.addEventListener('click', uploadImage);
    document.getElementById('adminProductImagesForm')?.addEventListener('submit', saveImages);
    addRow();
  }

  function addRow(row = {}) {
    const wrap = document.getElementById('productImagesRows');
    if (!wrap) return;
    wrap.insertAdjacentHTML('beforeend', rowTemplate(row, wrap.children.length));
  }

  async function loadImages() {
    const productId = Number(document.getElementById('productImagesProductId')?.value || 0);
    if (!productId) {
      setMessage('Enter a valid product ID.', true);
      return;
    }
    try {
      setMessage('Loading product images...');
      const response = await window.DDAuth.apiFetch(`/api/admin/product-images?product_id=${encodeURIComponent(productId)}`);
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to load product images.');
      const wrap = document.getElementById('productImagesRows');
      if (wrap) wrap.innerHTML = '';
      const rows = Array.isArray(data.images) ? data.images : [];
      if (!rows.length) addRow();
      rows.forEach((row, index) => addRow({ ...row, sort_order: row.sort_order ?? index }));
      setMessage('Product images loaded.');
    } catch (error) {
      setMessage(error.message || 'Failed to load product images.', true);
    }
  }

  async function uploadImage() {
    const productId = Number(document.getElementById('productImagesProductId')?.value || 0);
    if (!productId) {
      setMessage('Enter a product ID before uploading.', true);
      return;
    }

    const fileInput = document.getElementById('productImageUploadInput');
    const file = fileInput?.files?.[0];
    if (!file) {
      setMessage('Choose an image file first.', true);
      return;
    }

    try {
      setMessage('Uploading image...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('product_id', String(productId));

      const response = await window.DDAuth.apiFetch('/api/admin/media-upload', {
        method: 'POST',
        body: formData,
        headers: {}
      });
      const data = await response.json();
      if (!response.ok || !data?.ok || !data?.asset?.public_url) {
        throw new Error(data?.error || 'Failed to upload image.');
      }

      addRow({
        image_url: data.asset.public_url,
        alt_text: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
        sort_order: document.querySelectorAll('[data-product-image-row]').length
      });

      if (fileInput) fileInput.value = '';
      setMessage('Image uploaded and added to the list. Save images to attach it to the product.');
    } catch (error) {
      setMessage(error.message || 'Failed to upload image.', true);
    }
  }

  async function saveImages(event) {
    event.preventDefault();
    const productId = Number(document.getElementById('productImagesProductId')?.value || 0);
    if (!productId) {
      setMessage('Enter a valid product ID.', true);
      return;
    }
    try {
      setMessage('Saving product images...');
      const payload = { product_id: productId, images: collectRows() };
      const response = await window.DDAuth.apiFetch('/api/admin/product-images', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to save product images.');
      setMessage('Product images saved.');
      document.dispatchEvent(new CustomEvent('dd:product-updated', { detail: { product_id: productId } }));
    } catch (error) {
      setMessage(error.message || 'Failed to save product images.', true);
    }
  }

  document.addEventListener('dd:admin-ready', (event) => {
    if (!event?.detail?.ok) return;
    render();
  });

  render();
});
