// Release 467 Build 77 — Canada-Only Commerce Rules.
// This pure ESM module is the shared browser/server authority for the current storefront
// country, currency, province and postal-code boundary. It performs no network, storage,
// D1, R2, payment-provider or publication action.

export const COMMERCE_POLICY_VERSION = 'R467B77_V1';

export const CANADIAN_PROVINCES = Object.freeze([
  ['AB', 'Alberta'],
  ['BC', 'British Columbia'],
  ['MB', 'Manitoba'],
  ['NB', 'New Brunswick'],
  ['NL', 'Newfoundland and Labrador'],
  ['NS', 'Nova Scotia'],
  ['NT', 'Northwest Territories'],
  ['NU', 'Nunavut'],
  ['ON', 'Ontario'],
  ['PE', 'Prince Edward Island'],
  ['QC', 'Quebec'],
  ['SK', 'Saskatchewan'],
  ['YT', 'Yukon'],
]);

export const COMMERCE_POLICY = Object.freeze({
  version: COMMERCE_POLICY_VERSION,
  selling_country_code: 'CA',
  selling_country_name: 'Canada',
  allowed_shipping_country_codes: Object.freeze(['CA']),
  allowed_billing_country_codes: Object.freeze(['CA']),
  currency: 'CAD',
  physical_shipping_scope: 'Canada only',
  united_states_sales_enabled: false,
  united_states_shipping_enabled: false,
  message: 'Devil n Dove currently accepts storefront orders only for Canadian billing addresses and ships physical orders only within Canada. U.S. sales and shipping are currently unavailable.',
});

const COUNTRY_ALIASES = Object.freeze(new Map([
  ['ca', 'CA'],
  ['can', 'CA'],
  ['canada', 'CA'],
]));

const PROVINCE_ALIASES = (() => {
  const map = new Map();
  for (const [code, name] of CANADIAN_PROVINCES) {
    map.set(code.toLowerCase(), code);
    map.set(name.toLowerCase(), code);
  }
  map.set('newfoundland', 'NL');
  map.set('pei', 'PE');
  map.set('p.e.i.', 'PE');
  map.set('quebec', 'QC');
  map.set('québec', 'QC');
  map.set('nwt', 'NT');
  return map;
})();

function clean(value) {
  return String(value ?? '').trim();
}

export function normalizeCountryCode(value) {
  const raw = clean(value).toLowerCase();
  if (!raw) return '';
  const letters = raw.replace(/[^a-z]/g, '');
  return COUNTRY_ALIASES.get(letters) || raw.toUpperCase();
}

export function isAllowedCommerceCountry(value) {
  return normalizeCountryCode(value) === COMMERCE_POLICY.selling_country_code;
}

export function normalizeProvinceCode(value) {
  const raw = clean(value);
  if (!raw) return '';
  return PROVINCE_ALIASES.get(raw.toLowerCase()) || '';
}

export function normalizeCanadianPostalCode(value) {
  const compact = clean(value).toUpperCase().replace(/\s+/g, '');
  if (compact.length !== 6) return clean(value).toUpperCase();
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}

export function isCanadianPostalCode(value) {
  const compact = clean(value).toUpperCase().replace(/\s+/g, '');
  return /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/.test(compact);
}

export function validateCanadianAddress({ country, province, postal_code } = {}, { required = true, label = 'Shipping' } = {}) {
  const countryCode = normalizeCountryCode(country);
  const provinceCode = normalizeProvinceCode(province);
  const postalCode = normalizeCanadianPostalCode(postal_code);

  if (!required && !clean(country) && !clean(province) && !clean(postal_code)) {
    return { ok: true, country_code: '', province_code: '', postal_code: '' };
  }
  if (!countryCode) {
    return { ok: false, code: 'country_required', error: `${label} country is required. Canada is the only supported storefront country.` };
  }
  if (countryCode !== 'CA') {
    return { ok: false, code: 'commerce_country_not_supported', error: COMMERCE_POLICY.message, requested_country: clean(country), allowed_countries: ['CA'] };
  }
  if (!provinceCode) {
    return { ok: false, code: 'canadian_province_required', error: `${label} province or territory must be a valid Canadian province or territory.` };
  }
  if (!isCanadianPostalCode(postal_code)) {
    return { ok: false, code: 'canadian_postal_code_invalid', error: `${label} postal code must be a valid Canadian postal code (for example, N4B 2W1).` };
  }
  return { ok: true, country_code: 'CA', province_code: provinceCode, postal_code: postalCode };
}

export function validateCommerceEnvelope({ currency, billing_country, shipping_country } = {}) {
  const normalizedCurrency = clean(currency || COMMERCE_POLICY.currency).toUpperCase();
  if (normalizedCurrency !== COMMERCE_POLICY.currency) {
    return {
      ok: false,
      code: 'commerce_currency_not_supported',
      error: `Devil n Dove storefront orders currently use ${COMMERCE_POLICY.currency} only.`,
      requested_currency: normalizedCurrency || null,
      allowed_currencies: [COMMERCE_POLICY.currency],
    };
  }
  if (!isAllowedCommerceCountry(billing_country)) {
    return {
      ok: false,
      code: 'billing_country_not_supported',
      error: COMMERCE_POLICY.message,
      requested_country: clean(billing_country) || null,
      allowed_countries: ['CA'],
    };
  }
  if (clean(shipping_country) && !isAllowedCommerceCountry(shipping_country)) {
    return {
      ok: false,
      code: 'shipping_country_not_supported',
      error: COMMERCE_POLICY.message,
      requested_country: clean(shipping_country),
      allowed_countries: ['CA'],
    };
  }
  return { ok: true, currency: 'CAD', billing_country_code: 'CA', shipping_country_code: clean(shipping_country) ? 'CA' : '' };
}

export function policyPublicSnapshot() {
  return {
    version: COMMERCE_POLICY.version,
    selling_country_code: COMMERCE_POLICY.selling_country_code,
    selling_country_name: COMMERCE_POLICY.selling_country_name,
    allowed_shipping_country_codes: [...COMMERCE_POLICY.allowed_shipping_country_codes],
    allowed_billing_country_codes: [...COMMERCE_POLICY.allowed_billing_country_codes],
    currency: COMMERCE_POLICY.currency,
    physical_shipping_scope: COMMERCE_POLICY.physical_shipping_scope,
    united_states_sales_enabled: false,
    united_states_shipping_enabled: false,
    message: COMMERCE_POLICY.message,
    canadian_provinces: CANADIAN_PROVINCES.map(([code, name]) => ({ code, name })),
  };
}

if (typeof window !== 'undefined') {
  window.DDCommercePolicy = Object.freeze({
    ...policyPublicSnapshot(),
    normalizeCountryCode,
    isAllowedCommerceCountry,
    normalizeProvinceCode,
    normalizeCanadianPostalCode,
    isCanadianPostalCode,
    validateCanadianAddress,
    validateCommerceEnvelope,
  });
}
