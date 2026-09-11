#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 100 — Product Work Session & Progress."""
from pathlib import Path
import json, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B99_SHA='5cb212feda63ce198a12b9fb6ae8ac5cc3e926a2'
B99_TREE='4a3a6f6e1c187531c254187a08edd4bd4723a937'
B99_PROOFS={'system_gate_run':34553759863,'current_application_quality_run':34553759843,'it_admin_runtime_proof_run':34553759876,'branch_hygiene_run':34553759871}
B99_PAGES=34553869891
B99_LIVE=34553931594
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
    req(result.returncode==0,f"{label} failed: {(result.stderr or result.stdout).strip()[-3200:]}")
def compact(body): return re.sub(r'\s+','',body)

pointer=load('current-development-authority.json')
b99=load('release467-build99-product-work-views-sort.json')
b100=load('release467-build100-product-work-session.json')
manifest=load('migrations/canonical/manifest.json')
session=read('public/js/admin-products-work-session.js')
loader=read('public/js/admin-product-image-role-prompts.js')
workviews=read('public/js/admin-products-work-views.js')
enhancements=read('public/js/admin-products-enhancements.js')
it_api=read('functions/api/admin/it-operations-control-tower.js')
it_client=read('public/js/admin-it-control-tower.js')
it_page=read('admin/it/index.html')
reliability=read('functions/api/_lib/currentReliability.js')
reliability_page=read('admin/reliability/index.html')
preflight=read('functions/api/admin/current-deployment-preflight.js')
preflight_page=read('admin/deployment-preflight/index.html')
doc=read('docs/operations/RELEASE_467_BUILD_100_PRODUCT_WORK_SESSION.md')
provenance=read('scripts/current_system_gate_provenance_gate.py')

req(pointer.get('release')==467 and pointer.get('build')==100,'current authority must be Release 467 Build 100')
req(pointer.get('title')=='Product Work Session & Progress','Build 100 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified Development GREEN state')
req(pointer.get('accepted_dev_sha')==B99_SHA and pointer.get('accepted_dev_tree_sha')==B99_TREE,'Build 100 accepted Development SHA/tree must equal Build 99 closure')
req((pointer.get('acceptance') or {})==B99_PROOFS,'Build 100 accepted Development proof set must equal Build 99')
req(pointer.get('promotion_state')=='BUILD100_CANDIDATE_NOT_YET_VERIFIED','Build 100 promotion state must remain fail-closed candidate')
restart=pointer.get('restart_integrity') or {}; last=restart.get('last_fully_verified') or {}; cand=restart.get('current_closure_candidate') or {}; prod=pointer.get('production_checkpoint') or {}
req(last.get('build')==99 and last.get('dev_sha')==B99_SHA and last.get('tree_sha')==B99_TREE and (last.get('proofs') or {})==B99_PROOFS,'Build 99 restart closure drifted')
req(cand.get('build')==100 and cand.get('authority')=='release467-build100-product-work-session.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 100 closure-candidate pointer drifted')
req(prod.get('build')==99 and prod.get('main_sha')==B99_SHA and prod.get('tree_sha')==B99_TREE and prod.get('production_pages_deploy_run')==B99_PAGES and prod.get('production_live_resource_integrity_run')==B99_LIVE,'Build 99 Production baseline drifted')
for key in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','automatic_production_promotion_authorized','request_time_schema_mutation','secret_values_emitted'):
    req(pointer.get(key) is False,f'unsafe pointer flag must remain false: {key}')

req(b99.get('state')=='PRODUCTION_GREEN','Build 99 authority must be Production GREEN after Build 100 ingestion')
f99=b99.get('final_closure') or {}; p99=b99.get('production_checkpoint') or {}
req(f99.get('dev_sha')==B99_SHA and f99.get('tree_sha')==B99_TREE and (f99.get('proofs') or {})==B99_PROOFS,'Build 99 final closure drifted')
req(f99.get('proof_state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN' and f99.get('ingested_by_build')==100,'Build 99 final closure must be exact and ingested by Build 100')
for key in ('exact_preview_deployment','canonical_development_d1_proof','development_data_authority_read_only','preview_bindings_proof','non_secret_preview_smoke','regression_evidence'):
    req(f99.get(key) is True,f'Build 99 final closure missing {key}')
req(p99.get('main_sha')==B99_SHA and p99.get('tree_sha')==B99_TREE and p99.get('production_pages_deploy_run')==B99_PAGES and p99.get('production_live_resource_integrity_run')==B99_LIVE and p99.get('state')=='PRODUCTION_GREEN','Build 99 Production closure drifted')

req(b100.get('release')==467 and b100.get('build')==100 and b100.get('title')=='Product Work Session & Progress','Build 100 authority identity drifted')
req(b100.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 100 authority must remain closure candidate')
sd=(b100.get('starting_point') or {}).get('development') or {}; sp=(b100.get('starting_point') or {}).get('production') or {}
req(sd.get('sha')==B99_SHA and sd.get('tree')==B99_TREE and sd.get('system_gate_run')==B99_PROOFS['system_gate_run'] and sd.get('quality_run')==B99_PROOFS['current_application_quality_run'] and sd.get('it_admin_runtime_run')==B99_PROOFS['it_admin_runtime_proof_run'] and sd.get('repository_hygiene_run')==B99_PROOFS['branch_hygiene_run'],'Build 100 Development starting point drifted')
req(sp.get('main_sha')==B99_SHA and sp.get('tree_sha')==B99_TREE and sp.get('production_pages_deploy_run')==B99_PAGES and sp.get('production_live_resource_integrity_run')==B99_LIVE,'Build 100 Production starting point drifted')
req(b100.get('final_closure') is None and b100.get('production_checkpoint') is None,'Build 100 must not contain premature final closure/Production proof')

for token in ("SESSION_KEY = 'dd_catalog_work_session_v1'","SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2'",'MAX_ITEMS = 60','addVisibleProducts','nextIncomplete','nextBlocked','data-work-session-toggle','data-work-session-command','data-work-session-action','completed_at','openBlocker','locateProduct'):
    req(token in session,f'Build 100 work-session layer missing token: {token}')
req('/api/' not in session and 'apiFetch(' not in session and 'fetch(' not in session,'Build 100 work-session layer must not add Product/readiness network calls')
req("row.querySelector('[data-open-first-blocker]')" in session,'Build 100 next blocker must delegate existing first-blocker action')
req('clear filters' in session.lower() and 'hidden by the current Product view' in session,'Build 100 must not silently clear browser filters to locate hidden Products')
req("import('/public/js/admin-products-work-session.js?v=467b100')" in loader,'Build 100 Products-page loader/cache revision missing')
req("document.body?.dataset?.adminPage === 'products'" in loader,'Build 100 loader must remain scoped to Products admin')
for token in ("WORK_VIEWS_KEY = 'dd_catalog_work_views_v1'","SORT_KEY = 'dd_catalog_work_sort_v1'"):
    req(token in workviews,f'Build 99 saved-work-view behavior regressed: {token}')
for token in ("TRIAGE_KEY = 'dd_catalog_readiness_triage_v1'",'data-open-first-blocker','catalogOpenNextReadinessBlocker'):
    req(token in enhancements,f'Build 98 readiness behavior regressed: {token}')

scope=b100.get('scope') or {}; acceptance=b100.get('acceptance') or {}
for key in ('ingest_build99_final_closure','browser_local_product_work_session','pin_products_for_work','add_visible_products_to_session','browser_local_completion_progress','locate_next_product','delegate_existing_first_blocker_action','clear_completed_and_clear_session','reuse_rendered_product_rows','reuse_shared_product_snapshot','reuse_rendered_readiness_projection','build99_saved_work_views_preserved','build98_triage_preserved','build97_queue_preserved','build96_search_focus_preserved','build95_current_product_context_preserved','single_product_authority_preserved','one_h1_rule_unchanged'):
    req(scope.get(key) is True,f'Build 100 scope missing {key}')
for key in ('business_data_change','schema_change','additional_product_api_read','additional_readiness_api_read','automatic_provider_execution','provider_publication','automatic_production_promotion'):
    req(scope.get(key) is False,f'Build 100 unsafe scope drifted: {key}')
for key in ('work_session_is_browser_local','work_session_item_limit_is_sixty','row_add_remove_controls_are_browser_local','visible_products_can_be_pinned_explicitly','completion_state_is_browser_local','next_product_navigation_requires_operator_click','next_blocker_delegates_existing_action','hidden_products_do_not_silently_clear_filters','shared_product_snapshot_is_reused','rendered_readiness_projection_is_reused','no_product_or_readiness_api_call_added_to_work_session_layer','work_session_performs_no_product_mutation','build100_source_gate_required'):
    req(acceptance.get(key) is True,f'Build 100 acceptance missing {key}')

for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
    req(B99_SHA in text and B99_TREE in text,f'{label} missing Build 99 verified SHA/tree')
    for value in B99_PROOFS.values(): req(str(value) in text,f'{label} missing Build 99 Development proof {value}')
    req(str(B99_PAGES) in text and str(B99_LIVE) in text,f'{label} missing Build 99 Production proof')
req('constBUILD=100;' in compact(it_api),'I.T. API must identify Build 100')
req('CURRENT_RELIABILITY_BUILD = 100' in reliability,'Reliability must identify Build 100')
req('constBUILD=100;' in compact(preflight),'Deployment Preflight must identify Build 100')
req('Release 467 Build 100' in it_client and 'Release 467 Build 100' in it_page,'I.T. current surfaces must identify Build 100')
req('Release 467 • Build 100' in reliability_page,'Reliability page must identify Build 100')
req('Release 467 Build 100' in preflight_page,'Deployment Preflight page must identify Build 100')
for page,label in ((it_page,'I.T.'),(reliability_page,'Reliability'),(preflight_page,'Deployment Preflight')):
    req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,f'{label} page must contain exactly one H1')
    req('current-responsive.css' in page,f'{label} page must explicitly load current responsive CSS')

for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
    body=read(path)
    for token in (B99_SHA,B99_TREE,str(B99_PROOFS['system_gate_run']),str(B99_PROOFS['current_application_quality_run']),str(B99_PROOFS['it_admin_runtime_proof_run']),str(B99_PROOFS['branch_hygiene_run']),str(B99_PAGES),str(B99_LIVE)):
        req(token in body,f'{path} missing Build 99 verified token: {token}')
    req('Build 100' in body and 'Product Work Session' in body,f'{path} must identify Build 100 current candidate')
for token in ('Build 99','Product work session','60','browser-local','Open next blocker','no Product/readiness API','0001','0004','Canada-only','U.S. sales/shipping'):
    req(token.lower() in doc.lower(),f'Build 100 operating document missing token: {token}')

req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Build 100 must keep canonical migrations exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 100 must remain schema-neutral')
req("run_current_contract('scripts/release467_build100_gate.py', 'Release 467 Build 100')" in provenance,'System Gate does not chain Build 100')
req("run_current_contract('scripts/release467_build99_gate.py', 'Release 467 Build 99')" not in provenance,'Current System Gate must supersede Build 99 current-surface gate with Build 100')

for path in ('functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-products-work-session.js','public/js/admin-products-work-views.js','public/js/admin-product-image-role-prompts.js'):
    run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_responsive_layout_gate.py'],'current responsive layout')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. release truth')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
run(['python3','scripts/release467_build94_gate.py'],'carried Build 94 historical boundary')

if FAIL:
    print('RELEASE 467 BUILD 100 PRODUCT WORK SESSION & PROGRESS: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 100 PRODUCT WORK SESSION & PROGRESS: PASS')
print('Build 99 final Development + Production closure: INGESTED')
print('Product work session: BROWSER LOCAL / MAX 60')
print('Completion progress + next blocker: BROWSER LOCAL / EXISTING BLOCKER ACTION')
print('Additional Product/readiness API/database read: NONE')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
