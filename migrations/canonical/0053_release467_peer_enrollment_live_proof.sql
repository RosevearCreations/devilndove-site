-- Build 729: durable verified original live peer challenge receipts only; no endpoint secrets or customer data.
CREATE TABLE IF NOT EXISTS dnd_peer_enrollment_proofs_729 (
 proof_id TEXT PRIMARY KEY CHECK(length(proof_id)=36),
 peer_app TEXT NOT NULL CHECK(peer_app IN ('ai-data-platform','rosevear-ai-hub','rosevear-comms-hub')),
 challenge_nonce TEXT NOT NULL CHECK(length(challenge_nonce)=32),
 pinned_public_key_sha256 TEXT NOT NULL CHECK(length(pinned_public_key_sha256)=64),
 original_enrollment_receipt_sha256 TEXT NOT NULL CHECK(length(original_enrollment_receipt_sha256)=64),
 signed_ack_sha256 TEXT NOT NULL CHECK(length(signed_ack_sha256)=64),
 observed_live_response INTEGER NOT NULL CHECK(observed_live_response=1),
 signature_verified INTEGER NOT NULL CHECK(signature_verified=1),
 verified_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(peer_app,challenge_nonce)
);
CREATE INDEX IF NOT EXISTS idx_dnd_peer_enrollment_proofs_729 ON dnd_peer_enrollment_proofs_729(peer_app,created_at);
CREATE TRIGGER IF NOT EXISTS trg_dnd_peer_enrollment_no_update_729 BEFORE UPDATE ON dnd_peer_enrollment_proofs_729
 BEGIN SELECT RAISE(ABORT,'immutable_live_peer_enrollment_proof'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_peer_enrollment_no_delete_729 BEFORE DELETE ON dnd_peer_enrollment_proofs_729
 BEGIN SELECT RAISE(ABORT,'immutable_live_peer_enrollment_proof'); END;
