#!/usr/bin/env python3
"""Release 467 Build 189 — Inventory Evidence Closure fail-closed gate."""
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

api=read("functions/api/admin/inventory-identity-health.js")
ui=read("public/js/admin-inventory-identity-cleanup-v183.js")
page=read("admin/inventory-operations/index.html")
budget=read("functions/api/_lib/d1ReadBudget.js")
doc=read("docs/operations/RELEASE_467_BUILD_189_INVENTORY_EVIDENCE_CLOSURE.md")
roadmap=read("docs/operations/RELEASE_467_AUTONOMOUS_CLOSURE_BUILDS_187_192.md")
workflow=read(".github/workflows/release467-build189-inventory-evidence-closure.yml")

for token in ("CLOSURE_BUILD = 189","mode === 'record'","recordEvidence","duplicate_group","catalog_matches","stale_archived","catalog_reference_safe","automatic_merge: false","automatic_count: false","automatic_stock_change: false","automatic_cost_change: false"):
    req(token in api,f"Build 189 Inventory evidence API missing: {token}")
for token in ("admin_inventory_evidence_recheck_v189","explicit_one_inventory_record_evidence_recheck","at most 12 duplicate-group and 12 catalog-reference"):
    req(token in budget,f"Build 189 D1 budget contract missing: {token}")
for forbidden in ("onRequestPost","onRequestPatch","onRequestPut","onRequestDelete","CREATE TABLE","ALTER TABLE","DROP TABLE","INSERT INTO","UPDATE site_item_inventory","DELETE FROM","bucket.put(","bucket.delete("):
    req(forbidden not in api,f"Build 189 evidence API gained forbidden mutation/schema/R2 behavior: {forbidden}")

for token in ("Release 467 Build 189","data-inventory-evidence-recheck","inventoryEvidenceRecheckResult","api('record'","safe reference:","Compare duplicate-group evidence","Catalog-reference evidence"):
    req(token in ui+page,f"Build 189 Inventory UI missing: {token}")
for forbidden in ("method:'POST'","method: 'POST'","method:'PATCH'","method: 'PATCH'","setInterval(","MutationObserver("):
    req(forbidden not in ui,f"Build 189 Inventory evidence UI gained background/write behavior: {forbidden}")
req("admin-inventory-identity-cleanup-v183.js?v=189" in page,"Build 189 Inventory identity asset cache key missing")
req(page.lower().count("<h1") == 1,"Inventory Operations must keep exactly one H1")

req("Build 188 — complete" in roadmap and ((("Build 189 — current" in roadmap) and ("Build 190 — next after Build 189 is fully GREEN" in roadmap)) or (("Build 189 — complete" in roadmap) and (("Build 190 — current" in roadmap) or ("Build 190 — complete" in roadmap)))),"Build 189/190 roadmap checkpoint missing")
for token in ("20,000 rows read","zero D1 mutation","no canonical migration","zero-D1 code-only path","stale_archived","Inventory Operations"):
    req(token.lower() in doc.lower(),f"Build 189 operations doc missing: {token}")

condition="github.event_name == 'push' && github.ref == 'refs/heads/dev'"
req(condition in workflow,"Build 189 live D1 proof must be exact-dev push only")
req("D1_PROVIDER_ROWS_READ=" in workflow,"Build 189 exact-dev proof lacks provider rows_read")
req("provider_rows_read <= 20000" in workflow,"Build 189 D1 rows_read ceiling is not 20,000")
req("rows_read budget exceeded" in workflow,"Build 189 D1 proof does not fail closed")
for token in ("python scripts/release467_build188_gate.py","python scripts/release467_build187_gate.py","python scripts/release467_build184_d1_quota_guard.py","python scripts/release467_build183_gate.py"):
    req(token in workflow,f"Build 189 workflow missing retained gate: {token}")

for path in ("functions/api/admin/inventory-identity-health.js","functions/api/_lib/d1ReadBudget.js","public/js/admin-inventory-identity-cleanup-v183.js"):
    node(path)

if FAIL:
    print("RELEASE 467 BUILD 189 INVENTORY EVIDENCE CLOSURE: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 189 INVENTORY EVIDENCE CLOSURE: PASS")
print("Inventory evidence: BOUNDED QUEUE + ONE-RECORD RECHECK")
print("Duplicate groups: EXPLAINABLE / NO AUTO-MERGE")
print("Catalog reference: MATCHED / STALE_ARCHIVED / KIND_DRIFT / MISSING")
print("Count/stock/cost/catalog mutation: NONE")
print("Next: BUILD 190 PRODUCT & INVENTORY MEDIA EVIDENCE CLOSURE")
