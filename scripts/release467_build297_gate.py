#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
DEV='8b9a556e5d267f6c333032a1af64d1bb776bcf49';TREE='65ab192e1dfb0b8f14ab88b9136d3bc925f6292d';MAIN='120b5b607bfe3b7ddcf36abf4aefaad772477ba9'
PROOFS={'system_gate_run':36614334975,'current_application_quality_run':36614334938,'it_admin_runtime_proof_run':36614334896,'branch_hygiene_run':36614335013}
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build297-search-first-html-product-story-seo-crawl-control.json')
p=j('current-development-authority.json')
prev=j('release467-build296-custom-work-progressive-intake.json')
q(a.get('release')==467 and a.get('build')==297 and a.get('title')=='Search-First HTML, Product + Story SEO & Crawl Control','Build 297 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 297 state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')==DEV and pred.get('development_tree_sha')==TREE,'Build 296 Development predecessor mismatch')
q((pred.get('development_proofs') or {}).get('system_gate_run')==36614334975 and (pred.get('development_proofs') or {}).get('build_specific_proof_run')==36614335058,'Build 296 Development proof ingestion mismatch')
q(pred.get('production_main_sha')==MAIN and pred.get('production_tree_sha')==TREE and pred.get('same_tree') is True,'Build 296 Production predecessor mismatch')
q(pred.get('production_pages_deploy_run')==36614590327 and pred.get('production_live_resource_integrity_run')==36614722378,'Build 296 Production proof ingestion mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 296 authority must be ingested as Production GREEN')
fc=prev.get('final_closure') or {};pc=prev.get('production_checkpoint') or {}
q(fc.get('dev_sha')==DEV and fc.get('tree_sha')==TREE and fc.get('ingested_by_build')==297,'Build 296 final closure ingestion mismatch')
q((fc.get('proofs') or {})==PROOFS and fc.get('build_specific_proof_run')==36614335058,'Build 296 exact Development proof set mismatch')
q(pc.get('main_sha')==MAIN and pc.get('tree_sha')==TREE and pc.get('state')=='PRODUCTION_GREEN' and pc.get('ingested_by_build')==297,'Build 296 Production closure ingestion mismatch')
q(pc.get('production_pages_deploy_run')==36614590327 and pc.get('production_live_resource_integrity_run')==36614722378,'Build 296 Production closure proof mismatch')
scope=a.get('scope') or {}
q(scope.get('product_initial_html_metadata') is True and scope.get('story_initial_html_metadata') is True,'Build 297 initial HTML contract mismatch')
q(scope.get('published_records_only') is True and scope.get('missing_or_unpublished_dynamic_urls_noindex') is True,'Build 297 published-only index contract mismatch')
q(scope.get('browser_snapshot_reuse') is True and scope.get('duplicate_initial_product_read') is False and scope.get('duplicate_initial_story_read') is False,'Build 297 snapshot/read contract mismatch')
for path in ('functions/_middleware.js','functions/api/_lib/publicSearchSeo.js','public/js/product-detail-v166.js','public/js/workshop-journal-story.js','public/js/seo-page-overrides.js'):
    n=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    q(n.returncode==0,path+' syntax failed: '+(n.stderr or n.stdout)[-1200:])
x=subprocess.run([sys.executable,str(R/'scripts/release467_build297_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print(x.stdout,end='');print(x.stderr,end='',file=sys.stderr);q(x.returncode==0,'Build 297 regression failed')
q("run_current_contract('scripts/release467_build297_gate.py','Release 467 Build 297')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 297')
q(int(p.get('build') or 0)>=297,'Current authority must retain Build 297 or successor')
if int(p.get('build') or 0)==297:
    q(p.get('title')=='Search-First HTML, Product + Story SEO & Crawl Control' and p.get('state')=='DEVELOPMENT_GREEN','Current Build 297 pointer mismatch')
    q(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE,'Build 297 starting Development checkpoint mismatch')
    q((p.get('production_checkpoint') or {}).get('main_sha')==MAIN and (p.get('production_checkpoint') or {}).get('tree_sha')==TREE,'Build 297 Production predecessor pointer mismatch')
    q(int(p.get('next_build') or 0)==298 and p.get('next_build_title')=='Merchant/Search Distribution + Public Content Discovery','Build 297 successor pointer mismatch')
print('RELEASE 467 BUILD 297 SEARCH-FIRST HTML, PRODUCT + STORY SEO & CRAWL CONTROL')
if F:
    print('FAIL')
    [print('-',x) for x in F]
    sys.exit(1)
print('PASS')
print('Initial dynamic search identity: SERVER HTML')
print('Dynamic sitemap: PUBLISHED PRODUCTS + REVIEWED STORIES')
print('Next: Build 298 — Merchant/Search Distribution + Public Content Discovery')
