#!/usr/bin/env python3
"""Verify a read-only Release 453 Development D1 snapshot produced by GitHub Actions."""
from __future__ import annotations
import json,sys
from pathlib import Path

def walk(v):
 if isinstance(v,dict):
  yield v
  for x in v.values():yield from walk(x)
 elif isinstance(v,list):
  for x in v:yield from walk(x)

def main():
 if len(sys.argv)!=2:raise SystemExit('usage: verify_release453_remote_snapshot.py <snapshot.json>')
 data=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
 row=next((x for x in walk(data) if 'release453_table_count' in x),None)
 if not row:raise SystemExit('Release 453 snapshot row missing')
 expected={'release453_table_count':2,'readiness_check_count':32,'readiness_provider_count':7,'deferred_check_count':32,'readiness_event_count':0,'foreign_key_violation_count':0,'unknown_provider_count':0,'secret_column_count':0}
 for key,value in expected.items():
  got=int(row.get(key) or 0)
  if got!=value:raise SystemExit(f'FAIL — {key}: expected {value}, got {got}')
 print('RELEASE 453 REMOTE SNAPSHOT: PASS')
 print('D1 tables: 2/2; readiness checks: 32; providers: 7')
 print('Initial states: 32 deferred; fabricated events: 0')
 print('Foreign-key violations: 0; unknown providers: 0; secret columns: 0')
 print('Verification mode: READ ONLY')
 return 0
if __name__=='__main__':raise SystemExit(main())
