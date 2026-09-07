// Release 467 Build 74 — buyer-first storefront Product experience.
// This layer enhances the already-rendered Product detail page. It performs no API,
// D1, R2, payment, publication, polling, or provider work.

(() => {
  const BUILD = 74;
  const CONTRACT = 'buyer-first-product-detail';

  const text = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  function availabilityFromFields({ inventory = '', productType = '' } = {}) {
    const inventoryText = text(inventory).toLowerCase();
    const typeText = text(productType).toLowerCase();
    if (typeText.includes('digital')) {
      return { status: 'digital', label: 'Digital item', detail: 'No physical stock is required for this item.' };
    }
    if (/out\s*of\s*stock|sold\s*out|unavailable/.test(inventoryText)) {
      return { status: 'out_of_stock', label: 'Out of stock', detail: 'Use the back-in-stock option if it is available.' };
    }
    const quantityMatch = inventoryText.match(/(?:^|\D)(\d+(?:\.\d+)?)\s*(?:available|in\s*stock|on\s*hand|remaining)?/i);
    if (quantityMatch && Number(quantityMatch[1]) <= 0) {
      return { status: 'out_of_stock', label: 'Out of stock', detail: 'Use the back-in-stock option if it is available.' };
    }
    if (quantityMatch && Number(quantityMatch[1]) > 0) {
      return { status: 'in_stock', label: 'Available', detail: 'Current listed availability is shown on this Product page.' };
    }
    if (/yes|available|in\s*stock/.test(inventoryText)) {
      return { status: 'in_stock', label: 'Available', detail: 'Current listed availability is shown on this Product page.' };
    }
    return { status: 'check', label: 'Check availability', detail: 'Availability is confirmed again before purchase.' };
  }

  function shippingFromFields({ shipping = '', productType = '' } = {}) {
    const shippingText = text(shipping).toLowerCase();
    const typeText = text(productType).toLowerCase();
    if (typeText.includes('digital')) return { label: 'Digital delivery', detail: 'Shipping is not required.' };
    if (/^(no|false|0)$/.test(shippingText)) return { label: 'No shipping required', detail: 'See the listing and checkout for the available handoff method.' };
    if (/^(yes|true|1)$/.test(shippingText)) return { label: 'Shipping applies', detail: 'Shipping rules and destination eligibility are confirmed at checkout.' };
    return { label: 'Delivery details', detail: 'See the Product and checkout information for delivery or pickup details.' };
  }

  function uniqueText(values, limit) {
    const seen = new Set();
    const output = [];
    for (const value of Array.isArray(values) ? values : []) {
      const clean = text(value);
      if (!clean) continue;
      const key = clean.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      output.push(clean);
      if (output.length >= limit) break;
    }
    return output;
  }

  function buildBuyerEssentialsSnapshot(input = {}) {
    const availability = availabilityFromFields(input);
    const shipping = shippingFromFields(input);
    return {
      build: BUILD,
      contract: CONTRACT,
      name: text(input.name) || 'Product',
      price: text(input.price),
      short_description: text(input.shortDescription),
      availability,
      shipping,
      product_type: text(input.productType),
      photo_count: Math.max(0, number(input.photoCount, 0)),
      related_count: Math.max(0, number(input.relatedCount, 0)),
      attributes: uniqueText(input.attributes, 6),
      trust_points: uniqueText(input.trustPoints, 4),
      no_extra_network_request: true,
      automatic_purchase: false,
      automatic_publication: false,
    };
  }

  globalThis.DDStorefrontProductExperience = Object.freeze({
    BUILD,
    CONTRACT,
    availabilityFromFields,
    shippingFromFields,
    buildBuyerEssentialsSnapshot,
  });

  if (typeof document === 'undefined') return;

  function installStyles() {
    if (document.getElementById('dd-build74-storefront-product-experience-style')) return;
    const style = document.createElement('style');
    style.id = 'dd-build74-storefront-product-experience-style';
    style.textContent = `
      .build74-buyer-essentials{margin-top:14px;padding:14px;content-visibility:auto;contain-intrinsic-size:240px}
      .build74-buyer-essentials__header{display:flex;gap:10px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
      .build74-buyer-essentials__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}
      .build74-buyer-essentials__item{min-width:0;padding:10px;border:1px solid color-mix(in srgb,currentColor 16%,transparent);border-radius:10px}
      .build74-buyer-essentials__item strong{display:block;margin-bottom:3px}
      .build74-buyer-essentials__facts{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
      .build74-buyer-essentials__facts span{max-width:100%;overflow-wrap:anywhere}
      #productDescription.build74-readable-description{max-width:68ch;line-height:1.65;overflow-wrap:anywhere}
      #productRelatedProofList.build74-related-products{grid-template-columns:repeat(3,minmax(0,1fr))}
      #productMainImageWrap [data-product-detail-main-image]{width:100%;height:auto;max-height:min(72vh,760px);object-fit:contain}
      #productGallery .product-detail-thumbs{display:flex;gap:8px;overflow-x:auto;overscroll-behavior-inline:contain;padding-bottom:5px;scroll-snap-type:x proximity}
      #productGallery .product-detail-thumb{flex:0 0 clamp(72px,18vw,108px);scroll-snap-align:start}
      #productGallery .product-detail-thumb img{width:100%;height:auto;aspect-ratio:1/1;object-fit:cover}
      @media (max-width:760px){
        .build74-buyer-essentials__grid{grid-template-columns:1fr}
        #productRelatedProofList.build74-related-products{grid-template-columns:1fr}
        #productDetail>.grid.cols-2{grid-template-columns:1fr!important}
      }
    `;
    document.head.appendChild(style);
  }

  function collectTextList(root) {
    return Array.from(root?.querySelectorAll?.('li,.product-quick-fact,.small') || []).map((node) => text(node.textContent)).filter(Boolean);
  }

  function createBuyerEssentials(detail) {
    if (detail.querySelector('[data-build74-buyer-essentials]')) return;
    const name = text(document.getElementById('productName')?.textContent);
    if (!name) return;
    const productType = text(document.getElementById('productType')?.textContent);
    const price = text(document.getElementById('productPrice')?.textContent);
    const shortDescription = text(document.getElementById('productShortDescription')?.textContent);
    const inventory = text(document.getElementById('productInventory')?.textContent);
    const shipping = text(document.getElementById('productShipping')?.textContent);
    const photoCount = detail.querySelectorAll('[data-product-detail-thumb]').length || (detail.querySelector('[data-product-detail-main-image]') ? 1 : 0);
    const relatedCount = document.getElementById('productRelatedProofList')?.children?.length || 0;
    const attributes = collectTextList(document.getElementById('productQuickFacts'));
    const trustPoints = collectTextList(document.getElementById('productTrustList'));
    const snapshot = buildBuyerEssentialsSnapshot({ name, price, shortDescription, inventory, shipping, productType, photoCount, relatedCount, attributes, trustPoints });

    const card = document.createElement('section');
    card.className = 'card build74-buyer-essentials';
    card.dataset.build74BuyerEssentials = '1';
    card.setAttribute('aria-labelledby', 'build74BuyerEssentialsHeading');
    card.innerHTML = `
      <div class="build74-buyer-essentials__header">
        <div><div class="small">Buyer essentials</div><h3 id="build74BuyerEssentialsHeading" style="margin:3px 0 0">At a glance</h3></div>
        <a class="btn" href="#productPurchaseCard">Go to purchase</a>
      </div>
      ${snapshot.short_description ? `<p style="margin-bottom:0">${escapeHtml(snapshot.short_description)}</p>` : ''}
      <div class="build74-buyer-essentials__grid">
        <div class="build74-buyer-essentials__item"><strong>${escapeHtml(snapshot.availability.label)}</strong><span class="small">${escapeHtml(snapshot.availability.detail)}</span></div>
        <div class="build74-buyer-essentials__item"><strong>${escapeHtml(snapshot.shipping.label)}</strong><span class="small">${escapeHtml(snapshot.shipping.detail)}</span></div>
        <div class="build74-buyer-essentials__item"><strong>Photography</strong><span class="small">${snapshot.photo_count ? `${snapshot.photo_count} Product photo${snapshot.photo_count === 1 ? '' : 's'} available.` : 'Product photography is still being completed.'}</span></div>
        <div class="build74-buyer-essentials__item"><strong>More to explore</strong><span class="small">${snapshot.related_count ? `${snapshot.related_count} related piece${snapshot.related_count === 1 ? '' : 's'} currently shown.` : 'Related pieces appear when material, process, or proof context overlaps.'}</span></div>
      </div>
      ${snapshot.attributes.length ? `<div class="build74-buyer-essentials__facts">${snapshot.attributes.map((item) => `<span class="status-note small">${escapeHtml(item)}</span>`).join('')}</div>` : ''}
      ${snapshot.trust_points.length ? `<details style="margin-top:10px"><summary>Why this listing is easier to evaluate</summary><ul class="small" style="padding-left:18px">${snapshot.trust_points.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></details>` : ''}
    `;

    const insertionPoint = document.getElementById('productKeywordTags') || document.getElementById('productShortDescription');
    insertionPoint?.insertAdjacentElement('afterend', card);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[ch]));
  }

  function enhanceImages(detail) {
    const main = detail.querySelector('[data-product-detail-main-image]');
    if (main) {
      main.setAttribute('loading', 'eager');
      main.setAttribute('decoding', 'async');
      main.setAttribute('fetchpriority', 'high');
      main.setAttribute('sizes', '(max-width: 760px) 100vw, 50vw');
    }
    detail.querySelectorAll('#productGallery img').forEach((image) => {
      image.setAttribute('loading', 'lazy');
      image.setAttribute('decoding', 'async');
      image.setAttribute('fetchpriority', 'low');
      image.setAttribute('sizes', '(max-width: 760px) 22vw, 108px');
    });
  }

  function enhanceSupportingSections() {
    document.getElementById('productDescription')?.classList.add('build74-readable-description');
    document.getElementById('productRelatedProofList')?.classList.add('build74-related-products');
    const relatedHeading = document.querySelector('#productRelatedProofCard h3');
    if (relatedHeading) relatedHeading.textContent = 'You may also like';
    const relatedSummary = document.getElementById('productRelatedProofSummary');
    if (relatedSummary && relatedSummary.textContent.trim()) {
      relatedSummary.setAttribute('aria-live', 'polite');
    }
    const purchase = Array.from(document.querySelectorAll('#productDetail .card')).find((card) => card.querySelector('#productQuantity'));
    if (purchase) purchase.id = 'productPurchaseCard';
  }

  function enhanceIfReady() {
    const detail = document.getElementById('productDetail');
    if (!detail || !text(document.getElementById('productName')?.textContent)) return false;
    installStyles();
    enhanceImages(detail);
    enhanceSupportingSections();
    createBuyerEssentials(detail);
    detail.dataset.build74StorefrontExperience = 'ready';
    return true;
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (enhanceIfReady()) return;
    const detail = document.getElementById('productDetail');
    if (!detail || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => {
      if (!enhanceIfReady()) return;
      observer.disconnect();
    });
    observer.observe(detail, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
  });
})();
