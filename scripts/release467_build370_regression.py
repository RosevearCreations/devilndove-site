#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build370-search-console-real-export-fresh-discovery-intake-x.json');prev=j('release467-build369-grey-hair-source-review-story-plan-completion-continuity-viii.json');p=j('current-development-authority.json');sql=t('scripts/release467_build370_continuity.sql');verify=t('scripts/release467_build370_verify_continuity.mjs');api=t('functions/api/admin/search-console-import.js');ui=t('public/js/admin-search-console-import.js');wf=t('.github/workflows/release467-build370-search-console-real-export-fresh-discovery-intake-x.yml');oldwf=t('.github/workflows/release467-build369-grey-hair-source-review-story-plan-completion-continuity-viii.yml');road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_367_372.md')
q(a.get('build')==370 and a.get('title')=='Search Console Real Export & Fresh Discovery Intake X','Build 370 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 369 Production closure not successor-ingested')
fc=prev.get('final_closure') or {};pc=prev.get('production_checkpoint') or {}
q(fc.get('dev_sha')=='6f07ff2876162f7ee0dda683cd67a06f4f2082b6' and fc.get('tree_sha')=='38ce92f73f710a302e2839055457ca156ca45cbb','Build 369 exact Development closure missing')
q(pc.get('main_sha')=='ac54e0062f126e5b54636bd28974aa406702cc1c' and pc.get('tree_sha')=='38ce92f73f710a302e2839055457ca156ca45cbb','Build 369 Production checkpoint missing')
cc=a.get('contract') or {};s=a.get('safety') or {}
q(cc.get('intake_mode')=='EXPLICIT_OPERATOR_REAL_GSC_CSV_ONLY' and cc.get('real_export_confirmation_required') is True,'Build 370 real-export intake mismatch')
q(cc.get('freshness_window_days')==30 and cc.get('fallback_report_date_required_when_date_column_absent') is True,'Build 370 freshness/date mismatch')
q(cc.get('imported_at_must_not_substitute_for_missing_report_date') is True and cc.get('created_at_must_not_substitute_for_missing_report_date') is True,'Build 370 timestamp boundary mismatch')
q(cc.get('next_build')==371 and cc.get('next_build_title')=='Maker Story Advancement & Publication Readiness Continuity IX','Build 371 successor mismatch')
q(all(v is False for v in s.values()),'Build 370 safety authority drift')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 370 measurement must remain read-only: '+forbidden.strip())
for token in ('operator_bound_batches','csv_named_batches','import_audits','revert_audits','invalid_report_date_rows','recent_search_rows','eligible_pairs','stale_or_unsupported_pending_rows','pragma_foreign_key_check'):q(token in sql,'Build 370 SQL missing '+token)
for token in ('EVIDENCE_PENDING_NO_REAL_EXPORT','REAL_EVIDENCE_STALE_NON_ACTIONABLE','REAL_EVIDENCE_FRESH_NO_SUPPORTED_SEO_OPPORTUNITY','REAL_EVIDENCE_FRESH_REVIEW_QUEUE_ELIGIBLE','freshness_window_days:30','synthetic_rows:false','production_d1_contact:false'):q(token in verify,'Build 370 verifier missing '+token)
q('BUILD370_CURRENT_API' in api and 'BUILD370_CURRENT_CLIENT' in ui,'Build 370 Search Console current identity missing')
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','REAL EXPORT CONFIRMATION REQUIRED','FRESHNESS WINDOW: 30 DAYS','SYNTHETIC DISCOVERY ROWS: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 370 workflow boundary missing '+token)
cur=int(p.get('build') or 0);q(('branches: [dev]' in wf) if cur==370 else ('workflow_dispatch:' in wf and 'branches: [dev]' not in wf),'Build 370 workflow trigger state mismatch')
q('Historical after Build 370 activation; manual-only.' in oldwf and 'branches: [dev]' not in oldwf,'Build 369 workflow was not retired')
q('Build 370 — Search Console Real Export & Fresh Discovery Intake X' in road and 'Build 371 — Maker Story Advancement & Publication Readiness Continuity IX' in road,'Build 370/371 roadmap continuity missing')
q(cur>=370,'Current pointer must retain Build 370 or successor')
if cur==370:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==371,'Build 370 current authority/successor mismatch')
for path in ('functions/api/admin/search-console-import.js','public/js/admin-search-console-import.js','scripts/release467_build370_verify_continuity.mjs'):
 r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);q(r.returncode==0,path+' syntax failed')
print('RELEASE 467 BUILD 370 SEARCH CONSOLE REAL EXPORT & FRESH DISCOVERY INTAKE X')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 371 — Maker Story Advancement & Publication Readiness Continuity IX')
