#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build303-content-studio-draft-review-approval-adoption.json');prev=j('release467-build302-caip-evidence-selection-public-safety-review-adoption.json');p=j('current-development-authority.json')
sql=t('scripts/release467_build303_draft_review_discovery.sql');wf=t('.github/workflows/release467-build303-content-studio-draft-review-approval-adoption.yml')
helper=t('functions/api/_lib/contentAutomationStudio.js');api=t('functions/api/admin/content-studio.js')
q(a.get('build')==303 and a.get('title')=='Content Studio Draft Review & Approval Adoption','Build 303 identity mismatch')
q(a.get('phase') in ('DRAFT_REVIEW_DISCOVERY','DRAFT_APPROVAL_ADOPTION_CANDIDATE','DRAFT_APPROVAL_ADOPTED_COMPLETE'),'Build 303 phase mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 302 successor-ingested authority must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='a6827f4ee093fcf0799ddb99c7a7957469bf3a2c' and (prev.get('final_closure') or {}).get('tree_sha')=='2665c72c6947c3d9dbea2f1d89e69dab70c791fd','Build 302 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='fffbafc4e9f27e830494140b48d9a3d266abd81e' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='2665c72c6947c3d9dbea2f1d89e69dab70c791fd','Build 302 exact Production checkpoint missing')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 303 discovery must stay read-only: '+forbidden.strip())
for token in ('content_project_deliverables','copy_locked','generated_by','approval_status','creative_project_evidence_selections','content_publications','social_post_queue'):q(token in sql,'Build 303 discovery missing '+token)
q("refresh_copy: Number(body.refresh_copy) === 1" in api,'Content Studio creative-project refresh must remain explicit')
q("if (current && (!refreshCopy || numeric(current.copy_locked) === 1)) continue;" in helper,'Locked copy must survive explicit refresh')
q('approved_by_user_id' in helper and 'approved_at' in helper,'Human approval recording contract missing')
q("mode: 'review_first_no_auto_publish'" in api,'Content Studio must remain review-first/no-auto-publish')
q('BUILD303_DRAFT_REVIEW_DISCOVERY=GREEN' in t('scripts/release467_build303_verify_discovery.mjs'),'Build 303 discovery verifier missing')
adopt=t('scripts/release467_build303_adopt_review_outcomes.sql');verify=t('scripts/release467_build303_verify_adoption.mjs')
for token in ("deliverable_key IN ('seo-assets','blog-article')","approval_status='approved'","approval_status='changes_requested'","copy_locked=1","No finished-result event or reviewed project media is recorded yet"):q(token in adopt,'Build 303 adoption contract missing '+token)
for forbidden in ('INSERT INTO content_projects','INSERT INTO content_publications','INSERT INTO social_post_queue','UPDATE creative_assets','UPDATE caip_media_upload_files'):q(forbidden.lower() not in adopt.lower(),'Build 303 adoption crossed boundary: '+forbidden)
for token in ('BUILD303_DRAFT_APPROVAL_ADOPTION=GREEN',"['blog-article','seo-assets']", 'changes.length!==17'):q(token in verify,'Build 303 adoption verifier missing '+token)
for token in ('PRODUCTION D1 CONTACT: ZERO','AUTOMATIC REFRESH: ZERO','AUTOMATIC APPROVAL: ZERO','AUTOMATIC PUBLICATION: ZERO'):q(token in wf,'Build 303 workflow safety boundary missing '+token)
q(p.get('roadmap')=='docs/operations/RELEASE_467_CAIP_CONTENT_ADOPTION_BUILDS_301_306.md','Build 303 roadmap pointer mismatch')
if int(p.get('build') or 0)==303:q(int(p.get('next_build') or 0)==304 and p.get('next_build_title')=='Workshop Journal & Social Review-First Publication Acceptance','Build 304 successor pointer missing')
else:q(int(p.get('build') or 0)>=304,'Build 303 successor must retain Build 304 or newer current authority')
print('RELEASE 467 BUILD 303 CONTENT STUDIO DRAFT REVIEW & APPROVAL ADOPTION')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
