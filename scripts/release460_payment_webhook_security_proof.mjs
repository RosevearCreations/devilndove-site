import assert from 'node:assert/strict';
import {
  paypalWebhookConfiguration,
  stripeWebhookConfiguration,
  verifyPayPalWebhook,
  verifyStripeWebhook,
} from '../functions/api/_lib/paymentWebhookSecurity.js';

const encoder = new TextEncoder();

async function stripeSignature(secret, timestamp, body) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${body}`));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function paypalHeaders(overrides = {}) {
  return new Headers({
    'paypal-auth-algo': 'SHA256withRSA',
    'paypal-cert-url': 'https://api-m.sandbox.paypal.com/certs/example',
    'paypal-transmission-id': 'transmission-test-1',
    'paypal-transmission-sig': 'mock-signature',
    'paypal-transmission-time': '2026-08-29T22:00:00Z',
    ...overrides,
  });
}

const nowMs = Date.parse('2026-08-29T22:00:00Z');
const nowSeconds = Math.floor(nowMs / 1000);
const stripeBody = JSON.stringify({ id: 'evt_test_1', type: 'checkout.session.completed' });
const stripeSecret = 'whsec_release460_mock';
const goodStripeSignature = await stripeSignature(stripeSecret, nowSeconds, stripeBody);

assert.equal(stripeWebhookConfiguration({}).ready, false);
assert.deepEqual(
  await verifyStripeWebhook({ rawBody: stripeBody, signatureHeader: '', env: {}, nowMs }),
  { verified: false, verification_mode: 'stripe', code: 'stripe_webhook_not_configured' }
);

const missingStripeHeader = await verifyStripeWebhook({
  rawBody: stripeBody,
  signatureHeader: '',
  env: { STRIPE_WEBHOOK_SECRET: stripeSecret },
  nowMs,
});
assert.equal(missingStripeHeader.verified, false);
assert.equal(missingStripeHeader.code, 'stripe_signature_missing');

const validStripe = await verifyStripeWebhook({
  rawBody: stripeBody,
  signatureHeader: `t=${nowSeconds},v1=${goodStripeSignature}`,
  env: { STRIPE_WEBHOOK_SECRET: stripeSecret },
  nowMs,
});
assert.equal(validStripe.verified, true);
assert.equal(validStripe.code, 'stripe_signature_verified');

const badStripe = await verifyStripeWebhook({
  rawBody: stripeBody,
  signatureHeader: `t=${nowSeconds},v1=${'0'.repeat(64)}`,
  env: { STRIPE_WEBHOOK_SECRET: stripeSecret },
  nowMs,
});
assert.equal(badStripe.verified, false);
assert.equal(badStripe.code, 'stripe_signature_invalid');

const oldSeconds = nowSeconds - 301;
const oldSignature = await stripeSignature(stripeSecret, oldSeconds, stripeBody);
const expiredStripe = await verifyStripeWebhook({
  rawBody: stripeBody,
  signatureHeader: `t=${oldSeconds},v1=${oldSignature}`,
  env: { STRIPE_WEBHOOK_SECRET: stripeSecret },
  nowMs,
});
assert.equal(expiredStripe.verified, false);
assert.equal(expiredStripe.code, 'stripe_signature_timestamp_outside_tolerance');

const futureSeconds = nowSeconds + 301;
const futureSignature = await stripeSignature(stripeSecret, futureSeconds, stripeBody);
const futureStripe = await verifyStripeWebhook({
  rawBody: stripeBody,
  signatureHeader: `t=${futureSeconds},v1=${futureSignature}`,
  env: { STRIPE_WEBHOOK_SECRET: stripeSecret },
  nowMs,
});
assert.equal(futureStripe.verified, false);
assert.equal(futureStripe.code, 'stripe_signature_timestamp_outside_tolerance');

const paypalEnv = {
  PAYPAL_CLIENT_ID: 'release460-client',
  PAYPAL_SECRET: 'release460-secret',
  PAYPAL_WEBHOOK_ID: 'release460-webhook',
  PAYPAL_ENV: 'sandbox',
};
const paypalEvent = { id: 'WH-TEST-1', event_type: 'PAYMENT.CAPTURE.COMPLETED', resource: { id: 'CAPTURE-1' } };
assert.equal(paypalWebhookConfiguration({}, paypalHeaders()).ready, false);

const incompleteHeaders = new Headers({ 'paypal-auth-algo': 'SHA256withRSA' });
const incomplete = paypalWebhookConfiguration(paypalEnv, incompleteHeaders);
assert.equal(incomplete.ready, false);
assert.equal(incomplete.code, 'paypal_signature_headers_missing');

let realFetchCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  realFetchCalls += 1;
  throw new Error('real network must not execute in Release 460 payment proof');
};

try {
  const successCalls = [];
  const successFetch = async (url, options = {}) => {
    successCalls.push({ url: String(url), options });
    if (String(url).endsWith('/v1/oauth2/token')) {
      return new Response(JSON.stringify({ access_token: 'mock-access-token' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (String(url).endsWith('/v1/notifications/verify-webhook-signature')) {
      return new Response(JSON.stringify({ verification_status: 'SUCCESS' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw new Error(`unexpected mock URL ${url}`);
  };

  const paypalVerified = await verifyPayPalWebhook({
    event: paypalEvent,
    headers: paypalHeaders(),
    env: paypalEnv,
    fetchImpl: successFetch,
  });
  assert.equal(paypalVerified.verified, true);
  assert.equal(paypalVerified.code, 'paypal_signature_verified');
  assert.equal(successCalls.length, 2);
  const verificationPayload = JSON.parse(successCalls[1].options.body);
  assert.equal(verificationPayload.webhook_id, paypalEnv.PAYPAL_WEBHOOK_ID);
  assert.equal(verificationPayload.webhook_event.id, paypalEvent.id);

  const failureFetch = async (url) => {
    if (String(url).endsWith('/v1/oauth2/token')) {
      return new Response(JSON.stringify({ access_token: 'mock-access-token' }), { status: 200 });
    }
    return new Response(JSON.stringify({ verification_status: 'FAILURE' }), { status: 200 });
  };
  const paypalRejected = await verifyPayPalWebhook({
    event: paypalEvent,
    headers: paypalHeaders(),
    env: paypalEnv,
    fetchImpl: failureFetch,
  });
  assert.equal(paypalRejected.verified, false);
  assert.equal(paypalRejected.code, 'paypal_signature_invalid');

  const httpFailureFetch = async (url) => {
    if (String(url).endsWith('/v1/oauth2/token')) {
      return new Response(JSON.stringify({ error: 'invalid_client' }), { status: 401 });
    }
    throw new Error('verification endpoint must not be reached after token failure');
  };
  const paypalHttpFailure = await verifyPayPalWebhook({
    event: paypalEvent,
    headers: paypalHeaders(),
    env: paypalEnv,
    fetchImpl: httpFailureFetch,
  });
  assert.equal(paypalHttpFailure.verified, false);
  assert.equal(paypalHttpFailure.code, 'paypal_verification_token_failed');
} finally {
  globalThis.fetch = originalFetch;
}

assert.equal(realFetchCalls, 0);
console.log('RELEASE 460 PAYMENT WEBHOOK SECURITY MOCK PROOF: PASS');
