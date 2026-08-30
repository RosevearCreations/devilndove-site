#!/usr/bin/env python3
"""Release 461 source gate for package/base-unit inventory authority.

Source-only: no D1, R2, provider, Pages, or Production mutation.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
MIG = ROOT / 'migrations/dev/20260830_release461_inventory_base_unit_authority.sql'
API = ROOT / 'functions/api/admin/site-item-inventory.js'
BASE = ROOT / 'functions/api/admin/_inventoryBaseAuthority.js'
RES = ROOT / 'functions/api/admin/_productResourcesData.js'
LEGACY_API = ROOT / 'functions/api/admin/_siteItemInventoryLegacy.js'
LEGACY_RES = ROOT / 'functions/api/admin/_productResourcesDataLegacy.js'

for path in (MIG, API, BASE, RES, LEGACY_API, LEGACY_RES):
    if not path.is_file():
        raise SystemExit(f'Missing Release 461 inventory authority file: {path.relative_to(ROOT)}')

migration = MIG.read_text(encoding='utf-8')
api = API.read_text(encoding='utf-8')
base = BASE.read_text(encoding='utf-8')
resources = RES.read_text(encoding='utf-8')

checks = {
    'migration owns base balance table': 'CREATE TABLE IF NOT EXISTS site_inventory_base_balances' in migration,
    'migration backfills existing inventory once': 'INSERT OR IGNORE INTO site_inventory_base_balances' in migration and 'FROM site_item_inventory sii' in migration,
    'migration remains forward/additive': not re.search(r'\b(?:ALTER\s+TABLE|DROP\s+(?:TABLE|INDEX|TRIGGER|VIEW))\b', migration, re.I),
    'runtime wrapper preserves legacy implementation': "from './_siteItemInventoryLegacy.js'" in api,
    'runtime requires migration before inventory writes': 'assertInventoryBaseAuthorityReady' in api,
    'runtime synchronizes base authority after writes': 'syncInventoryBaseBalance' in api and 'syncInventoryBaseBalances' in api,
    'base helper performs no runtime DDL': not re.search(r'\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b', base, re.I),
    'product availability reads base authority': 'loadInventoryBaseBalances' in resources and "quantity_authority: 'base'" in resources,
    'product buildability uses base available quantity': 'baseAvailable / quantityUsed' in resources,
    'package cost remains purchase authority': 'purchase_unit_cost_cents' in resources and 'base_units_per_purchase_unit' in resources,
}

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('Release 461 inventory base-unit gate failed: ' + '; '.join(failed))

print('RELEASE 461 INVENTORY PACKAGE / BASE-UNIT AUTHORITY: PASS')
print('Purchase packaging/cost authority: PRESERVED')
print('Usable/base stock authority: CANONICAL')
print('Runtime DDL: NONE')
print('D1 / provider / R2 / Production mutation: NONE')
