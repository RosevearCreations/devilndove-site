#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8')
def j(p):return json.loads(t(p))
def q(ok,msg):
 if not ok:F.append(msg)
a=j('release467-build374-35th-promo-factual-evidence-completion-continuity-ix.json');prev=j('release467-build373-evidence-gap-execution-workbench-input-completion-continuity-viii.json');p=j('current-development-authority.json')
sql=t('scripts/release467_build374_measurement.sql');verify=t('scripts/release467_build374_verify_measurement.mjs');wf=t('.github/workflows/release467-build374-35th-promo-factual-evidence-completion-continuity-ix.yml')
api=t('functions/api/admin/35th-promo-outcome-closure.js')
q(a['build']==374 and a['title']=='35th Promo Factual Evidence Completion Continuity IX','Build 374 identity')
q(prev.get('state')=='PRODUCTION_GREEN','Build 373 Production closure')
q((prev.get('final_closure') or {}).get('dev_sha')=='c4ddd12b9e3fcd1cbeafaf88de6cfaf3e653f734' and (prev.get('final_closure') or {}).get('tree_sha')=='708c45e37c7a6a77c353816191ddc5271527808e','Build 373 exact Development closure')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='5834a775772f4935794536dbfe0d5f0c679b9580' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='708c45e37c7a6a77c353816191ddc5271527808e','Build 373 Production checkpoint')
q(a['predecessor']['development_sha']=='c4ddd12b9e3fcd1cbeafaf88de6cfaf3e653f734' and a['predecessor']['production_main_sha']=='5834a775772f4935794536dbfe0d5f0c679b9580','Build 374 predecessor')
q(all(x is False for x in a['safety'].values()),'Safety boundary mutation')
c=a['contract']
for k in ('readiness_only','explicit_human_review_required','factual_placeholder_excluded','draft_not_execution_evidence','missing_input_guidance','preview_only_user_feedback'):
 q(c.get(k) is True,'Contract '+k)
for k in ('automatic_story_review','automatic_public_candidate','automatic_publication','automatic_evidence_selection','media_rights_inference'):
 q(c.get(k) is False,'Non-automatic action '+k)
q(c.get('source_workbench_build')==373 and c.get('reuses_operator_action')=='record_story_execution_evidence','Workbench action authority')
upper=' '+re.sub(r'--[^\n]*','',sql).upper()+' '
for term in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(term not in upper,'Read-only measurement '+term)
for term in ('execution_events','result_events','lesson_events','actual_result','lesson_learned','pragma_foreign_key_check'):
 q(term in sql,'SQL '+term)
for term in ('sets.length!==4','REAL_OUTCOME_EVIDENCE_STILL_REQUIRED','REAL_OUTCOME_EVIDENCE_PARTIAL','REAL_EVENTS_COMPLETE_MAKER_STORY_FACTS_STILL_REQUIRED','REAL_OUTCOME_FACTS_COMPLETE_READY_FOR_EXPLICIT_HUMAN_REVIEW','placeholderGuard','substantiveFact','production_d1_contact:false','comparison_to_build373'):
 q(term in verify,'Verifier '+term)
for term in ("const BUILD=374","missing_requirements","explicit_human_review_only","record_story_execution_evidence","placeholderGuard","substantiveFact","no-store"):
 q(term in api,'Read-only GET factual API '+term)
for term in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','SYNTHETIC EVIDENCE: ZERO','AUTOMATIC STORY REVIEW: ZERO','PUBLIC CANDIDACY MUTATION: ZERO','PRODUCTION D1 CONTACT: ZERO'):
 q(term in wf,'Workflow '+term)
q('workflow_dispatch:' in wf and (('branches: [dev]' in wf) if p['build']==374 else ('branches: [dev]' not in wf)),'Build 374 historical/active workflow status')
q('workflow_dispatch:' in t('.github/workflows/release467-build373-evidence-gap-execution-workbench-input-completion-continuity-viii.yml') and 'branches: [dev]' not in t('.github/workflows/release467-build373-evidence-gap-execution-workbench-input-completion-continuity-viii.yml'),'Build 373 historical lane')
q('Build 374 — 35th Promo Factual Evidence Completion Continuity IX' in t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_373_378.md'),'Roadmap Build 374')
q(p.get('state')=='DEVELOPMENT_GREEN' and p.get('build',0)>=374,'Current authority')
if p.get('build')==374:q(p['next_build']==375 and p['next_build_title']=='Grey Hair Source Review & Story-Plan Completion Continuity IX' and str(p.get('promotion_state','')).endswith('_CANDIDATE_NOT_YET_VERIFIED'),'Roadmap/current governance')
for path in ('scripts/release467_build374_verify_measurement.mjs','functions/api/admin/35th-promo-outcome-closure.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js'):
 r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,capture_output=True)
 q(r.returncode==0,'Syntax '+path+': '+r.stderr[-400:])
if F:
 print('RELEASE467_BUILD374_REGRESSION=FAIL');[print('-',x) for x in F];sys.exit(1)
print('RELEASE467_BUILD374_REGRESSION=GREEN')
