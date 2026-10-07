#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build364-search-console-real-export-fresh-discovery-intake-ix.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='6a7cb2ad960f84b045ae62e52a8abd94fb69280f' and pred.get('development_tree_sha')=='8a43776566a46245931c9cb4ac3049a770d76a8c','Build 363 Development predecessor mismatch')
q(pred.get('production_main_sha')=='33577629d67159d23888c59b3aa7fb2f52cc98e8' and pred.get('production_tree_sha')=='8a43776566a46245931c9cb4ac3049a770d76a8c','Build 363 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build364_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 364 regression failed')
q("run_current_contract('scripts/release467_build364_gate.py','Release 467 Build 364')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 364')
cur=int(p.get('build') or 0);q(cur>=364,'Current pointer must retain Build 364 or successor')
if cur==364:q(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN') and int(p.get('next_build') or 0)==365,'Build 364 current authority/successor mismatch')
print('RELEASE 467 BUILD 364 SEARCH CONSOLE REAL EXPORT & FRESH DISCOVERY INTAKE IX')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 365 — Maker Story Advancement & Publication Readiness Continuity VIII')
