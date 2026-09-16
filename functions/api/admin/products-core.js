// Release 467 Build 160 — bounded Product Admin core delivery.
// Read-only compact Product list used to make the Products workspace interactive before
// expensive readiness/merchandising/resource evidence. No schema or business-data mutation.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { normalizeTaxRateFraction, taxRatePercent } from './_tax-rate.js';

function json(data, status = 200) { return jsonResponse(data, status); }
async function tableExists(db, name) {
  try { return !!(await db.prepare("SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first()); }
  catch { return false; }
}
function readiness(row) {
  const checks = [
    normalizeText(row.name).length > 0,
    normalizeText(row.slug).length > 0,
    Number(row.price_cents || 0) > 0,
    normalizeText(row.featured_image_url).length > 0,
    normalizeText(row.short_description).length >= 40,
    normalizeText(row.description).length >= 120,
    normalizeText(row.meta_title).length >= 10,
    normalizeText(row.meta_description).length >= 50,
    normalizeText(row.product_category).length > 0,
    Number(row.image_count || 0) >= 3,
  ];
  const passed = checks.filter(Boolean).length;
  return {
    core_delivery: 'build160',
    is_ready_for_storefront: passed === checks.length ? 1 : 0,
    publish_readiness_score: Math.round((passed / checks.length) * 100),
    image_quality_score: Number(row.image_count || 0) >= 3 ? 70 : Number(row.image_count || 0) > 0 ? 40 : 0,
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  const url = new URL(request.url);
  const q = normalizeText(url.searchParams.get('q')).toLowerCase();
  const hasTax = await tableExists(db, 'tax_classes');
  const hasSeo = await tableExists(db, 'product_seo');
  const hasImages = await tableExists(db, 'product_images');
  const hasResources = await tableExists(db, 'product_resource_links');

  const clauses = ['1=1'];
  const binds = [];
  if (q) {
    clauses.push("(LOWER(COALESCE(p.name,'')) LIKE ? OR LOWER(COALESCE(p.slug,'')) LIKE ? OR LOWER(COALESCE(p.sku,'')) LIKE ?)");
    const like = `%${q}%`; binds.push(like, like, like);
  }

  const select = [
    'p.*',
    hasTax ? 'tc.code AS tax_class_code' : 'NULL AS tax_class_code',
    hasTax ? 'tc.name AS tax_class_name' : 'NULL AS tax_class_name',
    hasTax ? 'tc.tax_rate AS tax_rate' : 'NULL AS tax_rate',
    hasSeo ? 'ps.meta_title' : 'NULL AS meta_title',
    hasSeo ? 'ps.meta_description' : 'NULL AS meta_description',
    hasSeo ? 'ps.keywords' : 'NULL AS keywords',
    hasSeo ? 'ps.h1_override' : 'NULL AS h1_override',
    hasImages ? '(SELECT COUNT(*) FROM product_images pi WHERE pi.product_id=p.product_id) AS image_count' : '0 AS image_count',
    hasImages ? "(SELECT COUNT(*) FROM product_images pi WHERE pi.product_id=p.product_id AND LENGTH(TRIM(COALESCE(pi.alt_text,'')))>=5) AS alt_coverage_count" : '0 AS alt_coverage_count',
    hasResources ? '(SELECT COUNT(*) FROM product_resource_links prl WHERE prl.product_id=p.product_id) AS linked_resource_count' : '0 AS linked_resource_count',
    "CASE WHEN COALESCE(p.inventory_tracking,0)=1 AND COALESCE(p.inventory_quantity,0)<=2 THEN 1 ELSE 0 END AS low_stock_flag",
  ];
  const joins = [];
  if (hasTax) joins.push('LEFT JOIN tax_classes tc ON p.tax_class_id=tc.tax_class_id');
  if (hasSeo) joins.push('LEFT JOIN product_seo ps ON ps.product_id=p.product_id');
  const sql = `SELECT ${select.join(', ')} FROM products p ${joins.join(' ')} WHERE ${clauses.join(' AND ')} ORDER BY p.sort_order ASC, p.created_at DESC, p.product_id DESC LIMIT 160`;
  const result = binds.length ? await db.prepare(sql).bind(...binds).all() : await db.prepare(sql).all();
  const rows = Array.isArray(result?.results) ? result.results : [];
  const products = rows.map((row) => {
    const rate = normalizeTaxRateFraction(row.tax_rate, row.rate_percent);
    return {
      ...row,
      tax_rate: rate,
      rate_percent: taxRatePercent(rate),
      image_count: Number(row.image_count || 0),
      alt_coverage_count: Number(row.alt_coverage_count || 0),
      linked_resource_count: Number(row.linked_resource_count || 0),
      low_stock_flag: Number(row.low_stock_flag || 0),
      ...readiness(row),
    };
  });
  return json({
    ok: true,
    requested_by: adminUser,
    products,
    warnings: [],
    delivery: 'build160-core-first',
    feature_flags: { core_fast_path: true, hasTax, hasSeo, hasImages, hasResources },
    summary: {
      total_products: products.length,
      low_stock_products: products.filter((row) => row.low_stock_flag === 1).length,
      pending_review_products: products.filter((row) => String(row.review_status || '').toLowerCase() === 'pending_review').length,
    },
  });
}
