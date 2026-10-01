#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build328-search-console-real-export-freshness-discovery-intake-iii.json')
prev=j('release467-build327-grey-hair-evidence-review-completion-story-plan-handoff.json')
p=j('current-development-authority.json')
api=t('functions/api/admin/search-console-import.js');ui=t('public/js/admin-search-console-import.js')
sql=t('scripts/release467_build328_continuity.sql');verify=t('scripts/release467_build328_verify_continuity.mjs')
road=t('docs/operations/RELEASE_467_EVIDENCE_ACTION_ADOPTION_BUILDS_325_330.md')
q(a.get('build')==328 and a.get('title')=='Search Console Real Export Freshness & Discovery Intake III','Build 328 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 327 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='26577d73b3747ffc2c02e31e11df86b924abdb2f' and (prev.get('final_closure') or {}).get('tree_sha')=='935849941e1a9907487abcf984505233f9bfb803','Build 327 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='f5675f69194586933fe0fefa231bde9f249216ce' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='935849941e1a9907487abcf984505233f9bfb803','Build 327 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('intake_mode')=='EXPLICIT_OPERATOR_REAL_GSC_CSV_ONLY' and c.get('real_export_confirmation_required') is True,'Build 328 real-export intake policy mismatch')
q(c.get('freshness_window_days')==30 and c.get('fallback_report_date_required_when_date_column_absent') is True,'Build 328 freshness/date authority mismatch')
q(c.get('stale_or_unsupported_pending_rows_non_actionable') is True and c.get('query_level_attribution_requires_real_search_console') is True,'Build 328 attribution actionability mismatch')
q(all(v is False for v in s.values()),'Build 328 safety authority drift')
for token in ('searchConsoleFreshness','freshness_window_days:30','REAL_EVIDENCE_STALE_NON_ACTIONABLE',"date(COALESCE(report_date,created_at))>=date('now','-30 days')",'Supply the report end date explicitly','build:328'):
    q(token in api,'Build 328 Search Console API missing '+token)
for token in ('Build 328 freshness','30-day freshness window','Required when the CSV has no Date column','Stale evidence is non-actionable'):
    q(token in ui,'Build 328 Search Console UI missing '+token)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 328 measurement must remain read-only: '+forbidden.strip())
for token in ('operator_bound_batches','csv_named_batches','import_audits','invalid_report_date_rows','recent_search_rows','eligible_pairs','stale_or_unsupported_pending_rows','pragma_foreign_key_check'):
    q(token in sql,'Build 328 SQL missing '+token)
for token in ('EVIDENCE_PENDING_NO_REAL_EXPORT','REAL_EVIDENCE_STALE_NON_ACTIONABLE','REAL_EVIDENCE_FRESH_NO_SUPPORTED_SEO_OPPORTUNITY','REAL_EVIDENCE_FRESH_REVIEW_QUEUE_ELIGIBLE','freshness_window_days:30','synthetic_rows:false','queue_mutation:false','production_d1_contact:false'):
    q(token in verify,'Build 328 verifier missing '+token)
q('Build 329 — Maker Story Advancement & Publication Readiness Continuity II' in road,'Build 329 successor roadmap missing')
q(int(p.get('build') or 0)>=328,'Current pointer must retain Build 328 or successor')
if int(p.get('build') or 0)==328:q(int(p.get('next_build') or 0)==329,'Build 329 successor pointer missing')
print('RELEASE 467 BUILD 328 SEARCH CONSOLE REAL EXPORT FRESHNESS & DISCOVERY INTAKE III')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Real Search Console evidence only; 30-day freshness gates SEO actionability; stale evidence remains non-actionable')
print('Next: Build 329 — Maker Story Advancement & Publication Readiness Continuity II')
