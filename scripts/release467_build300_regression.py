#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build300-caip-maker-content-outcomes-renewal-automation-refinement.json')
sql=t('scripts/release467_build300_outcomes_measurement.sql')
workflow=t('.github/workflows/release467-build300-caip-maker-content-outcomes-renewal-automation-refinement.yml')
q(a.get('build')==300 and a.get('title')=='CAIP Maker Content Outcomes Renewal & Automation Refinement','Build 300 identity mismatch')
q(a.get('phase') in ('MEASURE_REAL_OPERATOR_OUTCOMES_BEFORE_REFINEMENT','REFINED_FROM_MEASURED_EVIDENCE'),'Build 300 phase mismatch')
for token in ('creative_project_maker_story_profiles','creative_projects','content_projects','creative_assets','creative_project_evidence_selections','content_project_deliverables','content_publications','social_post_queue','site_page_views','runtime_incidents','search_console_page_queries','pragma_foreign_key_check'):
    q(token in sql,'Build 300 outcome measurement missing '+token)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):
    q(forbidden not in upper,'Build 300 outcome measurement must remain read-only: '+forbidden.strip())
q(sql.upper().count('SELECT')>=12,'Build 300 measurement must cover the full outcome set')
q('PRODUCTION D1 CONTACT: ZERO' in workflow,'Build 300 workflow missing Production D1 boundary')
q('AUTOMATIC PUBLICATION: ZERO' in workflow,'Build 300 workflow missing automatic-publication boundary')
q('outcomes-measurement' in workflow,'Build 300 workflow missing outcome measurement job')
print('RELEASE 467 BUILD 300 CAIP MAKER CONTENT OUTCOMES RENEWAL & AUTOMATION REFINEMENT')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Measurement: READ-ONLY DEVELOPMENT EVIDENCE')
print('Automation refinement: EVIDENCE-GATED / REVIEW-FIRST')
