#!/usr/bin/env python3
"""Release 467 Build 183 — Inventory & Tool/Supply identity cleanup gate, successor-aware through Build 185."""
from pathlib import Path
import re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
def read(path):
    p=ROOT/path
    if not p.is_file():
        FAIL.append(f"missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8",errors="replace")
def req(ok,msg):
    if not ok: FAIL.append(msg)
def node(path):
    p=subprocess.run(["node","--check",str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f"JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1600:]}")

api=read("functions/api/admin/inventory-identity-health.js")
ui=read("public/js/admin-inventory-identity-cleanup-v183.js")
page=read("admin/inventory-operations/index.html")
css=read("css/release467-build183-inventory-identity-cleanup.css")
legacy=read("functions/api/admin/_siteItemInventoryLegacy.js")
integrity=read("functions/api/admin/inventory-integrity-review.js")
doc=read("docs/operations/RELEASE_467_BUILD_183_INVENTORY_IDENTITY_CLEANUP.md")
plan=read("docs/operations/RELEASE_467_CATALOG_REWORK_BUILDS_181_186.md")

for token in ("const BUILD = 183","MAX_ROWS = 40","mode === 'summary'","mode === 'issues'","live_d1_inventory","mutation_capability: 'none'","duplicates","supplier_source","usage","count_reorder","catalog"):
    req(token in api,f"Build 183 API missing: {token}")
for table in ("site_item_inventory","site_inventory_usage_profiles","catalog_items"):
    req(table in api,f"Build 183 API missing D1 authority: {table}")
for token in ("key_duplicate_count","same_kind_duplicate_count","usage_review_required","count_due","reorder_review_required","catalog_reference_status"):
    req(token in api,f"Build 183 evidence field missing: {token}")
for forbidden in ("onRequestPost","onRequestPatch","onRequestPut","onRequestDelete","CREATE TABLE","ALTER TABLE","DROP TABLE","INSERT INTO","UPDATE site_item_inventory","DELETE FROM","bucket.put(","bucket.delete(","setInterval(","MutationObserver("):
    req(forbidden not in api,f"Build 183 review API gained mutation/background behavior: {forbidden}")

for token in ("Tool & Supply Identity Review","Load identity health","Load 40 issue rows","inventoryIdentityCleanupMount","admin-inventory-identity-cleanup-v183.js?v=183","Release 467 Build 183"):
    req(token in page or token in ui,f"Build 183 Inventory workspace missing: {token}")
for forbidden in ("method:'POST'","method: 'POST'","method:'PATCH'","method: 'PATCH'","setInterval(","MutationObserver("):
    req(forbidden not in ui,f"Build 183 review UI must remain non-mutating/non-polling: {forbidden}")
req(len(re.findall(r"<h1\b",page,re.I))==1,"Inventory Operations must keep one H1")

for token in ("classification_merge","stock_merge_policy:'max_to_avoid_legacy_duplicate_double_count'","UPDATE product_resource_links SET resource_kind"):
    req(token in legacy,f"Established reviewed classification-consolidation authority missing: {token}")
for token in ("save_usage_setup","physical_count","ON CONFLICT(site_item_inventory_id) DO UPDATE SET"):
    req(token in integrity,f"Established Inventory integrity authority missing: {token}")

for token in ("no automatic duplicate merge","Build 244 remains the mutation authority","no canonical migration","no R2 mutation","Build 184"):
    req(token.lower() in doc.lower(),f"Build 183 documentation missing: {token}")
req("Build 182 — complete" in plan,"Catalog rework checkpoint missing: Build 182 — complete")
req(any(token in plan for token in ("Build 183 — current","Build 183 — complete")),"Catalog rework checkpoint missing Build 183 current/complete state")
req(any(token in plan for token in ("Build 184 — next","Build 184 — current","Build 184 — complete")),"Catalog rework checkpoint missing Build 184 successor state")
req(("Build 185 — current" in plan) or ("Build 185 — complete" in plan) or ("Build 184 — next" in plan),"Catalog rework checkpoint missing Build 185 successor/current state")
for token in ("inventory-identity-table-wrap","overflow-x:auto","@media(max-width:760px)"):
    req(token in css,f"Build 183 responsive CSS missing: {token}")

node("functions/api/admin/inventory-identity-health.js")
node("public/js/admin-inventory-identity-cleanup-v183.js")

if FAIL:
    print("RELEASE 467 BUILD 183 INVENTORY IDENTITY CLEANUP: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 183 INVENTORY IDENTITY CLEANUP: PASS")
print("Review API: LIVE D1 / READ-ONLY / <=40 ISSUE ROWS")
print("Duplicate correction: EXPLICIT EXISTING INVENTORY AUTHORITY")
print("Usage/count correction: EXPLICIT EXISTING INTEGRITY AUTHORITY")
print("R2/Product/payment/provider/accounting mutation: NONE")
print("Successor continuity: BUILD 184 IMAGE REPAIR / BUILD 185 RESOURCE LINKAGE")
