#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build344-35th-promo-factual-evidence-completion-continuity-iv.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='9ba28adc49ce04cf69fd6e7d3a3c12d5b376d8fe' and pred.get('development_tree_sha')=='719649ad678aabd932bd43414db87bc234d7fc92','Build 343 Development predecessor mismatch')
q(pred.get('production_main_sha')=='b3db71eeb5bea3ed4f1428d96c18120b9e51c9bb' and pred.get('production_tree_sha')=='719649ad678aabd932bd43414db87bc234d7fc92','Build 343 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build344_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 344 regression failed')
q("run_current_contract('scripts/release467_build344_gate.py','Release 467 Build 344')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 344')
cur=int(p.get('build') or 0);q(cur>=344,'Current pointer must retain Build 344 or successor')
if cur==344:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==345,'Build 344 current authority/successor mismatch')
print('RELEASE 467 BUILD 344 35TH PROMO FACTUAL EVIDENCE COMPLETION CONTINUITY IV')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 345 — Grey Hair Source Review & Story-Plan Completion Continuity IV')
