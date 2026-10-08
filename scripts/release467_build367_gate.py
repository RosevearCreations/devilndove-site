#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build367-evidence-gap-execution-workbench-input-completion-continuity-vii.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='d8773c0c92614d6633a1986db94a0b130d80c355' and pred.get('development_tree_sha')=='a9d5e384883142e0eedbc0a378e1567b0bdd3c0f','Build 366 Development predecessor mismatch')
q(pred.get('production_main_sha')=='55df0d4682c5b068906c9f2c5788de47f15e873f' and pred.get('production_tree_sha')=='a9d5e384883142e0eedbc0a378e1567b0bdd3c0f','Build 366 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build367_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 367 regression failed')
cur=int(p.get('build') or 0);q(cur>=366,'Current pointer must retain Build 366 staging or Build 367 successor')
if cur>=367:q("run_current_contract('scripts/release467_build367_gate.py','Release 467 Build 367')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 367')
print('RELEASE 467 BUILD 367 EVIDENCE GAP EXECUTION WORKBENCH & INPUT COMPLETION CONTINUITY VII')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
