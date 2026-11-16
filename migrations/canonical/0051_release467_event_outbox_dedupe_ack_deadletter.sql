-- Release 467 Build 726: local source-only event outbox and independent
-- disposition review ledger. No peer transport, D1 peer writes or customer data.
CREATE TABLE IF NOT EXISTS dnd_event_outbox_726 (
 event_id TEXT PRIMARY KEY CHECK(length(event_id)=36),
 dedupe_sha256 TEXT NOT NULL UNIQUE CHECK(length(dedupe_sha256)=64),
 schema_id TEXT NOT NULL DEFAULT 'rosevear.dnd.event.v2' CHECK(schema_id='rosevear.dnd.event.v2'),
 protocol_major INTEGER NOT NULL DEFAULT 1 CHECK(protocol_major=1),
 protocol_minor INTEGER NOT NULL DEFAULT 1 CHECK(protocol_minor=1),
 event_type TEXT NOT NULL CHECK(event_type IN ('DND_HEALTH_EVIDENCE','DND_SECURITY_EVIDENCE')),
 source_app TEXT NOT NULL DEFAULT 'devilndove' CHECK(source_app='devilndove'),
 target_app TEXT NOT NULL CHECK(target_app IN ('ai-data-platform','rosevear-ai-hub','rosevear-comms-hub')),
 topology_id TEXT NOT NULL DEFAULT 'rosevear-master-shell-seven-apps.v1' CHECK(topology_id='rosevear-master-shell-seven-apps.v1'),
 source_main_sha TEXT NOT NULL CHECK(length(source_main_sha)=40),
 tenant_scope_sha256 TEXT NOT NULL CHECK(length(tenant_scope_sha256)=64),
 consent_scope_sha256 TEXT NOT NULL CHECK(length(consent_scope_sha256)=64),
 payload_sha256 TEXT NOT NULL DEFAULT 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' CHECK(payload_sha256='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
 creation_mode TEXT NOT NULL DEFAULT 'ADMIN_SOURCE_REVIEW_ONLY' CHECK(creation_mode='ADMIN_SOURCE_REVIEW_ONLY'),
 created_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dnd_event_outbox_target_726 ON dnd_event_outbox_726(target_app,event_id);
CREATE TABLE IF NOT EXISTS dnd_event_dispositions_726 (
 disposition_id INTEGER PRIMARY KEY AUTOINCREMENT,
 event_id TEXT NOT NULL REFERENCES dnd_event_outbox_726(event_id) ON DELETE RESTRICT,
 decision TEXT NOT NULL CHECK(decision IN ('LOCAL_DEAD_LETTER','SIGNED_ACK_REVIEW')),
 evidence_sha256 TEXT NOT NULL CHECK(length(evidence_sha256)=64),
 original_peer_signature_valid INTEGER NOT NULL DEFAULT 0 CHECK(original_peer_signature_valid IN (0,1)),
 source_origin_outside_verified INTEGER NOT NULL DEFAULT 0 CHECK(source_origin_outside_verified=0),
 note TEXT NOT NULL CHECK(length(trim(note)) BETWEEN 24 AND 400),
 created_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(event_id,decision),
 CHECK((decision='LOCAL_DEAD_LETTER' AND original_peer_signature_valid=0)
    OR (decision='SIGNED_ACK_REVIEW' AND original_peer_signature_valid=1))
);
CREATE INDEX IF NOT EXISTS idx_dnd_event_dispositions_review_726 ON dnd_event_dispositions_726(event_id,disposition_id);
CREATE TRIGGER IF NOT EXISTS trg_dnd_event_outbox_726_no_update BEFORE UPDATE ON dnd_event_outbox_726
 BEGIN SELECT RAISE(ABORT,'event_outbox_is_append_only'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_event_outbox_726_no_delete BEFORE DELETE ON dnd_event_outbox_726
 BEGIN SELECT RAISE(ABORT,'event_outbox_is_append_only'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_event_dispositions_726_no_update BEFORE UPDATE ON dnd_event_dispositions_726
 BEGIN SELECT RAISE(ABORT,'event_dispositions_are_append_only'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_event_dispositions_726_no_delete BEFORE DELETE ON dnd_event_dispositions_726
 BEGIN SELECT RAISE(ABORT,'event_dispositions_are_append_only'); END;
CREATE TRIGGER IF NOT EXISTS trg_dnd_event_dispositions_726_one_terminal BEFORE INSERT ON dnd_event_dispositions_726
 WHEN EXISTS (SELECT 1 FROM dnd_event_dispositions_726 r WHERE r.event_id=NEW.event_id)
 BEGIN SELECT RAISE(ABORT,'event_already_disposed_no_conflicting_ack_or_dlq'); END;
