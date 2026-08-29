#!/usr/bin/env python3
"""Release 448 expansion authority gate: all current workstreams/migrations stay machine-readable and safe."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
release=json.loads((ROOT/'development-release.json').read_text(encoding='utf-8'))
fail=[]
def req(ok,msg):
 if not ok:fail.append(msg)
req(release.get('release')==448,'Release 448 must remain current')
work={row.get('key'):row for row in release.get('workstreams',[])}
required_work={
 'product-material-lineage':'/admin/product-lineage/',
 'manufacturer-provenance-reviews':'/admin/vendor-reviews/',
 'product-image-quality':'/admin/product-image-quality/',
 'storefront-merchandising':'/admin/storefront-merchandising/',
 'caip-reviewed-content-handoff':'/admin/caip-content-handoff/',
 'inventory-operations-intelligence':'/admin/inventory-intelligence/',
 'tool-lifecycle':'/admin/tool-lifecycle/',
 'it-integration-registry':'/admin/it-integrations/',
}
for key,workspace in required_work.items():
 row=work.get(key,{})
 req(row.get('workspace')==workspace,f'{key} workspace authority missing/drifted')
 req('source_implemented' in str(row.get('status','')) or 'source_converged' in str(row.get('status','')),f'{key} source completion state not recorded')

migrations={row.get('key'):row for row in release.get('current_release_migrations',[])}
required_migrations={
 'product-lineage':('database_release448_product_lineage.sql','RELEASE448_PRODUCT_LINEAGE_VERIFICATION.sql','scripts/apply_development_product_lineage.py'),
 'media-movie-it':('database_release448_media_it.sql','RELEASE448_MEDIA_IT_VERIFICATION.sql','scripts/apply_development_release448_media_it.py'),
 'storefront-merchandising':('database_release448_storefront_merchandising.sql','RELEASE448_STOREFRONT_MERCHANDISING_VERIFICATION.sql','scripts/apply_development_release448_storefront_merchandising.py'),
 'caip-content-handoff':('database_release448_caip_content_handoff.sql','RELEASE448_CAIP_CONTENT_HANDOFF_VERIFICATION.sql','scripts/apply_development_release448_caip_content_handoff.py'),
 'tool-lifecycle':('database_release448_tool_lifecycle.sql','RELEASE448_TOOL_LIFECYCLE_VERIFICATION.sql','scripts/apply_development_release448_tool_lifecycle.py'),
}
req(len(migrations)==5,f'expected exactly 5 current Release 448 migrations, found {len(migrations)}')
for key,(file,verification,runner_path) in required_migrations.items():
 row=migrations.get(key,{})
 req(row.get('file')==file,f'{key} migration file authority drifted')
 req(row.get('verification')==verification,f'{key} verification authority drifted')
 runner=str(row.get('runner',''))
 req(runner.endswith(runner_path),f'{key} runner authority drifted')
 req(row.get('source_status')=='implemented_and_gated',f'{key} source must remain implemented_and_gated')
 req(row.get('development_d1_status') in {'blocked_missing_github_cloudflare_token','applied_and_verified_development'},f'{key} D1 state is not truthful/current')
 req(row.get('production_allowed') is False,f'{key} must never allow Production')
 req((ROOT/file).exists(),f'{key} migration file missing')
 req((ROOT/verification).exists(),f'{key} verification file missing')
 req((ROOT/runner_path).exists(),f'{key} runner missing')

inventory=(ROOT/'functions/api/admin/inventory-intelligence.js').read_text(encoding='utf-8')
tool=(ROOT/'functions/api/admin/tool-lifecycle.js').read_text(encoding='utf-8')
caip=(ROOT/'functions/api/admin/caip-content-handoff.js').read_text(encoding='utf-8')
req('write_authority_duplicated:false' in inventory,'Inventory Intelligence must declare single write authority')
req('tool_quantity_mutated:false' in tool,'Tool lifecycle must prove quantity is not lifecycle state')
req('source_media_copied:false' in caip and 'publication_active:false' in caip,'CAIP handoff must remain reference-only and non-publishing')
for marker in ('CAIP','Inventory','Supplies','Tools'):req(marker in release.get('forward_queue',[]),f'forward queue missing canonical anchor {marker}')
if fail:
 for i,msg in enumerate(fail,1):print(f'{i:03d}. FAIL — {msg}')
 raise SystemExit(1)
print('RELEASE 448 EXPANSION AUTHORITY: PASS')
print('Current migrations: 5')
print('Product / Storefront / CAIP / Inventory / Tool / I.T. workstreams: RECORDED')
print('Production mutation authority: NONE')
