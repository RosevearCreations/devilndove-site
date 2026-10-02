#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build351-grey-hair-source-review-story-plan-completion-continuity-v.json');prev=j('release467-build350-35th-promo-factual-evidence-completion-continuity-v.json');p=j('current-development-authority.json')
api=t('functions/api/admin/grey-hair-story-readiness.js');page=t('admin/grey-hair-story-readiness/index.html');ui=t('public/js/admin-grey-hair-story-readiness-v320.js')
sql=t('scripts/release467_build351_measurement.sql');verify=t('scripts/release467_build351_verify_measurement.mjs');wf=t('.github/workflows/release467-build351-grey-hair-source-review-story-plan-completion-continuity-v.yml');road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_349_354.md')
itpage=t('admin/it-integrations/index.html');registry=t('public/js/admin-it-integrations.js');readiness=t('public/js/admin-it-provider-readiness.js');setup=t('public/js/admin-it-provider-setup-guide.js');etsy=t('public/js/admin-etsy-oauth-acceptance.js')
q(a.get('build')==351 and a.get('title')=='Grey Hair Source Review & Story-Plan Completion Continuity V','Build 351 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 350 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='218bb33b7c8ef209e4cca5935bbdc0fab78ff62f' and (prev.get('final_closure') or {}).get('tree_sha')=='40d411814199c34847a5eb35a9beb9b097a04876','Build 350 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='96ecfb1cdfdff1e632da3289b3c5219ebe1fd1e3' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='40d411814199c34847a5eb35a9beb9b097a04876','Build 350 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {};auth=a.get('it_integrations_auth_recovery') or {}
q(c.get('reuses_build327_authorities') is True and c.get('reuses_build345_measurement_model') is True and c.get('workspace_read_only') is True,'Build 351 retained authority mismatch')
q(c.get('approved_source_evidence_min')==2 and c.get('reviewed_story_plans_min')==1 and c.get('source_backed_story_items_min')==2 and c.get('confirmed_capture_tracks_min')==4,'Build 351 thresholds mismatch')
q(c.get('next_build')==352 and c.get('next_build_title')=='Search Console Real Export & Fresh Discovery Intake VII','Build 352 successor mismatch')
q(all(v is False for v in s.values()),'Build 351 safety authority drift')
q(auth.get('security_response')=='Preserve server-side admin authorization. Do not bypass or weaken authentication.','Build 351 auth recovery must preserve authorization')
for token in ('SOURCE_EVIDENCE_REVIEW_REQUIRED','APPROVED_SOURCE_EVIDENCE_INSUFFICIENT','STORY_PLANNING_PREREQUISITE_SYNC_REQUIRED','HUMAN_REVIEWED_STORY_PLAN_REQUIRED','SOURCE_BACKED_STORY_ITEMS_REQUIRED','GREY_HAIR_REVIEWED_EVIDENCE_READY_PENDING_MAKER_STORY_DECISION','Build 351 source review &amp; story-plan continuity V','Review CAIP evidence','Open story planning'):q(token in ui,'Build 351 UI missing '+token)
q('/public/js/admin-grey-hair-story-readiness-v320.js?v=467b351' in page and '/public/js/admin-grey-hair-story-readiness-v320.js?v=467b345' in page,'Build 351 current/historical cache identities missing')
q('const RELEASE=467,BUILD=351' in api and "TITLE='Grey Hair Source Review & Story-Plan Completion Continuity V'" in api,'Build 351 API identity missing')
q('comparison_baseline:{source_build:349' in api,'Build 351 API comparison baseline mismatch')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 351 measurement must remain read-only: '+forbidden.strip())
for token in ('source_evidence_needs_review','approved_source_evidence','confirmed_capture_groups','confirmed_capture_tracks','reviewed_story_plans','source_backed_story_items','maker_story_profiles','pragma_foreign_key_check'):q(token in sql,'Build 351 measurement missing '+token)
for token in ('comparison_to_build349','evidence_approval_mutation:false','story_plan_review_mutation:false','maker_story_profile_mutation:false','production_d1_contact:false'):q(token in verify,'Build 351 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','EVIDENCE APPROVAL MUTATION: ZERO','SYNC MUTATION: ZERO','STORY PLAN REVIEW MUTATION: ZERO','MAKER STORY PROFILE MUTATION: ZERO','AUTH BYPASS: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 351 workflow boundary missing '+token)
q('Build 351 — Grey Hair Source Review & Story-Plan Completion Continuity V' in road and 'Build 352 — Search Console Real Export & Fresh Discovery Intake VII' in road,'Build 351/352 roadmap continuity missing')
q('id="adminAccessMessage"' in itpage and 'BUILD351_AUTH_GATING' in itpage,'I.T. integrations page missing protected auth state surface')
for body,label in ((registry,'registry'),(readiness,'readiness'),(setup,'setup guide'),(etsy,'Etsy')):q('DDWhenAdminReady' in body and 'dd:admin-access-denied' in body,f'{label} must wait for shared admin access')
q('loginRedirect' in etsy and 'provider=etsy' in etsy,'Etsy connection must preserve login return and OAuth start')
q(int(p.get('build') or 0)>=351,'Current pointer must retain Build 351 or successor')
if int(p.get('build') or 0)==351:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==352,'Build 351 current authority/successor mismatch')
print('RELEASE 467 BUILD 351 GREY HAIR SOURCE REVIEW & STORY-PLAN COMPLETION CONTINUITY V')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('I.T. auth recovery preserves authentication; protected startup waits for verified admin access')
