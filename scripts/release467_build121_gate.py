#!/usr/bin/env python3
"""Release 467 Build 121 — Business Health Review Context Polish & Return Navigation gate."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
B120_SHA='25ba9858d8926fed1fb740bd79fa41b8a0e4104a';B120_TREE='25a86af30faf1f7632a008e687a67f93f4bb98ce'
B120_PROOFS={'system_gate_run':34708100872,'current_application_quality_run':34708100889,'it_admin_runtime_proof_run':34708100890,'branch_hygiene_run':34708100871};B120_PAGES=34708208709;B120_LIVE=34708253961
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(read(path))
def command(args,label):
    r=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if r.stdout.strip(): print(r.stdout.strip())
    if r.returncode!=0: FAIL.append(f"{label} failed: {(r.stderr or r.stdout).strip()[-3000:]}")
pointer=load('current-development-authority.json');prior=load('release467-build120-business-health-review-session.json');current=load('release467-build121-business-health-review-context-polish.json');manifest=load('migrations/canonical/manifest.json');client=read('public/js/admin-business-health-review-context-v121.js');provenance=read('scripts/current_system_gate_provenance_gate.py')
req(pointer.get('release')==467 and pointer.get('build')==121,'current pointer must identify Release 467 Build 121');req(pointer.get('title')=='Business Health Review Context Polish & Return Navigation','Build 121 title drifted');req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state');req(pointer.get('accepted_dev_sha')==B120_SHA and pointer.get('accepted_dev_tree_sha')==B120_TREE,'Build 121 accepted baseline must be exact Build 120');req((pointer.get('acceptance')or{})==B120_PROOFS,'Build 121 inherited four-proof baseline mismatch')
last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{};req(last.get('build')==120 and last.get('dev_sha')==B120_SHA and last.get('tree_sha')==B120_TREE,'restart integrity must identify exact Build 120');req((last.get('proofs')or{})==B120_PROOFS,'restart Build 120 proof set drifted');prod=pointer.get('production_checkpoint')or{};req(prod.get('build')==120 and prod.get('main_sha')==B120_SHA and prod.get('tree_sha')==B120_TREE,'Production baseline must be exact Build 120');req(prod.get('production_pages_deploy_run')==B120_PAGES and prod.get('production_live_resource_integrity_run')==B120_LIVE,'Build 120 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 120 must be ingested as Production GREEN');closure=prior.get('final_closure')or{};req(closure.get('dev_sha')==B120_SHA and closure.get('tree_sha')==B120_TREE,'Build 120 final closure SHA/tree mismatch');req((closure.get('proofs')or{})==B120_PROOFS,'Build 120 final proof mismatch');req(closure.get('ingested_by_build')==121,'Build 120 closure must be ingested by Build 121');req('not self-recorded by Build 120' in str(closure.get('recorded_by')or''),'Build 120 non-self-recording provenance missing');pp=prior.get('production_checkpoint')or{};req(pp.get('main_sha')==B120_SHA and pp.get('tree_sha')==B120_TREE and pp.get('production_pages_deploy_run')==B120_PAGES and pp.get('production_live_resource_integrity_run')==B120_LIVE,'Build 120 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 121 must remain closure candidate');req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 121 must not self-claim later workflow proof')
for token in ('data-business-health-context-build','Return to Business Health','Copy review context','business_health_period','navigator.clipboard','document.execCommand','monthEndPeriod','monthEndRefresh','URL context only'):req(token in client,f'Build 121 client missing token: {token}')
for forbidden in ('localStorage','sessionStorage',"method:'POST'",'setInterval('):req(forbidden not in client,f'Build 121 client contains forbidden behavior: {forbidden}')
for path in ('admin/finance/index.html','admin/month-end/index.html','admin/project-profitability-reconciliation/index.html','admin/it/index.html'):
    body=read(path);req('admin-business-health-review-context-v121.js?v=467b121' in body,f'{path} missing Build 121 context client')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)];req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004');req('0005_' not in json.dumps(manifest),'Build 121 must not introduce migration 0005');req("run_current_contract('scripts/release467_build121_gate.py','Release 467 Build 121')" in provenance,'active System Gate provenance must call Build 121')
for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
    body=read(path)
    for token in (B120_SHA,B120_TREE,*[str(x) for x in B120_PROOFS.values()],str(B120_PAGES),str(B120_LIVE)):req(token in body,f'{path} missing Build 120 closure token {token}')
    req('Build 121' in body and 'Review Context Polish' in body,f'{path} missing Build 121 identity')
for path in ('public/js/admin-business-health-review-context-v121.js','functions/api/admin/it-operations-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-it-control-tower.js'):command(['node','--check',str(ROOT/path)],f'JavaScript syntax {path}')
command(['node','scripts/release467_build121_review_context_polish_test.mjs'],'Build 121 runtime/source proof')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 121 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 121 GATE: PASS');print('Build 120 six-proof closure: INGESTED BY BUILD 121');print('Business Health context polish: URL-ONLY / CLIPBOARD-ONLY / PERSISTENCE ZERO');print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
