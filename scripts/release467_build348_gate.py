#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build348-content-adoption-discovery-outcomes-renewal-viii.json')
p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='2983bc6bf9e3a5376340e022183ab17f51c2ee4b' and pred.get('development_tree_sha')=='51d1c8d3fee195d238d99a2500025d546f3dee14','Build 347 Development predecessor mismatch')
q(pred.get('production_main_sha')=='ec311f0e54f0aa6b2d2eafb7a8b6c668cf194fae' and pred.get('production_tree_sha')=='51d1c8d3fee195d238d99a2500025d546f3dee14','Build 347 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build348_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print(r.stdout,end='');q(r.returncode==0,'Build 348 regression failed')
q("run_current_contract('scripts/release467_build348_gate.py','Release 467 Build 348')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 348')
cur=int(p.get('build') or 0);q(cur>=348,'Current pointer must retain Build 348 or successor')
if cur==348:q(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN'),'Build 348 current authority state mismatch')
print('RELEASE 467 BUILD 348 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL VIII')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
