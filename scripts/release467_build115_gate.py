#!/usr/bin/env python3
"""Release 467 Build 115 — Business Health Review Packs & Owner Handoff gate."""
from pathlib import Path
import json,re,subprocess,sys

ROOT=Path(__file__).resolve().parents[1];FAIL=[]
B114_SHA='5ff61e8391437c5d3369c38f5bf4a1088babc63c';B114_TREE='7d7c0ebf9cfa51452438e9d46fd98b3e3550926f'
B114_PROOFS={'system_gate_run':34697432158,'current_application_quality_run':34697432135,'it_admin_runtime_proof_run':34697432119,'branch_hygiene_run':34697432225}
B114_PAGES=34697511211;B114_LIVE=34697551264
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']

def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(read(path))
def command(args,label):
    result=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if result.stdout.strip(): print(result.stdout.strip())
    if result.returncode!=0: FAIL.append(f"{label} failed: {(result.stderr or result.stdout).strip()[-3000:]}")

pointer=load('current-development-authority.json')
prior=load('release467-build114-business-health-action-queue.json')
current=load('release467-build115-business-health-review-packs.json')
manifest=load('migrations/canonical/manifest.json')
queue_helper=read('functions/api/_lib/businessHealthActionQueue.js')
queue_endpoint=read('functions/api/admin/business-health-action-queue.js')
helper=read('functions/api/_lib/businessHealthReviewPacks.js')
endpoint=read('functions/api/admin/business-health-review-packs.js')
client=read('public/js/admin-business-health-review-packs-v115.js')
page=read('admin/business-health/index.html')
provenance=read('scripts/current_system_gate_provenance_gate.py')

req(pointer.get('release')==467 and pointer.get('build')==115,'current pointer must identify Release 467 Build 115')
req(pointer.get('title')=='Business Health Review Packs & Owner Handoff','Build 115 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==B114_SHA and pointer.get('accepted_dev_tree_sha')==B114_TREE,'Build 115 accepted baseline must be exact Build 114')
req((pointer.get('acceptance')or{})==B114_PROOFS,'Build 115 inherited four-proof baseline mismatch')
last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{}
req(last.get('build')==114 and last.get('dev_sha')==B114_SHA and last.get('tree_sha')==B114_TREE,'restart integrity must identify exact Build 114')
req((last.get('proofs')or{})==B114_PROOFS,'restart Build 114 proof set drifted')
prod=pointer.get('production_checkpoint')or{}
req(prod.get('build')==114 and prod.get('main_sha')==B114_SHA and prod.get('tree_sha')==B114_TREE,'Production baseline must be exact Build 114')
req(prod.get('production_pages_deploy_run')==B114_PAGES and prod.get('production_live_resource_integrity_run')==B114_LIVE,'Build 114 Production proof IDs drifted')

req(prior.get('state')=='PRODUCTION_GREEN','Build 114 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{}
req(closure.get('dev_sha')==B114_SHA and closure.get('tree_sha')==B114_TREE,'Build 114 final closure SHA/tree mismatch')
req((closure.get('proofs')or{})==B114_PROOFS,'Build 114 final proof mismatch')
req(closure.get('ingested_by_build')==115,'Build 114 closure must be ingested by Build 115')
req('not self-recorded by Build 114' in str(closure.get('recorded_by')or''),'Build 114 non-self-recording provenance missing')
pp=prior.get('production_checkpoint')or{}
req(pp.get('main_sha')==B114_SHA and pp.get('tree_sha')==B114_TREE and pp.get('production_pages_deploy_run')==B114_PAGES and pp.get('production_live_resource_integrity_run')==B114_LIVE,'Build 114 Production closure mismatch')

req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 115 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 115 must not self-claim later workflow proof')
start=(current.get('starting_point')or{}).get('development')or{}
req(start.get('sha')==B114_SHA and start.get('tree')==B114_TREE,'Build 115 starting Development identity mismatch')

for token in ('BUSINESS_HEALTH_REVIEW_PACKS_BUILD','handoffKey','reviewSteps','evidence_present','human_review_required',"handoff_mode:'human-review-only'","acknowledgement_persistence:false","mutation_capability:'none'",'automatic_business_action:false','accounting_posting:false','period_close:false','inventory_mutation:false','creative_mutation:false','price_mutation:false','provider_execution:false'):
    req(token in helper,f'Build 115 helper missing token: {token}')
for forbidden in (r'\bfetch\s*\(',r'\bdb\.',r'\blocalStorage\.',r'\bsessionStorage\.',r'\bsetInterval\s*\('):
    req(not re.search(forbidden,helper),f'Build 115 pure helper gained forbidden behavior: {forbidden}')

for token in ('loadRelease465BusinessHealth','buildBusinessHealthActionQueue','buildBusinessHealthReviewPacks',"role:'read_only_business_health_review_packs'","handoff_mode:'human-review-only'","acknowledgement_persistence:false",'automatic_business_action:false','accounting_posting:false','period_close:false','inventory_mutation:false','creative_mutation:false','price_mutation:false'):
    req(token in endpoint,f'Build 115 endpoint missing token: {token}')
req('onRequestPost' not in endpoint,'Build 115 endpoint must expose no POST handler')
for forbidden in ('UPDATE ','INSERT ','DELETE ','CREATE TABLE','ALTER TABLE','DROP TABLE'):
    req(forbidden not in endpoint.upper(),f'Build 115 endpoint contains forbidden DML/DDL: {forbidden}')

for token in ('b115ReviewPacks','data-business-health-review-packs-build="115"','admin-business-health-review-packs-v115.js?v=467b115','Build 115 safety boundary'):
    req(token in page,f'Business Health page missing Build 115 token: {token}')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Business Health page must retain exactly one H1')
req('/api/admin/business-health-review-packs' in client and "method:'GET'" in client and "method:'POST'" not in client,'Build 115 client must remain GET-only')
req('human review required' in client and 'acknowledgement is not persisted' in client,'Build 115 client must expose the human-handoff boundary')

req('BUSINESS_HEALTH_ACTION_QUEUE_BUILD=114' in queue_helper,'Build 114 action queue helper identity drifted')
req('onRequestPost' not in queue_endpoint,'Build 114 action queue endpoint must remain GET-only')
req("mutation_capability:'none'" in queue_helper and 'automatic_business_action:false' in queue_helper,'Build 114 review-only queue boundary drifted')

files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004')
req('0005_' not in json.dumps(manifest),'Build 115 must not introduce migration 0005')
req("run_current_contract('scripts/release467_build115_gate.py','Release 467 Build 115')" in provenance,'active System Gate provenance must call Build 115')
req("run_current_contract('scripts/release467_build114_gate.py','Release 467 Build 114')" not in provenance,'Build 114 must no longer be current provenance gate')

for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
    body=read(path)
    for token in (B114_SHA,B114_TREE,*[str(x) for x in B114_PROOFS.values()],str(B114_PAGES),str(B114_LIVE)):
        req(token in body,f'{path} missing Build 114 closure token {token}')
    req('Build 115' in body and 'Business Health Review Packs' in body,f'{path} missing Build 115 identity')

for path in ('functions/api/_lib/businessHealthReviewPacks.js','functions/api/admin/business-health-review-packs.js','public/js/admin-business-health-review-packs-v115.js','functions/api/admin/it-operations-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-it-control-tower.js'):
    command(['node','--check',str(ROOT/path)],f'JavaScript syntax {path}')
command(['node','scripts/release467_build115_business_health_review_packs_test.mjs'],'Build 115 runtime proof')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')):
    command([sys.executable,path],label)

if FAIL:
    print('RELEASE 467 BUILD 115 GATE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 115 GATE: PASS')
print('Build 114 six-proof closure: INGESTED BY BUILD 115')
print('Business Health review packs: READ-ONLY / HUMAN-HANDOFF ONLY')
print('Automatic business action / acknowledgement persistence / Accounting / Inventory / Creative / provider mutation: ZERO')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
