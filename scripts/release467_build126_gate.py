#!/usr/bin/env python3
"""Release 467 Build 126 — Admin Favorites & Quick Launch gate."""
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
B125_SHA='eca94d1ac4732c561794f914f89a2838af243617';B125_TREE='c7b4caf380183cd0b71b79d2f0ba73ccefce0d26'
B125_PROOFS={'system_gate_run':34721943588,'current_application_quality_run':34721943584,'it_admin_runtime_proof_run':34721943615,'branch_hygiene_run':34721943593}
B125_PAGES=34722069482;B125_LIVE=34722116635
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
prior=load('release467-build125-user-preferences-workspace-memory.json')
current=load('release467-build126-admin-favorites-quick-launch.json')
manifest=load('migrations/canonical/manifest.json')
favorites=read('public/js/admin-favorites-quick-launch-v126.js')
auth=read('public/js/site-auth-ui.js')
memory=read('public/js/admin-workspace-preferences-v125.js')
palette=read('public/js/admin-workspace-command-palette-v122.js')
provenance=read('scripts/current_system_gate_provenance_gate.py')
doc=read('docs/operations/RELEASE_467_BUILD_126_ADMIN_FAVORITES_QUICK_LAUNCH.md')
it=read('functions/api/admin/it-operations-control-tower.js')
reliability=read('functions/api/_lib/currentReliability.js')
preflight=read('functions/api/admin/current-deployment-preflight.js')
req(pointer.get('release')==467 and pointer.get('build')==126,'current pointer must identify Release 467 Build 126')
req(pointer.get('title')=='Admin Favorites & Quick Launch','Build 126 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==B125_SHA and pointer.get('accepted_dev_tree_sha')==B125_TREE,'Build 126 accepted baseline must be exact Build 125')
req((pointer.get('acceptance')or{})==B125_PROOFS,'Build 126 inherited four-proof baseline mismatch')
last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{}
req(last.get('build')==125 and last.get('dev_sha')==B125_SHA and last.get('tree_sha')==B125_TREE,'restart integrity must identify exact Build 125')
req((last.get('proofs')or{})==B125_PROOFS,'restart Build 125 proof set drifted')
prod=pointer.get('production_checkpoint')or{}
req(prod.get('build')==125 and prod.get('main_sha')==B125_SHA and prod.get('tree_sha')==B125_TREE,'Production baseline must be exact Build 125')
req(prod.get('production_pages_deploy_run')==B125_PAGES and prod.get('production_live_resource_integrity_run')==B125_LIVE,'Build 125 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 125 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{}
req(closure.get('dev_sha')==B125_SHA and closure.get('tree_sha')==B125_TREE,'Build 125 final closure SHA/tree mismatch')
req((closure.get('proofs')or{})==B125_PROOFS,'Build 125 final proof mismatch')
req(closure.get('ingested_by_build')==126,'Build 125 closure must be ingested by Build 126')
req('not self-recorded by Build 125' in str(closure.get('recorded_by')or''),'Build 125 non-self-recording provenance missing')
pp=prior.get('production_checkpoint')or{}
req(pp.get('main_sha')==B125_SHA and pp.get('tree_sha')==B125_TREE and pp.get('production_pages_deploy_run')==B125_PAGES and pp.get('production_live_resource_integrity_run')==B125_LIVE,'Build 125 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 126 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 126 must not self-claim later workflow proof')
for token in ("const BUILD = 126","dd_admin_favorites_v1","MAX_FAVORITES = 8","dd:admin-ready","user_id","localStorage.getItem","localStorage.setItem","localStorage.removeItem","☆ Favorite","★ Favorited","Favorites (","Clear favorites","DDAdminFavorites","dd:admin-favorites-ready","dd:admin-favorites-changed"):
    req(token in favorites,f'Build 126 favorites missing token: {token}')
for forbidden in ('sessionStorage',"method: 'POST'",'method:"POST"','fetch('):
    req(forbidden not in favorites,f'Build 126 favorites contains forbidden behavior: {forbidden}')
req("import('/public/js/admin-favorites-quick-launch-v126.js?v=467b126')" in auth,'shared admin auth loader missing Build 126 favorites')
req("import('/public/js/admin-workspace-preferences-v125.js?v=467b125')" in auth,'Build 125 workspace memory bootstrap must remain available')
req("import('/public/js/admin-workspace-command-palette-v122.js?v=467b122')" in auth,'Build 122 command palette bootstrap must remain available')
req('DDAdminWorkspaceMemory' in memory,'Build 125 workspace memory contract drifted')
req('localStorage' not in palette and 'sessionStorage' not in palette,'Build 122 command palette must remain stateless')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004')
req('0005_' not in json.dumps(manifest),'Build 126 must not introduce migration 0005')
req("run_current_contract('scripts/release467_build126_gate.py','Release 467 Build 126')" in provenance,'active System Gate provenance must call Build 126')
req('Release 467 Build 126' in doc and 'Favorites' in doc and str(B125_PAGES) in doc and str(B125_LIVE) in doc,'Build 126 operating document incomplete')
for body,label in ((it,'I.T. projection'),(reliability,'Reliability projection'),(preflight,'Deployment Preflight projection')):
    req('Build 126' in body or 'build:126' in body or 'BUILD=126' in body,f'{label} missing Build 126 identity')
    for token in (B125_SHA,B125_TREE,str(B125_PROOFS['system_gate_run']),str(B125_PROOFS['current_application_quality_run']),str(B125_PROOFS['it_admin_runtime_proof_run']),str(B125_PROOFS['branch_hygiene_run']),str(B125_PAGES),str(B125_LIVE)):
        req(token in body,f'{label} missing Build 125 closure token: {token}')
for path in ('public/js/admin-favorites-quick-launch-v126.js','public/js/admin-workspace-preferences-v125.js','public/js/site-auth-ui.js','functions/api/admin/it-operations-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-it-control-tower.js'):
    command(['node','--check',str(ROOT/path)],f'JavaScript syntax {path}')
command(['node','scripts/release467_build126_favorites_quick_launch_test.mjs'],'Build 126 favorites source proof')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 126 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 126 GATE: PASS')
print('Build 125 six-proof closure: INGESTED BY BUILD 126 / NOT SELF-RECORDED')
print('Favorites: USER-SCOPED BROWSER LOCALSTORAGE / MAX 8 / FAIL-SOFT')
print('Quick launch: ADMIN NAVIGATION ONLY / NO BUSINESS-DATA AUTHORITY')
print('Build 126 final closure: EXTERNAL LATER PROOF REQUIRED / NOT SELF-RECORDED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
