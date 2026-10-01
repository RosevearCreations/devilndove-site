#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build338-35th-promo-factual-evidence-completion-continuity-iii.json')
prev=j('release467-build337-evidence-gap-execution-workbench-input-completion-continuity-ii.json')
p=j('current-development-authority.json')
api=t('functions/api/admin/35th-promo-outcome-closure.js');cpapi=t('functions/api/admin/creative-process.js');ui=t('public/js/admin-creative-process.js');page=t('admin/creative-process/index.html')
sql=t('scripts/release467_build338_measurement.sql');verify=t('scripts/release467_build338_verify_measurement.mjs')
wf=t('.github/workflows/release467-build338-35th-promo-factual-evidence-completion-continuity-iii.yml')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_337_342.md')

q(a.get('build')==338 and a.get('title')=='35th Promo Factual Evidence Completion Continuity III','Build 338 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 337 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='8f5d038fa7c7d5b3213f6d64f51d659c3ce74994' and (prev.get('final_closure') or {}).get('tree_sha')=='3d173e98cfdf48b2efafdfb55a326c275e9cd041','Build 337 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='cf588329be80a4cf463d0632845521f4e3685991' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='3d173e98cfdf48b2efafdfb55a326c275e9cd041','Build 337 Production checkpoint missing')

c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('reuses_operator_action')=='record_story_execution_evidence','Build 338 must reuse factual intake')
q(c.get('readiness_only') is True and c.get('explicit_human_review_required') is True and c.get('automatic_story_review') is False and c.get('automatic_public_candidate') is False,'Build 338 review-first boundary mismatch')
q(c.get('next_build')==339 and c.get('next_build_title')=='Grey Hair Source Review & Story-Plan Completion Continuity III','Build 339 successor mismatch')
q(all(v is False for v in s.values()),'Build 338 safety authority drift')
for token in ('record_story_execution_evidence','STORY_EXECUTION_EVENT_TYPES','notes.length < 20','maker_story_auto_reviewed: false'):q(token in cpapi,'Build 338 factual intake authority missing '+token)
q('onRequestPost' not in api,'Build 338 closure endpoint must remain GET-only')
for token in ('const BUILD=338','placeholderGuard','substantiveFact','comparison_baseline','explicit_human_review_only'):q(token in api,'Build 338 closure API missing '+token)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 338 measurement must remain read-only: '+forbidden.strip())
for token in ('execution_events','result_events','lesson_events','actual_result','lesson_learned','execution_rows_with_public_or_media_flags','pragma_foreign_key_check'):q(token in sql,'Build 338 measurement missing '+token)
for token in ('REAL_OUTCOME_EVIDENCE_STILL_REQUIRED','REAL_OUTCOME_EVIDENCE_PARTIAL','REAL_EVENTS_COMPLETE_MAKER_STORY_FACTS_STILL_REQUIRED','REAL_OUTCOME_FACTS_COMPLETE_READY_FOR_EXPLICIT_HUMAN_REVIEW','comparison_to_build337','placeholderGuard','substantiveFact','automatic_story_review:false','production_d1_contact:false'):q(token in verify,'Build 338 verifier missing '+token)
for token in ('data-build338-factual-evidence-continuity','Build 338 • factual evidence continuity III','ready for explicit human review','Still missing:'):q(token in ui,'Build 338 Creative Process UI missing '+token)
q('data-build338-factual-evidence-continuity' in page and '/public/js/admin-creative-process.js?v=467b338' in page,'Build 338 Creative Process page/cache marker missing')
q('data-build332-factual-evidence-continuity' in page and '/public/js/admin-creative-process.js?v=467b332' in page,'Build 332 historical Creative Process marker missing')
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','SYNTHETIC EVIDENCE: ZERO','AUTOMATIC STORY REVIEW: ZERO','PUBLIC CANDIDACY MUTATION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 338 workflow boundary missing '+token)
q('Build 338 — 35th Promo Factual Evidence Completion Continuity III' in road and 'Build 339 — Grey Hair Source Review & Story-Plan Completion Continuity III' in road,'Build 338/339 roadmap continuity missing')
q(int(p.get('build') or 0)>=338,'Current pointer must retain Build 338 or successor')
if int(p.get('build') or 0)==338:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==339,'Build 338 current authority/successor mismatch')
print('RELEASE 467 BUILD 338 35TH PROMO FACTUAL EVIDENCE COMPLETION CONTINUITY III')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Real factual completeness can only produce explicit human-review readiness')
