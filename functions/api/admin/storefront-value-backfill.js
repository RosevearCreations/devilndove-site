// File: /functions/api/admin/storefront-value-backfill.js
// Brief description: Admin-only safe storefront value backfill for product defaults and product_seo placeholder rows.

import {
  auditAdminAction,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from '../_lib/adminAudit.js';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function safeIdentifier(value) {
  const clean = normalizeText(value);
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(clean) ? clean : '';
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(tableName).first();
    return !!row;
  } catch { return false; }
}

async function tableColumns(db, tableName) {
  const safeTable = safeIdentifier(tableName);
  if (!safeTable) return new Set();
  try {
    const result = await db.prepare(`PRAGMA table_info(${safeTable})`).all();
    return new Set(rows(result).map((row) => String(row.name || '').trim()).filter(Boolean));
  } catch { return new Set(); }
}

async function countWhere(db, tableName, whereSql) {
  const safeTable = safeIdentifier(tableName);
  if (!safeTable || !await tableExists(db, safeTable)) return null;
  try {
    const row = await db.prepare(`SELECT COUNT(*) AS total FROM ${safeTable} WHERE ${whereSql}`).first();
    return Number(row?.total || 0);
  } catch { return null; }
}

const PRODUCT_DEFAULTS = [
  { column: 'status', value: 'active', where: "COALESCE(status,'') = ''", purpose: 'active storefront visibility' },
  { column: 'product_type', value: 'physical', where: "COALESCE(product_type,'') = ''", purpose: 'physical/digital filter stability' },
  { column: 'merchandise_origin', value: 'handmade', where: "COALESCE(merchandise_origin,'') = ''", purpose: 'handmade/vintage local SEO filter' },
  { column: 'sale_channel', value: 'onsite', where: "COALESCE(sale_channel,'') = ''", purpose: 'onsite/external/hybrid channel filter' },
  { column: 'currency', value: 'CAD', where: "COALESCE(currency,'') = ''", purpose: 'Canadian price/schema display' },
  { column: 'review_status', value: 'published', where: "COALESCE(review_status,'') = ''", purpose: 'admin review state' },
  { column: 'taxable', value: 1, where: 'taxable IS NULL', purpose: 'sales-tax review default' },
  { column: 'requires_shipping', value: 1, where: 'requires_shipping IS NULL', purpose: 'physical item shipping default' },
  { column: 'inventory_tracking', value: 0, where: 'inventory_tracking IS NULL', purpose: 'inventory tracking default' },
  { column: 'inventory_quantity', value: 0, where: 'inventory_quantity IS NULL', purpose: 'stock quantity default' },
  { column: 'created_at', valueSql: 'CURRENT_TIMESTAMP', where: "COALESCE(created_at,'') = ''", purpose: 'created timestamp fallback' },
  { column: 'updated_at', valueSql: 'CURRENT_TIMESTAMP', where: "COALESCE(updated_at,'') = ''", purpose: 'updated timestamp fallback' },
];

async function inspect(db) {
  const productExists = await tableExists(db, 'products');
  const productColumns = productExists ? await tableColumns(db, 'products') : new Set();
  const productChecks = [];
  for (const item of PRODUCT_DEFAULTS) {
    if (!productColumns.has(item.column)) {
      productChecks.push({ ...item, available: false, pending_count: null, status: 'skipped', note: 'Column missing. Run Storefront Schema Repair first.' });
      continue;
    }
    const pending = await countWhere(db, 'products', item.where);
    productChecks.push({ ...item, available: true, pending_count: pending, status: pending > 0 ? 'warn' : 'pass' });
  }

  let seo = { available: false, missing_rows: null, status: 'skipped', note: 'product_seo table or product_id column missing.' };
  if (productExists && await tableExists(db, 'product_seo')) {
    const seoColumns = await tableColumns(db, 'product_seo');
    if (productColumns.has('product_id') && seoColumns.has('product_id')) {
      try {
        const row = await db.prepare(`
          SELECT COUNT(*) AS total
          FROM products p
          LEFT JOIN product_seo ps ON ps.product_id = p.product_id
          WHERE ps.product_id IS NULL
        `).first();
        seo = { available: true, missing_rows: Number(row?.total || 0), status: Number(row?.total || 0) ? 'warn' : 'pass', note: 'Missing SEO rows can be created with safe blank defaults.' };
      } catch (error) {
        seo = { available: false, missing_rows: null, status: 'skipped', note: String(error?.message || error || 'SEO inspect failed') };
      }
    }
  }

  const pendingTotal = productChecks.reduce((total, row) => total + Number(row.pending_count || 0), 0) + Number(seo.missing_rows || 0);
  return {
    generated_at: new Date().toISOString(),
    summary: {
      status: !productExists ? 'fail' : (pendingTotal ? 'warning' : 'ok'),
      product_table_exists: productExists,
      product_backfill_pending_count: productChecks.reduce((total, row) => total + Number(row.pending_count || 0), 0),
      missing_product_seo_rows: Number(seo.missing_rows || 0),
      pending_total: pendingTotal
    },
    product_checks: productChecks,
    product_seo: seo
  };
}

async function applyBackfill(db) {
  const before = await inspect(db);
  const actions = [];
  if (!before.summary.product_table_exists) return { before, actions, after: before };

  const columns = await tableColumns(db, 'products');
  for (const item of PRODUCT_DEFAULTS) {
    if (!columns.has(item.column)) {
      actions.push({ column: item.column, status: 'skipped', note: 'Column missing.' });
      continue;
    }
    const safeColumn = safeIdentifier(item.column);
    const assignment = item.valueSql ? `${safeColumn} = ${item.valueSql}` : `${safeColumn} = ?`;
    try {
      const stmt = db.prepare(`UPDATE products SET ${assignment} WHERE ${item.where}`);
      const result = item.valueSql ? await stmt.run() : await stmt.bind(item.value).run();
      actions.push({ column: item.column, status: 'applied', changed_rows: Number(result?.meta?.changes || 0), purpose: item.purpose });
    } catch (error) {
      actions.push({ column: item.column, status: 'failed', error: String(error?.message || error || 'Update failed') });
    }
  }

  if (await tableExists(db, 'product_seo')) {
    const productColumns = await tableColumns(db, 'products');
    const seoColumns = await tableColumns(db, 'product_seo');
    if (productColumns.has('product_id') && seoColumns.has('product_id')) {
      const insertColumns = ['product_id'];
      const selectColumns = ['p.product_id'];
      if (seoColumns.has('schema_type')) { insertColumns.push('schema_type'); selectColumns.push("'Product'"); }
      if (seoColumns.has('created_at')) { insertColumns.push('created_at'); selectColumns.push('CURRENT_TIMESTAMP'); }
      if (seoColumns.has('updated_at')) { insertColumns.push('updated_at'); selectColumns.push('CURRENT_TIMESTAMP'); }
      try {
        const result = await db.prepare(`
          INSERT INTO product_seo (${insertColumns.join(', ')})
          SELECT ${selectColumns.join(', ')}
          FROM products p
          LEFT JOIN product_seo ps ON ps.product_id = p.product_id
          WHERE ps.product_id IS NULL
        `).run();
        actions.push({ table: 'product_seo', status: 'applied', changed_rows: Number(result?.meta?.changes || 0), note: 'Inserted missing product_seo placeholder rows.' });
      } catch (error) {
        actions.push({ table: 'product_seo', status: 'failed', error: String(error?.message || error || 'SEO row insert failed') });
      }
    }
  }

  try {
    await db.prepare(`
      INSERT OR IGNORE INTO schema_migration_ledger (
        migration_key, file_name, status, destructive, notes, applied_at, created_at, updated_at
      ) VALUES (?, ?, 'applied', 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      'storefront_value_backfill_build133',
      'functions/api/admin/storefront-value-backfill.js',
      'Build 133 admin safe value backfill applied: product defaults and missing product_seo placeholders.'
    ).run();
  } catch {}

  return { before, actions, after: await inspect(db) };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return jsonResponse({ ok: false, error: 'D1 binding is unavailable.' }, 500);
  return jsonResponse({ ok: true, report: await inspect(db) }, 200, { 'Cache-Control': 'no-store' });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return jsonResponse({ ok: false, error: 'D1 binding is unavailable.' }, 500);
  const result = await applyBackfill(db);
  await auditAdminAction(env, request, adminUser, {
    action_type: 'storefront_value_backfill',
    target_type: 'products',
    target_key: 'build133',
    details: { action_count: result.actions.length, pending_after: result.after?.summary?.pending_total }
  });
  return jsonResponse({ ok: true, ...result }, 200, { 'Cache-Control': 'no-store' });
}
