#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build324-content-adoption-discovery-outcomes-renewal-iv.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='88db75c27e6817212fbed809294bd593ab049bb2' and pred.get('development_tree_sha')=='9116bd69e701e15e464f5ea4c9a4e41d43c37974','Build 323 Development predecessor mismatch')
q(pred.get('production_main_sha')=='14418df3be9d34baa3dd3436777f7911f022f39b' and pred.get('production_tree_sha')=='9116bd69e701e15e464f5ea4c9a4e41d43c37974','Build 323 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build324_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 324 regression failed')
q("run_current_contract('scripts/release467_build324_gate.py','Release 467 Build 324')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 324')
q(int(p.get('build') or 0)>=324,'Current pointer must retain Build 324 or successor')
print('RELEASE 467 BUILD 324 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL IV')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
