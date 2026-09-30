#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build322-buyer-discovery-attribution-seo-review-evidence-continuity.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='215b9277f62d1359fda07d3d72ba3cf6ee47a353' and pred.get('development_tree_sha')=='7df16d3a91159cefaf66435854fdffb4914ad921','Build 321 Development predecessor mismatch')
q(pred.get('production_main_sha')=='e761df76426a52e7bc3553189988058037979ad2' and pred.get('production_tree_sha')=='7df16d3a91159cefaf66435854fdffb4914ad921','Build 321 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build322_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 322 regression failed')
q("run_current_contract('scripts/release467_build322_gate.py','Release 467 Build 322')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 322')
cur=int(p.get('build') or 0);q(cur>=322,'Current pointer must retain Build 322 or successor')
if cur==322:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==323,'Build 322 current authority/successor mismatch')
print('RELEASE 467 BUILD 322 BUYER DISCOVERY ATTRIBUTION & SEO REVIEW EVIDENCE CONTINUITY')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 323 — Maker Story Coverage & Publication Readiness Continuity')
