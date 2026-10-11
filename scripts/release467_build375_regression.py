#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8')
def j(p):return json.loads(t(p))
def q(ok,msg):
 if not ok:F.append(msg)
a=j('release467-build375-grey-hair-source-review-story-plan-completion-continuity-ix.json');prev=j('release467-build374-35th-promo-factual-evidence-completion-continuity-ix.json');p=j('current-development-authority.json')
sql=t('scripts/release467_build375_measurement.sql');verify=t('scripts/release467_build375_verify_measurement.mjs');wf=t('.github/workflows/release467-build375-grey-hair-source-review-story-plan-completion-continuity-ix.yml')
api=t('functions/api/admin/grey-hair-story-readiness.js');ui=t('public/js/admin-grey-hair-story-readiness-v320.js');page=t('admin/grey-hair-story-readiness/index.html')
q(a['build']==375 and a['title']=='Grey Hair Source Review & Story-Plan Completion Continuity IX','Build 375 identity')
q(prev.get('state')=='PRODUCTION_GREEN','Build 374 closure Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='e87a0f86c833ff581c9d5ef62ac37a39b6db5408' and (prev.get('final_closure') or {}).get('tree_sha')=='f1b14b8dd2e4784fe8a155e0d0e96d5b66e0619f','Build 374 exact development closure')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='2ea0373d6054c6f45edab22d1b58b4a9c037f8eb' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='f1b14b8dd2e4784fe8a155e0d0e96d5b66e0619f','Build 374 Production checkpoint')
q(a['predecessor']['development_sha']=='e87a0f86c833ff581c9d5ef62ac37a39b6db5408' and a['predecessor']['production_main_sha']=='2ea0373d6054c6f45edab22d1b58b4a9c037f8eb','Build 375 predecessor')
q(all(x is False for x in a['safety'].values()),'Safety contract mutation')
c=a['contract']
for key in ('evidence_review_must_be_complete','explicit_human_evidence_review_required','explicit_human_story_plan_review_required','workspace_read_only','human_completion_only','requires_source_backed_plan','real_source_review_required'):
 q(c.get(key) is True,'Contract '+key)
for key in ('raw_private_urls_exposed','automatic_evidence_approval','automatic_story_plan_generation','automatic_story_plan_review','automatic_maker_story_profile','automatic_publication'):
 q(c.get(key) is False,'Nonautomatic '+key)
q(c['approved_source_evidence_min']==2 and c['reviewed_story_plans_min']==1 and c['source_backed_story_items_min']==2 and c['confirmed_capture_tracks_min']==4,'Human evidence thresholds')
upper=' '+re.sub(r'--[^\n]*','',sql).upper()+' '
for term in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(term not in upper,'SQL read-only '+term)
for term in ('source_evidence_needs_review','approved_source_evidence','confirmed_capture_groups','confirmed_capture_tracks','reviewed_story_plans','source_backed_story_items','maker_story_profiles','pragma_foreign_key_check'):q(term in sql,'SQL '+term)
for term in ('sets.length!==4','SOURCE_EVIDENCE_REVIEW_REQUIRED','APPROVED_SOURCE_EVIDENCE_INSUFFICIENT','STORY_PLANNING_PREREQUISITE_SYNC_REQUIRED','HUMAN_REVIEWED_STORY_PLAN_REQUIRED','SOURCE_BACKED_STORY_ITEMS_REQUIRED','GREY_HAIR_REVIEWED_EVIDENCE_READY_PENDING_MAKER_STORY_DECISION','comparison_to_build369','production_d1_contact:false'):q(term in verify,'Verifier '+term)
q("const RELEASE=467,BUILD=375,TITLE='Grey Hair Source Review & Story-Plan Completion Continuity IX'" in api,'Current Grey Hair API identity')
q('Release 467 Build 375' in ui and 'readiness_state' in ui,'Current UI label and state')
q('Release 467 • Build 375' in page and '/public/js/admin-grey-hair-story-readiness-v320.js?v=467b375' in page,'Current page/cache')
for term in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','SYNTHETIC EVIDENCE: ZERO','EVIDENCE APPROVAL MUTATION: ZERO','SYNC MUTATION: ZERO','STORY PLAN GENERATION: ZERO','STORY PLAN REVIEW MUTATION: ZERO','MAKER STORY PROFILE MUTATION: ZERO','PUBLICATION/SOCIAL MUTATION: ZERO','MEDIA RIGHTS INFERENCE: ZERO','PRODUCTION D1 CONTACT: ZERO','branches: [dev]'):q(term in wf,'Workflow '+term)
q('workflow_dispatch:' in wf,'Workflow manual option')
q('workflow_dispatch:' in t('.github/workflows/release467-build374-35th-promo-factual-evidence-completion-continuity-ix.yml') and 'branches: [dev]' not in t('.github/workflows/release467-build374-35th-promo-factual-evidence-completion-continuity-ix.yml'),'Previous workflow manual-only')
q('Build 375 — Grey Hair Source Review & Story-Plan Completion Continuity IX' in t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_373_378.md'),'Roadmap continuity')
q(p['state']=='DEVELOPMENT_GREEN' and p['build']>=375,'Current pointer')
if p['build']==375:q(p['next_build']==376 and p['next_build_title']=='Search Console Real Export & Fresh Discovery Intake XI' and str(p['promotion_state']).endswith('_CANDIDATE_NOT_YET_VERIFIED'),'Current successor and promotion')
for path in ('scripts/release467_build375_verify_measurement.mjs','functions/api/admin/grey-hair-story-readiness.js','public/js/admin-grey-hair-story-readiness-v320.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js'):
 r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,capture_output=True)
 q(r.returncode==0,'Syntax '+path+': '+r.stderr[-400:])
if F:
 print('RELEASE467_BUILD375_REGRESSION=FAIL');[print('-',x) for x in F];sys.exit(1)
print('RELEASE467_BUILD375_REGRESSION=GREEN')
