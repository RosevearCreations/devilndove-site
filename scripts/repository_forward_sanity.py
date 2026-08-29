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
require(release.get('release')==451,'current Development release must be Release 451')
require(release.get('label')=='Marketplace Calibration & SEO Assurance','Release 451 label drifted')
require(release.get('release_track')=='single-current-release','single current release track is required')
require(release.get('pages_project')=='devilndove-site-dev','Development Pages project authority drifted')

previous=release.get('previous_release',{})
require(previous.get('release')==450 and previous.get('state')=='complete_applied_and_verified_development','Release 450 completion authority missing')
require(previous.get('d1_mutation_workflow_run')==33235769850,'Release 450 mutation proof drifted')
require(previous.get('d1_verification_workflow_run')==33235803838,'Release 450 independent D1 verification proof drifted')

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
require(policy.get('current_release_d1_migration_required') is False,'Release 451 must not invent a D1 migration')
require(policy.get('request_time_schema_mutation')=='forbidden_for_marketplace_surfaces','marketplace request-time schema mutation must remain forbidden')
require(policy.get('seo_gate_required') is True and policy.get('seo_depth_gate_required') is True,'both SEO gates must remain mandatory')

infra=release.get('development_infrastructure',{})
require(infra.get('cloudflare_account_id')=='c0d5bc25df16ae5b7d47c985c4b7b787','Development Cloudflare account authority drifted')
d1=infra.get('d1',{})
require(d1.get('binding')=='DB' and d1.get('database_name')=='devilndove-dev' and d1.get('database_id')=='dbc1615b-dcbe-4951-973b-b47c99c73bfa','Development D1 identity drifted')
require(d1.get('schema_current_through_release')==450,'Release 451 must record D1 schema as current through verified Release 450')
require(infra.get('local_access_preflight')=='python scripts/cloudflare_development_access.py --auth-only','Development Cloudflare access preflight drifted')
require(infra.get('connection_authority')=='docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md','future-chat D1 connection authority drifted')
require(infra.get('github_d1_credential',{}).get('secret_name')=='CLOUDFLARE_API_TOKEN','GitHub D1 credential reference drifted')
r2={(r.get('binding'),r.get('bucket_name')) for r in infra.get('r2',[])}
require(r2=={('PRODUCT_MEDIA_BUCKET','devilndove-toolshed-images-dev'),('CAIP_PRIVATE_MEDIA_BUCKET','devilndove-caip-media-dev')},f'Development R2 authority drifted: {r2}')
startup=' '.join(infra.get('startup_sequence',[]))
for marker in ('new chat is not a migration event','never replay Releases 447/448/449/450','source/local gates','read-only remote verifier','Production'):
    require(marker.lower() in startup.lower(),f'Development startup sequence missing {marker!r}')

baseline=release.get('database_baseline',{})
require(baseline.get('release')==447 and baseline.get('apply_status')=='applied_and_verified_development','Release 447 verified database baseline drifted')
require(release.get('current_release_migrations')==[],'Release 451 current_release_migrations must be empty')
state=release.get('current_release_database_state',{})
require(state.get('new_migration_required') is False and state.get('last_verified_schema_release')==450,'Release 451 database state must preserve Release 450 as last verified schema release')
require(state.get('historical_migration_replay') is False,'historical migration replay must remain false')

history={r.get('release'):r for r in release.get('release_history',[])}
require(history.get(449,{}).get('verification_workflow_run')==33235075008,'Release 449 completion evidence missing')
require(history.get(450,{}).get('verification_workflow_run')==33235803838,'Release 450 completion evidence missing')

work={r.get('key'):r for r in release.get('workstreams',[])}
for key in ('storefront-merchandising','product-material-lineage','manufacturer-provenance-reviews','product-image-quality','inventory-operations-intelligence','tool-lifecycle','supply-sourcing-replenishment','caip-reviewed-content-handoff','it-integration-registry','marketplace-readiness','marketplace-draft-exports','marketplace-mapping','marketplace-calibration','seo-compliance','seo-depth'):
    require(key in work,f'current/carry-forward workstream missing: {key}')
require(work.get('marketplace-calibration',{}).get('workspace')=='/admin/marketplace-calibration/','Marketplace calibration workspace authority drifted')

batch=release.get('release451_batch',[])
require(len(batch)==26,f'Release 451 batch must contain exactly 26 changes; found {len(batch)}')
require(all(item.get('status')=='implemented' for item in batch),'all 26 Release 451 source changes must be implemented')

wrangler=text('wrangler.toml')
for marker in ('name = "devilndove-site-dev"','binding = "DB"','database_name = "devilndove-dev"','database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"','bucket_name = "devilndove-toolshed-images-dev"','bucket_name = "devilndove-caip-media-dev"'):
    require(marker in wrangler,f'Development infrastructure marker missing: {marker}')
require('account_id =' not in wrangler,'Pages wrangler.toml must never contain account_id')

access=text('scripts/cloudflare_development_access.py')
for marker in ("EXPECTED_ACCOUNT_ID = 'c0d5bc25df16ae5b7d47c985c4b7b787'","EXPECTED_DATABASE_NAME = 'devilndove-dev'","EXPECTED_DATABASE_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'","env['CLOUDFLARE_ACCOUNT_ID'] = EXPECTED_ACCOUNT_ID",'Credentials printed: NEVER'):
    require(marker in access,f'Development Cloudflare access safeguard missing: {marker}')

for required in ('database_full_schema.sql','scripts/cloudflare_development_access.py','scripts/development_runtime_acceptance.py','scripts/public_seo_gate.py','scripts/public_seo_depth_gate.py','scripts/release450_marketplace_seo_gate.py','scripts/release451_marketplace_calibration_gate.py','admin/marketplace-readiness/index.html','admin/marketplace-calibration/index.html','functions/api/_lib/marketplaceReadiness.js','functions/api/_lib/marketplaceCalibration.js','docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md','docs/operations/RELEASE_451_D1_STATE.md'):
    require((ROOT/required).exists(),f'required current authority missing: {required}')

require(not list(ROOT.glob('BUILD*.md')),'historical BUILD*.md files must not exist in repository root')
require(not (ROOT/'docs/archive').exists(),'docs/archive must not ship; Git history is the archive')
require(not (ROOT/'docs/releases').exists(),'docs/releases must not ship; current release belongs in development-release.json')
require(not (ROOT/'tmp').exists(),'tmp must not ship in repository')

workflow=text('.github/workflows/system-gate.yml')
require('python scripts/release451_marketplace_calibration_gate.py' in workflow,'System Gate must validate Release 451')
require('python scripts/public_seo_gate.py' in workflow and 'python scripts/public_seo_depth_gate.py' in workflow,'System Gate must validate both public SEO authorities')
require('python scripts/development_runtime_acceptance.py --self-check' in workflow,'System Gate must validate Development runtime acceptance safety')
require('Production mutation capability: NONE' in workflow,'System Gate Production safety statement missing')

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
print('Release 450: COMPLETE / DEVELOPMENT D1 APPLIED + INDEPENDENTLY VERIFIED')
print('Release 451 source batch implemented: 26/26')
print('Release 451 new D1 migration: NONE REQUIRED')
print('Development D1: devilndove-dev / EXACT ID PINNED / SCHEMA CURRENT THROUGH 450')
print('Pages wrangler account_id: FORBIDDEN')
print('Provider publication: CLOSED')
print('Public structural + SEO depth gates: REQUIRED')
print('Production mutation capability: NONE')
if failures:
    for i,failure in enumerate(failures,1): print(f'{i:03d}. FAIL — {failure}')
    raise SystemExit(1)
print('PLATFORM FORWARD SANITY: PASS')
