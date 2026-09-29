#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build291-public-runtime-reliability-broken-surface-closure.json')
p=j('current-development-authority.json')
caps=t('public/js/capabilities.js'); creations=t('creations/index.html')
health=t('functions/api/admin/public-api-health.js'); preview=t('scripts/preview_smoke.py')
prod=t('.github/workflows/production-pages-deploy-current.yml')
road=t('docs/operations/RELEASE_467_UX_SEARCH_DATABASE_EFFICIENCY_BUILDS_290_300.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
q(a.get('release')==467 and a.get('build')==291 and a.get('title')=='Public Runtime Reliability & Broken-Surface Closure','Build 291 identity mismatch')
q((a.get('scope') or {}).get('schema_change') is False and (a.get('scope') or {}).get('d1_mutation') is False,'Build 291 must remain schema/D1 mutation neutral')
for token in ('readJsonResponse','response.text()','renderRecovery','runtimeState="degraded"'):
    q(token in caps,'Capabilities recovery missing '+token)
q('await r.json()' not in caps,'Capabilities client still uses unsafe direct response.json')
q('Unexpected end of JSON input' not in caps,'Capabilities client contains raw parser error text')
for token in ("res.text().catch(() => '')","throw new Error('creations_api_unavailable')","Our creations catalog is temporarily unavailable.","/data/itemsforsale/itemsforsale_items_master.json"):
    q(token in creations,'Creations recovery missing '+token)
q('Creations API responded ${res.status}.' not in creations,'Creations page still exposes raw API status')
q("key: 'capabilities'" in health and "key: 'creations'" in health,'Public API diagnostics must cover creations and capabilities')
for token in ('("capabilities", "capabilities/")','("creations", "creations/")','for public_name in ("capabilities", "creations")','no_raw_runtime_error'):
    q(token in preview,'Preview public-route smoke missing '+token)
for token in ("'live_capabilities'","'live_creations'","'live_capabilities_api'","'live_creations_api'","sitemap_routes","ET.fromstring"):
    q(token in prod,'Production public-route smoke missing '+token)
for path in ('functions/api/capabilities.js','functions/api/creations.js','data/itemsforsale/itemsforsale_items_master.json'):
    q((R/path).is_file(),'Build 291 source missing '+path)
cap_pages=[R/'capabilities/index.html']+sorted((R/'capabilities').glob('*/index.html'))
q(len(cap_pages)>=13,f'Capability page coverage incomplete: {len(cap_pages)}')
for path in cap_pages:
    q('/public/js/capabilities.js?v=467b291' in path.read_text(encoding='utf-8',errors='replace'),f'{path.relative_to(R)} missing Build 291 capability asset')
q('Build 292 — Client Runtime Observer & Memory-Churn Hardening' in road,'Build 291 successor roadmap drift')
q("run_current_contract('scripts/release467_build291_gate.py','Release 467 Build 291')" in sysgate,'System Gate missing Build 291')
q(int(p.get('build') or 0)>=291,'Current authority must retain Build 291 or successor')
if int(p.get('build') or 0)==291:
    q(p.get('title')=='Public Runtime Reliability & Broken-Surface Closure' and p.get('state')=='DEVELOPMENT_GREEN','Current Build 291 pointer mismatch')
    q(int(p.get('next_build') or 0)==292 and p.get('next_build_title')=='Client Runtime Observer & Memory-Churn Hardening','Build 291 successor pointer mismatch')
for path in ('public/js/capabilities.js','functions/api/capabilities.js','functions/api/creations.js','functions/api/admin/public-api-health.js'):
    r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);q(r.returncode==0,path+' syntax failed: '+(r.stderr or r.stdout))
print('RELEASE 467 BUILD 291 PUBLIC RUNTIME RELIABILITY')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Capabilities raw parser exposure: CLOSED')
print('Creations raw API status exposure: CLOSED')
print('Sitemap Production route smoke: REQUIRED')
print('Next: Build 292 — Client Runtime Observer & Memory-Churn Hardening')
