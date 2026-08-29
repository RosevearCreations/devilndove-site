#!/usr/bin/env python3
"""Release 448 source gate for Inventory / Supplies / Tools operations intelligence."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
api=(ROOT/'functions/api/admin/inventory-intelligence.js').read_text(encoding='utf-8')
page=(ROOT/'admin/inventory-intelligence/index.html').read_text(encoding='utf-8')
ui=(ROOT/'public/js/admin-inventory-intelligence.js').read_text(encoding='utf-8')
resource=(ROOT/'functions/api/admin/_productResourcesData.js').read_text(encoding='utf-8')
for label,text in [('API',api),('page',page),('UI',ui)]:
 if '448' not in text:raise SystemExit(f'FAIL — Inventory intelligence {label} is not Release 448 current')
if page.lower().count('<h1')!=1:raise SystemExit('FAIL — Inventory intelligence workspace must expose exactly one H1')
for required in ['site_item_inventory','product_resource_links','inventory_manufacturer_links','site_inventory_usage_profiles']:
 if required not in api:raise SystemExit(f'FAIL — Inventory intelligence missing existing authority reference: {required}')
for forbidden in ['CREATE TABLE','ALTER TABLE','INSERT INTO','UPDATE site_item_inventory','DELETE FROM site_item_inventory']:
 if forbidden in api:raise SystemExit(f'FAIL — Inventory intelligence must remain read-only: {forbidden}')
for issue in ['stockout','low_stock','reorder','blocked_reuse','manufacturer','usage_profile','tool_linkage','unused_supply']:
 if issue not in api:raise SystemExit(f'FAIL — Inventory queue issue class missing: {issue}')
if "write_authority_duplicated:false" not in api:raise SystemExit('FAIL — Inventory intelligence does not explicitly preserve single stock authority')
if 'Inventory is the operational authority' not in resource:raise SystemExit('FAIL — existing Product resource loader no longer states Inventory authority')
print('RELEASE 448 INVENTORY INTELLIGENCE: PASS')
print('Stock write authority: site_item_inventory / movement authority retained')
print('New ledger/schema from intelligence endpoint: NONE')
print('Supply/Tool/Product-impact work queue: PRESENT')
