#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build306-caip-content-adoption-outcomes-renewal-roadmap-renewal.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='605ca2409c9aa4f5a1b9882ebcf498e19c4ba806' and pred.get('development_tree_sha')=='8490cb65bbde1ac3e9698da8af13605f57419a9d','Build 305 Development predecessor mismatch')
q(pred.get('production_main_sha')=='436eb9fac8ee3d9ee1a25b8fdad9a3820ceaa34e' and pred.get('production_tree_sha')=='8490cb65bbde1ac3e9698da8af13605f57419a9d','Build 305 Production predecessor mismatch')
q((a.get('decision') or {}).get('classification')=='REAL_ADOPTION_PROVEN_COVERAGE_AND_DISCOVERY_GAPS_REMAIN','Build 306 measured decision mismatch')
s=a.get('safety') or {};q(s.get('schema_change') is False and s.get('production_d1_contact') is False and s.get('automatic_publication') is False and s.get('provider_execution') is False,'Build 306 safety boundary mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build306_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print(r.stdout,end='');q(r.returncode==0,'Build 306 regression failed')
q("run_current_contract('scripts/release467_build306_gate.py','Release 467 Build 306')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 306')
cur=int(p.get('build') or 0);q(cur>=306,'Current pointer must retain Build 306 or successor')
if cur==306:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==307,'Build 306 current authority state/successor mismatch')
print('RELEASE 467 BUILD 306 CAIP CONTENT ADOPTION OUTCOMES RENEWAL & ROADMAP RENEWAL')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 307 — Maker Story Review-State & Publication Traceability')
