#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build345-grey-hair-source-review-story-plan-completion-continuity-iv.json');prev=j('release467-build344-35th-promo-factual-evidence-completion-continuity-iv.json');p=j('current-development-authority.json')
api=t('functions/api/admin/grey-hair-story-readiness.js');page=t('admin/grey-hair-story-readiness/index.html');ui=t('public/js/admin-grey-hair-story-readiness-v320.js')
sql=t('scripts/release467_build345_measurement.sql');verify=t('scripts/release467_build345_verify_measurement.mjs');wf=t('.github/workflows/release467-build345-grey-hair-source-review-story-plan-completion-continuity-iv.yml');road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_343_348.md')
q(a.get('build')==345 and a.get('title')=='Grey Hair Source Review & Story-Plan Completion Continuity IV','Build 345 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 344 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='48fb55182bcd6b0a4208e0cc36e2253fd73b92e6' and (prev.get('final_closure') or {}).get('tree_sha')=='541504c45ad45c8bd529ae42ee25abcc64980d67','Build 344 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='e797092067a1ba6c5d3d27f23db48e990e89edaf' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='541504c45ad45c8bd529ae42ee25abcc64980d67','Build 344 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('reuses_build327_authorities') is True and c.get('reuses_build339_measurement_model') is True and c.get('workspace_read_only') is True,'Build 345 retained authority mismatch')
q(c.get('approved_source_evidence_min')==2 and c.get('reviewed_story_plans_min')==1 and c.get('source_backed_story_items_min')==2 and c.get('confirmed_capture_tracks_min')==4,'Build 345 thresholds mismatch')
q(c.get('next_build')==346 and c.get('next_build_title')=='Search Console Real Export & Fresh Discovery Intake VI','Build 346 successor mismatch')
q(all(v is False for v in s.values()),'Build 345 safety authority drift')
for token in ('SOURCE_EVIDENCE_REVIEW_REQUIRED','APPROVED_SOURCE_EVIDENCE_INSUFFICIENT','STORY_PLANNING_PREREQUISITE_SYNC_REQUIRED','HUMAN_REVIEWED_STORY_PLAN_REQUIRED','SOURCE_BACKED_STORY_ITEMS_REQUIRED','GREY_HAIR_REVIEWED_EVIDENCE_READY_PENDING_MAKER_STORY_DECISION','Build 345 source review &amp; story-plan continuity IV','Review CAIP evidence','Open story planning'):q(token in ui,'Build 345 UI missing '+token)
q('/public/js/admin-grey-hair-story-readiness-v320.js?v=467b345' in page and '/public/js/admin-grey-hair-story-readiness-v320.js?v=467b339' in page,'Build 345 current/historical cache identities missing')
q('const RELEASE=467,BUILD=345' in api and "TITLE='Grey Hair Source Review & Story-Plan Completion Continuity IV'" in api,'Build 345 API identity missing')
q('comparison_baseline:{source_build:343' in api,'Build 345 API comparison baseline mismatch')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 345 measurement must remain read-only: '+forbidden.strip())
for token in ('source_evidence_needs_review','approved_source_evidence','confirmed_capture_groups','confirmed_capture_tracks','reviewed_story_plans','source_backed_story_items','maker_story_profiles','pragma_foreign_key_check'):q(token in sql,'Build 345 measurement missing '+token)
for token in ('comparison_to_build343','evidence_approval_mutation:false','story_plan_review_mutation:false','maker_story_profile_mutation:false','production_d1_contact:false'):q(token in verify,'Build 345 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','EVIDENCE APPROVAL MUTATION: ZERO','SYNC MUTATION: ZERO','STORY PLAN REVIEW MUTATION: ZERO','MAKER STORY PROFILE MUTATION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 345 workflow boundary missing '+token)
q('Build 345 — Grey Hair Source Review & Story-Plan Completion Continuity IV' in road and 'Build 346 — Search Console Real Export & Fresh Discovery Intake VI' in road,'Build 345/346 roadmap continuity missing')
q(int(p.get('build') or 0)>=345,'Current pointer must retain Build 345 or successor')
if int(p.get('build') or 0)==345:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==346,'Build 345 current authority/successor mismatch')
print('RELEASE 467 BUILD 345 GREY HAIR SOURCE REVIEW & STORY-PLAN COMPLETION CONTINUITY IV')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Build 345 remains review-first; source workspaces retain mutation authority')
