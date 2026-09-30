#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build306-caip-content-adoption-outcomes-renewal-roadmap-renewal.json')
prev=j('release467-build305-buyer-discovery-search-measurement-activation.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build306_outcomes_measurement.sql');wf=t('.github/workflows/release467-build306-caip-content-adoption-outcomes-renewal.yml')
road=t('docs/operations/RELEASE_467_CONTENT_ADOPTION_COVERAGE_DISCOVERY_BUILDS_307_312.md')
q(a.get('build')==306 and a.get('title')=='CAIP Content Adoption Outcomes Renewal & Roadmap Renewal','Build 306 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 305 final closure not ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='605ca2409c9aa4f5a1b9882ebcf498e19c4ba806' and (prev.get('final_closure') or {}).get('tree_sha')=='8490cb65bbde1ac3e9698da8af13605f57419a9d','Build 305 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='436eb9fac8ee3d9ee1a25b8fdad9a3820ceaa34e','Build 305 Production checkpoint missing')
m=a.get('measurement_checkpoint') or {};q(m.get('workflow_run')==36659852174 and int(m.get('aggregate_rows_read') or 0)==1067,'Build 306 measured checkpoint mismatch')
o=a.get('outcome_evidence') or {}
q((o.get('maker_story') or {}).get('maker_profiles')==1 and (o.get('maker_story') or {}).get('core_story_complete')==1,'Build 306 Maker Story outcome mismatch')
q((o.get('coverage') or {}).get('active_projects')==5 and (o.get('coverage') or {}).get('projects_with_maker_story_profile')==1,'Build 306 coverage outcome mismatch')
q((o.get('deliverables') or {}).get('approved_deliverables')==2 and (o.get('workshop_journal') or {}).get('published_journal_rows')==1,'Build 306 reviewed publication outcome mismatch')
q((o.get('social') or {}).get('ready_social_rows')==1 and (o.get('social') or {}).get('posted_social_rows')==0,'Build 306 social review-first outcome mismatch')
q((o.get('runtime_search') or {}).get('search_console_rows_30d')==0,'Build 306 Search Console baseline mismatch')
q((o.get('identity') or {}).get('duplicate_caip_source_identities')==0 and (o.get('identity') or {}).get('duplicate_content_source_identities')==0,'Build 306 identity boundary drift')
for token in ('creative_project_maker_story_profiles','creative_project_evidence_selections','content_project_deliverables','content_publications','social_post_queue','site_page_views','search_console_page_queries','pragma_foreign_key_check'):
    q(token in sql,'Build 306 measurement missing '+token)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 306 measurement must remain read-only: '+forbidden.strip())
for token in ('D1_PROVIDER_ROWS_READ_CEILING','PRODUCTION D1 CONTACT: ZERO','INDEXNOW SUBMISSION: ZERO','PROVIDER EXECUTION: ZERO'):q(token in wf,'Build 306 workflow boundary missing '+token)
for title in ('Build 307 — Maker Story Review-State & Publication Traceability','Build 308 — Second Real Maker Story Adoption & Evidence Selection','Build 309 — Second Story Content Studio Review & Approval','Build 310 — Review-First Publication & Distribution Continuity','Build 311 — Buyer Discovery Evidence Freshness & Search Intake','Build 312 — Content Adoption Coverage Outcomes Renewal II & Roadmap Renewal'):q(title in road,'Build 306 successor roadmap missing '+title)
q(int(p.get('build') or 0)>=306,'Current pointer must retain Build 306 or successor')
if int(p.get('build') or 0)==306:q(int(p.get('next_build') or 0)==307 and p.get('roadmap')=='docs/operations/RELEASE_467_CONTENT_ADOPTION_COVERAGE_DISCOVERY_BUILDS_307_312.md','Build 307 successor pointer mismatch')
print('RELEASE 467 BUILD 306 CAIP CONTENT ADOPTION OUTCOMES RENEWAL & ROADMAP RENEWAL')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Measured classification: REAL ADOPTION PROVEN / COVERAGE + DISCOVERY GAPS REMAIN')
print('Next: Build 307 — Maker Story Review-State & Publication Traceability')
