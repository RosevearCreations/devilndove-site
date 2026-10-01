#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build333-grey-hair-source-review-story-plan-completion-continuity-ii.json');prev=j('release467-build332-35th-promo-factual-evidence-completion-continuity-ii.json');p=j('current-development-authority.json')
api=t('functions/api/admin/grey-hair-story-readiness.js');page=t('admin/grey-hair-story-readiness/index.html');ui=t('public/js/admin-grey-hair-story-readiness-v320.js');sql=t('scripts/release467_build333_measurement.sql');verify=t('scripts/release467_build333_verify_measurement.mjs');wf=t('.github/workflows/release467-build333-grey-hair-source-review-story-plan-completion-continuity-ii.yml');road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_331_336.md')
q(a.get('build')==333 and a.get('title')=='Grey Hair Source Review & Story-Plan Completion Continuity II','Build 333 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 332 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='d4fcede4adf76a511d754012042ba91a98693812' and (prev.get('final_closure') or {}).get('tree_sha')=='4ff23c38bbe0acb7ce6ff6f9ad5ef964b329d229','Build 332 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='69fd16b6322e7cbd52c5341ef2b7e871529a65ee','Build 332 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('reuses_build327_authorities') is True and c.get('workspace_read_only') is True,'Build 333 must reuse Build 327 authorities read-only')
q(c.get('approved_source_evidence_min')==2 and c.get('reviewed_story_plans_min')==1 and c.get('source_backed_story_items_min')==2 and c.get('confirmed_capture_tracks_min')==4,'Build 333 handoff threshold mismatch')
q(c.get('next_build')==334 and c.get('next_build_title')=='Search Console Real Export & Fresh Discovery Intake IV','Build 334 successor mismatch')
q(all(v is False for v in s.values()),'Build 333 safety authority drift')
for token in ("creative_work_project_id=6","CP-MSUNAL8R","Grey Hair","readiness_state:state","read_only:true","raw_private_urls:false","automatic_evidence_approval:false","automatic_story_plan_review:false","automatic_maker_story_profile:false","production_d1_contact:false","comparison_baseline"):q(token in api,'Build 333 readiness API missing '+token)
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE'):q(forbidden not in api.upper(),'Build 333 readiness API must remain read-only: '+forbidden)
for token in ('/admin/creative-assets/','/admin/grey-hair-sync-alignment/','/admin/grey-hair-story-edit-planning/','/admin/creative-process/?project_id=6'):q(token in api or token in ui or token in page,'Build 333 handoff route missing '+token)
for token in ('SOURCE_EVIDENCE_REVIEW_REQUIRED','APPROVED_SOURCE_EVIDENCE_INSUFFICIENT','STORY_PLANNING_PREREQUISITE_SYNC_REQUIRED','HUMAN_REVIEWED_STORY_PLAN_REQUIRED','SOURCE_BACKED_STORY_ITEMS_REQUIRED','GREY_HAIR_REVIEWED_EVIDENCE_READY_PENDING_MAKER_STORY_DECISION','Build 333 source review &amp; story-plan continuity II','Build 327 completion &amp; handoff baseline retained','Review CAIP evidence','Open story planning','Private evidence metadata only'):q(token in ui,'Build 333 UI missing '+token)
q('does not approve evidence' in page and 'or publish anything' in page,'Build 333 explicit review/publication boundary missing')
q('/public/js/admin-grey-hair-story-readiness-v320.js?v=467b333' in page and '/public/js/admin-grey-hair-story-readiness-v320.js?v=467b327' in page,'Build 333 current/historical cache identities missing')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 333 measurement must remain read-only: '+forbidden.strip())
for token in ('source_evidence_needs_review','approved_source_evidence','confirmed_capture_groups','confirmed_capture_tracks','reviewed_story_plans','source_backed_story_items','maker_story_profiles','pragma_foreign_key_check'):q(token in sql,'Build 333 measurement missing '+token)
for token in ('SOURCE_EVIDENCE_REVIEW_REQUIRED','APPROVED_SOURCE_EVIDENCE_INSUFFICIENT','STORY_PLANNING_PREREQUISITE_SYNC_REQUIRED','HUMAN_REVIEWED_STORY_PLAN_REQUIRED','SOURCE_BACKED_STORY_ITEMS_REQUIRED','GREY_HAIR_REVIEWED_EVIDENCE_READY_PENDING_MAKER_STORY_DECISION','comparison_to_build331','evidence_approval_mutation:false','story_plan_review_mutation:false','maker_story_profile_mutation:false','private_media_promoted:false','production_d1_contact:false'):q(token in verify,'Build 333 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','EVIDENCE APPROVAL MUTATION: ZERO','SYNC MUTATION: ZERO','STORY PLAN REVIEW MUTATION: ZERO','MAKER STORY PROFILE MUTATION: ZERO','MEDIA RIGHTS INFERENCE: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 333 workflow boundary missing '+token)
q('Build 333 — Grey Hair Source Review & Story-Plan Completion Continuity II' in road and 'Build 334 — Search Console Real Export & Fresh Discovery Intake IV' in road,'Build 333/334 roadmap continuity missing')
q(int(p.get('build') or 0)>=333,'Current pointer must retain Build 333 or successor')
if int(p.get('build') or 0)==333:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==334,'Build 333 current authority/successor mismatch')
print('RELEASE 467 BUILD 333 GREY HAIR SOURCE REVIEW & STORY-PLAN COMPLETION CONTINUITY II')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Build 333 remains review-first; source workspaces retain all mutation authority')
