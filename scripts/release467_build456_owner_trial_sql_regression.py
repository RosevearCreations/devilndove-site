#!/usr/bin/env python3
"""Build 456: local disposable SQLite checks; NEVER genuine owner acceptance."""
import sqlite3
from pathlib import Path

root=Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript('''
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE creative_work_projects(creative_work_project_id INTEGER PRIMARY KEY);
CREATE TABLE custom_requests(custom_request_id INTEGER PRIMARY KEY);
CREATE TABLE creative_work_events(creative_work_event_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,entry_status TEXT);
CREATE TABLE maker_design_file_revisions(maker_design_file_revision_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER);
CREATE TABLE maker_traveler_runs(maker_traveler_run_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER);
CREATE TABLE maker_quality_attempts(maker_quality_attempt_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER);
CREATE TABLE maker_project_cost_reviews(maker_project_cost_review_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER);
CREATE TABLE maker_media_story_revisions(maker_media_story_revision_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER);
CREATE TABLE custom_request_proof_versions(custom_request_proof_version_id INTEGER PRIMARY KEY,custom_request_id INTEGER,proof_status TEXT,approved_at TEXT,internal_production_approval_required INTEGER,internal_production_approval_status TEXT);
CREATE TABLE maker_commission_completion_reviews(maker_commission_completion_review_id INTEGER PRIMARY KEY,custom_request_id INTEGER,decision TEXT);
INSERT INTO users VALUES(7);
INSERT INTO creative_work_projects VALUES(1),(2);
INSERT INTO custom_requests VALUES(11),(12);
INSERT INTO creative_work_events VALUES(31,1,'active'),(32,2,'active'),(33,1,'voided');
INSERT INTO maker_design_file_revisions VALUES(41,1);
INSERT INTO maker_traveler_runs VALUES(51,1);
INSERT INTO maker_quality_attempts VALUES(61,1),(62,2);
INSERT INTO maker_project_cost_reviews VALUES(71,1);
INSERT INTO maker_media_story_revisions VALUES(81,1);
INSERT INTO custom_request_proof_versions VALUES(91,11,'approved','2026-10-01',1,'approved'),(92,12,'approved','2026-10-01',0,'not_required'),(93,11,'draft',NULL,0,'not_required');
INSERT INTO maker_commission_completion_reviews VALUES(101,11,'approved_change_review'),(102,11,'maker_handoff_ready'),(103,11,'delivery_followup_hold');
''')
db.executescript((root/'migrations/canonical/0050_release467_owner_maker_trial_intake.sql').read_text())

insert='''INSERT INTO maker_owner_trial_reviews
 (scenario_key,checkpoint_key,creative_work_project_id,custom_request_id,source_kind,source_id,decision,personally_observed,review_note,recorded_by_user_id,request_key,payload_sha256)
 VALUES(?,?,?,?,?,?,?,?,?,?,?,?)'''
counter=0
def receipt(scenario='jewellery_metal',check='source_identity',project=1,request=None,
            kind='project',source=1,decision='accepted',observed=1,note='Owner inspected the actual existing source receipt.',key=None):
 global counter
 counter+=1
 db.execute(insert,(scenario,check,project,request,kind,source,decision,observed,note,7,key or f'test456-owner-review-{counter:04d}','a'*64))
def rejects(label,callback):
 try:callback()
 except sqlite3.IntegrityError:return
 raise AssertionError(f'{label} incorrectly allowed')

receipt()
receipt(check='actual_materials',kind='event',source=31)
receipt('digital_fabrication','design_provenance',kind='design_revision',source=41)
receipt('resin_clay','physical_safety',kind='quality_attempt',source=61)
receipt('private_therapeutic','privacy_control',kind='project',source=1)
receipt('failed_salvage','media_rights',kind='media_story',source=81)
receipt('custom_commission','source_identity',None,11,'custom_request',11)
receipt('custom_commission','customer_approval',None,11,'customer_proof',91)
receipt('custom_commission','cost_handoff',None,11,'commission_review',101)
receipt('custom_commission','process_quality',None,11,'commission_review',102)
receipt('custom_commission','delivery_hold',None,11,'commission_review',103)
receipt('jewellery_metal','media_rights',1,None,'none',None,'hold',0,'No real media consent available; HOLD review.')
rejects('no personal attestation',lambda:receipt(observed=0))
rejects('accept without source',lambda:receipt(kind='none',source=None))
rejects('missing project',lambda:receipt(project=999))
rejects('wrong project event',lambda:receipt(check='actual_materials',kind='event',source=32))
rejects('voided event',lambda:receipt(check='actual_materials',kind='event',source=33))
rejects('wrong project quality',lambda:receipt(check='process_quality',kind='quality_attempt',source=62))
rejects('wrong commission proof',lambda:receipt('custom_commission','customer_approval',None,11,'customer_proof',92))
rejects('draft customer proof',lambda:receipt('custom_commission','customer_approval',None,11,'customer_proof',93))
rejects('wrong commission-stage source',lambda:receipt('custom_commission','process_quality',None,11,'commission_review',101))
rejects('mix request and project',lambda:receipt('custom_commission','source_identity',1,11,'custom_request',11))
rejects('commission wrong source kind',lambda:receipt('custom_commission','process_quality',None,11,'quality_attempt',61))
rejects('inapplicable checkpoint',lambda:receipt('private_therapeutic','customer_approval',kind='customer_proof',source=91))
rejects('unapproved checkpoint source kind',lambda:receipt(check='physical_safety',kind='event',source=31))
rejects('too short note',lambda:receipt(note='too short'))
rejects('bad decision',lambda:receipt(decision='certified'))
rejects('immutable historical decision',lambda:db.execute("UPDATE maker_owner_trial_reviews SET decision='hold' WHERE maker_owner_trial_review_id=1"))
rejects('cannot delete old receipt',lambda:db.execute('DELETE FROM maker_owner_trial_reviews WHERE maker_owner_trial_review_id=1'))
db.execute(insert,('jewellery_metal','source_identity',1,None,'none',None,'hold',0,
 'Supersedes a former accepted review after source recheck.',7,'test456-superseding-hold','b'*64))
assert db.execute('SELECT COUNT(*) FROM maker_owner_trial_reviews').fetchone()[0]==13
assert not db.execute('PRAGMA foreign_key_check').fetchall()
print('BUILD456_OWNER_TRIAL_SQL=GREEN; scoped real-source receipts, owner attestation, append-only HOLD override, no business mutations')
