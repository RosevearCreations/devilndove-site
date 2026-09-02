#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 15 — Storefront / SEO Parity."""
from __future__ import annotations
import json, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
BASE_SHA="dd92a10799f0f7656fe9508a25a983839117a1d0"
BASE_TREE="dbe3ed8e1be82c02223a346f58a626654f8d5382"
SYSTEM_GATE=33649971571
BUILD14_PROOF=33649971525
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

pointer=load("current-development-authority.json")
manifest=load("release467-build15-storefront-seo-parity.json")
compat=load("development-release.json")
migrations=load("migrations/canonical/manifest.json")
b14=read("scripts/release467_build14_gate.py")
public_gate=read("scripts/release467_build15_public_seo_gate.py")
shared=read("public/js/storefront-parity.js")
seo=read("public/js/seo-page-overrides.js")
product=read("public/js/product-detail-parity.js")
shop=read("public/js/shop-parity.js")
shipping=read("public/js/storefront-shipping-policy.js")
buyer=read("functions/api/product-buyer-facts.js")
quality=read("public/js/admin-product-quality-command-center.js")
middleware=read("functions/api/_middleware.js")
checkout=read("functions/api/checkout-create-order.js")
payment=read("functions/api/checkout-prepare-payment.js")
market=read("functions/api/_lib/marketplaceReadiness.js")
quote=read("custom-request/quote/index.html")
docs=[read(x) for x in ("AI_HANDOFF.md","PROJECT_STATUS_AND_ROADMAP.md","SANITY_HEALTH_CHECK.md","MARKDOWN_INDEX.md","docs/operations/RELEASE_467_BUILD_15_STOREFRONT_SEO_PARITY.md")]

req(pointer.get("release")==467 and pointer.get("build")==15,"pointer must identify Release 467 Build 15")
req(pointer.get("title")=="Storefront / SEO Parity","Build 15 pointer title drifted")
req(pointer.get("state")=="DEVELOPMENT_CANDIDATE","Build 15 pointer must remain DEVELOPMENT_CANDIDATE before closure")
req(pointer.get("feature_branch")=="release467-build15-storefront-seo-parity","Build 15 feature branch drifted")
req(pointer.get("source_base_sha")==BASE_SHA and pointer.get("source_base_tree_sha")==BASE_TREE,"Build 15 source base drifted")
req(pointer.get("last_green_build")==14 and pointer.get("last_green_dev_sha")==BASE_SHA and pointer.get("last_green_dev_tree_sha")==BASE_TREE,"Build 14 predecessor pointer drifted")
req(pointer.get("last_green_system_gate_run")==SYSTEM_GATE and pointer.get("last_green_build_proof_run")==BUILD14_PROOF,"Build 14 green evidence drifted")
req((pointer.get("current_release_authorities") or [None])[0]=="release467-build15-storefront-seo-parity.json","Build 15 must be first current authority")
req("release467-build14-product-release-quality.json" in (pointer.get("current_release_authorities") or []),"Build 14 provenance missing")
req(pointer.get("autonomous_backlog_active_build")==15 and pointer.get("autonomous_backlog_active_items")==[6,7,8,9,10],"Build 15 backlog pointer drifted")
req(pointer.get("promotion_state")=="NO_AUTOMATIC_PROMOTION","automatic Production promotion remains forbidden")
for k in ("schema_change_authorized","d1_mutation_authorized","r2_mutation_authorized","provider_execution_authorized","provider_publication_authorized","cloudflare_access_mutation_authorized","main_mutation_authorized","production_mutation_authorized","secret_values_emitted"):
    req(pointer.get(k) is False,f"pointer safety drift: {k}")
ca=pointer.get("compatibility_authority") or {}
req(ca.get("role")=="INHERITED_REGRESSION_COMPATIBILITY" and ca.get("runtime_release_header")==466 and ca.get("runtime_release_header_role")=="INHERITED_RUNTIME_COMPATIBILITY","compatibility classification drifted")
req(compat.get("release")==466,"Release 466 compatibility evidence drifted")

req(manifest.get("release")==467 and manifest.get("build")==15 and manifest.get("title")=="Storefront / SEO Parity","Build 15 manifest identity drifted")
req(manifest.get("source_base_sha")==BASE_SHA and manifest.get("source_base_tree_sha")==BASE_TREE,"Build 15 manifest base drifted")
pr=manifest.get("predecessor") or {}
req(pr.get("build")==14 and pr.get("merged_dev_sha")==BASE_SHA and pr.get("merged_dev_tree_sha")==BASE_TREE and pr.get("system_gate_run")==SYSTEM_GATE and pr.get("build14_proof_run")==BUILD14_PROOF,"Build 15 predecessor evidence drifted")
req(manifest.get("backlog_items")==[6,7,8,9,10],"Build 15 must own backlog items 6-10")
runtime=manifest.get("runtime") or {};policy=manifest.get("policy") or {}
req(runtime.get("structured_data_visible_fact_only") is True and runtime.get("missing_buyer_facts_become_admin_remediation") is True,"visible fact/admin remediation contract drifted")
req(runtime.get("public_one_h1_rule_preserved") is True and runtime.get("canada_only_storefront_shipping_preserved") is True and runtime.get("us_sales_shipping_suspension_preserved") is True,"SEO/shipping policy contract drifted")
req(runtime.get("provider_execution") is False and runtime.get("provider_publication") is False and runtime.get("automatic_publication") is False and runtime.get("automatic_fact_inference") is False,"automatic/provider execution must remain closed")
req(policy.get("allowed_shipping_countries")==["CA"] and policy.get("server_fail_closed_code")=="shipping_country_not_supported" and policy.get("us_sales_shipping_suspended") is True,"Canada-only/U.S.-suspension policy drifted")
for k in ("schema_change_authorized","request_time_schema_mutation","new_d1_mutation_authorized","d1_mutation_authorized","r2_mutation_authorized","provider_execution_authorized","provider_publication_authorized","cloudflare_access_policy_mutation_authorized","main_mutation_authorized","production_mutation_authorized","secret_values_emitted"):
    req(manifest.get(k) is False,f"manifest safety drift: {k}")

b14c=b14.replace(" ","")
req("pointer_build>=14" in b14c and "ifpointer_build==14" in b14c,"Build 14 gate must remain forward-compatible")
for token in ("Product","Offer","BreadcrumbList","shippingDestination","additionalProperty","CA_ONLY","relationshipLinks","buyerFacts"):
    req(token in shared,f"shared storefront parity marker missing: {token}")
for token in ("storefront-parity.js","product-detail-parity.js","shop-parity.js","storefront-shipping-policy.js","custom-request"):
    req(token in seo,f"retained SEO bootstrap parity marker missing: {token}")
for token in ("productStructuredData","visible-facts","buyerFacts","relationshipLinks","productPolicyList"):
    req(token in product,f"Product parity marker missing: {token}")
for token in ("/api/product-buyer-facts","shop-product-card","Buyer facts","relationshipLinks"):
    req(token in shop,f"Shop parity marker missing: {token}")
for token in ("checkoutForm","shipping_country","customRequestForm","customQuotePreviewMount","Current shipping policy"):
    req(token in shipping,f"shipping policy surface marker missing: {token}")
for token in ("SELECT *","product_listing_profiles","product_story_public_notes","read_only: true","request_time_schema_mutation: false"):
    req(token in buyer,f"buyer-fact read authority marker missing: {token}")
for forbidden in ("CREATE TABLE","ALTER TABLE","DROP TABLE","INSERT INTO","UPDATE PRODUCTS","DELETE FROM"):
    req(forbidden not in buyer.upper(),f"buyer-fact public GET must stay read-only: {forbidden}")
quality_lower=quality.lower()
for token in ("buyer facts","buyer fact: materials","buyer fact: finish / condition","buyer fact: size / dimensions","buyer fact: care","buyer fact: personalization limits","buyer fact: availability","/api/product-buyer-facts"):
    req(token in quality_lower,f"Product Quality buyer-fact remediation marker missing: {token}")

for body,name in ((middleware,"middleware"),(checkout,"checkout create order")):
    req("shipping_country_not_supported" in body and "limited to Canada" in body,f"{name} Canada-only fail-closed guard missing")
req("allowed_countries][0]" in payment and '"CA"' in payment,"payment preparation must retain Canada-only shipping collection")
req("shipping_profile_reference" in market and "provider_execution_allowed" in market and "publication_allowed" in market,"marketplace preparation shipping/provider boundary missing")
req("storefront-parity.js" in quote and "storefront-shipping-policy.js" in quote and "customQuotePreviewMount" in quote,"private custom quote must load the shared Canada-only policy")
req("limited to Canada" in shared and "allowed_countries: ['CA']" in shared,"shared client policy must visibly define Canada-only fulfillment")

for token in ("exactly one H1","meta description","canonical","crawlable internal links","meaningful alt text","structured data","Product schema parity","storefront-parity.js"):
    req(token.lower() in public_gate.lower(),f"whole-site public SEO gate marker missing: {token}")
req([x.get("file") for x in migrations.get("migrations",[])]==EXPECTED_MIGRATIONS,"canonical migrations drifted")
for body in docs:
    for token in ("Release 467 Build 15","Storefront / SEO Parity",BASE_SHA,"Release 467 Build 14","Product Release Quality","HOLD_EXTERNAL"):
        req(token in body,f"Build 15 documentation token missing: {token}")

allowed={
"AI_HANDOFF.md","MARKDOWN_INDEX.md","PROJECT_STATUS_AND_ROADMAP.md","SANITY_HEALTH_CHECK.md","current-development-authority.json","custom-request/quote/index.html","data-deletion.html","privacy.html","social-connections.html","terms.html","docs/operations/RELEASE_467_BUILD_15_STOREFRONT_SEO_PARITY.md",
"functions/api/product-buyer-facts.js","public/js/admin-product-quality-command-center.js","public/js/product-detail-parity.js","public/js/seo-page-overrides.js","public/js/shop-parity.js","public/js/storefront-parity.js","public/js/storefront-shipping-policy.js",
"release467-build15-storefront-seo-parity.json","scripts/release467_build14_gate.py","scripts/release467_build15_public_seo_gate.py","scripts/release467_build15_gate.py",".github/workflows/release467-build15-proof.yml"
}
ch=changed();extra=[x for x in ch if x not in allowed]
req(not extra,f"files outside Build 15 scope changed: {extra}")
req(not [x for x in ch if x.startswith("migrations/") or x.lower().endswith(".sql")],"Build 15 must not change schema/migrations")

if FAIL:
    print("FAIL Release 467 Build 15 Storefront / SEO Parity gate")
    [print(f"- {x}") for x in FAIL]
    sys.exit(1)
print("PASS Release 467 Build 15 Storefront / SEO Parity gate")
print("autonomous_backlog_items=6,7,8,9,10")
print("visible_product_offer_breadcrumb_parity=GUARDED")
print("whole_site_public_seo_quality=GUARDED")
print("buyer_fact_admin_remediation=GUARDED")
print("canada_only_shipping_policy=GUARDED")
print("us_sales_shipping_suspension=PRESERVED")
print("schema_d1_r2_provider_access_main_production_mutation=NONE")
