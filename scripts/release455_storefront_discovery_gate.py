#!/usr/bin/env python3
"""Carried-forward Release 455 Storefront discovery/media/accessibility/SEO authority gate."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def run(path):
 p=subprocess.run([sys.executable,str(ROOT/path)],capture_output=True,text=True);req(p.returncode==0,f'carried-forward gate failed: {path}\n{p.stdout}\n{p.stderr}')
RUNTIME='public/js/storefront-discovery-runtime.js';CSS='css/storefront-discovery.css';PLACEHOLDER='assets/visual-placeholders/storefront-media-fallback.svg'
for p in (RUNTIME,CSS,PLACEHOLDER):req((ROOT/p).exists(),f'Release 455 asset missing: {p}')
runtime,css,middleware,authority=map(read,(RUNTIME,CSS,'functions/_middleware.js','functions/api/_lib/releaseAuthority.js'))
for marker in ('MutationObserver','storefront-media-fallback.svg','aria-live','aria-pressed','duplicate-demoted','og:image:alt','twitter:image:alt','https://devilndove.com'):req(marker in runtime,f'Release 455 runtime missing {marker}')
for marker in ('@media(max-width:900px)','@media(max-width:640px)','@media(prefers-reduced-motion:reduce)','min-height:44px','overflow-x:auto'):req(marker in css,f'Release 455 CSS missing {marker}')
req('storefront-discovery.css?v=${CURRENT_RELEASE}' in middleware and 'storefront-discovery-runtime.js?v=${CURRENT_RELEASE}' in middleware,'Pages middleware must inject Storefront assets using current release authority')
m=re.search(r'CURRENT_RELEASE\s*=\s*(\d+)',authority);req(bool(m) and int(m.group(1))>=455,'shared runtime release authority cannot regress below 455')
pages={'shop/index.html':'https://devilndove.com/shop/','shop/product/index.html':'https://devilndove.com/shop/product/','collections/index.html':'https://devilndove.com/collections/','collages/index.html':'https://devilndove.com/collages/'}
for path,canonical in pages.items():
 html=read(path);req(len(re.findall(r'<h1(?:\s|>)',html,re.I))==1,f'{path} must contain exactly one H1');req(len(re.findall(r'<meta[^>]+name=["\']description["\']',html,re.I))==1,f'{path} must contain exactly one meta description');req('index,follow' in html.replace(' ','').lower(),f'{path} must remain index,follow');req(canonical in html,f'{path} canonical missing');req('application/ld+json' in html,f'{path} JSON-LD missing')
release=json.loads(read('development-release.json'));current=int(release.get('release') or 0);hist={x.get('release'):x for x in release.get('release_history',[])}
req(release.get('environment')=='development' and release.get('branch')=='dev' and release.get('pages_project')=='devilndove-site-dev','Storefront authority must remain Development/dev');req(current>=455,'current release cannot predate 455')
if current>455:req(hist.get(455,{}).get('state')=='complete_source_proven_no_new_d1_migration','Release 455 completed history missing')
d1=release.get('development_infrastructure',{}).get('d1',{});req(d1.get('database_name')=='devilndove-dev' and d1.get('database_id')=='dbc1615b-dcbe-4951-973b-b47c99c73bfa' and int(d1.get('schema_current_through_release') or 0)>=453,'Development D1 identity/schema drifted')
req(release.get('current_release_database_state',{}).get('historical_migration_replay') is False,'historical migration replay must remain forbidden')
policy=release.get('release_policy',{});req(policy.get('production_promotion')=='closed' and policy.get('provider_execution')=='closed' and policy.get('provider_publication')=='closed','Production/provider boundaries must remain closed')
req(not list((ROOT/'migrations/dev').glob('*release455*')),'Release 455 itself must remain a no-migration release')
workflow=read('.github/workflows/system-gate.yml');req('python scripts/release455_storefront_discovery_gate.py' in workflow,'System Gate must retain Release 455')
run('scripts/public_seo_gate.py');run('scripts/public_seo_depth_gate.py');run('scripts/release454_admin_convergence_gate.py')
print('RELEASE 455 STOREFRONT DISCOVERY: CARRIED FORWARD')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
print('RELEASE 455 STOREFRONT DISCOVERY GATE: PASS')
