#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build305-buyer-discovery-search-measurement-activation.json');p=j('current-development-authority.json')
q((a.get('predecessor') or {}).get('development_sha')=='3dd7a39513f4dbea3d018675bbf9080397a811fc','Build 304 Development predecessor mismatch')
q((a.get('predecessor') or {}).get('production_main_sha')=='9666c57fd02b199359e2420db0f147c27e5c9386','Build 304 Production predecessor mismatch')
s=a.get('scope') or {};q(s.get('read_only_admin_measurement_surface') is True and s.get('indexnow_submission') is False and s.get('provider_execution') is False,'Build 305 measurement/provider boundary mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build305_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print(r.stdout,end='');q(r.returncode==0,'Build 305 regression failed')
q("run_current_contract('scripts/release467_build305_gate.py','Release 467 Build 305')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 305')
cur=int(p.get('build') or 0);q(cur>=305,'Current pointer must retain Build 305 or successor')
if cur==305:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==306,'Build 305 current authority state/successor mismatch')
print('RELEASE 467 BUILD 305 BUYER DISCOVERY & SEARCH MEASUREMENT ACTIVATION')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 306 — CAIP Content Adoption Outcomes Renewal & Roadmap Renewal')
