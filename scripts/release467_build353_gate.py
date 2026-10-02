#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build353-maker-story-advancement-publication-readiness-continuity-vi.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='4767f4f041e35b1c6fc0cef51d7e83a2cd398b12' and pred.get('development_tree_sha')=='c15a2b9cd49d4fdd2f634e5298420cab806216eb','Build 352 Development predecessor mismatch')
q(pred.get('production_main_sha')=='7fbf874fafa2c0838a07d0101500311707cfc9fe' and pred.get('production_tree_sha')=='c15a2b9cd49d4fdd2f634e5298420cab806216eb','Build 352 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build353_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 353 regression failed')
q("run_current_contract('scripts/release467_build353_gate.py','Release 467 Build 353')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 353')
cur=int(p.get('build') or 0);q(cur>=353,'Current pointer must retain Build 353 or successor')
if cur==353:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==354,'Build 353 current authority/successor mismatch')
print('RELEASE 467 BUILD 353 MAKER STORY ADVANCEMENT & PUBLICATION READINESS CONTINUITY VI')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 354 — Content Adoption & Discovery Outcomes Renewal IX')
