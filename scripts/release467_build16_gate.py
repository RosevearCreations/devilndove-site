#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 16 — Custom Request & Made Today Journey."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
BASE_SHA="cb6a69ebf544a8eb74efeec409aeeb7ad1852a33"; BASE_TREE="2e9befcb349bbbb5b4dfd06f56b3d4b7bfdf9d60"
SYSTEM_GATE=33654847043; BUILD15_PROOF=33654846823
PROD_MAIN="296e53b079bba53126c80902be36a9271d82cea4"; PROD_DEPLOY=33655223149
MIGRATIONS=["0001_release464_migration_authority.sql","0002_release464_operational_acceptance.sql","0003_release464_business_growth.sql","0004_release465_storefront_quality.sql"]
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="replace")
def load(path):
    try: v=json.loads(read(path)); return v if isinstance(v,dict) else {}
    except Exception as e: FAIL.append(f"invalid JSON {path}: {e}"); return {}
def changed():
    try:
        base=subprocess.check_output(["git","merge-base","HEAD","origin/dev"],cwd=ROOT,text=True).strip()
        return [x for x in subprocess.check_output(["git","diff","--name-only",f"{base}...HEAD"],cwd=ROOT,text=True).splitlines() if x]
    except Exception as e: FAIL.append(f"could not calculate changed files: {e}"); return []
def one_h1(body,name): req(len(re.findall(r"<h1(?:\s|>)",body,re.I))==1,f"{name} must contain exactly one H1")

def hasall(body,tokens,label):
    for token in tokens: req(token in body,f"{label} marker missing: {token}")

p=load("current-development-authority.json"); m=load("release467-build16-custom-request-made-today-journey.json"); mig=load("migrations/canonical/manifest.json")
b13=read("scripts/release467_build13_gate.py"); b15=read("scripts/release467_build15_gate.py")
helper=read("functions/api/_lib/customRequestJourney.js"); order_api=read("functions/api/custom-request-order.js")
order_client=read("public/js/custom-request-order-status.js"); order_compat=read("custom-request-order-status.js")
examples_api=read("functions/api/custom-request-examples.js"); examples_client=read("public/js/custom-request-examples.js")
public_page=read("custom-request/index.html"); order_page=read("custom-request/order/index.html")
admin_page=read("admin/custom-request/index.html"); made_page=read("admin/custom-request/made-today/index.html")
made_client=read("public/js/admin-made-today.js"); stage_api=read("functions/api/admin/custom-order-stage-photos.js")
trust_api=read("functions/api/trust-blocks.js"); css=read("css/custom-request-journey.css")
doc=read("docs/operations/RELEASE_467_BUILD_16_CUSTOM_REQUEST_MADE_TODAY_JOURNEY.md")

# Current authority and immutable predecessor.
req(p.get("release")==467 and p.get("build")==16 and p.get("title")=="Custom Request & Made Today Journey","Build 16 pointer identity drifted")
req(p.get("state")=="DEVELOPMENT_CANDIDATE" and p.get("feature_branch")=="release467-build16-custom-request-made-today-journey","Build 16 candidate/branch drifted")
req(p.get("source_base_sha")==BASE_SHA and p.get("source_base_tree_sha")==BASE_TREE,"Build 16 source base drifted")
req(p.get("last_green_build")==15 and p.get("last_green_dev_sha")==BASE_SHA and p.get("last_green_dev_tree_sha")==BASE_TREE,"Build 15 predecessor drifted")
req(p.get("last_green_system_gate_run")==SYSTEM_GATE and p.get("last_green_build_proof_run")==BUILD15_PROOF,"Build 15 evidence drifted")
req(p.get("main_source_head_last_verified")==PROD_MAIN and p.get("production_pages_deploy_last_verified")==PROD_DEPLOY,"verified Production checkpoint drifted")
auth=p.get("current_release_authorities") or []
req(auth and auth[0]=="release467-build16-custom-request-made-today-journey.json" and "release467-build15-storefront-seo-parity.json" in auth,"current authority chain drifted")
req(p.get("autonomous_backlog_active_build")==16 and p.get("autonomous_backlog_active_items")==[11,12,13,14,15],"Build 16 backlog pointer drifted")
req(p.get("promotion_state")=="NO_AUTOMATIC_PROMOTION","automatic Production promotion forbidden")
for k in ("schema_change_authorized","d1_mutation_authorized","r2_mutation_authorized","provider_execution_authorized","provider_publication_authorized","cloudflare_access_mutation_authorized","main_mutation_authorized","production_mutation_authorized","secret_values_emitted"): req(p.get(k) is False,f"pointer safety drift: {k}")
ca=p.get("compatibility_authority") or {}; req(ca.get("role")=="INHERITED_REGRESSION_COMPATIBILITY" and ca.get("runtime_release_header")==466 and ca.get("runtime_release_header_role")=="INHERITED_RUNTIME_COMPATIBILITY","compatibility classification drifted")

# Build 16 manifest.
req(m.get("release")==467 and m.get("build")==16 and m.get("title")=="Custom Request & Made Today Journey","manifest identity drifted")
req(m.get("source_base_sha")==BASE_SHA and m.get("source_base_tree_sha")==BASE_TREE and m.get("backlog_items")==[11,12,13,14,15],"manifest base/backlog drifted")
pr=m.get("predecessor") or {}; req(pr.get("merged_dev_sha")==BASE_SHA and pr.get("merged_dev_tree_sha")==BASE_TREE and pr.get("system_gate_run")==SYSTEM_GATE and pr.get("build15_proof_run")==BUILD15_PROOF,"manifest predecessor evidence drifted")
req(pr.get("production_main_sha")==PROD_MAIN and pr.get("production_pages_deploy_run")==PROD_DEPLOY,"manifest Production provenance drifted")
j=m.get("journey") or {}; e=m.get("evidence_policy") or {}; mt=m.get("made_today") or {}; f=m.get("fulfillment_policy") or {}
req(j.get("visible_steps")==["request","review_proof","quote","making","fulfillment","complete"] and j.get("order_stages")==["planning","making","curing_finishing","ready","shipped_pickup","complete"],"journey contract drifted")
req(j.get("customer_safe_stage_messages") is True and j.get("internal_order_notes_exposed_to_customer") is False and j.get("internal_stage_notes_exposed_to_customer") is False,"customer privacy contract drifted")
req(e.get("candle_soap_examples_use_existing_data_only") is True and e.get("invented_claims") is False and e.get("public_proof_requires_consent_clearance") is True,"evidence policy drifted")
req(mt.get("default_public_use_status")=="customer_private" and mt.get("default_moderation_status")=="needs_review" and mt.get("automatic_order_stage_advance") is False and mt.get("automatic_publication") is False,"Made Today review boundary drifted")
req(f.get("allowed_shipping_countries")==["CA"] and f.get("us_sales_shipping_suspended") is True,"Canada-only/U.S. suspension drifted")
for k in ("schema_change_authorized","request_time_schema_mutation","new_d1_mutation_authorized","d1_mutation_authorized","new_r2_mutation_authorized","r2_mutation_authorized","provider_execution_authorized","provider_publication_authorized","cloudflare_access_policy_mutation_authorized","main_mutation_authorized","production_mutation_authorized","secret_values_emitted"): req(m.get(k) is False,f"manifest safety drift: {k}")

# Retained predecessor gates stay forward-compatible; Build 13 may accept newer verified Production provenance but never a placeholder.
b15c=b15.replace(" ",""); req("pointer_build>=15" in b15c and "ifpointer_build==15" in b15c,"Build 15 gate lost forward compatibility")
req("newer pointer must retain a trusted 40-character Production SHA" in b13 and "BUILD11_PROD_DEPLOY" in b13,"Build 13 Production-provenance compatibility repair missing")

# Customer-safe journey/privacy.
hasall(helper,["review_proof","fulfillment","planning","curing_finishing","shipped_pickup","customerStageMessage","buildCustomerJourney"],"journey helper")
hasall(order_api,["./_lib/customRequestJourney.js","buildCustomerJourney","customerStageMessage","SELECT stage_key, stage_label, created_at","fulfillment_message"],"private order API")
req("orders.notes" not in order_api and "SELECT stage_key, stage_label, stage_notes" not in order_api and "stage_notes:link.stage_notes" not in order_api.replace(" ",""),"raw internal order/stage notes must not be customer-visible")
hasall(order_client,["customer_stage","journey","fulfillment_message","internal production notes are deliberately not included","Reviewed progress photos","Reviewed candle / soap facts"],"customer status renderer")
req(order_client==order_compat,"root/public order-status compatibility copies drifted")
one_h1(order_page,"private order page"); hasall(order_page,["noindex,nofollow","custom-request-journey.css?v=467b16","internal production notes"],"private order page")

# Evidence-backed candle/soap examples and consent-cleared proof.
upper=examples_api.upper()
for forbidden in ("CREATE TABLE","ALTER TABLE","DROP TABLE","INSERT INTO","UPDATE PRODUCTS","DELETE FROM"): req(forbidden not in upper,f"public examples API must remain read-only: {forbidden}")
hasall(examples_api,["COALESCE(status,'active')='active'","COALESCE(review_status,'published') IN ('approved','published','')","custom_candle_soap_product_specs","featured_image_url","invented_claims:false","read_only:true","approved_existing_product_data"],"example API")
hasall(examples_client,["/api/custom-request-examples","/api/trust-blocks?context=custom_work","will not invent"],"example/proof client")
hasall(trust_api,["status IN ('approved', 'published')","approved_for_public_use = 1","privacy_review_status = 'cleared'"],"public trust authority")
one_h1(public_page,"public custom request page")
hasall(public_page,["Request","Review & proof","Quote","Making","Pickup / shipping","Complete","Canada-only shipping","U.S. sales/shipping remain suspended","customRequestExamplesMount","customRequestProofMount","custom-request-journey.css?v=467b16"],"public custom-request journey")

# Made Today and touched stage-photo schema firewall.
req("CREATE TABLE" not in stage_api.upper() and "ALTER TABLE" not in stage_api.upper(),"touched stage-photo route must contain no request-time DDL")
hasall(stage_api,["schemaReady","custom_order_stage_photos_schema_unavailable","customer_private","needs_review","automatic_publication: false"],"stage-photo route")
one_h1(made_page,"Made Today admin page")
hasall(made_page,['capture="environment"',"process_notes","batch_material_facts","story_candidate","Photo Moderation","nothing is automatically published"],"Made Today page")
hasall(made_client,["/api/admin/custom-requests","/api/admin/custom-order-stage-photos","customer_private","Story candidate — review only","No publication occurred"],"Made Today client")
req("advance_order_stage" not in made_client and "social-post" not in made_client.lower(),"Made Today must not auto-advance or invoke social publication")
req("/admin/custom-request/made-today/" in admin_page and "review-only" in admin_page.lower(),"Custom Requests workspace must expose Made Today review handoff")
hasall(css,["custom-request-journey","made-today-grid"],"Build 16 responsive CSS")

# Migration/docs/scope.
req([x.get("file") for x in mig.get("migrations",[])]==MIGRATIONS,"canonical migrations drifted")
hasall(doc,["Release 467 Build 16","Custom Request & Made Today Journey",BASE_SHA,"Release 467 Build 15","HOLD_EXTERNAL","Canada only","automatic_publication=false"],"Build 16 documentation")
allowed={
 ".github/workflows/release467-build16-proof.yml","admin/custom-request/index.html","admin/custom-request/made-today/index.html","css/custom-request-journey.css","custom-request-order-status.js","custom-request/index.html","custom-request/order/index.html","current-development-authority.json","docs/operations/RELEASE_467_BUILD_16_CUSTOM_REQUEST_MADE_TODAY_JOURNEY.md","functions/api/_lib/customRequestJourney.js","functions/api/admin/custom-order-stage-photos.js","functions/api/custom-request-examples.js","functions/api/custom-request-order.js","public/js/admin-made-today.js","public/js/custom-request-examples.js","public/js/custom-request-order-status.js","release467-build16-custom-request-made-today-journey.json","scripts/release467_build13_gate.py","scripts/release467_build15_gate.py","scripts/release467_build16_gate.py"
}
ch=changed(); extra=[x for x in ch if x not in allowed]; req(not extra,f"files outside Build 16 scope changed: {extra}")
req(not [x for x in ch if x.startswith("migrations/") or x.lower().endswith(".sql")],"Build 16 must not change schema/migrations")
if FAIL:
 print("FAIL Release 467 Build 16 Custom Request & Made Today Journey gate"); [print(f"- {x}") for x in FAIL]; sys.exit(1)
print("PASS Release 467 Build 16 Custom Request & Made Today Journey gate")
print("autonomous_backlog_items=11,12,13,14,15")
print("customer_safe_request_journey=GUARDED")
print("internal_customer_note_exposure=BLOCKED")
print("candle_soap_existing_fact_examples=GUARDED")
print("consent_cleared_public_proof=GUARDED")
print("made_today_review_capture=GUARDED")
print("request_time_stage_photo_ddl=BLOCKED")
print("automatic_publication=NONE")
print("canada_only_shipping_policy=PRESERVED")
print("us_sales_shipping_suspension=PRESERVED")
print("schema_migration=NONE")
print("main_production_mutation=NONE")
