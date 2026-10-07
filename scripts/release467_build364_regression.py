#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build364-search-console-real-export-fresh-discovery-intake-ix.json');prev=j('release467-build363-grey-hair-source-review-story-plan-completion-continuity-vii.json');p=j('current-development-authority.json');sql=t('scripts/release467_build364_continuity.sql');verify=t('scripts/release467_build364_verify_continuity.mjs');api=t('functions/api/admin/search-console-import.js');ui=t('public/js/admin-search-console-import.js');wf=t('.github/workflows/release467-build364-search-console-real-export-fresh-discovery-intake-ix.yml');oldwf=t('.github/workflows/release467-build363-grey-hair-source-review-story-plan-completion-continuity-vii.yml');road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_361_366.md')
q(a.get('build')==364 and a.get('title')=='Search Console Real Export & Fresh Discovery Intake IX','Build 364 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 363 Production closure not successor-ingested')
fc=prev.get('final_closure') or {};pc=prev.get('production_checkpoint') or {}
q(fc.get('dev_sha')=='6a7cb2ad960f84b045ae62e52a8abd94fb69280f' and fc.get('tree_sha')=='8a43776566a46245931c9cb4ac3049a770d76a8c','Build 363 exact Development closure missing')
q(pc.get('main_sha')=='33577629d67159d23888c59b3aa7fb2f52cc98e8' and pc.get('tree_sha')=='8a43776566a46245931c9cb4ac3049a770d76a8c','Build 363 Production checkpoint missing')
cc=a.get('contract') or {};s=a.get('safety') or {}
q(cc.get('intake_mode')=='EXPLICIT_OPERATOR_REAL_GSC_CSV_ONLY' and cc.get('real_export_confirmation_required') is True,'Build 364 real-export intake mismatch')
q(cc.get('freshness_window_days')==30 and cc.get('fallback_report_date_required_when_date_column_absent') is True,'Build 364 freshness/date mismatch')
q(cc.get('imported_at_must_not_substitute_for_missing_report_date') is True and cc.get('created_at_must_not_substitute_for_missing_report_date') is True,'Build 364 timestamp boundary mismatch')
q(cc.get('next_build')==365 and cc.get('next_build_title')=='Maker Story Advancement & Publication Readiness Continuity VIII','Build 365 successor mismatch')
q(all(v is False for v in s.values()),'Build 364 safety authority drift')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 364 measurement must remain read-only: '+forbidden.strip())
for token in ('operator_bound_batches','csv_named_batches','import_audits','revert_audits','invalid_report_date_rows','recent_search_rows','eligible_pairs','stale_or_unsupported_pending_rows','pragma_foreign_key_check'):q(token in sql,'Build 364 SQL missing '+token)
for token in ('EVIDENCE_PENDING_NO_REAL_EXPORT','REAL_EVIDENCE_STALE_NON_ACTIONABLE','REAL_EVIDENCE_FRESH_NO_SUPPORTED_SEO_OPPORTUNITY','REAL_EVIDENCE_FRESH_REVIEW_QUEUE_ELIGIBLE','freshness_window_days:30','synthetic_rows:false','production_d1_contact:false'):q(token in verify,'Build 364 verifier missing '+token)
q('BUILD364_CURRENT_API' in api and 'BUILD364_CURRENT_CLIENT' in ui,'Build 364 Search Console current identity missing')
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','REAL EXPORT CONFIRMATION REQUIRED','FRESHNESS WINDOW: 30 DAYS','SYNTHETIC DISCOVERY ROWS: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 364 workflow boundary missing '+token)
cur=int(p.get('build') or 0);q(('branches: [dev]' in wf) if cur==364 else ('workflow_dispatch:' in wf and 'branches: [dev]' not in wf),'Build 364 workflow trigger state mismatch')
q('Historical after Build 364 activation; manual-only.' in oldwf and 'branches: [dev]' not in oldwf,'Build 363 workflow was not retired')
q('Build 364 — Search Console Real Export & Fresh Discovery Intake IX' in road and 'Build 365 — Maker Story Advancement & Publication Readiness Continuity VIII' in road,'Build 364/365 roadmap continuity missing')
q(cur>=364,'Current pointer must retain Build 364 or successor')
if cur==364:q(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN') and int(p.get('next_build') or 0)==365,'Build 364 current authority/successor mismatch')
for path in ('functions/api/admin/search-console-import.js','public/js/admin-search-console-import.js','scripts/release467_build364_verify_continuity.mjs'):
 r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);q(r.returncode==0,path+' syntax failed')
print('RELEASE 467 BUILD 364 SEARCH CONSOLE REAL EXPORT & FRESH DISCOVERY INTAKE IX')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 365 — Maker Story Advancement & Publication Readiness Continuity VIII')
