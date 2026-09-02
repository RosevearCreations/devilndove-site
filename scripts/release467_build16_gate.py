#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 16 — Custom Request & Made Today Journey."""
from __future__ import annotations
import json, re, subprocess, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
BASE_SHA="cb6a69ebf544a8eb74efeec409aeeb7ad1852a33"
BASE_TREE="2e9befcb349bbbb5b4dfd06f56b3d4b7bfdf9d60"
SYSTEM_GATE=33654847043
BUILD15_PROOF=33654846823
PROD_MAIN="296e53b079bba53126c80902be36a9271d82cea4"
PROD_DEPLOY=33655223149
EXPECTED_MIGRATIONS=["0001_release464_migration_authority.sql","0002_release464_operational_acceptance.sql","0003_release464_business_growth.sql","0004_release465_storefront_quality.sql"]

def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="replace")
def load(path):
    try: value=json.loads(read(path))
    except Exception as e: FAIL.append(f"invalid JSON {path}: {e}"); return {}
    return value if isinstance(value,dict) else {}
def changed():
    try:
        base=subprocess.check_output(["git","merge-base","HEAD","origin/dev"],cwd=ROOT,text=True).strip()
        out=subprocess.check_output(["git","diff","--name-only",f"{base}...HEAD"],cwd=ROOT,text=True)
        return [x for x in out.splitlines() if x]
    except Exception as e:
        FAIL.append(f"could not calculate changed files: {e}"); return []

def one_h1(html,name):
    count=len(re.findall(r"<h1(?:\s|>)",html,re.I))
    req(count==1,f"{name} must contain exactly one H1; found {count}")

pointer=load("current-development-authority.json")
manifest=load("release467-build16-custom-request-made-today-journey.json")
migrations=load("migrations/canonical/manifest.json")
b15=read("scripts/release467_build15_gate.py")
helper=read("functions/api/_lib/customRequestJourney.js")
order_api=read("functions/api/custom-request-order.js")
order_client=read("public/js/custom-request-order-status.js")
order_compat=read("custom-request-order-status.js")
examples_api=read("functions/api/custom-request-examples.js")
examples_client=read("public/js/custom-request-examples.js")
public_page=read("custom-request/index.html")
order_page=read("custom-request/order/index.html")
admin_page=read("admin/custom-request/index.html")
made_page=read("admin/custom-request/made-today/index.html")
made_client=read("public/js/admin-made-today.js")
stage_api=read("functions/api/admin/custom-order-stage-photos.js")
trust_api=read("functions/api/trust-blocks.js")
css=read("css/custom-request-journey.css")
doc=read("docs/operations/RELEASE_467_BUILD_16_CUSTOM_REQUEST_MADE_TODAY_JOURNEY.md")

# Current authority / predecessor
req(pointer.get("release")==467 and pointer.get("build")==16,"pointer must identify Release 467 Build 16")
req(pointer.get("title")=="Custom Request & Made Today Journey","Build 16 pointer title drifted")
req(pointer.get("state")=="DEVELOPMENT_CANDIDATE","Build 16 pointer must remain DEVELOPMENT_CANDIDATE before closure")
req(pointer.get("feature_branch")=="release467-build16-custom-request-made-today-journey","Build 16 feature branch drifted")
req(pointer.get("source_base_sha")==BASE_SHA and pointer.get("source_base_tree_sha")==BASE_TREE,"Build 16 source base drifted")
req(pointer.get("last_green_build")==15 and pointer.get("last_green_dev_sha")==BASE_SHA and pointer.get("last_green_dev_tree_sha")==BASE_TREE,"Build 15 predecessor pointer drifted")
req(pointer.get("last_green_system_gate_run")==SYSTEM_GATE and pointer.get("last_green_build_proof_run")==BUILD15_PROOF,"Build 15 green evidence drifted")
req(pointer.get("main_source_head_last_verified")==PROD_MAIN and pointer.get("production_pages_deploy_last_verified")==PROD_DEPLOY,"last verified Production checkpoint drifted")
auth=pointer.get("current_release_authorities") or []
req(auth and auth[0]=="release467-build16-custom-request-made-today-journey.json","Build 16 must be first current authority")
req("release467-build15-storefront-seo-parity.json" in auth,"Build 15 provenance missing")
req(pointer.get("autonomous_backlog_active_build")==16 and pointer.get("autonomous_backlog_active_items")==[11,12,13,14,15],"Build 16 backlog pointer drifted")
req(pointer.get("promotion_state")=="NO_AUTOMATIC_PROMOTION","automatic Production promotion remains forbidden")
for k in ("schema_change_authorized","d1_mutation_authorized","r2_mutation_authorized","provider_execution_authorized","provider_publication_authorized","cloudflare_access_mutation_authorized","main_mutation_authorized","production_mutation_authorized","secret_values_emitted"):
    req(pointer.get(k) is False,f"pointer safety drift: {k}")
ca=pointer.get("compatibility_authority") or {}
req(ca.get("role")=="INHERITED_REGRESSION_COMPATIBILITY" and ca.get("runtime_release_header")==466 and ca.get("runtime_release_header_role")=="INHERITED_RUNTIME_COMPATIBILITY","compatibility classification drifted")

# Build 16 manifest
req(manifest.get("release")==467 and manifest.get("build")==16 and manifest.get("title")=="Custom Request & Made Today Journey","Build 16 manifest identity drifted")
req(manifest.get("source_base_sha")==BASE_SHA and manifest.get("source_base_tree_sha")==BASE_TREE,"Build 16 manifest base drifted")
pr=manifest.get("predecessor") or {}
req(pr.get("build")==15 and pr.get("merged_dev_sha")==BASE_SHA and pr.get("merged_dev_tree_sha")==BASE_TREE,"Build 16 predecessor source drifted")
req(pr.get("system_gate_run")==SYSTEM_GATE and pr.get("build15_proof_run")==BUILD15_PROOF,"Build 15 proof provenance drifted")
req(pr.get("production_main_sha")==PROD_MAIN and pr.get("production_pages_deploy_run")==PROD_DEPLOY,"Build 15 Production provenance drifted")
req(manifest.get("backlog_items")==[11,12,13,14,15],"Build 16 must own backlog items 11-15")
journey=manifest.get("journey") or {}; evidence=manifest.get("evidence_policy") or {}; made=manifest.get("made_today") or {}; fulfillment=manifest.get("fulfillment_policy") or {}
req(journey.get("visible_steps")==["request","review_proof","quote","making","fulfillment","complete"],"visible journey contract drifted")
req(journey.get("order_stages")==["planning","making","curing_finishing","ready","shipped_pickup","complete"],"order stage contract drifted")
req(journey.get("customer_safe_stage_messages") is True and journey.get("internal_order_notes_exposed_to_customer") is False and journey.get("internal_stage_notes_exposed_to_customer") is False,"customer-safe privacy contract drifted")
req(evidence.get("candle_soap_examples_use_existing_data_only") is True and evidence.get("invented_claims") is False and evidence.get("public_proof_requires_consent_clearance") is True,"evidence-only policy drifted")
req(made.get("default_public_use_status")=="customer_private" and made.get("default_moderation_status")=="needs_review","Made Today review defaults drifted")
req(made.get("automatic_order_stage_advance") is False and made.get("automatic_publication") is False and made.get("automatic_social_publication") is False and made.get("automatic_marketplace_publication") is False,"Made Today automatic action boundary drifted")
req(fulfillment.get("allowed_shipping_countries")==["CA"] and fulfillment.get("us_sales_shipping_suspended") is True,"Canada-only/U.S. suspension drifted")
for k in ("schema_change_authorized","request_time_schema_mutation","new_d1_mutation_authorized","d1_mutation_authorized","new_r2_mutation_authorized","r2_mutation_authorized","provider_execution_authorized","provider_publication_authorized","cloudflare_access_policy_mutation_authorized","main_mutation_authorized","production_mutation_authorized","secret_values_emitted"):
    req(manifest.get(k) is False,f"manifest safety drift: {k}")

# Build 15 must remain a forward-compatible retained proof.
b15c=b15.replace(" ","")
req("pointer_build>=15" in b15c and "ifpointer_build==15" in b15c,"Build 15 gate must remain forward-compatible")

# Journey + customer privacy
for token in ("request","review_proof","quote","making","fulfillment","complete","planning","curing_finishing","shipped_pickup","customerStageMessage","buildCustomerJourney"):
    req(token in helper,f"journey helper marker missing: {token}")
req("./_lib/customRequestJourney.js" in order_api and "buildCustomerJourney" in order_api and "customerStageMessage" in order_api,"private order API must use shared customer-safe journey")
req("orders.notes" not in order_api,"private order API must not expose raw orders.notes")
req("SELECT stage_key, stage_label, stage_notes" not in order_api,"private order API must not select raw stage_notes")
req("stage_notes:link.stage_notes" not in order_api.replace(" ",""),"private order API must not return raw link stage notes")
for token in ("customer_stage","journey","fulfillment_message","internal production notes are deliberately not included","Reviewed progress photos","Reviewed candle / soap facts"):
    req(token in order_client,f"customer status renderer marker missing: {token}")
req(order_client==order_compat,"root/public order-status compatibility copies must stay synchronized")
one_h1(order_page,"private order page")
req("noindex,nofollow" in order_page and "custom-request-journey.css?v=467b16" in order_page and "internal production notes" in order_page.lower(),"private order page safety/wiring drifted")

# Evidence-backed examples and public proof
upper_examples=examples_api.upper()
for forbidden in ("CREATE TABLE","ALTER TABLE","DROP TABLE","INSERT INTO","UPDATE PRODUCTS","DELETE FROM"):
    req(forbidden not in upper_examples,f"public examples API must remain read-only: {forbidden}")
for token in ("COALESCE(status,'active')='active'","COALESCE(review_status,'published') IN ('approved','published','')","custom_candle_soap_product_specs","featured_image_url","invented_claims:false","read_only:true","approved_existing_product_data"):
    req(token in examples_api,f"evidence-backed example marker missing: {token}")
for token in ("/api/custom-request-examples","/api/trust-blocks?context=custom_work","will not invent","customRequestExamplesMount","customRequestProofMount"):
    req(token in examples_client or token in public_page,f"public custom-work evidence marker missing: {token}")
for token in ("status IN ('approved', 'published')","approved_for_public_use = 1","privacy_review_status = 'cleared'"):
    req(token in trust_api,f"consent-cleared trust authority marker missing: {token}")
one_h1(public_page,"public custom request page")
for token in ("Request","Review & proof","Quote","Making","Pickup / shipping","Complete","Canada-only shipping","U.S. sales/shipping remain suspended","custom-request-journey.css?v=467b16"):
    req(token in public_page,f"public journey/policy marker missing: {token}")

# Made Today capture and touched stage-photo route
req("CREATE TABLE" not in stage_api.upper() and "ALTER TABLE" not in stage_api.upper(),"touched stage-photo route must contain no request-time DDL")
for token in ("schemaReady","custom_order_stage_photos_schema_unavailable","customer_private","needs_review","automatic_publication: false"):
    req(token in stage_api,f"stage-photo fail-closed/review marker missing: {token}")
one_h1(made_page,"Made Today admin page")
for token in ('capture="environment"',"process_notes","batch_material_facts","story_candidate","Photo Moderation","nothing is automatically published"):
    req(token.lower() in made_page.lower(),f"Made Today page marker missing: {token}")
for token in ("/api/admin/custom-requests","/api/admin/custom-order-stage-photos","customer_private","Story candidate — review only","No publication occurred"):
    req(token in made_client,f"Made Today client marker missing: {token}")
req("advance_order_stage" not in made_client,"Made Today must not advance order stage automatically")
req("social-post" not in made_client.lower() and "marketplace" not in made_client.lower(),"Made Today client must not invoke publication routes")
req("/admin/custom-request/made-today/" in admin_page and "review-only" in admin_page.lower(),"Custom Requests workspace must expose Made Today review handoff")
req("custom-request-journey" in css and "made-today-grid" in css,"Build 16 responsive style markers missing")

# Canonical migration and documentation boundary
req([x.get("file") for x in migrations.get("migrations",[])]==EXPECTED_MIGRATIONS,"canonical migrations drifted")
for token in ("Release 467 Build 16","Custom Request & Made Today Journey",BASE_SHA,"Release 467 Build 15","HOLD_EXTERNAL","Canada only","automatic_publication=false"):
    req(token in doc,f"Build 16 documentation marker missing: {token}")

allowed={
  ".github/workflows/release467-build16-proof.yml",
  "admin/custom-request/index.html","admin/custom-request/made-today/index.html",
  "css/custom-request-journey.css","custom-request-order-status.js","custom-request/index.html","custom-request/order/index.html",
  "current-development-authority.json","docs/operations/RELEASE_467_BUILD_16_CUSTOM_REQUEST_MADE_TODAY_JOURNEY.md",
  "functions/api/_lib/customRequestJourney.js","functions/api/admin/custom-order-stage-photos.js","functions/api/custom-request-examples.js","functions/api/custom-request-order.js",
  "public/js/admin-made-today.js","public/js/custom-request-examples.js","public/js/custom-request-order-status.js",
  "release467-build16-custom-request-made-today-journey.json","scripts/release467_build15_gate.py","scripts/release467_build16_gate.py"
}
ch=changed();extra=[x for x in ch if x not in allowed]
req(not extra,f"files outside Build 16 scope changed: {extra}")
req(not [x for x in ch if x.startswith("migrations/") or x.lower().endswith(".sql")],"Build 16 must not change schema/migrations")

if FAIL:
    print("FAIL Release 467 Build 16 Custom Request & Made Today Journey gate")
    [print(f"- {x}") for x in FAIL]
    sys.exit(1)
print("PASS Release 467 Build 16 Custom Request & Made Today Journey gate")
print("autonomous_backlog_items=11,12,13,14,15")
print("customer_safe_request_journey=GUARDED")
print("internal_customer_note_exposure=BLOCKED")
print("candle_soap_existing_fact_examples=GUARDED")
print("consent_cleared_public_proof=GUARDED")
print("made_today_review_capture=GUARDED")
print("automatic_publication=NONE")
print("canada_only_shipping_policy=PRESERVED")
print("us_sales_shipping_suspension=PRESERVED")
print("schema_migration=NONE")
print("main_production_mutation=NONE")
