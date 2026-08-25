#!/usr/bin/env python3
"""Build 320 local regression. No Cloudflare resource is contacted."""
from pathlib import Path
import re
import subprocess

BASELINE = "c5ad0709e0789d8562973e2adeeb569a177ec8b9"
ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def unchanged(path):
    result = subprocess.run(["git", "diff", "--quiet", BASELINE, "--", path], cwd=ROOT, check=False)
    assert result.returncode == 0, f"Protected Build 320 boundary drifted: {path}"


service = read("functions/api/_lib/accountingOverheadAllocationsReadService.js")
route = read("functions/api/admin/contracts/accounting-overhead-allocations-read.js")
legacy = read("functions/api/admin/accounting-overhead-allocations.js")
contracts = read("public/js/core/dd-module-contracts.mjs")
adapters = read("public/js/core/dd-module-service-adapters.mjs")

assert "export const BUILD = 320" in service
assert "accounting-overhead-allocations-read" in service
assert "OWNER = 'accounting'" in service
assert "request_time_schema_mutation: false" in service
assert "FROM accounting_overhead_allocations" in service
for forbidden in ("CREATE TABLE", "ALTER TABLE", "DROP TABLE", "INSERT INTO", "UPDATE accounting_overhead_allocations", "DELETE FROM"):
    assert forbidden not in service, f"Build 320 read service contains mutation/DDL token: {forbidden}"

assert "onRequestGet" in route and "onRequestPost" not in route
assert "readAccountingOverheadAllocations" in route
assert "readAccountingOverheadAllocations" in legacy
get_block = legacy.split("export async function onRequestGet", 1)[1].split("export async function onRequestPost", 1)[0]
assert "ensureTable" not in get_block
post_block = legacy.split("export async function onRequestPost", 1)[1]
assert "await ensureTable(db)" in post_block
assert "assertAccountingPeriodOpen" in post_block
assert "INSERT INTO accounting_overhead_allocations" in post_block

for text in (contracts, adapters):
    match = re.search(r"export const BUILD = (\d+);", text)
    assert match and int(match.group(1)) >= 320
    assert "accounting-overhead-allocations-read" in text

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

print("BUILD 320 ACCOUNTING OVERHEAD ALLOCATIONS READ EXTRACTION: PASS")
print("No Cloudflare resource was contacted.")
