#!/usr/bin/env python3
"""Synchronize Build 440 Tool lifecycle authority into database_full_schema.sql.
Local-only: never contacts Cloudflare, D1, R2 or providers.
"""
from __future__ import annotations
import argparse,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; AGG=ROOT/'database_full_schema.sql'; MIG=ROOT/'database_build440_tool_lifecycle_history.sql'
BEGIN='-- BEGIN BUILD 440 TOOL LIFECYCLE AUTHORITY'; END='-- END BUILD 440 TOOL LIFECYCLE AUTHORITY'
TABLES=('site_tool_lifecycle_profiles','site_tool_lifecycle_events')
REQ=(*(f'CREATE TABLE IF NOT EXISTS {t}' for t in TABLES),'idx_site_tool_lifecycle_condition_due','idx_site_tool_lifecycle_events_item','idx_site_tool_lifecycle_events_type',"'build_440_tool_lifecycle_history'")
def fail(m): print(f'STOP: {m}',file=sys.stderr); raise SystemExit(1)
def read(p):
 if not p.exists(): fail(f'Missing required file: {p.name}')
 return p.read_text(encoding='utf-8')
def validate(v):
 missing=[x for x in REQ if x not in v]
 if missing: fail('Full schema is missing Build 440 Tool lifecycle authority: '+', '.join(missing))
 for t in TABLES:
  if v.count(f'CREATE TABLE IF NOT EXISTS {t}')!=1: fail(f'Full schema must contain exactly one {t} CREATE TABLE authority.')
 if v.count(BEGIN) not in (0,1): fail('Duplicate Build 440 Tool lifecycle begin markers.')
 if BEGIN in v and v.count(END)!=1: fail('Build 440 Tool lifecycle marker block is incomplete.')
def sync():
 a=read(AGG); m=read(MIG).strip(); present=[f'CREATE TABLE IF NOT EXISTS {t}' in a for t in TABLES]
 if any(present) and not all(present): fail('Partial Build 440 Tool lifecycle authority found; refusing automatic append.')
 if all(present): validate(a); print('BUILD 440 FULL-SCHEMA SYNC: ALREADY PRESENT / NO CHANGE'); return
 if BEGIN in a or END in a: fail('Build 440 marker exists without complete table authority.')
 suffix='\n\n/* =========================================================\n   BUILD 440 — TOOL LIFECYCLE AUTHORITY\n   Focused authority: database_build440_tool_lifecycle_history.sql\n   ========================================================= */\n'+BEGIN+'\n'+m+'\n'+END+'\n'
 updated=a.rstrip()+suffix; validate(updated); AGG.write_text(updated,encoding='utf-8',newline='\n'); print('BUILD 440 FULL-SCHEMA SYNC: UPDATED'); print('Tool lifecycle tables: 2 / EXACT'); print('Tool lifecycle indexes: 3 / PRESENT'); print('Cloudflare/D1/R2 access: NONE')
def check(): validate(read(AGG)); print('BUILD 440 FULL-SCHEMA CHECK: PASS'); print('Tool lifecycle tables: 2 / SINGLE AUTHORITY'); print('Tool lifecycle indexes: 3 / PRESENT'); print('Cloudflare/D1/R2 access: NONE')
def main():
 p=argparse.ArgumentParser(); g=p.add_mutually_exclusive_group(required=True); g.add_argument('--sync',action='store_true'); g.add_argument('--check',action='store_true'); a=p.parse_args()
 if a.sync: sync(); check()
 else: check()
 return 0
if __name__=='__main__': raise SystemExit(main())
