#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 21 — Release State, Branch & CI Hygiene Convergence."""
from __future__ import annotations
import json,subprocess,sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
BASE_SHA='7b38af543400a81593a8dc1b7caa4ad9a43033ea'
BASE_TREE='550272841e764d77fc21297abede3d4cae1aaea0'
BASE_SYSTEM=33688666947
BASE_PROOF=33688733720
PROD_MAIN='055cbc973c667b35a209c7ea207779089f6fed3a'
PROD_DEPLOY=33688892602
FEATURE='release467-build21-release-state-branch-ci-hygiene'
TITLE='Release State, Branch & CI Hygiene Convergence'
ARCHIVE_EXCEPTIONS={
    'backup-main-before-dev-replacement-20260830':'985ecfad41207f8bf46ad99e1346e6e69ece5a69',
    'release467-build7-handoff-convergence':'1486777699808c1252f585b7024e2fcfd6296b26',
}
RETIRED=[
    '.github/workflows/release467-build16-proof.yml',
    '.github/workflows/release467-build17-proof.yml',
    '.github/workflows/release467-build18-proof.yml',
    '.github/workflows/release467-build19-proof.yml',
    '.github/workflows/release467-build20-proof.yml',
]

def req(ok,msg):
    if not ok: FAIL.append(msg)

def read(path):
    p=ROOT/path
    if not p.is_file():
        FAIL.append(f'missing required file: {path}')
        return ''
    return p.read_text(encoding='utf-8',errors='replace')

def load(path):
    try:
        v=json.loads(read(path))
        return v if isinstance(v,dict) else {}
    except Exception as e:
        FAIL.append(f'invalid JSON {path}: {e}')
        return {}

def changed():
    try:
        base=subprocess.check_output(['git','merge-base','HEAD','origin/dev'],cwd=ROOT,text=True).strip()
        out=subprocess.check_output(['git','diff','--name-only',f'{base}...HEAD'],cwd=ROOT,text=True)
        return [x for x in out.splitlines() if x]
    except Exception as e:
        FAIL.append(f'could not calculate changed files: {e}')
        return []

def hasall(body,tokens,label):
    for token in tokens:
        req(token in body,f'{label} marker missing: {token}')

p=load('current-development-authority.json')
m=load('release467-build21-release-state-branch-ci-hygiene.json')
b20=read('scripts/release467_build20_gate.py')
cleanup=read('.github/workflows/repository-branch-hygiene.yml')
proof=read('.github/workflows/release467-build21-proof.yml')
handoff=read('AI_HANDOFF.md')
roadmap=read('PROJECT_STATUS_AND_ROADMAP.md')
sanity=read('SANITY_HEALTH_CHECK.md')
index=read('MARKDOWN_INDEX.md')
doc=read('docs/operations/RELEASE_467_BUILD_21_RELEASE_STATE_BRANCH_CI_HYGIENE.md')

req(p.get('release')==467 and p.get('build')==21 and p.get('title')==TITLE,'Build 21 pointer identity drifted')
req(p.get('state')=='DEVELOPMENT_CANDIDATE' and p.get('feature_branch')==FEATURE,'Build 21 candidate/branch drifted')
req(p.get('source_base_sha')==BASE_SHA and p.get('source_base_tree_sha')==BASE_TREE,'Build 21 source base drifted')
req(p.get('last_green_build')==20 and p.get('last_green_dev_sha')==BASE_SHA and p.get('last_green_dev_tree_sha')==BASE_TREE,'Build 20 predecessor pointer drifted')
req(p.get('last_green_system_gate_run')==BASE_SYSTEM and p.get('last_green_build_proof_run')==BASE_PROOF,'Build 20 predecessor proof pointer drifted')
req(p.get('main_source_head_last_verified')==PROD_MAIN and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY and p.get('production_tree_last_verified')==BASE_TREE,'Build 20 Production-green checkpoint drifted')
auth=p.get('current_release_authorities') or []
req(auth and auth[0]=='release467-build21-release-state-branch-ci-hygiene.json' and 'release467-build20-workshop-tool-equipment-readiness.json' in auth,'Build 21 authority chain drifted')
req(p.get('post_autonomous_sequence')=='RELEASE_STATE_BRANCH_CI_HYGIENE','Build 21 sequence marker drifted')
req(p.get('promotion_state')=='NO_AUTOMATIC_PROMOTION','automatic Production promotion forbidden')
req(p.get('runtime_application_change_authorized') is False,'Build 21 must not authorize runtime application change')
req(p.get('repository_non_core_ref_mutation_authorized') is True,'Build 21 must explicitly authorize bounded non-core ref cleanup')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):
    req(p.get(k) is False,f'Build 21 pointer safety drift: {k}')

rg=p.get('repository_governance') or {}
req(rg.get('persistent_branches')==['main','dev'],'persistent branch policy drifted')
req(rg.get('merged_non_core_branch_action')=='DELETE' and rg.get('unknown_unmerged_branch_action')=='RETAIN_WITH_WARNING','branch cleanup actions drifted')
req(rg.get('archive_tag_prefix')=='archive/branch-hygiene/','archive tag prefix drifted')
req(rg.get('retired_automatic_proof_builds')==[16,17,18,19,20],'retired automatic proof list drifted')
archives={x.get('branch'):x.get('sha') for x in rg.get('explicit_archive_then_delete',[]) if isinstance(x,dict)}
req(archives==ARCHIVE_EXCEPTIONS,'explicit archive-before-delete set drifted')

req(m.get('release')==467 and m.get('build')==21 and m.get('title')==TITLE and m.get('role')=='REPOSITORY_GOVERNANCE_CONVERGENCE','Build 21 manifest identity drifted')
req(m.get('source_base_sha')==BASE_SHA and m.get('source_base_tree_sha')==BASE_TREE,'Build 21 manifest source base drifted')
pr=m.get('predecessor') or {}
req(pr.get('build')==20 and pr.get('merged_dev_sha')==BASE_SHA and pr.get('merged_dev_tree_sha')==BASE_TREE and pr.get('system_gate_run')==BASE_SYSTEM and pr.get('build20_proof_run')==BASE_PROOF,'Build 20 merged Development evidence drifted')
req(pr.get('production_main_sha')==PROD_MAIN and pr.get('production_tree_sha')==BASE_TREE and pr.get('production_pages_deploy_run')==PROD_DEPLOY,'Build 20 Production evidence drifted')
bh=m.get('branch_hygiene') or {}
req(bh.get('persistent_branches')==['main','dev'] and bh.get('delete_merged_non_core_branches') is True,'Build 21 manifest branch policy drifted')
req(bh.get('unknown_unmerged_action')=='RETAIN_WITH_WARNING' and bh.get('core_branch_deletion_authorized') is False,'Build 21 branch fail-safe drifted')
marchives={x.get('branch'):x.get('sha') for x in bh.get('archive_then_delete_unmerged_legacy',[]) if isinstance(x,dict)}
req(marchives==ARCHIVE_EXCEPTIONS,'Build 21 manifest archive set drifted')
req(m.get('repository_non_core_ref_mutation_authorized') is True,'Build 21 manifest must authorize only bounded non-core ref mutation')
for k in ('schema_change_authorized','request_time_schema_mutation','new_d1_mutation_authorized','d1_mutation_authorized','new_r2_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_policy_mutation_authorized','runtime_application_change_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):
    req(m.get(k) is False,f'Build 21 manifest safety drift: {k}')

hasall(b20,[f"MERGED_SHA='{BASE_SHA}'",f"MERGED_TREE='{BASE_TREE}'",f'MERGED_SYSTEM_GATE={BASE_SYSTEM}',f'MERGED_BUILD20_PROOF={BASE_PROOF}',f"PROD_BUILD20_MAIN='{PROD_MAIN}'",f'PROD_BUILD20_DEPLOY={PROD_DEPLOY}','pointer_build>=20','Build20_provenance=TRANSITIVE_VIA_BUILD21'],'Build 20 retained gate')

hasall(cleanup,['branches:\n      - dev','contents: write','main|dev','UNKNOWN UNMERGED RETAIN','archive/branch-hygiene/','backup-main-before-dev-replacement-20260830','release467-build7-handoff-convergence','git merge-base --is-ancestor','git push origin --delete','ACTIVE PR RETAIN','ARCHIVE SHA DRIFT RETAIN'],'branch hygiene workflow')
req('branches:\n      - main' not in cleanup,'branch hygiene push trigger must not run on main')
req('git push origin --delete "$branch"' in cleanup,'branch hygiene must delete only the iterated non-core branch')
req('CORE RETAIN' in cleanup,'branch hygiene must explicitly retain core branches')

for wf in RETIRED:
    body=read(wf)
    req('workflow_dispatch:' in body,f'{wf} must remain manually dispatchable')
    req('\n  push:' not in body and '\n  pull_request:' not in body,f'{wf} must be retired from automatic push/PR fanout')

hasall(proof,['Release 467 Build 21 Release State Branch CI Hygiene Proof','python scripts/release467_build20_gate.py','python scripts/release467_build21_gate.py','python scripts/release467_build15_public_seo_gate.py','repository/release governance only'],'Build 21 proof workflow')
for body,label in ((handoff,'handoff'),(roadmap,'roadmap'),(sanity,'sanity'),(index,'Markdown index'),(doc,'Build 21 documentation')):
    hasall(body,['Release 467 Build 21',BASE_SHA,BASE_TREE,PROD_MAIN,str(PROD_DEPLOY),'Build 20'],label)

allowed={
    '.github/workflows/repository-branch-hygiene.yml',
    '.github/workflows/release467-build16-proof.yml',
    '.github/workflows/release467-build17-proof.yml',
    '.github/workflows/release467-build18-proof.yml',
    '.github/workflows/release467-build19-proof.yml',
    '.github/workflows/release467-build20-proof.yml',
    '.github/workflows/release467-build21-proof.yml',
    'AI_HANDOFF.md','MARKDOWN_INDEX.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md',
    'current-development-authority.json',
    'docs/operations/RELEASE_467_BUILD_21_RELEASE_STATE_BRANCH_CI_HYGIENE.md',
    'release467-build21-release-state-branch-ci-hygiene.json',
    'scripts/release467_build20_gate.py','scripts/release467_build21_gate.py',
}
ch=changed()
extra=[x for x in ch if x not in allowed]
req(not extra,f'files outside Build 21 scope changed: {extra}')
req(not [x for x in ch if x.startswith('migrations/') or x.lower().endswith('.sql')],'Build 21 must not change schema/migrations')
req(not [x for x in ch if x.startswith(('functions/','public/','admin/','css/','assets/'))],'Build 21 must not change runtime application surfaces')

if FAIL:
    print('FAIL Release 467 Build 21 Release State, Branch & CI Hygiene gate')
    [print(f'- {x}') for x in FAIL]
    sys.exit(1)

print('PASS Release 467 Build 21 Release State, Branch & CI Hygiene gate')
print('build20_predecessor=EXACT_DEVELOPMENT_AND_PRODUCTION_GREEN')
print('persistent_branches=main,dev')
print('merged_non_core_branch_cleanup=AUTHORIZED')
print('unknown_unmerged_branch_cleanup=RETAIN')
print('historical_build16_20_auto_fanout=RETIRED')
print('runtime_application_change=NONE')
print('schema_migration=NONE')
print('d1_r2_mutation=NONE')
print('main_production_mutation=NONE')
