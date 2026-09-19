#!/usr/bin/env python3
"""Release 467 Build 187 — Catalog Repair Action Framework fail-closed source gate."""
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
    req(p.returncode==0,f"JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1600:]}")

api=read("functions/api/admin/catalog-health.js")
ui=read("public/js/admin-catalog-health-v181.js")
repair=read("public/js/admin-catalog-repair-actions-v187.js")
page=read("admin/catalog-health/index.html")
budget=read("functions/api/_lib/d1ReadBudget.js")
doc=read("docs/operations/RELEASE_467_BUILD_187_CATALOG_REPAIR_ACTION_FRAMEWORK.md")
roadmap=read("docs/operations/RELEASE_467_AUTONOMOUS_CLOSURE_BUILDS_187_192.md")
workflow=read(".github/workflows/release467-build187-catalog-repair-action-framework.yml")

for token in ("repair_product","repair_inventory","repair_actions","stale_target","safe_to_apply","route_existing_authorities","productRepairActions","inventoryRepairActions"):
    req(token in api,f"Build 187 API missing: {token}")
for token in ("Product Image Editor","Inventory Operations","Product Editor","direct_mutation: false","reviewed_target_only: true","admin_catalog_repair_recheck_v187"):
    req(token in api+budget,f"Build 187 repair routing/budget missing: {token}")
for forbidden in ("onRequestPost","onRequestPatch","onRequestPut","onRequestDelete","CREATE TABLE","ALTER TABLE","DROP TABLE","bucket.put(","bucket.delete("):
    req(forbidden not in api,f"Build 187 Catalog Health gained forbidden mutation/schema/R2 behavior: {forbidden}")
for token in ("data-catalog-recheck","repairLinks(row,'product'","repairLinks(row,'inventory'"):
    req(token in ui,f"Build 187 Catalog Health row routing missing: {token}")
for token in ("Build 187","catalogRepairActionEvidence","admin-catalog-repair-actions-v187.js?v=187","one-record stale-safe rechecks"):
    req(token in page,f"Build 187 page missing: {token}")
for token in ("repair_product","repair_inventory","expected_updated_at","cache:'no-store'","data-catalog-recheck"):
    req(token in repair,f"Build 187 explicit recheck UI missing: {token}")
for forbidden in ("setInterval(","MutationObserver(","method:'POST'","method: 'POST'","method:'PATCH'","method: 'PATCH'"):
    req(forbidden not in repair,f"Build 187 recheck UI gained background/write behavior: {forbidden}")
req("Build 187 — current" in roadmap and "Build 188 — next after Build 187 is fully GREEN" in roadmap,"Build 187/188 roadmap checkpoint missing")
for token in ("5,000 rows read","stale_target=true","zero-D1 code-only path","No canonical migration"):
    req(token.lower() in doc.lower(),f"Build 187 operations doc missing: {token}")
condition="github.event_name == 'push' && github.ref == 'refs/heads/dev'"
req(condition in workflow,"Build 187 live D1 proof must be exact-dev push only")
req("D1_PROVIDER_ROWS_READ=" in workflow,"Build 187 live D1 proof lacks provider rows_read")
req("provider_rows_read <= 5000" in workflow,"Build 187 D1 rows_read ceiling is not 5,000")
req("rows_read budget exceeded" in workflow,"Build 187 D1 proof does not fail closed")
req("python scripts/release467_build186_gate.py" in workflow,"Build 187 workflow does not retain Build 186")
req("python scripts/release467_build184_d1_quota_guard.py" in workflow,"Build 187 workflow does not retain D1 quota guard")
for path in ("functions/api/admin/catalog-health.js","functions/api/_lib/d1ReadBudget.js","public/js/admin-catalog-health-v181.js","public/js/admin-catalog-repair-actions-v187.js"):
    node(path)
if FAIL:
    print("RELEASE 467 BUILD 187 CATALOG REPAIR ACTION FRAMEWORK: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 187 CATALOG REPAIR ACTION FRAMEWORK: PASS")
print("Repair routing: EXISTING PRODUCT / PRODUCT IMAGE / INVENTORY AUTHORITIES")
print("Recheck: ONE TARGET / STALE-SAFE / EXPLICIT ONLY")
print("Mutation/schema/R2/provider/payment/accounting action: NONE")
print("Next: BUILD 188 BUYER READINESS CLOSURE")
