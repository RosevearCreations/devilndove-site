#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build321-search-console-real-export-intake-continuity-ii.json')
prev=j('release467-build320-grey-hair-source-evidence-review-story-plan-readiness.json')
p=j('current-development-authority.json')
api=t('functions/api/admin/search-console-import.js');ui=t('public/js/admin-search-console-import.js')
sql=t('scripts/release467_build321_continuity.sql');verify=t('scripts/release467_build321_verify_continuity.mjs')
wf=t('.github/workflows/release467-build321-search-console-real-export-intake-continuity-ii.yml')
road=t('docs/operations/RELEASE_467_EVIDENCE_COMPLETION_DISCOVERY_ADOPTION_BUILDS_319_324.md')
q(a.get('build')==321 and a.get('title')=='Search Console Real Export Intake Continuity II','Build 321 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 320 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='a5348eea48616a934a2994309d0738f05d706af9' and (prev.get('final_closure') or {}).get('tree_sha')=='1bf94721855837958a546e033e0bead0f3f97580','Build 320 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='e84cda2db64f0af93aa1f88cc71fb7079fe5fd54' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='1bf94721855837958a546e033e0bead0f3f97580','Build 320 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('intake_mode')=='EXPLICIT_OPERATOR_REAL_GSC_CSV_ONLY' and c.get('real_export_confirmation_required') is True,'Build 321 real-export intake policy mismatch')
q(c.get('no_real_export_state')=='EVIDENCE_PENDING_NO_REAL_EXPORT' and c.get('synthetic_rows_forbidden') is True,'Build 321 factual empty-state policy mismatch')
q(all(v is False for v in s.values()),'Build 321 safety authority drift')
for token in ('searchConsoleRealExportHeaderReadiness','realExportConfirmed','confirm_real_export','real Google Search Console export','Search Console intake accepts CSV exports only.','real_export_confirmed: true'):
    q(token in api,'Build 321 Search Console API missing '+token)
for token in ('searchConsoleRealExportConfirm','confirm_real_export','real Google Search Console Performance export','manual SEO wording','current evidence'):
    q(token in ui,'Build 321 Search Console UI missing '+token)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 321 measurement must remain read-only: '+forbidden.strip())
for token in ('operator_bound_batches','csv_named_batches','import_audits','revert_audits','invalid_metric_rows','pragma_foreign_key_check'):q(token in sql,'Build 321 SQL missing '+token)
for token in ('EVIDENCE_PENDING_NO_REAL_EXPORT','REAL_OPERATOR_EVIDENCE_ACCEPTED','real_export_confirmation_required:true','synthetic_rows:false','automatic_import:false','production_d1_contact:false'):q(token in verify,'Build 321 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','REAL EXPORT CONFIRMATION REQUIRED','SEARCH CONSOLE AUTO IMPORT: ZERO','SYNTHETIC DISCOVERY ROWS: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 321 workflow boundary missing '+token)
q('Build 322 — Buyer Discovery Attribution & SEO Review Evidence Continuity' in road,'Build 322 successor roadmap missing')
q(int(p.get('build') or 0)>=321,'Current pointer must retain Build 321 or successor')
if int(p.get('build') or 0)==321:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==322,'Build 321 current authority/successor mismatch')
print('RELEASE 467 BUILD 321 SEARCH CONSOLE REAL EXPORT INTAKE CONTINUITY II')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('No real export => evidence remains pending; imports require explicit real-export confirmation and expected GSC headers')
print('Next: Build 322 — Buyer Discovery Attribution & SEO Review Evidence Continuity')
