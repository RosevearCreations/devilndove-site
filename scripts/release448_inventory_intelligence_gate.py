#!/usr/bin/env python3
"""Carried-forward Release 448 Inventory / Supplies / Tools operations intelligence gate."""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
api=(ROOT/'functions/api/admin/inventory-intelligence.js').read_text(encoding='utf-8')
page=(ROOT/'admin/inventory-intelligence/index.html').read_text(encoding='utf-8')
ui=(ROOT/'public/js/admin-inventory-intelligence.js').read_text(encoding='utf-8')
resource_path=ROOT/'functions/api/admin/_productResourcesDataLegacy.js'
if not resource_path.exists():resource_path=ROOT/'functions/api/admin/_productResourcesData.js'
resource=resource_path.read_text(encoding='utf-8')
resource_wrapper=(ROOT/'functions/api/admin/_productResourcesData.js').read_text(encoding='utf-8')
if resource_path.name=='_productResourcesDataLegacy.js' and "from './_productResourcesDataLegacy.js'" not in resource_wrapper:raise SystemExit('FAIL — Release 461 Product resource wrapper no longer retains the Release 448 Inventory authority implementation')
release=json.loads((ROOT/'development-release.json').read_text(encoding='utf-8'))
current=int(release.get('release') or 0)
if current<448:raise SystemExit('FAIL — current release predates Release 448 Inventory intelligence authority')
history={x.get('release'):x for x in release.get('release_history',[])}
if 448 not in history:raise SystemExit('FAIL — Release 448 history authority missing')
match=re.search(r'const\s+RELEASE\s*=\s*(\d+)',api)
if not match or int(match.group(1))<448:raise SystemExit('FAIL — Inventory intelligence API release authority regressed below Release 448')
if page.lower().count('<h1')!=1:raise SystemExit('FAIL — Inventory intelligence workspace must expose exactly one H1')
if 'noindex,nofollow' not in page:raise SystemExit('FAIL — Inventory intelligence workspace must remain private/noindex')
for required in ['site_item_inventory','product_resource_links','inventory_manufacturer_links','site_inventory_usage_profiles']:
 if required not in api:raise SystemExit(f'FAIL — Inventory intelligence missing existing authority reference: {required}')
for forbidden in ['CREATE TABLE','ALTER TABLE','INSERT INTO','UPDATE site_item_inventory','DELETE FROM site_item_inventory']:
 if forbidden in api:raise SystemExit(f'FAIL — Inventory intelligence must remain read-only: {forbidden}')
for issue in ['stockout','low_stock','reorder','blocked_reuse','manufacturer','usage_profile','tool_linkage','unused_supply']:
 if issue not in api:raise SystemExit(f'FAIL — Inventory queue issue class missing: {issue}')
if "write_authority_duplicated:false" not in api:raise SystemExit('FAIL — Inventory intelligence does not explicitly preserve single stock authority')
if 'Inventory is the operational authority' not in resource:raise SystemExit('FAIL — retained Product resource implementation no longer states Inventory authority')
if resource_path.name=='_productResourcesDataLegacy.js' and "quantity_authority: 'base'" not in resource_wrapper:raise SystemExit('FAIL — Release 461 Product resource wrapper must layer canonical base-unit availability over the retained Inventory authority')
print('RELEASE 448 INVENTORY INTELLIGENCE: CARRIED FORWARD PASS')
print(f'Current release: {current}')
print('Stock write authority: site_item_inventory / movement authority retained')
print('Release 461 base-unit read overlay: PRESENT')
print('New ledger/schema from intelligence endpoint: NONE')
print('Supply/Tool/Product-impact work queue: PRESENT')