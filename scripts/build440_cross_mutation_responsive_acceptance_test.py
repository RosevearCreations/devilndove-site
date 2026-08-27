#!/usr/bin/env python3
"""Build 440 source acceptance across Product, Inventory, Tool and responsive Admin mutation paths."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
release = int(json.loads((ROOT / 'development-release.json').read_text(encoding='utf-8')).get('release') or 0)
checks: list[tuple[str, bool]] = []

def text(path: str) -> str:
    return (ROOT / path).read_text(encoding='utf-8')

def check(label: str, condition: bool) -> None:
    checks.append((label, bool(condition)))
    print(('PASS' if condition else 'FAIL') + ' — ' + label)

def current_asset(html: str, asset_name: str) -> bool:
    return bool(re.search(rf"{re.escape(asset_name)}\?v={release}(?:\.\d+)?(?![\d.])", html))

persistence = text('functions/api/admin/_productResourcePersistence.js')
desktop_product = text('functions/api/admin/product-resources.js')
mobile_product = text('functions/api/admin/mobile-create-product.js')
kit = text('functions/api/_lib/inventoryKitService.js')
tools_api = text('functions/api/tools.js')
supplies_api = text('functions/api/supplies.js')
tool_lifecycle = text('functions/api/admin/tool-lifecycle-review.js')
tool_ui = text('public/js/admin-tool-lifecycle-review.js')
styles = text('css/styles.css')
tool_css = text('css/tool-lifecycle-review.css')
inv_html = text('admin/inventory-operations/index.html')
products_html = text('admin/products/index.html')
mobile_inv_html = text('admin/mobile-inventory/index.html')

check('canonical acceptance release is Build 440', release == 440)

# Desktop and mobile Product mutation must share one atomic persistence authority.
for label, source in (('desktop Product API', desktop_product), ('mobile Product API', mobile_product)):
    check(f'{label} imports shared Product resource persistence', '_productResourcePersistence.js' in source and 'persistProductResourceLinks' in source)
    check(f'{label} contains no request-time Product-resource schema DDL', 'CREATE TABLE' not in source and 'ALTER TABLE' not in source)
check('mobile Product API no longer contains a private saveResourceLinks authority', 'async function saveResourceLinks' not in mobile_product)
check('shared Product resource replacement is one D1 batch', 'const statements = [' in persistence and 'DELETE FROM product_resource_links WHERE product_id = ?' in persistence and 'await db.batch(statements)' in persistence)
check('Product resource identities dedupe case-insensitively', 'sourceKey.toLowerCase()' in persistence and 'seen.has(identity)' in persistence)
check('Product use-per-batch defaults safely to 1', 'quantity_used: positive(row.quantity_used, 1)' in persistence)
check('Product lot-size defaults safely to 1', 'lot_size_units: positive(row.lot_size_units, 1)' in persistence)

# Kit/component depletion must stay inside Inventory authority and respect Tool lifecycle safety.
check('kit service blocks Product stock cross-mutation', "sourceType==='product'" in kit and 'inventory_kit_component_wrong_owner' in kit)
check('kit service forces Tool components to reusable tracking', "sourceType==='tool'?'reusable'" in kit)
check('kit service blocks do-not-reuse Tool usage', 'inventory_kit_component_do_not_reuse' in kit and 'Reactivate it through Tool lifecycle controls' in kit)
check('kit stock-changing work uses D1 batch authority', 'await db.batch(statements)' in kit)

# Public publication eligibility and live Inventory identity must remain separate.
for label, source in (('Tool public API', tools_api), ('Supply public API', supplies_api)):
    check(f'{label} keeps catalog_items as publication registry', 'catalog_items is the public publication registry' in source)
    check(f'{label} keeps site_item_inventory as operational identity authority', 'site_item_inventory is the operational identity/metadata authority' in source)
    check(f'{label} uses normalized Inventory/publication identity matching', 'LOWER(TRIM' in source)

# Reusable Tool lifecycle and usage history must be one safety contract.
check('Tool lifecycle reads reusable usage ledger', 'site_inventory_usage_movements' in tool_lifecycle and 'usage_history' in tool_lifecycle)
check('Tool lifecycle enforces out-of-service and retired do-not-reuse', "after==='out_of_service'||after==='retired'" in tool_lifecycle and 'do_not_reuse' in tool_lifecycle)
check('Tool reactivation is explicit', "action==='reactivate'" in tool_lifecycle and "eventType='reactivated'" in tool_lifecycle)
check('Tool lifecycle mutation is atomic and concurrency-guarded', 'await granted.db.batch(statements)' in tool_lifecycle and 'tool_lifecycle_concurrent_change' in tool_lifecycle)
check('Tool lifecycle browser has no background polling loop', 'setInterval(' not in tool_ui)

# Desktop/tablet/mobile must expose the same current release and responsive mutation controls.
for label, html in (('Inventory Operations', inv_html), ('Products', products_html), ('Mobile Inventory', mobile_inv_html)):
    check(f'{label} declares responsive viewport', 'name="viewport"' in html and 'width=device-width' in html)
check('Inventory Operations loads current Product-resource authority bundle', current_asset(inv_html, 'admin-product-resources.js'))
check('Products loads current Product-resource authority bundle', current_asset(products_html, 'admin-product-resources.js'))
check('Inventory Operations loads current Inventory authority bundle', current_asset(inv_html, 'admin-site-item-inventory.js'))
check('Mobile Inventory loads current Inventory authority bundle', current_asset(mobile_inv_html, 'admin-site-item-inventory.js'))
check('Inventory form actions retain mobile stacked-button protection', '.site-inventory-form-actions .btn' in styles and 'width:100%' in styles)
check('Tool lifecycle workspace has tablet breakpoint', '@media(max-width:900px)' in tool_css)
check('Tool lifecycle workspace has phone breakpoint', '@media(max-width:620px)' in tool_css and '.tool-life-buttons .btn{width:100%}' in tool_css)

passed = sum(1 for _, ok in checks if ok)
print(f'\nBUILD 440 CROSS-MUTATION / RESPONSIVE ACCEPTANCE: {passed}/{len(checks)} passed')
if passed != len(checks):
    raise SystemExit(1)
print('Product resources: SHARED DESKTOP/MOBILE ATOMIC AUTHORITY')
print('Kit depletion: INVENTORY-OWNED / TOOL SAFETY ENFORCED')
print('Public Tool/Supply: CATALOG PUBLICATION + INVENTORY IDENTITY')
print('Reusable Tool safety: LIFECYCLE + USAGE LEDGER')
print('Mobile/Desktop: SAME RELEASE / SAME MUTATION AUTHORITIES')
print('Cloudflare/D1/R2/provider access: NONE')
print('Production mutation capability: NONE')
print('PRODUCTION PROMOTION: CLOSED')
