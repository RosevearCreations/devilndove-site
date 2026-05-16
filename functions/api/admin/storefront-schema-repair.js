// File: /functions/api/admin/storefront-schema-repair.js
// Brief description: Admin-only non-destructive D1 storefront schema repair helper for product/shop columns that older databases may be missing.

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
  } catch {
    return false;
  }
}

async function getColumns(db, tableName) {
  const safeTable = safeIdentifier(tableName);
  if (!safeTable) return new Set();
  try {
    return new Set(rows(await db.prepare(`PRAGMA table_info(${safeTable})`).all()).map((row) => normalizeText(row.name)).filter(Boolean));
  } catch {
    return new Set();
  }
}

const TABLE_SPECS = [
  {
    table: 'products',
    must_exist: true,
    columns: [
      { name: 'product_number', sql: 'TEXT', purpose: 'Human-readable product number shown in admin and listings.' },
      { name: 'sku', sql: 'TEXT', purpose: 'SKU / sale-channel identifier.' },
      { name: 'product_category', sql: 'TEXT', purpose: 'Public category filters and local SEO wording.' },
      { name: 'color_name', sql: 'TEXT', purpose: 'Simple color filter and product cards.' },
      { name: 'color_names_json', sql: "TEXT DEFAULT '[]'", purpose: 'Multi-colour product filtering.' },
      { name: 'shipping_code', sql: 'TEXT', purpose: 'Shipping and handling workflow.' },
      { name: 'review_status', sql: "TEXT DEFAULT 'published'", purpose: 'Admin publishing/review workflow.' },
      { name: 'short_description', sql: 'TEXT', purpose: 'Shop card and product-detail summary.' },
      { name: 'description', sql: 'TEXT', purpose: 'Full public product description.' },
      { name: 'product_type', sql: "TEXT DEFAULT 'physical'", purpose: 'Physical/digital product filtering.' },
      { name: 'status', sql: "TEXT DEFAULT 'active'", purpose: 'Published/active storefront visibility.' },
      { name: 'merchandise_origin', sql: "TEXT DEFAULT 'handmade'", purpose: 'Handmade/vintage/collectible local-intent filters.' },
      { name: 'sale_channel', sql: "TEXT DEFAULT 'onsite'", purpose: 'Onsite/external/hybrid sale-channel filter.' },
      { name: 'external_listing_url', sql: 'TEXT', purpose: 'External marketplace listing link.' },
      { name: 'external_listing_label', sql: 'TEXT', purpose: 'External marketplace label.' },
      { name: 'condition_summary', sql: 'TEXT', purpose: 'Vintage/collectible condition notes.' },
      { name: 'era_label', sql: 'TEXT', purpose: 'Vintage/antique era label.' },
      { name: 'sourcing_notes', sql: 'TEXT', purpose: 'Private/public sourcing story support.' },
      { name: 'price_cents', sql: 'INTEGER DEFAULT 0', purpose: 'Price stored in cents for currency-safe math.' },
      { name: 'compare_at_price_cents', sql: 'INTEGER', purpose: 'Sale/compare-at pricing.' },
      { name: 'currency', sql: "TEXT DEFAULT 'CAD'", purpose: 'Canadian pricing display and accounting.' },
      { name: 'taxable', sql: 'INTEGER DEFAULT 1', purpose: 'Sales-tax and HST review workflow.' },
      { name: 'tax_class_id', sql: 'INTEGER', purpose: 'Tax class link.' },
      { name: 'requires_shipping', sql: 'INTEGER DEFAULT 1', purpose: 'Shipping workflow and public filter.' },
      { name: 'weight_grams', sql: 'INTEGER', purpose: 'Shipping estimates.' },
      { name: 'inventory_tracking', sql: 'INTEGER DEFAULT 0', purpose: 'Inventory-tracked products.' },
      { name: 'inventory_quantity', sql: 'INTEGER DEFAULT 0', purpose: 'Product stock quantity.' },
      { name: 'digital_file_url', sql: 'TEXT', purpose: 'Digital download products.' },
      { name: 'featured_image_url', sql: 'TEXT', purpose: 'Shop/gallery card image.' },
      { name: 'sort_order', sql: 'INTEGER DEFAULT 0', purpose: 'Manual display order.' },
      { name: 'created_at', sql: 'TEXT', purpose: 'Created timestamp fallback.' },
      { name: 'updated_at', sql: 'TEXT', purpose: 'Updated timestamp fallback.' },
    ],
    indexes: [
      { name: 'idx_products_status_131', sql: 'CREATE INDEX IF NOT EXISTS idx_products_status_131 ON products(status)' },
      { name: 'idx_products_slug_131', sql: 'CREATE INDEX IF NOT EXISTS idx_products_slug_131 ON products(slug)' },
      { name: 'idx_products_origin_channel_131', sql: 'CREATE INDEX IF NOT EXISTS idx_products_origin_channel_131 ON products(merchandise_origin, sale_channel)' },
      { name: 'idx_products_category_131', sql: 'CREATE INDEX IF NOT EXISTS idx_products_category_131 ON products(product_category)' },
    ],
  },
  {
    table: 'tax_classes',
    create_sql: `CREATE TABLE IF NOT EXISTS tax_classes (
      tax_class_id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT,
      tax_rate REAL DEFAULT 0,
      rate_percent REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    columns: [
      { name: 'code', sql: 'TEXT', purpose: 'Tax code label.' },
      { name: 'name', sql: 'TEXT', purpose: 'Tax class display name.' },
      { name: 'tax_rate', sql: 'REAL DEFAULT 0', purpose: 'Legacy/current tax rate value.' },
      { name: 'rate_percent', sql: 'REAL DEFAULT 0', purpose: 'Newer percentage field used by some code paths.' },
      { name: 'is_active', sql: 'INTEGER DEFAULT 1', purpose: 'Hide inactive tax classes.' },
      { name: 'created_at', sql: 'TEXT', purpose: 'Created timestamp fallback.' },
      { name: 'updated_at', sql: 'TEXT', purpose: 'Updated timestamp fallback.' },
    ],
    indexes: [
      { name: 'idx_tax_classes_code_131', sql: 'CREATE INDEX IF NOT EXISTS idx_tax_classes_code_131 ON tax_classes(code)' },
    ],
  },
  {
    table: 'product_seo',
    create_sql: `CREATE TABLE IF NOT EXISTS product_seo (
      product_seo_id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      meta_title TEXT,
      meta_description TEXT,
      keywords TEXT,
      h1_override TEXT,
      canonical_url TEXT,
      schema_type TEXT DEFAULT 'Product',
      og_title TEXT,
      og_description TEXT,
      og_image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    columns: [
      { name: 'product_id', sql: 'INTEGER', purpose: 'Product link.' },
      { name: 'meta_title', sql: 'TEXT', purpose: 'Product SEO title.' },
      { name: 'meta_description', sql: 'TEXT', purpose: 'Product SEO description.' },
      { name: 'keywords', sql: 'TEXT', purpose: 'Admin search and SEO review notes.' },
      { name: 'h1_override', sql: 'TEXT', purpose: 'One clear product H1 override.' },
      { name: 'canonical_url', sql: 'TEXT', purpose: 'Canonical URL support.' },
      { name: 'schema_type', sql: "TEXT DEFAULT 'Product'", purpose: 'Structured data type hint.' },
      { name: 'og_title', sql: 'TEXT', purpose: 'Social share title.' },
      { name: 'og_description', sql: 'TEXT', purpose: 'Social share description.' },
      { name: 'og_image_url', sql: 'TEXT', purpose: 'Social share image.' },
      { name: 'created_at', sql: 'TEXT', purpose: 'Created timestamp fallback.' },
      { name: 'updated_at', sql: 'TEXT', purpose: 'Updated timestamp fallback.' },
    ],
    indexes: [
      { name: 'idx_product_seo_product_131', sql: 'CREATE INDEX IF NOT EXISTS idx_product_seo_product_131 ON product_seo(product_id)' },
    ],
  },
];

async function inspectSpec(db, spec) {
  const exists = await tableExists(db, spec.table);
  const columns = exists ? await getColumns(db, spec.table) : new Set();
  const missingColumns = exists ? spec.columns.filter((column) => !columns.has(column.name)) : spec.columns;
  return {
    table: spec.table,
    exists,
    can_create_table: !!spec.create_sql,
    must_exist: !!spec.must_exist,
    status: !exists && spec.must_exist ? 'fail' : (missingColumns.length ? 'warn' : 'pass'),
    live_column_count: columns.size,
    missing_columns: missingColumns.map((column) => ({ name: column.name, sql: column.sql, purpose: column.purpose })),
    planned_index_count: Array.isArray(spec.indexes) ? spec.indexes.length : 0,
  };
}

async function buildReport(db) {
  const tables = [];
  for (const spec of TABLE_SPECS) tables.push(await inspectSpec(db, spec));
  const failCount = tables.filter((row) => row.status === 'fail').length;
  const warnCount = tables.filter((row) => row.status === 'warn').length;
  return {
    generated_at: new Date().toISOString(),
    summary: {
      status: failCount ? 'fail' : (warnCount ? 'warning' : 'ok'),
      table_count: tables.length,
      fail_count: failCount,
      warning_count: warnCount,
      pass_count: tables.length - failCount - warnCount,
      missing_column_count: tables.reduce((total, row) => total + row.missing_columns.length, 0),
    },
    tables,
  };
}

async function applySpec(db, spec) {
  const actions = [];
  let exists = await tableExists(db, spec.table);
  if (!exists && spec.create_sql && !spec.must_exist) {
    await db.prepare(spec.create_sql).run();
    actions.push({ table: spec.table, action: 'create_table', status: 'applied' });
    exists = true;
  }
  if (!exists) {
    actions.push({ table: spec.table, action: 'skip_missing_required_table', status: 'skipped', note: `${spec.table} must be created by the base schema first.` });
    return actions;
  }

  let columns = await getColumns(db, spec.table);
  for (const column of spec.columns) {
    if (columns.has(column.name)) continue;
    const safeTable = safeIdentifier(spec.table);
    const safeColumn = safeIdentifier(column.name);
    if (!safeTable || !safeColumn) continue;
    try {
      await db.prepare(`ALTER TABLE ${safeTable} ADD COLUMN ${safeColumn} ${column.sql}`).run();
      actions.push({ table: spec.table, column: column.name, action: 'add_column', status: 'applied', sql_type: column.sql });
      columns.add(column.name);
    } catch (error) {
      actions.push({ table: spec.table, column: column.name, action: 'add_column', status: 'failed', error: String(error?.message || error || 'ALTER TABLE failed') });
    }
  }

  for (const indexSpec of spec.indexes || []) {
    try {
      await db.prepare(indexSpec.sql).run();
      actions.push({ table: spec.table, index: indexSpec.name, action: 'create_index', status: 'applied' });
    } catch (error) {
      actions.push({ table: spec.table, index: indexSpec.name, action: 'create_index', status: 'failed', error: String(error?.message || error || 'CREATE INDEX failed') });
    }
  }
  return actions;
}

async function recordLedger(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS schema_migration_ledger (
        schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
        migration_key TEXT NOT NULL UNIQUE,
        file_name TEXT NOT NULL,
        checksum TEXT,
        status TEXT NOT NULL DEFAULT 'applied',
        destructive INTEGER NOT NULL DEFAULT 0,
        applied_by_user_id INTEGER,
        applied_at TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    await db.prepare(`
      INSERT OR IGNORE INTO schema_migration_ledger (
        migration_key, file_name, status, destructive, notes, applied_at, created_at, updated_at
      ) VALUES (?, ?, 'applied', 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      'storefront_schema_repair_build131',
      'runtime_admin_storefront_schema_repair',
      'Applied non-destructive storefront compatibility columns from /api/admin/storefront-schema-repair.'
    ).run();
  } catch {}
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const report = await buildReport(db);
  return jsonResponse({ ok: true, ...report }, 200, { 'Cache-Control': 'no-store' });
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);

  let body = {};
  try { body = await context.request.json(); }
  catch { return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const action = normalizeText(body.action || '');
  const confirm = body.confirm === true || body.confirm === 1 || body.confirm === '1';
  if (action !== 'apply_safe_columns' || !confirm) {
    return jsonResponse({ ok: false, error: 'Use action=apply_safe_columns with confirm=true to apply non-destructive repairs.' }, 400);
  }

  const before = await buildReport(db);
  const actions = [];
  for (const spec of TABLE_SPECS) actions.push(...await applySpec(db, spec));
  await recordLedger(db);
  const after = await buildReport(db);

  await auditAdminAction(context.env, context.request, adminUser, {
    action_type: 'storefront_schema_repair',
    target_type: 'database_schema',
    target_key: 'products_tax_classes_product_seo',
    details: {
      missing_before: before.summary.missing_column_count,
      missing_after: after.summary.missing_column_count,
      action_count: actions.length,
    },
  });

  return jsonResponse({ ok: true, before: before.summary, after: after.summary, actions, report: after }, 200, { 'Cache-Control': 'no-store' });
}
