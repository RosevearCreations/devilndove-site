#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build326-35th-promo-real-outcome-evidence-closure.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='0da51ee0e377c81909ed9c90627ca206026027b1' and pred.get('development_tree_sha')=='b38a0844c106d2ff27ff50de306a61c4d325f724','Build 325 Development predecessor mismatch')
q(pred.get('production_main_sha')=='782627bb0bc0850622abc42512e3886f5556efbd' and pred.get('production_tree_sha')=='b38a0844c106d2ff27ff50de306a61c4d325f724','Build 325 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build326_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 326 regression failed')
q("run_current_contract('scripts/release467_build326_gate.py','Release 467 Build 326')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 326')
q(int(p.get('build') or 0)>=326,'Current pointer must retain Build 326 or successor')
print('RELEASE 467 BUILD 326 35TH PROMO REAL OUTCOME EVIDENCE CLOSURE')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 327 — Grey Hair Evidence Review Completion & Story-Plan Handoff')
