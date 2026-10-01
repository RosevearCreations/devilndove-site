#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build332-35th-promo-factual-evidence-completion-continuity-ii.json');prev=j('release467-build331-evidence-gap-execution-workbench-input-completion-continuity.json');p=j('current-development-authority.json')
api=t('functions/api/admin/35th-promo-outcome-closure.js');cpapi=t('functions/api/admin/creative-process.js');ui=t('public/js/admin-creative-process.js');page=t('admin/creative-process/index.html');sql=t('scripts/release467_build332_measurement.sql');verify=t('scripts/release467_build332_verify_measurement.mjs');wf=t('.github/workflows/release467-build332-35th-promo-factual-evidence-completion-continuity-ii.yml');road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_331_336.md')
q(a.get('build')==332 and a.get('title')=='35th Promo Factual Evidence Completion Continuity II','Build 332 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 331 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='5246cd2c0ea6ec6568c31f91f272e225d1e40cbe' and (prev.get('final_closure') or {}).get('tree_sha')=='269ea72e333d4ff7883121456d9b65aab83070c3','Build 331 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='0fce96f146d63411feb401b546c12b945ab861ac','Build 331 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('reuses_operator_action')=='record_story_execution_evidence','Build 332 must reuse factual intake')
q(c.get('readiness_only') is True and c.get('explicit_human_review_required') is True and c.get('automatic_story_review') is False and c.get('automatic_public_candidate') is False,'Build 332 review-first boundary mismatch')
q(c.get('next_build')==333 and c.get('next_build_title')=='Grey Hair Source Review & Story-Plan Completion Continuity II','Build 333 successor mismatch')
q(all(v is False for v in s.values()),'Build 332 safety authority drift')
for token in ('record_story_execution_evidence','STORY_EXECUTION_EVENT_TYPES','notes.length < 20','maker_story_auto_reviewed: false'):q(token in cpapi,'Build 332 factual intake authority missing '+token)
q('onRequestPost' not in api,'Build 332 closure endpoint must remain GET-only')
for token in ('const BUILD=332','placeholderGuard','substantiveFact','comparison_baseline','explicit_human_review_only'):q(token in api,'Build 332 closure API missing '+token)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 332 measurement must remain read-only: '+forbidden.strip())
for token in ('execution_events','result_events','lesson_events','actual_result','lesson_learned','execution_rows_with_public_or_media_flags','pragma_foreign_key_check'):q(token in sql,'Build 332 measurement missing '+token)
for token in ('REAL_OUTCOME_EVIDENCE_STILL_REQUIRED','REAL_OUTCOME_EVIDENCE_PARTIAL','REAL_EVENTS_COMPLETE_MAKER_STORY_FACTS_STILL_REQUIRED','REAL_OUTCOME_FACTS_COMPLETE_READY_FOR_EXPLICIT_HUMAN_REVIEW','comparison_to_build331','placeholderGuard','substantiveFact','automatic_story_review:false','production_d1_contact:false'):q(token in verify,'Build 332 verifier missing '+token)
for token in ('data-build332-factual-evidence-continuity','Build 332 • factual evidence continuity II','Build 326 • real outcome closure baseline retained','ready for explicit human review','Still missing:','Build 326 readiness:'):q(token in ui,'Build 332 Creative Process UI missing '+token)
q('data-build332-factual-evidence-continuity' in page and '/public/js/admin-creative-process.js?v=467b332' in page,'Build 332 Creative Process page/cache marker missing')
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','SYNTHETIC EVIDENCE: ZERO','AUTOMATIC STORY REVIEW: ZERO','PUBLIC CANDIDACY MUTATION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 332 workflow boundary missing '+token)
q('Build 332 — 35th Promo Factual Evidence Completion Continuity II' in road and 'Build 333 — Grey Hair Source Review & Story-Plan Completion Continuity II' in road,'Build 332/333 roadmap continuity missing')
q(int(p.get('build') or 0)>=332,'Current pointer must retain Build 332 or successor')
if int(p.get('build') or 0)==332:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==333,'Build 332 current authority/successor mismatch')
print('RELEASE 467 BUILD 332 35TH PROMO FACTUAL EVIDENCE COMPLETION CONTINUITY II')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Real factual completeness can only produce explicit human-review readiness')
