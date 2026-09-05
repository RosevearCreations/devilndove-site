#!/usr/bin/env python3
"""Current password-hash compatibility, writer-safety and account-response gate."""
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
WRITERS=['functions/api/auth/register.js','functions/api/auth/change-password.js','functions/api/auth/bootstrap-admin.js','functions/api/admin/create-user.js','functions/api/admin/reset-password.js'];MIRRORS=['auth/login.js','auth/register.js','auth/change-password.js','auth/bootstrap-admin.js']
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 q=ROOT/p
 if not q.is_file():FAIL.append(f'missing required file: {p}');return ''
 return q.read_text(encoding='utf-8',errors='replace')
helper=read('functions/api/_lib/passwordHash.js');roothelper=read('_lib/passwordHash.js');login=read('functions/api/auth/login.js');seed=read('database_admin_seed_template.sql')
change=read('functions/api/auth/change-password.js');create=read('functions/api/admin/create-user.js');reset=read('functions/api/admin/reset-password.js');createui=read('public/js/admin-create-user.js');resetui=read('public/js/admin-reset-password.js')
for token in ("PASSWORD_HASH_SCHEME = 'pbkdf2-sha256'",'PASSWORD_HASH_ITERATIONS = 210000','crypto.getRandomValues','PBKDF2',"value.startsWith('sha256$')","return (await sha256Hex(password)) === value.slice('sha256$'.length)"):req(token in helper,f'password hash helper missing functional marker: {token}')
req(helper==roothelper,'root/functions password hash authorities must match');req('storedPasswordHashNeedsUpgrade(user.password_hash)' in login,'login must identify legacy hash only after successful verification');req('formatStoredPasswordHashFromPlaintext(password)' in login,'login must create current hash during legacy upgrade');req('WHERE user_id = ? AND password_hash = ?' in login,'legacy login upgrade must be conditional on the verified stored hash');req('env.DB.batch(statements)' in login,'login hash upgrade must remain inside the atomic login batch')
for path in WRITERS:
 body=read(path);req('formatStoredPasswordHashFromPlaintext' in body,f'{path} must use shared current hash writer');req('sha256$' not in body,f'{path} must not write or embed legacy sha256 format');req('crypto.subtle.digest' not in body,f'{path} must not carry a local raw SHA-256 password writer')
for mirror in MIRRORS:req(read(mirror)==read('functions/api/'+mirror),f'{mirror} mirror drifted from functions/api/{mirror}')
req('sha256$' not in seed and 'no executable credential INSERT' in seed,'static administrator seed must contain no reusable legacy credential hash')
# Build 58: browser forms must never throw a raw JSON.parse exception when Cloudflare returns HTML/plain text.
for path,body in [('public/js/admin-create-user.js',createui),('public/js/admin-reset-password.js',resetui)]:
 req('DDAuth.readApiJson' in body,f'{path} must use shared safe API JSON parsing')
 req('await response.json()' not in body,f'{path} must not directly parse account-write responses with response.json()')
# Account-writing endpoints must convert unexpected platform/D1 exceptions into application JSON.
for path,body,code in [
 ('functions/api/admin/create-user.js',create,'ADMIN_CREATE_USER_FAILED'),
 ('functions/api/admin/reset-password.js',reset,'ADMIN_RESET_PASSWORD_FAILED'),
 ('functions/api/auth/change-password.js',change,'AUTH_CHANGE_PASSWORD_FAILED')]:
 req('catch(error)' in body or 'catch (error)' in body,f'{path} must contain an unexpected-error boundary')
 req(code in body,f'{path} must expose structured failure code {code}')
 req('Content-Type":"application/json"' in body or '"Content-Type": "application/json"' in body,f'{path} must return JSON content type')
req('AUTH_CURRENT_PASSWORD_INCORRECT' in change and '},400)' in change,'wrong current password must be a validation error and must not clear a valid session via 401')
if FAIL:
 print('CURRENT PASSWORD HASH GATE: FAIL')
 for x in FAIL:print('- '+x)
 sys.exit(1)
print('CURRENT PASSWORD HASH GATE: PASS');print('current=PBKDF2_SHA256_SALTED_ITERATED');print('legacy_sha256=VERIFY_ONLY_TRANSPARENT_UPGRADE');print('plaintext_existing_password=UNAVAILABLE_BY_DESIGN');print('account_write_response_parsing=SAFE_JSON');print('unexpected_account_write_failures=STRUCTURED_JSON')
