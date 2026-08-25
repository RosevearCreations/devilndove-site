#!/usr/bin/env python3
"""Build 416 Development browser-gate preflight.

Validates the source-side read/mutation boundaries for Customer Documents,
Gift Cards, and Orders without contacting Cloudflare or performing any write.
Live Development browser proof remains required after this local preflight.
"""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def fail(message: str) -> int:
    print(f"BUILD 416 BROWSER GATE PREFLIGHT: FAIL — {message}")
    return 1


def require(text: str, needles, label: str) -> int:
    missing = [needle for needle in needles if needle not in text]
    if missing:
        return fail(f"{label} missing: {', '.join(missing)}")
    return 0


def branch_name() -> str:
    result = subprocess.run(
        ["git", "branch", "--show-current"],
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    return result.stdout.strip() if result.returncode == 0 else ""


def main() -> int:
    if branch_name() != "dev":
        return fail("current branch must be dev")

    config = read("wrangler.toml")
    if 'name = "devilndove-site-dev"' not in config:
        return fail("wrangler.toml Pages project is not devilndove-site-dev")
    if 'database_name = "devilndove-dev"' not in config:
        return fail("wrangler.toml D1 database is not devilndove-dev")

    runtime = read("public/js/modules/commerce-operations/runtime.mjs")
    if require(runtime, [
        "const BUILD = 397;",
        "const CUSTOMER_DOCUMENTS_REQUIRED_SERVICES = Object.freeze(['operations-customer-documents-read']);",
        "const GIFT_CARDS_REQUIRED_SERVICES = Object.freeze(['operations-gift-cards-read']);",
        "customerDocumentsMutationOwnership: false",
        "giftCardsMutationOwnership: false",
        "ownsOperationsMutations: false",
        "createsNetworkTransport: false",
    ], "Commerce Operations runtime"):
        return 1

    customer_page = read("admin/customer-documents/index.html")
    customer_read = read("functions/api/admin/contracts/operations-customer-documents-read.js")
    customer_service = read("public/js/modules/commerce-operations/operations-customer-documents-read-service.mjs")
    customer_bridge = read("public/js/admin-customer-documents-contract-bridge.js")

    if require(customer_page, [
        "/public/js/admin.js?v=397",
        "/public/js/admin-customer-documents-contract-bridge.js?v=415",
    ], "Customer Documents page"):
        return 1
    if require(customer_read, [
        "Build 397 Operations-owned Customer Documents GET-only read contract",
        "export { BUILD, CONTRACT_ID, OWNER };",
        "export async function onRequestGet",
        "request_time_schema_mutation: false",
    ], "Customer Documents read contract"):
        return 1
    if "onRequestPost" in customer_read:
        return fail("Customer Documents read contract is no longer GET-only")
    if require(customer_service, [
        "export const BUILD = 397;",
        "mode: 'read-only-http'",
        "passiveRegistration: true",
        "createsNetworkTransport: false",
        "mutationOwnershipMoved: false",
    ], "Customer Documents passive service"):
        return 1
    if require(customer_bridge, [
        "build: 415",
        "readContractBuild: 397",
        "writeContractBuild: 414",
        "/api/admin/contracts/operations-customer-documents-read",
        "/api/admin/contracts/operations-customer-documents-write",
        "createsNetworkTransport: false",
    ], "Customer Documents bridge"):
        return 1
    print("CUSTOMER DOCUMENTS SOURCE GATE: PASS")

    gift_page = read("admin/gift-cards/index.html")
    gift_read = read("functions/api/admin/contracts/operations-gift-cards-read.js")
    gift_service = read("public/js/modules/commerce-operations/operations-gift-cards-read-service.mjs")
    gift_ui = read("public/js/admin-gift-cards.js")

    if require(gift_page, [
        "/public/js/admin.js?v=397",
        "/public/js/admin-gift-cards.js?v=407",
    ], "Gift Cards page cache keys"):
        return 1
    if require(gift_read, [
        "export const BUILD = 385;",
        "export const MUTATION_AUTHORITY_BUILD = 407;",
        "export async function onRequestGet",
        "request_time_schema_mutation: false",
        "request_time_default_seeding: false",
        "/api/admin/contracts/operations-gift-card-action-write",
        "/api/admin/contracts/operations-gift-card-template-write",
        "/api/admin/contracts/operations-gift-card-provider-send-write",
        "/api/admin/contracts/operations-gift-card-abuse-write",
    ], "Gift Cards read contract"):
        return 1
    if "onRequestPost" in gift_read:
        return fail("Gift Cards read contract is no longer GET-only")
    if require(gift_service, [
        "export const CONTRACT_BUILD = 385;",
        "mode: 'read-only-http'",
        "passiveRegistration: true",
        "createsNetworkTransport: false",
        "mutationOwnershipMoved: false",
    ], "Gift Cards passive service"):
        return 1
    if require(gift_ui, [
        "document.documentElement.dataset.ddGiftCardMutationUiBuild = '407';",
        "/api/admin/contracts/operations-gift-card-action-write",
        "/api/admin/contracts/operations-gift-card-template-write",
        "/api/admin/contracts/operations-gift-card-provider-send-write",
        "/api/admin/contracts/operations-gift-card-abuse-write",
    ], "Gift Cards mutation UI"):
        return 1
    print("GIFT CARDS SOURCE GATE: PASS")

    orders_page = read("admin/orders/index.html")
    order_bridge = read("public/js/admin-order-contract-bridge.js")
    payment_contract = read("functions/api/admin/contracts/operations-payment-action-write.js")

    if require(orders_page, [
        "/public/js/admin.js?v=397",
        "/public/js/admin-order-contract-bridge.js?v=408",
    ], "Orders page cache keys"):
        return 1
    if require(order_bridge, [
        "build: 408",
        "/api/admin/contracts/operations-order-status-write",
        "/api/admin/contracts/operations-order-fulfillment-write",
        "/api/admin/contracts/operations-payment-action-write",
        "createsNetworkTransport: false",
    ], "Orders contract bridge"):
        return 1
    if require(payment_contract, [
        "export const BUILD = 409;",
        "PAYMENT_PROVIDER_MUTATIONS_ENABLED",
        "providerConfirmationField: 'provider_sync_confirmed'",
        "providerSyncRequiresBothGates: true",
        "const providerEnabled = String(context.env?.[PROVIDER_ENABLE_FLAG] || '').trim() === '1';",
        "const providerConfirmed = body.provider_sync_confirmed === true;",
        "if (providerRequested && !(providerEnabled && providerConfirmed))",
    ], "Payment provider fail-closed gate"):
        return 1
    print("ORDERS / PAYMENT SOURCE GATE: PASS")

    print()
    print("BUILD 416 DEVELOPMENT BROWSER GATE PREFLIGHT: PASS")
    print("No Cloudflare resource was contacted.")
    print("LIVE DEVELOPMENT BROWSER PROOF: REQUIRED")
    print("PRODUCTION PROMOTION: CLOSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
