#!/usr/bin/env python3
from pathlib import Path
import json,sys,re
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build243-session-architecture-hardening.json')
p=j('current-development-authority.json')
prev=j('release467-build242-release-diagnostics-evidence-streamlining.json')
browser=t('public/js/auth.js')
root_browser=t('auth.js')
login=t('functions/api/auth/login.js')
register=t('functions/api/auth/register.js')
bootstrap=t('functions/api/auth/bootstrap-admin.js')
me=t('functions/api/auth/me.js')
session_info=t('functions/api/auth/session-info.js')
bootstrap_client=t('public/js/bootstrap-admin.js')
checkout=t('public/js/checkout.js')
audit=t('functions/api/_lib/adminAudit.js')
road=t('docs/operations/RELEASE_467_REFINEMENT_AUTONOMOUS_BUILDS_233_248.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')

q(a.get('build')==243 and a.get('state')=='DEVELOPMENT_CANDIDATE','Build 243 authority identity/state mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 242 predecessor must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='5977a1aa9674eb378d5aede0b31648a73ac770c6','Build 242 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='ae9ca2b48700f4b48e6eb7e6bb465f0472d5e41f','Build 242 production checkpoint missing')
q(p.get('build')==243 and p.get('next_build')==244 and p.get('state')=='DEVELOPMENT_GREEN','Current authority must expose Build 243 candidate and Build 244 successor')

for src,name in ((browser,'public/js/auth.js'),(root_browser,'auth.js')):
    q("return \"\";" in src and 'clearLegacyBrowserToken' in src,f'{name} must not expose a browser-readable auth token')
    q('localStorage.setItem(TOKEN_KEY' not in src and 'localStorage.getItem(TOKEN_KEY' not in src,f'{name} must not persist/read bearer token in localStorage')
    q("headers.set('Authorization'" not in src and 'Bearer ${token}' not in src,f'{name} must not synthesize browser bearer auth')
    q("credentials: 'same-origin'" in src,f'{name} must preserve same-origin credential transport')
    q("session_mode: 'http_only_cookie'" in src or "session_mode: 'http_only_cookie'" in src.replace('"',"'"),f'{name} must expose cookie-first auth event mode')

for src,name in ((login,'login'),(register,'register'),(bootstrap,'bootstrap-admin')):
    q('HttpOnly' in src and 'SameSite=Lax' in src,f'{name} must retain HttpOnly SameSite cookie')
    q('session_mode:"http_only_cookie"' in src,f'{name} must identify cookie-first response mode')
    q(not re.search(r'\bsession_token\s*:\s*(?:sessionToken|session\?\.session_token)',src),f'{name} must not return session_token secret')
    q(not re.search(r'\btoken\s*:\s*(?:sessionToken|session\?\.token)',src),f'{name} must not return token secret')

q('DDAuth.setToken(token)' not in bootstrap_client and 'no session token was returned' not in bootstrap_client,'bootstrap browser flow must not require returned session secret')
q('DDAuth.getToken' not in checkout and 'headers.Authorization' not in checkout,'checkout must rely on same-origin HttpOnly cookie')
q('session_mode:"http_only_cookie"' in me and 'session_rotation:"server_managed"' in me,'me endpoint must expose non-secret cookie-first session metadata')
q('session_mode:"http_only_cookie"' in session_info and 'session_rotation:"server_managed"' in session_info,'session-info must expose non-secret cookie-first session metadata')
q('getBearerToken(request)' in audit and 'cookies.dd_auth_token' in audit,'server-side Bearer/cookie compatibility must remain available for non-browser automation')
q('Build 244 — CSRF / Origin Protection for Mutating Routes' in road,'Build 244 successor missing')
q("run_current_contract('scripts/release467_build243_gate.py','Release 467 Build 243')" in sysgate,'System Gate must invoke Build 243')

for k in ('schema_change','request_time_schema_mutation','d1_business_data_mutation','r2_mutation','provider_execution','provider_publication','product_publication','inventory_movement','finance_posting','automatic_business_action','session_secret_logged','session_secret_returned_to_browser_json'):
    q(a.get('safety',{}).get(k) is False,f'Build 243 safety drift: {k}')

print('RELEASE 467 BUILD 243 SESSION ARCHITECTURE HARDENING')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
