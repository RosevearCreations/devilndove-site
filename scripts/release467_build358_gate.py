#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build358-search-console-real-export-fresh-discovery-intake-viii.json')
p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='9d508a74417c1007891d4877c35140d351d51faf' and pred.get('development_tree_sha')=='78aeaa4e11119620ebf71f264ec84b7939dd4adc','Build 357 Development predecessor mismatch')
q(pred.get('production_main_sha')=='f4806249d913fb779c734f332bfb05019c6c6f1b' and pred.get('production_tree_sha')=='78aeaa4e11119620ebf71f264ec84b7939dd4adc','Build 357 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build358_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print(r.stdout,end='')
q(r.returncode==0,'Build 358 regression failed')
q("run_current_contract('scripts/release467_build358_gate.py','Release 467 Build 358')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 358')
cur=int(p.get('build') or 0)
q(cur>=358,'Current pointer must retain Build 358 or successor')
if cur==358:
    q(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN') and int(p.get('next_build') or 0)==359,'Build 358 current authority/successor mismatch')
print('RELEASE 467 BUILD 358 SEARCH CONSOLE REAL EXPORT & FRESH DISCOVERY INTAKE VIII')
if F:
    print('FAIL')
    [print('-',x) for x in F]
    sys.exit(1)
print('PASS')
print('Next: Build 359 — Maker Story Advancement & Publication Readiness Continuity VII')
