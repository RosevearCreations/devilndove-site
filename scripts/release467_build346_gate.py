#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build346-search-console-real-export-fresh-discovery-intake-vi.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='3ce6012f969d55fa13e917bfb00c8611f3452028' and pred.get('development_tree_sha')=='cd32fc6b82a7da8a645ca7a435d684b04e12e816','Build 345 Development predecessor mismatch')
q(pred.get('production_main_sha')=='8f435c2285f51d33e22ce1165227ea03b0abc50c' and pred.get('production_tree_sha')=='cd32fc6b82a7da8a645ca7a435d684b04e12e816','Build 345 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build346_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 346 regression failed')
q("run_current_contract('scripts/release467_build346_gate.py','Release 467 Build 346')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 346')
cur=int(p.get('build') or 0);q(cur>=346,'Current pointer must retain Build 346 or successor')
if cur==346:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==347,'Build 346 current authority/successor mismatch')
print('RELEASE 467 BUILD 346 SEARCH CONSOLE REAL EXPORT & FRESH DISCOVERY INTAKE VI')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 347 — Maker Story Advancement & Publication Readiness Continuity V')
