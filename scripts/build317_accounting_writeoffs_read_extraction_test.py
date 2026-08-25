#!/usr/bin/env python3
"""Build 317 local regression. No Cloudflare resource is contacted."""
from pathlib import Path
import re
import subprocess

BASELINE = "343a67de711234f193614f38e83a46122e205197"
ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def unchanged(path):
    result = subprocess.run(
        ["git", "diff", "--quiet", BASELINE, "--", path],
        cwd=ROOT,
        check=False,
    )
    assert result.returncode == 0, f"Protected Build 317 boundary drifted: {path}"


service = read("functions/api/_lib/accountingWriteoffsReadService.js")
route = read("functions/api/admin/contracts/accounting-writeoffs-read.js")
compat = read("functions/api/admin/accounting-writeoffs.js")
contracts = read("public/js/core/dd-module-contracts.mjs")
adapters = read("public/js/core/dd-module-service-adapters.mjs")

assert "export const BUILD = 317" in service
assert "accounting-writeoffs-read" in service
assert "OWNER = 'accounting'" in service
assert "request_time_schema_mutation: false" in service
assert "FROM accounting_writeoffs aw" in service
assert "aw.writeoff_id" in service
for forbidden in ("CREATE TABLE", "ALTER TABLE", "DROP TABLE", "INSERT INTO", "UPDATE accounting_writeoffs", "DELETE FROM"):
    assert forbidden not in service, f"Read service contains mutation/DDL token: {forbidden}"

assert "onRequestGet" in route
assert "onRequestPost" not in route
assert "readAccountingWriteoffs" in route

get_part = compat.split("export async function onRequestGet", 1)[1].split("export async function onRequestPost", 1)[0]
post_part = compat.split("export async function onRequestPost", 1)[1]
assert "readAccountingWriteoffs" in get_part
assert "ensureTable(db)" not in get_part
assert "ensureTable(db)" in post_part
assert "INSERT INTO accounting_writeoffs" in post_part

catalog_build = int(re.search(r"export const BUILD = (\d+);", contracts).group(1))
adapter_build = int(re.search(r"export const BUILD = (\d+);", adapters).group(1))
assert catalog_build >= 317
assert adapter_build >= 317
assert "contract('accounting-writeoffs-read', 'accounting'" in contracts
assert "'/api/admin/contracts/accounting-writeoffs-read'" in adapters
assert "'accounting-writeoffs-read': service('accounting-writeoffs-read', 'accounting'" in adapters

for protected in (
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "functions/api/admin/orders.js",
    "functions/api/admin/update-order-status.js",
    "functions/api/admin/record-payment.js",
    "functions/api/admin/payment-actions.js",
    "functions/api/admin/order-payments.js",
    "wrangler.toml",
):
    unchanged(protected)

print("BUILD 317 ACCOUNTING WRITEOFFS READ EXTRACTION: PASS")
print("No Cloudflare resource was contacted.")
