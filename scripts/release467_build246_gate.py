#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build246-abuse-session-security-operations.json')
p=j('current-development-authority.json')
prev=j('release467-build245-csp-browser-injection-hardening.json')
guard=t('functions/api/_lib/authAbuseGuard.js')
login=t('functions/api/auth/login.js')
change=t('functions/api/auth/change-password.js')
revoke=t('functions/api/auth/revoke-other-sessions.js')
session=t('functions/api/auth/session-info.js')
member=t('public/js/member-account-tools.js')
cleanup=t('functions/api/admin/cleanup-sessions.js')
cleanup_client=t('public/js/admin-cleanup-sessions.js')
summary=t('functions/api/admin/security-summary.js')
summary_client=t('public/js/admin-security-summary.js')
recovery=t('functions/api/auth/account-help-request.js')
road=t('docs/operations/RELEASE_467_REFINEMENT_AUTONOMOUS_BUILDS_233_248.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')

q(a.get('build')==246 and a.get('state')=='DEVELOPMENT_CANDIDATE','Build 246 authority identity/state mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 245 predecessor must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='b4eeed8895a8a04247b68a626c9018caadd8c9ad','Build 245 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='2312b35c5d527721219c48985325eeba8f3ecd3f','Build 245 Production closure missing')
q(p.get('build')==246 and p.get('next_build')==247 and p.get('state')=='DEVELOPMENT_GREEN','Current authority must expose Build 246 candidate and Build 247 successor')

for token in ('consumeAbuseBudget','cloudflare_cache','fingerprint_exposed:false','logs_secrets:false'):
    q(token in guard,f'Abuse guard missing {token}')
q("scope:'login'" in login and 'limit:8' in login and 'windowSeconds:900' in login,'Login throttle contract missing')
q("scope:'password_change'" in change and 'limit:6' in change and 'windowSeconds:900' in change,'Password-change throttle contract missing')
q("contact_email=? AND created_at>=datetime('now','-1 hour')" in recovery and ">=3" in recovery and ">=6" in recovery,'Existing bounded account-recovery throttle must remain')
q('current_session_preserved:true' in revoke and 'session_id<>?' in revoke,'Revoke-other-sessions must preserve current session')
for token in ('expired_sessions','expiring_soon_sessions','stale_expired_sessions','other_active_sessions'):
    q(token in session,f'Session summary missing {token}')
q('memberRevokeOtherSessionsButton' in member and '/api/auth/revoke-other-sessions' in member,'Member revoke-other-sessions UX missing')
q('requireAdminStepUp' in cleanup and 'session_cleanup' in cleanup and 'auditAdminAction' in cleanup,'Admin session cleanup must require step-up and audit')
q('adminCleanupConfirmPassword' in cleanup_client and 'confirm_password' in cleanup_client,'Admin cleanup UI must collect step-up password')
q('resolveSessionUser' in summary and 'runtime_script_nonce_csp' in summary and 'stale_expired_sessions' in summary,'Security summary must be cookie-compatible and actionable')
q('securityControlStatus' in summary_client and 'securityStaleExpiredSessions' in summary_client,'Security summary UI controls/facts missing')
q('Build 247 — Non-Product Visual Coverage & Media Placement Closure' in road,'Build 247 successor missing')
q("run_current_contract('scripts/release467_build246_gate.py','Release 467 Build 246')" in sysgate,'System Gate must invoke Build 246')

for k in ('schema_change','request_time_schema_mutation','r2_mutation','provider_execution','provider_publication','product_publication','inventory_movement','finance_posting','automatic_business_action','secret_values_logged','session_tokens_returned','password_values_logged','throttle_fingerprints_exposed','account_recovery_privacy_disclosure'):
    q(a.get('safety',{}).get(k) is False,f'Build 246 safety drift: {k}')

print('RELEASE 467 BUILD 246 ABUSE RESISTANCE SESSION CONTROL SECURITY OPERATIONS')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
