// File: /public/js/admin-product-images.js
// Brief description: Adds a product media editor to the admin area so ordered image URLs,
// direct uploads, asset-library browsing, delete/reorder actions, and annotation metadata can be managed together.


document.addEventListener('DOMContentLoaded', () => {
  const mountEl = document.getElementById('productMediaAdminMount');
  if (!mountEl || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  let rendered = false;
  let currentScoreHistory = [];
  let latestSavedSummary = null;

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

  function clamp(value, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.min(max, Math.max(min, numeric));
  }

  function normalizeText(value) {
    return String(value || '').trim();
  }

  const IMAGE_ROLE_OPTIONS = [
    ['hero_front', 'Hero/front'],
    ['detail_texture', 'Detail/texture'],
    ['scale_context', 'Scale/context'],
    ['back_side', 'Back/side'],
    ['process_story', 'Process/story'],
    ['packaging_pickup', 'Packaging/pickup'],
    ['material_tool_proof', 'Material/tool proof'],
    ['gallery_support', 'Gallery/support']
  ];

  const PUBLIC_USE_OPTIONS = [
    ['internal_review', 'Internal review'],
    ['product_page_ok', 'Product page OK'],
    ['social_ok', 'Social OK'],
    ['all_public_ok', 'All public OK'],
    ['consent_needed', 'Consent needed'],
    ['blocked', 'Blocked']
  ];

  function normalizeRole(value, index = 0) {
    const clean = normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return IMAGE_ROLE_OPTIONS.some(([key]) => key === clean) ? clean : index === 0 ? 'hero_front' : 'gallery_support';
  }

  function roleLabel(value) {
    const found = IMAGE_ROLE_OPTIONS.find(([key]) => key === value);
    return found ? found[1] : 'Gallery/support';
  }

  function optionList(options, selected) {
    return options.map(([value, label]) => `<option value="${escapeHtml(value)}" ${String(selected || '') === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
  }

  function toOptionalNumber(value) {
    if (value == null || value === '') return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function toOptionalPercent(value) {
    if (value == null || value === '') return null;
    return Math.round(clamp(value, 0, 100));
  }

  function getOrientation(width, height) {
    if (width <= 0 || height <= 0) return 'unknown';
    if (Math.abs(width - height) <= Math.max(24, width * 0.03)) return 'square';
    return width > height ? 'landscape' : 'portrait';
  }

  function getShotStyleBonus(style) {
    switch (String(style || '').toLowerCase()) {
      case 'lifestyle': return 6;
      case 'process': return 4;
      case 'detail': return 3;
      case 'scale_reference': return 2;
      case 'packaging': return 1;
      default: return 0;
    }
  }

  function computeCropDrivenFill(row = {}) {
    if (row.crop_width == null || row.crop_height == null) return null;
    const area = clamp(Number(row.crop_width || 0), 0, 1) * clamp(Number(row.crop_height || 0), 0, 1);
    if (!Number.isFinite(area) || area <= 0) return null;
    const centeredX = row.crop_x == null ? 0.5 : clamp(Number(row.crop_x || 0) + Number(row.crop_width || 0) / 2, 0, 1);
    const centeredY = row.crop_y == null ? 0.5 : clamp(Number(row.crop_y || 0) + Number(row.crop_height || 0) / 2, 0, 1);
    const centerPenalty = (Math.abs(centeredX - 0.5) + Math.abs(centeredY - 0.5)) * 18;
    const areaPenalty = Math.abs(area - 0.68) * 70;
    return Math.round(clamp(92 - areaPenalty - centerPenalty, 20, 96));
  }

  function computeHeuristicSubjectFill(metrics = {}) {
    const cropFill = computeCropDrivenFill(metrics);
    if (cropFill != null) return cropFill;
    const backgroundScore = Number(metrics.background_consistency_score || 0);
    const centerContrast = Number(metrics.center_contrast_score || 0);
    const borderContrast = Number(metrics.border_contrast_score || 0);
    const estimate = 45 + ((centerContrast - borderContrast) * 0.9) + (backgroundScore >= 70 ? 14 : backgroundScore >= 50 ? 8 : 2);
    return Math.round(clamp(estimate, 20, 92));
  }

  function computeDuplicatePenalty(rows, index, angleGroup) {
    const normalized = normalizeText(angleGroup).toLowerCase();
    if (!normalized) return 0;
    let priorDuplicates = 0;
    for (let i = 0; i < index; i += 1) {
      if (normalizeText(rows[i]?.angle_group).toLowerCase() === normalized) priorDuplicates += 1;
    }
    return Math.min(16, priorDuplicates * 8);
  }

  function computeRowScore(row = {}, index = 0, rows = []) {
    const width = Number(row.width_px || 0);
    const height = Number(row.height_px || 0);
    const orientation = String(row.image_orientation || '').toLowerCase();
    const altLength = normalizeText(row.alt_text).length;
    const hasCrop = row.crop_x != null && row.crop_y != null && row.crop_width != null && row.crop_height != null;
    const background = toOptionalPercent(row.background_consistency_score) ?? 0;
    const subjectFill = toOptionalPercent(row.subject_fill_score) ?? computeHeuristicSubjectFill(row);
    const sharpness = toOptionalPercent(row.sharpness_score) ?? 0;
    const brightness = toOptionalPercent(row.brightness_score) ?? 0;
    const contrast = toOptionalPercent(row.contrast_score) ?? 0;
    const exposureAndContrast = Math.round((brightness + contrast) / 2);
    const duplicatePenalty = computeDuplicatePenalty(rows, index, row.angle_group);

    let score = 0;
    if (normalizeText(row.image_url)) score += 8;
    if (altLength >= 12) score += 6;
    else if (altLength >= 5) score += 3;
    if (width >= 1200 && height >= 1200) score += 10;
    else if (width >= 800 && height >= 800) score += 6;
    if (index === 0 && ['square', 'landscape'].includes(orientation)) score += 8;
    else if (index > 0 && ['square', 'landscape', 'portrait'].includes(orientation)) score += 4;
    if (hasCrop) score += 8;

    score += background * 0.16;
    score += subjectFill * 0.16;
    score += sharpness * 0.18;
    score += exposureAndContrast * 0.14;
    score += getShotStyleBonus(row.shot_style);
    score -= duplicatePenalty;

    if (index === 0 && orientation === 'portrait') score -= 8;
    if (index === 0 && (width < 1200 || height < 1200)) score -= 6;

    return Math.round(clamp(score, 0, 100));
  }

  function summarizeImageGuidance(metrics = {}, isLeadCandidate = false) {
    const warnings = [];
    const width = Number(metrics.width || metrics.width_px || 0);
    const height = Number(metrics.height || metrics.height_px || 0);
    const orientation = String(metrics.orientation || metrics.image_orientation || '').toLowerCase();
    const merchandisingScore = Number(metrics.merchandising_score || 0);
    const sharpness = Number(metrics.sharpness_score || 0);
    const background = Number(metrics.background_consistency_score || 0);
    const brightness = Number(metrics.brightness_score || 0);
    const contrast = Number(metrics.contrast_score || 0);
    const fill = Number(metrics.subject_fill_score || 0);

    if (!['square', 'landscape'].includes(orientation)) warnings.push('portrait crops are weaker for the featured image');
    if (width < 800 || height < 800) warnings.push('image is under 800×800');
    if (isLeadCandidate && (width < 1200 || height < 1200)) warnings.push('featured image target is 1200×1200 or larger');
    if (sharpness < 45) warnings.push('image may look soft or slightly blurred');
    if (background < 45) warnings.push('background edges look busy for a clean listing shot');
    if (brightness < 40 || contrast < 35) warnings.push('brightness/contrast may need correction');
    if (fill < 45) warnings.push('subject may not fill the frame strongly enough');
    if (merchandisingScore < 70) warnings.push('merchandising score is below preferred publish range');
    return warnings;
  }

  function analyzeImagePixels(img, width, height) {
    const maxSide = 220;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(24, Math.round(width * scale));
    canvas.height = Math.max(24, Math.round(height * scale));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const luminance = new Float32Array(canvas.width * canvas.height);

    let totalLum = 0;
    let pixelIndex = 0;
    let borderLum = 0;
    let borderCount = 0;
    let borderWhiteCount = 0;
    const borderLumValues = [];
    const centerLumValues = [];
    const borderThicknessX = Math.max(2, Math.round(canvas.width * 0.12));
    const borderThicknessY = Math.max(2, Math.round(canvas.height * 0.12));
    const centerStartX = Math.round(canvas.width * 0.25);
    const centerEndX = Math.round(canvas.width * 0.75);
    const centerStartY = Math.round(canvas.height * 0.25);
    const centerEndY = Math.round(canvas.height * 0.75);

    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const offset = (y * canvas.width + x) * 4;
        const r = imageData[offset];
        const g = imageData[offset + 1];
        const b = imageData[offset + 2];
        const lum = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
        luminance[pixelIndex] = lum;
        totalLum += lum;

        const isBorder = x < borderThicknessX || y < borderThicknessY || x >= canvas.width - borderThicknessX || y >= canvas.height - borderThicknessY;
        const isCenter = x >= centerStartX && x <= centerEndX && y >= centerStartY && y <= centerEndY;
        if (isBorder) {
          borderLum += lum;
          borderCount += 1;
          borderLumValues.push(lum);
          if (r >= 220 && g >= 220 && b >= 220) borderWhiteCount += 1;
        }
        if (isCenter) centerLumValues.push(lum);
        pixelIndex += 1;
      }
    }

    const avgLum = totalLum / Math.max(1, luminance.length);
    let variance = 0;
    for (let i = 0; i < luminance.length; i += 1) {
      variance += Math.pow(luminance[i] - avgLum, 2);
    }
    const contrastStd = Math.sqrt(variance / Math.max(1, luminance.length));

    let gradientSum = 0;
    let gradientCount = 0;
    for (let y = 0; y < canvas.height - 1; y += 1) {
      for (let x = 0; x < canvas.width - 1; x += 1) {
        const i = y * canvas.width + x;
        const right = i + 1;
        const down = i + canvas.width;
        gradientSum += Math.abs(luminance[i] - luminance[right]) + Math.abs(luminance[i] - luminance[down]);
        gradientCount += 2;
      }
    }
    const sharpnessRaw = gradientSum / Math.max(1, gradientCount);

    function std(values) {
      if (!values.length) return 0;
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      const sumSquares = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0);
      return Math.sqrt(sumSquares / values.length);
    }

    const edgeBrightness = borderLum / Math.max(1, borderCount);
    const edgeStd = std(borderLumValues);
    const centerStd = std(centerLumValues);
    const borderStd = std(borderLumValues);
    const whiteRatio = borderWhiteCount / Math.max(1, borderCount);

    const brightnessScore = Math.round(clamp(100 - Math.abs(avgLum - 205) * 1.15, 0, 100));
    const contrastScore = Math.round(clamp(100 - Math.abs(contrastStd - 52) * 1.75, 0, 100));
    const sharpnessScore = Math.round(clamp((sharpnessRaw - 6) * 5.3, 0, 100));
    const backgroundConsistencyScore = Math.round(clamp((whiteRatio * 100) - (edgeStd * 0.65) + Math.max(0, edgeBrightness - 210) * 0.18, 0, 100));
    const subjectFillScore = computeHeuristicSubjectFill({
      background_consistency_score: backgroundConsistencyScore,
      center_contrast_score: centerStd,
      border_contrast_score: borderStd
    });

    return {
      width,
      height,
      ratio: height > 0 ? (width / height) : 0,
      orientation: getOrientation(width, height),
      brightness_score: brightnessScore,
      contrast_score: contrastScore,
      sharpness_score: sharpnessScore,
      background_consistency_score: backgroundConsistencyScore,
      subject_fill_score: subjectFillScore,
      center_contrast_score: Math.round(centerStd),
      border_contrast_score: Math.round(borderStd)
    };
  }

  async function inspectLocalImageFile(file) {
    return new Promise((resolve) => {
      try {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          const width = Number(img.naturalWidth || 0);
          const height = Number(img.naturalHeight || 0);
          const metrics = analyzeImagePixels(img, width, height);
          URL.revokeObjectURL(objectUrl);
          const rowForScore = {
            image_url: file.name || 'upload',
            alt_text: uploadFile.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
            width_px: metrics.width,
            height_px: metrics.height,
            image_orientation: metrics.orientation,
            background_consistency_score: metrics.background_consistency_score,
            subject_fill_score: metrics.subject_fill_score,
            sharpness_score: metrics.sharpness_score,
            brightness_score: metrics.brightness_score,
            contrast_score: metrics.contrast_score,
            shot_style: 'record'
          };
          const merchandisingScore = computeRowScore(rowForScore, 0, [rowForScore]);
          resolve({
            ...metrics,
            ok: metrics.width >= 800 && metrics.height >= 800 && ['square', 'landscape'].includes(metrics.orientation),
            first_image_ok: metrics.width >= 1200 && metrics.height >= 1200 && ['square', 'landscape'].includes(metrics.orientation),
            merchandising_score: merchandisingScore
          });
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve({ width: 0, height: 0, ratio: 0, orientation: 'unknown', ok: false, first_image_ok: false, merchandising_score: 0 });
        };
        img.src = objectUrl;
      } catch {
        resolve({ width: 0, height: 0, ratio: 0, orientation: 'unknown', ok: false, first_image_ok: false, merchandising_score: 0 });
      }
    });
  }


  function uploadEditorOptions() {
    const preset = document.getElementById('productImageEditPreset')?.value || 'original';
    const maxSide = clamp(document.getElementById('productImageResizeMax')?.value || 1600, 800, 2600);
    const quality = clamp((Number(document.getElementById('productImageQuality')?.value || 88) / 100), 0.55, 0.95);
    return { preset, maxSide: Math.round(maxSide), quality };
  }

  function imageFileToImage(file) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not read the selected image.'));
      };
      img.src = objectUrl;
    });
  }

  function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.88) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not prepare edited upload.')), type, quality);
    });
  }

  function cropForPreset(width, height, preset) {
    if (preset === 'square_1200') {
      const side = Math.min(width, height);
      return { sx: Math.round((width - side) / 2), sy: Math.round((height - side) / 2), sw: side, sh: side, outW: 1200, outH: 1200, label: 'square 1200×1200 crop' };
    }
    if (preset === 'landscape_1600') {
      const targetRatio = 4 / 3;
      let sw = width;
      let sh = Math.round(width / targetRatio);
      if (sh > height) {
        sh = height;
        sw = Math.round(height * targetRatio);
      }
      const outW = Math.min(1600, Math.round(sw));
      const outH = Math.round(outW / targetRatio);
      return { sx: Math.round((width - sw) / 2), sy: Math.round((height - sh) / 2), sw, sh, outW, outH, label: 'landscape 4:3 crop' };
    }
    if (preset === 'max_side') {
      const scale = Math.min(1, uploadEditorOptions().maxSide / Math.max(width, height));
      return { sx: 0, sy: 0, sw: width, sh: height, outW: Math.round(width * scale), outH: Math.round(height * scale), label: 'resized original ratio' };
    }
    return { sx: 0, sy: 0, sw: width, sh: height, outW: width, outH: height, label: 'original' };
  }

  async function buildEditedUpload(file, previewOnly = false) {
    const options = uploadEditorOptions();
    if (options.preset === 'original') return { file, edited: false, crop: null, resize: null, note: 'Original file kept.' };
    const img = await imageFileToImage(file);
    const sourceWidth = Number(img.naturalWidth || 0);
    const sourceHeight = Number(img.naturalHeight || 0);
    const crop = cropForPreset(sourceWidth, sourceHeight, options.preset);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(crop.outW));
    canvas.height = Math.max(1, Math.round(crop.outH));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, canvas.width, canvas.height);

    const preview = document.getElementById('productImageEditPreview');
    if (preview) {
      preview.width = Math.min(360, canvas.width);
      preview.height = Math.round(preview.width * (canvas.height / canvas.width));
      const previewCtx = preview.getContext('2d');
      previewCtx.clearRect(0, 0, preview.width, preview.height);
      previewCtx.drawImage(canvas, 0, 0, preview.width, preview.height);
    }
    if (previewOnly) return { file, edited: true, crop, resize: { width: canvas.width, height: canvas.height }, note: crop.label };

    const blob = await canvasToBlob(canvas, 'image/jpeg', options.quality);
    const cleanName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'product-image';
    const editedFile = new File([blob], `${cleanName}-${options.preset}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
    return {
      file: editedFile,
      edited: true,
      crop: {
        x: crop.sx / sourceWidth,
        y: crop.sy / sourceHeight,
        width: crop.sw / sourceWidth,
        height: crop.sh / sourceHeight
      },
      resize: { width: canvas.width, height: canvas.height },
      note: crop.label
    };
  }



  async function loadDerivativeHistoryForRow(rowEl) {
    const imageId = Number(rowEl?.getAttribute('data-product-image-id') || rowEl?.querySelector('[data-field="product_image_id"]')?.value || 0);
    const target = rowEl?.querySelector('[data-derivative-history]');
    if (!target) return;
    if (!imageId) { target.textContent = 'Save this image row before derivative history is available.'; return; }
    target.textContent = 'Loading derivative history...';
    try {
      const response = await window.DDAuth.apiFetch(`/api/admin/product-image-derivatives?product_image_id=${encodeURIComponent(imageId)}`);
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Derivative history failed.');
      const rows = Array.isArray(data.derivatives) ? data.derivatives.slice(0, 6) : [];
      target.innerHTML = rows.length ? rows.map((item) => `<div class="status-note info" style="margin-top:6px"><strong>${escapeHtml(item.derivative_kind || 'variant')}</strong> ${escapeHtml(item.target_width || '')}×${escapeHtml(item.target_height || '')}<br><a href="${escapeHtml(item.derivative_url || '#')}" target="_blank" rel="noopener">${escapeHtml(item.derivative_status || 'preview')}</a><br><span>${escapeHtml(item.created_at || item.updated_at || '')}</span></div>`).join('') : 'No derivative records yet.';
    } catch (error) { target.textContent = error.message || 'Derivative history failed.'; }
  }

  async function queueDerivativeForRow(rowEl) {
    const imageId = Number(rowEl?.getAttribute('data-product-image-id') || rowEl?.querySelector('[data-field="product_image_id"]')?.value || 0);
    const productId = Number(document.getElementById('productImagesProductId')?.value || 0);
    const imageUrl = normalizeText(rowEl?.querySelector('[data-field="image_url"]')?.value || '');
    if (!imageId) { setMessage('Save this image row first, then queue a derivative crop preview.', true); return; }
    if (!imageUrl) { setMessage('Image URL is required before derivative preview.', true); return; }
    const body = {
      product_image_id: imageId,
      product_id: productId,
      derivative_kind: 'storefront_square',
      target_width: 1200,
      target_height: 1200,
      crop_x: toOptionalNumber(String((rowEl.querySelector('[data-field="crop_pair"]')?.value || '').split(',')[0] || '').trim()) ?? 0,
      crop_y: toOptionalNumber(String((rowEl.querySelector('[data-field="crop_pair"]')?.value || '').split(',')[1] || '').trim()) ?? 0,
      crop_width: toOptionalNumber(String((rowEl.querySelector('[data-field="crop_size"]')?.value || '').split(',')[0] || '').trim()) ?? 1,
      crop_height: toOptionalNumber(String((rowEl.querySelector('[data-field="crop_size"]')?.value || '').split(',')[1] || '').trim()) ?? 1,
      notes: 'Queued from Product Media Workflow.'
    };
    const response = await window.DDAuth.apiFetch('/api/admin/product-image-derivatives', { method: 'POST', body: JSON.stringify(body) });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Derivative preview failed.');
    setMessage(data.message || 'Derivative preview queued.');
    await loadDerivativeHistoryForRow(rowEl);
  }

  function formatBytes(value) {
    const bytes = Number(value || 0);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  async function refreshUploadPreview() {
    const file = document.getElementById('productImageUploadInput')?.files?.[0];
    const note = document.getElementById('productImageEditNote');
    const preview = document.getElementById('productImageEditPreview');
    if (!file) {
      if (note) note.textContent = 'Choose an image to preview crop/resize output.';
      if (preview) {
        const ctx = preview.getContext('2d');
        ctx.clearRect(0, 0, preview.width, preview.height);
      }
      return null;
    }
    try {
      const edited = await buildEditedUpload(file, true);
      const fullEdit = edited.edited ? await buildEditedUpload(file, false) : { file, edited: false };
      const analysisFile = fullEdit.file || file;
      const info = await inspectLocalImageFile(analysisFile);
      const originalSize = formatBytes(file.size || 0);
      const outputSize = formatBytes(analysisFile.size || file.size || 0);
      const savings = file.size && analysisFile.size ? Math.max(0, Math.round((1 - (analysisFile.size / file.size)) * 100)) : 0;
      if (note) note.textContent = `${edited.note || 'Original'} • output ${info.width}×${info.height} • ${info.orientation} • ${originalSize} → ${outputSize}${savings ? ` (${savings}% smaller)` : ''} • estimated score ${info.merchandising_score}%.`;
      return info;
    } catch (error) {
      if (note) note.textContent = error.message || 'Could not preview this edit.';
      return null;
    }
  }

  function cropBoxStyle(row = {}) {
    const x = clamp(Number(row.crop_x ?? 0.08), 0, 1);
    const y = clamp(Number(row.crop_y ?? 0.08), 0, 1);
    const w = clamp(Number(row.crop_width ?? 0.84), 0.05, 1);
    const h = clamp(Number(row.crop_height ?? 0.84), 0.05, 1);
    return `left:${Math.round(x*100)}%;top:${Math.round(y*100)}%;width:${Math.round(w*100)}%;height:${Math.round(h*100)}%`;
  }

  function rowTemplate(row = {}, index = 0) {
    const shotStyle = normalizeText(row.shot_style || 'record').toLowerCase() || 'record';
    return `
      <div class="card product-image-sortable-row" data-product-image-row draggable="true" style="margin-top:12px">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap">
          <strong>Image Row ${index + 1}</strong>
          ${row.image_url ? `<button class="product-image-focal-thumb" type="button" data-set-focal-from-thumb title="Click the image to set the focal point"><img src="${escapeHtml(row.image_url)}" alt="${escapeHtml(row.alt_text || 'Product image preview')}"/><span class="product-image-focal-dot" style="left:${escapeHtml(String(Math.round(Number(row.focal_point_x ?? 0.5)*100)))}%;top:${escapeHtml(String(Math.round(Number(row.focal_point_y ?? 0.5)*100)))}%"></span><span class="product-image-crop-preview" style="${escapeHtml(cropBoxStyle(row))}"><span class="product-image-crop-handle nw" data-crop-handle="nw"></span><span class="product-image-crop-handle ne" data-crop-handle="ne"></span><span class="product-image-crop-handle sw" data-crop-handle="sw"></span><span class="product-image-crop-handle se" data-crop-handle="se"></span></span></button>` : ''}
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <span class="small" data-score-display>${escapeHtml(String(row.merchandising_score ?? row.first_image_score ?? 0))}% merch</span>
            <span class="small" data-role-display>${escapeHtml(roleLabel(normalizeRole(row.image_role, index)))}</span>
            <button class="btn" type="button" data-row-drag-handle title="Drag this image to reorder">↕ drag</button>
            <button class="btn" type="button" data-row-move="up">↑</button>
            <button class="btn" type="button" data-row-move="down">↓</button>
            <button class="btn" type="button" data-row-set-square-crop>Set 1:1 crop</button><button class="btn" type="button" data-row-queue-derivative>Queue R2 crop file</button><button class="btn" type="button" data-row-load-derivatives>Derivative history</button>
            <button class="btn" type="button" data-row-remove title="Remove this image row. Click Save Images to confirm the delete.">Delete image row</button>
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
        <div class="grid cols-4" style="gap:12px;margin-top:12px">
          <div><label class="small">Image role</label><select data-field="image_role">${optionList(IMAGE_ROLE_OPTIONS, normalizeRole(row.image_role, index))}</select></div>
          <div><label class="small">Public use status</label><select data-field="public_use_status">${optionList(PUBLIC_USE_OPTIONS, row.public_use_status || 'internal_review')}</select></div>
          <div><label class="small">Consent record ID</label><input type="number" data-field="consent_record_id" min="1" step="1" value="${escapeHtml(row.consent_record_id ?? '')}" placeholder="optional" /></div>
          <div><label class="small">Role/review notes</label><input type="text" data-field="role_review_notes" value="${escapeHtml(row.role_review_notes || '')}" placeholder="Consent, crop, or usage note" /></div>
        </div>
        <details class="product-image-advanced-details">
          <summary>Advanced crop, quality, and scoring fields</summary>
          <div class="grid cols-3" style="gap:12px;margin-top:12px">
          <div><label class="small">Focal X</label><input type="number" data-field="focal_point_x" min="0" max="1" step="0.01" value="${escapeHtml(row.focal_point_x ?? '')}" /></div>
          <div><label class="small">Focal Y</label><input type="number" data-field="focal_point_y" min="0" max="1" step="0.01" value="${escapeHtml(row.focal_point_y ?? '')}" /></div>
          <div><label class="small">Notes</label><input type="text" data-field="annotation_notes" value="${escapeHtml(row.annotation_notes || '')}" placeholder="Lead angle, crop intent, background notes" /></div>
        </div>
        <div class="grid cols-5" style="gap:12px;margin-top:12px">
          <div><label class="small">Width px</label><input type="number" data-field="width_px" min="0" step="1" value="${escapeHtml(row.width_px ?? '')}" /></div>
          <div><label class="small">Height px</label><input type="number" data-field="height_px" min="0" step="1" value="${escapeHtml(row.height_px ?? '')}" /></div>
          <div><label class="small">Orientation</label><input type="text" data-field="image_orientation" value="${escapeHtml(row.image_orientation || '')}" placeholder="square / landscape / portrait" /></div>
          <div><label class="small">Crop X / Y</label><input type="text" data-field="crop_pair" value="${escapeHtml(((row.crop_x ?? '') !== '' || (row.crop_y ?? '') !== '') ? `${row.crop_x ?? ''},${row.crop_y ?? ''}` : '')}" placeholder="0.05,0.10" /></div>
          <div><label class="small">Crop W / H</label><input type="text" data-field="crop_size" value="${escapeHtml(((row.crop_width ?? '') !== '' || (row.crop_height ?? '') !== '') ? `${row.crop_width ?? ''},${row.crop_height ?? ''}` : '')}" placeholder="0.90,0.80" /></div>
        </div>
        <div class="grid cols-5" style="gap:12px;margin-top:12px">
          <div><label class="small">Background</label><input type="number" data-field="background_consistency_score" min="0" max="100" step="1" value="${escapeHtml(row.background_consistency_score ?? '')}" placeholder="0-100" /></div>
          <div><label class="small">Subject Fill</label><input type="number" data-field="subject_fill_score" min="0" max="100" step="1" value="${escapeHtml(row.subject_fill_score ?? '')}" placeholder="0-100" /></div>
          <div><label class="small">Sharpness</label><input type="number" data-field="sharpness_score" min="0" max="100" step="1" value="${escapeHtml(row.sharpness_score ?? '')}" placeholder="0-100" /></div>
          <div><label class="small">Brightness</label><input type="number" data-field="brightness_score" min="0" max="100" step="1" value="${escapeHtml(row.brightness_score ?? '')}" placeholder="0-100" /></div>
          <div><label class="small">Contrast</label><input type="number" data-field="contrast_score" min="0" max="100" step="1" value="${escapeHtml(row.contrast_score ?? '')}" placeholder="0-100" /></div>
        </div>
        <div class="grid cols-6" style="gap:12px;margin-top:12px">
          <div>
            <label class="small">Angle Group</label>
            <input type="text" data-field="angle_group" value="${escapeHtml(row.angle_group || '')}" placeholder="front / side / detail / overhead" />
          </div>
          <div>
            <label class="small">Shot Style</label>
            <select data-field="shot_style">
              <option value="record" ${shotStyle === 'record' ? 'selected' : ''}>Record</option>
              <option value="detail" ${shotStyle === 'detail' ? 'selected' : ''}>Detail</option>
              <option value="lifestyle" ${shotStyle === 'lifestyle' ? 'selected' : ''}>Lifestyle</option>
              <option value="process" ${shotStyle === 'process' ? 'selected' : ''}>Process</option>
              <option value="packaging" ${shotStyle === 'packaging' ? 'selected' : ''}>Packaging</option>
              <option value="scale_reference" ${shotStyle === 'scale_reference' ? 'selected' : ''}>Scale reference</option>
            </select>
          </div>
          <div><label class="small">Merchandising Score</label><input type="number" data-field="merchandising_score_display" value="${escapeHtml(String(row.merchandising_score ?? row.first_image_score ?? ''))}" readonly /></div>
          <div><label class="small">Lead Image Gate</label><input type="text" data-field="lead_gate_hint" value="${escapeHtml(index === 0 ? 'Lead candidate' : 'Gallery/support image')}" readonly /></div>
          <div>
            <label class="small">Low-score override reason</label>
            <select data-field="merchandising_override_reason">
              <option value="" ${!row.merchandising_override_reason ? 'selected' : ''}>None</option>
              <option value="storytelling" ${row.merchandising_override_reason === 'storytelling' ? 'selected' : ''}>Storytelling</option>
              <option value="process_context" ${row.merchandising_override_reason === 'process_context' ? 'selected' : ''}>Process context</option>
              <option value="lifestyle_context" ${row.merchandising_override_reason === 'lifestyle_context' ? 'selected' : ''}>Lifestyle context</option>
              <option value="packaging_reference" ${row.merchandising_override_reason === 'packaging_reference' ? 'selected' : ''}>Packaging reference</option>
              <option value="scale_reference" ${row.merchandising_override_reason === 'scale_reference' ? 'selected' : ''}>Scale reference</option>
            </select>
          </div>
          <div><label class="small">Override note</label><input type="text" data-field="merchandising_override_note" value="${escapeHtml(row.merchandising_override_note || '')}" placeholder="Why keep this weaker image?" /></div>
        </div>
        </details>
      </div>`;
  }

  function collectRowsBase() {
    return Array.from(document.querySelectorAll('[data-product-image-row]')).map((row, index) => {
      const value = (field) => row.querySelector(`[data-field="${field}"]`)?.value ?? '';
      return {
        image_url: normalizeText(value('image_url')),
        alt_text: normalizeText(value('alt_text')),
        image_title: normalizeText(value('image_title')),
        caption: normalizeText(value('caption')),
        sort_order: index,
        image_role: normalizeRole(value('image_role'), index),
        public_use_status: normalizeText(value('public_use_status')) || 'internal_review',
        consent_record_id: toOptionalNumber(value('consent_record_id')),
        role_review_notes: normalizeText(value('role_review_notes')),
        focal_point_x: toOptionalNumber(value('focal_point_x')),
        focal_point_y: toOptionalNumber(value('focal_point_y')),
        annotation_notes: normalizeText(value('annotation_notes')),
        width_px: toOptionalNumber(value('width_px')),
        height_px: toOptionalNumber(value('height_px')),
        image_orientation: normalizeText(value('image_orientation')),
        crop_x: toOptionalNumber(String((value('crop_pair') || '').split(',')[0] || '').trim()),
        crop_y: toOptionalNumber(String((value('crop_pair') || '').split(',')[1] || '').trim()),
        crop_width: toOptionalNumber(String((value('crop_size') || '').split(',')[0] || '').trim()),
        crop_height: toOptionalNumber(String((value('crop_size') || '').split(',')[1] || '').trim()),
        background_consistency_score: toOptionalPercent(value('background_consistency_score')),
        subject_fill_score: toOptionalPercent(value('subject_fill_score')),
        sharpness_score: toOptionalPercent(value('sharpness_score')),
        brightness_score: toOptionalPercent(value('brightness_score')),
        contrast_score: toOptionalPercent(value('contrast_score')),
        angle_group: normalizeText(value('angle_group')),
        shot_style: normalizeText(value('shot_style')) || 'record',
        merchandising_override_reason: normalizeText(value('merchandising_override_reason')),
        merchandising_override_note: normalizeText(value('merchandising_override_note'))
      };
    });
  }

  function decorateRows(rows = []) {
    return rows.map((row, index) => {
      const score = computeRowScore(row, index, rows);
      return {
        ...row,
        merchandising_score: score,
        first_image_score: score
      };
    });
  }

  function collectRows() {
    return decorateRows(collectRowsBase()).filter((row) => row.image_url);
  }

  function syncRowComputedScores() {
    const baseRows = collectRowsBase();
    const rows = decorateRows(baseRows);
    document.querySelectorAll('[data-product-image-row]').forEach((rowEl, index) => {
      const score = rows[index]?.merchandising_score ?? 0;
      const scoreDisplay = rowEl.querySelector('[data-score-display]');
      if (scoreDisplay) scoreDisplay.textContent = `${score}% merch`;
      const scoreInput = rowEl.querySelector('[data-field="merchandising_score_display"]');
      if (scoreInput) scoreInput.value = String(score);
      const hintInput = rowEl.querySelector('[data-field="lead_gate_hint"]');
      if (hintInput) {
        const warnings = summarizeImageGuidance(rows[index] || {}, index === 0);
        hintInput.value = index === 0 ? (warnings[0] || 'Lead image looks usable') : (warnings[0] || 'Support image looks usable');
      }
    });
  }

  function formatTrendDelta(current, previous) {
    const currentValue = Number(current);
    const previousValue = Number(previous);
    if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue)) return '';
    const delta = currentValue - previousValue;
    if (delta === 0) return 'flat';
    return `${delta > 0 ? '+' : ''}${delta}`;
  }

  function renderQualityScore() {
    syncRowComputedScores();
    const rows = collectRows();
    const mount = document.getElementById('adminProductImagesQuality');
    if (!mount) return;
    const imageCount = rows.length;
    const altCoverage = rows.filter((row) => normalizeText(row.alt_text).length >= 5).length;
    const firstImage = rows[0] || null;
    const firstImageScore = firstImage ? Number(firstImage.merchandising_score || firstImage.first_image_score || 0) : 0;
    const overallScore = rows.length ? Math.round(rows.reduce((sum, row) => sum + Number(row.merchandising_score || 0), 0) / rows.length) : 0;
    const duplicateAngleGroups = rows.reduce((sum, row, index) => sum + (computeDuplicatePenalty(rows, index, row.angle_group) > 0 ? 1 : 0), 0);
    const overriddenGalleryImages = rows.filter((row, index) => index > 0 && normalizeText(row.merchandising_override_reason)).length;
    const weakUnapprovedGalleryImages = rows.filter((row, index) => index > 0 && Number(row.merchandising_score || row.first_image_score || 0) < 64 && !normalizeText(row.merchandising_override_reason)).length;
    const firstOrientation = String(firstImage?.image_orientation || '').toLowerCase();
    const firstWarnings = firstImage ? summarizeImageGuidance(firstImage, true) : ['Choose a first image before publish.'];
    const roleCounts = rows.reduce((acc, row, index) => { const key = normalizeRole(row.image_role, index); acc[key] = Number(acc[key] || 0) + 1; return acc; }, {});
    const roleSummary = Object.entries(roleCounts).map(([key, count]) => `${roleLabel(key)}: ${count}`).join(' • ');
    const consentNeeded = rows.filter((row) => ['consent_needed', 'blocked'].includes(normalizeText(row.public_use_status))).length;
    const lastSaved = latestSavedSummary || currentScoreHistory[0] || null;
    const priorSaved = currentScoreHistory[1] || null;
    const draftLeadTrend = lastSaved ? formatTrendDelta(firstImageScore, Number(lastSaved.lead_image_score || 0)) : '';
    const draftGalleryTrend = lastSaved ? formatTrendDelta(overallScore, Number(lastSaved.gallery_merchandising_score || 0)) : '';
    const savedLeadTrend = lastSaved && priorSaved ? formatTrendDelta(Number(lastSaved.lead_image_score || 0), Number(priorSaved.lead_image_score || 0)) : '';
    const savedGalleryTrend = lastSaved && priorSaved ? formatTrendDelta(Number(lastSaved.gallery_merchandising_score || 0), Number(priorSaved.gallery_merchandising_score || 0)) : '';
    const recommendedRoles = ['hero_front', 'detail_texture', 'scale_context', 'back_side', 'process_story', 'packaging_pickup', 'material_tool_proof'];
    const rolePreview = rows.map((row, index) => `${index + 1}. ${roleLabel(normalizeRole(row.image_role || recommendedRoles[index] || 'gallery_support', index))}`).join(' • ');
    const guidance = [
      'Aim for at least 3 images.',
      'Use a square or landscape first image.',
      'Keep the first image bright, sharp, and clean around the edges.',
      'Spread angle groups so the gallery is not mostly duplicates.'
    ];
    mount.innerHTML = `
      <h4 style="margin-top:0">Photo merchandising before publish</h4>
      <div class="small">${imageCount} image(s) loaded • ${altCoverage} image(s) with usable alt text • average merchandising score ${overallScore}% • lead image score ${firstImageScore}% • duplicate-angle rows ${duplicateAngleGroups}</div>
      <div class="small" style="margin-top:6px">Recommended role preview before save: ${escapeHtml(rolePreview || 'Add images to preview roles.')}</div>
      <div class="small" style="margin-top:6px">Roles: ${escapeHtml(roleSummary || 'No roles selected yet.')} ${consentNeeded ? `• ${escapeHtml(String(consentNeeded))} image(s) need consent or are blocked` : ''}</div>
      <div class="small" style="margin-top:6px">${guidance.join(' ')}</div>
      <div class="small" style="margin-top:6px">${overriddenGalleryImages ? `${escapeHtml(String(overriddenGalleryImages))} gallery image(s) are being kept by documented override reason.` : 'No gallery overrides are documented right now.'}${weakUnapprovedGalleryImages ? ` ${escapeHtml(String(weakUnapprovedGalleryImages))} low-scoring gallery image(s) still need an override reason or replacement.` : ''}</div>
      ${(draftLeadTrend || draftGalleryTrend) ? `<div class="small" style="margin-top:6px">Draft vs last saved: ${escapeHtml(draftGalleryTrend || 'flat')} gallery • ${escapeHtml(draftLeadTrend || 'flat')} lead${lastSaved?.created_at ? ` • last saved ${escapeHtml(lastSaved.created_at)}` : ''}</div>` : ''}
      ${(savedLeadTrend || savedGalleryTrend) ? `<div class="small" style="margin-top:6px">Last saved trend: ${escapeHtml(savedGalleryTrend || 'flat')} gallery • ${escapeHtml(savedLeadTrend || 'flat')} lead</div>` : ''}
      ${firstImage ? `<div class="small" style="margin-top:6px">Lead image: ${escapeHtml(String(firstImage.width_px || 0))}×${escapeHtml(String(firstImage.height_px || 0))} • ${escapeHtml(firstOrientation || 'unknown')} • background ${escapeHtml(String(firstImage.background_consistency_score ?? 'n/a'))} • fill ${escapeHtml(String(firstImage.subject_fill_score ?? 'n/a'))} • sharpness ${escapeHtml(String(firstImage.sharpness_score ?? 'n/a'))} • brightness ${escapeHtml(String(firstImage.brightness_score ?? 'n/a'))} • contrast ${escapeHtml(String(firstImage.contrast_score ?? 'n/a'))}</div>` : ''}
      ${firstWarnings.map((warning) => `<div class="small" style="margin-top:6px;color:#b00020">${escapeHtml(warning)}</div>`).join('')}`;
  }


  function applyRecommendedRoles() {
    const rows = Array.from(document.querySelectorAll('[data-product-image-row]'));
    const recommended = ['hero_front', 'detail_texture', 'scale_context', 'back_side', 'process_story', 'packaging_pickup', 'material_tool_proof'];
    rows.forEach((row, index) => {
      const roleField = row.querySelector('[data-field="image_role"]');
      if (roleField) roleField.value = recommended[index] || 'gallery_support';
      const statusField = row.querySelector('[data-field="public_use_status"]');
      if (statusField && !statusField.value) statusField.value = index === 0 ? 'product_page_ok' : 'internal_review';
    });
    reindexRows();
    renderQualityScore();
    setMessage('Recommended image roles applied. Review consent/public-use status before saving.');
  }

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('[data-product-image-row]:not(.is-dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
  }
  function render() {
    if (rendered) return;
    rendered = true;
    mountEl.innerHTML = `
      <div class="card" style="margin-top:18px">
        <h3 style="margin-top:0">Product Media Workflow</h3>
        <p class="small" style="margin-top:0">Manage ordered image URLs, direct uploads, asset browsing, alt text, captions, focal points, crop history, and merchandising scores together.</p>
        <div id="adminProductImagesMessage" class="small" style="display:none;margin-bottom:12px"></div><div class="product-image-bulk-bar"><strong>Bulk tools</strong><span class="small">Use compression/resize before upload, then assign roles in order. Drag rows to reorder.</span></div>
        <form id="adminProductImagesForm" class="grid" style="gap:12px">
          <div class="grid cols-2" style="gap:12px">
            <div><label class="small" for="productImagesProductId">Product ID</label><input id="productImagesProductId" type="number" min="1" step="1" required /></div>
            <div style="display:flex;gap:10px;align-items:end;flex-wrap:wrap"><button class="btn" type="button" id="loadProductImagesButton">Load Images</button><button class="btn" type="button" id="addProductImageRowButton">Add Row</button><button class="btn" type="button" id="applyRecommendedImageRolesButton">Apply recommended roles</button><button class="btn" type="button" id="bulkHeroRolesButton">Bulk roles</button><button class="btn" type="submit" id="saveProductImagesButton">Save Images</button></div>
          </div>
          <div class="card" style="margin-top:4px">
            <h4 style="margin-top:0">Direct Upload to R2</h4>
            <div class="grid cols-2" style="gap:12px;align-items:end"><div><label class="small" for="productImageUploadInput">Image File</label><input id="productImageUploadInput" type="file" accept="image/*" /></div><div><button class="btn" type="button" id="uploadProductImageButton">Upload Image</button></div></div>
            <div class="grid cols-3" style="gap:12px;margin-top:12px;align-items:end">
              <label><span class="small">Crop / sizing preset</span><select id="productImageEditPreset"><option value="original">Keep original</option><option value="square_1200">Center crop square 1200×1200</option><option value="landscape_1600">Center crop landscape 4:3</option><option value="max_side">Resize max side only</option></select></label>
              <label><span class="small">Max side px</span><input id="productImageResizeMax" type="number" min="800" max="2600" step="100" value="1600" /></label>
              <label><span class="small">JPEG quality %</span><input id="productImageQuality" type="number" min="55" max="95" step="1" value="88" /></label>
            </div>
            <div class="grid cols-2" style="gap:12px;margin-top:12px;align-items:start">
              <canvas id="productImageEditPreview" width="240" height="180" style="width:100%;max-width:360px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.03)"></canvas>
              <div class="small" id="productImageEditNote">Choose an image to preview crop/resize output.</div>
            </div>
            <div class="small" style="margin-top:8px">Upload analysis now estimates background cleanliness, subject fill, sharpness, brightness, contrast, and optional crop/resize output before save.</div>
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
    document.getElementById('applyRecommendedImageRolesButton')?.addEventListener('click', applyRecommendedRoles);
    document.getElementById('bulkHeroRolesButton')?.addEventListener('click', applyRecommendedRoles);
    document.getElementById('uploadProductImageButton')?.addEventListener('click', uploadImage);
    document.getElementById('productImageUploadInput')?.addEventListener('change', async (event) => {
      const file = event.target?.files?.[0];
      if (!file) return;
      const info = await refreshUploadPreview() || await inspectLocalImageFile(file);
      const hasExistingRows = Array.from(document.querySelectorAll('[data-product-image-row]')).some((row) => normalizeText(row.querySelector('[data-field="image_url"]')?.value));
      const warnings = summarizeImageGuidance(info, !hasExistingRows);
      if (!info.ok) {
        setMessage(`Upload guidance: use a square or landscape image at least 800×800. Current edited output is ${info.width}×${info.height}.`, true);
      } else if (!hasExistingRows && !info.first_image_ok) {
        setMessage(`Lead-image guidance: featured image target is 1200×1200 or larger and square/landscape. Current edited output is ${info.width}×${info.height}.`, true);
      } else if (warnings.length) {
        setMessage(`Upload guidance: ${warnings.join(' • ')}. Estimated merchandising score ${info.merchandising_score}%.`, true);
      } else {
        setMessage(`Image looks solid for listing use: ${info.width}×${info.height} • est. merchandising ${info.merchandising_score}%.`, false);
      }
    });
    document.getElementById('productImageEditPreset')?.addEventListener('change', refreshUploadPreview);
    document.getElementById('productImageResizeMax')?.addEventListener('input', refreshUploadPreview);
    document.getElementById('productImageQuality')?.addEventListener('input', refreshUploadPreview);
    document.getElementById('refreshMediaAssetsButton')?.addEventListener('click', loadAssetLibrary);
    document.getElementById('adminProductImagesForm')?.addEventListener('submit', saveImages);
    document.addEventListener('dd:product-editor-target', async (event) => {
      const productId = Number(event?.detail?.product_id || event?.detail?.product?.product_id || 0);
      if (!productId) { clearImagesPanel(); return; }
      const field = document.getElementById('productImagesProductId');
      if (field) field.value = String(productId);
      await loadImages();
    });
    document.addEventListener('dd:product-editor-cleared', clearImagesPanel);
    mountEl.addEventListener('click', onClick);
    mountEl.addEventListener('input', (event) => {
      if (event.target?.closest?.('[data-product-image-row]')) {
        reindexRows();
        renderQualityScore();
      }
    });
    mountEl.addEventListener('dragstart', (event) => {
      const row = event.target?.closest?.('[data-product-image-row]');
      if (!row) return;
      row.classList.add('is-dragging');
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', row.querySelector('[data-field="image_url"]')?.value || 'product-image-row');
      }
    });
    mountEl.addEventListener('dragover', (event) => {
      const container = document.getElementById('productImagesRows');
      if (!container || !event.target?.closest?.('#productImagesRows')) return;
      event.preventDefault();
      const afterElement = getDragAfterElement(container, event.clientY);
      const dragging = container.querySelector('.is-dragging');
      if (!dragging) return;
      if (afterElement == null) container.appendChild(dragging);
      else container.insertBefore(dragging, afterElement);
      reindexRows();
    });
    mountEl.addEventListener('dragend', () => {
      mountEl.querySelectorAll('.is-dragging').forEach((row) => row.classList.remove('is-dragging'));
      reindexRows();
      renderQualityScore();
    });
    addRow();
    renderQualityScore();
  }

  function reindexRows() {
    document.querySelectorAll('[data-product-image-row]').forEach((row, index) => {
      const title = row.querySelector('strong');
      if (title) title.textContent = `Image Row ${index + 1}`;
      const sort = row.querySelector('[data-field="sort_order"]');
      if (sort) sort.value = String(index);
      const gateHint = row.querySelector('[data-field="lead_gate_hint"]');
      if (gateHint) gateHint.value = index === 0 ? 'Lead candidate' : 'Gallery/support image';
      const roleField = row.querySelector('[data-field="image_role"]');
      if (roleField && !roleField.value) roleField.value = normalizeRole('', index);
      const roleDisplay = row.querySelector('[data-role-display]');
      if (roleDisplay) roleDisplay.textContent = roleLabel(normalizeRole(roleField?.value, index));
    });
  }

  function addRow(row = {}) {
    const wrap = document.getElementById('productImagesRows');
    if (!wrap) return;
    wrap.insertAdjacentHTML('beforeend', rowTemplate(row, wrap.children.length));
    reindexRows();
    renderQualityScore();
  }


  function clearImagesPanel() {
    const productIdField = document.getElementById('productImagesProductId');
    if (productIdField) productIdField.value = '';
    const rows = document.getElementById('productImagesRows');
    if (rows) rows.innerHTML = '';
    const quality = document.getElementById('adminProductImagesQuality');
    if (quality) quality.innerHTML = '<p class="small">Load a product to review image quality, roles, and public-use status.</p>';
    const assetList = document.getElementById('adminMediaAssetsList');
    if (assetList) assetList.textContent = 'Load a product first to browse uploaded media.';
    currentScoreHistory = [];
    latestSavedSummary = null;
    setMessage('Product image editor cleared.');
  }

  async function loadImages() {
    const productId = Number(document.getElementById('productImagesProductId')?.value || 0);
    if (!productId) return setMessage('Enter a valid product ID.', true);
    try {
      setMessage('Loading product images...');
      const response = await window.DDAuth.apiFetch(`/api/admin/product-images?product_id=${encodeURIComponent(productId)}`);
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to load product images.');
      currentScoreHistory = Array.isArray(data.score_history) ? data.score_history : [];
      latestSavedSummary = data.current_summary && typeof data.current_summary === 'object' ? data.current_summary : null;
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
    const editedUpload = await buildEditedUpload(file, false);
    const uploadFile = editedUpload.file || file;
    const localInfo = await inspectLocalImageFile(uploadFile);
    if (!localInfo.ok) {
      return setMessage(`Use a square or landscape image at least 800×800. Current edited output is ${localInfo.width}×${localInfo.height}.`, true);
    }
    const isFirstImageUpload = !Array.from(document.querySelectorAll('[data-product-image-row]')).some((row) => normalizeText(row.querySelector('[data-field="image_url"]')?.value));
    if (isFirstImageUpload && !localInfo.first_image_ok) {
      return setMessage(`First listing image should be at least 1200×1200 and square or landscape. Current edited output is ${localInfo.width}×${localInfo.height}.`, true);
    }
    try {
      setMessage(`Uploading image ${localInfo.width}×${localInfo.height} (${localInfo.orientation}) • est. merchandising ${localInfo.merchandising_score}%.`);
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('product_id', String(productId));
      formData.append('width_px', String(localInfo.width || ''));
      formData.append('height_px', String(localInfo.height || ''));
      formData.append('image_orientation', String(localInfo.orientation || 'unknown'));
      formData.append('background_consistency_score', String(localInfo.background_consistency_score || ''));
      formData.append('subject_fill_score', String(localInfo.subject_fill_score || ''));
      formData.append('sharpness_score', String(localInfo.sharpness_score || ''));
      formData.append('brightness_score', String(localInfo.brightness_score || ''));
      formData.append('contrast_score', String(localInfo.contrast_score || ''));
      formData.append('merchandising_score', String(localInfo.merchandising_score || ''));
      formData.append('shot_style', 'record');
      if (editedUpload.crop) {
        formData.append('crop_x', String(editedUpload.crop.x));
        formData.append('crop_y', String(editedUpload.crop.y));
        formData.append('crop_width', String(editedUpload.crop.width));
        formData.append('crop_height', String(editedUpload.crop.height));
      }
      if (editedUpload.resize) {
        formData.append('resize_width_px', String(editedUpload.resize.width));
        formData.append('resize_height_px', String(editedUpload.resize.height));
      }
      const response = await window.DDAuth.apiFetch('/api/admin/media-upload', { method: 'POST', body: formData, headers: {} });
      const data = await response.json();
      if (!response.ok || !data?.ok || !data?.asset?.public_url) throw new Error(data?.error || 'Failed to upload image.');
      addRow({
        image_url: data.asset.public_url,
        alt_text: uploadFile.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
        sort_order: document.querySelectorAll('[data-product-image-row]').length,
        width_px: localInfo.width,
        height_px: localInfo.height,
        image_orientation: localInfo.orientation,
        background_consistency_score: localInfo.background_consistency_score,
        subject_fill_score: localInfo.subject_fill_score,
        sharpness_score: localInfo.sharpness_score,
        brightness_score: localInfo.brightness_score,
        contrast_score: localInfo.contrast_score,
        crop_x: editedUpload.crop?.x ?? null,
        crop_y: editedUpload.crop?.y ?? null,
        crop_width: editedUpload.crop?.width ?? null,
        crop_height: editedUpload.crop?.height ?? null,
        annotation_notes: editedUpload.edited ? `Upload edited: ${editedUpload.note || 'crop/resize applied'}` : '',
        shot_style: 'record',
        merchandising_score: localInfo.merchandising_score,
        first_image_score: localInfo.merchandising_score
      });
      if (fileInput) fileInput.value = '';
      await loadAssetLibrary();
      setMessage('Image uploaded and added to the list. Save images to attach it fully to the product gallery.');
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
      listEl.innerHTML = assets.map((asset) => {
        const leadReady = Number(asset.width_px || 0) >= 1200 && Number(asset.height_px || 0) >= 1200 && ['square', 'landscape'].includes(String(asset.image_orientation || '').toLowerCase());
        const assetPayload = encodeURIComponent(JSON.stringify({
          image_url: asset.public_url || '',
          width_px: asset.width_px ?? null,
          height_px: asset.height_px ?? null,
          image_orientation: asset.image_orientation || '',
          background_consistency_score: asset.background_consistency_score ?? null,
          subject_fill_score: asset.subject_fill_score ?? null,
          sharpness_score: asset.sharpness_score ?? null,
          brightness_score: asset.brightness_score ?? null,
          contrast_score: asset.contrast_score ?? null,
          merchandising_score: asset.merchandising_score ?? asset.first_image_score ?? null,
          first_image_score: asset.merchandising_score ?? asset.first_image_score ?? null,
          shot_style: asset.shot_style || 'record',
          angle_group: asset.angle_group || ''
        }));
        const guidance = summarizeImageGuidance({
          width: asset.width_px,
          height: asset.height_px,
          orientation: asset.image_orientation,
          background_consistency_score: asset.background_consistency_score,
          subject_fill_score: asset.subject_fill_score,
          sharpness_score: asset.sharpness_score,
          brightness_score: asset.brightness_score,
          contrast_score: asset.contrast_score,
          merchandising_score: asset.merchandising_score ?? asset.first_image_score
        }, true);
        return `
          <div class="card" style="margin-top:8px">
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
              ${asset.public_url ? `<img src="${escapeHtml(asset.public_url)}" alt="${escapeHtml(asset.original_filename || 'asset')}" style="width:72px;height:72px;object-fit:cover;border-radius:8px" />` : ''}
              <div style="flex:1 1 260px">
                <div><strong>${escapeHtml(asset.original_filename || asset.object_key || 'Asset')}</strong></div>
                <div class="small">${escapeHtml(asset.object_key || '')}</div>
                <div class="small">${escapeHtml(String(asset.width_px || 0))}×${escapeHtml(String(asset.height_px || 0))} • ${escapeHtml(asset.image_orientation || 'unknown')} • merch ${escapeHtml(String(asset.merchandising_score ?? asset.first_image_score ?? 'n/a'))}% ${leadReady ? '• lead-ready' : ''}</div>
                ${guidance.length ? `<div class="small" style="margin-top:4px;color:#b00020">${escapeHtml(guidance[0])}</div>` : ''}
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="btn" type="button" data-add-asset-json="${assetPayload}">Use Asset</button>
                <button class="btn" type="button" data-delete-asset-id="${asset.media_asset_id}">Delete Asset</button>
              </div>
            </div>
          </div>`;
      }).join('');
    } catch (error) {
      listEl.textContent = error.message || 'Failed to load media assets.';
    }
  }

  function validateFirstImageForSave(rows) {
    const first = Array.isArray(rows) ? rows.find((row) => normalizeText(row.image_url)) : null;
    if (!first) return { ok: true, message: 'No images will remain attached to this product.' };
    const orientation = normalizeText(first.image_orientation).toLowerCase();
    const width = Number(first.width_px || 0);
    const height = Number(first.height_px || 0);
    const altText = normalizeText(first.alt_text);
    const score = Number(first.merchandising_score || first.first_image_score || 0);
    if (!['square', 'landscape'].includes(orientation)) return { ok: false, message: 'First image should be square or landscape before saving.' };
    if (width < 1200 || height < 1200) return { ok: false, message: `First image should be at least 1200×1200. Current first image is ${width || 0}×${height || 0}.` };
    if (altText.length < 12) return { ok: false, message: 'First image needs stronger alt text before saving.' };
    if (score < 72) return { ok: false, message: `Lead image merchandising score is only ${score}%. Improve crop, background, sharpness, or fill before saving.` };
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
      latestSavedSummary = data.current_summary && typeof data.current_summary === 'object' ? data.current_summary : null;
      await loadImages();
      setMessage('Product images and image order saved. The first row is now the lead/featured image candidate.');
      document.dispatchEvent(new CustomEvent('dd:product-updated', { detail: { product_id: productId } }));
    } catch (error) {
      setMessage(error.message || 'Failed to save product images.', true);
    }
  }


  function updateCropFieldsFromBox(row, x, y, w, h) {
    const cropPair = row.querySelector('[data-field="crop_pair"]');
    const cropSize = row.querySelector('[data-field="crop_size"]');
    if (cropPair) cropPair.value = `${x.toFixed(2)},${y.toFixed(2)}`;
    if (cropSize) cropSize.value = `${w.toFixed(2)},${h.toFixed(2)}`;
    const cropBox = row.querySelector('.product-image-crop-preview');
    if (cropBox) cropBox.style.cssText = `left:${Math.round(x*100)}%;top:${Math.round(y*100)}%;width:${Math.round(w*100)}%;height:${Math.round(h*100)}%`;
  }

  function startCropHandleDrag(event, row, handle) {
    const thumb = row.querySelector('[data-set-focal-from-thumb]');
    if (!thumb) return;
    event.preventDefault();
    event.stopPropagation();
    const startRect = thumb.getBoundingClientRect();
    const [x0, y0] = String(row.querySelector('[data-field="crop_pair"]')?.value || '0.08,0.08').split(',').map((value) => Number(value));
    const [w0, h0] = String(row.querySelector('[data-field="crop_size"]')?.value || '0.84,0.84').split(',').map((value) => Number(value));
    const startX = Number.isFinite(x0) ? x0 : 0.08;
    const startY = Number.isFinite(y0) ? y0 : 0.08;
    const startW = Number.isFinite(w0) ? w0 : 0.84;
    const startH = Number.isFinite(h0) ? h0 : 0.84;
    const anchor = String(handle.getAttribute('data-crop-handle') || 'se');
    const move = (moveEvent) => {
      const px = clamp((moveEvent.clientX - startRect.left) / Math.max(1, startRect.width), 0, 1);
      const py = clamp((moveEvent.clientY - startRect.top) / Math.max(1, startRect.height), 0, 1);
      let x = startX, y = startY, w = startW, h = startH;
      if (anchor.includes('e')) w = clamp(px - startX, 0.12, 1 - startX);
      if (anchor.includes('s')) h = clamp(py - startY, 0.12, 1 - startY);
      if (anchor.includes('w')) { const right = startX + startW; x = clamp(px, 0, right - 0.12); w = clamp(right - x, 0.12, 1); }
      if (anchor.includes('n')) { const bottom = startY + startH; y = clamp(py, 0, bottom - 0.12); h = clamp(bottom - y, 0.12, 1); }
      updateCropFieldsFromBox(row, x, y, w, h);
      renderQualityScore();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setMessage('Crop rectangle adjusted with drag handles. Save images to keep it.');
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  }

  async function onClick(event) {
    const row = event.target.closest('[data-product-image-row]');

    const cropHandle = event.target.closest('[data-crop-handle]');
    if (cropHandle && row) { startCropHandleDrag(event, row, cropHandle); return; }

    const focalButton = event.target.closest('[data-set-focal-from-thumb]');
    if (focalButton && row) {
      const rect = focalButton.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height)));
      const xField = row.querySelector('[data-field="focal_point_x"]');
      const yField = row.querySelector('[data-field="focal_point_y"]');
      if (xField) xField.value = x.toFixed(2);
      if (yField) yField.value = y.toFixed(2);
      const dot = row.querySelector('.product-image-focal-dot');
      if (dot) { dot.style.left = `${Math.round(x * 100)}%`; dot.style.top = `${Math.round(y * 100)}%`; }
      const size = 0.84;
      const cropX = Math.max(0, Math.min(1-size, x - size/2));
      const cropY = Math.max(0, Math.min(1-size, y - size/2));
      const cropPair = row.querySelector('[data-field="crop_pair"]');
      const cropSize = row.querySelector('[data-field="crop_size"]');
      if (cropPair && !cropPair.value) cropPair.value = `${cropX.toFixed(2)},${cropY.toFixed(2)}`;
      if (cropSize && !cropSize.value) cropSize.value = `${size.toFixed(2)},${size.toFixed(2)}`;
      const cropBox = row.querySelector('.product-image-crop-preview');
      if (cropBox) cropBox.style.cssText = `left:${Math.round(cropX*100)}%;top:${Math.round(cropY*100)}%;width:${Math.round(size*100)}%;height:${Math.round(size*100)}%`;
      renderQualityScore();
      setMessage('Focal point updated on the thumbnail. Save images to keep this crop/focus guidance.');
      return;
    }
    if (event.target.closest('[data-row-queue-derivative]') && row) { try { await queueDerivativeForRow(row); } catch (error) { setMessage(error.message || 'Derivative failed.', true); } return; }
    if (event.target.closest('[data-row-load-derivatives]') && row) { await loadDerivativeHistoryForRow(row); return; }
    if (event.target.closest('[data-row-set-square-crop]') && row) {
      const focalX = Number(row.querySelector('[data-field="focal_point_x"]')?.value || 0.5);
      const focalY = Number(row.querySelector('[data-field="focal_point_y"]')?.value || 0.5);
      const size = 0.84;
      const cropX = Math.max(0, Math.min(1-size, focalX - size/2));
      const cropY = Math.max(0, Math.min(1-size, focalY - size/2));
      const cropPair = row.querySelector('[data-field="crop_pair"]');
      const cropSize = row.querySelector('[data-field="crop_size"]');
      if (cropPair) cropPair.value = `${cropX.toFixed(2)},${cropY.toFixed(2)}`;
      if (cropSize) cropSize.value = `${size.toFixed(2)},${size.toFixed(2)}`;
      const cropBox = row.querySelector('.product-image-crop-preview');
      if (cropBox) cropBox.style.cssText = `left:${Math.round(cropX*100)}%;top:${Math.round(cropY*100)}%;width:${Math.round(size*100)}%;height:${Math.round(size*100)}%`;
      renderQualityScore();
      setMessage('Square crop rectangle set from focal point. Save images to keep it.');
      return;
    }
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
    const addAssetBtn = event.target.closest('[data-add-asset-json]');
    if (addAssetBtn) {
      try {
        const payload = JSON.parse(decodeURIComponent(addAssetBtn.getAttribute('data-add-asset-json') || '%7B%7D'));
        addRow({ ...payload, sort_order: document.querySelectorAll('[data-product-image-row]').length });
        const warnings = summarizeImageGuidance(payload, false);
        setMessage(warnings.length ? `Selected asset guidance: ${warnings.join(' • ')}.` : 'Asset added to the gallery list.', warnings.length > 0);
      } catch {
        addRow({ image_url: '', sort_order: document.querySelectorAll('[data-product-image-row]').length });
      }
      reindexRows();
      renderQualityScore();
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
