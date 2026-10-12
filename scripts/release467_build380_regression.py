#!/usr/bin/env python3
"""Build 380: SQLite trigger/capacity/provenance and front-end/API regression."""
from pathlib import Path
import sqlite3,subprocess,json,sys
root=Path(__file__).resolve().parents[1];errors=[]
def read(p):return (root/p).read_text(encoding='utf-8')
def req(x,msg):
 if not x:errors.append(msg)
pointer=json.loads(read('current-development-authority.json'))
manifest=json.loads(read('migrations/canonical/manifest.json'))
req(pointer.get('build',0)>=380,'current pointer must be Build 380 or newer')
req(len(manifest['migrations'])>=32 and manifest['migrations'][31]['version']==32,'canonical version 32 preserved')
req(manifest['migrations'][31]['file']=='0032_release467_project_material_reservations.sql','canonical migration 0032 preserved at index 31')
api=read('functions/api/admin/project-material-planner.js')
for token in ('getAdminUserFromRequest','Origin','auditAdminAction','CAPACITY_OR_IDENTITY_CONFLICT','site_item_inventory','site_inventory_usage_profiles','creative_project_inventory_posts','creative_project_inventory_usage_details','inventory_purchase_lots','reserved_quantity'):
 req(token in api,'API token '+token)
for path in ('functions/api/admin/project-material-planner.js','functions/api/admin/_lib/projectMaterialMath.js','public/js/admin-project-material-planner.js'):
 p=subprocess.run(['node','--check',str(root/path)],capture_output=True,text=True);req(p.returncode==0,'JS parse '+path+': '+p.stderr[-300:])
p=subprocess.run(['node','--test','scripts/release467_build380_math.test.mjs'],cwd=root,capture_output=True,text=True)
req(p.returncode==0,'Math tests '+p.stdout[-400:]+p.stderr[-250:])
db=sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript("""
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE creative_work_projects(creative_work_project_id INTEGER PRIMARY KEY);
CREATE TABLE creative_project_operations(creative_project_operation_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,plan_status TEXT);
CREATE TABLE site_item_inventory(site_item_inventory_id INTEGER PRIMARY KEY,source_type TEXT,is_active INTEGER,on_hand_quantity REAL,reserved_quantity REAL,updated_at TEXT,source_type_for_test TEXT,external_key TEXT,item_name TEXT,incoming_quantity REAL);
CREATE TABLE site_inventory_usage_profiles(site_item_inventory_id INTEGER PRIMARY KEY,usage_tracking_mode TEXT);
CREATE TABLE site_inventory_movements(site_inventory_movement_id INTEGER PRIMARY KEY,site_item_inventory_id INTEGER,source_type TEXT,external_key TEXT,item_name TEXT,movement_type TEXT,quantity_delta REAL,previous_on_hand_quantity REAL,new_on_hand_quantity REAL,previous_reserved_quantity REAL,new_reserved_quantity REAL,previous_incoming_quantity REAL,new_incoming_quantity REAL,note TEXT,actor_user_id INTEGER,created_at TEXT);
INSERT INTO users VALUES(8);
INSERT INTO creative_work_projects VALUES(1),(2);
INSERT INTO creative_project_operations VALUES(11,1,'planned'),(22,2,'planned');
INSERT INTO site_item_inventory(site_item_inventory_id,source_type,is_active,on_hand_quantity,reserved_quantity,external_key,item_name,incoming_quantity) VALUES(40,'supply',1,5,1,'metal-wire','Copper wire',0),(41,'tool',1,5,0,'torch','Torch',0);
INSERT INTO site_inventory_usage_profiles VALUES(40,'exact'),(41,'reusable');
""")
try:
 db.executescript(read('migrations/canonical/0032_release467_project_material_reservations.sql'))
 def create(pid,op,item,amount,key):
  return db.execute("""INSERT INTO creative_project_material_reservations
   (creative_work_project_id,creative_project_operation_id,site_item_inventory_id,original_stock_quantity,stock_unit_label_snapshot,reservation_note,created_by_user_id,request_key)
   VALUES(?,?,?,?,?,?,?,?)""",(pid,op,item,amount,'spool','Real materials planned',8,key))
 create(1,11,40,3,'req_one_1234567890')
 req(abs(db.execute('SELECT reserved_quantity FROM site_item_inventory WHERE site_item_inventory_id=40').fetchone()[0]-4)<0.001,'Reserve did not touch canonical stock')
 try:create(2,22,40,2,'req_two_1234567890');errors.append('Over-allocation across projects accepted')
 except sqlite3.IntegrityError:pass
 try:create(1,22,40,0.2,'req_wrong_operation_1111');errors.append('Cross-project operation accepted')
 except sqlite3.IntegrityError:pass
 try:create(1,11,41,1,'req_tool_123456789');errors.append('Tool reservation accepted')
 except sqlite3.IntegrityError:pass
 try:create(1,11,40,0.5,'req_one_1234567890');errors.append('Duplicate idempotency accepted')
 except sqlite3.IntegrityError:pass
 db.execute("UPDATE creative_project_material_reservations SET released_stock_quantity=1,release_note='Actual use later',updated_by_user_id=8 WHERE creative_project_material_reservation_id=1")
 req(abs(db.execute('SELECT reserved_quantity FROM site_item_inventory WHERE site_item_inventory_id=40').fetchone()[0]-3)<0.001,'Partial release canonical reserved balance')
 create(2,22,40,1.5,'req_second_1234567890')
 req(abs(db.execute('SELECT reserved_quantity FROM site_item_inventory WHERE site_item_inventory_id=40').fetchone()[0]-4.5)<0.001,'Second project reserve')
 req(db.execute("SELECT COUNT(*) FROM site_inventory_movements WHERE movement_type IN ('reserve','release')").fetchone()[0]==3,'Canonical reserve/release movement history')
 try:db.execute("UPDATE creative_project_material_reservations SET released_stock_quantity=10 WHERE creative_project_material_reservation_id=1");errors.append('Over-release accepted')
 except sqlite3.IntegrityError:pass
 req(not db.execute('PRAGMA foreign_key_check').fetchall(),'Foreign key check')
except Exception as e:errors.append('SQLite '+str(e))
print('RELEASE467_BUILD380_REGRESSION='+('FAIL' if errors else 'GREEN'))
for error in errors:print('-',error)
sys.exit(bool(errors))
