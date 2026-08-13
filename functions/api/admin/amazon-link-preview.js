// Build 256 — review-first Amazon link preview for inventory and Packaging Studio source-material templates.
import { auditAdminAction, getAdminUserFromRequest, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

function decodeHtml(value = '') {
  return String(value)
    .replace(/&quot;/gi, '"').replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'").replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&#x27;/gi, "'").replace(/&#x2F;/gi, '/').replace(/\s+/g, ' ')
    .trim();
}

function pickMeta(html, names = []) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i')
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeHtml(match[1]);
    }
  }
  return '';
}

async function readBoundedText(response, maxBytes = 2500000) {
  const length = Number(response?.headers?.get?.('content-length') || 0);
  if (Number.isFinite(length) && length > maxBytes) throw new Error('Amazon page is too large to preview safely. Use manual entry for this item.');
  if (!response?.body?.getReader) return String(await response.text()).slice(0, maxBytes);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0; let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value?.byteLength || 0;
      if (total > maxBytes) { try { await reader.cancel(); } catch {} throw new Error('Amazon page is too large to preview safely. Use manual entry for this item.'); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return text;
  } finally { try { reader.releaseLock(); } catch {} }
}

function extractAsin(url) {
  const path = String(url.pathname || '');
  const match = path.match(/\/(?:dp|gp\/product|gp\/aw\/d|product)\/([A-Z0-9]{10})(?:[/?]|$)/i)
    || path.match(/\/([A-Z0-9]{10})(?:[/?]|$)/i);
  return match?.[1]?.toUpperCase() || '';
}

function normalizeAmazonUrl(rawUrl) {
  let parsed;
  try { parsed = new URL(String(rawUrl || '').trim()); } catch { throw new Error('Enter a valid Amazon product URL.'); }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  if (!/(^|\.)amazon\.(ca|com|co\.uk|com\.au|de|fr|it|es|co\.jp)$/.test(host) && !/(^|\.)amzn\.(to|eu)$/.test(host)) {
    throw new Error('Only Amazon or amzn product links are supported.');
  }
  return parsed;
}

function findJsonLdProducts(html) {
  const results = [];
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]);
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) {
        const item = queue.shift();
        if (!item || typeof item !== 'object') continue;
        if (Array.isArray(item['@graph'])) queue.push(...item['@graph']);
        const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
        if (types.some((type) => String(type).toLowerCase() === 'product')) results.push(item);
      }
    } catch { /* Amazon pages do not always expose valid JSON-LD. */ }
  }
  return results;
}

function textFromHtml(html, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<[^>]+id=["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i'));
  return match?.[1] ? decodeHtml(match[1].replace(/<[^>]+>/g, ' ')) : '';
}

function inferCategory(title = '', description = '') {
  const haystack = `${title} ${description}`.toLowerCase();
  const rules = [
    ['Safety equipment', /respirator|glove|goggle|mask|hearing protection|apron/],
    ['Packaging', /shipping|mailer|packing|bubble wrap|tape|box|label/],
    ['Resin supplies', /epoxy|uv resin|resin|mold|silicone/],
    ['Candle supplies', /candle|wax|wick|fragrance oil|dye/],
    ['Jewelry supplies', /jewelry|jewellery|bead|wire|cabochon|ring blank|chain/],
    ['3D printing', /3d print|filament|ender|creality|nozzle|hotend|build plate/],
    ['Laser / CNC', /laser|engraver|cnc|router bit|cutting mat/],
    ['Tools', /tool|drill|saw|plier|cutter|sander|lathe|torch|kiln/]
  ];
  return rules.find(([, pattern]) => pattern.test(haystack))?.[0] || '';
}


function flattenVisibleText(html = '') {
  return decodeHtml(String(html || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|h[1-6]|section|table)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n'))
    .slice(0, 180000);
}

function labeledBlock(text = '', labels = [], stopLabels = []) {
  const source = String(text || '');
  for (const label of labels) {
    const escaped = String(label).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = source.match(new RegExp(`(?:^|\\n|\\b)${escaped}\\s*:?\\s*([\\s\\S]{1,2200})`, 'i'));
    if (!match?.[1]) continue;
    let block = match[1];
    const stops = stopLabels.length ? stopLabels : ['Directions', 'Description', 'About this item', 'Product information', 'Technical details', 'Safety information', 'Important information', 'Legal Disclaimer', 'Manufacturer'];
    let stopAt = block.length;
    for (const stop of stops) {
      const escapedStop = String(stop).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const stopMatch = block.match(new RegExp(`(?:\\n|\\b)${escapedStop}\\s*:?`, 'i'));
      if (stopMatch?.index != null && stopMatch.index > 4) stopAt = Math.min(stopAt, stopMatch.index);
    }
    block = block.slice(0, stopAt).replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
    if (block.length >= 3) return block.slice(0, 1400);
  }
  return '';
}

function inferPackagingMaterial(title = '', description = '') {
  const haystack = `${title} ${description}`.toLowerCase();
  if (/\bsoap\b.*\bbase\b|\bmelt\s*(?:&|and)?\s*pour\b|\bglycerin(?:e)?\s+soap\s+base\b/.test(haystack)) {
    return { product_family: 'soap', material_subtype: 'soap_base', intended_use: 'rinse_off', colour_hex: '#C9B18A' };
  }
  if (/\bessential\s+oil\b/.test(haystack)) {
    return { product_family: 'soap', material_subtype: 'essential_oil_blend', intended_use: 'both', colour_hex: '#D9C87A' };
  }
  if (/\bfragrance\s+oil\b|\bfragrance\b.*\boil\b/.test(haystack)) {
    return { product_family: 'general', material_subtype: 'fragrance_oil', intended_use: 'both', colour_hex: '#CFA9C8' };
  }
  if (/\bmica\b|\bpigment\b/.test(haystack)) {
    return { product_family: 'general', material_subtype: 'mica', intended_use: 'not_applicable', colour_hex: '#A57BCB' };
  }
  if (/\bsoap\s+dye\b|\bcandle\s+dye\b|\bcolourant\b|\bcolorant\b|\bliquid\s+color\b|\bliquid\s+colour\b/.test(haystack)) {
    return { product_family: 'general', material_subtype: 'colourant', intended_use: 'not_applicable', colour_hex: '#A57BCB' };
  }
  if (/\bcandle\b.*\bwax\b|\bsoy\s+wax\b|\bparaffin\b|\bbeeswax\b|\bcoconut\s+wax\b/.test(haystack)) {
    return { product_family: 'candle', material_subtype: 'candle_wax', intended_use: 'not_applicable', colour_hex: '#F0E7CF' };
  }
  if (/\bshea\s+butter\b|\bcocoa\s+butter\b|\bcarrier\s+oil\b|\bjojoba\b/.test(haystack)) {
    return { product_family: 'bath_body', material_subtype: 'carrier_oil_butter', intended_use: 'both', colour_hex: '#D7BE8A' };
  }
  return { product_family: 'general', material_subtype: 'other', intended_use: 'not_applicable', colour_hex: '#C9B18A' };
}


function inferColourHex(value = '', fallback = '#C9B18A') {
  const haystack = String(value || '').toLowerCase();
  const colours = [
    ['charcoal', '#4A4A4A'], ['black', '#222222'], ['white', '#F6F3EA'], ['cream', '#E7D9B8'], ['beige', '#C9B18A'],
    ['lavender', '#A57BCB'], ['purple', '#8E61AA'], ['pink', '#D986A5'], ['red', '#B23A48'], ['coral', '#D96C5F'],
    ['orange', '#D9822B'], ['yellow', '#D8B33C'], ['gold', '#C28A2E'], ['silver', '#A9ADB5'], ['copper', '#B87333'], ['bronze', '#8C6B3E'],
    ['blue green', '#4F9599'], ['blue-green', '#4F9599'], ['teal', '#4F9599'], ['blue', '#4F79A7'], ['green', '#6D8757'], ['brown', '#755744']
  ];
  return colours.find(([name]) => haystack.includes(name))?.[1] || fallback;
}

function amazonFeatureBullets(html = '') {
  const block = String(html || '').match(/<div[^>]+id=["']feature-bullets["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] || '';
  const values = [];
  for (const match of block.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    const value = decodeHtml(match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
    if (value && !/make sure this fits/i.test(value) && !values.includes(value)) values.push(value.slice(0, 1200));
    if (values.length >= 12) break;
  }
  return values;
}

function ingredientDraftRows(raw = '') {
  const source = normalizeText(raw);
  if (!source || source.length > 1400) return [];
  const normalized = source.replace(/\s*[•·]\s*/g, ',').replace(/\s*;\s*/g, ',');
  const pieces = normalized.split(',').map((part) => normalizeText(part.replace(/^ingredients?\s*:?\s*/i, ''))).filter(Boolean);
  if (pieces.length < 2 || pieces.length > 60) return [];
  return pieces.slice(0, 60).map((name, index) => ({
    sort_order: index + 1,
    inci_name: name.slice(0, 300),
    display_name_en: name.slice(0, 300),
    display_name_fr: '',
    organic_flag: 0,
    allergen_note: 'Imported from Amazon page text; verify against the supplier/manufacturer INCI or SDS before label approval.',
    required_on_label: 1,
    verification_status: 'needs_review'
  }));
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  let body = {};
  try { body = await context.request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }

  let supplied;
  try { supplied = normalizeAmazonUrl(body.amazon_url); } catch (error) { return json({ ok: false, error: error.message }, 400); }

  let resolved = supplied;
  let response;
  try {
    response = await fetch(supplied.toString(), {
      redirect: 'follow',
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-CA,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (compatible; DevilNDoveInventoryPreview/1.0; +https://devilndove.com)'
      },
      cf: { cacheTtl: 300, cacheEverything: false }
    });
    if (response?.url) resolved = normalizeAmazonUrl(response.url);
  } catch {
    return json({ ok: false, error: 'Amazon could not be reached from the server. You can still paste the link into the manual inventory form.' }, 502);
  }

  const asin = extractAsin(resolved) || extractAsin(supplied);
  const canonicalUrl = asin ? `https://www.amazon.ca/dp/${asin}` : resolved.toString();
  let html = '';
  try { html = await readBoundedText(response); } catch (error) { return json({ ok: false, error: error.message || 'Amazon response could not be read safely.', asin, canonical_url: canonicalUrl }, 502); }
  if (!response.ok || !html) {
    return json({ ok: false, error: `Amazon returned ${response.status || 'an empty response'}. The link remains usable for manual entry.`, asin, canonical_url: canonicalUrl }, 502);
  }

  const product = findJsonLdProducts(html)[0] || {};
  const title = normalizeText(product.name || pickMeta(html, ['og:title', 'twitter:title']) || textFromHtml(html, 'productTitle')).replace(/\s*:\s*Amazon\.ca.*$/i, '').slice(0, 300);
  const description = normalizeText(product.description || pickMeta(html, ['og:description', 'description']) || textFromHtml(html, 'feature-bullets')).slice(0, 2400);
  const imageValue = product.image || pickMeta(html, ['og:image', 'twitter:image']);
  const imageUrl = Array.isArray(imageValue) ? imageValue[0] : normalizeText(imageValue);
  const brand = normalizeText(typeof product.brand === 'object' ? product.brand?.name : product.brand).slice(0, 120);
  const sku = normalizeText(product.sku || product.mpn || asin).slice(0, 120);
  const category = normalizeText(product.category || inferCategory(title, description)).toLowerCase().slice(0, 120);

  const visibleText = flattenVisibleText(html);
  const ingredientDeclaration = labeledBlock(visibleText, ['Ingredients', 'Ingredient list', 'INCI', 'Ingredients List']);
  const allergenStatement = labeledBlock(visibleText, ['Allergens', 'Allergen information', 'Allergen Information'], ['Ingredients', 'Directions', 'Description', 'About this item', 'Product information']);
  const packagingHint = inferPackagingMaterial(title, `${description} ${visibleText.slice(0, 12000)}`);
  packagingHint.colour_hex = inferColourHex(`${title} ${description}`, packagingHint.colour_hex);
  const featureBullets = amazonFeatureBullets(html);
  const packagingSourceDraft = {
    material_name: title || (asin ? `Amazon material ${asin}` : 'Amazon source material'),
    supplier_product_name: title,
    supplier_name: brand ? `Amazon.ca / ${brand}` : 'Amazon.ca',
    supplier_sku: sku,
    source_url: canonicalUrl,
    source_image_url: imageUrl,
    supplier_document_url: '',
    product_family: packagingHint.product_family,
    material_subtype: packagingHint.material_subtype,
    intended_use: packagingHint.intended_use,
    colour_hex: packagingHint.colour_hex,
    ingredient_declaration_raw: ingredientDeclaration,
    master_inci: ingredientDraftRows(ingredientDeclaration),
    allergen_statement: allergenStatement,
    benefits: featureBullets.map((body, index) => ({ sort_order: index + 1, title: `Amazon product detail ${index + 1}`, body, label_candidate: 0 })),
    supplier_claims: [],
    usage_notes: description,
    compliance_notes: 'Amazon-assisted draft only. Verify the exact purchased product, supplier/manufacturer documentation, INCI, allergens, intended use and concentration before using this record for a finished label.',
    verification_status: 'needs_review',
    fragrance_allergen_review_status: ['fragrance_oil','essential_oil_blend'].includes(packagingHint.material_subtype) ? 'needs_supplier_data' : 'not_applicable'
  };

  const warnings = [];
  if (!asin) warnings.push('ASIN could not be identified from this URL.');
  if (!title) warnings.push('Amazon did not expose a product title to the preview request.');
  if (!imageUrl) warnings.push('Amazon did not expose a usable product image.');
  if (!ingredientDeclaration) warnings.push('No reliable ingredient section was exposed by the Amazon page. Paste the supplier/manufacturer ingredient or INCI list manually before saving the source template.');
  warnings.push('Amazon data is a review-first convenience only. Verify the exact purchased item and supplier/manufacturer documentation before saving or printing.');

  const draft = {
    source_type: normalizeText(body.source_type).toLowerCase() === 'tool' ? 'tool' : 'supply',
    external_key: asin ? `amazon-${asin.toLowerCase()}` : `amazon-${Date.now().toString(36)}`,
    item_name: title,
    item_description: description,
    category,
    source_url: canonicalUrl,
    amazon_url: canonicalUrl,
    image_url: imageUrl,
    on_hand_quantity: 1,
    supplier_name: brand ? `Amazon.ca / ${brand}` : 'Amazon.ca',
    supplier_sku: sku,
    supplier_contact: 'Amazon.ca',
    reorder_notes: asin ? `Imported from Amazon link for review. ASIN ${asin}.` : 'Imported from Amazon link for review.',
    stock_unit_label: normalizeText(body.source_type).toLowerCase() === 'tool' ? 'tool' : 'package',
    usage_unit_label: normalizeText(body.source_type).toLowerCase() === 'tool' ? 'use' : 'unit',
    usage_units_per_stock_unit: 1
  };

  await auditAdminAction(context.env, context.request, adminUser, {
    action_type: 'inventory_amazon_link_preview',
    target_type: 'amazon_product',
    target_key: asin || canonicalUrl,
    details: { canonical_url: canonicalUrl, fields_found: Object.entries(draft).filter(([, value]) => Boolean(value)).map(([key]) => key), warnings }
  }).catch(() => null);

  return json({ ok: true, draft, packaging_source_draft: packagingSourceDraft, asin, canonical_url: canonicalUrl, warnings, source: 'amazon_page_metadata_review_required' });
}
