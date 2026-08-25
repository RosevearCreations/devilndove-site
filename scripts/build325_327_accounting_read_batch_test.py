#!/usr/bin/env python3
"""Builds 325-327 local regression. No Cloudflare resource is contacted."""
from pathlib import Path
import re
import subprocess

BASELINE = "cf003c0a84452a8c4f4588f7a60b3351731ac697"
ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def unchanged(path):
    result = subprocess.run(["git", "diff", "--quiet", BASELINE, "--", path], cwd=ROOT, check=False)
    assert result.returncode == 0, f"Protected Builds 325-327 boundary drifted: {path}"


def no_read_mutation(text, label):
    for forbidden in ("CREATE TABLE", "ALTER TABLE", "DROP TABLE", "INSERT INTO", "DELETE FROM", "UPDATE accounting_"):
        assert forbidden not in text, f"{label} contains mutation/DDL token: {forbidden}"


item_service = read("functions/api/_lib/accountingItemCostingReadService.js")
item_contract = read("functions/api/admin/contracts/accounting-item-costing-read.js")
item_legacy = read("functions/api/admin/accounting-item-costing.js")
costing = read("functions/api/admin/_costing.js")

journal_service = read("functions/api/_lib/accountingJournalReadService.js")
journal_contract = read("functions/api/admin/contracts/accounting-journal-read.js")
journal_legacy = read("functions/api/admin/accounting-journal.js")

gifi_service = read("functions/api/_lib/accountingGifiNotesReadService.js")
gifi_contract = read("functions/api/admin/contracts/accounting-gifi-notes-read.js")
gifi_legacy = read("functions/api/admin/accounting-gifi-notes.js")
gifi_summary = read("functions/api/admin/accounting-gifi-summary.js")

contracts = read("public/js/core/dd-module-contracts.mjs")
adapters = read("public/js/core/dd-module-service-adapters.mjs")
groups = read("public/js/core/dd-application-module-groups.mjs")

assert "export const BUILD = 325" in item_service
assert "accounting-item-costing-read" in item_service
assert "OWNER = 'accounting'" in item_service
assert "request_time_schema_mutation: false" in item_service
assert "computeMonthlyItemCosting" in item_service
no_read_mutation(item_service, "Build 325 item-costing read service")
for forbidden in ("CREATE TABLE", "ALTER TABLE", "DROP TABLE", "INSERT INTO", "DELETE FROM"):
    assert forbidden not in costing, f"Existing _costing helper contains DDL/write token: {forbidden}"
assert "onRequestGet" in item_contract and "onRequestPost" not in item_contract
assert "readAccountingItemCosting" in item_legacy

assert "export const BUILD = 326" in journal_service
assert "accounting-journal-read" in journal_service
assert "request_time_schema_mutation: false" in journal_service
no_read_mutation(journal_service, "Build 326 journal read service")
assert "onRequestGet" in journal_contract and "onRequestPost" not in journal_contract
get_block = journal_legacy.split("async function handleGet", 1)[1].split("async function handlePost", 1)[0]
assert "readAccountingJournal" in get_block
assert "ensureJournalSchema" not in get_block
assert "CREATE TABLE" not in get_block and "ALTER TABLE" not in get_block
assert "async function ensureJournalSchema" in journal_legacy
assert "async function syncJournal" in journal_legacy and "await ensureJournalSchema(db)" in journal_legacy
assert "onRequestPost" in journal_legacy

assert "export const BUILD = 327" in gifi_service
assert "accounting-gifi-notes-read" in gifi_service
assert "request_time_schema_mutation: false" in gifi_service
no_read_mutation(gifi_service, "Build 327 GIFI notes read service")
assert "onRequestGet" in gifi_contract and "onRequestPost" not in gifi_contract
gifi_get = gifi_legacy.split("export async function onRequestGet", 1)[1].split("export async function onRequestPost", 1)[0]
gifi_post = gifi_legacy.split("export async function onRequestPost", 1)[1]
assert "readAccountingGifiNotes" in gifi_get
assert "ensureAccountingGifiNotesTable" not in gifi_get
assert "await ensureAccountingGifiNotesTable(db)" in gifi_post

for text in (contracts, adapters):
    match = re.search(r"export const BUILD = (\d+);", text)
    assert match and int(match.group(1)) >= 327
    for contract_id in ("accounting-item-costing-read", "accounting-journal-read", "accounting-gifi-notes-read"):
        assert contract_id in text

business_marker = "id: 'business-administration'"
start = groups.find(business_marker)
assert start >= 0, "Business & Administration definition missing"
end = groups.find("}),", start)
section = groups[start:end if end >= 0 else None]
assert "entry: null" in section
assert "runtimeDomains: Object.freeze([])" in section

# Build 327 intentionally leaves the next automatic DDL blocker visible.
assert "await ensureGlSchema(db)" in gifi_summary
assert "CREATE TABLE IF NOT EXISTS general_ledger_accounts" in gifi_summary
assert "ALTER TABLE general_ledger_accounts" in gifi_summary

for protected in (
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "admin/accounting/index.html",
    "admin/orders/index.html",
    "functions/api/admin/accounting-profit-loss.js",
    "wrangler.toml",
):
    unchanged(protected)

print("BUILDS 325-327 ACCOUNTING READ BATCH: PASS")
print("No Cloudflare resource was contacted.")
