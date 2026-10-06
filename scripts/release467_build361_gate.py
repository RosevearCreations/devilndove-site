#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build361-evidence-gap-execution-workbench-input-completion-continuity-vi.json')
p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='19cebb7c763cfe8fd9d65a16da020bebe1d92cfc' and pred.get('development_tree_sha')=='7e4c57f601c41ed38c784b1023afbed3e5ff94eb','Build 360 Development predecessor mismatch')
q(pred.get('production_main_sha')=='1123ed75b3ad7eeffebaabaaadb1c4d41aaff038' and pred.get('production_tree_sha')=='7e4c57f601c41ed38c784b1023afbed3e5ff94eb','Build 360 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build361_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print(r.stdout,end='');q(r.returncode==0,'Build 361 regression failed')
q("run_current_contract('scripts/release467_build361_gate.py','Release 467 Build 361')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 361')
cur=int(p.get('build') or 0);q(cur>=361,'Current pointer must retain Build 361 or successor')
if cur==361:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==362,'Build 361 current authority/successor mismatch')
print('RELEASE 467 BUILD 361 EVIDENCE GAP EXECUTION WORKBENCH & INPUT COMPLETION CONTINUITY VI')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 362 — 35th Promo Factual Evidence Completion Continuity VII')
