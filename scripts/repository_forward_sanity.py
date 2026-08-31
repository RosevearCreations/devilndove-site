#!/usr/bin/env python3
"""Forward sanity across Release 464 green baseline and Release 465 Build 1 transition."""
from __future__ import annotations
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
MIG3=['migrations/canonical/0001_release464_migration_authority.sql','migrations/canonical/0002_release464_operational_acceptance.sql','migrations/canonical/0003_release464_business_growth.sql']
MIG4=MIG3+['migrations/canonical/0004_release465_storefront_quality.sql']
MAN4=[Path(x).name for x in MIG4]
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f'missing file: {path}');return ''
    return p.read_text(encoding='utf-8',errors='replace')
def req(ok,msg):
    if not ok: FAIL.append(msg)
release=json.loads(read('development-release.json') or '{}')
env=json.loads(read('release463-environment.json') or '{}')
manifest=json.loads(read('migrations/canonical/manifest.json') or '{}')
build=json.loads(read('release465-build1-storefront-quality.json') or '{}')
bstate=str(build.get('state') or '')
candidate=bstate=='in_progress_source_candidate'
green=bstate=='complete_development_green'
req(candidate or green,'Release 465 Build 1 state must be source candidate or Development green')
req(int(build.get('release') or 0)==465 and int(build.get('build') or 0)==1,'Release 465 Build 1 identity drifted')
req([x.get('id') for x in build.get('items',[])]==list(range(1,8)),'Release 465 Build 1 items must be 1-7')

# Environment and irreversible safety remain invariant through the release transition.
req(release.get('environment')=='development' and release.get('branch')=='dev','application authority must remain Development/dev')
infra=release.get('development_infrastructure',{});d1=infra.get('d1',{});prod=release.get('production_infrastructure',{});pd1=prod.get('d1',{})
req(d1.get('database_name')=='devilndove-dev' and d1.get('database_id')=='dbc1615b-dcbe-4951-973b-b47c99c73bfa','Development D1 identity drifted')
req(pd1.get('database_name')=='devilndove-prod-r462' and pd1.get('database_id')=='f34a741b-0000-45b0-9a96-6be08754d563','Production D1 identity drifted')
policy=release.get('release_policy',{})
req(policy.get('historical_migration_replay') is False,'historical migration replay must remain forbidden')
req(policy.get('production_promotion')=='exact_green_development_tree_only','exact Development-tree promotion policy missing')
req(policy.get('main_only_application_patches') is False,'main-only patches must remain forbidden')
req(policy.get('future_d1_schema_changes')=='migrations/canonical_only','canonical migration authority drifted')
req(policy.get('development_first_schema_verification') is True and policy.get('production_migration_before_dependent_code') is True,'migration order safety drifted')
req(policy.get('production_transactional_data_owned_by_production') is True and policy.get('blind_dev_to_production_data_overwrite') is False,'Production data ownership drifted')
req(policy.get('provider_execution')=='closed' and policy.get('provider_publication')=='closed' and policy.get('provider_live_authorization')=='closed','provider boundaries must remain closed')
req(policy.get('request_time_schema_mutation')=='blocked_by_runtime_firewall_and_source_gate','runtime schema mutation blockade missing')
req(policy.get('preview_access_must_not_be_weakened_for_smoke') is True,'Preview Access boundary drifted')

# Applied migration identities 0001-0003 stay immutable; Build 1 appends only 0004.
req(manifest.get('stream')=='devilndove-canonical-forward','canonical migration stream drifted')
req([x.get('file') for x in manifest.get('migrations',[])]==MAN4,'canonical manifest must be exact 0001/0002/0003/0004 sequence')
req(len(MAN4)==len(set(MAN4)),'canonical manifest contains duplicate migration names')
for old in manifest.get('migrations',[])[:3]: req(int(old.get('release') or 0)==464,'applied Release 464 migration metadata drifted')
req(int((manifest.get('migrations') or [{}])[-1].get('release') or 0)==465,'migration 0004 must belong to Release 465')

# Release 464 completion evidence must be carried forward, never reopened by Build 1.
for key,ids in [('release464_update1',list(range(1,8))),('release464_update2',[8,9,10,11,12,13]),('release464_update3',[14,15,16,17,18,19,20])]:
    rows=release.get(key,[]);req([x.get('id') for x in rows]==ids,f'{key} identity drifted');req(all(str(x.get('status') or '').startswith('complete') for x in rows),f'{key} must remain complete')

runtime=read('functions/api/_lib/releaseAuthority.js')
if candidate:
    req(int(release.get('release') or 0)==464 and release.get('convergence_state')=='release464_update3_complete_development_green','Build 1 candidate must start from the exact green Release 464 authority')
    req([x.get('file') for x in release.get('current_release_migrations',[])]==MIG3,'candidate must preserve Release 464 applied migration authority until Build 1 is Development-proven')
    req('CURRENT_RELEASE = 464' in runtime,'candidate runtime release must remain 464 until Build 1 technical green')
    ev=release.get('current_release_evidence',{});req(int(ev.get('development_native_migration_rows') or 0)==3 and int(ev.get('development_migration_proof_rows') or 0)==3,'candidate must preserve pre-0004 3/3 evidence')
    req(all(str(x.get('status') or '').startswith('implemented') for x in build.get('items',[])),'Build 1 candidate items must remain implemented source candidates')
else:
    req(int(release.get('release') or 0)==465 and release.get('convergence_state')=='release465_build1_complete_development_green','Build 1 green authority drifted')
    req([x.get('file') for x in release.get('current_release_migrations',[])]==MIG4,'Build 1 green must carry migrations 0001-0004')
    req('CURRENT_RELEASE = 465' in runtime,'Build 1 green runtime release must be 465')
    ev=release.get('current_release_evidence',{});req(int(ev.get('development_native_migration_rows') or 0)==4 and int(ev.get('development_migration_proof_rows') or 0)==4,'Build 1 green must retain 4/4 migration evidence')
    req(ev.get('preview_smoke_pass') is True and ev.get('preview_access_weakened') is False and int(ev.get('preview_smoke_auth_headers_used') or 0)==0,'Build 1 final Preview smoke evidence drifted')
    req(all(str(x.get('status') or '').startswith('complete') for x in build.get('items',[])),'Build 1 green items must all be complete')

req(int(env.get('environment_release') or 0)==463 and env.get('canonical_pages_project')=='devilndove-site','Release 463 environment overlay drifted')
req(env.get('native_git_deployments',{}).get('enabled') is False,'native Git-triggered Pages deployments must remain frozen')
req(env.get('development',{}).get('d1',{}).get('id')=='dbc1615b-dcbe-4951-973b-b47c99c73bfa','environment Development D1 drifted')
req(env.get('production',{}).get('d1',{}).get('id')=='f34a741b-0000-45b0-9a96-6be08754d563','environment Production D1 drifted')
wr=read('wrangler.toml');req('database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"' in wr and 'f34a741b-0000-45b0-9a96-6be08754d563' not in wr and 'account_id =' not in wr,'tracked Wrangler Development boundary drifted')
for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','docs/operations/RELEASE_465_THREE_BUILD_ROADMAP.md','release465-build1-storefront-quality.json','migrations/canonical/0004_release465_storefront_quality.sql','scripts/release465_build1_gate.py'):
    req((ROOT/path).is_file(),f'canonical/current Build 1 file missing: {path}')
print('PLATFORM FORWARD SANITY')
print('Release 464 baseline: DEVELOPMENT GREEN / IMMUTABLE')
print(f"Release 465 Build 1: {'DEVELOPMENT GREEN' if green else 'SOURCE CANDIDATE / 0004 PENDING'}")
print('Environment release: 463')
print('Canonical migration stream: 0001 + 0002 + 0003 + 0004')
print('Provider execution/publication: CLOSED')
print('Production mutation: CLOSED')
if FAIL:
    for i,item in enumerate(FAIL,1): print(f'{i:03d}. FAIL — {item}')
    raise SystemExit(1)
print('PLATFORM FORWARD SANITY: PASS')
