#!/usr/bin/env python3
from __future__ import annotations

from build422_blocker_mapper import family_for, parse_items

sample = """01. PASS — Accounting expenses nullability/data-risk preflight
    rows=3, missing_expense_date=0
02. BLOCKER — Product review actions User orphan scan
    rows=9, orphan_actor_users=1
03. PASS — Product number semantic uniqueness
    rows=45, duplicates=0
04. PASS - ASCII separator survives
    rows=1
05. BLOCKER ��� Tax Class code/rate preflight
    rows=2, missing_rate=1
06. PASS ▒ Notification outbox additive readiness
    rows=0
"""

items = parse_items(sample)
assert len(items) == 6, items
assert items[0].state == 'PASS'
assert items[1].state == 'BLOCKER'
assert items[1].summary == 'rows=9, orphan_actor_users=1'
assert items[3].label == 'ASCII separator survives', items[3]
assert items[4].label == 'Tax Class code/rate preflight', items[4]
assert items[5].label == 'Notification outbox additive readiness', items[5]
family, action = family_for(items[1].label)
assert family == 'foreign-key/orphan', family
assert 'fail closed' in action.lower(), action

print('BUILD 422 BLOCKER MAPPER REGRESSION: PASS')
print('Synthetic items parsed: 6')
print('Synthetic blockers parsed: 2')
print('Unicode/ASCII/replacement console separators: PASS')
print('No Cloudflare resource was contacted.')
