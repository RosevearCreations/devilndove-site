#!/usr/bin/env python3
"""Build 316 local/static regression.

No Cloudflare resource is contacted.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "2edcc42865fe818baa5091f6db55c94dcb6c5363"

EXPECTED_CHANGED = {
    "AI_CONTEXT.md",
    "BUILD316_CHANGED_FILES.md",
    "BUILD316_VALIDATION.md",
    "docs/architecture/BUILD316_ACCOUNTING_EXPENSES_READ_CORRECTION.md",
    "docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md",
    "functions/api/_lib/accountingExpensesReadService.js",
    "functions/api/admin/accounting-expenses.js",
    "functions/api/admin/contracts/accounting-expenses-read.js",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/core/dd-module-service-adapters.mjs",
    "scripts/build316_accounting_expenses_read_correction_test.py",
}

PROTECTED_PATHS = [
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "public/js/admin.js",
    "admin/operations/index.html",
    "admin/customer-documents/index.html",
    "admin/orders/index.html",
    "public/js/admin-orders.js",
    "public/js/admin-order-detail.js",
    "public/js/admin-gift-card-order-redemption.js",
    "public/js/admin-accounting-backend.js",
    "functions/api/admin/orders.js",
    "functions/api/admin/update-order-status.js",
    "functions/api/admin/record-payment.js",
    "functions/api/admin/payment-actions.js",
    "functions/api/admin/order-payments.js",
    "functions/api/admin/contracts/accounting-read.js",
    "functions/api/admin/accounting-summary.js",
    "functions/api/admin/accounting-writeoffs.js",
    "functions/api/admin/accounting-overhead-allocations.js",
    "functions/api/admin/accounting-overhead-product-allocations.js",
    "functions/api/admin/general-ledger-accounts.js",
    "functions/api/admin/product-costs.js",
    "functions/api/_lib/inventoryPostService.js",
    "functions/api/_lib/inventoryReversalService.js",
    "functions/api/_lib/creativeInventoryPostConsumer.js",
    "functions/api/_lib/creativeInventoryReversalConsumer.js",
    "database_full_schema.sql",
    "wrangler.toml",
]


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.exists():
        fail(f"missing required file: {rel}")
    return path.read_text(encoding="utf-8")


def git(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if check and proc.returncode != 0:
        fail(f"git {' '.join(args)} failed: {proc.stderr.strip()}")
    return proc


def require(text: str, needle: str, label: str) -> None:
    if needle not in text:
        fail(f"{label}: missing {needle!r}")


def forbid(text: str, needle: str, label: str) -> None:
    if needle in text:
        fail(f"{label}: forbidden {needle!r}")


def main() -> None:
    changed = {
        line.strip().replace("\\", "/")
        for line in git("diff", "--name-only", f"{BASELINE}...HEAD").stdout.splitlines()
        if line.strip()
    }
    if changed != EXPECTED_CHANGED:
        missing = sorted(EXPECTED_CHANGED - changed)
        extra = sorted(changed - EXPECTED_CHANGED)
        fail(f"changed-file boundary mismatch; missing={missing}, extra={extra}")

    for rel in PROTECTED_PATHS:
        proc = git("diff", "--quiet", BASELINE, "HEAD", "--", rel, check=False)
        if proc.returncode != 0:
            fail(f"protected Build 315 baseline path changed: {rel}")

    service = read("functions/api/_lib/accountingExpensesReadService.js")
    require(service, "export const BUILD = 316;", "expenses read service")
    require(service, "export const CONTRACT_ID = 'accounting-expenses-read';", "expenses read service")
    require(service, "export const OWNER = 'accounting';", "expenses read service")
    require(service, "request_time_schema_mutation: false", "expenses read service")
    require(service, "FROM accounting_expenses ae", "expenses read service")
    require(service, "ae.expense_id AS expense_id", "expenses read service")
    require(service, "aa.expense_id = ae.expense_id", "expenses read service")
    require(service, "ae.expense_id DESC", "expenses read service")
    for token in ("CREATE TABLE", "ALTER TABLE", "DROP TABLE", "INSERT INTO", "DELETE FROM"):
        forbid(service.upper(), token, "expenses read service SQL boundary")

    contract = read("functions/api/admin/contracts/accounting-expenses-read.js")
    require(contract, "readAccountingExpenses", "expenses contract")
    require(contract, "export async function onRequestGet", "expenses contract")
    forbid(contract, "export async function onRequestPost", "expenses contract")
    for token in ("CREATE TABLE", "ALTER TABLE", "DROP TABLE", "INSERT INTO", "DELETE FROM"):
        forbid(contract.upper(), token, "expenses contract SQL boundary")

    legacy = read("functions/api/admin/accounting-expenses.js")
    require(legacy, "readAccountingExpenses", "legacy expenses route")
    require(legacy, "export async function onRequestGet", "legacy expenses route")
    require(legacy, "export async function onRequestPost", "legacy expenses route")
    get_block = legacy.split("export async function onRequestGet", 1)[1].split("export async function onRequestPost", 1)[0]
    require(get_block, "readAccountingExpenses", "legacy expenses GET")
    require(get_block, "request_time_schema_mutation: false", "legacy expenses GET")
    for token in (
        "ensureTable(",
        "ensureAccountingVendorsTable(",
        "ensureAccountingAttachmentsTable(",
        "CREATE TABLE",
        "ALTER TABLE",
        "INSERT INTO",
        "DELETE FROM",
    ):
        forbid(get_block, token, "legacy expenses GET")

    post_block = legacy.split("export async function onRequestPost", 1)[1]
    require(post_block, "const cols = await ensureTable(db);", "legacy expenses POST compatibility")
    require(post_block, "INSERT INTO accounting_expenses", "legacy expenses POST compatibility")
    require(post_block, "auditAdminAction", "legacy expenses POST compatibility")

    contracts = read("public/js/core/dd-module-contracts.mjs")
    require(contracts, "export const BUILD = 316;", "Core contract catalog")
    require(contracts, "contract('accounting-expenses-read', 'accounting', ['operations']", "Core contract catalog")
    require(contracts, "route: '/api/admin/contracts/accounting-expenses-read'", "Core contract catalog")
    require(contracts, "implementationState: 'implemented-read-only-accounting-expenses'", "Core contract catalog")

    adapters = read("public/js/core/dd-module-service-adapters.mjs")
    require(adapters, "export const BUILD = 316;", "Core service adapters")
    require(adapters, "'accounting-expenses-read': '/api/admin/contracts/accounting-expenses-read'", "Core service adapters")
    require(adapters, "'accounting-expenses-read': service('accounting-expenses-read', 'accounting'", "Core service adapters")
    require(adapters, "requestTimeSchemaMutation: data.request_time_schema_mutation === true", "Core service adapters")

    audit = read("docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md")
    require(audit, "application modules are not Git branches", "modular split audit")
    for branch in ("build291-candidate", "build292-candidate", "build293-candidate", "build294-candidate"):
        require(audit, branch, "modular split audit")
    require(audit, "accounting-writeoffs.js", "modular split audit")
    require(audit, "general-ledger-accounts.js", "modular split audit")
    require(audit, "fresh-install schema parity", "modular split audit")

    print("BUILD 316 ACCOUNTING EXPENSES READ CORRECTION: PASS")
    print("No Cloudflare resource was contacted.")


if __name__ == "__main__":
    main()
