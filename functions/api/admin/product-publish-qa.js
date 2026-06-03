// File: /functions/api/admin/product-publish-qa.js
// Brief description: Admin-only post-publish QA checks for product detail JSON, gallery, cart basics, SEO fields, and persisted QA badge history.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_publish_qa_results (
    product_publish_qa_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    product_slug TEXT,
    qa_status TEXT NOT NULL DEFAULT 'failed',
    passed_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    checks_json TEXT,
    checked_by_user_id INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_product_publish_qa_results_product ON product_publish_qa_results(product_id, created_at)`).run().catch(() => null);
}
async function runChecks(db, productId) {
  const product = await db.prepare(`SELECT p.*, ps.meta_title, ps.meta_description, ps.canonical_url, ps.og_image_url FROM products p LEFT JOIN product_seo ps ON ps.product_id=p.product_id WHERE p.product_id=? LIMIT 1`).bind(productId).first();
  if (!product) throw new Error('Product not found.');
  const imageRows = rows(await db.prepare(`SELECT image_url, alt_text, sort_order FROM product_images WHERE product_id=? ORDER BY sort_order ASC LIMIT 12`).bind(productId).all().catch(() => ({ results: [] })));
  const checks = [
    { code: 'product_active', ok: String(product.status || '').toLowerCase() === 'active', help: 'Product status must be active for storefront visibility.', fix_url: `/admin/catalog/?product_id=${productId}#status` },
    { code: 'review_published', ok: ['published','approved'].includes(String(product.review_status || '').toLowerCase()), help: 'Review status should be approved or published.', fix_url: `/admin/readiness/?product_id=${productId}` },
    { code: 'product_detail_json', ok: !!normalizeText(product.slug), help: 'Product detail JSON needs a slug.', fix_url: `/admin/catalog/?product_id=${productId}#seo` },
    { code: 'gallery', ok: imageRows.length >= 1 || !!normalizeText(product.featured_image_url), help: 'At least one product image should render.', fix_url: `/admin/catalog-media/?product_id=${productId}` },
    { code: 'cart_basics', ok: Number(product.price_cents || 0) >= 0 && !!normalizeText(product.name), help: 'Cart needs a name and valid price.', fix_url: `/admin/catalog/?product_id=${productId}#pricing` },
    { code: 'seo_title', ok: !!normalizeText(product.meta_title), help: 'SEO title is missing.', fix_url: `/admin/catalog/?product_id=${productId}#seo` },
    { code: 'seo_meta', ok: !!normalizeText(product.meta_description), help: 'SEO meta description is missing.', fix_url: `/admin/catalog/?product_id=${productId}#seo` },
    { code: 'structured_data', ok: !!normalizeText(product.name) && Number(product.price_cents || 0) >= 0, help: 'Product structured data needs name and price.', fix_url: `/admin/catalog/?product_id=${productId}` },
    { code: 'mini_gallery', ok: imageRows.length > 1 || !!normalizeText(product.featured_image_url), help: 'Mini-gallery should have multiple images when available.', fix_url: `/admin/catalog-media/?product_id=${productId}` }
  ];
  return { product, imageRows, checks, passed: checks.filter((row) => row.ok).length, failed: checks.filter((row) => !row.ok).length };
}
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureSchema(db);
  const url = new URL(request.url);
  const productId = Number(url.searchParams.get('product_id') || 0);
  const historyOnly = url.searchParams.get('history') === '1';
  if (historyOnly && productId) {
    const history = rows(await db.prepare(`SELECT * FROM product_publish_qa_results WHERE product_id=? ORDER BY datetime(created_at) DESC LIMIT 20`).bind(productId).all().catch(() => ({ results: [] })));
    return json({ ok: true, history });
  }
  if (!productId) {
    const latest = rows(await db.prepare(`
      SELECT q.* FROM product_publish_qa_results q
      JOIN (SELECT product_id, MAX(product_publish_qa_result_id) AS latest_id FROM product_publish_qa_results GROUP BY product_id) x
        ON x.latest_id=q.product_publish_qa_result_id
      ORDER BY datetime(q.created_at) DESC LIMIT 120
    `).all().catch(() => ({ results: [] })));
    return json({ ok: true, results: latest, summary: { total: latest.length, failed: latest.filter((row) => String(row.qa_status) !== 'passed').length } });
  }
  const { product, imageRows, checks, passed, failed } = await runChecks(db, productId);
  const status = failed === 0 ? 'passed' : 'failed';
  const insert = await db.prepare(`INSERT INTO product_publish_qa_results (product_id, product_slug, qa_status, passed_count, failed_count, checks_json, checked_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(productId, product.slug || '', status, passed, failed, JSON.stringify(checks), Number(adminUser.user_id || 0) || null).run().catch(() => null);
  return json({ ok: true, product_id: productId, product_slug: product.slug || '', checks, passed, failed, qa_status: status, product_publish_qa_result_id: Number(insert?.meta?.last_row_id || 0) || null, images: imageRows });
}
