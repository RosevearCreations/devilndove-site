#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build308-second-real-maker-story-adoption-evidence-selection.json');prev=j('release467-build307-maker-story-review-state-publication-traceability.json');p=j('current-development-authority.json')
discover=t('scripts/release467_build308_candidate_discovery.sql');adopt=t('scripts/release467_build308_adopt_second_real_maker_story.sql');verify=t('scripts/release467_build308_verify_adoption.mjs');wf=t('.github/workflows/release467-build308-second-real-maker-story-adoption-evidence-selection.yml')
q(a.get('build')==308 and a.get('title')=='Second Real Maker Story Adoption & Evidence Selection','Build 308 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 307 final closure not ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='3ff916d9f1e7cc6aa9c29d9c998ace3731caf120' and (prev.get('final_closure') or {}).get('tree_sha')=='70c9408afd2df7a3359b83937eda15161f49b4e2','Build 307 Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='f8b3f7281ccd6e4bfc739abe1ba2566db336281a','Build 307 Production checkpoint missing')
d=a.get('discovery_checkpoint') or {};s=d.get('selected_candidate') or {}
q(s.get('creative_work_project_id')==5 and s.get('project_key')=='CP-MSC1SUG2' and s.get('metadata_readiness_score')==10,'Build 308 evidence-based candidate selection mismatch')
base=a.get('adoption_baseline') or {};story=base.get('maker_story') or {};safe=base.get('safety') or {};integ=base.get('global_integrity') or {}
q(story.get('story_review_status')=='needs_review' and story.get('public_story_candidate')==0 and story.get('outcome_status')=='unknown','Build 308 review-first Maker Story state mismatch')
q(integ.get('maker_story_profiles')==2 and integ.get('selected_evidence_rows')==4 and integ.get('duplicate_caip_source_identities')==0 and integ.get('duplicate_content_source_identities')==0,'Build 308 adoption/identity baseline mismatch')
q(all(int(safe.get(k,0))==0 for k in ('public_event_candidates','public_story_candidates','selected_media_evidence','caip_assets','private_upload_files','publications','social_rows')),'Build 308 safety baseline mismatch')
for token in ('creative_work_project_id<>7','grey_hair_private_caip_readiness','metadata_ranked_candidates'): q(token in (discover+t('scripts/release467_build308_verify_discovery.mjs')),'Build 308 discovery contract missing '+token)
for token in ("creative_work_project_id=5","35th promo - existing project brief","story_review_status='needs_review'","public_story_candidate=0","selection does not grant public-use or media rights","maker_story_media_rights_scope"): q(token in adopt,'Build 308 adoption contract missing '+token)
for forbidden in ('UPDATE creative_assets','UPDATE caip_media_upload_files','INSERT INTO content_publications','UPDATE content_publications','INSERT INTO social_post_queue','UPDATE social_post_queue','UPDATE content_project_deliverables'):
    q(forbidden.lower() not in adopt.lower(),'Build 308 crossed media/publication/content-review boundary: '+forbidden)
for token in ('BUILD308_SECOND_REAL_MAKER_STORY_ADOPTION=GREEN','maker_story_profiles','selected_evidence_rows','public_story_candidates'):q(token in verify,'Build 308 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','MEDIA RIGHTS INFERENCE: ZERO','PUBLICATION MUTATION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 308 workflow boundary missing '+token)
q(int(p.get('build') or 0)>=308,'Current pointer must retain Build 308 or successor')
print('RELEASE 467 BUILD 308 SECOND REAL MAKER STORY ADOPTION & EVIDENCE SELECTION')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Second project: 35th promo / internal project-fact evidence / needs review')
print('Next: Build 309 — Second Story Content Studio Review & Approval')
