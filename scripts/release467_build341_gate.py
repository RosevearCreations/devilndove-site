#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build341-maker-story-advancement-publication-readiness-continuity-iv.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='5e2c1d53ce8f96c29c526f78378a73f9c451c956' and pred.get('development_tree_sha')=='dfa4b627095b7f5c7fb4777bb6c38c1d0309b629','Build 340 Development predecessor mismatch')
q(pred.get('production_main_sha')=='104034bea4060c1696708cec8e145c7398525889' and pred.get('production_tree_sha')=='dfa4b627095b7f5c7fb4777bb6c38c1d0309b629','Build 340 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build341_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 341 regression failed')
q("run_current_contract('scripts/release467_build341_gate.py','Release 467 Build 341')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 341')
cur=int(p.get('build') or 0);q(cur>=341,'Current pointer must retain Build 341 or successor')
if cur==341:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==342,'Build 341 current authority/successor mismatch')
print('RELEASE 467 BUILD 341 MAKER STORY ADVANCEMENT & PUBLICATION READINESS CONTINUITY IV')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 342 — Content Adoption & Discovery Outcomes Renewal VII')
