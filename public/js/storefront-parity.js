// Release 467 Build 15 — shared buyer-fact, schema, relationship, and fulfillment parity model.
(function (global) {
  'use strict';

  const SHIPPING_POLICY = Object.freeze({
    code: 'CA_ONLY',
    allowed_countries: ['CA'],
    country_name: 'Canada',
    public_message: 'Devil n Dove storefront shipping is currently limited to Canada. Local pickup may be available where arranged.',
    us_sales_shipping_suspended: true
  });

  const text = (value) => String(value == null ? '' : value).trim();
  const list = (...values) => {
    const out = [];
    const seen = new Set();
    values.flatMap((value) => Array.isArray(value) ? value : text(value).split(/[|,;/\n]+/)).forEach((value) => {
      const clean = text(value);
      const key = clean.toLowerCase();
      if (clean && !seen.has(key)) { seen.add(key); out.push(clean); }
    });
    return out;
  };

  function availability(product) {
    const tracked = Number(product?.inventory_tracking || 0) === 1;
    const qty = Number(product?.inventory_quantity || 0);
    return {
      tracked,
      quantity: qty,
      in_stock: tracked ? qty > 0 : true,
      label: tracked ? (qty > 0 ? `${qty} currently available` : 'Currently out of stock') : 'Availability confirmed on the listing'
    };
  }

  function buyerFacts(product = {}, profile = {}, story = {}) {
    const materials = text(profile.materials_text) || text(product.proof_material) || list(product.proof_materials, product.primary_material, product.material).join(', ');
    const process = text(product.proof_process) || list(product.proof_processes, product.making_process, story.process_notes).join(', ');
    const finish = text(profile.finish_text) || text(product.condition_summary);
    const dimensions = text(profile.dimensions_text) || (Number(product.weight_grams || 0) > 0 ? `${Number(product.weight_grams)} g` : '');
    const care = text(profile.care_summary) || text(story.care_notes);
    const bestFor = text(profile.best_for_text);
    const personalization = text(profile.personalization_limits || product.personalization_limits || product.personalization_note || product.customization_note);
    const avail = text(profile.availability_note) || availability(product).label;
    const pickup = text(profile.shipping_pickup_note) || text(story.local_pickup_note) || text(product.local_pickup_note);
    const handmade = text(profile.handmade_variation_note) || (text(product.merchandise_origin).toLowerCase() === 'handmade'
      ? 'Small variations in pattern, placement, colour, or finish can be part of a handmade piece.' : '');
    const shipping = Number(product.requires_shipping || 0) === 1 ? SHIPPING_POLICY.public_message : 'This item does not require storefront shipping.';
    const facts = {
      best_for: bestFor,
      materials,
      process,
      finish_condition: finish,
      dimensions,
      care,
      personalization_limits: personalization,
      availability: avail,
      shipping_pickup: [shipping, pickup].filter(Boolean).join(' '),
      handmade_limitations: handmade
    };
    const required = ['materials', 'finish_condition', 'dimensions', 'care', 'personalization_limits', 'availability'];
    facts.missing = required.filter((key) => !text(facts[key]));
    return facts;
  }

  function canonicalFor(product = {}, fallback = '') {
    const explicit = text(product.canonical_url);
    if (explicit) return explicit;
    const slug = encodeURIComponent(text(product.slug));
    return slug ? `https://devilndove.com/shop/product/?slug=${slug}` : text(fallback) || 'https://devilndove.com/shop/product/';
  }

  function productSchema({ product = {}, facts = {}, images = [], canonical = '' } = {}) {
    const url = canonicalFor(product, canonical);
    const imageUrls = list(images.map((row) => typeof row === 'string' ? row : row?.image_url), product.featured_image_url, product.og_image_url);
    const avail = availability(product);
    const properties = [
      ['Materials', facts.materials], ['Process', facts.process], ['Finish / condition', facts.finish_condition],
      ['Size / dimensions', facts.dimensions], ['Care', facts.care], ['Personalization limits', facts.personalization_limits],
      ['Availability', facts.availability], ['Shipping / pickup', facts.shipping_pickup], ['Handmade note', facts.handmade_limitations]
    ].filter(([, value]) => text(value)).map(([name, value]) => ({ '@type': 'PropertyValue', name, value: text(value) }));
    const offer = {
      '@type': 'Offer',
      priceCurrency: text(product.currency) || 'CAD',
      price: (Math.max(0, Number(product.price_cents || 0)) / 100).toFixed(2),
      availability: avail.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: text(product.sale_channel).toLowerCase() === 'external_only' && text(product.external_listing_url) ? text(product.external_listing_url) : url
    };
    if (Number(product.requires_shipping || 0) === 1) {
      offer.shippingDetails = {
        '@type': 'OfferShippingDetails',
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'CA' }
      };
    }
    const productNode = {
      '@type': text(product.schema_type) || 'Product',
      '@id': `${url}#product`,
      name: text(product.name) || 'Devil n Dove product',
      description: text(product.meta_description) || text(product.short_description) || text(product.description),
      sku: text(product.sku) || undefined,
      image: imageUrls,
      category: text(product.product_category) || undefined,
      url,
      additionalProperty: properties,
      offers: offer
    };
    const breadcrumb = {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://devilndove.com/' },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://devilndove.com/shop/' },
        { '@type': 'ListItem', position: 3, name: text(product.name) || 'Product', item: url }
      ]
    };
    return { '@context': 'https://schema.org', '@graph': [productNode, breadcrumb] };
  }

  function relationshipLinks(product = {}) {
    const links = [];
    const push = (label, key, value) => { const clean = text(value); if (clean) links.push({ label: `${label}: ${clean}`, href: `/shop/?${key}=${encodeURIComponent(clean)}&focus=products` }); };
    push('Material', 'material', (Array.isArray(product.proof_materials) ? product.proof_materials[0] : '') || product.primary_material || product.material);
    push('Process', 'process', (Array.isArray(product.proof_processes) ? product.proof_processes[0] : '') || product.making_process);
    push('Type', 'product_type', product.product_type);
    push('Origin', 'merchandise_origin', product.merchandise_origin);
    if (text(product.product_category)) links.push({ label: `Category: ${text(product.product_category)}`, href: `/shop/?q=${encodeURIComponent(text(product.product_category))}&focus=products` });
    return links.slice(0, 5);
  }

  function isAllowedShippingCountry(value) {
    const country = text(value).toLowerCase().replace(/[^a-z]/g, '');
    return !country || ['ca', 'can', 'canada'].includes(country);
  }

  global.DDStorefrontParity = { SHIPPING_POLICY, buyerFacts, productSchema, relationshipLinks, availability, canonicalFor, isAllowedShippingCountry };
})(window);
