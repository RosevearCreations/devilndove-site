#!/usr/bin/env python3
"""Build 738: original source SQL, ephemeral SQLite, no mail or real customers."""
import concurrent.futures
import re
import sqlite3
import tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
public=(ROOT/'functions/api/auth/account-help-request.js').read_text()
admin=(ROOT/'functions/api/admin/account-help-review-738.js').read_text()
schema=(ROOT/'database_profiles_extension.sql').read_text()
def original(source,prefix):
 start=source.index('db.prepare(' + chr(96)+prefix)+len('db.prepare(')+1
 return source[start:source.index(chr(96)+')',start)]
insert=original(public,'INSERT INTO auth_recovery_requests')
update=original(admin,'UPDATE auth_recovery_requests')
audit=original(admin,'INSERT INTO admin_action_audit')
assert insert.lstrip().startswith('INSERT') and 'COUNT(*)' in insert
assert insert.count('?')==8
assert 'WHERE changes()=1' in audit
table=re.search(r'CREATE TABLE IF NOT EXISTS auth_recovery_requests \([\s\S]*?\);',schema)
assert table
with tempfile.TemporaryDirectory() as tmp:
 path=str(Path(tmp)/'case.db')
 owner=sqlite3.connect(path,isolation_level=None)
 owner.execute('PRAGMA journal_mode=WAL')
 owner.executescript(table.group(0))
 owner.executescript("""CREATE TABLE admin_action_audit (
 admin_action_audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
 actor_user_id INTEGER,action_type TEXT,target_type TEXT,target_id INTEGER,
 request_method TEXT,request_path TEXT,details_json TEXT,created_at TEXT);""")
 owner.close()
 def submit(i,addr='shared@customer.invalid',ip=None):
  db=sqlite3.connect(path,timeout=30,isolation_level=None)
  db.execute('PRAGMA busy_timeout=30000')
  ip=ip or '203.0.113.1'
  before=db.total_changes
  try:
   db.execute(insert,(addr,None,None,None,ip,'test-agent',addr,ip))
   return db.total_changes-before
  finally:db.close()
 # Simultaneous distinct-IP attempts against same address: exactly three.
 with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
  values=list(pool.map(lambda i:submit(i,ip='198.51.100.'+str(i+1)),range(12)))
 assert sum(values)==3,values
 # Distinct addresses from same source IP: exactly six.
 outcomes=[submit(i,addr='person'+str(i)+'@customer.invalid',ip='203.0.113.88') for i in range(12)]
 assert outcomes==[1]*6+[0]*6,outcomes
 db=sqlite3.connect(path,isolation_level=None)
 db.execute("""INSERT INTO auth_recovery_requests
 (request_type,contact_email,ip_address,status,created_at,updated_at)
 VALUES ('forgot_email','old@customer.invalid','198.51.100.200','open',
 datetime('now','-61 minutes'),CURRENT_TIMESTAMP)""")
 assert submit(1,addr='old@customer.invalid',ip='198.51.100.200')==1
 # Original staff-state transition and audit receipt together.
 caseid=db.execute("SELECT MIN(auth_recovery_request_id) FROM auth_recovery_requests").fetchone()[0]
 db.execute('BEGIN')
 try:
  result=db.execute(update,('reviewed',caseid,'open'))
  assert result.rowcount==1
  info='{"action":"mark_reviewed","reason_code":"SOURCE_REVIEWED","account_identity_verified":false}'
  recorded=db.execute(audit,(7,caseid,info))
  assert recorded.rowcount==1
  db.execute('COMMIT')
 except:db.execute('ROLLBACK');raise
 assert db.execute("SELECT status FROM auth_recovery_requests WHERE auth_recovery_request_id=?",(caseid,)).fetchone()[0]=='reviewed'
 assert db.execute("SELECT COUNT(*) FROM admin_action_audit WHERE target_id=?",(caseid,)).fetchone()[0]==1
 assert db.execute(update,('reviewed',caseid,'open')).rowcount==0, 'No duplicate manual state transition'
 db.execute('BEGIN')
 try:
  assert db.execute(update,('closed',caseid,'reviewed')).rowcount==1
  db.execute(audit,(7,caseid,'{"action":"close_request","identity_verified":false}'))
  db.execute('COMMIT')
 except:db.execute('ROLLBACK');raise
 assert db.execute("SELECT COUNT(*) FROM admin_action_audit WHERE target_id=?",(caseid,)).fetchone()[0]==2
 assert 'password_hash' not in admin and 'DELETE FROM sessions' not in admin
 assert 'queuePublicNotification' not in public
 print('BUILD738 PASS: real-source atomic email/IP quotas, 1h lockout recovery, original D1 staff transitions + audit, no mail/credentials')
