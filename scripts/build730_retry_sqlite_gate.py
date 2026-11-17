#!/usr/bin/env python3
"""Build 730: real ephemeral SQLite constraints, not live D1 approval."""
import sqlite3
from pathlib import Path
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE media_consent_records(consent_record_id INTEGER PRIMARY KEY);
INSERT INTO users VALUES(1),(2);
INSERT INTO media_consent_records VALUES(4);
""")
root=Path(__file__).resolve().parents[1]
db.executescript((root/"migrations/canonical/0052_release467_private_evidence_vault_withdrawal_retention.sql").read_text())
db.executescript((root/"migrations/canonical/0054_release467_withdrawal_retry_custody.sql").read_text())
eid="11111111-1111-4111-8111-111111111111"
db.execute("""INSERT INTO dnd_withdrawal_outbox_728
(event_id,consent_record_id,target_app,scope_hmac_sha256,request_nonce,created_by_user_id)
VALUES(?,?,?,?,?,?)""",(eid,4,"ai-data-platform","a"*64,"b"*32,1))
db.execute("INSERT INTO dnd_withdrawal_retry_state_730(event_id) VALUES(?)",(eid,))
db.execute("""UPDATE dnd_withdrawal_retry_state_730 SET
 state='LEASED',lease_token=?,lease_expires_at=datetime('now','+2 minutes'),
 updated_at=CURRENT_TIMESTAMP WHERE event_id=? AND state='READY' AND attempt_count<6""",
 ("22222222-2222-4222-8222-222222222222",eid))
assert db.execute("SELECT state FROM dnd_withdrawal_retry_state_730").fetchone()[0]=="LEASED"
reject("""INSERT INTO dnd_withdrawal_attempts_730\n (attempt_id,event_id,lease_token,attempt_number,outcome)\n VALUES(?,?,?,?,?)""",("77777777-7777-4777-8777-777777777777",eid,\n "99999999-9999-4999-8999-999999999999",1,"UNAVAILABLE"))\ndb.execute("""INSERT INTO dnd_withdrawal_attempts_730
 (attempt_id,event_id,lease_token,attempt_number,outcome)
 VALUES(?,?,?,?,?)""",("33333333-3333-4333-8333-333333333333",eid,
 "22222222-2222-4222-8222-222222222222",1,"UNAVAILABLE"))
def reject(sql,args=()):
 try:
  db.execute(sql,args)
 except sqlite3.IntegrityError:
  return
 raise AssertionError("Expected SQLite schema denial: "+sql)
reject("UPDATE dnd_withdrawal_attempts_730 SET outcome='SIGNED_ACK_VERIFIED'")
reject("DELETE FROM dnd_withdrawal_attempts_730")
reject("UPDATE dnd_withdrawal_retry_state_730 SET state='DEAD_LETTER' WHERE event_id=?",(eid,))
reject("""INSERT INTO dnd_dead_letter_recovery_730(recovery_id,event_id,decision,requested_by_user_id,approved_by_user_id,reason_code)
VALUES(?,?, 'REQUEUE_REQUESTED',1,1,'OWNER_CONFIRM')""",("44444444-4444-4444-8444-444444444444",eid))
reject("""INSERT INTO dnd_dead_letter_recovery_730(recovery_id,event_id,decision,requested_by_user_id,reason_code)
VALUES(?,?,'REQUEUE_REQUESTED',1,'OWNER_CONFIRM')""",("55555555-5555-4555-8555-555555555555",eid))
db.execute("""INSERT INTO dnd_dead_letter_recovery_730(recovery_id,event_id,decision,requested_by_user_id,approved_by_user_id,reason_code)
VALUES(?,?,'REQUEUE_REQUESTED',1,2,'OWNER_CONFIRM')""",("66666666-6666-4666-8666-666666666666",eid))
reject("DELETE FROM dnd_dead_letter_recovery_730")
assert db.execute("PRAGMA foreign_key_check").fetchall()==[]
print("Build 730 D1 retry lease, immutable attempts, two-person dead-letter evidence: PASS")
