// File: /functions/api/admin/_product-numbering.js
// Product numbers are an internal, never-reused sequence. SKU values are separately unique
// and may be custom; when blank, creation routes assign a readable DND-xxxxx SKU.
//
// Release 467 Build 39: this helper is schema-read-only. The sequence table is a proven
// historical baseline and must already exist; request-time product flows never repair schema.

export const DEFAULT_PRODUCT_NUMBER_START = 1000;
const PRODUCT_SEQUENCE_KEY = 'products';
const PRODUCT_SEQUENCE_TABLE = 'catalog_product_number_sequence';
const REQUIRED_SEQUENCE_COLUMNS = ['sequence_key', 'next_product_number', 'updated_at'];

function parsePositiveInt(value, fallback = DEFAULT_PRODUCT_NUMBER_START) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function sequenceSchemaError(detail = '') {
  const error = new Error(`Product-number sequence schema is not ready${detail ? `: ${detail}` : '.'}`);
  error.code = 'product_number_sequence_schema_not_ready';
  return error;
}

async function requireProductNumberSequenceSchema(db) {
  if (!db || typeof db.prepare !== 'function') {
    throw sequenceSchemaError('database binding is unavailable');
  }

  let result;
  try {
    result = await db.prepare(`PRAGMA table_info(${PRODUCT_SEQUENCE_TABLE})`).all();
  } catch {
    throw sequenceSchemaError('sequence table could not be inspected');
  }

  const rows = Array.isArray(result?.results) ? result.results : [];
  const columns = new Set(rows.map((row) => String(row?.name || '').trim()).filter(Boolean));
  const missing = REQUIRED_SEQUENCE_COLUMNS.filter((column) => !columns.has(column));
  if (missing.length) {
    throw sequenceSchemaError(`missing required columns: ${missing.join(', ')}`);
  }
  return true;
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

export async function ensureProductNumberSequenceAtLeast(db, requestedNextNumber) {
  const fallback = await getMinimumNextNumber(db);
  const minimum = Math.max(fallback, parsePositiveInt(requestedNextNumber, fallback));
  await requireProductNumberSequenceSchema(db);

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
}

// Read-only preview for page displays. It never consumes a number.
export async function getNextProductNumber(db) {
  const minimum = await getMinimumNextNumber(db);
  await requireProductNumberSequenceSchema(db);

  const row = await db.prepare(`
    SELECT next_product_number
    FROM catalog_product_number_sequence
    WHERE sequence_key = ?
    LIMIT 1
  `).bind(PRODUCT_SEQUENCE_KEY).first();
  const stored = parsePositiveInt(row?.next_product_number, minimum);
  return Math.max(minimum, stored);
}

// Allocates a product number only when a new product row is being created.
// Deleting a product never lowers this sequence, so an old product number is not reused.
export async function allocateNextProductNumber(db) {
  const next = await getNextProductNumber(db);
  await requireProductNumberSequenceSchema(db);
  await ensureProductNumberSequenceAtLeast(db, next);

  const allocated = await db.prepare(`
    UPDATE catalog_product_number_sequence
    SET next_product_number = next_product_number + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE sequence_key = ?
    RETURNING next_product_number - 1 AS product_number
  `).bind(PRODUCT_SEQUENCE_KEY).first();

  const productNumber = parsePositiveInt(allocated?.product_number, 0);
  if (!productNumber) {
    const error = new Error('Product-number sequence allocation did not return a valid number.');
    error.code = 'product_number_sequence_allocation_failed';
    throw error;
  }
  return productNumber;
}
