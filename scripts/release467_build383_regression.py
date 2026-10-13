#!/usr/bin/env python3
from pathlib import Path
import json,sqlite3,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];bad=[]
def source(p):return (ROOT/p).read_text(encoding='utf-8')
def check(x,label):
 if not x:bad.append(label)
p=json.loads(source('current-development-authority.json'));m=json.loads(source('migrations/canonical/manifest.json'))
check(p.get('build',0)>=383,'current build pointer');check(len(m['migrations'])>=35 and m['migrations'][34]['version']==35,'migration 35 registered')
api=source('functions/api/admin/cross-project-accounting.js')
for t in ('getAdminUserFromRequest','Origin','loadProfitabilityIntelligence','creative_work_order_events','creative_project_inventory_posts','creative_project_production_cost_evidence','payments','payment_refunds','creative_project_finance_review_events','accounting_posting:false','currencyWarning'):
 check(t in api,'source guard '+t)
for f in ('functions/api/admin/cross-project-accounting.js','functions/api/admin/_lib/projectFinanceEvidence.js','public/js/admin-cross-project-accounting.js'):
 c=subprocess.run(['node','--check',str(ROOT/f)],capture_output=True,text=True)
 check(c.returncode==0,'JavaScript syntax '+f+': '+c.stderr[-150:])
c=subprocess.run(['node','--test','scripts/release467_build383_math.test.mjs'],cwd=ROOT,capture_output=True,text=True)
check(c.returncode==0,'Conservative reconciliation arithmetic: '+c.stderr[-200:])
db=sqlite3.connect(':memory:');db.execute('PRAGMA foreign_keys=ON')
db.executescript("""
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE creative_work_projects(creative_work_project_id INTEGER PRIMARY KEY);
CREATE TABLE creative_project_profitability(creative_work_project_id INTEGER PRIMARY KEY);
CREATE TABLE creative_work_events(creative_work_event_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER);
CREATE TABLE creative_work_order_events(creative_work_order_event_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER);
CREATE TABLE creative_project_inventory_posts(creative_project_inventory_post_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER);
CREATE TABLE creative_project_production_cost_evidence(creative_project_production_cost_evidence_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER);
CREATE TABLE creative_project_manufacturing_lifecycles(creative_project_manufacturing_lifecycle_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,custom_request_id INTEGER);
CREATE TABLE custom_request_order_status_links(custom_request_order_status_link_id INTEGER PRIMARY KEY,custom_request_id INTEGER,order_id INTEGER);
INSERT INTO users VALUES(1); INSERT INTO creative_work_projects VALUES(1),(2);
INSERT INTO creative_project_profitability VALUES(1),(2);
INSERT INTO creative_work_events VALUES(11,1),(12,2);
INSERT INTO creative_work_order_events VALUES(21,1),(22,2);
INSERT INTO creative_project_inventory_posts VALUES(31,1),(32,2);
INSERT INTO creative_project_production_cost_evidence VALUES(41,1),(42,2);
INSERT INTO creative_project_manufacturing_lifecycles VALUES(51,1,101),(52,2,102);
INSERT INTO custom_request_order_status_links VALUES(61,101,701),(62,102,702);
""")
try:
 db.executescript(source('migrations/canonical/0035_release467_cross_project_finance_review.sql'))
 def insert(k,kind='creative_work_events',rid=11,result='source_verified'):
  db.execute("INSERT INTO creative_project_finance_review_events (creative_work_project_id,review_type,review_result,source_kind,source_record_id,evidence_note,actor_user_id,request_key) VALUES(1,'material_consumption',?,?,?,?,1,?)",
    (result,kind,rid,'Operator confirmed documented source evidence',k))
 insert('good_source_ref_383')
 for k,kind,id_,result in [
  ('bad_event_383','creative_work_events',12,'source_verified'),
  ('bad_labour_383','creative_work_order_events',22,'source_verified'),
  ('bad_stock_383','creative_project_inventory_posts',32,'source_verified'),
  ('bad_finance_383','creative_project_profitability',2,'source_verified'),
  ('bad_production_383','creative_project_production_cost_evidence',42,'source_verified'),
  ('bad_order_383','orders_payments_refunds',702,'source_verified'),
  ('unverified_source_383','operator_review',None,'source_verified'),
  ('missing_source_id_383','creative_work_events',None,'source_verified')]:
  try:insert(k,kind,id_,result);bad.append('invalid source accepted '+k)
  except sqlite3.IntegrityError:pass
 insert('valid_order_link_383','orders_payments_refunds',701)
 insert('valid_unverified_review_383','operator_review',None,'reviewed_with_caveat')
 try:insert('good_source_ref_383');bad.append('idempotency key reused')
 except sqlite3.IntegrityError:pass
 for op in ("UPDATE creative_project_finance_review_events SET review_result='source_verified' WHERE request_key='good_source_ref_383'","DELETE FROM creative_project_finance_review_events WHERE request_key='good_source_ref_383'"):
  try:db.execute(op);bad.append('immutable audit changed')
  except sqlite3.IntegrityError:pass
 check(not db.execute('PRAGMA foreign_key_check').fetchall(),'foreign key validity')
except Exception as e:bad.append('SQL tests '+str(e))
print('RELEASE467_BUILD383_REGRESSION='+('FAIL' if bad else 'GREEN'))
for e in bad:print('-',e)
sys.exit(bool(bad))
