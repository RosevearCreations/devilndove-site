// Release 467 Build 181 — bounded, read-only Product / Inventory / Tool / Image authority health.
// D1 is the live catalog authority again. This endpoint intentionally performs no mutation, schema work, R2 listing,
// provider execution, publication, payment/refund action, or accounting posting.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { buildReadBudgetHeaders } from '../_lib/d1ReadBudget.js';

const BUILD = 181;
const MAX_ROWS = 40;
const json = (data, status = 200) => jsonResponse({ release: 467, build: BUILD, read_only: true, ...data }, status, {
  'Cache-Control': 'no-store',
  ...buildReadBudgetHeaders('admin_catalog_health_v181', { limit: MAX_ROWS }),
});
const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const n = (value) => Number(value || 0);

async function summary(db) {
  const [productRow, inventoryRow] = await Promise.all([
    db.prepare(`
      SELECT
        COUNT(*) AS active_products,
        SUM(CASE WHEN TRIM(COALESCE(featured_image_url,''))='' THEN 1 ELSE 0 END) AS missing_featured,
        SUM(CASE WHEN image_count=0 THEN 1 ELSE 0 END) AS no_gallery,
        SUM(CASE WHEN image_count>0 AND image_count<3 THEN 1 ELSE 0 END) AS shallow_gallery,
        SUM(CASE WHEN alt_attention>0 THEN 1 ELSE 0 END) AS products_with_alt_attention,
        SUM(CASE WHEN missing_inventory_links>0 THEN 1 ELSE 0 END) AS products_with_resource_gaps,
        SUM(CASE WHEN COALESCE(inventory_tracking,0)=1 AND COALESCE(inventory_quantity,0)<=0 THEN 1 ELSE 0 END) AS tracked_zero_stock
      FROM (
        SELECT p.product_id,p.featured_image_url,p.inventory_tracking,p.inventory_quantity,
          (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id=p.product_id) AS image_count,
          (SELECT COUNT(*) FROM product_images pi
             WHERE pi.product_id=p.product_id AND LENGTH(TRIM(COALESCE(pi.alt_text,'')))<12) AS alt_attention,
          (SELECT COUNT(*) FROM product_resource_links prl
             LEFT JOIN site_item_inventory sii
               ON LOWER(TRIM(COALESCE(sii.source_type,'')))=LOWER(TRIM(COALESCE(prl.resource_kind,'')))
              AND LOWER(TRIM(COALESCE(sii.external_key,'')))=LOWER(TRIM(COALESCE(prl.source_key,'')))
              AND COALESCE(sii.is_active,1)=1
             WHERE prl.product_id=p.product_id AND sii.site_item_inventory_id IS NULL) AS missing_inventory_links
        FROM products p
        WHERE LOWER(TRIM(COALESCE(p.status,'draft'))) NOT IN ('archived','deleted')
      )
    `).first(),
    db.prepare(`
      SELECT
        COUNT(*) AS active_inventory,
        SUM(CASE WHEN item_kind='tool' THEN 1 ELSE 0 END) AS active_tools,
        SUM(CASE WHEN item_kind='supply' THEN 1 ELSE 0 END) AS active_supplies,
        SUM(CASE WHEN TRIM(COALESCE(image_url,''))='' THEN 1 ELSE 0 END) AS blank_inventory_images,
        SUM(CASE WHEN TRIM(COALESCE(image_url,''))<>'' AND TRIM(COALESCE(catalog_image_url,''))<>'' AND TRIM(image_url)<>TRIM(catalog_image_url) THEN 1 ELSE 0 END) AS image_authority_mismatches,
        SUM(CASE WHEN duplicate_count>1 THEN 1 ELSE 0 END) AS rows_in_duplicate_identities,
        SUM(CASE WHEN item_kind='supply' AND COALESCE(on_hand_quantity,0)<=0 THEN 1 ELSE 0 END) AS zero_on_hand_supplies
      FROM (
        SELECT sii.site_item_inventory_id,
               LOWER(TRIM(COALESCE(sii.source_type,''))) AS item_kind,
               sii.image_url,sii.on_hand_quantity,
               (SELECT ci.image_url FROM catalog_items ci
                 WHERE LOWER(TRIM(COALESCE(ci.item_kind,'')))=LOWER(TRIM(COALESCE(sii.source_type,'')))
                   AND LOWER(TRIM(COALESCE(ci.source_key,'')))=LOWER(TRIM(COALESCE(sii.external_key,'')))
                 ORDER BY ci.catalog_item_id DESC LIMIT 1) AS catalog_image_url,
               (SELECT COUNT(*) FROM site_item_inventory d
                 WHERE COALESCE(d.is_active,1)=1
                   AND LOWER(TRIM(COALESCE(d.source_type,'')))=LOWER(TRIM(COALESCE(sii.source_type,'')))
                   AND LOWER(TRIM(COALESCE(d.external_key,'')))=LOWER(TRIM(COALESCE(sii.external_key,'')))) AS duplicate_count
        FROM site_item_inventory sii
        WHERE COALESCE(sii.is_active,1)=1
          AND LOWER(TRIM(COALESCE(sii.source_type,''))) IN ('tool','supply')
      )
    `).first(),
  ]);

  return {
    products: {
      active_products: n(productRow?.active_products),
      missing_featured: n(productRow?.missing_featured),
      no_gallery: n(productRow?.no_gallery),
      shallow_gallery: n(productRow?.shallow_gallery),
      products_with_alt_attention: n(productRow?.products_with_alt_attention),
      products_with_resource_gaps: n(productRow?.products_with_resource_gaps),
      tracked_zero_stock: n(productRow?.tracked_zero_stock),
    },
    inventory: {
      active_inventory: n(inventoryRow?.active_inventory),
      active_tools: n(inventoryRow?.active_tools),
      active_supplies: n(inventoryRow?.active_supplies),
      blank_inventory_images: n(inventoryRow?.blank_inventory_images),
      image_authority_mismatches: n(inventoryRow?.image_authority_mismatches),
      rows_in_duplicate_identities: n(inventoryRow?.rows_in_duplicate_identities),
      zero_on_hand_supplies: n(inventoryRow?.zero_on_hand_supplies),
    },
  };
}

async function productIssues(db, q, limit) {
  const like = `%${q.toLowerCase()}%`;
  const result = await db.prepare(`
    SELECT *,
      (CASE WHEN TRIM(COALESCE(featured_image_url,''))='' THEN 4 ELSE 0 END
       + CASE WHEN image_count=0 THEN 4 WHEN image_count<3 THEN 2 ELSE 0 END
       + CASE WHEN alt_attention>0 THEN 2 ELSE 0 END
       + CASE WHEN missing_inventory_links>0 THEN 3 ELSE 0 END
       + CASE WHEN COALESCE(inventory_tracking,0)=1 AND COALESCE(inventory_quantity,0)<=0 THEN 2 ELSE 0 END) AS issue_weight
    FROM (
      SELECT p.product_id,p.name,p.slug,p.sku,p.status,p.review_status,p.featured_image_url,
             p.inventory_tracking,p.inventory_quantity,p.updated_at,
        (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id=p.product_id) AS image_count,
        (SELECT COUNT(*) FROM product_images pi
           WHERE pi.product_id=p.product_id AND LENGTH(TRIM(COALESCE(pi.alt_text,'')))<12) AS alt_attention,
        (SELECT COUNT(*) FROM product_resource_links prl WHERE prl.product_id=p.product_id) AS linked_resources,
        (SELECT COUNT(*) FROM product_resource_links prl
           LEFT JOIN site_item_inventory sii
             ON LOWER(TRIM(COALESCE(sii.source_type,'')))=LOWER(TRIM(COALESCE(prl.resource_kind,'')))
            AND LOWER(TRIM(COALESCE(sii.external_key,'')))=LOWER(TRIM(COALESCE(prl.source_key,'')))
            AND COALESCE(sii.is_active,1)=1
           WHERE prl.product_id=p.product_id AND sii.site_item_inventory_id IS NULL) AS missing_inventory_links
      FROM products p
      WHERE LOWER(TRIM(COALESCE(p.status,'draft'))) NOT IN ('archived','deleted')
    )
    WHERE (?='' OR LOWER(COALESCE(name,'')) LIKE ? OR LOWER(COALESCE(sku,'')) LIKE ? OR LOWER(COALESCE(slug,'')) LIKE ?)
      AND (
        TRIM(COALESCE(featured_image_url,''))='' OR image_count<3 OR alt_attention>0 OR missing_inventory_links>0
        OR (COALESCE(inventory_tracking,0)=1 AND COALESCE(inventory_quantity,0)<=0)
      )
    ORDER BY issue_weight DESC, LOWER(COALESCE(name,'')) ASC, product_id ASC
    LIMIT ?
  `).bind(q, like, like, like, limit).all();
  return rows(result).map((row) => ({ ...row, issue_weight: n(row.issue_weight), image_count: n(row.image_count), alt_attention: n(row.alt_attention), linked_resources: n(row.linked_resources), missing_inventory_links: n(row.missing_inventory_links) }));
}

async function inventoryIssues(db, q, kind, limit) {
  const like = `%${q.toLowerCase()}%`;
  const result = await db.prepare(`
    SELECT *,
      (CASE WHEN TRIM(COALESCE(image_url,''))='' THEN 4 ELSE 0 END
       + CASE WHEN TRIM(COALESCE(image_url,''))<>'' AND TRIM(COALESCE(catalog_image_url,''))<>'' AND TRIM(image_url)<>TRIM(catalog_image_url) THEN 3 ELSE 0 END
       + CASE WHEN duplicate_count>1 THEN 4 ELSE 0 END
       + CASE WHEN item_kind='supply' AND COALESCE(on_hand_quantity,0)<=0 THEN 1 ELSE 0 END) AS issue_weight
    FROM (
      SELECT sii.site_item_inventory_id,
             LOWER(TRIM(COALESCE(sii.source_type,''))) AS item_kind,
             sii.external_key,sii.item_name,sii.category,sii.image_url,sii.on_hand_quantity,
             sii.reserved_quantity,sii.unit_cost_cents,sii.supplier_name,sii.updated_at,
             (SELECT ci.catalog_item_id FROM catalog_items ci
               WHERE LOWER(TRIM(COALESCE(ci.item_kind,'')))=LOWER(TRIM(COALESCE(sii.source_type,'')))
                 AND LOWER(TRIM(COALESCE(ci.source_key,'')))=LOWER(TRIM(COALESCE(sii.external_key,'')))
               ORDER BY ci.catalog_item_id DESC LIMIT 1) AS catalog_item_id,
             (SELECT ci.image_url FROM catalog_items ci
               WHERE LOWER(TRIM(COALESCE(ci.item_kind,'')))=LOWER(TRIM(COALESCE(sii.source_type,'')))
                 AND LOWER(TRIM(COALESCE(ci.source_key,'')))=LOWER(TRIM(COALESCE(sii.external_key,'')))
               ORDER BY ci.catalog_item_id DESC LIMIT 1) AS catalog_image_url,
             (SELECT COUNT(*) FROM site_item_inventory d
               WHERE COALESCE(d.is_active,1)=1
                 AND LOWER(TRIM(COALESCE(d.source_type,'')))=LOWER(TRIM(COALESCE(sii.source_type,'')))
                 AND LOWER(TRIM(COALESCE(d.external_key,'')))=LOWER(TRIM(COALESCE(sii.external_key,'')))) AS duplicate_count
      FROM site_item_inventory sii
      WHERE COALESCE(sii.is_active,1)=1
        AND LOWER(TRIM(COALESCE(sii.source_type,''))) IN ('tool','supply')
    )
    WHERE (?='' OR LOWER(COALESCE(item_name,'')) LIKE ? OR LOWER(COALESCE(external_key,'')) LIKE ? OR LOWER(COALESCE(category,'')) LIKE ?)
      AND (?='' OR item_kind=?)
      AND (
        TRIM(COALESCE(image_url,''))='' OR duplicate_count>1
        OR (TRIM(COALESCE(image_url,''))<>'' AND TRIM(COALESCE(catalog_image_url,''))<>'' AND TRIM(image_url)<>TRIM(catalog_image_url))
        OR (item_kind='supply' AND COALESCE(on_hand_quantity,0)<=0)
      )
    ORDER BY issue_weight DESC, item_kind ASC, LOWER(COALESCE(item_name,'')) ASC, site_item_inventory_id ASC
    LIMIT ?
  `).bind(q, like, like, like, kind, kind, limit).all();
  return rows(result).map((row) => ({ ...row, issue_weight: n(row.issue_weight), duplicate_count: n(row.duplicate_count), on_hand_quantity: Number(row.on_hand_quantity || 0), reserved_quantity: Number(row.reserved_quantity || 0) }));
}

export async function onRequestGet({ request, env }) {
  const admin = await getAdminUserFromRequest(request, env);
  if (!admin) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const url = new URL(request.url);
  const mode = normalizeText(url.searchParams.get('mode') || 'summary').toLowerCase();
  const q = normalizeText(url.searchParams.get('q')).slice(0, 100);
  const kindRaw = normalizeText(url.searchParams.get('kind')).toLowerCase();
  const kind = ['tool','supply'].includes(kindRaw) ? kindRaw : '';
  const limit = Math.max(1, Math.min(MAX_ROWS, Number(url.searchParams.get('limit') || MAX_ROWS)));

  try {
    if (mode === 'summary') {
      return json({ ok: true, mode, authority: 'live_d1', mutation_capability: 'none', summary: await summary(db) });
    }
    if (mode === 'products') {
      return json({ ok: true, mode, authority: 'live_d1', mutation_capability: 'none', q, limit, products: await productIssues(db, q, limit) });
    }
    if (mode === 'inventory') {
      return json({ ok: true, mode, authority: 'live_d1', mutation_capability: 'none', q, kind, limit, inventory: await inventoryIssues(db, q, kind, limit) });
    }
    return json({ ok: false, error: 'Unsupported catalog-health mode.' }, 400);
  } catch (error) {
    return json({ ok: false, mode, authority: 'live_d1', mutation_capability: 'none', error: 'Catalog authority health could not be loaded.', detail: normalizeText(error?.message || error) }, 503);
  }
}
