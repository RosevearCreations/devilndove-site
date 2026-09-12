#!/usr/bin/env python3
"""Release 467 Build 125 — User Preferences & Workspace Memory gate."""
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
B124_SHA='fbcc55051b899719d2fb2cdf90343852cf5abe70';B124_TREE='7476f4843f8209c230189a03449d7c172da5de8a'
B124_PROOFS={'system_gate_run':34720625518,'current_application_quality_run':34720625496,'it_admin_runtime_proof_run':34720625502,'branch_hygiene_run':34720625515}
B124_PAGES=34720717741;B124_LIVE=34720757007
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(read(path))
def command(args,label):
    r=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if r.stdout.strip(): print(r.stdout.strip())
    if r.returncode!=0: FAIL.append(f"{label} failed: {(r.stderr or r.stdout).strip()[-3000:]}")
pointer=load('current-development-authority.json')
prior=load('release467-build124-canada-first-market-controls-us-shipping-pause.json')
current=load('release467-build125-user-preferences-workspace-memory.json')
manifest=load('migrations/canonical/manifest.json')
memory=read('public/js/admin-workspace-preferences-v125.js')
auth=read('public/js/site-auth-ui.js')
palette=read('public/js/admin-workspace-command-palette-v122.js')
provenance=read('scripts/current_system_gate_provenance_gate.py')
doc=read('docs/operations/RELEASE_467_BUILD_125_USER_PREFERENCES_WORKSPACE_MEMORY.md')
it=read('functions/api/admin/it-operations-control-tower.js')
reliability=read('functions/api/_lib/currentReliability.js')
preflight=read('functions/api/admin/current-deployment-preflight.js')
req(pointer.get('release')==467 and pointer.get('build')==125,'current pointer must identify Release 467 Build 125')
req(pointer.get('title')=='User Preferences & Workspace Memory','Build 125 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==B124_SHA and pointer.get('accepted_dev_tree_sha')==B124_TREE,'Build 125 accepted baseline must be exact Build 124')
req((pointer.get('acceptance')or{})==B124_PROOFS,'Build 125 inherited four-proof baseline mismatch')
last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{}
req(last.get('build')==124 and last.get('dev_sha')==B124_SHA and last.get('tree_sha')==B124_TREE,'restart integrity must identify exact Build 124')
req((last.get('proofs')or{})==B124_PROOFS,'restart Build 124 proof set drifted')
prod=pointer.get('production_checkpoint')or{}
req(prod.get('build')==124 and prod.get('main_sha')==B124_SHA and prod.get('tree_sha')==B124_TREE,'Production baseline must be exact Build 124')
req(prod.get('production_pages_deploy_run')==B124_PAGES and prod.get('production_live_resource_integrity_run')==B124_LIVE,'Build 124 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 124 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{}
req(closure.get('dev_sha')==B124_SHA and closure.get('tree_sha')==B124_TREE,'Build 124 final closure SHA/tree mismatch')
req((closure.get('proofs')or{})==B124_PROOFS,'Build 124 final proof mismatch')
req(closure.get('ingested_by_build')==125,'Build 124 closure must be ingested by Build 125')
req('not self-recorded by Build 124' in str(closure.get('recorded_by')or''),'Build 124 non-self-recording provenance missing')
pp=prior.get('production_checkpoint')or{}
req(pp.get('main_sha')==B124_SHA and pp.get('tree_sha')==B124_TREE and pp.get('production_pages_deploy_run')==B124_PAGES and pp.get('production_live_resource_integrity_run')==B124_LIVE,'Build 124 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 125 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 125 must not self-claim later workflow proof')
for token in ("const BUILD = 125","dd_admin_workspace_preferences_v1","dd_admin_workspace_memory_v1","remember_last_workspace","show_recent_tools","recent_limit","dd:admin-ready","user_id","localStorage.getItem","localStorage.setItem","localStorage.removeItem","Clear workspace memory","Resume:","DDAdminWorkspaceMemory","dd:workspace-memory-ready"):
    req(token in memory,f'Build 125 workspace memory missing token: {token}')
for forbidden in ('sessionStorage',"method: 'POST'",'method:"POST"','fetch('):
    req(forbidden not in memory,f'Build 125 workspace memory contains forbidden behavior: {forbidden}')
req("import('/public/js/admin-workspace-preferences-v125.js?v=467b125')" in auth,'shared admin auth loader missing Build 125 workspace memory')
req("import('/public/js/admin-workspace-command-palette-v122.js?v=467b122')" in auth,'Build 122 command palette bootstrap must remain available')
req('localStorage' not in palette and 'sessionStorage' not in palette,'Build 122 command palette must remain stateless')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004')
req('0005_' not in json.dumps(manifest),'Build 125 must not introduce migration 0005')
req("run_current_contract('scripts/release467_build125_gate.py','Release 467 Build 125')" in provenance,'active System Gate provenance must call Build 125')
req('Release 467 Build 125' in doc and 'Workspace Memory' in doc and str(B124_PAGES) in doc and str(B124_LIVE) in doc,'Build 125 operating document incomplete')
for body,label in ((it,'I.T. projection'),(reliability,'Reliability projection'),(preflight,'Deployment Preflight projection')):
    req('Build 125' in body or 'build:125' in body or 'BUILD=125' in body,f'{label} missing Build 125 identity')
    for token in (B124_SHA,B124_TREE,str(B124_PROOFS['system_gate_run']),str(B124_PROOFS['current_application_quality_run']),str(B124_PROOFS['it_admin_runtime_proof_run']),str(B124_PROOFS['branch_hygiene_run']),str(B124_PAGES),str(B124_LIVE)):
        req(token in body,f'{label} missing Build 124 closure token: {token}')
for path in ('public/js/admin-workspace-preferences-v125.js','public/js/site-auth-ui.js','functions/api/admin/it-operations-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-it-control-tower.js'):
    command(['node','--check',str(ROOT/path)],f'JavaScript syntax {path}')
command(['node','scripts/release467_build125_workspace_memory_test.mjs'],'Build 125 workspace-memory source proof')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 125 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 125 GATE: PASS')
print('Build 124 six-proof closure: INGESTED BY BUILD 125 / NOT SELF-RECORDED')
print('Workspace preferences: USER-SCOPED BROWSER LOCALSTORAGE / FAIL-SOFT')
print('Resume + recent tools: ADMIN NAVIGATION ONLY / NO BUSINESS-DATA AUTHORITY')
print('Build 125 final closure: EXTERNAL LATER PROOF REQUIRED / NOT SELF-RECORDED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
