#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build300-caip-maker-content-outcomes-renewal-automation-refinement.json')
sql=t('scripts/release467_build300_outcomes_measurement.sql')
workflow=t('.github/workflows/release467-build300-caip-maker-content-outcomes-renewal-automation-refinement.yml')
api=t('functions/api/admin/creative-process-compat.js')
ui=t('public/js/admin-creative-process.js')
page=t('admin/creative-process/index.html')
q(a.get('build')==300 and a.get('title')=='CAIP Maker Content Outcomes Renewal & Automation Refinement','Build 300 identity mismatch')
q(a.get('phase')=='REFINED_FROM_MEASURED_EVIDENCE','Build 300 must be finalized from measured evidence')
decision=a.get('decision') or {}
q(decision.get('automation_refinement')=='ADOPTION_GUIDANCE_ONLY_NO_NEW_AUTOMATION','Build 300 measured automation decision mismatch')
q(decision.get('automatic_story_creation') is False and decision.get('automatic_content_refresh') is False and decision.get('automatic_publication') is False,'Build 300 automatic-action boundary mismatch')
out=a.get('outcome_evidence') or {}
q((out.get('maker_story') or {}).get('profiles')==0,'Build 300 Maker Story adoption baseline mismatch')
q((out.get('bridge') or {}).get('active_creative_projects')==5 and (out.get('bridge') or {}).get('linked_caip_workspaces')==5 and (out.get('bridge') or {}).get('linked_content_packages')==5,'Build 300 bridge baseline mismatch')
q((out.get('identity') or {}).get('duplicate_caip_source_identities')==0 and (out.get('identity') or {}).get('duplicate_content_source_identities')==0,'Build 300 duplicate identity baseline mismatch')
q((out.get('deliverables') or {}).get('total')==95 and (out.get('deliverables') or {}).get('approved')==0,'Build 300 deliverable baseline mismatch')
for token in ('creative_project_maker_story_profiles','creative_projects','content_projects','creative_assets','creative_project_evidence_selections','content_project_deliverables','content_publications','social_post_queue','site_page_views','runtime_incidents','search_console_page_queries','pragma_foreign_key_check'):
    q(token in sql,'Build 300 outcome measurement missing '+token)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):
    q(forbidden not in upper,'Build 300 outcome measurement must remain read-only: '+forbidden.strip())
q(sql.upper().count('SELECT')>=12,'Build 300 measurement must cover the full outcome set')
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE',"D1_PROVIDER_ROWS_READ_CEILING: '20000'","PRODUCTION D1 CONTACT: ZERO","AUTOMATIC PUBLICATION: ZERO"):
    q(token in workflow,'Build 300 bounded workflow contract missing '+token)
q(('paths:' in workflow) or ('on:\n  workflow_dispatch:' in workflow),'Build 300 workflow must remain either bounded path-scoped while current or manual-only after successor ingestion')
for token in ('makerStoryAdoptionReadiness','START_FIRST_REAL_MAKER_STORY','ADOPTION_GUIDANCE_ONLY_NO_NEW_AUTOMATION','automatic_content_refresh:false','automatic_publication:false','maker_story_adoption_readiness'):
    q(token in api,'Build 300 Creative Process readiness missing '+token)
for token in ('data-build300-maker-story-readiness','Build 300 • adoption guidance','never creates, refreshes, approves or publishes content automatically'):
    q(token in ui,'Build 300 operator guidance missing '+token)
q('/public/js/admin-creative-process.js?v=467b294-300' in page,'Build 300 Creative Process cache identity missing')
q((R/'docs/operations/RELEASE_467_CAIP_CONTENT_ADOPTION_BUILDS_301_306.md').exists(),'Build 300 successor roadmap missing')
print('RELEASE 467 BUILD 300 CAIP MAKER CONTENT OUTCOMES RENEWAL & AUTOMATION REFINEMENT')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Measured decision: ADOPTION GUIDANCE ONLY / NO NEW AUTOMATION')
print('Next: Build 301 — First Real Maker Story Adoption & Completeness')
