#!/usr/bin/env python3
"""Release 467 Build 386: prove new source-linked receipts and cross-tab recovery safeguards."""
import json,sqlite3,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
fail=[]
def src(p):return (ROOT/p).read_text(encoding='utf-8')
def require(ok,label):
 if not ok:fail.append(label)
authority=json.loads(src('current-development-authority.json'))
manifest=json.loads(src('migrations/canonical/manifest.json'))
require(authority.get('build',0)>=386,'current Build 386 pointer')
require(manifest['migrations'][-1]['version']==37,'canonical 0037 version')
require(manifest['migrations'][-1]['file']=='0037_release467_receipt_coverage_work_calendar.sql','canonical 0037 filename')
for name in ('functions/api/admin/project-work-orders.js','functions/api/admin/project-resource-calendar.js'):
 code=src(name)
 for part in ('request_key','readReceiptState','receiptInsert','atomicWriteReceipt','payloadHash'):
  require(part in code,'server '+name+' '+part)
for part in ("'work_order_event'","'calendar_schedule'","ledgerFor(scope)"):
 require(part in src('functions/api/admin/_lib/writeReceipts.js'),'scope in helper '+part)
for part in ("scopeFor","localStorage","'storage'","request_key","crypto.subtle.digest",
 "write(storageKey","state:'uncertain'","ALREADY_COMMITTED","RECEIPT_VERIFICATION_REQUIRED",
 "Verify original receipt","Start new action"):
 require(part in src('public/js/admin-write-receipt-recovery-v386.js'),'browser recovery '+part)
for p in ('admin/project-work-orders/index.html','admin/project-resource-calendar/index.html',
 'admin/commission-workbench/index.html','admin/cross-project-accounting/index.html','admin/project-material-planner/index.html'):
 require('admin-write-receipt-recovery-v386.js' in src(p),'receipt helper loaded '+p)
for p in ('functions/api/admin/_lib/writeReceipts.js','functions/api/admin/project-work-orders.js',
 'functions/api/admin/project-resource-calendar.js','functions/api/admin/write-operation-receipt.js',
 'public/js/admin-write-receipt-recovery-v386.js'):
 result=subprocess.run(['node','--check',str(ROOT/p)],capture_output=True,text=True)
 require(result.returncode==0,'JS syntax '+p+': '+result.stderr[-500:])
db=sqlite3.connect(':memory:',isolation_level=None)
db.execute('PRAGMA foreign_keys=ON')
db.executescript("""
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE creative_work_projects(creative_work_project_id INTEGER PRIMARY KEY);
CREATE TABLE site_item_inventory(site_item_inventory_id INTEGER PRIMARY KEY);
CREATE TABLE creative_work_order_events(creative_work_order_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
 creative_work_project_id INTEGER NOT NULL,actor_user_id INTEGER NOT NULL,event_kind TEXT NOT NULL);
CREATE TABLE creative_resource_calendar_entries(creative_resource_calendar_entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
 creative_work_project_id INTEGER,resource_site_item_inventory_id INTEGER,
 created_by_user_id INTEGER NOT NULL,request_key TEXT NOT NULL UNIQUE);
INSERT INTO users VALUES(7),(8);
INSERT INTO creative_work_projects VALUES(21),(22);
INSERT INTO site_item_inventory VALUES(31),(32);
""")
try:
 db.executescript(src('migrations/canonical/0037_release467_receipt_coverage_work_calendar.sql'))
 digest='a'*64
 wk='workevent_key_1234567890'
 db.execute('BEGIN')
 db.execute("INSERT INTO creative_work_order_events(creative_work_project_id,actor_user_id,event_kind,request_key) VALUES(21,7,'time',?)",(wk,))
 w=db.execute('SELECT last_insert_rowid()').fetchone()[0]
 db.execute('INSERT INTO admin_write_receipts_extended(action_scope,request_key,actor_user_id,target_type,target_id,source_record_id,payload_sha256) VALUES(?,?,?,?,?,?,?)',
  ('work_order_event',wk,7,'creative_work_project',21,w,digest))
 db.commit()
 require(db.execute("SELECT COUNT(*) FROM admin_write_receipts_extended").fetchone()[0]==1,'work order receipt committed')
 def rejected(sql,params=(),label='rejected'):
  try:db.execute(sql,params);fail.append(label+' unexpectedly accepted')
  except sqlite3.IntegrityError:pass
 rejected('INSERT INTO creative_work_order_events(creative_work_project_id,actor_user_id,event_kind,request_key) VALUES(?,?,?,?)',(21,7,'time',wk),'work key collision')
 rejected("UPDATE creative_work_order_events SET event_kind='milestone' WHERE creative_work_order_event_id=?",(w,),'work source mutable')
 rejected("DELETE FROM creative_work_order_events WHERE creative_work_order_event_id=?",(w,),'work source delete')
 rejected('INSERT INTO admin_write_receipts_extended(action_scope,request_key,actor_user_id,target_type,target_id,source_record_id,payload_sha256) VALUES(?,?,?,?,?,?,?)',
   ('work_order_event','other_work_key_123456',8,'creative_work_project',21,w,digest),'forged actor')
 rejected('INSERT INTO admin_write_receipts_extended(action_scope,request_key,actor_user_id,target_type,target_id,source_record_id,payload_sha256) VALUES(?,?,?,?,?,?,?)',
   ('work_order_event','other_work_key_123456',7,'creative_work_project',22,w,digest),'wrong project')
 rejected("UPDATE admin_write_receipts_extended SET payload_sha256=?",(('b'*64),),'ledger mutation')
 rejected("DELETE FROM admin_write_receipts_extended",(),'ledger deletion')
 ck='calendar_key_1234567890'
 db.execute('BEGIN')
 db.execute('INSERT INTO creative_resource_calendar_entries(resource_site_item_inventory_id,created_by_user_id,request_key) VALUES(?,?,?)',(31,7,ck))
 c=db.execute('SELECT last_insert_rowid()').fetchone()[0]
 db.execute('INSERT INTO admin_write_receipts_extended(action_scope,request_key,actor_user_id,target_type,target_id,source_record_id,payload_sha256) VALUES(?,?,?,?,?,?,?)',
  ('calendar_schedule',ck,7,'site_item_inventory',31,c,digest))
 db.commit()
 require(db.execute("SELECT COUNT(*) FROM admin_write_receipts_extended").fetchone()[0]==2,'resource calendar receipt committed')
 rejected('INSERT INTO admin_write_receipts_extended(action_scope,request_key,actor_user_id,target_type,target_id,source_record_id,payload_sha256) VALUES(?,?,?,?,?,?,?)',
  ('calendar_schedule','other_cal_key_1234567',7,'site_item_inventory',31,c,digest),'calendar key forgery')
 rejected('INSERT INTO admin_write_receipts_extended(action_scope,request_key,actor_user_id,target_type,target_id,source_record_id,payload_sha256) VALUES(?,?,?,?,?,?,?)',
  ('calendar_schedule','other_cal_key_1234567',7,'site_item_inventory',32,c,digest),'calendar target forgery')
 before=db.execute('SELECT COUNT(*) FROM creative_resource_calendar_entries').fetchone()[0]
 try:
  db.execute('BEGIN')
  db.execute('INSERT INTO creative_resource_calendar_entries(resource_site_item_inventory_id,created_by_user_id,request_key) VALUES(?,?,?)',(31,7,'rollback_cal_key_12345'))
  row=db.execute('SELECT last_insert_rowid()').fetchone()[0]
  db.execute('INSERT INTO admin_write_receipts_extended(action_scope,request_key,actor_user_id,target_type,target_id,source_record_id,payload_sha256) VALUES(?,?,?,?,?,?,?)',
   ('calendar_schedule','rollback_cal_key_12345',7,'site_item_inventory',32,row,digest))
  db.commit();fail.append('bad receipt committed with calendar source')
 except sqlite3.IntegrityError:db.rollback()
 require(db.execute('SELECT COUNT(*) FROM creative_resource_calendar_entries').fetchone()[0]==before,'failed receipt transaction rolled back original calendar source')
 require(not db.execute('PRAGMA foreign_key_check').fetchall(),'extended FK check')
except Exception as e:fail.append('sqlite receipt proof '+str(e))
result=subprocess.run(['node','--test','scripts/release467_build386_recovery.test.mjs'],cwd=ROOT,capture_output=True,text=True)
require(result.returncode==0,'Node receipt/cross-tab proof '+result.stdout[-1500:]+result.stderr[-1000:])
print('RELEASE467_BUILD386_REGRESSION='+('FAIL' if fail else 'GREEN'))
for msg in fail:print('-',msg)
sys.exit(bool(fail))
