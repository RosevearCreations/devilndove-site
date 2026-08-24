// Devil n Dove Build 289 Packaging write-response boundary helpers.
// These helpers suppress only the old broad Catalog/Inventory response enumerations
// performed after a successful legacy Packaging write. All write SQL and Packaging-
// owned refresh queries continue through to the real D1 binding.

const BUILD = 289;

function normalizedSql(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function classifyPackagingResponseEnumeration(sql) {
  const value = normalizedSql(sql);
  if (!value.startsWith('select ')) return '';

  if (
    value.includes('from products where coalesce(status,\'draft\')<>\'archived\'') &&
    value.includes('order by lower(name),product_id desc limit 500')
  ) return 'catalog';

  if (
    value.includes('from site_item_inventory sii ') &&
    value.includes('order by lower(sii.item_name) limit 1000')
  ) return 'inventory';

  if (
    value.includes('from site_item_inventory where coalesce(is_active,1)=1') &&
    value.includes('order by lower(item_name) limit 1000')
  ) return 'inventory';

  return '';
}

function emptyAllResult() {
  return {
    success: true,
    results: [],
    meta: {
      duration: 0,
      rows_read: 0,
      rows_written: 0,
    },
  };
}

function emptyStatement() {
  const statement = {
    bind() { return statement; },
    async all() { return emptyAllResult(); },
    async first() { return null; },
    async raw() { return []; },
    async run() { return { success: true, meta: { duration: 0, rows_read: 0, rows_written: 0 } }; },
  };
  return statement;
}

export function createPackagingResponseFilteredDb(db, counters = {}) {
  if (!db || typeof db.prepare !== 'function') return db;
  counters.catalog = Number(counters.catalog || 0);
  counters.inventory = Number(counters.inventory || 0);

  return new Proxy(db, {
    get(target, property, receiver) {
      if (property === 'prepare') {
        return function packagingWriteBoundaryPrepare(sql) {
          const classification = classifyPackagingResponseEnumeration(sql);
          if (classification === 'catalog') {
            counters.catalog += 1;
            return emptyStatement();
          }
          if (classification === 'inventory') {
            counters.inventory += 1;
            return emptyStatement();
          }
          return target.prepare(sql);
        };
      }

      const value = Reflect.get(target, property, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

export function decouplePackagingWritePayload(payload, counters = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
  const next = { ...payload };
  delete next.products;
  delete next.inventory;

  next.write_boundary = {
    build: BUILD,
    delegated_legacy_write: true,
    packaging_owned_response: true,
    catalog_collection: 'omitted-owner-contract',
    inventory_collection: 'omitted-owner-contract',
    broad_catalog_queries_skipped: Number(counters.catalog || 0),
    broad_inventory_queries_skipped: Number(counters.inventory || 0),
    legacy_post_business_logic_preserved: true,
  };
  return next;
}

export const metadata = Object.freeze({
  build: BUILD,
  behaviorMode: 'packaging-write-response-decoupling',
});
