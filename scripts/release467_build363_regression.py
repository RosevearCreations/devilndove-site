#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build363-grey-hair-source-review-story-plan-completion-continuity-vii.json');prev=j('release467-build362-35th-promo-factual-evidence-completion-continuity-vii.json');p=j('current-development-authority.json')
sql=t('scripts/release467_build363_measurement.sql');verify=t('scripts/release467_build363_verify_measurement.mjs');api=t('functions/api/admin/grey-hair-story-readiness.js');ui=t('public/js/admin-grey-hair-story-readiness-v320.js');page=t('admin/grey-hair-story-readiness/index.html');wf=t('.github/workflows/release467-build363-grey-hair-source-review-story-plan-completion-continuity-vii.yml');oldwf=t('.github/workflows/release467-build362-35th-promo-factual-evidence-completion-continuity-vii.yml');road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_361_366.md')
q(a.get('build')==363 and a.get('title')=='Grey Hair Source Review & Story-Plan Completion Continuity VII','Build 363 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 362 Production closure not successor-ingested')
fc=prev.get('final_closure') or {};pc=prev.get('production_checkpoint') or {}
q(fc.get('dev_sha')=='44bd708887357fc7b3341afdae3e990bb3524719' and fc.get('tree_sha')=='c8ab10efe9bcd310e74d3b5debefb32bf0f77296','Build 362 exact Development closure missing')
q(pc.get('main_sha')=='314ceb7e38d946cc9cef8d0e03fc43d2be3d7b81' and pc.get('tree_sha')=='c8ab10efe9bcd310e74d3b5debefb32bf0f77296','Build 362 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
for k in ('reuses_build357_measurement_model','evidence_review_must_be_complete','explicit_human_evidence_review_required','explicit_human_story_plan_review_required','workspace_read_only'):q(c.get(k) is True,'Build 363 contract missing '+k)
for k in ('raw_private_urls_exposed','automatic_evidence_approval','automatic_story_plan_generation','automatic_story_plan_review','automatic_maker_story_profile','automatic_publication'):q(c.get(k) is False,'Build 363 review-first boundary drift '+k)
q(c.get('approved_source_evidence_min')==2 and c.get('reviewed_story_plans_min')==1 and c.get('source_backed_story_items_min')==2 and c.get('confirmed_capture_tracks_min')==4,'Build 363 thresholds mismatch')
q(c.get('next_build')==364 and c.get('next_build_title')=='Search Console Real Export & Fresh Discovery Intake IX','Build 364 successor mismatch')
q(all(v is False for v in s.values()),'Build 363 safety boundary drift')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 363 measurement must remain read-only: '+forbidden.strip())
for token in ('source_evidence_needs_review','approved_source_evidence','confirmed_capture_groups','confirmed_capture_tracks','reviewed_story_plans','source_backed_story_items','maker_story_profiles','pragma_foreign_key_check'):q(token in sql,'Build 363 measurement missing '+token)
for token in ('SOURCE_EVIDENCE_REVIEW_REQUIRED','APPROVED_SOURCE_EVIDENCE_INSUFFICIENT','STORY_PLANNING_PREREQUISITE_SYNC_REQUIRED','HUMAN_REVIEWED_STORY_PLAN_REQUIRED','SOURCE_BACKED_STORY_ITEMS_REQUIRED','GREY_HAIR_REVIEWED_EVIDENCE_READY_PENDING_MAKER_STORY_DECISION','comparison_to_build357','production_d1_contact:false'):q(token in verify,'Build 363 verifier missing '+token)
q("const RELEASE=467,BUILD=363,TITLE='Grey Hair Source Review & Story-Plan Completion Continuity VII'" in api,'Build 363 Grey Hair API identity missing')
q('comparison_baseline:{source_build:357' in api,'Build 363 API comparison baseline mismatch')
q('Build 363 source review &amp; story-plan continuity VII' in ui,'Build 363 Grey Hair UI identity missing')
q('/public/js/admin-grey-hair-story-readiness-v320.js?v=467b363' in page,'Build 363 Grey Hair cache identity missing')
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','SYNTHETIC EVIDENCE: ZERO','EVIDENCE APPROVAL MUTATION: ZERO','SYNC MUTATION: ZERO','STORY PLAN GENERATION: ZERO','STORY PLAN REVIEW MUTATION: ZERO','MAKER STORY PROFILE MUTATION: ZERO','PUBLICATION/SOCIAL MUTATION: ZERO','MEDIA RIGHTS INFERENCE: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 363 workflow boundary missing '+token)
current_build=int(p.get('build') or 0)
q(('branches: [dev]' in wf) if current_build==363 else ('workflow_dispatch:' in wf and 'branches: [dev]' not in wf),'Build 363 workflow trigger mismatch')
q('Historical after Build 363 activation; manual-only.' in oldwf and 'branches: [dev]' not in oldwf,'Build 362 workflow was not retired to manual-only')
q('Build 363 — Grey Hair Source Review & Story-Plan Completion Continuity VII' in road and 'Build 364 — Search Console Real Export & Fresh Discovery Intake IX' in road,'Build 363/364 roadmap continuity missing')
q(int(p.get('build') or 0)>=363,'Current pointer must retain Build 363 or successor')
if int(p.get('build') or 0)==363:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==364,'Build 363 current authority/successor mismatch')
print('RELEASE 467 BUILD 363 GREY HAIR SOURCE REVIEW & STORY-PLAN COMPLETION CONTINUITY VII')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 364 — Search Console Real Export & Fresh Discovery Intake IX')
