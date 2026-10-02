#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build339-grey-hair-source-review-story-plan-completion-continuity-iii.json');prev=j('release467-build338-35th-promo-factual-evidence-completion-continuity-iii.json');p=j('current-development-authority.json')
api=t('functions/api/admin/grey-hair-story-readiness.js');page=t('admin/grey-hair-story-readiness/index.html');ui=t('public/js/admin-grey-hair-story-readiness-v320.js')
sql=t('scripts/release467_build339_measurement.sql');verify=t('scripts/release467_build339_verify_measurement.mjs');wf=t('.github/workflows/release467-build339-grey-hair-source-review-story-plan-completion-continuity-iii.yml');road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_337_342.md')
q(a.get('build')==339 and a.get('title')=='Grey Hair Source Review & Story-Plan Completion Continuity III','Build 339 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 338 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='eb674de5006a63404d2a8076bef2024ba47272b3' and (prev.get('final_closure') or {}).get('tree_sha')=='e10e2ca3b275e55d44b585c51b94bb26ca0bf8df','Build 338 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='cfdc10632bd5fe605b7cf60eef7e664e35cd11fb','Build 338 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('reuses_build327_authorities') is True and c.get('reuses_build333_measurement_model') is True and c.get('workspace_read_only') is True,'Build 339 retained authority mismatch')
q(c.get('approved_source_evidence_min')==2 and c.get('reviewed_story_plans_min')==1 and c.get('source_backed_story_items_min')==2 and c.get('confirmed_capture_tracks_min')==4,'Build 339 thresholds mismatch')
q(c.get('next_build')==340 and c.get('next_build_title')=='Search Console Real Export & Fresh Discovery Intake V','Build 340 successor mismatch')
q(all(v is False for v in s.values()),'Build 339 safety authority drift')
for token in ('SOURCE_EVIDENCE_REVIEW_REQUIRED','APPROVED_SOURCE_EVIDENCE_INSUFFICIENT','STORY_PLANNING_PREREQUISITE_SYNC_REQUIRED','HUMAN_REVIEWED_STORY_PLAN_REQUIRED','SOURCE_BACKED_STORY_ITEMS_REQUIRED','GREY_HAIR_REVIEWED_EVIDENCE_READY_PENDING_MAKER_STORY_DECISION','Build 339 source review &amp; story-plan continuity III','Review CAIP evidence','Open story planning'):q(token in ui,'Build 339 UI missing '+token)
q('/public/js/admin-grey-hair-story-readiness-v320.js?v=467b339' in page and '/public/js/admin-grey-hair-story-readiness-v320.js?v=467b333' in page,'Build 339 current/historical cache identities missing')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 339 measurement must remain read-only: '+forbidden.strip())
for token in ('source_evidence_needs_review','approved_source_evidence','confirmed_capture_groups','confirmed_capture_tracks','reviewed_story_plans','source_backed_story_items','maker_story_profiles','pragma_foreign_key_check'):q(token in sql,'Build 339 measurement missing '+token)
for token in ('comparison_to_build333','evidence_approval_mutation:false','story_plan_review_mutation:false','maker_story_profile_mutation:false','production_d1_contact:false'):q(token in verify,'Build 339 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','EVIDENCE APPROVAL MUTATION: ZERO','SYNC MUTATION: ZERO','STORY PLAN REVIEW MUTATION: ZERO','MAKER STORY PROFILE MUTATION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 339 workflow boundary missing '+token)
q('Build 339 — Grey Hair Source Review & Story-Plan Completion Continuity III' in road and 'Build 340 — Search Console Real Export & Fresh Discovery Intake V' in road,'Build 339/340 roadmap continuity missing')
q(int(p.get('build') or 0)>=339,'Current pointer must retain Build 339 or successor')
if int(p.get('build') or 0)==339:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==340,'Build 339 current authority/successor mismatch')
print('RELEASE 467 BUILD 339 GREY HAIR SOURCE REVIEW & STORY-PLAN COMPLETION CONTINUITY III')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Build 339 remains review-first; source workspaces retain mutation authority')
