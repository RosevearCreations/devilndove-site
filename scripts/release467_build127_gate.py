#!/usr/bin/env python3
"""Release 467 Build 127 — Admin Context Breadcrumbs & Workspace Return gate."""
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
B126_SHA='af4dec5acdaf2b01a35d52731863786bee197315';B126_TREE='b8e410f0c517d3b0d59d48cf4dd7f2acfe6e21a3'
B126_PROOFS={'system_gate_run':34724580675,'current_application_quality_run':34724580676,'it_admin_runtime_proof_run':34724580648,'branch_hygiene_run':34724580646}
B126_PAGES=34724657853;B126_LIVE=34724703548
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
prior=load('release467-build126-admin-favorites-quick-launch.json')
current=load('release467-build127-admin-context-breadcrumbs-workspace-return.json')
manifest=load('migrations/canonical/manifest.json')
breadcrumbs=read('public/js/admin-context-breadcrumbs-v127.js')
auth=read('public/js/site-auth-ui.js')
favorites=read('public/js/admin-favorites-quick-launch-v126.js')
memory=read('public/js/admin-workspace-preferences-v125.js')
palette=read('public/js/admin-workspace-command-palette-v122.js')
provenance=read('scripts/current_system_gate_provenance_gate.py')
doc=read('docs/operations/RELEASE_467_BUILD_127_ADMIN_CONTEXT_BREADCRUMBS_WORKSPACE_RETURN.md')
it=read('functions/api/admin/it-operations-control-tower.js')
reliability=read('functions/api/_lib/currentReliability.js')
preflight=read('functions/api/admin/current-deployment-preflight.js')
req(pointer.get('release')==467 and pointer.get('build')==127,'current pointer must identify Release 467 Build 127')
req(pointer.get('title')=='Admin Context Breadcrumbs & Workspace Return','Build 127 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==B126_SHA and pointer.get('accepted_dev_tree_sha')==B126_TREE,'Build 127 accepted baseline must be exact Build 126')
req((pointer.get('acceptance')or{})==B126_PROOFS,'Build 127 inherited four-proof baseline mismatch')
last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{}
req(last.get('build')==126 and last.get('dev_sha')==B126_SHA and last.get('tree_sha')==B126_TREE,'restart integrity must identify exact Build 126')
req((last.get('proofs')or{})==B126_PROOFS,'restart Build 126 proof set drifted')
prod=pointer.get('production_checkpoint')or{}
req(prod.get('build')==126 and prod.get('main_sha')==B126_SHA and prod.get('tree_sha')==B126_TREE,'Production baseline must be exact Build 126')
req(prod.get('production_pages_deploy_run')==B126_PAGES and prod.get('production_live_resource_integrity_run')==B126_LIVE,'Build 126 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 126 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{}
req(closure.get('dev_sha')==B126_SHA and closure.get('tree_sha')==B126_TREE,'Build 126 final closure SHA/tree mismatch')
req((closure.get('proofs')or{})==B126_PROOFS,'Build 126 final proof mismatch')
req(closure.get('ingested_by_build')==127,'Build 126 closure must be ingested by Build 127')
req('not self-recorded by Build 126' in str(closure.get('recorded_by')or''),'Build 126 non-self-recording provenance missing')
pp=prior.get('production_checkpoint')or{}
req(pp.get('main_sha')==B126_SHA and pp.get('tree_sha')==B126_TREE and pp.get('production_pages_deploy_run')==B126_PAGES and pp.get('production_live_resource_integrity_run')==B126_LIVE,'Build 126 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 127 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 127 must not self-claim later workflow proof')
for token in ("const BUILD = 127","/data/admin-navigation-modules.json","method: 'GET'","aria-label', 'Admin context'","ddAdminWorkspaceReturn","Back to ${context.module.label}","aria-current', 'page'","DDAdminContextBreadcrumbs","dd:admin-context-breadcrumbs-ready","MutationObserver"):
    req(token in breadcrumbs,f'Build 127 breadcrumbs missing token: {token}')
for forbidden in ('localStorage','sessionStorage',"method: 'POST'",'method:"POST"','XMLHttpRequest'):
    req(forbidden not in breadcrumbs,f'Build 127 breadcrumbs contains forbidden behavior: {forbidden}')
req("import('/public/js/admin-context-breadcrumbs-v127.js?v=467b127')" in auth,'shared admin auth loader missing Build 127 breadcrumbs')
req("import('/public/js/admin-favorites-quick-launch-v126.js?v=467b126')" in auth,'Build 126 favorites bootstrap must remain available')
req("import('/public/js/admin-workspace-preferences-v125.js?v=467b125')" in auth,'Build 125 workspace memory bootstrap must remain available')
req("import('/public/js/admin-workspace-command-palette-v122.js?v=467b122')" in auth,'Build 122 command palette bootstrap must remain available')
req('DDAdminFavorites' in favorites,'Build 126 favorites contract drifted')
req('DDAdminWorkspaceMemory' in memory,'Build 125 workspace memory contract drifted')
req('localStorage' not in palette and 'sessionStorage' not in palette,'Build 122 command palette must remain stateless')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004')
req('0005_' not in json.dumps(manifest),'Build 127 must not introduce migration 0005')
req("run_current_contract('scripts/release467_build127_gate.py','Release 467 Build 127')" in provenance,'active System Gate provenance must call Build 127')
req('Release 467 Build 127' in doc and 'Context Breadcrumbs' in doc and str(B126_PAGES) in doc and str(B126_LIVE) in doc,'Build 127 operating document incomplete')
for body,label in ((it,'I.T. projection'),(reliability,'Reliability projection'),(preflight,'Deployment Preflight projection')):
    req('Build 127' in body or 'build:127' in body or 'BUILD=127' in body,f'{label} missing Build 127 identity')
    for token in (B126_SHA,B126_TREE,str(B126_PROOFS['system_gate_run']),str(B126_PROOFS['current_application_quality_run']),str(B126_PROOFS['it_admin_runtime_proof_run']),str(B126_PROOFS['branch_hygiene_run']),str(B126_PAGES),str(B126_LIVE)):
        req(token in body,f'{label} missing Build 126 closure token: {token}')
for path in ('public/js/admin-context-breadcrumbs-v127.js','public/js/admin-favorites-quick-launch-v126.js','public/js/admin-workspace-preferences-v125.js','public/js/site-auth-ui.js','functions/api/admin/it-operations-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-it-control-tower.js'):
    command(['node','--check',str(ROOT/path)],f'JavaScript syntax {path}')
command(['node','scripts/release467_build127_context_breadcrumbs_test.mjs'],'Build 127 breadcrumbs source proof')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 127 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 127 GATE: PASS')
print('Build 126 six-proof closure: INGESTED BY BUILD 127 / NOT SELF-RECORDED')
print('Admin context: MANIFEST-BACKED / READ-ONLY / NO SAVED STATE')
print('Workspace return: NAVIGATION ONLY / NO BUSINESS-DATA AUTHORITY')
print('Build 127 final closure: EXTERNAL LATER PROOF REQUIRED / NOT SELF-RECORDED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
