#!/usr/bin/env python3
from pathlib import Path
import json,sys,subprocess
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build253-session-abuse-control-runtime-evidence.json')
prev=j('release467-build252-cross-device-accessibility-acceptance-refresh.json')
p=j('current-development-authority.json')
road=t('docs/operations/RELEASE_467_REFINEMENT_OUTCOMES_AUTONOMOUS_BUILDS_249_256.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
abuse=t('functions/api/_lib/authAbuseGuard.js')
csrf=t('functions/api/_lib/csrfOriginProtection.js')
account=t('functions/api/_lib/accountAuthCompat.js')
revoke=t('functions/api/auth/revoke-other-sessions.js')
step=t('functions/api/_lib/adminStepUp.js')
login=t('functions/api/auth/login.js')
runtime=t('scripts/release467_build253_runtime_evidence.mjs')
rel=t('functions/api/_lib/currentReliability.js')
it=t('functions/api/admin/it-operations-control-tower.js')
preflight=t('functions/api/admin/current-deployment-preflight.js')
guide=t('docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md')

q(a.get('build')==253 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 253 authority identity/state mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 252 predecessor must be Production GREEN')
fc=prev.get('final_closure') or {}; pc=prev.get('production_checkpoint') or {}
q(fc.get('dev_sha')=='ec749569908b2ebbf393ca1ec2181e586a10f548' and fc.get('tree_sha')=='bc93b89d4b649d035e4dc5cb0f9deeb9d01399e2','Build 252 final Development closure mismatch')
q(pc.get('main_sha')=='3c14d72ed481035d82f3cffa2d16f733f603f1d9' and pc.get('tree_sha')=='bc93b89d4b649d035e4dc5cb0f9deeb9d01399e2' and pc.get('state')=='PRODUCTION_GREEN','Build 252 Production checkpoint mismatch')
q(p.get('build')==253 and p.get('next_build')==254 and p.get('state')=='DEVELOPMENT_GREEN','Current authority must expose Build 253 and successor 254')
q(p.get('accepted_dev_sha')=='ec749569908b2ebbf393ca1ec2181e586a10f548' and p.get('accepted_dev_tree_sha')=='bc93b89d4b649d035e4dc5cb0f9deeb9d01399e2','Build 253 accepted predecessor must be exact Build 252 Development')
q((p.get('production_checkpoint') or {}).get('main_sha')=='3c14d72ed481035d82f3cffa2d16f733f603f1d9','Build 253 Production predecessor mismatch')

for token in ("login:{limit:8,window_seconds:900}","fingerprint_exposed:false","AUTH_RATE_LIMITED","Retry-After"):
    q(token in abuse,f'Build 253 abuse runtime contract missing {token}')
for token in ("same_origin_header","csrf_origin_rejected","bearer_automation","headerless_api_compatibility"):
    q(token in csrf,f'Build 253 origin runtime contract missing {token}')
for token in ("dd_auth_token","getAccountRequestToken","resolveSessionUser"):
    q(token in account,f'Build 253 session runtime contract missing {token}')
for token in ("session_id<>?","current_session_preserved:true","DELETE FROM sessions"):
    q(token in revoke,f'Build 253 revoke runtime contract missing {token}')
for token in ("requires_step_up: true","verifyStoredPasswordHash","Invalid or expired admin session"):
    q(token in step,f'Build 253 step-up runtime contract missing {token}')
q('session_mode:"http_only_cookie"' in login and 'Set-Cookie' in login and 'HttpOnly' in login,'Build 253 login must remain cookie-first')
for token in ("login_throttle_runtime","csrf_origin_runtime","cookie_first_session_runtime","revoke_other_sessions_runtime","admin_step_up_runtime","secret_output_runtime"):
    q(token in runtime,f'Build 253 runtime harness missing {token}')

q('Build 254 — Operator Journey Friction Review' in road,'Build 254 successor missing')
q("run_current_contract('scripts/release467_build253_gate.py','Release 467 Build 253')" in sysgate,'System Gate must invoke Build 253')
for source,label in ((rel,'Reliability'),(it,'I.T. tower'),(preflight,'Preflight'),(guide,'I.T. guide')):
    q('253' in source and 'Session & Abuse-Control Runtime Evidence' in source,f'{label} must identify Build 253')
for k,v in (a.get('safety') or {}).items():
    q(v is False,f'Build 253 safety drift: {k}')

run=subprocess.run(['node','scripts/release467_build253_runtime_evidence.mjs'],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
if run.stdout: print(run.stdout.strip())
if run.stderr: print(run.stderr.strip(),file=sys.stderr)
q(run.returncode==0,'Build 253 bounded runtime evidence harness failed')

print('RELEASE 467 BUILD 253 SESSION & ABUSE-CONTROL RUNTIME EVIDENCE')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Cookie/session, CSRF/origin, throttling, revoke-other-sessions and step-up runtime evidence: GREEN')
print('Secret-output boundary: GREEN')
print('Future queue: OPEN; next Build 254')
