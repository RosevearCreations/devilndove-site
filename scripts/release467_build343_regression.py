#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build343-evidence-gap-execution-workbench-input-completion-continuity-iii.json')
prev=j('release467-build342-content-adoption-discovery-outcomes-renewal-vii.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build343_execution_workbench.sql')
verify=t('scripts/release467_build343_verify_execution_workbench.mjs')
api=t('functions/api/admin/evidence-gap-execution-workbench.js')
page=t('admin/evidence-gap-execution-workbench/index.html')
ui=t('public/js/admin-evidence-gap-execution-workbench-v337.js')
wf=t('.github/workflows/release467-build343-evidence-gap-execution-workbench-input-completion-continuity-iii.yml')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_343_348.md')

q(a.get('build')==343 and a.get('title')=='Evidence Gap Execution Workbench & Input Completion Continuity III','Build 343 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 342 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='b2f8eb3d841de26b3200fde135be0cf35c71872c' and (prev.get('final_closure') or {}).get('tree_sha')=='80139d90a4bd0835f694ceb25292184ca009930c','Build 342 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='c884556bd869b55d721ea82ab6ac141d816f74ca' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='80139d90a4bd0835f694ceb25292184ca009930c','Build 342 Production checkpoint missing')

c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('workbench_mode')=='READ_ONLY_DERIVED_FROM_EXISTING_SOURCE_AUTHORITIES','Build 343 workbench mode mismatch')
q(c.get('refreshes_existing_build337_workbench') is True,'Build 343 must reuse Build 337 workbench')
q(c.get('source_outcomes_build')==342,'Build 343 source outcomes build mismatch')
for k in ('shows_required_inputs','shows_observed_completion','shows_completion_signal','shows_next_safe_human_action','direct_source_workspace_links','source_workspaces_remain_authoritative','explicit_search_console_report_date_required'):q(c.get(k) is True,'Build 343 contract missing '+k)
for k in ('shadow_task_table','user_assignment_persistence','acknowledgement_persistence','resolution_persistence','completion_persistence'):q(c.get(k) is False,'Build 343 persistence boundary drift '+k)
q(all(v is False for v in s.values()),'Build 343 safety authority drift')

upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 343 measurement must remain read-only: '+forbidden.strip())
for token in ('creative_process_record_story_execution_evidence','source_evidence_needs_review','search_console_import_batches',"report_date IS NOT NULL AND date(report_date)>=date('now','-30 days')",'pragma_foreign_key_check'):q(token in sql,'Build 343 SQL missing '+token)
q("date(COALESCE(report_date,created_at))>=date('now','-30 days')" not in sql,'Build 343 must not substitute row creation time for Search Console report date')
for token in ('required_inputs','observed_completion','completion_signal','next_safe_human_action','35TH_PROMO_REAL_OUTCOME_EVIDENCE','GREY_HAIR_SOURCE_EVIDENCE_REVIEW','REAL_SEARCH_CONSOLE_EXPORT','UNPROFILED_MAKER_STORY_EVIDENCE','completion_persistence:false','production_d1_contact:false'):q(token in verify,'Build 343 verifier missing '+token)
for token in ("const BUILD=343","TITLE='Evidence Gap Execution Workbench & Input Completion Continuity III'","role:'read_only_evidence_gap_execution_workbench'",'required_inputs','completion_signal','next_safe_human_action','completion_persistence:false','onRequestGet'):q(token in api,'Build 343 API missing '+token)
q('onRequestPost' not in api,'Build 343 workbench API must remain GET-only')
for token in ('Release 467 • Build 343','Evidence Gap Execution Workbench &amp; Input Completion Continuity III','evidenceGapExecutionWorkbenchMount','admin-evidence-gap-execution-workbench-v337.js'):q(token in page,'Build 343 page missing '+token)
for token in ('Build 343','Required inputs','Observed completion','Completion signal','Next safe human action','Open authoritative workspace'):q(token in ui,'Build 343 UI missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','COMPLETION PERSISTENCE: ZERO','SHADOW TASK TABLE: ZERO','SOURCE WORKSPACES: AUTHORITATIVE','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 343 workflow boundary missing '+token)
q('Build 343 — Evidence Gap Execution Workbench & Input Completion Continuity III' in road and 'Build 344 — 35th Promo Factual Evidence Completion Continuity IV' in road,'Build 343/344 roadmap continuity missing')
q(int(p.get('build') or 0)>=343,'Current pointer must retain Build 343 or successor')
if int(p.get('build') or 0)==343:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==344,'Build 343 current authority/successor mismatch')

print('RELEASE 467 BUILD 343 EVIDENCE GAP EXECUTION WORKBENCH & INPUT COMPLETION CONTINUITY III')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Workbench remains read-only; source workspaces remain authoritative')
