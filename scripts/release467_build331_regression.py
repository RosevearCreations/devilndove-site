#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build331-evidence-gap-execution-workbench-input-completion-continuity.json');prev=j('release467-build330-content-adoption-discovery-outcomes-renewal-v.json');p=j('current-development-authority.json')
sql=t('scripts/release467_build331_execution_workbench.sql');verify=t('scripts/release467_build331_verify_execution_workbench.mjs');api=t('functions/api/admin/evidence-gap-execution-workbench.js');page=t('admin/evidence-gap-execution-workbench/index.html');ui=t('public/js/admin-evidence-gap-execution-workbench-v331.js');wf=t('.github/workflows/release467-build331-evidence-gap-execution-workbench-input-completion-continuity.yml');road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_331_336.md')
q(a.get('build')==331 and a.get('title')=='Evidence Gap Execution Workbench & Input Completion Continuity','Build 331 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 330 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='9d0340a3038f05a0a80d25288ffedc316499438f' and (prev.get('final_closure') or {}).get('tree_sha')=='585bb8a35b46f20278b64e97aa314ee11a9f4ccc','Build 330 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='88b5113016acef9a0e7cc7cb7ef087b46ae01924','Build 330 exact Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('workbench_mode')=='READ_ONLY_DERIVED_FROM_EXISTING_SOURCE_AUTHORITIES','Build 331 workbench mode mismatch')
for k in ('shows_required_inputs','shows_observed_completion','shows_completion_signal','shows_next_safe_human_action','direct_source_workspace_links','source_workspaces_remain_authoritative'):q(c.get(k) is True,'Build 331 contract missing '+k)
for k in ('shadow_task_table','user_assignment_persistence','acknowledgement_persistence','resolution_persistence','completion_persistence'):q(c.get(k) is False,'Build 331 persistence boundary drift '+k)
q(all(v is False for v in s.values()),'Build 331 safety authority drift')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 331 measurement must remain read-only: '+forbidden.strip())
for token in ('creative_process_record_story_execution_evidence','source_evidence_needs_review','search_console_import_batches',"date(COALESCE(report_date,created_at))>=date('now','-30 days')",'pragma_foreign_key_check'):q(token in sql,'Build 331 SQL missing '+token)
for token in ('required_inputs','observed_completion','completion_signal','next_safe_human_action','35TH_PROMO_REAL_OUTCOME_EVIDENCE','GREY_HAIR_SOURCE_EVIDENCE_REVIEW','REAL_SEARCH_CONSOLE_EXPORT','UNPROFILED_MAKER_STORY_EVIDENCE','completion_persistence:false','production_d1_contact:false'):q(token in verify,'Build 331 verifier missing '+token)
for token in ("role:'read_only_evidence_gap_execution_workbench'",'required_inputs','completion_signal','next_safe_human_action','completion_persistence:false','onRequestGet'):q(token in api,'Build 331 API missing '+token)
q('onRequestPost' not in api,'Build 331 workbench API must remain GET-only')
for token in ('Release 467 • Build 331','Evidence Gap Execution Workbench &amp; Input Completion Continuity','evidenceGapExecutionWorkbenchMount','admin-evidence-gap-execution-workbench-v331.js'):q(token in page,'Build 331 page missing '+token)
for token in ('Required inputs','Observed completion','Completion signal','Next safe human action','Open authoritative workspace'):q(token in ui,'Build 331 UI missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','COMPLETION PERSISTENCE: ZERO','SHADOW TASK TABLE: ZERO','SOURCE WORKSPACES: AUTHORITATIVE','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 331 workflow boundary missing '+token)
q('Build 331 — Evidence Gap Execution Workbench & Input Completion Continuity' in road and 'Build 332 — 35th Promo Factual Evidence Completion Continuity II' in road,'Build 331/332 roadmap continuity missing')
q(int(p.get('build') or 0)>=331,'Current pointer must retain Build 331 or successor')
if int(p.get('build') or 0)==331:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==332,'Build 331 current authority/successor mismatch')
print('RELEASE 467 BUILD 331 EVIDENCE GAP EXECUTION WORKBENCH & INPUT COMPLETION CONTINUITY')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Workbench remains read-only; source workspaces remain authoritative')
