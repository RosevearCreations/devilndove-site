#!/usr/bin/env python3
"""Release 467 Build 130 — Admin Section Position & Previous/Next Tool Navigation gate."""
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
B129_SHA='3cd8aea7927d80f412bfe3acb62fe13f52b4c278';B129_TREE='0cbb9f0f33206d8b6c3dce404afd58382c71c24c'
B129_PROOFS={'system_gate_run':34728937075,'current_application_quality_run':34728937088,'it_admin_runtime_proof_run':34728937083,'branch_hygiene_run':34728937091}
B129_PAGES=34729016936;B129_LIVE=34729059768
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
prior=load('release467-build129-admin-related-tools-context-shortcuts.json')
current=load('release467-build130-admin-section-position-previous-next-navigation.json')
manifest=load('migrations/canonical/manifest.json')
runtime=read('public/js/admin-section-position-v130.js')
admin=read('public/js/admin.js')
provenance=read('scripts/current_system_gate_provenance_gate.py')
it=read('functions/api/admin/it-operations-control-tower.js')
reliability=read('functions/api/_lib/currentReliability.js')
preflight=read('functions/api/admin/current-deployment-preflight.js')
req(pointer.get('release')==467 and pointer.get('build')==130,'current pointer must identify Release 467 Build 130')
req(pointer.get('title')=='Admin Section Position & Previous/Next Tool Navigation','Build 130 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==B129_SHA and pointer.get('accepted_dev_tree_sha')==B129_TREE,'Build 130 accepted baseline must be exact Build 129')
req((pointer.get('acceptance')or{})==B129_PROOFS,'Build 130 inherited four-proof baseline mismatch')
last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{}
req(last.get('build')==129 and last.get('dev_sha')==B129_SHA and last.get('tree_sha')==B129_TREE,'restart integrity must identify exact Build 129')
req((last.get('proofs')or{})==B129_PROOFS,'restart Build 129 proof set drifted')
prod=pointer.get('production_checkpoint')or{}
req(prod.get('build')==129 and prod.get('main_sha')==B129_SHA and prod.get('tree_sha')==B129_TREE,'Production baseline must be exact Build 129')
req(prod.get('production_pages_deploy_run')==B129_PAGES and prod.get('production_live_resource_integrity_run')==B129_LIVE,'Build 129 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 129 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{}
req(closure.get('dev_sha')==B129_SHA and closure.get('tree_sha')==B129_TREE,'Build 129 final closure SHA/tree mismatch')
req((closure.get('proofs')or{})==B129_PROOFS,'Build 129 final proof mismatch')
req(closure.get('ingested_by_build')==130,'Build 129 closure must be ingested by Build 130')
req('not self-recorded by Build 129' in str(closure.get('recorded_by')or''),'Build 129 non-self-recording provenance missing')
pp=prior.get('production_checkpoint')or{}
req(pp.get('main_sha')==B129_SHA and pp.get('tree_sha')==B129_TREE and pp.get('production_pages_deploy_run')==B129_PAGES and pp.get('production_live_resource_integrity_run')==B129_LIVE,'Build 129 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 130 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 130 must not self-claim later workflow proof')
scope=current.get('scope')or{}
for key in ('ingest_build129_final_closure','admin_section_position','previous_next_tool_navigation','same_manifest_section_only','ordered_manifest_links_only','no_wraparound','existing_navigation_manifest_only','admin_only','client_only'):
    req(scope.get(key) is True,f'Build 130 scope missing {key}')
for token in ('const BUILD = 130',"const MANIFEST_URL = '/data/admin-navigation-modules.json'",'Section position','DDAdminSectionPosition','dd:admin-section-position-ready','context.index - 1','context.index + 1','Tool ${context.index + 1} of ${total}',"method: 'GET'",'MutationObserver'):
    req(token in runtime,f'Build 130 section-position runtime missing token: {token}')
for forbidden in ('localStorage','sessionStorage',"method: 'POST'",'XMLHttpRequest'):
    req(forbidden not in runtime,f'Build 130 section-position runtime contains forbidden behavior: {forbidden}')
req("context.index > 0 ? context.links[context.index - 1] : null" in runtime,'Build 130 previous tool must not wrap around')
req("context.index + 1 < total ? context.links[context.index + 1] : null" in runtime,'Build 130 next tool must not wrap around')
req("import('/public/js/admin-section-position-v130.js?v=467b130')" in admin,'Admin loader missing Build 130 section-position import')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004')
req('0005_' not in json.dumps(manifest),'Build 130 must not introduce migration 0005')
req("run_current_contract('scripts/release467_build130_gate.py','Release 467 Build 130')" in provenance,'active System Gate provenance must call Build 130')
for body,label in ((it,'I.T. projection'),(reliability,'Reliability projection'),(preflight,'Deployment Preflight projection')):
    for token in (B129_SHA,B129_TREE,str(B129_PROOFS['system_gate_run']),str(B129_PROOFS['current_application_quality_run']),str(B129_PROOFS['it_admin_runtime_proof_run']),str(B129_PROOFS['branch_hygiene_run']),str(B129_PAGES),str(B129_LIVE)):
        req(token in body,f'{label} missing Build 129 closure token: {token}')
req('const RELEASE=467;const BUILD=130;' in it,'I.T. projection missing structural Build 130 identity')
req('CURRENT_RELIABILITY_BUILD=130' in reliability,'Reliability projection missing structural Build 130 identity')
req('const RELEASE=467;const BUILD=130;' in preflight,'Deployment Preflight projection missing structural Build 130 identity')
for path in ('public/js/admin-section-position-v130.js','public/js/admin-related-tools-v129.js','public/js/admin.js','functions/api/admin/it-operations-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-it-control-tower.js'):
    command(['node','--check',str(ROOT/path)],f'JavaScript syntax {path}')
command(['node','scripts/release467_build130_section_position_test.mjs'],'Build 130 section-position source proof')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 130 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 130 GATE: PASS')
print('Build 129 six-proof closure: INGESTED BY BUILD 130 / NOT SELF-RECORDED')
print('Admin section position: CLIENT-ONLY / SAME MANIFEST SECTION / ADJACENT PREVIOUS-NEXT / NO WRAPAROUND')
print('Build 130 final closure: EXTERNAL LATER PROOF REQUIRED / NOT SELF-RECORDED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
