#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build313-second-maker-story-review-decision-completeness.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='0045b29b0635d91f1c6d03b784c841b19fffc763' and pred.get('development_tree_sha')=='391c869e0587fe2f865d85af781a06296f07ef8d','Build 312 Development predecessor mismatch')
q(pred.get('production_main_sha')=='c5e7bb72ec990118057d6955223e60ddaf691eac' and pred.get('production_tree_sha')=='391c869e0587fe2f865d85af781a06296f07ef8d','Build 312 Production predecessor mismatch')
s=a.get('safety') or {};q(s.get('schema_change') is False and s.get('production_d1_contact') is False and s.get('publication_mutation') is False and s.get('provider_execution') is False,'Build 313 safety boundary mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build313_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 313 regression failed')
q("run_current_contract('scripts/release467_build313_gate.py','Release 467 Build 313')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 313')
cur=int(p.get('build') or 0);q(cur>=313,'Current pointer must retain Build 313 or successor')
if cur==313:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==314,'Build 313 current authority/successor mismatch')
print('RELEASE 467 BUILD 313 SECOND MAKER STORY REVIEW DECISION & COMPLETENESS')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 314 — Second Story Publication Readiness & Review-Queue Continuity')
