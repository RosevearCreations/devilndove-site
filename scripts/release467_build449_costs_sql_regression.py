#!/usr/bin/env python3
"""Build 449: source guards, immutable costing review, no phantom stock/revenue."""
from pathlib import Path
import sqlite3

root = Path(__file__).resolve().parents[1]
db = sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript('''
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE creative_work_projects(creative_work_project_id INTEGER PRIMARY KEY,project_title TEXT);
CREATE TABLE creative_project_inventory_posts(creative_project_inventory_post_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,posting_status TEXT);
CREATE TABLE creative_project_inventory_reversals(creative_project_inventory_reversal_id INTEGER PRIMARY KEY,creative_project_inventory_post_id INTEGER);
CREATE TABLE creative_work_order_events(creative_work_order_event_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,event_kind TEXT);
CREATE TABLE site_item_inventory(site_item_inventory_id INTEGER PRIMARY KEY,on_hand_quantity REAL);
CREATE TABLE creative_project_profitability(creative_work_project_id INTEGER PRIMARY KEY,revenue_cents INTEGER);
INSERT INTO users VALUES (1);
INSERT INTO creative_work_projects VALUES (10,'Good one-off'),(20,'Failed batch'),(30,'Commission'),(40,'Private learning');
INSERT INTO site_item_inventory VALUES (1,25);
INSERT INTO creative_project_profitability VALUES (10,0),(20,0),(30,0),(40,0);
INSERT INTO creative_project_inventory_posts VALUES (100,10,'posted'),(200,20,'posted'),(300,30,'posted');
INSERT INTO creative_work_order_events VALUES (101,10,'time'),(201,20,'time'),(301,30,'time');
''')
db.executescript((root / 'migrations/canonical/0045_release467_maker_project_cost_scenarios.sql').read_text())
def expect_reject(label,sql,params=()):
    try:
        db.execute(sql,params)
    except sqlite3.IntegrityError:
        return
    raise AssertionError(label+' should be forbidden')

def review(project,kind,key,no_stock=0,no_time=0,price=None):
    return db.execute('''INSERT INTO maker_project_cost_reviews
    (creative_work_project_id,scenario_kind,review_label,labour_rate_cents_per_hour,machine_rate_cents_per_hour,
    machine_minutes,packaging_cents,consumables_cents,rework_cents,finishing_cents,outside_service_cents,
    overhead_cents,proposed_price_cents,pricing_quantity,no_material_use_confirmed,no_labour_confirmed,
    review_note,reviewed_by_user_id,request_key,payload_sha256)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
    (project,kind,'Human costing review',1500,2500,30,0,0,0,0,0,0,price,1,no_stock,no_time,
     'Reviewed our real maker evidence and cost boundaries.',1,key,'a'*64)).lastrowid

before_inventory=db.execute('SELECT * FROM site_item_inventory').fetchall()
before_finance=db.execute('SELECT * FROM creative_project_profitability').fetchall()
one=review(10,'one_off','maker-cost-449-one-off',price=9000)
failed=review(20,'failed_batch','maker-cost-449-failed')
commission=review(30,'commission','maker-cost-449-commission',price=25000)
private=review(40,'private_learning','maker-cost-449-private',no_stock=1,no_time=1)
assert len({one,failed,commission,private})==4
expect_reject('false no-material declaration', '''INSERT INTO maker_project_cost_reviews
 (creative_work_project_id,scenario_kind,review_label,no_material_use_confirmed,review_note,reviewed_by_user_id,request_key,payload_sha256)
 VALUES(10,'one_off','Impossible',1,'This claim contradicts a real posted receipt.',1,'false-material-449','b'||? )''',('a'*63,))
expect_reject('false no-labour declaration', '''INSERT INTO maker_project_cost_reviews
 (creative_work_project_id,scenario_kind,review_label,no_labour_confirmed,review_note,reviewed_by_user_id,request_key,payload_sha256)
 VALUES(10,'one_off','Impossible',1,'This claim contradicts a real time record.',1,'false-labour-449',?)''',('b'*64,))
expect_reject('negative cost', '''INSERT INTO maker_project_cost_reviews
 (creative_work_project_id,scenario_kind,review_label,packaging_cents,review_note,reviewed_by_user_id,request_key,payload_sha256)
 VALUES(40,'private_learning','Invalid',-1,'Cannot silently turn costs into a credit.',1,'negative-cost-449',?)''',('b'*64,))
expect_reject('duplicate idempotency key', '''INSERT INTO maker_project_cost_reviews
 (creative_work_project_id,scenario_kind,review_label,review_note,reviewed_by_user_id,request_key,payload_sha256)
 VALUES(30,'commission','Duplicate','Same write cannot create a second receipt.',1,'maker-cost-449-one-off',?)''',('b'*64,))
expect_reject('immutable review', 'UPDATE maker_project_cost_reviews SET proposed_price_cents=1 WHERE maker_project_cost_review_id=?',(one,))
expect_reject('no deletion', 'DELETE FROM maker_project_cost_reviews WHERE maker_project_cost_review_id=?',(failed,))
db.execute('INSERT INTO creative_project_inventory_reversals VALUES(1,300)')
assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
assert db.execute('SELECT * FROM site_item_inventory').fetchall()==before_inventory
assert db.execute('SELECT * FROM creative_project_profitability').fetchall()==before_finance
assert db.execute('SELECT COUNT(*) FROM maker_project_cost_reviews').fetchone()[0]==4
print('BUILD449_COST_SQL=GREEN; four use cases, immutable and deduplicated owner reviews; no untrue zero-use, stock, finance or revenue mutation')
