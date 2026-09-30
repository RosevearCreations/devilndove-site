#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build320-grey-hair-source-evidence-review-story-plan-readiness.json')
prev=j('release467-build319-35th-promo-execution-evidence-intake-completeness.json')
p=j('current-development-authority.json')
api=t('functions/api/admin/grey-hair-story-readiness.js');page=t('admin/grey-hair-story-readiness/index.html');ui=t('public/js/admin-grey-hair-story-readiness-v320.js')
sql=t('scripts/release467_build320_measurement.sql');verify=t('scripts/release467_build320_verify_measurement.mjs')
wf=t('.github/workflows/release467-build320-grey-hair-source-evidence-review-story-plan-readiness.yml')
road=t('docs/operations/RELEASE_467_EVIDENCE_COMPLETION_DISCOVERY_ADOPTION_BUILDS_319_324.md')
q(a.get('build')==320 and a.get('title')=='Grey Hair Source-Evidence Review & Story-Plan Readiness','Build 320 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 319 Production closure not ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='a068ec13ec14aedf6d62dfa5e5324fd6bf876680' and (prev.get('final_closure') or {}).get('tree_sha')=='5c49464a39ef189845bc5406716fbd055f535370','Build 319 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='c753fe35a36096fa539f304a6b2fbd5f1d159a43','Build 319 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('workspace_read_only') is True and c.get('automatic_maker_story_profile') is False,'Build 320 review-first policy mismatch')
q(c.get('approved_source_evidence_min')==2 and c.get('reviewed_story_plans_min')==1 and c.get('source_backed_story_items_min')==2,'Build 320 readiness threshold mismatch')
q(all(v is False for v in s.values()),'Build 320 safety authority drift')
for token in ("creative_work_project_id=6","CP-MSUNAL8R","Grey Hair","readiness_state:state","read_only:true","raw_private_urls:false","automatic_maker_story_profile:false","production_d1_contact:false"):
    q(token in api,'Build 320 readiness API missing '+token)
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE'):
    q(forbidden not in api.upper(),'Build 320 readiness API must remain read-only: '+forbidden)
q('/admin/creative-assets/' in page or '/admin/creative-assets/' in ui,'Build 320 readiness surface missing CAIP Evidence Review route')
q('/admin/grey-hair-sync-alignment/' in ui,'Build 320 readiness surface missing sync route')
q('/admin/grey-hair-story-edit-planning/' in ui,'Build 320 readiness surface missing story-planning route')
q('does not approve evidence' in page,'Build 320 readiness page missing explicit no-auto-approval language')
q(('does not publish anything' in page) or ('or publish anything' in page),'Build 320 readiness page missing explicit no-publication language')
for token in ('SOURCE_EVIDENCE_REVIEW_REQUIRED','STORY_PLANNING_PREREQUISITE_SYNC_REQUIRED','HUMAN_REVIEWED_STORY_PLAN_REQUIRED','GREY_HAIR_REVIEWED_EVIDENCE_READY_PENDING_MAKER_STORY_DECISION','Review CAIP evidence','Open story planning','Private evidence metadata only'):
    q(token in ui,'Build 320 readiness UI missing '+token)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 320 measurement must remain read-only: '+forbidden.strip())
for token in ('approved_source_evidence','confirmed_capture_groups','reviewed_story_plans','source_backed_story_items','public_allowed_assets','public_allowed_uploads','maker_story_profiles','pragma_foreign_key_check'):q(token in sql,'Build 320 measurement missing '+token)
for token in ('SOURCE_EVIDENCE_REVIEW_REQUIRED','STORY_PLANNING_PREREQUISITE_SYNC_REQUIRED','HUMAN_REVIEWED_STORY_PLAN_REQUIRED','GREY_HAIR_REVIEWED_EVIDENCE_READY_PENDING_MAKER_STORY_DECISION','maker_story_profile_mutation:false','private_media_promoted:false','production_d1_contact:false'):q(token in verify,'Build 320 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','EVIDENCE APPROVAL MUTATION: ZERO','STORY PLAN REVIEW MUTATION: ZERO','MAKER STORY PROFILE MUTATION: ZERO','MEDIA RIGHTS INFERENCE: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 320 workflow boundary missing '+token)
q('Build 321 — Search Console Real Export Intake Continuity II' in road,'Build 321 successor roadmap missing')
q(int(p.get('build') or 0)>=320,'Current pointer must retain Build 320 or successor')
if int(p.get('build') or 0)==320:q(int(p.get('next_build') or 0)==321,'Build 321 successor pointer missing')
print('RELEASE 467 BUILD 320 GREY HAIR SOURCE-EVIDENCE REVIEW & STORY-PLAN READINESS')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Build 320 composes existing review authorities; it does not create the third Maker Story')
print('Next: Build 321 — Search Console Real Export Intake Continuity II')
