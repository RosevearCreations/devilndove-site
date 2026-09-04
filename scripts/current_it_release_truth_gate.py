#!/usr/bin/env python3
"""Release-neutral guard that keeps I.T. current-release truth synchronized."""
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]

def req(ok,msg):
    if not ok: FAIL.append(msg)

def load(path):
    return json.loads((ROOT/path).read_text(encoding='utf-8'))

def read(path):
    return (ROOT/path).read_text(encoding='utf-8')

pointer=load('current-development-authority.json')
b32=load('release467-build32-help-search-responsive-convergence.json')
api=read('functions/api/admin/it-operations-control-tower.js')
client=read('public/js/admin-it-control-tower.js')
page=read('admin/it/index.html')

release=int(pointer.get('release') or 0)
build=int(pointer.get('build') or 0)
title=str(pointer.get('title') or '')
prod=pointer.get('production_baseline') or {}
baseline=pointer.get('accepted_baseline') or {}

req(release==467,'current pointer must remain Release 467')
req(build>=33,'I.T. release-truth guard requires Build 33 or newer')
api_build=re.search(r'const BUILD\s*=\s*(\d+)\s*;',api)
req(api_build and int(api_build.group(1))==build,'I.T. API build must match current-development-authority build')
req(title and title in api,'I.T. API title must match current-development-authority title')
req(f'Release 467 Build {build}' in client,'I.T. client must identify the current build')
req(f'Release 467 Build {build}' in page,'I.T. page must identify the current build')

for key in ('main_sha','tree_sha','production_pages_deploy_run'):
    value=str(prod.get(key) or '')
    req(value and value in api,f'I.T. API missing current Production baseline {key}')
for key in ('dev_sha','tree_sha','system_gate_run','current_application_quality_run'):
    value=str(baseline.get(key) or '')
    req(value and value in api,f'I.T. API missing accepted baseline {key}')

req(b32.get('state')=='PRODUCTION_GREEN','Build 32 authority must record Production GREEN')
req((b32.get('production') or {}).get('main_sha')==prod.get('main_sha'),'Build 32 Production main must match current pointer baseline')
req((b32.get('production') or {}).get('tree_sha')==prod.get('tree_sha'),'Build 32 Production tree must match current pointer baseline')
req((b32.get('production') or {}).get('production_pages_deploy_run')==prod.get('production_pages_deploy_run'),'Build 32 Production deploy run must match current pointer baseline')
req(prod.get('tree_sha')==baseline.get('tree_sha'),'accepted Development baseline and Production baseline must share the exact tree')

for stale in ('73c852a71dc900a3a70cc84d0b622dfdc0c174fd','055cbc973c667b35a209c7ea207779089f6fed3a'):
    req(stale not in api,'stale Build 22/20 release SHA remains in current I.T. API')
    req(stale not in client,'stale Build 22/20 release SHA remains in current I.T. client')
    req(stale not in page,'stale Build 22/20 release SHA remains in current I.T. page')

req('onRequestPost' not in api,'current I.T. release-truth endpoint must remain read-only')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'I.T. page must contain exactly one H1')
req('/api/admin/it-operations-control-tower' in client,'I.T. client must use the current release-truth endpoint')
req('Production GREEN authority' in client,'I.T. client must expose explicit Production GREEN authority')
req('External acceptance policy' in client,'I.T. client must preserve external acceptance separation')

if FAIL:
    print('CURRENT I.T. RELEASE TRUTH GATE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('CURRENT I.T. RELEASE TRUTH GATE: PASS')