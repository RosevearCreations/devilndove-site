#!/usr/bin/env python3
"""Release 467 Build 132 — Admin Navigation Context Dock & Responsive Collapse gate."""
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
B131_SHA='ba0d027f299678479d1d28abd74ca85ea63c5efd';B131_TREE='057aa04505e4501516f87350556c3e13f89f986d'
B131_PROOFS={'system_gate_run':34730852000,'current_application_quality_run':34730852014,'it_admin_runtime_proof_run':34730851994,'branch_hygiene_run':34730852019}
B131_PAGES=34730958494;B131_LIVE=34731002747
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(read(path))
def command(args,label):
    r=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if r.stdout.strip(): print(r.stdout.strip())
    if r.returncode!=0: FAIL.append(f"{label} failed: {(r.stderr or r.stdout).strip()[-3000:]}")
pointer=load('current-development-authority.json');prior=load('release467-build131-admin-section-switcher-module-map.json');current=load('release467-build132-admin-navigation-context-dock-responsive-collapse.json');manifest=load('migrations/canonical/manifest.json')
runtime=read('public/js/admin-navigation-context-dock-v132.js');loader=read('public/js/admin-section-position-v130.js');provenance=read('scripts/current_system_gate_provenance_gate.py')
it=read('functions/api/admin/it-operations-control-tower.js');reliability=read('functions/api/_lib/currentReliability.js');preflight=read('functions/api/admin/current-deployment-preflight.js')
req(pointer.get('release')==467 and pointer.get('build')==132,'current pointer must identify Release 467 Build 132')
req(pointer.get('title')=='Admin Navigation Context Dock & Responsive Collapse','Build 132 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==B131_SHA and pointer.get('accepted_dev_tree_sha')==B131_TREE,'Build 132 accepted baseline must be exact Build 131')
req((pointer.get('acceptance')or{})==B131_PROOFS,'Build 132 inherited four-proof baseline mismatch')
last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{}
req(last.get('build')==131 and last.get('dev_sha')==B131_SHA and last.get('tree_sha')==B131_TREE,'restart integrity must identify exact Build 131')
req((last.get('proofs')or{})==B131_PROOFS,'restart Build 131 proof set drifted')
prod=pointer.get('production_checkpoint')or{}
req(prod.get('build')==131 and prod.get('main_sha')==B131_SHA and prod.get('tree_sha')==B131_TREE,'Production baseline must be exact Build 131')
req(prod.get('production_pages_deploy_run')==B131_PAGES and prod.get('production_live_resource_integrity_run')==B131_LIVE,'Build 131 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 131 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{}
req(closure.get('dev_sha')==B131_SHA and closure.get('tree_sha')==B131_TREE,'Build 131 final closure SHA/tree mismatch')
req((closure.get('proofs')or{})==B131_PROOFS,'Build 131 final proof mismatch')
req(closure.get('ingested_by_build')==132,'Build 131 closure must be ingested by Build 132')
req('not self-recorded by Build 131' in str(closure.get('recorded_by')or''),'Build 131 non-self-recording provenance missing')
pp=prior.get('production_checkpoint')or{}
req(pp.get('main_sha')==B131_SHA and pp.get('tree_sha')==B131_TREE and pp.get('production_pages_deploy_run')==B131_PAGES and pp.get('production_live_resource_integrity_run')==B131_LIVE,'Build 131 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 132 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 132 must not self-claim later workflow proof')
scope=current.get('scope')or{}
for key in ('ingest_build131_final_closure','admin_navigation_context_dock','responsive_collapse','compose_existing_navigation_components_only','related_tools_preserved','section_position_preserved','section_map_preserved','desktop_default_expanded','mobile_default_compact','user_toggle_ephemeral_only','admin_only','client_only'):
    req(scope.get(key) is True,f'Build 132 scope missing {key}')
for token in ('const BUILD = 132','Navigation context','DDAdminNavigationContextDock','dd-admin-navigation-context-dock','dd-admin-navigation-context-body','matchMedia','(max-width: 760px)','MutationObserver','dd:admin-related-tools-ready','dd:admin-section-position-ready','dd:admin-section-map-ready'):
    req(token in runtime,f'Build 132 context-dock runtime missing token: {token}')
for forbidden in ('localStorage','sessionStorage',"method: 'POST'",'XMLHttpRequest'):
    req(forbidden not in runtime,f'Build 132 context-dock runtime contains forbidden behavior: {forbidden}')
req("import('/public/js/admin-navigation-context-dock-v132.js?v=467b132')" in loader,'Admin section-position runtime must chain the Build 132 context dock')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004')
req('0005_' not in json.dumps(manifest),'Build 132 must not introduce migration 0005')
req("run_current_contract('scripts/release467_build132_gate.py','Release 467 Build 132')" in provenance,'active System Gate provenance must call Build 132')
for body,label in ((it,'I.T. projection'),(reliability,'Reliability projection'),(preflight,'Deployment Preflight projection')):
    for token in (B131_SHA,B131_TREE,str(B131_PROOFS['system_gate_run']),str(B131_PROOFS['current_application_quality_run']),str(B131_PROOFS['it_admin_runtime_proof_run']),str(B131_PROOFS['branch_hygiene_run']),str(B131_PAGES),str(B131_LIVE)):
        req(token in body,f'{label} missing Build 131 closure token: {token}')
req('const RELEASE=467;const BUILD=132;' in it,'I.T. projection missing structural Build 132 identity')
req('CURRENT_RELIABILITY_BUILD=132' in reliability,'Reliability projection missing structural Build 132 identity')
req('const RELEASE=467;const BUILD=132;' in preflight,'Deployment Preflight projection missing structural Build 132 identity')
for path in ('public/js/admin-navigation-context-dock-v132.js','public/js/admin-section-position-v130.js','public/js/admin-section-map-v131.js','public/js/admin-related-tools-v129.js','public/js/admin.js','functions/api/admin/it-operations-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-it-control-tower.js'):
    command(['node','--check',str(ROOT/path)],f'JavaScript syntax {path}')
command(['node','scripts/release467_build132_navigation_context_dock_test.mjs'],'Build 132 navigation context dock source proof')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 132 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 132 GATE: PASS')
print('Build 131 six-proof closure: INGESTED BY BUILD 132 / NOT SELF-RECORDED')
print('Admin navigation context: EXISTING COMPONENTS / RESPONSIVE DOCK / EPHEMERAL TOGGLE')
print('Build 132 final closure: EXTERNAL LATER PROOF REQUIRED / NOT SELF-RECORDED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
