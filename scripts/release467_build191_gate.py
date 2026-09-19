#!/usr/bin/env python3
"""Release 467 Build 191 — Cost, Usage & Profitability Evidence Closure gate."""
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

overlay=read("functions/api/admin/_productResourcesData.js")
bootstrap=read("functions/api/admin/product-resource-bootstrap.js")
ui=read("public/js/admin-product-resources.js")
page=read("admin/inventory-operations/index.html")
budget=read("functions/api/_lib/d1ReadBudget.js")
doc=read("docs/operations/RELEASE_467_BUILD_191_COST_USAGE_PROFITABILITY_CLOSURE.md")
roadmap=read("docs/operations/RELEASE_467_AUTONOMOUS_CLOSURE_BUILDS_187_192.md")
workflow=read(".github/workflows/release467-build191-cost-usage-profitability-closure.yml")

for token in ("buildProfitabilityEvidence","cost_evidence_state","unknown_inventory_match","unknown_missing_cost","not_applicable","evidenced_cost_per_product_cents","resource_cost_state","linked_resources_only_not_full_accounting_profit","publication_readiness_authority"):
    req(token in overlay,f"Build 191 profitability evidence missing: {token}")
req("resourceCostKnown" in overlay and "resourceCostCents = resourceCostKnown" in overlay,"Build 191 must fail cost total closed when required link cost is unknown")
req("unknownCostLinks.length === 0" in overlay,"Build 191 unknown-cost readiness rule missing")
for token in ("buildProfitabilityEvidence","SELECT product_id,name,price_cents,currency,status,review_status,updated_at","profitability_evidence","selected_product_evidence","unknown_cost_policy: 'unknown_never_zero'"):
    req(token in bootstrap,f"Build 191 selected Product bootstrap missing: {token}")
for forbidden in ("CREATE TABLE","ALTER TABLE","DROP TABLE","INSERT INTO","UPDATE products","UPDATE site_item_inventory","DELETE FROM","bucket.put(","bucket.delete("):
    req(forbidden not in overlay+bootstrap,f"Build 191 read evidence gained forbidden mutation/schema/R2 behavior: {forbidden}")

for token in ("Release 467 Build 191","Recheck cost & margin evidence","Unknown","Not applicable — reusable/story-only","linked resources only","state.profitabilityEvidence","Evidenced linked-resource cost/product"):
    req(token in ui,f"Build 191 Product-resource UI missing: {token}")
req("admin-product-resources.js?v=467.191" in page,"Build 191 Product-resource cache key missing")
req("formatMoney(summary.estimated_resource_cost_cents || 0)" not in ui,"Build 191 UI still coerces aggregate missing cost to zero")
for forbidden in ("setInterval(","MutationObserver("):
    req(forbidden not in ui,f"Build 191 UI gained background polling: {forbidden}")

for token in ("admin_product_profitability_evidence_v191","explicit_selected_product_profitability_evidence","Missing cost remains unknown"):
    req(token in budget,f"Build 191 D1 budget contract missing: {token}")

req("Build 190 — complete" in roadmap and "Build 191 — current" in roadmap and "Build 192 — next after Build 191 is fully GREEN" in roadmap,"Build 191/192 roadmap checkpoint missing")
for token in ("15,000 rows read","zero D1 mutation","no canonical migration","zero-D1 code-only path","unknown_missing_cost","not_applicable","linked resources only","Publication readiness"):
    req(token.lower() in doc.lower(),f"Build 191 operations doc missing: {token}")

condition="github.event_name == 'push' && github.ref == 'refs/heads/dev'"
req(condition in workflow,"Build 191 live D1 proof must be exact-dev push only")
req("D1_PROVIDER_ROWS_READ=" in workflow,"Build 191 exact-dev proof lacks provider rows_read")
req("provider_rows_read <= 15000" in workflow,"Build 191 rows_read ceiling is not 15,000")
req("rows_read budget exceeded" in workflow,"Build 191 D1 proof does not fail closed")
for token in ("python scripts/release467_build190_gate.py","python scripts/release467_build185_gate.py","python scripts/release467_build184_d1_quota_guard.py","python scripts/release467_build188_gate.py"):
    req(token in workflow,f"Build 191 workflow missing retained gate: {token}")
for token in ("inventory_ranked AS","lot_stats AS","site_inventory_usage_profiles","inventory_lot_policies","product_rollup AS"):
    req(token in workflow,f"Build 191 Development proof missing grouped authority: {token}")

for path in ("functions/api/admin/_productResourcesData.js","functions/api/admin/product-resource-bootstrap.js","functions/api/_lib/d1ReadBudget.js","public/js/admin-product-resources.js"):
    node(path)

if FAIL:
    print("RELEASE 467 BUILD 191 COST USAGE PROFITABILITY EVIDENCE CLOSURE: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 191 COST USAGE PROFITABILITY EVIDENCE CLOSURE: PASS")
print("Missing cost: UNKNOWN / NEVER SILENT ZERO")
print("Reusable/story-only: NOT APPLICABLE / NON-DEPLETING")
print("Margin evidence: LINKED RESOURCES ONLY / EXPLAINABLE")
print("Inventory/accounting/purchasing/payment mutation: NONE")
print("Next: BUILD 192 RELEASE REGRESSION & RUNTIME BUDGET CONVERGENCE")
