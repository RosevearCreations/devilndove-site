#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build330-content-adoption-discovery-outcomes-renewal-v.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='aaeeb829d092d0174db29084e35380d83c0d620c' and pred.get('development_tree_sha')=='8310fde78f64bfb80aa2169c9a60a33685cd3d6e','Build 329 Development predecessor mismatch')
q(pred.get('production_main_sha')=='05bf93a1deba88f4222397f7288cae2851fc7278' and pred.get('production_tree_sha')=='8310fde78f64bfb80aa2169c9a60a33685cd3d6e','Build 329 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build330_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 330 regression failed')
q("run_current_contract('scripts/release467_build330_gate.py','Release 467 Build 330')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 330')
cur=int(p.get('build') or 0);q(cur>=330,'Current pointer must retain Build 330 or successor')
if F:
 print('RELEASE 467 BUILD 330 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL V');print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('RELEASE 467 BUILD 330 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL V');print('PASS')
