#!/usr/bin/env python3
"""Build 741 original canonical SQL: a signed Admin OR Worker ACK bars requeue."""
import sqlite3
import uuid
from pathlib import Path
root=Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:',isolation_level=None)
db.execute('PRAGMA foreign_keys=ON')
db.executescript("""CREATE TABLE users(user_id INTEGER PRIMARY KEY);
 CREATE TABLE media_consent_records(
   consent_record_id INTEGER PRIMARY KEY,consent_status TEXT NOT NULL);
 INSERT INTO users VALUES(1),(2);
 INSERT INTO media_consent_records VALUES(1,'revoked'),(2,'blocked'),(3,'revoked'),(4,'active');
""")
for name in ('0052_release467_private_evidence_vault_withdrawal_retention.sql',
 '0054_release467_withdrawal_retry_custody.sql',
 '0055_release467_privacy_sla_resolution_rotation_witness.sql',
 '0058_release467_signed_withdrawal_retry_ack_guard.sql'):
 db.executescript((root/'migrations/canonical'/name).read_text())
eid=[str(uuid.uuid4()) for _ in range(4)]
for i,event in enumerate(eid):
 db.execute("""INSERT INTO dnd_withdrawal_outbox_728
 (event_id,consent_record_id,target_app,scope_hmac_sha256,request_nonce,created_by_user_id)
 VALUES(?,?,?,?,?,1)""",(event,i+1,'ai-data-platform','f'*64,f'{i+1:032x}'))
 db.execute('INSERT INTO dnd_withdrawal_retry_state_730(event_id) VALUES(?)',(event,))
 db.execute("""UPDATE dnd_withdrawal_retry_state_730
 SET state='DEAD_LETTER',attempt_count=6 WHERE event_id=?""",(event,))
def review(event,i=1,cycle=1):
 rev=str(uuid.uuid4())
 db.execute("""INSERT INTO dnd_dead_letter_recovery_730
 (recovery_id,event_id,decision,target_cycle,requested_by_user_id,reason_code)
 VALUES(?,?,'REVIEW_HOLD',?,?,'OWNER_REVIEW')""",(rev,event,cycle,i))
 return rev
def approve(event,rev,cycle=1):
 return db.execute("""INSERT INTO dnd_dead_letter_recovery_730
 (recovery_id,event_id,decision,target_cycle,original_review_id,
  requested_by_user_id,approved_by_user_id,reason_code)
 VALUES(?,?,'REQUEUE_REQUESTED',?,?,1,2,'OWNER_REVIEW')""",
 (str(uuid.uuid4()),event,cycle,rev))
def reject(fn,contains):
 try:fn()
 except sqlite3.IntegrityError as e:
  assert contains in str(e),str(e)
  return
 raise AssertionError('Unexpected acceptance of '+contains)
# Original administrator signed ACK.
db.execute("""INSERT INTO dnd_withdrawal_acks_728
 (event_id,peer_app,ack_envelope_sha256,peer_signature_verified,observed_live_response,created_by_user_id)
 VALUES(?,'ai-data-platform',?,1,1,1)""",(eid[0],'a'*64))
# Original verified Worker signed ACK (different original table).
db.execute("""INSERT INTO dnd_withdrawal_auto_acks_730
 (event_id,peer_app,ack_envelope_sha256,peer_signature_verified,observed_live_response,service_id)
 VALUES(?,'ai-data-platform',?,1,1,'original-worker-741')""",(eid[1],'b'*64))
for event in eid[:2]:
 rev=review(event)
 reject(lambda:approve(event,rev),'build741_ack_or_dead_letter_state_changed')
 assert db.execute("""SELECT state,attempt_count FROM dnd_withdrawal_retry_state_730
  WHERE event_id=?""",(event,)).fetchone()==('DEAD_LETTER',6)
 assert db.execute("""SELECT COUNT(*) FROM dnd_dead_letter_recovery_730
  WHERE event_id=? AND decision='REQUEUE_REQUESTED'""",(event,)).fetchone()[0]==0
# Original consent must still be withdrawn.
rev=review(eid[3])
reject(lambda:approve(eid[3],rev),'build741_ack_or_dead_letter_state_changed')
# No ACK: two distinct Admins, immutable approval, source state CAS.
rev=review(eid[2])
approve(eid[2],rev)
db.execute("""UPDATE dnd_withdrawal_retry_state_730 SET
 state='READY',retry_cycle=1,attempt_count=0,
 retry_after=datetime('now','+5 minutes')
 WHERE event_id=?""",(eid[2],))
assert db.execute('SELECT state,retry_cycle,attempt_count FROM dnd_withdrawal_retry_state_730 WHERE event_id=?',(eid[2],)).fetchone()==('READY',1,0)
reject(lambda:approve(eid[2],rev),'build741_ack_or_dead_letter_state_changed')
# Should not strip an ACK or alter past immutable receipts.
reject(lambda:db.execute('DELETE FROM dnd_withdrawal_auto_acks_730 WHERE event_id=?',(eid[1],)),'immutable_automatic_signed_ack')
assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
print('BUILD741 PASS: original Admin/Worker ACK conflict denies approvals, no phantom receipts, consent holds, valid distinct-Admin requeue, immutable originals')
