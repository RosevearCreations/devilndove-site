#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build322-buyer-discovery-attribution-seo-review-evidence-continuity.json')
prev=j('release467-build321-search-console-real-export-intake-continuity-ii.json')
p=j('current-development-authority.json')
api=t('functions/api/admin/buyer-discovery-measurement.js')
search_api=t('functions/api/admin/search-console-import.js')
ui=t('public/js/admin-buyer-discovery-measurement.js')
search_ui=t('public/js/admin-search-console-import.js')
sql=t('scripts/release467_build322_continuity.sql')
verify=t('scripts/release467_build322_verify_continuity.mjs')
wf=t('.github/workflows/release467-build322-buyer-discovery-attribution-seo-review-evidence-continuity.yml')
road=t('docs/operations/RELEASE_467_EVIDENCE_COMPLETION_DISCOVERY_ADOPTION_BUILDS_319_324.md')
q(a.get('build')==322 and a.get('title')=='Buyer Discovery Attribution & SEO Review Evidence Continuity','Build 322 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 321 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='215b9277f62d1359fda07d3d72ba3cf6ee47a353' and (prev.get('final_closure') or {}).get('tree_sha')=='7df16d3a91159cefaf66435854fdffb4914ad921','Build 321 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='e761df76426a52e7bc3553189988058037979ad2' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='7df16d3a91159cefaf66435854fdffb4914ad921','Build 321 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('attribution_mode')=='QUERY_LEVEL_ATTRIBUTION_ONLY_FROM_REAL_SEARCH_CONSOLE' and c.get('query_level_attribution_requires_real_search_console') is True,'Build 322 attribution authority mismatch')
q(c.get('public_telemetry_supports_observation_only') is True and c.get('unsupported_or_stale_pending_rows_non_actionable') is True,'Build 322 evidence-actionability policy mismatch')
q(c.get('explicit_human_copy_required_before_apply') is True and c.get('generated_title') is False and c.get('generated_meta_description') is False and c.get('generated_internal_link') is False,'Build 322 human-authored SEO wording policy mismatch')
q(all(v is False for v in s.values()),'Build 322 safety authority drift')
for token in ('build:322','Buyer Discovery Attribution & SEO Review Evidence Continuity','REAL_EVIDENCE_STALE_NON_ACTIONABLE','unsupported_or_stale_pending_rows','query_level_attribution_requires_real_search_console','public_telemetry_observation_only'):
    q(token in api,'Build 322 buyer measurement API missing '+token)
for token in ('Build 322 • attribution continuity','stale or unsupported','real Search Console','human review','public telemetry'):
    q(token in ui,'Build 322 buyer measurement UI missing '+token)
for token in ('real Google Search Console export','real_export_confirmed: true','Current Search Console evidence no longer supports','Enter reviewed SEO copy explicitly'):
    q(token in search_api,'Build 322 Search Console evidence/apply boundary missing '+token)
for token in ('manual SEO wording','current evidence','real Google Search Console Performance export'):
    q(token in search_ui,'Build 322 Search Console UI boundary missing '+token)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 322 measurement must remain read-only: '+forbidden.strip())
for token in ('all_search_rows','recent_search_rows','eligible_pairs','story_clicks','stale_or_unsupported_pending_rows','page_views_30d','mismatched_batches','foreign_key_violations'):q(token in sql,'Build 322 SQL missing '+token)
for token in ('EVIDENCE_PENDING_NO_REAL_SEARCH_CONSOLE_ATTRIBUTION','REAL_EVIDENCE_STALE_NON_ACTIONABLE','REAL_EVIDENCE_NO_SUPPORTED_SEO_OPPORTUNITY','REAL_EVIDENCE_REVIEW_QUEUE_ELIGIBLE','public_telemetry_observation_only:true','queue_mutation:false','production_d1_contact:false'):q(token in verify,'Build 322 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','QUERY ATTRIBUTION REQUIRES REAL SEARCH CONSOLE','PUBLIC TELEMETRY: OBSERVATION ONLY','STALE OR UNSUPPORTED QUEUE ROWS: NON-ACTIONABLE','GENERATED SEO COPY: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 322 workflow boundary missing '+token)
q('Build 323 — Maker Story Coverage & Publication Readiness Continuity' in road,'Build 323 successor roadmap missing')
q(int(p.get('build') or 0)>=322,'Current pointer must retain Build 322 or successor')
if int(p.get('build') or 0)==322:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==323,'Build 322 current authority/successor mismatch')
print('RELEASE 467 BUILD 322 BUYER DISCOVERY ATTRIBUTION & SEO REVIEW EVIDENCE CONTINUITY')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Query attribution: real Search Console only; public telemetry remains observation-only; stale/unsupported queue rows are non-actionable')
print('Next: Build 323 — Maker Story Coverage & Publication Readiness Continuity')
