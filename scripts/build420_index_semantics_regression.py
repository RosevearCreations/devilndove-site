#!/usr/bin/env python3
"""Local regression for Build 420 index semantic normalization."""
from __future__ import annotations

import sys

from build420_index_semantics import normalize_index_sql


CASES = [
    (
        'comma whitespace',
        'CREATE INDEX idx_a ON packaging_project_ingredients(site_item_inventory_id,packaging_project_id,sort_order)',
        'CREATE INDEX legacy_idx ON packaging_project_ingredients(site_item_inventory_id, packaging_project_id, sort_order)',
        True,
    ),
    (
        'parenthesis whitespace',
        'CREATE INDEX idx_a ON t ( a, b )',
        'CREATE INDEX idx_b ON t(a,b)',
        True,
    ),
    (
        'explicit ASC equals default ASC',
        'CREATE INDEX idx_a ON t(a ASC,b)',
        'CREATE INDEX idx_b ON t(a,b ASC)',
        True,
    ),
    (
        'DESC remains material',
        'CREATE INDEX idx_a ON t(a DESC,b)',
        'CREATE INDEX idx_b ON t(a,b)',
        False,
    ),
    (
        'UNIQUE remains material',
        'CREATE UNIQUE INDEX idx_a ON t(a)',
        'CREATE INDEX idx_b ON t(a)',
        False,
    ),
    (
        'column order remains material',
        'CREATE INDEX idx_a ON t(a,b)',
        'CREATE INDEX idx_b ON t(b,a)',
        False,
    ),
]


def main() -> int:
    failures: list[str] = []
    for label, left, right, should_match in CASES:
        left_norm = normalize_index_sql(left)
        right_norm = normalize_index_sql(right)
        matched = left_norm == right_norm
        if matched != should_match:
            failures.append(
                f'{label}: expected match={should_match}, got {matched}; '
                f'left={left_norm!r} right={right_norm!r}'
            )

    if failures:
        print('BUILD 420 INDEX SEMANTICS REGRESSION: FAIL')
        for item in failures:
            print(' -', item)
        return 1

    print('BUILD 420 INDEX SEMANTICS REGRESSION: PASS')
    print(f'Cases checked: {len(CASES)}')
    print('Formatting-only comma/parenthesis/ASC differences collapse.')
    print('UNIQUE, DESC and indexed-column order remain material.')
    print('No Cloudflare resource was contacted.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
