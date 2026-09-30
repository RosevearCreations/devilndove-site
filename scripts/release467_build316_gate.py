#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build316-buyer-discovery-evidence-interpretation-seo-review-queue.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='2a7c1aa8d90b4851073f50d67b87d5e199ea303d' and pred.get('development_tree_sha')=='4f1816b0700157ac1c71d170d08a0116af19eac4','Build 315 Development predecessor mismatch')
q(pred.get('production_main_sha')=='7c8605c627c25443df24d08b5ffecb3fa315c084' and pred.get('production_tree_sha')=='4f1816b0700157ac1c71d170d08a0116af19eac4','Build 315 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build316_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 316 regression failed')
q("run_current_contract('scripts/release467_build316_gate.py','Release 467 Build 316')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 316')
cur=int(p.get('build') or 0);q(cur>=316,'Current pointer must retain Build 316 or successor')
if cur==316:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==317,'Build 316 current authority/successor mismatch')
print('RELEASE 467 BUILD 316 BUYER DISCOVERY EVIDENCE INTERPRETATION & SEO REVIEW QUEUE')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 317 — Third Project Maker Story Readiness & Evidence Selection')
