#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build354-content-adoption-discovery-outcomes-renewal-ix.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='2076cc66d5ae860de62bf9775820e5dc228e491c' and pred.get('development_tree_sha')=='56cc33ace347ddfb1ca779c805711dc19cc7eabb','Build 353 Development predecessor mismatch')
q(pred.get('production_main_sha')=='8139d25fa79937e1b0acb141f88186878fe0e964' and pred.get('production_tree_sha')=='56cc33ace347ddfb1ca779c805711dc19cc7eabb','Build 353 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build354_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 354 regression failed')
q("run_current_contract('scripts/release467_build354_gate.py','Release 467 Build 354')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 354')
cur=int(p.get('build') or 0);q(cur>=354,'Current pointer must retain Build 354 or successor')
if cur==354:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==355,'Build 354 current authority/successor mismatch')
print('RELEASE 467 BUILD 354 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL IX')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 355 — Evidence Gap Execution Workbench & Input Completion Continuity V')
