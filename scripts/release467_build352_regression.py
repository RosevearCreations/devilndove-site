#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build352-search-console-real-export-fresh-discovery-intake-vii.json')
prev=j('release467-build351-grey-hair-source-review-story-plan-completion-continuity-v.json')
p=j('current-development-authority.json')
api=t('functions/api/admin/search-console-import.js');ui=t('public/js/admin-search-console-import.js')
sql=t('scripts/release467_build352_continuity.sql');verify=t('scripts/release467_build352_verify_continuity.mjs')
wf=t('.github/workflows/release467-build352-search-console-real-export-fresh-discovery-intake-vii.yml')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_349_354.md')
etsyui=t('public/js/admin-etsy-oauth-acceptance.js');etsyapi=t('functions/api/admin/etsy-oauth-acceptance.js')
q(a.get('build')==352 and a.get('title')=='Search Console Real Export & Fresh Discovery Intake VII','Build 352 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 351 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='b2c5f5113dddf57e95ce866ab37140c26d2a8a3c' and (prev.get('final_closure') or {}).get('tree_sha')=='57234a69014e86988ecb859130d9e2985776ea96','Build 351 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='39b9550eba5a91c28d426e8556d09946cd739098' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='57234a69014e86988ecb859130d9e2985776ea96','Build 351 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('reuses_build328_search_console_authorities') is True and c.get('reuses_build346_measurement_model') is True,'Build 352 authority reuse mismatch')
q(c.get('build342_explicit_report_date_freshness_rule') is True,'Build 352 explicit report-date freshness missing')
q(c.get('intake_mode')=='EXPLICIT_OPERATOR_REAL_GSC_CSV_ONLY' and c.get('real_export_confirmation_required') is True,'Build 352 real-export intake mismatch')
q(c.get('freshness_window_days')==30 and c.get('fallback_report_date_required_when_date_column_absent') is True,'Build 352 freshness/date mismatch')
q(c.get('imported_at_must_not_substitute_for_missing_report_date') is True and c.get('created_at_must_not_substitute_for_missing_report_date') is True,'Build 352 timestamp fallback boundary mismatch')
q(c.get('etsy_verified_admin_startup_required') is True and c.get('etsy_connect_blockers_must_be_visible') is True,'Build 352 Etsy repair contract mismatch')
q(c.get('next_build')==353 and c.get('next_build_title')=='Maker Story Advancement & Publication Readiness Continuity VI','Build 353 successor mismatch')
q(all(v is False for v in s.values()),'Build 352 safety authority drift')
for token in ('searchConsoleFreshness','freshness_window_days:30','REAL_EVIDENCE_STALE_NON_ACTIONABLE',"report_date IS NOT NULL AND date(report_date)>=date('now','-30 days')",'Supply the report end date explicitly','explicit_report_date_only:true','created_at_freshness_fallback:false'):
 q(token in api,'Build 352 Search Console API contract missing '+token)
for token in ('BUILD352_CURRENT_CLIENT','Build 352 keeps','30-day freshness window','Required when the CSV has no Date column','Stale evidence is non-actionable','Import/creation time never substitutes for a report date','Build 346 freshness'):
 q(token in ui,'Build 352 Search Console UI contract missing '+token)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):
 q(forbidden not in upper,'Build 352 measurement must remain read-only: '+forbidden.strip())
for token in ('operator_bound_batches','csv_named_batches','import_audits','revert_audits','invalid_report_date_rows','recent_search_rows','eligible_pairs','stale_or_unsupported_pending_rows','pragma_foreign_key_check',"report_date IS NOT NULL AND date(report_date)>=date('now','-30 days')","q.report_date IS NOT NULL AND date(q.report_date)>=date('now','-30 days')"):
 q(token in sql,'Build 352 SQL missing '+token)
for token in ('EVIDENCE_PENDING_NO_REAL_EXPORT','REAL_EVIDENCE_STALE_NON_ACTIONABLE','REAL_EVIDENCE_FRESH_NO_SUPPORTED_SEO_OPPORTUNITY','REAL_EVIDENCE_FRESH_REVIEW_QUEUE_ELIGIBLE','freshness_window_days:30','explicit_report_date_only:true','imported_at_freshness_fallback:false','created_at_freshness_fallback:false','synthetic_rows:false','queue_mutation:false','production_d1_contact:false'):
 q(token in verify,'Build 352 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','REAL EXPORT CONFIRMATION REQUIRED','FRESHNESS WINDOW: 30 DAYS','EXPLICIT REPORT DATE ONLY FOR FRESHNESS','SYNTHETIC DISCOVERY ROWS: ZERO','AUTOMATIC SEO APPLY: ZERO','PROVIDER EXECUTION: ZERO','AUTH BYPASS: ZERO','PRODUCTION D1 CONTACT: ZERO'):
 q(token in wf,'Build 352 workflow boundary missing '+token)
for token in ('ensureVerifiedAdmin','window.DDAuth.me','connect_blockers','dd:auth-verified','dd:admin-access-denied','DDWhenAdminReady'):
 q(token in etsyui,'Build 352 Etsy UI repair missing '+token)
q('btn.disabled=!d.connect_authorization_available' not in etsyui,'Etsy connect must not silently disable without blocker feedback')
for token in ('connect_blockers','OAUTH_PROVIDER_AUTHORIZATION_MODE=development-explicit','secret_values_emitted:false','token_values_emitted:false'):
 q(token in etsyapi,'Build 352 Etsy API missing '+token)
q('Build 352 — Search Console Real Export & Fresh Discovery Intake VII' in road and 'Build 353 — Maker Story Advancement & Publication Readiness Continuity VI' in road,'Build 352/353 roadmap continuity missing')
q(int(p.get('build') or 0)>=352,'Current pointer must retain Build 352 or successor')
if int(p.get('build') or 0)==352:q(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN') and int(p.get('next_build') or 0)==353,'Build 352 current authority/successor mismatch')
print('RELEASE 467 BUILD 352 SEARCH CONSOLE REAL EXPORT & FRESH DISCOVERY INTAKE VII')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Real Search Console report-date evidence only; Etsy waits for verified admin auth and surfaces blockers.')
