#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build312-content-adoption-coverage-outcomes-renewal-ii-roadmap-renewal.json')
prev=j('release467-build311-buyer-discovery-evidence-freshness-search-intake.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build312_outcomes_measurement.sql')
wf=t('.github/workflows/release467-build312-content-adoption-coverage-outcomes-renewal-ii.yml')
road=t('docs/operations/RELEASE_467_REVIEWED_STORY_DISCOVERY_ADOPTION_BUILDS_313_318.md')

q(a.get('build')==312 and a.get('title')=='Content Adoption Coverage Outcomes Renewal II & Roadmap Renewal','Build 312 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 311 final closure not ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='9a785176369bc09d16c7a6d3748ac125f260bd91','Build 311 exact Development closure missing')
q((prev.get('final_closure') or {}).get('tree_sha')=='c79e06aec8eeb2d0ec24e54021c359d31de8e469','Build 311 exact tree missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='e6c48ac204393ee53859dc0366e36a13f15a5460','Build 311 Production checkpoint missing')
scope=a.get('scope') or {};q(scope.get('full_path_remeasurement') is True and scope.get('build300_comparison') is True and scope.get('build306_comparison') is True,'Build 312 comparison scope mismatch')
s=a.get('safety') or {};q(s.get('schema_change') is False and s.get('production_d1_contact') is False and s.get('traffic_fabrication') is False and s.get('provider_execution') is False,'Build 312 safety boundary mismatch')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 312 measurement must remain read-only: '+forbidden.strip())
for token in ('creative_project_maker_story_profiles','creative_project_evidence_selections','content_project_deliverables','content_publications','social_post_queue','site_page_views','search_console_page_queries','search_console_import_batches','pragma_foreign_key_check'):
    q(token in sql,'Build 312 measurement missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','PRODUCTION D1 CONTACT: ZERO','INDEXNOW EXECUTION: ZERO','TRAFFIC FABRICATION: ZERO','PROVIDER EXECUTION: ZERO'):
    q(token in wf,'Build 312 workflow boundary missing '+token)
for title in ('Build 313 — Second Maker Story Review Decision & Completeness','Build 314 — Second Story Publication Readiness & Review-Queue Continuity','Build 315 — Search Console Operator Intake Acceptance','Build 316 — Buyer Discovery Evidence Interpretation & SEO Review Queue','Build 317 — Third Project Maker Story Readiness & Evidence Selection','Build 318 — Content Adoption & Discovery Outcomes Renewal III'):
    q(title in road,'Build 312 successor roadmap missing '+title)
q(int(p.get('build') or 0)>=312,'Current pointer must retain Build 312 or successor')
if int(p.get('build') or 0)==312:
    q(int(p.get('next_build') or 0)==313 and p.get('roadmap')=='docs/operations/RELEASE_467_REVIEWED_STORY_DISCOVERY_ADOPTION_BUILDS_313_318.md','Build 313 successor pointer mismatch')
print('RELEASE 467 BUILD 312 CONTENT ADOPTION COVERAGE OUTCOMES RENEWAL II & ROADMAP RENEWAL')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 313 — Second Maker Story Review Decision & Completeness')
