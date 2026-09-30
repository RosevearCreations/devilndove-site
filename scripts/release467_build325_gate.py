#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build325-evidence-gap-owner-queue-operator-action-traceability.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='1ed7d181bea85004b181b93f1ba97e300946c575' and pred.get('development_tree_sha')=='1408954e028fbb8faa54ead2860c0e2b71b31588','Build 324 Development predecessor mismatch')
q(pred.get('production_main_sha')=='06e40c332b1bacf2260f954ff2ac79a25d9788cc' and pred.get('production_tree_sha')=='1408954e028fbb8faa54ead2860c0e2b71b31588','Build 324 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build325_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 325 regression failed')
q("run_current_contract('scripts/release467_build325_gate.py','Release 467 Build 325')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 325')
q(int(p.get('build') or 0)>=325,'Current pointer must retain Build 325 or successor')
print('RELEASE 467 BUILD 325 EVIDENCE GAP OWNER QUEUE & OPERATOR ACTION TRACEABILITY')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 326 — 35th Promo Real Outcome Evidence Closure')
