#!/usr/bin/env python3
"""Canonical current-release and repository forward-sanity authority."""
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
failures=[]
def require(condition,message):
    if not condition: failures.append(message)
def text(path): return (ROOT/path).read_text(encoding='utf-8')

release=json.loads(text('development-release.json'))
require(release.get('environment')=='development','current release must target Development')
require(release.get('branch')=='dev','current release branch must remain dev')
require(release.get('release')==450,'current Development release must be Release 450')
require(release.get('label')=='Marketplace & SEO Readiness','Release 450 label drifted')
require(release.get('release_track')=='single-current-release','single current release track is required')
require(release.get('pages_project')=='devilndove-site-dev','Development Pages project authority drifted')

previous=release.get('previous_release',{})
require(previous.get('release')==449 and previous.get('state')=='complete','Release 449 completion authority missing')
require(previous.get('remote_verification_workflow_run')==33235075008,'Release 449 remote verification proof drifted')

module_keys=[r.get('key') for r in release.get('canonical_modules',[])]
require(module_keys==['storefront','creators','socials','financials','it-platform'],f'canonical module authority drifted: {module_keys}')
require(all(r.get('status')=='active' for r in release.get('canonical_modules',[])),'all five canonical modules must remain active')
client_keys=[r.get('key') for r in release.get('clients',[])]
require(client_keys==['web','phone','desktop'],f'canonical client authority drifted: {client_keys}')
require(all(r.get('status')=='active' for r in release.get('clients',[])),'Web/Phone/Desktop must remain active')

policy=release.get('release_policy',{})
require(policy.get('one_current_release') is True,'one-current-release policy must remain enabled')
require(policy.get('production_promotion')=='closed','Production promotion must remain closed')
require(policy.get('provider_publication')=='closed','Marketplace provider publication must remain closed')
require(policy.get('current_release_d1_changes_allowed') is True,'protected Development D1 evolution must remain allowed')
require(policy.get('seo_gate_required') is True,'public SEO gate must remain mandatory')

infra=release.get('development_infrastructure',{})
require(infra.get('cloudflare_account_id')=='c0d5bc25df16ae5b7d47c985c4b7b787','Development Cloudflare account authority drifted')
d1=infra.get('d1',{})
require(d1.get('binding')=='DB' and d1.get('database_name')=='devilndove-dev' and d1.get('database_id')=='dbc1615b-dcbe-4951-973b-b47c99c73bfa','Development D1 identity drifted')
require(infra.get('local_access_preflight')=='python scripts/cloudflare_development_access.py --auth-only','Development Cloudflare access preflight drifted')
require(infra.get('github_d1_credential',{}).get('secret_name')=='CLOUDFLARE_API_TOKEN','GitHub D1 credential reference drifted')
r2={(r.get('binding'),r.get('bucket_name')) for r in infra.get('r2',[])}
require(r2=={('PRODUCT_MEDIA_BUCKET','devilndove-toolshed-images-dev'),('CAIP_PRIVATE_MEDIA_BUCKET','devilndove-caip-media-dev')},f'Development R2 authority drifted: {r2}')
startup=' '.join(infra.get('startup_sequence',[]))
for marker in ('Never replay Release 447/448/449','source/local gates','read-only remote verifier','Production'):
    require(marker in startup,f'Development startup sequence missing {marker!r}')

baseline=release.get('database_baseline',{})
require(baseline.get('release')==447 and baseline.get('apply_status')=='applied_and_verified_development','Release 447 verified database baseline drifted')

migrations={r.get('key'):r for r in release.get('current_release_migrations',[])}
row=migrations.get('marketplace-seo-readiness',{})
require(len(migrations)==1,'Release 450 must have one current additive migration authority')
require(row.get('file')=='migrations/dev/20260829_release450_marketplace_seo_readiness.sql','Release 450 migration file authority drifted')
require(row.get('source_status') in {'implemented_and_gated','source_green'},'Release 450 source state is not gated')
require(row.get('development_d1_status') in {'pending_guarded_activation','applied_and_verified_development'},'Release 450 Development D1 state is not truthful')
require(row.get('production_allowed') is False and row.get('provider_execution_allowed') is False,'Release 450 migration/provider execution must not allow Production/provider mutation')
require((ROOT/row.get('file','missing')).exists(),'Release 450 migration file missing')

work={r.get('key'):r for r in release.get('workstreams',[])}
for key in ('storefront-merchandising','product-material-lineage','manufacturer-provenance-reviews','product-image-quality','inventory-operations-intelligence','tool-lifecycle','supply-sourcing-replenishment','caip-reviewed-content-handoff','it-integration-registry','marketplace-readiness','marketplace-draft-exports','marketplace-mapping','seo-compliance'):
    require(key in work,f'current/carry-forward workstream missing: {key}')
require(work.get('marketplace-readiness',{}).get('workspace')=='/admin/marketplace-readiness/','Marketplace readiness workspace authority drifted')

batch=release.get('release450_batch',[])
require(len(batch)>=26,'Release 450 batch must retain the agreed 20–30 change scope')
implemented=sum(1 for item in batch if item.get('status')=='implemented')
require(implemented>=24,f'Release 450 source batch implementation unexpectedly regressed: {implemented}')

wrangler=text('wrangler.toml')
for marker in ('name = "devilndove-site-dev"','binding = "DB"','database_name = "devilndove-dev"','database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"','bucket_name = "devilndove-toolshed-images-dev"','bucket_name = "devilndove-caip-media-dev"'):
    require(marker in wrangler,f'Development infrastructure marker missing: {marker}')
require('account_id =' not in wrangler,'Pages wrangler.toml must never contain account_id')

access=text('scripts/cloudflare_development_access.py')
for marker in ("EXPECTED_ACCOUNT_ID = 'c0d5bc25df16ae5b7d47c985c4b7b787'","EXPECTED_DATABASE_NAME = 'devilndove-dev'","EXPECTED_DATABASE_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'","env['CLOUDFLARE_ACCOUNT_ID'] = EXPECTED_ACCOUNT_ID",'Credentials printed: NEVER'):
    require(marker in access,f'Development Cloudflare access safeguard missing: {marker}')

for required in ('database_full_schema.sql','scripts/cloudflare_development_access.py','scripts/development_runtime_acceptance.py','scripts/public_seo_gate.py','scripts/release450_marketplace_seo_gate.py','admin/marketplace-readiness/index.html','functions/api/_lib/marketplaceReadiness.js'):
    require((ROOT/required).exists(),f'required current authority missing: {required}')

require(not list(ROOT.glob('BUILD*.md')),'historical BUILD*.md files must not exist in repository root')
require(not (ROOT/'docs/archive').exists(),'docs/archive must not ship; Git history is the archive')
require(not (ROOT/'docs/releases').exists(),'docs/releases must not ship; current release belongs in development-release.json')
require(not (ROOT/'tmp').exists(),'tmp must not ship in repository')

workflow=text('.github/workflows/system-gate.yml')
require('python scripts/public_seo_gate.py' in workflow,'System Gate must validate public SEO structure')
require('python scripts/development_runtime_acceptance.py --self-check' in workflow,'System Gate must validate Development runtime acceptance safety')
require('Production mutation capability: NONE' in workflow,'System Gate Production safety statement missing')

# Public cache-version majors may not exceed the current release.
version_pattern=re.compile(r'([?&]v=)(\d+)(?:[.-][\w-]+)?(?=["\'&#\s)]|$)')
runtime_files=list(ROOT.glob('*.html'))+list((ROOT/'admin').rglob('*.html'))+list((ROOT/'js').rglob('*.js'))+list((ROOT/'public/js').rglob('*.js'))+list((ROOT/'css').rglob('*.css'))
future=[]
for path in sorted(set(runtime_files)):
    content=path.read_text(encoding='utf-8',errors='replace')
    for match in version_pattern.finditer(content):
        if int(match.group(2))>int(release['release']): future.append(f'{path.relative_to(ROOT)}:{match.group(2)}')
require(not future,f'future cache majors found: {future[:12]}')

print('PLATFORM FORWARD SANITY')
print(f"Current release: {release['release']} — {release['label']}")
print('Release 449: COMPLETE / REMOTE DEVELOPMENT D1 VERIFIED')
print(f'Release 450 source batch implemented: {implemented}/{len(batch)}')
print('Development D1: devilndove-dev / EXACT ID PINNED')
print('Pages wrangler account_id: FORBIDDEN')
print('Provider publication: CLOSED')
print('Public SEO gate: REQUIRED')
print('Production mutation capability: NONE')
if failures:
    for i,failure in enumerate(failures,1): print(f'{i:03d}. FAIL — {failure}')
    raise SystemExit(1)
print('PLATFORM FORWARD SANITY: PASS')
