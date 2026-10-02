#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build343-evidence-gap-execution-workbench-input-completion-continuity-iii.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='b2f8eb3d841de26b3200fde135be0cf35c71872c' and pred.get('development_tree_sha')=='80139d90a4bd0835f694ceb25292184ca009930c','Build 342 Development predecessor mismatch')
q(pred.get('production_main_sha')=='c884556bd869b55d721ea82ab6ac141d816f74ca' and pred.get('production_tree_sha')=='80139d90a4bd0835f694ceb25292184ca009930c','Build 342 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build343_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 343 regression failed')
q("run_current_contract('scripts/release467_build343_gate.py','Release 467 Build 343')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 343')
cur=int(p.get('build') or 0);q(cur>=343,'Current pointer must retain Build 343 or successor')
if cur==343:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==344,'Build 343 current authority/successor mismatch')
print('RELEASE 467 BUILD 343 EVIDENCE GAP EXECUTION WORKBENCH & INPUT COMPLETION CONTINUITY III')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 344 — 35th Promo Factual Evidence Completion Continuity IV')
