#!/usr/bin/env python3
"""Release 467 Build 201 — Cycle Count & Duplicate Identity Resolution + Creation Image Edit gate."""
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

identity_api=read("functions/api/admin/inventory-identity-health.js")
identity_ui=read("public/js/admin-inventory-identity-cleanup-v183.js")
integrity_api=read("functions/api/admin/inventory-integrity-review.js")
integrity_ui=read("public/js/admin-inventory-integrity-review.js")
inventory_page=read("admin/inventory-operations/index.html")
creation_api=read("functions/api/admin/creation-media.js")
creation_ui=read("public/js/admin-creation-media-v201.js")
creation_page=read("admin/creation-media/index.html")
public_api=read("functions/api/creations.js")
public_page=read("creations/index.html")
inline=read("public/js/creations-admin-image-edit-v201.js")
media_api=read("functions/api/admin/media-content-studio.js")
roadmap=read("docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_193_200.md")
doc=read("docs/operations/RELEASE_467_BUILD_201_CYCLE_COUNT_DUPLICATE_IDENTITY_RESOLUTION.md")
workflow=read(".github/workflows/release467-build201-cycle-count-duplicate-creation-image-edit.yml")
b200=read("scripts/release467_build200_gate.py")

for token in (
    "Open duplicate identity queue",
    "Open next duplicate",
    "state.queue='duplicates'",
    "Open physical count due queue",
    "nothing was merged, counted, or changed automatically",
    "siteInventorySourceType",
):
    req(token in identity_ui,f"Build 201 duplicate/count routing UI missing: {token}")
for token in ("automatic_merge: false","duplicate_group","same_kind_duplicate_count","mode === 'record'"):
    req(token in identity_api,f"Build 201 retained duplicate evidence missing: {token}")
for token in (
    "Open next count due",
    "ddBuild201CountCursor",
    "Save physical count",
    "window.confirm",
    "explicit cycle-count workflow",
):
    req(token in integrity_ui,f"Build 201 cycle-count UI missing: {token}")
for token in (
    "action === 'physical_count'",
    "inventory_physical_count",
    "inventory_count_concurrent_change",
    "last_counted_at=CURRENT_TIMESTAMP",
):
    req(token in integrity_api,f"Build 201 audited physical-count authority missing: {token}")
req("admin-inventory-identity-cleanup-v183.js?v=201" in inventory_page,"Build 201 identity cache key missing")
req("admin-inventory-integrity-review.js?v=201" in inventory_page,"Build 201 count cache key missing")

for token in (
    "BUILD=201",
    "creation_image_stale_target",
    "creation_image_assignment",
    "mediaAllowed(",
    "UPDATE catalog_items SET image_url=?",
    "LOWER(TRIM(COALESCE(item_kind,'')))='creation'",
    "BLOCKED_SOURCE_TYPES",
    "expected_updated_at",
):
    req(token in creation_api,f"Build 201 Creation Image authority missing: {token}")
for forbidden in (
    "CREATE TABLE","ALTER TABLE","DROP TABLE",
    "UPDATE site_item_inventory","UPDATE products","UPDATE product_images",
    "bucket.put(","bucket.delete(","bucket.list(",
):
    req(forbidden not in creation_api,f"Creation Image authority gained forbidden behavior: {forbidden}")
for token in (
    "/api/admin/creation-media",
    "/api/admin/media-upload",
    "upload_scope','creation'",
    "attach_to_product','0'",
    "Use for this creation",
    "expected_updated_at",
):
    req(token in creation_ui,f"Creation Image client missing: {token}")
for token in ("Creation Image Editor","specialist creation-catalog editor","admin-creation-media-v201.js?v=201"):
    req(token in creation_page,f"Creation Image page missing: {token}")
req(creation_page.lower().count("<h1")==1,"Creation Image Editor must keep exactly one H1")

for token in ("catalog_item_id: row?.catalog_item_id","source_key: row?.source_key"):
    req(token in public_api,f"Public creations identity projection missing: {token}")
for token in ("data-creation-image-key","data-creation-catalog-id","dd:creations-rendered","creations-admin-image-edit-v201.js?v=201"):
    req(token in public_page,f"Creations card edit target missing: {token}")
for token in ("mediaPageEditToolbar","media-page-edit-mode","Edit image","/admin/creation-media/","data-media-page-edit-toggle"):
    req(token in inline,f"Admin-only inline creation edit behavior missing: {token}")
req("fetch(" not in inline and "apiFetch(" not in inline,"Public inline Creation edit helper must perform no data mutation/read")
req(public_page.lower().count("<h1")==1,"Creations page must keep exactly one H1")

for token in ("creation_catalog_uses","creation-card use","LOWER(TRIM(COALESCE(item_kind,'')))='creation' AND image_url=?"):
    req(token in media_api,f"Managed-media creation-use protection missing: {token}")

for token in (
    "Build 200 — complete",
    "Build 201 — current",
    "Build 202 — next after Build 201 is fully GREEN",
    "Builds 203–204: planned, not started",
    "Build 201 owner-acceptance addition",
):
    req(token in roadmap,f"Build 201 roadmap checkpoint missing: {token}")
for token in (
    "exact starting boundary",
    "Creation Image Editor",
    "no automatic duplicate merge",
    "no automatic count",
    "12,500",
    "Edit image",
    "Build 202",
):
    req(token.lower() in doc.lower(),f"Build 201 operations contract missing: {token}")

condition="github.event_name == 'push' && github.ref == 'refs/heads/dev'"
req(condition in workflow,"Build 201 live D1 proof must be exact-dev push only")
for token in ("D1_PROVIDER_ROWS_READ=","provider_rows_read <= 12500","rows_read budget exceeded","D1 MUTATION: ZERO","SCHEMA MIGRATION: NONE","creation_rows"):
    req(token in workflow,f"Build 201 exact-dev proof missing: {token}")
for retained in (
    "python scripts/release467_build200_gate.py",
    "python scripts/release467_build194_gate.py",
    "python scripts/release467_build189_gate.py",
    "python scripts/release467_build183_gate.py",
    "python scripts/release467_build180_gate.py",
    "python scripts/release467_build197_gate.py",
):
    req(retained in workflow,f"Build 201 workflow missing retained gate: {retained}")
req("successor_roadmap" in b200,"Build 200 retained gate must recognize Build 201 successor")

for path in (
    "functions/api/admin/creation-media.js",
    "public/js/admin-creation-media-v201.js",
    "functions/api/creations.js",
    "public/js/creations-admin-image-edit-v201.js",
    "public/js/admin-inventory-identity-cleanup-v183.js",
    "public/js/admin-inventory-integrity-review.js",
    "functions/api/admin/media-content-studio.js",
):
    node(path)

if FAIL:
    print("RELEASE 467 BUILD 201 CYCLE COUNT / DUPLICATE / CREATION IMAGE EDIT: FAIL")
    [print("-",x) for x in FAIL]
    sys.exit(1)
print("RELEASE 467 BUILD 201 CYCLE COUNT / DUPLICATE / CREATION IMAGE EDIT: PASS")
print("Cycle counts: EXPLICIT / AUDITED / CONCURRENCY-PROTECTED")
print("Duplicate identity: BOUNDED EVIDENCE / MANUAL FULL EDIT / NO AUTO-MERGE")
print("Creation images: ADMIN EDITING-ON / EXACT CREATION / STALE-SAFE")
print("Creation media: MANAGED PUBLIC LIBRARY OR EXPLICIT UPLOAD")
print("Product/Inventory/Tool/Supply cross-write: NONE")
print("Next: BUILD 202 CATALOG REFERENCE & MEDIA RECONCILIATION")
