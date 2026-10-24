-- Release 467 Build 453. Private, append-only commission completion reviews.
-- Original Custom Request, quote, customer proof, manufacturing, quality, finished piece,
-- cost and order authorities are not rewritten or replaced.
CREATE TABLE IF NOT EXISTS maker_commission_completion_reviews (
 maker_commission_completion_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
 custom_request_id INTEGER NOT NULL REFERENCES custom_requests(custom_request_id) ON DELETE RESTRICT,
 decision TEXT NOT NULL CHECK(decision IN ('approved_change_review','maker_handoff_ready','delivery_followup_hold')),
 source_quote_revision_id INTEGER REFERENCES custom_request_quote_revisions(custom_request_quote_revision_id) ON DELETE RESTRICT,
 source_proof_version_id INTEGER REFERENCES custom_request_proof_versions(custom_request_proof_version_id) ON DELETE RESTRICT,
 source_cost_review_id INTEGER REFERENCES maker_project_cost_reviews(maker_project_cost_review_id) ON DELETE RESTRICT,
 source_traveler_run_id INTEGER REFERENCES maker_traveler_runs(maker_traveler_run_id) ON DELETE RESTRICT,
 source_finished_piece_id INTEGER REFERENCES maker_finished_pieces(maker_finished_piece_id) ON DELETE RESTRICT,
 source_order_status_link_id INTEGER REFERENCES custom_request_order_status_links(custom_request_order_status_link_id) ON DELETE RESTRICT,
 estimated_change_cost_delta_cents INTEGER CHECK(estimated_change_cost_delta_cents BETWEEN -1000000000 AND 1000000000),
 cost_impact_basis TEXT NOT NULL DEFAULT 'not_established' CHECK(cost_impact_basis IN ('not_established','reviewed_estimate')),
 review_note TEXT NOT NULL CHECK(length(trim(review_note)) BETWEEN 16 AND 1200),
 actor_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE CHECK(length(request_key) BETWEEN 16 AND 80),
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK((decision='approved_change_review')=(source_quote_revision_id IS NOT NULL AND source_cost_review_id IS NOT NULL AND estimated_change_cost_delta_cents IS NOT NULL AND cost_impact_basis='reviewed_estimate')),
 CHECK(decision<>'maker_handoff_ready' OR (source_traveler_run_id IS NOT NULL AND source_finished_piece_id IS NOT NULL)),
 CHECK(decision='approved_change_review' OR (estimated_change_cost_delta_cents IS NULL AND cost_impact_basis='not_established'))
);
CREATE INDEX IF NOT EXISTS idx_maker_commission_review_request ON maker_commission_completion_reviews(custom_request_id,maker_commission_completion_review_id DESC);
CREATE TRIGGER IF NOT EXISTS trg_maker_commission_completion_source BEFORE INSERT ON maker_commission_completion_reviews BEGIN
 SELECT RAISE(ABORT,'commission_revision_wrong_request') WHERE NEW.source_quote_revision_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM custom_request_quote_revisions v WHERE v.custom_request_quote_revision_id=NEW.source_quote_revision_id AND v.custom_request_id=NEW.custom_request_id);
 SELECT RAISE(ABORT,'commission_change_requires_customer_approval_after_revision') WHERE NEW.decision='approved_change_review' AND NOT EXISTS(
  SELECT 1 FROM custom_request_quote_revisions v JOIN custom_request_proof_versions p ON p.custom_request_id=v.custom_request_id
  WHERE v.custom_request_quote_revision_id=NEW.source_quote_revision_id AND p.custom_request_proof_version_id=NEW.source_proof_version_id
   AND p.proof_status='approved' AND p.approved_at IS NOT NULL AND datetime(p.approved_at)>=datetime(v.created_at));
 SELECT RAISE(ABORT,'commission_proof_not_current_customer_approved') WHERE NEW.decision IN ('approved_change_review','maker_handoff_ready') AND NOT EXISTS(
  SELECT 1 FROM custom_request_proof_versions p WHERE p.custom_request_proof_version_id=NEW.source_proof_version_id
   AND p.custom_request_id=NEW.custom_request_id AND p.proof_status='approved'
   AND (p.internal_production_approval_required=0 OR p.internal_production_approval_status='approved')
   AND NOT EXISTS(SELECT 1 FROM custom_request_proof_versions later WHERE later.custom_request_id=p.custom_request_id AND later.version_number>p.version_number));
 SELECT RAISE(ABORT,'commission_cost_not_from_project') WHERE NEW.source_cost_review_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM maker_project_cost_reviews cost JOIN creative_project_manufacturing_lifecycles l ON l.creative_work_project_id=cost.creative_work_project_id
  WHERE cost.maker_project_cost_review_id=NEW.source_cost_review_id AND cost.scenario_kind='commission' AND l.custom_request_id=NEW.custom_request_id);
 SELECT RAISE(ABORT,'commission_traveler_not_from_project') WHERE NEW.source_traveler_run_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM maker_traveler_runs r JOIN creative_project_manufacturing_lifecycles l ON l.creative_work_project_id=r.creative_work_project_id
  WHERE r.maker_traveler_run_id=NEW.source_traveler_run_id AND l.custom_request_id=NEW.custom_request_id);
 SELECT RAISE(ABORT,'commission_piece_not_from_project') WHERE NEW.source_finished_piece_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM maker_finished_pieces piece JOIN maker_quality_attempts quality ON quality.maker_quality_attempt_id=piece.maker_quality_attempt_id
   JOIN creative_project_manufacturing_lifecycles l ON l.creative_work_project_id=quality.creative_work_project_id
  WHERE piece.maker_finished_piece_id=NEW.source_finished_piece_id AND l.custom_request_id=NEW.custom_request_id
   AND (SELECT latest.decision FROM maker_quality_release_reviews latest WHERE latest.maker_quality_attempt_id=quality.maker_quality_attempt_id ORDER BY latest.maker_quality_release_review_id DESC LIMIT 1)='approved_for_sale');
 SELECT RAISE(ABORT,'commission_order_link_wrong_request') WHERE NEW.source_order_status_link_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM custom_request_order_status_links l WHERE l.custom_request_order_status_link_id=NEW.source_order_status_link_id
   AND l.custom_request_id=NEW.custom_request_id AND COALESCE(l.link_status,'active') NOT IN ('void','expired')
   AND l.voided_at IS NULL AND l.expired_at IS NULL);
 SELECT RAISE(ABORT,'commission_handoff_requires_job') WHERE NEW.decision='maker_handoff_ready' AND NOT EXISTS(
  SELECT 1 FROM custom_request_job_drafts j WHERE j.custom_request_id=NEW.custom_request_id);
 SELECT RAISE(ABORT,'commission_handoff_requires_all_traveler_steps_complete') WHERE NEW.decision='maker_handoff_ready' AND (
  NOT EXISTS(SELECT 1 FROM maker_traveler_run_steps s WHERE s.maker_traveler_run_id=NEW.source_traveler_run_id)
  OR EXISTS(SELECT 1 FROM maker_traveler_run_steps s WHERE s.maker_traveler_run_id=NEW.source_traveler_run_id AND
   COALESCE((SELECT e.event_kind FROM maker_traveler_step_events e WHERE e.maker_traveler_run_step_id=s.maker_traveler_run_step_id
    ORDER BY e.maker_traveler_step_event_id DESC LIMIT 1),'missing')<>'complete'));
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_commission_completion_immutable BEFORE UPDATE ON maker_commission_completion_reviews BEGIN SELECT RAISE(ABORT,'commission_completion_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_commission_completion_no_delete BEFORE DELETE ON maker_commission_completion_reviews BEGIN SELECT RAISE(ABORT,'commission_completion_append_only'); END;
PRAGMA foreign_key_check;
