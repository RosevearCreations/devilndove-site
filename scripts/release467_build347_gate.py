#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build347-maker-story-advancement-publication-readiness-continuity-v.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='0f58e0243b5f4ca4b78278972e76b3514a395414' and pred.get('development_tree_sha')=='19e7512f525608ce4a0e5dbf683be85d38a3165a','Build 346 Development predecessor mismatch')
q(pred.get('production_main_sha')=='f6f0d17f0cd8b7a879a8b771c236915fc39cb0c3' and pred.get('production_tree_sha')=='19e7512f525608ce4a0e5dbf683be85d38a3165a','Build 346 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build347_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 347 regression failed')
q("run_current_contract('scripts/release467_build347_gate.py','Release 467 Build 347')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 347')
cur=int(p.get('build') or 0);q(cur>=347,'Current pointer must retain Build 347 or successor')
if cur==347:q(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN') and int(p.get('next_build') or 0)==348,'Build 347 current authority/successor mismatch')
print('RELEASE 467 BUILD 347 MAKER STORY ADVANCEMENT & PUBLICATION READINESS CONTINUITY V')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 348 — Content Adoption & Discovery Outcomes Renewal VIII')
