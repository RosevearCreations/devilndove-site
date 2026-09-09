#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 79 preparation only."""
from pathlib import Path
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def req(ok, message):
    if not ok:
        FAIL.append(message)


def run(command, label):
    result = subprocess.run(command, cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if result.stdout.strip():
        print(result.stdout.strip())
    req(result.returncode == 0, f"{label} failed: {(result.stderr or result.stdout).strip()[-2000:]}")


helper = read('functions/api/_lib/stripeDevelopment.js')
execution = read('functions/api/_lib/paymentExecution.js')
checkout = read('functions/api/checkout-prepare-payment.js')
refund = read('functions/api/admin/payment-actions.js')
webhook = read('functions/api/stripe-webhook.js')
webhook_security = read('functions/api/_lib/paymentWebhookSecurity.js')
doc = read('docs/operations/RELEASE_467_BUILD_79_STRIPE_DEVELOPMENT_PREPARATION.md')
provenance = read('scripts/current_system_gate_provenance_gate.py')
manifest = json.loads(read('migrations/canonical/manifest.json'))

for token in (
    "STRIPE_API_VERSION = '2026-07-29.dahlia'",
    'stripeCheckoutIdempotencyKey',
    'stripeRefundIdempotencyKey',
    'stripeRequestHeaders',
    'stripeIntegrationIdentifier',
    "mode: 'preparation_only'",
    'remote_provider_execution: false',
    'real_acceptance_complete: false',
):
    req(token in helper, f'Stripe preparation helper missing token: {token}')

for forbidden in (r'\bfetch\s*\(', r'\blocalStorage\.', r'\bsessionStorage\.', r'\bsetInterval\s*\('):
    req(not re.search(forbidden, helper), f'pure Stripe preparation helper gained forbidden behavior: {forbidden}')

for token in (
    "stripeRequestHeaders(",
    'stripeCheckoutIdempotencyKey(paymentRecord.payment_id, order.order_id)',
    'integration_identifier',
    'await stripeIntegrationIdentifier(`${paymentRecord.payment_id}:${order.order_id}`)',
):
    req(token in checkout, f'Checkout Stripe preparation missing token: {token}')

req('payment_method_types' not in checkout, 'Stripe checkout must retain dynamic payment methods')
req('shipping_address_collection[allowed_countries][0]' in checkout, 'Canada-only hosted shipping authority was lost')
req('shipping_address_collection[allowed_countries][1]' not in checkout, 'a second hosted shipping country was added')

for token in ('stripeRequestHeaders(secretKey, stripeRefundIdempotencyKey(requestId))', 'PAYMENT_PROVIDER_MUTATIONS_ENABLED', 'provider_sync_confirmed'):
    req(token in refund, f'Stripe refund preparation/safety missing token: {token}')

for token in ('development-explicit', 'payment_execution_development_only', 'payment_live_credentials_forbidden', 'rk_test_', 'production_execution: false'):
    req(token in execution, f'payment execution boundary missing token: {token}')

for token in ('verifyStripeWebhook', 'registerWebhookEventAtomic'):
    req(token in webhook, f'Stripe webhook route missing token: {token}')
req('stripe_signature_timestamp_outside_tolerance' in webhook_security, 'Stripe signature timestamp guard missing')

for token in ('preparation only', 'HOLD_EXTERNAL', 'external acceptance claimed: **0/6**', 'restricted test key (`rk_test_`)', 'Build 80'):
    req(token in doc, f'Build 79 operating document missing token: {token}')

expected = [
    '0001_release464_migration_authority.sql',
    '0002_release464_operational_acceptance.sql',
    '0003_release464_business_growth.sql',
    '0004_release465_storefront_quality.sql',
]
req([row.get('file') for row in manifest.get('migrations', [])] == expected, 'Build 79 must keep canonical migrations 0001-0004 exactly')
req(not list((ROOT / 'migrations/canonical').glob('0005*')), 'Build 79 must remain schema-neutral')
req('release467_build79_gate.py' in provenance and 'Release 467 Build 79' in provenance, 'Current System Gate does not chain Build 79')

for path in (
    'functions/api/_lib/stripeDevelopment.js',
    'functions/api/checkout-prepare-payment.js',
    'functions/api/admin/payment-actions.js',
):
    run(['node', '--check', path], f'JavaScript syntax {path}')
run(['node', 'scripts/release467_build79_stripe_preparation_runtime_test.mjs'], 'Build 79 runtime proof')
run(['node', 'scripts/release460_payment_execution_proof.mjs'], 'carried payment execution proof')
run(['node', 'scripts/release460_payment_webhook_security_proof.mjs'], 'carried webhook security proof')

if FAIL:
    print('RELEASE 467 BUILD 79 STRIPE DEVELOPMENT PREPARATION: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)

print('RELEASE 467 BUILD 79 STRIPE DEVELOPMENT PREPARATION: PASS')
print('Stripe API version: PINNED')
print('Checkout/refund idempotency: EXPLICIT')
print('Webhook verification/replay: CARRIED FORWARD')
print('Provider calls / credentials / execution changes: NONE')
print('External acceptance: HOLD / 0 OF 6 CLAIMED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
