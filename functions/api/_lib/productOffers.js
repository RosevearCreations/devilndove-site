// Release 461 — shared quantity-pricing and reserved product-set helpers.
// Schema ownership is migration-only. Runtime callers may verify schema, but must never create/alter it.

export function normalizeRows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

const OFFER_TABLES = {
  product_quantity_price_tiers: [
    'product_quantity_price_tier_id','product_id','min_quantity','unit_price_cents','label','is_active',
    'sort_order','created_by_user_id','created_at','updated_at'
  ],
  product_bundle_settings: [
    'bundle_product_id','requested_bundle_quantity','reserved_bundle_quantity','reservation_status',
    'shortage_notes','updated_by_user_id','created_at','updated_at'
  ],
  product_bundle_components: [
    'product_bundle_component_id','bundle_product_id','component_product_id','quantity_per_bundle',
    'reserved_component_quantity','sort_order','notes','created_at','updated_at'
  ]
};

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableHasColumns(db, tableName, requiredColumns) {
  if (!db) return false;
  const result = await db.prepare(`PRAGMA table_info(${tableName})`).all().catch(() => ({ results: [] }));
  const columns = new Set(rows(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  return requiredColumns.every((column) => columns.has(column));
}

export async function hasProductOffersSchema(db) {
  for (const [tableName, requiredColumns] of Object.entries(OFFER_TABLES)) {
    if (!(await tableHasColumns(db, tableName, requiredColumns))) return false;
  }
  return true;
}

// Backward-compatible name retained for existing callers. It is intentionally read-only.
export async function ensureProductOffersSchema(db) {
  if (!(await hasProductOffersSchema(db))) {
    throw new Error('product_offer_schema_unavailable');
  }
  return true;
}

export async function getQuantityPriceTiers(db, productId, options = {}) {
  if (options.ensureSchema !== false) await ensureProductOffersSchema(db);
  const result = await db.prepare(`
    SELECT product_quantity_price_tier_id, product_id, min_quantity, unit_price_cents,
           label, is_active, sort_order, created_at, updated_at
    FROM product_quantity_price_tiers
    WHERE product_id = ? AND is_active = 1
    ORDER BY min_quantity ASC, sort_order ASC, product_quantity_price_tier_id ASC
  `).bind(Number(productId || 0)).all();
  return normalizeRows(result).map((row) => ({
    ...row,
    product_quantity_price_tier_id: Number(row.product_quantity_price_tier_id || 0),
    product_id: Number(row.product_id || 0),
    min_quantity: Math.max(1, Number(row.min_quantity || 1)),
    unit_price_cents: Math.max(0, Number(row.unit_price_cents || 0)),
    is_active: Number(row.is_active || 0)
  }));
}

export async function resolveUnitPrice(db, productId, quantity, basePriceCents, options = {}) {
  const qty = Math.max(1, Number(quantity || 1));
  const tiers = await getQuantityPriceTiers(db, productId, options);
  const eligible = tiers.filter((row) => row.min_quantity <= qty && row.unit_price_cents >= 0);
  const applied = eligible.length ? eligible[eligible.length - 1] : null;
  return {
    unit_price_cents: applied ? applied.unit_price_cents : Math.max(0, Number(basePriceCents || 0)),
    applied_tier: applied,
    tiers
  };
}

export async function getBundleDetails(db, bundleProductId, options = {}) {
  if (options.ensureSchema !== false) await ensureProductOffersSchema(db);
  const bundleId = Number(bundleProductId || 0);
  const settings = await db.prepare(`
    SELECT * FROM product_bundle_settings WHERE bundle_product_id = ? LIMIT 1
  `).bind(bundleId).first();
  if (!settings) return { is_bundle: 0, settings: null, components: [], available_quantity: null };
  const result = await db.prepare(`
    SELECT bc.*, p.name AS component_name, p.sku AS component_sku,
           p.status AS component_status, COALESCE(p.inventory_tracking,0) AS inventory_tracking,
           COALESCE(p.inventory_quantity,0) AS inventory_quantity,
           p.featured_image_url AS component_image_url
    FROM product_bundle_components bc
    INNER JOIN products p ON p.product_id = bc.component_product_id
    WHERE bc.bundle_product_id = ?
    ORDER BY bc.sort_order ASC, bc.product_bundle_component_id ASC
  `).bind(bundleId).all();
  const components = normalizeRows(result).map((row) => ({
    ...row,
    product_bundle_component_id: Number(row.product_bundle_component_id || 0),
    bundle_product_id: Number(row.bundle_product_id || 0),
    component_product_id: Number(row.component_product_id || 0),
    quantity_per_bundle: Math.max(1, Number(row.quantity_per_bundle || 1)),
    reserved_component_quantity: Math.max(0, Number(row.reserved_component_quantity || 0)),
    inventory_quantity: Math.max(0, Number(row.inventory_quantity || 0)),
    inventory_tracking: Number(row.inventory_tracking || 0)
  }));
  const reservedBundleQuantity = Math.max(0, Number(settings.reserved_bundle_quantity || 0));
  const supportedByReservations = components.length
    ? components.reduce((min, row) => Math.min(min, Math.floor(row.reserved_component_quantity / row.quantity_per_bundle)), Number.MAX_SAFE_INTEGER)
    : 0;
  const availableQuantity = components.length ? Math.max(0, Math.min(reservedBundleQuantity, supportedByReservations)) : 0;
  return {
    is_bundle: 1,
    settings: {
      ...settings,
      requested_bundle_quantity: Math.max(0, Number(settings.requested_bundle_quantity || 0)),
      reserved_bundle_quantity: reservedBundleQuantity
    },
    components,
    available_quantity: availableQuantity
  };
}

export async function calculateComponentAvailability(db, componentProductId, excludeBundleProductId = 0) {
  await ensureProductOffersSchema(db);
  const componentId = Number(componentProductId || 0);
  const product = await db.prepare(`
    SELECT product_id, name, sku, status, COALESCE(inventory_tracking,0) inventory_tracking,
           COALESCE(inventory_quantity,0) inventory_quantity
    FROM products WHERE product_id = ? LIMIT 1
  `).bind(componentId).first();
  if (!product) return null;
  const reserved = await db.prepare(`
    SELECT COALESCE(SUM(reserved_component_quantity),0) AS reserved_quantity
    FROM product_bundle_components
    WHERE component_product_id = ? AND bundle_product_id <> ?
  `).bind(componentId, Number(excludeBundleProductId || 0)).first();
  const nestedBundle = await db.prepare(`SELECT bundle_product_id FROM product_bundle_settings WHERE bundle_product_id=? LIMIT 1`).bind(componentId).first().catch(()=>null);
  const inventoryQuantity = Math.max(0, Number(product.inventory_quantity || 0));
  const otherReserved = Math.max(0, Number(reserved?.reserved_quantity || 0));
  return {
    ...product,
    product_id: componentId,
    inventory_quantity: inventoryQuantity,
    other_reserved_quantity: otherReserved,
    free_quantity: Math.max(0, inventoryQuantity - otherReserved),
    is_bundle_product: nestedBundle ? 1 : 0
  };
}

export async function reserveBundleComponents(db, { bundleProductId, requestedBundleQuantity, components, actorUserId = null }) {
  await ensureProductOffersSchema(db);
  const bundleId = Number(bundleProductId || 0);
  const requested = Math.max(0, Math.floor(Number(requestedBundleQuantity || 0)));
  const cleanComponents = (Array.isArray(components) ? components : [])
    .map((row, index) => ({
      component_product_id: Number(row?.component_product_id || 0),
      quantity_per_bundle: Math.max(1, Math.floor(Number(row?.quantity_per_bundle || 1))),
      notes: String(row?.notes || '').trim().slice(0, 500) || null,
      sort_order: index
    }))
    .filter((row) => row.component_product_id > 0 && row.component_product_id !== bundleId);
  if (!bundleId) throw new Error('A bundle product is required.');
  if (!cleanComponents.length) throw new Error('Add at least one component product to the set.');
  const uniqueIds = new Set(cleanComponents.map((row) => row.component_product_id));
  if (uniqueIds.size !== cleanComponents.length) throw new Error('Each component product can appear only once in a set.');

  const availability = [];
  for (const component of cleanComponents) {
    const stock = await calculateComponentAvailability(db, component.component_product_id, bundleId);
    if (!stock) throw new Error(`Component product ${component.component_product_id} was not found.`);
    if (Number(stock.is_bundle_product || 0) === 1) throw new Error(`${stock.name || 'A component'} is already a product set. Nested sets are not supported.`);
    if (String(stock.status || '').toLowerCase() === 'archived') throw new Error(`${stock.name || 'A component'} is archived and cannot be reserved.`);
    const possible = Math.floor(stock.free_quantity / component.quantity_per_bundle);
    availability.push({ ...component, stock, possible_bundle_quantity: Math.max(0, possible) });
  }
  const maxReservable = availability.reduce((min, row) => Math.min(min, row.possible_bundle_quantity), Number.MAX_SAFE_INTEGER);
  const reservedBundleQuantity = requested > 0 ? Math.min(requested, Math.max(0, maxReservable)) : 0;
  const shortages = availability.filter((row) => row.possible_bundle_quantity < requested).map((row) =>
    `${row.stock.name || `Product ${row.component_product_id}`}: ${row.stock.free_quantity} free, ${row.quantity_per_bundle} needed per set`
  );
  const status = requested === 0 ? 'released' : reservedBundleQuantity === requested ? 'reserved' : reservedBundleQuantity > 0 ? 'partially_reserved' : 'shortage';
  const shortageNotes = shortages.join('; ').slice(0, 2000) || null;

  const statements = [
    db.prepare(`DELETE FROM product_bundle_components WHERE bundle_product_id = ?`).bind(bundleId),
    db.prepare(`
      INSERT INTO product_bundle_settings (
        bundle_product_id, requested_bundle_quantity, reserved_bundle_quantity,
        reservation_status, shortage_notes, updated_by_user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(bundle_product_id) DO UPDATE SET
        requested_bundle_quantity = excluded.requested_bundle_quantity,
        reserved_bundle_quantity = excluded.reserved_bundle_quantity,
        reservation_status = excluded.reservation_status,
        shortage_notes = excluded.shortage_notes,
        updated_by_user_id = excluded.updated_by_user_id,
        updated_at = CURRENT_TIMESTAMP
    `).bind(bundleId, requested, reservedBundleQuantity, status, shortageNotes, Number(actorUserId || 0) || null),
    db.prepare(`
      UPDATE products SET inventory_tracking = 1, inventory_quantity = ?, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = ?
    `).bind(reservedBundleQuantity, bundleId)
  ];
  availability.forEach((row) => {
    statements.push(db.prepare(`
      INSERT INTO product_bundle_components (
        bundle_product_id, component_product_id, quantity_per_bundle,
        reserved_component_quantity, sort_order, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(bundleId, row.component_product_id, row.quantity_per_bundle, reservedBundleQuantity * row.quantity_per_bundle, row.sort_order, row.notes));
  });
  if (typeof db.batch === 'function') await db.batch(statements);
  else for (const statement of statements) await statement.run();

  return {
    requested_bundle_quantity: requested,
    reserved_bundle_quantity: reservedBundleQuantity,
    reservation_status: status,
    shortage_notes: shortageNotes,
    components: availability.map((row) => ({
      component_product_id: row.component_product_id,
      component_name: row.stock.name || '',
      quantity_per_bundle: row.quantity_per_bundle,
      free_quantity_before_reservation: row.stock.free_quantity,
      reserved_component_quantity: reservedBundleQuantity * row.quantity_per_bundle,
      possible_bundle_quantity: row.possible_bundle_quantity
    }))
  };
}
