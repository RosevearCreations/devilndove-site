#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build346-search-console-real-export-fresh-discovery-intake-vi.json')
prev=j('release467-build345-grey-hair-source-review-story-plan-completion-continuity-iv.json')
p=j('current-development-authority.json')
api=t('functions/api/admin/search-console-import.js')
ui=t('public/js/admin-search-console-import.js')
sql=t('scripts/release467_build346_continuity.sql')
verify=t('scripts/release467_build346_verify_continuity.mjs')
wf=t('.github/workflows/release467-build346-search-console-real-export-fresh-discovery-intake-vi.yml')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_343_348.md')

q(a.get('build')==346 and a.get('title')=='Search Console Real Export & Fresh Discovery Intake VI','Build 346 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 345 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='3ce6012f969d55fa13e917bfb00c8611f3452028' and (prev.get('final_closure') or {}).get('tree_sha')=='cd32fc6b82a7da8a645ca7a435d684b04e12e816','Build 345 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='8f435c2285f51d33e22ce1165227ea03b0abc50c' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='cd32fc6b82a7da8a645ca7a435d684b04e12e816','Build 345 Production checkpoint missing')

c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('reuses_build328_search_console_authorities') is True and c.get('reuses_build340_measurement_model') is True,'Build 346 authority reuse mismatch')
q(c.get('build342_explicit_report_date_freshness_rule') is True,'Build 346 must adopt Build 342 explicit report-date freshness rule')
q(c.get('intake_mode')=='EXPLICIT_OPERATOR_REAL_GSC_CSV_ONLY' and c.get('real_export_confirmation_required') is True,'Build 346 real-export intake policy mismatch')
q(c.get('freshness_window_days')==30 and c.get('fallback_report_date_required_when_date_column_absent') is True,'Build 346 freshness/date authority mismatch')
q(c.get('imported_at_must_not_substitute_for_missing_report_date') is True and c.get('created_at_must_not_substitute_for_missing_report_date') is True,'Build 346 timestamp fallback boundary mismatch')
q(c.get('import_audit_traceability_required') is True and c.get('explicit_batch_revert_traceability_required') is True,'Build 346 audit/revert traceability mismatch')
q(c.get('stale_or_unsupported_pending_rows_non_actionable') is True and c.get('query_level_attribution_requires_real_search_console') is True,'Build 346 attribution actionability mismatch')
q(c.get('next_build')==347 and c.get('next_build_title')=='Maker Story Advancement & Publication Readiness Continuity V','Build 347 successor mismatch')
q(all(v is False for v in s.values()),'Build 346 safety authority drift')

for token in ('searchConsoleFreshness','freshness_window_days:30','REAL_EVIDENCE_STALE_NON_ACTIONABLE',"report_date IS NOT NULL AND date(report_date)>=date('now','-30 days')",'Supply the report end date explicitly','explicit_report_date_only:true','created_at_freshness_fallback:false'):
 q(token in api,'Build 346 Search Console API contract missing '+token)
q("date(COALESCE(report_date,created_at))>=date('now','-30 days')" in api,'Build 346 must retain historical freshness literal only for regression provenance')
for token in ('Build 346 freshness','30-day freshness window','Required when the CSV has no Date column','Stale evidence is non-actionable','Import/creation time never substitutes for a report date'):
 q(token in ui,'Build 346 Search Console UI contract missing '+token)

upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):
 q(forbidden not in upper,'Build 346 measurement must remain read-only: '+forbidden.strip())
q("date(COALESCE(report_date,created_at))>=date('now','-30 days')" not in sql,'Build 346 SQL must not use created_at freshness fallback')
q("date(COALESCE(q.report_date,q.created_at))>=date('now','-30 days')" not in sql,'Build 346 SQL must not use query created_at freshness fallback')
for token in ('operator_bound_batches','csv_named_batches','import_audits','revert_audits','invalid_report_date_rows','recent_search_rows','eligible_pairs','stale_or_unsupported_pending_rows','pragma_foreign_key_check',"report_date IS NOT NULL AND date(report_date)>=date('now','-30 days')","q.report_date IS NOT NULL AND date(q.report_date)>=date('now','-30 days')"):
 q(token in sql,'Build 346 SQL missing '+token)
for token in ('EVIDENCE_PENDING_NO_REAL_EXPORT','REAL_EVIDENCE_STALE_NON_ACTIONABLE','REAL_EVIDENCE_FRESH_NO_SUPPORTED_SEO_OPPORTUNITY','REAL_EVIDENCE_FRESH_REVIEW_QUEUE_ELIGIBLE','freshness_window_days:30','explicit_report_date_only:true','imported_at_freshness_fallback:false','created_at_freshness_fallback:false','synthetic_rows:false','queue_mutation:false','production_d1_contact:false'):
 q(token in verify,'Build 346 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','REAL EXPORT CONFIRMATION REQUIRED','FRESHNESS WINDOW: 30 DAYS','FALLBACK REPORT DATE REQUIRED WHEN DATE COLUMN ABSENT','EXPLICIT REPORT DATE ONLY FOR FRESHNESS','IMPORTED/CREATED AT FRESHNESS FALLBACK: ZERO','STALE SEARCH EVIDENCE: NON-ACTIONABLE','SYNTHETIC DISCOVERY ROWS: ZERO','AUTOMATIC SEO APPLY: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):
 q(token in wf,'Build 346 workflow boundary missing '+token)
q('Build 346 — Search Console Real Export & Fresh Discovery Intake VI' in road and 'Build 347 — Maker Story Advancement & Publication Readiness Continuity V' in road,'Build 346/347 roadmap continuity missing')
q(int(p.get('build') or 0)>=346,'Current pointer must retain Build 346 or successor')
if int(p.get('build') or 0)==346:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==347,'Build 346 current authority/successor mismatch')
print('RELEASE 467 BUILD 346 SEARCH CONSOLE REAL EXPORT & FRESH DISCOVERY INTAKE VI')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Real Search Console report-date evidence only; import/creation timestamps cannot create freshness')
