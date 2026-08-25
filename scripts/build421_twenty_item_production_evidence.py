#!/usr/bin/env python3
"""Build 421 twenty-item live read-only Production risk/orphan/manifest gate.

Runs the twenty ordered Build 421 items from Build 420:
- bounded live Production data-risk/orphan checks;
- semantic products.product_number uniqueness comparison;
- search_query_terms and __sql_test source/row authority classification;
- generation of a NON-EXECUTING Production migration manifest;
- a hard gate that never generates an executable Production mutation helper.

No DDL, DML, R2 action, provider action, or deployment action exists here.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import sys
import tempfile

import build418_live_semantic_schema_classification as base
import build418_live_semantic_schema_classification_resilient  # noqa: F401

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / 'build421_non_executing_production_migration_manifest.local.md'


@dataclass
class Evidence:
    number: int
    label: str
    summary: str
    blocker: bool = False


def as_int(value) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def one(rows: list[dict]) -> dict:
    return rows[0] if rows else {}


def q(npx: str, cfg: Path, sql: str, label: str) -> list[dict]:
    return base.query_rows(npx, cfg, sql, f'BUILD 421 {label}')


def record(items: list[Evidence], label: str, summary: str, *, blocker: bool = False) -> None:
    number = len(items) + 1
    items.append(Evidence(number, label, summary, blocker))
    state = 'BLOCKER' if blocker else 'PASS'
    print(f'{number:02d}. {state} — {label}')
    print(f'    {summary}')


def fractional_expr(columns: list[str]) -> str:
    tests = [
        f"(CAST({column} AS REAL) != CAST(CAST({column} AS REAL) AS INTEGER))"
        for column in columns
    ]
    return ' OR '.join(tests)


def source_refs(table: str) -> list[str]:
    return base.source_refs(table)


def runtime_refs(refs: list[str]) -> list[str]:
    return [
        ref for ref in refs
        if ref.startswith(('functions/', 'public/', 'admin/')) or ref.endswith(('.js', '.mjs', '.html'))
    ]


def manifest_text(items: list[Evidence]) -> str:
    blockers = [item for item in items if item.blocker]
    lines = [
        '# Build 421 — Non-Executing Production Migration Manifest',
        '',
        'Generated from live read-only evidence. This file is a planning artifact only.',
        '',
        '## Safety',
        '',
        '- Executable Production helper generated: **NO**',
        '- Production DDL/DML executed: **NO**',
        '- R2/provider mutation executed: **NO**',
        '- Production promotion: **CLOSED**',
        '',
        '## Evidence summary',
        '',
    ]
    for item in items:
        state = 'BLOCKER' if item.blocker else 'PASS'
        lines.append(f'{item.number}. **{state} — {item.label}.** {item.summary}')
    lines += [
        '',
        '## Planned migration phases',
        '',
        '1. Preserve/record a current Production D1 backup/export before any future write.',
        '2. Additive Gift Card lookup columns/indexes and `gift_card_lookup_lockouts` first.',
        '3. Additive Notification `metadata_json` and approved indexes.',
        '4. Apply approved additive indexes that do not require table rebuild.',
        '5. Data-preserving Membership tier-policy rebuild using explicit legacy-to-current mapping.',
        '6. Fractional Inventory/Creative Project rebuild family with exact row and value preservation.',
        '7. Product/FK rebuild family only after all orphan/uniqueness blockers are zero or remediated.',
        '8. Accounting/default/nullability rebuild family only after data-compatibility blockers are zero or mapped.',
        '9. Run `PRAGMA foreign_key_check`, schema signatures, and bounded business-data anchor counts.',
        '10. Re-run browser/read-contract proof; provider mutations remain fail-closed.',
        '',
        '## Gate',
        '',
        f'- Evidence blockers observed: **{len(blockers)}**.',
        '- Executable Production helper: **REFUSED / NOT GENERATED**.',
        '- A later build may create an executable helper only after every blocker has an explicit reviewed remediation and rollback boundary.',
        '',
    ]
    return '\n'.join(lines)


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] != '--run':
        print('BUILD 421 TWENTY-ITEM LIVE READ-ONLY PRODUCTION EVIDENCE / MANIFEST GATE')
        print('Run explicitly with:')
        print('  python -u scripts/build421_twenty_item_production_evidence.py --run')
        return 2

    base.validate_dev_pin()
    npx = base.npx_path()

    print('BUILD 421 TWENTY-ITEM LIVE READ-ONLY PRODUCTION EVIDENCE / MANIFEST GATE')
    print(f'Git branch: {base.current_branch()}')
    print(f'Production target: {base.PROD_DATABASE} ({base.PROD_DATABASE_ID})')
    print('SQL guard: SELECT / inspection-only PRAGMA — PASS')
    print('PRODUCTION MUTATION CAPABILITY IN THIS HELPER: NONE')
    print('EXECUTABLE PRODUCTION HELPER CAPABILITY: NONE')
    print()

    evidence: list[Evidence] = []

    with tempfile.TemporaryDirectory(prefix='dd-build421-') as temp_dir:
        temp = Path(temp_dir)
        prod_cfg = temp / 'prod.toml'
        dev_cfg = temp / 'dev.toml'
        prod_cfg.write_text(
            base.readonly_config(base.PROD_PROJECT, base.PROD_DATABASE, base.PROD_DATABASE_ID),
            encoding='utf-8',
        )
        dev_cfg.write_text(
            base.readonly_config(base.DEV_PROJECT, base.DEV_DATABASE, base.DEV_DATABASE_ID),
            encoding='utf-8',
        )

        # 1 — accounting_expenses
        row = one(q(
            npx, prod_cfg,
            "SELECT COUNT(*) AS rows,"
            "SUM(CASE WHEN expense_date IS NULL OR trim(expense_date)='' THEN 1 ELSE 0 END) AS missing_expense_date "
            "FROM accounting_expenses;",
            'ACCOUNTING EXPENSES DATA RISK',
        ))
        record(
            evidence, 'Accounting expenses nullability/data-risk preflight',
            f"rows={as_int(row.get('rows'))}, missing_expense_date={as_int(row.get('missing_expense_date'))}",
        )

        # 2 — accounting_writeoffs
        row = one(q(
            npx, prod_cfg,
            "SELECT COUNT(*) AS rows,"
            "SUM(CASE WHEN item_name IS NULL OR trim(item_name)='' THEN 1 ELSE 0 END) AS missing_item_name,"
            "SUM(CASE WHEN updated_at IS NULL OR trim(updated_at)='' THEN 1 ELSE 0 END) AS missing_updated_at,"
            "SUM(CASE WHEN writeoff_date IS NULL OR trim(writeoff_date)='' THEN 1 ELSE 0 END) AS missing_writeoff_date "
            "FROM accounting_writeoffs;",
            'ACCOUNTING WRITEOFFS DATA RISK',
        ))
        blockers = as_int(row.get('missing_item_name')) + as_int(row.get('missing_updated_at'))
        record(
            evidence, 'Accounting writeoffs nullability/data-risk preflight',
            f"rows={as_int(row.get('rows'))}, missing_item_name={as_int(row.get('missing_item_name'))}, "
            f"missing_updated_at={as_int(row.get('missing_updated_at'))}, "
            f"missing_writeoff_date={as_int(row.get('missing_writeoff_date'))}",
            blocker=blockers > 0,
        )

        # 3 — general_ledger_accounts
        row = one(q(
            npx, prod_cfg,
            "SELECT COUNT(*) AS rows,"
            "SUM(CASE WHEN category IS NULL OR trim(category)='' THEN 1 ELSE 0 END) AS missing_category,"
            "COUNT(DISTINCT category) AS distinct_categories "
            "FROM general_ledger_accounts;",
            'GENERAL LEDGER CATEGORY DEFAULT RISK',
        ))
        record(
            evidence, 'General ledger category/default preflight',
            f"rows={as_int(row.get('rows'))}, missing_category={as_int(row.get('missing_category'))}, "
            f"distinct_categories={as_int(row.get('distinct_categories'))}",
            blocker=as_int(row.get('missing_category')) > 0,
        )

        # 4 — product_costs
        row = one(q(
            npx, prod_cfg,
            "SELECT COUNT(*) AS rows,"
            "SUM(CASE WHEN product_number IS NULL OR trim(product_number)='' THEN 1 ELSE 0 END) AS missing_product_number,"
            "SUM(CASE WHEN effective_date IS NULL OR trim(effective_date)='' THEN 1 ELSE 0 END) AS missing_effective_date "
            "FROM product_costs;",
            'PRODUCT COSTS NULL IDENTITY RISK',
        ))
        record(
            evidence, 'Product Costs null/identity preflight',
            f"rows={as_int(row.get('rows'))}, missing_product_number={as_int(row.get('missing_product_number'))}, "
            f"missing_effective_date={as_int(row.get('missing_effective_date'))}",
            blocker=as_int(row.get('missing_product_number')) > 0,
        )

        # 5 — movie_catalog
        row = one(q(
            npx, prod_cfg,
            "SELECT COUNT(*) AS rows,"
            "SUM(CASE WHEN metadata_status IS NULL OR trim(metadata_status)='' THEN 1 ELSE 0 END) AS missing_metadata_status "
            "FROM movie_catalog;",
            'MOVIE CATALOG METADATA STATUS RISK',
        ))
        record(
            evidence, 'Movie Catalog metadata_status preflight',
            f"rows={as_int(row.get('rows'))}, missing_metadata_status={as_int(row.get('missing_metadata_status'))}",
            blocker=as_int(row.get('missing_metadata_status')) > 0,
        )

        # 6 — product_resource_links
        row = one(q(
            npx, prod_cfg,
            "SELECT COUNT(*) AS rows,"
            "SUM(CASE WHEN lot_size_units IS NULL OR lot_size_units<=0 THEN 1 ELSE 0 END) AS invalid_lot_size_units,"
            "SUM(CASE WHEN quantity_used IS NULL THEN 1 ELSE 0 END) AS missing_quantity_used,"
            "SUM(CASE WHEN CAST(quantity_used AS REAL)!=CAST(CAST(quantity_used AS REAL) AS INTEGER) THEN 1 ELSE 0 END) AS fractional_quantity_used "
            "FROM product_resource_links;",
            'PRODUCT RESOURCE LINKS FRACTIONAL DEFAULT RISK',
        ))
        record(
            evidence, 'Product Resource Links fractional/default preflight',
            f"rows={as_int(row.get('rows'))}, invalid_lot_size_units={as_int(row.get('invalid_lot_size_units'))}, "
            f"missing_quantity_used={as_int(row.get('missing_quantity_used'))}, "
            f"fractional_quantity_used={as_int(row.get('fractional_quantity_used'))}",
            blocker=as_int(row.get('invalid_lot_size_units')) > 0 or as_int(row.get('missing_quantity_used')) > 0,
        )

        # 7 — tax_classes
        row = one(q(
            npx, prod_cfg,
            "SELECT COUNT(*) AS rows,"
            "SUM(CASE WHEN code IS NULL OR trim(code)='' THEN 1 ELSE 0 END) AS missing_code,"
            "SUM(CASE WHEN rate_percent IS NULL THEN 1 ELSE 0 END) AS missing_rate,"
            "SUM(CASE WHEN COALESCE(rate_percent,0)=0 THEN 1 ELSE 0 END) AS zero_rate "
            "FROM tax_classes;",
            'TAX CLASS CODE RATE RISK',
        ))
        dup = one(q(
            npx, prod_cfg,
            "SELECT COUNT(*) AS duplicate_code_groups FROM ("
            "SELECT code,COUNT(*) AS c FROM tax_classes WHERE code IS NOT NULL AND trim(code)<>'' "
            "GROUP BY code HAVING COUNT(*)>1);",
            'TAX CLASS DUPLICATE CODE RISK',
        ))
        tax_block = as_int(row.get('missing_code')) + as_int(row.get('missing_rate')) + as_int(dup.get('duplicate_code_groups'))
        record(
            evidence, 'Tax Class code/rate preflight',
            f"rows={as_int(row.get('rows'))}, missing_code={as_int(row.get('missing_code'))}, "
            f"missing_rate={as_int(row.get('missing_rate'))}, zero_rate={as_int(row.get('zero_rate'))}, "
            f"duplicate_code_groups={as_int(dup.get('duplicate_code_groups'))}",
            blocker=tax_block > 0,
        )

        # 8 — site_item_inventory
        cols = ['on_hand_quantity','reserved_quantity','incoming_quantity','reorder_level','preferred_reorder_quantity']
        row = one(q(
            npx, prod_cfg,
            f"SELECT COUNT(*) AS rows,SUM(CASE WHEN {fractional_expr(cols)} THEN 1 ELSE 0 END) AS fractional_rows "
            "FROM site_item_inventory;",
            'SITE ITEM INVENTORY FRACTIONAL VALUE SCAN',
        ))
        record(
            evidence, 'site_item_inventory fractional-value scan',
            f"rows={as_int(row.get('rows'))}, fractional_rows={as_int(row.get('fractional_rows'))}",
        )

        # 9 — site_inventory_movements
        cols = [
            'previous_on_hand_quantity','new_on_hand_quantity',
            'previous_reserved_quantity','new_reserved_quantity',
            'previous_incoming_quantity','new_incoming_quantity','quantity_delta',
        ]
        row = one(q(
            npx, prod_cfg,
            f"SELECT COUNT(*) AS rows,SUM(CASE WHEN {fractional_expr(cols)} THEN 1 ELSE 0 END) AS fractional_rows "
            "FROM site_inventory_movements;",
            'SITE INVENTORY MOVEMENTS FRACTIONAL VALUE SCAN',
        ))
        record(
            evidence, 'site_inventory_movements fractional-value scan',
            f"rows={as_int(row.get('rows'))}, fractional_rows={as_int(row.get('fractional_rows'))}",
        )

        # 10 — Creative Project posts/reversals
        rows = q(
            npx, prod_cfg,
            "SELECT 'posts' AS source,COUNT(*) AS rows,"
            "SUM(CASE WHEN CAST(stock_quantity_consumed AS REAL)!=CAST(CAST(stock_quantity_consumed AS REAL) AS INTEGER) "
            "OR CAST(previous_on_hand_quantity AS REAL)!=CAST(CAST(previous_on_hand_quantity AS REAL) AS INTEGER) "
            "OR CAST(new_on_hand_quantity AS REAL)!=CAST(CAST(new_on_hand_quantity AS REAL) AS INTEGER) THEN 1 ELSE 0 END) AS fractional_rows "
            "FROM creative_project_inventory_posts "
            "UNION ALL "
            "SELECT 'reversals',COUNT(*),"
            "SUM(CASE WHEN CAST(stock_quantity_restored AS REAL)!=CAST(CAST(stock_quantity_restored AS REAL) AS INTEGER) "
            "OR CAST(previous_on_hand_quantity AS REAL)!=CAST(CAST(previous_on_hand_quantity AS REAL) AS INTEGER) "
            "OR CAST(new_on_hand_quantity AS REAL)!=CAST(CAST(new_on_hand_quantity AS REAL) AS INTEGER) THEN 1 ELSE 0 END) "
            "FROM creative_project_inventory_reversals;",
            'CREATIVE PROJECT INVENTORY FRACTIONAL VALUE SCAN',
        )
        summary = '; '.join(
            f"{r.get('source')} rows={as_int(r.get('rows'))} fractional_rows={as_int(r.get('fractional_rows'))}"
            for r in rows
        )
        record(evidence, 'Creative Project inventory posts/reversals fractional-value scan', summary or 'no rows returned')

        # 11 — product_material_return_audit
        cols = ['previous_on_hand_quantity','new_on_hand_quantity','previous_reserved_quantity','new_reserved_quantity']
        row = one(q(
            npx, prod_cfg,
            f"SELECT COUNT(*) AS rows,SUM(CASE WHEN {fractional_expr(cols)} THEN 1 ELSE 0 END) AS fractional_rows "
            "FROM product_material_return_audit;",
            'PRODUCT MATERIAL RETURN FRACTIONAL VALUE SCAN',
        ))
        record(
            evidence, 'Product material-return audit fractional-value scan',
            f"rows={as_int(row.get('rows'))}, fractional_rows={as_int(row.get('fractional_rows'))}",
        )

        # 12 — product_media_score_history
        row = one(q(
            npx, prod_cfg,
            "SELECT COUNT(*) AS rows,"
            "SUM(CASE WHEN h.product_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM products p WHERE p.product_id=h.product_id) THEN 1 ELSE 0 END) AS product_orphans,"
            "SUM(CASE WHEN h.actor_user_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM users u WHERE u.user_id=h.actor_user_id) THEN 1 ELSE 0 END) AS user_orphans "
            "FROM product_media_score_history h;",
            'PRODUCT MEDIA SCORE ORPHAN SCAN',
        ))
        orphans = as_int(row.get('product_orphans')) + as_int(row.get('user_orphans'))
        record(
            evidence, 'product_media_score_history Product/User orphan scan',
            f"rows={as_int(row.get('rows'))}, product_orphans={as_int(row.get('product_orphans'))}, "
            f"user_orphans={as_int(row.get('user_orphans'))}",
            blocker=orphans > 0,
        )

        # 13 — product_review_actions
        row = one(q(
            npx, prod_cfg,
            "SELECT COUNT(*) AS rows,"
            "SUM(CASE WHEN r.actor_user_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM users u WHERE u.user_id=r.actor_user_id) THEN 1 ELSE 0 END) AS user_orphans "
            "FROM product_review_actions r;",
            'PRODUCT REVIEW ACTION ORPHAN SCAN',
        ))
        record(
            evidence, 'product_review_actions User orphan scan',
            f"rows={as_int(row.get('rows'))}, user_orphans={as_int(row.get('user_orphans'))}",
            blocker=as_int(row.get('user_orphans')) > 0,
        )

        # 14 — Product capture user refs
        row = one(q(
            npx, prod_cfg,
            "SELECT COUNT(*) AS rows,"
            "SUM(CASE WHEN capture_created_by_user_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM users u WHERE u.user_id=products.capture_created_by_user_id) THEN 1 ELSE 0 END) AS created_by_orphans,"
            "SUM(CASE WHEN capture_updated_by_user_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM users u WHERE u.user_id=products.capture_updated_by_user_id) THEN 1 ELSE 0 END) AS updated_by_orphans "
            "FROM products;",
            'PRODUCT CAPTURE USER ORPHAN SCAN',
        ))
        orphans = as_int(row.get('created_by_orphans')) + as_int(row.get('updated_by_orphans'))
        record(
            evidence, 'Products capture-user orphan scan',
            f"rows={as_int(row.get('rows'))}, created_by_orphans={as_int(row.get('created_by_orphans'))}, "
            f"updated_by_orphans={as_int(row.get('updated_by_orphans'))}",
            blocker=orphans > 0,
        )

        # 15 — site_page_views
        row = one(q(
            npx, prod_cfg,
            "SELECT COUNT(*) AS rows,"
            "SUM(CASE WHEN v.site_visitor_session_id IS NOT NULL AND NOT EXISTS("
            "SELECT 1 FROM site_visitor_sessions s WHERE s.site_visitor_session_id=v.site_visitor_session_id"
            ") THEN 1 ELSE 0 END) AS session_orphans "
            "FROM site_page_views v;",
            'SITE PAGE VIEW ORPHAN SCAN',
        ))
        record(
            evidence, 'site_page_views visitor-session orphan scan',
            f"rows={as_int(row.get('rows'))}, session_orphans={as_int(row.get('session_orphans'))}",
            blocker=as_int(row.get('session_orphans')) > 0,
        )

        # 16 — supplier_purchase_order_items
        row = one(q(
            npx, prod_cfg,
            "SELECT COUNT(*) AS rows,"
            "SUM(CASE WHEN i.site_item_inventory_id IS NOT NULL AND NOT EXISTS("
            "SELECT 1 FROM site_item_inventory s WHERE s.site_item_inventory_id=i.site_item_inventory_id"
            ") THEN 1 ELSE 0 END) AS inventory_orphans "
            "FROM supplier_purchase_order_items i;",
            'SUPPLIER PO INVENTORY ORPHAN SCAN',
        ))
        record(
            evidence, 'supplier_purchase_order_items Inventory orphan scan',
            f"rows={as_int(row.get('rows'))}, inventory_orphans={as_int(row.get('inventory_orphans'))}",
            blocker=as_int(row.get('inventory_orphans')) > 0,
        )

        # 17 — products.product_number uniqueness, including implicit UNIQUE indexes.
        dup = one(q(
            npx, prod_cfg,
            "SELECT "
            "SUM(CASE WHEN product_number IS NULL OR trim(product_number)='' THEN 1 ELSE 0 END) AS missing_product_number,"
            "(SELECT COUNT(*) FROM (SELECT product_number,COUNT(*) c FROM products "
            "WHERE product_number IS NOT NULL AND trim(product_number)<>'' GROUP BY product_number HAVING COUNT(*)>1)) AS duplicate_groups "
            "FROM products;",
            'PRODUCT NUMBER DATA UNIQUENESS',
        ))
        prod_indexes = q(
            npx, prod_cfg,
            "SELECT il.name,il.\"unique\" AS is_unique,il.origin,"
            "group_concat(ii.name, ',') AS columns "
            "FROM pragma_index_list('products') AS il "
            "JOIN pragma_index_info(il.name) AS ii "
            "GROUP BY il.name,il.\"unique\",il.origin ORDER BY il.name;",
            'PRODUCTION PRODUCT UNIQUE INDEX SEMANTICS',
        )
        dev_indexes = q(
            npx, dev_cfg,
            "SELECT il.name,il.\"unique\" AS is_unique,il.origin,"
            "group_concat(ii.name, ',') AS columns "
            "FROM pragma_index_list('products') AS il "
            "JOIN pragma_index_info(il.name) AS ii "
            "GROUP BY il.name,il.\"unique\",il.origin ORDER BY il.name;",
            'DEVELOPMENT PRODUCT UNIQUE INDEX SEMANTICS',
        )
        prod_product_unique = any(
            as_int(r.get('is_unique')) == 1 and str(r.get('columns') or '').lower() == 'product_number'
            for r in prod_indexes
        )
        dev_product_unique = any(
            as_int(r.get('is_unique')) == 1 and str(r.get('columns') or '').lower() == 'product_number'
            for r in dev_indexes
        )
        uniqueness_block = (
            as_int(dup.get('missing_product_number')) > 0
            or as_int(dup.get('duplicate_groups')) > 0
            or not prod_product_unique
            or not dev_product_unique
        )
        record(
            evidence, 'products.product_number semantic uniqueness including implicit UNIQUE indexes',
            f"missing_product_number={as_int(dup.get('missing_product_number'))}, "
            f"duplicate_groups={as_int(dup.get('duplicate_groups'))}, "
            f"production_unique_index={prod_product_unique}, development_unique_index={dev_product_unique}",
            blocker=uniqueness_block,
        )

        # 18 — search_query_terms
        special_prod = base.special_counts(
            npx, prod_cfg, {'search_query_terms':'', '__sql_test':''}, 'BUILD 421 PRODUCTION'
        )
        search_refs = source_refs('search_query_terms')
        search_runtime = runtime_refs(search_refs)
        search_count = special_prod.get('search_query_terms')
        search_summary = (
            f"production_rows={search_count if search_count is not None else 'MISSING'}, "
            f"source_refs={search_refs or ['none']}, runtime_refs={search_runtime or ['none']}; "
            "classification=preserve existing rows, no Development copy, no retirement until authority review"
        )
        record(evidence, 'search_query_terms authority classification', search_summary)

        # 19 — __sql_test
        sqltest_refs = source_refs('__sql_test')
        sqltest_runtime = runtime_refs(sqltest_refs)
        sqltest_count = special_prod.get('__sql_test')
        sqltest_block = sqltest_count not in (0, None) or bool(sqltest_runtime)
        sqltest_summary = (
            f"production_rows={sqltest_count if sqltest_count is not None else 'MISSING'}, "
            f"source_refs={sqltest_refs or ['none']}, runtime_refs={sqltest_runtime or ['none']}; "
            "classification=empty residue/retirement candidate only if runtime refs remain absent"
        )
        record(evidence, '__sql_test aggregate-origin/retirement classification', sqltest_summary, blocker=sqltest_block)

    # 20 — non-executing manifest + hard helper lockout.
    pre_manifest_blockers = [item for item in evidence if item.blocker]
    MANIFEST_PATH.write_text(manifest_text(evidence), encoding='utf-8')
    record(
        evidence,
        'Non-executing Production migration manifest + executable-helper lockout',
        f"manifest={MANIFEST_PATH.name}, evidence_blockers={len(pre_manifest_blockers)}, "
        "executable_helper_generated=NO, Production mutation remains CLOSED",
    )
    MANIFEST_PATH.write_text(manifest_text(evidence), encoding='utf-8')

    print()
    print('=== BUILD 421 SUMMARY ===')
    print(f'Items completed: {len(evidence)}/20')
    print(f'Rollout blockers observed: {sum(1 for item in evidence if item.blocker)}')
    print(f'Non-executing manifest: {MANIFEST_PATH.name}')
    print('Executable Production helper generated: NO')
    print('No database or R2 mutation was executed.')
    print('PRODUCTION PROMOTION: CLOSED')
    print()
    print('BUILD 421 TWENTY-ITEM LIVE READ-ONLY PRODUCTION EVIDENCE / MANIFEST: COMPLETE')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
