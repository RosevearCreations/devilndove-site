#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build344-35th-promo-factual-evidence-completion-continuity-iv.json')
prev=j('release467-build343-evidence-gap-execution-workbench-input-completion-continuity-iii.json')
p=j('current-development-authority.json')
api=t('functions/api/admin/35th-promo-outcome-closure.js');cpapi=t('functions/api/admin/creative-process.js');ui=t('public/js/admin-creative-process.js');page=t('admin/creative-process/index.html')
sql=t('scripts/release467_build344_measurement.sql');verify=t('scripts/release467_build344_verify_measurement.mjs')
wf=t('.github/workflows/release467-build344-35th-promo-factual-evidence-completion-continuity-iv.yml')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_343_348.md')

q(a.get('build')==344 and a.get('title')=='35th Promo Factual Evidence Completion Continuity IV','Build 344 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 343 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='9ba28adc49ce04cf69fd6e7d3a3c12d5b376d8fe' and (prev.get('final_closure') or {}).get('tree_sha')=='719649ad678aabd932bd43414db87bc234d7fc92','Build 343 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='b3db71eeb5bea3ed4f1428d96c18120b9e51c9bb' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='719649ad678aabd932bd43414db87bc234d7fc92','Build 343 Production checkpoint missing')

c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('reuses_operator_action')=='record_story_execution_evidence','Build 344 must reuse factual intake')
q(c.get('readiness_only') is True and c.get('explicit_human_review_required') is True and c.get('automatic_story_review') is False and c.get('automatic_public_candidate') is False,'Build 344 review-first boundary mismatch')
q(c.get('placeholder_absence_text_does_not_satisfy_readiness') is True,'Build 344 placeholder guard missing')
q(c.get('next_build')==345 and c.get('next_build_title')=='Grey Hair Source Review & Story-Plan Completion Continuity IV','Build 345 successor mismatch')
q(all(v is False for v in s.values()),'Build 344 safety authority drift')
for token in ('record_story_execution_evidence','STORY_EXECUTION_EVENT_TYPES','notes.length < 20','maker_story_auto_reviewed: false'):q(token in cpapi,'Build 344 factual intake authority missing '+token)
q('onRequestPost' not in api,'Build 344 closure endpoint must remain GET-only')
for token in ('const BUILD=344','placeholderGuard','substantiveFact','comparison_baseline','explicit_human_review_only'):q(token in api,'Build 344 closure API missing '+token)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 344 measurement must remain read-only: '+forbidden.strip())
for token in ('execution_events','result_events','lesson_events','actual_result','lesson_learned','execution_rows_with_public_or_media_flags','pragma_foreign_key_check'):q(token in sql,'Build 344 measurement missing '+token)
for token in ('REAL_OUTCOME_EVIDENCE_STILL_REQUIRED','REAL_OUTCOME_EVIDENCE_PARTIAL','REAL_EVENTS_COMPLETE_MAKER_STORY_FACTS_STILL_REQUIRED','REAL_OUTCOME_FACTS_COMPLETE_READY_FOR_EXPLICIT_HUMAN_REVIEW','comparison_to_build343','placeholderGuard','substantiveFact','automatic_story_review:false','production_d1_contact:false'):q(token in verify,'Build 344 verifier missing '+token)
for token in ('data-build344-factual-evidence-continuity','Build 344 • factual evidence continuity IV','ready for explicit human review','Still missing:'):q(token in ui,'Build 344 Creative Process UI missing '+token)
q('data-build344-factual-evidence-continuity' in page and '/public/js/admin-creative-process.js?v=467b344' in page,'Build 344 Creative Process page/cache marker missing')
q('data-build338-factual-evidence-continuity' in page and '/public/js/admin-creative-process.js?v=467b338' in page,'Build 338 historical Creative Process marker missing')
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','SYNTHETIC EVIDENCE: ZERO','AUTOMATIC STORY REVIEW: ZERO','PUBLIC CANDIDACY MUTATION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 344 workflow boundary missing '+token)
q('Build 344 — 35th Promo Factual Evidence Completion Continuity IV' in road and 'Build 345 — Grey Hair Source Review & Story-Plan Completion Continuity IV' in road,'Build 344/345 roadmap continuity missing')
q(int(p.get('build') or 0)>=344,'Current pointer must retain Build 344 or successor')
if int(p.get('build') or 0)==344:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==345,'Build 344 current authority/successor mismatch')
print('RELEASE 467 BUILD 344 35TH PROMO FACTUAL EVIDENCE COMPLETION CONTINUITY IV')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Real factual completeness can only produce explicit human-review readiness')
