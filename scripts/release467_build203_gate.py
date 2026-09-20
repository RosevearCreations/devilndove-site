#!/usr/bin/env python3
"""Release 467 Build 203 — Cost Evidence & Margin Readiness fail-closed gate."""
from pathlib import Path
import subprocess,sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
def read(path):
    p=ROOT/path
    if not p.is_file():
        FAIL.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="replace")
def req(ok,msg):
    if not ok: FAIL.append(msg)
def node(path):
    p=subprocess.run(["node","--check",str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f"JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1800:]}")

api=read("functions/api/admin/cost-margin-readiness.js")
ui=read("public/js/admin-cost-margin-readiness-v203.js")
page=read("admin/inventory-operations/index.html")
css=read("css/release467-build203-cost-margin-readiness.css")
budget=read("functions/api/_lib/d1ReadBudget.js")
roadmap=read("docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_193_200.md")
doc=read("docs/operations/RELEASE_467_BUILD_203_COST_EVIDENCE_MARGIN_READINESS.md")
workflow=read(".github/workflows/release467-build203-cost-evidence-margin-readiness.yml")
b202=read("scripts/release467_build202_gate.py")
b191=read("scripts/release467_build191_gate.py")

for token in (
    "BUILD=203",
    "unknown_cost_policy:'unknown_never_zero'",
    "unknown_inventory_match",
    "unknown_missing_cost",
    "not_applicable",
    "cost_evidence_state",
    "evidenced_cost_per_product_cents",
    "margin_ready_products",
    "margin_review_products",
    "mode==='record'",
    "expected_token",
    "stale_target",
    "automatic_cost_write:false",
    "accounting_posting:false",
):
    req(token in api,f"Build 203 cost evidence API missing: {token}")
for forbidden in (
    "CREATE TABLE","ALTER TABLE","DROP TABLE","INSERT INTO","UPDATE products","UPDATE site_item_inventory",
    "DELETE FROM","bucket.put(","bucket.delete(","onRequestPost","onRequestPatch","onRequestPut","onRequestDelete"
):
    req(forbidden not in api,f"Build 203 cost evidence API gained forbidden mutation/schema/R2 behavior: {forbidden}")

for token in (
    "Cost Evidence & Margin Readiness",
    "Load cost summary",
    "Load 40 missing-cost links",
    "No background cost scan runs on page load.",
    "unknown_missing_cost",
    "Open Inventory cost",
    "Open Product resources",
    "Recheck cost evidence",
    "/api/admin/cost-margin-readiness",
    "linked-resource evidence only",
    "does not post accounting",
):
    req(token in ui,f"Build 203 workbench missing: {token}")
for forbidden in ("setInterval(","MutationObserver(","method:'POST'","method: 'POST'","method:'PATCH'","method: 'PATCH'"):
    req(forbidden not in ui,f"Build 203 workbench gained polling/write behavior: {forbidden}")

for token in (
    "costMarginReadinessMount",
    "release467-build203-cost-margin-readiness.css?v=203",
    "admin-cost-margin-readiness-v203.js?v=203",
    "Release 467 Build 203",
    "admin-product-resources.js?v=185&b=191",
):
    req(token in page,f"Inventory Operations Build 203 mount/cache identity missing: {token}")
req(page.lower().count("<h1")==1,"Inventory Operations must keep exactly one H1")
for token in ("cost-margin-summary","cost-margin-toolbar","cost-margin-row","@media(max-width:680px)"):
    req(token in css,f"Build 203 responsive CSS missing: {token}")

for token in (
    "admin_cost_margin_readiness_v203",
    "explicit_only_grouped_product_resource_cost_evidence",
    "admin_cost_margin_recheck_v203",
    "explicit_one_product_resource_cost_recheck",
):
    req(token in budget,f"Build 203 D1 budget contract missing: {token}")

legacy_roadmap=all(token in roadmap for token in (
    "Build 202 — complete",
    "Build 203 — current",
    "Build 204 — next after Build 203 is fully GREEN",
    "09745a82b5f8d23e0fe1c681b90ec32b4605a38a",
))
successor_roadmap=(
    "Build 203 — complete" in roadmap
    and "6e08228a925fa1283a0e25b46ef1231b724c48e4" in roadmap
    and any(token in roadmap for token in ("Build 204 — current and final planned build","Build 204 — complete"))
)
req(legacy_roadmap or successor_roadmap,"Build 203 roadmap checkpoint must be current or explicitly closed by Build 204")

for token in (
    "exact starting boundary",
    "5,907 / 12,500",
    "4 missing-cost links",
    "unknown_missing_cost",
    "unknown_inventory_match",
    "not_applicable",
    "linked-resource margin readiness only",
    "12,500 provider-metered",
    "zero D1 mutation",
    "historical provenance only",
    "Build 204",
):
    req(token.lower() in doc.lower(),f"Build 203 operations contract missing: {token}")

condition="github.event_name == 'push' && github.ref == 'refs/heads/dev'"
req(condition in workflow,"Build 203 live D1 proof must be exact-dev push only")
for token in (
    "linked_resources",
    "products_with_links",
    "missing_inventory_matches",
    "missing_cost_links",
    "known_cost_links",
    "nondepleting_links",
    "margin_ready_products",
    "margin_review_products",
    "D1_PROVIDER_ROWS_READ=",
    "provider_rows_read <= 12500",
    "rows_read budget exceeded",
    "UNKNOWN COST POLICY: NEVER ZERO",
    "D1 MUTATION: ZERO",
    "R2 MUTATION: ZERO",
    "SCHEMA MIGRATION: NONE",
):
    req(token in workflow,f"Build 203 exact-dev proof missing: {token}")
for retained in (
    "python scripts/release467_build202_gate.py",
    "python scripts/release467_build191_gate.py",
    "python scripts/release467_build185_gate.py",
    "python scripts/release467_build194_gate.py",
):
    req(retained in workflow,f"Build 203 workflow missing retained gate: {retained}")
req("successor_roadmap" in b202,"Build 202 retained gate must recognize Build 203 successor")
req("unknownCostLinks.length === 0" in b191 or "unknown-cost readiness rule" in b191,"Build 191 retained unknown-cost contract missing")

for path in (
    "functions/api/admin/cost-margin-readiness.js",
    "public/js/admin-cost-margin-readiness-v203.js",
):
    node(path)

if FAIL:
    print("RELEASE 467 BUILD 203 COST EVIDENCE / MARGIN READINESS: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 203 COST EVIDENCE / MARGIN READINESS: PASS")
print("Missing required cost: UNKNOWN / NEVER SILENT ZERO")
print("Repair owners: INVENTORY OPERATIONS / PRODUCT RESOURCES")
print("Margin: LINKED RESOURCES ONLY / NOT ACCOUNTING PROFIT")
print("Cost/stock/price/accounting mutation: NONE")
print("Next: BUILD 204 STOREFRONT LAUNCH SET & AUTONOMOUS CLOSURE")
