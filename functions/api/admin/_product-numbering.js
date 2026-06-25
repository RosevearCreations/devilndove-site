// File: /functions/api/admin/_product-numbering.js
// Product numbers are an internal, never-reused sequence. SKU values are separately unique
// and may be custom; when blank, creation routes assign a readable DND-xxxxx SKU.

export const DEFAULT_PRODUCT_NUMBER_START = 1000;
const PRODUCT_SEQUENCE_KEY = 'products';

function parsePositiveInt(value, fallback = DEFAULT_PRODUCT_NUMBER_START) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function formatDefaultSku(productNumber) {
  const number = parsePositiveInt(productNumber, DEFAULT_PRODUCT_NUMBER_START);
  return `DND-${String(number).padStart(5, '0')}`;
}

export async function getProductNumberStart(db) {
  if (!db || typeof db.prepare !== 'function') return DEFAULT_PRODUCT_NUMBER_START;
  try {
    const row = await db.prepare(`
      SELECT setting_value
      FROM app_settings
      WHERE setting_key = 'site.catalog.product_number_start'
      LIMIT 1
    `).first();
    return parsePositiveInt(row?.setting_value, DEFAULT_PRODUCT_NUMBER_START);
  } catch {
    return DEFAULT_PRODUCT_NUMBER_START;
  }
}

async function getMinimumNextNumber(db) {
  const start = await getProductNumberStart(db);
  if (!db || typeof db.prepare !== 'function') return start;
  try {
    const row = await db.prepare(`
      SELECT COALESCE(MAX(product_number), 0) + 1 AS next_product_number
      FROM products
    `).first();
    return Math.max(start, parsePositiveInt(row?.next_product_number, start));
  } catch {
    return start;
  }
}

async function ensureSequenceTable(db) {
  if (!db || typeof db.prepare !== 'function') return false;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS catalog_product_number_sequence (
        sequence_key TEXT PRIMARY KEY,
        next_product_number INTEGER NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    return true;
  } catch {
    return false;
  }
}

export async function ensureProductNumberSequenceAtLeast(db, requestedNextNumber) {
  const fallback = await getMinimumNextNumber(db);
  const minimum = Math.max(fallback, parsePositiveInt(requestedNextNumber, fallback));
  const tableReady = await ensureSequenceTable(db);
  if (!tableReady) return minimum;

  try {
    await db.prepare(`
      INSERT INTO catalog_product_number_sequence (
        sequence_key, next_product_number, updated_at
      ) VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(sequence_key) DO UPDATE SET
        next_product_number = CASE
          WHEN catalog_product_number_sequence.next_product_number < excluded.next_product_number
            THEN excluded.next_product_number
          ELSE catalog_product_number_sequence.next_product_number
        END,
        updated_at = CURRENT_TIMESTAMP
    `).bind(PRODUCT_SEQUENCE_KEY, minimum).run();

    const row = await db.prepare(`
      SELECT next_product_number
      FROM catalog_product_number_sequence
      WHERE sequence_key = ?
      LIMIT 1
    `).bind(PRODUCT_SEQUENCE_KEY).first();
    return Math.max(minimum, parsePositiveInt(row?.next_product_number, minimum));
  } catch {
    return minimum;
  }
}

// Read-only preview for page displays. It never consumes a number.
export async function getNextProductNumber(db) {
  const minimum = await getMinimumNextNumber(db);
  const tableReady = await ensureSequenceTable(db);
  if (!tableReady) return minimum;

  try {
    const row = await db.prepare(`
      SELECT next_product_number
      FROM catalog_product_number_sequence
      WHERE sequence_key = ?
      LIMIT 1
    `).bind(PRODUCT_SEQUENCE_KEY).first();
    const stored = parsePositiveInt(row?.next_product_number, minimum);
    return Math.max(minimum, stored);
  } catch {
    return minimum;
  }
}

// Allocates a product number only when a new product row is being created.
// Deleting a product never lowers this sequence, so an old product number is not reused.
export async function allocateNextProductNumber(db) {
  const next = await getNextProductNumber(db);
  const tableReady = await ensureSequenceTable(db);
  if (!tableReady) return next;

  try {
    await ensureProductNumberSequenceAtLeast(db, next);
    const allocated = await db.prepare(`
      UPDATE catalog_product_number_sequence
      SET next_product_number = next_product_number + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE sequence_key = ?
      RETURNING next_product_number - 1 AS product_number
    `).bind(PRODUCT_SEQUENCE_KEY).first();

    return parsePositiveInt(allocated?.product_number, next);
  } catch {
    return next;
  }
}
