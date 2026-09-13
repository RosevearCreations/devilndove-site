#!/usr/bin/env python3
"""Release 467 Build 129 — Admin Related Tools & Context Shortcuts gate."""
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
B128_SHA='84523fe94b9007c82cae6d3f8b42b9a31a0e9f63';B128_TREE='08210d5fa81558ad0b773cf2c319f74f57d88af3'
B128_PROOFS={'system_gate_run':34726947819,'current_application_quality_run':34726947864,'it_admin_runtime_proof_run':34726947811,'branch_hygiene_run':34726947787}
B128_PAGES=34727026918;B128_LIVE=34727072165
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
prior=load('release467-build128-admin-navigation-help-keyboard-shortcut-reference.json')
current=load('release467-build129-admin-related-tools-context-shortcuts.json')
manifest=load('migrations/canonical/manifest.json')
runtime=read('public/js/admin-related-tools-v129.js')
admin=read('public/js/admin.js')
provenance=read('scripts/current_system_gate_provenance_gate.py')
it=read('functions/api/admin/it-operations-control-tower.js')
reliability=read('functions/api/_lib/currentReliability.js')
preflight=read('functions/api/admin/current-deployment-preflight.js')
req(pointer.get('release')==467 and pointer.get('build')==129,'current pointer must identify Release 467 Build 129')
req(pointer.get('title')=='Admin Related Tools & Context Shortcuts','Build 129 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==B128_SHA and pointer.get('accepted_dev_tree_sha')==B128_TREE,'Build 129 accepted baseline must be exact Build 128')
req((pointer.get('acceptance')or{})==B128_PROOFS,'Build 129 inherited four-proof baseline mismatch')
last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{}
req(last.get('build')==128 and last.get('dev_sha')==B128_SHA and last.get('tree_sha')==B128_TREE,'restart integrity must identify exact Build 128')
req((last.get('proofs')or{})==B128_PROOFS,'restart Build 128 proof set drifted')
prod=pointer.get('production_checkpoint')or{}
req(prod.get('build')==128 and prod.get('main_sha')==B128_SHA and prod.get('tree_sha')==B128_TREE,'Production baseline must be exact Build 128')
req(prod.get('production_pages_deploy_run')==B128_PAGES and prod.get('production_live_resource_integrity_run')==B128_LIVE,'Build 128 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 128 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{}
req(closure.get('dev_sha')==B128_SHA and closure.get('tree_sha')==B128_TREE,'Build 128 final closure SHA/tree mismatch')
req((closure.get('proofs')or{})==B128_PROOFS,'Build 128 final proof mismatch')
req(closure.get('ingested_by_build')==129,'Build 128 closure must be ingested by Build 129')
req('not self-recorded by Build 128' in str(closure.get('recorded_by')or''),'Build 128 non-self-recording provenance missing')
pp=prior.get('production_checkpoint')or{}
req(pp.get('main_sha')==B128_SHA and pp.get('tree_sha')==B128_TREE and pp.get('production_pages_deploy_run')==B128_PAGES and pp.get('production_live_resource_integrity_run')==B128_LIVE,'Build 128 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 129 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 129 must not self-claim later workflow proof')
for token in ('const BUILD = 129',"const MANIFEST_URL = '/data/admin-navigation-modules.json'",'Related tools','DDAdminRelatedTools','dd:admin-related-tools-ready','.slice(0, 4)',"method: 'GET'",'MutationObserver'):
    req(token in runtime,f'Build 129 related-tools runtime missing token: {token}')
for forbidden in ('localStorage','sessionStorage',"method: 'POST'",'XMLHttpRequest'):
    req(forbidden not in runtime,f'Build 129 related-tools runtime contains forbidden behavior: {forbidden}')
req("normalizePath(link.href) !== currentPath" in runtime,'Build 129 must exclude the current route')
req("import('/public/js/admin-related-tools-v129.js?v=467b129')" in admin,'Admin loader missing Build 129 related-tools import')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004')
req('0005_' not in json.dumps(manifest),'Build 129 must not introduce migration 0005')
req("run_current_contract('scripts/release467_build129_gate.py','Release 467 Build 129')" in provenance,'active System Gate provenance must call Build 129')
for body,label in ((it,'I.T. projection'),(reliability,'Reliability projection'),(preflight,'Deployment Preflight projection')):
    for token in (B128_SHA,B128_TREE,str(B128_PROOFS['system_gate_run']),str(B128_PROOFS['current_application_quality_run']),str(B128_PROOFS['it_admin_runtime_proof_run']),str(B128_PROOFS['branch_hygiene_run']),str(B128_PAGES),str(B128_LIVE)):
        req(token in body,f'{label} missing Build 128 closure token: {token}')
req('const RELEASE=467;const BUILD=129;' in it,'I.T. projection missing structural Build 129 identity')
req('CURRENT_RELIABILITY_BUILD=129' in reliability,'Reliability projection missing structural Build 129 identity')
req('const RELEASE=467;const BUILD=129;' in preflight,'Deployment Preflight projection missing structural Build 129 identity')
for path in ('public/js/admin-related-tools-v129.js','public/js/admin.js','functions/api/admin/it-operations-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-it-control-tower.js'):
    command(['node','--check',str(ROOT/path)],f'JavaScript syntax {path}')
command(['node','scripts/release467_build129_related_tools_test.mjs'],'Build 129 related-tools source proof')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 129 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 129 GATE: PASS')
print('Build 128 six-proof closure: INGESTED BY BUILD 129 / NOT SELF-RECORDED')
print('Admin related tools: CLIENT-ONLY / SAME MANIFEST SECTION / MAX FOUR')
print('Build 129 final closure: EXTERNAL LATER PROOF REQUIRED / NOT SELF-RECORDED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
