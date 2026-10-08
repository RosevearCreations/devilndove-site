#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build367-evidence-gap-execution-workbench-input-completion-continuity-vii.json');prev=j('release467-build366-content-adoption-discovery-outcomes-renewal-xi.json');p=j('current-development-authority.json')
sql=t('scripts/release467_build367_execution_workbench.sql');verify=t('scripts/release467_build367_verify_execution_workbench.mjs')
api=t('functions/api/admin/evidence-gap-execution-workbench.js');page=t('admin/evidence-gap-execution-workbench/index.html');ui=t('public/js/admin-evidence-gap-execution-workbench-v337.js')
wf=t('.github/workflows/release467-build367-evidence-gap-execution-workbench-input-completion-continuity-vii.yml');road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_367_372.md')
q(a.get('build')==367 and a.get('title')=='Evidence Gap Execution Workbench & Input Completion Continuity VII','Build 367 identity mismatch')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('workbench_mode')=='READ_ONLY_DERIVED_FROM_EXISTING_SOURCE_AUTHORITIES','Build 367 workbench mode mismatch')
q(c.get('refreshes_existing_build361_workbench') is True and c.get('source_outcomes_build')==366,'Build 367 predecessor workbench contract mismatch')
for k in ('shows_required_inputs','shows_observed_completion','shows_completion_signal','shows_next_safe_human_action','direct_source_workspace_links','source_workspaces_remain_authoritative','explicit_search_console_report_date_required'):q(c.get(k) is True,'Build 367 contract missing '+k)
for k in ('shadow_task_table','user_assignment_persistence','acknowledgement_persistence','resolution_persistence','completion_persistence'):q(c.get(k) is False,'Build 367 persistence boundary drift '+k)
q(all(v is False for v in s.values()),'Build 367 safety boundary drift')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 367 measurement must remain read-only: '+forbidden.strip())
for token in ('35th promo factual blocker','Grey Hair source-evidence blocker','Search Console real-export blocker','currently unprofiled active projects','relational integrity'):q(token in sql,'Build 367 SQL missing '+token)
for token in ('sets.length!==6','EXECUTION_WORKBENCH_OPEN_REAL_INPUTS_REQUIRED','35TH_PROMO_REAL_OUTCOME_EVIDENCE','REAL_SEARCH_CONSOLE_EXPORT','GREY_HAIR_SOURCE_EVIDENCE_REVIEW','UNPROFILED_MAKER_STORY_EVIDENCE','production_d1_contact:false'):q(token in verify,'Build 367 verifier missing '+token)
q("const BUILD=367,TITLE='Evidence Gap Execution Workbench & Input Completion Continuity VII'" in api,'Build 367 Workbench API identity mismatch')
q('Release 467 • Build 367' in page and 'Input Completion Continuity VII' in page,'Build 367 Workbench page identity mismatch')
q('BUILD367_CURRENT_CLIENT' in ui and 'Build 367' in ui,'Build 367 Workbench client identity mismatch')
cur=int(p.get('build') or 0);trigger_tokens=('push:','branches: [dev]') if cur==367 else ('workflow_dispatch:',)
for token in (*trigger_tokens,'D1_ONE_SHOT_EVIDENCE_CAPTURE','WORKBENCH MODE: READ-ONLY DERIVED SOURCE AUTHORITY','SOURCE WORKSPACES: AUTHORITATIVE','COMPLETION PERSISTENCE: ZERO','EVIDENCE/STORY/SEARCH/SEO MUTATION: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 367 workflow boundary missing '+token)
q('Build 367 — Evidence Gap Execution Workbench & Input Completion Continuity VII' in road and 'Build 368 — 35th Promo Factual Evidence Completion Continuity VIII' in road,'Build 367 roadmap continuity missing')
q(cur>=366,'Current pointer must retain Build 366 staging or Build 367 successor')
if cur==367:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==368,'Build 367 current authority/successor mismatch')
for path in ('scripts/release467_build367_verify_execution_workbench.mjs','functions/api/admin/evidence-gap-execution-workbench.js','public/js/admin-evidence-gap-execution-workbench-v337.js'):
 r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);q(r.returncode==0,path+' syntax failed: '+(r.stderr or r.stdout)[-1400:])
print('RELEASE 467 BUILD 367 EVIDENCE GAP EXECUTION WORKBENCH & INPUT COMPLETION CONTINUITY VII')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
