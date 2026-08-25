from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def require(text: str, needle: str, label: str) -> None:
    if needle not in text:
        raise AssertionError(f"Missing {label}: {needle}")


page = read("admin/accounting/index.html")
groups = read("public/js/core/dd-application-module-groups.mjs")
contracts = read("public/js/core/dd-module-contracts.mjs")

require(page, '/public/js/admin.js?v=323', "Build 323 verified admin runtime bridge")

for script in (
    "admin-accounting-report.js",
    "admin-accounting-backend.js",
    "admin-accounting-t2-presets.js",
    "admin-accounting-advanced.js",
    "admin-accounting-imports.js",
    "admin-accounting-statement-profiles.js",
    "admin-accounting-close-workflow.js",
    "admin-accounting-evidence-check.js",
):
    require(page, script, f"Accounting page dependency {script}")

business_marker = "id: 'business-administration'"
start = groups.find(business_marker)
if start < 0:
    raise AssertionError("Business & Administration application-module definition is missing.")
end = groups.find("}),", start)
section = groups[start:end if end >= 0 else None]
require(section, "entry: null", "Business & Administration runtime remains inactive")
require(section, "runtimeDomains: Object.freeze([])", "Business & Administration has no active runtime domains")

covered_contracts = (
    "accounting-expenses-read",
    "accounting-writeoffs-read",
    "accounting-general-ledger-read",
    "accounting-overhead-allocations-read",
    "accounting-overhead-product-allocations-read",
    "accounting-product-costs-read",
)
for contract_id in covered_contracts:
    require(contracts, f"contract('{contract_id}'", f"owned read contract {contract_id}")

sources = "\n".join(
    read(path)
    for path in (
        "public/js/admin-accounting-report.js",
        "public/js/admin-accounting-backend.js",
        "public/js/admin-accounting-advanced.js",
        "public/js/admin-accounting-imports.js",
        "public/js/admin-accounting-statement-profiles.js",
        "public/js/admin-accounting-close-workflow.js",
        "public/js/admin-accounting-evidence-check.js",
    )
)

blocking_reads = (
    "/api/admin/accounting-profit-loss",
    "/api/admin/accounting-item-costing",
    "/api/admin/accounting-journal",
    "/api/admin/accounting-gifi-notes",
    "/api/admin/accounting-gifi-summary",
    "/api/admin/accounting-period-locks",
    "/api/admin/db-sanity",
    "/api/admin/accounting-vendors",
    "/api/admin/accounting-recurring-expense-rules",
    "/api/admin/accounting-attachments",
    "/api/admin/accounting-reconciliation",
    "/api/admin/accounting-year-end-close",
    "/api/admin/accounting-statement-imports",
    "/api/admin/accounting-reconciliation-exceptions",
    "/api/admin/accounting-sales-tax-filing",
    "/api/admin/accounting-fixed-assets",
    "/api/admin/accounting-vendor-statements",
    "/api/admin/accounting-statement-provider-profiles",
    "/api/admin/accounting-close-workflow",
    "/api/admin/accounting-evidence-check",
)
for endpoint in blocking_reads:
    require(sources, endpoint, f"audited Accounting dependency {endpoint}")

journal = read("functions/api/admin/accounting-journal.js")
require(journal, "async function ensureJournalSchema", "journal schema ensure helper")
require(journal, "await ensureJournalSchema(db);", "journal read-time schema ensure call")
require(journal, "CREATE TABLE IF NOT EXISTS accounting_journal_entries", "journal request-time table creation")
require(journal, "ALTER TABLE accounting_journal_entries ADD COLUMN", "journal request-time column repair")

profit_loss = read("functions/api/admin/accounting-profit-loss.js")
if "CREATE TABLE" in profit_loss or "ALTER TABLE" in profit_loss:
    raise AssertionError("accounting-profit-loss unexpectedly contains request-time DDL; re-audit Build 324 plan.")

item_costing = read("functions/api/admin/accounting-item-costing.js") + "\n" + read("functions/api/admin/_costing.js")
if "CREATE TABLE" in item_costing or "ALTER TABLE" in item_costing:
    raise AssertionError("accounting-item-costing unexpectedly contains request-time DDL; re-audit Build 325 plan.")

print("BUILD 323 ACCOUNTING PAGE RUNTIME AUDIT / SHADOW BRIDGE: PASS")
print("No Cloudflare resource was contacted.")
