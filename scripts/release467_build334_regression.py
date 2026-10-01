#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build334-search-console-real-export-fresh-discovery-intake-iv.json')
p=j('current-development-authority.json')
api=t('functions/api/admin/search-console-import.js');ui=t('public/js/admin-search-console-import.js')
sql=t('scripts/release467_build334_continuity.sql');verify=t('scripts/release467_build334_verify_continuity.mjs')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_331_336.md')
wf=t('.github/workflows/release467-build334-search-console-real-export-fresh-discovery-intake-iv.yml')
q(a.get('build')==334 and a.get('title')=='Search Console Real Export & Fresh Discovery Intake IV','Build 334 identity mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='ed3a8674ec5fd0e4363043034d694fdbb0a6822a' and pred.get('development_tree_sha')=='295ee32365ac51c2988181b63d8b83a6fcae3da3','Build 333 Development predecessor mismatch')
q(pred.get('production_main_sha')=='7b934186dcef69d76c9ad3dd6a25c4aed8ba4de4' and pred.get('production_tree_sha')=='295ee32365ac51c2988181b63d8b83a6fcae3da3','Build 333 Production predecessor mismatch')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('intake_mode')=='EXPLICIT_OPERATOR_REAL_GSC_CSV_ONLY' and c.get('real_export_confirmation_required') is True,'Build 334 real-export intake policy mismatch')
q(c.get('freshness_window_days')==30 and c.get('fallback_report_date_required_when_date_column_absent') is True,'Build 334 freshness/date authority mismatch')
q(c.get('import_audit_traceability_required') is True and c.get('explicit_batch_revert_traceability_required') is True,'Build 334 audit/revert traceability mismatch')
q(c.get('stale_or_unsupported_pending_rows_non_actionable') is True and c.get('query_level_attribution_requires_real_search_console') is True,'Build 334 attribution actionability mismatch')
q(all(v is False for v in s.values()),'Build 334 safety authority drift')
for token in ('searchConsoleFreshness','freshness_window_days:30','REAL_EVIDENCE_STALE_NON_ACTIONABLE',"date(COALESCE(report_date,created_at))>=date('now','-30 days')",'Supply the report end date explicitly'):
    q(token in api,'Build 334 reused Search Console API contract missing '+token)
for token in ('30-day freshness window','Required when the CSV has no Date column','Stale evidence is non-actionable'):
    q(token in ui,'Build 334 reused Search Console UI contract missing '+token)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 334 measurement must remain read-only: '+forbidden.strip())
for token in ('operator_bound_batches','csv_named_batches','import_audits','revert_audits','invalid_report_date_rows','recent_search_rows','eligible_pairs','stale_or_unsupported_pending_rows','pragma_foreign_key_check'):
    q(token in sql,'Build 334 SQL missing '+token)
for token in ('EVIDENCE_PENDING_NO_REAL_EXPORT','REAL_EVIDENCE_STALE_NON_ACTIONABLE','REAL_EVIDENCE_FRESH_NO_SUPPORTED_SEO_OPPORTUNITY','REAL_EVIDENCE_FRESH_REVIEW_QUEUE_ELIGIBLE','freshness_window_days:30','synthetic_rows:false','queue_mutation:false','production_d1_contact:false'):
    q(token in verify,'Build 334 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','REAL EXPORT CONFIRMATION REQUIRED','FRESHNESS WINDOW: 30 DAYS','FALLBACK REPORT DATE REQUIRED WHEN DATE COLUMN ABSENT','STALE SEARCH EVIDENCE: NON-ACTIONABLE','SYNTHETIC DISCOVERY ROWS: ZERO','AUTOMATIC SEO APPLY: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):
    q(token in wf,'Build 334 workflow boundary missing '+token)
q('Build 335 — Maker Story Advancement & Publication Readiness Continuity III' in road,'Build 335 successor roadmap missing')
q(int(p.get('build') or 0)>=334,'Current pointer must retain Build 334 or successor')
if int(p.get('build') or 0)==334:q(int(p.get('next_build') or 0)==335,'Build 335 successor pointer missing')
print('RELEASE 467 BUILD 334 SEARCH CONSOLE REAL EXPORT & FRESH DISCOVERY INTAKE IV')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Real Search Console evidence only; 30-day freshness gates query-level actionability; stale evidence remains non-actionable')
print('Next: Build 335 — Maker Story Advancement & Publication Readiness Continuity III')
