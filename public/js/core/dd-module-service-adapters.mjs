// Devil n Dove Build 339 browser adapters for implemented read contracts.
// Registration is passive: no request occurs until a consumer explicitly calls list().

export const BUILD = 339;

const ROUTES = Object.freeze({
  'catalog-read': '/api/admin/contracts/catalog-read',
  'inventory-read': '/api/admin/contracts/inventory-read',
  'inventory-cost': '/api/admin/contracts/inventory-cost',
  'accounting-read': '/api/admin/contracts/accounting-read',
  'accounting-expenses-read': '/api/admin/contracts/accounting-expenses-read',
  'accounting-writeoffs-read': '/api/admin/contracts/accounting-writeoffs-read',
  'accounting-general-ledger-read': '/api/admin/contracts/accounting-general-ledger-read',
  'accounting-summary-read': '/api/admin/contracts/accounting-summary-read',
  'accounting-overhead-allocations-read': '/api/admin/contracts/accounting-overhead-allocations-read',
  'accounting-overhead-product-allocations-read': '/api/admin/contracts/accounting-overhead-product-allocations-read',
  'accounting-product-costs-read': '/api/admin/contracts/accounting-product-costs-read',
  'accounting-profit-loss-read': '/api/admin/contracts/accounting-profit-loss-read',
  'accounting-item-costing-read': '/api/admin/contracts/accounting-item-costing-read',
  'accounting-journal-read': '/api/admin/contracts/accounting-journal-read',
  'accounting-gifi-notes-read': '/api/admin/contracts/accounting-gifi-notes-read',
  'accounting-gifi-summary-read': '/api/admin/contracts/accounting-gifi-summary-read',
  'accounting-period-locks-read': '/api/admin/contracts/accounting-period-locks-read',
  'accounting-attachments-read': '/api/admin/contracts/accounting-attachments-read',
  'accounting-vendors-read': '/api/admin/contracts/accounting-vendors-read',
  'accounting-recurring-expense-rules-read': '/api/admin/contracts/accounting-recurring-expense-rules-read',
  'accounting-statement-provider-profiles-read': '/api/admin/contracts/accounting-statement-provider-profiles-read',
  'accounting-statement-imports-read': '/api/admin/contracts/accounting-statement-imports-read',
  'accounting-reconciliation-exceptions-read': '/api/admin/contracts/accounting-reconciliation-exceptions-read',
  'accounting-vendor-statements-read': '/api/admin/contracts/accounting-vendor-statements-read',
  'accounting-sales-tax-filing-read': '/api/admin/contracts/accounting-sales-tax-filing-read',
  'accounting-fixed-assets-read': '/api/admin/contracts/accounting-fixed-assets-read',
  'accounting-evidence-check-read': '/api/admin/contracts/accounting-evidence-check-read',
  'content-media': '/api/admin/contracts/content-media',
});

function boundedInt(value, fallback, min, max) {
  const parsed = Number(value);
  return Math.max(min, Math.min(max, Number.isFinite(parsed) ? Math.trunc(parsed) : fallback));
}
function text(value) { return String(value ?? '').trim(); }

async function fetchContract(route, params = {}) {
  const apiFetch = globalThis.DDAuth?.apiFetch;
  if (typeof apiFetch !== 'function') throw new Error('Authenticated API client is unavailable.');
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue;
    query.set(key, String(value));
  }
  const url = `${route}${query.size ? `?${query.toString()}` : ''}`;
  const response = await apiFetch(url);
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) throw new Error(data?.error || `Contract request failed: ${route}`);
  return data;
}

function service(id, owner, list) { return Object.freeze({ id, owner, mode: 'read-only-http', list }); }
function accountingReadResult(data, rowsKey) {
  return Object.freeze({
    rows: Object.freeze(data[rowsKey] || []),
    count: Number(data.count || 0),
    summary: Object.freeze(data.summary || {}),
    warnings: Object.freeze(data.warnings || []),
    schemaReady: Boolean(data.schema_ready),
    missingTables: Object.freeze(data.missing_tables || []),
    missingColumns: Object.freeze(data.missing_columns || []),
    authorityTable: data.authority_table || null,
    requestTimeSchemaMutation: data.request_time_schema_mutation === true,
    contract: data.contract,
    build: Number(data.build || 0),
  });
}

export function createDefaultModuleServices() {
  return Object.freeze({
    'catalog-read': service('catalog-read', 'catalog', async (options = {}) => {
      const data = await fetchContract(ROUTES['catalog-read'], { q: text(options.q), limit: boundedInt(options.limit, 250, 1, 500) });
      return Object.freeze({ rows: Object.freeze(data.products || []), count: Number(data.count || 0), contract: data.contract });
    }),
    'inventory-read': service('inventory-read', 'inventory', async (options = {}) => {
      const data = await fetchContract(ROUTES['inventory-read'], { q: text(options.q), limit: boundedInt(options.limit, 500, 1, 1000), include_tools: options.includeTools ? 1 : 0 });
      return Object.freeze({ rows: Object.freeze(data.items || []), count: Number(data.count || 0), contract: data.contract });
    }),
    'inventory-cost': service('inventory-cost', 'inventory', async (options = {}) => {
      const data = await fetchContract(ROUTES['inventory-cost'], { inventory_id: Number(options.inventoryId || 0) || '', q: text(options.q), limit: boundedInt(options.limit, 250, 1, 1000), include_history: options.includeHistory ? 1 : 0 });
      return Object.freeze({ rows: Object.freeze(data.items || []), count: Number(data.count || 0), history: Object.freeze(data.history || []), historyCount: Number(data.history_count || 0), historyAvailable: Boolean(data.history_available), authorityField: data.authority_field || null, contract: data.contract, build: Number(data.build || 0) });
    }),
    'accounting-read': service('accounting-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-read'], { status: text(options.status), limit: boundedInt(options.limit, 25, 1, 100) });
      return accountingReadResult(data, 'records');
    }),
    'accounting-expenses-read': service('accounting-expenses-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-expenses-read'], { limit: boundedInt(options.limit, 100, 1, 500) });
      return Object.freeze({ ...accountingReadResult(data, 'expenses'), attachmentTable: data.attachment_table || null, attachmentTableAvailable: Boolean(data.attachment_table_available), attachmentJoinEnabled: Boolean(data.attachment_join_enabled) });
    }),
    'accounting-writeoffs-read': service('accounting-writeoffs-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-writeoffs-read'], { limit: boundedInt(options.limit, 100, 1, 500) });
      return accountingReadResult(data, 'writeoffs');
    }),
    'accounting-general-ledger-read': service('accounting-general-ledger-read', 'accounting', async () => {
      const data = await fetchContract(ROUTES['accounting-general-ledger-read']);
      return accountingReadResult(data, 'accounts');
    }),
    'accounting-summary-read': service('accounting-summary-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-summary-read'], { limit: boundedInt(options.limit, 25, 1, 100) });
      return accountingReadResult(data, 'records');
    }),
    'accounting-overhead-allocations-read': service('accounting-overhead-allocations-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-overhead-allocations-read'], { month: text(options.month || options.periodMonth) });
      return Object.freeze({ ...accountingReadResult(data, 'allocations'), periodMonth: data.period_month || null });
    }),
    'accounting-overhead-product-allocations-read': service('accounting-overhead-product-allocations-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-overhead-product-allocations-read'], { month: text(options.month || options.periodMonth), limit: boundedInt(options.limit, 150, 1, 500) });
      return Object.freeze({ ...accountingReadResult(data, 'allocations'), productTable: data.product_table || null, productTableAvailable: Boolean(data.product_table_available), productJoinEnabled: Boolean(data.product_join_enabled) });
    }),
    'accounting-product-costs-read': service('accounting-product-costs-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-product-costs-read'], { limit: options.limit == null ? '' : boundedInt(options.limit, 500, 1, 5000) });
      return accountingReadResult(data, 'product_costs');
    }),
    'accounting-profit-loss-read': service('accounting-profit-loss-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-profit-loss-read'], { month: text(options.month || options.periodMonth) });
      return Object.freeze({ period: data.period || null, summary: Object.freeze(data.summary || {}), expenseGroups: Object.freeze(data.expense_groups || []), overheadGroups: Object.freeze(data.overhead_groups || []), generalLedgerAccounts: Object.freeze(data.general_ledger_accounts || []), schemaReady: Boolean(data.schema_ready), missingTables: Object.freeze(data.missing_tables || []), missingColumns: Object.freeze(data.missing_columns || []), authorityTables: Object.freeze(data.authority_tables || []), requestTimeSchemaMutation: data.request_time_schema_mutation === true, contract: data.contract, build: Number(data.build || 0) });
    }),
    'accounting-item-costing-read': service('accounting-item-costing-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-item-costing-read'], { month: text(options.month || options.periodMonth) });
      return Object.freeze({ ...accountingReadResult(data, 'items'), period: data.period || null, optionalTableAvailability: Object.freeze(data.optional_table_availability || {}) });
    }),
    'accounting-journal-read': service('accounting-journal-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-journal-read'], { month: text(options.month || options.periodMonth) });
      return Object.freeze({ ...accountingReadResult(data, 'entries'), period: data.period || null, authorityTables: Object.freeze(data.authority_tables || []) });
    }),
    'accounting-gifi-notes-read': service('accounting-gifi-notes-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-gifi-notes-read'], { year: text(options.year) });
      return Object.freeze({ ...accountingReadResult(data, 'notes'), year: data.year || null });
    }),
    'accounting-gifi-summary-read': service('accounting-gifi-summary-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-gifi-summary-read'], { year: text(options.year) });
      return Object.freeze({ ...accountingReadResult(data, 'gifi_rows'), year: data.year || null, sourceUsed: data.source_used || null, glReviewSummary: Object.freeze(data.gl_review_summary || {}), unmappedAccounts: Object.freeze(data.unmapped_accounts || []) });
    }),
    'accounting-period-locks-read': service('accounting-period-locks-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-period-locks-read'], { period_month: text(options.periodMonth || options.month), limit: boundedInt(options.limit, 18, 1, 60) });
      return Object.freeze({ ...accountingReadResult(data, 'closures'), periodMonth: data.period_month || null, closure: data.closure || null });
    }),
    'accounting-attachments-read': service('accounting-attachments-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-attachments-read'], {
        expense_id: Number(options.expenseId || 0) || '', vendor_id: Number(options.vendorId || 0) || '', reconciliation_type: text(options.reconciliationType),
        period_month: text(options.periodMonth), tax_year: text(options.taxYear), scope_key: text(options.scopeKey), attachment_kind: text(options.attachmentKind),
        attachment_scope: text(options.attachmentScope), provider_scope: text(options.providerScope), limit: boundedInt(options.limit, 50, 1, 500),
      });
      return accountingReadResult(data, 'attachments');
    }),
    'accounting-vendors-read': service('accounting-vendors-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-vendors-read'], { include_inactive: options.includeInactive ? 1 : '' });
      return accountingReadResult(data, 'vendors');
    }),
    'accounting-recurring-expense-rules-read': service('accounting-recurring-expense-rules-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-recurring-expense-rules-read'], { include_inactive: options.includeInactive ? 1 : '' });
      return Object.freeze({ ...accountingReadResult(data, 'rules'), dueRules: Object.freeze(data.due_rules || []) });
    }),
    'accounting-statement-provider-profiles-read': service('accounting-statement-provider-profiles-read', 'accounting', async () => {
      const data = await fetchContract(ROUTES['accounting-statement-provider-profiles-read']);
      return Object.freeze({ ...accountingReadResult(data, 'profiles'), defaultProfileCount: Number(data.default_profile_count || 0), defaultsMaterialized: data.defaults_materialized === true, source: data.source || null });
    }),
    'accounting-statement-imports-read': service('accounting-statement-imports-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-statement-imports-read'], {
        accounting_statement_import_id: Number(options.importId || 0) || '', provider_scope: text(options.providerScope), period_month: text(options.periodMonth),
        status: text(options.status), limit: boundedInt(options.limit, 50, 1, 1000), exception_limit: boundedInt(options.exceptionLimit, 100, 1, 500),
      });
      return Object.freeze({ build: Number(data.build || 0), contract: data.contract, schemaReady: Boolean(data.schema_ready), missingTables: Object.freeze(data.missing_tables || []), missingColumns: Object.freeze(data.missing_columns || []), requestTimeSchemaMutation: data.request_time_schema_mutation === true, rows: Object.freeze(data.rows || []), imports: Object.freeze(data.imports || []), exceptions: Object.freeze(data.exceptions || []), providerProfiles: Object.freeze(data.provider_profiles || []), summary: Object.freeze(data.summary || {}), importId: Number(data.accounting_statement_import_id || 0) || null });
    }),
    'accounting-reconciliation-exceptions-read': service('accounting-reconciliation-exceptions-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-reconciliation-exceptions-read'], { reconciliation_type: text(options.reconciliationType), period_month: text(options.periodMonth), status: text(options.status), limit: boundedInt(options.limit, 200, 1, 500) });
      return accountingReadResult(data, 'exceptions');
    }),
    'accounting-vendor-statements-read': service('accounting-vendor-statements-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-vendor-statements-read'], { period_month: text(options.periodMonth) });
      return accountingReadResult(data, 'rows');
    }),
    'accounting-sales-tax-filing-read': service('accounting-sales-tax-filing-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-sales-tax-filing-read'], { period_month: text(options.periodMonth) });
      return Object.freeze({ worksheet: Object.freeze(data.worksheet || {}), schemaReady: Boolean(data.schema_ready), missingTables: Object.freeze(data.missing_tables || []), missingColumns: Object.freeze(data.missing_columns || []), requestTimeSchemaMutation: data.request_time_schema_mutation === true, contract: data.contract, build: Number(data.build || 0) });
    }),
    'accounting-fixed-assets-read': service('accounting-fixed-assets-read', 'accounting', async () => {
      const data = await fetchContract(ROUTES['accounting-fixed-assets-read']);
      return accountingReadResult(data, 'assets');
    }),
    'accounting-evidence-check-read': service('accounting-evidence-check-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-evidence-check-read'], { period_month: text(options.periodMonth) });
      return Object.freeze({ ...accountingReadResult(data, 'checks'), periodMonth: data.period_month || '', authorityTables: Object.freeze(data.authority_tables || []) });
    }),
    'content-media': service('content-media', 'content', async (options = {}) => {
      const data = await fetchContract(ROUTES['content-media'], { q: text(options.q), media_type: text(options.mediaType || 'artwork'), limit: boundedInt(options.limit, 48, 1, 72) });
      return Object.freeze({ rows: Object.freeze(data.media || []), count: Number(data.count || 0), contract: data.contract });
    }),
  });
}

export function registerDefaultModuleServices(registry) {
  if (!registry || typeof registry.registerService !== 'function' || typeof registry.service !== 'function') throw new TypeError('A Devil n Dove module registry is required.');
  const defaults = createDefaultModuleServices();
  const registered = [];
  for (const [id, value] of Object.entries(defaults)) {
    if (!registry.service(id)) { registry.registerService(id, value, value.owner); registered.push(id); }
  }
  const missing = Object.keys(defaults).filter((id) => !registry.service(id));
  return Object.freeze({ ok: missing.length === 0, registered: Object.freeze(registered), available: Object.freeze(Object.keys(defaults).filter((id) => Boolean(registry.service(id)))), missing: Object.freeze(missing) });
}

export const DD_IMPLEMENTED_READ_CONTRACT_ROUTES = ROUTES;
