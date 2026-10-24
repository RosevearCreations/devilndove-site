#!/usr/bin/env python3
"""Build 450: unique one-offs and exact kit components, no shadow stock journal."""
from pathlib import Path
import sqlite3

root = Path(__file__).resolve().parents[1]
db = sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript('''
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE creative_work_projects(creative_work_project_id INTEGER PRIMARY KEY);
CREATE TABLE maker_traveler_runs(maker_traveler_run_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER);
CREATE TABLE creative_project_production_runs(creative_project_production_run_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,run_status TEXT,accepted_quantity REAL);
CREATE TABLE creative_project_production_run_qa_checks(creative_project_production_run_qa_check_id INTEGER PRIMARY KEY,creative_project_production_run_id INTEGER,qa_status TEXT);
CREATE TABLE creative_work_events(creative_work_event_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,entry_status TEXT,media_url TEXT);
CREATE TABLE products(product_id INTEGER PRIMARY KEY,status TEXT,review_status TEXT,product_type TEXT,inventory_tracking INTEGER,inventory_quantity INTEGER);
CREATE TABLE product_finished_inventory_lots(product_finished_inventory_lot_id INTEGER PRIMARY KEY,product_id INTEGER,lot_status TEXT);
CREATE TABLE admin_action_audit(admin_action_audit_id INTEGER PRIMARY KEY,action_type TEXT,target_type TEXT,target_key TEXT);
CREATE TABLE site_item_inventory(site_item_inventory_id INTEGER PRIMARY KEY,on_hand_quantity REAL);
CREATE TABLE creative_project_inventory_posts(creative_project_inventory_post_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,site_item_inventory_id INTEGER);
CREATE TABLE creative_project_inventory_reversals(creative_project_inventory_reversal_id INTEGER PRIMARY KEY,creative_project_inventory_post_id INTEGER,stock_quantity_restored REAL,authorized_at TEXT);
CREATE TABLE orders(order_id INTEGER PRIMARY KEY,order_status TEXT,payment_status TEXT);
CREATE TABLE order_status_history(order_status_history_id INTEGER PRIMARY KEY,order_id INTEGER,old_status TEXT,new_status TEXT,changed_by_user_id INTEGER,note TEXT,created_at TEXT);
CREATE TABLE order_items(order_item_id INTEGER PRIMARY KEY,order_id INTEGER,product_id INTEGER,quantity INTEGER);
CREATE TABLE product_bundle_settings(bundle_product_id INTEGER PRIMARY KEY);
CREATE TABLE product_bundle_components(product_bundle_component_id INTEGER PRIMARY KEY,bundle_product_id INTEGER,component_product_id INTEGER,quantity_per_bundle INTEGER);
CREATE VIEW product_inventory_active_commitments AS SELECT oi.product_id, SUM(oi.quantity) committed_quantity FROM order_items oi JOIN orders o ON o.order_id=oi.order_id WHERE o.order_status IN ('pending','paid','fulfilled','refunded') GROUP BY oi.product_id;
INSERT INTO users VALUES(1);
INSERT INTO creative_work_projects VALUES(10);
INSERT INTO creative_work_events VALUES(1,10,'active','maker-photo.webp'),(2,10,'active','repair-photo.webp');
INSERT INTO products VALUES(101,'draft','pending_review','physical',1,1),(102,'draft','pending_review','physical',1,2),(201,'active','approved','physical',0,0),(202,'active','approved','physical',1,4),(203,'active','approved','physical',1,4);
INSERT INTO product_finished_inventory_lots VALUES(1,101,'available'),(2,102,'quarantined');
''')
db.executescript((root/'migrations/canonical/0043_release467_finished_quality_rework_salvage.sql').read_text())
db.executescript((root/'migrations/canonical/0046_release467_finished_pieces_unique_allocation.sql').read_text())
hash64 = 'a'*64

def reject(label,query,args=()):
    try: db.execute(query,args)
    except sqlite3.IntegrityError: return
    raise AssertionError(label + ': unexpectedly allowed')

def create_attempt(key,outcome='first_quality',safety='safe',qty=1,photo=1,failed=False):
    db.execute('''INSERT INTO maker_quality_attempts(creative_work_project_id,attempt_key,outcome,safety_state,attempted_quantity,quantity_unit,failure_cause,lessons_learned,creative_work_event_id,reviewed_by_user_id,request_key,payload_sha256)
      VALUES(10,?,?,?,?,?,?,?,?,1,?,?)''',(key,outcome,safety,qty,'piece','Rejected because material was brittle.' if failed else None,'We documented the actual work and safety.',photo,'qa-'+key,hash64))
    return db.execute('SELECT last_insert_rowid()').fetchone()[0]

def review(attempt,decision):
    db.execute('INSERT INTO maker_quality_release_reviews(maker_quality_attempt_id,decision,review_note,reviewed_by_user_id,request_key,payload_sha256) VALUES(?,?,?,1,?,?)',(attempt,decision,'Human reviewed real sale-readiness evidence.','review-'+str(attempt)+'-'+decision,hash64))

def link(attempt,product):
    db.execute('INSERT INTO maker_quality_product_links(maker_quality_attempt_id,product_id,link_note,linked_by_user_id,request_key,payload_sha256) VALUES(?,?,?,1,?,?)',(attempt,product,'Human associated the approved real output.','link-'+str(product),hash64))

def piece(serial,attempt,product,lot=None):
    db.execute('''INSERT INTO maker_finished_pieces(serial_code,maker_quality_attempt_id,product_id,product_finished_inventory_lot_id,variant_label,edition_label,piece_note,recorded_by_user_id,request_key,payload_sha256)
      VALUES(?,?,?,?,'Ocean teal','Edition A','Actual finished craft unit is in Product stock.',1,?,?)''',(serial,attempt,product,lot,'register-'+serial,hash64))
    return db.execute('SELECT last_insert_rowid()').fetchone()[0]

def claim(piece_id,action,channel,key,order=None):
    db.execute('''INSERT INTO maker_finished_piece_claims(maker_finished_piece_id,action,channel,order_item_id,claim_note,recorded_by_user_id,request_key,payload_sha256)
      VALUES(?,?,?,?,?,1,?,?)''',(piece_id,action,channel,order,'Operator checked this specific finished piece.',key,hash64))

good=create_attempt('one-off')
second=create_attempt('repair-two',qty=2,photo=2)
bad=create_attempt('reject-one',outcome='reject',safety='unsafe',failed=True)
review(good,'approved_for_sale');review(second,'approved_for_sale');review(bad,'hold')
link(good,101);link(second,102)
one=piece('ONE-OF-ONE-001',good,101,1)
reject('duplicate serial','INSERT INTO maker_finished_pieces(serial_code,maker_quality_attempt_id,product_id,piece_note,recorded_by_user_id,request_key,payload_sha256) VALUES(?,?,?, ?,1,?,?)',('ONE-OF-ONE-001',second,102,'Duplicate physical serial forbidden.','duplicate-serial',hash64))
reject('source rejected','INSERT INTO maker_finished_pieces(serial_code,maker_quality_attempt_id,product_id,piece_note,recorded_by_user_id,request_key,payload_sha256) VALUES(?,?,?, ?,1,?,?)',('REJECT-PIECE-1',bad,101,'Rejected casting cannot become a sale.', 'bad-piece',hash64))
reject('more serials than accepted','INSERT INTO maker_finished_pieces(serial_code,maker_quality_attempt_id,product_id,piece_note,recorded_by_user_id,request_key,payload_sha256) VALUES(?,?,?, ?,1,?,?)',('OVERAGE-002',good,101,'Accepted quantity is already assigned.','overage',hash64))
reject('wrong/quarantined source lot','INSERT INTO maker_finished_pieces(serial_code,maker_quality_attempt_id,product_id,product_finished_inventory_lot_id,piece_note,recorded_by_user_id,request_key,payload_sha256) VALUES(?,?,?,?,?,1,?,?)',('TWO-LOT-BAD',second,102,2,'Lot was quarantined and unavailable.','wrong-lot',hash64))
two=piece('SECOND-001',second,102)
three=piece('SECOND-002',second,102)
reject('accepted quantity exceeded','INSERT INTO maker_finished_pieces(serial_code,maker_quality_attempt_id,product_id,piece_note,recorded_by_user_id,request_key,payload_sha256) VALUES(?,?,?, ?,1,?,?)',('SECOND-003',second,102,'Third serial on two actual items.','third-piece',hash64))

before_products=db.execute('SELECT product_id,inventory_quantity FROM products ORDER BY product_id').fetchall()
claim(one,'reserved','etsy','held-etsy-450')
assert db.execute('SELECT available_quantity FROM maker_finished_piece_sellability WHERE product_id=101').fetchone()[0]==0
reject('double reserve across channels','INSERT INTO maker_finished_piece_claims(maker_finished_piece_id,action,channel,claim_note,recorded_by_user_id,request_key,payload_sha256) VALUES(? ,\'reserved\',\'storefront\',?,1,?,?)',(one,'Storefront cannot reserve same unique piece.','bad-second-hold',hash64))
db.execute("INSERT INTO orders VALUES(40,'pending','pending')")
reject('checkout against Etsy hold','INSERT INTO order_items VALUES(400,40,101,1)')
assert db.execute('SELECT order_status FROM orders WHERE order_id=40').fetchone()[0]=='cancelled', 'conflicting checkout must be cancelled (not left pending)'
claim(one,'released','etsy','released-etsy-450')
assert db.execute('SELECT available_quantity FROM maker_finished_piece_sellability WHERE product_id=101').fetchone()[0]==1
db.execute("UPDATE orders SET order_status='pending' WHERE order_id=40")
db.execute('INSERT INTO order_items VALUES(400,40,101,1)')
reject('reserve against existing storefront order','INSERT INTO maker_finished_piece_claims(maker_finished_piece_id,action,channel,claim_note,recorded_by_user_id,request_key,payload_sha256) VALUES(? ,\'reserved\',\'etsy\',?,1,?,?)',(one,'Existing checkout must win this claim.','bad-hold-order',hash64))
db.execute("UPDATE orders SET order_status='paid',payment_status='paid' WHERE order_id=40")
claim(one,'sold','storefront','paid-sale-450',400)
assert db.execute('SELECT available_quantity FROM maker_finished_piece_sellability WHERE product_id=101').fetchone()[0]==0
reject('second paid sale','INSERT INTO maker_finished_piece_claims(maker_finished_piece_id,action,channel,order_item_id,claim_note,recorded_by_user_id,request_key,payload_sha256) VALUES(? ,\'sold\',\'etsy\',400,?,1,?,?)',(one,'Same object cannot be sold twice.','double-sale',hash64))
reject('unpaid fake sale','INSERT INTO maker_finished_piece_claims(maker_finished_piece_id,action,channel,order_item_id,claim_note,recorded_by_user_id,request_key,payload_sha256) VALUES(? ,\'sold\',\'storefront\',401,?,1,?,?)',(two,'An unpaid order cannot confirm sale.','unpaid-sale',hash64))
reject('stock below registered physical units','UPDATE products SET inventory_quantity=0 WHERE product_id=101')
reject('rewrite immutable serial','UPDATE maker_finished_pieces SET serial_code=\'CHANGED\' WHERE maker_finished_piece_id=?',(one,))
reject('delete sold claim','DELETE FROM maker_finished_piece_claims WHERE maker_finished_piece_id=?',(one,))

db.executescript('''
INSERT INTO product_bundle_settings VALUES(201);
INSERT INTO product_bundle_components VALUES(1,201,202,2),(2,201,203,1);
INSERT INTO orders VALUES(50,'paid','paid'),(51,'paid','paid');
INSERT INTO order_items VALUES(500,50,201,1),(501,50,202,2),(502,50,203,1),(503,51,202,2),(504,50,203,2);
''')
def kit(kit_line,comp_line,key):
    db.execute('''INSERT INTO maker_finished_kit_component_links(kit_order_item_id,component_order_item_id,linked_by_user_id,link_note,request_key,payload_sha256)
      VALUES(?,?,1,'Real component was committed in this order.',?,?)''',(kit_line,comp_line,key,hash64))
kit(500,501,'component-one')
kit(500,502,'component-two')
reject('different order component','INSERT INTO maker_finished_kit_component_links(kit_order_item_id,component_order_item_id,linked_by_user_id,link_note,request_key,payload_sha256) VALUES(500,503,1,?, ?,?)',('Different order is not actual kit fulfillment.','wrong-order',hash64))
reject('component exceeds kit recipe','INSERT INTO maker_finished_kit_component_links(kit_order_item_id,component_order_item_id,linked_by_user_id,link_note,request_key,payload_sha256) VALUES(500,504,1,?, ?,?)',('Component was in excess of the kit recipe.','wrong-count',hash64))
reject('duplicate physical component receipt','INSERT INTO maker_finished_kit_component_links(kit_order_item_id,component_order_item_id,linked_by_user_id,link_note,request_key,payload_sha256) VALUES(500,501,1,?, ?,?)',('Physical component cannot be counted twice.','duplicate-component',hash64))
reject('rewrite kit evidence','UPDATE maker_finished_kit_component_links SET kit_order_item_id=500 WHERE component_order_item_id=501')
assert db.execute('SELECT product_id,inventory_quantity FROM products ORDER BY product_id').fetchall()==before_products
assert db.execute('SELECT COUNT(*) FROM maker_finished_pieces').fetchone()[0]==3
assert db.execute('SELECT COUNT(*) FROM maker_finished_kit_component_links').fetchone()[0]==2
assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
print('BUILD450_FINISHED_PIECES_SQL=GREEN; unique serials, approved QA, edition/variant, sold-once, cross-channel holds, checkout guard, immutable paid-order link, actual kit components without new stock posts')
