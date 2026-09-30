#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build314-second-story-publication-readiness-review-queue-continuity.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='6d62f2b7f8876715d3dc6a9afa2da9b1999979a3' and pred.get('development_tree_sha')=='323d985b6385ee103552a51723b087187010ab53','Build 313 Development predecessor mismatch')
q(pred.get('production_main_sha')=='14375bce8e1749b309e60ef3baf1804ee01bdc47' and pred.get('production_tree_sha')=='323d985b6385ee103552a51723b087187010ab53','Build 313 Production predecessor mismatch')
s=a.get('safety') or {};q(s.get('schema_change') is False and s.get('d1_mutation') is False and s.get('publication_mutation') is False and s.get('social_mutation') is False and s.get('provider_execution') is False and s.get('production_d1_contact') is False,'Build 314 safety boundary mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build314_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 314 regression failed')
q("run_current_contract('scripts/release467_build314_gate.py','Release 467 Build 314')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 314')
cur=int(p.get('build') or 0);q(cur>=314,'Current pointer must retain Build 314 or successor')
if cur==314:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==315,'Build 314 current authority/successor mismatch')
print('RELEASE 467 BUILD 314 SECOND STORY PUBLICATION READINESS & REVIEW-QUEUE CONTINUITY')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 315 — Search Console Operator Intake Acceptance')
