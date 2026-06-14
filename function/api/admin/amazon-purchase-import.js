// File: /functions/api/admin/amazon-purchase-import.js
// Brief description: Admin-only CSV paste/import endpoint for Amazon purchase staging rows.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

function normalizeText(value) {
  return String(value == null ? '' : value).trim();
}

function slugKey(value) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function parseCsv(text) {
  const output = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const input = String(text || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    const next = input[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i += 1; continue; }
      if (ch === '"') { inQuotes = false; continue; }
      field += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ',') { row.push(field); field = ''; continue; }
    if (ch === '\n') { row.push(field); output.push(row); row = []; field = ''; continue; }
    if (ch === '\r') continue;
    field += ch;
  }
  row.push(field);
  if (row.some((cell) => normalizeText(cell))) output.push(row);
  return output;
}

function cents(value) {
  if (value == null || value === '') return 0;
  const clean = String(value).replace(/[$,\s]/g, '').replace(/^\((.*)\)$/, '-$1');
  const number = Number(clean);
  if (!Number.isFinite(number)) return 0;
  return Math.round(number * 100);
}

function numberValue(value, fallback = 1) {
  const clean = String(value == null ? '' : value).replace(/[,\s]/g, '');
  const number = Number(clean);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function pick(row, aliases) {
  return pickWithKey(row, aliases).value;
}

function pickWithKey(row, aliases) {
  for (const alias of aliases) {
    const key = slugKey(alias);
    if (Object.prototype.hasOwnProperty.call(row, key) && normalizeText(row[key]) !== '') return { key, value: normalizeText(row[key]) };
  }
  return { key: '', value: '' };
}

function centsFromAliases(row, aliases) {
  const picked = pickWithKey(row, aliases);
  if (!picked.value) return 0;
  if (picked.key.endsWith('_cents') || picked.key.includes('cents')) {
    const direct = Number(String(picked.value).replace(/[,\s]/g, ''));
    return Number.isFinite(direct) ? Math.round(direct) : 0;
  }
  return cents(picked.value);
}

function amazonUrlFromAsin(asin) {
  const clean = normalizeText(asin).toUpperCase();
  return clean ? `https://www.amazon.ca/dp/${encodeURIComponent(clean)}` : '';
}

async function ensureSchema(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS amazon_purchase_import_batches (
      amazon_purchase_import_batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
      import_batch_id TEXT NOT NULL UNIQUE,
      source_file TEXT,
      imported_row_count INTEGER NOT NULL DEFAULT 0,
      skipped_row_count INTEGER NOT NULL DEFAULT 0,
      created_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    )
  `).run();

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
      inventory_type TEXT,
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
      amazon_url TEXT,
      applied_inventory_id INTEGER,
      applied_cost_history_id INTEGER,
      applied_at TEXT,
      reviewed_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT
    )
  `).run();

  const cols = rows(await db.prepare(`PRAGMA table_info(amazon_purchase_import_staging)`).all()).map((row) => String(row.name || '').toLowerCase());
  const migrations = [
    ['amazon_url', `ALTER TABLE amazon_purchase_import_staging ADD COLUMN amazon_url TEXT`],
    ['applied_inventory_id', `ALTER TABLE amazon_purchase_import_staging ADD COLUMN applied_inventory_id INTEGER`],
    ['applied_cost_history_id', `ALTER TABLE amazon_purchase_import_staging ADD COLUMN applied_cost_history_id INTEGER`],
    ['applied_at', `ALTER TABLE amazon_purchase_import_staging ADD COLUMN applied_at TEXT`],
    ['reviewed_by_user_id', `ALTER TABLE amazon_purchase_import_staging ADD COLUMN reviewed_by_user_id INTEGER`],
    ['updated_at', `ALTER TABLE amazon_purchase_import_staging ADD COLUMN updated_at TEXT`]
  ];
  for (const [name, sql] of migrations) {
    if (!cols.includes(name)) await db.prepare(sql).run().catch(() => null);
  }
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_batch ON amazon_purchase_import_staging(import_batch_id)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_review ON amazon_purchase_import_staging(review_decision, match_status)`).run().catch(() => null);
}

function buildRow(record, defaults) {
  const title = pick(record, ['amazon_title', 'title', 'item title', 'product name', 'item name', 'description']);
  const asin = pick(record, ['asin', 'ASIN', 'product asin']).toUpperCase();
  const quantity = numberValue(pick(record, ['item_quantity', 'quantity', 'qty']), 1);
  const subtotal = centsFromAliases(record, ['item_subtotal_cents', 'item_subtotal', 'subtotal', 'item total before tax', 'item price']);
  const shipping = centsFromAliases(record, ['item_shipping_cents', 'item_shipping', 'shipping', 'shipping charge']);
  const tax = centsFromAliases(record, ['item_tax_cents', 'item_tax', 'tax', 'item tax']);
  let netTotal = centsFromAliases(record, ['item_net_total_cents', 'item_net_total', 'net total', 'total', 'item total']);
  if (!netTotal) netTotal = subtotal + shipping + tax;
  const explicitUnit = centsFromAliases(record, ['unit_net_cost_cents', 'unit_net_cost', 'unit cost', 'cost per unit']);
  const unit = explicitUnit || (quantity > 0 ? Math.round(netTotal / quantity) : netTotal);
  const matchStatus = pick(record, ['match_status', 'match status']) || defaults.match_status || 'unmatched';
  const reviewDecision = pick(record, ['review_decision', 'review decision']) || defaults.review_decision || 'pending';
  return {
    import_batch_id: defaults.import_batch_id,
    source_file: defaults.source_file,
    match_status: matchStatus,
    match_score: Number(pick(record, ['match_score', 'score']) || 0) || 0,
    token_coverage: Number(pick(record, ['token_coverage', 'coverage']) || 0) || 0,
    matched_token_count: Number(pick(record, ['matched_token_count']) || 0) || 0,
    matched_tokens: pick(record, ['matched_tokens', 'matched tokens']),
    safe_to_stage_after_review: pick(record, ['safe_to_stage_after_review', 'safe to stage']) || 'review',
    review_decision: ['pending', 'hold', 'approved', 'rejected'].includes(reviewDecision.toLowerCase()) ? reviewDecision.toLowerCase() : 'pending',
    review_notes: pick(record, ['review_notes', 'notes']),
    inventory_type: pick(record, ['inventory_type', 'source_type', 'type']).toLowerCase(),
    inventory_key: pick(record, ['inventory_key', 'external_key', 'source_key']),
    inventory_key_loose: pick(record, ['inventory_key_loose']),
    inventory_name: pick(record, ['inventory_name', 'matched inventory', 'our item name']),
    inventory_brand_guess: pick(record, ['inventory_brand_guess', 'brand guess']),
    inventory_category_or_type: pick(record, ['inventory_category_or_type', 'category', 'item category']),
    inventory_r2_object_key: pick(record, ['inventory_r2_object_key', 'r2 object key']),
    order_date: pick(record, ['order_date', 'order date', 'date']),
    payment_date: pick(record, ['payment_date', 'payment date']),
    amazon_order_id: pick(record, ['amazon_order_id', 'order id', 'order number']),
    asin,
    amazon_title: title,
    amazon_brand: pick(record, ['amazon_brand', 'brand']),
    manufacturer: pick(record, ['manufacturer']),
    amazon_product_category: pick(record, ['amazon_product_category', 'product category']),
    item_model_number: pick(record, ['item_model_number', 'model number']),
    part_number: pick(record, ['part_number', 'part number']),
    seller_name: pick(record, ['seller_name', 'seller']),
    currency: pick(record, ['currency']) || 'CAD',
    item_quantity: quantity,
    item_subtotal_cents: subtotal,
    item_shipping_cents: shipping,
    item_tax_cents: tax,
    item_net_total_cents: netTotal,
    unit_net_cost_cents: unit,
    amazon_url: pick(record, ['amazon_url', 'product url', 'url']) || amazonUrlFromAsin(asin)
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);

  let body = {};
  try { body = await request.json(); } catch { return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const csvText = String(body.csv_text || body.csv || '').trim();
  if (!csvText) return jsonResponse({ ok: false, error: 'Paste Amazon CSV text first.' }, 400);

  await ensureSchema(db);
  const parsed = parseCsv(csvText);
  if (parsed.length < 2) return jsonResponse({ ok: false, error: 'CSV needs a header row and at least one data row.' }, 400);
  const header = parsed[0].map(slugKey);
  const importBatchId = normalizeText(body.import_batch_id) || `amazon-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
  const sourceFile = normalizeText(body.source_file) || 'admin-pasted-amazon.csv';
  const defaults = { import_batch_id: importBatchId, source_file: sourceFile, review_decision: 'pending', match_status: 'unmatched' };

  let inserted = 0;
  let skipped = 0;
  const warnings = [];
  for (const cells of parsed.slice(1)) {
    const record = {};
    header.forEach((key, index) => { record[key || `column_${index + 1}`] = cells[index] || ''; });
    const row = buildRow(record, defaults);
    if (!row.amazon_title && !row.asin && !row.amazon_order_id) { skipped += 1; continue; }
    try {
      await db.prepare(`
        INSERT INTO amazon_purchase_import_staging (
          import_batch_id, source_file, match_status, match_score, token_coverage, matched_token_count, matched_tokens,
          safe_to_stage_after_review, review_decision, review_notes, inventory_type, inventory_key, inventory_key_loose,
          inventory_name, inventory_brand_guess, inventory_category_or_type, inventory_r2_object_key, order_date, payment_date,
          amazon_order_id, asin, amazon_title, amazon_brand, manufacturer, amazon_product_category, item_model_number,
          part_number, seller_name, currency, item_quantity, item_subtotal_cents, item_shipping_cents, item_tax_cents,
          item_net_total_cents, unit_net_cost_cents, amazon_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        row.import_batch_id, row.source_file, row.match_status, row.match_score, row.token_coverage, row.matched_token_count, row.matched_tokens,
        row.safe_to_stage_after_review, row.review_decision, row.review_notes, row.inventory_type || null, row.inventory_key || null, row.inventory_key_loose || null,
        row.inventory_name || null, row.inventory_brand_guess || null, row.inventory_category_or_type || null, row.inventory_r2_object_key || null, row.order_date || null, row.payment_date || null,
        row.amazon_order_id || null, row.asin || null, row.amazon_title || null, row.amazon_brand || null, row.manufacturer || null, row.amazon_product_category || null, row.item_model_number || null,
        row.part_number || null, row.seller_name || null, row.currency || 'CAD', row.item_quantity, row.item_subtotal_cents, row.item_shipping_cents, row.item_tax_cents,
        row.item_net_total_cents, row.unit_net_cost_cents, row.amazon_url || null
      ).run();
      inserted += 1;
    } catch (error) {
      skipped += 1;
      if (warnings.length < 10) warnings.push(error?.message || String(error));
    }
  }

  await db.prepare(`
    INSERT INTO amazon_purchase_import_batches (import_batch_id, source_file, imported_row_count, skipped_row_count, created_by_user_id, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(import_batch_id) DO UPDATE SET
      imported_row_count = imported_row_count + excluded.imported_row_count,
      skipped_row_count = skipped_row_count + excluded.skipped_row_count,
      notes = excluded.notes
  `).bind(importBatchId, sourceFile, inserted, skipped, Number(adminUser.user_id || 0), normalizeText(body.notes || '')).run().catch(() => null);

  await auditAdminAction(env, request, adminUser, {
    action_type: 'amazon_purchase_csv_import',
    target_type: 'amazon_purchase_import_staging',
    target_key: importBatchId,
    details: { source_file: sourceFile, inserted, skipped, warnings }
  });

  return jsonResponse({ ok: true, import_batch_id: importBatchId, source_file: sourceFile, inserted_count: inserted, skipped_count: skipped, warnings }, 200, { 'Cache-Control': 'no-store' });
}
