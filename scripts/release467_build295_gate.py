#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build295-storefront-buyer-journey-simplification.json');p=j('current-development-authority.json');prev=j('release467-build294-caip-workshop-follies-maker-story-foundation.json')
q(a.get('release')==467 and a.get('build')==295 and a.get('title')=='Storefront Buyer Journey Simplification','Build 295 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 295 state mismatch')
pred=a.get('predecessor') or {};q(pred.get('development_sha')=='22b0cb7074c9e5cba4a2f1b335d031f61d457c09' and pred.get('development_tree_sha')=='3d4467f152bdd0e172e2ec512529b9c8bef578db','Build 294 Development predecessor mismatch');q(pred.get('production_main_sha')=='d731d823cbcf7708a6d978c9f399c2a72af55635' and pred.get('production_tree_sha')=='3d4467f152bdd0e172e2ec512529b9c8bef578db' and pred.get('same_tree') is True,'Build 294 Production predecessor mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 294 authority must be ingested as Production GREEN')
fc=prev.get('final_closure') or {};pc=prev.get('production_checkpoint') or {};q(fc.get('dev_sha')=='22b0cb7074c9e5cba4a2f1b335d031f61d457c09' and fc.get('tree_sha')=='3d4467f152bdd0e172e2ec512529b9c8bef578db' and fc.get('ingested_by_build')==295,'Build 294 final closure ingestion mismatch');q(pc.get('main_sha')=='d731d823cbcf7708a6d978c9f399c2a72af55635' and pc.get('tree_sha')=='3d4467f152bdd0e172e2ec512529b9c8bef578db' and pc.get('state')=='PRODUCTION_GREEN','Build 294 Production closure ingestion mismatch')
scope=a.get('scope') or {};q(scope.get('primary_paths')==['Shop something','Ask us to make something','Watch us try something'],'Build 295 three-path contract mismatch');q(scope.get('private_media_exposed') is False and scope.get('reviewed_publications_only') is True,'Build 295 public/private story boundary mismatch')
for path in ('js/main.js','public/js/shop.js','public/js/workshop-journal-publications.js','public/js/capability-case-studies.js','public/js/storefront-discovery-paths.js','public/js/storefront-evidence-conversion-audit.js'):
    n=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);q(n.returncode==0,path+' syntax failed: '+(n.stderr or n.stdout)[-1200:])
x=subprocess.run([sys.executable,str(R/'scripts/release467_build295_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(x.stdout,end='');print(x.stderr,end='',file=sys.stderr);q(x.returncode==0,'Build 295 buyer journey regression failed')
q("run_current_contract('scripts/release467_build295_gate.py','Release 467 Build 295')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 295');q(int(p.get('build') or 0)>=295,'Current authority must retain Build 295 or successor')
if int(p.get('build') or 0)==295:q(p.get('title')=='Storefront Buyer Journey Simplification' and p.get('state')=='DEVELOPMENT_GREEN','Current Build 295 pointer mismatch');q(int(p.get('next_build') or 0)==296 and p.get('next_build_title')=='Custom Work Progressive Intake','Build 295 successor pointer mismatch')
print('RELEASE 467 BUILD 295 STOREFRONT BUYER JOURNEY SIMPLIFICATION')
if F:print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Shop something → Ask us to make something → Watch us try something: ACTIVE');print('Next: Build 296 — Custom Work Progressive Intake')
