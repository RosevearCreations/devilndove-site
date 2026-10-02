#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build350-35th-promo-factual-evidence-completion-continuity-v.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='af5070400e0b9fb0da8be48753dcfef7737230b8' and pred.get('development_tree_sha')=='c0f4a29f13d7f0bce5165f34a06c5140ec4f3ca1','Build 349 Development predecessor mismatch')
q(pred.get('production_main_sha')=='b4a2e20b96f7bbeea7a21136aa780d7425002891' and pred.get('production_tree_sha')=='c0f4a29f13d7f0bce5165f34a06c5140ec4f3ca1','Build 349 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build350_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 350 regression failed')
q("run_current_contract('scripts/release467_build350_gate.py','Release 467 Build 350')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 350')
cur=int(p.get('build') or 0);q(cur>=350,'Current pointer must retain Build 350 or successor')
if cur==350:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==351,'Build 350 current authority/successor mismatch')
print('RELEASE 467 BUILD 350 35TH PROMO FACTUAL EVIDENCE COMPLETION CONTINUITY V')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 351 — Grey Hair Source Review & Story-Plan Completion Continuity V')
