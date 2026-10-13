#!/usr/bin/env python3
"""Build 384: system-wide bounded analytics, customer-safe write acknowledgements and duplicate prevention."""
from pathlib import Path
import subprocess,json,sys
R=Path(__file__).resolve().parents[1];fail=[]
def text(path):return (R/path).read_text(encoding='utf-8')
def check(ok,msg):
 if not ok:fail.append(msg)
pointer=json.loads(text('current-development-authority.json'))
manifest=json.loads(text('migrations/canonical/manifest.json'))
check(pointer.get('build',0)>=384,'Current development pointer must be Build 384+')
check(len(manifest['migrations'])==35 and manifest['migrations'][-1]['version']==35,'Build 384 is intentionally schema-neutral and preserves 0035')
auth=text('public/js/auth.js');alias=text('public/js/admin-auth.js');main=text('js/main.js')
check(auth==alias,'Legacy admin-auth alias must remain cookie-first and exactly identical')
check('admin-action-ack-v384.js' in auth and 'admin-action-ack-v384.js' in main,'Shared admin action acknowledgement loader')
check(text('admin/index.html').lstrip().lower().startswith('<!doctype html>'),'Correct Admin homepage document preamble')
ack=text('public/js/admin-action-ack-v384.js')
for x in ('Mutation' if False else 'inflight','button.disabled=true','aria-busy','Saving…','Updating…','Deleting…','OK — action completed successfully','result is unknown','is already being processed','response.clone().json()'):
 check(x in ack,'Missing action guard '+x)
api=text('functions/api/admin/system-operations-analytics.js')
for x in ('getAdminUserFromRequest','SELECT','LIMIT 101','cache_persistence:false','automation_policy','execution_enabled:false','d1_mutation:false','onRequestGet'):
 check(x in api,'Missing read boundary '+x)
for banned in ('export async function onRequestPost','INSERT INTO ','UPDATE ','DELETE FROM ','CREATE TABLE','ALTER TABLE'):
 check(banned not in api,'Analytics write not permitted '+banned)
for p in ('public/js/admin-action-ack-v384.js','public/js/admin-system-operations.js',
 'public/js/admin-auth.js','public/js/auth.js','js/main.js','functions/api/admin/system-operations-analytics.js','functions/api/admin/_lib/operationsAnalytics.js'):
 done=subprocess.run(['node','--check',str(R/p)],capture_output=True,text=True)
 check(done.returncode==0,'Syntax '+p+': '+done.stderr[-250:])
for name in ('analytics','action'):
 t=subprocess.run(['node','--test',f'scripts/release467_build384_{name}.test.mjs'],cwd=R,capture_output=True,text=True)
 check(t.returncode==0,f'{name} tests '+t.stderr[-200:]+t.stdout[-200:])
print('RELEASE467_BUILD384_REGRESSION='+('FAIL' if fail else 'GREEN'))
for e in fail:print('-',e)
sys.exit(bool(fail))
