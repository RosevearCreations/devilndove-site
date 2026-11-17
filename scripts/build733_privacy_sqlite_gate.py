#!/usr/bin/env python3
"""Build 733 original-source migration negative tests. Ephemeral SQLite, no fake live delivery."""
import sqlite3
from pathlib import Path
db=sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript("""
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE media_consent_records(consent_record_id INTEGER PRIMARY KEY, consent_status TEXT);
INSERT INTO users VALUES(1),(2),(3);
INSERT INTO media_consent_records VALUES(7,'revoked'),(8,'active');
""")
root=Path(__file__).resolve().parents[1]
for name in ('0052_release467_private_evidence_vault_withdrawal_retention.sql',
 '0053_release467_peer_enrollment_live_proof.sql',
 '0054_release467_withdrawal_retry_custody.sql',
 '0055_release467_privacy_sla_resolution_rotation_witness.sql'):
 db.executescript((root/'migrations/canonical'/name).read_text())
def deny(sql,args=()):
 try:
  db.execute(sql,args)
 except sqlite3.IntegrityError:
  return
 raise AssertionError('Expected D1-style constraint rejection: '+sql)
event='11111111-1111-4111-8111-111111111111'
db.execute("""INSERT INTO dnd_withdrawal_outbox_728
(event_id,consent_record_id,target_app,scope_hmac_sha256,request_nonce,created_by_user_id)
VALUES(?,7,'ai-data-platform',?,?,1)""",(event,'a'*64,'n'*32))
db.execute("""INSERT INTO dnd_withdrawal_acks_728
(event_id,peer_app,ack_envelope_sha256,peer_signature_verified,observed_live_response,created_by_user_id)
VALUES(?,'ai-data-platform',?,1,1,1)""",(event,'b'*64))
review='22222222-2222-4222-8222-222222222222'
deny("""INSERT INTO dnd_privacy_sla_reviews_733
(review_id,event_id,receipt_source,signed_receipt_sha256,requested_by_user_id,reason_code)
VALUES(?,?,'ADMIN_SIGNED_728',?,1,'SIGNED_ACK_REVIEW')""",
 ('33333333-3333-4333-8333-333333333333',event,'f'*64))
db.execute("""INSERT INTO dnd_privacy_sla_reviews_733
(review_id,event_id,receipt_source,signed_receipt_sha256,requested_by_user_id,reason_code)
VALUES(?,?,'ADMIN_SIGNED_728',?,1,'SIGNED_ACK_REVIEW')""",
(review,event,'b'*64))
deny("""INSERT INTO dnd_privacy_sla_resolutions_733
(resolution_id,review_id,event_id,approved_by_user_id,reason_code)
VALUES(?,?,?,1,'SIGNED_ACK_REVIEW')""",
 ('44444444-4444-4444-8444-444444444444',review,event))
db.execute("""INSERT INTO dnd_privacy_sla_resolutions_733
(resolution_id,review_id,event_id,approved_by_user_id,reason_code)
VALUES(?,?,?,2,'SIGNED_ACK_REVIEW')""",
 ('55555555-5555-4555-8555-555555555555',review,event))
deny("DELETE FROM dnd_privacy_sla_reviews_733")
deny("UPDATE dnd_privacy_sla_resolutions_733 SET approved_by_user_id=1")
deny("""INSERT INTO dnd_privacy_sla_resolutions_733
(resolution_id,review_id,event_id,approved_by_user_id,reason_code)
VALUES(?,?,?,3,'SIGNED_ACK_REVIEW')""",
('66666666-6666-4666-8666-666666666666',review,event))
evidence='77777777-7777-4777-8777-777777777777'
db.execute("""INSERT INTO dnd_evidence_vault_728
(evidence_id,tenant_scope_sha256,purpose,retention_days,request_key_sha256,created_by_user_id)
VALUES(?,?,'security_evidence',365,?,1)""",(evidence,'c'*64,'d'*64))
db.execute("""INSERT INTO dnd_evidence_versions_728
(evidence_id,version,key_id,iv_b64url,ciphertext_b64url,ciphertext_sha256,created_by_user_id)
VALUES(?,1,'key-old','a'*16,'b'*24,?,1)""",(evidence,'1'*64)) if False else None
db.execute("""INSERT INTO dnd_evidence_versions_728
(evidence_id,version,key_id,iv_b64url,ciphertext_b64url,ciphertext_sha256,created_by_user_id)
VALUES(?,1,'key-old',?,?,?,1)""",(evidence,'a'*16,'b'*24,'1'*64))
db.execute("""INSERT INTO dnd_evidence_versions_728
(evidence_id,version,key_id,iv_b64url,ciphertext_b64url,ciphertext_sha256,previous_version_sha256,created_by_user_id)
VALUES(?,2,'key-new',?,?,?,?,2)""",(evidence,'c'*16,'d'*24,'2'*64,'1'*64))
deny("""INSERT INTO dnd_privacy_rotation_witnesses_733
(witness_id,evidence_id,source_version,target_version,source_ciphertext_sha256,target_ciphertext_sha256,requested_by_user_id,witnessed_by_user_id,reason_code)
VALUES(?,?,1,2,?,?,1,1,'REVIEWED_CHAIN')""",
('88888888-8888-4888-8888-888888888888',evidence,'1'*64,'2'*64))
deny("""INSERT INTO dnd_privacy_rotation_witnesses_733
(witness_id,evidence_id,source_version,target_version,source_ciphertext_sha256,target_ciphertext_sha256,requested_by_user_id,witnessed_by_user_id,reason_code)
VALUES(?,?,1,2,?,?,1,2,'REVIEWED_CHAIN')""",
('99999999-9999-4999-8999-999999999999',evidence,'0'*64,'2'*64))
db.execute("""INSERT INTO dnd_privacy_rotation_witnesses_733
(witness_id,evidence_id,source_version,target_version,source_ciphertext_sha256,target_ciphertext_sha256,requested_by_user_id,witnessed_by_user_id,reason_code)
VALUES(?,?,1,2,?,?,1,2,'REVIEWED_CHAIN')""",
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',evidence,'1'*64,'2'*64))
deny('DELETE FROM dnd_privacy_rotation_witnesses_733')
deny("UPDATE dnd_privacy_rotation_witnesses_733 SET target_ciphertext_sha256=?",( 'f'*64,))
assert not db.execute('PRAGMA foreign_key_check').fetchall()
print('Build 733 original signed ACK, independent SLA resolution and key-lineage witness constraints: PASS')
