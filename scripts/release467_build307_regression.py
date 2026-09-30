#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build307-maker-story-review-state-publication-traceability.json');prev=j('release467-build306-caip-content-adoption-outcomes-renewal-roadmap-renewal.json');p=j('current-development-authority.json')
api=t('functions/api/admin/creative-process-compat.js');ui=t('public/js/admin-creative-process.js');page=t('admin/creative-process/index.html');sql=t('scripts/release467_build307_accept_review_publication_traceability.sql');wf=t('.github/workflows/release467-build307-maker-story-review-state-publication-traceability.yml')
q(a.get('build')==307 and a.get('title')=='Maker Story Review-State & Publication Traceability','Build 307 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 306 final closure not ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='a0d04fb1fcbf22a714031c65e256f885b725d1c5' and (prev.get('final_closure') or {}).get('tree_sha')=='0a80465e014d949ba750092b0154d78103d0760a','Build 306 Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='1eb9df6dd6db02ad61fd4a32852e7f37a46c1ecd','Build 306 Production checkpoint missing')
for token in ('review_publication_traceability','public_media_rights_inferred:false',"story_scope:'reviewed_factual_story_text_only'","media_rights_scope:'separate_never_inferred'"):q(token in api,'Build 307 API traceability missing '+token)
for token in ('data-build307-review-publication-traceability','Public-story candidacy applies to reviewed factual story text only','public-allowed CAIP assets','provider-posted'):q(token in ui,'Build 307 UI traceability missing '+token)
q('/public/js/admin-creative-process.js?v=467b307' in page,'Build 307 Creative Process cache identity missing')
for token in ("story_review_status='reviewed'","public_story_candidate=1","maker_story_public_candidate_scope","maker_story_media_rights_scope","public_allowed_caip_assets","posted_social_rows"):q(token in sql,'Build 307 acceptance missing '+token)
for forbidden in ('UPDATE creative_assets','UPDATE caip_media_upload_files','UPDATE creative_work_events','INSERT INTO content_publications','UPDATE content_publications','UPDATE social_post_queue'):q(forbidden.lower() not in sql.lower(),'Build 307 crossed media/publication/provider boundary: '+forbidden)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','MEDIA RIGHTS INFERENCE: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 307 workflow boundary missing '+token)
q(int(p.get('build') or 0)>=307,'Current pointer must retain Build 307 or successor')
print('RELEASE 467 BUILD 307 MAKER STORY REVIEW-STATE & PUBLICATION TRACEABILITY')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
