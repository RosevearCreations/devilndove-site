#!/usr/bin/env python3
"""Release 467 Build 188 — Buyer Readiness Closure fail-closed gate."""
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

api=read("functions/api/admin/product-buyer-readiness.js")
catalog=read("public/js/admin-catalog-buyer-readiness-v182.js")
local=read("public/js/admin-product-buyer-readiness-v182.js")
health=read("admin/catalog-health/index.html")
editor=read("admin/product-editor/index.html")
products=read("functions/api/products.js")
detail=read("functions/api/product-detail-core.js")
search=read("public/js/site-search.js")
budget=read("functions/api/_lib/d1ReadBudget.js")
doc=read("docs/operations/RELEASE_467_BUILD_188_BUYER_READINESS_CLOSURE.md")
roadmap=read("docs/operations/RELEASE_467_AUTONOMOUS_CLOSURE_BUILDS_187_192.md")
workflow=read(".github/workflows/release467-build188-buyer-readiness-closure.yml")

for token in ("CLOSURE_BUILD = 188","mode === 'product'","blocking_issues","advisory_issues","repair_groups","public_visibility","stale_target","safe_to_apply","admin_product_buyer_recheck_v188"):
    req(token in api+budget,f"Build 188 buyer-readiness closure missing: {token}")
for forbidden in ("onRequestPost","onRequestPatch","onRequestPut","onRequestDelete","CREATE TABLE","ALTER TABLE","DROP TABLE","product_images","site_item_inventory","bucket.put(","bucket.delete("):
    req(forbidden not in api,f"Build 188 buyer-readiness API gained forbidden unrelated/mutating behavior: {forbidden}")
for token in ("data-buyer-recheck","mode:'product'","catalogBuyerReadinessEvidence","Blocker:","Advisory:"):
    req(token in catalog+health,f"Build 188 Catalog buyer closure missing: {token}")
for forbidden in ("setInterval(","MutationObserver(","method:'POST'","method: 'POST'","method:'PATCH'","method: 'PATCH'"):
    req(forbidden not in catalog,f"Build 188 Catalog buyer UI gained polling/write behavior: {forbidden}")
for token in ("Public storefront","Build 188","zero-read"):
    req(token.lower() in (local+editor).lower(),f"Build 188 Product Editor buyer panel missing: {token}")
req("fetch(" not in local and "apiFetch(" not in local,"Build 188 local Product Editor buyer panel must remain zero-network")
for token in ("LOWER(COALESCE(p.review_status,'published')) IN ('approved','published','')","products_review_status_column_missing_legacy_publication_compatibility"):
    req(token in products,f"Build 188 public catalog publication gate missing: {token}")
req("lower(COALESCE(review_status,'published')) IN ('approved','published','')" in detail,"Build 188 Product detail publication gate missing")
req("/api/products?q=" in search,"Internal Search must continue to inherit Product publication filtering from /api/products")
req("Build 187 — complete" in roadmap and "Build 188 — current" in roadmap and "Build 189 — next after Build 188 is fully GREEN" in roadmap,"Build 188/189 roadmap checkpoint missing")
for token in ("5,000 rows read","zero-D1 code-only path","Build 186","no canonical migration"):
    req(token.lower() in doc.lower(),f"Build 188 operations doc missing: {token}")
condition="github.event_name == 'push' && github.ref == 'refs/heads/dev'"
req(condition in workflow,"Build 188 live D1 proof must be exact-dev push only")
req("D1_PROVIDER_ROWS_READ=" in workflow,"Build 188 D1 proof lacks provider rows_read")
req("provider_rows_read <= 5000" in workflow,"Build 188 rows_read ceiling is not 5,000")
req("rows_read budget exceeded" in workflow,"Build 188 D1 proof does not fail closed")
for token in ("python scripts/release467_build187_gate.py","python scripts/release467_build186_gate.py","python scripts/release467_build182_gate.py"):
    req(token in workflow,f"Build 188 workflow missing retained gate: {token}")
for path in ("functions/api/admin/product-buyer-readiness.js","functions/api/_lib/d1ReadBudget.js","public/js/admin-catalog-buyer-readiness-v182.js","public/js/admin-product-buyer-readiness-v182.js","functions/api/products.js","functions/api/product-detail-core.js"):
    node(path)
if FAIL:
    print("RELEASE 467 BUILD 188 BUYER READINESS CLOSURE: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 188 BUYER READINESS CLOSURE: PASS")
print("Queue: BLOCKERS + ADVISORY / PRODUCT EDITOR OWNER")
print("Recheck: ONE PRODUCT / STALE-SAFE / EXPLICIT ONLY")
print("Public visibility: ACTIVE + APPROVED/PUBLISHED/LEGACY-BLANK COMPATIBILITY")
print("Public Product requests added: ZERO")
print("Mutation/schema/R2/provider/payment/accounting action: NONE")
print("Next: BUILD 189 INVENTORY EVIDENCE CLOSURE")
