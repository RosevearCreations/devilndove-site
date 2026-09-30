#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build312-content-adoption-coverage-outcomes-renewal-ii-roadmap-renewal.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='9a785176369bc09d16c7a6d3748ac125f260bd91' and pred.get('development_tree_sha')=='c79e06aec8eeb2d0ec24e54021c359d31de8e469','Build 311 Development predecessor mismatch')
q(pred.get('production_main_sha')=='e6c48ac204393ee53859dc0366e36a13f15a5460' and pred.get('production_tree_sha')=='c79e06aec8eeb2d0ec24e54021c359d31de8e469','Build 311 Production predecessor mismatch')
s=a.get('safety') or {};q(s.get('schema_change') is False and s.get('production_d1_contact') is False and s.get('automatic_publication') is False and s.get('provider_execution') is False,'Build 312 safety boundary mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build312_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print(r.stdout,end='');q(r.returncode==0,'Build 312 regression failed')
q("run_current_contract('scripts/release467_build312_gate.py','Release 467 Build 312')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 312')
cur=int(p.get('build') or 0);q(cur>=312,'Current pointer must retain Build 312 or successor')
if cur==312:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==313,'Build 312 current authority state/successor mismatch')
print('RELEASE 467 BUILD 312 CONTENT ADOPTION COVERAGE OUTCOMES RENEWAL II & ROADMAP RENEWAL')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 313 — Second Maker Story Review Decision & Completeness')
