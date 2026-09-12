#!/usr/bin/env python3
"""Release 467 Build 116 — Business Health Operator Briefs & Export gate."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
B115_SHA='7cff6e22b273ffb4db40828dfcbf9f0d52b46c60';B115_TREE='f0dffdc1c6c293cde5482cc6a36da2a6ce1614b0'
B115_PROOFS={'system_gate_run':34698543554,'current_application_quality_run':34698543577,'it_admin_runtime_proof_run':34698543545,'branch_hygiene_run':34698543556}
B115_PAGES=34698623248;B115_LIVE=34698665721
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(read(path))
def command(args,label):
    result=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if result.stdout.strip(): print(result.stdout.strip())
    if result.returncode!=0: FAIL.append(f"{label} failed: {(result.stderr or result.stdout).strip()[-3000:]}")
pointer=load('current-development-authority.json');prior=load('release467-build115-business-health-review-packs.json');current=load('release467-build116-business-health-operator-briefs.json');manifest=load('migrations/canonical/manifest.json')
pack_helper=read('functions/api/_lib/businessHealthReviewPacks.js');helper=read('functions/api/_lib/businessHealthOperatorBriefs.js');endpoint=read('functions/api/admin/business-health-operator-briefs.js');client=read('public/js/admin-business-health-operator-briefs-v116.js');page=read('admin/business-health/index.html');provenance=read('scripts/current_system_gate_provenance_gate.py')
req(pointer.get('release')==467 and pointer.get('build')==116,'current pointer must identify Release 467 Build 116')
req(pointer.get('title')=='Business Health Operator Briefs & Export','Build 116 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain inherited Development GREEN state')
req(pointer.get('accepted_dev_sha')==B115_SHA and pointer.get('accepted_dev_tree_sha')==B115_TREE,'Build 116 accepted baseline must be exact Build 115')
req((pointer.get('acceptance')or{})==B115_PROOFS,'Build 116 inherited four-proof baseline mismatch')
last=(pointer.get('restart_integrity')or{}).get('last_fully_verified')or{}
req(last.get('build')==115 and last.get('dev_sha')==B115_SHA and last.get('tree_sha')==B115_TREE,'restart integrity must identify exact Build 115')
req((last.get('proofs')or{})==B115_PROOFS,'restart Build 115 proof set drifted')
prod=pointer.get('production_checkpoint')or{}
req(prod.get('build')==115 and prod.get('main_sha')==B115_SHA and prod.get('tree_sha')==B115_TREE,'Production baseline must be exact Build 115')
req(prod.get('production_pages_deploy_run')==B115_PAGES and prod.get('production_live_resource_integrity_run')==B115_LIVE,'Build 115 Production proof IDs drifted')
req(prior.get('state')=='PRODUCTION_GREEN','Build 115 must be ingested as Production GREEN')
closure=prior.get('final_closure')or{}
req(closure.get('dev_sha')==B115_SHA and closure.get('tree_sha')==B115_TREE,'Build 115 final closure SHA/tree mismatch')
req((closure.get('proofs')or{})==B115_PROOFS,'Build 115 final proof mismatch')
req(closure.get('ingested_by_build')==116,'Build 115 closure must be ingested by Build 116')
req('not self-recorded by Build 115' in str(closure.get('recorded_by')or''),'Build 115 non-self-recording provenance missing')
pp=prior.get('production_checkpoint')or{}
req(pp.get('main_sha')==B115_SHA and pp.get('tree_sha')==B115_TREE and pp.get('production_pages_deploy_run')==B115_PAGES and pp.get('production_live_resource_integrity_run')==B115_LIVE,'Build 115 Production closure mismatch')
req(current.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 116 must remain closure candidate')
req(current.get('final_closure') is None and current.get('production_checkpoint') is None,'Build 116 must not self-claim later workflow proof')
start=(current.get('starting_point')or{}).get('development')or{}
req(start.get('sha')==B115_SHA and start.get('tree')==B115_TREE,'Build 116 starting Development identity mismatch')
for token in ('BUSINESS_HEALTH_OPERATOR_BRIEFS_BUILD','ownerBrief','review_plan','combined_markdown',"export_mode:'read-only-download'","server_persistence:false","acknowledgement_persistence:false","resolution_persistence:false","mutation_capability:'none'",'automatic_business_action:false','accounting_posting:false','period_close:false','inventory_mutation:false','creative_mutation:false','price_mutation:false','provider_execution:false'):
    req(token in helper,f'Build 116 helper missing token: {token}')
for forbidden in (r'\bfetch\s*\(',r'\bdb\.',r'\blocalStorage\.',r'\bsessionStorage\.',r'\bsetInterval\s*\('): req(not re.search(forbidden,helper),f'Build 116 pure helper gained forbidden behavior: {forbidden}')
for token in ('loadRelease465BusinessHealth','buildBusinessHealthActionQueue','buildBusinessHealthReviewPacks','buildBusinessHealthOperatorBriefs',"role:'read_only_business_health_operator_briefs'",'format===\'markdown\'',"server_persistence:false","acknowledgement_persistence:false","resolution_persistence:false"):
    req(token in endpoint,f'Build 116 endpoint missing token: {token}')
req('onRequestPost' not in endpoint,'Build 116 endpoint must expose no POST handler')
for forbidden in ('UPDATE ','INSERT ','DELETE ','CREATE TABLE','ALTER TABLE','DROP TABLE'): req(forbidden not in endpoint.upper(),f'Build 116 endpoint contains forbidden DML/DDL: {forbidden}')
for token in ('b116OperatorBriefs','b116Export','data-business-health-operator-briefs-build="116"','admin-business-health-operator-briefs-v116.js?v=467b116','Build 116 safety boundary'):
    req(token in page,f'Business Health page missing Build 116 token: {token}')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Business Health page must retain exactly one H1')
req('/api/admin/business-health-operator-briefs' in client and "method:'GET'" in client and "method:'POST'" not in client,'Build 116 client must remain GET-only')
req('format=markdown' in client and 'new Blob' in client and 'No acknowledgement or resolution state was stored' in client,'Build 116 client must expose read-only export boundary')
req('BUSINESS_HEALTH_REVIEW_PACKS_BUILD=115' in pack_helper,'Build 115 review-pack helper identity drifted')
files=[str(row.get('file')or'') for row in(manifest.get('migrations')or[]) if isinstance(row,dict)]
req(files==EXPECTED,'canonical D1 migration stream must remain exactly 0001-0004');req('0005_' not in json.dumps(manifest),'Build 116 must not introduce migration 0005')
req("run_current_contract('scripts/release467_build116_gate.py','Release 467 Build 116')" in provenance,'active System Gate provenance must call Build 116')
req("run_current_contract('scripts/release467_build115_gate.py','Release 467 Build 115')" not in provenance,'Build 115 must no longer be current provenance gate')
for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
    body=read(path)
    for token in (B115_SHA,B115_TREE,*[str(x) for x in B115_PROOFS.values()],str(B115_PAGES),str(B115_LIVE)): req(token in body,f'{path} missing Build 115 closure token {token}')
    req('Build 116' in body and 'Business Health Operator Briefs' in body,f'{path} missing Build 116 identity')
for path in ('functions/api/_lib/businessHealthOperatorBriefs.js','functions/api/admin/business-health-operator-briefs.js','public/js/admin-business-health-operator-briefs-v116.js','functions/api/admin/it-operations-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','public/js/admin-it-control-tower.js'):
    command(['node','--check',str(ROOT/path)],f'JavaScript syntax {path}')
command(['node','scripts/release467_build116_business_health_operator_briefs_test.mjs'],'Build 116 runtime proof')
for path,label in (('scripts/current_authority_restart_integrity_gate.py','restart integrity'),('scripts/current_it_release_truth_gate.py','I.T. truth'),('scripts/current_reliability_truth_gate.py','Reliability truth'),('scripts/current_deployment_preflight_truth_gate.py','Deployment Preflight truth')): command([sys.executable,path],label)
if FAIL:
    print('RELEASE 467 BUILD 116 GATE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 116 GATE: PASS')
print('Build 115 six-proof closure: INGESTED BY BUILD 116')
print('Business Health operator briefs / Markdown export: READ-ONLY / HUMAN-REVIEW ONLY')
print('Server persistence / acknowledgement / resolution / Accounting / Inventory / Creative / provider mutation: ZERO')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
