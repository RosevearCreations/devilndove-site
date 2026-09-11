#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 96 — Product Browser Search & Focus Filters."""
from pathlib import Path
import json, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B95_SHA='746eb697484aaa7d2506b9025873510c4586c48a'
B95_TREE='be7f10517a6a0b247d387436d8414f5d22480e32'
B95_PROOFS={'system_gate_run':34545373706,'current_application_quality_run':34545373640,'it_admin_runtime_proof_run':34545373627,'branch_hygiene_run':34545373651}
B95_PAGES=34545520443
B95_LIVE=34545592072
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']

def read(path):
    target=ROOT/path
    if not target.is_file(): FAIL.append(f'missing required file: {path}'); return ''
    return target.read_text(encoding='utf-8',errors='replace')
def load(path):
    try:return json.loads(read(path) or '{}')
    except json.JSONDecodeError as exc:FAIL.append(f'invalid JSON {path}: {exc}');return{}
def req(ok,msg):
    if not ok:FAIL.append(msg)
def run(cmd,label):
    result=subprocess.run(cmd,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if result.stdout.strip(): print(result.stdout.strip())
    req(result.returncode==0,f"{label} failed: {(result.stderr or result.stdout).strip()[-3600:]}")
def compact(body): return re.sub(r'\s+','',body)

pointer=load('current-development-authority.json')
b95=load('release467-build95-product-workspace-current-context.json')
b96=load('release467-build96-product-browser-focus.json')
manifest=load('migrations/canonical/manifest.json')
enhancements=read('public/js/admin-products-enhancements.js')
table_css=read('css/admin-products-table-layout.css')
middleware=read('functions/_middleware.js')
it_api=read('functions/api/admin/it-operations-control-tower.js')
it_client=read('public/js/admin-it-control-tower.js')
it_page=read('admin/it/index.html')
reliability=read('functions/api/_lib/currentReliability.js')
reliability_page=read('admin/reliability/index.html')
preflight=read('functions/api/admin/current-deployment-preflight.js')
preflight_page=read('admin/deployment-preflight/index.html')
doc=read('docs/operations/RELEASE_467_BUILD_96_PRODUCT_BROWSER_SEARCH_FOCUS.md')
provenance=read('scripts/current_system_gate_provenance_gate.py')

# Restart authority must ingest the exact externally proven Build 95 closure.
req(pointer.get('release')==467 and pointer.get('build')==96,'current authority must be Release 467 Build 96')
req(pointer.get('title')=='Product Browser Search & Focus Filters','Build 96 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified Development GREEN state')
req(pointer.get('accepted_dev_sha')==B95_SHA and pointer.get('accepted_dev_tree_sha')==B95_TREE,'Build 96 accepted Development SHA/tree must equal Build 95 closure')
req((pointer.get('acceptance') or {})==B95_PROOFS,'Build 96 accepted Development proof set must equal Build 95')
req(pointer.get('promotion_state')=='BUILD96_CANDIDATE_NOT_YET_VERIFIED','Build 96 promotion state must remain fail-closed candidate')
restart=pointer.get('restart_integrity') or {}; last=restart.get('last_fully_verified') or {}; cand=restart.get('current_closure_candidate') or {}; prod=pointer.get('production_checkpoint') or {}
req(last.get('build')==95 and last.get('dev_sha')==B95_SHA and last.get('tree_sha')==B95_TREE and (last.get('proofs') or {})==B95_PROOFS,'Build 95 restart closure drifted')
req(cand.get('build')==96 and cand.get('authority')=='release467-build96-product-browser-focus.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 96 closure-candidate pointer drifted')
req(prod.get('build')==95 and prod.get('main_sha')==B95_SHA and prod.get('tree_sha')==B95_TREE and prod.get('production_pages_deploy_run')==B95_PAGES and prod.get('production_live_resource_integrity_run')==B95_LIVE,'Build 95 Production baseline drifted')
for key in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','automatic_production_promotion_authorized','request_time_schema_mutation','secret_values_emitted'):
    req(pointer.get(key) is False,f'unsafe pointer flag must remain false: {key}')

# Build 95 immutable closure and Build 96 candidate start.
req(b95.get('state')=='PRODUCTION_GREEN','Build 95 authority must retain Production GREEN')
f95=b95.get('final_closure') or {}; p95=b95.get('production_checkpoint') or {}
req(f95.get('dev_sha')==B95_SHA and f95.get('tree_sha')==B95_TREE and (f95.get('proofs') or {})==B95_PROOFS,'Build 95 final closure drifted')
req(f95.get('proof_state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN' and f95.get('ingested_by_build')==96,'Build 95 final closure must be exact and ingested by Build 96')
for key in ('exact_preview_deployment','canonical_development_d1_proof','development_data_authority_read_only','preview_bindings_proof','non_secret_preview_smoke','regression_evidence'):
    req(f95.get(key) is True,f'Build 95 final closure missing {key}')
req(p95.get('main_sha')==B95_SHA and p95.get('tree_sha')==B95_TREE and p95.get('production_pages_deploy_run')==B95_PAGES and p95.get('production_live_resource_integrity_run')==B95_LIVE and p95.get('state')=='PRODUCTION_GREEN','Build 95 Production closure drifted')
req(b96.get('release')==467 and b96.get('build')==96 and b96.get('title')=='Product Browser Search & Focus Filters','Build 96 authority identity drifted')
req(b96.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 96 authority must remain closure candidate')
sd=(b96.get('starting_point') or {}).get('development') or {}; sp=(b96.get('starting_point') or {}).get('production') or {}
req(sd.get('sha')==B95_SHA and sd.get('tree')==B95_TREE and sd.get('system_gate_run')==B95_PROOFS['system_gate_run'] and sd.get('quality_run')==B95_PROOFS['current_application_quality_run'] and sd.get('it_admin_runtime_run')==B95_PROOFS['it_admin_runtime_proof_run'] and sd.get('repository_hygiene_run')==B95_PROOFS['branch_hygiene_run'],'Build 96 Development starting point drifted')
req(sp.get('main_sha')==B95_SHA and sp.get('tree_sha')==B95_TREE and sp.get('production_pages_deploy_run')==B95_PAGES and sp.get('production_live_resource_integrity_run')==B95_LIVE,'Build 96 Production starting point drifted')
req(b96.get('final_closure') is None and b96.get('production_checkpoint') is None,'Build 96 must not contain premature final closure/Production proof')

# Build 96 Product browser must remain presentation-only and reuse the shared snapshot.
for token in ("FILTER_KEY = 'dd_catalog_table_filter_v1'","SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2'","catalogProductSearch","data-product-focus-filter=\"all\"","data-product-focus-filter=\"attention\"","data-product-focus-filter=\"drafts\"","data-product-focus-filter=\"low_stock\"","data-product-focus-filter=\"missing_image\"","Needs attention","Clear search &amp; filters","catalogProductFilterStatus","productSearchText","matchesFocus","focusCounts","applyProductFilters","row.hidden","Show current Product","scrollIntoView","aria-pressed"):
    req(token in enhancements,f'Build 96 Product browser missing token: {token}')
req('/api/' not in enhancements and 'apiFetch(' not in enhancements and 'fetch(' not in enhancements,'Build 96 Product browser must not add Product/API reads or writes')
for token in ('products-admin-table-wrap','data-current-product-row="1"','products-admin-table tbody tr[hidden]','product-table-filter-controls','product-table-focus-actions','.btn[aria-pressed="true"]','@media(max-width:720px)'):
    req(token in table_css,f'Build 96 Product browser CSS missing: {token}')
req("PRODUCTS_ASSET_REVISION = '467-products-b96-focus'" in middleware,'Build 96 Product asset cache-buster missing')

scope=b96.get('scope') or {}; acceptance=b96.get('acceptance') or {}
for key in ('ingest_build95_final_closure','loaded_product_search','all_products_focus','needs_attention_focus','draft_focus','low_stock_focus','missing_lead_image_focus','filter_result_count','browser_local_filter_preferences','explicit_show_current_product_clears_filters','build95_current_product_context_preserved','build95_table_ergonomics_preserved','build94_navigation_readability_preserved','single_product_authority_preserved','shared_product_snapshot_reused','one_h1_rule_unchanged'):
    req(scope.get(key) is True,f'Build 96 scope missing {key}')
for key in ('business_data_change','schema_change','additional_product_api_read','automatic_provider_execution','provider_publication','automatic_production_promotion'):
    req(scope.get(key) is False,f'Build 96 unsafe scope drifted: {key}')
for key in ('search_matches_loaded_product_identity_and_workflow_text','quick_focus_filters_are_operator_selected','needs_attention_covers_draft_low_stock_missing_image_and_needs_changes','focus_counts_come_from_shared_snapshot','current_product_hidden_state_is_explained','show_current_product_requires_explicit_click','clearing_filters_restores_all_rendered_rows','filter_state_is_browser_local_only','no_additional_product_api_or_database_read','build96_source_gate_required'):
    req(acceptance.get(key) is True,f'Build 96 acceptance missing {key}')

# Current operator projections use Build 96 over exact Build 95 closure.
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req(B95_SHA in text and B95_TREE in text,f'{label} missing Build 95 verified SHA/tree')
    for value in B95_PROOFS.values(): req(str(value) in text,f'{label} missing Build 95 Development proof {value}')
    req(str(B95_PAGES) in text and str(B95_LIVE) in text,f'{label} missing Build 95 Production proof')
req('constBUILD=96;' in compact(it_api),'I.T. API must identify Build 96')
req('CURRENT_RELIABILITY_BUILD = 96' in reliability,'Reliability must identify Build 96')
req('constBUILD=96;' in compact(preflight),'Deployment Preflight must identify Build 96')
req('Release 467 Build 96' in it_client and 'Release 467 Build 96' in it_page,'I.T. current surfaces must identify Build 96')
req('Release 467 • Build 96' in reliability_page,'Reliability page must identify Build 96')
req('Release 467 Build 96' in preflight_page,'Deployment Preflight page must identify Build 96')
for page,label in ((it_page,'I.T.'),(reliability_page,'Reliability'),(preflight_page,'Deployment Preflight')):
    req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,f'{label} page must contain exactly one H1')
    req('current-responsive.css' in page,f'{label} page must explicitly load current responsive CSS')

for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
    body=read(path)
    for token in (B95_SHA,B95_TREE,str(B95_PROOFS['system_gate_run']),str(B95_PROOFS['current_application_quality_run']),str(B95_PROOFS['it_admin_runtime_proof_run']),str(B95_PROOFS['branch_hygiene_run']),str(B95_PAGES),str(B95_LIVE)):
        req(token in body,f'{path} missing Build 95 verified token: {token}')
    req('Build 96' in body and 'Product Browser Search & Focus Filters' in body,f'{path} must identify Build 96 current candidate')
for token in ('Build 95','search','Needs attention','Drafts','Low stock','Missing lead image','browser-local','Show current Product','no second Product API','0001','0004','Canada-only','U.S. sales/shipping'):
    req(token.lower() in doc.lower(),f'Build 96 operating document missing token: {token}')

req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Build 96 must keep canonical migrations exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 96 must remain schema-neutral')
req("run_current_contract('scripts/release467_build96_gate.py', 'Release 467 Build 96')" in provenance,'System Gate does not chain Build 96')
req("run_current_contract('scripts/release467_build95_gate.py', 'Release 467 Build 95')" not in provenance,'Current System Gate must supersede Build 95 current-surface gate with Build 96')

for path in ('functions/_middleware.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-products-enhancements.js'):
    run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_responsive_layout_gate.py'],'current responsive layout')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. release truth')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
run(['python3','scripts/release467_build94_gate.py'],'carried Build 94 historical boundary')

if FAIL:
    print('RELEASE 467 BUILD 96 PRODUCT BROWSER SEARCH & FOCUS FILTERS: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 96 PRODUCT BROWSER SEARCH & FOCUS FILTERS: PASS')
print('Build 95 final Development + Production closure: INGESTED')
print('Product browser: SEARCH + ALL/ATTENTION/DRAFT/LOW-STOCK/MISSING-IMAGE FOCUS')
print('Current Product recovery: EXPLICIT SHOW-CURRENT ACTION')
print('Additional Product API/database read: NONE')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
