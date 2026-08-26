// Devil n Dove Build 437 — Platform-owned non-mutating database sanity read service.

export const BUILD = 437;
export const CONTRACT_ID = 'platform-db-sanity-read';
export const OWNER = 'platform';

export const EXPECTED_TABLES = Object.freeze({
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
  schema_migration_ledger: ['schema_migration_id', 'migration_key', 'file_name', 'status'],
  amazon_purchase_import_staging: ['id', 'import_batch_id', 'review_decision', 'inventory_type', 'inventory_key', 'amazon_order_id', 'asin', 'unit_net_cost_cents'],
  movie_catalog: ['movie_catalog_id'],
  notification_outbox: ['notification_outbox_id'],
  community_events: ['community_event_id', 'title', 'event_type', 'event_status', 'starts_at', 'city', 'region_label', 'recurrence_rule', 'recurrence_interval', 'recurrence_count', 'recurrence_until', 'recurrence_label', 'image_url', 'image_alt', 'application_mode', 'application_url', 'vendor_capacity', 'vendor_note'],
  pickup_profiles: ['pickup_profile_id', 'label', 'pickup_mode', 'city', 'region_label', 'appointment_only', 'lead_time_hours'],
  event_vendor_applications: ['event_vendor_application_id', 'community_event_id', 'event_title_snapshot', 'vendor_name', 'contact_email', 'application_status', 'internal_note'],
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
  payment_refunds: ['refund_id'],
  payment_disputes: ['payment_dispute_id'],
  media_assets: ['media_asset_id'],
  product_image_annotations: ['product_image_annotation_id'],
  product_media_score_history: ['product_media_score_history_id'],
  membership_tier_policies: ['policy_id'],
  gift_cards: ['gift_card_id'],
  gift_card_delivery_audit: ['gift_card_delivery_audit_id'],
  general_ledger_accounts: ['gl_account_id', 'code', 'name', 'category', 'parent_group', 'normal_balance', 'sort_order', 'gifi_code', 'gifi_label', 'gifi_section', 'tax_deductibility_percent', 'gifi_review_state', 'gifi_review_note', 'gifi_reviewed_by_user_id', 'gifi_reviewed_at'],
  accounting_expenses: ['expense_id', 'expense_date', 'vendor_id', 'amount', 'ledger_code', 'recurring_expense_rule_id', 'source_mode', 'reference_number'],
  accounting_vendors: ['accounting_vendor_id', 'vendor_name', 'default_ledger_code'],
  accounting_recurring_expense_rules: ['recurring_expense_rule_id', 'vendor_name', 'rule_name', 'ledger_code', 'amount', 'frequency', 'next_due_date'],
  accounting_reconciliation_reviews: ['accounting_reconciliation_review_id', 'reconciliation_type', 'period_month', 'scope_key', 'review_status', 'statement_reference', 'difference_reason', 'detail_json', 'attachment_count', 'statement_amount_cents', 'book_amount_cents', 'tolerance_cents', 'expected_rate_basis_points', 'observed_rate_basis_points', 'unresolved_item_count'],
  accounting_attachments: ['accounting_attachment_id', 'attachment_kind', 'attachment_status', 'attachment_scope', 'document_date', 'scope_key', 'provider_scope', 'object_key', 'mime_type', 'file_size_bytes', 'statement_gross_cents', 'statement_fee_cents', 'statement_net_cents', 'statement_tax_cents', 'statement_shipping_cents', 'statement_txn_count'],
  accounting_statement_provider_profiles: ['accounting_statement_provider_profile_id', 'provider_scope', 'display_name', 'date_column', 'gross_column', 'net_column'],
  accounting_statement_imports: ['accounting_statement_import_id', 'provider_scope', 'import_status', 'period_month', 'row_count', 'gross_cents', 'fee_cents', 'net_cents'],
  accounting_statement_import_rows: ['accounting_statement_import_row_id', 'accounting_statement_import_id', 'provider_scope', 'txn_date', 'gross_cents', 'fee_cents', 'net_cents'],
  accounting_reconciliation_exceptions: ['accounting_reconciliation_exception_id', 'reconciliation_type', 'period_month', 'scope_key', 'exception_status', 'difference_cents'],
  accounting_fixed_assets: ['accounting_fixed_asset_id', 'asset_label', 'asset_category', 'cca_class', 'cost_cents'],
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
  deployment_preflight_runs: ['deployment_preflight_run_id', 'build_label', 'run_status', 'blocker_count', 'warning_count', 'summary_json'],
  deployment_post_deploy_confirmations: ['deployment_post_deploy_confirmation_id', 'build_label', 'confirmation_key', 'confirmation_status', 'confirmed_by_user_id', 'confirmed_at'],
  deployment_history: ['deployment_history_id', 'build_label', 'deployment_status'],
  release_manifest_live_diffs: ['release_manifest_live_diff_id', 'build_label', 'diff_status', 'missing_file_count'],
  safe_deploy_package_downloads: ['safe_deploy_package_download_id', 'build_label', 'zip_sha256', 'total_bytes'],
  product_qa_bulk_fix_preview_items: ['product_qa_bulk_fix_preview_item_id', 'product_id', 'blocker_code', 'fix_url'],
  marketplace_export_validation_runs: ['marketplace_export_validation_run_id', 'channel', 'validation_status'],
  recall_notification_locks: ['recall_notification_lock_id', 'batch_number', 'lock_status'],
  local_seo_internal_link_suggestions: ['local_seo_internal_link_suggestion_id', 'source_path', 'target_path'],
  local_business_schema_extended_fields: ['local_business_schema_extended_field_id', 'local_business_schema_setting_id'],
  deployment_rollback_checklist_rows: ['deployment_rollback_checklist_row_id', 'build_label', 'checklist_key'],
});

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
async function getTableNames(db) { const result=await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name ASC`).all().catch(()=>({results:[]})); return rows(result).map((row)=>String(row?.name||'').trim()).filter(Boolean); }
async function getTableColumnSet(db,tableName){ try{return new Set(rows(await db.prepare(`PRAGMA table_info(${tableName})`).all()).map((row)=>String(row?.name||'').trim()).filter(Boolean));}catch{return new Set();} }
async function getIndexNames(db,tableName){ try{return rows(await db.prepare(`PRAGMA index_list(${tableName})`).all()).map((row)=>String(row?.name||'').trim()).filter(Boolean);}catch{return [];} }
async function safeAll(db,sql,bindings=[]){ try{return rows(await db.prepare(sql).bind(...bindings).all());}catch{return [];} }
async function safeFirst(db,sql,bindings=[],fallback={}){ try{return (await db.prepare(sql).bind(...bindings).first())||fallback;}catch{return fallback;} }
function payload(extra={}){ return {ok:true,build:BUILD,contract:CONTRACT_ID,owner:OWNER,mode:'read-only-platform-db-sanity',authority_tables:Object.freeze(Object.keys(EXPECTED_TABLES)),request_time_schema_mutation:false,...extra}; }

export async function readPlatformDbSanity(db){
  if(!db) throw new TypeError('A D1 database binding is required.');
  const existing=new Set(await getTableNames(db)); const missingTables=[]; const staleTables=[]; const okTables=[];
  for(const [tableName,requiredColumns] of Object.entries(EXPECTED_TABLES)){
    if(!existing.has(tableName)){ missingTables.push({table_name:tableName,missing_columns:requiredColumns}); continue; }
    const cols=await getTableColumnSet(db,tableName); const missingColumns=requiredColumns.filter((name)=>!cols.has(name));
    if(missingColumns.length) staleTables.push({table_name:tableName,missing_columns:missingColumns,column_count:cols.size}); else okTables.push({table_name:tableName,column_count:cols.size});
  }
  const unexpectedTables=[...existing].filter((name)=>!Object.prototype.hasOwnProperty.call(EXPECTED_TABLES,name));
  const indexChecks=[]; for(const tableName of ['catalog_items','site_item_inventory','product_resource_links','accounting_journal_entries','schema_migration_ledger','membership_tier_policies']) if(existing.has(tableName)) indexChecks.push({table_name:tableName,indexes:await getIndexNames(db,tableName)});
  const catalog_counts=existing.has('catalog_items')?await safeAll(db,`SELECT item_kind,COUNT(*) AS total,SUM(CASE WHEN COALESCE(amazon_url,'')<>'' THEN 1 ELSE 0 END) AS with_amazon_url FROM catalog_items WHERE item_kind IN ('tool','supply','creation') GROUP BY item_kind ORDER BY item_kind ASC`):[];
  const inventory_counts=existing.has('site_item_inventory')?await safeAll(db,`SELECT source_type,COUNT(*) AS total,SUM(CASE WHEN COALESCE(amazon_url,'')<>'' THEN 1 ELSE 0 END) AS with_amazon_url,SUM(CASE WHEN COALESCE(unit_cost_cents,0)>0 THEN 1 ELSE 0 END) AS with_unit_cost,SUM(CASE WHEN COALESCE(on_hand_quantity,0)>=1 THEN 1 ELSE 0 END) AS in_stock_rows,SUM(CASE WHEN COALESCE(usage_units_per_stock_unit,1)>1 THEN 1 ELSE 0 END) AS package_sized_rows FROM site_item_inventory WHERE source_type IN ('tool','supply') GROUP BY source_type ORDER BY source_type ASC`):[];
  const journal_balance=existing.has('accounting_journal_entries')?await safeFirst(db,`SELECT COUNT(*) AS unbalanced_entry_count,COALESCE(SUM(ABS(imbalance_cents)),0) AS total_imbalance_cents FROM accounting_journal_entries WHERE COALESCE(imbalance_cents,0)!=0`,[],{unbalanced_entry_count:0,total_imbalance_cents:0}):{unbalanced_entry_count:0,total_imbalance_cents:0};
  const migration_ledger_summary=existing.has('schema_migration_ledger')?await safeFirst(db,`SELECT COUNT(*) AS total,SUM(CASE WHEN status='applied' THEN 1 ELSE 0 END) AS applied_count,SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed_count,SUM(CASE WHEN status='pending_review' THEN 1 ELSE 0 END) AS pending_review_count FROM schema_migration_ledger`,[],{total:0,applied_count:0,failed_count:0,pending_review_count:0}):{total:0,applied_count:0,failed_count:0,pending_review_count:0};
  const criticalChecks=[]; const catByKind=Object.fromEntries(catalog_counts.map((row)=>[row.item_kind,row])); const invByType=Object.fromEntries(inventory_counts.map((row)=>[row.source_type,row]));
  const toolMismatch=Number(catByKind.tool?.total||0)!==Number(invByType.tool?.total||0); const supplyMismatch=Number(catByKind.supply?.total||0)!==Number(invByType.supply?.total||0);
  if(toolMismatch||supplyMismatch) criticalChecks.push({check:'catalog_inventory_sync',status:'attention_required',detail:`Catalog/inventory count mismatch. Tools ${Number(invByType.tool?.total||0)}/${Number(catByKind.tool?.total||0)}, Supplies ${Number(invByType.supply?.total||0)}/${Number(catByKind.supply?.total||0)}.`,action:'Open /admin/catalog/ and run Sync all tools + supplies.'});
  if(Number(journal_balance.unbalanced_entry_count||0)>0) criticalChecks.push({check:'journal_balance',status:'attention_required',detail:`${Number(journal_balance.unbalanced_entry_count||0)} unbalanced journal entry/entries.`,action:'Regenerate or correct journal lines before locking a month.'});
  if(Number(migration_ledger_summary.failed_count||0)>0) criticalChecks.push({check:'migration_ledger',status:'attention_required',detail:`${Number(migration_ledger_summary.failed_count||0)} migration ledger row(s) are failed.`,action:'Open Operations > D1 Migration Ledger and resolve failed rows.'});
  const missingColumns=staleTables.flatMap((row)=>row.missing_columns.map((column)=>`${row.table_name}.${column}`)); const schemaReady=missingTables.length===0&&staleTables.length===0;
  return payload({schema_ready:schemaReady,missing_tables:missingTables,missing_table_names:missingTables.map((row)=>row.table_name),missing_columns:missingColumns,stale_tables:staleTables,ok_tables:okTables,unexpected_tables:unexpectedTables,index_checks:indexChecks,critical_checks:criticalChecks,catalog_counts,inventory_counts,journal_balance,migration_ledger_summary,summary:{expected_table_count:Object.keys(EXPECTED_TABLES).length,existing_table_count:existing.size,ok_table_count:okTables.length,missing_table_count:missingTables.length,stale_table_count:staleTables.length,unexpected_table_count:unexpectedTables.length,critical_check_count:criticalChecks.length,status:missingTables.length||staleTables.length||criticalChecks.length?'attention_required':'ok'}});
}
