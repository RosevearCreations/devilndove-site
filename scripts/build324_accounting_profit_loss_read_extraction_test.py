#!/usr/bin/env python3
"""Build 324 local regression. No Cloudflare resource is contacted."""
from pathlib import Path
import re
import subprocess

BASELINE = "b23a98a557721319afe73f5707563aa9703901f4"
ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def unchanged(path):
    result = subprocess.run(["git", "diff", "--quiet", BASELINE, "--", path], cwd=ROOT, check=False)
    assert result.returncode == 0, f"Protected Build 324 boundary drifted: {path}"


service = read("functions/api/_lib/accountingProfitLossReadService.js")
route = read("functions/api/admin/contracts/accounting-profit-loss-read.js")
legacy = read("functions/api/admin/accounting-profit-loss.js")
contracts = read("public/js/core/dd-module-contracts.mjs")
adapters = read("public/js/core/dd-module-service-adapters.mjs")
report = read("public/js/admin-accounting-report.js")
groups = read("public/js/core/dd-application-module-groups.mjs")

assert "export const BUILD = 324" in service
assert "accounting-profit-loss-read" in service
assert "OWNER = 'accounting'" in service
assert "request_time_schema_mutation: false" in service
assert "authority_tables: AUTHORITY_TABLES" in service
for expected in (
    "FROM orders",
    "FROM accounting_expenses",
    "FROM accounting_writeoffs",
    "FROM accounting_overhead_allocations",
    "FROM general_ledger_accounts",
):
    assert expected in service, f"Build 324 service is missing expected read: {expected}"

for forbidden in (
    "CREATE TABLE",
    "ALTER TABLE",
    "DROP TABLE",
    "INSERT INTO",
    "DELETE FROM",
    "UPDATE accounting_",
):
    assert forbidden not in service, f"Build 324 read service contains mutation/DDL token: {forbidden}"

assert "onRequestGet" in route and "onRequestPost" not in route
assert "readAccountingProfitLoss" in route
assert "readAccountingProfitLoss" in legacy
assert "CREATE TABLE" not in legacy
assert "ALTER TABLE" not in legacy
assert "/api/admin/accounting-profit-loss?month=" in report

for text in (contracts, adapters):
    match = re.search(r"export const BUILD = (\d+);", text)
    assert match and int(match.group(1)) >= 324
    assert "accounting-profit-loss-read" in text

business_marker = "id: 'business-administration'"
start = groups.find(business_marker)
assert start >= 0, "Business & Administration definition missing"
end = groups.find("}),", start)
section = groups[start:end if end >= 0 else None]
assert "entry: null" in section
assert "runtimeDomains: Object.freeze([])" in section

for protected in (
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "admin/accounting/index.html",
    "admin/orders/index.html",
    "functions/api/admin/accounting-journal.js",
    "functions/api/admin/accounting-item-costing.js",
    "functions/api/admin/_costing.js",
    "wrangler.toml",
):
    unchanged(protected)

print("BUILD 324 ACCOUNTING PROFIT/LOSS READ EXTRACTION: PASS")
print("No Cloudflare resource was contacted.")
