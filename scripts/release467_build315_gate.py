#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build315-search-console-operator-intake-acceptance.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='59ca2152c7782b33e376b659d26e36e3388ebb05' and pred.get('development_tree_sha')=='9d31caa6f6a18bdac8236fe158d711f0e898b622','Build 314 Development predecessor mismatch')
q(pred.get('production_main_sha')=='8bea4144e1a50d43b85e94218ce7f878a6023904' and pred.get('production_tree_sha')=='9d31caa6f6a18bdac8236fe158d711f0e898b622','Build 314 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build315_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 315 regression failed')
q("run_current_contract('scripts/release467_build315_gate.py','Release 467 Build 315')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 315')
cur=int(p.get('build') or 0);q(cur>=315,'Current pointer must retain Build 315 or successor')
if cur==315:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==316,'Build 315 current authority/successor mismatch')
print('RELEASE 467 BUILD 315 SEARCH CONSOLE OPERATOR INTAKE ACCEPTANCE')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 316 — Buyer Discovery Evidence Interpretation & SEO Review Queue')
