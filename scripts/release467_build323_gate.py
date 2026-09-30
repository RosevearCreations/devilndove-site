#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build323-maker-story-coverage-publication-readiness-continuity.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='ad8f82fa23c943303a04f6273b735c1091913cf3' and pred.get('development_tree_sha')=='3ba6acc882e399e0d3e6eb2b749ce8f43a215e9e','Build 322 Development predecessor mismatch')
q(pred.get('production_main_sha')=='1d7ef26655905c057c6c064ef7e2d7bf4c94f6a0' and pred.get('production_tree_sha')=='3ba6acc882e399e0d3e6eb2b749ce8f43a215e9e','Build 322 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build323_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 323 regression failed')
q("run_current_contract('scripts/release467_build323_gate.py','Release 467 Build 323')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 323')
cur=int(p.get('build') or 0);q(cur>=323,'Current pointer must retain Build 323 or successor')
if cur==323:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==324,'Build 323 current authority/successor mismatch')
print('RELEASE 467 BUILD 323 MAKER STORY COVERAGE & PUBLICATION READINESS CONTINUITY')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 324 — Content Adoption & Discovery Outcomes Renewal IV')
