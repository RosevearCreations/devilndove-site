// Release 467 Build 73 — selected-Product Photo Studio convergence panel.
// Read-only projection over the existing Product image/upload/role editors below it.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('productMediaConvergenceMount');
  if (!mount || !window.DDAuth) return;

  let productId = 0;
  let state = null;
  let errorText = '';
  let loading = false;
  let requestToken = 0;

  const text = (value) => String(value ?? '').trim();
  const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (ch) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;' }[ch]));

  function badge(label, value, warning = false) {
    return `<span class="status-note small${warning ? ' is-warning' : ''}"><strong>${esc(value)}</strong> ${esc(label)}</span>`;
  }

  function imageCard(image, mode = 'gallery') {
    const role = text(image.role_key).replaceAll('_', ' ') || 'unassigned';
    const publicUse = text(image.public_use_status).replaceAll('_', ' ') || 'internal review';
    const evidence = Array.isArray(image.evidence_sources) ? image.evidence_sources.join(' + ') : text(image.source);
    const score = image.quality_score == null ? 'not scored' : `${number(image.quality_score)}/100`;
    const dimensions = image.width_px && image.height_px ? `${number(image.width_px)}×${number(image.height_px)}` : 'dimensions unknown';
    const note = mode === 'unused'
      ? `<p class="small"><strong>Review only:</strong> ${esc(image.review_reason || 'Linked R2 media is outside the canonical gallery/role selection.')}</p>`
      : '';
    return `<article class="card" style="padding:12px;min-width:0">
      <div style="display:grid;grid-template-columns:minmax(88px,120px) 1fr;gap:12px;align-items:start">
        <div style="aspect-ratio:1/1;border:1px solid rgba(127,127,127,.25);border-radius:10px;overflow:hidden;display:grid;place-items:center">
          <img src="${esc(image.image_url)}" alt="${esc(image.alt_text || 'Product media preview')}" loading="lazy" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"/>
        </div>
        <div style="min-width:0">
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
            ${image.is_featured ? '<span class="status-pill is-success">Featured</span>' : ''}
            ${image.is_seo_social ? '<span class="status-pill">SEO/social</span>' : ''}
            ${image.social_eligible ? '<span class="status-pill is-success">Social-ready</span>' : ''}
            ${image.public_blocked ? '<span class="status-pill is-danger">Public blocked</span>' : ''}
          </div>
          <p style="margin:0 0 4px"><strong>${esc(role)}</strong> · ${esc(publicUse)}</p>
          <p class="small" style="margin:0 0 4px">${esc(dimensions)} · quality ${esc(score)} · ${image.alt_ready ? 'alt ready' : 'alt needs work'} · ${image.focal_ready ? 'focal point set' : 'focal point missing'}</p>
          <p class="small" style="margin:0;overflow-wrap:anywhere">Evidence: ${esc(evidence)}</p>
          ${note}
        </div>
      </div>
    </article>`;
  }

  function render() {
    if (!productId) {
      mount.innerHTML = `<section class="card" style="margin:16px 0">
        <p class="eyebrow">Build 73 • Product Media / Photo Studio Convergence</p>
        <h2 style="margin-top:0">One Product media authority</h2>
        <p class="small">Choose a Product above. This panel will reconcile the canonical gallery, linked R2 media, image roles, annotations, focal points, alt text, featured/SEO selection, quality evidence and review-only unused-media candidates. Editing remains in the Product media tools below.</p>
      </section>`;
      return;
    }
    if (loading) {
      mount.innerHTML = `<section class="card" style="margin:16px 0"><p class="eyebrow">Build 73 • Product Media / Photo Studio Convergence</p><h2 style="margin-top:0">Loading Product media authority…</h2><p class="small">Selected Product #${productId}. This is a bounded, read-only convergence request.</p></section>`;
      return;
    }
    if (errorText || !state?.authority) {
      mount.innerHTML = `<section class="card" style="margin:16px 0"><p class="eyebrow">Build 73 • Product Media / Photo Studio Convergence</p><h2 style="margin-top:0">Product media authority needs attention</h2><p class="small">${esc(errorText || 'No convergence data is available yet.')}</p><button class="btn" type="button" data-product-media-convergence-refresh>Retry</button></section>`;
      mount.querySelector('[data-product-media-convergence-refresh]')?.addEventListener('click', () => load(productId));
      return;
    }

    const authority = state.authority;
    const summary = authority.summary || {};
    const images = Array.isArray(authority.images) ? authority.images : [];
    const social = Array.isArray(authority.social_candidates) ? authority.social_candidates : [];
    const unused = Array.isArray(authority.unused_media_review) ? authority.unused_media_review : [];
    const product = authority.product || {};

    mount.innerHTML = `<section class="card" style="margin:16px 0">
      <div class="section-heading-row">
        <div>
          <p class="eyebrow">Build 73 • Product Media / Photo Studio Convergence</p>
          <h2 style="margin-top:0">${esc(product.name || `Product #${productId}`)} photo authority</h2>
          <p class="small">`product_images` remains the canonical gallery. R2-linked `media_assets`, role assignments and annotations are supporting/recovery evidence. This panel never publishes, copies or deletes R2 media.</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" data-product-media-convergence-refresh>Refresh authority</button><a class="btn secondary" href="#productMediaAdminMount">Open photo editor below</a></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">
        ${badge('unique images', summary.unique_image_count || 0)}
        ${badge('canonical gallery', summary.gallery_image_count || 0)}
        ${badge('R2 linked', summary.r2_linked_image_count || 0)}
        ${badge('role assigned', summary.role_assigned_count || 0)}
        ${badge('social-ready', summary.social_candidate_count || 0)}
        ${badge('unused review', summary.unused_media_review_count || 0, number(summary.unused_media_review_count) > 0)}
        ${badge('missing alt', summary.missing_alt_count || 0, number(summary.missing_alt_count) > 0)}
        ${badge('missing focal', summary.missing_focal_count || 0, number(summary.missing_focal_count) > 0)}
      </div>
      <div class="grid cols-3" style="margin-top:12px">
        <div><strong>Featured image</strong><p class="small">${summary.featured_resolved ? 'Resolved' : 'Missing'} · ${summary.featured_in_gallery ? 'in canonical gallery' : 'outside canonical gallery'} · quality ${summary.featured_quality_score == null ? 'not scored' : esc(summary.featured_quality_score)}</p></div>
        <div><strong>SEO / social</strong><p class="small">${summary.seo_social_image_resolved ? 'Current SEO/social image resolves to Product media.' : 'No matching SEO/social image is resolved.'} ${social.length} image${social.length === 1 ? '' : 's'} currently satisfy social-use, alt-text and quality requirements.</p></div>
        <div><strong>Delete safety</strong><p class="small">Unused-media review is advisory only. Nothing here declares an R2 object safe to delete; deletion remains a specialist, step-up action after reference review.</p></div>
      </div>
      <details style="margin-top:14px" ${images.length <= 8 ? 'open' : ''}><summary><strong>Converged Product media (${images.length})</strong></summary><div class="grid cols-2" style="margin-top:10px">${images.map((image) => imageCard(image)).join('') || '<p class="small">No Product media is linked yet.</p>'}</div></details>
      <details style="margin-top:14px"><summary><strong>Social-ready photo candidates (${social.length})</strong></summary><p class="small">Candidates are only approved selections for later Socials work. Build 73 performs no Pinterest/Instagram/provider publication.</p><div class="grid cols-2">${social.map((image) => imageCard(image, 'social')).join('') || '<p class="small">No social-ready Product photos yet.</p>'}</div></details>
      <details style="margin-top:14px" ${unused.length ? 'open' : ''}><summary><strong>Unused-media review (${unused.length})</strong></summary><p class="small">These linked R2 Product assets are not presently in the canonical gallery, featured/SEO selection or a buyer-facing role. Review before detaching or deleting anything.</p><div class="grid cols-2">${unused.map((image) => imageCard(image, 'unused')).join('') || '<p class="small">No linked R2 media currently needs this review.</p>'}</div></details>
    </section>`;
    mount.querySelector('[data-product-media-convergence-refresh]')?.addEventListener('click', () => load(productId));
  }

  async function load(nextId) {
    const id = Number(nextId || 0);
    productId = Number.isInteger(id) && id > 0 ? id : 0;
    state = null;
    errorText = '';
    if (!productId) { render(); return; }
    const token = ++requestToken;
    loading = true;
    render();
    try {
      const response = await window.DDAuth.apiFetch(`/api/admin/product-media-authority?product_id=${encodeURIComponent(productId)}`, { method: 'GET' });
      const data = window.DDAuth?.readApiJson
        ? await window.DDAuth.readApiJson(response, { fallbackMessage: 'Product media convergence could not be loaded.' })
        : await response.json();
      if (token !== requestToken) return;
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Product media convergence could not be loaded.');
      state = data;
    } catch (error) {
      if (token !== requestToken) return;
      errorText = error?.message || 'Product media convergence could not be loaded.';
    } finally {
      if (token === requestToken) {
        loading = false;
        render();
      }
    }
  }

  document.addEventListener('dd:product-media-context-changed', (event) => load(event?.detail?.product_id || 0));
  document.addEventListener('dd:product-updated', (event) => {
    const id = Number(event?.detail?.product_id || event?.detail?.product?.product_id || 0);
    if (id && id === productId) load(id);
  });
  document.addEventListener('dd:product-image-fields-updated', () => { if (productId) load(productId); });
  window.DDProductMediaConvergence = Object.freeze({ refresh: () => load(productId), getProductId: () => productId });
  render();
});
