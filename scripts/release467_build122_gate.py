#!/usr/bin/env python3
"""Release 467 Build 122 — Admin Workspace Navigation & Command Palette gate."""
from pathlib import Path
import json,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
B121_SHA='31492144ecbd2f8c353426531ea301c70aedf8f3';B121_TREE='078d5ba5c71ee160861e0a31bcca640bb89a3cdc'
B121_PROOFS={'system_gate_run':34709444214,'current_application_quality_run':34709444221,'it_admin_runtime_proof_run':34709444258,'branch_hygiene_run':34709444255};B121_PAGES=34709526481;B121_LIVE=34709571023
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(read(path))
def command(args,label):
    r=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if r.stdout.strip(): print(r.stdout.strip())
    if r.returncode!=0: FAIL.append(f"{label} failed: {(r.stderr or r.stdout).strip()[-3000:]}")
pointer=load('current-development-authority.json');prior=load('release467-build121-business-health-review-context-polish.json');current=load('release467-build122-admin-workspace-navigation-command-palette.json');manifest=load('migrations/canonical/manifest.json');nav=load('data/admin-navigation-modules.json');palette=read('public/js/admin-workspace-command-palette-v122.js');auth=read('public/js/site-auth-ui.js');provenance=read('scripts/current_system_gate_provenance_gate.py')
req(pointer.get('release')==467 and pointer.get('build')==122,'current pointer must identify Release 467 Build 122');req(pointer.get('title')=='Admin Workspace Navigation & Command Palette','Build 122 title drifted');req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state');req(pointer.get('accepted_dev_sha')==B121_SHA and pointer.get('accepted_dev_tree_sha')==B121_TREE,'Build 122 accepted baseline must be exact Build 121');req((pointer.get('acceptance')or{})==B121_PROOFS,'Build 122 inherited four-proof baseline mismatch')
last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{};req(last.get('build')==121 and last.get('dev_sha')==B121_SHA and last.get('tree_sha')==B121_TREE,'restart integrity must identify exact Build 121');req((last.get('proofs')or{})==B121_PROOFS,'restart Build 121 proof set drifted');prod=pointer.get('production_checkpoint')or{};req(prod.get('build')==121 and prod.get('main_sha')==B121_SHA and prod.get('tree_sha')==B121_TREE,'Production baseline must be exact Build 121');req(prod.get('production_pages_deploy_run')==B121_PAGES and prod.get('production_live_resource_integrity_run')==B121_LIVE,'Build 121 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 121 must be ingested as Production GREEN');closure=prior.get('final_closure')or{};req(closure.get('dev_sha')==B121_SHA and closure.get('tree_sha')==B121_TREE,'Build 121 final closure SHA/tree mismatch');req((closure.get('proofs')or{})==B121_PROOFS,'Build 121 final proof mismatch');req(closure.get('ingested_by_build')==122,'Build 121 closure must be ingested by Build 122');req('not self-recorded by Build 121' in str(closure.get('recorded_by')or''),'Build 121 non-self-recording provenance missing');pp=prior.get('production_checkpoint')or{};req(pp.get('main_sha')==B121_SHA and pp.get('tree_sha')==B121_TREE and pp.get('production_pages_deploy_run')==B121_PAGES and pp.get('production_live_resource_integrity_run')==B121_LIVE,'Build 121 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 122 must remain closure candidate');req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 122 must not self-claim later workflow proof')
for token in ('const BUILD = 122','/data/admin-navigation-modules.json','dd-admin-workspace-nav','Ctrl/Cmd+K','ArrowDown','ArrowUp','Escape','aria-modal','listbox','aria-current','FALLBACK_MODULES'):req(token in palette,f'Build 122 palette missing token: {token}')
for forbidden in ('localStorage','sessionStorage',"method: 'POST'",'setInterval('):req(forbidden not in palette,f'Build 122 palette contains forbidden behavior: {forbidden}')
req("import('/public/js/admin-workspace-command-palette-v122.js?v=467b122')" in auth,'shared Admin auth UI must load Build 122 palette');req("window.location.pathname.startsWith('/admin')" in auth,'shared palette loader must remain admin-route scoped')
modules=nav.get('modules') or [];req([m.get('key') for m in modules]==['storefront','creator','finance','it'],'active admin workspace keys drifted');req(sum(len(s.get('links')or[]) for m in modules for s in(m.get('sections')or[]))>=50,'current navigation manifest unexpectedly lost tools')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)];req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004');req('0005_' not in json.dumps(manifest),'Build 122 must not introduce migration 0005');req("run_current_contract('scripts/release467_build122_gate.py','Release 467 Build 122')" in provenance,'active System Gate provenance must call Build 122')
for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
    body=read(path)
    for token in (B121_SHA,B121_TREE,*[str(x) for x in B121_PROOFS.values()],str(B121_PAGES),str(B121_LIVE)):req(token in body,f'{path} missing Build 121 closure token {token}')
    req('Build 122' in body and 'Admin Workspace Navigation' in body,f'{path} missing Build 122 identity')
for path in ('public/js/admin-workspace-command-palette-v122.js','public/js/site-auth-ui.js','functions/api/admin/it-operations-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-it-control-tower.js'):command(['node','--check',str(ROOT/path)],f'JavaScript syntax {path}')
command(['node','scripts/release467_build122_admin_navigation_test.mjs'],'Build 122 runtime/source proof')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 122 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 122 GATE: PASS');print('Build 121 six-proof closure: INGESTED BY BUILD 122');print('Admin navigation: MANIFEST-BACKED / CLIENT-ONLY / PERSISTENCE ZERO');print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
