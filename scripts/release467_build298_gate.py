#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
DEV='24c2a0dc4f81b4323d96387b1f5a7109e976c226';TREE='22da804600e5d53151e06a4136b4a3c65d96a88f';MAIN='043799f8d89a6df392b4416a7908da4f9d92d537'
PROOFS={'system_gate_run':36617176553,'current_application_quality_run':36617176471,'it_admin_runtime_proof_run':36617176516,'branch_hygiene_run':36617176437}
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build298-merchant-search-distribution-public-content-discovery.json');p=j('current-development-authority.json');prev=j('release467-build297-search-first-html-product-story-seo-crawl-control.json')
q(a.get('build')==298 and a.get('title')=='Merchant/Search Distribution + Public Content Discovery','Build 298 identity mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')==DEV and pred.get('development_tree_sha')==TREE,'Build 297 Development predecessor mismatch')
q((pred.get('development_proofs') or {}).get('build_specific_proof_run')==36617176420,'Build 297 dedicated proof mismatch')
q(pred.get('production_main_sha')==MAIN and pred.get('production_tree_sha')==TREE,'Build 297 Production predecessor mismatch')
q(pred.get('production_pages_deploy_run')==36617412141 and pred.get('production_live_resource_integrity_run')==36617524593,'Build 297 Production proofs mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 297 closure not ingested')
q((prev.get('final_closure') or {}).get('ingested_by_build')==298,'Build 297 Development closure ingestion mismatch')
q((prev.get('production_checkpoint') or {}).get('ingested_by_build')==298,'Build 297 Production closure ingestion mismatch')
for path in ('functions/api/_lib/merchantSearchDistribution.js','functions/api/merchant-feed.js','functions/api/admin/merchant-search-distribution.js','public/js/admin-merchant-search-distribution.js','functions/api/_lib/publicSearchSeo.js','functions/_middleware.js'):
    r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);q(r.returncode==0,path+' syntax failed: '+(r.stderr or r.stdout)[-1000:])
r=subprocess.run([sys.executable,str(R/'scripts/release467_build298_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 298 regression failed')
q("run_current_contract('scripts/release467_build298_gate.py','Release 467 Build 298')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 298')
q(int(p.get('build') or 0)>=298,'Current authority must retain Build 298 or successor')
if int(p.get('build') or 0)==298:
    q(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE,'Build 298 starting checkpoint mismatch')
    q(int(p.get('next_build') or 0)==299,'Build 299 successor pointer missing')
print('RELEASE 467 BUILD 298 MERCHANT/SEARCH DISTRIBUTION + PUBLIC CONTENT DISCOVERY')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 299 — D1 Query Efficiency + Canonical Runtime/Repository Cleanup')
