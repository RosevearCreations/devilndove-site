#!/usr/bin/env python3
"""Build 447: good, failed and repaired pieces; publication safety and zero stock duplication."""
from pathlib import Path
import sqlite3

root = Path(__file__).resolve().parents[1]
sql = (root / 'migrations/canonical/0043_release467_finished_quality_rework_salvage.sql').read_text()
db = sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript('''
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE creative_work_projects(creative_work_project_id INTEGER PRIMARY KEY);
CREATE TABLE maker_traveler_runs(maker_traveler_run_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER);
CREATE TABLE creative_project_production_runs(creative_project_production_run_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,run_status TEXT,accepted_quantity REAL);
CREATE TABLE creative_project_production_run_qa_checks(creative_project_production_run_qa_check_id INTEGER PRIMARY KEY,creative_project_production_run_id INTEGER,qa_status TEXT);
CREATE TABLE creative_work_events(creative_work_event_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,entry_status TEXT,media_url TEXT);
CREATE TABLE products(product_id INTEGER PRIMARY KEY,status TEXT,review_status TEXT);
CREATE TABLE admin_action_audit(admin_action_audit_id INTEGER PRIMARY KEY,action_type TEXT,target_type TEXT,target_key TEXT);
CREATE TABLE site_item_inventory(site_item_inventory_id INTEGER PRIMARY KEY,on_hand_quantity REAL);
CREATE TABLE creative_project_inventory_posts(creative_project_inventory_post_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,site_item_inventory_id INTEGER);
CREATE TABLE creative_project_inventory_reversals(creative_project_inventory_reversal_id INTEGER PRIMARY KEY,creative_project_inventory_post_id INTEGER,stock_quantity_restored REAL,authorized_at TEXT);
INSERT INTO users VALUES(1);
INSERT INTO creative_work_projects VALUES(10),(20);
INSERT INTO maker_traveler_runs VALUES(10,10),(20,20);
INSERT INTO creative_project_production_runs VALUES(100,10,'reviewed',2),(200,20,'reviewed',1);
INSERT INTO creative_project_production_run_qa_checks VALUES(1,100,'pass'),(2,200,'fail');
INSERT INTO creative_work_events VALUES(1,10,'active','private/photos/good.webp'),(2,10,'active','private/photos/fail.webp'),(3,10,'active','private/photos/repaired.webp'),(4,20,'active','private/photos/other.webp'),(5,10,'void',NULL),(6,10,'active',NULL);
INSERT INTO products VALUES(101,'draft','draft'),(102,'draft','draft'),(103,'draft','draft');
INSERT INTO site_item_inventory VALUES(501,10.5),(502,5.25);
INSERT INTO creative_project_inventory_posts VALUES(901,10,501),(902,20,502);
INSERT INTO creative_project_inventory_reversals VALUES(801,901,0.25,'2026-10-23'),(802,902,0.5,'2026-10-23');
''')
db.executescript(sql)
before = db.execute('SELECT * FROM site_item_inventory ORDER BY 1').fetchall()
hash64 = 'b' * 64

def reject(label, query, params=()):
    try:
        db.execute(query, params)
    except sqlite3.IntegrityError:
        return
    raise AssertionError(label + ' unexpectedly passed')

def attempt(number, outcome, safety, photo, parent=None, cause=None, repair=None, project=10, traveler=10, run=None):
    db.execute('''INSERT INTO maker_quality_attempts(creative_work_project_id,attempt_key,maker_traveler_run_id,creative_project_production_run_id,parent_attempt_id,outcome,safety_state,attempted_quantity,quantity_unit,failure_cause,repair_notes,lessons_learned,creative_work_event_id,reviewed_by_user_id,request_key,payload_sha256)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''', (project, f'piece-{number}', traveler, run, parent, outcome, safety, 1, 'piece', cause, repair, 'Record what really happened and what we learned.', photo, 1, f'quality-piece-{number}-request', hash64))
    return db.execute('SELECT last_insert_rowid()').fetchone()[0]

def review(attempt_id, decision, suffix='default'):
    db.execute('INSERT INTO maker_quality_release_reviews(maker_quality_attempt_id,decision,review_note,reviewed_by_user_id,request_key,payload_sha256) VALUES(?,?,?,?,?,?)', (attempt_id, decision, 'Human checked this piece and its current safety.', 1, f'quality-review-{attempt_id}-{suffix}', hash64))

good = attempt(1,'first_quality','safe',1,run=100)
failed = attempt(2,'reject','unsafe',2,cause='Casting developed a dangerous cavity.')
repair = attempt(3,'second_quality','safe',3,parent=failed,repair='Recast and polished the damaged piece.')
learning = attempt(4,'learning_only','unreviewed',None)
salvage = attempt(5,'salvage','unreviewed',2,cause='Most of the pour could be reused.')
review(good,'approved_for_sale')
review(repair,'approved_for_sale')
review(failed,'hold')
reject('unsafe reject sale', 'INSERT INTO maker_quality_release_reviews(maker_quality_attempt_id,decision,review_note,reviewed_by_user_id,request_key,payload_sha256) VALUES(?,\'approved_for_sale\',?,1,?,?)', (failed,'Unsafe attempt still cannot be sold.','reject-sale-447',hash64))
reject('learning only sale', 'INSERT INTO maker_quality_release_reviews(maker_quality_attempt_id,decision,review_note,reviewed_by_user_id,request_key,payload_sha256) VALUES(?,\'approved_for_sale\',?,1,?,?)', (learning,'Learning attempt is not a product.','learning-sale-447',hash64))
reject('salvage sale', 'INSERT INTO maker_quality_release_reviews(maker_quality_attempt_id,decision,review_note,reviewed_by_user_id,request_key,payload_sha256) VALUES(?,\'approved_for_sale\',?,1,?,?)', (salvage,'Raw salvage is not completed merchandise.','salvage-sale-447',hash64))
reject('duplicate attempt idempotency', 'INSERT INTO maker_quality_attempts(creative_work_project_id,attempt_key,outcome,safety_state,lessons_learned,reviewed_by_user_id,request_key,payload_sha256) VALUES(10,\'piece-1\',\'first_quality\',\'safe\',?,1,?,?)', ('Learning stays on the original piece.','duplicate-447',hash64))
reject('photo from different project', '''INSERT INTO maker_quality_attempts(creative_work_project_id,attempt_key,outcome,safety_state,lessons_learned,creative_work_event_id,reviewed_by_user_id,request_key,payload_sha256) VALUES(10,'bad-cross-photo','first_quality','safe',?,4,1,'cross-photo-447',?)''', ('Do not reuse another project photograph.',hash64))
reject('parent from different project', '''INSERT INTO maker_quality_attempts(creative_work_project_id,attempt_key,parent_attempt_id,outcome,safety_state,repair_notes,lessons_learned,reviewed_by_user_id,request_key,payload_sha256) VALUES(20,'wrong-parent',?,'first_quality','safe',?,?,1,'parent-447',?)''', (failed,'Correct project must be linked.','A repair cannot cross projects.',hash64))
reject('wrong project traveler', '''INSERT INTO maker_quality_attempts(creative_work_project_id,attempt_key,maker_traveler_run_id,outcome,safety_state,lessons_learned,reviewed_by_user_id,request_key,payload_sha256) VALUES(10,'wrong-run',20,'learning_only','unreviewed',?,1,'wrong-run-447',?)''', ('Actual traveler belongs to another project.',hash64))
other = attempt(6,'first_quality','safe',4,project=20,traveler=20,run=200)
reject('historical fail QA approval','INSERT INTO maker_quality_release_reviews(maker_quality_attempt_id,decision,review_note,reviewed_by_user_id,request_key,payload_sha256) VALUES(?,\'approved_for_sale\',?,1,?,?)',(other,'QA failed so this piece must be held.','run-fail-approval-447',hash64))

db.execute('INSERT INTO maker_quality_product_links(maker_quality_attempt_id,product_id,link_note,linked_by_user_id,request_key,payload_sha256) VALUES(?,?,?,?,?,?)', (good,101,'Approved good piece mapped to Product.',1,'good-product-447',hash64))
db.execute('INSERT INTO maker_quality_product_links(maker_quality_attempt_id,product_id,link_note,linked_by_user_id,request_key,payload_sha256) VALUES(?,?,?,?,?,?)', (repair,102,'Reworked safe piece mapped to Product.',1,'repair-product-447',hash64))
reject('unsafe product handoff','INSERT INTO maker_quality_product_links(maker_quality_attempt_id,product_id,link_note,linked_by_user_id,request_key,payload_sha256) VALUES(?,?,?,?,?,?)',(failed,103,'Not safe to link as a finished Product.',1,'failed-product-447',hash64))
db.execute("UPDATE products SET status='active',review_status='approved' WHERE product_id=101")
reject('hold while still public','INSERT INTO maker_quality_release_reviews(maker_quality_attempt_id,decision,review_note,reviewed_by_user_id,request_key,payload_sha256) VALUES(?,\'hold\',?,1,?,?)',(good,'Unpublish first before safety hold.', 'good-hold-447',hash64))
db.execute("UPDATE products SET status='draft',review_status='draft' WHERE product_id=101")
review(good,'hold','after-unpublish')
reject('reactivate held product',"UPDATE products SET status='active' WHERE product_id=101")
reject('Etsy one-shot claim for held Product',"INSERT INTO admin_action_audit(action_type,target_type,target_key) VALUES('etsy_product_editor_draft_claimed','product','101')")
db.execute("INSERT INTO admin_action_audit(action_type,target_type,target_key) VALUES('etsy_product_editor_draft_claimed','product','102')")

db.execute('INSERT INTO maker_quality_recovery_links(maker_quality_attempt_id,creative_project_inventory_reversal_id,recovery_note,linked_by_user_id,request_key,payload_sha256) VALUES(?,?,?,?,?,?)',(salvage,801,'Posted actual resin return, linked once.',1,'salvage-reversal-447',hash64))
reject('wrong project recovery','INSERT INTO maker_quality_recovery_links(maker_quality_attempt_id,creative_project_inventory_reversal_id,recovery_note,linked_by_user_id,request_key,payload_sha256) VALUES(?,?,?,?,?,?)',(failed,802,'Wrong project silver recovery.',1,'wrong-return-447',hash64))
reject('same physical return double counted','INSERT INTO maker_quality_recovery_links(maker_quality_attempt_id,creative_project_inventory_reversal_id,recovery_note,linked_by_user_id,request_key,payload_sha256) VALUES(?,?,?,?,?,?)',(repair,801,'Duplicate real physical stock return.',1,'double-return-447',hash64))
reject('rewrite failed history',"UPDATE maker_quality_attempts SET outcome='first_quality' WHERE maker_quality_attempt_id=?",(failed,))
reject('delete failed history','DELETE FROM maker_quality_attempts WHERE maker_quality_attempt_id=?',(failed,))
reject('rewrite review','UPDATE maker_quality_release_reviews SET decision=\'approved_for_sale\' WHERE maker_quality_attempt_id=?',(failed,))
assert db.execute('SELECT * FROM site_item_inventory ORDER BY 1').fetchall()==before, 'QA process created stock movement or duplicated recovery'
assert db.execute('SELECT COUNT(*) FROM maker_quality_attempts WHERE parent_attempt_id=?',(failed,)).fetchone()[0]==1
assert db.execute('SELECT COUNT(*) FROM maker_quality_recovery_links').fetchone()[0]==1
assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
print('BUILD447_QUALITY_SQL=GREEN; first-quality, failed casting, repaired second, learning-only, scrap/salvage, QA and public release holds, one real recovered stock receipt, immutable project lineage')
