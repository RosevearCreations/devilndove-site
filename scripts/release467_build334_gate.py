#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build334-search-console-real-export-fresh-discovery-intake-iv.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='ed3a8674ec5fd0e4363043034d694fdbb0a6822a' and pred.get('development_tree_sha')=='295ee32365ac51c2988181b63d8b83a6fcae3da3','Build 333 Development predecessor mismatch')
q(pred.get('production_main_sha')=='7b934186dcef69d76c9ad3dd6a25c4aed8ba4de4' and pred.get('production_tree_sha')=='295ee32365ac51c2988181b63d8b83a6fcae3da3','Build 333 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build334_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 334 regression failed')
q("run_current_contract('scripts/release467_build334_gate.py','Release 467 Build 334')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 334')
cur=int(p.get('build') or 0);q(cur>=334,'Current pointer must retain Build 334 or successor')
if cur==334:q(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN') and int(p.get('next_build') or 0)==335,'Build 334 current authority/successor mismatch')
print('RELEASE 467 BUILD 334 SEARCH CONSOLE REAL EXPORT & FRESH DISCOVERY INTAKE IV')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 335 — Maker Story Advancement & Publication Readiness Continuity III')
