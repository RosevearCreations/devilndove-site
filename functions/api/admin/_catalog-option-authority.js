// File: /functions/api/admin/_catalog-option-authority.js
// Release 467 Build 68: cached Product catalog option + tax authority.
import { loadCatalogOptionSets } from './_catalog-options.js';
import { normalizeTaxRateFraction, taxRatePercent } from './_tax-rate.js';

export const CATALOG_AUTHORITY_VERSION = 'R467B68_V1';
export const CATALOG_AUTHORITY_TTL_MS = 5 * 60 * 1000;
export const CATALOG_AUTHORITY_STALE_TTL_MS = 60 * 60 * 1000;

const authorityCache = new Map();

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function cacheKey(includeInactiveTaxClasses) {
  return includeInactiveTaxClasses ? 'all-tax-classes' : 'active-tax-classes';
}

function responseFromCache(entry, state) {
  return {
    ...entry.value,
    cache: {
      state,
      fresh_until: new Date(entry.freshUntil).toISOString(),
      stale_until: new Date(entry.staleUntil).toISOString(),
    },
  };
}

async function loadTaxClasses(db, includeInactiveTaxClasses = false) {
  const where = includeInactiveTaxClasses ? '' : 'WHERE COALESCE(is_active,1)=1';
  const result = await db.prepare(`
    SELECT tax_class_id, code, name, description, tax_rate, is_active, created_at
    FROM tax_classes
    ${where}
    ORDER BY CASE WHEN COALESCE(is_active,1)=1 THEN 0 ELSE 1 END, LOWER(name) ASC, tax_class_id ASC
  `).all().catch(() => ({ results: [] }));

  return normalizeResults(result).map((row) => {
    const taxRate = normalizeTaxRateFraction(row.tax_rate, null);
    return {
      tax_class_id: Number(row.tax_class_id || 0),
      code: row.code || '',
      name: row.name || '',
      description: row.description || '',
      tax_rate: taxRate,
      rate_percent: taxRatePercent(taxRate),
      is_active: Number(row.is_active ?? 1) === 0 ? 0 : 1,
      created_at: row.created_at || null,
    };
  });
}

export function invalidateCatalogOptionAuthority() {
  authorityCache.clear();
}

export function catalogOptionAuthorityCacheSnapshot() {
  const now = Date.now();
  return Array.from(authorityCache.entries()).map(([key, entry]) => ({
    key,
    fresh: entry.freshUntil > now,
    stale_available: entry.staleUntil > now,
    generated_at: entry.value?.generated_at || null,
  }));
}

export async function loadCatalogOptionAuthority(
  db,
  { includeInactiveTaxClasses = false, forceFresh = false, allowStale = true } = {},
) {
  const key = cacheKey(includeInactiveTaxClasses);
  const now = Date.now();
  const cached = authorityCache.get(key);

  if (!forceFresh && cached?.freshUntil > now) {
    return responseFromCache(cached, 'fresh-hit');
  }

  try {
    const [optionSets, taxClasses] = await Promise.all([
      loadCatalogOptionSets(db),
      loadTaxClasses(db, includeInactiveTaxClasses),
    ]);
    const generatedAt = new Date().toISOString();
    const value = {
      authority_version: CATALOG_AUTHORITY_VERSION,
      generated_at: generatedAt,
      source: 'catalog-option-authority',
      option_sets: optionSets,
      tax_classes: taxClasses,
      d1_read_contract: {
        catalog_setting_queries: 1,
        tax_class_queries: 1,
        product_table_queries: 0,
        pragma_queries: 0,
      },
    };
    const entry = {
      value,
      freshUntil: now + CATALOG_AUTHORITY_TTL_MS,
      staleUntil: now + CATALOG_AUTHORITY_STALE_TTL_MS,
    };
    authorityCache.set(key, entry);
    return responseFromCache(entry, 'miss-refreshed');
  } catch (error) {
    if (allowStale && cached?.staleUntil > now) {
      return {
        ...responseFromCache(cached, 'stale-fallback'),
        warning: error?.message || 'Catalog option authority refresh failed; serving stale cached authority.',
      };
    }
    throw error;
  }
}
