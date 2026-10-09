#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build368-35th-promo-factual-evidence-completion-continuity-viii.json');p=j('current-development-authority.json');sql=t('scripts/release467_build368_measurement.sql');verify=t('scripts/release467_build368_verify_measurement.mjs');wf=t('.github/workflows/release467-build368-35th-promo-factual-evidence-completion-continuity-viii.yml');route=t('public/js/admin-route-usage.js');startup=t('public/js/admin-startup-read-budget-v250.js');journey=t('public/js/admin-journey-friction-v254.js');admin=t('admin/index.html')
q(a.get('build')==368 and a.get('title')=='35th Promo Factual Evidence Completion Continuity VIII','Build 368 identity mismatch')
q((a.get('predecessor') or {}).get('development_sha')=='531fe6d5d4599ecb79b747e6690191faa3134713','Build 367 predecessor SHA mismatch')
q((a.get('predecessor') or {}).get('production_main_sha')=='bbdb69303d24005f38eb395273490c9c05fa1bdb','Build 367 Production predecessor mismatch')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('source_workbench_build')==367 and c.get('reuses_operator_action')=='record_story_execution_evidence','Build 368 source workbench contract mismatch')
q(c.get('readiness_only') is True and c.get('explicit_human_review_required') is True and c.get('automatic_story_review') is False and c.get('automatic_public_candidate') is False and c.get('automatic_publication') is False,'Build 368 review-first boundary mismatch')
q(all(v is False for v in s.values()),'Build 368 safety drift')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 368 measurement must remain read-only: '+forbidden.strip())
for token in ('execution_events','result_events','lesson_events','actual_result','lesson_learned','pragma_foreign_key_check'):q(token in sql,'Build 368 measurement missing '+token)
for token in ('REAL_OUTCOME_EVIDENCE_STILL_REQUIRED','REAL_OUTCOME_EVIDENCE_PARTIAL','REAL_EVENTS_COMPLETE_MAKER_STORY_FACTS_STILL_REQUIRED','REAL_OUTCOME_FACTS_COMPLETE_READY_FOR_EXPLICIT_HUMAN_REVIEW','comparison_to_build367','placeholderGuard','substantiveFact','production_d1_contact:false'):q(token in verify,'Build 368 verifier missing '+token)
repair=['functions/api/admin/users.js','functions/api/admin/user-profile.js','functions/api/admin/user-update.js','functions/api/admin/delete-user.js','functions/api/admin/access-tiers.js','functions/api/admin/assign-user-access-tier.js','functions/api/admin/remove-user-access-tier.js','functions/api/admin/user-access-tiers.js']
for path in repair:
 body=t(path);q('resolveSessionUser' in body,path+' missing cookie-compatible session resolver');q('getBearerToken(request)' not in body,path+' retains bearer-only resolver');q('request.headers.get("Authorization")' not in body,path+' directly requires Authorization header')
q('BUILD368_COOKIE_FIRST_USERS' in t('admin/users/index.html') and 'BUILD368_COOKIE_FIRST_USERS_CLIENT' in t('public/js/admin-users.js'),'Users & Security Build 368 markers missing')
for body,label,token in ((route,'Build 249 runtime','ddBuild368LegacyRuntimeMeasurement'),(startup,'Build 250 startup budget','ddBuild368LegacyStartupBudget'),(journey,'Build 254 journey','ddBuild368LegacyJourneyFriction')):
 q('BUILD368_LEAN_HOME_CONTAINMENT' in body and token in body,label+' lean-home containment missing')
q('data-build368-runtime-containment="1"' in admin,'Admin home Build 368 containment marker missing')
q('/public/js/admin-route-usage.js?v=368' in admin and '/public/js/admin-startup-read-budget-v250.js?v=368' in admin and '/public/js/admin-journey-friction-v254.js?v=368' in admin,'Admin home Build 368 cache-bust missing')
q('refinementRuntimeBaselineMount' in admin and 'hidden aria-hidden="true"' in admin,'Legacy runtime panel must remain hidden but source-compatible')
cur=int(p.get('build') or 0);triggers=('push:','branches: [dev]') if cur==368 else ('workflow_dispatch:',)
for token in (*triggers,'D1_ONE_SHOT_EVIDENCE_CAPTURE','SYNTHETIC EVIDENCE: ZERO','AUTOMATIC STORY REVIEW: ZERO','PUBLIC CANDIDACY MUTATION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 368 workflow boundary missing '+token)
for path in ('scripts/release467_build368_verify_measurement.mjs',*repair,'public/js/admin-users.js','public/js/admin-route-usage.js','public/js/admin-startup-read-budget-v250.js','public/js/admin-journey-friction-v254.js'):
 r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);q(r.returncode==0,path+' syntax failed: '+(r.stderr or r.stdout)[-1200:])
print('RELEASE 467 BUILD 368 35TH PROMO FACTUAL EVIDENCE COMPLETION CONTINUITY VIII + USERS COOKIE AUTH + ADMIN HOME RUNTIME REPAIR')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
