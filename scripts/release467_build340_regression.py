#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build340-search-console-real-export-fresh-discovery-intake-v.json')
prev=j('release467-build339-grey-hair-source-review-story-plan-completion-continuity-iii.json')
p=j('current-development-authority.json')
api=t('functions/api/admin/search-console-import.js');ui=t('public/js/admin-search-console-import.js')
sql=t('scripts/release467_build340_continuity.sql');verify=t('scripts/release467_build340_verify_continuity.mjs')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_337_342.md')
wf=t('.github/workflows/release467-build340-search-console-real-export-fresh-discovery-intake-v.yml')
q(a.get('build')==340 and a.get('title')=='Search Console Real Export & Fresh Discovery Intake V','Build 340 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 339 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='71230f3cc4b6518f4f0e61068db2edd0fdf4db50' and (prev.get('final_closure') or {}).get('tree_sha')=='2420704c0619bbf645ee600d80d8f29b8d9ba4cb','Build 339 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='8c7ff02b4748ebca9a0f5773ffe34589d5890305' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='2420704c0619bbf645ee600d80d8f29b8d9ba4cb','Build 339 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('reuses_build328_search_console_authorities') is True and c.get('reuses_build334_measurement_model') is True,'Build 340 authority reuse mismatch')
q(c.get('intake_mode')=='EXPLICIT_OPERATOR_REAL_GSC_CSV_ONLY' and c.get('real_export_confirmation_required') is True,'Build 340 real-export intake policy mismatch')
q(c.get('freshness_window_days')==30 and c.get('fallback_report_date_required_when_date_column_absent') is True,'Build 340 freshness/date authority mismatch')
q(c.get('import_audit_traceability_required') is True and c.get('explicit_batch_revert_traceability_required') is True,'Build 340 audit/revert traceability mismatch')
q(c.get('stale_or_unsupported_pending_rows_non_actionable') is True and c.get('query_level_attribution_requires_real_search_console') is True,'Build 340 attribution actionability mismatch')
q(c.get('next_build')==341 and c.get('next_build_title')=='Maker Story Advancement & Publication Readiness Continuity IV','Build 341 successor mismatch')
q(all(v is False for v in s.values()),'Build 340 safety authority drift')
for token in ('searchConsoleFreshness','freshness_window_days:30','REAL_EVIDENCE_STALE_NON_ACTIONABLE',"date(COALESCE(report_date,created_at))>=date('now','-30 days')",'Supply the report end date explicitly'):
 q(token in api,'Build 340 reused Search Console API contract missing '+token)
for token in ('Build 340','30-day freshness window','Required when the CSV has no Date column','Stale evidence is non-actionable'):
 q(token in ui,'Build 340 Search Console UI contract missing '+token)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 340 measurement must remain read-only: '+forbidden.strip())
for token in ('operator_bound_batches','csv_named_batches','import_audits','revert_audits','invalid_report_date_rows','recent_search_rows','eligible_pairs','stale_or_unsupported_pending_rows','pragma_foreign_key_check'):
 q(token in sql,'Build 340 SQL missing '+token)
for token in ('EVIDENCE_PENDING_NO_REAL_EXPORT','REAL_EVIDENCE_STALE_NON_ACTIONABLE','REAL_EVIDENCE_FRESH_NO_SUPPORTED_SEO_OPPORTUNITY','REAL_EVIDENCE_FRESH_REVIEW_QUEUE_ELIGIBLE','freshness_window_days:30','synthetic_rows:false','queue_mutation:false','production_d1_contact:false'):
 q(token in verify,'Build 340 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','REAL EXPORT CONFIRMATION REQUIRED','FRESHNESS WINDOW: 30 DAYS','FALLBACK REPORT DATE REQUIRED WHEN DATE COLUMN ABSENT','STALE SEARCH EVIDENCE: NON-ACTIONABLE','SYNTHETIC DISCOVERY ROWS: ZERO','AUTOMATIC SEO APPLY: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):
 q(token in wf,'Build 340 workflow boundary missing '+token)
q('Build 341 — Maker Story Advancement & Publication Readiness Continuity IV' in road,'Build 341 successor roadmap missing')
q(int(p.get('build') or 0)>=340,'Current pointer must retain Build 340 or successor')
if int(p.get('build') or 0)==340:q(int(p.get('next_build') or 0)==341,'Build 341 successor pointer missing')
print('RELEASE 467 BUILD 340 SEARCH CONSOLE REAL EXPORT & FRESH DISCOVERY INTAKE V')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Real Search Console evidence only; 30-day freshness gates query-level actionability; stale evidence remains non-actionable')
