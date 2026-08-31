import assert from 'node:assert/strict';
import {
  isDevelopmentPaymentHost,
  paymentExecutionBoundary,
  paymentExecutionStatus,
} from '../functions/api/_lib/paymentExecution.js';

const canonical = 'https://dev.devilndove-site.pages.dev/api/checkout-prepare-payment';
const preview = 'https://abc12345.devilndove-site.pages.dev/api/checkout-prepare-payment';
const production = 'https://devilndove-site.pages.dev/api/checkout-prepare-payment';
const devEnv = { DND_ENVIRONMENT: 'development' };
const prodEnv = { DND_ENVIRONMENT: 'production' };

assert.equal(isDevelopmentPaymentHost('dev.devilndove-site.pages.dev', devEnv), true);
assert.equal(isDevelopmentPaymentHost('abc12345.devilndove-site.pages.dev', devEnv), true);
assert.equal(isDevelopmentPaymentHost('devilndove-site.pages.dev', devEnv), false);
assert.equal(isDevelopmentPaymentHost('abc12345.devilndove-site.pages.dev', prodEnv), false);

const closed = paymentExecutionStatus(canonical, {
  ...devEnv,
  STRIPE_SECRET_KEY: 'sk_test_mock',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_mock',
}, 'stripe');
assert.equal(closed.execution_authorized, false);
assert.equal(closed.code, 'payment_provider_execution_closed');
assert.equal(closed.operator_switch_set, false);

const stripeTest = paymentExecutionStatus(canonical, {
  ...devEnv,
  PAYMENT_PROVIDER_EXECUTION_MODE: 'development-explicit',
  STRIPE_SECRET_KEY: 'sk_test_mock',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_mock',
}, 'stripe');
assert.equal(stripeTest.execution_authorized, true);
assert.equal(stripeTest.test_mode, true);
assert.equal(stripeTest.live_credential_detected, false);

const stripePreview = paymentExecutionStatus(preview, {
  ...devEnv,
  PAYMENT_PROVIDER_EXECUTION_MODE: 'development-explicit',
  STRIPE_SECRET_KEY: 'rk_test_mock',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_mock',
}, 'stripe');
assert.equal(stripePreview.execution_authorized, true);

const stripeLive = paymentExecutionStatus(canonical, {
  ...devEnv,
  PAYMENT_PROVIDER_EXECUTION_MODE: 'development-explicit',
  STRIPE_SECRET_KEY: 'sk_live_never_execute',
  STRIPE_PUBLISHABLE_KEY: 'pk_live_never_execute',
}, 'stripe');
assert.equal(stripeLive.execution_authorized, false);
assert.equal(stripeLive.code, 'payment_live_credentials_forbidden');
assert.equal(stripeLive.live_credential_detected, true);

const stripeProduction = paymentExecutionStatus(production, {
  ...prodEnv,
  PAYMENT_PROVIDER_EXECUTION_MODE: 'development-explicit',
  STRIPE_SECRET_KEY: 'sk_test_mock',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_mock',
}, 'stripe');
assert.equal(stripeProduction.execution_authorized, false);
assert.equal(stripeProduction.code, 'payment_execution_development_only');

const paypalTest = paymentExecutionStatus(canonical, {
  ...devEnv,
  PAYMENT_PROVIDER_EXECUTION_MODE: 'development-explicit',
  PAYPAL_CLIENT_ID: 'sandbox-client',
  PAYPAL_SECRET: 'sandbox-secret',
  PAYPAL_ENV: 'sandbox',
}, 'paypal');
assert.equal(paypalTest.execution_authorized, true);
assert.equal(paypalTest.environment, 'sandbox');

const paypalLive = paymentExecutionStatus(canonical, {
  ...devEnv,
  PAYMENT_PROVIDER_EXECUTION_MODE: 'development-explicit',
  PAYPAL_CLIENT_ID: 'live-client',
  PAYPAL_SECRET: 'live-secret',
  PAYPAL_ENV: 'live',
}, 'paypal');
assert.equal(paypalLive.execution_authorized, false);
assert.equal(paypalLive.code, 'payment_live_credentials_forbidden');

const paypalMissing = paymentExecutionStatus(canonical, {
  ...devEnv,
  PAYMENT_PROVIDER_EXECUTION_MODE: 'development-explicit',
  PAYPAL_ENV: 'sandbox',
}, 'paypal');
assert.equal(paypalMissing.execution_authorized, false);
assert.equal(paypalMissing.code, 'payment_provider_not_configured');

const boundary = paymentExecutionBoundary({});
assert.equal(boundary.operator_switch_set, false);
assert.equal(boundary.production_execution, false);
assert.equal(boundary.test_sandbox_only, true);

const serialized = JSON.stringify({ closed, stripeTest, stripeLive, stripeProduction, paypalTest, paypalLive, paypalMissing, boundary });
for (const secret of ['sk_test_mock', 'pk_test_mock', 'sk_live_never_execute', 'pk_live_never_execute', 'sandbox-secret', 'live-secret']) {
  assert.equal(serialized.includes(secret), false, `secret leaked into payment execution diagnostics: ${secret}`);
}

console.log('RELEASE 460 PAYMENT EXECUTION BOUNDARY PROOF: PASS');
