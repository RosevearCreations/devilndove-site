// File: /functions/api/admin/schema-drift-report.js
// Brief description: Admin-only D1 schema drift report for required/optional columns used by the storefront, catalog, inventory, accounting, and runtime tools.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function normalizeText(value) {
  return String(value == null ? '' : value).trim();
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

async function columnRows(db, tableName) {
  const safeTable = safeIdentifier(tableName);
  if (!safeTable) return [];
  try {
    return rows(await db.prepare(`PRAGMA table_info(${safeTable})`).all());
  } catch {
    return [];
  }
}

async function canSelectColumn(db, tableName, columnName) {
  const safeTable = safeIdentifier(tableName);
  const safeColumn = safeIdentifier(columnName);
  if (!safeTable || !safeColumn) return false;
  try {
    await db.prepare(`SELECT ${safeColumn} FROM ${safeTable} LIMIT 0`).all();
    return true;
  } catch {
    return false;
  }
}

const EXPECTED_TABLES = [
  {
    table: 'products',
    area: 'public_catalog',
    required: ['product_id', 'slug', 'name'],
    recommended: ['status', 'price_cents', 'currency', 'featured_image_url', 'product_type', 'product_category', 'color_name', 'inventory_quantity', 'on_hand_quantity', 'tax_class_id', 'requires_shipping'],
    optional: ['merchandise_origin', 'sale_channel', 'external_listing_url', 'external_listing_label', 'condition_summary', 'era_label', 'sourcing_notes', 'compare_at_price_cents', 'short_description', 'description'],
    why: 'Public shop, gallery, creations, and product detail endpoints.'
  },
  {
    table: 'tax_classes',
    area: 'tax',
    required: ['tax_class_id'],
    recommended: ['code', 'name', 'tax_rate', 'rate_percent'],
    optional: [],
    why: 'Product tax display and accounting/tax review.'
  },
  {
    table: 'product_seo',
    area: 'seo',
    required: ['product_id'],
    recommended: ['meta_title', 'meta_description', 'keywords', 'h1_override', 'canonical_url'],
    optional: ['schema_type', 'og_title', 'og_description', 'og_image_url'],
    why: 'Product-level title/meta/search support.'
  },
  {
    table: 'catalog_items',
    area: 'catalog_bridge',
    required: ['catalog_item_id', 'item_kind', 'source_key', 'name'],
    recommended: ['category', 'image_url', 'amazon_url', 'unit_cost_cents', 'stock_unit_label', 'usage_unit_label', 'usage_units_per_stock_unit'],
    optional: ['supplier_name', 'supplier_sku', 'match_status', 'amazon_title'],
    why: 'JSON-to-D1 Tools/Supplies bridge.'
  },
  {
    table: 'site_item_inventory',
    area: 'inventory',
    required: ['site_item_inventory_id', 'source_type', 'external_key', 'item_name'],
    recommended: ['on_hand_quantity', 'unit_cost_cents', 'stock_unit_label', 'usage_unit_label', 'usage_units_per_stock_unit', 'amazon_url', 'supplier_name', 'supplier_sku'],
    optional: ['preferred_reorder_quantity', 'is_on_reorder_list', 'do_not_reorder', 'do_not_reuse', 'reuse_status', 'reservation_notes'],
    why: 'Working inventory table used by product resource links and costing.'
  },
  {
    table: 'site_item_inventory_cost_history',
    area: 'inventory_costing',
    required: ['site_item_inventory_cost_history_id', 'site_item_inventory_id', 'new_unit_cost_cents'],
    recommended: ['old_unit_cost_cents', 'change_source', 'source_reference', 'changed_by_user_id', 'created_at'],
    optional: ['notes'],
    why: 'Audit trail for Amazon/manual unit-cost changes.'
  },
  {
    table: 'amazon_purchase_import_staging',
    area: 'amazon_import',
    required: ['id', 'import_batch_id', 'source_file'],
    recommended: ['review_decision', 'match_status', 'match_score', 'inventory_type', 'inventory_key', 'amazon_title', 'asin', 'unit_net_cost_cents', 'item_net_total_cents'],
    optional: ['applied_inventory_id', 'applied_cost_history_id', 'applied_at', 'reviewed_by_user_id', 'review_notes'],
    why: 'Private Amazon CSV review/apply workflow.'
  },
  {
    table: 'runtime_incidents',
    area: 'operations',
    required: ['runtime_incident_id', 'incident_scope', 'incident_code', 'severity'],
    recommended: ['endpoint_path', 'message', 'details_json', 'review_status', 'admin_note', 'reviewed_at', 'created_at'],
    optional: ['related_user_id', 'ip_address', 'user_agent', 'reviewed_by_user_id'],
    why: 'Release sanity and recurring runtime issue triage.'
  },
  {
    table: 'schema_migration_ledger',
    area: 'operations',
    required: ['schema_migration_id', 'migration_key', 'file_name', 'status'],
    recommended: ['migration_key', 'checksum', 'notes', 'applied_at', 'created_at'],
    optional: ['destructive', 'applied_by_user_id'],
    why: 'Prevents mystery D1 drift and double-run confusion.'
  },

  {
    table: 'deployment_preflight_runs',
    area: 'operations',
    required: ['deployment_preflight_run_id', 'run_status'],
    recommended: ['build_label', 'blocker_count', 'warning_count', 'summary_json', 'created_at'],
    optional: ['created_by_user_id'],
    why: 'Saved deployment preflight snapshots for safe deploy reviews and release accountability.'
  },
  {
    table: 'deployment_post_deploy_confirmations',
    area: 'operations',
    required: ['deployment_post_deploy_confirmation_id', 'confirmation_key', 'confirmation_status'],
    recommended: ['build_label', 'confirmation_label', 'confirmed_by_user_id', 'confirmed_at', 'updated_at'],
    optional: ['notes'],
    why: 'Post-deploy confirmation workflow for marking D1, smoke-test, R2/email, release note, and public-page reviews complete.'
  },
  {
    table: 'accounting_reconciliation_exceptions',
    area: 'accounting',
    required: ['accounting_reconciliation_exception_id'],
    recommended: ['exception_status', 'assigned_to_user_id', 'needs_accountant_review', 'resolution_notes', 'created_at'],
    optional: ['source_reference', 'statement_import_id', 'resolved_at'],
    why: 'Accountant review queue and bank/processor matching exceptions.'
  },
  {
    table: 'accounting_journal_entries',
    area: 'accounting',
    required: ['accounting_journal_entry_id'],
    recommended: ['entry_date', 'memo', 'imbalance_cents', 'posted_at', 'posting_status'],
    optional: ['source_type', 'source_id', 'created_by_user_id'],
    why: 'Journal validation, posting, and close controls.'
  }
];

async function inspectTable(db, spec) {
  const exists = await tableExists(db, spec.table);
  const infoRows = exists ? await columnRows(db, spec.table) : [];
  const pragmaColumns = new Set(infoRows.map((row) => normalizeText(row.name)).filter(Boolean));
  const allExpected = Array.from(new Set([...(spec.required || []), ...(spec.recommended || []), ...(spec.optional || [])]));
  const verified = [];
  const present = [];
  const missing = [];

  for (const column of allExpected) {
    const isPresent = pragmaColumns.has(column);
    const isVerified = isPresent ? await canSelectColumn(db, spec.table, column) : false;
    if (isPresent) present.push(column);
    if (isVerified) verified.push(column);
    if (!isVerified) missing.push(column);
  }

  const missingRequired = (spec.required || []).filter((column) => !verified.includes(column));
  const missingRecommended = (spec.recommended || []).filter((column) => !verified.includes(column));
  const missingOptional = (spec.optional || []).filter((column) => !verified.includes(column));
  const status = !exists || missingRequired.length ? 'fail' : (missingRecommended.length ? 'warn' : 'pass');

  return {
    table: spec.table,
    area: spec.area,
    why: spec.why,
    exists,
    status,
    column_count: infoRows.length,
    present_columns: present,
    verified_columns: verified,
    missing_columns: missing,
    missing_required: missingRequired,
    missing_recommended: missingRecommended,
    missing_optional: missingOptional,
    add_column_hints: [...missingRequired, ...missingRecommended].map((column) => `Review migration for ${spec.table}.${column}`)
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);

  const includeOptional = ['1', 'true', 'yes'].includes(normalizeText(new URL(request.url).searchParams.get('include_optional')).toLowerCase());
  const tables = [];
  for (const spec of EXPECTED_TABLES) {
    const row = await inspectTable(db, spec);
    if (!includeOptional) delete row.missing_optional;
    tables.push(row);
  }

  const failCount = tables.filter((row) => row.status === 'fail').length;
  const warnCount = tables.filter((row) => row.status === 'warn').length;
  const blockingTables = tables.filter((row) => row.status === 'fail').map((row) => row.table);

  return jsonResponse({
    ok: true,
    generated_at: new Date().toISOString(),
    summary: {
      status: failCount ? 'fail' : (warnCount ? 'warning' : 'ok'),
      table_count: tables.length,
      fail_count: failCount,
      warning_count: warnCount,
      pass_count: tables.length - failCount - warnCount,
      blocking_tables: blockingTables
    },
    tables
  }, 200, { 'Cache-Control': 'no-store' });
}
