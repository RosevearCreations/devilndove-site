#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build326-35th-promo-real-outcome-evidence-closure.json')
prev=j('release467-build325-evidence-gap-owner-queue-operator-action-traceability.json')
p=j('current-development-authority.json')
api=t('functions/api/admin/35th-promo-outcome-closure.js')
cpapi=t('functions/api/admin/creative-process.js')
ui=t('public/js/admin-creative-process.js')
page=t('admin/creative-process/index.html')
sql=t('scripts/release467_build326_measurement.sql')
verify=t('scripts/release467_build326_verify_measurement.mjs')
wf=t('.github/workflows/release467-build326-35th-promo-real-outcome-evidence-closure.yml')
road=t('docs/operations/RELEASE_467_EVIDENCE_ACTION_ADOPTION_BUILDS_325_330.md')
q(a.get('build')==326 and a.get('title')=='35th Promo Real Outcome Evidence Closure','Build 326 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 325 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='0da51ee0e377c81909ed9c90627ca206026027b1','Build 325 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='782627bb0bc0850622abc42512e3886f5556efbd','Build 325 exact Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('reuses_build319_operator_action')=='record_story_execution_evidence','Build 326 must reuse Build 319 factual intake')
q(c.get('readiness_only') is True and c.get('automatic_story_review') is False and c.get('automatic_public_candidate') is False,'Build 326 review-first readiness boundary mismatch')
q(c.get('next_build')==327 and c.get('next_build_title')=='Grey Hair Evidence Review Completion & Story-Plan Handoff','Build 327 successor mismatch')
q(all(v is False for v in s.values()),'Build 326 safety authority drift')
for token in ('record_story_execution_evidence','STORY_EXECUTION_EVENT_TYPES','notes.length < 20','media_url,is_public_candidate,created_by','NULL,0,?7','maker_story_auto_reviewed: false'):
    q(token in cpapi,'Build 319 factual intake authority missing '+token)
q('onRequestPost' not in api,'Build 326 closure endpoint must remain GET-only')\nq('placeholderGuard' in api and 'substantiveFact' in api,'Build 326 closure API must reject placeholder absence facts')
for token in ('REAL_OUTCOME_EVIDENCE_STILL_REQUIRED','REAL_OUTCOME_EVIDENCE_PARTIAL','REAL_EVENTS_COMPLETE_MAKER_STORY_FACTS_STILL_REQUIRED','REAL_OUTCOME_FACTS_COMPLETE_READY_FOR_EXPLICIT_HUMAN_REVIEW','placeholderGuard','substantiveFact','automatic_story_review:false','production_d1_contact:false'):
    q(token in verify,'Build 326 verifier missing '+token)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 326 measurement must remain read-only: '+forbidden.strip())
for token in ('execution_events','result_events','lesson_events','actual_result','lesson_learned','execution_rows_with_public_or_media_flags','pragma_foreign_key_check'):q(token in sql,'Build 326 measurement missing '+token)
for token in ('data-build326-real-outcome-closure','Build 326 • real outcome closure','ready for explicit human review','Still missing:','never auto-sets reviewed/public-candidate state'):
    q(token in ui,'Build 326 Creative Process UI missing '+token)
q('data-build326-real-outcome-closure' in page and '/public/js/admin-creative-process.js?v=467b326' in page,'Build 326 Creative Process page/cache marker missing')
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','SYNTHETIC EVIDENCE: ZERO','AUTOMATIC STORY REVIEW: ZERO','PUBLIC CANDIDACY MUTATION: ZERO','PRODUCTION D1 CONTACT: ZERO'):
    q(token in wf,'Build 326 workflow boundary missing '+token)
q('Build 326 — 35th Promo Real Outcome Evidence Closure' in road and 'Build 327 — Grey Hair Evidence Review Completion & Story-Plan Handoff' in road,'Build 326/327 roadmap continuity missing')
q(int(p.get('build') or 0)>=326,'Current pointer must retain Build 326 or successor')
if int(p.get('build') or 0)==326:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==327,'Build 326 current authority/successor mismatch')
print('RELEASE 467 BUILD 326 35TH PROMO REAL OUTCOME EVIDENCE CLOSURE')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Real outcome completeness can only produce human-review readiness; no automatic review/publication')
