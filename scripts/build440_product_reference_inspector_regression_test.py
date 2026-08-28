#!/usr/bin/env python3
"""Build 440 local-only regression for the Product Delete Reference Inspector."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DELETE_API = ROOT / 'functions/api/admin/delete-product.js'
DELETE_UI = ROOT / 'public/js/admin-delete-product.js'
CLEANUP_UI = ROOT / 'public/js/admin-product-cleanup.js'
ARCHIVE_API = ROOT / 'functions/api/admin/archive-product.js'


def read(path: Path) -> str:
    return path.read_text(encoding='utf-8') if path.exists() else ''


def main() -> int:
    api = read(DELETE_API)
    ui = read(DELETE_UI)
    cleanup = read(CLEANUP_UI)
    archive = read(ARCHIVE_API)

    protected = [
        'order_items.product_id',
        'product_production_runs.product_id',
        'product_finished_inventory_lots.product_id',
        'creative_project_cost_allocations.product_id',
        'accounting_overhead_product_allocations.product_id',
        'product_costs.product_id',
        'packaging_projects.product_id',
        'product_bundle_components.component_product_id',
        'marketplace_margin_override_history.product_id',
        'approved_before_after_gallery_items.product_id',
        'customer_story_approval_batches.product_id',
        'customer_story_output_drafts.product_id',
        'public_proof_candidates.product_id',
        'recall_customer_match_previews.product_id',
        'trust_block_items.related_product_id',
    ]

    checks = [
        ('delete API keeps bounded protected-reference registry', all(token in api for token in protected) and 'PROTECTED_PRODUCT_REFERENCES' in api),
        ('finished inventory lot provenance blocks destructive Product deletion', "'product_finished_inventory_lots.product_id'" in api and 'PROTECTED_PRODUCT_REFERENCES' in api),
        ('historical product costs remain protected accounting evidence', "'product_costs.product_id'" in api and 'PROTECTED_PRODUCT_REFERENCES' in api),
        ('finished inventory lot inspector opens Creative Process owner', "product_finished_inventory_lots: { label: 'Finished inventory lot provenance'" in ui and '/admin/creative-process/?product_id=' in ui),
        ('historical Product cost inspector opens Accounting owner', "product_costs: { label: 'Historical Product costs'" in ui and "href: '/admin/accounting/'" in ui),
        ('media integrity snapshots are product-owned diagnostic cleanup', "'product_media_integrity_snapshots.product_id'" in api and 'PRODUCT_OWNED_CLEANUP_RELATIONS' in api),
        ('delete API distinguishes protected history from material review', 'history_allows_removal' in api and 'material_review_required' in api and 'requires_archive: historyAllowsRemoval ? 0 : 1' in api),
        ('POST requires Archive only when protected history exists', 'if (Number(preflight.history_allows_removal || 0) !== 1)' in api and "code: 'protected_product_references'" in api),
        ('reviewable material reservations fail closed without masquerading as archive', "code: 'material_review_required'" in api and 'requires_archive: false' in api),
        ('delete API blocks permanent removal when protected history exists', 'requires_archive: true' in api and 'cannot be permanently deleted. Archive it instead.' in api),
        ('delete API preserves reusable media by detaching rather than deleting it', 'PRODUCT_DETACH_RELATIONS' in api and 'SET ${quoteIdentifier(columnName)} = NULL' in api),
        ('delete API preserves generated project work unless it is unreviewed automation shell', 'discoverManagedProductProjectShells' in api and 'meaningful_evidence_count' in api and 'AUTO_CLEAN_GENERATED_SHELL' in api),
        ('reference inspector replaces blocker alert with structured dialog', 'DDProductReferenceInspector' in ui and 'Product Delete Reference Inspector' in ui and 'renderInspector' in ui),
        ('direct delete UI sends material reservations to reviewed correction instead of history inspector', 'historyAllowsRemoval' in ui and 'material_review_required' in ui and 'Use Correct / remove' in ui),
        ('inspector refresh exits once protected history is clear even if material review remains', 'Protected history is clear. Linked material reservations still require the reviewed Correct / remove workflow' in ui),
        ('inspector explains protected history instead of encouraging destructive reference deletion', 'Do not delete those records simply to make the product removable.' in ui and 'Archive product instead' in ui),
        ('inspector provides owning-workspace links for key blocker families', all(token in ui for token in ('/admin/orders/', '/admin/accounting/', '/admin/packaging-studio/', '/admin/creative-assets/', '/admin/content-studio/'))),
        ('inspector can refresh the live preflight before any later delete attempt', 'data-dd-product-ref-refresh' in ui and '/api/admin/delete-product?product_id=' in ui and "cache: 'no-store'" in ui),
        ('inspector archive action uses the audited archive endpoint', '/api/admin/archive-product' in ui and "action_type: 'product_archive'" in archive),
        ('cleanup centre reuses the same inspector contract', 'DDProductReferenceInspector?.open' in cleanup and 'Inspect protected references' in cleanup),
        ('permanent remove stays disabled when history or material review blocks it', 'deleteButton.disabled = !allowed' in cleanup and 'historyAllowsRemoval && materialReviewRows.length === 0' in cleanup),
        ('inspector is responsive and keyboard closeable', '@media(max-width:640px)' in ui and "event.key === 'Escape'" in ui and "aria-modal=\"true\"" in ui),
        ('reference inspector performs no request-time schema mutation', all(token not in ui for token in ('CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'CREATE INDEX'))),
        ('Build 440 slice does not add provider/background polling behavior', 'setInterval' not in ui and 'setTimeout' not in ui and 'provider_url' not in ui),
    ]

    failures = []
    print('BUILD 440 PRODUCT DELETE REFERENCE INSPECTOR REGRESSION')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE\n')
    for index, (label, ok) in enumerate(checks, 1):
        print(f'{index:02d}. {"PASS" if ok else "FAIL"} — {label}')
        if not ok:
            failures.append(label)

    if failures:
        print(f'\nBUILD 440 PRODUCT DELETE REFERENCE INSPECTOR REGRESSION: FAIL ({len(failures)}/{len(checks)} failed)')
        for failure in failures:
            print(' -', failure)
        return 1

    print(f'\nBUILD 440 PRODUCT DELETE REFERENCE INSPECTOR REGRESSION: PASS ({len(checks)}/{len(checks)})')
    print('Protected business/customer/accounting/inventory provenance history: PRESERVED')
    print('Material reservations: REVIEW REQUIRED / NOT MISCLASSIFIED AS HISTORY')
    print('Product media diagnostic snapshots: PRODUCT-OWNED CLEANUP')
    print('Permanent deletion authority: UNCHANGED / UNUSED PRODUCTS ONLY')
    print('Blocked-product resolution: INSPECT / OPEN OWNER / ARCHIVE')
    print('Production promotion: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
