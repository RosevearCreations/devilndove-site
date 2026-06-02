// File: /functions/api/admin/product-publish-qa.js
// Brief description: Admin-only post-publish QA checks for product detail JSON, gallery, cart basics, and SEO fields.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const url = new URL(request.url);
  const productId = Number(url.searchParams.get('product_id') || 0);
  if (!productId) return json({ ok: false, error: 'product_id is required.' }, 400);
  const product = await db.prepare(`SELECT p.*, ps.meta_title, ps.meta_description, ps.canonical_url, ps.og_image_url FROM products p LEFT JOIN product_seo ps ON ps.product_id=p.product_id WHERE p.product_id=? LIMIT 1`).bind(productId).first();
  if (!product) return json({ ok: false, error: 'Product not found.' }, 404);
  const imageRows = rows(await db.prepare(`SELECT image_url, alt_text, sort_order FROM product_images WHERE product_id=? ORDER BY sort_order ASC LIMIT 12`).bind(productId).all().catch(() => ({ results: [] })));
  const checks = [
    { code: 'product_active', ok: String(product.status || '').toLowerCase() === 'active', help: 'Product status must be active for storefront visibility.' },
    { code: 'review_published', ok: ['published','approved'].includes(String(product.review_status || '').toLowerCase()), help: 'Review status should be approved or published.' },
    { code: 'product_detail_json', ok: !!normalizeText(product.slug), help: 'Product detail JSON needs a slug.' },
    { code: 'gallery', ok: imageRows.length >= 1 || !!normalizeText(product.featured_image_url), help: 'At least one product image should render.' },
    { code: 'cart_basics', ok: Number(product.price_cents || 0) >= 0 && !!normalizeText(product.name), help: 'Cart needs a name and valid price.' },
    { code: 'seo_title', ok: !!normalizeText(product.meta_title), help: 'SEO title is missing.' },
    { code: 'seo_meta', ok: !!normalizeText(product.meta_description), help: 'SEO meta description is missing.' }
  ];
  return json({ ok: true, product_id: productId, product_slug: product.slug || '', checks, passed: checks.filter((row) => row.ok).length, failed: checks.filter((row) => !row.ok).length, images: imageRows });
}
