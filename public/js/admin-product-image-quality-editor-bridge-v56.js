// Build 56 — Product Editor bridge for the existing Release 448 deterministic image-quality authority.
(function () {
  'use strict';

  const text = (value) => String(value == null ? '' : value).trim();
  const esc = (value) => text(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  const round = (value) => Math.round(Number(value || 0) * 10) / 10;
  const state = { productId: 0, assessments: [], busy: false, schemaReady: true };

  function apiFetch(url, options = {}) {
    return window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(url, options) : fetch(url, { credentials: 'same-origin', ...options });
  }

  async function readJson(response) {
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `HTTP ${response.status}`);
    return payload || {};
  }

  function imageKey(value) {
    return text(value).toLowerCase().replace(/[?#].*$/, '').replace(/^https?:\/\/[^/]+/, '').replace(/\/+$/, '');
  }

  function category(score) {
    const value = Number(score || 0);
    return value >= 85 ? 'Excellent' : value >= 70 ? 'Good' : value >= 55 ? 'Usable / improve' : value >= 40 ? 'Reshoot recommended' : 'Poor / reshoot';
  }

  function currentProductId() {
    const form = document.getElementById('createProductForm');
    return Number(state.productId || window.DDCurrentProductEditorId || form?.dataset?.productId || 0) || 0;
  }

  function currentImages() {
    const form = document.getElementById('createProductForm');
    if (!form) return [];
    const values = [form.elements.namedItem('featured_image_url')?.value];
    for (let i = 1; i <= 6; i += 1) values.push(form.elements.namedItem(`image_url_${i}`)?.value);
    const seen = new Set();
    return values.map(text).filter(Boolean).filter((url) => {
      const key = imageKey(url);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function assessmentFor(url) {
    const key = imageKey(url);
    return state.assessments.find((row) => imageKey(row.image_key || row.image_url) === key && row.scorer_kind === 'browser_deterministic')
      || state.assessments.find((row) => imageKey(row.image_key || row.image_url) === key)
      || null;
  }

  function parseEvidence(row) {
    try { return typeof row?.evidence_json === 'string' ? JSON.parse(row.evidence_json || '{}') : (row?.evidence_json || {}); }
    catch { return {}; }
  }

  function recommendations(row) {
    if (!row) return ['Run the objective score to create a baseline for this image.'];
    const tips = [];
    if (Number(row.lighting_score) < 14) tips.push('Lighting: adjust exposure and reduce clipped highlights or crushed shadows. Use softer, more even light when possible.');
    if (Number(row.clarity_score) < 14) tips.push('Clarity: check focus, camera movement and depth of field. More light, a stable camera/tripod and deliberate focus usually help.');
    if (Number(row.background_score) < 9) tips.push('Background: simplify the visible border, remove seams/distractions and make the studio background more uniform.');
    if (Number(row.framing_score) < 10) tips.push('Framing: re-centre the product and aim for roughly 62% subject occupancy without clipping important edges.');
    if (Number(row.resolution_score) < 10) tips.push('Resolution: use at least 1200 px on the shortest side for full points; avoid enlarging a small original.');
    if (Number(row.color_balance_score) < 6.5) tips.push('Colour: correct white balance and avoid mixed light sources that create a strong colour cast.');
    if (Number(row.artifact_score) < 3.5) tips.push('Artifacts: re-export from the best original at higher quality and avoid repeated JPEG recompression.');
    if (Number(row.consistency_score) < 3.5) tips.push('Consistency: crop this image closer to the aspect ratio used by the rest of this product set.');
    return tips.length ? tips : ['No major deterministic issue was detected. Review styling, reflections and product appeal visually before choosing the hero image.'];
  }

  function componentGrid(row) {
    if (!row) return '';
    const entries = [
      ['Lighting', row.lighting_score, 20], ['Clarity', row.clarity_score, 20], ['Background', row.background_score, 15],
      ['Framing', row.framing_score, 15], ['Resolution', row.resolution_score, 10], ['Colour', row.color_balance_score, 10],
      ['Artifacts', row.artifact_score, 5], ['Consistency', row.consistency_score, 5],
    ];
    return `<div class="small" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:6px;margin-top:8px">${entries.map(([label, value, max]) => `<span><strong>${esc(label)}</strong> ${round(value)}/${max}</span>`).join('')}</div>`;
  }

  function mount() {
    let panel = document.getElementById('productEditorImageQualityV56');
    if (panel) return panel;
    const form = document.getElementById('createProductForm');
    if (!form) return null;
    panel = document.createElement('section');
    panel.id = 'productEditorImageQualityV56';
    panel.className = 'card';
    panel.style.margin = '0 0 16px 0';
    form.parentNode.insertBefore(panel, form);
    panel.addEventListener('click', onClick);
    return panel;
  }

  function render() {
    const panel = mount();
    if (!panel) return;
    const productId = currentProductId();
    const images = currentImages();
    if (!productId) {
      panel.innerHTML = `<div class="section-heading-row"><div><p class="eyebrow">Build 56 • Image quality</p><h3 style="margin:0">Product image scoring</h3></div><a class="btn" href="/admin/product-image-quality/">Open Photography Manager</a></div><p class="small">Load an existing product into the editor to score its current images. Scoring is advisory: it does not publish, hide, delete or replace an image.</p>`;
      return;
    }
    const scored = images.filter((url) => assessmentFor(url)).length;
    const scoreValues = images.map((url) => assessmentFor(url)).filter(Boolean).map((row) => Number(row.total_score || 0));
    const average = scoreValues.length ? round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) : null;
    panel.innerHTML = `
      <div class="section-heading-row">
        <div><p class="eyebrow">Build 56 • Image quality</p><h3 style="margin:0">Current product photography</h3><p class="small" style="margin:6px 0 0">${images.length} image${images.length === 1 ? '' : 's'} • ${scored} scored${average == null ? '' : ` • average ${average}/100`}</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn primary" type="button" data-v56-action="score-unscored" ${state.busy || !images.length || !state.schemaReady ? 'disabled' : ''}>Score unscored images</button>
          <button class="btn" type="button" data-v56-action="rescore" ${state.busy || !images.length || !state.schemaReady ? 'disabled' : ''}>Rescore all images</button>
          <a class="btn" href="/admin/product-image-quality/?product_id=${productId}">Open full Photography Manager</a>
        </div>
      </div>
      ${!state.schemaReady ? '<p class="small" style="margin-top:10px"><strong>Scoring schema is not ready in this environment.</strong> No image or product data was changed.</p>' : ''}
      <p class="small">The score uses the same deterministic 100-point Release 448 Canvas rubric as Photography Manager. Use the explanation under each image as a reshoot/edit checklist; styling and artistic intent still require human review.</p>
      <div id="productEditorImageQualityMessageV56" class="small" role="status" aria-live="polite"></div>
      ${images.length ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px;margin-top:12px">${images.map((url, index) => imageCard(url, index)).join('')}</div>` : '<p class="small"><strong>No current image URLs are loaded in this product.</strong></p>'}`;
  }

  function imageCard(url, index) {
    const row = assessmentFor(url);
    const evidence = parseEvidence(row);
    const score = row ? Number(row.total_score || 0) : null;
    const tips = recommendations(row);
    const size = row?.width_px && row?.height_px ? `${Number(row.width_px)} × ${Number(row.height_px)} px` : '';
    const metricSize = evidence?.objective_metrics ? `${Number(row?.width_px || 0)} × ${Number(row?.height_px || 0)} px` : size;
    return `<article style="border:1px solid var(--border);border-radius:12px;padding:10px;display:grid;gap:8px">
      <img src="${esc(url)}" alt="Product image ${index + 1}" style="width:100%;aspect-ratio:1/1;object-fit:contain;border-radius:10px;background:rgba(0,0,0,.10)"/>
      <div><strong>${row ? `${round(score)}/100 — ${esc(category(score))}` : 'Unscored'}</strong>${metricSize ? `<div class="small">${esc(metricSize)}</div>` : ''}</div>
      ${componentGrid(row)}
      <details ${row && score < 70 ? 'open' : ''}><summary><strong>${row ? 'Why this score / what to improve' : 'How scoring helps'}</strong></summary><ul class="small">${tips.map((tip) => `<li>${esc(tip)}</li>`).join('')}</ul></details>
    </article>`;
  }

  function setMessage(value, error = false) {
    const node = document.getElementById('productEditorImageQualityMessageV56');
    if (!node) return;
    node.textContent = value || '';
    node.style.color = error ? 'var(--danger,#c44)' : '';
  }

  async function refresh() {
    const productId = currentProductId();
    state.productId = productId;
    if (!productId) { state.assessments = []; state.schemaReady = true; render(); return; }
    render();
    try {
      const payload = await readJson(await apiFetch(`/api/admin/product-image-quality?product_id=${productId}`, { method: 'GET' }));
      state.schemaReady = payload.schema_ready !== false;
      state.assessments = Array.isArray(payload.assessments) ? payload.assessments : [];
      render();
    } catch (error) {
      render();
      setMessage(error.message || 'Could not load image-quality assessments.', true);
    }
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Image could not be loaded for Canvas scoring. Check the image URL/R2 CORS policy.'));
      image.src = url;
    });
  }

  function canvasMetrics(image) {
    const maxSide = 320;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const w = Math.max(1, Math.round(image.naturalWidth * scale));
    const h = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    const lum = new Float32Array(w * h);
    let sum = 0, sumSq = 0, low = 0, high = 0, rSum = 0, gSum = 0, bSum = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const y = (.2126 * r + .7152 * g + .0722 * b) / 255;
      lum[p] = y; sum += y; sumSq += y * y; rSum += r; gSum += g; bSum += b;
      if (y < .035) low += 1; if (y > .965) high += 1;
    }
    const n = w * h;
    const mean = sum / n;
    const contrast = Math.sqrt(Math.max(0, sumSq / n - mean * mean));
    let edge = 0, edgeN = 0;
    for (let y = 1; y < h - 1; y += 1) for (let x = 1; x < w - 1; x += 1) {
      const p = y * w + x;
      edge += Math.abs(4 * lum[p] - lum[p - 1] - lum[p + 1] - lum[p - w] - lum[p + w]); edgeN += 1;
    }
    const sharpness = edge / Math.max(1, edgeN);
    const border = [];
    const step = Math.max(1, Math.floor(Math.min(w, h) / 80));
    for (let x = 0; x < w; x += step) border.push(lum[x], lum[(h - 1) * w + x]);
    for (let y = 1; y < h - 1; y += step) border.push(lum[y * w], lum[y * w + w - 1]);
    const borderMean = border.reduce((a, b) => a + b, 0) / Math.max(1, border.length);
    const borderVar = border.reduce((a, b) => a + (b - borderMean) ** 2, 0) / Math.max(1, border.length);
    const threshold = Math.max(.09, Math.sqrt(borderVar) * 2.4);
    let minX = w, minY = h, maxX = -1, maxY = -1, foreground = 0;
    for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
      if (Math.abs(lum[y * w + x] - borderMean) > threshold) {
        foreground += 1; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
    const occupancy = foreground / n;
    let centerOffset = 1;
    if (maxX >= 0) {
      const cx = (minX + maxX) / (2 * w), cy = (minY + maxY) / (2 * h);
      centerOffset = Math.hypot(cx - .5, cy - .5) / .7071;
    }
    const means = [rSum / n, gSum / n, bSum / n];
    const channelSpread = (Math.max(...means) - Math.min(...means)) / 255;
    let blocks = 0, blockN = 0;
    for (let y = 8; y < h; y += 8) for (let x = 1; x < w; x += 1) { blocks += Math.abs(lum[y * w + x] - lum[(y - 1) * w + x]); blockN += 1; }
    for (let x = 8; x < w; x += 8) for (let y = 1; y < h; y += 1) { blocks += Math.abs(lum[y * w + x] - lum[y * w + x - 1]); blockN += 1; }
    return { w, h, mean, contrast, low_clip: low / n, high_clip: high / n, sharpness, border_variance: borderVar, occupancy, center_offset: centerOffset, channel_spread: channelSpread, block_boundary_energy: blocks / Math.max(1, blockN) };
  }

  function perceptualHash(image) {
    const canvas = document.createElement('canvas'); canvas.width = 9; canvas.height = 8;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, 0, 0, 9, 8);
    const data = ctx.getImageData(0, 0, 9, 8).data; const values = [];
    for (let i = 0; i < data.length; i += 4) values.push(.2126 * data[i] + .7152 * data[i + 1] + .0722 * data[i + 2]);
    let bits = 0n, position = 0n;
    for (let y = 0; y < 8; y += 1) for (let x = 0; x < 8; x += 1) { if (values[y * 9 + x] > values[y * 9 + x + 1]) bits |= 1n << position; position += 1n; }
    return bits.toString(16).padStart(16, '0');
  }

  function scoreMetrics(image, metrics, ratios) {
    const lighting = clamp(20 - (Math.abs(metrics.mean - .56) * 30 + (metrics.low_clip + metrics.high_clip) * 80), 0, 20);
    const clarity = clamp((metrics.sharpness - .025) * 170, 0, 20);
    const background = clamp(15 - Math.sqrt(metrics.border_variance) * 55, 0, 15);
    const framing = clamp(15 - Math.abs(metrics.occupancy - .62) * 22 - metrics.center_offset * 7, 0, 15);
    const minDim = Math.min(image.naturalWidth, image.naturalHeight);
    const resolution = minDim >= 1200 ? 10 : minDim >= 900 ? 8 : minDim >= 700 ? 6 : minDim >= 500 ? 4 : 2;
    const color = clamp(10 - metrics.channel_spread * 22, 0, 10);
    const artifacts = clamp(5 - Math.max(0, metrics.block_boundary_energy - .11) * 18, 0, 5);
    const ratio = image.naturalWidth / Math.max(1, image.naturalHeight);
    const ordered = ratios.slice().sort((a, b) => a - b);
    const target = ordered.length ? ordered[Math.floor(ordered.length / 2)] : ratio;
    const consistency = clamp(5 - Math.abs(Math.log(Math.max(.01, ratio / target))) * 5, 0, 5);
    const scores = { lighting_score: round(lighting), clarity_score: round(clarity), background_score: round(background), framing_score: round(framing), resolution_score: round(resolution), color_balance_score: round(color), artifact_score: round(artifacts), consistency_score: round(consistency) };
    return { ...scores, total_score: round(Object.values(scores).reduce((a, b) => a + b, 0)) };
  }

  async function scoreOne(url, ratios) {
    const image = await loadImage(url);
    const metrics = canvasMetrics(image);
    const scores = scoreMetrics(image, metrics, ratios);
    const evidence = {
      algorithm: 'Release 448 deterministic browser Canvas heuristic',
      objective_metrics: metrics,
      perceptual_hash_dhash64: perceptualHash(image),
      catalog_ratio_sample_count: ratios.length,
      build56_surface: 'product_editor',
      limitations: [
        'Background score measures border uniformity, not artistic appropriateness.',
        'Framing uses contrast-from-border occupancy, not semantic object detection.',
        'Vision/AI review can supplement subjective presentation but does not replace these measurements.'
      ]
    };
    return readJson(await apiFetch('/api/admin/product-image-quality', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: currentProductId(), image_url: url, image_key: imageKey(url), scorer_kind: 'browser_deterministic', scorer_version: 'r448-browser-v1', ...scores, width_px: image.naturalWidth, height_px: image.naturalHeight, evidence, status: 'machine_scored' })
    }));
  }

  async function scoreImages({ onlyUnscored }) {
    if (state.busy) return;
    const images = currentImages();
    if (!currentProductId() || !images.length) return;
    state.busy = true; render(); setMessage('Loading images and calculating objective metrics…');
    try {
      const loaded = [];
      for (const url of images) {
        try { const image = await loadImage(url); loaded.push({ url, image, ratio: image.naturalWidth / Math.max(1, image.naturalHeight) }); }
        catch (error) { setMessage(`${url}: ${error.message}`, true); }
      }
      const ratios = loaded.map((row) => row.ratio);
      const targets = loaded.filter((row) => !onlyUnscored || !assessmentFor(row.url));
      let completed = 0;
      for (const row of targets) {
        await scoreOne(row.url, ratios); completed += 1; setMessage(`Scored ${completed} of ${targets.length} image${targets.length === 1 ? '' : 's'}…`);
      }
      await refresh();
      setMessage(targets.length ? `Scored ${targets.length} image${targets.length === 1 ? '' : 's'}. Review the explanations below.` : 'All current images already have an objective score.');
    } catch (error) {
      setMessage(error.message || 'Image scoring failed.', true);
    } finally {
      state.busy = false; render();
    }
  }

  function onClick(event) {
    const action = event.target.closest('[data-v56-action]')?.dataset?.v56Action;
    if (action === 'score-unscored') void scoreImages({ onlyUnscored: true });
    if (action === 'rescore') void scoreImages({ onlyUnscored: false });
  }

  document.addEventListener('dd:product-editor-target', (event) => {
    state.productId = Number(event?.detail?.product_id || 0) || 0;
    window.setTimeout(refresh, 0);
  });
  document.addEventListener('dd:product-editor-cleared', () => { state.productId = 0; state.assessments = []; render(); });
  document.addEventListener('dd:product-image-fields-updated', () => { if (currentProductId()) window.setTimeout(refresh, 0); else render(); });
  document.addEventListener('DOMContentLoaded', () => {
    mount(); render();
    const existing = Number(window.DDCurrentProductEditorId || document.getElementById('createProductForm')?.dataset?.productId || 0) || 0;
    if (existing) { state.productId = existing; void refresh(); }
  });
})();
