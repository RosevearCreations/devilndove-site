#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build327-grey-hair-evidence-review-completion-story-plan-handoff.json');prev=j('release467-build326-35th-promo-real-outcome-evidence-closure.json');p=j('current-development-authority.json')
api=t('functions/api/admin/grey-hair-story-readiness.js');page=t('admin/grey-hair-story-readiness/index.html');ui=t('public/js/admin-grey-hair-story-readiness-v320.js');sql=t('scripts/release467_build327_measurement.sql');verify=t('scripts/release467_build327_verify_measurement.mjs');wf=t('.github/workflows/release467-build327-grey-hair-evidence-review-completion-story-plan-handoff.yml');road=t('docs/operations/RELEASE_467_EVIDENCE_ACTION_ADOPTION_BUILDS_325_330.md')
q(a.get('build')==327 and a.get('title')=='Grey Hair Evidence Review Completion & Story-Plan Handoff','Build 327 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 326 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='2bc3b4f93ae4111773db71249dc394de8db0a08d' and (prev.get('final_closure') or {}).get('tree_sha')=='409c9dca0d1e0205ec496b3100e891132c71db8e','Build 326 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='6729aaa40106553b37995892b43ff982d145c3db' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='409c9dca0d1e0205ec496b3100e891132c71db8e','Build 326 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('reuses_build320_authorities') is True and c.get('workspace_read_only') is True,'Build 327 must reuse Build 320 review authorities read-only')
q(c.get('approved_source_evidence_min')==2 and c.get('reviewed_story_plans_min')==1 and c.get('source_backed_story_items_min')==2 and c.get('confirmed_capture_tracks_min')==4,'Build 327 handoff threshold mismatch')
q(c.get('next_build')==328 and c.get('next_build_title')=='Search Console Real Export Freshness & Discovery Intake III','Build 328 successor mismatch')
q(all(v is False for v in s.values()),'Build 327 safety authority drift')
for token in ("creative_work_project_id=6","CP-MSUNAL8R","Grey Hair","readiness_state:state","read_only:true","raw_private_urls:false","automatic_evidence_approval:false","automatic_story_plan_review:false","automatic_maker_story_profile:false","production_d1_contact:false"):q(token in api,'Build 327 readiness API missing '+token)
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE'):q(forbidden not in api.upper(),'Build 327 readiness API must remain read-only: '+forbidden)
for token in ('/admin/creative-assets/','/admin/grey-hair-sync-alignment/','/admin/grey-hair-story-edit-planning/','/admin/creative-process/?project_id=6'):q(token in api or token in ui or token in page,'Build 327 handoff route missing '+token)
for token in ('SOURCE_EVIDENCE_REVIEW_REQUIRED','APPROVED_SOURCE_EVIDENCE_INSUFFICIENT','STORY_PLANNING_PREREQUISITE_SYNC_REQUIRED','HUMAN_REVIEWED_STORY_PLAN_REQUIRED','SOURCE_BACKED_STORY_ITEMS_REQUIRED','GREY_HAIR_REVIEWED_EVIDENCE_READY_PENDING_MAKER_STORY_DECISION','Build 327 completion &amp; handoff','Review CAIP evidence','Open story planning','Private evidence metadata only'):q(token in ui,'Build 327 UI missing '+token)
q('does not approve evidence' in page and 'or publish anything' in page,'Build 327 explicit review/publication boundary missing')
q('/public/js/admin-grey-hair-story-readiness-v320.js?v=467b327' in page,'Build 327 cache identity missing')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 327 measurement must remain read-only: '+forbidden.strip())
for token in ('source_evidence_needs_review','approved_source_evidence','confirmed_capture_groups','confirmed_capture_tracks','reviewed_story_plans','source_backed_story_items','maker_story_profiles','pragma_foreign_key_check'):q(token in sql,'Build 327 measurement missing '+token)
for token in ('SOURCE_EVIDENCE_REVIEW_REQUIRED','APPROVED_SOURCE_EVIDENCE_INSUFFICIENT','STORY_PLANNING_PREREQUISITE_SYNC_REQUIRED','HUMAN_REVIEWED_STORY_PLAN_REQUIRED','SOURCE_BACKED_STORY_ITEMS_REQUIRED','GREY_HAIR_REVIEWED_EVIDENCE_READY_PENDING_MAKER_STORY_DECISION','evidence_approval_mutation:false','story_plan_review_mutation:false','maker_story_profile_mutation:false','private_media_promoted:false','production_d1_contact:false'):q(token in verify,'Build 327 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','EVIDENCE APPROVAL MUTATION: ZERO','SYNC MUTATION: ZERO','STORY PLAN REVIEW MUTATION: ZERO','MAKER STORY PROFILE MUTATION: ZERO','MEDIA RIGHTS INFERENCE: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 327 workflow boundary missing '+token)
q('Build 327 — Grey Hair Evidence Review Completion & Story-Plan Handoff' in road and 'Build 328 — Search Console Real Export Freshness & Discovery Intake III' in road,'Build 327/328 roadmap continuity missing')
q(int(p.get('build') or 0)>=327,'Current pointer must retain Build 327 or successor')
if int(p.get('build') or 0)==327:q(int(p.get('next_build') or 0)==328,'Build 328 successor pointer missing')
print('RELEASE 467 BUILD 327 GREY HAIR EVIDENCE REVIEW COMPLETION & STORY-PLAN HANDOFF')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Build 327 remains review-first and hands off through existing authorities only');print('Next: Build 328 — Search Console Real Export Freshness & Discovery Intake III')
