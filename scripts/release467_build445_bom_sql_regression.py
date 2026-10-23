#!/usr/bin/env python3
"""Build 445: resin and jewellery BOM point only to genuine Inventory movements."""
from pathlib import Path
import sqlite3

root = Path(__file__).resolve().parents[1]
migration = (root / 'migrations/canonical/0041_release467_project_bom_actual_usage.sql').read_text()
db = sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript('''
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE creative_work_projects(creative_work_project_id INTEGER PRIMARY KEY);
CREATE TABLE inventory_processes(inventory_process_id INTEGER PRIMARY KEY,process_name TEXT);
CREATE TABLE creative_project_operations(creative_project_operation_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,inventory_process_id INTEGER,plan_status TEXT,operation_title TEXT,operation_order INTEGER);
CREATE TABLE site_item_inventory(site_item_inventory_id INTEGER PRIMARY KEY,source_type TEXT,is_active INTEGER,item_name TEXT,on_hand_quantity REAL,reserved_quantity REAL,usage_units_per_stock_unit REAL,stock_unit_label TEXT,usage_unit_label TEXT);
CREATE TABLE inventory_purchase_lots(inventory_purchase_lot_id INTEGER PRIMARY KEY,site_item_inventory_id INTEGER,lot_code TEXT,quantity_remaining REAL,expiry_date TEXT);
CREATE TABLE creative_project_inventory_posts(creative_project_inventory_post_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,site_item_inventory_id INTEGER,stock_quantity_consumed REAL,posting_status TEXT);
CREATE TABLE creative_project_inventory_usage_details(creative_project_inventory_post_id INTEGER PRIMARY KEY,usage_quantity_consumed REAL,usage_unit_label TEXT);
CREATE TABLE creative_project_inventory_reversals(creative_project_inventory_reversal_id INTEGER PRIMARY KEY,creative_project_inventory_post_id INTEGER,authorized_at TEXT,stock_quantity_restored REAL);
INSERT INTO users VALUES(1);
INSERT INTO creative_work_projects VALUES(10),(20);
INSERT INTO inventory_processes VALUES(1,'Resin casting'),(2,'Jewellery finishing');
INSERT INTO creative_project_operations VALUES(100,10,1,'planned','Cast resin',1),(200,20,2,'planned','Polish silver',1);
INSERT INTO site_item_inventory VALUES(1001,'supply',1,'Epoxy resin',1.5,0.2,1000,'bottle','gram'),(1002,'supply',1,'Silver wire',4,0.5,50,'coil','gram');
INSERT INTO inventory_purchase_lots VALUES(501,1001,'RESIN-RED',1.5,NULL),(502,1002,'AG-991',4,NULL);
INSERT INTO creative_project_inventory_posts VALUES(7001,10,1001,0.125,'posted'),(7002,20,1002,0.05,'posted'),(7003,10,1001,0.1,'posted');
INSERT INTO creative_project_inventory_usage_details VALUES(7001,125,'gram'),(7002,2.5,'gram'),(7003,100,'gram');
''')
db.executescript(migration)
def reject(reason,sql,*params):
    try: db.execute(sql,params)
    except sqlite3.IntegrityError: return
    raise AssertionError(f'{reason} unexpectedly accepted')

before=db.execute('SELECT site_item_inventory_id,on_hand_quantity,reserved_quantity FROM site_item_inventory ORDER BY 1').fetchall()
db.execute('''INSERT INTO maker_project_bom_lines(creative_work_project_id,creative_project_operation_id,site_item_inventory_id,inventory_purchase_lot_id,
 planned_usage_quantity,usage_unit_label_snapshot,usage_units_per_stock_unit_snapshot,stock_unit_label_snapshot,line_note,created_by_user_id,request_key)
 VALUES(10,100,1001,501,200,'gram',1000,'bottle','A specific resin pour.',1,'resin-plan-445')''')
db.execute('''INSERT INTO maker_project_bom_lines(creative_work_project_id,creative_project_operation_id,site_item_inventory_id,inventory_purchase_lot_id,
 planned_usage_quantity,usage_unit_label_snapshot,usage_units_per_stock_unit_snapshot,stock_unit_label_snapshot,line_note,created_by_user_id,request_key)
 VALUES(20,200,1002,502,5,'gram',50,'coil','Jewellery wire measurement.',1,'metal-plan-445')''')
assert before==db.execute('SELECT site_item_inventory_id,on_hand_quantity,reserved_quantity FROM site_item_inventory ORDER BY 1').fetchall()
db.execute("INSERT INTO maker_project_bom_actual_links(maker_project_bom_line_id,creative_project_inventory_post_id,scrap_usage_quantity,classification_note,linked_by_user_id,request_key) VALUES(1,7001,25,'The pour spoiled 25 grams.',1,'actual-resin-445')")
db.execute("INSERT INTO maker_project_bom_actual_links(maker_project_bom_line_id,creative_project_inventory_post_id,scrap_usage_quantity,classification_note,linked_by_user_id,request_key) VALUES(2,7002,0.5,'Half a gram of wire offcuts.',1,'actual-metal-445')")
assert before==db.execute('SELECT site_item_inventory_id,on_hand_quantity,reserved_quantity FROM site_item_inventory ORDER BY 1').fetchall(),'BOM double-depleted Inventory!'
assert db.execute('SELECT SUM(scrap_usage_quantity) FROM maker_project_bom_actual_links').fetchone()==(25.5,)
reject('double classification',"INSERT INTO maker_project_bom_actual_links(maker_project_bom_line_id,creative_project_inventory_post_id,scrap_usage_quantity,classification_note,linked_by_user_id,request_key) VALUES(1,7001,0,'Retry',1,'duplicate-resin-445')")
reject('cross-project movement',"INSERT INTO maker_project_bom_actual_links(maker_project_bom_line_id,creative_project_inventory_post_id,scrap_usage_quantity,classification_note,linked_by_user_id,request_key) VALUES(2,7003,0,'Wrong project',1,'cross-project-445')")
reject('scrap greater than consumed',"INSERT INTO maker_project_bom_actual_links(maker_project_bom_line_id,creative_project_inventory_post_id,scrap_usage_quantity,classification_note,linked_by_user_id,request_key) VALUES(1,7003,1000,'Impossible waste',1,'scrap-overflow-445')")
reject('immutable classification',"UPDATE maker_project_bom_actual_links SET scrap_usage_quantity=0 WHERE maker_project_bom_actual_link_id=1")
reject('deleting evidence',"DELETE FROM maker_project_bom_actual_links WHERE maker_project_bom_actual_link_id=1")
reject('deleting plan',"DELETE FROM maker_project_bom_lines WHERE maker_project_bom_line_id=1")
reject('altering lot provenance',"UPDATE maker_project_bom_lines SET inventory_purchase_lot_id=NULL WHERE maker_project_bom_line_id=1")
reject('incorrect supplier lot','''INSERT INTO maker_project_bom_lines(creative_work_project_id,site_item_inventory_id,inventory_purchase_lot_id,planned_usage_quantity,usage_unit_label_snapshot,
 usage_units_per_stock_unit_snapshot,stock_unit_label_snapshot,line_note,created_by_user_id,request_key)
 VALUES(10,1001,502,3,'gram',1000,'bottle','Wrong lot',1,'bad-lot-445')''')
reject('incorrect operation','''INSERT INTO maker_project_bom_lines(creative_work_project_id,creative_project_operation_id,site_item_inventory_id,planned_usage_quantity,usage_unit_label_snapshot,
 usage_units_per_stock_unit_snapshot,stock_unit_label_snapshot,line_note,created_by_user_id,request_key)
 VALUES(10,200,1001,3,'gram',1000,'bottle','Wrong operation',1,'bad-process-445')''')
db.execute("INSERT INTO creative_project_inventory_reversals VALUES(1,7003,'2026-10-23',0.1)")
reject('link reversed movement',"INSERT INTO maker_project_bom_actual_links(maker_project_bom_line_id,creative_project_inventory_post_id,scrap_usage_quantity,classification_note,linked_by_user_id,request_key) VALUES(1,7003,0,'Already returned',1,'reversed-use-445')")
db.execute("INSERT INTO creative_project_inventory_reversals VALUES(2,7001,'2026-10-23',0.125)")
assert db.execute('SELECT authorized_at FROM creative_project_inventory_reversals WHERE creative_project_inventory_post_id=7001').fetchone()[0], 'Return must remain linked to canonical reversal'
db.execute("UPDATE maker_project_bom_lines SET line_status='retired' WHERE maker_project_bom_line_id=2")
reject('retired plan reactivation',"UPDATE maker_project_bom_lines SET line_status='planned' WHERE maker_project_bom_line_id=2")
assert not db.execute('PRAGMA foreign_key_check').fetchall()
print('BUILD445_BOM_SQL=GREEN; resin 125g/0.125 bottle and silver 2.5g/0.05 coil traced; no new stock mutation; scrap, return, project, lot and idempotency guards passed')
