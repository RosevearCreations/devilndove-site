// File: /public/js/admin-product-images.js
// Brief description: Adds a product media editor to the admin area so ordered image URLs,
// direct uploads, asset-library browsing, delete/reorder actions, and annotation metadata can be managed together.

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

  async function inspectLocalImageFile(file) {
    return new Promise((resolve) => {
      try {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          const width = Number(img.naturalWidth || 0);
          const height = Number(img.naturalHeight || 0);
          URL.revokeObjectURL(objectUrl);
          const ratio = height > 0 ? (width / height) : 0;
          const orientation = ratio >= 0.95 ? 'square_or_landscape' : 'portrait';
          const baseOk = width >= 800 && height >= 800 && orientation === 'square_or_landscape';
          const firstImageOk = width >= 1200 && height >= 1200 && orientation === 'square_or_landscape';
          resolve({ width, height, ratio, orientation, ok: baseOk, first_image_ok: firstImageOk });
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve({ width: 0, height: 0, ratio: 0, orientation: 'unknown', ok: false, first_image_ok: false });
        };
        img.src = objectUrl;
      } catch {
        resolve({ width: 0, height: 0, ratio: 0, orientation: 'unknown', ok: false, first_image_ok: false });
      }
    });
  }

  function rowTemplate(row = {}, index = 0) {
    return `
      <div class="card" data-product-image-row style="margin-top:12px">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap">
          <strong>Image Row ${index + 1}</strong>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn" type="button" data-row-move="up">↑</button>
            <button class="btn" type="button" data-row-move="down">↓</button>
            <button class="btn" type="button" data-row-remove>Remove</button>
          </div>
        </div>
        <div class="grid cols-2" style="gap:12px;margin-top:12px">
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
          <div><label class="small">Image Title</label><input type="text" data-field="image_title" value="${escapeHtml(row.image_title || '')}" /></div>
          <div><label class="small">Caption</label><input type="text" data-field="caption" value="${escapeHtml(row.caption || '')}" /></div>
          <div><label class="small">Sort Order</label><input type="number" data-field="sort_order" min="0" step="1" value="${escapeHtml(String(row.sort_order ?? index))}" /></div>
        </div>
        <div class="grid cols-3" style="gap:12px;margin-top:12px">
          <div><label class="small">Focal X</label><input type="number" data-field="focal_point_x" min="0" max="1" step="0.01" value="${escapeHtml(row.focal_point_x ?? '')}" /></div>
          <div><label class="small">Focal Y</label><input type="number" data-field="focal_point_y" min="0" max="1" step="0.01" value="${escapeHtml(row.focal_point_y ?? '')}" /></div>
          <div><label class="small">Notes</label><input type="text" data-field="annotation_notes" value="${escapeHtml(row.annotation_notes || '')}" /></div>
        </div>
        <div class="grid cols-5" style="gap:12px;margin-top:12px">
          <div><label class="small">Width px</label><input type="number" data-field="width_px" min="0" step="1" value="${escapeHtml(row.width_px ?? '')}" /></div>
          <div><label class="small">Height px</label><input type="number" data-field="height_px" min="0" step="1" value="${escapeHtml(row.height_px ?? '')}" /></div>
          <div><label class="small">Orientation</label><input type="text" data-field="image_orientation" value="${escapeHtml(row.image_orientation || '')}" placeholder="square / landscape / portrait" /></div>
          <div><label class="small">Crop X / Y</label><input type="text" data-field="crop_pair" value="${escapeHtml(((row.crop_x ?? '') !== '' || (row.crop_y ?? '') !== '') ? `${row.crop_x ?? ''},${row.crop_y ?? ''}` : '')}" placeholder="0.05,0.10" /></div>
          <div><label class="small">Crop W / H</label><input type="text" data-field="crop_size" value="${escapeHtml(((row.crop_width ?? '') !== '' || (row.crop_height ?? '') !== '') ? `${row.crop_width ?? ''},${row.crop_height ?? ''}` : '')}" placeholder="0.90,0.80" /></div>
        </div>
      </div>`;
  }

  function computeRowScore(row = {}, index = 0) {
    const width = Number(row.width_px || 0);
    const height = Number(row.height_px || 0);
    const orientation = String(row.image_orientation || '').toLowerCase();
    const altOk = String(row.alt_text || '').trim().length >= 5;
    const hasCrop = row.crop_x != null && row.crop_y != null && row.crop_width != null && row.crop_height != null;
    let score = 0;
    if (String(row.image_url || '').trim()) score += 20;
    if (altOk) score += 15;
    if (width >= 1200 && height >= 1200) score += 20;
    else if (width >= 800 && height >= 800) score += 12;
    if (index === 0 && ['square', 'landscape'].includes(orientation)) score += 20;
    else if (index > 0 && ['square', 'landscape', 'portrait'].includes(orientation)) score += 10;
    if (hasCrop) score += 15;
    if (String(row.caption || '').trim()) score += 5;
    if (String(row.image_title || '').trim()) score += 5;
    return Math.min(100, score);
  }

  function renderQualityScore() {
    const rows = collectRows();
    const mount = document.getElementById("adminProductImagesQuality");
    if (!mount) return;
    const imageCount = rows.length;
    const altCoverage = rows.filter((row) => String(row.alt_text || "").trim().length >= 5).length;
    const firstImage = rows[0] || null;
    const firstImageScore = firstImage ? computeRowScore(firstImage, 0) : 0;
    const overallScore = rows.length ? Math.round(rows.reduce((sum, row, index) => sum + computeRowScore(row, index), 0) / rows.length) : 0;
    const firstOrientation = String(firstImage?.image_orientation || '').toLowerCase();
    const firstWarning = !firstImage ? 'Choose a first image before publish.' : (['square','landscape'].includes(firstOrientation) ? '' : 'First image should be square or landscape.');
    const cropWarning = firstImage && !(firstImage.crop_x != null && firstImage.crop_y != null && firstImage.crop_width != null && firstImage.crop_height != null) ? 'Add crop history to the first image for stronger merchandising control.' : '';
    mount.innerHTML = `<h4 style="margin-top:0">Photo completeness before publish</h4><div class="small">${imageCount} image(s) loaded • ${altCoverage} image(s) with usable alt text • image score ${overallScore}% • first-image score ${firstImageScore}%</div><div class="small" style="margin-top:6px">Aim for at least 3 images. Use a square or landscape first image, record image dimensions, and store crop history on the lead image.</div>${firstWarning ? `<div class="small" style="margin-top:6px;color:#b00020">${firstWarning}</div>` : ''}${cropWarning ? `<div class="small" style="margin-top:6px;color:#b00020">${cropWarning}</div>` : ''}`;
  }

  function collectRows() {
    return Array.from(document.querySelectorAll('[data-product-image-row]')).map((row, index) => {
      const value = (field) => row.querySelector(`[data-field="${field}"]`)?.value ?? '';
      return {
        image_url: String(value('image_url') || '').trim(),
        alt_text: String(value('alt_text') || '').trim(),
        image_title: String(value('image_title') || '').trim(),
        caption: String(value('caption') || '').trim(),
        sort_order: index,
        focal_point_x: String(value('focal_point_x') || '').trim() === '' ? null : Number(value('focal_point_x')),
        focal_point_y: String(value('focal_point_y') || '').trim() === '' ? null : Number(value('focal_point_y')),
        annotation_notes: String(value('annotation_notes') || '').trim(),
        width_px: String(value('width_px') || '').trim() === '' ? null : Number(value('width_px')),
        height_px: String(value('height_px') || '').trim() === '' ? null : Number(value('height_px')),
        image_orientation: String(value('image_orientation') || '').trim(),
        crop_x: String((value('crop_pair') || '').split(',')[0] || '').trim() === '' ? null : Number(String((value('crop_pair') || '').split(',')[0] || '').trim()),
        crop_y: String((value('crop_pair') || '').split(',')[1] || '').trim() === '' ? null : Number(String((value('crop_pair') || '').split(',')[1] || '').trim()),
        crop_width: String((value('crop_size') || '').split(',')[0] || '').trim() === '' ? null : Number(String((value('crop_size') || '').split(',')[0] || '').trim()),
        crop_height: String((value('crop_size') || '').split(',')[1] || '').trim() === '' ? null : Number(String((value('crop_size') || '').split(',')[1] || '').trim()),
        first_image_score: computeRowScore({ image_url: String(value('image_url') || '').trim(), alt_text: String(value('alt_text') || '').trim(), image_title: String(value('image_title') || '').trim(), caption: String(value('caption') || '').trim(), width_px: String(value('width_px') || '').trim() === '' ? null : Number(value('width_px')), height_px: String(value('height_px') || '').trim() === '' ? null : Number(value('height_px')), image_orientation: String(value('image_orientation') || '').trim(), crop_x: String((value('crop_pair') || '').split(',')[0] || '').trim() === '' ? null : Number(String((value('crop_pair') || '').split(',')[0] || '').trim()), crop_y: String((value('crop_pair') || '').split(',')[1] || '').trim() === '' ? null : Number(String((value('crop_pair') || '').split(',')[1] || '').trim()), crop_width: String((value('crop_size') || '').split(',')[0] || '').trim() === '' ? null : Number(String((value('crop_size') || '').split(',')[0] || '').trim()), crop_height: String((value('crop_size') || '').split(',')[1] || '').trim() === '' ? null : Number(String((value('crop_size') || '').split(',')[1] || '').trim()) }, index)
      };
    }).filter((row) => row.image_url);
  }

  function render() {
    if (rendered) return;
    rendered = true;
    mountEl.innerHTML = `
      <div class="card" style="margin-top:18px">
        <h3 style="margin-top:0">Product Media Workflow</h3>
        <p class="small" style="margin-top:0">Manage ordered image URLs, direct uploads, asset browsing, alt text, captions, focal points, and featured image behavior together.</p>
        <div id="adminProductImagesMessage" class="small" style="display:none;margin-bottom:12px"></div>
        <form id="adminProductImagesForm" class="grid" style="gap:12px">
          <div class="grid cols-2" style="gap:12px">
            <div><label class="small" for="productImagesProductId">Product ID</label><input id="productImagesProductId" type="number" min="1" step="1" required /></div>
            <div style="display:flex;gap:10px;align-items:end;flex-wrap:wrap"><button class="btn" type="button" id="loadProductImagesButton">Load Images</button><button class="btn" type="button" id="addProductImageRowButton">Add Row</button><button class="btn" type="submit" id="saveProductImagesButton">Save Images</button></div>
          </div>
          <div class="card" style="margin-top:4px">
            <h4 style="margin-top:0">Direct Upload to R2</h4>
            <div class="grid cols-2" style="gap:12px;align-items:end"><div><label class="small" for="productImageUploadInput">Image File</label><input id="productImageUploadInput" type="file" accept="image/*" /></div><div><button class="btn" type="button" id="uploadProductImageButton">Upload Image</button></div></div>
          </div>
          <div class="card" style="margin-top:4px">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><h4 style="margin:0">Uploaded Asset Library</h4><button class="btn" type="button" id="refreshMediaAssetsButton">Refresh Assets</button></div>
            <div id="adminMediaAssetsList" class="small" style="margin-top:12px">Load a product first to browse uploaded media.</div>
          </div>
          <div id="adminProductImagesQuality" class="card" style="margin-top:12px"></div><div id="productImagesRows"></div>
        </form>
      </div>`;

    document.getElementById('loadProductImagesButton')?.addEventListener('click', loadImages);
    document.getElementById('addProductImageRowButton')?.addEventListener('click', () => addRow());
    document.getElementById('uploadProductImageButton')?.addEventListener('click', uploadImage);
    document.getElementById('productImageUploadInput')?.addEventListener('change', async (event) => {
      const file = event.target?.files?.[0];
      if (!file) return;
      const info = await inspectLocalImageFile(file);
      const hasExistingRows = Array.from(document.querySelectorAll('[data-product-image-row]')).some((row) => String(row.querySelector('[data-field="image_url"]')?.value || '').trim());
      if (!info.ok) setMessage(`Image warning: use a square or landscape image at least 800x800. Current file is ${info.width}x${info.height}.`, true);
      else if (!hasExistingRows && !info.first_image_ok) setMessage(`First image warning: aim for at least 1200x1200 and square or landscape. Current file is ${info.width}x${info.height}.`, true);
      else setMessage(`Image looks good for listing use: ${info.width}x${info.height}.`, false);
    });
    document.getElementById('refreshMediaAssetsButton')?.addEventListener('click', loadAssetLibrary);
    document.getElementById('adminProductImagesForm')?.addEventListener('submit', saveImages);
    mountEl.addEventListener('click', onClick);
    addRow();
    renderQualityScore();
  }

  function reindexRows() {
    document.querySelectorAll('[data-product-image-row]').forEach((row, index) => {
      const title = row.querySelector('strong');
      if (title) title.textContent = `Image Row ${index + 1}`;
      const sort = row.querySelector('[data-field="sort_order"]');
      if (sort) sort.value = String(index);
    });
  }

  function addRow(row = {}) {
    const wrap = document.getElementById('productImagesRows');
    if (!wrap) return;
    wrap.insertAdjacentHTML('beforeend', rowTemplate(row, wrap.children.length));
    reindexRows();
    renderQualityScore();
  }

  async function loadImages() {
    const productId = Number(document.getElementById('productImagesProductId')?.value || 0);
    if (!productId) return setMessage('Enter a valid product ID.', true);
    try {
      setMessage('Loading product images...');
      const response = await window.DDAuth.apiFetch(`/api/admin/product-images?product_id=${encodeURIComponent(productId)}`);
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to load product images.');
      const wrap = document.getElementById('productImagesRows');
      if (wrap) wrap.innerHTML = '';
      const rows = Array.isArray(data.images) ? data.images : [];
      if (!rows.length) addRow();
      rows.forEach((row, index) => addRow({ ...row, sort_order: index }));
      renderQualityScore();
      await loadAssetLibrary();
      setMessage('Product images loaded.');
    } catch (error) {
      setMessage(error.message || 'Failed to load product images.', true);
    }
  }

  async function uploadImage() {
    const productId = Number(document.getElementById('productImagesProductId')?.value || 0);
    if (!productId) return setMessage('Enter a product ID before uploading.', true);
    const fileInput = document.getElementById('productImageUploadInput');
    const file = fileInput?.files?.[0];
    if (!file) return setMessage('Choose an image file first.', true);
    const localInfo = await inspectLocalImageFile(file);
    if (!localInfo.ok) {
      return setMessage(`Use a square or landscape image at least 800x800. Current file is ${localInfo.width}x${localInfo.height}.`, true);
    }
    const isFirstImageUpload = !Array.from(document.querySelectorAll('[data-product-image-row]')).some((row) => String(row.querySelector('[data-field="image_url"]')?.value || '').trim());
    if (isFirstImageUpload && !localInfo.first_image_ok) {
      return setMessage(`First listing image must be at least 1200x1200 and square or landscape. Current file is ${localInfo.width}x${localInfo.height}.`, true);
    }
    try {
      setMessage(`Uploading image ${localInfo.width}x${localInfo.height} (${localInfo.orientation.replace('_',' ')}).`);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('product_id', String(productId));
      formData.append('width_px', String(localInfo.width || ''));
      formData.append('height_px', String(localInfo.height || ''));
      formData.append('image_orientation', String(localInfo.orientation === 'square_or_landscape' ? (localInfo.width === localInfo.height ? 'square' : 'landscape') : 'portrait'));
      const response = await window.DDAuth.apiFetch('/api/admin/media-upload', { method: 'POST', body: formData, headers: {} });
      const data = await response.json();
      if (!response.ok || !data?.ok || !data?.asset?.public_url) throw new Error(data?.error || 'Failed to upload image.');
      addRow({ image_url: data.asset.public_url, alt_text: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '), sort_order: document.querySelectorAll('[data-product-image-row]').length, width_px: localInfo.width, height_px: localInfo.height, image_orientation: (localInfo.orientation === 'square_or_landscape' ? (localInfo.width === localInfo.height ? 'square' : 'landscape') : 'portrait') });
      if (fileInput) fileInput.value = '';
      await loadAssetLibrary();
      setMessage('Image uploaded and added to the list. Save images to attach it to the product.');
    } catch (error) {
      setMessage(error.message || 'Failed to upload image.', true);
    }
  }

  async function loadAssetLibrary() {
    const productId = Number(document.getElementById('productImagesProductId')?.value || 0);
    const listEl = document.getElementById('adminMediaAssetsList');
    if (!listEl) return;
    if (!productId) {
      listEl.textContent = 'Load a product first to browse uploaded media.';
      return;
    }
    try {
      const response = await window.DDAuth.apiFetch(`/api/admin/media-assets?product_id=${encodeURIComponent(productId)}&limit=40`);
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to load media assets.');
      const assets = Array.isArray(data.assets) ? data.assets : [];
      if (!assets.length) {
        listEl.textContent = 'No uploaded assets found for this product yet.';
        return;
      }
      listEl.innerHTML = assets.map((asset) => `
        <div class="card" style="margin-top:8px">
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
            ${asset.public_url ? `<img src="${escapeHtml(asset.public_url)}" alt="${escapeHtml(asset.original_filename || 'asset')}" style="width:72px;height:72px;object-fit:cover;border-radius:8px" />` : ''}
            <div style="flex:1 1 260px">
              <div><strong>${escapeHtml(asset.original_filename || asset.object_key || 'Asset')}</strong></div>
              <div class="small">${escapeHtml(asset.object_key || '')}</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn" type="button" data-add-asset-url="${escapeHtml(asset.public_url || '')}">Use Asset</button>
              <button class="btn" type="button" data-delete-asset-id="${asset.media_asset_id}">Delete Asset</button>
            </div>
          </div>
        </div>`).join('');
    } catch (error) {
      listEl.textContent = error.message || 'Failed to load media assets.';
    }
  }

  function validateFirstImageForSave(rows) {
    const first = Array.isArray(rows) ? rows.find((row) => String(row.image_url || '').trim()) : null;
    if (!first) return { ok: false, message: 'Add a first image before saving product media.' };
    const orientation = String(first.image_orientation || '').trim().toLowerCase();
    const width = Number(first.width_px || 0);
    const height = Number(first.height_px || 0);
    const altText = String(first.alt_text || '').trim();
    const score = Number(first.first_image_score || 0);
    if (!['square', 'landscape'].includes(orientation)) return { ok: false, message: 'First image should be square or landscape before saving.' };
    if (width < 1200 || height < 1200) return { ok: false, message: `First image should be at least 1200x1200. Current first image is ${width || 0}x${height || 0}.` };
    if (altText.length < 12) return { ok: false, message: 'First image needs stronger alt text before saving.' };
    if (score < 70) return { ok: false, message: `First image score is only ${score}%. Improve crop, dimensions, or alt text before saving.` };
    return { ok: true };
  }

  async function saveImages(event) {
    event.preventDefault();
    const productId = Number(document.getElementById('productImagesProductId')?.value || 0);
    if (!productId) return setMessage('Enter a valid product ID.', true);
    try {
      setMessage('Saving product images...');
      const payload = { product_id: productId, images: collectRows() };
      const firstImageCheck = validateFirstImageForSave(payload.images);
      if (!firstImageCheck.ok) throw new Error(firstImageCheck.message);
      const response = await window.DDAuth.apiFetch('/api/admin/product-images', { method: 'POST', body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to save product images.');
      setMessage('Product images saved.');
      document.dispatchEvent(new CustomEvent('dd:product-updated', { detail: { product_id: productId } }));
      renderQualityScore();
      await loadAssetLibrary();
    } catch (error) {
      setMessage(error.message || 'Failed to save product images.', true);
    }
  }

  async function onClick(event) {
    const row = event.target.closest('[data-product-image-row]');
    if (event.target.closest('[data-row-remove]') && row) {
      row.remove();
      if (!document.querySelector('[data-product-image-row]')) addRow();
      reindexRows();
      renderQualityScore();
      return;
    }
    const moveBtn = event.target.closest('[data-row-move]');
    if (moveBtn && row) {
      const direction = moveBtn.getAttribute('data-row-move');
      if (direction === 'up' && row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling);
      if (direction === 'down' && row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row);
      reindexRows();
      renderQualityScore();
      return;
    }
    const addAssetBtn = event.target.closest('[data-add-asset-url]');
    if (addAssetBtn) {
      addRow({ image_url: addAssetBtn.getAttribute('data-add-asset-url') || '', sort_order: document.querySelectorAll('[data-product-image-row]').length });
      reindexRows();
      return;
    }
    const deleteAssetBtn = event.target.closest('[data-delete-asset-id]');
    if (deleteAssetBtn) {
      const assetId = Number(deleteAssetBtn.getAttribute('data-delete-asset-id') || 0);
      if (!assetId || !window.confirm('Delete this uploaded asset from R2 and the asset library?')) return;
      try {
        setMessage('Deleting media asset...');
        const response = await window.DDAuth.apiFetch(`/api/admin/media-assets?media_asset_id=${encodeURIComponent(assetId)}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to delete media asset.');
        await loadAssetLibrary();
        setMessage('Media asset deleted.');
      } catch (error) {
        setMessage(error.message || 'Failed to delete media asset.', true);
      }
    }
  }

  document.addEventListener('dd:admin-ready', (event) => {
    if (!event?.detail?.ok) return;
    render();
  });

  render();
});
