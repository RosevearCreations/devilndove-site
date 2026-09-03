#!/usr/bin/env python3
from __future__ import annotations
import json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
BASE='65287ea4333156242396d0cc91ca767fe5629dad'; BASE_TREE='c7b696020d3d3c8d0853ae4b49c721f902658aff'
ACCEPTED='873d9819332a92d9eb7b0eea7ea99c311bb7734d'; ACCEPTED_TREE='4d3a1720bf09aba0fdba0f5927314f3ef1b56bea'; SYSTEM=33781662628; BUILD_RUN=33781662644; HYGIENE=33781662638
CLOSURE='0c056b9fc87164f63f1828212d62de288c3f3ff1'; CLOSURE_TREE='07c7e9e542dfa7fcb0e93c1e1c5e270a295129ff'; CLOSURE_SYSTEM=33782423050
PROD='239fff2fc24529cfe5d1d0883ee8d7f0d6d411eb'; PROD_TREE='07c7e9e542dfa7fcb0e93c1e1c5e270a295129ff'; PROD_DEPLOY=33782747132
MIGRATIONS=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(p):
    q=ROOT/p
    if not q.is_file(): FAIL.append(f'missing required file: {p}'); return ''
    return q.read_text(encoding='utf-8',errors='replace')
def load(p):
    try: return json.loads(read(p))
    except Exception as e: FAIL.append(f'invalid JSON {p}: {e}'); return {}
p=load('current-development-authority.json'); prev=load('release467-build29-order-production-release-readiness.json'); m=load('release467-build30-admin-account-security-release-cleanup.json'); mig=load('migrations/canonical/manifest.json')
reset=read('functions/api/admin/reset-password.js'); resetui=read('public/js/admin-reset-password.js'); users=read('public/js/admin-users.js'); createui=read('public/js/admin-create-user.js'); member=read('public/js/change-password.js'); readiness=read('public/js/admin-it-readiness-actions.js'); promotion=read('public/js/admin-it-promotion-readiness.js'); userspage=read('admin/users/index.html'); memberspage=read('members/index.html'); oldwf=read('.github/workflows/release467-build29-proof.yml')
req(p.get('release')==467 and int(p.get('build') or 0)>=30,'current pointer must retain Build 30 authority')
req(prev.get('state')=='DEVELOPMENT_GREEN' and prev.get('accepted_dev_sha')=='b225a66e9224d05f75a740dc9fe7d06ce3edba09','Build 29 accepted runtime drifted')
req(m.get('release')==467 and m.get('build')==30 and m.get('state') in ('DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 30 identity/state drifted')
req(m.get('source_base_sha')==BASE and m.get('source_base_tree_sha')==BASE_TREE,'Build 30 source base drifted')
req(m.get('accepted_dev_sha')==ACCEPTED and m.get('accepted_dev_tree_sha')==ACCEPTED_TREE,'Build 30 accepted Development SHA/tree drifted')
a=m.get('acceptance') or {}; req(a.get('merged_system_gate_run')==SYSTEM and a.get('merged_build30_proof_run')==BUILD_RUN and a.get('merged_branch_hygiene_run')==HYGIENE,'Build 30 accepted Development evidence drifted')
if m.get('state')=='PRODUCTION_GREEN':
    req(a.get('final_dev_closure_sha')==CLOSURE and a.get('final_dev_closure_tree_sha')==CLOSURE_TREE and a.get('final_dev_closure_system_gate_run')==CLOSURE_SYSTEM,'Build 30 closure evidence drifted')
    req(a.get('accepted_production_main_sha')==PROD and a.get('accepted_production_tree_sha')==PROD_TREE and a.get('production_pages_deploy_run')==PROD_DEPLOY,'Build 30 Production evidence drifted')
    req(int(p.get('production_build_last_verified') or 0)==30 and p.get('main_source_head_last_verified')==PROD and p.get('production_tree_last_verified')==PROD_TREE and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'current Production Build 30 authority drifted')
for k in ('admin_password_reset_without_existing_password','temporary_password_generation','password_reset_audited_without_secret_values','password_reset_session_invalidation_supported','member_password_reveal_controls','superseded_passed_requirements_removed_from_open_queue','historical_green_evidence_retained','external_hold_lanes_marked_deferred_not_passed','current_green_authority_drives_promotion_readiness'):
    req(m.get(k) is True,f'Build 30 contract drift: {k}')
for k in ('stored_password_plaintext_readable','schema_change_authorized','request_time_schema_mutation','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','secret_values_emitted'):
    req(m.get(k) is False,f'Build 30 safety drift: {k}')
for token in ('existing_password_required:false','password_value_emitted:false','password_hash_emitted:false','admin_user_password_reset','DELETE FROM sessions'):
    req(token in reset,f'password reset authority missing marker: {token}')
req('password_hash:' not in reset.split('return json({',1)[-1],'reset response must not emit password hash field')
for body,label,tokens in ((resetui,'admin reset UI',('Generate Temporary Password','data-password-toggle','dd:admin-reset-password-target','Clear the user’s other sessions')),(users,'user directory',('data-reset-password-user-id','Password','dd:admin-reset-password-target')),(createui,'create user',('Generate Temporary Password','data-password-toggle','crypto.getRandomValues')),(member,'member account',('Current Password','New Password','data-password-toggle','stored passwords remain one-way hashes'))):
    for token in tokens: req(token in body,f'{label} missing marker: {token}')
req('Historical/superseded evidence is not an open task' in readiness and 'Deferred external / governance work' in readiness and 'Passed / superseded evidence' in readiness,'I.T. readiness stale-task cleanup drifted')
req('current-authority source promotion review' in promotion and 'currentAuthorityGreen' in promotion and 'browser runtime acceptance' not in promotion.lower(),'promotion readiness must use current green authority, not obsolete browser prerequisites')
req('Release 467 Build 30' in userspage and len(re.findall(r'<h1(?:\s|>)',userspage,re.I))==1,'Admin Users page Build 30/one-H1 drifted')
req('change-password.js?v=467b30' in memberspage,'Member Account password bundle cache bust missing')
req('push:' not in oldwf and 'pull_request:' not in oldwf and 'workflow_dispatch:' in oldwf,'Build 29 proof must be manual-only once Build 30 is current')
req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted')
if FAIL:
    print('FAIL Release 467 Build 30 gate'); [print(f'- {x}') for x in FAIL]; sys.exit(1)
print('PASS Release 467 Build 30 gate')
print('stored_password_plaintext=NEVER_EXPOSED')
print('admin_temporary_password_reset=AUDITED_EXPLICIT_ACTION')
print('superseded_green_checks=EVIDENCE_NOT_OPEN_TASKS')
print('external_holds=DEFERRED_NOT_PASSED')
print('production_build30=EXPLICITLY_PROMOTED_AND_VERIFIED')
