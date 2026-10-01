#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build328-search-console-real-export-freshness-discovery-intake-iii.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='26577d73b3747ffc2c02e31e11df86b924abdb2f' and pred.get('development_tree_sha')=='935849941e1a9907487abcf984505233f9bfb803','Build 327 Development predecessor mismatch')
q(pred.get('production_main_sha')=='f5675f69194586933fe0fefa231bde9f249216ce' and pred.get('production_tree_sha')=='935849941e1a9907487abcf984505233f9bfb803','Build 327 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build328_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 328 regression failed')
q("run_current_contract('scripts/release467_build328_gate.py','Release 467 Build 328')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 328')
cur=int(p.get('build') or 0);q(cur>=328,'Current pointer must retain Build 328 or successor')
if cur==328:q(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN') and int(p.get('next_build') or 0)==329,'Build 328 current authority/successor mismatch')
print('RELEASE 467 BUILD 328 SEARCH CONSOLE REAL EXPORT FRESHNESS & DISCOVERY INTAKE III')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 329 — Maker Story Advancement & Publication Readiness Continuity II')
