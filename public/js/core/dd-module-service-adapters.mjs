// Devil n Dove Build 312 browser adapters for implemented read contracts.
// Registration is passive: no request occurs until a consumer explicitly calls list().

const ROUTES = Object.freeze({
  'catalog-read': '/api/admin/contracts/catalog-read',
  'inventory-read': '/api/admin/contracts/inventory-read',
  'inventory-cost': '/api/admin/contracts/inventory-cost',
  'accounting-read': '/api/admin/contracts/accounting-read',
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
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || `Contract request failed: ${route}`);
  }
  return data;
}

function service(id, owner, list) {
  return Object.freeze({ id, owner, mode: 'read-only-http', list });
}

export function createDefaultModuleServices() {
  return Object.freeze({
    'catalog-read': service('catalog-read', 'catalog', async (options = {}) => {
      const data = await fetchContract(ROUTES['catalog-read'], {
        q: text(options.q),
        limit: boundedInt(options.limit, 250, 1, 500),
      });
      return Object.freeze({ rows: Object.freeze(data.products || []), count: Number(data.count || 0), contract: data.contract });
    }),
    'inventory-read': service('inventory-read', 'inventory', async (options = {}) => {
      const data = await fetchContract(ROUTES['inventory-read'], {
        q: text(options.q),
        limit: boundedInt(options.limit, 500, 1, 1000),
        include_tools: options.includeTools ? 1 : 0,
      });
      return Object.freeze({ rows: Object.freeze(data.items || []), count: Number(data.count || 0), contract: data.contract });
    }),
    'inventory-cost': service('inventory-cost', 'inventory', async (options = {}) => {
      const data = await fetchContract(ROUTES['inventory-cost'], {
        inventory_id: Number(options.inventoryId || 0) || '',
        q: text(options.q),
        limit: boundedInt(options.limit, 250, 1, 1000),
        include_history: options.includeHistory ? 1 : 0,
      });
      return Object.freeze({
        rows: Object.freeze(data.items || []),
        count: Number(data.count || 0),
        history: Object.freeze(data.history || []),
        historyCount: Number(data.history_count || 0),
        historyAvailable: Boolean(data.history_available),
        authorityField: data.authority_field || null,
        contract: data.contract,
        build: Number(data.build || 0),
      });
    }),
    'accounting-read': service('accounting-read', 'accounting', async (options = {}) => {
      const data = await fetchContract(ROUTES['accounting-read'], {
        status: text(options.status),
        limit: boundedInt(options.limit, 25, 1, 100),
      });
      return Object.freeze({
        rows: Object.freeze(data.records || []),
        count: Number(data.count || 0),
        summary: Object.freeze(data.summary || {}),
        schemaReady: Boolean(data.schema_ready),
        missingTables: Object.freeze(data.missing_tables || []),
        missingColumns: Object.freeze(data.missing_columns || []),
        authorityTable: data.authority_table || null,
        requestTimeSchemaMutation: data.request_time_schema_mutation === true,
        contract: data.contract,
        build: Number(data.build || 0),
      });
    }),
    'content-media': service('content-media', 'content', async (options = {}) => {
      const data = await fetchContract(ROUTES['content-media'], {
        q: text(options.q),
        media_type: text(options.mediaType || 'artwork'),
        limit: boundedInt(options.limit, 48, 1, 72),
      });
      return Object.freeze({ rows: Object.freeze(data.media || []), count: Number(data.count || 0), contract: data.contract });
    }),
  });
}

export function registerDefaultModuleServices(registry) {
  if (!registry || typeof registry.registerService !== 'function' || typeof registry.service !== 'function') {
    throw new TypeError('A Devil n Dove module registry is required.');
  }

  const defaults = createDefaultModuleServices();
  const registered = [];
  for (const [id, value] of Object.entries(defaults)) {
    if (!registry.service(id)) {
      registry.registerService(id, value, value.owner);
      registered.push(id);
    }
  }

  const missing = Object.keys(defaults).filter((id) => !registry.service(id));
  return Object.freeze({
    ok: missing.length === 0,
    registered: Object.freeze(registered),
    available: Object.freeze(Object.keys(defaults).filter((id) => Boolean(registry.service(id)))),
    missing: Object.freeze(missing),
  });
}

export const DD_IMPLEMENTED_READ_CONTRACT_ROUTES = ROUTES;
