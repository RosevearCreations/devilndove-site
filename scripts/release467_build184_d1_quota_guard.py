#!/usr/bin/env python3
"""Release 467 Build 184 — D1 quota remediation and startup fan-out gate."""
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

identity=read("functions/api/admin/inventory-identity-health.js")
health=read("functions/api/admin/catalog-health.js")
image=read("functions/api/admin/catalog-image-repair.js")
budget=read("functions/api/_lib/d1ReadBudget.js")
catalog_ui=read("public/js/admin-catalog-health-v181.js")
tool=read("public/js/admin-tool-lifecycle-review.js")
material=read("public/js/admin-inventory-material-usage-reconciliation-v112.js")
process=read("public/js/admin-inventory-process-assignments-v156.js")
integrity=read("public/js/admin-product-integrity-review.js")
receiving=read("public/js/admin-inventory-receiving.js")
reversal=read("public/js/admin-inventory-receiving-reversal.js")
resources=read("public/js/admin-product-resources.js")
kits=read("public/js/admin-inventory-kits.js")
kit_usage=read("public/js/admin-inventory-kit-component-usage.js")
stock=read("public/js/admin-product-stock-report.js")
options=read("public/js/admin-catalog-option-manager.js")
workflows={
  181:read(".github/workflows/release467-build181-catalog-authority-health.yml"),
  182:read(".github/workflows/release467-build182-product-facts-buyer-readiness.yml"),
  183:read(".github/workflows/release467-build183-inventory-identity-cleanup.yml"),
  184:read(".github/workflows/release467-build184-product-tool-supply-image-repair.yml"),
}

# Critical runtime queries must aggregate once, not rescan Inventory/catalog for every row.
for body,label in ((identity,"Inventory identity"),(health,"Catalog Health"),(image,"Image repair")):
    req("WITH " in body or "WITH\n" in body,f"{label} lacks grouped/CTE quota hardening")
    req("ROW_NUMBER() OVER" in body or "GROUP BY" in body,f"{label} lacks grouped/ranked authority reads")
for forbidden,label in (
    ("SELECT COUNT(*) FROM site_item_inventory d","Inventory identity"),
    ("SELECT ci.image_url FROM catalog_items ci","Catalog Health"),
    ("SELECT COUNT(*) FROM site_item_inventory d","Catalog Health"),
    ("LEFT JOIN catalog_items ci ON ci.catalog_item_id=(\n        SELECT","Image repair"),
):
    req(forbidden not in {"Inventory identity":identity,"Catalog Health":health,"Image repair":image}[label],
        f"{label} reintroduced correlated per-row authority scan: {forbidden}")

# D1 read-budget registry must explicitly mark the three high-risk surfaces.
for token in ("admin_catalog_health_v181","admin_inventory_identity_health_v183","admin_catalog_image_repair_v184",
              "explicit_only_grouped_authority_scan","explicit_only_linear_inventory_catalog_scan",
              "explicit_only_grouped_image_inventory_scan"):
    req(token in budget,f"D1 read-budget contract missing: {token}")

# Catalog Health summary is no longer an automatic page-load query.
req("await loadSummary()" not in catalog_ui,"Catalog Health must not auto-read summary on startup")
req("Refresh summary" in catalog_ui,"Catalog Health explicit summary action missing")

# Inventory Operations review modules must render/boot without automatic D1 reads.
req("function boot(){if(booted||!window.DDAuth?.isLoggedIn())return;booted=true;render();}" in tool,
    "Tool lifecycle boot must remain render-only")
req("load reconciliation" in material.lower() and "if(window.DDAuth.isLoggedIn()) load()" not in material,
    "Material reconciliation must remain explicit-only")
req("inventoryProcessLoad" in process and "if(window.DDAuth?.isLoggedIn())load()" not in process,
    "Process assignment must remain explicit-only")
req("Load queues" in integrity and "booted = true;\n    render();" in integrity and "booted = true;\n    render();\n    load();" not in integrity,
    "Product integrity review must remain explicit-only")
req("inventoryReceivingLoadRecent" in receiving and "renderSearchResults();\n  loadRecent();" not in receiving,
    "Receiving history must remain explicit-only")
req("inventoryReceivingReversalLoad" in reversal and "\n  load();\n})();" not in reversal,
    "Receipt reversal evidence must remain explicit-only")
req("productResourcesLoadButton" in resources and "dd:admin-ready', (event) => { if (event?.detail?.ok) startInitialLoad();" not in resources,
    "Product resources must remain explicit-only")
req("inventoryKitsLoad" in kits and "DOMContentLoaded',()=>{if(document.getElementById('siteInventoryAdminMount'))load();" not in kits,
    "Purchased-kit workspace must remain explicit-only")
req("Load components" in kit_usage and "DOMContentLoaded',()=>{if(document.getElementById('siteInventoryAdminMount'))load(" not in kit_usage,
    "Kit component usage must remain explicit-only")
req("Load stock report" in stock and "render(); load();" not in stock,
    "Product stock report must remain explicit-only")
req("catalogOptionAuthorityLoad" in options and "if (window.DDAuth?.isLoggedIn()) load();" not in options,
    "Catalog option authority must remain explicit-only on Inventory Operations")

# Live Development D1 proof must never execute on PR iterations.
condition="github.event_name == 'push' && github.ref == 'refs/heads/dev'"
for build,wf in workflows.items():
    req(condition in wf,f"Build {build} live D1 proof is not restricted to exact dev push")
    req("github.event_name != 'push'" not in wf,f"Build {build} still permits live D1 proof on PR/non-push events")
    req("D1_PROVIDER_ROWS_READ=" in wf,f"Build {build} exact-dev D1 proof lacks provider rows_read meter")
    req("rows_read budget exceeded" in wf,f"Build {build} exact-dev D1 proof lacks hard rows_read ceiling")

# High-risk Build 183/184 proofs themselves must use grouped/ranked scans.
req("WITH active AS" in workflows[183] and "key_counts AS" in workflows[183] and "catalog_refs AS" in workflows[183],
    "Build 183 exact-dev proof still lacks linear grouped Inventory/catalog scan")
req("role_by_image AS" in workflows[184] and "catalog_ranked AS" in workflows[184],
    "Build 184 exact-dev proof still lacks grouped image/Inventory scan")

# Syntax proof for every changed runtime JS/API file.
for path in (
    "functions/api/admin/inventory-identity-health.js",
    "functions/api/admin/catalog-health.js",
    "functions/api/admin/catalog-image-repair.js",
    "functions/api/_lib/d1ReadBudget.js",
    "public/js/admin-catalog-health-v181.js",
    "public/js/admin-tool-lifecycle-review.js",
    "public/js/admin-inventory-material-usage-reconciliation-v112.js",
    "public/js/admin-inventory-process-assignments-v156.js",
    "public/js/admin-product-integrity-review.js",
    "public/js/admin-inventory-receiving.js",
    "public/js/admin-inventory-receiving-reversal.js",
    "public/js/admin-product-resources.js",
    "public/js/admin-inventory-kits.js",
    "public/js/admin-inventory-kit-component-usage.js",
    "public/js/admin-product-stock-report.js",
    "public/js/admin-catalog-option-manager.js",
):
    node(path)

if FAIL:
    print("RELEASE 467 BUILD 184 D1 QUOTA REMEDIATION: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 184 D1 QUOTA REMEDIATION: PASS")
print("Critical runtime scans: GROUPED / RANKED / NO CORRELATED INVENTORY RESCAN")
print("Inventory diagnostic startup: EXPLICIT OPERATOR LOAD")
print("PR live-D1 execution: ZERO")
print("Exact dev push proofs: PROVIDER rows_read METERED + HARD-CAPPED")
print("Production promotion: BLOCKED UNTIL POST-RESET exact-dev live proof is GREEN")
