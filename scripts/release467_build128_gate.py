#!/usr/bin/env python3
"""Release 467 Build 128 — Admin Navigation Help & Keyboard Shortcut Reference gate."""
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
B127_SHA='dead9393e6d8db5fbcbe776c3885da80cbe42163';B127_TREE='efff42114b680218c756031fb2f92bc12e541b1c'
B127_PROOFS={'system_gate_run':34725275176,'current_application_quality_run':34725275139,'it_admin_runtime_proof_run':34725275114,'branch_hygiene_run':34725275193}
B127_PAGES=34725363163;B127_LIVE=34725405258
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
prior=load('release467-build127-admin-context-breadcrumbs-workspace-return.json')
current=load('release467-build128-admin-navigation-help-keyboard-shortcut-reference.json')
manifest=load('migrations/canonical/manifest.json')
help_js=read('public/js/admin-navigation-help-v128.js')
auth=read('public/js/site-auth-ui.js')
favorites=read('public/js/admin-favorites-quick-launch-v126.js')
memory=read('public/js/admin-workspace-preferences-v125.js')
palette=read('public/js/admin-workspace-command-palette-v122.js')
breadcrumbs=read('public/js/admin-context-breadcrumbs-v127.js')
provenance=read('scripts/current_system_gate_provenance_gate.py')
doc=read('docs/operations/RELEASE_467_BUILD_128_ADMIN_NAVIGATION_HELP_KEYBOARD_SHORTCUT_REFERENCE.md')
it=read('functions/api/admin/it-operations-control-tower.js')
reliability=read('functions/api/_lib/currentReliability.js')
preflight=read('functions/api/admin/current-deployment-preflight.js')
req(pointer.get('release')==467 and pointer.get('build')==128,'current pointer must identify Release 467 Build 128')
req(pointer.get('title')=='Admin Navigation Help & Keyboard Shortcut Reference','Build 128 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==B127_SHA and pointer.get('accepted_dev_tree_sha')==B127_TREE,'Build 128 accepted baseline must be exact Build 127')
req((pointer.get('acceptance')or{})==B127_PROOFS,'Build 128 inherited four-proof baseline mismatch')
last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{}
req(last.get('build')==127 and last.get('dev_sha')==B127_SHA and last.get('tree_sha')==B127_TREE,'restart integrity must identify exact Build 127')
req((last.get('proofs')or{})==B127_PROOFS,'restart Build 127 proof set drifted')
prod=pointer.get('production_checkpoint')or{}
req(prod.get('build')==127 and prod.get('main_sha')==B127_SHA and prod.get('tree_sha')==B127_TREE,'Production baseline must be exact Build 127')
req(prod.get('production_pages_deploy_run')==B127_PAGES and prod.get('production_live_resource_integrity_run')==B127_LIVE,'Build 127 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 127 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{}
req(closure.get('dev_sha')==B127_SHA and closure.get('tree_sha')==B127_TREE,'Build 127 final closure SHA/tree mismatch')
req((closure.get('proofs')or{})==B127_PROOFS,'Build 127 final proof mismatch')
req(closure.get('ingested_by_build')==128,'Build 127 closure must be ingested by Build 128')
req('not self-recorded by Build 127' in str(closure.get('recorded_by')or''),'Build 127 non-self-recording provenance missing')
pp=prior.get('production_checkpoint')or{}
req(pp.get('main_sha')==B127_SHA and pp.get('tree_sha')==B127_TREE and pp.get('production_pages_deploy_run')==B127_PAGES and pp.get('production_live_resource_integrity_run')==B127_LIVE,'Build 127 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 128 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 128 must not self-claim later workflow proof')
for token in ('const BUILD = 128','Admin navigation help','Alt + Shift + H','Ctrl/Cmd + K','Alt + Shift + F',"setAttribute('role', 'dialog')","setAttribute('aria-modal', 'true')",'ddAdminNavigationHelpTrigger','DDAdminNavigationHelp','dd:admin-navigation-help-ready','MutationObserver',"event.key === 'Escape'","event.key === 'Tab'"):
    req(token in help_js,f'Build 128 navigation help missing token: {token}')
for forbidden in ('localStorage','sessionStorage',"method: 'POST'",'method:"POST"','XMLHttpRequest'):
    req(forbidden not in help_js,f'Build 128 navigation help contains forbidden behavior: {forbidden}')
for token in ("import('/public/js/admin-workspace-command-palette-v122.js?v=467b122')","import('/public/js/admin-workspace-preferences-v125.js?v=467b125')","import('/public/js/admin-favorites-quick-launch-v126.js?v=467b126')","import('/public/js/admin-context-breadcrumbs-v127.js?v=467b127')","import('/public/js/admin-navigation-help-v128.js?v=467b128')"):
    req(token in auth,f'shared Admin auth loader missing navigation layer: {token}')
req('DDAdminFavorites' in favorites,'Build 126 favorites contract drifted')
req('DDAdminWorkspaceMemory' in memory,'Build 125 workspace memory contract drifted')
req('DDAdminContextBreadcrumbs' in breadcrumbs,'Build 127 context breadcrumb contract drifted')
req('localStorage' not in palette and 'sessionStorage' not in palette,'Build 122 command palette must remain stateless')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004')
req('0005_' not in json.dumps(manifest),'Build 128 must not introduce migration 0005')
req("run_current_contract('scripts/release467_build128_gate.py','Release 467 Build 128')" in provenance,'active System Gate provenance must call Build 128')
req('Release 467 Build 128' in doc and 'Navigation Help' in doc and str(B127_PAGES) in doc and str(B127_LIVE) in doc,'Build 128 operating document incomplete')
req('const RELEASE=467;const BUILD=128;' in it,'I.T. projection missing structural Build 128 identity')
req('CURRENT_RELIABILITY_BUILD=128' in reliability,'Reliability projection missing structural Build 128 identity')
req('const RELEASE=467;const BUILD=128;' in preflight,'Deployment Preflight projection missing structural Build 128 identity')
for body,label in ((it,'I.T. projection'),(reliability,'Reliability projection'),(preflight,'Deployment Preflight projection')):
    for token in (B127_SHA,B127_TREE,str(B127_PROOFS['system_gate_run']),str(B127_PROOFS['current_application_quality_run']),str(B127_PROOFS['it_admin_runtime_proof_run']),str(B127_PROOFS['branch_hygiene_run']),str(B127_PAGES),str(B127_LIVE)):
        req(token in body,f'{label} missing Build 127 closure token: {token}')
for path in ('public/js/admin-navigation-help-v128.js','public/js/admin-context-breadcrumbs-v127.js','public/js/admin-favorites-quick-launch-v126.js','public/js/admin-workspace-preferences-v125.js','public/js/site-auth-ui.js','functions/api/admin/it-operations-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-it-control-tower.js'):
    command(['node','--check',str(ROOT/path)],f'JavaScript syntax {path}')
command(['node','scripts/release467_build128_navigation_help_test.mjs'],'Build 128 navigation help source proof')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 128 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 128 GATE: PASS')
print('Build 127 six-proof closure: INGESTED BY BUILD 128 / NOT SELF-RECORDED')
print('Admin navigation help: CLIENT-ONLY / ACCESSIBLE / NO SAVED STATE')
print('Keyboard reference: EXISTING NAVIGATION CONTRACTS ONLY / NO NEW AUTHORITY')
print('Build 128 final closure: EXTERNAL LATER PROOF REQUIRED / NOT SELF-RECORDED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
