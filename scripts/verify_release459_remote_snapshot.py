#!/usr/bin/env python3
"""Verify a read-only Release 459 Development D1 snapshot produced by Wrangler."""
from __future__ import annotations
import json,sys

def walk(value):
    if isinstance(value,dict):
        yield value
        for child in value.values():yield from walk(child)
    elif isinstance(value,list):
        for child in value:yield from walk(child)

def main()->int:
    if len(sys.argv)!=2:raise SystemExit('usage: verify_release459_remote_snapshot.py snapshot.json')
    data=json.load(open(sys.argv[1],encoding='utf-8'))
    row=next((x for x in walk(data) if 'release459_provider_count' in x),None)
    if not row:raise SystemExit('Release 459 snapshot row not found.')
    expected={
        'release459_provider_count':8,
        'release459_x_check_count':4,
        'release459_unknown_provider_count':0,
        'release459_foreign_key_violation_count':0,
        'release459_secret_column_count':0,
        'release459_youtube_ref_ok':1,
        'release459_x_ref_ok':1,
        'release459_etsy_ref_ok':1,
    }
    for key,value in expected.items():
        actual=int(row.get(key) or 0)
        if actual!=value:raise SystemExit(f'{key}: expected {value}, got {actual}')
    print('RELEASE 459 REMOTE D1 SNAPSHOT: PASS')
    print('Providers: 8; X checks: 4; provider FK/orphans: 0')
    print('Etsy/X/YouTube safe reference names: CURRENT')
    print('Secret-value columns: 0')
    return 0
if __name__=='__main__':raise SystemExit(main())
