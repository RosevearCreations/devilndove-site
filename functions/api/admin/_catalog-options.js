// File: /functions/api/admin/_catalog-options.js
// Release 467 Build 68: one validated source for Product catalog option sets.
import { normalizeText } from "../_lib/adminAudit.js";

export const CATALOG_OPTION_SETTING_KEYS = Object.freeze({
  categories: 'site.catalog.product_category_options',
  colors: 'site.catalog.color_options',
  shipping_codes: 'site.catalog.shipping_code_options',
});

export const DEFAULT_CATEGORY_OPTIONS = Object.freeze([
  'rings',
  'necklaces',
  'bracelets',
  'earrings',
  'pendants',
  'cnc components',
  '3d printed items',
  'laser engraved items',
  'polymer clay items',
  'home decor',
  'soap',
  'candles',
  'accessories',
  'other'
]);

export const DEFAULT_COLOR_OPTIONS = Object.freeze([
  'silver',
  'gold',
  'black',
  'white',
  'red',
  'blue',
  'green',
  'purple',
  'pink',
  'orange',
  'yellow',
  'brown',
  'clear',
  'multicolor'
]);

export const DEFAULT_SHIPPING_CODE_OPTIONS = Object.freeze([
  'standard-jewelry',
  'small-parcel',
  'oversize',
  'pickup-only',
  'digital'
]);

// Product type and workflow-state values have application semantics, so they are
// governed here rather than being free-form app settings.
export const DEFAULT_PRODUCT_TYPE_OPTIONS = Object.freeze(['physical', 'digital']);
export const PRODUCT_STATUS_OPTIONS = Object.freeze(['draft', 'active', 'archived']);
export const PRODUCT_REVIEW_STATUS_OPTIONS = Object.freeze(['pending_review', 'approved', 'needs_changes', 'published']);
export const MERCHANDISE_ORIGIN_OPTIONS = Object.freeze(['handmade', 'vintage', 'collectible', 'antique', 'oddity', 'prebuilt']);
export const SALE_CHANNEL_OPTIONS = Object.freeze(['onsite', 'hybrid', 'external_only']);

export const CATALOG_OPTION_MAX_VALUES = 120;
export const CATALOG_OPTION_MAX_LENGTH = 80;

function normalizeArrayValue(value) {
  return normalizeText(value)
    .replace(/\s+/g, ' ')
    .slice(0, CATALOG_OPTION_MAX_LENGTH)
    .toLowerCase();
}

export function uniqueSortedOptions(values = [], { maxValues = CATALOG_OPTION_MAX_VALUES } = {}) {
  return Array.from(
    new Set((Array.isArray(values) ? values : []).map(normalizeArrayValue).filter(Boolean))
  )
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .slice(0, Math.max(1, Number(maxValues) || CATALOG_OPTION_MAX_VALUES));
}

export function isManagedCatalogOptionSettingKey(key) {
  return Object.values(CATALOG_OPTION_SETTING_KEYS).includes(String(key || ''));
}

function parseSettingArray(rawValue) {
  const raw = normalizeText(rawValue);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return uniqueSortedOptions(Array.isArray(parsed) ? parsed : []);
  } catch {
    return uniqueSortedOptions(raw.split(/[\r\n,]+/g));
  }
}

async function loadManagedSettingRows(db) {
  const keys = Object.values(CATALOG_OPTION_SETTING_KEYS);
  try {
    const result = await db
      .prepare(`
        SELECT setting_key, setting_value
        FROM app_settings
        WHERE setting_key IN (?, ?, ?)
      `)
      .bind(...keys)
      .all();
    return Array.isArray(result?.results) ? result.results : [];
  } catch {
    return [];
  }
}

function resolvedEditableOptions(savedRows, key, defaults) {
  const row = savedRows.find((item) => String(item?.setting_key || '') === key);
  const saved = parseSettingArray(row?.setting_value || '');
  return saved.length ? saved : [...defaults];
}

export async function loadCatalogOptionSets(db) {
  const rows = await loadManagedSettingRows(db);
  return {
    category_options: resolvedEditableOptions(rows, CATALOG_OPTION_SETTING_KEYS.categories, DEFAULT_CATEGORY_OPTIONS),
    color_options: resolvedEditableOptions(rows, CATALOG_OPTION_SETTING_KEYS.colors, DEFAULT_COLOR_OPTIONS),
    shipping_code_options: resolvedEditableOptions(rows, CATALOG_OPTION_SETTING_KEYS.shipping_codes, DEFAULT_SHIPPING_CODE_OPTIONS),
    product_type_options: [...DEFAULT_PRODUCT_TYPE_OPTIONS],
    product_status_options: [...PRODUCT_STATUS_OPTIONS],
    product_review_status_options: [...PRODUCT_REVIEW_STATUS_OPTIONS],
    merchandise_origin_options: [...MERCHANDISE_ORIGIN_OPTIONS],
    sale_channel_options: [...SALE_CHANNEL_OPTIONS],
  };
}

export async function saveCatalogOptionSet(db, key, values, updatedByUserId = null) {
  if (!isManagedCatalogOptionSettingKey(key)) {
    throw new Error('Unknown or non-editable catalog option authority key.');
  }
  const normalized = uniqueSortedOptions(values);
  if (!normalized.length) {
    throw new Error('At least one catalog option value is required.');
  }

  await db
    .prepare(`
      INSERT INTO app_settings (
        setting_key,
        setting_value,
        is_public,
        updated_by_user_id,
        updated_at
      )
      VALUES (?, ?, 0, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(setting_key) DO UPDATE SET
        setting_value = excluded.setting_value,
        updated_by_user_id = excluded.updated_by_user_id,
        updated_at = CURRENT_TIMESTAMP
    `)
    .bind(key, JSON.stringify(normalized), updatedByUserId || null)
    .run();

  return normalized;
}
