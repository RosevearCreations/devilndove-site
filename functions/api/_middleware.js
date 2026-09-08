import { paymentExecutionBoundary, paymentExecutionStatus } from './_lib/paymentExecution.js';
import {
  COMMERCE_POLICY,
  isAllowedCommerceCountry,
  validateCanadianAddress,
  validateCommerceEnvelope,
} from '../../public/js/commerce-policy-core.js';

// Devil n Dove Release 467 Build 77 — API safety middleware.
// Keeps carried Product/Inventory conflict mapping, closes remote payment execution unless
// explicitly opened for Development test/sandbox use, and applies the shared Canada-only
// commerce policy before order/payment mutation or provider execution.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
}

function errorText(error) {
  return String(error?.message || error || '');
}

function normalizePaymentProvider(value) {
  const provider = String(value || '').trim().toLowerCase();
  return ['paypal', 'stripe', 'square', 'manual', 'other'].includes(provider) ? provider : '';
}

function commercePolicyClosed(result = {}, extra = {}) {
  return json({
    ok: false,
    code: result.code || 'commerce_policy_closed',
    error: result.error || COMMERCE_POLICY.message,
    requested_country: result.requested_country || null,
    requested_currency: result.requested_currency || null,
    allowed_countries: ['CA'],
    allowed_currencies: ['CAD'],
    commerce_policy_version: COMMERCE_POLICY.version,
    local_order_mutation_performed: false,
    local_payment_mutation_performed: false,
    provider_network_call_performed: false,
    ...extra,
  }, 422);
}

function hasAnyAddressValue(source = {}, prefix = '') {
  return ['address1', 'city', 'province', 'postal_code']
    .some((field) => String(source?.[`${prefix}${field}`] || '').trim());
}

async function guardPaymentProviderExecution(context) {
  const request = context.request;
  let url;
  try { url = new URL(request.url); } catch { return null; }
  if (request.method !== 'POST' || url.pathname !== '/api/checkout-prepare-payment') return null;

  let body = {};
  try { body = await request.clone().json(); } catch { return null; }
  const provider = normalizePaymentProvider(body?.provider || body?.payment_method || 'paypal') || 'paypal';
  if (!['paypal', 'stripe'].includes(provider)) return null;

  const status = paymentExecutionStatus(request.url, context.env || {}, provider);
  if (status.execution_authorized) return null;

  return json({
    ok: false,
    code: status.code,
    error: 'Remote payment-provider execution is closed. Development test/sandbox execution requires an explicit operator switch and test-only provider credentials.',
    provider,
    payment_execution: {
      configured: status.configured,
      test_mode: status.test_mode,
      environment: status.environment,
      live_credential_detected: status.live_credential_detected,
      development_host: status.development_host,
      operator_switch_set: status.operator_switch_set,
      execution_authorized: false,
    },
    boundary: paymentExecutionBoundary(context.env || {}),
    local_payment_mutation_performed: false,
    provider_network_call_performed: false,
  }, 423);
}

async function guardCommercePolicy(context) {
  const request = context.request;
  let url;
  try { url = new URL(request.url); } catch { return null; }
  if (request.method !== 'POST') return null;

  if (url.pathname === '/api/checkout-create-order') {
    let body = {};
    try { body = await request.clone().json(); } catch { return null; }
    const envelope = validateCommerceEnvelope({
      currency: body?.currency || 'CAD',
      billing_country: body?.billing_country,
      shipping_country: body?.shipping_country,
    });
    if (!envelope.ok) return commercePolicyClosed(envelope);

    if (hasAnyAddressValue(body, 'shipping_')) {
      const shippingAddress = validateCanadianAddress({
        country: body?.shipping_country,
        province: body?.shipping_province,
        postal_code: body?.shipping_postal_code,
      }, { required: true, label: 'Shipping' });
      if (!shippingAddress.ok) return commercePolicyClosed(shippingAddress);
    }

    if (hasAnyAddressValue(body, 'billing_')) {
      const billingAddress = validateCanadianAddress({
        country: body?.billing_country,
        province: body?.billing_province,
        postal_code: body?.billing_postal_code,
      }, { required: true, label: 'Billing' });
      if (!billingAddress.ok) return commercePolicyClosed(billingAddress);
    }
    return null;
  }

  if (url.pathname === '/api/checkout-prepare-payment') {
    let body = {};
    try { body = await request.clone().json(); } catch { return null; }
    const orderId = Number(body?.order_id || 0);
    const db = context.env?.DB || context.env?.DD_DB;
    if (!db || !Number.isInteger(orderId) || orderId <= 0) return null;
    const order = await db.prepare(`
      SELECT fulfillment_type, currency,
             shipping_address1, shipping_city, shipping_province, shipping_postal_code, shipping_country,
             billing_address1, billing_city, billing_province, billing_postal_code, billing_country
      FROM orders
      WHERE order_id = ?
      LIMIT 1
    `).bind(orderId).first().catch(() => null);
    if (!order) return null;

    const envelope = validateCommerceEnvelope({
      currency: order.currency || 'CAD',
      billing_country: order.billing_country,
      shipping_country: order.shipping_country,
    });
    if (!envelope.ok) return commercePolicyClosed(envelope, { order_id: orderId });

    const fulfillment = String(order.fulfillment_type || '').trim().toLowerCase();
    if (['shipping', 'mixed'].includes(fulfillment)) {
      if (!isAllowedCommerceCountry(order.shipping_country)) {
        return commercePolicyClosed({
          code: 'shipping_country_not_supported',
          error: COMMERCE_POLICY.message,
          requested_country: order.shipping_country,
        }, { order_id: orderId });
      }
      const shippingAddress = validateCanadianAddress({
        country: order.shipping_country,
        province: order.shipping_province,
        postal_code: order.shipping_postal_code,
      }, { required: true, label: 'Shipping' });
      if (!shippingAddress.ok) return commercePolicyClosed(shippingAddress, { order_id: orderId });
    }

    if (hasAnyAddressValue(order, 'billing_')) {
      const billingAddress = validateCanadianAddress({
        country: order.billing_country,
        province: order.billing_province,
        postal_code: order.billing_postal_code,
      }, { required: true, label: 'Billing' });
      if (!billingAddress.ok) return commercePolicyClosed(billingAddress, { order_id: orderId });
    }
  }

  return null;
}

export async function onRequest(context) {
  const commerceGuard = await guardCommercePolicy(context);
  if (commerceGuard) return commerceGuard;

  const paymentGuard = await guardPaymentProviderExecution(context);
  if (paymentGuard) return paymentGuard;

  try {
    return await context.next();
  } catch (error) {
    const raw = errorText(error);
    if (raw.includes('build440_finished_inventory_commitment_exceeds_available')) {
      return json({
        ok: false,
        build: 440,
        code: 'finished_inventory_commitment_conflict',
        error: 'Available finished inventory changed while this request was being committed. The incomplete order was cancelled safely; refresh availability and try again.',
        retry_safe_after_refresh: true,
      }, 409);
    }
    if (raw.includes('build440_finished_inventory_below_active_commitments')) {
      return json({
        ok: false,
        build: 440,
        code: 'finished_inventory_below_active_commitments',
        error: 'Finished inventory cannot be reduced below quantities already committed to active orders. Release or resolve the downstream commitments first.',
        retry_safe_after_refresh: false,
      }, 409);
    }
    throw error;
  }
}
