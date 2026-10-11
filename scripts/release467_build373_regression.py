#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8')
def j(p):return json.loads(t(p))
def q(ok,msg):
 if not ok:F.append(msg)
a=j('release467-build373-evidence-gap-execution-workbench-input-completion-continuity-viii.json')
p=j('current-development-authority.json');prev=j('release467-build372-content-adoption-discovery-outcomes-renewal-xii.json')
sql=t('scripts/release467_build373_execution_workbench.sql');wf=t('.github/workflows/release467-build373-evidence-gap-execution-workbench-input-completion-continuity-viii.yml')
api=t('functions/api/admin/user-profile.js');ui=t('public/js/admin-user-profiles.js');users=t('functions/api/admin/users.js');workbench=t('functions/api/admin/evidence-gap-execution-workbench.js')
q(a['build']==373 and a['title']=='Evidence Gap Execution Workbench & Input Completion Continuity VIII','Build 373 authority mismatch')
q(prev.get('state')=='PRODUCTION_GREEN' and prev.get('final_closure',{}).get('dev_sha')=='1a721196a9c8206b2d28263cac901c7b406836f4','Build 372 exact closure missing')
q(prev.get('production_checkpoint',{}).get('main_sha')=='e0899743b6e7e9d87b1017479a7f90c5e95018a2','Build 372 Production checkpoint missing')
q(all(v is False for v in a['safety'].values()),'Build 373 safety boundary changed')
for k in ('shows_required_inputs','shows_observed_completion','shows_completion_signal','shows_next_safe_human_action','direct_source_workspace_links','source_workspaces_remain_authoritative','explicit_search_console_report_date_required','stale_query_rejection','profile_http_failure_diagnostics','profile_api_json_errors'):
 q(a['contract'].get(k) is True,'Contract '+k)
upper=' '+re.sub(r'--[^\n]*','',sql).upper()+' '
for token in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(token not in upper,'SQL read-only violation '+token)
for token in ('35th promo factual blocker','Grey Hair source-evidence blocker','Search Console real-export blocker','currently unprofiled active projects','relational integrity'):q(token in sql,'SQL '+token)
for token in ('sets.length!==6','EXECUTION_WORKBENCH_OPEN_REAL_INPUTS_REQUIRED','production_d1_contact:false'):q(token in t('scripts/release467_build373_verify_execution_workbench.mjs'),'Verifier '+token)
for token in ('PROFILE_READ_FAILED','PROFILE_WRITE_FAILED','PROFILE_DATABASE_UNAVAILABLE','Content-Type','Cache-Control','db.prepare','try {','catch (error)'):q(token in api,'Profile JSON boundary '+token)
for token in ('readProfileApiResponse','non-JSON response','Cloudflare Ray','readProfileApiResponse(response, "Load profile")','readProfileApiResponse(response, "Save profile")'):q(token in ui,'Profile UX '+token)
q('readProfileApiResponse' in t('admin-user-profiles.js'),'Root profile mirror missing')
for token in ('USERS_DB_UNAVAILABLE','USERS_READ_FAILED','db.prepare(sql)'):q(token in users,'Users directory fallback '+token)
q('const BUILD=373' in workbench and 'READ_ONLY_DERIVED_FROM_EXISTING_SOURCE_AUTHORITIES' in str(a['contract']),'Workbench source identity/contract')
q('Release 467 • Build 373' in t('admin/evidence-gap-execution-workbench/index.html'),'Workbench page identity')
q('BUILD373_CURRENT_CLIENT' in t('public/js/admin-evidence-gap-execution-workbench-v337.js'),'Workbench client identity')
q('workflow_dispatch:' in wf and (('branches: [dev]' in wf) if p['build']==373 else ('branches: [dev]' not in wf)),'Build 373 active-or-historical workflow')
q('workflow_dispatch:' in t('.github/workflows/release467-build372-content-adoption-discovery-outcomes-renewal-xii.yml') and 'branches: [dev]' not in t('.github/workflows/release467-build372-content-adoption-discovery-outcomes-renewal-xii.yml'),'Build 372 historical workflow retired')
q(p.get('state')=='DEVELOPMENT_GREEN' and p.get('build')>=373,'Current authority state')
if p['build']==373:q(p['next_build']==374 and p['next_build_title']=='35th Promo Factual Evidence Completion Continuity IX' and str(p['promotion_state']).endswith('_CANDIDATE_NOT_YET_VERIFIED'),'Build 373 roadmap governance')
for path in ('functions/api/admin/user-profile.js','functions/api/admin/users.js','public/js/admin-user-profiles.js','admin-user-profiles.js','functions/api/admin/evidence-gap-execution-workbench.js','public/js/admin-evidence-gap-execution-workbench-v337.js','scripts/release467_build373_verify_execution_workbench.mjs'):
 r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,capture_output=True);q(r.returncode==0,'Syntax '+path+': '+r.stderr[-600:])
print('RELEASE467_BUILD373_REGRESSION='+('FAIL' if F else 'GREEN'))
if F:[print('-',x) for x in F];sys.exit(1)
