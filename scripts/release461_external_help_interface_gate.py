#!/usr/bin/env python3
"""Release 461 backend external-information help interface gate."""
from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parents[1]
HELP=ROOT/'public/js/admin-external-help.js'
ADMIN=ROOT/'public/js/admin.js'
AGG=ROOT/'scripts/release461_aggregate_source_gate.py'

fail=[]
def req(ok,msg):
    if not ok: fail.append(msg)

req(HELP.is_file(),'global admin external help module is missing')
req(ADMIN.is_file(),'admin.js is missing')
req(AGG.is_file(),'Release 461 aggregate gate is missing')

if HELP.is_file():
    text=HELP.read_text(encoding='utf-8')
    for marker in (
        'dd-help-trigger','border-radius:50%','role="dialog"','aria-modal="true"',
        'MutationObserver','input:not([type="hidden"]),select,textarea',
        'ETSY_API_KEYSTRING','Create a seller app','www.etsy.com/developers/register',
        'ETSY_SHARED_SECRET','ETSY_REDIRECT_URI','ETSY_SHOP_ID',
        'IT_CREDENTIAL_REFERENCE','OAUTH_SCOPES','CALLBACK_URL','WEBHOOK_URL',
        'EXTERNAL_URL','EXTERNAL_ID','Official provider resources'
    ):
        req(marker in text,f'external help module missing {marker}')
    for provider in ('STRIPE','PAYPAL','PINTEREST','META','X','TIKTOK','YOUTUBE'):
        req(provider in text,f'external help provider coverage missing {provider}')
    req('access/refresh tokens' in text.lower(),'secret/token safety language missing')
    result=subprocess.run(['node','--check',str(HELP)],cwd=ROOT,capture_output=True,text=True)
    req(result.returncode==0,f'admin external help JavaScript syntax failed: {result.stderr}')

if ADMIN.is_file():
    admin=ADMIN.read_text(encoding='utf-8')
    req("import('/public/js/admin-external-help.js?v=461')" in admin,'admin.js does not load the global external help interface using the current Release 461 outward cache authority')

if AGG.is_file():
    agg=AGG.read_text(encoding='utf-8')
    req('"release461_external_help_interface_gate.py"' in agg,'aggregate Release 461 gate does not carry external-help gate')

if fail:
    for i,item in enumerate(fail,1):
        print(f'{i:03d}. FAIL — {item}')
    raise SystemExit(1)

print('RELEASE 461 BACKEND EXTERNAL HELP INTERFACE: PASS')
print('Circled field help: GLOBAL / DYNAMIC')
print('Etsy API acquisition: DETAILED')
print('External credentials, IDs, URLs, callbacks, webhooks and scopes: COVERED')
print('Outward cache authority: CURRENT RELEASE 461')
print('D1 / provider / Production mutation: NONE')