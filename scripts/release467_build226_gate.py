#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def q(x,m):
 if not x:F.append(m)
def t(p):return (R/p).read_text(encoding='utf-8')
def l(p):return json.loads(t(p))
p=l('current-development-authority.json');b=l('release467-build226-capability-profile-coverage-closure.json');m=l('migrations/canonical/manifest.json');x=t('migrations/canonical/0022_release467_capability_profile_coverage_closure.sql');a=t('functions/api/admin/workshop-capabilities.js');u=t('public/js/admin-workshop-capabilities.js');h=t('admin/workshop-capabilities/index.html');s=t('scripts/current_system_gate_provenance_gate.py');d=t('docs/operations/RELEASE_467_BUILD_226_CAPABILITY_PROFILE_COVERAGE_CLOSURE.md')
q(p.get('build')==226 and p.get('title')=='Capability Profile Coverage Closure','pointer identity');q(b.get('state')=='DEVELOPMENT_CANDIDATE','candidate state');q((b.get('measured_baseline')or{}).get('uncovered_process_key')=='photography-content','gap identity');files=[r.get('file') for r in m.get('migrations',[])];q(len(files)==22 and files[-1]=='0022_release467_capability_profile_coverage_closure.sql','migration stream');q('CREATE TABLE' not in x.upper() and 'ALTER TABLE' not in x.upper(),'data-only migration');q("'photography-content'" in x and "'Photography & Content'" in x and "'unmeasured'" in x and "'reviewed'" in x,'profile seed');q('coverage_closure_build:226' in a and 'uncovered_active_processes' in a,'coverage API');q('Release 467 Build 226' in h and len(re.findall(r'<h1(?:\s|>)',h,re.I))==1,'page identity');q('No uncovered active canonical processes remain' in u,'coverage UI');q("run_current_contract('scripts/release467_build226_gate.py','Release 467 Build 226')" in s,'system provenance');q('22 / 22' in d and 'Builds **227–232** remain planned' in d,'doc')
for z in ('functions/api/admin/workshop-capabilities.js','public/js/admin-workshop-capabilities.js'):
 r=subprocess.run(['node','--check',str(R/z)],capture_output=True,text=True);q(r.returncode==0,z+' syntax')
if F:print('BUILD 226: FAIL');[print('-',x) for x in F];sys.exit(1)
print('BUILD 226: PASS')
