#!/usr/bin/env python3
"""Build 318 local regression. No Cloudflare resource is contacted."""
from pathlib import Path
import re
import subprocess

BASELINE = "7ffceabb8a11d7e3f4e4b3dfc4ea923811e28a96"
ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def unchanged(path):
    result = subprocess.run(["git", "diff", "--quiet", BASELINE, "--", path], cwd=ROOT, check=False)
    assert result.returncode == 0, f"Protected Build 318 boundary drifted: {path}"


service = read("functions/api/_lib/accountingGeneralLedgerReadService.js")
route = read("functions/api/admin/contracts/accounting-general-ledger-read.js")
compat = read("functions/api/admin/general-ledger-accounts.js")
contracts = read("public/js/core/dd-module-contracts.mjs")
adapters = read("public/js/core/dd-module-service-adapters.mjs")

assert "export const BUILD = 318" in service
assert "accounting-general-ledger-read" in service
assert "OWNER = 'accounting'" in service
assert "request_time_schema_mutation: false" in service
assert "FROM general_ledger_accounts" in service
for forbidden in ("CREATE TABLE", "ALTER TABLE", "DROP TABLE", "INSERT INTO", "UPDATE general_ledger_accounts", "DELETE FROM"):
    assert forbidden not in service, f"General Ledger read service contains mutation/DDL token: {forbidden}"

assert "onRequestGet" in route and "onRequestPost" not in route
assert "readAccountingGeneralLedger" in route

get_part = compat.split("export async function onRequestGet", 1)[1].split("export async function onRequestPost", 1)[0]
post_part = compat.split("export async function onRequestPost", 1)[1]
assert "readAccountingGeneralLedger" in get_part
assert "ensureTable(db)" not in get_part
assert "starter_mapping_count" in get_part
assert "ensureTable(db)" in post_part
assert "apply_starter_gifi_mappings" in post_part
assert "INSERT INTO general_ledger_accounts" in post_part

catalog_build = int(re.search(r"export const BUILD = (\d+);", contracts).group(1))
adapter_build = int(re.search(r"export const BUILD = (\d+);", adapters).group(1))
assert catalog_build >= 318 and adapter_build >= 318
assert "contract('accounting-general-ledger-read', 'accounting'" in contracts
assert "'accounting-general-ledger-read': service('accounting-general-ledger-read', 'accounting'" in adapters

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

print("BUILD 318 GENERAL LEDGER READ EXTRACTION: PASS")
print("No Cloudflare resource was contacted.")
