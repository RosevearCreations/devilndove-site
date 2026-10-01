#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build332-35th-promo-factual-evidence-completion-continuity-ii.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='5246cd2c0ea6ec6568c31f91f272e225d1e40cbe' and pred.get('development_tree_sha')=='269ea72e333d4ff7883121456d9b65aab83070c3','Build 331 Development predecessor mismatch')
q(pred.get('production_main_sha')=='0fce96f146d63411feb401b546c12b945ab861ac' and pred.get('production_tree_sha')=='269ea72e333d4ff7883121456d9b65aab83070c3','Build 331 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build332_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 332 regression failed')
q("run_current_contract('scripts/release467_build332_gate.py','Release 467 Build 332')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 332')
q(int(p.get('build') or 0)>=332,'Current pointer must retain Build 332 or successor')
print('RELEASE 467 BUILD 332 35TH PROMO FACTUAL EVIDENCE COMPLETION CONTINUITY II')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 333 — Grey Hair Source Review & Story-Plan Completion Continuity II')
