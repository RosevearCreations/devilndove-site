#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build366-content-adoption-discovery-outcomes-renewal-xi.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='5e12ea170eaec46c1d64d5e7d53772417fc31ab6' and pred.get('development_tree_sha')=='3106fd7364176d9eeb07ce76ed3a60bb6f25d62e','Build 365 Development predecessor mismatch')
q(pred.get('production_main_sha')=='712011d85d54ae3183b455bcbc7a55082dc46528' and pred.get('production_tree_sha')=='3106fd7364176d9eeb07ce76ed3a60bb6f25d62e','Build 365 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build366_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 366 regression failed')
q("run_current_contract('scripts/release467_build366_gate.py','Release 467 Build 366')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 366')
cur=int(p.get('build') or 0);q(cur>=366,'Current pointer must retain Build 366 or successor')
if cur==366:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==367,'Build 366 current authority/successor mismatch')
print('RELEASE 467 BUILD 366 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL XI')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next roadmap is selected from exact Development evidence.')
