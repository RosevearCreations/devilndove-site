#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
DEV='2fae62c9b5f78e31d8325bd63d93c1674a11c3c6';TREE='396b3491620307b041cda8ac066f97ea44f2b0ef';MAIN='5da8e2457ec64a9a54523bd56eb523c9abd5ec8c'
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build299-d1-query-efficiency-canonical-runtime-repository-cleanup.json')
p=j('current-development-authority.json')
prev=j('release467-build298-merchant-search-distribution-public-content-discovery.json')
q(a.get('build')==299 and a.get('title')=='D1 Query Efficiency + Canonical Runtime/Repository Cleanup','Build 299 identity mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')==DEV and pred.get('development_tree_sha')==TREE,'Build 298 Development predecessor mismatch')
q((pred.get('development_proofs') or {}).get('system_gate_run')==36623313387 and (pred.get('development_proofs') or {}).get('build_specific_proof_run')==36623313494,'Build 298 Development proofs mismatch')
q(pred.get('production_main_sha')==MAIN and pred.get('production_tree_sha')==TREE,'Build 298 Production predecessor mismatch')
q(pred.get('production_pages_deploy_run')==36624396660 and pred.get('production_live_resource_integrity_run')==36624531016,'Build 298 Production proofs mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 298 closure not ingested')
q((prev.get('final_closure') or {}).get('ingested_by_build')==299,'Build 298 Development closure ingestion mismatch')
q((prev.get('production_checkpoint') or {}).get('ingested_by_build')==299,'Build 298 Production closure ingestion mismatch')
scope=a.get('scope') or {}
q(scope.get('batched_schema_snapshot') is True,'Build 299 batched schema snapshot missing')
q(scope.get('development_provider_measurement') is True,'Build 299 provider measurement contract missing')
q((scope.get('repository_cleanup') or {}).get('historical_release_evidence_preserved') is True,'Build 299 release-evidence preservation missing')
for path in ('functions/api/_lib/schemaColumnSnapshot.js','functions/api/products.js','functions/api/product-detail.js','functions/api/featured-products.js','functions/api/admin/universal-search.js','functions/api/creations.js','functions/api/workshop-journal.js','functions/api/capabilities.js'):
    r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    q(r.returncode==0,path+' syntax failed: '+(r.stderr or r.stdout)[-1000:])
r=subprocess.run([sys.executable,str(R/'scripts/release467_build299_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 299 regression failed')
q("run_current_contract('scripts/release467_build299_gate.py','Release 467 Build 299')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 299')
q(int(p.get('build') or 0)>=299,'Current authority must retain Build 299 or successor')
if int(p.get('build') or 0)==299:
    q(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE,'Build 299 starting checkpoint mismatch')
    q(int(p.get('next_build') or 0)==300,'Build 300 successor pointer missing')
print('RELEASE 467 BUILD 299 D1 QUERY EFFICIENCY + CANONICAL RUNTIME/REPOSITORY CLEANUP')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 300 — CAIP Maker Content Outcomes Renewal & Automation Refinement')
