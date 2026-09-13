#!/usr/bin/env python3
"""Release 467 Build 133 — Admin Navigation Context Summary & Current Location Cue gate."""
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
B132_SHA='3e69d3f11e7207b12160a38a42590dcb2a3a6d39';B132_TREE='5dba79cc9448043e72a740bf71fbfe4d2590ce1b'
B132_PROOFS={'system_gate_run':34731990800,'current_application_quality_run':34731990814,'it_admin_runtime_proof_run':34731990794,'branch_hygiene_run':34731990817}
B132_PAGES=34732064446;B132_LIVE=34732131430
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(read(path))
def command(args,label):
    r=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if r.stdout.strip(): print(r.stdout.strip())
    if r.returncode!=0: FAIL.append(f"{label} failed: {(r.stderr or r.stdout).strip()[-3000:]}")
pointer=load('current-development-authority.json');prior=load('release467-build132-admin-navigation-context-dock-responsive-collapse.json');current=load('release467-build133-admin-navigation-context-summary-current-location-cue.json');manifest=load('migrations/canonical/manifest.json')
runtime=read('public/js/admin-navigation-context-dock-v132.js');provenance=read('scripts/current_system_gate_provenance_gate.py')
it=read('functions/api/admin/it-operations-control-tower.js');reliability=read('functions/api/_lib/currentReliability.js');preflight=read('functions/api/admin/current-deployment-preflight.js')
req(pointer.get('release')==467 and pointer.get('build')==133,'current pointer must identify Release 467 Build 133')
req(pointer.get('title')=='Admin Navigation Context Summary & Current Location Cue','Build 133 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==B132_SHA and pointer.get('accepted_dev_tree_sha')==B132_TREE,'Build 133 accepted baseline must be exact Build 132')
req((pointer.get('acceptance')or{})==B132_PROOFS,'Build 133 inherited four-proof baseline mismatch')
last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{}
req(last.get('build')==132 and last.get('dev_sha')==B132_SHA and last.get('tree_sha')==B132_TREE,'restart integrity must identify exact Build 132')
req((last.get('proofs')or{})==B132_PROOFS,'restart Build 132 proof set drifted')
prod=pointer.get('production_checkpoint')or{}
req(prod.get('build')==132 and prod.get('main_sha')==B132_SHA and prod.get('tree_sha')==B132_TREE,'Production baseline must be exact Build 132')
req(prod.get('production_pages_deploy_run')==B132_PAGES and prod.get('production_live_resource_integrity_run')==B132_LIVE,'Build 132 Production proof IDs drifted')
external=pointer.get('external_lanes')or{}
req(external.get('stripe_development')=='HOLD_EXTERNAL' and external.get('paypal_sandbox')=='HOLD_EXTERNAL' and external.get('social_oauth')=='HOLD_EXTERNAL' and external.get('caip_private_media')=='EVIDENCE_DEPENDENT' and external.get('cloudflare_access_service_token')=='HOLD_EXTERNAL','external acceptance lanes drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 132 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{}
req(closure.get('dev_sha')==B132_SHA and closure.get('tree_sha')==B132_TREE,'Build 132 final closure SHA/tree mismatch')
req((closure.get('proofs')or{})==B132_PROOFS,'Build 132 final proof mismatch')
req(closure.get('ingested_by_build')==133,'Build 132 closure must be ingested by Build 133')
req('not self-recorded by Build 132' in str(closure.get('recorded_by')or''),'Build 132 non-self-recording provenance missing')
pp=prior.get('production_checkpoint')or{}
req(pp.get('main_sha')==B132_SHA and pp.get('tree_sha')==B132_TREE and pp.get('production_pages_deploy_run')==B132_PAGES and pp.get('production_live_resource_integrity_run')==B132_LIVE,'Build 132 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 133 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 133 must not self-claim later workflow proof')
scope=current.get('scope')or{}
for key in ('ingest_build132_final_closure','admin_navigation_context_summary','current_location_cue','reuse_existing_context_components_only','reuse_section_position_text','reuse_section_map_text','context_count_visible_when_compact','no_new_navigation_target','no_manifest_fetch','admin_only','client_only'):
    req(scope.get(key) is True,f'Build 133 scope missing {key}')
for token in ('const BUILD = 132','const SUMMARY_BUILD = 133','locationCue','updateSummary','ddAdminNavigationContextSummary','Navigation context ·','context panels','data-dd-admin-section-position','data-dd-admin-section-map'):
    req(token in runtime,f'Build 133 context-summary runtime missing token: {token}')
for forbidden in ('localStorage','sessionStorage',"method: 'POST'",'XMLHttpRequest'):
    req(forbidden not in runtime,f'Build 133 context-summary runtime contains forbidden behavior: {forbidden}')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004')
req('0005_' not in json.dumps(manifest),'Build 133 must not introduce migration 0005')
req("run_current_contract('scripts/release467_build133_gate.py','Release 467 Build 133')" in provenance,'active System Gate provenance must call Build 133')
for body,label in ((it,'I.T. projection'),(reliability,'Reliability projection'),(preflight,'Deployment Preflight projection')):
    for token in (B132_SHA,B132_TREE,str(B132_PROOFS['system_gate_run']),str(B132_PROOFS['current_application_quality_run']),str(B132_PROOFS['it_admin_runtime_proof_run']),str(B132_PROOFS['branch_hygiene_run']),str(B132_PAGES),str(B132_LIVE)):
        req(token in body,f'{label} missing Build 132 closure token: {token}')
req('const RELEASE=467;const BUILD=133;' in it,'I.T. projection missing structural Build 133 identity')
req('CURRENT_RELIABILITY_BUILD=133' in reliability,'Reliability projection missing structural Build 133 identity')
req('const RELEASE=467;const BUILD=133;' in preflight,'Deployment Preflight projection missing structural Build 133 identity')
for path in ('public/js/admin-navigation-context-dock-v132.js','public/js/admin-section-position-v130.js','public/js/admin-section-map-v131.js','public/js/admin-related-tools-v129.js','public/js/admin.js','functions/api/admin/it-operations-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-it-control-tower.js'):
    command(['node','--check',str(ROOT/path)],f'JavaScript syntax {path}')
command(['node','scripts/release467_build133_navigation_context_summary_test.mjs'],'Build 133 navigation context summary source proof')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 133 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 133 GATE: PASS')
print('Build 132 six-proof closure: INGESTED BY BUILD 133 / NOT SELF-RECORDED')
print('Admin navigation context summary: EXISTING LOCATION TEXT / CONTEXT COUNT / NO NEW AUTHORITY')
print('Build 133 final closure: EXTERNAL LATER PROOF REQUIRED / NOT SELF-RECORDED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
