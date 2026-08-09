// Build 218 — review-first Amazon link metadata preview for inventory creation.
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
  const html = await response.text().catch(() => '');
  if (!response.ok || !html) {
    return json({ ok: false, error: `Amazon returned ${response.status || 'an empty response'}. The link remains usable for manual entry.`, asin, canonical_url: canonicalUrl }, 502);
  }

  const product = findJsonLdProducts(html)[0] || {};
  const title = normalizeText(product.name || pickMeta(html, ['og:title', 'twitter:title']) || textFromHtml(html, 'productTitle')).replace(/\s*:\s*Amazon\.ca.*$/i, '').slice(0, 300);
  const description = normalizeText(product.description || pickMeta(html, ['og:description', 'description']) || textFromHtml(html, 'feature-bullets')).slice(0, 1200);
  const imageValue = product.image || pickMeta(html, ['og:image', 'twitter:image']);
  const imageUrl = Array.isArray(imageValue) ? imageValue[0] : normalizeText(imageValue);
  const brand = normalizeText(typeof product.brand === 'object' ? product.brand?.name : product.brand).slice(0, 120);
  const sku = normalizeText(product.sku || product.mpn || asin).slice(0, 120);
  const category = normalizeText(product.category || inferCategory(title, description)).toLowerCase().slice(0, 120);

  const warnings = [];
  if (!asin) warnings.push('ASIN could not be identified from this URL.');
  if (!title) warnings.push('Amazon did not expose a product title to the preview request.');
  if (!imageUrl) warnings.push('Amazon did not expose a usable product image.');
  warnings.push('Review all imported fields, purchase price, quantity, and tool/consumable classification before saving.');

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

  return json({ ok: true, draft, asin, canonical_url: canonicalUrl, warnings, source: 'amazon_page_metadata_review_required' });
}
