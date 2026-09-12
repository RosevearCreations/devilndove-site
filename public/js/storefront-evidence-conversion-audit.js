// Release 467 Build 110 — Storefront Evidence & SEO Conversion Audit.
// Uses only Product data already loaded or rendered by the owning Storefront page. No API request, Product mutation, provider call, or publication action is added.
(() => {
  'use strict';

  const BUILD = 110;
  const CONTRACT = 'storefront-evidence-seo-conversion-audit';
  const text = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const lower = (value) => text(value).toLowerCase();
  const truthy = (value) => value === true || Number(value) === 1 || ['true','yes','enabled','eligible','allowed'].includes(lower(value));
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const absolute = (path) => new URL(path, 'https://devilndove.com').href;
  const realImage = (value) => {
    const url = text(typeof value === 'string' ? value : value?.image_url || value?.url || '');
    if (!url) return '';
    const key = lower(url);
    if (key.includes('/assets/visual-placeholders/') || key.includes('placeholder')) return '';
    return url;
  };
  const productImages = (product = {}, images = []) => {
    const output = [];
    const add = (value) => {
      const url = realImage(value);
      if (!url || output.some((row) => lower(row) === lower(url))) return;
      output.push(url);
    };
    add(product.featured_image_url || product.og_image_url);
    (Array.isArray(images) ? images : []).forEach(add);
    (Array.isArray(product.images) ? product.images : []).forEach(add);
    (Array.isArray(product.image_urls) ? product.image_urls : []).forEach(add);
    return output;
  };
  const proofFields = (product = {}, story = {}) => [
    product.proof_material, product.primary_material, product.material, product.materials, product.materials_text,
    product.proof_process, product.making_process, product.process_notes,
    product.proof_locality, product.locality_label,
    product.public_story_snippet, product.public_story_summary,
    story.story_summary, story.story_body, story.process_notes
  ].flatMap((value) => Array.isArray(value) ? value : [value]).map(text).filter(Boolean);
  const pickupEvidence = (product = {}) => [product.local_pickup_eligible, product.allow_local_pickup, product.pickup_eligible, product.local_pickup_supported].some(truthy)
    || /\blocal pickup\b|\bcurbside pickup\b|\bpickup eligible\b/.test(lower([product.fulfilment_notes, product.shipping_notes, product.locality_label].map(text).join(' | ')));
  const inventoryKnown = (product = {}) => Number(product.inventory_tracking || 0) === 1 || Number.isFinite(Number(product.inventory_quantity));
  const productUrl = (product = {}) => product.slug ? absolute(`/shop/product/?slug=${encodeURIComponent(product.slug)}`) : absolute('/shop/');
  const setJsonLd = (id, payload) => {
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(payload);
  };

  function shopProductSchema(product = {}, position = 1) {
    const name = text(product.name);
    const url = productUrl(product);
    const images = productImages(product);
    const item = { '@type':'Product', name:name || 'Devil n Dove Product', url };
    if (images.length) item.image = images.slice(0, 3).map(absolute);
    const category = text(product.product_category || product.category || product.product_type);
    if (category) item.category = category;
    const priceCents = Number(product.price_cents);
    if (Number.isFinite(priceCents) && priceCents >= 0) {
      const offer = { '@type':'Offer', priceCurrency:text(product.currency) || 'CAD', price:(priceCents / 100).toFixed(2), url:String(product.sale_channel || 'onsite').toLowerCase() === 'external_only' && text(product.external_listing_url) ? text(product.external_listing_url) : url };
      if (inventoryKnown(product)) offer.availability = Number(product.inventory_quantity || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
      item.offers = offer;
    }
    return { '@type':'ListItem', position, url, item };
  }

  function renderShopAudit(data = {}) {
    const products = Array.isArray(data.products) ? data.products : [];
    const mount = document.getElementById('shopDiscoveryIntelligence');
    if (!mount) return;
    const counts = products.reduce((acc, product) => {
      if (productImages(product).length) acc.realPhoto += 1;
      if (Number.isFinite(Number(product.price_cents)) && Number(product.price_cents) >= 0) acc.price += 1;
      if (inventoryKnown(product)) acc.availability += 1;
      if (proofFields(product).length) acc.proof += 1;
      if (pickupEvidence(product)) acc.pickup += 1;
      return acc;
    }, { realPhoto:0, price:0, availability:0, proof:0, pickup:0 });
    mount.innerHTML = `<section class="card" aria-labelledby="build110StorefrontEvidenceHeading"><h2 id="build110StorefrontEvidenceHeading" style="margin-top:0">Storefront evidence check</h2><p class="small">This summary is derived from the current public Product facts already loaded by Shop. Missing evidence stays missing; placeholder artwork is not counted as Product proof.</p><div class="customer-welcome-grid"><div><strong>${counts.realPhoto} / ${products.length}</strong><p class="small">Products with at least one real public image.</p></div><div><strong>${counts.price} / ${products.length}</strong><p class="small">Products with a current CAD-compatible price fact.</p></div><div><strong>${counts.availability} / ${products.length}</strong><p class="small">Products with explicit inventory / availability evidence.</p></div><div><strong>${counts.proof} / ${products.length}</strong><p class="small">Products with material, process, locality, or public-story evidence.</p></div></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><a class="btn secondary" href="/shop/?discover=proof-rich">Proof-rich Products</a><a class="btn secondary" href="/collections/">Collections</a><a class="btn secondary" href="/pickup/">Local pickup</a><a class="btn secondary" href="/custom-request/">Request custom work</a></div></section>`;
    setJsonLd('build110ShopStructuredData', { '@context':'https://schema.org', '@type':'CollectionPage', name:'Shop Devil n Dove', url:absolute('/shop/'), mainEntity:{ '@type':'ItemList', itemListElement:products.filter((product) => text(product.name) && text(product.slug)).slice(0,24).map((product,index) => shopProductSchema(product,index+1)) } });
  }

  function productSchema(detail = {}) {
    const product = detail.product || {};
    const images = productImages(product, detail.images || []);
    const canonical = text(product.canonical_url) || productUrl(product);
    const schema = { '@context':'https://schema.org', '@type':text(product.schema_type) || 'Product', name:text(product.name) || 'Devil n Dove Product', url:canonical, seller:{ '@type':'Organization', name:'Devil n Dove', url:absolute('/') } };
    const description = text(product.meta_description || product.short_description || product.description);
    if (description) schema.description = description;
    if (text(product.sku)) schema.sku = text(product.sku);
    if (images.length) schema.image = images.map(absolute);
    const category = text(product.product_category || product.category || product.product_type);
    if (category) schema.category = category;
    const priceCents = Number(product.price_cents);
    if (Number.isFinite(priceCents) && priceCents >= 0) {
      schema.offers = { '@type':'Offer', priceCurrency:text(product.currency) || 'CAD', price:(priceCents / 100).toFixed(2), url:String(product.sale_channel || 'onsite').toLowerCase() === 'external_only' && text(product.external_listing_url) ? text(product.external_listing_url) : canonical };
      if (inventoryKnown(product)) schema.offers.availability = Number(product.inventory_quantity || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
    }
    return schema;
  }

  function insertProductAudit(signals) {
    const purchase = document.getElementById('productPurchaseCard');
    if (!purchase || document.getElementById('productEvidenceConversionCard')) return false;
    const card = document.createElement('section');
    card.id = 'productEvidenceConversionCard';
    card.className = 'card';
    card.style.marginTop = '14px';
    card.setAttribute('aria-labelledby','productEvidenceConversionHeading');
    card.innerHTML = `<h3 id="productEvidenceConversionHeading" style="margin-top:0">Buyer evidence &amp; next step</h3><p class="small">These signals come from the same Product facts already shown on this page. Placeholder media and missing facts are not promoted into claims.</p><ul class="small" style="padding-left:18px">${signals.map((signal) => `<li>${escapeHtml(signal)}</li>`).join('')}</ul><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn secondary" href="/collections/">Browse related collections</a><a class="btn secondary" href="/custom-request/">Request custom work</a><a class="btn secondary" href="/pickup/">Local pickup</a><a class="btn secondary" href="/contact/">Ask a question</a></div>`;
    purchase.parentNode?.insertBefore(card,purchase);
    return true;
  }

  function renderProductAudit(detail = {}) {
    const product = detail.product || {};
    const images = productImages(product,detail.images || []);
    const proofs = proofFields(product,detail.story_notes || {});
    const reviews = Array.isArray(detail.reviews) ? detail.reviews : [];
    const signals = [];
    if (images.length) signals.push(`${images.length} real public Product image${images.length === 1 ? '' : 's'} available.`);
    if (proofs.length) signals.push('Material, process, locality, or public-story evidence is available for this listing.');
    if (reviews.length) signals.push(`${reviews.length} approved buyer review${reviews.length === 1 ? '' : 's'} shown.`);
    if (inventoryKnown(product)) signals.push(Number(product.inventory_quantity || 0) > 0 ? 'Current inventory indicates this item is available.' : 'Current inventory indicates this item is not in stock; follow-up options remain available.');
    if (pickupEvidence(product)) signals.push('This Product contains explicit local-pickup evidence.');
    if (Number(product.requires_shipping || 0) === 1) signals.push('This Product is marked as shipping-required; checkout confirms the current Canada-only fulfilment rules.');
    if (!signals.length) signals.push('No additional public proof is being inferred beyond the Product facts shown on this page.');
    insertProductAudit(signals);
    setJsonLd('productStructuredData',productSchema(detail));
  }

  function renderProductAuditFromDom() {
    const detail = document.getElementById('productDetail');
    const name = text(document.getElementById('productName')?.textContent);
    const script = document.getElementById('productStructuredData');
    if (!detail || !name || !script) return false;
    let schema = {};
    try { schema = JSON.parse(script.textContent || '{}') || {}; } catch { schema = {}; }
    const realImages = Array.from(detail.querySelectorAll('img')).map((img) => realImage(img.currentSrc || img.src)).filter(Boolean);
    const quickFacts = text(document.getElementById('productQuickFacts')?.textContent);
    const story = text(document.getElementById('productPublicStoryCard')?.textContent);
    const reviews = document.getElementById('productReviewsCard');
    const inventory = text(document.getElementById('productInventory')?.textContent);
    const shipping = text(document.getElementById('productShipping')?.textContent);
    const signals = [];
    if (realImages.length) signals.push(`${new Set(realImages).size} real public Product image${new Set(realImages).size === 1 ? '' : 's'} available.`);
    if (quickFacts || story) signals.push('Buyer-visible material, process, care, locality, or story context is present on this Product page.');
    if (reviews && reviews.style.display !== 'none' && text(reviews.textContent)) signals.push('Approved buyer review evidence is shown on this page.');
    if (inventory && inventory !== '—') signals.push(`Inventory shown to the buyer: ${inventory}.`);
    if (shipping) signals.push(`Shipping requirement shown to the buyer: ${shipping}.`);
    if (!signals.length) signals.push('No additional public proof is being inferred beyond the Product facts shown on this page.');
    insertProductAudit(signals);
    const aligned = { ...schema, '@context':'https://schema.org', '@type':schema['@type'] || 'Product', name:schema.name || name, url:schema.url || document.querySelector('link[rel="canonical"]')?.href || location.href, seller:{ '@type':'Organization', name:'Devil n Dove', url:absolute('/') } };
    if (Array.isArray(schema.image)) aligned.image = schema.image.map(realImage).filter(Boolean).map(absolute);
    else if (realImage(schema.image)) aligned.image = [absolute(realImage(schema.image))];
    else if (realImages.length) aligned.image = [...new Set(realImages)].map(absolute);
    if (aligned.offers && typeof aligned.offers === 'object') aligned.offers = { ...aligned.offers, priceCurrency:text(aligned.offers.priceCurrency) || 'CAD' };
    setJsonLd('productStructuredData',aligned);
    return true;
  }

  document.addEventListener('dd:shop:data',(event) => renderShopAudit(event.detail?.data || {}));
  document.addEventListener('dd:product-detail-rendered',(event) => renderProductAudit(event.detail || {}));
  document.addEventListener('DOMContentLoaded',() => {
    if (renderProductAuditFromDom()) return;
    const detail = document.getElementById('productDetail');
    if (!detail || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => { if (renderProductAuditFromDom()) observer.disconnect(); });
    observer.observe(detail,{ childList:true, subtree:true, attributes:true, attributeFilter:['style'] });
  },{once:true});
  globalThis.DDStorefrontEvidenceConversionAudit = Object.freeze({ BUILD, CONTRACT, realImage, productImages, proofFields, pickupEvidence, productSchema, renderShopAudit, renderProductAuditFromDom });
})();
