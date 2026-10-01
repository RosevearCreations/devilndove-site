#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build335-maker-story-advancement-publication-readiness-continuity-iii.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='e18b37a22fb5e4f0e58e8d5e240d922c499fabec' and pred.get('development_tree_sha')=='192445094dd80dd19570b86ad989cfffea1d4fdf','Build 334 Development predecessor mismatch')
q(pred.get('production_main_sha')=='2840cdc2ee09a2a585ec003e5f57bdc0c08cbc6c' and pred.get('production_tree_sha')=='192445094dd80dd19570b86ad989cfffea1d4fdf','Build 334 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build335_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 335 regression failed')
q("run_current_contract('scripts/release467_build335_gate.py','Release 467 Build 335')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 335')
cur=int(p.get('build') or 0);q(cur>=335,'Current pointer must retain Build 335 or successor')
if cur==335:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==336,'Build 335 current authority/successor mismatch')
print('RELEASE 467 BUILD 335 MAKER STORY ADVANCEMENT & PUBLICATION READINESS CONTINUITY III')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 336 — Content Adoption & Discovery Outcomes Renewal VI')
