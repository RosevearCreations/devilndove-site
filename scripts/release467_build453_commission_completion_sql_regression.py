#!/usr/bin/env python3
"""Build 453: customer-approved change, estimated cost impact, safe maker handoff."""
import sqlite3
from pathlib import Path

root=Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript('''
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE custom_requests(custom_request_id INTEGER PRIMARY KEY);
CREATE TABLE custom_request_quote_revisions(custom_request_quote_revision_id INTEGER PRIMARY KEY,custom_request_id INTEGER,created_at TEXT);
CREATE TABLE custom_request_proof_versions(custom_request_proof_version_id INTEGER PRIMARY KEY,custom_request_id INTEGER,version_number INTEGER,proof_status TEXT,approved_at TEXT,internal_production_approval_required INTEGER,internal_production_approval_status TEXT);
CREATE TABLE creative_project_manufacturing_lifecycles(creative_work_project_id INTEGER,custom_request_id INTEGER);
CREATE TABLE maker_project_cost_reviews(maker_project_cost_review_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,scenario_kind TEXT);
CREATE TABLE maker_traveler_runs(maker_traveler_run_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER);
CREATE TABLE maker_traveler_run_steps(maker_traveler_run_step_id INTEGER PRIMARY KEY,maker_traveler_run_id INTEGER);
CREATE TABLE maker_traveler_step_events(maker_traveler_step_event_id INTEGER PRIMARY KEY,maker_traveler_run_step_id INTEGER,event_kind TEXT);
CREATE TABLE maker_quality_attempts(maker_quality_attempt_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER);
CREATE TABLE maker_quality_release_reviews(maker_quality_release_review_id INTEGER PRIMARY KEY,maker_quality_attempt_id INTEGER,decision TEXT);
CREATE TABLE maker_finished_pieces(maker_finished_piece_id INTEGER PRIMARY KEY,maker_quality_attempt_id INTEGER);
CREATE TABLE custom_request_order_status_links(custom_request_order_status_link_id INTEGER PRIMARY KEY,custom_request_id INTEGER,link_status TEXT,voided_at TEXT,expired_at TEXT);
CREATE TABLE custom_request_job_drafts(custom_request_job_draft_id INTEGER PRIMARY KEY,custom_request_id INTEGER);
CREATE TABLE products(product_id INTEGER PRIMARY KEY,inventory_quantity INTEGER);
INSERT INTO users VALUES(1);
INSERT INTO custom_requests VALUES(10),(20);
INSERT INTO custom_request_quote_revisions VALUES(101,10,'2026-10-21'),(201,20,'2026-10-21');
INSERT INTO custom_request_proof_versions VALUES(301,10,1,'approved','2026-10-22',0,'not_required'),(302,20,1,'approved','2026-10-22',0,'not_required');
INSERT INTO creative_project_manufacturing_lifecycles VALUES(1000,10),(2000,20);
INSERT INTO maker_project_cost_reviews VALUES(401,1000,'commission'),(402,2000,'commission'),(403,1000,'private_learning');
INSERT INTO maker_traveler_runs VALUES(501,1000),(502,2000);
INSERT INTO maker_traveler_run_steps VALUES(601,501),(602,501),(603,502);
INSERT INTO maker_traveler_step_events VALUES(701,601,'complete'),(702,602,'hold'),(703,603,'complete');
INSERT INTO maker_quality_attempts VALUES(801,1000),(802,2000);
INSERT INTO maker_quality_release_reviews VALUES(901,801,'approved_for_sale'),(902,802,'hold');
INSERT INTO maker_finished_pieces VALUES(1001,801),(1002,802);
INSERT INTO custom_request_job_drafts VALUES(1101,10);
INSERT INTO custom_request_order_status_links VALUES(1201,10,'active',NULL,NULL),(1202,20,'active',NULL,NULL);
INSERT INTO products VALUES(1,5);
''')
db.executescript((root/'migrations/canonical/0048_release467_commission_completion_handoff.sql').read_text())
base_stock=db.execute('SELECT * FROM products').fetchall()
sha='a'*64
insert='''INSERT INTO maker_commission_completion_reviews(custom_request_id,decision,source_quote_revision_id,source_proof_version_id,
source_cost_review_id,source_traveler_run_id,source_finished_piece_id,source_order_status_link_id,
estimated_change_cost_delta_cents,cost_impact_basis,review_note,actor_user_id,request_key,payload_sha256)
VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)'''
def record(k,decision,request=10,revision=None,proof=None,cost=None,traveler=None,piece=None,order=None,delta=None,basis='not_established'):
    db.execute(insert,(request,decision,revision,proof,cost,traveler,piece,order,delta,basis,'I verified original commission source records.',1,'test-build453-'+k,sha))
def reject(label,func):
    try:func()
    except sqlite3.IntegrityError:return
    raise AssertionError(label+' accepted unsupported evidence')

reject('cross-request quote revision',lambda:record('wrong-quote','approved_change_review',revision=201,proof=301,cost=401,delta=500,basis='reviewed_estimate'))
reject('missing reviewed estimated impact',lambda:record('missing-impact','approved_change_review',revision=101,proof=301,cost=401))
reject('unrelated cost review',lambda:record('wrong-cost','approved_change_review',revision=101,proof=301,cost=402,delta=500,basis='reviewed_estimate'))
reject('noncommission cost',lambda:record('wrong-scenario','approved_change_review',revision=101,proof=301,cost=403,delta=500,basis='reviewed_estimate'))
reject('cross-request proof',lambda:record('wrong-proof','approved_change_review',revision=101,proof=302,cost=401,delta=500,basis='reviewed_estimate'))
record('approved-change','approved_change_review',revision=101,proof=301,cost=401,delta=1500,basis='reviewed_estimate')
reject('unfinished latest traveler step',lambda:record('premature-handoff','maker_handoff_ready',proof=301,traveler=501,piece=1001,order=1201))
db.execute("INSERT INTO maker_traveler_step_events VALUES(704,602,'complete')")
record('actual-handoff','maker_handoff_ready',proof=301,traveler=501,piece=1001,order=1201)
reject('cross-request traveler',lambda:record('wrong-traveler','maker_handoff_ready',proof=301,traveler=502,piece=1001))
reject('cross-request finished piece',lambda:record('wrong-piece','maker_handoff_ready',proof=301,traveler=501,piece=1002))
reject('cross-request order link',lambda:record('wrong-link','delivery_followup_hold',order=1202))
reject('duplicate idempotency key',lambda:record('approved-change','delivery_followup_hold'))
reject('immutable operator decision',lambda:db.execute("UPDATE maker_commission_completion_reviews SET review_note='rewritten' WHERE request_key='test-build453-actual-handoff'"))
reject('cannot delete accepted review',lambda:db.execute("DELETE FROM maker_commission_completion_reviews WHERE request_key='test-build453-actual-handoff'"))
db.execute("INSERT INTO custom_request_proof_versions VALUES(303,10,2,'changes_requested',NULL,0,'not_required')")
reject('older approval invalid when newer proof needs changes',lambda:record('stale-proof','approved_change_review',revision=101,proof=301,cost=401,delta=100,basis='reviewed_estimate'))
record('delivery-hold','delivery_followup_hold',order=1201)
assert db.execute('SELECT * FROM products').fetchall()==base_stock
assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
print('BUILD453_COMMISSION_COMPLETION_SQL=GREEN; real customer approval after changed quote, source-linked estimate, finished QA/traveler handoff, private delivery HOLD, immutable evidence, zero stock mutation')
