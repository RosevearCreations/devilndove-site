// File: /functions/api/admin/amazon-purchase-review.js
// Brief description: Admin review/apply workflow for private Amazon purchase-import staging rows.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { recordInventoryCostHistory } from './_inventoryCostHistory.js';

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function json(data, status = 200) { return jsonResponse(data, status); }
function moneyCents(value) { return Math.max(0, Math.round(Number(value || 0)) || 0); }
function amazonUrlFromAsin(asin) {
  const clean = normalizeText(asin).replace(/[^A-Z0-9]/gi, '').toUpperCase();
  return clean ? `https://www.amazon.ca/dp/${clean}` : '';
}

async function columnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(rows(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch { return new Set(); }
}

async function ensureAmazonPurchaseReviewSchema(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS amazon_purchase_import_staging (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      import_batch_id TEXT NOT NULL,
      source_file TEXT NOT NULL,
      match_status TEXT NOT NULL DEFAULT 'unmatched',
      match_score REAL NOT NULL DEFAULT 0,
      token_coverage REAL NOT NULL DEFAULT 0,
      matched_token_count INTEGER NOT NULL DEFAULT 0,
      matched_tokens TEXT,
      safe_to_stage_after_review TEXT NOT NULL DEFAULT 'review',
      review_decision TEXT NOT NULL DEFAULT 'pending',
      review_notes TEXT,
      inventory_type TEXT CHECK (inventory_type IN ('tool', 'supply') OR inventory_type IS NULL),
      inventory_key TEXT,
      inventory_key_loose TEXT,
      inventory_name TEXT,
      inventory_brand_guess TEXT,
      inventory_category_or_type TEXT,
      inventory_r2_object_key TEXT,
      order_date TEXT,
      payment_date TEXT,
      amazon_order_id TEXT,
      asin TEXT,
      amazon_title TEXT,
      amazon_brand TEXT,
      manufacturer TEXT,
      amazon_product_category TEXT,
      item_model_number TEXT,
      part_number TEXT,
      seller_name TEXT,
      currency TEXT NOT NULL DEFAULT 'CAD',
      item_quantity REAL,
      item_subtotal_cents INTEGER NOT NULL DEFAULT 0,
      item_shipping_cents INTEGER NOT NULL DEFAULT 0,
      item_tax_cents INTEGER NOT NULL DEFAULT 0,
      item_net_total_cents INTEGER NOT NULL DEFAULT 0,
      unit_net_cost_cents INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT
    )
  `).run();

  const cols = await columnSet(db, 'amazon_purchase_import_staging');
  const migrations = [
    ['applied_inventory_id', `ALTER TABLE amazon_purchase_import_staging ADD COLUMN applied_inventory_id INTEGER`],
    ['applied_cost_history_id', `ALTER TABLE amazon_purchase_import_staging ADD COLUMN applied_cost_history_id INTEGER`],
    ['applied_at', `ALTER TABLE amazon_purchase_import_staging ADD COLUMN applied_at TEXT`],
    ['reviewed_by_user_id', `ALTER TABLE amazon_purchase_import_staging ADD COLUMN reviewed_by_user_id INTEGER`]
  ];
  for (const [name, sql] of migrations) {
    if (!cols.has(name)) await db.prepare(sql).run().catch(() => null);
  }
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_review ON amazon_purchase_import_staging(review_decision, match_status)`).run().catch(() => null);
}

async function ensureSiteInventoryBasics(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS site_item_inventory (
      site_item_inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_type TEXT NOT NULL,
      external_key TEXT NOT NULL,
      item_name TEXT NOT NULL,
      category TEXT,
      source_url TEXT,
      amazon_url TEXT,
      image_url TEXT,
      on_hand_quantity INTEGER NOT NULL DEFAULT 1,
      reserved_quantity INTEGER NOT NULL DEFAULT 0,
      incoming_quantity INTEGER NOT NULL DEFAULT 0,
      reorder_level INTEGER NOT NULL DEFAULT 0,
      unit_cost_cents INTEGER NOT NULL DEFAULT 0,
      stock_unit_label TEXT NOT NULL DEFAULT 'unit',
      usage_unit_label TEXT NOT NULL DEFAULT 'unit',
      usage_units_per_stock_unit REAL NOT NULL DEFAULT 1,
      supplier_name TEXT,
      supplier_sku TEXT,
      supplier_contact TEXT,
      reorder_notes TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(source_type, external_key)
    )
  `).run();
  const cols = await columnSet(db, 'site_item_inventory');
  const migrations = [
    ['category', `ALTER TABLE site_item_inventory ADD COLUMN category TEXT`],
    ['source_url', `ALTER TABLE site_item_inventory ADD COLUMN source_url TEXT`],
    ['amazon_url', `ALTER TABLE site_item_inventory ADD COLUMN amazon_url TEXT`],
    ['image_url', `ALTER TABLE site_item_inventory ADD COLUMN image_url TEXT`],
    ['on_hand_quantity', `ALTER TABLE site_item_inventory ADD COLUMN on_hand_quantity INTEGER NOT NULL DEFAULT 1`],
    ['reserved_quantity', `ALTER TABLE site_item_inventory ADD COLUMN reserved_quantity INTEGER NOT NULL DEFAULT 0`],
    ['incoming_quantity', `ALTER TABLE site_item_inventory ADD COLUMN incoming_quantity INTEGER NOT NULL DEFAULT 0`],
    ['reorder_level', `ALTER TABLE site_item_inventory ADD COLUMN reorder_level INTEGER NOT NULL DEFAULT 0`],
    ['unit_cost_cents', `ALTER TABLE site_item_inventory ADD COLUMN unit_cost_cents INTEGER NOT NULL DEFAULT 0`],
    ['stock_unit_label', `ALTER TABLE site_item_inventory ADD COLUMN stock_unit_label TEXT NOT NULL DEFAULT 'unit'`],
    ['usage_unit_label', `ALTER TABLE site_item_inventory ADD COLUMN usage_unit_label TEXT NOT NULL DEFAULT 'unit'`],
    ['usage_units_per_stock_unit', `ALTER TABLE site_item_inventory ADD COLUMN usage_units_per_stock_unit REAL NOT NULL DEFAULT 1`],
    ['supplier_name', `ALTER TABLE site_item_inventory ADD COLUMN supplier_name TEXT`],
    ['supplier_sku', `ALTER TABLE site_item_inventory ADD COLUMN supplier_sku TEXT`],
    ['supplier_contact', `ALTER TABLE site_item_inventory ADD COLUMN supplier_contact TEXT`],
    ['reorder_notes', `ALTER TABLE site_item_inventory ADD COLUMN reorder_notes TEXT`],
    ['is_active', `ALTER TABLE site_item_inventory ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`],
    ['created_at', `ALTER TABLE site_item_inventory ADD COLUMN created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`],
    ['updated_at', `ALTER TABLE site_item_inventory ADD COLUMN updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`]
  ];
  for (const [name, sql] of migrations) {
    if (!cols.has(name)) await db.prepare(sql).run().catch(() => null);
  }
}

async function findInventory(db, row, override = {}) {
  const inventoryType = normalizeText(override.inventory_type || row.inventory_type).toLowerCase();
  const inventoryKey = normalizeText(override.inventory_key || row.inventory_key);
  if (inventoryType && inventoryKey) {
    const direct = await db.prepare(`SELECT * FROM site_item_inventory WHERE source_type=? AND external_key=? LIMIT 1`).bind(inventoryType, inventoryKey).first().catch(() => null);
    if (direct) return direct;
  }
  const asin = normalizeText(override.asin || row.asin).toUpperCase();
  if (asin) {
    const asinMatch = await db.prepare(`SELECT * FROM site_item_inventory WHERE UPPER(COALESCE(supplier_sku,''))=? LIMIT 1`).bind(asin).first().catch(() => null);
    if (asinMatch) return asinMatch;
  }
  return null;
}

function buildReviewNote(existingNotes, note, decision) {
  const parts = [];
  if (existingNotes) parts.push(String(existingNotes));
  const clean = normalizeText(note);
  const stamp = `${decision || 'review'} ${new Date().toISOString()}`;
  parts.push(clean ? `${stamp}: ${clean}` : stamp);
  return parts.join('\n');
}

async function listRows(db, request) {
  const url = new URL(request.url);
  const decision = normalizeText(url.searchParams.get('review_decision') || url.searchParams.get('decision')).toLowerCase();
  const status = normalizeText(url.searchParams.get('match_status')).toLowerCase();
  const q = normalizeText(url.searchParams.get('q')).toLowerCase();
  const limit = Math.max(1, Math.min(300, Number(url.searchParams.get('limit') || 100) || 100));
  const like = `%${q}%`;
  const result = await db.prepare(`
    SELECT
      aps.*,
      sii.site_item_inventory_id AS linked_inventory_id,
      sii.item_name AS linked_inventory_name,
      sii.unit_cost_cents AS linked_unit_cost_cents,
      sii.stock_unit_label AS linked_stock_unit_label,
      sii.usage_unit_label AS linked_usage_unit_label,
      sii.usage_units_per_stock_unit AS linked_usage_units_per_stock_unit
    FROM amazon_purchase_import_staging aps
    LEFT JOIN site_item_inventory sii
      ON sii.source_type = aps.inventory_type
     AND sii.external_key = aps.inventory_key
    WHERE (? = '' OR LOWER(COALESCE(aps.review_decision,'')) = ?)
      AND (? = '' OR LOWER(COALESCE(aps.match_status,'')) = ?)
      AND (
        ? = ''
        OR LOWER(COALESCE(aps.amazon_title,'')) LIKE ?
        OR LOWER(COALESCE(aps.inventory_name,'')) LIKE ?
        OR LOWER(COALESCE(aps.asin,'')) LIKE ?
        OR LOWER(COALESCE(aps.amazon_order_id,'')) LIKE ?
      )
    ORDER BY
      CASE LOWER(COALESCE(aps.review_decision,'')) WHEN 'pending' THEN 0 WHEN 'hold' THEN 1 WHEN 'approved' THEN 2 ELSE 3 END,
      aps.match_score DESC,
      aps.id DESC
    LIMIT ?
  `).bind(decision, decision, status, status, q, like, like, like, like, limit).all().catch(() => ({ results: [] }));
  const items = rows(result).map((row) => ({
    ...row,
    id: Number(row.id || 0),
    match_score: Number(row.match_score || 0),
    item_quantity: Number(row.item_quantity || 0),
    item_net_total_cents: Number(row.item_net_total_cents || 0),
    unit_net_cost_cents: row.unit_net_cost_cents == null ? null : Number(row.unit_net_cost_cents || 0),
    linked_inventory_id: row.linked_inventory_id == null ? null : Number(row.linked_inventory_id || 0),
    linked_unit_cost_cents: row.linked_unit_cost_cents == null ? null : Number(row.linked_unit_cost_cents || 0)
  }));
  const summary = rows(await db.prepare(`
    SELECT COALESCE(review_decision,'pending') AS review_decision, COUNT(*) AS total
    FROM amazon_purchase_import_staging
    GROUP BY COALESCE(review_decision,'pending')
  `).all().catch(() => ({ results: [] }))).reduce((acc, row) => {
    acc[row.review_decision || 'pending'] = Number(row.total || 0);
    return acc;
  }, {});
  return { items, summary };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAmazonPurchaseReviewSchema(db);
  await ensureSiteInventoryBasics(db);
  const payload = await listRows(db, context.request);
  return json({ ok: true, ...payload });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAmazonPurchaseReviewSchema(db);
  await ensureSiteInventoryBasics(db);
  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const id = Number(body.id || body.amazon_purchase_import_staging_id || 0);
  if (!id) return json({ ok: false, error: 'A staging row id is required.' }, 400);
  const decision = normalizeText(body.review_decision || body.decision || 'hold').toLowerCase();
  if (!['pending', 'approved', 'hold', 'rejected'].includes(decision)) return json({ ok: false, error: 'review_decision must be pending, approved, hold, or rejected.' }, 400);

  const row = await db.prepare(`SELECT * FROM amazon_purchase_import_staging WHERE id=? LIMIT 1`).bind(id).first();
  if (!row) return json({ ok: false, error: 'Amazon staging row not found.' }, 404);

  let applied = null;
  let costHistoryId = null;
  const reviewNotes = buildReviewNote(row.review_notes, body.review_notes || body.note, decision);

  if (decision === 'approved') {
    const inventory = await findInventory(db, row, body);
    if (!inventory?.site_item_inventory_id) {
      return json({ ok: false, error: 'Approved rows must be linked to an existing inventory item before applying cost.' }, 400);
    }
    const unitCost = moneyCents(body.unit_net_cost_cents == null ? row.unit_net_cost_cents : body.unit_net_cost_cents);
    if (!unitCost) return json({ ok: false, error: 'Approved rows need a non-zero unit cost.' }, 400);
    const asin = normalizeText(body.asin || row.asin).toUpperCase();
    const amazonUrl = normalizeText(body.amazon_url || amazonUrlFromAsin(asin) || inventory.amazon_url);
    const noteBits = [
      inventory.reorder_notes || '',
      `Amazon approved import ${id}: ${row.amazon_title || row.inventory_name || 'Amazon purchase'}${row.amazon_order_id ? `; order ${row.amazon_order_id}` : ''}`
    ].filter(Boolean);

    await db.prepare(`
      UPDATE site_item_inventory
      SET unit_cost_cents = ?,
          supplier_name = COALESCE(NULLIF(?, ''), supplier_name),
          supplier_sku = COALESCE(NULLIF(?, ''), supplier_sku),
          supplier_contact = COALESCE(NULLIF(?, ''), supplier_contact),
          amazon_url = COALESCE(NULLIF(?, ''), amazon_url),
          source_url = COALESCE(NULLIF(?, ''), source_url),
          on_hand_quantity = CASE WHEN COALESCE(on_hand_quantity,0) < 1 THEN 1 ELSE on_hand_quantity END,
          reorder_notes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE site_item_inventory_id = ?
    `).bind(
      unitCost,
      normalizeText(row.seller_name) || 'Amazon.ca',
      asin || null,
      amazonUrl ? 'Amazon.ca' : null,
      amazonUrl || null,
      amazonUrl || null,
      noteBits.join('\n'),
      Number(inventory.site_item_inventory_id || 0)
    ).run();

    costHistoryId = await recordInventoryCostHistory(db, {
      site_item_inventory_id: Number(inventory.site_item_inventory_id || 0),
      source_type: inventory.source_type || row.inventory_type || null,
      external_key: inventory.external_key || row.inventory_key || null,
      item_name: inventory.item_name || row.inventory_name || row.amazon_title || null,
      previous_unit_cost_cents: Number(inventory.unit_cost_cents || 0),
      new_unit_cost_cents: unitCost,
      currency: row.currency || 'CAD',
      source_kind: 'amazon_purchase_import_staging',
      source_id: String(id),
      source_reference: row.amazon_order_id || asin || null,
      reason_note: normalizeText(body.review_notes || body.note) || 'Approved Amazon purchase import.',
      changed_by_user_id: adminUser.user_id
    }).catch(() => null);

    applied = {
      site_item_inventory_id: Number(inventory.site_item_inventory_id || 0),
      previous_unit_cost_cents: Number(inventory.unit_cost_cents || 0),
      new_unit_cost_cents: unitCost,
      cost_history_id: costHistoryId || null
    };
  }

  const finalInventoryType = normalizeText(body.inventory_type || row.inventory_type) || null;
  const finalInventoryKey = normalizeText(body.inventory_key || row.inventory_key) || null;
  await db.prepare(`
    UPDATE amazon_purchase_import_staging
    SET review_decision = ?,
        review_notes = ?,
        inventory_type = COALESCE(?, inventory_type),
        inventory_key = COALESCE(?, inventory_key),
        applied_inventory_id = COALESCE(?, applied_inventory_id),
        applied_cost_history_id = COALESCE(?, applied_cost_history_id),
        applied_at = CASE WHEN ? = 'approved' THEN CURRENT_TIMESTAMP ELSE applied_at END,
        reviewed_by_user_id = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    decision,
    reviewNotes || null,
    finalInventoryType,
    finalInventoryKey,
    applied?.site_item_inventory_id || null,
    costHistoryId || null,
    decision,
    adminUser.user_id,
    id
  ).run();

  await auditAdminAction(env, request, adminUser, {
    action_type: `amazon_purchase_review_${decision}`,
    target_type: 'amazon_purchase_import_staging',
    target_id: id,
    details: { applied, inventory_type: finalInventoryType, inventory_key: finalInventoryKey }
  });

  return json({ ok: true, id, review_decision: decision, applied });
}
