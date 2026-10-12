#!/usr/bin/env python3
"""Release 467 Build 381 exact-source, SQLite resource conflict and audit guards."""
from pathlib import Path
import subprocess,sqlite3,json,sys
r=Path(__file__).resolve().parents[1];errors=[]
def src(path):return (r/path).read_text(encoding='utf8')
def check(cond,message):
 if not cond:errors.append(message)
pointer=json.loads(src('current-development-authority.json'))
manifest=json.loads(src('migrations/canonical/manifest.json'))
check(pointer.get('build',0)>=381,'current release pointer 381')
check(len(manifest['migrations'])>=33 and manifest['migrations'][32]['version']==33 and manifest['migrations'][32]['file']=='0033_release467_resource_calendar_conflicts.sql','canonical migration 0033')
api=src('functions/api/admin/project-resource-calendar.js')
sql=src('migrations/canonical/0033_release467_resource_calendar_conflicts.sql')
for token in ('getAdminUserFromRequest','Origin','auditAdminAction','RESOURCE_CONFLICT','MAINTENANCE_BLOCK','DB_CONFLICT_OR_IDENTITY','inventory_workstation_roles','site_item_inventory','creative_resource_calendar_entries','ABSENCE_OF_RECORDED_CONFLICT','override_maintenance_ack','calendar_operation_project_mismatch'):
 # The mismatch token is enforced by the SQL migration rather than API text.
 if token=='calendar_operation_project_mismatch':check(token in sql,token)
 else:check(token in api,token)
for f in ['functions/api/admin/project-resource-calendar.js','functions/api/admin/_lib/calendarRules.js','public/js/admin-project-resource-calendar.js']:
 p=subprocess.run(['node','--check',str(r/f)],capture_output=True,text=True)
 check(p.returncode==0,f+' '+p.stderr[-300:])
t=subprocess.run(['node','--test','scripts/release467_build381_calendar.test.mjs'],cwd=r,capture_output=True,text=True)
check(t.returncode==0,'UTC overlap test '+t.stdout[-350:]+t.stderr[-250:])
db=sqlite3.connect(':memory:');db.execute('PRAGMA foreign_keys=ON')
db.executescript("""
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE site_item_inventory(site_item_inventory_id INTEGER PRIMARY KEY,source_type TEXT,is_active INTEGER,item_name TEXT);
CREATE TABLE creative_work_projects(creative_work_project_id INTEGER PRIMARY KEY,project_status TEXT);
CREATE TABLE creative_project_operations(creative_project_operation_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,plan_status TEXT);
INSERT INTO users VALUES(7);
INSERT INTO site_item_inventory VALUES(20,'tool',1,'CNC machine'),(21,'tool',1,'Shared lathe'),(30,'supply',1,'Consumable');
INSERT INTO creative_work_projects VALUES(1,'active'),(2,'active');
INSERT INTO creative_project_operations VALUES(11,1,'planned'),(22,2,'planned');
""")
try:
 db.executescript(sql)
 def add(resource,project,operation,kind,start,end,key,override=0,ack=0):
  db.execute("""INSERT INTO creative_resource_calendar_entries
   (resource_site_item_inventory_id,creative_work_project_id,creative_project_operation_id,
   entry_kind,title,starts_at_utc,ends_at_utc,override_conflict,override_maintenance_ack,override_reason,
   operator_note,created_by_user_id,request_key) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
   (resource,project,operation,kind,'Test workshop slot',start,end,override,ack,
   'Operator-reviewed exceptional resource booking' if override else None,
   'Real operator note recorded',7,key))
 a='2026-10-20T10:00:00Z';b='2026-10-20T11:00:00Z'
 add(20,1,11,'project_booking',a,b,'booking_A_381_1234')
 try:add(20,2,22,'project_booking','2026-10-20T10:30:00Z','2026-10-20T11:30:00Z','booking_B_381_1234');errors.append('Concurrent project overlap accepted')
 except sqlite3.IntegrityError:pass
 add(20,2,22,'project_booking',b,'2026-10-20T12:00:00Z','booking_adj_381_12')
 add(21,2,22,'project_booking',a,b,'booking_alt_381_12')
 try:add(30,1,11,'project_booking','2026-10-20T16:00:00Z','2026-10-20T17:00:00Z','supply_bad_381_12');errors.append('Non-tool accepted')
 except sqlite3.IntegrityError:pass
 try:add(20,1,22,'project_booking','2026-10-20T16:00:00Z','2026-10-20T17:00:00Z','operation_bad_381_12');errors.append('Wrong project operation accepted')
 except sqlite3.IntegrityError:pass
 add(None,1,None,'project_deadline',a,b,'deadline_381_1234')
 try:add(20,None,None,'maintenance',a,b,'maintenance_bad_381');errors.append('Overlapping maintenance accepted')
 except sqlite3.IntegrityError:pass
 add(20,None,None,'maintenance',a,b,'maintenance_override_381',1,0)
 try:add(20,2,22,'project_booking',a,b,'maintenance_ack_bad',1,0);errors.append('Maintenance bypass without separate acknowledgment')
 except sqlite3.IntegrityError:pass
 add(20,2,22,'project_booking',a,b,'maintenance_ack_good',1,1)
 db.execute("UPDATE creative_resource_calendar_entries SET entry_status='cancelled',cancelled_by_user_id=7,cancelled_at=CURRENT_TIMESTAMP,cancellation_reason='Operator manually cancelled' WHERE request_key='booking_alt_381_12'")
 add(21,1,11,'project_booking',a,b,'after_cancel_381_123')
 try:db.execute("UPDATE creative_resource_calendar_entries SET starts_at_utc='2026-10-20T09:00:00Z' WHERE request_key='after_cancel_381_123'");errors.append('Immutable schedule mutated')
 except sqlite3.IntegrityError:pass
 try:db.execute("DELETE FROM creative_resource_calendar_entries WHERE request_key='after_cancel_381_123'");errors.append('Booking history deleted')
 except sqlite3.IntegrityError:pass
 check(db.execute('PRAGMA foreign_key_check').fetchall()==[],'Foreign key integrity')
except Exception as e:errors.append('SQLite '+str(e))
print('RELEASE467_BUILD381_REGRESSION='+('FAIL' if errors else 'GREEN'))
for e in errors:print('-',e)
sys.exit(bool(errors))
