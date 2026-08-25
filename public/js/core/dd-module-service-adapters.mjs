// Devil n Dove Build 324 browser adapters for implemented read contracts.
// Registration is passive: no request occurs until a consumer explicitly calls list().

export const BUILD = 324;

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
  'content-media': '/api/admin/contracts/content-media',
});

function boundedInt(value, fallback, min, max) {
  const parsed = Number(value);
  return Math.max(min, Math.min(max, Number.isFinite(parsed) ? Math.trunc(parsed) : fallback));
}

function text(value) {
  return String(value ?? '').trim();
}

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

function service(id, owner, list) {
  return Object.freeze({ id, owner, mode: 'read-only-http', list });
}

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
      return Object.freeze({
        period: data.period || null,
        summary: Object.freeze(data.summary || {}),
        expenseGroups: Object.freeze(data.expense_groups || []),
        overheadGroups: Object.freeze(data.overhead_groups || []),
        generalLedgerAccounts: Object.freeze(data.general_ledger_accounts || []),
        schemaReady: Boolean(data.schema_ready),
        missingTables: Object.freeze(data.missing_tables || []),
        missingColumns: Object.freeze(data.missing_columns || []),
        authorityTables: Object.freeze(data.authority_tables || []),
        requestTimeSchemaMutation: data.request_time_schema_mutation === true,
        contract: data.contract,
        build: Number(data.build || 0),
      });
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
    if (!registry.service(id)) {
      registry.registerService(id, value, value.owner);
      registered.push(id);
    }
  }
  const missing = Object.keys(defaults).filter((id) => !registry.service(id));
  return Object.freeze({ ok: missing.length === 0, registered: Object.freeze(registered), available: Object.freeze(Object.keys(defaults).filter((id) => Boolean(registry.service(id)))), missing: Object.freeze(missing) });
}

export const DD_IMPLEMENTED_READ_CONTRACT_ROUTES = ROUTES;
