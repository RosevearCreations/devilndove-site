#!/usr/bin/env python3
"""Retained fail-closed contract for Release 467 Build 93 — Centered Application Shell & Overflow Accessibility."""
from pathlib import Path
import json, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
B93_SHA='be70b37f61574ec7a11bbad445ab30d0f280bbf3'
B93_TREE='a68a11663f02bfa496883220aa9d8940da4c3cbc'
B93_PROOFS={'system_gate_run':34513256032,'current_application_quality_run':34513256105,'it_admin_runtime_proof_run':34513256055,'branch_hygiene_run':34513256082}
B93_PAGES=34513466761
B93_LIVE=34513570740
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
b93=load('release467-build93-centered-application-shell-overflow-accessibility.json')
manifest=load('migrations/canonical/manifest.json')
doc=read('docs/operations/RELEASE_467_BUILD_93_CENTERED_APPLICATION_SHELL_OVERFLOW_ACCESSIBILITY.md')
provenance=read('scripts/current_system_gate_provenance_gate.py')

req(b93.get('release')==467 and b93.get('build')==93,'Build 93 authority identity drifted')
req(b93.get('title')=='Centered Application Shell & Overflow Accessibility','Build 93 title drifted')
req(b93.get('state')=='PRODUCTION_GREEN','Build 93 must retain PRODUCTION_GREEN final state')
final=b93.get('final_closure') or {}; prod93=b93.get('production_checkpoint') or {}
req(final.get('dev_sha')==B93_SHA and final.get('tree_sha')==B93_TREE,'Build 93 final SHA/tree drifted')
req((final.get('proofs') or {})==B93_PROOFS,'Build 93 final four-proof set drifted')
req(final.get('proof_state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN','Build 93 final proof state drifted')
for key in ('exact_preview_deployment','canonical_development_d1_proof','development_data_authority_read_only','preview_bindings_proof','non_secret_preview_smoke','regression_evidence'):
    req(final.get(key) is True,f'Build 93 final closure missing {key}')
req(final.get('ingested_by_build')==94,'Build 93 closure must be ingested by Build 94')
req(prod93.get('main_sha')==B93_SHA and prod93.get('tree_sha')==B93_TREE,'Build 93 Production SHA/tree drifted')
req(prod93.get('production_pages_deploy_run')==B93_PAGES,'Build 93 Production Pages run drifted')
req(prod93.get('production_live_resource_integrity_run')==B93_LIVE,'Build 93 live-resource run drifted')
req(prod93.get('state')=='PRODUCTION_GREEN','Build 93 Production state drifted')
for key in ('business_data_preserved','canonical_d1_proven','production_bindings_proven','public_smoke_proven','live_resources_proven'):
    req(prod93.get(key) is True,f'Build 93 Production closure missing {key}')

scope=b93.get('scope') or {}; acceptance=b93.get('acceptance') or {}
for key in ('center_public_application_shells','center_admin_application_shells','remove_root_horizontal_clipping','preserve_horizontal_reachability','contain_wide_data_regions_locally','keep_tables_scrollable_inside_viewport','prevent_grid_children_forcing_page_width','prevent_long_tokens_forcing_page_width','phone_tablet_desktop_wide_screen_supported','one_h1_rule_unchanged','layout_guard_read_only'):
    req(scope.get(key) is True,f'Build 93 historical scope missing {key}')
for key in ('business_data_change','schema_change','automatic_provider_execution','provider_publication','automatic_production_promotion'):
    req(scope.get(key) is False,f'Build 93 historical safety scope drifted: {key}')
for key in ('shell_margin_inline_auto','shell_width_bounded_to_viewport','html_overflow_x_clip_forbidden','document_horizontal_scroll_remains_recoverable','admin_cards_do_not_permanently_hide_horizontal_data','table_regions_have_local_horizontal_scroll','dynamic_tables_remain_wrapped','responsive_source_gate_extended','build93_source_gate_required'):
    req(acceptance.get(key) is True,f'Build 93 historical acceptance missing {key}')

req(pointer.get('release')==467 and int(pointer.get('build') or 0)>=94,'current authority must be Release 467 Build 94 or newer after Build 93 closure ingestion')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}; prod=pointer.get('production_checkpoint') or {}
req(int(last.get('build') or 0)>=93,'current restart authority may not regress behind Build 93')
req(int(prod.get('build') or 0)>=93,'current Production authority may not regress behind Build 93')
req('release467-build93-centered-application-shell-overflow-accessibility.json' in (pointer.get('current_release_authorities') or []),'current authority must retain Build 93 historical authority')

for token in ('center','overflow','right-side','keyboard','public','admin','0001','0004','Canada-only','U.S. sales/shipping'):
    req(token.lower() in doc.lower(),f'Build 93 operating document missing token: {token}')
req([row.get('file') for row in manifest.get('migrations',[])]==EXPECTED,'Build 93 canonical migration stream drifted')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 93 historical boundary expects no later canonical migration yet')
req("run_current_contract('scripts/release467_build93_gate.py', 'Release 467 Build 93')" in provenance,'Current System Gate does not chain Build 93')
run(['python3','scripts/release467_build92_gate.py'],'carried Build 92 boundary')

if FAIL:
    print('RELEASE 467 BUILD 93 CENTERED APPLICATION SHELL & OVERFLOW ACCESSIBILITY: FAIL')
    for item in FAIL:print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 93 CENTERED APPLICATION SHELL & OVERFLOW ACCESSIBILITY: PASS')
print('Build 93 final Development + Production closure: RETAINED')
print('Centered shell / right-side reachability: RETAINED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
