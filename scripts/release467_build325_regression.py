#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build325-evidence-gap-owner-queue-operator-action-traceability.json')
prev=j('release467-build324-content-adoption-discovery-outcomes-renewal-iv.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build325_owner_queue.sql')
verify=t('scripts/release467_build325_verify_owner_queue.mjs')
api=t('functions/api/admin/evidence-gap-owner-queue.js')
page=t('admin/evidence-gap-owner-queue/index.html')
ui=t('public/js/admin-evidence-gap-owner-queue-v325.js')
wf=t('.github/workflows/release467-build325-evidence-gap-owner-queue-operator-action-traceability.yml')
road=t('docs/operations/RELEASE_467_EVIDENCE_ACTION_ADOPTION_BUILDS_325_330.md')
q(a.get('build')==325 and a.get('title')=='Evidence Gap Owner Queue & Operator Action Traceability','Build 325 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 324 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='1ed7d181bea85004b181b93f1ba97e300946c575','Build 324 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='06e40c332b1bacf2260f954ff2ac79a25d9788cc','Build 324 exact Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('queue_mode')=='READ_ONLY_DERIVED_FROM_EXISTING_SOURCE_AUTHORITIES','Build 325 queue mode mismatch')
q(c.get('user_assignment_persistence') is False and c.get('acknowledgement_persistence') is False and c.get('resolution_persistence') is False and c.get('shadow_task_table') is False,'Build 325 persistence boundary drift')
q(c.get('next_build')==326 and c.get('next_build_title')=='35th Promo Real Outcome Evidence Closure','Build 326 successor mismatch')
q(all(v is False for v in s.values()),'Build 325 safety authority drift')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 325 measurement must remain read-only: '+forbidden.strip())
for token in ('creative_process_record_story_execution_evidence','source_evidence_needs_review','search_console_import_batches','NOT EXISTS (SELECT 1 FROM creative_project_maker_story_profiles','pragma_foreign_key_check'):q(token in sql,'Build 325 SQL missing '+token)
for token in ('35TH_PROMO_REAL_OUTCOME_EVIDENCE','GREY_HAIR_SOURCE_EVIDENCE_REVIEW','REAL_SEARCH_CONSOLE_EXPORT','UNPROFILED_MAKER_STORY_EVIDENCE','owner_assignment_persistence:false','acknowledgement_persistence:false','no_completion_by_queue_state:true','production_d1_contact:false'):q(token in verify,'Build 325 verifier missing '+token)
for token in ('role:\'read_only_evidence_gap_owner_queue\'','shadow_task_table:false','owner_assignment_persistence:false','onRequestGet'):q(token in api,'Build 325 API missing '+token)
q('onRequestPost' not in api,'Build 325 queue API must remain GET-only')
for token in ('Release 467 • Build 325','Evidence Gap Owner Queue &amp; Operator Action Traceability','evidenceGapOwnerQueueMount','admin-evidence-gap-owner-queue-v325.js'):q(token in page,'Build 325 page missing '+token)
for token in ('This is a view over existing factual authorities, not a second task system','no user assignment','Open source workspace'):q(token in ui,'Build 325 UI missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','OWNER ASSIGNMENT PERSISTENCE: ZERO','ACKNOWLEDGEMENT PERSISTENCE: ZERO','SHADOW TASK TABLE: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 325 workflow boundary missing '+token)
q('Build 325 — Evidence Gap Owner Queue & Operator Action Traceability' in road and 'Build 326 — 35th Promo Real Outcome Evidence Closure' in road,'Build 325/326 roadmap continuity missing')
q(int(p.get('build') or 0)>=325,'Current pointer must retain Build 325 or successor')
if int(p.get('build') or 0)==325:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==326,'Build 325 current authority/successor mismatch')
print('RELEASE 467 BUILD 325 EVIDENCE GAP OWNER QUEUE & OPERATOR ACTION TRACEABILITY')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Queue remains read-only; source workspaces remain authoritative for real completion')
