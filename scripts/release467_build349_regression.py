#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build349-evidence-gap-execution-workbench-input-completion-continuity-iv.json')
prev=j('release467-build348-content-adoption-discovery-outcomes-renewal-viii.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build349_execution_workbench.sql')
verify=t('scripts/release467_build349_verify_execution_workbench.mjs')
api=t('functions/api/admin/evidence-gap-execution-workbench.js')
page=t('admin/evidence-gap-execution-workbench/index.html')
ui=t('public/js/admin-evidence-gap-execution-workbench-v337.js')
wf=t('.github/workflows/release467-build349-evidence-gap-execution-workbench-input-completion-continuity-iv.yml')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_349_354.md')

q(a.get('build')==349 and a.get('title')=='Evidence Gap Execution Workbench & Input Completion Continuity IV','Build 349 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 348 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='2d3f691402a075f59fc74e7cd834bab20160dacd' and (prev.get('final_closure') or {}).get('tree_sha')=='775111e9cf3760f844a883f3fb3b2895583c02da','Build 348 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='05a4fe507da74fdf7165d8f537c298d5420b699d' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='775111e9cf3760f844a883f3fb3b2895583c02da','Build 348 Production checkpoint missing')

c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('workbench_mode')=='READ_ONLY_DERIVED_FROM_EXISTING_SOURCE_AUTHORITIES','Build 349 workbench mode mismatch')
q(c.get('refreshes_existing_build343_workbench') is True,'Build 349 must reuse Build 343 workbench')
q(c.get('source_outcomes_build')==348,'Build 349 source outcomes build mismatch')
for k in ('shows_required_inputs','shows_observed_completion','shows_completion_signal','shows_next_safe_human_action','direct_source_workspace_links','source_workspaces_remain_authoritative','explicit_search_console_report_date_required'):q(c.get(k) is True,'Build 349 contract missing '+k)
for k in ('shadow_task_table','user_assignment_persistence','acknowledgement_persistence','resolution_persistence','completion_persistence'):q(c.get(k) is False,'Build 349 persistence boundary drift '+k)
q(all(v is False for v in s.values()),'Build 349 safety authority drift')

upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 349 measurement must remain read-only: '+forbidden.strip())
for token in ('creative_process_record_story_execution_evidence','source_evidence_needs_review','search_console_import_batches',"report_date IS NOT NULL AND date(report_date)>=date('now','-30 days')",'pragma_foreign_key_check'):q(token in sql,'Build 349 SQL missing '+token)
q("date(COALESCE(report_date,created_at))>=date('now','-30 days')" not in sql,'Build 349 must not substitute row creation time for Search Console report date')
for token in ('required_inputs','observed_completion','completion_signal','next_safe_human_action','35TH_PROMO_REAL_OUTCOME_EVIDENCE','GREY_HAIR_SOURCE_EVIDENCE_REVIEW','REAL_SEARCH_CONSOLE_EXPORT','UNPROFILED_MAKER_STORY_EVIDENCE','completion_persistence:false','production_d1_contact:false'):q(token in verify,'Build 349 verifier missing '+token)
for token in ("const BUILD=349","TITLE='Evidence Gap Execution Workbench & Input Completion Continuity IV'","role:'read_only_evidence_gap_execution_workbench'",'required_inputs','completion_signal','next_safe_human_action','completion_persistence:false','onRequestGet'):q(token in api,'Build 349 API missing '+token)
q('onRequestPost' not in api,'Build 349 workbench API must remain GET-only')
for token in ('Release 467 • Build 349','Evidence Gap Execution Workbench &amp; Input Completion Continuity IV','evidenceGapExecutionWorkbenchMount','admin-evidence-gap-execution-workbench-v337.js'):q(token in page,'Build 349 page missing '+token)
for token in ('Build 349','Required inputs','Observed completion','Completion signal','Next safe human action','Open authoritative workspace'):q(token in ui,'Build 349 UI missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','COMPLETION PERSISTENCE: ZERO','SHADOW TASK TABLE: ZERO','SOURCE WORKSPACES: AUTHORITATIVE','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 349 workflow boundary missing '+token)
q('Build 349 — Evidence Gap Execution Workbench & Input Completion Continuity IV' in road and 'Build 350 — 35th Promo Factual Evidence Completion Continuity V' in road,'Build 349/350 roadmap continuity missing')
q(int(p.get('build') or 0)>=349,'Current pointer must retain Build 349 or successor')
if int(p.get('build') or 0)==349:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==350,'Build 349 current authority/successor mismatch')

print('RELEASE 467 BUILD 349 EVIDENCE GAP EXECUTION WORKBENCH & INPUT COMPLETION CONTINUITY IV')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Workbench remains read-only; source workspaces remain authoritative')
