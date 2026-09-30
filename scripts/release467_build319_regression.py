#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build319-35th-promo-execution-evidence-intake-completeness.json')
prev=j('release467-build318-content-adoption-discovery-outcomes-renewal-iii.json')
p=j('current-development-authority.json')
api=t('functions/api/admin/creative-process.js');ui=t('public/js/admin-creative-process.js');page=t('admin/creative-process/index.html')
sql=t('scripts/release467_build319_measurement.sql');verify=t('scripts/release467_build319_verify_measurement.mjs')
wf=t('.github/workflows/release467-build319-35th-promo-execution-evidence-intake-completeness.yml')
road=t('docs/operations/RELEASE_467_EVIDENCE_COMPLETION_DISCOVERY_ADOPTION_BUILDS_319_324.md')
q(a.get('build')==319 and a.get('title')=='35th Promo Execution Evidence Intake & Completeness','Build 319 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 318 Production closure not ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='90e3c5c14643dfef21b8d4435c81e92606eb75d4' and (prev.get('final_closure') or {}).get('tree_sha')=='0c1546c92eebdbdc6039a15c7fd7a7fd63055c3e','Build 318 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='e51706c73352af58cac0640a12e915c5b4b2796d','Build 318 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('operator_action')=='record_story_execution_evidence','Build 319 operator action mismatch')
q(c.get('actual_work_confirmation_required') is True and c.get('evidence_auto_selected') is False and c.get('maker_story_auto_reviewed') is False,'Build 319 review-first intake policy mismatch')
q(c.get('public_story_candidate_forced_false') is True and c.get('media_url_forced_empty') is True,'Build 319 private intake boundary mismatch')
q(all(v is False for v in s.values()),'Build 319 safety authority drift')
for token in ('STORY_EXECUTION_EVENT_TYPES',"projectId !== 5",'CP-MSC1SUG2','notes.length < 20','record_story_execution_evidence','media_url,is_public_candidate,created_by','NULL,0,?7','evidence_auto_selected: false','maker_story_auto_reviewed: false'):
    q(token in api,'Build 319 Creative Process API missing '+token)
start=api.find('async function handleRecordStoryExecutionEvidence');end=api.find('async function finishInterceptedAction',start);seg=api[start:end] if start>=0 and end>start else ''
q(start>=0 and end>start,'Build 319 execution-evidence handler missing')
for forbidden in ('creative_project_evidence_selections','UPDATE creative_project_maker_story_profiles','INSERT INTO content_publications','INSERT INTO social_post_queue','UPDATE content_publications','UPDATE social_post_queue','UPDATE creative_assets','UPDATE caip_media_upload_files'):
    q(forbidden not in seg,'Build 319 intake crossed review/publication/media boundary: '+forbidden)
for token in ('data-build319-execution-evidence-intake','Build 319 • factual evidence intake','I confirm this describes work that actually happened',"action:'record_story_execution_evidence'",'Build 319 does not change these fields'):
    q(token in ui,'Build 319 operator UI missing '+token)
q('data-build319-evidence-intake' in page and '/public/js/admin-creative-process.js?v=467b319' in page,'Build 319 Creative Process page/cache marker missing')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 319 measurement must remain read-only: '+forbidden.strip())
for token in ('execution_events','result_events','lesson_events','selected_execution_evidence','execution_rows_with_public_or_media_flags','pragma_foreign_key_check'):q(token in sql,'Build 319 measurement missing '+token)
for token in ('INTAKE_READY_AWAITING_REAL_EXECUTION_RESULT_LESSON_EVIDENCE','REAL_EVIDENCE_PARTIAL_PENDING_COMPLETENESS_AND_HUMAN_REVIEW','REAL_EXECUTION_RESULT_LESSON_EVIDENCE_PRESENT_PENDING_HUMAN_REVIEW','ci_evidence_mutation:false','automatic_story_review:false','production_d1_contact:false'):q(token in verify,'Build 319 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','CI EVIDENCE MUTATION: ZERO','PLACEHOLDER EVIDENCE: ZERO','AUTOMATIC STORY REVIEW: ZERO','PUBLICATION MUTATION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 319 workflow boundary missing '+token)
q('Build 320 — Grey Hair Source-Evidence Review & Story-Plan Readiness' in road,'Build 320 successor roadmap missing')
q(int(p.get('build') or 0)>=319,'Current pointer must retain Build 319 or successor')
if int(p.get('build') or 0)==319:q(int(p.get('next_build') or 0)==320,'Build 320 successor pointer missing')
print('RELEASE 467 BUILD 319 35TH PROMO EXECUTION EVIDENCE INTAKE & COMPLETENESS')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Real execution/result/lesson evidence is operator-supplied only; no auto-review or publication')
print('Next: Build 320 — Grey Hair Source-Evidence Review & Story-Plan Readiness')
