#!/usr/bin/env python3
from __future__ import annotations
import json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
BASE='9ef3d76fb23d88d2ff712222b30393aa8de53b3c'; BASE_TREE='97d2d3c57db0f37bcd9cb0761d5bc3a7f4b2556b'
PROD='49eeae5ee864da0f52fd3c15728cff0392ed7dd1'; PROD_TREE=BASE_TREE; PROD_DEPLOY=33783699520
MIGRATIONS=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
WRITERS=['functions/api/auth/register.js','functions/api/auth/change-password.js','functions/api/auth/bootstrap-admin.js','functions/api/admin/create-user.js','functions/api/admin/reset-password.js']
MIRRORS=['auth/login.js','auth/register.js','auth/change-password.js','auth/bootstrap-admin.js']
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(p):
    q=ROOT/p
    if not q.is_file(): FAIL.append(f'missing required file: {p}'); return ''
    return q.read_text(encoding='utf-8',errors='replace')
def load(p):
    try: return json.loads(read(p))
    except Exception as e: FAIL.append(f'invalid JSON {p}: {e}'); return {}
p=load('current-development-authority.json'); prev=load('release467-build30-admin-account-security-release-cleanup.json'); m=load('release467-build31-password-hash-hardening.json'); mig=load('migrations/canonical/manifest.json')
helper=read('functions/api/_lib/passwordHash.js'); roothelper=read('_lib/passwordHash.js'); login=read('functions/api/auth/login.js'); seed=read('database_admin_seed_template.sql'); oldwf=read('.github/workflows/release467-build30-proof.yml')
req(p.get('release')==467 and int(p.get('build') or 0)>=31,'current pointer must be Release 467 Build 31 or newer')
req(p.get('source_base_sha')==BASE and p.get('source_base_tree_sha')==BASE_TREE,'Build 31 pointer source base drifted')
req(p.get('main_source_head_last_verified')==PROD and p.get('production_tree_last_verified')==PROD_TREE and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'Build 30 synchronized Production boundary drifted')
req(prev.get('state')=='PRODUCTION_GREEN','Build 30 must remain Production GREEN')
req(m.get('release')==467 and m.get('build')==31 and m.get('title')=='Password Hash Hardening + Transparent Legacy Upgrade','Build 31 manifest identity drifted')
req(m.get('source_base_sha')==BASE and m.get('source_base_tree_sha')==BASE_TREE,'Build 31 manifest source base drifted')
for k in ('new_password_writes_use_current_scheme','legacy_sha256_verification_supported','legacy_sha256_new_writes_forbidden','legacy_hash_upgrade_on_successful_login','legacy_upgrade_is_conditional_on_verified_hash','static_reusable_password_seed_removed'):
    req(m.get(k) is True,f'Build 31 contract drift: {k}')
for k in ('stored_password_plaintext_readable','forced_mass_password_reset_required','schema_change_authorized','request_time_schema_mutation','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','automatic_production_promotion_authorized','secret_values_emitted'):
    req(m.get(k) is False,f'Build 31 safety drift: {k}')
for token in ("PASSWORD_HASH_SCHEME = 'pbkdf2-sha256'",'PASSWORD_HASH_ITERATIONS = 210000','crypto.getRandomValues','PBKDF2',"value.startsWith('sha256$')","return (await sha256Hex(password)) === value.slice('sha256$'.length)"):
    req(token in helper,f'password hash helper missing functional marker: {token}')
req(helper==roothelper,'root/functions password hash authorities must match')
req("storedPasswordHashNeedsUpgrade(user.password_hash)" in login,'login must identify legacy hash after successful verification')
req('formatStoredPasswordHashFromPlaintext(password)' in login,'login must create current hash during legacy upgrade')
req('WHERE user_id = ? AND password_hash = ?' in login,'legacy login upgrade must be conditional on the verified stored hash')
req('env.DB.batch(statements)' in login,'login hash upgrade must remain inside the atomic login batch')
for path in WRITERS:
    body=read(path)
    req("formatStoredPasswordHashFromPlaintext" in body,f'{path} must use shared current hash writer')
    req('sha256$' not in body,f'{path} must not write or embed legacy sha256 format')
    req("crypto.subtle.digest" not in body,f'{path} must not carry a local raw SHA-256 password writer')
for mirror in MIRRORS:
    body=read(mirror); operational=read('functions/api/'+mirror)
    req(body==operational,f'{mirror} mirror drifted from functions/api/{mirror}')
req('sha256$' not in seed and 'no executable credential INSERT' in seed,'static administrator seed must contain no reusable legacy credential hash')
req('push:' not in oldwf and 'pull_request:' not in oldwf and 'workflow_dispatch:' in oldwf,'Build 30 proof must be manual-only once Build 31 is current')
req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted')
if FAIL:
    print('FAIL Release 467 Build 31 gate'); [print(f'- {x}') for x in FAIL]; sys.exit(1)
print('PASS Release 467 Build 31 gate')
print('password_hash_current=PBKDF2_SHA256_SALTED_ITERATED')
print('legacy_sha256=VERIFY_ONLY_TRANSPARENT_UPGRADE')
print('static_password_seed=DISABLED')
print('schema_change=NONE')
