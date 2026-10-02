#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build342-content-adoption-discovery-outcomes-renewal-vii.json')
p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='84074c82d258c26d313a28a4b4735382c812a9dd' and pred.get('development_tree_sha')=='5e9a649b6f6eb8e8bb2a10d7c17b417c9b63d985','Build 341 Development predecessor mismatch')
q(pred.get('production_main_sha')=='ff5b1106ee5515106fd501909461fc4078f24edd' and pred.get('production_tree_sha')=='5e9a649b6f6eb8e8bb2a10d7c17b417c9b63d985','Build 341 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build342_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print(r.stdout,end='');q(r.returncode==0,'Build 342 regression failed')
q("run_current_contract('scripts/release467_build342_gate.py','Release 467 Build 342')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 342')
cur=int(p.get('build') or 0);q(cur>=342,'Current pointer must retain Build 342 or successor')
if cur==342:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==343,'Build 342 current authority/successor mismatch')
print('RELEASE 467 BUILD 342 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL VII')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
