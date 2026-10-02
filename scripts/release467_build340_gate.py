#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build340-search-console-real-export-fresh-discovery-intake-v.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='71230f3cc4b6518f4f0e61068db2edd0fdf4db50' and pred.get('development_tree_sha')=='2420704c0619bbf645ee600d80d8f29b8d9ba4cb','Build 339 Development predecessor mismatch')
q(pred.get('production_main_sha')=='8c7ff02b4748ebca9a0f5773ffe34589d5890305' and pred.get('production_tree_sha')=='2420704c0619bbf645ee600d80d8f29b8d9ba4cb','Build 339 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build340_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 340 regression failed')
q("run_current_contract('scripts/release467_build340_gate.py','Release 467 Build 340')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 340')
cur=int(p.get('build') or 0);q(cur>=340,'Current pointer must retain Build 340 or successor')
if cur==340:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==341,'Build 340 current authority/successor mismatch')
print('RELEASE 467 BUILD 340 SEARCH CONSOLE REAL EXPORT & FRESH DISCOVERY INTAKE V')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 341 — Maker Story Advancement & Publication Readiness Continuity IV')
