import process from 'node:process';
import {
  COMMERCE_POLICY,
  CANADIAN_PROVINCES,
  normalizeCountryCode,
  isAllowedCommerceCountry,
  normalizeProvinceCode,
  normalizeCanadianPostalCode,
  isCanadianPostalCode,
  validateCanadianAddress,
  validateCommerceEnvelope,
  policyPublicSnapshot,
} from '../public/js/commerce-policy-core.js';

let checks = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    console.error(`${String(checks).padStart(2, '0')}. FAIL — ${label}`);
    process.exitCode = 1;
    return;
  }
  console.log(`${String(checks).padStart(2, '0')}. PASS — ${label}`);
}

check(COMMERCE_POLICY.version === 'R467B77_V1' && COMMERCE_POLICY.currency === 'CAD', 'Build 77 shared commerce authority identity and CAD currency are stable');
check(COMMERCE_POLICY.united_states_sales_enabled === false && COMMERCE_POLICY.united_states_shipping_enabled === false, 'U.S. storefront sales and shipping remain explicitly closed');
check(normalizeCountryCode('Canada') === 'CA' && normalizeCountryCode('ca') === 'CA' && normalizeCountryCode('CAN') === 'CA', 'Canada aliases normalize to one CA authority');
check(isAllowedCommerceCountry('Canada') === true && isAllowedCommerceCountry('United States') === false && isAllowedCommerceCountry('US') === false, 'country boundary accepts Canada and rejects U.S. variants');
check(CANADIAN_PROVINCES.length === 13 && normalizeProvinceCode('Ontario') === 'ON' && normalizeProvinceCode('QC') === 'QC', 'all 13 Canadian provinces and territories share one normalization authority');
check(normalizeCanadianPostalCode('n4b2w1') === 'N4B 2W1' && isCanadianPostalCode('N4B 2W1'), 'Canadian postal code formatting and validation are deterministic');
check(!isCanadianPostalCode('90210') && !isCanadianPostalCode('12345'), 'U.S.-style ZIP codes do not pass the Canadian postal authority');

const shippingOk = validateCanadianAddress({ country: 'Canada', province: 'ON', postal_code: 'N4B 2W1' }, { label: 'Shipping' });
check(shippingOk.ok && shippingOk.country_code === 'CA' && shippingOk.province_code === 'ON', 'valid Canadian shipping address passes with normalized country/province');

const shippingUs = validateCanadianAddress({ country: 'United States', province: 'NY', postal_code: '10001' }, { label: 'Shipping' });
check(!shippingUs.ok && shippingUs.code === 'commerce_country_not_supported', 'U.S. shipping address fails closed before order/provider execution');

const badProvince = validateCanadianAddress({ country: 'Canada', province: 'New York', postal_code: 'N4B 2W1' }, { label: 'Shipping' });
check(!badProvince.ok && badProvince.code === 'canadian_province_required', 'non-Canadian province/state fails the shared address authority');

const envelopeOk = validateCommerceEnvelope({ currency: 'CAD', billing_country: 'Canada', shipping_country: 'CA' });
check(envelopeOk.ok && envelopeOk.currency === 'CAD', 'Canadian billing/shipping envelope passes');

const billingUs = validateCommerceEnvelope({ currency: 'CAD', billing_country: 'US', shipping_country: '' });
check(!billingUs.ok && billingUs.code === 'billing_country_not_supported', 'digital/no-shipping sale still rejects non-Canadian billing country');

const usd = validateCommerceEnvelope({ currency: 'USD', billing_country: 'Canada', shipping_country: 'Canada' });
check(!usd.ok && usd.code === 'commerce_currency_not_supported', 'non-CAD storefront currency fails closed');

const snapshot = policyPublicSnapshot();
check(snapshot.allowed_shipping_country_codes.join(',') === 'CA' && snapshot.allowed_billing_country_codes.join(',') === 'CA' && snapshot.canadian_provinces.length === 13, 'public policy snapshot matches the shared server/browser authority');

if (process.exitCode) process.exit(process.exitCode);
console.log(`BUILD 77 CANADA-ONLY COMMERCE RUNTIME: PASS (${checks} checks)`);
