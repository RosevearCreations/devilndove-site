#!/usr/bin/env python3
"""Release 467 Build 184 — Product & Tool/Supply image repair workflow gate, successor-aware through Build 185."""
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
    req(p.returncode==0,f"JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1800:]}")

api=read("functions/api/admin/catalog-image-repair.js")
ui=read("public/js/admin-catalog-image-repair-v184.js")
css=read("css/release467-build184-catalog-image-repair.css")
health=read("admin/catalog-health/index.html")
inventory_page=read("admin/inventory-operations/index.html")
inventory_ui=read("public/js/admin-site-item-inventory.js")
product_media=read("admin/catalog-media/index.html")
product_editor_api=read("functions/api/admin/product-image-editor.js")
doc=read("docs/operations/RELEASE_467_BUILD_184_PRODUCT_TOOL_SUPPLY_IMAGE_REPAIR.md")
plan=read("docs/operations/RELEASE_467_CATALOG_REWORK_BUILDS_181_186.md")
wrangler=read("wrangler.toml")

for token in ("const BUILD=184","MAX_ROWS=40","MAX_IMAGE_ROWS=240","mode==='summary'","mode==='products'","mode==='inventory'","mode==='r2_evidence'","single_object_head","mutation_capability:'none'"):
    req(token in api,f"Build 184 API missing: {token}")
for table in ("products","product_images","product_image_annotations","media_assets","site_item_inventory","catalog_items"):
    req(table in api,f"Build 184 API missing established authority: {table}")
for token in ("missing_featured","no_gallery","shallow_gallery","alt_text","image_role","featured_not_in_gallery","authority_drift","catalog_image_candidate"):
    req(token in api,f"Build 184 image evidence missing: {token}")
req("bucket.head(key)" in api,"Build 184 single-object R2 HEAD evidence missing")
for forbidden in ("bucket.list(","bucket.put(","bucket.delete(","onRequestPost","onRequestPatch","onRequestPut","onRequestDelete","CREATE TABLE","ALTER TABLE","DROP TABLE","INSERT INTO","UPDATE products","UPDATE product_images","UPDATE site_item_inventory","DELETE FROM"):
    req(forbidden not in api,f"Build 184 diagnostic API gained mutation/heavy behavior: {forbidden}")

for token in ("Product & Tool/Supply Image Repair","Load image health","Load 40 repair records","Check R2 object","catalogImageRepairMount","admin-catalog-image-repair-v184.js?v=184"):
    req(token in (health+ui),f"Build 184 Catalog Health workspace missing: {token}")
for forbidden in ("method:'POST'","method: 'POST'","method:'PATCH'","method: 'PATCH'","setInterval(","MutationObserver("):
    req(forbidden not in ui,f"Build 184 review UI must remain explicit/read-only: {forbidden}")
req(len(re.findall(r"<h1\b",health,re.I))==1,"Catalog Health must keep exactly one H1")

for token in ("Product Media & Image Editor","Alt text","Image role","Make this the Product featured image"):
    req(token in product_media,f"Existing Product Media owner missing: {token}")
for token in ("save_metadata","UPDATE product_images SET alt_text","upsertAnnotation","set_featured"):
    req(token in product_editor_api,f"Existing Product image mutation owner missing: {token}")

req("new URLSearchParams(window.location.search).get('q')" in inventory_ui,"Inventory repair deep-link search prefill missing")
req("/public/js/admin-site-item-inventory.js?v=440.4" in inventory_page,"Inventory repair asset cache key missing")
req("siteInventoryImageUrl" in inventory_ui and "Full edit" in inventory_ui,"Inventory operational image editor owner missing")

for token in ("Catalog Health","Product Media & Image Editor","Inventory Operations","Media & Content Studio","single-object","no bucket listing","no canonical schema migration","no payment/refund action","Build 185"):
    req(token.lower() in doc.lower(),f"Build 184 documentation missing: {token}")
req("Build 183 — complete" in plan,"Catalog rework checkpoint missing: Build 183 — complete")
req(any(token in plan for token in ("Build 184 — current","Build 184 — complete")),"Catalog rework checkpoint missing Build 184 current/complete state")
req(any(token in plan for token in ("Build 185 — next","Build 185 — current","Build 185 — complete")),"Catalog rework checkpoint missing Build 185 successor state")

for token in ("catalog-image-table-wrap","overflow-x:auto","@media(max-width:760px)"):
    req(token in css,f"Build 184 responsive CSS missing: {token}")
req('binding = "PRODUCT_MEDIA_BUCKET"' in wrangler and 'bucket_name = "devilndove-toolshed-images-dev"' in wrangler,"Development PRODUCT_MEDIA_BUCKET binding proof missing")

node("functions/api/admin/catalog-image-repair.js")
node("public/js/admin-catalog-image-repair-v184.js")
node("public/js/admin-site-item-inventory.js")

if FAIL:
    print("RELEASE 467 BUILD 184 PRODUCT TOOL/SUPPLY IMAGE REPAIR: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 184 PRODUCT TOOL/SUPPLY IMAGE REPAIR: PASS")
print("Catalog Health: EXPLICIT CROSS-AUTHORITY REVIEW / <=40 RECORDS")
print("Product repairs: EXISTING PRODUCT MEDIA OWNER")
print("Tool/Supply repairs: EXISTING INVENTORY OWNER")
print("R2 evidence: ONE SELECTED OBJECT HEAD / NO LIST / NO MUTATION")
print("Schema/Product/Inventory/provider/payment/accounting mutation in diagnostic: NONE")
print("Next: BUILD 185 PRODUCT RESOURCE / COST / USAGE LINKAGE")
