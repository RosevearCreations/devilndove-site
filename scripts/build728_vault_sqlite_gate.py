#!/usr/bin/env python3
"""Build 728: SQLite D1-forward-only constraints, immutable vault and supervised purge."""
import sqlite3,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/"migrations/canonical/manifest.json").read_text())
file=root/"migrations/canonical/0052_release467_private_evidence_vault_withdrawal_retention.sql"
assert manifest["migrations"][51]["version"]==52
assert manifest["migrations"][51]["file"]==file.name
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("CREATE TABLE users(user_id INTEGER PRIMARY KEY); CREATE TABLE media_consent_records(consent_record_id INTEGER PRIMARY KEY,consent_status TEXT);")
db.executemany("INSERT INTO users(user_id) VALUES (?)",[(1,),(2,),(3,)])
db.execute("INSERT INTO media_consent_records(consent_record_id,consent_status) VALUES (55,'revoked')")
db.executescript(file.read_text())
def denial(fn,name):
 try:fn()
 except sqlite3.IntegrityError:return
 raise AssertionError("D1 must deny: "+name)
eid="11111111-1111-4111-8111-111111111111"
review="22222222-2222-4222-8222-222222222222"
db.execute("""INSERT INTO dnd_evidence_vault_728
 (evidence_id,tenant_scope_sha256,purpose,retention_days,legal_hold,request_key_sha256,created_by_user_id,created_at)
 VALUES(?,?,'security_evidence',30,0,?,1,datetime('now','-80 days'))""",(eid,"a"*64,"b"*64))
db.execute("""INSERT INTO dnd_evidence_versions_728
 (evidence_id,version,key_id,iv_b64url,ciphertext_b64url,ciphertext_sha256,created_by_user_id)
 VALUES(?,1,'k728old',?,?,?,1)""",(eid,'A'*16,'B'*44,"c"*64))
denial(lambda:db.execute("UPDATE dnd_evidence_vault_728 SET legal_hold=1"),"vault identity immutable")
denial(lambda:db.execute("UPDATE dnd_evidence_versions_728 SET key_id='k728new'"),"ciphertext append-only")
denial(lambda:db.execute("DELETE FROM dnd_evidence_versions_728"),"no unapproved ciphertext deletion")
db.execute("""INSERT INTO dnd_evidence_versions_728
 (evidence_id,version,key_id,iv_b64url,ciphertext_b64url,ciphertext_sha256,previous_version_sha256,created_by_user_id)
 VALUES(?,2,'k728new',?,?,?,?,1)""",(eid,'C'*16,'D'*44,"d"*64,"c"*64))
denial(lambda:db.execute("""INSERT INTO dnd_evidence_versions_728
 (evidence_id,version,key_id,iv_b64url,ciphertext_b64url,ciphertext_sha256,created_by_user_id)
 VALUES(?,2,'k728new',?,?,?,1)""",(eid,'C'*16,'D'*44,"d"*64)),"duplicate version")
db.execute("""INSERT INTO dnd_evidence_retention_reviews_728
 (review_id,evidence_id,source_ciphertext_sha256,requested_by_user_id)
 VALUES(?,?,?,1)""",(review,eid,"d"*64))
denial(lambda:db.execute("""UPDATE dnd_evidence_retention_reviews_728
 SET review_state='APPROVED',approved_by_user_id=1,approved_at=CURRENT_TIMESTAMP"""),"self approval")
denial(lambda:db.execute("""INSERT INTO dnd_evidence_purge_receipts_728(evidence_id,review_id,deleted_ciphertext_sha256,executed_by_user_id)
 VALUES(?,?,?,3)""",(eid,review,"d"*64)),"not approved")
db.execute("""UPDATE dnd_evidence_retention_reviews_728
 SET review_state='APPROVED',approved_by_user_id=2,approved_at=CURRENT_TIMESTAMP""")
denial(lambda:db.execute("""UPDATE dnd_evidence_retention_reviews_728 SET approved_by_user_id=3"""),"approved immutable")
denial(lambda:db.execute("""INSERT INTO dnd_evidence_purge_receipts_728(evidence_id,review_id,deleted_ciphertext_sha256,executed_by_user_id)
 VALUES(?,?,?,3)""",(eid,review,"e"*64)),"wrong digest")
denial(lambda:db.execute("""INSERT INTO dnd_evidence_purge_receipts_728(evidence_id,review_id,deleted_ciphertext_sha256,executed_by_user_id)
 VALUES(?,?,?,1)""",(eid,review,"d"*64)),"requester cannot execute purge")
denial(lambda:db.execute("""INSERT INTO dnd_evidence_purge_receipts_728(evidence_id,review_id,deleted_ciphertext_sha256,executed_by_user_id)
 VALUES(?,?,?,2)""",(eid,review,"d"*64)),"approver cannot execute purge")
db.execute("""INSERT INTO dnd_evidence_purge_receipts_728(evidence_id,review_id,deleted_ciphertext_sha256,executed_by_user_id)
 VALUES(?,?,?,3)""",(eid,review,"d"*64))
db.execute("DELETE FROM dnd_evidence_versions_728 WHERE evidence_id=?",(eid,))
assert db.execute("SELECT COUNT(*) FROM dnd_evidence_versions_728").fetchone()[0]==0
assert db.execute("SELECT COUNT(*) FROM dnd_evidence_purge_receipts_728").fetchone()[0]==1
denial(lambda:db.execute("DELETE FROM dnd_evidence_purge_receipts_728"),"purge receipts immutable")
denial(lambda:db.execute("DELETE FROM dnd_evidence_vault_728"),"original metadata retained")
outbox="33333333-3333-4333-8333-333333333333"
db.execute("""INSERT INTO dnd_withdrawal_outbox_728
 (event_id,consent_record_id,target_app,scope_hmac_sha256,request_nonce,created_by_user_id)
 VALUES(?,55,'ai-data-platform',?,?,1)""",(outbox,"e"*64,'f'*32))
denial(lambda:db.execute("""INSERT INTO dnd_withdrawal_outbox_728
 (event_id,consent_record_id,target_app,scope_hmac_sha256,request_nonce,created_by_user_id)
 VALUES('44444444-4444-4444-8444-444444444444',55,'ai-data-platform',?,?,1)""",("e"*64,'g'*32)),"dedupe consent and receiver")
denial(lambda:db.execute("UPDATE dnd_withdrawal_outbox_728 SET target_app='rosevear-ai-hub'"),"outbox immutable")
denial(lambda:db.execute("""INSERT INTO dnd_withdrawal_acks_728
 (event_id,peer_app,ack_envelope_sha256,peer_signature_verified,observed_live_response,created_by_user_id)
 VALUES(?,'ai-data-platform',?,0,1,1)""",(outbox,"e"*64)),"unsigned ACK denied")
denial(lambda:db.execute("""INSERT INTO dnd_withdrawal_acks_728
 (event_id,peer_app,ack_envelope_sha256,peer_signature_verified,observed_live_response,created_by_user_id)
 VALUES(?,'rosevear-ai-hub',?,1,1,1)""",(outbox,"e"*64)),"ACK receiver identity mismatch")
db.execute("""INSERT INTO dnd_withdrawal_acks_728
 (event_id,peer_app,ack_envelope_sha256,peer_signature_verified,observed_live_response,created_by_user_id)
 VALUES(?,'ai-data-platform',?,1,1,1)""",(outbox,"e"*64))
denial(lambda:db.execute("UPDATE dnd_withdrawal_acks_728 SET observed_live_response=0"),"ACK immutable")
assert db.execute("PRAGMA foreign_key_check").fetchall()==[]
print("Build728 D1 migration 0052 encrypted versions, dedupe withdrawal, 3-person retention and immutable receipts: PASS")
