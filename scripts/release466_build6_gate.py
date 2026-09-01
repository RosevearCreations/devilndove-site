#!/usr/bin/env python3
"""Release 466 Build 6 — Development-only provider acceptance runner source gate."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = ROOT / 'functions' / 'api' / 'admin' / 'provider-acceptance-runner.js'
UI = ROOT / 'public' / 'js' / 'admin-provider-acceptance-runner.js'
PAGE = ROOT / 'admin' / 'release-control' / 'external-commercial-readiness' / 'index.html'


def fail(message: str) -> None:
    raise SystemExit(f'RELEASE 466 BUILD 6 GATE: FAIL — {message}')


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read(path: Path) -> str:
    require(path.is_file(), f'missing required file: {path.relative_to(ROOT)}')
    return path.read_text(encoding='utf-8')


def main() -> None:
    api = read(API)
    ui = read(UI)
    page = read(PAGE)

    require("const BUILD = 6" in api, 'runner must identify Build 6')
    require("paymentExecutionStatus" in api, 'runner must use canonical payment execution boundary')
    require("preparePaymentPost" in api and "../checkout-prepare-payment.js" in api,
            'runner must reuse existing checkout preparation implementation')
    require("paymentActionPost" in api and "./payment-actions.js" in api,
            'runner must reuse existing guarded refund implementation')
    require("confirm_provider_test !== true" in api,
            'provider network actions must require explicit confirmation')
    require("provider_acceptance_development_only" in api,
            'runner must fail closed outside Development')
    require("production_mutation: false" in api,
            'runner responses must preserve Production-mutation boundary')
    require("secret_values_emitted: false" in api,
            'runner must explicitly keep secret values out of responses')
    require(not re.search(r'env\.PAYMENT_PROVIDER_MUTATIONS_ENABLED\s*=', api),
            'runner must not assign/open the provider mutation switch')
    require("PAYMENT_PROVIDER_MUTATIONS_ENABLED=1" in api,
            'runner may expose the safe operator switch name but must leave it externally controlled')
    require("https://api.stripe.com" not in api and "https://api-m.paypal.com" not in api,
            'runner must not implement direct provider transports or live PayPal hosts')
    require("https://api-m.sandbox.paypal.com" not in api,
            'runner must reuse existing provider transports instead of duplicating sandbox transport')

    require("STRIPE_PUBLISHABLE_KEY" in api and "STRIPE_SECRET_KEY" in api and "STRIPE_WEBHOOK_SECRET" in api,
            'Stripe canonical Development references must be enforced')
    require("PAYPAL_CLIENT_ID" in api and "PAYPAL_SECRET" in api and "PAYPAL_WEBHOOK_ID" in api and "PAYPAL_ENV" in api,
            'PayPal canonical sandbox references must be enforced')
    require("PAYPAL_CLIENT_SECRET" not in api and "PAYPAL_CLIENT_SECRET" not in ui and "PAYPAL_CLIENT_SECRET" not in page,
            'Build 6 current authority must not teach the stale PAYPAL_CLIENT_SECRET name')

    ddl = re.findall(r'\b(?:CREATE|ALTER|DROP)\s+TABLE\b', api, flags=re.I)
    require(not ddl, f'runner must remain schema-neutral; found DDL tokens: {ddl}')
    require("RELEASE466_EXTERNAL_ACCEPTANCE_TEST" in api,
            'test orders must be clearly marked as Development acceptance records')
    require("amountCents = 100" in api,
            'acceptance order must remain a bounded $1.00 CAD test order')
    require("cs_test_" in api,
            'Stripe acceptance evidence must require a Stripe test Checkout session identity')
    require("process_status).toLowerCase() === 'duplicate'" in api,
            'duplicate replay must be derived from webhook replay authority')
    require("provider_sync_status,'')) = 'succeeded'" in api,
            'refund acceptance must require provider-synchronized success evidence')

    require("providerAcceptanceRunnerMount" in page,
            'external readiness page must expose the provider runner mount')
    require("providerAcceptanceRefresh" in page,
            'external readiness page must expose explicit evidence refresh')
    require("admin-provider-acceptance-runner.js?v=466" in page,
            'external readiness page must load Build 6 runner UI')
    require(len(re.findall(r'<h1(?:\s|>)', page, flags=re.I)) == 1,
            'external readiness page must retain exactly one H1')

    require("/api/admin/provider-acceptance-runner" in ui,
            'runner UI must use the canonical admin acceptance endpoint')
    require("confirm_provider_test:true" in ui,
            'runner UI must send explicit provider-test confirmation')
    require("Prepare Stripe test Checkout" in ui,
            'runner UI must distinguish Stripe test Checkout')
    require("Prepare PayPal sandbox approval" in ui,
            'runner UI must distinguish PayPal sandbox approval')
    require("Refresh verified evidence" in page,
            'runner must expose a no-provider-call evidence refresh')
    require("target=\"_blank\"" in ui and "rel=\"noopener noreferrer\"" in ui,
            'provider-hosted completion links must open safely')
    require("PAYMENT_PROVIDER_MUTATIONS_ENABLED=1" in page,
            'refund proof UI must explain the explicit mutation gate')
    require("/api/stripe-webhook" in api and "/api/paypal-webhook" in api,
            'runner must surface exact application webhook paths')
    require("access_policy_note" in api and "Cloudflare Access" in api,
            'runner API must preserve the provider-reachability/Access warning')
    require("webhook.access_policy_note" in ui and "Cloudflare Access" in ui,
            'runner UI must render the provider-reachability/Access warning')

    print('RELEASE 466 BUILD 6 PROVIDER ACCEPTANCE RUNNER: PASS')
    print('Provider transports duplicated: NO')
    print('Default provider execution: CLOSED')
    print('Development-only execution guard: REQUIRED')
    print('Stripe mode: TEST ONLY')
    print('PayPal mode: SANDBOX ONLY')
    print('Acceptance derived from verified evidence: YES')
    print('Schema change: NONE')
    print('Production mutation: ZERO')


if __name__ == '__main__':
    main()
