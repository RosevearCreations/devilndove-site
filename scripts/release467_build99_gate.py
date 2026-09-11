#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 99 — Product Work Views & Browser Sort."""
from pathlib import Path
import json, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B98_SHA='81d6ed5cdd55c959611f538de8c90bcf21f5b302'
B98_TREE='d19224681ade25301c07d96854c0b6c7a6abd762'
B98_PROOFS={'system_gate_run':34550999431,'current_application_quality_run':34550999419,'it_admin_runtime_proof_run':34550999479,'branch_hygiene_run':34550999409}
B98_PAGES=34551114694
B98_LIVE=34551173009
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
b98=load('release467-build98-product-readiness-triage.json')
b99=load('release467-build99-product-work-views-sort.json')
manifest=load('migrations/canonical/manifest.json')
workviews=read('public/js/admin-products-work-views.js')
loader=read('public/js/admin-product-image-role-prompts.js')
enhancements=read('public/js/admin-products-enhancements.js')
it_api=read('functions/api/admin/it-operations-control-tower.js')
it_client=read('public/js/admin-it-control-tower.js')
it_page=read('admin/it/index.html')
reliability=read('functions/api/_lib/currentReliability.js')
reliability_page=read('admin/reliability/index.html')
preflight=read('functions/api/admin/current-deployment-preflight.js')
preflight_page=read('admin/deployment-preflight/index.html')
doc=read('docs/operations/RELEASE_467_BUILD_99_PRODUCT_WORK_VIEWS_SORT.md')
provenance=read('scripts/current_system_gate_provenance_gate.py')

# Restart authority must ingest the exact externally proven Build 98 closure.
req(pointer.get('release')==467 and pointer.get('build')==99,'current authority must be Release 467 Build 99')
req(pointer.get('title')=='Product Work Views & Browser Sort','Build 99 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified Development GREEN state')
req(pointer.get('accepted_dev_sha')==B98_SHA and pointer.get('accepted_dev_tree_sha')==B98_TREE,'Build 99 accepted Development SHA/tree must equal Build 98 closure')
req((pointer.get('acceptance') or {})==B98_PROOFS,'Build 99 accepted Development proof set must equal Build 98')
req(pointer.get('promotion_state')=='BUILD99_CANDIDATE_NOT_YET_VERIFIED','Build 99 promotion state must remain fail-closed candidate')
restart=pointer.get('restart_integrity') or {}; last=restart.get('last_fully_verified') or {}; cand=restart.get('current_closure_candidate') or {}; prod=pointer.get('production_checkpoint') or {}
req(last.get('build')==98 and last.get('dev_sha')==B98_SHA and last.get('tree_sha')==B98_TREE and (last.get('proofs') or {})==B98_PROOFS,'Build 98 restart closure drifted')
req(cand.get('build')==99 and cand.get('authority')=='release467-build99-product-work-views-sort.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 99 closure-candidate pointer drifted')
req(prod.get('build')==98 and prod.get('main_sha')==B98_SHA and prod.get('tree_sha')==B98_TREE and prod.get('production_pages_deploy_run')==B98_PAGES and prod.get('production_live_resource_integrity_run')==B98_LIVE,'Build 98 Production baseline drifted')
for key in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','automatic_production_promotion_authorized','request_time_schema_mutation','secret_values_emitted'):
    req(pointer.get(key) is False,f'unsafe pointer flag must remain false: {key}')

# Build 98 immutable closure and Build 99 candidate start.
req(b98.get('state')=='PRODUCTION_GREEN','Build 98 authority must retain Production GREEN')
f98=b98.get('final_closure') or {}; p98=b98.get('production_checkpoint') or {}
req(f98.get('dev_sha')==B98_SHA and f98.get('tree_sha')==B98_TREE and (f98.get('proofs') or {})==B98_PROOFS,'Build 98 final closure drifted')
req(f98.get('proof_state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN' and f98.get('ingested_by_build')==99,'Build 98 final closure must be exact and ingested by Build 99')
for key in ('exact_preview_deployment','canonical_development_d1_proof','development_data_authority_read_only','preview_bindings_proof','non_secret_preview_smoke','regression_evidence'):
    req(f98.get(key) is True,f'Build 98 final closure missing {key}')
req(p98.get('main_sha')==B98_SHA and p98.get('tree_sha')==B98_TREE and p98.get('production_pages_deploy_run')==B98_PAGES and p98.get('production_live_resource_integrity_run')==B98_LIVE and p98.get('state')=='PRODUCTION_GREEN','Build 98 Production closure drifted')
req(b99.get('release')==467 and b99.get('build')==99 and b99.get('title')=='Product Work Views & Browser Sort','Build 99 authority identity drifted')
req(b99.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 99 authority must remain closure candidate')
sd=(b99.get('starting_point') or {}).get('development') or {}; sp=(b99.get('starting_point') or {}).get('production') or {}
req(sd.get('sha')==B98_SHA and sd.get('tree')==B98_TREE and sd.get('system_gate_run')==B98_PROOFS['system_gate_run'] and sd.get('quality_run')==B98_PROOFS['current_application_quality_run'] and sd.get('it_admin_runtime_run')==B98_PROOFS['it_admin_runtime_proof_run'] and sd.get('repository_hygiene_run')==B98_PROOFS['branch_hygiene_run'],'Build 99 Development starting point drifted')
req(sp.get('main_sha')==B98_SHA and sp.get('tree_sha')==B98_TREE and sp.get('production_pages_deploy_run')==B98_PAGES and sp.get('production_live_resource_integrity_run')==B98_LIVE,'Build 99 Production starting point drifted')
req(b99.get('final_closure') is None and b99.get('production_checkpoint') is None,'Build 99 must not contain premature final closure/Production proof')

# Work views/sort must remain browser-local and reuse existing Product/readiness authorities.
for token in ("WORK_VIEWS_KEY = 'dd_catalog_work_views_v1'","SORT_KEY = 'dd_catalog_work_sort_v1'","SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2'",'MAX_VIEWS = 8','captureView','applyView','saveCurrentView','deleteView','renderSavedViews','catalogWorkSort','catalogSaveWorkView','catalogResetWorkSort','number_asc','number_desc','name_asc','name_desc','readiness_low','readiness_high','stock_low','updated_newest'):
    req(token in workviews,f'Build 99 work-view layer missing token: {token}')
for token in ('catalogProductSearch','data-product-focus-filter','data-readiness-triage','prefHideSlug','prefHideSku','prefHideShipping','prefHideTax','prefCompactInventory'):
    req(token in workviews,f'Build 99 saved view does not reuse existing control: {token}')
req('/api/' not in workviews and 'apiFetch(' not in workviews and 'fetch(' not in workviews,'Build 99 work-view layer must not add Product/readiness network calls')
req("import('/public/js/admin-products-work-views.js?v=467b99')" in loader,'Build 99 Products-page loader/cache revision missing')
req("document.body?.dataset?.adminPage === 'products'" in loader,'Build 99 work-view loader must remain scoped to Products admin')
# Build 98 and earlier Product workflow authority must remain present.
for token in ("TRIAGE_KEY = 'dd_catalog_readiness_triage_v1'",'blockerGroup','readinessQueueRows','catalogOpenNextReadinessBlocker','catalogShowNextReadinessProduct','data-open-first-blocker'):
    req(token in enhancements,f'Build 98 readiness behavior regressed: {token}')

scope=b99.get('scope') or {}; acceptance=b99.get('acceptance') or {}
for key in ('ingest_build98_final_closure','browser_local_saved_work_views','saved_view_includes_search_focus_triage_columns_sort','browser_local_row_sort','reuse_shared_product_snapshot','reuse_rendered_readiness_projection','build98_triage_preserved','build97_queue_preserved','build96_search_focus_preserved','build95_current_product_context_preserved','build95_table_ergonomics_preserved','single_product_authority_preserved','one_h1_rule_unchanged'):
    req(scope.get(key) is True,f'Build 99 scope missing {key}')
for key in ('business_data_change','schema_change','additional_product_api_read','additional_readiness_api_read','automatic_provider_execution','provider_publication','automatic_production_promotion'):
    req(scope.get(key) is False,f'Build 99 unsafe scope drifted: {key}')
for key in ('saved_work_views_are_browser_local','saved_work_view_limit_is_eight','saved_view_restores_existing_search_focus_triage_column_controls','row_sort_is_browser_local_and_persisted','row_sort_supports_number_name_readiness_inventory_updated','original_product_order_can_be_restored','shared_product_snapshot_is_reused','rendered_readiness_projection_is_reused','no_product_or_readiness_api_call_added_to_work_view_layer','work_views_are_read_only_and_perform_no_product_mutation','build99_source_gate_required'):
    req(acceptance.get(key) is True,f'Build 99 acceptance missing {key}')

# Current operator projections use Build 99 over exact Build 98 closure.
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req(B98_SHA in text and B98_TREE in text,f'{label} missing Build 98 verified SHA/tree')
    for value in B98_PROOFS.values(): req(str(value) in text,f'{label} missing Build 98 Development proof {value}')
    req(str(B98_PAGES) in text and str(B98_LIVE) in text,f'{label} missing Build 98 Production proof')
req('constBUILD=99;' in compact(it_api),'I.T. API must identify Build 99')
req('CURRENT_RELIABILITY_BUILD = 99' in reliability,'Reliability must identify Build 99')
req('constBUILD=99;' in compact(preflight),'Deployment Preflight must identify Build 99')
req('Release 467 Build 99' in it_client and 'Release 467 Build 99' in it_page,'I.T. current surfaces must identify Build 99')
req('Release 467 • Build 99' in reliability_page,'Reliability page must identify Build 99')
req('Release 467 Build 99' in preflight_page,'Deployment Preflight page must identify Build 99')
for page,label in ((it_page,'I.T.'),(reliability_page,'Reliability'),(preflight_page,'Deployment Preflight')):
    req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,f'{label} page must contain exactly one H1')
    req('current-responsive.css' in page,f'{label} page must explicitly load current responsive CSS')

for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
    body=read(path)
    for token in (B98_SHA,B98_TREE,str(B98_PROOFS['system_gate_run']),str(B98_PROOFS['current_application_quality_run']),str(B98_PROOFS['it_admin_runtime_proof_run']),str(B98_PROOFS['branch_hygiene_run']),str(B98_PAGES),str(B98_LIVE)):
        req(token in body,f'{path} missing Build 98 verified token: {token}')
    req('Build 99' in body and 'Product Work Views' in body,f'{path} must identify Build 99 current candidate')
for token in ('Build 98','saved work views','eight','row sort','shared Product snapshot','no additional Product','0001','0004','Canada-only','U.S. sales/shipping'):
    req(token.lower() in doc.lower(),f'Build 99 operating document missing token: {token}')

req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Build 99 must keep canonical migrations exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 99 must remain schema-neutral')
req("run_current_contract('scripts/release467_build99_gate.py', 'Release 467 Build 99')" in provenance,'System Gate does not chain Build 99')
req("run_current_contract('scripts/release467_build98_gate.py', 'Release 467 Build 98')" not in provenance,'Current System Gate must supersede Build 98 current-surface gate with Build 99')

for path in ('functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-products-enhancements.js','public/js/admin-products-work-views.js','public/js/admin-product-image-role-prompts.js'):
    run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_responsive_layout_gate.py'],'current responsive layout')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. release truth')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
run(['python3','scripts/release467_build94_gate.py'],'carried Build 94 historical boundary')

if FAIL:
    print('RELEASE 467 BUILD 99 PRODUCT WORK VIEWS & BROWSER SORT: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 99 PRODUCT WORK VIEWS & BROWSER SORT: PASS')
print('Build 98 final Development + Production closure: INGESTED')
print('Saved Product work views: BROWSER LOCAL / MAX 8')
print('Product row sort: BROWSER LOCAL / SHARED SNAPSHOT + RENDERED READINESS')
print('Additional Product/readiness API/database read: NONE')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
