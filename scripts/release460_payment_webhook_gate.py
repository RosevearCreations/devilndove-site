from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
helper = (ROOT / 'functions/api/_lib/paymentWebhookSecurity.js').read_text(encoding='utf-8')
stripe = (ROOT / 'functions/api/stripe-webhook.js').read_text(encoding='utf-8')
paypal = (ROOT / 'functions/api/paypal-webhook.js').read_text(encoding='utf-8')
proof = (ROOT / 'scripts/release460_payment_webhook_security_proof.mjs').read_text(encoding='utf-8')

for name, source in [('stripe-webhook.js', stripe), ('paypal-webhook.js', paypal)]:
    upper = source.upper()
    assert 'CREATE TABLE' not in upper, f'{name} must not create schema during webhook requests'
    assert 'ALTER TABLE' not in upper, f'{name} must not alter schema during webhook requests'
    assert 'CRYPTO.RANDOMUUID()' not in upper, f'{name} must require provider event identity for replay authority'
    assert 'registerWebhookEventAtomic' in source, f'{name} must use atomic webhook replay registration'
    assert 'requireGiftCardWebhookSchema' in source, f'{name} must use read-only gift-card schema readiness'

assert 'verifyStripeWebhook' in stripe
assert stripe.index('verifyStripeWebhook') < stripe.rindex('registerWebhookEvent(env')
assert "stripe_webhook_not_configured" in stripe
assert "Stripe webhook replay authority is unavailable." in stripe

assert 'verifyPayPalWebhook' in paypal
assert paypal.index('verifyPayPalWebhook') < paypal.rindex('registerWebhookEvent(env')
assert "paypal_webhook_not_configured" in paypal
assert "PayPal webhook replay authority is unavailable." in paypal

assert 'Math.abs(nowSeconds - timestampSeconds) > tolerance' in helper
assert "stripe_signature_timestamp_outside_tolerance" in helper
assert "paypal_signature_headers_missing" in helper
assert "/v1/notifications/verify-webhook-signature" in helper
assert "status === 'SUCCESS'" in helper
assert "INSERT INTO webhook_events" in helper
assert "WHERE NOT EXISTS" in helper
assert "SELECT 1" in helper
assert "throw new Error('webhook_event_registration_failed')" in helper
assert "PRAGMA table_info(gift_cards)" in helper
assert "throw new Error('gift_card_webhook_schema_not_ready')" in helper
assert 'CREATE TABLE' not in helper.upper()
assert 'ALTER TABLE' not in helper.upper()

assert 'real network must not execute' in proof
assert 'stripe_signature_timestamp_outside_tolerance' in proof
assert 'paypal_signature_verified' in proof
assert 'paypal_signature_invalid' in proof
assert 'RELEASE 460 PAYMENT WEBHOOK SECURITY MOCK PROOF: PASS' in proof

print('RELEASE 460 PAYMENT WEBHOOK FAIL-CLOSED SOURCE GATE: PASS')
