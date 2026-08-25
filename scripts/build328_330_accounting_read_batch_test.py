#!/usr/bin/env python3
"""Builds 328-330 local regression. No Cloudflare resource is contacted."""
from pathlib import Path
import re
import subprocess

BASELINE = "f557464892d619592a3ecc31a124ef45d4367f1c"
ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def unchanged(path):
    result = subprocess.run(["git", "diff", "--quiet", BASELINE, "--", path], cwd=ROOT, check=False)
    assert result.returncode == 0, f"Protected Builds 328-330 boundary drifted: {path}"


def no_read_mutation(text, label):
    for forbidden in ("CREATE TABLE", "ALTER TABLE", "DROP TABLE", "INSERT INTO", "DELETE FROM", "UPDATE accounting_"):
        assert forbidden not in text, f"{label} contains mutation/DDL token: {forbidden}"


gifi_service = read("functions/api/_lib/accountingGifiSummaryReadService.js")
gifi_contract = read("functions/api/admin/contracts/accounting-gifi-summary-read.js")
gifi_legacy = read("functions/api/admin/accounting-gifi-summary.js")
period_service = read("functions/api/_lib/accountingPeriodLocksReadService.js")
period_contract = read("functions/api/admin/contracts/accounting-period-locks-read.js")
period_legacy = read("functions/api/admin/accounting-period-locks.js")
attachment_service = read("functions/api/_lib/accountingAttachmentsReadService.js")
attachment_contract = read("functions/api/admin/contracts/accounting-attachments-read.js")
attachment_legacy = read("functions/api/admin/accounting-attachments.js")
contracts = read("public/js/core/dd-module-contracts.mjs")
adapters = read("public/js/core/dd-module-service-adapters.mjs")
groups = read("public/js/core/dd-application-module-groups.mjs")

assert "export const BUILD = 328" in gifi_service
assert "accounting-gifi-summary-read" in gifi_service
assert "OWNER = 'accounting'" in gifi_service
assert "request_time_schema_mutation: false" in gifi_service
no_read_mutation(gifi_service, "Build 328 GIFI summary service")
assert "onRequestGet" in gifi_contract and "onRequestPost" not in gifi_contract
assert "readAccountingGifiSummary" in gifi_legacy
assert "ensureGlSchema" not in gifi_legacy
assert "CREATE TABLE" not in gifi_legacy and "ALTER TABLE" not in gifi_legacy
assert "format') || '').toLowerCase() === 'csv'" in gifi_legacy

assert "export const BUILD = 329" in period_service
assert "accounting-period-locks-read" in period_service
assert "request_time_schema_mutation: false" in period_service
no_read_mutation(period_service, "Build 329 period-lock service")
assert "onRequestGet" in period_contract and "onRequestPost" not in period_contract
period_get = period_legacy.split("export async function onRequestGet", 1)[1].split("export async function onRequestPost", 1)[0]
period_post = period_legacy.split("export async function onRequestPost", 1)[1]
assert "readAccountingPeriodLocks" in period_get
for token in ("ensureAccountingPeriodClosuresTable", "ensureAccountingAttachmentsTable", "ensureAccountingStatementImportsTables"):
    assert token not in period_get, f"Build 329 GET still reaches {token}"
    assert token in period_post, f"Build 329 POST lost write-side compatibility {token}"

assert "export const BUILD = 330" in attachment_service
assert "accounting-attachments-read" in attachment_service
assert "request_time_schema_mutation: false" in attachment_service
no_read_mutation(attachment_service, "Build 330 attachment service")
assert "onRequestGet" in attachment_contract and "onRequestPost" not in attachment_contract
attachment_get = attachment_legacy.split("export async function onRequestGet", 1)[1].split("export async function onRequestPost", 1)[0]
attachment_post = attachment_legacy.split("export async function onRequestPost", 1)[1]
assert "readAccountingAttachments" in attachment_get
assert "ensureAccountingAttachmentsTable" not in attachment_get
assert "await ensureAccountingAttachmentsTable(db)" in attachment_post
assert "bucket.put" in attachment_post

for text in (contracts, adapters):
    match = re.search(r"export const BUILD = (\d+);", text)
    assert match and int(match.group(1)) >= 330
    for contract_id in ("accounting-gifi-summary-read", "accounting-period-locks-read", "accounting-attachments-read"):
        assert contract_id in text

business_marker = "id: 'business-administration'"
start = groups.find(business_marker)
assert start >= 0, "Business & Administration definition missing"
end = groups.find("}),", start)
section = groups[start:end if end >= 0 else None]
assert "entry: null" in section
assert "runtimeDomains: Object.freeze([])" in section

for protected in (
    "functions/api/_lib/accountingItemCostingReadService.js",
    "functions/api/_lib/accountingJournalReadService.js",
    "functions/api/_lib/accountingGifiNotesReadService.js",
    "functions/api/admin/accounting-item-costing.js",
    "functions/api/admin/accounting-journal.js",
    "functions/api/admin/accounting-gifi-notes.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "admin/accounting/index.html",
    "wrangler.toml",
):
    unchanged(protected)

print("BUILDS 328-330 ACCOUNTING READ BATCH: PASS")
print("No Cloudflare resource was contacted.")
