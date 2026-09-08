#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 78 — Cart & Checkout Reliability."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "0cf5900464d99328398dd07dca6131cfe9772d4d"
BASE_TREE = "6c406d2e1df9a8d5fd600852c506ec7a43282c6d"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def req(ok: bool, msg: str) -> None:
    if not ok:
        FAIL.append(msg)


def node_check(path: str) -> None:
    result = subprocess.run(["node", "--check", str(ROOT / path)], cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    req(result.returncode == 0, f"JavaScript syntax failed for {path}: {(result.stderr or result.stdout).strip()[-1800:]}")


def node_runtime(path: str) -> None:
    result = subprocess.run(["node", str(ROOT / path)], cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if result.stdout.strip():
        print(result.stdout.strip())
    req(result.returncode == 0, f"Build 78 runtime acceptance failed: {(result.stderr or result.stdout).strip()[-2200:]}")


roadmap = read("docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md")
doc = read("docs/operations/RELEASE_467_BUILD_78_CART_CHECKOUT_RELIABILITY.md")
core = read("public/js/checkout-reliability-core.js")
cart = read("public/js/cart.js")
checkout_page = read("checkout/index.html")
checkout = read("public/js/checkout.js")
handler = read("functions/api/checkout-create-order.js")
middleware = read("functions/api/_middleware.js")
payment = read("functions/api/checkout-prepare-payment.js")
provenance = read("scripts/current_system_gate_provenance_gate.py")
runtime_test = read("scripts/release467_build78_checkout_reliability_runtime_test.mjs")
manifest = json.loads(read("migrations/canonical/manifest.json"))

req("Build 78 — Cart & Checkout Reliability" in roadmap, "roadmap missing Build 78")
req("Build 79 — Stripe Development Acceptance" in roadmap, "roadmap missing Build 79")
req("Release 467 Build 78" in doc and BASE_SHA in doc and BASE_TREE in doc, "Build 78 operating document identity drifted")
for token in (
    "idempotent order creation",
    "server_totals_authoritative: true",
    "inventory_revalidated: true",
    "pricing_revalidated: true",
    "Build 440 write-time oversell guard",
    "Build 79 — Stripe Development Acceptance",
):
    req(token in doc, f"Build 78 operating document missing token: {token}")

expected = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in manifest.get("migrations", [])] == expected, "Build 78 must keep canonical D1 migrations 0001-0004 exactly")
req(not list((ROOT / "migrations/canonical").glob("0005*")), "Build 78 must remain schema-neutral; unexpected canonical migration 0005 exists")

for token in (
    "VERSION = 'R467B78_V1'",
    "MAX_CART_QUANTITY = 99",
    "SHIPPING_FLAT_CENTS = 1500",
    "TAX_ESTIMATE_RATE = 0.13",
    "normalizeCartItems",
    "cartSignature",
    "normalizeFulfillmentChoice",
    "shippingCents",
    "taxEstimateCents",
    "DDCheckoutReliabilityCore",
):
    req(token in core, f"Build 78 reliability core missing token: {token}")
for forbidden in (r"\bfetch\s*\(", r"\blocalStorage\.", r"\bsessionStorage\.", r"\bXMLHttpRequest\b", r"stripe\.com", r"paypal\.com", r"\bsetInterval\s*\("):
    req(not re.search(forbidden, core, re.I), f"Build 78 reliability core gained forbidden behavior: {forbidden}")

for token in (
    "let memoryCart = []",
    "DDCheckoutReliabilityCore?.normalizeCartItems",
    "Math.min(MAX_QTY",
    "persistenceVersion: \"R467B78_V1\"",
    "localStorage.setItem(CART_KEY",
):
    req(token in cart, f"Build 78 cart persistence missing token: {token}")

for token in (
    'id="checkoutRecoveryStatus"',
    'id="fulfillment_method"',
    'value="shipping"',
    'value="pickup"',
    'id="checkoutShippingFields"',
    '/public/js/checkout-reliability-core.js?v=78',
    '/public/js/checkout.js?v=467b78',
    "Stock, price, shipping and tax are checked again by the server",
):
    req(token in checkout_page, f"Build 78 checkout page missing token: {token}")

for token in (
    'ATTEMPT_KEY = "dd_checkout_attempt_v78"',
    "checkout_request_key: attempt.request_key",
    "fulfillment_method: summary.fulfillment_method",
    "Resuming order",
    "idempotent_replay",
    "Order ready. Preparing payment",
    "clearAttempt()",
    "window.DDCart?.clearCart?.()",
    "captureRecoveryLead",
):
    req(token in checkout, f"Build 78 checkout runtime missing token: {token}")
req(checkout.index("writeAttempt({ ...attempt, order_id:") < checkout.index("const paymentData = await preparePayment"), "created order must be persisted before payment preparation")
req(checkout.index("const paymentData = await preparePayment") < checkout.index("window.DDCart?.clearCart?.()"), "cart must not clear before payment preparation succeeds")

for token in (
    "normalizeCheckoutRequestKey",
    "orderNumberForRequestKey",
    "existingOrderPayload",
    "idempotent_replay",
    "checkout_request_key_conflict",
    "WHERE NOT EXISTS (SELECT 1 FROM orders WHERE order_number=?)",
    "authoritativeShippingCents",
    "shipping_cents = authoritativeShippingCents(fulfillment_type)",
    "quantity > 99",
    "checkout_stock_changed",
    "server_totals_authoritative: true",
    "inventory_revalidated: true",
    "pricing_revalidated: true",
):
    req(token in handler, f"Build 78 order API missing token: {token}")
req("body.shipping_cents" not in handler, "Build 78 order API must not trust browser shipping_cents")
req("CREATE TABLE" not in handler and "ALTER TABLE" not in handler, "Build 78 order API must remain request-time schema read-only")

for token in (
    "isPickupRequest",
    "!isPickupRequest(body) && hasAnyAddressValue(body, 'shipping_')",
    "['shipping', 'mixed'].includes(fulfillment)",
    "build440_finished_inventory_commitment_exceeds_available",
):
    req(token in middleware, f"Build 78 middleware compatibility missing token: {token}")

for token in (
    "existingPendingPayments",
    "LOWER(COALESCE(payment_status, '')) IN ('pending', 'authorized')",
):
    req(token in payment, f"Build 78 payment retry must preserve pending-payment reuse token: {token}")

for token in (
    "duplicate Product rows are merged deterministically",
    "cart signature is stable regardless of row order",
    "physical cart supports explicit local pickup",
    "pickup never adds a shipping charge",
    "digital-only cart has no shipping charge",
):
    req(token in runtime_test, f"Build 78 runtime acceptance missing token: {token}")

req("release467_build78_gate.py" in provenance and "Release 467 Build 78" in provenance, "Current System Gate does not chain Build 78")
req("release467_build77_gate.py" in provenance, "Build 77 carried-forward contract was lost")

for path in (
    "public/js/checkout-reliability-core.js",
    "public/js/cart.js",
    "public/js/checkout.js",
    "public/js/commerce-policy-runtime.js",
    "functions/api/checkout-create-order.js",
    "functions/api/_middleware.js",
    "scripts/release467_build78_checkout_reliability_runtime_test.mjs",
):
    node_check(path)
node_runtime("scripts/release467_build78_checkout_reliability_runtime_test.mjs")

if FAIL:
    print("RELEASE 467 BUILD 78 CART & CHECKOUT RELIABILITY: FAIL")
    for item in FAIL:
        print("-", item)
    raise SystemExit(1)

print("RELEASE 467 BUILD 78 CART & CHECKOUT RELIABILITY: PASS")
print("Cart persistence: NORMALIZED + BOUNDED + STORAGE-FALLBACK")
print("Checkout retries: PERSISTED ATTEMPT / ORDER REUSE")
print("Order creation: IDEMPOTENT REQUEST KEY / WHERE-NOT-EXISTS")
print("Stock / price: SERVER REVALIDATED + BUILD 440 WRITE GUARD")
print("Shipping / pickup / digital: EXPLICIT")
print("Browser totals: ESTIMATE ONLY")
print("Server totals: AUTHORITATIVE")
print("Payment failure: RESUME EXISTING ORDER")
print("Provider execution added: NONE")
print("Canonical D1 migration authority: 0001-0004 / UNCHANGED")
