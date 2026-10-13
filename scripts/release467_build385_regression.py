#!/usr/bin/env python3
"""Build 385: prove atomic business+receipt, cross-actor/cross-payload rejection and release stock no-op safety."""
from pathlib import Path
import json,sqlite3,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];fail=[]
def source(p):return (ROOT/p).read_text(encoding='utf-8')
def check(value,label):
 if not value:fail.append(label)
pointer=json.loads(source('current-development-authority.json'))
manifest=json.loads(source('migrations/canonical/manifest.json'))
check(pointer.get('build',0)>=385,'Build 385 pointer')
check(len(manifest['migrations'])>=36 and manifest['migrations'][35]['version']==36,'Canonical migration 0036')
check(manifest['migrations'][35]['file']=='0036_release467_durable_admin_write_receipts.sql','Immutable receipt migration identity')
for file in ('functions/api/admin/commission-workbench.js','functions/api/admin/cross-project-accounting.js',
 'functions/api/admin/project-material-planner.js'):
 src=source(file)
 for token in ('payloadHash','readReceiptState','receiptInsert','atomicWriteReceipt','request_key'):
  check(token in src,'Atomic receipt contract '+file+' '+token)
for token in ('getAdminUserFromRequest','request_key','actor_user_id','found:false','Cache-Control'):
 check(token in source('functions/api/admin/write-operation-receipt.js'),'Private receipt read '+token)
for file in ('functions/api/admin/_lib/writeReceipts.js','functions/api/admin/write-operation-receipt.js',
 'functions/api/admin/commission-workbench.js','functions/api/admin/cross-project-accounting.js',
 'functions/api/admin/project-material-planner.js','public/js/admin-project-material-planner.js'):
 p=subprocess.run(['node','--check',str(ROOT/file)],capture_output=True,text=True)
 check(p.returncode==0,'JavaScript parse '+file+': '+p.stderr[-300:])
t=subprocess.run(['node','--test','scripts/release467_build385_hash.test.mjs'],cwd=ROOT,capture_output=True,text=True)
check(t.returncode==0,'Hash/actor/payload JS tests '+t.stdout[-2000:]+t.stderr[-1200:])
db=sqlite3.connect(':memory:',isolation_level=None);db.execute('PRAGMA foreign_keys=ON')
db.executescript("""
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE custom_requests(custom_request_id INTEGER PRIMARY KEY);
CREATE TABLE creative_work_projects(creative_work_project_id INTEGER PRIMARY KEY);
CREATE TABLE custom_request_commission_events(custom_request_commission_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
 custom_request_id INTEGER,actor_user_id INTEGER,request_key TEXT UNIQUE);
CREATE TABLE creative_project_finance_review_events(creative_project_finance_review_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
 creative_work_project_id INTEGER,actor_user_id INTEGER,request_key TEXT UNIQUE);
CREATE TABLE creative_project_material_reservations(creative_project_material_reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
 creative_work_project_id INTEGER,created_by_user_id INTEGER,updated_by_user_id INTEGER,request_key TEXT UNIQUE,
 release_note TEXT,original_stock_quantity REAL,released_stock_quantity REAL DEFAULT 0);
INSERT INTO users VALUES(7),(8);
INSERT INTO custom_requests VALUES(11),(12);
INSERT INTO creative_work_projects VALUES(21),(22);
""")
try:
 db.executescript(source('migrations/canonical/0036_release467_durable_admin_write_receipts.sql'))
 digest='a'*64
 def insert_receipt(scope,key,actor,target_type,target,sql,params):
  db.execute('INSERT INTO admin_write_receipts(action_scope,request_key,actor_user_id,target_type,target_id,source_record_id,payload_sha256) SELECT ?,?,?,?,?,source_id,? FROM ('+sql+')',
  (scope,key,actor,target_type,target,digest,*params))
 # SQLite transaction means source insert + receipt are indivisible even after simulated error.
 db.execute('BEGIN')
 db.execute("INSERT INTO creative_project_finance_review_events(creative_work_project_id,actor_user_id,request_key) VALUES(21,7,'finance_123456789012')")
 fin_id=db.execute("SELECT creative_project_finance_review_event_id FROM creative_project_finance_review_events").fetchone()[0]
 db.execute('INSERT INTO admin_write_receipts(action_scope,request_key,actor_user_id,target_type,target_id,source_record_id,payload_sha256) VALUES(?,?,?,?,?,?,?)',
 ('finance_review','finance_123456789012',7,'creative_work_project',21,fin_id,digest))
 db.commit()
 check(db.execute("SELECT COUNT(*) FROM admin_write_receipts WHERE action_scope='finance_review'").fetchone()[0]==1,'One committed receipt')
 try:
  db.execute('BEGIN')
  db.execute("INSERT INTO creative_project_finance_review_events(creative_work_project_id,actor_user_id,request_key) VALUES(21,7,'finance_123456789012')")
  db.commit();fail.append('Duplicate business write accepted')
 except sqlite3.IntegrityError:db.rollback()
 try:
  db.execute('INSERT INTO admin_write_receipts(action_scope,request_key,actor_user_id,target_type,target_id,source_record_id,payload_sha256) VALUES(?,?,?,?,?,?,?)',
   ('finance_review','wrong_scope_12345678',8,'creative_work_project',21,fin_id,digest))
  fail.append('Forged cross-actor receipt accepted')
 except sqlite3.IntegrityError:db.rollback()
 try:
  db.execute('BEGIN')
  db.execute("INSERT INTO creative_project_finance_review_events(creative_work_project_id,actor_user_id,request_key) VALUES(22,7,'rollback_test_123456')")
  row_id=db.execute("SELECT creative_project_finance_review_event_id FROM creative_project_finance_review_events WHERE request_key='rollback_test_123456'").fetchone()[0]
  db.execute('INSERT INTO admin_write_receipts(action_scope,request_key,actor_user_id,target_type,target_id,source_record_id,payload_sha256) VALUES(?,?,?,?,?,?,?)',
    ('finance_review','rollback_test_123456',7,'creative_work_project',21,row_id,digest))
  db.commit();fail.append('Mismatched target receipt accepted')
 except sqlite3.IntegrityError:db.rollback()
 check(not db.execute("SELECT 1 FROM creative_project_finance_review_events WHERE request_key='rollback_test_123456'").fetchone(),'Bad receipt rolled back source write')
 db.execute("INSERT INTO creative_project_material_reservations(creative_work_project_id,created_by_user_id,request_key,original_stock_quantity) VALUES(21,7,'material_stock_123456',9)")
 rid=db.execute("SELECT creative_project_material_reservation_id FROM creative_project_material_reservations").fetchone()[0]
 releaseKey='release_key_12345678';marker='@receipt:'+releaseKey+':approved partial stock release'
 db.execute('BEGIN')
 db.execute("UPDATE creative_project_material_reservations SET released_stock_quantity=released_stock_quantity+2,updated_by_user_id=7,release_note=? WHERE creative_project_material_reservation_id=? AND released_stock_quantity+2<=original_stock_quantity",(marker,rid))
 db.execute('INSERT INTO admin_write_receipts(action_scope,request_key,actor_user_id,target_type,target_id,source_record_id,payload_sha256) VALUES(?,?,?,?,?,?,?)',
  ('material_release',releaseKey,7,'creative_work_project',21,rid,digest))
 db.commit()
 before=db.execute('SELECT released_stock_quantity FROM creative_project_material_reservations WHERE creative_project_material_reservation_id=?',(rid,)).fetchone()[0]
 try:db.execute('INSERT INTO admin_write_receipts(action_scope,request_key,actor_user_id,target_type,target_id,source_record_id,payload_sha256) VALUES(?,?,?,?,?,?,?)',
  ('material_release',releaseKey,7,'creative_work_project',21,rid,digest));fail.append('Repeat release receipt accepted')
 except sqlite3.IntegrityError:pass
 check(before==2,'Release stock amount was not exactly 2')
 try:db.execute("UPDATE admin_write_receipts SET payload_sha256='b'*64");fail.append('Edited permanent receipt')
 except sqlite3.IntegrityError:pass
 try:db.execute("DELETE FROM admin_write_receipts");fail.append('Deleted permanent receipt')
 except sqlite3.IntegrityError:pass
 check(not db.execute('PRAGMA foreign_key_check').fetchall(),'Foreign key check')
except Exception as e:fail.append('SQLite receipt proof '+str(e))
print('RELEASE467_BUILD385_REGRESSION='+('FAIL' if fail else 'GREEN'))
for item in fail:print('-',item)
sys.exit(bool(fail))
