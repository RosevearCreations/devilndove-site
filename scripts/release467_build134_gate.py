#!/usr/bin/env python3
"""Release 467 Build 134 — Admin Navigation Context Summary Readability & Full-Text Accessibility gate."""
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
B133_SHA='00025cf2fe7ec66af3fd44fba7188657a199cb87';B133_TREE='639a6d20fa8bd67c93faa70971de1ef5e2f64ea8'
B133_PROOFS={'system_gate_run':34732882178,'current_application_quality_run':34732882139,'it_admin_runtime_proof_run':34732882215,'branch_hygiene_run':34732882188}
B133_PAGES=34732966355;B133_LIVE=34733006830
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(read(path))
def command(args,label):
    r=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if r.stdout.strip(): print(r.stdout.strip())
    if r.returncode!=0: FAIL.append(f"{label} failed: {(r.stderr or r.stdout).strip()[-3000:]}")
pointer=load('current-development-authority.json');prior=load('release467-build133-admin-navigation-context-summary-current-location-cue.json');current=load('release467-build134-admin-navigation-context-summary-readability-full-text-accessibility.json');manifest=load('migrations/canonical/manifest.json');runtime=read('public/js/admin-navigation-context-dock-v132.js');provenance=read('scripts/current_system_gate_provenance_gate.py')
req(pointer.get('release')==467 and pointer.get('build')==134,'current pointer must identify Release 467 Build 134')
req(pointer.get('title')=='Admin Navigation Context Summary Readability & Full-Text Accessibility','Build 134 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==B133_SHA and pointer.get('accepted_dev_tree_sha')==B133_TREE,'Build 134 accepted baseline must be exact Build 133')
req((pointer.get('acceptance')or{})==B133_PROOFS,'Build 134 inherited four-proof baseline mismatch')
last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{};prod=pointer.get('production_checkpoint')or{}
req(last.get('build')==133 and last.get('dev_sha')==B133_SHA and last.get('tree_sha')==B133_TREE,'restart integrity must identify exact Build 133')
req((last.get('proofs')or{})==B133_PROOFS,'restart Build 133 proof set drifted')
req(prod.get('build')==133 and prod.get('main_sha')==B133_SHA and prod.get('tree_sha')==B133_TREE,'Production baseline must be exact Build 133')
req(prod.get('production_pages_deploy_run')==B133_PAGES and prod.get('production_live_resource_integrity_run')==B133_LIVE,'Build 133 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 133 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{};pp=prior.get('production_checkpoint')or{}
req(closure.get('dev_sha')==B133_SHA and closure.get('tree_sha')==B133_TREE and (closure.get('proofs')or{})==B133_PROOFS,'Build 133 final closure mismatch')
req(closure.get('ingested_by_build')==134,'Build 133 closure must be ingested by Build 134')
req(pp.get('main_sha')==B133_SHA and pp.get('tree_sha')==B133_TREE and pp.get('production_pages_deploy_run')==B133_PAGES and pp.get('production_live_resource_integrity_run')==B133_LIVE,'Build 133 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 134 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 134 must not self-claim later proof')
for token in ('const BUILD = 132','const SUMMARY_BUILD = 134','summaryParts','dd-admin-navigation-context-summary-label','dd-admin-navigation-context-summary-count','summary.title=fullText','ddAdminNavigationContextFullText','text-overflow:ellipsis'):
    req(token in runtime,f'Build 134 runtime missing token: {token}')
for forbidden in ('localStorage','sessionStorage',"fetch(",'XMLHttpRequest'):
    req(forbidden not in runtime,f'Build 134 runtime contains forbidden behavior: {forbidden}')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004')
req("run_current_contract('scripts/release467_build134_gate.py','Release 467 Build 134')" in provenance,'active System Gate provenance must call Build 134')
command(['node','--check',str(ROOT/'public/js/admin-navigation-context-dock-v132.js')],'Build 134 runtime syntax')
command(['node','scripts/release467_build134_navigation_context_summary_readability_test.mjs'],'Build 134 summary readability source proof')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 134 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 134 GATE: PASS')
print('Build 133 six-proof closure: INGESTED BY BUILD 134 / NOT SELF-RECORDED')
print('Admin summary readability: ELLIPSIS + VISIBLE COUNT + FULL TITLE/ARIA TEXT')
print('Build 134 final closure: EXTERNAL LATER PROOF REQUIRED / NOT SELF-RECORDED')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
