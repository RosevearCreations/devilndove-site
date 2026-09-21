#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def q(x,m):
 if not x:F.append(m)
def l(p):return json.loads((R/p).read_text())
p=l('current-development-authority.json');b=l('release467-build225-storefront-launch-set-remediation-execution-ii.json');q(int(p.get('build',0))>=225,'pointer regressed');q(b.get('state')=='PRODUCTION_GREEN','Build 225 not Production GREEN');f=b.get('final_closure')or{};q(f.get('dev_sha')=='e759f09d069170fe04092651f87fe727d8ecdc80' and f.get('tree_sha')=='ba60ec9147def32da518f1c993f0099244e858f1','Build 225 dev closure drifted');z=b.get('production_checkpoint')or{};q(z.get('main_sha')=='82e819c33ef9d90ee440b73cb47ded1450cf9c2e' and z.get('state')=='PRODUCTION_GREEN','Build 225 prod closure drifted')
if F:print('BUILD 225 RETAINED: FAIL');[print('-',x) for x in F];sys.exit(1)
print('BUILD 225 RETAINED: PASS')
