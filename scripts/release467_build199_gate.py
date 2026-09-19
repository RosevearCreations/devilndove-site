#!/usr/bin/env python3
"""Release 467 Build 199 — Buyer Readiness Repair Workbench fail-closed gate."""
from pathlib import Path
import re,subprocess,sys

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

api=read("functions/api/admin/product-buyer-readiness.js")
catalog=read("public/js/admin-catalog-buyer-readiness-v182.js")
local=read("public/js/admin-product-buyer-readiness-v182.js")
health=read("admin/catalog-health/index.html")
editor=read("admin/product-editor/index.html")
roadmap=read("docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_193_200.md")
doc=read("docs/operations/RELEASE_467_BUILD_199_BUYER_READINESS_REPAIR_WORKBENCH.md")
b198=read("scripts/release467_build198_gate.py")

for token in (
    "WORKBENCH_BUILD = 199",
    "workbenchIssues(",
    "severityFilter",
    "issueFilter",
    "workbench_issues",
    "workbench_matching_products",
    "manual_explicit_only",
    "profitability_readiness: 'not_evaluated_here'",
    "automatic_fact_generation: false",
    "stale_target",
    "safe_to_apply",
):
    req(token in api,f"Build 199 buyer-readiness API contract missing: {token}")

for forbidden in (
    "onRequestPost","onRequestPatch","onRequestPut","onRequestDelete",
    "CREATE TABLE","ALTER TABLE","DROP TABLE","INSERT INTO products","UPDATE products","DELETE FROM products",
    "bucket.put(","bucket.delete(","bucket.list("
):
    req(forbidden not in api,f"Build 199 API gained forbidden mutation/provider behavior: {forbidden}")

for token in (
    "catalogBuyerReadinessSeverity",
    "catalogBuyerReadinessIssue",
    "catalogBuyerReadinessNext",
    "Open next unresolved",
    "sessionStorage",
    "workbench_issues",
    "mode:'product'",
    "data-buyer-recheck",
    "Profitability",
    "Separate",
):
    req(token in catalog+health,f"Build 199 workbench UI contract missing: {token}")

for forbidden in ("setInterval(","MutationObserver(","method:'POST'","method: 'POST'","method:'PATCH'","method: 'PATCH'"):
    req(forbidden not in catalog,f"Build 199 workbench gained polling/write behavior: {forbidden}")

for token in ("Separate readiness domains","Profitability is not evaluated here","Product Editor side of the Buyer Readiness Repair Workbench"):
    req(token.lower() in (local+editor).lower(),f"Build 199 Product Editor separation missing: {token}")

req("apiFetch(" not in local and "fetch(" not in local,"Build 199 local Product Editor buyer panel must remain zero-network")
req("admin-catalog-buyer-readiness-v182.js?v=199" in health,"Build 199 Catalog workbench cache key missing")
req("admin-product-buyer-readiness-v182.js?v=199" in editor,"Build 199 Product Editor cache key missing")

legacy_roadmap=all(token in roadmap for token in (
    "Build 198 — complete",
    "Build 199 — current",
    "Build 200 — next after Build 199 is fully GREEN",
    "Builds 201–204: planned, not started",
))
active_successor_match=re.search(r"\*\*Build (\d+) — current\*\*",roadmap)
active_successor_build=int(active_successor_match.group(1)) if active_successor_match else 0
successor_roadmap=("Build 199 — complete" in roadmap and active_successor_build >= 200)
req(legacy_roadmap or successor_roadmap,"Build 199 roadmap checkpoint must be current or explicitly closed by Build 200 or later successors")

for token in (
    "exact starting boundary",
    "25/25",
    "manual next-unresolved",
    "no schema migration",
    "no background polling",
    "Build 200",
):
    req(token.lower() in doc.lower(),f"Build 199 operations contract missing: {token}")

req("successor_roadmap" in b198,"Build 198 retained gate must remain successor-aware")

for path in (
    "functions/api/admin/product-buyer-readiness.js",
    "public/js/admin-catalog-buyer-readiness-v182.js",
    "public/js/admin-product-buyer-readiness-v182.js",
):
    node(path)

if FAIL:
    print("RELEASE 467 BUILD 199 BUYER READINESS REPAIR WORKBENCH: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 199 BUYER READINESS REPAIR WORKBENCH: PASS")
print("Queue filters: SEVERITY + CATEGORY/DESCRIPTION/SHIPPING/STOCK")
print("Repair owner: PRODUCT EDITOR")
print("Recheck: ONE PRODUCT / STALE-SAFE / EXPLICIT ONLY")
print("Next unresolved: MANUAL / NO POLLING")
print("Publication and profitability readiness: SEPARATE")
print("Automatic Product/schema/R2/provider mutation: ZERO")
