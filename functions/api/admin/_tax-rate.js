// Shared tax-rate normalization for D1 schemas that historically stored either
// fractions (0.13) or whole percentages (13). API responses always expose both.

function asFiniteNumber(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeSingle(value) {
  const numeric = asFiniteNumber(value);
  if (numeric === null || numeric < 0) return null;
  // Older UI releases wrote whole percentages. Newer storage is a fraction.
  return numeric > 1 ? numeric / 100 : numeric;
}

export function normalizeTaxRateFraction(taxRate, ratePercent = null) {
  const primary = normalizeSingle(taxRate);
  const secondary = normalizeSingle(ratePercent);
  // A zero tax_rate alongside a non-zero rate_percent is a common schema-backfill state.
  const value = primary && primary > 0 ? primary : (secondary ?? primary ?? 0);
  return Math.max(0, Math.min(value, 1));
}

export function taxRatePercent(taxRate, ratePercent = null) {
  const fraction = normalizeTaxRateFraction(taxRate, ratePercent);
  return Number((fraction * 100).toFixed(3));
}

export function normalizeTaxClass(row = {}) {
  const tax_rate = normalizeTaxRateFraction(row.tax_rate, row.rate_percent);
  return { ...row, tax_rate, rate_percent: taxRatePercent(tax_rate) };
}
