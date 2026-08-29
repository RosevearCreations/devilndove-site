#!/usr/bin/env python3
"""Release 448 carried-forward regression authority gate.

Release 448 is provenance, not the current-release identity. This gate protects the
platform capabilities introduced there while allowing later Development releases.
"""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
release=json.loads((ROOT/'development-release.json').read_text(encoding='utf-8'))
fail=[]
def req(ok,msg):
 if not ok:fail.append(msg)
req(int(release.get('release') or 0)>=448,'current Development release cannot predate Release 448')
req(release.get('environment')=='development' and release.get('branch')=='dev','current authority must remain Development/dev')
work={row.get('key'):row for row in release.get('workstreams',[])}
required_work={
 'product-material-lineage':'/admin/product-lineage/',
 'manufacturer-provenance-reviews':'/admin/vendor-reviews/',
 'product-image-quality':'/admin/product-image-quality/',
 'storefront-merchandising':'/admin/storefront-merchandising/',
 'caip-reviewed-content-handoff':'/admin/caip-content-handoff/',
 'inventory-operations-intelligence':'/admin/inventory-intelligence/',
 'tool-lifecycle':'/admin/tool-lifecycle/',
 'supply-sourcing-replenishment':'/admin/supply-sourcing/',
 'release448-calibration':'/admin/release448-calibration/',
 'it-integration-registry':'/admin/it-integrations/',
}
for key,workspace in required_work.items():
 row=work.get(key,{})
 req(row.get('workspace')==workspace,f'{key} carried-forward workspace authority missing/drifted')

required_migrations={
 'product-lineage':('database_release448_product_lineage.sql','RELEASE448_PRODUCT_LINEAGE_VERIFICATION.sql','scripts/apply_development_product_lineage.py'),
 'media-movie-it':('database_release448_media_it.sql','RELEASE448_MEDIA_IT_VERIFICATION.sql','scripts/apply_development_release448_media_it.py'),
 'storefront-merchandising':('database_release448_storefront_merchandising.sql','RELEASE448_STOREFRONT_MERCHANDISING_VERIFICATION.sql','scripts/apply_development_release448_storefront_merchandising.py'),
 'caip-content-handoff':('database_release448_caip_content_handoff.sql','RELEASE448_CAIP_CONTENT_HANDOFF_VERIFICATION.sql','scripts/apply_development_release448_caip_content_handoff.py'),
 'tool-lifecycle':('database_release448_tool_lifecycle.sql','RELEASE448_TOOL_LIFECYCLE_VERIFICATION.sql','scripts/apply_development_release448_tool_lifecycle.py'),
 'supply-sourcing':('database_release448_supply_sourcing.sql','RELEASE448_SUPPLY_SOURCING_VERIFICATION.sql','scripts/apply_development_release448_supply_sourcing.py'),
}
for key,(file,verification,runner) in required_migrations.items():
 req((ROOT/file).exists(),f'Release 448 {key} migration file missing')
 req((ROOT/verification).exists(),f'Release 448 {key} verification file missing')
 req((ROOT/runner).exists(),f'Release 448 {key} runner missing')

inventory=(ROOT/'functions/api/admin/inventory-intelligence.js').read_text(encoding='utf-8')
tool=(ROOT/'functions/api/admin/tool-lifecycle.js').read_text(encoding='utf-8')
supply=(ROOT/'functions/api/admin/supply-sourcing.js').read_text(encoding='utf-8')
caip=(ROOT/'functions/api/admin/caip-content-handoff.js').read_text(encoding='utf-8')
calibration=(ROOT/'functions/api/admin/release448-calibration.js').read_text(encoding='utf-8')
promotion=(ROOT/'scripts/release448_promotion_rehearsal.py').read_text(encoding='utf-8')
req('write_authority_duplicated:false' in inventory,'Inventory Intelligence must retain single write authority')
req('tool_quantity_mutated:false' in tool,'Tool lifecycle must retain quantity separation')
req("stock_mutation_capability:'none'" in supply and 'automatic_ordering:false' in supply,'Supply sourcing must remain planning-only')
req('source_media_copied:false' in caip and 'publication_active:false' in caip,'CAIP handoff must remain reference-only/non-publishing')
req("calibration_ledger_duplicated:false" in calibration and "mutation_capability:'none'" in calibration,'Calibration cockpit must remain derived/read-only')
req('READ-ONLY' in promotion and '--source-check' in promotion,'Release 448 promotion rehearsal must remain read-only regression authority')
req(release.get('release_policy',{}).get('production_promotion')=='closed','Production promotion must remain closed')
if fail:
 for i,msg in enumerate(fail,1):print(f'{i:03d}. FAIL — {msg}')
 raise SystemExit(1)
print('RELEASE 448 CARRIED-FORWARD AUTHORITY: PASS')
print('Release 448 capabilities/migrations: RETAINED AS REGRESSION AUTHORITY')
print(f"Current release: {release.get('release')}")
print('Production mutation authority: NONE')
