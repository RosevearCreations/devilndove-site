import {
  COMMERCE_POLICY,
  CANADIAN_PROVINCES,
  isAllowedCommerceCountry,
  normalizeCanadianPostalCode,
  normalizeProvinceCode,
  validateCanadianAddress,
} from './commerce-policy-core.js';

// Release 467 Build 77 — public presentation + checkout-address enforcement.
// No network request, timer, storage mutation, payment call or commerce write is performed here.

const path = String(globalThis.location?.pathname || '/').toLowerCase();
const COMMERCE_PATH = path === '/shop/' || path.startsWith('/shop/') || path === '/cart/' || path.startsWith('/cart/') || path === '/checkout/' || path.startsWith('/checkout/');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function ensurePolicyBanner() {
  if (!COMMERCE_PATH || document.getElementById('ddCommercePolicyBanner')) return;
  const hero = document.querySelector('.hero');
  const container = document.querySelector('.container');
  if (!hero && !container) return;

  const banner = document.createElement('section');
  banner.id = 'ddCommercePolicyBanner';
  banner.className = 'card';
  banner.setAttribute('aria-label', 'Storefront country policy');
  banner.style.marginBottom = '18px';
  banner.dataset.commercePolicyVersion = COMMERCE_POLICY.version;
  banner.innerHTML = `
    <div style="display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap">
      <div style="max-width:860px">
        <strong>Canada-only storefront</strong>
        <div class="small" style="margin-top:6px">${escapeHtml(COMMERCE_POLICY.message)}</div>
      </div>
      <span class="pill">CAD • Canada</span>
    </div>`;

  if (hero?.parentNode) hero.insertAdjacentElement('afterend', banner);
  else container?.prepend(banner);
}

function replaceProvinceInput(id) {
  const current = document.getElementById(id);
  if (!current || current.tagName === 'SELECT') return current;
  const selectedCode = normalizeProvinceCode(current.value);
  const select = document.createElement('select');
  for (const attr of current.attributes) {
    if (attr.name === 'type' || attr.name === 'value') continue;
    select.setAttribute(attr.name, attr.value);
  }
  select.innerHTML = `<option value="">Select province / territory</option>${CANADIAN_PROVINCES.map(([code, name]) => `<option value="${code}"${code === selectedCode ? ' selected' : ''}>${escapeHtml(name)} (${code})</option>`).join('')}`;
  current.replaceWith(select);
  return select;
}

function lockCountry(id) {
  const field = document.getElementById(id);
  if (!field) return;
  field.value = 'Canada';
  field.setAttribute('readonly', 'readonly');
  field.setAttribute('aria-readonly', 'true');
  field.dataset.commercePolicyLocked = 'CA';
  const reset = () => {
    if (!isAllowedCommerceCountry(field.value)) field.value = 'Canada';
  };
  field.addEventListener('change', reset);
  field.addEventListener('input', reset);
}

function relabel(forId, text) {
  const label = document.querySelector(`label[for="${forId}"]`);
  if (label) label.textContent = text;
}

function normalizePostalField(id) {
  const field = document.getElementById(id);
  if (!field) return;
  field.setAttribute('placeholder', 'A1A 1A1');
  field.setAttribute('inputmode', 'text');
  field.addEventListener('blur', () => {
    if (field.value) field.value = normalizeCanadianPostalCode(field.value);
  });
}

function readCartRequiresShipping() {
  try {
    const rows = JSON.parse(localStorage.getItem('dd_cart') || '[]');
    return Array.isArray(rows) && rows.some((item) => Number(item?.requires_shipping || 0) === 1);
  } catch {
    return false;
  }
}

function showCheckoutPolicyError(message) {
  const mount = document.getElementById('checkoutMessage');
  if (!mount) return;
  mount.textContent = message;
  mount.style.display = 'block';
  mount.style.color = '#b00020';
  mount.setAttribute('role', 'alert');
  mount.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
}

function validateCheckoutPolicy() {
  const billingCountry = String(document.getElementById('billing_country')?.value || '').trim();
  if (!isAllowedCommerceCountry(billingCountry)) {
    return { ok: false, error: COMMERCE_POLICY.message };
  }

  const requiresShipping = readCartRequiresShipping();
  if (requiresShipping) {
    const result = validateCanadianAddress({
      country: document.getElementById('shipping_country')?.value,
      province: document.getElementById('shipping_province')?.value,
      postal_code: document.getElementById('shipping_postal_code')?.value,
    }, { required: true, label: 'Shipping' });
    if (!result.ok) return result;
  }

  const billingAddressStarted = ['billing_address1', 'billing_city', 'billing_province', 'billing_postal_code']
    .some((id) => String(document.getElementById(id)?.value || '').trim());
  if (billingAddressStarted) {
    const result = validateCanadianAddress({
      country: billingCountry,
      province: document.getElementById('billing_province')?.value,
      postal_code: document.getElementById('billing_postal_code')?.value,
    }, { required: true, label: 'Billing' });
    if (!result.ok) return result;
  }

  return { ok: true };
}

function hardenCheckoutAddressUi() {
  if (!path.startsWith('/checkout/')) return;
  const form = document.getElementById('checkoutForm');
  if (!form) return;

  lockCountry('shipping_country');
  lockCountry('billing_country');
  replaceProvinceInput('shipping_province');
  replaceProvinceInput('billing_province');
  relabel('shipping_country', 'Country (Canada only)');
  relabel('billing_country', 'Country (Canada only)');
  relabel('shipping_province', 'Province / Territory');
  relabel('billing_province', 'Province / Territory');
  relabel('shipping_postal_code', 'Postal Code');
  relabel('billing_postal_code', 'Postal Code');
  normalizePostalField('shipping_postal_code');
  normalizePostalField('billing_postal_code');

  form.addEventListener('submit', (event) => {
    const result = validateCheckoutPolicy();
    if (result.ok) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showCheckoutPolicyError(result.error || COMMERCE_POLICY.message);
  }, true);

  document.documentElement.dataset.ddCommercePolicyCheckout = COMMERCE_POLICY.version;
}

function start() {
  if (!COMMERCE_PATH) return;
  ensurePolicyBanner();
  hardenCheckoutAddressUi();
  document.documentElement.dataset.ddCommercePolicyVersion = COMMERCE_POLICY.version;
  document.dispatchEvent(new CustomEvent('dd:commerce-policy-ready', {
    detail: {
      version: COMMERCE_POLICY.version,
      country: COMMERCE_POLICY.selling_country_code,
      currency: COMMERCE_POLICY.currency,
      us_sales_enabled: false,
      us_shipping_enabled: false,
    },
  }));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();

export const BUILD = 77;
export const CONTRACT = 'canada-only-commerce-runtime';
