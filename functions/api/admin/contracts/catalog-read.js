// Current-release Catalog-owned implementation of the catalog-read module contract.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../../_lib/adminAudit.js';

const RELEASE = 448;

function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function boundedInt(value, fallback = 250, max = 500) {
  const n = Number(value);
  return Math.max(1, Math.min(max, Number.isFinite(n) ? Math.trunc(n) : fallback));
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, release: RELEASE, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, release: RELEASE, error: 'Database binding is not configured.' }, 500);

  const url = new URL(context.request.url);
  const q = normalizeText(url.searchParams.get('q')).toLowerCase();
  const limit = boundedInt(url.searchParams.get('limit'));
  const like = `%${q}%`;

  try {
    const result = await db.prepare(`
      SELECT product_id,product_number,sku,name,slug,status,product_category,
             short_description,description,weight_grams,featured_image_url
      FROM products
      WHERE COALESCE(status,'draft') <> 'archived'
        AND (? = '' OR LOWER(COALESCE(name,'')) LIKE ? OR LOWER(COALESCE(sku,'')) LIKE ? OR LOWER(COALESCE(slug,'')) LIKE ?)
      ORDER BY LOWER(COALESCE(name,'')),product_id DESC
      LIMIT ?
    `).bind(q, like, like, like, limit).all();

    const products = rows(result).map((row) => ({
      ...row,
      product_id: Number(row.product_id || 0),
      weight_grams: row.weight_grams == null ? null : Number(row.weight_grams || 0),
    }));
    return json({ ok: true, release: RELEASE, contract: 'catalog-read', owner: 'catalog', requested_by: adminUser, products, count: products.length });
  } catch (error) {
    return json({ ok: false, release: RELEASE, contract: 'catalog-read', error: 'Catalog read contract failed.', error_code: 'catalog_read_failed', detail: String(error?.message || error) }, 500);
  }
}
