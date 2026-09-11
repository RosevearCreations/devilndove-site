#!/usr/bin/env python3
"""Retained fail-closed contract for Release 467 Build 94 — Product Workspace Readability & Responsive Navigation."""
from pathlib import Path
import json, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B94_SHA='bcafa7bbfbf17793d4b6280195c44c435ff3c68e'
B94_TREE='f83d850b2b28ef4840463439a8b449ebbe1b9a43'
B94_PROOFS={'system_gate_run':34537169571,'current_application_quality_run':34537169401,'it_admin_runtime_proof_run':34537169400,'branch_hygiene_run':34537169580}
B94_PAGES=34537326802
B94_LIVE=34537397229
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
    if result.stdout.strip():print(result.stdout.strip())
    req(result.returncode==0,f"{label} failed: {(result.stderr or result.stdout).strip()[-3000:]}")

pointer=load('current-development-authority.json')
b94=load('release467-build94-product-workspace-readability.json')
manifest=load('migrations/canonical/manifest.json')
doc=read('docs/operations/RELEASE_467_BUILD_94_PRODUCT_WORKSPACE_READABILITY.md')
provenance=read('scripts/current_system_gate_provenance_gate.py')

req(b94.get('release')==467 and b94.get('build')==94,'Build 94 authority identity drifted')
req(b94.get('title')=='Product Workspace Readability & Responsive Navigation','Build 94 title drifted')
req(b94.get('state')=='PRODUCTION_GREEN','Build 94 must retain PRODUCTION_GREEN final state')
final=b94.get('final_closure') or {}; prod=b94.get('production_checkpoint') or {}
req(final.get('dev_sha')==B94_SHA and final.get('tree_sha')==B94_TREE,'Build 94 final SHA/tree drifted')
req((final.get('proofs') or {})==B94_PROOFS,'Build 94 final four-proof set drifted')
req(final.get('proof_state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN','Build 94 final proof state drifted')
req(final.get('ingested_by_build')==95,'Build 94 final closure must be ingested by Build 95')
for key in ('exact_preview_deployment','canonical_development_d1_proof','development_data_authority_read_only','preview_bindings_proof','non_secret_preview_smoke','regression_evidence'):
    req(final.get(key) is True,f'Build 94 final closure missing {key}')
req(prod.get('main_sha')==B94_SHA and prod.get('tree_sha')==B94_TREE,'Build 94 Production SHA/tree drifted')
req(prod.get('production_pages_deploy_run')==B94_PAGES,'Build 94 Production Pages run drifted')
req(prod.get('production_live_resource_integrity_run')==B94_LIVE,'Build 94 live-resource run drifted')
req(prod.get('state')=='PRODUCTION_GREEN','Build 94 Production state drifted')

scope=b94.get('scope') or {}
for key in ('product_workspace_navigation_readability','workspace_labels_preserve_words','workspace_description_vertical_flow','desktop_three_column_layout','tablet_two_column_layout','phone_single_column_layout','active_workspace_state_visible','keyboard_tab_navigation_preserved','single_product_authority_preserved','build93_centered_shell_preserved','one_h1_rule_unchanged'):
    req(scope.get(key) is True,f'Build 94 historical scope missing {key}')
for key in ('business_data_change','schema_change','automatic_provider_execution','provider_publication','automatic_production_promotion'):
    req(scope.get(key) is False,f'Build 94 historical safety scope drifted: {key}')

req(pointer.get('release')==467 and int(pointer.get('build') or 0)>=95,'current authority must be Release 467 Build 95 or newer after Build 94 closure ingestion')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}; current_prod=pointer.get('production_checkpoint') or {}
req(int(last.get('build') or 0)>=94,'current restart authority may not regress behind Build 94')
req(int(current_prod.get('build') or 0)>=94,'current Production authority may not regress behind Build 94')
req('release467-build94-product-workspace-readability.json' in (pointer.get('current_release_authorities') or []),'current authority must retain Build 94 historical authority')

for token in ('Products','Editor','Inventory Links','vertical','three-column','two columns','single column','keyboard','Build 93','0001','0004','Canada-only','U.S. sales/shipping'):
    req(token.lower() in doc.lower(),f'Build 94 operating document missing token: {token}')
req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Build 94 canonical migration stream drifted')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 94 historical boundary expects no later canonical migration yet')
req("run_current_contract('scripts/release467_build94_gate.py', 'Release 467 Build 94')" in provenance,'Current System Gate does not chain Build 94')
run(['python3','scripts/release467_build93_gate.py'],'carried Build 93 boundary')

if FAIL:
    print('RELEASE 467 BUILD 94 PRODUCT WORKSPACE READABILITY & RESPONSIVE NAVIGATION: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 94 PRODUCT WORKSPACE READABILITY & RESPONSIVE NAVIGATION: PASS')
print('Build 94 final Development + Production closure: RETAINED')
print('Product workspace readable 3/2/1 navigation: RETAINED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
