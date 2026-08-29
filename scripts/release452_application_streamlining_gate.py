#!/usr/bin/env python3
"""Release 452 carried-forward application streamlining, UX/accessibility and SEO source authority."""
from __future__ import annotations
import json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def run_gate(path):
 r=subprocess.run([sys.executable,str(ROOT/path)],capture_output=True,text=True);req(r.returncode==0,f'carried-forward gate failed: {path}\n{r.stdout}\n{r.stderr}')
release=json.loads(read('development-release.json'))
req(release.get('environment')=='development' and release.get('branch')=='dev','Release 452 authority must remain Development/dev')
req(release.get('pages_project')=='devilndove-site-dev','Development Pages project drifted')
req(int(release.get('release') or 0)>=452,'Release 452 authority cannot be evaluated before Release 452')
history={x.get('release'):x for x in release.get('release_history',[])}
if release.get('release')==452:
 req(release.get('label')=='Application Streamlining & UX/SEO Depth','Release 452 label drifted')
else:
 req(history.get(452,{}).get('state')=='complete_source_proven_no_new_d1_migration','Release 452 completed history missing from later release')
infra=release.get('development_infrastructure',{});d1=infra.get('d1',{})
req(d1.get('binding')=='DB' and d1.get('database_name')=='devilndove-dev' and d1.get('database_id')=='dbc1615b-dcbe-4951-973b-b47c99c73bfa','Development D1 identity drifted')
req(int(d1.get('schema_current_through_release') or 0)>=450,'Release 452 requires at least verified schema Release 450')
req(release.get('current_release_database_state',{}).get('historical_migration_replay') is False,'historical migration replay must remain prohibited')
policy=release.get('release_policy',{});req(policy.get('production_promotion')=='closed','Production promotion must remain closed');req(policy.get('provider_publication')=='closed','provider publication must remain closed');req(policy.get('seo_gate_required') is True and policy.get('seo_depth_gate_required') is True,'both SEO gates remain mandatory')
for p in ('scripts/repository_hygiene_gate.py','scripts/release451_marketplace_calibration_gate.py','scripts/release452_application_streamlining_gate.py','public/js/product-breadcrumb-seo.js','docs/operations/RELEASE_452_APPLICATION_STREAMLINING.md','.github/workflows/release452-source-gate.yml'):
 req((ROOT/p).exists(),f'Release 452 authority missing: {p}')
product=read('shop/product/index.html');req('aria-label="Breadcrumb"' in product,'Product visible breadcrumb missing');req('/public/js/product-breadcrumb-seo.js?v=452' in product,'Product breadcrumb schema runtime missing');req('decoding="async"' in product,'Product below-fold proof imagery should decode asynchronously')
req('https://devilndove.com/collages/' in read('sitemap.xml'),'Collages discovery route missing from sitemap')
accounting=read('admin/accounting/index.html');req('noindex,nofollow' in accounting,'Accounting admin must remain noindex,nofollow')
for page in ('admin/inventory-intelligence/index.html','admin/tool-lifecycle/index.html','admin/accounting/index.html','admin/caip-content-handoff/index.html'):req('aria-live="polite"' in read(page),f'{page} must announce dynamic status')
workflow=read('.github/workflows/system-gate.yml');req('python scripts/repository_hygiene_gate.py' in workflow and 'python scripts/release452_application_streamlining_gate.py' in workflow,'System Gate must carry Release 452 + hygiene');req('python scripts/public_seo_gate.py' in workflow and 'python scripts/public_seo_depth_gate.py' in workflow,'System Gate must retain both SEO gates')
node=subprocess.run(['node','--check',str(ROOT/'public/js/product-breadcrumb-seo.js')],capture_output=True,text=True);req(node.returncode==0,f'Product breadcrumb JS syntax failed: {(node.stderr or node.stdout).strip()}')
for gate in ('scripts/repository_hygiene_gate.py','scripts/release451_marketplace_calibration_gate.py','scripts/public_seo_gate.py','scripts/public_seo_depth_gate.py'):run_gate(gate)
print('RELEASE 452 APPLICATION STREAMLINING: CARRIED FORWARD PASS' if not FAIL else 'RELEASE 452 APPLICATION STREAMLINING: FAIL')
print('Product BreadcrumbList/SEO/accessibility/hygiene authority: PRESERVED');print('Release 452 D1 migration: NONE HISTORICALLY');print('Provider publication: DISABLED');print('Production mutation capability: NONE')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
