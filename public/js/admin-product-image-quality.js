// Devil n Dove Release 448 — transparent Product Photography Manager.
(function () {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const text = (value) => String(value == null ? '' : value).trim();
  const esc = (value) => text(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const apiFetch = (url, options = {}) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(url, options) : fetch(url, { credentials: 'same-origin', ...options });
  const state = {
    products: [],
    catalog: [],
    productId: Number(new URLSearchParams(location.search).get('product_id') || 0) || 0,
    images: [],
    assessments: [],
    schemaReady: true,
  };

  async function readJson(response) {
    const type = text(response.headers?.get?.('content-type')).toLowerCase();
    if (!type.includes('application/json')) throw new Error(`HTTP ${response.status} did not return JSON.`);
    const payload = await response.json();
    if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `HTTP ${response.status}`);
    return payload;
  }

  function message(value, error = false) {
    const node = byId('imageQualityMessage');
    if (!node) return;
    node.textContent = value || '';
    node.classList.toggle('is-error', error);
    node.classList.toggle('is-success', Boolean(value && !error));
  }

  function imageKey(value) {
    return text(value).toLowerCase().replace(/[?#].*$/, '').replace(/^https?:\/\/[^/]+/, '').replace(/\/+$/, '');
  }

  function category(score) {
    return score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Usable / improve' : score >= 40 ? 'Reshoot recommended' : 'Poor / reshoot';
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function round(value) {
    return Math.round(Number(value || 0) * 10) / 10;
  }

  function parseEvidence(row) {
    try {
      return typeof row?.evidence_json === 'string' ? JSON.parse(row.evidence_json || '{}') : (row?.evidence_json || {});
    } catch {
      return {};
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

  async function catalogRatios() {
    const ratios = [];
    for (const row of state.images) {
      try {
        const image = await loadImage(row.image_url);
        if (image.naturalWidth && image.naturalHeight) ratios.push(image.naturalWidth / image.naturalHeight);
      } catch {}
    }
    return ratios;
  }

  function canvasMetrics(image) {
    const maxSide = 320;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const w = Math.max(1, Math.round(image.naturalWidth * scale));
    const h = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    const lum = new Float32Array(w * h);
    let sum = 0, sumSq = 0, low = 0, high = 0, rSum = 0, gSum = 0, bSum = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const y = (.2126 * r + .7152 * g + .0722 * b) / 255;
      lum[p] = y;
      sum += y;
      sumSq += y * y;
      rSum += r;
      gSum += g;
      bSum += b;
      if (y < .035) low++;
      if (y > .965) high++;
    }
    const n = w * h;
    const mean = sum / n;
    const variance = Math.max(0, sumSq / n - mean * mean);
    const contrast = Math.sqrt(variance);
    let edge = 0, edgeN = 0;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      edge += Math.abs(4 * lum[p] - lum[p - 1] - lum[p + 1] - lum[p - w] - lum[p + w]);
      edgeN++;
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
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (Math.abs(lum[y * w + x] - borderMean) > threshold) {
        foreground++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
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
    for (let y = 8; y < h; y += 8) for (let x = 1; x < w; x++) {
      blocks += Math.abs(lum[y * w + x] - lum[(y - 1) * w + x]);
      blockN++;
    }
    for (let x = 8; x < w; x += 8) for (let y = 1; y < h; y++) {
      blocks += Math.abs(lum[y * w + x] - lum[y * w + x - 1]);
      blockN++;
    }
    return {
      w, h, mean, contrast,
      low_clip: low / n,
      high_clip: high / n,
      sharpness,
      border_variance: borderVar,
      occupancy,
      center_offset: centerOffset,
      channel_spread: channelSpread,
      block_boundary_energy: blocks / Math.max(1, blockN),
    };
  }

  function perceptualHash(image) {
    const canvas = document.createElement('canvas');
    canvas.width = 9;
    canvas.height = 8;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, 9, 8);
    const data = ctx.getImageData(0, 0, 9, 8).data;
    const values = [];
    for (let i = 0; i < data.length; i += 4) values.push(.2126 * data[i] + .7152 * data[i + 1] + .0722 * data[i + 2]);
    let bits = 0n;
    let position = 0n;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      if (values[y * 9 + x] > values[y * 9 + x + 1]) bits |= 1n << position;
      position++;
    }
    return bits.toString(16).padStart(16, '0');
  }

  function hammingHex(a, b) {
    if (!/^[0-9a-f]{16}$/i.test(text(a)) || !/^[0-9a-f]{16}$/i.test(text(b))) return null;
    let value = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
    let count = 0;
    while (value) {
      count += Number(value & 1n);
      value >>= 1n;
    }
    return count;
  }

  function scoreMetrics(image, metrics, ratios = []) {
    const lighting = clamp(20 - (Math.abs(metrics.mean - .56) * 30 + (metrics.low_clip + metrics.high_clip) * 80), 0, 20);
    const clarity = clamp((metrics.sharpness - .025) * 170, 0, 20);
    const background = clamp(15 - Math.sqrt(metrics.border_variance) * 55, 0, 15);
    const framing = clamp(15 - Math.abs(metrics.occupancy - .62) * 22 - metrics.center_offset * 7, 0, 15);
    const minDim = Math.min(image.naturalWidth, image.naturalHeight);
    const resolution = minDim >= 1200 ? 10 : minDim >= 900 ? 8 : minDim >= 700 ? 6 : minDim >= 500 ? 4 : 2;
    const color = clamp(10 - metrics.channel_spread * 22, 0, 10);
    const artifacts = clamp(5 - Math.max(0, metrics.block_boundary_energy - .11) * 18, 0, 5);
    const ratio = image.naturalWidth / Math.max(1, image.naturalHeight);
    const target = ratios.length ? ratios.slice().sort((a, b) => a - b)[Math.floor(ratios.length / 2)] : ratio;
    const consistency = clamp(5 - Math.abs(Math.log(Math.max(.01, ratio / target))) * 5, 0, 5);
    const components = {
      lighting_score: round(lighting),
      clarity_score: round(clarity),
      background_score: round(background),
      framing_score: round(framing),
      resolution_score: round(resolution),
      color_balance_score: round(color),
      artifact_score: round(artifacts),
      consistency_score: round(consistency),
    };
    return { ...components, total_score: round(Object.values(components).reduce((a, b) => a + b, 0)) };
  }

  async function scoreImage(row, ratios) {
    const image = await loadImage(row.image_url);
    const metrics = canvasMetrics(image);
    const scores = scoreMetrics(image, metrics, ratios);
    const hash = perceptualHash(image);
    const evidence = {
      algorithm: 'Release 448 deterministic browser Canvas heuristic',
      objective_metrics: metrics,
      perceptual_hash_dhash64: hash,
      catalog_ratio_sample_count: ratios.length,
      limitations: [
        'Background score measures border uniformity, not artistic appropriateness.',
        'Framing uses contrast-from-border occupancy, not semantic object detection.',
        'Perceptual hash is used only to flag possible duplicate or near-duplicate images for review.',
        'Vision/AI review can supplement subjective presentation but does not replace these measurements.',
      ],
    };
    const body = {
      product_id: state.productId,
      image_url: row.image_url,
      image_key: imageKey(row.image_url),
      scorer_kind: 'browser_deterministic',
      scorer_version: 'r448-browser-v1',
      ...scores,
      width_px: image.naturalWidth,
      height_px: image.naturalHeight,
      evidence,
      status: 'machine_scored',
    };
    await readJson(await apiFetch('/api/admin/product-image-quality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }));
    return body;
  }

  function scoreFor(url) {
    const key = imageKey(url);
    return state.assessments.find((row) => imageKey(row.image_key || row.image_url) === key && row.scorer_kind === 'browser_deterministic')
      || state.assessments.find((row) => imageKey(row.image_key || row.image_url) === key);
  }

  function productSetAnalysis() {
    const records = state.images.map((image, index) => {
      const assessment = scoreFor(image.image_url);
      const evidence = parseEvidence(assessment);
      return {
        index,
        image,
        assessment,
        score: assessment ? Number(assessment.total_score || 0) : null,
        hash: text(evidence.perceptual_hash_dhash64),
      };
    });
    const ranked = records.filter((row) => row.assessment).slice().sort((a, b) => b.score - a.score || a.index - b.index);
    const distinct = [];
    const duplicateOf = new Map();
    const duplicateDistance = new Map();
    for (const candidate of ranked) {
      let matched = null;
      for (const kept of distinct) {
        const distance = hammingHex(candidate.hash, kept.hash);
        if (distance != null && distance <= 8) {
          matched = { kept, distance };
          break;
        }
      }
      if (matched) {
        duplicateOf.set(candidate.index, matched.kept.index);
        duplicateDistance.set(candidate.index, matched.distance);
      } else {
        distinct.push(candidate);
      }
    }
    const hero = distinct[0] || ranked[0] || null;
    const scored = records.filter((row) => row.assessment);
    const average = scored.length ? scored.reduce((sum, row) => sum + row.score, 0) / scored.length : 0;
    const usableDistinct = distinct.filter((row) => row.score >= 70).length;
    const coverageScore = state.images.length ? (scored.length / state.images.length) * 20 : 0;
    const heroScore = hero ? (hero.score / 100) * 25 : 0;
    const averageScore = (average / 100) * 20;
    const distinctnessScore = state.images.length ? (distinct.length / state.images.length) * 15 : 0;
    const galleryScore = Math.min(1, usableDistinct / 4) * 20;
    const setScore = round(coverageScore + heroScore + averageScore + distinctnessScore + galleryScore);
    const setLabel = setScore >= 85 ? 'Storefront-ready set' : setScore >= 70 ? 'Good set / targeted improvements' : setScore >= 55 ? 'Incomplete set' : 'Photography work queue';
    return { records, ranked, distinct, duplicateOf, duplicateDistance, hero, scored, average: round(average), usableDistinct, setScore, setLabel };
  }

  function reasonsFor(assessment, duplicateDistance) {
    if (!assessment) return ['Not scored yet'];
    const reasons = [];
    if (Number(assessment.lighting_score) < 14) reasons.push('lighting/exposure');
    if (Number(assessment.clarity_score) < 14) reasons.push('clarity/sharpness');
    if (Number(assessment.background_score) < 9) reasons.push('background');
    if (Number(assessment.framing_score) < 10) reasons.push('framing');
    if (Number(assessment.resolution_score) < 8) reasons.push('resolution');
    if (Number(assessment.color_balance_score) < 6.5) reasons.push('colour balance');
    if (Number(assessment.artifact_score) < 3.5) reasons.push('compression/artifacts');
    if (Number(assessment.consistency_score) < 3.5) reasons.push('set consistency');
    if (duplicateDistance != null) reasons.push(duplicateDistance <= 4 ? 'probable duplicate' : 'possible near duplicate');
    return reasons.length ? reasons : ['No major deterministic issue detected'];
  }

  function recommendationFor(index, analysis) {
    const record = analysis.records[index];
    if (!record?.assessment) return { label: 'Needs scoring', className: 'pending' };
    if (analysis.duplicateOf.has(index)) return { label: 'Near duplicate', className: 'warning' };
    if (analysis.hero?.index === index) return { label: record.score >= 85 ? 'Best hero candidate' : 'Best current hero', className: record.score >= 70 ? 'ready' : 'warning' };
    if (record.score >= 70) return { label: 'Gallery candidate', className: 'ready' };
    if (record.score >= 55) return { label: 'Improve / secondary only', className: 'warning' };
    return { label: 'Reshoot candidate', className: 'danger' };
  }

  function renderSetSummary() {
    const node = byId('imageQualitySetSummary');
    if (!node) return;
    if (!state.images.length) {
      node.innerHTML = '<p class="small">Choose a Product with saved images to build a photography set assessment.</p>';
      return;
    }
    const analysis = productSetAnalysis();
    const heroNumber = analysis.hero ? analysis.hero.index + 1 : null;
    const duplicateCount = analysis.duplicateOf.size;
    node.innerHTML = `
      <div class="photo-set-score"><strong>${analysis.setScore.toFixed(1)}/100</strong><span>${esc(analysis.setLabel)}</span></div>
      <div class="photo-set-metrics small">
        <span><strong>${analysis.scored.length}/${state.images.length}</strong> scored</span>
        <span><strong>${analysis.distinct.length}</strong> distinct scored image(s)</span>
        <span><strong>${analysis.usableDistinct}</strong> good/excellent distinct image(s)</span>
        <span><strong>${duplicateCount}</strong> duplicate/near-duplicate flag(s)</span>
        <span><strong>${analysis.average.toFixed(1)}</strong> average score</span>
        <span><strong>${heroNumber ? `Image ${heroNumber}` : 'None'}</strong> current hero recommendation</span>
      </div>
      <p class="small">Set score = scoring coverage 20 + best hero 25 + average quality 20 + distinctness 15 + up to four good/excellent gallery images 20. It is an operational work-queue score, not an automatic publishing rule.</p>`;
  }

  function renderImages() {
    const node = byId('imageQualityGrid');
    if (!node) return;
    if (!state.images.length) {
      node.innerHTML = '<p class="small">No saved Product images are available to score.</p>';
      renderSetSummary();
      return;
    }
    const analysis = productSetAnalysis();
    node.innerHTML = state.images.map((row, index) => {
      const assessment = scoreFor(row.image_url);
      const total = assessment ? Number(assessment.total_score) : null;
      const recommendation = recommendationFor(index, analysis);
      const duplicateOf = analysis.duplicateOf.get(index);
      const distance = analysis.duplicateDistance.get(index);
      const reasons = reasonsFor(assessment, distance);
      const duplicateText = duplicateOf == null ? '' : `<div class="small photo-duplicate-note">Similar to image ${duplicateOf + 1} • dHash distance ${distance}</div>`;
      return `<article class="card image-quality-card" data-image-index="${index}">
        <div class="photo-image-wrap"><img src="${esc(row.image_url)}" alt="${esc(row.alt_text || `Product image ${index + 1}`)}" loading="lazy" crossorigin="anonymous"><span class="photo-recommendation ${esc(recommendation.className)}">${esc(recommendation.label)}</span></div>
        <div><strong>Image ${index + 1} • ${esc(row.variant_role || row.image_source || 'Product image')}</strong>
          <div class="small">${assessment ? `Score <strong>${total.toFixed(1)}/100</strong> • ${category(total)} • ${esc(assessment.status)}` : 'Not scored yet'}</div>
          ${assessment ? `<div class="image-quality-components small">Lighting ${Number(assessment.lighting_score).toFixed(1)}/20 • Clarity ${Number(assessment.clarity_score).toFixed(1)}/20 • Background ${Number(assessment.background_score).toFixed(1)}/15 • Framing ${Number(assessment.framing_score).toFixed(1)}/15 • Resolution ${Number(assessment.resolution_score).toFixed(1)}/10 • Colour ${Number(assessment.color_balance_score).toFixed(1)}/10 • Artifacts ${Number(assessment.artifact_score).toFixed(1)}/5 • Consistency ${Number(assessment.consistency_score).toFixed(1)}/5</div>` : ''}
          <div class="small"><strong>Work queue:</strong> ${esc(reasons.join(' • '))}</div>${duplicateText}
          <div class="photo-actions"><button class="btn" type="button" data-score-one="${index}">${assessment ? 'Rescore' : 'Score image'}</button>${assessment ? `<button class="btn" type="button" data-review-image="${index}" data-review-status="approved">Approve</button><button class="btn" type="button" data-review-image="${index}" data-review-status="rejected">Reject</button>` : ''}</div>
        </div>
      </article>`;
    }).join('');
    node.querySelectorAll('[data-score-one]').forEach((button) => button.addEventListener('click', () => scoreOne(Number(button.dataset.scoreOne))));
    node.querySelectorAll('[data-review-image]').forEach((button) => button.addEventListener('click', () => reviewImage(Number(button.dataset.reviewImage), button.dataset.reviewStatus)));
    renderSetSummary();
  }

  function renderCatalogQueue() {
    const node = byId('imageQualityCatalog');
    if (!node) return;
    if (!state.schemaReady) {
      node.innerHTML = '<p class="small">Release 448 photography D1 schema is not active yet, so the catalog queue cannot persist scores.</p>';
      return;
    }
    if (!state.catalog.length) {
      node.innerHTML = '<p class="small">No Products were returned for the photography queue.</p>';
      return;
    }
    node.innerHTML = `<div class="photo-catalog-table"><table><thead><tr><th>Product</th><th>Image refs</th><th>Scored</th><th>Average</th><th>Best</th><th>Queue</th><th></th></tr></thead><tbody>${state.catalog.map((row) => {
      const scored = Number(row.assessment_count || 0);
      const avg = row.average_score == null ? null : Number(row.average_score);
      const queue = !scored ? 'Unscored' : Number(row.reshoot_count || 0) ? `${row.reshoot_count} reshoot` : Number(row.improve_count || 0) ? `${row.improve_count} improve` : 'Good/excellent';
      return `<tr><td>${esc(row.product_name)}</td><td>${Number(row.source_image_references || 0)}</td><td>${scored}</td><td>${avg == null ? '—' : avg.toFixed(1)}</td><td>${row.best_score == null ? '—' : Number(row.best_score).toFixed(1)}</td><td>${esc(queue)}</td><td><button class="btn" type="button" data-load-product="${Number(row.product_id)}">Open</button></td></tr>`;
    }).join('')}</tbody></table></div>`;
    node.querySelectorAll('[data-load-product]').forEach((button) => button.addEventListener('click', async () => {
      state.productId = Number(button.dataset.loadProduct || 0);
      const select = byId('imageQualityProduct');
      if (select) select.value = String(state.productId);
      await loadProduct().catch((error) => message(error.message || String(error), true));
      byId('imageQualityProduct')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }));
  }

  async function loadCatalogQueue() {
    const payload = await readJson(await apiFetch('/api/admin/product-image-quality?summary=1&limit=1000', { cache: 'no-store' }));
    state.schemaReady = payload.schema_ready !== false;
    state.catalog = Array.isArray(payload.catalog) ? payload.catalog : [];
    renderCatalogQueue();
  }

  async function loadProducts() {
    const payload = await readJson(await apiFetch('/api/admin/product-lineage?limit=1000', { cache: 'no-store' }));
    state.products = Array.isArray(payload.products) ? payload.products : [];
    const select = byId('imageQualityProduct');
    select.innerHTML = '<option value="">Choose a product…</option>' + state.products.map((product) => `<option value="${Number(product.product_id)}" ${Number(product.product_id) === state.productId ? 'selected' : ''}>${esc(product.name || `Product ${product.product_id}`)}</option>`).join('');
    if (state.productId) await loadProduct();
  }

  async function loadProduct() {
    if (!state.productId) return;
    message('Loading Product images and photography evidence…');
    const [detail, quality] = await Promise.all([
      readJson(await apiFetch(`/api/admin/product-detail?product_id=${state.productId}`, { cache: 'no-store' })),
      readJson(await apiFetch(`/api/admin/product-image-quality?product_id=${state.productId}`, { cache: 'no-store' })),
    ]);
    state.images = Array.isArray(detail.images) ? detail.images : [];
    state.assessments = Array.isArray(quality.assessments) ? quality.assessments : [];
    state.schemaReady = quality.schema_ready !== false;
    renderImages();
    history.replaceState(null, '', `/admin/product-image-quality/?product_id=${state.productId}`);
    message(quality.schema_ready === false ? 'Release 448 image-quality D1 schema is not applied yet.' : `${state.images.length} unique Product image(s); ${state.assessments.length} saved assessment(s).`, quality.schema_ready === false);
  }

  async function scoreOne(index) {
    const row = state.images[index];
    if (!row) return;
    message(`Preparing Product-set baseline for image ${index + 1}…`);
    try {
      const ratios = await catalogRatios();
      message(`Scoring image ${index + 1}…`);
      await scoreImage(row, ratios);
      await Promise.all([loadProduct(), loadCatalogQueue()]);
      message(`Image ${index + 1} scored against ${ratios.length || 1} Product-set aspect-ratio sample(s), duplicate fingerprinted and saved.`);
    } catch (error) {
      message(error.message || String(error), true);
    }
  }

  async function scoreAll() {
    if (!state.images.length) return;
    const button = byId('imageQualityScoreAll');
    button.disabled = true;
    let passed = 0, failed = 0;
    try {
      message('Preparing Product-wide consistency baseline…');
      const ratios = await catalogRatios();
      for (let i = 0; i < state.images.length; i++) {
        message(`Scoring and fingerprinting ${i + 1} of ${state.images.length}…`);
        try {
          await scoreImage(state.images[i], ratios);
          passed++;
        } catch {
          failed++;
        }
      }
      await Promise.all([loadProduct(), loadCatalogQueue()]);
      message(`Photography analysis complete: ${passed} saved${failed ? `, ${failed} could not be Canvas-scored (usually CORS/image load)` : ''}.`, Boolean(failed && !passed));
    } finally {
      button.disabled = false;
    }
  }

  async function reviewImage(index, status) {
    const assessment = scoreFor(state.images[index]?.image_url);
    if (!assessment) return;
    message(`${status === 'approved' ? 'Approving' : 'Rejecting'} image ${index + 1} assessment…`);
    try {
      await readJson(await apiFetch('/api/admin/product-image-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'review', product_id: state.productId, assessment_id: assessment.product_image_quality_assessment_id, status }),
      }));
      await Promise.all([loadProduct(), loadCatalogQueue()]);
      message(`Image ${index + 1} assessment marked ${status}.`);
    } catch (error) {
      message(error.message || String(error), true);
    }
  }

  function init() {
    byId('imageQualityProduct')?.addEventListener('change', async (event) => {
      state.productId = Number(event.target.value || 0);
      if (state.productId) await loadProduct().catch((error) => message(error.message || String(error), true));
    });
    byId('imageQualityScoreAll')?.addEventListener('click', scoreAll);
    byId('imageQualityRefresh')?.addEventListener('click', () => Promise.all([loadProduct(), loadCatalogQueue()]).catch((error) => message(error.message || String(error), true)));
    Promise.all([loadProducts(), loadCatalogQueue()]).catch((error) => message(error.message || String(error), true));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
