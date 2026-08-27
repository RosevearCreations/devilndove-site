#!/usr/bin/env python3
"""One-time guarded Build 440 source synchronizer for mobile Product resource authority.

Local repository edit only. No Cloudflare, D1, R2, provider or Production access.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'functions/api/admin/mobile-create-product.js'


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'STOP: expected exactly one {label}; found {count}.')
    return text.replace(old, new, 1)


def regex_replace_once(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'STOP: expected exactly one {label}; found {count}.')
    return updated


def main() -> int:
    source = TARGET.read_text(encoding='utf-8')
    original = source

    source = replace_once(
        source,
        'import { DEFAULT_PRODUCT_NUMBER_START, allocateNextProductNumber, ensureProductNumberSequenceAtLeast, getNextProductNumber } from "./_product-numbering.js";\n',
        'import { DEFAULT_PRODUCT_NUMBER_START, allocateNextProductNumber, ensureProductNumberSequenceAtLeast, getNextProductNumber } from "./_product-numbering.js";\nimport { parseProductResourceLinksJson, persistProductResourceLinks } from "./_productResourcePersistence.js";\n',
        'mobile shared Product-resource import',
    )

    source = regex_replace_once(
        source,
        r'\nasync function saveResourceLinks\(\{ db, productId, resourceLinksRaw, supportsConsumptionMode, supportsLotSizeUnits \}\) \{.*?\n\}\n\nexport async function onRequestPost\(context\) \{',
        '\nexport async function onRequestPost(context) {',
        'legacy mobile saveResourceLinks implementation',
    )

    source = replace_once(
        source,
        '    const productColumns = await getTableColumnSet(db, "products");\n    const resourceColumns = await getTableColumnSet(db, "product_resource_links");\n    const supportsConsumptionMode = resourceColumns.has("consumption_mode");\n    const supportsLotSizeUnits = resourceColumns.has("lot_size_units");\n',
        '    const productColumns = await getTableColumnSet(db, "products");\n',
        'legacy mobile resource-column compatibility branch',
    )

    source = replace_once(
        source,
        '    await saveResourceLinks({ db, productId: resolvedProductId, resourceLinksRaw, supportsConsumptionMode, supportsLotSizeUnits });\n',
        '    await persistProductResourceLinks({\n      db,\n      productId: resolvedProductId,\n      links: parseProductResourceLinksJson(resourceLinksRaw),\n      adminUserId: Number(adminUser.user_id || 0) || null\n    });\n',
        'legacy mobile Product-resource save call',
    )

    source = regex_replace_once(
        source,
        r'      await db\.prepare\(`CREATE TABLE IF NOT EXISTS creative_project_product_links \(.*?\n      \)`\)\.run\(\);\n',
        "      // Build 214 migration owns creative_project_product_links; request-time schema mutation is forbidden.\n",
        'request-time creative_project_product_links DDL',
    )

    required = (
        'persistProductResourceLinks({',
        'parseProductResourceLinksJson(resourceLinksRaw)',
        'Build 214 migration owns creative_project_product_links',
    )
    for token in required:
        if token not in source:
            raise SystemExit(f'STOP: synchronized mobile source is missing required token: {token}')

    forbidden = (
        'async function saveResourceLinks',
        'supportsConsumptionMode',
        'supportsLotSizeUnits',
        'CREATE TABLE IF NOT EXISTS creative_project_product_links',
    )
    for token in forbidden:
        if token in source:
            raise SystemExit(f'STOP: stale mobile Product authority remains: {token}')

    if source == original:
        raise SystemExit('STOP: synchronizer made no change; source may already be aligned or no longer matches the guarded contract.')

    TARGET.write_text(source, encoding='utf-8')
    print('BUILD 440 MOBILE PRODUCT RESOURCE AUTHORITY SYNC: PASS')
    print('Desktop/mobile Product-resource authority: SHARED / ATOMIC D1 BATCH')
    print('Request-time creative_project_product_links DDL: REMOVED')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
