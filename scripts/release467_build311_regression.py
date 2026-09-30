#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build311-buyer-discovery-evidence-freshness-search-intake.json')
prev=j('release467-build310-review-first-publication-distribution-continuity.json')
p=j('current-development-authority.json')
api=t('functions/api/admin/buyer-discovery-measurement.js')
intake=t('functions/api/admin/search-console-import.js')
ui=t('public/js/admin-buyer-discovery-measurement.js')
page=t('admin/local-seo-review/index.html')
sql=t('scripts/release467_build311_discovery.sql')
wf=t('.github/workflows/release467-build311-buyer-discovery-evidence-freshness-search-intake.yml')
road=t('docs/operations/RELEASE_467_CONTENT_ADOPTION_COVERAGE_DISCOVERY_BUILDS_307_312.md')

q(a.get('build')==311 and a.get('title')=='Buyer Discovery Evidence Freshness & Search Intake','Build 311 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 310 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='c1a4778dd3aaf2a1fece8406e075da7eb2c2b74d','Build 310 final Development SHA mismatch')
q((prev.get('final_closure') or {}).get('tree_sha')=='b4aa3deaa0eed32bc601ecf51d5456e5c5d85760','Build 310 final tree mismatch')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='43120a39d39aa0b0a2b0299967ad2e7b97eab0ee','Build 310 Production main mismatch')
q((prev.get('production_checkpoint') or {}).get('production_pages_deploy_run')==36709193312 and (prev.get('production_checkpoint') or {}).get('production_live_resource_integrity_run')==36709277731,'Build 310 Production proof mismatch')

scope=a.get('scope') or {};contract=a.get('contract') or {}
q(scope.get('request_time_schema_repair_removed') is True and scope.get('zero_evidence_preserved_as_zero') is True,'Build 311 freshness/import scope mismatch')
q(contract.get('measurement_window_days')==30 and contract.get('missing_schema_fails_closed') is True,'Build 311 30-day/fail-closed contract mismatch')
q(contract.get('indexnow_execution') is False and contract.get('provider_execution') is False,'Build 311 provider boundary mismatch')

for token in ("build:311","window_days:30","search_intake","schema_readiness","latest_report_age_days","other_public_rows","traffic_fabrication:false","indexnow_submission:false"):
    q(token in api,'Build 311 buyer measurement API missing '+token)
q('export async function onRequestGet' in api and 'onRequestPost' not in api,'Build 311 buyer measurement API must remain GET-only')
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM','fetch('):
    q(forbidden not in api,'Build 311 buyer measurement API mutation/provider token present: '+forbidden)

for token in ('SEARCH_CONSOLE_REQUIRED_TABLES','searchConsoleSchemaReadiness','sqlite_master','canonical_migration_only','Search Console intake schema is not ready','request_time_schema_mutation:false'):
    q(token in intake,'Build 311 Search Console intake guard missing '+token)
for forbidden in ('CREATE TABLE IF NOT EXISTS','ALTER TABLE seo_opportunity_actions','CREATE INDEX IF NOT EXISTS'):
    q(forbidden not in intake,'Build 311 request-time schema mutation remains: '+forbidden)

for token in ('Build 311 • evidence freshness','Search intake:','Request-time schema repair is OFF','Attribution:','30 days'):
    q(token in ui,'Build 311 UI missing '+token)
q('admin-buyer-discovery-measurement.js?v=467b311' in page,'Build 311 buyer panel cache version missing')

upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):
    q(forbidden not in upper,'Build 311 measurement SQL must remain read-only: '+forbidden.strip())
for token in ('latest_report_age_days','latest_import_age_days','reviewed_story_rows','reviewed_product_rows','search_console_import_batches_ready','foreign_key_violations'):
    q(token in sql,'Build 311 measurement SQL missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','INDEXNOW EXECUTION: ZERO','AUTOMATIC SEARCH CONSOLE IMPORT: ZERO','REQUEST-TIME SCHEMA MUTATION: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):
    q(token in wf,'Build 311 workflow boundary missing '+token)
q('Build 311 — Buyer Discovery Evidence Freshness & Search Intake' in road and 'Build 312 — Content Adoption Coverage Outcomes Renewal II & Roadmap Renewal' in road,'Build 311/312 roadmap scope missing')

cur=int(p.get('build') or 0);q(cur>=311,'Current pointer must retain Build 311 or successor')
if cur==311:q(int(p.get('next_build') or 0)==312 and p.get('next_build_title')=='Content Adoption Coverage Outcomes Renewal II & Roadmap Renewal','Build 312 successor pointer missing')

print('RELEASE 467 BUILD 311 BUYER DISCOVERY EVIDENCE FRESHNESS & SEARCH INTAKE')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Search Console request-time schema repair: REMOVED')
print('Zero discovery evidence: PRESERVED AS ZERO')
print('Next: Build 312 — Content Adoption Coverage Outcomes Renewal II & Roadmap Renewal')
