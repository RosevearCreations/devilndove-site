#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build356-35th-promo-factual-evidence-completion-continuity-vi.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='31599bca8ead283f46a18bedbc19640c85f66faa' and pred.get('development_tree_sha')=='3be26b7b2497b1420c630c5ca891eda0a4aea0be','Build 355 Development predecessor mismatch')
q(pred.get('production_main_sha')=='1ee3dc44c7f51da27f5cb9e61960896db839df06' and pred.get('production_tree_sha')=='3be26b7b2497b1420c630c5ca891eda0a4aea0be','Build 355 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build356_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 356 regression failed')
q("run_current_contract('scripts/release467_build356_gate.py','Release 467 Build 356')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 356')
cur=int(p.get('build') or 0);q(cur>=356,'Current pointer must retain Build 356 or successor')
if cur==356:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==357,'Build 356 current authority/successor mismatch')
print('RELEASE 467 BUILD 356 35TH PROMO FACTUAL EVIDENCE COMPLETION CONTINUITY VI')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 357 — Grey Hair Source Review & Story-Plan Completion Continuity VI')
