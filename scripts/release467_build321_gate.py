#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build321-search-console-real-export-intake-continuity-ii.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='a5348eea48616a934a2994309d0738f05d706af9' and pred.get('development_tree_sha')=='1bf94721855837958a546e033e0bead0f3f97580','Build 320 Development predecessor mismatch')
q(pred.get('production_main_sha')=='e84cda2db64f0af93aa1f88cc71fb7079fe5fd54' and pred.get('production_tree_sha')=='1bf94721855837958a546e033e0bead0f3f97580','Build 320 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build321_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 321 regression failed')
q("run_current_contract('scripts/release467_build321_gate.py','Release 467 Build 321')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 321')
cur=int(p.get('build') or 0);q(cur>=321,'Current pointer must retain Build 321 or successor')
if cur==321:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==322,'Build 321 current authority/successor mismatch')
print('RELEASE 467 BUILD 321 SEARCH CONSOLE REAL EXPORT INTAKE CONTINUITY II')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 322 — Buyer Discovery Attribution & SEO Review Evidence Continuity')
