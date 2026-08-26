#!/usr/bin/env python3
"""Build 440 local-only regression for Inventory physical-count and usage-setup review."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
API = ROOT / 'functions/api/admin/inventory-integrity-review.js'
UI = ROOT / 'public/js/admin-inventory-integrity-review.js'
PAGE = ROOT / 'admin/inventory-operations/index.html'
CSS = ROOT / 'css/inventory-integrity-review.css'


def read(path: Path) -> str:
    return path.read_text(encoding='utf-8') if path.exists() else ''


def main() -> int:
    api = read(API)
    ui = read(UI)
    page = read(PAGE)
    css = read(CSS)

    movement_pos = api.find('conditionalCountMovement(granted.db')
    update_pos = api.find("UPDATE site_item_inventory\n      SET on_hand_quantity=?,last_counted_at=CURRENT_TIMESTAMP")

    checks = [
        ('review API exists and is Admin-authenticated', API.exists() and 'getAdminUserFromRequest' in api and "Admin access required." in api),
        ('review uses existing Inventory authorities only', all(token in api for token in ('site_item_inventory','site_inventory_usage_profiles','site_inventory_movements'))),
        ('review API contains no request-time schema DDL', not re.search(r'\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX)\b|PRAGMA', api, re.I)),
        ('attention reads are bounded and paginated', 'const MAX_LIMIT = 80' in api and 'LIMIT ? OFFSET ?' in api and 'next_offset' in api),
        ('summary is SQL aggregate rather than an unbounded all-row materialization', 'COUNT(*) AS active_items' in api and 'SUM(CASE WHEN' in api and 'summaryRows' not in api),
        ('physical count queue treats never-counted and 90-day stale stock as due', "datetime('now','-90 days')" in api and "'never_counted'" in api and "'stale_count'" in api),
        ('usage-setup queue is limited to supplies with missing/default legacy safe profiles', "LOWER(TRIM(COALESCE(sii.source_type,'')))='supply'" in api and 'siup.site_item_inventory_id IS NULL' in api and 'until unit conversion is reviewed' in api),
        ('intentional reviewed log-only setup can remain log-only', "trackingMode === 'log_only'" in api and 'reviewNote.length < 8' in api and 'reviewedNote' in api),
        ('physical count accepts truthful zero quantity', 'counted < 0' in api and 'counted <= 0' not in api),
        ('physical count requires a meaningful reason', 'reason.length < 6' in api and 'inventory_count_reason_required' in api),
        ('count correction movement is conditional on the same expected stock quantity', 'INSERT INTO site_inventory_movements' in api and "WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<?" in api),
        ('conditional count movement is prepared before the guarded stock update', movement_pos >= 0 and update_pos >= 0 and movement_pos < update_pos),
        ('count stamps last_counted_at and writes correction movement', 'last_counted_at=CURRENT_TIMESTAMP' in api and "'correction'" in api and 'Physical count.' in api),
        ('physical count requires both batch claims to succeed', "results?.[0]?.meta?.changes" in api and "results?.[1]?.meta?.changes" in api and 'inventory_count_concurrent_change' in api),
        ('physical count reports reservation shortage without hiding truthful stock', 'shortage_against_reservations' in api and 'counted < num(item.reserved_quantity)' in api),
        ('physical count and usage setup are Admin-audited', "action_type: 'inventory_physical_count'" in api and "action_type: 'inventory_usage_setup_review'" in api),
        ('usage review preserves fractional conversion authority', all(token in api for token in ('usage_units_per_stock_unit','minimum_usage_increment','usage_tracking_mode'))),
        ('usage review upserts the existing usage profile rather than creating schema', 'ON CONFLICT(site_item_inventory_id) DO UPDATE SET' in api and 'INSERT INTO site_inventory_usage_profiles' in api),
        ('usage setup does not mutate on-hand stock', 'SET stock_unit_label=?,usage_unit_label=?,usage_units_per_stock_unit=?' in api),
        ('Inventory Operations page mounts and loads the review workspace', 'inventoryIntegrityReviewMount' in page and 'admin-inventory-integrity-review.js?v=440' in page and 'inventory-integrity-review.css?v=440' in page),
        ('UI exposes count due and usage setup queues', 'Physical count due' in ui and 'Usage setup required' in ui and 'All attention' in ui),
        ('UI requires explicit physical-count confirmation when quantity changes', 'window.confirm' in ui and 'Save physical count' in ui and 'Correction:' in ui),
        ('UI supports reviewed intentional log-only usage', 'Intentional log-only usage needs a clear review note' in ui and 'Save reviewed usage setup' in ui),
        ('UI startup is deduplicated and contains no polling', 'startRequested' in ui and 'setInterval' not in ui and 'setTimeout' not in ui),
        ('review workspace is responsive on tablet and phone', '@media(max-width:900px)' in css and '@media(max-width:620px)' in css),
        ('review slice contains no R2/provider execution', all(token not in (api + ui) for token in ('bucket.put(', 'bucket.delete(', 'provider_url', 'provider.execute', '/api/provider/'))),
    ]

    failures = []
    print('BUILD 440 INVENTORY INTEGRITY REVIEW REGRESSION')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE\n')
    for index, (label, ok) in enumerate(checks, 1):
        print(f'{index:02d}. {"PASS" if ok else "FAIL"} — {label}')
        if not ok:
            failures.append(label)

    if failures:
        print(f'\nBUILD 440 INVENTORY INTEGRITY REVIEW REGRESSION: FAIL ({len(failures)}/{len(checks)} failed)')
        for failure in failures:
            print(' -', failure)
        return 1

    print(f'\nBUILD 440 INVENTORY INTEGRITY REVIEW REGRESSION: PASS ({len(checks)}/{len(checks)})')
    print('Physical count: AUDITED / ZERO-ALLOWED / CONCURRENCY-GUARDED')
    print('Usage Setup Required: LEGACY SAFE DEFAULTS ONLY / HUMAN REVIEWED')
    print('Inventory schema: EXISTING AUTHORITIES / NO NEW TABLE')
    print('Polling/provider/R2 execution: NONE')
    print('Production promotion: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
