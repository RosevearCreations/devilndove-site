#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build309-second-story-content-studio-review-approval.json');prev=j('release467-build308-second-real-maker-story-adoption-evidence-selection.json');p=j('current-development-authority.json')
adopt=t('scripts/release467_build309_adopt_review_outcomes.sql');verify=t('scripts/release467_build309_verify_adoption.mjs');wf=t('.github/workflows/release467-build309-second-story-content-studio-review-approval.yml')
q(a.get('build')==309 and a.get('title')=='Second Story Content Studio Review & Approval','Build 309 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 308 final closure not ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='60b6a631a615c1653ecfb07b4cbf8bc117a496f8' and (prev.get('final_closure') or {}).get('tree_sha')=='d78e7d76fb06395ee182271044314808454f6110','Build 308 Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='498ddd776ea3c52b243a5ef8800fc33570d159a4','Build 308 Production checkpoint missing')
d=a.get('discovery_checkpoint') or {};q(d.get('content_project_id')==23 and d.get('deliverable_count')==19 and d.get('aggregate_rows_read')==57,'Build 309 discovery checkpoint mismatch')
c=a.get('contract') or {};q(c.get('approved_copy_keys')==['seo-assets','blog-article'] and c.get('approved_copy_count')==2 and c.get('changes_requested_count')==17 and c.get('copy_locked_count')==2,'Build 309 review contract mismatch')
for token in ("content_project_id=23","story_review_status='needs_review'","deliverable_key IN ('seo-assets','blog-article')","approval_status='approved'","approval_status='changes_requested'","copy_locked=1","No execution, finished result, lesson, reviewed media, or public release has been recorded","handoff_status='ready_for_review'"):q(token in adopt,'Build 309 adoption contract missing '+token)
for forbidden in ('INSERT INTO content_projects','INSERT INTO content_publications','INSERT INTO social_post_queue','UPDATE creative_assets','UPDATE caip_media_upload_files','UPDATE creative_project_maker_story_profiles'):
    q(forbidden.lower() not in adopt.lower(),'Build 309 crossed review/publication/media boundary: '+forbidden)
for token in ('BUILD309_SECOND_STORY_CONTENT_REVIEW_APPROVAL=GREEN','approved_count:2','changes_requested_count:17','maker_story_state'):q(token in verify,'Build 309 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','COPY REFRESH: ZERO','PUBLICATION MUTATION: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 309 workflow boundary missing '+token)
q(int(p.get('build') or 0)>=309,'Current pointer must retain Build 309 or successor')
print('RELEASE 467 BUILD 309 SECOND STORY CONTENT STUDIO REVIEW & APPROVAL')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Approved copy: seo-assets + blog-article; 17 unsupported/media-dependent drafts changes_requested')
print('Next: Build 310 — Review-First Publication & Distribution Continuity')
