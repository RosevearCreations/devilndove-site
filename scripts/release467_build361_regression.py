#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build361-evidence-gap-execution-workbench-input-completion-continuity-vi.json')
prev=j('release467-build360-content-adoption-discovery-outcomes-renewal-x.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build361_execution_workbench.sql')
verify=t('scripts/release467_build361_verify_execution_workbench.mjs')
api=t('functions/api/admin/evidence-gap-execution-workbench.js')
page=t('admin/evidence-gap-execution-workbench/index.html')
ui=t('public/js/admin-evidence-gap-execution-workbench-v337.js')
wf=t('.github/workflows/release467-build361-evidence-gap-execution-workbench-input-completion-continuity-vi.yml')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_361_366.md')

q(a.get('build')==361 and a.get('title')=='Evidence Gap Execution Workbench & Input Completion Continuity VI','Build 361 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 360 Production closure not successor-ingested')
fc=prev.get('final_closure') or {};pc=prev.get('production_checkpoint') or {}
q(fc.get('dev_sha')=='19cebb7c763cfe8fd9d65a16da020bebe1d92cfc' and fc.get('tree_sha')=='7e4c57f601c41ed38c784b1023afbed3e5ff94eb','Build 360 exact Development closure missing')
q(pc.get('main_sha')=='1123ed75b3ad7eeffebaabaaadb1c4d41aaff038' and pc.get('tree_sha')=='7e4c57f601c41ed38c784b1023afbed3e5ff94eb' and pc.get('state')=='PRODUCTION_GREEN','Build 360 Production checkpoint missing')

c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('workbench_mode')=='READ_ONLY_DERIVED_FROM_EXISTING_SOURCE_AUTHORITIES','Build 361 workbench mode mismatch')
q(c.get('refreshes_existing_build355_workbench') is True and c.get('source_outcomes_build')==360,'Build 361 predecessor workbench contract mismatch')
for k in ('shows_required_inputs','shows_observed_completion','shows_completion_signal','shows_next_safe_human_action','direct_source_workspace_links','source_workspaces_remain_authoritative','explicit_search_console_report_date_required'):
    q(c.get(k) is True,'Build 361 contract missing '+k)
for k in ('shadow_task_table','user_assignment_persistence','acknowledgement_persistence','resolution_persistence','completion_persistence'):
    q(c.get(k) is False,'Build 361 persistence boundary drift '+k)
q(all(v is False for v in s.values()),'Build 361 safety boundary drift')

upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):
    q(forbidden not in upper,'Build 361 measurement must remain read-only: '+forbidden.strip())
for token in ('35th promo factual blocker','Grey Hair source-evidence blocker','Search Console real-export blocker','currently unprofiled active projects','relational integrity'):
    q(token in sql,'Build 361 SQL missing '+token)
for token in ('sets.length!==6','EXECUTION_WORKBENCH_OPEN_REAL_INPUTS_REQUIRED','35TH_PROMO_REAL_OUTCOME_EVIDENCE','REAL_SEARCH_CONSOLE_EXPORT','GREY_HAIR_SOURCE_EVIDENCE_REVIEW','UNPROFILED_MAKER_STORY_EVIDENCE','production_d1_contact:false'):
    q(token in verify,'Build 361 verifier missing '+token)

q("const BUILD=361,TITLE='Evidence Gap Execution Workbench & Input Completion Continuity VI'" in api,'Build 361 Workbench API identity mismatch')
q('Release 467 • Build 361' in page and 'Input Completion Continuity VI' in page,'Build 361 Workbench page identity mismatch')
q('BUILD361_CURRENT_CLIENT' in ui and 'Build 361' in ui,'Build 361 Workbench client identity mismatch')

cur=int(p.get('build') or 0)
trigger_tokens=('push:','branches: [dev]') if cur==361 else ('workflow_dispatch:',)
for token in (*trigger_tokens,'D1_ONE_SHOT_EVIDENCE_CAPTURE','WORKBENCH MODE: READ-ONLY DERIVED SOURCE AUTHORITY','SOURCE WORKSPACES: AUTHORITATIVE','COMPLETION PERSISTENCE: ZERO','EVIDENCE/STORY/SEARCH/SEO MUTATION: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):
    q(token in wf,'Build 361 workflow boundary missing '+token)

q('Build 361 — Evidence Gap Execution Workbench & Input Completion Continuity VI' in road and 'Build 362 — 35th Promo Factual Evidence Completion Continuity VII' in road,'Build 361 roadmap continuity missing')
q(cur>=361,'Current pointer must retain Build 361 or successor')
if cur==361:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==362,'Build 361 current authority/successor mismatch')

for path in ('scripts/release467_build361_verify_execution_workbench.mjs','functions/api/admin/evidence-gap-execution-workbench.js','public/js/admin-evidence-gap-execution-workbench-v337.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','functions/api/admin/it-operations-control-tower.js'):
    r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    q(r.returncode==0,path+' syntax failed: '+(r.stderr or r.stdout)[-1400:])

print('RELEASE 467 BUILD 361 EVIDENCE GAP EXECUTION WORKBENCH & INPUT COMPLETION CONTINUITY VI')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Workbench remains read-only; factual source workspaces remain authoritative.')
