#!/usr/bin/env python3
"""Build 321 local regression. No Cloudflare resource is contacted."""
from pathlib import Path
import re
import subprocess

BASELINE = "5e16845202a2f2b870f02420703f7bf0c3089a5b"
ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def unchanged(path):
    result = subprocess.run(["git", "diff", "--quiet", BASELINE, "--", path], cwd=ROOT, check=False)
    assert result.returncode == 0, f"Protected Build 321 boundary drifted: {path}"


service = read("functions/api/_lib/accountingOverheadProductAllocationsReadService.js")
route = read("functions/api/admin/contracts/accounting-overhead-product-allocations-read.js")
legacy = read("functions/api/admin/accounting-overhead-product-allocations.js")
contracts = read("public/js/core/dd-module-contracts.mjs")
adapters = read("public/js/core/dd-module-service-adapters.mjs")

assert "export const BUILD = 321" in service
assert "accounting-overhead-product-allocations-read" in service
assert "OWNER = 'accounting'" in service
assert "request_time_schema_mutation: false" in service
assert "FROM accounting_overhead_product_allocations" in service
assert "product_join_enabled" in service
for forbidden in ("CREATE TABLE", "CREATE INDEX", "ALTER TABLE", "DROP TABLE", "INSERT INTO", "UPDATE accounting_overhead_product_allocations", "DELETE FROM"):
    assert forbidden not in service, f"Build 321 read service contains mutation/DDL token: {forbidden}"

assert "onRequestGet" in route and "onRequestPost" not in route
assert "readAccountingOverheadProductAllocations" in route
assert "readAccountingOverheadProductAllocations" in legacy
get_block = legacy.split("export async function onRequestGet", 1)[1].split("export async function onRequestPost", 1)[0]
assert "ensureTable" not in get_block
post_block = legacy.split("export async function onRequestPost", 1)[1]
assert "await ensureTable(db)" in post_block
assert "INSERT INTO accounting_overhead_product_allocations" in post_block
assert "DELETE FROM accounting_overhead_product_allocations" in post_block
assert "FROM products" in post_block

for text in (contracts, adapters):
    match = re.search(r"export const BUILD = (\d+);", text)
    assert match and int(match.group(1)) >= 321
    assert "accounting-overhead-product-allocations-read" in text

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

print("BUILD 321 ACCOUNTING OVERHEAD PRODUCT ALLOCATIONS READ EXTRACTION: PASS")
print("No Cloudflare resource was contacted.")
