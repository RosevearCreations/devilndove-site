-- Release 467 Build 456. Private operator attestation of actual maker trials.
-- Append-only reviews reference canonical records; they never create or approve those records.
CREATE TABLE IF NOT EXISTS maker_owner_trial_reviews (
  maker_owner_trial_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_key TEXT NOT NULL CHECK(scenario_key IN ('jewellery_metal','resin_clay','digital_fabrication','failed_salvage','private_therapeutic','custom_commission')),
  checkpoint_key TEXT NOT NULL CHECK(checkpoint_key IN ('source_identity','actual_materials','process_quality','physical_safety','media_rights','design_provenance','privacy_control','customer_approval','cost_handoff','delivery_hold')),
  creative_work_project_id INTEGER REFERENCES creative_work_projects(creative_work_project_id) ON DELETE RESTRICT,
  custom_request_id INTEGER REFERENCES custom_requests(custom_request_id) ON DELETE RESTRICT,
  source_kind TEXT NOT NULL DEFAULT 'none' CHECK(source_kind IN ('none','project','event','design_revision','traveler_run','quality_attempt','cost_review','media_story','custom_request','customer_proof','commission_review')),
  source_id INTEGER,
  decision TEXT NOT NULL CHECK(decision IN ('hold','accepted')),
  personally_observed INTEGER NOT NULL DEFAULT 0 CHECK(personally_observed IN (0,1)),
  review_note TEXT NOT NULL CHECK(length(trim(review_note)) BETWEEN 24 AND 1200),
  recorded_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  request_key TEXT NOT NULL UNIQUE CHECK(length(request_key) BETWEEN 16 AND 80),
  payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK((source_kind='none' AND source_id IS NULL) OR (source_kind<>'none' AND source_id>0)),
  CHECK(decision<>'accepted' OR (personally_observed=1 AND source_kind<>'none')),
  CHECK((scenario_key='custom_commission' AND custom_request_id IS NOT NULL) OR
        (scenario_key<>'custom_commission' AND creative_work_project_id IS NOT NULL AND custom_request_id IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_maker_trial_project ON maker_owner_trial_reviews(creative_work_project_id,scenario_key,maker_owner_trial_review_id DESC);
CREATE INDEX IF NOT EXISTS idx_maker_trial_request ON maker_owner_trial_reviews(custom_request_id,scenario_key,maker_owner_trial_review_id DESC);
CREATE TRIGGER IF NOT EXISTS trg_maker_trial_source_valid BEFORE INSERT ON maker_owner_trial_reviews BEGIN
 SELECT RAISE(ABORT,'trial_checkpoint_not_applicable') WHERE NOT (
  (NEW.scenario_key IN ('jewellery_metal','resin_clay') AND NEW.checkpoint_key IN ('source_identity','actual_materials','process_quality','physical_safety','media_rights'))
  OR (NEW.scenario_key='digital_fabrication' AND NEW.checkpoint_key IN ('source_identity','design_provenance','process_quality','physical_safety','media_rights'))
  OR (NEW.scenario_key='failed_salvage' AND NEW.checkpoint_key IN ('source_identity','actual_materials','process_quality','media_rights'))
  OR (NEW.scenario_key='private_therapeutic' AND NEW.checkpoint_key IN ('source_identity','privacy_control','process_quality','media_rights'))
  OR (NEW.scenario_key='custom_commission' AND NEW.checkpoint_key IN ('source_identity','customer_approval','cost_handoff','process_quality','delivery_hold'))
 );
 SELECT RAISE(ABORT,'trial_checkpoint_source_type_invalid') WHERE NEW.source_kind<>'none' AND NOT (
  (NEW.checkpoint_key='source_identity' AND ((NEW.scenario_key='custom_commission' AND NEW.source_kind='custom_request') OR (NEW.scenario_key<>'custom_commission' AND NEW.source_kind='project')))
  OR (NEW.checkpoint_key='actual_materials' AND NEW.source_kind IN ('event','cost_review'))
  OR (NEW.checkpoint_key='design_provenance' AND NEW.source_kind='design_revision')
  OR (NEW.checkpoint_key='process_quality' AND ((NEW.scenario_key='custom_commission' AND NEW.source_kind='commission_review') OR (NEW.scenario_key<>'custom_commission' AND NEW.source_kind IN ('traveler_run','quality_attempt'))))
  OR (NEW.checkpoint_key='physical_safety' AND NEW.source_kind IN ('traveler_run','quality_attempt'))
  OR (NEW.checkpoint_key='media_rights' AND NEW.source_kind IN ('event','media_story'))
  OR (NEW.checkpoint_key='privacy_control' AND NEW.source_kind IN ('project','media_story'))
  OR (NEW.checkpoint_key='customer_approval' AND NEW.source_kind='customer_proof')
  OR (NEW.checkpoint_key IN ('cost_handoff','delivery_hold') AND NEW.source_kind='commission_review')
 );
 SELECT RAISE(ABORT,'trial_customer_proof_not_genuinely_approved') WHERE NEW.decision='accepted' AND NEW.checkpoint_key='customer_approval' AND NOT EXISTS (
  SELECT 1 FROM custom_request_proof_versions p WHERE p.custom_request_proof_version_id=NEW.source_id
   AND p.custom_request_id=NEW.custom_request_id AND p.proof_status='approved' AND p.approved_at IS NOT NULL
   AND (p.internal_production_approval_required=0 OR p.internal_production_approval_status='approved')
 );
 SELECT RAISE(ABORT,'trial_commission_stage_not_reviewed') WHERE NEW.decision='accepted' AND NEW.checkpoint_key IN ('cost_handoff','process_quality','delivery_hold') AND NOT EXISTS (
  SELECT 1 FROM maker_commission_completion_reviews c WHERE c.maker_commission_completion_review_id=NEW.source_id AND c.custom_request_id=NEW.custom_request_id
   AND c.decision=CASE NEW.checkpoint_key WHEN 'cost_handoff' THEN 'approved_change_review' WHEN 'process_quality' THEN 'maker_handoff_ready' ELSE 'delivery_followup_hold' END
 );
 SELECT RAISE(ABORT,'trial_project_and_request_must_not_mix') WHERE NEW.scenario_key='custom_commission' AND NEW.creative_work_project_id IS NOT NULL;
 SELECT RAISE(ABORT,'trial_source_not_in_selected_scope') WHERE NEW.source_kind<>'none' AND NOT (
   (NEW.source_kind='project' AND NEW.source_id=NEW.creative_work_project_id)
   OR (NEW.source_kind='event' AND EXISTS(SELECT 1 FROM creative_work_events e WHERE e.creative_work_event_id=NEW.source_id AND e.creative_work_project_id=NEW.creative_work_project_id AND e.entry_status='active'))
   OR (NEW.source_kind='design_revision' AND EXISTS(SELECT 1 FROM maker_design_file_revisions d WHERE d.maker_design_file_revision_id=NEW.source_id AND d.creative_work_project_id=NEW.creative_work_project_id))
   OR (NEW.source_kind='traveler_run' AND EXISTS(SELECT 1 FROM maker_traveler_runs t WHERE t.maker_traveler_run_id=NEW.source_id AND t.creative_work_project_id=NEW.creative_work_project_id))
   OR (NEW.source_kind='quality_attempt' AND EXISTS(SELECT 1 FROM maker_quality_attempts q WHERE q.maker_quality_attempt_id=NEW.source_id AND q.creative_work_project_id=NEW.creative_work_project_id))
   OR (NEW.source_kind='cost_review' AND EXISTS(SELECT 1 FROM maker_project_cost_reviews c WHERE c.maker_project_cost_review_id=NEW.source_id AND c.creative_work_project_id=NEW.creative_work_project_id))
   OR (NEW.source_kind='media_story' AND EXISTS(SELECT 1 FROM maker_media_story_revisions m WHERE m.maker_media_story_revision_id=NEW.source_id AND m.creative_work_project_id=NEW.creative_work_project_id))
   OR (NEW.source_kind='custom_request' AND NEW.source_id=NEW.custom_request_id)
   OR (NEW.source_kind='customer_proof' AND EXISTS(SELECT 1 FROM custom_request_proof_versions p WHERE p.custom_request_proof_version_id=NEW.source_id AND p.custom_request_id=NEW.custom_request_id))
   OR (NEW.source_kind='commission_review' AND EXISTS(SELECT 1 FROM maker_commission_completion_reviews c WHERE c.maker_commission_completion_review_id=NEW.source_id AND c.custom_request_id=NEW.custom_request_id))
 );
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_trial_immutable BEFORE UPDATE ON maker_owner_trial_reviews BEGIN SELECT RAISE(ABORT,'maker_trial_review_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_trial_no_delete BEFORE DELETE ON maker_owner_trial_reviews BEGIN SELECT RAISE(ABORT,'maker_trial_review_append_only'); END;
PRAGMA foreign_key_check;
