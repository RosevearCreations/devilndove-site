#!/usr/bin/env python3
"""Release 467 Build 382 — request-scoped commission source and customer progress privacy."""
from pathlib import Path
import sqlite3,subprocess,json,sys
ROOT=Path(__file__).resolve().parents[1];fail=[]
def src(p):return (ROOT/p).read_text(encoding='utf-8')
def req(v,m):
 if not v:fail.append(m)
pointer=json.loads(src('current-development-authority.json'))
manifest=json.loads(src('migrations/canonical/manifest.json'))
req(int(pointer.get('build',0))>=382,'current release pointer')
req(len(manifest['migrations'])>=34 and manifest['migrations'][33]['version']==34,'canonical version 34')
req(manifest['migrations'][33]['file']=='0034_release467_commission_customer_lifecycle.sql','migration identity')
api=src('functions/api/admin/commission-workbench.js');public=src('functions/api/commission-progress.js')
order=src('functions/api/custom-request-order.js')
for k in ('getAdminUserFromRequest','Origin','auditAdminAction','eventGuard','custom_request_quote_drafts','custom_request_quote_revisions',
          'custom_request_payment_request_drafts','custom_request_proof_versions','custom_request_job_drafts','creative_project_manufacturing_lifecycles',
          'commission_workbench' if False else 'custom_request_commission_events','activeOrderLink','actualEvidence','COMMISSION_GUARD_REJECTED'):
 req(k in api,'commission API '+k)
for k in ('order_','custom_request_order_status_links','customer_visible=1','progress_stage','public_progress_message','Cache-Control'):
 req(k in public,'customer-only privacy gate '+k)
req('commission_progress:commissionProgress?' in order,'canonical private order payload adds approved progress')
for k in ('internal_note','email','actor_user_id','source_payment_request_draft_id'):
 req(k not in public,'private field appeared in customer progress route: '+k)
for f in ('functions/api/admin/commission-workbench.js','functions/api/commission-progress.js',
 'functions/api/admin/_lib/commissionRules.js','functions/api/custom-request-order.js','public/js/admin-commission-workbench.js'):
 p=subprocess.run(['node','--check',str(ROOT/f)],capture_output=True,text=True)
 req(p.returncode==0,'JS parse '+f+': '+p.stderr[-300:])
p=subprocess.run(['node','--test','scripts/release467_build382_rules.test.mjs'],cwd=ROOT,capture_output=True,text=True)
req(p.returncode==0,'Source rules '+p.stdout[-450:]+p.stderr[-200:])
db=sqlite3.connect(':memory:');db.execute('PRAGMA foreign_keys=ON')
db.executescript("""
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE custom_requests(custom_request_id INTEGER PRIMARY KEY);
CREATE TABLE custom_request_quote_drafts(custom_request_quote_draft_id INTEGER PRIMARY KEY,custom_request_id INTEGER);
CREATE TABLE custom_request_quote_revisions(custom_request_quote_revision_id INTEGER PRIMARY KEY,custom_request_id INTEGER,quote_draft_id INTEGER);
CREATE TABLE custom_request_payment_request_drafts(custom_request_payment_request_draft_id INTEGER PRIMARY KEY,custom_request_id INTEGER);
CREATE TABLE custom_request_proof_versions(custom_request_proof_version_id INTEGER PRIMARY KEY,custom_request_id INTEGER,proof_status TEXT);
CREATE TABLE custom_request_job_drafts(custom_request_job_draft_id INTEGER PRIMARY KEY,custom_request_id INTEGER);
CREATE TABLE creative_work_projects(creative_work_project_id INTEGER PRIMARY KEY);
CREATE TABLE creative_project_manufacturing_lifecycles(creative_project_manufacturing_lifecycle_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,custom_request_id INTEGER);
CREATE TABLE custom_request_order_status_links(custom_request_order_status_link_id INTEGER PRIMARY KEY,custom_request_id INTEGER,link_status TEXT,voided_at TEXT,expired_at TEXT);
INSERT INTO users VALUES(7);
INSERT INTO custom_requests VALUES(1),(2);
INSERT INTO custom_request_quote_drafts VALUES(21,1),(22,2);
INSERT INTO custom_request_quote_revisions VALUES(31,1,21),(32,2,22);
INSERT INTO custom_request_payment_request_drafts VALUES(41,1),(42,2);
INSERT INTO custom_request_proof_versions VALUES(51,1,'approved'),(52,2,'sent');
INSERT INTO custom_request_job_drafts VALUES(61,1),(62,2);
INSERT INTO creative_work_projects VALUES(71),(72);
INSERT INTO creative_project_manufacturing_lifecycles VALUES(81,71,1),(82,72,2);
""")
try:
 db.executescript(src('migrations/canonical/0034_release467_commission_customer_lifecycle.sql'))
 def event(k,request_id=1,quote=None,revision=None,payment=None,proof=None,job=None,project=None,stage=None,visible=0,msg=None,key='safe_idempotent_key_381'):
  db.execute("""INSERT INTO custom_request_commission_events(
   custom_request_id,event_kind,source_quote_draft_id,source_quote_revision_id,source_payment_request_draft_id,
   source_proof_version_id,source_job_draft_id,source_creative_project_id,progress_stage,customer_visible,public_progress_message,
   internal_note,actor_user_id,request_key) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
   (request_id,k,quote,revision,payment,proof,job,project,stage,visible,msg,'Reviewed actual linked request evidence',7,key))
 event('quote_review',quote=21,key='quote_source_382_123')
 try:event('quote_review',quote=22,key='foreign_quote_382_123');fail.append('Cross-request quote accepted')
 except sqlite3.IntegrityError:pass
 try:event('revision_review',revision=32,key='foreign_revision_382_123');fail.append('Cross-request revision accepted')
 except sqlite3.IntegrityError:pass
 try:event('deposit_request_review',payment=42,key='foreign_deposit_382_123');fail.append('Cross-request deposit accepted')
 except sqlite3.IntegrityError:pass
 try:event('customer_proof_review',proof=52,key='foreign_proof_382_123');fail.append('Cross-request proof accepted')
 except sqlite3.IntegrityError:pass
 try:event('handoff_review',job=62,key='foreign_job_382_123');fail.append('Cross-request job accepted')
 except sqlite3.IntegrityError:pass
 try:event('handoff_review',project=72,key='foreign_project_382_123');fail.append('Cross-request project accepted')
 except sqlite3.IntegrityError:pass
 try:event('progress_approval',stage='design_review',visible=1,msg='Your artwork is under review.',key='missing_order_link_382');fail.append('Customer progress without existing order token accepted')
 except sqlite3.IntegrityError:pass
 db.execute("INSERT INTO custom_request_order_status_links VALUES(91,1,'active',NULL,NULL)")
 event('progress_approval',stage='design_review',visible=1,msg='Your artwork is under review.',key='public_review_382_123')
 try:event('progress_approval',stage='design_review',visible=1,msg='Your artwork is under review.',key='public_review_382_123');fail.append('Duplicate request key accepted')
 except sqlite3.IntegrityError:pass
 try:db.execute("UPDATE custom_request_commission_events SET public_progress_message='modified' WHERE request_key='public_review_382_123'");fail.append('Immutable history modified')
 except sqlite3.IntegrityError:pass
 try:db.execute("DELETE FROM custom_request_commission_events WHERE request_key='public_review_382_123'");fail.append('Immutable history deleted')
 except sqlite3.IntegrityError:pass
 req(db.execute('PRAGMA foreign_key_check').fetchall()==[],'FK integrity')
except Exception as e:fail.append('SQLite '+str(e))
print('RELEASE467_BUILD382_REGRESSION='+('FAIL' if fail else 'GREEN'))
for e in fail:print('-',e)
sys.exit(bool(fail))
