// Storefront schema inspection is read-only. Runtime schema repair was retired in Release 464.
import {
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
} from '../_lib/adminAudit.js';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function columns(db, tableName) {
  try {
    return rows(await db.prepare(`PRAGMA table_info(${tableName})`).all())
      .map((row) => String(row?.name || '').trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function indexes(db, tableName) {
  try {
    return rows(await db.prepare(`PRAGMA index_list(${tableName})`).all())
      .map((row) => String(row?.name || '').trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

const REQUIREMENTS = {
  products: {
    columns: [
      'product_id', 'slug', 'product_number', 'sku', 'product_category', 'color_name', 'color_names_json',
      'shipping_code', 'review_status', 'short_description', 'description', 'product_type', 'status',
      'merchandise_origin', 'sale_channel', 'external_listing_url', 'external_listing_label',
      'condition_summary', 'era_label', 'sourcing_notes', 'price_cents', 'compare_at_price_cents',
      'currency', 'taxable', 'tax_class_id', 'requires_shipping', 'weight_grams', 'inventory_tracking',
      'inventory_quantity', 'digital_file_url', 'featured_image_url', 'sort_order', 'created_at', 'updated_at',
    ],
    indexes: ['idx_products_status_131', 'idx_products_slug_131', 'idx_products_origin_channel_131', 'idx_products_category_131'],
  },
  tax_classes: {
    columns: ['tax_class_id', 'code', 'name', 'tax_rate', 'rate_percent', 'is_active', 'created_at', 'updated_at'],
    indexes: ['idx_tax_classes_code_131'],
  },
  product_seo: {
    columns: ['product_seo_id', 'product_id', 'meta_title', 'meta_description', 'keywords', 'h1_override', 'canonical_url', 'schema_type', 'og_title', 'og_description', 'og_image_url', 'created_at', 'updated_at'],
    indexes: ['idx_product_seo_product_131'],
  },
};

async function inspect(db) {
  const tables = [];
  for (const [table, requirement] of Object.entries(REQUIREMENTS)) {
    const liveColumns = new Set(await columns(db, table));
    const liveIndexes = new Set(await indexes(db, table));
    const missingColumns = requirement.columns.filter((name) => !liveColumns.has(name));
    const missingIndexes = requirement.indexes.filter((name) => !liveIndexes.has(name));
    tables.push({
      table,
      exists: liveColumns.size > 0,
      live_column_count: liveColumns.size,
      missing_columns: missingColumns,
      missing_indexes: missingIndexes,
      status: missingColumns.length || missingIndexes.length ? 'migration_required' : 'ready',
    });
  }
  const attention = tables.filter((row) => row.status !== 'ready');
  return {
    status: attention.length ? 'migration_required' : 'ready',
    runtime_schema_mutation_allowed: false,
    canonical_migration_path: 'migrations/canonical',
    tables,
  };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  return jsonResponse({ ok: true, ...(await inspect(db)) }, 200, { 'Cache-Control': 'no-store' });
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  return jsonResponse({
    ok: false,
    error: 'Runtime storefront schema repair is retired. Add a forward migration under migrations/canonical and apply it through scripts/d1_migrate.py.',
    code: 'canonical_migration_required',
    runtime_schema_mutation_allowed: false,
  }, 405, { Allow: 'GET', 'Cache-Control': 'no-store' });
}
