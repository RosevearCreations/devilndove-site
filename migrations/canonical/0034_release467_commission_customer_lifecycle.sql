-- Release 467 Build 382: append-only staff commission lifecycle decisions, not a competing quote/payment system.
-- Customer intake, quote, proof, checkout, job and manufacturing/project records retain canonical ownership.
CREATE TABLE IF NOT EXISTS custom_request_commission_events (
 custom_request_commission_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
 custom_request_id INTEGER NOT NULL REFERENCES custom_requests(custom_request_id) ON DELETE RESTRICT,
 event_kind TEXT NOT NULL CHECK(event_kind IN ('intake_review','quote_review','revision_review','deposit_request_review','customer_proof_review','handoff_review','progress_approval')),
 source_quote_draft_id INTEGER REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE RESTRICT,
 source_quote_revision_id INTEGER REFERENCES custom_request_quote_revisions(custom_request_quote_revision_id) ON DELETE RESTRICT,
 source_payment_request_draft_id INTEGER REFERENCES custom_request_payment_request_drafts(custom_request_payment_request_draft_id) ON DELETE RESTRICT,
 source_proof_version_id INTEGER REFERENCES custom_request_proof_versions(custom_request_proof_version_id) ON DELETE RESTRICT,
 source_job_draft_id INTEGER REFERENCES custom_request_job_drafts(custom_request_job_draft_id) ON DELETE RESTRICT,
 source_creative_project_id INTEGER REFERENCES creative_work_projects(creative_work_project_id) ON DELETE RESTRICT,
 progress_stage TEXT CHECK(progress_stage IS NULL OR progress_stage IN
   ('request_received','design_review','quote_in_review','production_planning','production_in_progress','quality_review','fulfillment_preparation')),
 customer_visible INTEGER NOT NULL DEFAULT 0 CHECK(customer_visible IN (0,1)),
 public_progress_message TEXT CHECK(public_progress_message IS NULL OR length(public_progress_message)<=240),
 internal_note TEXT NOT NULL CHECK(length(trim(internal_note))>=12 AND length(internal_note)<=1200),
 actor_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(event_kind='progress_approval' OR (progress_stage IS NULL AND customer_visible=0 AND public_progress_message IS NULL)),
 CHECK(event_kind<>'progress_approval' OR
   (progress_stage IS NOT NULL AND customer_visible=1 AND length(trim(COALESCE(public_progress_message,'')))>=12))
);
CREATE INDEX IF NOT EXISTS idx_custom_commission_request_events ON custom_request_commission_events(custom_request_id,custom_request_commission_event_id DESC);
CREATE INDEX IF NOT EXISTS idx_custom_commission_public_progress ON custom_request_commission_events(custom_request_id,customer_visible,custom_request_commission_event_id DESC);
CREATE TRIGGER IF NOT EXISTS trg_custom_commission_ref_scope BEFORE INSERT ON custom_request_commission_events BEGIN
 SELECT RAISE(ABORT,'commission_quote_request_mismatch')
 WHERE NEW.source_quote_draft_id IS NOT NULL AND NOT EXISTS
 (SELECT 1 FROM custom_request_quote_drafts q WHERE q.custom_request_quote_draft_id=NEW.source_quote_draft_id AND q.custom_request_id=NEW.custom_request_id);
 SELECT RAISE(ABORT,'commission_revision_request_mismatch')
 WHERE NEW.source_quote_revision_id IS NOT NULL AND NOT EXISTS
 (SELECT 1 FROM custom_request_quote_revisions v WHERE v.custom_request_quote_revision_id=NEW.source_quote_revision_id AND v.custom_request_id=NEW.custom_request_id AND
   (NEW.source_quote_draft_id IS NULL OR v.quote_draft_id=NEW.source_quote_draft_id));
 SELECT RAISE(ABORT,'commission_payment_request_mismatch')
 WHERE NEW.source_payment_request_draft_id IS NOT NULL AND NOT EXISTS
 (SELECT 1 FROM custom_request_payment_request_drafts d WHERE d.custom_request_payment_request_draft_id=NEW.source_payment_request_draft_id AND d.custom_request_id=NEW.custom_request_id);
 SELECT RAISE(ABORT,'commission_proof_request_mismatch')
 WHERE NEW.source_proof_version_id IS NOT NULL AND NOT EXISTS
 (SELECT 1 FROM custom_request_proof_versions p WHERE p.custom_request_proof_version_id=NEW.source_proof_version_id AND p.custom_request_id=NEW.custom_request_id);
 SELECT RAISE(ABORT,'commission_job_request_mismatch')
 WHERE NEW.source_job_draft_id IS NOT NULL AND NOT EXISTS
 (SELECT 1 FROM custom_request_job_drafts j WHERE j.custom_request_job_draft_id=NEW.source_job_draft_id AND j.custom_request_id=NEW.custom_request_id);
 SELECT RAISE(ABORT,'commission_project_request_mismatch')
 WHERE NEW.source_creative_project_id IS NOT NULL AND NOT EXISTS
 (SELECT 1 FROM creative_project_manufacturing_lifecycles l WHERE l.creative_work_project_id=NEW.source_creative_project_id AND l.custom_request_id=NEW.custom_request_id);
 SELECT RAISE(ABORT,'commission_progress_requires_active_order_link')
 WHERE NEW.event_kind='progress_approval' AND NOT EXISTS
 (SELECT 1 FROM custom_request_order_status_links l WHERE l.custom_request_id=NEW.custom_request_id
   AND COALESCE(l.link_status,'active') NOT IN ('void','expired')
   AND l.voided_at IS NULL AND l.expired_at IS NULL);
END;
CREATE TRIGGER IF NOT EXISTS trg_custom_commission_no_update BEFORE UPDATE ON custom_request_commission_events BEGIN
 SELECT RAISE(ABORT,'commission_history_immutable');
END;
CREATE TRIGGER IF NOT EXISTS trg_custom_commission_no_delete BEFORE DELETE ON custom_request_commission_events BEGIN
 SELECT RAISE(ABORT,'commission_history_immutable');
END;
-- Evidence-only: migration introduces zero synthetic customers, quotes, payments, projects or progress.
SELECT COUNT(*) AS build382_commission_tables FROM sqlite_master WHERE type='table' AND name='custom_request_commission_events';
PRAGMA foreign_key_check;
