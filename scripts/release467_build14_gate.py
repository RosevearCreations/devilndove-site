#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 14 — Product Release Quality Command Center."""
from __future__ import annotations
import json, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
SOURCE_BASE="86907d512c5121bb05306ca9d31d4aecb5fd6c50"
SOURCE_TREE="9740eec99afbcd93773ab7e3b875037c183591db"
GREEN13_SHA="794fd5b36191fff4c9e8376197f968d9c6d6da80"
GREEN13_TREE="9c2bcdcb12bcbf2f00aeb19345329cdce39c65d9"
SYSTEM_GATE=33643833623
BUILD13_PROOF=33643833608
EXPECTED_MIGRATIONS=["0001_release464_migration_authority.sql","0002_release464_operational_acceptance.sql","0003_release464_business_growth.sql","0004_release465_storefront_quality.sql"]

def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="replace")
def load(path):
    try: v=json.loads(read(path))
    except Exception as e: FAIL.append(f"invalid JSON {path}: {e}"); return {}
    return v if isinstance(v,dict) else {}
def changed():
    try:
        base=subprocess.check_output(["git","merge-base","HEAD","origin/dev"],cwd=ROOT,text=True).strip()
        out=subprocess.check_output(["git","diff","--name-only",f"{base}...HEAD"],cwd=ROOT,text=True)
        return [x for x in out.splitlines() if x]
    except Exception as e:
        FAIL.append(f"could not calculate changed files: {e}"); return []

pointer=load("current-development-authority.json")
manifest=load("release467-build14-product-release-quality.json")
compat=load("development-release.json")
migrations=load("migrations/canonical/manifest.json")
b13=read("scripts/release467_build13_gate.py")
b13workflow=read(".github/workflows/release467-build13-proof.yml")
quality=read("public/js/admin-product-quality-command-center.js")
products_page=read("admin/products/index.html")
readiness=read("functions/api/admin/product-readiness.js")
market=read("functions/api/_lib/marketplaceReadiness.js")
media=read("public/js/admin-product-images.js")
export_preview=read("functions/api/admin/marketplace-export-preview.js")
backlog=read("docs/operations/RELEASE_467_AUTONOMOUS_20_ITEM_BACKLOG.md")
docs=[read(x) for x in ("AI_HANDOFF.md","PROJECT_STATUS_AND_ROADMAP.md","SANITY_HEALTH_CHECK.md","MARKDOWN_INDEX.md","docs/operations/RELEASE_467_BUILD_14_PRODUCT_RELEASE_QUALITY.md")]

req(pointer.get("release")==467 and pointer.get("build")==14,"pointer must identify Release 467 Build 14")
req(pointer.get("title")=="Product Release Quality Command Center","Build 14 pointer title drifted")
req(pointer.get("state")=="DEVELOPMENT_CANDIDATE","Build 14 pointer must remain DEVELOPMENT_CANDIDATE before merge closure")
req(pointer.get("feature_branch")=="release467-build14-product-release-quality","Build 14 feature branch drifted")
req(pointer.get("source_base_sha")==SOURCE_BASE and pointer.get("source_base_tree_sha")==SOURCE_TREE,"Build 14 source base drifted")
req(pointer.get("last_green_build")==13,"Build 14 predecessor must be Build 13")
req(pointer.get("last_green_dev_sha")==GREEN13_SHA and pointer.get("last_green_dev_tree_sha")==GREEN13_TREE,"Build 13 green SHA/tree drifted")
req(pointer.get("last_green_system_gate_run")==SYSTEM_GATE and pointer.get("last_green_build_proof_run")==BUILD13_PROOF,"Build 13 green proof drifted")
req((pointer.get("current_release_authorities") or [None])[0]=="release467-build14-product-release-quality.json","Build 14 must be first current authority")
req("release467-build13-repository-hygiene-cleanup.json" in (pointer.get("current_release_authorities") or []),"Build 13 provenance missing")
req(pointer.get("autonomous_backlog_active_build")==14 and pointer.get("autonomous_backlog_active_items")==[1,2,3,4,5],"Build 14 autonomous backlog pointer drifted")
req(pointer.get("promotion_state")=="NO_AUTOMATIC_PROMOTION","automatic Production promotion forbidden")
for k in ("schema_change_authorized","d1_mutation_authorized","r2_mutation_authorized","provider_execution_authorized","provider_publication_authorized","cloudflare_access_mutation_authorized","main_mutation_authorized","production_mutation_authorized","secret_values_emitted"):
    req(pointer.get(k) is False,f"pointer safety drift: {k}")
ca=pointer.get("compatibility_authority") or {}
req(ca.get("role")=="INHERITED_REGRESSION_COMPATIBILITY" and ca.get("runtime_release_header")==466 and ca.get("runtime_release_header_role")=="INHERITED_RUNTIME_COMPATIBILITY","compatibility classification drifted")
req(compat.get("release")==466,"Release 466 compatibility evidence drifted")
req(pointer.get("main_source_head_last_verified")=="ce42f3b2ea553b69085705f500a9e2bd2f689818" and pointer.get("production_pages_deploy_last_verified")==33640133776,"Production Build 11 evidence drifted")

req(manifest.get("release")==467 and manifest.get("build")==14 and manifest.get("title")=="Product Release Quality Command Center","Build 14 manifest identity drifted")
req(manifest.get("source_base_sha")==SOURCE_BASE and manifest.get("source_base_tree_sha")==SOURCE_TREE,"Build 14 manifest source base drifted")
pr=manifest.get("predecessor") or {}
req(pr.get("build")==13 and pr.get("merged_dev_sha")==GREEN13_SHA and pr.get("merged_dev_tree_sha")==GREEN13_TREE and pr.get("system_gate_run")==SYSTEM_GATE and pr.get("build13_proof_run")==BUILD13_PROOF,"Build 14 predecessor evidence drifted")
req(manifest.get("backlog_items")==[1,2,3,4,5],"Build 14 manifest must own backlog items 1-5")
runtime=manifest.get("runtime") or {}
req(runtime.get("workspace")=="/admin/products/" and runtime.get("command_center_read_only") is True and runtime.get("automatic_repair") is False,"Build 14 command center runtime contract drifted")
req(runtime.get("original_r2_media_preserved") is True,"Build 14 must preserve original R2 media")
req(runtime.get("provider_execution") is False and runtime.get("provider_publication") is False,"marketplace provider execution/publication must remain false")
for k in ("schema_change_authorized","request_time_schema_mutation","new_d1_mutation_authorized","d1_mutation_authorized","r2_mutation_authorized","provider_execution_authorized","provider_publication_authorized","cloudflare_access_policy_mutation_authorized","main_mutation_authorized","production_mutation_authorized","secret_values_emitted"):
    req(manifest.get(k) is False,f"manifest safety drift: {k}")

b13c=b13.replace(" ","")
req("pointer_build>=13" in b13c,"Build 13 gate is not forward-compatible")
req("ifpointer_build==13" in b13c,"Build 13 exact-scope branch missing")
req("pointer_build" in b13workflow and 'if [ "${pointer_build}" -eq 13 ]' in b13workflow,"Build 13 workflow diff safety is not forward-compatible")
req("runtime scope is governed by the newer build gate" in b13workflow,"Build 13 workflow preservation-mode boundary missing")

for token in ("Product Release Quality Command Center","/api/admin/products","/api/admin/product-readiness?limit=300&show_ready=1","Crop / focal","Proof-image recommendations","Marketplace image checks","read-only","nothing is published automatically","linked_resource_cost_cents","gross_margin_cents","inventory","hero","gallery","alt","seo","canonical","shipping","structured","marketplace"):
    req(token.lower() in quality.lower(),f"Build 14 quality UI marker missing: {token}")
req("productQualityCommandCenterMount" in products_page,"Build 14 product quality mount missing")
req("/public/js/admin-product-quality-command-center.js" in products_page,"Build 14 quality script missing")

for token in ("marketplace_image_readiness","image_recommendations","duplicate_image_url_count","packaging_pickup_role_count","material_tool_proof_role_count","request_time_schema_mutation:false","release:467","build:14"):
    req(token in readiness,f"Build 14 readiness marker missing: {token}")
req("CREATE TABLE" not in readiness.upper() and "ALTER TABLE" not in readiness.upper(),"Build 14 readiness GET source must not contain request-time DDL")

for token in ("validateSelectedImageSet","duplicate marketplace image URL","missing useful alt text","not cleared for public use","800×800","1200×1200","merchandising score is below 70%","provider_execution_allowed","publication_allowed"):
    req(token in market,f"Build 14 marketplace image validation marker missing: {token}")

for token in ("product-image-focal-thumb","data-row-set-square-crop","data-row-queue-derivative","focal_point_x","focal_point_y","crop_x","crop_y","crop_width","crop_height","Derivative history"):
    req(token in media,f"existing non-destructive crop/focal authority missing: {token}")
for token in ("validateListingDraft","format')==='csv'","hardBlocked","provider_execution:false","publication_allowed:false"):
    req(token in export_preview,f"marketplace export fail-closed authority missing: {token}")

for n in range(1,21): req(f"\n{n}. **" in backlog,f"autonomous backlog item {n} missing")
for token in ("Build 14","Product Release Quality Command Center","Stripe Development","PayPal sandbox","Social/OAuth","Cloudflare Access","Production promotion","HOLD_EXTERNAL"):
    req(token in backlog,f"autonomous backlog boundary missing: {token}")

req([x.get("file") for x in migrations.get("migrations",[])]==EXPECTED_MIGRATIONS,"canonical migrations drifted")
for body in docs:
    for token in ("Release 467 Build 14","Product Release Quality",GREEN13_SHA,"Release 467 Build 13","Repository Hygiene","374983f68fb16172fb357b1755293a29e5d2953f","HOLD_EXTERNAL"):
        req(token in body,f"Build 14 documentation token missing: {token}")

allowed={
"functions/api/admin/product-readiness.js","functions/api/_lib/marketplaceReadiness.js","public/js/admin-product-quality-command-center.js","admin/products/index.html",
"current-development-authority.json","release467-build14-product-release-quality.json","scripts/release467_build13_gate.py","scripts/release467_build14_gate.py",
".github/workflows/release467-build13-proof.yml",".github/workflows/release467-build14-proof.yml","AI_HANDOFF.md","PROJECT_STATUS_AND_ROADMAP.md","SANITY_HEALTH_CHECK.md","MARKDOWN_INDEX.md",
"docs/operations/RELEASE_467_BUILD_14_PRODUCT_RELEASE_QUALITY.md","docs/operations/RELEASE_467_AUTONOMOUS_20_ITEM_BACKLOG.md"
}
ch=changed()
extra=[x for x in ch if x not in allowed]
req(not extra,f"files outside Build 14 scope changed: {extra}")
req(not [x for x in ch if x.startswith("migrations/") or x.lower().endswith(".sql")],"Build 14 must not change schema/migrations")

if FAIL:
    print("FAIL Release 467 Build 14 Product Release Quality gate")
    [print(f"- {x}") for x in FAIL]
    sys.exit(1)
print("PASS Release 467 Build 14 Product Release Quality gate")
print("autonomous_backlog_items=1,2,3,4,5")
print("quality_command_center=READ_ONLY")
print("original_r2_media=PRESERVED")
print("marketplace_provider_execution=FALSE")
print("canonical_migrations=0001-0004")
print("schema_d1_r2_provider_access_main_production_mutation=NONE")
