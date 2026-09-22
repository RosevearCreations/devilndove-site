#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def q(x,m):
 if not x:F.append(m)
def l(p):return json.loads((R/p).read_text())
p=l('current-development-authority.json');b=l('release467-build226-capability-profile-coverage-closure.json');m=l('migrations/canonical/manifest.json')
q(int(p.get('build',0))>=226,'pointer regressed')
q(b.get('state')=='PRODUCTION_GREEN','Build 226 not Production GREEN')
f=b.get('final_closure')or{};q(f.get('dev_sha')=='a3f220deb8c4cef7a2143ab1960c2ea33454ad6d' and f.get('tree_sha')=='c21821ae1ac1ba931b1f38e8fb3b9641bd3b4b3f','Build 226 dev closure drifted')
z=b.get('production_checkpoint')or{};q(z.get('main_sha')=='8a4adf0a9108f482edd7aaa0c2f7e27d843a9d2e' and z.get('state')=='PRODUCTION_GREEN','Build 226 prod closure drifted')
q(int(z.get('production_pages_deploy_run')or 0)==35668227904 and int(z.get('production_live_resource_integrity_run')or 0)==35668338010,'Build 226 Production deploy/live proof drifted')
q(int(z.get('products_browser_proof_run')or 0)==35668337892 and int(z.get('products_route_proof_run')or 0)==35668337966 and int(z.get('build_specific_proof_run')or 0)==35668227824,'Build 226 downstream proof drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];q(len(files)>=22 and files[21]=='0022_release467_capability_profile_coverage_closure.sql','Build 226 canonical migration retention drifted')
if F:print('BUILD 226 RETAINED: FAIL');[print('-',x) for x in F];sys.exit(1)
print('BUILD 226 RETAINED: PASS')
