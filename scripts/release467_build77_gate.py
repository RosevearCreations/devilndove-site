#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 77 — Canada-Only Commerce Rules."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "b0ec60ced99f7947168239f35929d5a52d6bb451"
BASE_TREE = "03a596a779379a52929fc46d80f555cb58b07bb0"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def req(ok: bool, msg: str) -> None:
    if not ok:
        FAIL.append(msg)


def node_check(path: str) -> None:
    result = subprocess.run(
        ["node", "--check", str(ROOT / path)],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    req(result.returncode == 0, f"JavaScript syntax failed for {path}: {(result.stderr or result.stdout).strip()[-1800:]}")


def node_runtime(path: str) -> None:
    result = subprocess.run(
        ["node", str(ROOT / path)],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.stdout.strip():
        print(result.stdout.strip())
    req(result.returncode == 0, f"Build 77 runtime acceptance failed: {(result.stderr or result.stdout).strip()[-2200:]}")


doc = read("docs/operations/RELEASE_467_BUILD_77_CANADA_ONLY_COMMERCE_RULES.md")
roadmap = read("docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md")
core = read("public/js/commerce-policy-core.js")
runtime = read("public/js/commerce-policy-runtime.js")
bootstrap = read("public/js/core/dd-public-module-visibility.mjs")
middleware = read("functions/api/_middleware.js")
checkout_handler = read("functions/api/checkout-create-order.js")
payment_handler = read("functions/api/checkout-prepare-payment.js")
checkout_page = read("checkout/index.html")
cart_page = read("public/js/cart-page.js")
provenance = read("scripts/current_system_gate_provenance_gate.py")
runtime_test = read("scripts/release467_build77_commerce_policy_runtime_test.mjs")
manifest = json.loads(read("migrations/canonical/manifest.json"))

req("Build 77 — Canada-Only Commerce Rules" in roadmap, "roadmap missing Build 77")
req("Build 78 — Cart & Checkout Reliability" in roadmap, "roadmap missing Build 78")
req("Release 467 Build 77" in doc and BASE_SHA in doc and BASE_TREE in doc, "Build 77 operating document identity drifted")
for token in (
    "billing country is **Canada only**",
    "physical-order shipping country is **Canada only**",
    "U.S. storefront sales are **disabled**",
    "U.S. storefront shipping is **disabled**",
    "public/js/commerce-policy-core.js",
    "Build 78 — Cart & Checkout Reliability",
):
    req(token in doc, f"Build 77 operating document missing token: {token}")

expected = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in manifest.get("migrations", [])] == expected, "Build 77 must not alter canonical D1 migration authority")
req(not list((ROOT / "migrations/canonical").glob("0005*")), "Build 77 must remain schema-neutral; unexpected canonical migration 0005 exists")

for token in (
    "COMMERCE_POLICY_VERSION = 'R467B77_V1'",
    "selling_country_code: 'CA'",
    "allowed_shipping_country_codes: Object.freeze(['CA'])",
    "allowed_billing_country_codes: Object.freeze(['CA'])",
    "currency: 'CAD'",
    "united_states_sales_enabled: false",
    "united_states_shipping_enabled: false",
    "validateCanadianAddress",
    "validateCommerceEnvelope",
    "isCanadianPostalCode",
    "CANADIAN_PROVINCES",
):
    req(token in core, f"Build 77 shared commerce core missing token: {token}")

for forbidden in (
    r"\bfetch\s*\(",
    r"\bXMLHttpRequest\b",
    r"\bsetInterval\s*\(",
    r"\bsetTimeout\s*\(",
    r"\blocalStorage\.",
    r"\bsessionStorage\.",
    r"stripe\.com",
    r"paypal\.com",
    r"\b(?:INSERT|UPDATE|DELETE|REPLACE)\s+(?:INTO|FROM|orders|payments|products)\b",
):
    req(not re.search(forbidden, core, re.I), f"Build 77 shared policy core gained forbidden behavior: {forbidden}")

# Browser routing and fail-closed address UX reuse the same ESM core.
for token in (
    "from './commerce-policy-core.js'",
    "ddCommercePolicyBanner",
    "Canada-only storefront",
    "lockCountry('shipping_country')",
    "lockCountry('billing_country')",
    "replaceProvinceInput('shipping_province')",
    "replaceProvinceInput('billing_province')",
    "validateCanadianAddress",
    "event.stopImmediatePropagation()",
    "dd:commerce-policy-ready",
):
    req(token in runtime, f"Build 77 browser runtime missing token: {token}")
req("fetch(" not in runtime and "setInterval(" not in runtime, "Build 77 browser commerce runtime must not fetch or poll")
req("/public/js/commerce-policy-runtime.js?v=77" in bootstrap, "public module bootstrap does not load Build 77 commerce runtime")
for route in ("/shop/", "/cart/", "/checkout/"):
    req(route in bootstrap, f"Build 77 public bootstrap missing commerce route: {route}")

# API middleware must import the exact shared core and run policy before provider execution.
for token in (
    "from '../../public/js/commerce-policy-core.js'",
    "validateCanadianAddress",
    "validateCommerceEnvelope",
    "url.pathname === '/api/checkout-create-order'",
    "url.pathname === '/api/checkout-prepare-payment'",
    "billing_country",
    "shipping_province",
    "shipping_postal_code",
    "commerce_policy_version: COMMERCE_POLICY.version",
    "provider_network_call_performed: false",
):
    req(token in middleware, f"Build 77 API middleware missing token: {token}")
req(middleware.index("const commerceGuard = await guardCommercePolicy(context)") < middleware.index("const paymentGuard = await guardPaymentProviderExecution(context)"), "commerce policy must execute before provider execution guard")

# Carried endpoint/provider guards must not contradict the shared rule.
req("Devil n Dove storefront shipping is currently limited to Canada." in checkout_handler, "carried checkout handler lost Canada shipping defence-in-depth")
req("['ca', 'can', 'canada']" in checkout_handler, "carried checkout handler Canada aliases drifted")
req('shipping_address_collection[allowed_countries][0]' in payment_handler and '"CA"' in payment_handler, "Stripe allowed-country guard must remain CA")

# Static checkout/cart messaging must agree before enhancement JS finishes loading.
for token in (
    "Canadian billing addresses",
    "ships physical orders only within Canada",
    "Country (Canada only)",
    "Province / Territory",
    "Postal Code",
    "readonly=\"\"",
    "U.S. sales and shipping are currently unavailable",
):
    req(token in checkout_page, f"Build 77 checkout page missing Canada-only token: {token}")
req("Province / State" not in checkout_page and "Postal / ZIP Code" not in checkout_page, "checkout source still presents U.S.-style address labels")
for token in (
    "Canada-only storefront:",
    "physical orders ship within Canada only",
    "totals and payment preparation use CAD",
    "valid Canadian province/territory and postal code",
):
    req(token in cart_page, f"Build 77 cart messaging missing token: {token}")

for token in (
    "U.S. storefront sales and shipping remain explicitly closed",
    "U.S.-style ZIP codes do not pass",
    "non-Canadian billing country",
    "non-CAD storefront currency",
):
    req(token in runtime_test, f"Build 77 runtime acceptance missing token: {token}")

req("release467_build77_gate.py" in provenance and "Release 467 Build 77" in provenance, "Current System Gate does not chain Build 77")
req("release467_build76_gate.py" in provenance, "Build 76 carried-forward contract was lost")

for path in (
    "public/js/commerce-policy-core.js",
    "public/js/commerce-policy-runtime.js",
    "public/js/core/dd-public-module-visibility.mjs",
    "functions/api/_middleware.js",
    "public/js/cart-page.js",
    "scripts/release467_build77_commerce_policy_runtime_test.mjs",
):
    node_check(path)
node_runtime("scripts/release467_build77_commerce_policy_runtime_test.mjs")

if FAIL:
    print("RELEASE 467 BUILD 77 CANADA-ONLY COMMERCE RULES: FAIL")
    for item in FAIL:
        print("-", item)
    raise SystemExit(1)

print("RELEASE 467 BUILD 77 CANADA-ONLY COMMERCE RULES: PASS")
print("Storefront country authority: CA / CANADA ONLY")
print("Storefront currency authority: CAD ONLY")
print("Billing country: CANADA ONLY")
print("Physical shipping country: CANADA ONLY")
print("U.S. sales / shipping: CLOSED")
print("Province / territory authority: 13 CANADIAN REGIONS")
print("Canadian postal validation: ENFORCED")
print("Browser/server policy core: SHARED")
print("Provider execution added by Build 77: NONE")
print("D1 / R2 / schema mutation added by Build 77: NONE")
print("Canonical D1 migration authority: 0001-0004 / UNCHANGED")
