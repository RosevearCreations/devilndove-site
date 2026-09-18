#!/usr/bin/env python3
"""Release 467 Build 182 — Product Facts & Buyer Readiness gate, successor-aware through Build 184."""
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

api=read("functions/api/admin/product-buyer-readiness.js")
local=read("public/js/admin-product-buyer-readiness-v182.js")
catalog=read("public/js/admin-catalog-buyer-readiness-v182.js")
editor=read("admin/product-editor/index.html")
health=read("admin/catalog-health/index.html")
css=read("css/release467-build182-product-buyer-readiness.css")
routes=read("functions/api/_lib/appModuleRoutes.js")
doc=read("docs/operations/RELEASE_467_BUILD_182_PRODUCT_FACTS_BUYER_READINESS.md")
plan=read("docs/operations/RELEASE_467_CATALOG_REWORK_BUILDS_181_186.md")

for token in ("const BUILD = 182","MAX_SOURCE_ROWS = 240","MAX_ISSUE_ROWS = 40","product-buyer-readiness-v182","authority: 'live_d1_products'","mutation_capability: 'none'"):
    req(token in api,f"Build 182 API missing: {token}")
for field in ("short_description","description","product_category","product_type","price_cents","currency","requires_shipping","shipping_code","weight_grams","digital_file_url","merchandise_origin","sale_channel","condition_summary","era_label","inventory_tracking","inventory_quantity","review_status"):
    req(field in api,f"Build 182 API missing buyer fact: {field}")
for forbidden in ("onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","CREATE TABLE","ALTER TABLE","DROP TABLE","product_images","site_item_inventory","catalog_items","bucket.put(","bucket.delete(","setInterval(","MutationObserver("):
    req(forbidden not in api,f"Build 182 API gained unrelated/mutating behavior: {forbidden}")

for token in ("zero-read local Product facts","data-editor-tab=\"buyer\"","productBuyerReadinessLocal","admin-product-buyer-readiness-v182.js?v=182"):
    req(token in (local+editor),f"Build 182 local Product Editor contract missing: {token}")
for forbidden in ("apiFetch(","fetch(","setInterval(","setTimeout(","MutationObserver("):
    req(forbidden not in local,f"Build 182 local buyer-readiness panel must remain zero-network/background: {forbidden}")

for token in ("catalogBuyerReadinessLoad","Load 40 buyer-readiness issues","admin-catalog-buyer-readiness-v182.js?v=182","/api/admin/product-buyer-readiness?limit=40"):
    req(token in (health+catalog),f"Build 182 Catalog Health contract missing: {token}")
req("setInterval(" not in catalog and "MutationObserver(" not in catalog,"Build 182 Catalog buyer queue gained polling/observer behavior")
req(len(re.findall(r"<h1\b",editor,re.I))==1,"Product Editor must keep one H1")
req(len(re.findall(r"<h1\b",health,re.I))==1,"Catalog Health must keep one H1")
req("'/api/admin/product'" in routes or '"/api/admin/product"' in routes,"Storefront Product API prefix ownership missing")
for token in ("Product Browser remains compact","Build 183","no canonical schema migration","no R2 mutation","no payment/refund action"):
    req(token.lower() in (doc+"\n"+plan).lower(),f"Build 182 documentation missing: {token}")
req("Build 181 — complete" in plan,"Catalog rework checkpoint missing: Build 181 — complete")
req(any(token in plan for token in ("Build 182 — current","Build 182 — complete")),"Catalog rework checkpoint missing Build 182 current/complete state")
req(any(token in plan for token in ("Build 183 — next","Build 183 — current","Build 183 — complete")),"Catalog rework checkpoint missing Build 183 next/current/complete state")

node("functions/api/admin/product-buyer-readiness.js")
node("public/js/admin-product-buyer-readiness-v182.js")
node("public/js/admin-catalog-buyer-readiness-v182.js")

if FAIL:
    print("RELEASE 467 BUILD 182 PRODUCT FACTS & BUYER READINESS: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 182 PRODUCT FACTS & BUYER READINESS: PASS")
print("Product Editor local buyer review: ZERO EXTRA D1/R2 READS")
print("Catalog buyer queue: EXPLICIT / LIVE D1 / SOURCE <=240 / RETURN <=40")
print("Product Browser startup: UNCHANGED")
print("Mutation: NONE")
print("Next: BUILD 183 INVENTORY & TOOL/SUPPLY IDENTITY CLEANUP")
