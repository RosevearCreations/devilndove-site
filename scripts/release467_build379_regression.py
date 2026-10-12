#!/usr/bin/env python3
from pathlib import Path
import sqlite3,subprocess,json,sys
r=Path(__file__).resolve().parents[1];bad=[]
def read(p):return (r/p).read_text()
def req(v,msg):
 if not v:bad.append(msg)
p=json.loads(read('current-development-authority.json'));req(p['build']>=379,'pointer')
m=json.loads(read('migrations/canonical/manifest.json'));req(len(m['migrations'])>=31 and m['migrations'][30]['version']==31 and m['migrations'][30]['file']=='0031_release467_creative_work_order_execution_history.sql','Build 379 canonical migration remains immutable at version 31')
api=read('functions/api/admin/project-work-orders.js')
for t in ('getAdminUserFromRequest','Origin','STALE_OR_BLOCKED','auditAdminAction','actor_user_id','creative_work_event_id'):req(t in api,'api:'+t)
for path in ('functions/api/admin/project-work-orders.js','functions/api/admin/_lib/workOrderRules.js','public/js/admin-project-work-orders.js'):
 z=subprocess.run(['node','--check',str(r/path)],capture_output=True,text=True);req(z.returncode==0,path+' '+z.stderr[-150:])
z=subprocess.run(['node','--test','scripts/release467_build379_rules.test.mjs'],cwd=r,capture_output=True,text=True);req(z.returncode==0,z.stdout[-250:])
db=sqlite3.connect(':memory:')
db.executescript("PRAGMA foreign_keys=ON;CREATE TABLE users(user_id INTEGER PRIMARY KEY);CREATE TABLE creative_work_projects(creative_work_project_id INTEGER PRIMARY KEY);CREATE TABLE creative_project_operations(creative_project_operation_id INTEGER PRIMARY KEY);CREATE TABLE creative_work_events(creative_work_event_id INTEGER PRIMARY KEY);INSERT INTO users VALUES(5);INSERT INTO creative_work_projects VALUES(1);INSERT INTO creative_project_operations VALUES(7);INSERT INTO creative_work_events VALUES(11);")
try:
 db.executescript(read('migrations/canonical/0031_release467_creative_work_order_execution_history.sql'))
 db.execute("INSERT INTO creative_work_order_events(creative_work_project_id,creative_project_operation_id,event_kind,from_status,to_status,event_title,notes,actor_user_id) VALUES(1,7,'transition','not_started','ready','Started','Reviewed manual decision',5)")
 db.execute("INSERT INTO creative_work_order_events(creative_work_project_id,creative_project_operation_id,event_kind,minutes_worked,work_date,event_title,notes,actor_user_id) VALUES(1,7,'time',45,'2026-10-12','Work','Manual time evidence',5)")
 req(db.execute('SELECT COUNT(*) FROM creative_work_order_events').fetchone()[0]==2,'rows')
 try:db.execute("INSERT INTO creative_work_order_events(creative_work_project_id,creative_project_operation_id,event_kind,minutes_worked,work_date,event_title,notes,actor_user_id) VALUES(1,7,'time',900,'2026-10-12','Invalid','Bad time',5)");bad.append('invalid time accepted')
 except sqlite3.IntegrityError:pass
except Exception as e:bad.append('sql '+str(e))
print('BUILD379_REGRESSION='+('FAIL' if bad else 'GREEN'))
for e in bad:print('-',e)
sys.exit(bool(bad))
