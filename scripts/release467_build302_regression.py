#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build302-caip-evidence-selection-public-safety-review-adoption.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build302_public_safety_discovery.sql')
wf=t('.github/workflows/release467-build302-caip-evidence-selection-public-safety-review-adoption.yml')
adopt=t('scripts/release467_build302_adopt_evidence_public_safety.sql')
verify=t('scripts/release467_build302_verify_adoption.mjs')
q(a.get('build')==302 and a.get('title')=='CAIP Evidence Selection & Public-Safety Review Adoption','Build 302 identity mismatch')
q(a.get('phase') in ('PUBLIC_SAFETY_DISCOVERY','EVIDENCE_PUBLIC_SAFETY_ADOPTION_CANDIDATE','EVIDENCE_PUBLIC_SAFETY_ADOPTED_COMPLETE'),'Build 302 phase mismatch')
for token in ('creative_project_maker_story_profiles','creative_work_events','creative_project_evidence_selections','creative_assets','caip_media_upload_files','content_publications'):
    q(token in sql,'Build 302 discovery missing '+token)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):
    q(forbidden not in upper,'Build 302 discovery must stay read-only: '+forbidden.strip())
q('D1_ONE_SHOT_EVIDENCE_CAPTURE' in wf and "D1_PROVIDER_ROWS_READ_CEILING: '20000'" in wf,'Build 302 bounded D1 discovery contract missing')
for token in ('PRODUCTION D1 CONTACT: ZERO','R2 MUTATION: ZERO','PUBLIC RIGHTS INFERENCE: ZERO','AUTOMATIC PUBLICATION: ZERO'):
    q(token in wf,'Build 302 safety boundary missing '+token)
for token in ("UPDATE creative_project_evidence_selections","creative_work_event_id IN (1,2,3)","'process_evidence'","'material_evidence'","does not grant public-use rights","creative_assets","caip_media_upload_files"):
    q(token in adopt,'Build 302 adoption contract missing '+token)
for forbidden in ('UPDATE creative_assets','UPDATE caip_media_upload_files','UPDATE creative_work_events','UPDATE creative_project_maker_story_profiles','INSERT INTO content_publications','UPDATE content_project_deliverables','INSERT INTO social_post_queue'):
    q(forbidden.lower() not in adopt.lower(),'Build 302 adoption crossed safety boundary: '+forbidden)
for token in ('BUILD302_EVIDENCE_PUBLIC_SAFETY_ADOPTION=GREEN','selected.length!==3','public_story_candidates','fully_public_allowed_uploads','does not grant public-use rights'):
    q(token in verify,'Build 302 adoption verifier missing '+token)
q('evidence-public-safety-adoption' in wf and 'release467_build302_verify_adoption.mjs' in wf,'Build 302 adoption runtime proof missing')
q(p.get('roadmap')=='docs/operations/RELEASE_467_CAIP_CONTENT_ADOPTION_BUILDS_301_306.md','Build 302 roadmap pointer mismatch')
q(int(p.get('next_build') or 0)==303,'Build 303 successor pointer missing')
print('RELEASE 467 BUILD 302 CAIP EVIDENCE SELECTION & PUBLIC-SAFETY REVIEW ADOPTION')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
