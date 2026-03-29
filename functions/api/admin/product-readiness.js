import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";

function json(data, status = 200) { return jsonResponse(data, status); }

function buildChecks(row = {}) {
  const checks = [];
  const hasName = normalizeText(row.name).length > 0;
  const hasSlug = normalizeText(row.slug).length > 0;
  const hasPrice = Number(row.price_cents || 0) > 0;
  const hasImage = normalizeText(row.featured_image_url).length > 0;
  const hasShort = normalizeText(row.short_description).length >= 40;
  const hasSeoTitle = normalizeText(row.meta_title).length >= 10;
  const hasSeoDescription = normalizeText(row.meta_description).length >= 50;
  const hasCategory = normalizeText(row.product_category).length > 0;
  checks.push({ key: 'name', ok: hasName, label: 'Product name present' });
  checks.push({ key: 'slug', ok: hasSlug, label: 'Slug present' });
  checks.push({ key: 'price', ok: hasPrice, label: 'Price set' });
  checks.push({ key: 'featured_image', ok: hasImage, label: 'Featured image present' });
  checks.push({ key: 'short_description', ok: hasShort, label: 'Short description present' });
  checks.push({ key: 'seo_title', ok: hasSeoTitle, label: 'SEO title present' });
  checks.push({ key: 'seo_description', ok: hasSeoDescription, label: 'SEO description present' });
  checks.push({ key: 'category', ok: hasCategory, label: 'Category present' });
  const failed = checks.filter((row) => !row.ok);
  return { checks, is_ready_for_storefront: failed.length === 0 ? 1 : 0, ready_check_notes: failed.map((row) => row.label).join('; ') };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const productId = Number(new URL(request.url).searchParams.get('product_id') || 0);
  if (!productId) return json({ ok: false, error: 'product_id is required.' }, 400);
  const row = await db.prepare(`
    SELECT p.*, ps.meta_title, ps.meta_description
    FROM products p
    LEFT JOIN product_seo ps ON ps.product_id = p.product_id
    WHERE p.product_id = ?
    LIMIT 1
  `).bind(productId).first();
  if (!row) return json({ ok: false, error: 'Product not found.' }, 404);
  const readiness = buildChecks(row);
  return json({ ok: true, product_id: productId, ...readiness });
}
