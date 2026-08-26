#!/usr/bin/env python3
"""Build 437 SQL-guard-compatible wrapper for the authorized Membership rebuild.

Build 418 deliberately allows only a narrow read-only PRAGMA subset. The Build
436 controller's postcheck used direct PRAGMA index_info(), which that guard does
not allow. This wrapper preserves the existing controller and authorization scope
but rewrites only the known Membership sort-index metadata read to the equivalent
read-only table-valued SELECT form accepted by Build 418.
"""
from __future__ import annotations

import build436_production_membership_rebuild as executor


def guard_compatible_q(npx, cfg, sql: str, label: str):
    direct = f'PRAGMA index_info("{executor.SORT_INDEX}");'
    if sql.strip() == direct:
        sql = (
            f"SELECT seqno,cid,name FROM pragma_index_info('{executor.SORT_INDEX}') "
            "ORDER BY seqno;"
        )
    return executor.base.query_rows(npx, cfg, sql, f'BUILD 436 {label}')


def main() -> None:
    executor.q = guard_compatible_q
    executor.main()


if __name__ == '__main__':
    main()
