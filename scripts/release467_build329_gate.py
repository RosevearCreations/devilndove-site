#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build329-maker-story-advancement-publication-readiness-continuity-ii.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='d6bf534016c85e4fa295aa6fbdaa12efb4659647' and pred.get('development_tree_sha')=='3f456f3d9cd2cde9ecf809c4530a0a46bbd45e4e','Build 328 Development predecessor mismatch');q(pred.get('production_main_sha')=='13210bde05ea77607095f532681d78024758bd23' and pred.get('production_tree_sha')=='3f456f3d9cd2cde9ecf809c4530a0a46bbd45e4e','Build 328 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build329_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 329 regression failed');q("run_current_contract('scripts/release467_build329_gate.py','Release 467 Build 329')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 329');cur=int(p.get('build') or 0);q(cur>=329,'Current pointer must retain Build 329 or successor')
if cur==329:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==330,'Build 329 current authority/successor mismatch')
print('RELEASE 467 BUILD 329 MAKER STORY ADVANCEMENT & PUBLICATION READINESS CONTINUITY II')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 330 — Content Adoption & Discovery Outcomes Renewal V')
