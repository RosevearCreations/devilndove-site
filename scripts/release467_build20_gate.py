#!/usr/bin/env python3
"""Forward-compatible retained contract for Release 467 Build 20.

Build 20 remains immutable historical evidence. Later accepted application builds may supersede it as the
current runtime without rewriting Build 20's exact Development/Production proof.
"""
from __future__ import annotations
import json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
MERGED_SHA='7b38af543400a81593a8dc1b7caa4ad9a43033ea'; MERGED_TREE='550272841e764d77fc21297abede3d4cae1aaea0'
MERGED_SYSTEM_GATE=33688666947; MERGED_BUILD20_PROOF=33688733720
PROD_BUILD20_MAIN='055cbc973c667b35a209c7ea207779089f6fed3a'; PROD_BUILD20_DEPLOY=33688892602
MIGRATIONS=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f'missing required file: {path}'); return ''
    return p.read_text(encoding='utf-8',errors='replace')
def load(path):
    try:
        v=json.loads(read(path)); return v if isinstance(v,dict) else {}
    except Exception as e: FAIL.append(f'invalid JSON {path}: {e}'); return {}
p=load('current-development-authority.json'); m=load('release467-build20-workshop-tool-equipment-readiness.json'); b21=load('release467-build21-release-state-branch-ci-hygiene.json'); mig=load('migrations/canonical/manifest.json')
api=read('functions/api/admin/workshop-readiness.js'); page=read('admin/workshop-readiness/index.html'); client=read('public/js/admin-workshop-readiness.js')
pointer_build=int(p.get('build') or 0)
req(p.get('release')==467 and pointer_build>=20,'current Release 467 pointer must be Build 20 or newer')
req(p.get('promotion_state') in ('NO_AUTOMATIC_PROMOTION','EXPLICIT_PROMOTION_REQUESTED_AFTER_DEVELOPMENT_GREEN','PRODUCTION_GREEN_EXPLICIT_PROMOTION'),'automatic Production promotion must remain forbidden')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):
    req(p.get(k) is False,f'current pointer safety drift: {k}')
req(m.get('release')==467 and m.get('build')==20 and m.get('title')=='Workshop Tool & Equipment Readiness Command Center','Build 20 manifest identity drifted')
req(m.get('workspace')=='/admin/workshop-readiness/' and m.get('projection_endpoint')=='/api/admin/workshop-readiness' and m.get('role')=='READ_ONLY_OPERATIONS_PROJECTION','Build 20 workspace/role drifted')
req(m.get('attention_lanes')==['safety','service','alignment','replacement','evidence','warranty'],'Build 20 attention lanes drifted')
for k in ('schema_change_authorized','request_time_schema_mutation','new_d1_mutation_authorized','d1_mutation_authorized','new_r2_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_policy_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):
    req(m.get(k) is False,f'Build 20 manifest safety drift: {k}')
if pointer_build>=21:
    req(b21.get('release')==467 and b21.get('build')==21,'Build 21 transitive authority missing')
    req(b21.get('source_base_sha')==MERGED_SHA and b21.get('source_base_tree_sha')==MERGED_TREE,'Build 21 must retain exact merged Build 20 source')
    pred=b21.get('predecessor') or {}
    req(pred.get('build')==20 and pred.get('merged_dev_sha')==MERGED_SHA and pred.get('merged_dev_tree_sha')==MERGED_TREE,'Build 21 predecessor must retain exact Build 20 runtime')
    req(pred.get('system_gate_run')==MERGED_SYSTEM_GATE and pred.get('build20_proof_run')==MERGED_BUILD20_PROOF,'Build 21 must retain exact Build 20 Development proof')
    req(pred.get('production_main_sha')==PROD_BUILD20_MAIN and pred.get('production_tree_sha')==MERGED_TREE and pred.get('production_pages_deploy_run')==PROD_BUILD20_DEPLOY,'Build 21 must retain exact Build 20 Production proof')
    req(int(p.get('application_runtime_authority_build') or 0)>=20,'newer current pointer must identify an application runtime authority Build 20 or newer')
    req(bool(re.fullmatch(r'[0-9a-f]{40}',str(p.get('application_runtime_tree_sha') or ''),re.I)),'current application runtime tree SHA must be explicit')
    req(int(p.get('last_green_build') or 0)>=20,'current pointer must retain a green Build 20-or-newer runtime')
prod_build=int(p.get('production_build_last_verified') or 0)
if prod_build<=20:
    req(p.get('main_source_head_last_verified')==PROD_BUILD20_MAIN and p.get('production_tree_last_verified')==MERGED_TREE and p.get('production_pages_deploy_last_verified')==PROD_BUILD20_DEPLOY,'current pointer Production Build 20 proof drifted')
else:
    req(bool(re.fullmatch(r'[0-9a-f]{40}',str(p.get('main_source_head_last_verified') or ''),re.I)),'newer Production main SHA must be explicit')
    req(bool(re.fullmatch(r'[0-9a-f]{40}',str(p.get('production_tree_last_verified') or ''),re.I)),'newer Production tree SHA must be explicit')
    req(int(p.get('production_pages_deploy_last_verified') or 0)>0,'newer Production deploy proof must be explicit')
upper=api.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM'):
    req(forbidden not in upper,f'Build 20 API must remain read-only: {forbidden}')
req('onRequestPost' not in api,'Build 20 endpoint must expose no POST handler')
for token in ('site_item_inventory','inventory_tool_lifecycle_profiles','automatic_tool_status_change:false','automatic_inventory_change:false','provider_execution:false','calibration_due_schedule:false'):
    req(token in api,f'Build 20 API marker missing: {token}')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Build 20 page must contain exactly one H1')
req('/api/admin/workshop-readiness' in client,'Build 20 client authority drifted')
req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted')
if FAIL:
    print('FAIL Release 467 Build 20 Workshop Tool & Equipment Readiness gate'); [print(f'- {x}') for x in FAIL]; sys.exit(1)
print('PASS Release 467 Build 20 Workshop Tool & Equipment Readiness gate')
print('Build20_provenance=IMMUTABLE_HISTORICAL_EVIDENCE')
print('newer_application_runtime_authority=ALLOWED_WHEN_EXPLICITLY_GREEN')
print('automatic_production_promotion=FORBIDDEN')
