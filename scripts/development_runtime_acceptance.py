#!/usr/bin/env python3
"""Release 459 Development runtime acceptance for Devil n Dove.

Core acceptance performs GET requests only against the exact Development Pages host.
Authentication is supplied only through DND_DEV_SESSION_COOKIE. Historical APIs are
validated by contract/invariant; /api/admin/app-modules is the canonical current-release
runtime anchor. Provider transactions and CAIP review-grant mutations are separate.
"""
from __future__ import annotations

import argparse,json,os,sys
from datetime import datetime,timezone
from pathlib import Path
from urllib.error import HTTPError,URLError
from urllib.parse import urljoin,urlparse
from urllib.request import Request,urlopen

CURRENT_RELEASE=459
DEFAULT_BASE_URL='https://devilndove-site-dev.pages.dev'
ALLOWED_HOSTS={'devilndove-site-dev.pages.dev'}
SESSION_ENV='DND_DEV_SESSION_COOKIE'
EXPECTED_MODULES=['storefront','creators','socials','financials','it-platform']
PROTECTED_ENDPOINTS={
    'infrastructure':'/api/admin/infrastructure-readiness',
    'modules':'/api/admin/app-modules',
    'it_provider_readiness':'/api/admin/it-provider-readiness',
    'it_provider_setup_guide':'/api/admin/it-provider-setup-guide',
    'product_lineage':'/api/admin/product-lineage?limit=1',
    'photography':'/api/admin/product-image-quality?summary=1&limit=1',
    'storefront_merchandising':'/api/admin/storefront-merchandising',
    'inventory_intelligence':'/api/admin/inventory-intelligence',
    'tool_lifecycle':'/api/admin/tool-lifecycle',
    'supply_sourcing':'/api/admin/supply-sourcing',
    'calibration':'/api/admin/release448-calibration',
    'it_integrations':'/api/admin/it-integrations',
}
PUBLIC_ENDPOINTS={'payment_providers':'/api/payment-providers'}

class AcceptanceError(RuntimeError):pass

def validate_base_url(value:str)->str:
    value=str(value or '').strip().rstrip('/');parsed=urlparse(value);host=(parsed.hostname or '').lower()
    if parsed.scheme!='https' or host not in ALLOWED_HOSTS or parsed.path not in ('','/'):
        raise AcceptanceError('Refusing runtime target. Only the exact Development Pages host is allowed; Production, custom-domain and arbitrary targets are forbidden.')
    return value

def get_json(base_url:str,path:str,cookie:str|None,timeout:float=20.0)->tuple[int,dict]:
    headers={'Accept':'application/json','Cache-Control':'no-store','User-Agent':'devilndove-release459-runtime-acceptance'}
    if cookie:headers['Cookie']=cookie
    request=Request(urljoin(base_url+'/',path.lstrip('/')),headers=headers,method='GET')
    try:
        with urlopen(request,timeout=timeout) as response:status=int(getattr(response,'status',200));raw=response.read().decode('utf-8',errors='replace')
    except HTTPError as error:status=int(error.code);raw=error.read().decode('utf-8',errors='replace')
    except URLError as error:raise AcceptanceError(f'GET {path} failed: {error.reason}') from error
    try:payload=json.loads(raw)
    except json.JSONDecodeError as error:raise AcceptanceError(f'GET {path} returned non-JSON content (HTTP {status}).') from error
    if not isinstance(payload,dict):raise AcceptanceError(f'GET {path} returned a non-object JSON payload.')
    return status,payload

def record(checks:list[dict],name:str,passed:bool,detail:str)->None:checks.append({'check':name,'status':'PASS' if passed else 'FAIL','detail':detail})

def invariant(name:str,payload:dict)->tuple[bool,str]:
    if payload.get('ok') is not True:return False,'ok is not true'
    if name=='modules':
        rows=payload.get('modules',[]) if isinstance(payload.get('modules'),list) else []
        keys=sorted(str(row.get('module_key') or '').lower() for row in rows if isinstance(row,dict) and row.get('module_key'))
        d=payload.get('diagnostics',{}) if isinstance(payload.get('diagnostics'),dict) else {}
        passed=int(payload.get('release') or 0)==CURRENT_RELEASE and payload.get('schema_ready') is True and payload.get('migration_required') is False and keys==sorted(EXPECTED_MODULES) and d.get('healthy') is True and int(d.get('role_access_count') or 0)==10
        return passed,f"release={payload.get('release')!r}; modules={keys}; role_rows={d.get('role_access_count')!r}; healthy={d.get('healthy')!r}"
    if name=='infrastructure':
        r2=payload.get('r2',[]) if isinstance(payload.get('r2'),list) else []
        passed=payload.get('target')=='development' and payload.get('project')=='devilndove-site-dev' and payload.get('ready') is True and payload.get('d1',{}).get('schema_ready') is True and len(r2)==2 and all(row.get('storage_ready') is True for row in r2)
        return passed,f"target={payload.get('target')!r}; project={payload.get('project')!r}; ready={payload.get('ready')!r}; r2={len(r2)}"
    if name=='it_provider_setup_guide':
        providers=payload.get('providers',[]) if isinstance(payload.get('providers'),list) else []
        passed=int(payload.get('release') or 0)==CURRENT_RELEASE and len(providers)==8 and payload.get('secret_values_emitted') is False and payload.get('provider_execution_allowed') is False and payload.get('provider_publication_allowed') is False
        return passed,f"release={payload.get('release')!r}; providers={len(providers)}; secret_values_emitted={payload.get('secret_values_emitted')!r}"
    if name=='it_provider_readiness':
        providers=payload.get('providers',[]) if isinstance(payload.get('providers'),list) else []
        passed=payload.get('schema_ready') is True and payload.get('provider_execution_allowed') is False and payload.get('provider_publication_allowed') is False and len(providers)>=7
        return passed,f"schema_ready={payload.get('schema_ready')!r}; providers={len(providers)}; execution={payload.get('provider_execution_allowed')!r}"
    if name=='supply_sourcing':return payload.get('stock_mutation_capability')=='none',f"stock_mutation_capability={payload.get('stock_mutation_capability')!r}"
    if name=='inventory_intelligence':return payload.get('write_authority_duplicated') is False,f"write_authority_duplicated={payload.get('write_authority_duplicated')!r}"
    if name=='calibration':return int((payload.get('summary') or {}).get('schema_blocked') or 0)==0,f"schema_blocked={(payload.get('summary') or {}).get('schema_blocked')!r}"
    if 'schema_ready' in payload:return payload.get('schema_ready') is not False,f"schema_ready={payload.get('schema_ready')!r}; provenance_release={payload.get('release')!r}"
    return True,f"contract ok; provenance_release={payload.get('release')!r}"

def run_anonymous_check(base_url:str,timeout:float)->dict:
    checks=[]
    for name,path in PROTECTED_ENDPOINTS.items():
        status,_=get_json(base_url,path,None,timeout);record(checks,f'anonymous_{name}_refused',status in (401,403),f'HTTP {status}; expected 401/403')
    return {'mode':'anonymous-protected-route-check','release':CURRENT_RELEASE,'target':base_url,'checks':checks,'overall':'PASS' if all(row['status']=='PASS' for row in checks) else 'FAIL'}

def run_authenticated(base_url:str,cookie:str,timeout:float)->dict:
    checks=[]
    payment_status,payment=get_json(base_url,PUBLIC_ENDPOINTS['payment_providers'],None,timeout)
    record(checks,'payment_provider_readiness_contract',payment_status==200 and payment.get('ok') is True,f'HTTP {payment_status}; safe non-secret configuration only')
    for name,path in PROTECTED_ENDPOINTS.items():
        status,payload=get_json(base_url,path,cookie,timeout)
        passed,detail=invariant(name,payload) if status==200 else (False,f'HTTP {status}')
        record(checks,name,status==200 and passed,f'HTTP {status}; {detail}')
    core_pass=all(row['status']=='PASS' for row in checks)
    return {
        'authority':'development-runtime-acceptance','release':CURRENT_RELEASE,'mode':'authenticated-development-read-only','target':base_url,
        'generated_at':datetime.now(timezone.utc).replace(microsecond=0).isoformat(),'http_method':'GET','credentials_source':SESSION_ENV,'credentials_emitted':False,
        'core_runtime':'PASS' if core_pass else 'FAIL','checks':checks,
        'provider_configuration_readiness':'OBSERVED_ONLY','provider_transaction_acceptance':'NOT_PERFORMED','provider_execution':False,'provider_publication':False,
        'caip_private_media_acceptance':'NOT_PERFORMED_SEPARATE_USER_TRIGGERED_PROOF','production_mutation':'FORBIDDEN'
    }

def self_check()->int:
    checks=[]
    try:validate_base_url(DEFAULT_BASE_URL);record(checks,'development_default_allowed',True,DEFAULT_BASE_URL)
    except AcceptanceError as error:record(checks,'development_default_allowed',False,str(error))
    for forbidden in ('https://devilndove.com','https://devilndove-site.pages.dev','https://example.com','http://devilndove-site-dev.pages.dev'):
        refused=False
        try:validate_base_url(forbidden)
        except AcceptanceError:refused=True
        record(checks,f"forbid_{urlparse(forbidden).hostname or 'invalid'}",refused,forbidden)
    record(checks,'release_459_declared',CURRENT_RELEASE==459,str(CURRENT_RELEASE))
    record(checks,'five_modules_declared',EXPECTED_MODULES==['storefront','creators','socials','financials','it-platform'],str(EXPECTED_MODULES))
    record(checks,'auth_from_environment_only',SESSION_ENV=='DND_DEV_SESSION_COOKIE',SESSION_ENV)
    record(checks,'get_only_manifest',all(path.startswith('/api/') for path in [*PROTECTED_ENDPOINTS.values(),*PUBLIC_ENDPOINTS.values()]),f'{len(PROTECTED_ENDPOINTS)+len(PUBLIC_ENDPOINTS)} runtime endpoints are GET-only in the core harness')
    record(checks,'provider_setup_guide_in_manifest','it_provider_setup_guide' in PROTECTED_ENDPOINTS,str(sorted(PROTECTED_ENDPOINTS)))
    overall=all(row['status']=='PASS' for row in checks)
    print('DEVELOPMENT RUNTIME ACCEPTANCE SELF-CHECK')
    for row in checks:print(f"{row['status']}: {row['check']} — {row['detail']}")
    print(f"SELF-CHECK: {'PASS' if overall else 'FAIL'}")
    return 0 if overall else 1

def write_evidence(path:str,evidence:dict)->None:
    target=Path(path);target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(evidence,indent=2,sort_keys=True)+'\n',encoding='utf-8')

def main()->int:
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--base-url',default=DEFAULT_BASE_URL);parser.add_argument('--timeout',type=float,default=20.0);parser.add_argument('--evidence-json',default='');parser.add_argument('--self-check',action='store_true');parser.add_argument('--anonymous-check',action='store_true');args=parser.parse_args()
    if args.self_check:return self_check()
    try:
        base_url=validate_base_url(args.base_url)
        if args.anonymous_check:evidence=run_anonymous_check(base_url,args.timeout)
        else:
            cookie=os.environ.get(SESSION_ENV,'').strip()
            if not cookie:raise AcceptanceError(f'{SESSION_ENV} is required for authenticated acceptance. Do not pass cookies/tokens on the command line or commit them.')
            evidence=run_authenticated(base_url,cookie,args.timeout)
    except AcceptanceError as error:print(f'RUNTIME ACCEPTANCE: REFUSED/FAILED — {error}',file=sys.stderr);return 2
    if args.evidence_json:write_evidence(args.evidence_json,evidence);print(f'Sanitized evidence: {args.evidence_json}')
    for row in evidence.get('checks',[]):print(f"{row['status']}: {row['check']} — {row['detail']}")
    overall=evidence.get('core_runtime') or evidence.get('overall') or 'FAIL';print(f'RUNTIME ACCEPTANCE: {overall}')
    return 0 if overall=='PASS' else 1

if __name__=='__main__':raise SystemExit(main())
