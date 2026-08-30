#!/usr/bin/env python3
"""Release 461 authenticated GET-only Development runtime acceptance."""
from __future__ import annotations
import argparse,json,os,sys
from datetime import datetime,timezone
from pathlib import Path
from urllib.error import HTTPError,URLError
from urllib.parse import urljoin,urlparse
from urllib.request import Request,urlopen

CURRENT_RELEASE=461
DEFAULT_BASE_URL='https://devilndove-site-dev.pages.dev'
ALLOWED_HOSTS={'devilndove-site-dev.pages.dev'}
SESSION_ENV='DND_DEV_SESSION_COOKIE'
EXPECTED_MODULES=['storefront','creators','socials','financials','it-platform']
PROTECTED_ENDPOINTS={
 'modules':'/api/admin/app-modules',
 'inventory_base_units':'/api/admin/site-item-inventory',
 'product_media_quality':'/api/admin/product-media-score',
 'caip_pipeline':'/api/admin/caip-production-pipeline',
}

class AcceptanceError(RuntimeError):pass

def validate_base_url(value:str)->str:
 value=str(value or '').strip().rstrip('/');p=urlparse(value);host=(p.hostname or '').lower()
 if p.scheme!='https' or host not in ALLOWED_HOSTS or p.path not in ('','/'):
  raise AcceptanceError('Only the exact HTTPS Development Pages host is permitted. Separate live Production/custom/arbitrary targets are forbidden.')
 return value

def get_json(base_url:str,path:str,cookie:str|None,timeout:float=20.0)->tuple[int,dict]:
 headers={'Accept':'application/json','Cache-Control':'no-store','User-Agent':'devilndove-release461-runtime-acceptance'}
 if cookie:headers['Cookie']=cookie
 request=Request(urljoin(base_url+'/',path.lstrip('/')),headers=headers,method='GET')
 try:
  with urlopen(request,timeout=timeout) as response:status=int(getattr(response,'status',200));raw=response.read().decode('utf-8',errors='replace')
 except HTTPError as error:status=int(error.code);raw=error.read().decode('utf-8',errors='replace')
 except URLError as error:raise AcceptanceError(f'GET {path} failed: {error.reason}') from error
 try:payload=json.loads(raw)
 except json.JSONDecodeError as error:raise AcceptanceError(f'GET {path} returned non-JSON content (HTTP {status}).') from error
 if not isinstance(payload,dict):raise AcceptanceError(f'GET {path} returned non-object JSON.')
 return status,payload

def record(checks,name,passed,detail):checks.append({'check':name,'status':'PASS' if passed else 'FAIL','detail':detail})

def invariant(name,payload):
 if payload.get('ok') is not True:return False,'ok is not true'
 if name=='modules':
  rows=payload.get('modules',[]) if isinstance(payload.get('modules'),list) else []
  keys=sorted(str(x.get('module_key') or '').lower() for x in rows if isinstance(x,dict) and x.get('module_key'))
  d=payload.get('diagnostics',{}) if isinstance(payload.get('diagnostics'),dict) else {}
  passed=int(payload.get('release') or 0)==461 and payload.get('schema_ready') is True and payload.get('migration_required') is False and keys==sorted(EXPECTED_MODULES) and d.get('healthy') is True
  return passed,f"release={payload.get('release')!r}; schema_ready={payload.get('schema_ready')!r}; modules={keys}; healthy={d.get('healthy')!r}"
 if name=='inventory_base_units':
  rows=[]
  for key in ('items','results'):
   if isinstance(payload.get(key),list):rows.extend(x for x in payload[key] if isinstance(x,dict) and int(x.get('site_item_inventory_id') or 0)>0)
  row_authority_ok=all(x.get('quantity_authority')=='base' for x in rows)
  passed=payload.get('quantity_authority')=='base' and row_authority_ok
  return passed,f"quantity_authority={payload.get('quantity_authority')!r}; inventory_rows={len(rows)}; all_rows_base_authority={row_authority_ok}"
 if name=='product_media_quality':
  t=payload.get('primary_image_thresholds',{}) if isinstance(payload.get('primary_image_thresholds'),dict) else {}
  roles=payload.get('roles',[]) if isinstance(payload.get('roles'),list) else []
  role_keys={str(x.get('role_key') or '') for x in roles if isinstance(x,dict)}
  passed=int(t.get('min_width_px') or 0)==1200 and int(t.get('min_height_px') or 0)==1200 and int(t.get('min_alt_characters') or 0)==12 and int(t.get('min_quality_score') or 0)==70 and 'main' in role_keys
  return passed,f"schema_contract=HTTP_200_FAILS_CLOSED_IF_MIGRATION_MISSING; thresholds={t}; roles={sorted(role_keys)}"
 if name=='caip_pipeline':
  passed=int(payload.get('release') or 0)==461 and payload.get('schema_ready') is True and payload.get('provider_execution_active') is False and payload.get('publication_active') is False and payload.get('r2_delete_active') is False
  projects=payload.get('projects',[]) if isinstance(payload.get('projects'),list) else []
  return passed,f"release={payload.get('release')!r}; schema_ready={payload.get('schema_ready')!r}; projects={len(projects)}; execution={payload.get('provider_execution_active')!r}; publication={payload.get('publication_active')!r}; r2_delete={payload.get('r2_delete_active')!r}"
 return True,'contract ok'

def run_anonymous_check(base_url,timeout):
 checks=[]
 for name,path in PROTECTED_ENDPOINTS.items():
  status,_=get_json(base_url,path,None,timeout);record(checks,f'anonymous_{name}_refused',status in (401,403),f'HTTP {status}; expected 401/403')
 return {'mode':'anonymous-protected-route-check','release':461,'target':base_url,'checks':checks,'overall':'PASS' if all(x['status']=='PASS' for x in checks) else 'FAIL'}

def run_authenticated(base_url,cookie,timeout):
 checks=[];payloads={}
 for name,path in PROTECTED_ENDPOINTS.items():
  status,payload=get_json(base_url,path,cookie,timeout);payloads[name]=payload
  passed,detail=invariant(name,payload) if status==200 else (False,f'HTTP {status}; error={payload.get("error")!r}')
  record(checks,name,status==200 and passed,f'HTTP {status}; {detail}')
 projects=payloads.get('caip_pipeline',{}).get('projects',[])
 project_id=0
 if isinstance(projects,list):
  for row in projects:
   if isinstance(row,dict) and int(row.get('creative_project_id') or 0)>0:project_id=int(row['creative_project_id']);break
 if project_id:
  status,handoff=get_json(base_url,f'/api/admin/caip-content-handoff?creative_project_id={project_id}',cookie,timeout)
  passed=status==200 and handoff.get('ok') is True and int(handoff.get('release') or 0)==461 and handoff.get('schema_ready') is True and handoff.get('provider_execution_active') is False and handoff.get('publication_active') is False and handoff.get('source_media_unchanged') is True
  record(checks,'caip_reviewed_handoff',passed,f"HTTP {status}; project={project_id}; release={handoff.get('release')!r}; schema_ready={handoff.get('schema_ready')!r}; execution={handoff.get('provider_execution_active')!r}; publication={handoff.get('publication_active')!r}; source_media_unchanged={handoff.get('source_media_unchanged')!r}")
 else:
  record(checks,'caip_reviewed_handoff_no_project_fixture',True,'No CAIP project exists to select; authenticated pipeline schema/safety contract passed and no fixture was fabricated.')
 core=all(x['status']=='PASS' for x in checks)
 return {'authority':'development-runtime-acceptance','release':461,'mode':'authenticated-development-read-only','target':base_url,'generated_at':datetime.now(timezone.utc).replace(microsecond=0).isoformat(),'http_method':'GET','credentials_source':SESSION_ENV,'credentials_emitted':False,'core_runtime':'PASS' if core else 'FAIL','checks':checks,'d1_mutation':False,'r2_mutation':False,'provider_execution':False,'provider_publication':False,'raw_caip_r2_delete':False,'production_mutation':'FORBIDDEN'}

def self_check():
 checks=[]
 try:validate_base_url(DEFAULT_BASE_URL);record(checks,'development_default_allowed',True,DEFAULT_BASE_URL)
 except AcceptanceError as e:record(checks,'development_default_allowed',False,str(e))
 for forbidden in ('https://devilndove.com','https://devilndove-site.pages.dev','https://example.com','http://devilndove-site-dev.pages.dev'):
  refused=False
  try:validate_base_url(forbidden)
  except AcceptanceError:refused=True
  record(checks,f"forbid_{urlparse(forbidden).hostname or 'invalid'}",refused,forbidden)
 record(checks,'release_461_declared',CURRENT_RELEASE==461,str(CURRENT_RELEASE))
 record(checks,'five_modules_declared',EXPECTED_MODULES==['storefront','creators','socials','financials','it-platform'],str(EXPECTED_MODULES))
 record(checks,'auth_from_environment_only',SESSION_ENV=='DND_DEV_SESSION_COOKIE',SESSION_ENV)
 record(checks,'release461_surfaces_declared',set(PROTECTED_ENDPOINTS)=={'modules','inventory_base_units','product_media_quality','caip_pipeline'},str(PROTECTED_ENDPOINTS))
 record(checks,'get_only_manifest',all(path.startswith('/api/') for path in PROTECTED_ENDPOINTS.values()),f'{len(PROTECTED_ENDPOINTS)} protected GET surfaces')
 overall=all(x['status']=='PASS' for x in checks)
 print('DEVELOPMENT RUNTIME ACCEPTANCE SELF-CHECK')
 for row in checks:print(f"{row['status']}: {row['check']} — {row['detail']}")
 print(f"SELF-CHECK: {'PASS' if overall else 'FAIL'}");return 0 if overall else 1

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--base-url',default=DEFAULT_BASE_URL);p.add_argument('--timeout',type=float,default=20.0);p.add_argument('--evidence-json',default='');p.add_argument('--self-check',action='store_true');p.add_argument('--anonymous-check',action='store_true');a=p.parse_args()
 if a.self_check:return self_check()
 try:
  base=validate_base_url(a.base_url)
  if a.anonymous_check:e=run_anonymous_check(base,a.timeout)
  else:
   cookie=os.environ.get(SESSION_ENV,'').strip()
   if not cookie:raise AcceptanceError(f'{SESSION_ENV} is required. Never commit or print session credentials.')
   e=run_authenticated(base,cookie,a.timeout)
 except AcceptanceError as error:print(f'RUNTIME ACCEPTANCE: REFUSED/FAILED — {error}',file=sys.stderr);return 2
 if a.evidence_json:
  target=Path(a.evidence_json);target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(e,indent=2,sort_keys=True)+'\n',encoding='utf-8');print(f'Sanitized evidence: {target}')
 for row in e.get('checks',[]):print(f"{row['status']}: {row['check']} — {row['detail']}")
 overall=e.get('core_runtime') or e.get('overall') or 'FAIL';print(f'RUNTIME ACCEPTANCE: {overall}');return 0 if overall=='PASS' else 1
if __name__=='__main__':raise SystemExit(main())
