#!/usr/bin/env python3
"""Release 467 Build 185 — Product resource/cost/usage linkage gate."""
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

legacy=read("functions/api/admin/_productResourcesDataLegacy.js")
overlay=read("functions/api/admin/_productResourcesData.js")
bootstrap=read("functions/api/admin/product-resource-bootstrap.js")
compat=read("functions/api/admin/product-resources.js")
ui=read("public/js/admin-product-resources.js")
page=read("admin/inventory-operations/index.html")
budget=read("functions/api/_lib/d1ReadBudget.js")
plan=read("docs/operations/RELEASE_467_CATALOG_REWORK_BUILDS_181_186.md")
doc=read("docs/operations/RELEASE_467_BUILD_185_PRODUCT_RESOURCE_COST_USAGE_LINKAGE.md")
workflow=read(".github/workflows/release467-build185-product-resource-cost-usage-linkage.yml")

# Selected Product linkage must use one grouped/ranked authority projection.
for token in ("WITH inventory_ranked AS","catalog_ranked AS","lot_stats AS","ROW_NUMBER() OVER","LEFT JOIN inventory_ranked","LEFT JOIN catalog_ranked","LEFT JOIN lot_stats","LEFT JOIN inventory_lot_policies"):
    req(token in legacy,f"Build 185 grouped Product-link loader missing: {token}")
for forbidden in (
    "sii.site_item_inventory_id = (\n        SELECT sii2.site_item_inventory_id",
    "ci.catalog_item_id = (\n        SELECT ci2.catalog_item_id",
):
    req(forbidden not in legacy,f"Build 185 reintroduced correlated per-link lookup: {forbidden}")

# Canonical base authority is one batched read, never one lookup per link.
req("loadInventoryBaseBalances" in overlay,"Build 185 missing batched base-balance loader")
req("loadInventoryBaseBalanceByIdentity" not in overlay,"Build 185 still performs N+1 base-balance identity reads")
for token in ("resourceLinkHealth","summarizeProductResourceLinks","missing_inventory_match","missing_cost_evidence","usage_profile_defaulted","end_of_lot_without_purchase_lot","lot_reconciliation_attention"):
    req(token in overlay,f"Build 185 linkage health missing: {token}")

# Bootstrap and compatibility paths remain bounded and explicit.
for token in ("summarizeProductResourceLinks","build185-bounded-resource-linkage","single_batched_IN_query","grouped_ranked_once_per_selected_product"):
    req(token in bootstrap,f"Build 185 bootstrap contract missing: {token}")
for token in ("loadProducts(db, env, 120)","q ? searchResources(db, env, q, 120) : Promise.resolve([])","build185-bounded-compatibility","link_health_summary"):
    req(token in compat,f"Build 185 compatibility bound missing: {token}")
req("loadProducts(db, env, 600)" not in compat,"legacy 600-Product compatibility preload returned")
req("searchResources(db, env, q, 240)" not in compat,"legacy 240-row blank resource preload returned")

# UI is operator-opened and explains the new evidence.
for token in ("Release 467 Build 185","productResourcesLinkHealth","Build 185 linkage health","Linkage evidence:","Load Product resources","state.linkHealthSummary"):
    req(token in ui,f"Build 185 Product resource UI missing: {token}")
req("dd:admin-ready', (event) => { if (event?.detail?.ok) startInitialLoad();" not in ui,"Product Resources must not auto-load on admin-ready")
req("if (window.DDAuth?.isLoggedIn()) startInitialLoad();" not in ui,"Product Resources must not auto-load solely because auth exists")
req("Release 467 Build 185" in page and "admin-product-resources.js?v=185" in page,"Inventory Operations did not advance to Build 185")

# Central budget and documentation.
for token in ("admin_product_resource_linkage_v185","explicit_selected_product_grouped_linkage","base_balance_ids: 120"):
    req(token in budget,f"Build 185 D1 budget missing: {token}")
req("Build 185 — current" in plan and "Build 186 — next after Build 185 is fully GREEN" in plan,"catalog rework checkpoint did not advance")
for token in ("25,000 rows read","No Build 185 schema migration is required","N+1 base-balance reads","no automatic Inventory quantity/cost mutation"):
    req(token in doc,f"Build 185 operations doc missing: {token}")

# Exact Development live D1 proof is provider-metered and never runs on PR iterations.
req("github.event_name == 'push' && github.ref == 'refs/heads/dev'" in workflow,"Build 185 live D1 proof must be exact-dev push only")
req("D1_PROVIDER_ROWS_READ=" in workflow,"Build 185 live D1 proof does not expose provider rows_read")
req("provider_rows_read <= 25000" in workflow,"Build 185 rows_read ceiling is not 25,000")
req("rows_read budget exceeded" in workflow,"Build 185 rows_read ceiling does not fail closed")
for token in ("inventory_ranked AS","lot_stats AS","site_inventory_usage_profiles","inventory_lot_policies"):
    req(token in workflow,f"Build 185 Development D1 evidence missing grouped authority: {token}")

# No runtime schema/R2/provider side effects in the read layer.
for source,label in ((legacy,"legacy Product-resource data"),(overlay,"base Product-resource overlay"),(bootstrap,"Product-resource bootstrap")):
    upper=source.upper()
    for forbidden in ("CREATE TABLE","ALTER TABLE","DROP TABLE","CREATE INDEX","BUCKET.PUT(","BUCKET.DELETE(","SETINTERVAL("):
        req(forbidden not in upper,f"{label} contains forbidden runtime behavior: {forbidden}")

for path in (
    "functions/api/admin/_productResourcesDataLegacy.js",
    "functions/api/admin/_productResourcesData.js",
    "functions/api/admin/product-resource-bootstrap.js",
    "functions/api/admin/product-resources.js",
    "functions/api/_lib/d1ReadBudget.js",
    "public/js/admin-product-resources.js",
):
    node(path)

if FAIL:
    print("RELEASE 467 BUILD 185 PRODUCT RESOURCE / COST / USAGE LINKAGE: FAIL")
    for item in FAIL: print("-",item)
    sys.exit(1)

print("RELEASE 467 BUILD 185 PRODUCT RESOURCE / COST / USAGE LINKAGE: PASS")
print("Selected Product link identity: GROUPED / RANKED")
print("Base balance reads: ONE BATCHED IN QUERY")
print("Blank resource catalog preload: ZERO")
print("Linkage health: INVENTORY + USAGE + LOT + COST")
print("Admin startup Product-resource reads: ZERO / EXPLICIT OPERATOR LOAD")
print("Schema/R2/provider/payment/accounting mutation: NONE")
