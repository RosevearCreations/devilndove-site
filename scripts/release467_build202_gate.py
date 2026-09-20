#!/usr/bin/env python3
"""Release 467 Build 202 — Catalog Reference & Media Reconciliation fail-closed gate."""
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

api=read("functions/api/admin/catalog-image-repair.js")
ui=read("public/js/admin-catalog-media-reconciliation-v202.js")
page=read("admin/catalog-health/index.html")
css=read("css/release467-build202-catalog-media-reconciliation.css")
roadmap=read("docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_193_200.md")
doc=read("docs/operations/RELEASE_467_BUILD_202_CATALOG_REFERENCE_MEDIA_RECONCILIATION.md")
workflow=read(".github/workflows/release467-build202-catalog-reference-media-reconciliation.yml")
b201=read("scripts/release467_build201_gate.py")

for token in (
    "RECONCILIATION_BUILD=202",
    "product_issue",
    "inventory_issue",
    "missing_image",
    "external_source",
    "authority_drift",
    "alt_text",
    "mode==='r2_evidence'",
    "single_object_head",
    "mutation_capability:'none'",
):
    req(token in api,f"Build 202 read-only media filter contract missing: {token}")
for forbidden in ("INSERT INTO","UPDATE product_images","UPDATE site_item_inventory","DELETE FROM","bucket.put(","bucket.delete(","bucket.list("):
    req(forbidden not in api,f"Build 202 image evidence API gained forbidden mutation/list behavior: {forbidden}")

for token in (
    "Catalog Reference & Media Reconciliation",
    "catalog_reference",
    "inventory_blank_image",
    "inventory_external_image",
    "product_alt_text",
    "/api/admin/inventory-identity-health",
    "/api/admin/catalog-image-repair",
    "inventory_issue:'missing_image'",
    "inventory_issue:'external_source'",
    "product_issue:'alt_text'",
    "Recheck catalog reference",
    "Recheck media evidence",
    "/admin/inventory-operations/",
    "/admin/catalog/",
    "/admin/catalog-media/",
    "No background scan runs on page load.",
):
    req(token in ui,f"Build 202 reconciliation UI missing: {token}")
for forbidden in ("setInterval(","MutationObserver(","method:'POST'","method: 'POST'","method:'PATCH'","method: 'PATCH'"):
    req(forbidden not in ui,f"Build 202 workbench gained background/write behavior: {forbidden}")

for token in (
    "catalogMediaReconciliationMount",
    "release467-build202-catalog-media-reconciliation.css?v=202",
    "admin-catalog-media-reconciliation-v202.js?v=202",
    "Release 467 • Build 202",
):
    req(token in page,f"Catalog Health Build 202 mount/cache identity missing: {token}")
req(page.lower().count("<h1")==1,"Catalog Health must keep exactly one H1")
for token in ("catalog-recon-summary","catalog-recon-toolbar","catalog-recon-row","@media(max-width:680px)"):
    req(token in css,f"Build 202 responsive CSS missing: {token}")

legacy_roadmap=all(token in roadmap for token in (
    "Build 201 — complete",
    "Build 202 — current",
    "Build 203 — next after Build 202 is fully GREEN",
    "Build 204: planned, not started",
    "54706ae1b62338098b3ca27a14b9bcda1dbd7aa6",
))
successor_roadmap=(
    "Build 202 — complete" in roadmap
    and "09745a82b5f8d23e0fe1c681b90ec32b4605a38a" in roadmap
    and any(token in roadmap for token in ("Build 203 — current","Build 203 — complete","Build 204 — current","Build 204 — complete"))
)
req(legacy_roadmap or successor_roadmap,"Build 202 roadmap checkpoint must be current or explicitly closed by Build 203 or later successors")

for token in (
    "exact starting boundary",
    "12,198 / 12,500",
    "143 unmatched",
    "2 blank Inventory",
    "141 external Inventory",
    "10 Products",
    "server-bounded",
    "one selected object",
    "zero D1 mutation",
    "Build 203",
    "historical provenance only",
):
    req(token.lower() in doc.lower(),f"Build 202 operations contract missing: {token}")

condition="github.event_name == 'push' && github.ref == 'refs/heads/dev'"
req(condition in workflow,"Build 202 live D1 proof must be exact-dev push only")
for token in (
    "catalog_reference_not_matched",
    "blank_inventory_images",
    "external_inventory_image_references",
    "products_with_alt_attention",
    "D1_PROVIDER_ROWS_READ=",
    "provider_rows_read <= 12500",
    "rows_read budget exceeded",
    "D1 MUTATION: ZERO",
    "R2 MUTATION: ZERO",
    "SCHEMA MIGRATION: NONE",
):
    req(token in workflow,f"Build 202 exact-dev proof missing: {token}")
for retained in (
    "python scripts/release467_build201_gate.py",
    "python scripts/release467_build194_gate.py",
    "python scripts/release467_build190_gate.py",
    "python scripts/release467_build189_gate.py",
):
    req(retained in workflow,f"Build 202 workflow missing retained gate: {retained}")
req("successor_roadmap" in b201,"Build 201 retained gate must recognize Build 202 successor")

for path in (
    "functions/api/admin/catalog-image-repair.js",
    "public/js/admin-catalog-media-reconciliation-v202.js",
):
    node(path)

if FAIL:
    print("RELEASE 467 BUILD 202 CATALOG REFERENCE / MEDIA RECONCILIATION: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 202 CATALOG REFERENCE / MEDIA RECONCILIATION: PASS")
print("Catalog reference: BOUNDED / EXPLICIT OWNER ROUTING / STALE-SAFE")
print("Inventory media: BLANK / EXTERNAL / AUTHORITY-DRIFT SEPARATED")
print("Product alt text: PRODUCT MEDIA OWNER / NO INVENTION")
print("R2: SELECTED OBJECT HEAD ONLY / NO LIST / NO MUTATION")
print("Next: BUILD 203 COST EVIDENCE & MARGIN READINESS")
