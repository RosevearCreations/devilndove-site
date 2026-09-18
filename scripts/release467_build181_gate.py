#!/usr/bin/env python3
"""Release 467 Build 181 — Product / Inventory / Tool / Image authority health gate."""
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

api=read("functions/api/admin/catalog-health.js")
ui=read("public/js/admin-catalog-health-v181.js")
page=read("admin/catalog-health/index.html")
css=read("css/release467-build181-catalog-health.css")
routes=read("functions/api/_lib/appModuleRoutes.js")
products=read("admin/products/index.html")
inventory=read("admin/inventory-operations/index.html")
media=read("admin/catalog-media/index.html")
doc=read("docs/operations/RELEASE_467_BUILD_181_CATALOG_AUTHORITY_HEALTH.md")
plan=read("docs/operations/RELEASE_467_CATALOG_REWORK_BUILDS_181_186.md")

for token in ("const BUILD = 181","mode === 'summary'","mode === 'products'","mode === 'inventory'","MAX_ROWS = 40","authority: 'live_d1'","mutation_capability: 'none'"):
    req(token in api,f"Build 181 API missing: {token}")
for table in ("products","product_images","product_resource_links","site_item_inventory","catalog_items"):
    req(table in api,f"Build 181 API missing established D1 authority: {table}")
for forbidden in ("onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","CREATE TABLE","ALTER TABLE","DROP TABLE","bucket.put(","bucket.delete(","setInterval("):
    req(forbidden not in api,f"Build 181 API gained forbidden mutation/heavy behavior: {forbidden}")
for forbidden in ("setInterval(","MutationObserver","location.reload("):
    req(forbidden not in ui,f"Build 181 UI gained polling/observer behavior: {forbidden}")
for token in ("Load 40 Product issues","Load 40 Tool/Supply issues","D1 is the live authority again","admin-catalog-health-v181.js?v=181"):
    req(token in page,f"Build 181 page missing: {token}")
req(len(re.findall(r"<h1\b",page,re.I))==1,"Build 181 admin page must contain one H1")
for token in ("/admin/catalog-health","/api/admin/catalog-health"):
    req(token in routes,f"Storefront route ownership missing: {token}")
for body,label in ((products,"Products"),(inventory,"Inventory Operations"),(media,"Product Images")):
    req("/admin/catalog-health/" in body,f"{label} does not link to Catalog Health")
for token in ("catalog-health-table-wrap","overflow-x:auto","@media(max-width:760px)"):
    req(token in css,f"Build 181 responsive CSS missing: {token}")
for token in ("no canonical migration","no request-time DDL","no R2 write","no payment/refund action","Build 182"):
    req(token.lower() in doc.lower(),f"Build 181 documentation missing: {token}")
for build in range(181,187):
    req(f"**{build}**" in plan,f"Catalog rework plan missing Build {build}")

node("functions/api/admin/catalog-health.js")
node("public/js/admin-catalog-health-v181.js")

if FAIL:
    print("RELEASE 467 BUILD 181 CATALOG AUTHORITY HEALTH: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 181 CATALOG AUTHORITY HEALTH: PASS")
print("D1 authority: PRODUCTS / PRODUCT IMAGES / RESOURCE LINKS / INVENTORY / CATALOG REFERENCES")
print("Startup: SUMMARY ONLY; ISSUE ROWS EXPLICIT / MAX 40")
print("Mutation: NONE")
print("Next: BUILD 182 PRODUCT FACTS & BUYER READINESS")
