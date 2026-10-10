#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build369-grey-hair-source-review-story-plan-completion-continuity-viii.json');prev=j('release467-build368-35th-promo-factual-evidence-completion-continuity-viii.json');p=j('current-development-authority.json')
sql=t('scripts/release467_build369_measurement.sql');verify=t('scripts/release467_build369_verify_measurement.mjs');api=t('functions/api/admin/grey-hair-story-readiness.js');ui=t('public/js/admin-grey-hair-story-readiness-v320.js');page=t('admin/grey-hair-story-readiness/index.html');wf=t('.github/workflows/release467-build369-grey-hair-source-review-story-plan-completion-continuity-viii.yml');oldwf=t('.github/workflows/release467-build368-35th-promo-factual-evidence-completion-continuity-viii.yml');road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_367_372.md')
q(a.get('build')==369 and a.get('title')=='Grey Hair Source Review & Story-Plan Completion Continuity VIII','Build 369 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 368 Production closure not successor-ingested')
fc=prev.get('final_closure') or {};pc=prev.get('production_checkpoint') or {}
q(fc.get('dev_sha')=='d36a643fc8b8805f1b4dbdb3fc0963ba375c07c3' and fc.get('tree_sha')=='18b63f5f1910fe48ac40497f217e99d08132c00b','Build 368 exact Development closure missing')
q(pc.get('main_sha')=='253824ef52cc4faa90b4f5fe42cc177264bf2df1' and pc.get('tree_sha')=='18b63f5f1910fe48ac40497f217e99d08132c00b','Build 368 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
for k in ('reuses_build363_measurement_model','evidence_review_must_be_complete','explicit_human_evidence_review_required','explicit_human_story_plan_review_required','workspace_read_only'):q(c.get(k) is True,'Build 369 contract missing '+k)
for k in ('raw_private_urls_exposed','automatic_evidence_approval','automatic_story_plan_generation','automatic_story_plan_review','automatic_maker_story_profile','automatic_publication'):q(c.get(k) is False,'Build 369 review-first boundary drift '+k)
q(c.get('approved_source_evidence_min')==2 and c.get('reviewed_story_plans_min')==1 and c.get('source_backed_story_items_min')==2 and c.get('confirmed_capture_tracks_min')==4,'Build 369 thresholds mismatch')
q(c.get('next_build')==370 and c.get('next_build_title')=='Search Console Real Export & Fresh Discovery Intake X','Build 370 successor mismatch')
q(all(v is False for v in s.values()),'Build 369 safety boundary drift')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 369 measurement must remain read-only: '+forbidden.strip())
for token in ('source_evidence_needs_review','approved_source_evidence','confirmed_capture_groups','confirmed_capture_tracks','reviewed_story_plans','source_backed_story_items','maker_story_profiles','pragma_foreign_key_check'):q(token in sql,'Build 369 measurement missing '+token)
for token in ('SOURCE_EVIDENCE_REVIEW_REQUIRED','APPROVED_SOURCE_EVIDENCE_INSUFFICIENT','STORY_PLANNING_PREREQUISITE_SYNC_REQUIRED','HUMAN_REVIEWED_STORY_PLAN_REQUIRED','SOURCE_BACKED_STORY_ITEMS_REQUIRED','GREY_HAIR_REVIEWED_EVIDENCE_READY_PENDING_MAKER_STORY_DECISION','comparison_to_build363','production_d1_contact:false'):q(token in verify,'Build 369 verifier missing '+token)
q('Release 467 Build 369 — Grey Hair Source Review & Story-Plan Completion Continuity VIII.' in api,'Build 369 Grey Hair API provenance missing')
q('Build 369 source review &amp; story-plan continuity VIII' in ui,'Build 369 Grey Hair UI identity missing')
q('/public/js/admin-grey-hair-story-readiness-v320.js?v=467b369' in page,'Build 369 Grey Hair cache identity missing')
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','SYNTHETIC EVIDENCE: ZERO','EVIDENCE APPROVAL MUTATION: ZERO','SYNC MUTATION: ZERO','STORY PLAN GENERATION: ZERO','STORY PLAN REVIEW MUTATION: ZERO','MAKER STORY PROFILE MUTATION: ZERO','PUBLICATION/SOCIAL MUTATION: ZERO','MEDIA RIGHTS INFERENCE: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 369 workflow boundary missing '+token)
current_build=int(p.get('build') or 0)
q(('branches: [dev]' in wf) if current_build==369 else ('workflow_dispatch:' in wf and 'branches: [dev]' not in wf),'Build 369 workflow trigger mismatch')
q('Historical after Build 369 activation; manual-only.' in oldwf and 'branches: [dev]' not in oldwf,'Build 368 workflow was not retired to manual-only')
q('Build 369 — Grey Hair Source Review & Story-Plan Completion Continuity VIII' in road and 'Build 370 — Search Console Real Export & Fresh Discovery Intake X' in road,'Build 369/370 roadmap continuity missing')
q(int(p.get('build') or 0)>=369,'Current pointer must retain Build 369 or successor')
if int(p.get('build') or 0)==369:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==370,'Build 369 current authority/successor mismatch')
print('RELEASE 467 BUILD 369 GREY HAIR SOURCE REVIEW & STORY-PLAN COMPLETION CONTINUITY VIII')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 370 — Search Console Real Export & Fresh Discovery Intake X')
