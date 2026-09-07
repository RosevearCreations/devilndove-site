// Release 467 Build 70 — shared Inventory package/base-unit conversion authority.
// Pure calculation only: no D1, R2, provider, network, polling or runtime schema work.

export const INVENTORY_QUANTITY_EPSILON = 1e-9;

const TRACKING_MODES = new Set(['exact', 'estimated', 'log_only', 'reusable']);
const UNIT_ALIASES = new Map([
  ['ea', 'each'],
  ['each', 'each'],
  ['pcs', 'piece'],
  ['pc', 'piece'],
  ['pieces', 'piece'],
  ['piece', 'piece'],
  ['g', 'gram'],
  ['grams', 'gram'],
  ['gram', 'gram'],
  ['kg', 'kilogram'],
  ['kilograms', 'kilogram'],
  ['kilogram', 'kilogram'],
  ['mg', 'milligram'],
  ['milligrams', 'milligram'],
  ['milligram', 'milligram'],
  ['ml', 'millilitre'],
  ['milliliters', 'millilitre'],
  ['millilitres', 'millilitre'],
  ['milliliter', 'millilitre'],
  ['millilitre', 'millilitre'],
  ['l', 'litre'],
  ['liters', 'litre'],
  ['litres', 'litre'],
  ['liter', 'litre'],
  ['litre', 'litre'],
  ['oz', 'ounce'],
  ['ounces', 'ounce'],
  ['ounce', 'ounce'],
  ['lb', 'pound'],
  ['lbs', 'pound'],
  ['pounds', 'pound'],
  ['pound', 'pound'],
  ['pkg', 'package'],
  ['packages', 'package'],
  ['package', 'package'],
  ['uses', 'use'],
  ['use', 'use'],
]);

function numeric(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizedText(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export class InventoryUnitError extends Error {
  constructor(message, { status = 400, code = 'inventory_unit_invalid', details = null } = {}) {
    super(message);
    this.name = 'InventoryUnitError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function roundInventoryQuantity(value, digits = 6) {
  const boundedDigits = Math.max(0, Math.min(9, Math.trunc(numeric(digits, 6))));
  return Number(numeric(value, 0).toFixed(boundedDigits));
}

export function normalizeInventoryUnitLabel(value, fallback = 'unit') {
  const raw = normalizedText(value);
  if (!raw) return normalizedText(fallback) || 'unit';
  return UNIT_ALIASES.get(raw) || raw.slice(0, 40);
}

export function normalizeInventoryTrackingMode(value, sourceType = '') {
  const source = normalizedText(sourceType);
  if (source === 'tool') return 'reusable';
  const requested = normalizedText(value);
  return TRACKING_MODES.has(requested) ? requested : 'exact';
}

export function normalizeUsageIncrement(value, fallback = 0.001) {
  const parsed = numeric(value, fallback);
  return parsed > 0 ? parsed : Math.max(INVENTORY_QUANTITY_EPSILON, numeric(fallback, 0.001) || 0.001);
}

export function normalizeUnitsPerPurchase(value, fallback = 1) {
  const parsed = numeric(value, fallback);
  return parsed > 0 ? parsed : Math.max(INVENTORY_QUANTITY_EPSILON, numeric(fallback, 1) || 1);
}

export function purchaseToBase(quantity, unitsPerPurchase) {
  return roundInventoryQuantity(numeric(quantity, 0) * normalizeUnitsPerPurchase(unitsPerPurchase, 1));
}

export function baseToPurchase(quantity, unitsPerPurchase) {
  return roundInventoryQuantity(numeric(quantity, 0) / normalizeUnitsPerPurchase(unitsPerPurchase, 1));
}

export function isUsageIncrementAligned(quantity, increment) {
  const requested = numeric(quantity, 0);
  const step = normalizeUsageIncrement(increment, 0.001);
  if (requested <= 0) return false;
  const quotient = requested / step;
  const tolerance = Math.max(INVENTORY_QUANTITY_EPSILON, Math.abs(quotient) * 1e-9);
  return Math.abs(quotient - Math.round(quotient)) <= tolerance;
}

export function planInventoryUsage(row = {}, requestedUsage = 0, options = {}) {
  const quantity = numeric(requestedUsage, 0);
  if (quantity <= INVENTORY_QUANTITY_EPSILON) {
    throw new InventoryUnitError('Enter a usage quantity greater than zero.', {
      code: 'inventory_usage_quantity_required',
    });
  }

  const sourceType = normalizedText(row.source_type);
  if (options.rejectProduct !== false && sourceType === 'product') {
    throw new InventoryUnitError('Product stock is not owned by the Supply/Tool Inventory usage engine.', {
      status: 409,
      code: 'inventory_usage_wrong_owner',
    });
  }

  const trackingMode = normalizeInventoryTrackingMode(row.usage_tracking_mode, sourceType);
  if (options.rejectDoNotReuse !== false && sourceType === 'tool' && Number(row.do_not_reuse || 0) === 1) {
    throw new InventoryUnitError('This Tool is marked do not reuse. Reactivate it through Tool lifecycle controls before recording another use.', {
      status: 409,
      code: 'inventory_usage_tool_do_not_reuse',
    });
  }

  const minimumUsageIncrement = normalizeUsageIncrement(row.minimum_usage_increment, 0.001);
  if (quantity + INVENTORY_QUANTITY_EPSILON < minimumUsageIncrement) {
    throw new InventoryUnitError(`Usage must be at least ${minimumUsageIncrement} ${normalizeInventoryUnitLabel(row.base_unit_label || row.usage_unit_label, 'unit')}.`, {
      code: 'inventory_usage_below_minimum_increment',
      details: { requested_usage_quantity: quantity, minimum_usage_increment: minimumUsageIncrement },
    });
  }
  if (!isUsageIncrementAligned(quantity, minimumUsageIncrement)) {
    throw new InventoryUnitError(`Usage must be entered in increments of ${minimumUsageIncrement} ${normalizeInventoryUnitLabel(row.base_unit_label || row.usage_unit_label, 'unit')}.`, {
      code: 'inventory_usage_increment_misaligned',
      details: { requested_usage_quantity: quantity, minimum_usage_increment: minimumUsageIncrement },
    });
  }

  const baseUnitLabel = normalizeInventoryUnitLabel(row.base_unit_label || row.usage_unit_label, 'unit');
  const purchaseUnitLabel = normalizeInventoryUnitLabel(row.purchase_unit_label || row.stock_unit_label, 'unit');
  const unitsPerPurchase = normalizeUnitsPerPurchase(row.base_units_per_purchase_unit ?? row.usage_units_per_stock_unit, 1);
  const previousOnHand = Math.max(0, numeric(row.purchase_on_hand_quantity ?? row.on_hand_quantity, 0));
  const reservedQuantity = Math.max(0, numeric(row.purchase_reserved_quantity ?? row.reserved_quantity, 0));
  const availableQuantity = Math.max(0, previousOnHand - reservedQuantity);
  const stockQuantity = ['log_only', 'reusable'].includes(trackingMode)
    ? 0
    : baseToPurchase(quantity, unitsPerPurchase);

  if (stockQuantity > availableQuantity + INVENTORY_QUANTITY_EPSILON) {
    throw new InventoryUnitError(
      `Only ${roundInventoryQuantity(availableQuantity)} ${purchaseUnitLabel} is available after reservations; ${roundInventoryQuantity(stockQuantity)} is required.`,
      {
        status: 409,
        code: 'inventory_usage_insufficient_available',
        details: {
          available_quantity: roundInventoryQuantity(availableQuantity),
          required_stock_quantity: roundInventoryQuantity(stockQuantity),
          requested_usage_quantity: quantity,
          base_unit_label: baseUnitLabel,
          purchase_unit_label: purchaseUnitLabel,
          units_per_purchase_unit: unitsPerPurchase,
        },
      },
    );
  }

  const newOnHand = roundInventoryQuantity(previousOnHand - stockQuantity);
  const purchaseUnitCostCents = Math.max(0, numeric(row.purchase_unit_cost_cents ?? row.unit_cost_cents, 0));
  const allocatedCostCents = Math.max(0, Math.round(purchaseUnitCostCents * stockQuantity));

  return Object.freeze({
    quantity: roundInventoryQuantity(quantity),
    source_type: sourceType,
    tracking_mode: trackingMode,
    is_estimated: trackingMode === 'estimated' ? 1 : 0,
    usage_unit_label: baseUnitLabel,
    base_unit_label: baseUnitLabel,
    stock_unit_label: purchaseUnitLabel,
    purchase_unit_label: purchaseUnitLabel,
    usage_units_per_stock_unit: unitsPerPurchase,
    base_units_per_purchase_unit: unitsPerPurchase,
    minimum_usage_increment: minimumUsageIncrement,
    stock_quantity: stockQuantity,
    purchase_quantity_consumed: stockQuantity,
    previous_on_hand_quantity: roundInventoryQuantity(previousOnHand),
    new_on_hand_quantity: newOnHand,
    reserved_quantity: roundInventoryQuantity(reservedQuantity),
    available_quantity: roundInventoryQuantity(availableQuantity),
    available_base_quantity: purchaseToBase(availableQuantity, unitsPerPurchase),
    purchase_unit_cost_cents: purchaseUnitCostCents,
    base_unit_cost_cents: purchaseUnitCostCents / unitsPerPurchase,
    allocated_cost_cents: allocatedCostCents,
  });
}
