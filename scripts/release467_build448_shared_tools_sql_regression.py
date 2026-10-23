#!/usr/bin/env python3
"""Build 448: two projects share Tool, reviewed conflict and hard maintenance stop."""
from pathlib import Path
import sqlite3

root = Path(__file__).resolve().parents[1]
db = sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript('''
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE site_item_inventory(site_item_inventory_id INTEGER PRIMARY KEY,item_name TEXT,source_type TEXT,is_active INTEGER,do_not_reuse INTEGER,on_hand_quantity REAL);
CREATE TABLE inventory_tool_lifecycle_profiles(site_item_inventory_id INTEGER PRIMARY KEY,lifecycle_status TEXT,condition_status TEXT,next_service_at TEXT);
CREATE TABLE inventory_workstation_memberships(site_item_inventory_id INTEGER,workstation_site_item_inventory_id INTEGER,PRIMARY KEY(site_item_inventory_id,workstation_site_item_inventory_id));
CREATE TABLE inventory_current_locations(site_item_inventory_id INTEGER PRIMARY KEY,current_location_site_item_inventory_id INTEGER);
CREATE TABLE creative_work_projects(creative_work_project_id INTEGER PRIMARY KEY,project_status TEXT,project_title TEXT);
CREATE TABLE creative_project_operations(creative_project_operation_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,plan_status TEXT);
CREATE TABLE maker_traveler_runs(maker_traveler_run_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER);
CREATE TABLE maker_traveler_run_steps(maker_traveler_run_step_id INTEGER PRIMARY KEY,maker_traveler_run_id INTEGER,resource_snapshot_json TEXT);
INSERT INTO users VALUES(1),(2);
INSERT INTO site_item_inventory VALUES
 (501,'Shared forge', 'tool',1,0,1),
 (502,'Laser with maintenance', 'tool',1,0,1),
 (503,'Unsafe furnace', 'tool',1,0,1),
 (504,'Do-not-reuse motor', 'tool',1,1,1),
 (505,'Jewelry station','tool',1,0,1),
 (506,'Forge station','tool',1,0,1);
INSERT INTO inventory_tool_lifecycle_profiles VALUES(501,'active','good','2027-03-01'),(502,'active','good','2027-03-01'),(503,'out_of_service','unsafe',NULL),(504,'active','good',NULL);
INSERT INTO creative_work_projects VALUES(10,'active','Wedding rings'),(20,'active','Casting experiments');
INSERT INTO creative_project_operations VALUES(15,10,'active'),(25,20,'active');
INSERT INTO maker_traveler_runs VALUES(1,10);
INSERT INTO maker_traveler_run_steps VALUES(101,1,'[{"site_item_inventory_id":501,"source_type":"tool"}]');
INSERT INTO inventory_workstation_memberships VALUES(501,505),(501,506);
INSERT INTO inventory_current_locations VALUES(501,505);
''')
db.executescript((root / 'migrations/canonical/0033_release467_resource_calendar_conflicts.sql').read_text())
db.executescript((root / 'migrations/canonical/0044_release467_shared_tools_maintenance_conflict_reviews.sql').read_text())
before = db.execute('SELECT * FROM site_item_inventory ORDER BY 1').fetchall()
hash64 = 'a' * 64

def reject(label, query, params=()):
    try:
        db.execute(query, params)
    except sqlite3.IntegrityError:
        return
    raise AssertionError(label + ' unexpectedly passed')

def schedule(resource, project, kind, request_key, start='2026-11-02T13:00:00Z', end='2026-11-02T15:00:00Z', override=0, ack=0):
    return db.execute('''INSERT INTO creative_resource_calendar_entries
      (resource_site_item_inventory_id,creative_work_project_id,entry_kind,title,starts_at_utc,ends_at_utc,
       override_conflict,override_maintenance_ack,override_reason,operator_note,created_by_user_id,request_key)
       VALUES(?,?,?,'Real tool booking',?,?,?,?,'Operator reviewed this shared tool carefully.','Documented booking note.',1,?)''',
       (resource,project,kind,start,end,override,ack,request_key)).lastrowid

first = schedule(501,10,'project_booking','project-a-first-448')
assert first>0
assert db.execute('SELECT COUNT(*) FROM inventory_workstation_memberships WHERE site_item_inventory_id=501').fetchone()[0] == 2
assert db.execute('SELECT current_location_site_item_inventory_id FROM inventory_current_locations WHERE site_item_inventory_id=501').fetchone()[0] == (505,)[0]

reject('unreviewed shared booking', '''INSERT INTO creative_resource_calendar_entries(resource_site_item_inventory_id,creative_work_project_id,entry_kind,title,starts_at_utc,ends_at_utc,override_conflict,override_reason,operator_note,created_by_user_id,request_key)
 VALUES(501,20,'project_booking','Second project same tool','2026-11-02T13:00:00Z','2026-11-02T15:00:00Z',1,'We realize these overlap physically.','Operator considered the existing booking.',1,'project-b-second-448')''')

def decision(kind,request_key='decision-shared-tool-448',booking_key='project-b-second-448',start='2026-11-02T13:00:00Z',end='2026-11-02T15:00:00Z',conflict=first):
    return db.execute('''INSERT INTO maker_tool_booking_decisions(site_item_inventory_id,creative_work_project_id,conflicting_calendar_entry_id,calendar_request_key,starts_at_utc,ends_at_utc,decision,decision_note,reviewed_by_user_id,request_key,payload_sha256)
     VALUES(501,20,?,?,?,?,?,'Human confirms precisely scheduled supervised overlap.',2,?,?)''',
     (conflict,booking_key,start,end,kind,request_key,hash64)).lastrowid

decision('approved_overlap')
reject('review does not approve different request', '''INSERT INTO creative_resource_calendar_entries(resource_site_item_inventory_id,creative_work_project_id,entry_kind,title,starts_at_utc,ends_at_utc,override_conflict,override_reason,operator_note,created_by_user_id,request_key)
 VALUES(501,20,'project_booking','Wrong request key','2026-11-02T13:00:00Z','2026-11-02T15:00:00Z',1,'Manual operator overlap considered.','Reason entered by operator for audit.',2,'changed-request-448')''')
second = schedule(501,20,'project_booking','project-b-second-448',override=1)
assert second>first
assert db.execute('SELECT COUNT(*) FROM maker_tool_booking_decisions WHERE decision="approved_overlap"').fetchone()[0]==1

maintenance = schedule(502,None,'maintenance','maintenance-only-448')
reject('maintenance override even after ack', '''INSERT INTO creative_resource_calendar_entries(resource_site_item_inventory_id,creative_work_project_id,entry_kind,title,starts_at_utc,ends_at_utc,override_conflict,override_maintenance_ack,override_reason,operator_note,created_by_user_id,request_key)
 VALUES(502,20,'project_booking','Unsafe maintenance overlap','2026-11-02T13:00:00Z','2026-11-02T15:00:00Z',1,1,'Operator thought they could ignore maintenance.','Booking source from operator notes.',2,'maintenance-bypass-448')''')
reject('approve maintenance collision', '''INSERT INTO maker_tool_booking_decisions(site_item_inventory_id,creative_work_project_id,conflicting_calendar_entry_id,calendar_request_key,starts_at_utc,ends_at_utc,decision,decision_note,reviewed_by_user_id,request_key,payload_sha256)
 VALUES(502,20,?,'try-maint-approval-448','2026-11-02T13:00:00Z','2026-11-02T15:00:00Z','approved_overlap','Do not approve a physical maintenance hold.',2,'maintenance-decision-448',?)''',(maintenance,hash64))
reject('out of service tool booking', '''INSERT INTO creative_resource_calendar_entries(resource_site_item_inventory_id,creative_work_project_id,entry_kind,title,starts_at_utc,ends_at_utc,operator_note,created_by_user_id,request_key)
 VALUES(503,10,'project_booking','Unsafe tool booking','2026-11-02T13:00:00Z','2026-11-02T15:00:00Z','Not allowed physically.',1,'unsafe-tool-448')''')
reject('do not reuse inventory booking', '''INSERT INTO creative_resource_calendar_entries(resource_site_item_inventory_id,creative_work_project_id,entry_kind,title,starts_at_utc,ends_at_utc,operator_note,created_by_user_id,request_key)
 VALUES(504,10,'project_booking','Retired equipment use','2026-11-02T13:00:00Z','2026-11-02T15:00:00Z','Not allowed physically.',1,'retired-tool-448')''')

def safety_check(tool_id,project,step,result,key):
    return db.execute('''INSERT INTO maker_tool_safety_checks(site_item_inventory_id,creative_work_project_id,maker_traveler_run_step_id,check_kind,result,check_note,reviewed_by_user_id,request_key,payload_sha256)
     VALUES(?,?,?,'condition_inspection',?,'Actual safety observation recorded by human.',1,?,?)''',(tool_id,project,step,result,key,hash64)).lastrowid

passed=safety_check(501,10,101,'passed','real-inspection-448')
assert passed>0
safety_check(503,10,None,'failed','unsafe-result-448')
reject('unsafe cannot self-certify', '''INSERT INTO maker_tool_safety_checks(site_item_inventory_id,check_kind,result,check_note,reviewed_by_user_id,request_key,payload_sha256)
 VALUES(503,'condition_inspection','passed','Falsely certify an unsafe tool.',1,'unsafe-pass-448',?)''',(hash64,))
reject('traveler cannot borrow another project Tool', '''INSERT INTO maker_tool_safety_checks(site_item_inventory_id,creative_work_project_id,maker_traveler_run_step_id,check_kind,result,check_note,reviewed_by_user_id,request_key,payload_sha256)
 VALUES(502,10,101,'condition_inspection','held','Wrong Tool does not belong to this step.',1,'wrong-traveler-448',?)''',(hash64,))
reject('immutable inspection', 'UPDATE maker_tool_safety_checks SET result="failed" WHERE maker_tool_safety_check_id=?',(passed,))
reject('cannot delete owner decision', 'DELETE FROM maker_tool_booking_decisions WHERE maker_tool_booking_decision_id=1')
assert db.execute('SELECT * FROM site_item_inventory ORDER BY 1').fetchall()==before
assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
print('BUILD448_SHARED_TOOLS_SQL=GREEN; two projects shared one Tool only after exact human approval; maintenance, unsafe/do-not-reuse and false safety sign-off blocked; memberships, physical location and Inventory stock unchanged')
