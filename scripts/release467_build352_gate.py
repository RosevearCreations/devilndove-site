#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build352-search-console-real-export-fresh-discovery-intake-vii.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='b2c5f5113dddf57e95ce866ab37140c26d2a8a3c' and pred.get('development_tree_sha')=='57234a69014e86988ecb859130d9e2985776ea96','Build 351 Development predecessor mismatch')
q(pred.get('production_main_sha')=='39b9550eba5a91c28d426e8556d09946cd739098' and pred.get('production_tree_sha')=='57234a69014e86988ecb859130d9e2985776ea96','Build 351 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build352_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 352 regression failed')
q("run_current_contract('scripts/release467_build352_gate.py','Release 467 Build 352')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 352')
cur=int(p.get('build') or 0);q(cur>=352,'Current pointer must retain Build 352 or successor')
if cur==352:q(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN') and int(p.get('next_build') or 0)==353,'Build 352 current authority/successor mismatch')
print('RELEASE 467 BUILD 352 SEARCH CONSOLE REAL EXPORT & FRESH DISCOVERY INTAKE VII')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 353 — Maker Story Advancement & Publication Readiness Continuity VI')
