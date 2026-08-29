from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
helper = (ROOT / 'functions/api/_lib/paymentExecution.js').read_text(encoding='utf-8')
middleware = (ROOT / 'functions/api/_middleware.js').read_text(encoding='utf-8')
providers = (ROOT / 'functions/api/payment-providers.js').read_text(encoding='utf-8')
checkout = (ROOT / 'functions/api/checkout-prepare-payment.js').read_text(encoding='utf-8')
proof = (ROOT / 'scripts/release460_payment_execution_proof.mjs').read_text(encoding='utf-8')

assert "PAYMENT_PROVIDER_EXECUTION_MODE" in helper
assert "development-explicit" in helper
assert "devilndove-site-dev.pages.dev" in helper
assert "payment_execution_development_only" in helper
assert "payment_provider_execution_closed" in helper
assert "payment_live_credentials_forbidden" in helper
assert "sk_test_" in helper and "rk_test_" in helper
assert "sk_live_" in helper and "rk_live_" in helper
assert "PAYPAL_ENV" in helper and "mode === 'sandbox'" in helper
assert "production_execution: false" in helper

assert "guardPaymentProviderExecution" in middleware
assert "url.pathname !== '/api/checkout-prepare-payment'" in middleware
assert "paymentExecutionStatus" in middleware
assert "provider_network_call_performed: false" in middleware
assert "local_payment_mutation_performed: false" in middleware
assert middleware.index('guardPaymentProviderExecution(context)') < middleware.index('context.next()')

assert "configured: paypalConfigured" in providers
assert "ready: paypalExecution.execution_authorized" in providers
assert "ready: stripeExecution.execution_authorized" in providers
assert 'payment_provider_execution_not_implemented' in providers
assert 'mode: "stub"' in providers

# Defense in depth: the owner route must enforce the same gate before payment-record mutation/provider calls.
assert "import { paymentExecutionStatus }" in checkout
assert "if ([\"paypal\", \"stripe\"].includes(provider))" in checkout
assert "const execution = paymentExecutionStatus(request.url, env, provider);" in checkout
assert "local_payment_mutation_performed: false" in checkout
assert "provider_network_call_performed: false" in checkout
assert checkout.index('const execution = paymentExecutionStatus(request.url, env, provider);') < checkout.index('const paymentRecord = await getOrCreatePendingPayment')
assert checkout.index('const execution = paymentExecutionStatus(request.url, env, provider);') < checkout.index('await createPaypalOrder')
assert checkout.index('const execution = paymentExecutionStatus(request.url, env, provider);') < checkout.index('await createStripeCheckoutSession')
assert 'https://api.stripe.com/v1/checkout/sessions' in checkout
assert '/v2/checkout/orders' in checkout
assert 'fetch(' in checkout

# Current commerce policy: Stripe hosted shipping is Canada-only; U.S. is not an allowed hosted checkout country.
assert 'shipping_address_collection[allowed_countries][0]' in checkout
assert 'shipping_address_collection[allowed_countries][1]' not in checkout
assert 'params.set("shipping_address_collection[allowed_countries][0]", "CA")' in checkout

assert 'payment_provider_execution_closed' in proof
assert 'payment_live_credentials_forbidden' in proof
assert 'payment_execution_development_only' in proof
assert 'RELEASE 460 PAYMENT EXECUTION BOUNDARY PROOF: PASS' in proof

print('RELEASE 460 PAYMENT EXECUTION FAIL-CLOSED SOURCE GATE: PASS')
