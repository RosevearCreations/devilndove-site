
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

const EXPECTED_TABLES = {
  users: ['user_id'],
  sessions: ['session_id', 'user_id'],
  admin_logs: [],
  user_profiles: ['profile_id'],
  access_tiers: ['tier_id'],
  user_access_tiers: ['user_access_tier_id'],
  tax_classes: ['tax_class_id'],
  products: ['product_id', 'product_number', 'name', 'status'],
  product_images: ['product_image_id', 'product_id', 'image_url'],
  product_tags: ['product_tag_id'],
  product_seo: ['product_seo_id'],
  orders: ['order_id'],
  order_items: ['order_item_id', 'order_id'],
  order_status_history: ['order_status_history_id'],
  auth_recovery_requests: ['auth_recovery_request_id'],
  admin_action_audit: ['admin_action_audit_id'],
  runtime_incidents: ['runtime_incident_id'],
  app_settings: ['setting_key'],
  movie_catalog: ['movie_id'],
  notification_outbox: ['notification_outbox_id'],
  supplier_purchase_orders: ['supplier_purchase_order_id'],
  supplier_purchase_order_items: ['supplier_purchase_order_item_id'],
  catalog_items: ['catalog_item_id'],
  product_review_actions: ['product_review_action_id'],
  product_resource_links: ['product_resource_link_id'],
  site_item_inventory: ['site_item_inventory_id'],
  site_inventory_movements: ['site_inventory_movement_id'],
  site_visitors: ['site_visitor_id'],
  site_visitor_sessions: ['site_visitor_session_id'],
  site_page_views: ['site_page_view_id'],
  site_search_events: ['site_search_event_id'],
  payments: ['payment_id'],
  payment_refunds: ['payment_refund_id'],
  payment_disputes: ['payment_dispute_id'],
  media_assets: ['media_asset_id'],
  product_image_annotations: ['product_image_annotation_id'],
  product_media_score_history: ['product_media_score_history_id'],
  membership_tier_policies: ['membership_tier_policy_id'],
  gift_cards: ['gift_card_id'],
  gift_card_delivery_audit: ['gift_card_delivery_audit_id'],
  general_ledger_accounts: ['gl_account_id', 'code', 'name', 'category', 'parent_group', 'normal_balance', 'sort_order', 'gifi_code', 'gifi_label', 'gifi_section', 'tax_deductibility_percent', 'gifi_review_state', 'gifi_review_note'],
  accounting_expenses: ['expense_id', 'expense_date', 'amount', 'ledger_code'],
  accounting_writeoffs: ['writeoff_id', 'writeoff_date', 'amount'],
  product_costs: ['product_cost_id', 'product_number', 'cost_per_unit'],
  accounting_overhead_allocations: ['allocation_id', 'period_month', 'ledger_code', 'amount_cents'],
  accounting_overhead_product_allocations: ['overhead_product_allocation_id', 'period_month', 'ledger_code', 'product_id', 'amount_cents'],
  accounting_journal_entries: ['journal_entry_id', 'period_month', 'source_type', 'source_key', 'status', 'total_debit_cents', 'total_credit_cents', 'imbalance_cents'],
  accounting_journal_lines: ['journal_line_id', 'journal_entry_id', 'line_number', 'ledger_code', 'debit_cents', 'credit_cents'],
  accounting_gifi_review_notes: ['accounting_gifi_review_note_id', 'tax_year', 'gifi_code', 'review_status'],
  accounting_period_closures: ['accounting_period_closure_id', 'period_month', 'lock_state'],
  admin_pending_actions: ['admin_pending_action_id'],
  cart_activity: ['cart_activity_id'],
};

async function getTableNames(db) {
  const result = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name ASC`).all().catch(() => ({ results: [] }));
  const rows = Array.isArray(result?.results) ? result.results : [];
  return rows.map((row) => String(row?.name || '').trim()).filter(Boolean);
}

async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    return new Set(rows.map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);

  const existing = new Set(await getTableNames(db));
  const missingTables = [];
  const staleTables = [];
  const okTables = [];

  for (const [tableName, requiredColumns] of Object.entries(EXPECTED_TABLES)) {
    if (!existing.has(tableName)) {
      missingTables.push({ table_name: tableName, missing_columns: requiredColumns });
      continue;
    }
    const cols = await getTableColumnSet(db, tableName);
    const missingColumns = requiredColumns.filter((name) => !cols.has(name));
    if (missingColumns.length) staleTables.push({ table_name: tableName, missing_columns: missingColumns, column_count: cols.size });
    else okTables.push({ table_name: tableName, column_count: cols.size });
  }

  const unexpectedTables = [...existing].filter((name) => !Object.prototype.hasOwnProperty.call(EXPECTED_TABLES, name));

  return jsonResponse({
    ok: true,
    summary: {
      expected_table_count: Object.keys(EXPECTED_TABLES).length,
      existing_table_count: existing.size,
      ok_table_count: okTables.length,
      missing_table_count: missingTables.length,
      stale_table_count: staleTables.length,
      unexpected_table_count: unexpectedTables.length,
      status: missingTables.length || staleTables.length ? 'attention_required' : 'ok',
    },
    missing_tables: missingTables,
    stale_tables: staleTables,
    ok_tables: okTables,
    unexpected_tables: unexpectedTables,
  });
}
