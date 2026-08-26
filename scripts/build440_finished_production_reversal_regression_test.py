#!/usr/bin/env python3
"""Build 440 local-only regression for audited Finished Production reversal."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
API = ROOT / 'functions/api/admin/product-production-reversal.js'
UI = ROOT / 'public/js/admin-product-production-reversal.js'
ADMIN = ROOT / 'public/js/admin.js'
SCHEMA = ROOT / 'database_full_schema.sql'


def read(path: Path) -> str:
    return path.read_text(encoding='utf-8') if path.exists() else ''


def main() -> int:
    api = read(API)
    ui = read(UI)
    admin = read(ADMIN)
    schema = read(SCHEMA)

    checks = [
        ('reversal endpoint exists and is Admin-authenticated', bool(api) and 'getAdminUserFromRequest' in api and "return json({ ok: false, error: 'Unauthorized.' }, 401)" in api),
        ('existing product_production_runs reversal fields remain the schema authority', all(token in schema for token in ('run_status', 'reversed_by_user_id', 'reversed_at', 'reversal_reason')) and "CHECK(run_status IN ('posted','reversed','failed'))" in schema),
        ('Build 440 reversal adds no request-time schema DDL', not re.search(r'\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX)\b|PRAGMA', api, re.I)),
        ('preview reads immutable production-run material rows', 'FROM product_production_run_materials' in api and 'stock_quantity_consumed' in api and 'returnByInventory' in api),
        ('snapshot returns are grouped by Inventory identity', 'current.return_stock_quantity' in api and 'returnByInventory.set(inventoryId, current)' in api),
        ('consumed material with missing Inventory identity blocks reversal', 'no longer has an Inventory identity' in api and 'Review this run manually before reversal.' in api),
        ('deleted/missing Inventory row blocks automatic reversal', 'from the production snapshot no longer exists' in api),
        ('only posted runs can reverse and already-reversed runs fail closed', "status === 'reversed'" in api and 'A production run can only be reversed once.' in api and "status !== 'posted'" in api),
        ('finished Product stock must still cover the run output', 'productInventoryBefore + EPSILON < outputQuantity' in api and 'cannot prove those units remain available' in api),
        ('lot-level sale provenance limitation is explicit rather than invented', "mode: 'finished_stock_quantity_fail_closed'" in api and 'lot_sale_provenance_available: false' in api),
        ('reversal requires an explicit meaningful reason', 'reason.length < 8' in api and 'product_production_reversal_reason_required' in api),
        ('run is retained and marked reversed with actor/time/reason', "SET run_status='reversed',reversed_by_user_id=?,reversed_at=?,reversal_reason=?" in api),
        ('finished Product quantity is decremented with optimistic concurrency guard', 'SET inventory_quantity=?,updated_at=CURRENT_TIMESTAMP' in api and 'ABS(COALESCE(inventory_quantity,0)-?)<?' in api and 'COALESCE(inventory_quantity,0)>=?' in api),
        ('raw Inventory is returned from snapshot quantities with optimistic guard', 'SET on_hand_quantity=?,last_seen_at=CURRENT_TIMESTAMP' in api and 'returnQuantity' in api and 'ABS(COALESCE(on_hand_quantity,0)-?)<?' in api),
        ('compensating Inventory movements are written', "'correction'" in api and 'Reversal of finished production run' in api),
        ('all mutations are bound to this request-specific reversal claim', 'r.reversed_at=? AND r.reversed_by_user_id=?' in api),
        ('partial reversal is compensated and run status restored', 'compensateFailedReversal' in api and "SET run_status='posted',reversed_by_user_id=NULL,reversed_at=NULL,reversal_reason=NULL" in api and 'Automatic compensation for failed production reversal' in api),
        ('concurrent/double reversal returns stable safe error codes', 'product_production_reversal_concurrent_inventory_change' in api and 'product_production_reversal_already_claimed' in api and 'product_production_reversal_not_eligible' in api),
        ('successful reversal is Admin-audited', "action_type: 'product_production_release_reverse'" in api and "target_type: 'product_production_run'" in api),
        ('failed reversal records a bounded runtime incident', "incident_scope: 'product_production_reversal'" in api and 'error_code' in api),
        ('Products page loads the reversal workspace only on the Products Admin page', "dataset?.adminPage === 'products'" in admin and "admin-product-production-reversal.js?v=440" in admin),
        ('UI forces read-only review before reverse', 'Review reversal' in ui and 'No stock changes are made by Review.' in ui and '!Number(state.preview?.eligible)' in ui),
        ('UI exposes immutable compensation plan and explicit reason', 'Reversal reason' in ui and 'return_plan' in ui and 'Finished Product stock' in ui and 'Raw Inventory compensation' in ui),
        ('UI is event-driven/responsive and contains no polling/provider execution', 'MutationObserver' in ui and '@media(max-width:800px)' in ui and 'setInterval' not in ui and 'setTimeout' not in ui and 'provider_url' not in ui),
        ('UI refreshes production history and normal preview after successful reversal', 'await loadHistory()' in ui and "productProductionPreviewButton')?.click()" in ui and "dd:product-production-reversed" in ui),
        ('reversal path performs no R2/source-media mutation', all(token not in api for token in ('.put(', '.delete(', 'R2', 'provider_url', 'fetch('))),
    ]

    failures = []
    print('BUILD 440 FINISHED PRODUCTION REVERSAL REGRESSION')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE\n')
    for index, (label, ok) in enumerate(checks, 1):
        print(f'{index:02d}. {"PASS" if ok else "FAIL"} — {label}')
        if not ok:
            failures.append(label)

    if failures:
        print(f'\nBUILD 440 FINISHED PRODUCTION REVERSAL REGRESSION: FAIL ({len(failures)}/{len(checks)} failed)')
        for failure in failures:
            print(' -', failure)
        return 1

    print(f'\nBUILD 440 FINISHED PRODUCTION REVERSAL REGRESSION: PASS ({len(checks)}/{len(checks)})')
    print('Existing production run authority: PRESERVED / NO NEW TABLE')
    print('Raw material return: IMMUTABLE RUN SNAPSHOT')
    print('Finished Product decrement: FAIL-CLOSED CURRENT-STOCK GUARD')
    print('Double reversal: BLOCKED')
    print('Partial concurrency failure: COMPENSATED')
    print('Lot-level sale provenance: NOT CLAIMED')
    print('Production promotion: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
