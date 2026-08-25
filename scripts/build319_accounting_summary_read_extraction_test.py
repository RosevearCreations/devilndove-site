#!/usr/bin/env python3
"""Build 319 local regression. No Cloudflare resource is contacted."""
from pathlib import Path
import subprocess

BASELINE = "246bee5c9069c15e17b21ac13c3490f0e80fee08"
ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def unchanged(path):
    result = subprocess.run(["git", "diff", "--quiet", BASELINE, "--", path], cwd=ROOT, check=False)
    assert result.returncode == 0, f"Protected Build 319 boundary drifted: {path}"


service = read("functions/api/_lib/accountingSummaryReadService.js")
route = read("functions/api/admin/contracts/accounting-summary-read.js")
legacy = read("functions/api/admin/accounting-summary.js")
contracts = read("public/js/core/dd-module-contracts.mjs")
adapters = read("public/js/core/dd-module-service-adapters.mjs")
branching = read("docs/architecture/SOURCE_CONTROL_BRANCHING.md")

assert "export const BUILD = 319" in service
assert "accounting-summary-read" in service
assert "OWNER = 'accounting'" in service
assert "request_time_schema_mutation: false" in service
assert "FROM accounting_order_records" in service
for forbidden in ("CREATE TABLE", "ALTER TABLE", "DROP TABLE", "INSERT INTO", "UPDATE accounting_order_records", "DELETE FROM"):
    assert forbidden not in service, f"Accounting summary read service contains mutation/DDL token: {forbidden}"

assert "onRequestGet" in route and "onRequestPost" not in route
assert "readAccountingSummary" in route
assert "readAccountingSummary" in legacy
assert "ensureAccountingSchema" not in legacy
assert "request_time_schema_mutation: false" in legacy

assert "export const BUILD = 319" in contracts
assert "export const BUILD = 319" in adapters
for contract_id in (
    "accounting-expenses-read",
    "accounting-writeoffs-read",
    "accounting-general-ledger-read",
    "accounting-summary-read",
):
    assert contract_id in contracts, f"Missing contract catalog entry: {contract_id}"
    assert contract_id in adapters, f"Missing passive adapter: {contract_id}"

assert "main  = retained Production/legacy release line" in branching
assert "dev   = active modular Development/integration line" in branching
assert "Application modules are not Git branches" in branching

for protected in (
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "admin/orders/index.html",
    "functions/api/admin/orders.js",
    "functions/api/admin/update-order-status.js",
    "functions/api/admin/record-payment.js",
    "functions/api/admin/payment-actions.js",
    "functions/api/admin/order-payments.js",
    "wrangler.toml",
):
    unchanged(protected)

print("BUILD 319 ACCOUNTING SUMMARY READ EXTRACTION: PASS")
print("No Cloudflare resource was contacted.")
