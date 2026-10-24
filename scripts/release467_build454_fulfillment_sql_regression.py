#!/usr/bin/env python3
"""Build 454 policy, idempotency and append-only evidence regression."""
import sqlite3
from pathlib import Path

root=Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript('''
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE orders(order_id INTEGER PRIMARY KEY,order_status TEXT,fulfillment_type TEXT,shipping_country TEXT,currency TEXT);
INSERT INTO users VALUES(1);
INSERT INTO orders VALUES(1,'processing','shipping','CA','CAD'),(2,'processing','shipping','US','CAD'),(3,'processing','pickup',NULL,'CAD'),(4,'cancelled','shipping','CA','CAD'),(5,'processing','shipping','CA','USD');
''')
db.executescript((root/'migrations/canonical/0049_release467_fulfillment_aftercare.sql').read_text())
insert='''INSERT INTO maker_order_fulfillment_evidence(order_id,event_kind,review_note,carrier,tracking_reference,receipt_reference,actor_user_id,request_key,payload_sha256) VALUES(?,?,?,?,?,?,?,?,?)'''
def record(key,order=1,kind='shipping_receipt',carrier='Canada Post',tracking='REAL-TRACKING',receipt='REAL-RECEIPT'):
 db.execute(insert,(order,kind,'Owner-reviewed evidence for an actual order.',carrier,tracking,receipt,1,'test-build454-'+key,'a'*64))
def rejects(name,fn):
 try:fn()
 except sqlite3.IntegrityError:return
 raise AssertionError(f'{name} incorrectly accepted')
record('canadian-shipment-1')
record('local-pickup-1',3,'pickup_receipt','','','PICKUP-RECEIPT')
rejects('US shipping',lambda:record('us-shipment-1',2))
rejects('cancelled order',lambda:record('cancelled-ship-1',4))
rejects('non-CAD shipping',lambda:record('usd-ship-1',5))
rejects('shipping without carrier',lambda:record('missing-carrier-1',carrier=''))
rejects('shipping without tracking',lambda:record('missing-tracking-1',tracking=''))
rejects('pickup without receipt',lambda:record('pickup-no-receipt-1',3,'pickup_receipt','','',''))
rejects('wrong mode for pickup',lambda:record('wrong-mode-pickup-1',1,'pickup_receipt','','','P'))
rejects('duplicate key',lambda:record('canadian-shipment-1'))
rejects('immutable receipt',lambda:db.execute('UPDATE maker_order_fulfillment_evidence SET review_note=? WHERE evidence_id=1',('overwrite',)))
rejects('no deletion',lambda:db.execute('DELETE FROM maker_order_fulfillment_evidence WHERE evidence_id=1'))
record('damage-hold-us-1',2,'damage_hold','','','')
assert db.execute('SELECT COUNT(*) FROM maker_order_fulfillment_evidence').fetchone()[0]==3
assert not db.execute('PRAGMA foreign_key_check').fetchall()
print('BUILD454_FULFILLMENT_SQL=GREEN; Canada-only source constraints, actual shipment/pickup references, immutable HOLD/aftercare evidence')
