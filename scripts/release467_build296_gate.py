#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
DEV='653a1952cee1a78aa131180fc798a45f4de344b0';TREE='7fc2c8c8147acd76b3ab64a8c62a96da5ac55ce3';MAIN='9da8d3c7dc6ace186de0d69141e19fed998f5ddf'
PROOFS={'system_gate_run':36588836053,'current_application_quality_run':36588836007,'it_admin_runtime_proof_run':36588836018,'branch_hygiene_run':36588836078}
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build296-custom-work-progressive-intake.json');p=j('current-development-authority.json');prev=j('release467-build295-storefront-buyer-journey-simplification.json')
q(a.get('release')==467 and a.get('build')==296 and a.get('title')=='Custom Work Progressive Intake','Build 296 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 296 state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')==DEV and pred.get('development_tree_sha')==TREE,'Build 295 Development predecessor mismatch')
q((pred.get('development_proofs') or {}).get('system_gate_run')==36588836053 and (pred.get('development_proofs') or {}).get('build_specific_proof_run')==36588836000,'Build 295 Development proof ingestion mismatch')
q(pred.get('production_main_sha')==MAIN and pred.get('production_tree_sha')==TREE and pred.get('same_tree') is True,'Build 295 Production predecessor mismatch')
q(pred.get('production_pages_deploy_run')==36589115627 and pred.get('production_live_resource_integrity_run')==36589247196,'Build 295 Production proof ingestion mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 295 authority must be ingested as Production GREEN')
fc=prev.get('final_closure') or {};pc=prev.get('production_checkpoint') or {}
q(fc.get('dev_sha')==DEV and fc.get('tree_sha')==TREE and fc.get('ingested_by_build')==296,'Build 295 final closure ingestion mismatch')
q((fc.get('proofs') or {})==PROOFS and fc.get('build_specific_proof_run')==36588836000,'Build 295 exact Development proof set mismatch')
q(pc.get('main_sha')==MAIN and pc.get('tree_sha')==TREE and pc.get('state')=='PRODUCTION_GREEN' and pc.get('ingested_by_build')==296,'Build 295 Production closure ingestion mismatch')
q(pc.get('production_pages_deploy_run')==36589115627 and pc.get('production_live_resource_integrity_run')==36589247196,'Build 295 Production closure proof mismatch')
scope=a.get('scope') or {}
q(scope.get('minimal_required_fields')==['message','name','email','consent_to_contact'],'Build 296 minimal required-field contract mismatch')
q(scope.get('technical_fields_progressive') is True and scope.get('customer_supplied_item_conditional') is True,'Build 296 progressive/conditional contract mismatch')
q(scope.get('tab_local_draft_recovery') is True and scope.get('draft_file_storage') is False,'Build 296 draft safety contract mismatch')
for path in ('functions/api/custom-request.js','public/js/custom-request-intake.js'):
    n=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);q(n.returncode==0,path+' syntax failed: '+(n.stderr or n.stdout)[-1200:])
x=subprocess.run([sys.executable,str(R/'scripts/release467_build296_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(x.stdout,end='');print(x.stderr,end='',file=sys.stderr);q(x.returncode==0,'Build 296 progressive intake regression failed')
q("run_current_contract('scripts/release467_build296_gate.py','Release 467 Build 296')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 296')
q(int(p.get('build') or 0)>=296,'Current authority must retain Build 296 or successor')
if int(p.get('build') or 0)==296:
    q(p.get('title')=='Custom Work Progressive Intake' and p.get('state')=='DEVELOPMENT_GREEN','Current Build 296 pointer mismatch')
    q(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE,'Build 296 starting Development checkpoint mismatch')
    q((p.get('production_checkpoint') or {}).get('main_sha')==MAIN and (p.get('production_checkpoint') or {}).get('tree_sha')==TREE,'Build 296 Production predecessor pointer mismatch')
    q(int(p.get('next_build') or 0)==297 and p.get('next_build_title')=='Search-First HTML, Product + Story SEO & Crawl Control','Build 296 successor pointer mismatch')
print('RELEASE 467 BUILD 296 CUSTOM WORK PROGRESSIVE INTAKE')
if F:print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Outcome-first progressive intake: ACTIVE')
print('Existing Custom Work / supplied-item / media authorities: REUSED')
print('Next: Build 297 — Search-First HTML, Product + Story SEO & Crawl Control')
