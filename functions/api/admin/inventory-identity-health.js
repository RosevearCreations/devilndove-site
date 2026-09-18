// Release 467 Build 183 — bounded read-only Inventory / Tool / Supply identity cleanup evidence.
// Explicit review only. Existing Inventory Operations remains the sole mutation authority.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { buildReadBudgetHeaders } from '../_lib/d1ReadBudget.js';

const BUILD = 183;
const MAX_ROWS = 40;
const json = (data, status = 200) => jsonResponse({ release: 467, build: BUILD, read_only: true, ...data }, status, {
  'Cache-Control': 'no-store',
  ...buildReadBudgetHeaders('admin_inventory_identity_health_v183', { limit: MAX_ROWS }),
});
const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const text = (value) => normalizeText(value);
const n = (value) => Number(value || 0);

const LEGACY_USAGE_NOTE_SQL = `(
  TRIM(COALESCE(siup.notes,''))=''
  OR LOWER(COALESCE(siup.notes,'')) LIKE '%until unit conversion is reviewed%'
  OR LOWER(COALESCE(siup.notes,'')) LIKE '%until unit conversion review%'
  OR LOWER(COALESCE(siup.notes,'')) LIKE '%legacy safe%'
  OR LOWER(COALESCE(siup.notes,'')) LIKE '%legacy supply%'
  OR LOWER(COALESCE(siup.notes,'')) LIKE '%catalog reconciliation%'
)`;

function queueWhere(queue) {
  const duplicate = `(key_duplicate_count>1 OR TRIM(COALESCE(external_key,''))='')`;
  const supplier = `(
    TRIM(COALESCE(supplier_name,''))=''
    OR (TRIM(COALESCE(source_url,''))='' AND TRIM(COALESCE(amazon_url,''))='')
    OR ((TRIM(COALESCE(source_url,''))<>'' OR TRIM(COALESCE(amazon_url,''))<>'') AND TRIM(COALESCE(supplier_sku,''))='')
  )`;
  const usage = `usage_review_required=1`;
  const countReorder = `(count_due=1 OR reorder_review_required=1)`;
  const catalog = `catalog_reference_status<>'matched'`;
  if (queue === 'duplicates') return duplicate;
  if (queue === 'supplier_source') return supplier;
  if (queue === 'usage') return usage;
  if (queue === 'count_reorder') return countReorder;
  if (queue === 'catalog') return catalog;
  return `(${duplicate} OR ${supplier} OR ${usage} OR ${countReorder} OR ${catalog})`;
}

function shapeIssue(row = {}) {
  const issues = [];
  const totalDup = n(row.key_duplicate_count);
  const sameDup = n(row.same_kind_duplicate_count);
  if (!text(row.external_key)) issues.push({ code: 'missing_external_key', severity: 'blocker', label: 'Missing external key', owner: 'inventory' });
  if (totalDup > 1) {
    issues.push({
      code: sameDup > 1 ? 'same_kind_duplicate' : 'cross_kind_duplicate',
      severity: 'blocker',
      label: sameDup > 1 ? `${sameDup} same-kind rows share this identity` : `${totalDup} Tool/Supply rows share this source key`,
      owner: 'inventory',
    });
  }
  if (!text(row.supplier_name)) issues.push({ code: 'supplier_name', severity: 'attention', label: 'Supplier name missing', owner: 'inventory' });
  if (!text(row.source_url) && !text(row.amazon_url)) issues.push({ code: 'source_reference', severity: 'attention', label: 'Source URL/reference missing', owner: 'inventory' });
  if ((text(row.source_url) || text(row.amazon_url)) && !text(row.supplier_sku)) issues.push({ code: 'supplier_sku', severity: 'attention', label: 'Supplier SKU missing', owner: 'inventory' });
  if (n(row.usage_review_required)) issues.push({ code: 'usage_review', severity: 'attention', label: 'Usage mode/conversion needs review', owner: 'integrity' });
  if (n(row.count_due)) issues.push({ code: 'count_due', severity: 'attention', label: row.last_counted_at ? 'Physical count is 90+ days old' : 'Never physically counted', owner: 'integrity' });
  if (n(row.reorder_review_required)) issues.push({ code: 'reorder_review', severity: 'attention', label: 'Reorder state needs review', owner: 'inventory' });
  if (row.catalog_reference_status === 'kind_drift') issues.push({ code: 'catalog_kind_drift', severity: 'blocker', label: 'Catalog source key exists under the other Tool/Supply kind', owner: 'inventory' });
  if (row.catalog_reference_status === 'missing') issues.push({ code: 'catalog_reference_missing', severity: 'attention', label: 'No active catalog reference for this source key', owner: 'inventory' });
  return { ...row, issues };
}

async function summary(db) {
  const row = await db.prepare(`
    SELECT
      COUNT(*) AS active_items,
      SUM(CASE WHEN TRIM(COALESCE(sii.external_key,''))='' THEN 1 ELSE 0 END) AS missing_external_key,
      SUM(CASE WHEN (
        SELECT COUNT(*) FROM site_item_inventory d
        WHERE COALESCE(d.is_active,1)=1
          AND LOWER(TRIM(COALESCE(d.source_type,''))) IN ('tool','supply')
          AND LOWER(TRIM(COALESCE(d.external_key,'')))=LOWER(TRIM(COALESCE(sii.external_key,'')))
          AND TRIM(COALESCE(d.external_key,''))<>''
      ) > 1 THEN 1 ELSE 0 END) AS duplicate_identity_rows,
      SUM(CASE WHEN TRIM(COALESCE(sii.supplier_name,''))='' THEN 1 ELSE 0 END) AS missing_supplier_name,
      SUM(CASE WHEN TRIM(COALESCE(sii.source_url,''))='' AND TRIM(COALESCE(sii.amazon_url,''))='' THEN 1 ELSE 0 END) AS missing_source_reference,
      SUM(CASE WHEN (TRIM(COALESCE(sii.source_url,''))<>'' OR TRIM(COALESCE(sii.amazon_url,''))<>'') AND TRIM(COALESCE(sii.supplier_sku,''))='' THEN 1 ELSE 0 END) AS missing_supplier_sku_when_sourced,
      SUM(CASE WHEN (
        (LOWER(TRIM(COALESCE(sii.source_type,'')))='supply' AND (
          siup.site_item_inventory_id IS NULL
          OR (LOWER(TRIM(COALESCE(siup.usage_tracking_mode,'log_only')))='log_only' AND ${LEGACY_USAGE_NOTE_SQL})
        ))
        OR (LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' AND siup.site_item_inventory_id IS NOT NULL AND LOWER(TRIM(COALESCE(siup.usage_tracking_mode,'reusable')))<>'reusable')
      ) THEN 1 ELSE 0 END) AS usage_review_required,
      SUM(CASE WHEN sii.last_counted_at IS NULL OR datetime(sii.last_counted_at)<datetime('now','-90 days') THEN 1 ELSE 0 END) AS count_due,
      SUM(CASE WHEN (
        (COALESCE(sii.do_not_reorder,0)=0 AND COALESCE(sii.reorder_level,0)>0 AND COALESCE(sii.on_hand_quantity,0)<=COALESCE(sii.reorder_level,0) AND COALESCE(sii.is_on_reorder_list,0)=0)
        OR (COALESCE(sii.do_not_reorder,0)=1 AND COALESCE(sii.is_on_reorder_list,0)=1)
      ) THEN 1 ELSE 0 END) AS reorder_review_required,
      SUM(CASE WHEN TRIM(COALESCE(sii.external_key,''))<>'' AND NOT EXISTS(
        SELECT 1 FROM catalog_items ci
        WHERE LOWER(TRIM(COALESCE(ci.item_kind,'')))=LOWER(TRIM(COALESCE(sii.source_type,'')))
          AND LOWER(TRIM(COALESCE(ci.source_key,'')))=LOWER(TRIM(COALESCE(sii.external_key,'')))
          AND COALESCE(ci.status,'active')<>'archived'
      ) THEN 1 ELSE 0 END) AS catalog_reference_not_matched
    FROM site_item_inventory sii
    LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id
    WHERE COALESCE(sii.is_active,1)=1
      AND LOWER(TRIM(COALESCE(sii.source_type,''))) IN ('tool','supply')
  `).first();

  return {
    active_items: n(row?.active_items),
    missing_external_key: n(row?.missing_external_key),
    duplicate_identity_rows: n(row?.duplicate_identity_rows),
    missing_supplier_name: n(row?.missing_supplier_name),
    missing_source_reference: n(row?.missing_source_reference),
    missing_supplier_sku_when_sourced: n(row?.missing_supplier_sku_when_sourced),
    usage_review_required: n(row?.usage_review_required),
    count_due: n(row?.count_due),
    reorder_review_required: n(row?.reorder_review_required),
    catalog_reference_not_matched: n(row?.catalog_reference_not_matched),
  };
}

async function issueRows(db, { queue = 'all', q = '', limit = MAX_ROWS } = {}) {
  const safeQueue = ['all','duplicates','supplier_source','usage','count_reorder','catalog'].includes(queue) ? queue : 'all';
  const safeLimit = Math.max(1, Math.min(MAX_ROWS, Number(limit || MAX_ROWS)));
  const like = `%${String(q || '').toLowerCase()}%`;
  const filter = queueWhere(safeQueue);

  const result = await db.prepare(`
    WITH base AS (
      SELECT
        sii.site_item_inventory_id,
        LOWER(TRIM(COALESCE(sii.source_type,''))) AS source_type,
        sii.external_key,sii.item_name,sii.category,sii.source_url,sii.amazon_url,sii.image_url,
        sii.supplier_name,sii.supplier_sku,sii.supplier_contact,
        sii.on_hand_quantity,sii.reserved_quantity,sii.incoming_quantity,sii.reorder_level,
        sii.preferred_reorder_quantity,sii.is_on_reorder_list,sii.do_not_reorder,sii.do_not_reuse,
        sii.stock_unit_label,sii.usage_unit_label,sii.usage_units_per_stock_unit,sii.last_counted_at,sii.updated_at,
        siup.site_item_inventory_id AS usage_profile_id,
        COALESCE(siup.usage_tracking_mode,CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END) AS usage_tracking_mode,
        COALESCE(siup.minimum_usage_increment,0.001) AS minimum_usage_increment,
        COALESCE(siup.notes,'') AS usage_profile_notes,
        (SELECT COUNT(*) FROM site_item_inventory d
          WHERE COALESCE(d.is_active,1)=1
            AND LOWER(TRIM(COALESCE(d.source_type,''))) IN ('tool','supply')
            AND LOWER(TRIM(COALESCE(d.external_key,'')))=LOWER(TRIM(COALESCE(sii.external_key,'')))
            AND TRIM(COALESCE(d.external_key,''))<>'') AS key_duplicate_count,
        (SELECT COUNT(*) FROM site_item_inventory d
          WHERE COALESCE(d.is_active,1)=1
            AND LOWER(TRIM(COALESCE(d.source_type,'')))=LOWER(TRIM(COALESCE(sii.source_type,'')))
            AND LOWER(TRIM(COALESCE(d.external_key,'')))=LOWER(TRIM(COALESCE(sii.external_key,'')))
            AND TRIM(COALESCE(d.external_key,''))<>'') AS same_kind_duplicate_count,
        CASE WHEN (
          (LOWER(TRIM(COALESCE(sii.source_type,'')))='supply' AND (
            siup.site_item_inventory_id IS NULL
            OR (LOWER(TRIM(COALESCE(siup.usage_tracking_mode,'log_only')))='log_only' AND ${LEGACY_USAGE_NOTE_SQL})
          ))
          OR (LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' AND siup.site_item_inventory_id IS NOT NULL AND LOWER(TRIM(COALESCE(siup.usage_tracking_mode,'reusable')))<>'reusable')
        ) THEN 1 ELSE 0 END AS usage_review_required,
        CASE WHEN sii.last_counted_at IS NULL OR datetime(sii.last_counted_at)<datetime('now','-90 days') THEN 1 ELSE 0 END AS count_due,
        CASE WHEN (
          (COALESCE(sii.do_not_reorder,0)=0 AND COALESCE(sii.reorder_level,0)>0 AND COALESCE(sii.on_hand_quantity,0)<=COALESCE(sii.reorder_level,0) AND COALESCE(sii.is_on_reorder_list,0)=0)
          OR (COALESCE(sii.do_not_reorder,0)=1 AND COALESCE(sii.is_on_reorder_list,0)=1)
        ) THEN 1 ELSE 0 END AS reorder_review_required,
        CASE
          WHEN TRIM(COALESCE(sii.external_key,''))='' THEN 'missing'
          WHEN EXISTS(
            SELECT 1 FROM catalog_items ci
            WHERE LOWER(TRIM(COALESCE(ci.item_kind,'')))=LOWER(TRIM(COALESCE(sii.source_type,'')))
              AND LOWER(TRIM(COALESCE(ci.source_key,'')))=LOWER(TRIM(COALESCE(sii.external_key,'')))
              AND COALESCE(ci.status,'active')<>'archived'
          ) THEN 'matched'
          WHEN EXISTS(
            SELECT 1 FROM catalog_items ci
            WHERE LOWER(TRIM(COALESCE(ci.source_key,'')))=LOWER(TRIM(COALESCE(sii.external_key,'')))
              AND LOWER(TRIM(COALESCE(ci.item_kind,''))) IN ('tool','supply')
              AND COALESCE(ci.status,'active')<>'archived'
          ) THEN 'kind_drift'
          ELSE 'missing'
        END AS catalog_reference_status
      FROM site_item_inventory sii
      LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id
      WHERE COALESCE(sii.is_active,1)=1
        AND LOWER(TRIM(COALESCE(sii.source_type,''))) IN ('tool','supply')
    )
    SELECT *
    FROM base
    WHERE (?='' OR LOWER(COALESCE(item_name,'')) LIKE ? OR LOWER(COALESCE(external_key,'')) LIKE ? OR LOWER(COALESCE(category,'')) LIKE ? OR LOWER(COALESCE(supplier_name,'')) LIKE ?)
      AND ${filter}
    ORDER BY
      CASE catalog_reference_status WHEN 'kind_drift' THEN 0 WHEN 'missing' THEN 1 ELSE 2 END,
      CASE WHEN key_duplicate_count>1 THEN 0 ELSE 1 END,
      CASE WHEN usage_review_required=1 THEN 0 ELSE 1 END,
      CASE WHEN count_due=1 THEN 0 ELSE 1 END,
      LOWER(COALESCE(item_name,'')) ASC,
      site_item_inventory_id ASC
    LIMIT ?
  `).bind(q, like, like, like, like, safeLimit).all();

  return rows(result).map(shapeIssue);
}

export async function onRequestGet({ request, env }) {
  const admin = await getAdminUserFromRequest(request, env);
  if (!admin) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const url = new URL(request.url);
  const mode = text(url.searchParams.get('mode') || 'summary').toLowerCase();
  const queue = text(url.searchParams.get('queue') || 'all').toLowerCase();
  const q = text(url.searchParams.get('q')).slice(0, 120);
  const limit = Math.max(1, Math.min(MAX_ROWS, Number(url.searchParams.get('limit') || MAX_ROWS)));

  try {
    if (mode === 'summary') {
      return json({ ok: true, mode, authority: 'live_d1_inventory', mutation_capability: 'none', summary: await summary(db) });
    }
    if (mode === 'issues') {
      return json({
        ok: true,
        mode,
        queue,
        q,
        limit,
        authority: 'live_d1_inventory',
        mutation_capability: 'none',
        review_actions: 'existing_inventory_authorities_only',
        items: await issueRows(db, { queue, q, limit }),
      });
    }
    return json({ ok: false, error: 'Unsupported Inventory identity-health mode.' }, 400);
  } catch (error) {
    return json({
      ok: false,
      mode,
      authority: 'live_d1_inventory',
      mutation_capability: 'none',
      error: 'Inventory identity cleanup evidence could not be loaded.',
      detail: text(error?.message || error),
    }, 503);
  }
}
