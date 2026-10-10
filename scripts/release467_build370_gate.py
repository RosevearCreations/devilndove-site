#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build370-search-console-real-export-fresh-discovery-intake-x.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='6f07ff2876162f7ee0dda683cd67a06f4f2082b6' and pred.get('development_tree_sha')=='38ce92f73f710a302e2839055457ca156ca45cbb','Build 369 Development predecessor mismatch')
q(pred.get('production_main_sha')=='ac54e0062f126e5b54636bd28974aa406702cc1c' and pred.get('production_tree_sha')=='38ce92f73f710a302e2839055457ca156ca45cbb','Build 369 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build370_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 370 regression failed')
q("run_current_contract('scripts/release467_build370_gate.py','Release 467 Build 370')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 370')
cur=int(p.get('build') or 0);q(cur>=370,'Current pointer must retain Build 370 or successor')
if cur==370:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==371,'Build 370 current authority/successor mismatch')
print('RELEASE 467 BUILD 370 SEARCH CONSOLE REAL EXPORT & FRESH DISCOVERY INTAKE X')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 371 — Maker Story Advancement & Publication Readiness Continuity IX')
