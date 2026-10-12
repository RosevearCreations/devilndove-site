#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(path):return (R/path).read_text(encoding='utf-8')
def j(path):return json.loads(t(path))
def q(ok,msg):
 if not ok:F.append(msg)
a=j('release467-build377-multi-project-portfolio-workflow-evidence-routing-foundation.json');prev=j('release467-build376-search-console-real-export-fresh-discovery-intake-xi.json');p=j('current-development-authority.json')
api=t('functions/api/admin/project-workflow-routing.js');ui=t('public/js/admin-project-workflow-routing.js');page=t('admin/project-workflow-routing/index.html')
sql=t('scripts/release467_build377_routing.sql');ver=t('scripts/release467_build377_verify_routing.mjs');wf=t('.github/workflows/release467-build377-multi-project-portfolio-workflow-evidence-routing-foundation.yml')
q(a.get('build')==377 and a.get('title')=='Multi-Project Portfolio, Workflow & Evidence Routing Foundation','Build 377 title')
q(prev.get('state')=='PRODUCTION_GREEN','Build 376 predecessor Production GREEN')
q(prev.get('final_closure',{}).get('dev_sha')=='94c5c0868054108998a648b4e169a464f83c1e93' and prev.get('final_closure',{}).get('tree_sha')=='6cc4ab9a39c37e62bb3dc0df55dd12f0df64ea5c','Build 376 exact Development closure')
q(prev.get('production_checkpoint',{}).get('main_sha')=='f91124ccc8f93a64ce2a2afb939776e629e41ccc','Build 376 exact Production checkpoint')
q(all(v is False for v in a.get('safety',{}).values()),'Build 377 unsafe contract')
for k in ('system_wide','all_active_projects','project_id_neutral','authenticated_read_only','paginated_or_bounded','project_specific_safe_routes','non_mutating_workflow_status','no_shadow_task_ownership','no_inferred_completion','filterable_portfolio','stable_project_ids','requires_explicit_human_review','hidden_private_media'):
 q(a.get('contract',{}).get(k) is True,'Build 377 contract '+k)
for token in ('getAdminUserFromRequest','getDb','cursor','limit','INVALID_PAGINATION','ORDER BY w.creative_work_project_id LIMIT ?','.bind(cursor,limit+1)','project_key','maker_story_profiles','creative_work_events','creative_project_evidence_selections','caip_workspaces','source_steps','next_action','automatic_advancement:false','Cache-Control','read_only:true'):
 q(token in api,'Routing API '+token)
q(not re.search(r'creative_work_project_id\s*=\s*[56]\b',api),'No single-project filtering allowed')
for token in ('BUILD377_PROJECT_ROUTING','apiFetch','projectWorkflowFilter','projectWorkflowSearch','projectWorkflowNext','projectWorkflowPrevious','creative_process','esc('):
 if token=='creative_process':continue
 q(token in ui,'Routing UI '+token)
q('Release 467 • Build 377' in page and '/public/js/admin-project-workflow-routing.js?v=467b377' in page,'Routing page')
q('/admin/project-workflow-routing/' in t('admin/project-discovery-overview/index.html') and '/admin/project-workflow-routing/' in t('admin/index.html'),'Navigation links')
upper=' '+re.sub(r'--[^\n]*','',sql).upper()+' '
for token in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(token not in upper,'Read-only D1 '+token)
for token in ('FROM creative_work_projects w','maker_story_profiles','active_events','caip_workspaces','selected_evidence_rows','ORDER BY w.creative_work_project_id LIMIT 101','pragma_foreign_key_check'):
 q(token in sql,'D1 measurement '+token)
for token in ('sets.length!==2','aggregate>20000','new Set(ids).size','HUMAN_INPUTS_AND_ROUTING_OBSERVED','production_d1_contact:false'):
 q(token in ver,'Verifier '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','ALL ACTIVE PROJECTS: NON-MUTATING EVIDENCE ROUTING','PRODUCTION D1 CONTACT: ZERO'):
 q(token in wf,'Workflow '+token)
if p.get('build')==377:q('branches: [dev]' in wf,'Build 377 current proof must have bounded Development push')
else:q('branches: [dev]' not in wf,'Retired Build 377 D1 workflow must be manual-only after successor authorization')
q('workflow_dispatch:' in wf,'Dispatch')
oldwf=t('.github/workflows/release467-build376-search-console-real-export-fresh-discovery-intake-xi.yml')
q('workflow_dispatch:' in oldwf and 'branches: [dev]' not in oldwf,'Build 376 workflow manual only')
q(p.get('build',0)>=377 and p.get('state')=='DEVELOPMENT_GREEN','Current pointer')
if p.get('build')==377:q(p.get('next_build')==378 and str(p.get('promotion_state','')).endswith('_CANDIDATE_NOT_YET_VERIFIED'),'Build 378 queued')
for path in ('functions/api/admin/project-workflow-routing.js','public/js/admin-project-workflow-routing.js','scripts/release467_build377_verify_routing.mjs','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','functions/api/admin/it-operations-control-tower.js'):
 r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,capture_output=True);q(r.returncode==0,'Syntax '+path+': '+r.stderr[-650:])
print('RELEASE467_BUILD377_REGRESSION='+('FAIL' if F else 'GREEN'))
if F:[print('-',msg) for msg in F];sys.exit(1)
