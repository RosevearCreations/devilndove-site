-- Devil n Dove Build 240 — operational evidence, packaging continuity, SEO observation, mobile recovery and controlled approvals.
-- Apply once after Build 234. Back up D1 first. This migration contains no explicit transaction statements.

CREATE TABLE IF NOT EXISTS runtime_incidents (
  runtime_incident_id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_scope TEXT,
  incident_code TEXT,
  severity TEXT DEFAULT 'warning',
  endpoint_path TEXT,
  request_method TEXT,
  message TEXT,
  details_json TEXT,
  related_user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  review_status TEXT DEFAULT 'open',
  admin_note TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_runtime_incidents_created_at ON runtime_incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_incidents_scope ON runtime_incidents(incident_scope,severity,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_incidents_code_path ON runtime_incidents(incident_code,endpoint_path,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_incidents_review_status_created ON runtime_incidents(review_status,severity,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_incidents_grouping ON runtime_incidents(severity,incident_scope,incident_code,endpoint_path,created_at DESC);

CREATE TABLE IF NOT EXISTS operational_workstreams (
  operational_workstream_id INTEGER PRIMARY KEY AUTOINCREMENT,
  workstream_key TEXT NOT NULL UNIQUE,
  workstream_title TEXT NOT NULL,
  workstream_group TEXT NOT NULL,
  workstream_status TEXT NOT NULL DEFAULT 'ready_to_test' CHECK (workstream_status IN ('planned','ready_to_test','in_progress','blocked','complete','not_applicable')),
  priority TEXT NOT NULL DEFAULT 'P1' CHECK (priority IN ('P0','P1','P2')),
  destination_path TEXT,
  owner_name TEXT,
  due_at TEXT,
  blocker_text TEXT,
  evidence_summary TEXT,
  completion_rule TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_operational_workstreams_status ON operational_workstreams(is_active,priority,workstream_status,sort_order);

CREATE TABLE IF NOT EXISTS production_evidence_cases (
  production_evidence_case_id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_key TEXT NOT NULL UNIQUE,
  case_type TEXT NOT NULL,
  case_title TEXT NOT NULL,
  case_status TEXT NOT NULL DEFAULT 'open' CHECK (case_status IN ('open','running','passed','failed','blocked','cancelled')),
  environment_name TEXT NOT NULL DEFAULT 'production',
  expected_result TEXT,
  actual_result TEXT,
  safe_reference TEXT,
  owner_name TEXT,
  started_at TEXT,
  completed_at TEXT,
  related_workstream_key TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_production_evidence_cases_status ON production_evidence_cases(case_status,case_type,created_at DESC);

CREATE TABLE IF NOT EXISTS production_evidence_events (
  production_evidence_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  production_evidence_case_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_status TEXT NOT NULL DEFAULT 'recorded',
  expected_text TEXT,
  actual_text TEXT,
  evidence_url TEXT,
  safe_payload_json TEXT NOT NULL DEFAULT '{}',
  actor_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(production_evidence_case_id) REFERENCES production_evidence_cases(production_evidence_case_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_production_evidence_events_case ON production_evidence_events(production_evidence_case_id,created_at DESC);

CREATE TABLE IF NOT EXISTS operation_idempotency_claims (
  operation_idempotency_claim_id INTEGER PRIMARY KEY AUTOINCREMENT,
  idempotency_key TEXT NOT NULL UNIQUE,
  operation_kind TEXT NOT NULL,
  target_type TEXT,
  target_id INTEGER,
  request_hash TEXT,
  claim_status TEXT NOT NULL DEFAULT 'claimed' CHECK (claim_status IN ('claimed','completed','failed','released')),
  response_reference TEXT,
  first_claimed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  expires_at TEXT,
  created_by_user_id INTEGER
);
CREATE INDEX IF NOT EXISTS idx_operation_idempotency_status ON operation_idempotency_claims(operation_kind,claim_status,first_claimed_at DESC);

CREATE TABLE IF NOT EXISTS packaging_inventory_reservations (
  packaging_inventory_reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_key TEXT NOT NULL UNIQUE,
  packaging_project_id INTEGER NOT NULL,
  packaging_project_version_id INTEGER,
  reservation_status TEXT NOT NULL DEFAULT 'draft' CHECK (reservation_status IN ('draft','reserved','consumed','released','reversed','blocked')),
  quantity_finished_units REAL NOT NULL DEFAULT 1,
  idempotency_key TEXT NOT NULL UNIQUE,
  reason_text TEXT,
  reserved_at TEXT,
  consumed_at TEXT,
  released_at TEXT,
  reversed_at TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_packaging_inventory_reservations_project ON packaging_inventory_reservations(packaging_project_id,reservation_status,created_at DESC);

CREATE TABLE IF NOT EXISTS packaging_inventory_reservation_lines (
  packaging_inventory_reservation_line_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_inventory_reservation_id INTEGER NOT NULL,
  packaging_component_id INTEGER,
  site_item_inventory_id INTEGER,
  inventory_lot_id INTEGER,
  quantity_required REAL NOT NULL DEFAULT 0,
  quantity_reserved REAL NOT NULL DEFAULT 0,
  quantity_consumed REAL NOT NULL DEFAULT 0,
  quantity_reversed REAL NOT NULL DEFAULT 0,
  line_status TEXT NOT NULL DEFAULT 'draft' CHECK (line_status IN ('draft','reserved','consumed','released','reversed','shortage','blocked')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(packaging_inventory_reservation_id) REFERENCES packaging_inventory_reservations(packaging_inventory_reservation_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_packaging_reservation_lines_reservation ON packaging_inventory_reservation_lines(packaging_inventory_reservation_id,line_status);

CREATE TABLE IF NOT EXISTS packaging_formula_source_links (
  packaging_formula_source_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_project_id INTEGER NOT NULL,
  formula_source_type TEXT NOT NULL DEFAULT 'verified_formula',
  formula_source_key TEXT NOT NULL,
  formula_version TEXT,
  source_checksum TEXT,
  verification_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (verification_status IN ('needs_review','verified','superseded','blocked')),
  verified_by_user_id INTEGER,
  verified_at TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(packaging_project_id,formula_source_type,formula_source_key,formula_version)
);
CREATE INDEX IF NOT EXISTS idx_packaging_formula_links_project ON packaging_formula_source_links(packaging_project_id,verification_status,created_at DESC);

CREATE TABLE IF NOT EXISTS packaging_release_locks (
  packaging_release_lock_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_project_id INTEGER NOT NULL,
  packaging_project_version_id INTEGER NOT NULL,
  lock_status TEXT NOT NULL DEFAULT 'locked' CHECK (lock_status IN ('locked','superseded','reprint_authorized','voided')),
  version_checksum TEXT NOT NULL,
  physical_proof_reference TEXT,
  lock_reason TEXT,
  superseded_by_version_id INTEGER,
  reprint_count INTEGER NOT NULL DEFAULT 0,
  locked_by_user_id INTEGER,
  locked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(packaging_project_id,packaging_project_version_id)
);
CREATE INDEX IF NOT EXISTS idx_packaging_release_locks_project ON packaging_release_locks(packaging_project_id,lock_status,locked_at DESC);

CREATE TABLE IF NOT EXISTS packaging_prepress_checks (
  packaging_prepress_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_project_id INTEGER NOT NULL,
  packaging_project_version_id INTEGER,
  check_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (check_status IN ('needs_review','passed','failed','blocked')),
  page_width_mm REAL,
  page_height_mm REAL,
  bleed_mm REAL,
  safe_margin_mm REAL,
  text_fit_status TEXT NOT NULL DEFAULT 'not_checked',
  region_overflow_status TEXT NOT NULL DEFAULT 'not_checked',
  barcode_destination_status TEXT NOT NULL DEFAULT 'not_applicable',
  qr_destination_status TEXT NOT NULL DEFAULT 'not_applicable',
  font_embedding_status TEXT NOT NULL DEFAULT 'not_checked',
  blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  result_json TEXT NOT NULL DEFAULT '{}',
  checked_by_user_id INTEGER,
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_packaging_prepress_project ON packaging_prepress_checks(packaging_project_id,checked_at DESC);

CREATE TABLE IF NOT EXISTS provider_result_reconciliations (
  provider_result_reconciliation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_name TEXT NOT NULL,
  provider_action TEXT NOT NULL,
  local_reference_type TEXT,
  local_reference_id INTEGER,
  provider_reference_id TEXT,
  provider_result_url TEXT,
  reconciliation_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (reconciliation_status IN ('needs_review','matched','mismatch','failed','not_found')),
  expected_json TEXT NOT NULL DEFAULT '{}',
  actual_json TEXT NOT NULL DEFAULT '{}',
  checked_by_user_id INTEGER,
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_provider_reconciliation_status ON provider_result_reconciliations(provider_name,reconciliation_status,checked_at DESC);

CREATE TABLE IF NOT EXISTS notification_delivery_attempts (
  notification_delivery_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_outbox_id INTEGER,
  provider_name TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  attempt_status TEXT NOT NULL DEFAULT 'queued' CHECK (attempt_status IN ('queued','sent','delivered','deferred','bounced','failed','cancelled')),
  provider_message_id TEXT,
  provider_status_code TEXT,
  retry_after_at TEXT,
  safe_response_json TEXT NOT NULL DEFAULT '{}',
  error_text TEXT,
  attempted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notification_attempts_outbox ON notification_delivery_attempts(notification_outbox_id,attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_attempts_status ON notification_delivery_attempts(attempt_status,retry_after_at,attempted_at DESC);

CREATE TABLE IF NOT EXISTS mobile_evidence_drafts (
  mobile_evidence_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_key TEXT NOT NULL UNIQUE,
  evidence_kind TEXT NOT NULL,
  related_type TEXT,
  related_id INTEGER,
  draft_status TEXT NOT NULL DEFAULT 'local_pending' CHECK (draft_status IN ('local_pending','uploading','synced','failed','discarded')),
  local_created_at TEXT,
  exif_review_status TEXT NOT NULL DEFAULT 'not_checked',
  privacy_review_status TEXT NOT NULL DEFAULT 'needs_review',
  rights_status TEXT NOT NULL DEFAULT 'needs_review',
  r2_object_key TEXT,
  derivative_status TEXT NOT NULL DEFAULT 'not_started',
  unsynced_reason TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mobile_evidence_drafts_status ON mobile_evidence_drafts(draft_status,privacy_review_status,created_at DESC);

CREATE TABLE IF NOT EXISTS deployed_asset_check_results (
  deployed_asset_check_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_url TEXT NOT NULL,
  page_path TEXT,
  check_status TEXT NOT NULL DEFAULT 'not_run' CHECK (check_status IN ('not_run','passed','warning','failed')),
  http_status INTEGER,
  content_type TEXT,
  width_px INTEGER,
  height_px INTEGER,
  byte_size INTEGER,
  load_time_ms INTEGER,
  duplicate_hash TEXT,
  structured_data_exposure INTEGER NOT NULL DEFAULT 0,
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(asset_url,page_path,checked_at)
);
CREATE INDEX IF NOT EXISTS idx_deployed_asset_checks_status ON deployed_asset_check_results(check_status,checked_at DESC);

CREATE TABLE IF NOT EXISTS product_media_role_requirements (
  product_media_role_requirement_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  role_key TEXT NOT NULL,
  role_label TEXT NOT NULL,
  requirement_status TEXT NOT NULL DEFAULT 'missing' CHECK (requirement_status IN ('missing','candidate','approved','not_applicable','blocked')),
  media_asset_id INTEGER,
  final_url TEXT,
  alt_text TEXT,
  rights_status TEXT NOT NULL DEFAULT 'needs_review',
  phone_review_status TEXT NOT NULL DEFAULT 'unchecked',
  desktop_review_status TEXT NOT NULL DEFAULT 'unchecked',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id,role_key)
);
CREATE INDEX IF NOT EXISTS idx_product_media_roles_status ON product_media_role_requirements(requirement_status,rights_status,product_id);

CREATE TABLE IF NOT EXISTS customer_support_interactions (
  customer_support_interaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_reference TEXT,
  interaction_channel TEXT NOT NULL DEFAULT 'email',
  interaction_type TEXT NOT NULL DEFAULT 'question',
  interaction_status TEXT NOT NULL DEFAULT 'open' CHECK (interaction_status IN ('open','waiting','resolved','closed','escalated')),
  related_order_id INTEGER,
  related_product_id INTEGER,
  consent_status TEXT NOT NULL DEFAULT 'private',
  summary_text TEXT NOT NULL,
  next_action_text TEXT,
  follow_up_at TEXT,
  resolved_at TEXT,
  created_by_user_id INTEGER,
  assigned_to_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_support_interactions_status ON customer_support_interactions(interaction_status,follow_up_at,created_at DESC);

CREATE TABLE IF NOT EXISTS accounting_close_checklist_items (
  accounting_close_checklist_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_key TEXT NOT NULL,
  checklist_key TEXT NOT NULL,
  checklist_label TEXT NOT NULL,
  checklist_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (checklist_status IN ('needs_review','in_progress','passed','blocked','not_applicable')),
  evidence_reference TEXT,
  blocker_text TEXT,
  owner_name TEXT,
  due_at TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(period_key,checklist_key)
);
CREATE INDEX IF NOT EXISTS idx_accounting_close_status ON accounting_close_checklist_items(period_key,checklist_status,due_at);

CREATE TABLE IF NOT EXISTS controlled_batch_approvals (
  controlled_batch_approval_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_key TEXT NOT NULL UNIQUE,
  batch_type TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  batch_status TEXT NOT NULL DEFAULT 'draft' CHECK (batch_status IN ('draft','review','approved','applied','rolled_back','blocked')),
  item_count INTEGER NOT NULL DEFAULT 0,
  criteria_json TEXT NOT NULL DEFAULT '{}',
  item_ids_json TEXT NOT NULL DEFAULT '[]',
  rollback_json TEXT NOT NULL DEFAULT '{}',
  approved_by_user_id INTEGER,
  approved_at TEXT,
  applied_at TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_controlled_batch_approvals_status ON controlled_batch_approvals(batch_type,batch_status,risk_level,created_at DESC);

CREATE TABLE IF NOT EXISTS local_seo_observation_snapshots (
  local_seo_observation_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date TEXT NOT NULL,
  page_path TEXT NOT NULL,
  target_location TEXT NOT NULL DEFAULT 'Southern Ontario',
  target_query TEXT,
  search_console_clicks REAL NOT NULL DEFAULT 0,
  search_console_impressions REAL NOT NULL DEFAULT 0,
  average_position REAL,
  business_profile_actions REAL NOT NULL DEFAULT 0,
  review_count INTEGER,
  average_rating REAL,
  conversion_count REAL NOT NULL DEFAULT 0,
  notes TEXT,
  source_status TEXT NOT NULL DEFAULT 'manual',
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(snapshot_date,page_path,target_location,target_query)
);
CREATE INDEX IF NOT EXISTS idx_local_seo_observations_page ON local_seo_observation_snapshots(page_path,snapshot_date DESC);

CREATE TABLE IF NOT EXISTS public_page_audit_results (
  public_page_audit_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  page_path TEXT NOT NULL,
  audit_status TEXT NOT NULL DEFAULT 'not_run' CHECK (audit_status IN ('not_run','passed','warning','failed')),
  h1_count INTEGER NOT NULL DEFAULT 0,
  title_text TEXT,
  meta_description_text TEXT,
  canonical_url TEXT,
  internal_link_count INTEGER NOT NULL DEFAULT 0,
  image_count INTEGER NOT NULL DEFAULT 0,
  missing_alt_count INTEGER NOT NULL DEFAULT 0,
  missing_asset_count INTEGER NOT NULL DEFAULT 0,
  structured_data_count INTEGER NOT NULL DEFAULT 0,
  mobile_overflow_status TEXT NOT NULL DEFAULT 'not_checked',
  notes TEXT,
  audited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(build_label,page_path)
);
CREATE INDEX IF NOT EXISTS idx_public_page_audit_status ON public_page_audit_results(build_label,audit_status,page_path);

CREATE TABLE IF NOT EXISTS route_fallback_policies (
  route_fallback_policy_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL UNIQUE,
  route_kind TEXT NOT NULL DEFAULT 'admin_api',
  fallback_status TEXT NOT NULL DEFAULT 'active' CHECK (fallback_status IN ('active','disabled','needs_review')),
  fallback_title TEXT NOT NULL,
  fallback_message TEXT NOT NULL,
  retry_enabled INTEGER NOT NULL DEFAULT 1,
  safe_navigation_json TEXT NOT NULL DEFAULT '[]',
  incident_scope TEXT,
  last_verified_at TEXT,
  verified_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_route_fallback_status ON route_fallback_policies(fallback_status,route_kind,route_path);

CREATE TABLE IF NOT EXISTS mobile_operations_cards (
  mobile_operations_card_id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_key TEXT NOT NULL UNIQUE,
  card_title TEXT NOT NULL,
  card_group TEXT NOT NULL,
  destination_path TEXT NOT NULL,
  card_status TEXT NOT NULL DEFAULT 'active' CHECK (card_status IN ('active','hidden','blocked')),
  badge_query TEXT,
  icon_name TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mobile_operations_cards_order ON mobile_operations_cards(card_status,card_group,sort_order);

INSERT INTO operational_workstreams (workstream_key,workstream_title,workstream_group,workstream_status,priority,destination_path,completion_rule,sort_order,is_active)
VALUES
('production_evidence_cases','Production evidence cases and append-only events','evidence','ready_to_test','P0','/admin/operational-continuity/','A named case records expected, actual, evidence and final status without storing secrets.',10,1),
('idempotency_registry','Cross-workflow idempotency claim registry','reliability','ready_to_test','P0','/admin/operational-continuity/','Duplicate operation keys are detected and retain a safe result reference.',20,1),
('packaging_reservation','Packaging component reservation, consumption and reversal','packaging','ready_to_test','P1','/admin/operational-continuity/','Each packaging movement is idempotent, lot-aware and reversible.',30,1),
('packaging_formula_link','Verified formula/source linkage without ingredient duplication','packaging','ready_to_test','P1','/admin/operational-continuity/','A packaging project points to one verified formula/version/checksum authority.',40,1),
('packaging_release_lock','Approved packaging lock, supersession and reprint authorization','packaging','ready_to_test','P1','/admin/operational-continuity/','An approved version is checksum-locked and later changes use supersession or reprint authorization.',50,1),
('packaging_prepress','Deterministic prepress, text-fit and destination checks','packaging','ready_to_test','P1','/admin/operational-continuity/','Text fit, region overflow, barcode/QR destination, dimensions and fonts have explicit pass/fail evidence.',60,1),
('provider_reconciliation','Provider post/message/result reconciliation','providers','ready_to_test','P1','/admin/operational-continuity/','Local state is matched to observable provider IDs/URLs and mismatches remain visible.',70,1),
('notification_attempts','Notification delivery attempts, retries and outcomes','notifications','ready_to_test','P1','/admin/operational-continuity/','Each outbox item has provider attempt history and retry evidence.',80,1),
('mobile_evidence_recovery','Camera-first mobile evidence draft and unsynced recovery','mobile','ready_to_test','P1','/admin/operational-continuity/','A phone draft survives interruption and requires EXIF/privacy/rights review before public use.',90,1),
('deployed_asset_checks','Deployed asset URL, dimensions, duplicate and speed checks','visuals','ready_to_test','P1','/admin/operational-continuity/','Every launch asset has a deployed check result with status and measurable facts.',100,1),
('product_media_roles','Product-specific feature/detail/scale/packaging media roles','visuals','ready_to_test','P1','/admin/operational-continuity/','Each launch product has explicit media-role rows without duplicating product facts.',110,1),
('support_history','Consent-safe customer support interaction history','support','ready_to_test','P2','/admin/operational-continuity/','Open questions, next action and consent remain visible without exposing unnecessary personal data.',120,1),
('accounting_close','Accounting close and reconciliation checklist','accounting','ready_to_test','P2','/admin/operational-continuity/','Each close period has evidence-backed pass/block/not-applicable decisions.',130,1),
('controlled_batch_approval','Low-risk controlled batch approval and rollback','operations','ready_to_test','P2','/admin/operational-continuity/','Only low-risk reviewed items can be approved together and every batch has rollback data.',140,1),
('local_seo_observations','Local SEO and Business Profile observation snapshots','seo','ready_to_test','P1','/admin/operational-continuity/','Search Console, Business Profile and conversion observations are stored by page/location/date.',150,1),
('public_page_audit','Automated one-H1, title, meta, canonical, links, images and schema audit','seo','ready_to_test','P0','/admin/operational-continuity/','Every exposed page has exactly one H1 and required search/mobile fields are audited per build.',160,1),
('route_fallbacks','Route-level safe fallback and recovery policy','reliability','ready_to_test','P0','/admin/operational-continuity/','Critical admin/API routes have a no-false-success fallback, retry and safe navigation.',170,1),
('mobile_operations_cards','Phone operations dashboard cards','mobile','ready_to_test','P2','/admin/operational-continuity/','Phone users can reach evidence, inventory, support, accounting and release exceptions quickly.',180,1),
('schema_authority','Build 240 aggregate/current schema synchronization','data','complete','P0','/admin/operational-continuity/','The numbered migration, three aggregate schemas and current-pass SQL are identical at the Build 240 boundary.',190,1),
('markdown_authority','Two-authority Markdown consolidation and next-20 planning','documentation','complete','P0','/admin/operational-continuity/','AI_HANDOFF and PROJECT_STATUS_AND_ROADMAP remain canonical; specialist docs are scoped and historical build docs are archived.',200,1)
ON CONFLICT(workstream_key) DO UPDATE SET
  workstream_title=excluded.workstream_title,
  workstream_group=excluded.workstream_group,
  priority=excluded.priority,
  destination_path=excluded.destination_path,
  completion_rule=excluded.completion_rule,
  sort_order=excluded.sort_order,
  is_active=1,
  updated_at=CURRENT_TIMESTAMP;

INSERT INTO route_fallback_policies (route_path,route_kind,fallback_status,fallback_title,fallback_message,retry_enabled,safe_navigation_json,incident_scope,last_verified_at)
VALUES
('/api/admin/operational-continuity','admin_api','active','Operational Continuity is unavailable','No readiness item is being inferred complete. Correct authentication, API or D1 and retry.',1,'["/admin/startup-readiness/","/admin/deploy-readiness/","/admin/application-sanity/"]','operational_continuity',NULL),
('/admin/operational-continuity/','admin_page','active','Operational Continuity could not load','Use the static twenty-workstream fallback below; no live database status is being inferred.',1,'["/admin/","/admin/startup-readiness/","/admin/deploy-readiness/"]','operational_continuity_ui',NULL)
ON CONFLICT(route_path) DO UPDATE SET
  route_kind=excluded.route_kind,
  fallback_status='active',
  fallback_title=excluded.fallback_title,
  fallback_message=excluded.fallback_message,
  retry_enabled=excluded.retry_enabled,
  safe_navigation_json=excluded.safe_navigation_json,
  incident_scope=excluded.incident_scope,
  updated_at=CURRENT_TIMESTAMP;

INSERT INTO mobile_operations_cards (card_key,card_title,card_group,destination_path,card_status,badge_query,icon_name,sort_order,payload_json)
VALUES
('mobile_evidence','Evidence Cases','evidence','/admin/operational-continuity/','active','open_evidence_cases','camera',10,'{}'),
('mobile_inventory','Packaging Reservations','inventory','/admin/operational-continuity/','active','open_packaging_reservations','boxes',20,'{}'),
('mobile_notifications','Notification Failures','communications','/admin/operations/','active','failed_notification_attempts','bell',30,'{}'),
('mobile_support','Customer Follow-up','support','/admin/operational-continuity/','active','open_support_interactions','message',40,'{}'),
('mobile_close','Accounting Close','accounting','/admin/operational-continuity/','active','blocked_close_items','calculator',50,'{}'),
('mobile_seo','Local SEO Observations','seo','/admin/operational-continuity/','active','seo_observation_age','search',60,'{}'),
('mobile_release','Release Blockers','release','/admin/deploy-readiness/','active','release_blockers','shield',70,'{}')
ON CONFLICT(card_key) DO UPDATE SET
  card_title=excluded.card_title,
  card_group=excluded.card_group,
  destination_path=excluded.destination_path,
  card_status=excluded.card_status,
  badge_query=excluded.badge_query,
  icon_name=excluded.icon_name,
  sort_order=excluded.sort_order,
  updated_at=CURRENT_TIMESTAMP;

INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active)
VALUES (
  'operational_continuity_evidence_center',
  'operations',
  'Recovery, fulfilment, and controlled opening',
  'Operate the Build 240 evidence, continuity, fallback and mobile control centre',
  357,
  'critical',
  1,
  1,
  '/admin/operational-continuity/',
  'Production D1, Cloudflare logs, payment/email/social providers, R2 and phone/desktop browsers',
  '1. Apply Build 240 after backing up D1 and confirm the migration ledger key.\n2. Open Operational Continuity and verify all twenty workstreams load from D1; degraded mode must show the static fallback and no false success.\n3. Create evidence cases for login, autosave, webhook duplicate, concurrency, refund, email, restore, packaging and controlled opening.\n4. Record expected and actual results plus safe IDs/URLs; never store credentials or unnecessary customer data.\n5. Verify idempotency claims reject a duplicate key without repeating the operation.\n6. Test one packaging component reservation, release and reversal with lot-aware quantities.\n7. Link one verified formula/version/checksum to a packaging project and lock one approved version.\n8. Record prepress text-fit, region-overflow, QR/barcode destination and font results.\n9. Reconcile at least one observable provider result and one notification delivery attempt.\n10. Test a phone evidence draft through interruption, privacy review and sync recovery.\n11. Run deployed asset and public-page audits; one H1, titles, descriptions, canonical, links, images and schema must remain visible.\n12. Review support, accounting-close, batch-approval, local-SEO, fallback and mobile-card queues.\n13. Attach non-secret evidence and reopen affected gates after any failure or corrective deployment.',
  'All twenty workstreams have an owner/status, critical live cases have evidence, duplicate operations are prevented, fallbacks do not imply success, and no active stop condition remains.',
  1
)
ON CONFLICT(item_key) DO UPDATE SET
  phase_key=excluded.phase_key,
  phase_label=excluded.phase_label,
  item_title=excluded.item_title,
  sort_order=excluded.sort_order,
  blocker_severity=excluded.blocker_severity,
  is_launch_blocker=excluded.is_launch_blocker,
  requires_live_binding=excluded.requires_live_binding,
  target_route=excluded.target_route,
  external_location=excluded.external_location,
  instructions_markdown=excluded.instructions_markdown,
  pass_condition=excluded.pass_condition,
  is_active=1,
  updated_at=CURRENT_TIMESTAMP;


-- Build 240 static public-page audit seed generated by scripts/build240_public_page_audit.py.
INSERT INTO public_page_audit_results (build_label,page_path,audit_status,h1_count,title_text,meta_description_text,canonical_url,internal_link_count,image_count,missing_alt_count,missing_asset_count,structured_data_count,mobile_overflow_status,notes)
VALUES
  ('Build 240','/about/','passed',1,'About Devil n Dove | Southern Ontario Artisan Workshop','Learn about Devil n Dove, our Southern Ontario, Canada workshop, our creative process, and the handmade jewelry, art, tools, and maker projects we share.','https://devilndove.com/about/',16,4,0,0,1,'requires_browser_check',''),
  ('Build 240','/collections/','passed',1,'Devil n Dove Collections | Handmade, Vintage & Collectible Paths','Browse Devil n Dove collection paths for handmade work, vintage finds, collectibles, antiques, oddities, and pre-built stock from our Southern Ontario, Canada workshop and storefront.','https://devilndove.com/collections/',15,1,0,0,1,'requires_browser_check',''),
  ('Build 240','/contact/','passed',1,'Contact Devil n Dove | Questions, Custom Work & Shop Help','Contact Devil n Dove for shop questions, custom work, product help, workshop inquiries, and general messages from Southern Ontario, Canada.','https://devilndove.com/contact/',10,2,0,0,1,'requires_browser_check',''),
  ('Build 240','/creations/','passed',1,'Devil n Dove Creations | Browse Handmade Projects & Pieces','Browse Devil n Dove creations including handmade jewelry, resin, mixed media, workshop builds, and featured finished pieces from Southern Ontario, Canada.','https://devilndove.com/creations/',12,2,0,0,1,'requires_browser_check',''),
  ('Build 240','/custom-candle-making-ontario/','passed',1,'Custom Candle Making in Southern Ontario | Devil n Dove','Request custom candle making from Devil n Dove in Southern Ontario. Small-batch candle gifts, scent ideas, colour themes, labels, and handmade workshop gift planning.','https://devilndove.com/custom-candle-making-ontario/',6,3,0,0,1,'requires_browser_check',''),
  ('Build 240','/custom-gifts-southern-ontario/','passed',1,'Custom Gifts in Southern Ontario | Devil n Dove','Explore custom gift ideas, handmade items, laser engraved pieces, sublimation experiments, and workshop-made creations from Devil n Dove in Southern Ontario.','https://devilndove.com/custom-gifts-southern-ontario/',14,2,0,0,2,'requires_browser_check',''),
  ('Build 240','/custom-request/','passed',1,'Custom Gift Request in Southern Ontario — Devil n Dove','Request a custom handmade gift, engraving, jewelry idea, sublimation item, candle, soap, vintage-style find, or workshop-made Devil n Dove creation in Southern Ontario.','https://devilndove.com/custom-request/',6,1,0,0,1,'requires_browser_check',''),
  ('Build 240','/custom-soap-making-ontario/','passed',1,'Custom Soap Making in Southern Ontario | Devil n Dove','Request custom soap making from Devil n Dove in Southern Ontario. Handmade soap gift ideas, colours, labels, scent notes, and small-batch workshop planning.','https://devilndove.com/custom-soap-making-ontario/',6,3,0,0,1,'requires_browser_check',''),
  ('Build 240','/data-deletion/','passed',1,'Data Deletion Instructions | Devil n Dove','How to request deletion of eligible Devil n Dove account, media, and connected social-platform information.','https://devilndove.com/data-deletion/',7,0,0,0,1,'requires_browser_check',''),
  ('Build 240','/events/','passed',1,'Devil n Dove Events | Recurring Markets, Pop-Ups & Vendor Dates','See how Devil n Dove handles market days, pop-ups, local events, and in-person selling in Southern Ontario, including what kinds of handmade, vintage, and collectible items may appear at events or pickup-friendly meetups.','https://devilndove.com/events/',9,1,0,0,1,'requires_browser_check',''),
  ('Build 240','/gallery/','passed',1,'Devil n Dove Gallery | Handmade Art, Jewelry & Experiments','Browse the Devil n Dove gallery of handmade jewelry, mixed media art, workshop experiments, and finished creative pieces from our Southern Ontario, Canada studio.','https://devilndove.com/gallery/',9,2,0,0,1,'requires_browser_check',''),
  ('Build 240','/gift-cards/','passed',1,'Devil n Dove Gift Cards | Handmade Gift Picks in Ontario','Create a Devil n Dove gift card draft for handmade jewelry, art, custom work, vintage finds, and workshop-made gifts from Southern Ontario.','https://devilndove.com/gift-cards/',7,3,0,0,1,'requires_browser_check',''),
  ('Build 240','/handmade-jewelry-ontario/','passed',1,'Handmade Jewelry in Southern Ontario | Devil n Dove','Shop and follow handmade jewelry, workshop experiments, polymer clay earrings, resin work, and small-batch artisan creations from Devil n Dove in Southern Ontario.','https://devilndove.com/handmade-jewelry-ontario/',14,2,0,0,2,'requires_browser_check',''),
  ('Build 240','/','passed',1,'Devil n Dove | Handmade Jewelry & Artisan Gifts Ontario','Devil n Dove is a Southern Ontario, Canada artisan workshop and online store for handmade jewelry, creative projects, tools, supplies, and maker experiments.','https://devilndove.com/',47,4,0,0,3,'requires_browser_check',''),
  ('Build 240','/laser-engraving-ontario/','passed',1,'Laser Engraving Projects in Ontario | Devil n Dove','See Devil n Dove laser engraving projects, personalized workshop tests, gift ideas, and maker experiments from Southern Ontario.','https://devilndove.com/laser-engraving-ontario/',14,2,0,0,2,'requires_browser_check',''),
  ('Build 240','/marketplaces/','passed',1,'Devil n Dove Marketplaces | External Listings, Pickup & Sale Channels','Learn how Devil n Dove handles external marketplace listings, hybrid listings, local pickup questions, condition notes, and sale-channel clarity for handmade, vintage, and collectible stock in Southern Ontario, Canada.','https://devilndove.com/marketplaces/',8,0,0,0,1,'requires_browser_check',''),
  ('Build 240','/movies/','passed',1,'Movie Shelf | DVD and Blu-ray Movie Collection at Devil n Dove','Browse the Devil n Dove DVD and Blu-ray movie collection with searchable cover art, UPC lookup, film details, cast, director, runtime, and trailer links.','https://devilndove.com/movies/',9,2,0,0,1,'requires_browser_check',''),
  ('Build 240','/pickup/','passed',1,'Devil n Dove Local Pickup | Availability, Timing & Support','Learn how Devil n Dove handles local pickup questions, timing, item availability, marketplace-linked listings, and support conversations for handmade, vintage, and collectible stock in Southern Ontario.','https://devilndove.com/pickup/',3,2,0,0,1,'requires_browser_check',''),
  ('Build 240','/polymer-clay-earrings-ontario/','passed',1,'Polymer Clay Earrings in Ontario | Devil n Dove','Discover polymer clay earrings, lightweight handmade jewelry, and creative workshop pieces from Devil n Dove in Southern Ontario.','https://devilndove.com/polymer-clay-earrings-ontario/',14,2,0,0,2,'requires_browser_check',''),
  ('Build 240','/privacy/','passed',1,'Privacy Policy | Devil n Dove','How Devil n Dove collects, uses, protects, and handles website, order, media, and social-platform information.','https://devilndove.com/privacy/',8,0,0,0,1,'requires_browser_check',''),
  ('Build 240','/search/','passed',1,'Search Devil n Dove | Find Products, Tools, Supplies & Creations','Search Devil n Dove products, tools, supplies, creations, and key pages from one place across our Southern Ontario workshop and store.','https://devilndove.com/search/',4,0,0,0,1,'requires_browser_check',''),
  ('Build 240','/shop/','passed',1,'Shop Devil n Dove | Handmade, Vintage, Collectibles & Oddities','Shop Devil n Dove handmade pieces, vintage finds, collectibles, oddities, tools, and digital creations from our Southern Ontario, Canada workshop.','https://devilndove.com/shop/',13,3,0,0,1,'requires_browser_check',''),
  ('Build 240','/shop/product/','passed',1,'Product Details | Devil n Dove Shop','View product details, images, pricing, shipping, and availability for Devil n Dove handmade goods and digital creations.','https://devilndove.com/shop/product/',12,5,0,0,1,'requires_browser_check',''),
  ('Build 240','/social-connections/','passed',1,'Social Platform Connections | Devil n Dove','How Devil n Dove uses authorized Facebook, Instagram, Pinterest, X, TikTok, and YouTube connections.','https://devilndove.com/social-connections/',7,0,0,0,1,'requires_browser_check',''),
  ('Build 240','/socials/','passed',1,'Social Hub | Devil n Dove','Follow Devil n Dove in one place with profile links and a shared social hub for YouTube, Instagram, TikTok, Facebook, X, and Patreon.','https://devilndove.com/socials/',4,1,0,0,1,'requires_browser_check',''),
  ('Build 240','/supplies/','passed',1,'Devil n Dove Supplies | Workshop Consumables & Materials','Browse the supplies and consumables we use at Devil n Dove, including workshop materials, refillables, and maker essentials from our Southern Ontario studio.','https://devilndove.com/supplies/',9,2,0,0,1,'requires_browser_check',''),
  ('Build 240','/terms/','passed',1,'Terms of Use and Sale | Devil n Dove','Terms for using Devil n Dove, ordering handmade or vintage products, custom requests, media, and social publishing.','https://devilndove.com/terms/',7,0,0,0,1,'requires_browser_check',''),
  ('Build 240','/tools/','passed',1,'Devil n Dove Tools | Workshop Tools We Use','Browse the tools Devil n Dove uses in our Southern Ontario workshop for jewelry making, casting, carving, laser work, resin, and maker experiments.','https://devilndove.com/tools/',9,2,0,0,1,'requires_browser_check',''),
  ('Build 240','/toolshed/','passed',1,'Devil n Dove Toolshed | Workshop Gear, Notes & Learnings','See the Devil n Dove toolshed with workshop gear, duplicate tools, practical notes, and links to what we use in the studio.','https://devilndove.com/toolshed/',9,2,0,0,1,'requires_browser_check',''),
  ('Build 240','/vintage-finds-ontario/','passed',1,'Vintage Finds and Oddities in Ontario | Devil n Dove','Browse the Devil n Dove mix of handmade creations, vintage finds, collectibles, curiosities, and oddities from Southern Ontario.','https://devilndove.com/vintage-finds-ontario/',14,2,0,0,2,'requires_browser_check',''),
  ('Build 240','/workshop-journal/coin-and-spoon-ring-care/','passed',1,'Coin & Spoon Ring Care | Devil n Dove Workshop Journal','A Devil n Dove guide to checking fit, cleaning, and caring for coin rings and spoon rings.','https://devilndove.com/workshop-journal/coin-and-spoon-ring-care/',3,0,0,0,1,'requires_browser_check',''),
  ('Build 240','/workshop-journal/handmade-vintage-sourced-guide/','passed',1,'Handmade, Vintage & Sourced Guide | Devil n Dove Workshop Journal','How Devil n Dove describes handmade pieces, vintage finds, collectibles, antiques, oddities, and sourced inventory.','https://devilndove.com/workshop-journal/handmade-vintage-sourced-guide/',3,0,0,0,1,'requires_browser_check',''),
  ('Build 240','/workshop-journal/','passed',1,'Workshop Journal & Handmade Care | Devil n Dove','Workshop notes, handmade care guides, maker experiments, and honest notes on vintage, sourced, and mixed-media pieces from Devil n Dove.','https://devilndove.com/workshop-journal/',8,2,0,0,1,'requires_browser_check',''),
  ('Build 240','/workshop-journal/polymer-clay-earring-care/','passed',1,'Polymer Clay Earring Care | Devil n Dove Workshop Journal','A simple Devil n Dove guide to storing, cleaning, and wearing polymer clay earrings with care.','https://devilndove.com/workshop-journal/polymer-clay-earring-care/',3,0,0,0,1,'requires_browser_check',''),
  ('Build 240','/workshop-journal/story/','passed',1,'Workshop Journal Story | Devil n Dove','A reviewed Devil n Dove workshop story about a finished handmade, vintage, or mixed-media project.','https://devilndove.com/workshop-journal/story/',4,0,0,0,1,'requires_browser_check',''),
  ('Build 240','/workshop-made-gifts-ontario/','passed',1,'Workshop-Made Gifts in Ontario | Devil n Dove','Follow Devil n Dove workshop-made gifts, jewelry, CNC experiments, casting projects, engraving, sublimation, and handmade creations in Southern Ontario.','https://devilndove.com/workshop-made-gifts-ontario/',14,1,0,0,2,'requires_browser_check','')
ON CONFLICT(build_label,page_path) DO UPDATE SET
  audit_status=excluded.audit_status,
  h1_count=excluded.h1_count,
  title_text=excluded.title_text,
  meta_description_text=excluded.meta_description_text,
  canonical_url=excluded.canonical_url,
  internal_link_count=excluded.internal_link_count,
  image_count=excluded.image_count,
  missing_alt_count=excluded.missing_alt_count,
  missing_asset_count=excluded.missing_asset_count,
  structured_data_count=excluded.structured_data_count,
  mobile_overflow_status=excluded.mobile_overflow_status,
  notes=excluded.notes,
  audited_at=CURRENT_TIMESTAMP;


-- Build 240 refreshes current release instructions without changing mutable owner/status/evidence.
UPDATE startup_readiness_items SET
  external_location='Build 240 archive, current schema/migration files, Cloudflare Pages Functions bundler, and PRELAUNCH_PROCESS_PLAYBOOKS.md',
  instructions_markdown='1. Open the Prelaunch Operations Map and confirm Deployment Preflight is stage 2, before Safe Deploy, live smoke tests, Deploy Readiness, and Go-Live Execution.
2. Run the static predeploy, deployment-preflight, final-blocker, JavaScript syntax, Build 231 autosave/reload regression, Build 232 archived-product removal regression, Build 233 bounded-login/session-retention regression, Build 234 packaging/template/duplicate-cleanup regression, aggregate-schema, repeated-current-migration, Startup 45-gate, image-manifest seed/provenance, packaging-reference checksum, and Cloudflare Pages Functions bundle checks against the exact archive to deploy.
3. Confirm all public HTML pages have a viewport, distinctive title, useful meta description, one H1, crawlable canonical where applicable, valid structured data, and descriptive image alternative text.
4. Confirm CSS braces balance and review phone, tablet, laptop, and wide-desktop overflow for every changed interface, especially Login, Product Editor, Product Cleanup, Visual Image Manifest, Labeling & Packaging, Creative Automation and three public image bands.
5. Confirm database_upgrade_current_pass.sql remains identical to database_build240_operational_evidence_continuity.sql and the Build 240 migration contains no explicit BEGIN, COMMIT, SAVEPOINT, RELEASE or ROLLBACK statement.
6. Confirm AI_HANDOFF.md, PROJECT_STATUS_AND_ROADMAP.md, schema references, release notes, changed files and validation identify Build 240 consistently while naming Build 240 as the current D1 migration.
7. Confirm the five adopted packaging source files still match PACKAGING_REFERENCE_BASELINE.md and the three generated editorial assets match GENERATED_VISUAL_ASSET_REGISTER.md; generated art must not appear in Product/Offer structured data.
8. Confirm the image manifest contains 20 active seed rows, the three generated rows retain provenance, and real-photo requirements cannot be passed by generated imagery.
9. Save the exact archive name, SHA-256, check results and unresolved warnings. Do not proceed when any blocker remains.
10. If a check fails, correct the owning source file rather than editing only generated output; rerun the entire preflight from the beginning.',
  pass_condition='The exact Build 240 archive passes every static, bounded-login/session-retention, autosave/reload, archived-product removal, schema, syntax, CSS, one-H1, metadata, image-manifest, fallback, packaging-reference, documentation and Pages Functions bundle check with zero unresolved blocker.',
  updated_at=CURRENT_TIMESTAMP
WHERE item_key='deployment_preflight_standalone';

UPDATE startup_readiness_items SET
  external_location='Cloudflare Dashboard → Workers & Pages → D1 and Pages deployments',
  instructions_markdown='1. Open Cloudflare D1 and record the current Time Travel bookmark or approved recovery point before changing the schema.
2. Record the date, database name and safe recovery reference in the evidence notes.
3. Confirm required prior ledger keys through build234_packaging_templates_creative_cleanup already exist, then apply database_build240_operational_evidence_continuity.sql or the identical database_upgrade_current_pass.sql, but not both.
4. Confirm the ledger records build240_operational_evidence_continuity; verify twenty workstreams, 45 Startup gates, 36 Build 240 page audits, seven mobile cards, two fallback policies, the retained packaging references/templates and unchanged mutable evidence.
5. Deploy the complete ZIP rather than selected files.
6. Record the Pages deployment URL and deployment/commit identifier.
7. Open Startup Readiness with All statuses and confirm all 45 gates load without removing prior owner, evidence or history records; explicitly locate missing_launch_images, candle_top_template_proof and operational_continuity_evidence_center and open their operating routes.
8. Confirm the manifest loads from D1 rather than Unsynced fallback and preserves the three generated-editorial provenance rows.
9. Continue to the standalone Post-Deploy Smoke Tests; do not treat successful upload as a passed live deployment.
10. Stop and restore the previous deployment or D1 recovery point if any critical migration, Function, route or data-integrity error appears.',
  pass_condition='A recoverable D1 point exists, the Build 240 migration is applied once after the required prior ledger keys, the complete deployment is live, all 45 gates, five packaging references, five new reusable templates and 20 manifest rows load, and no migration, Function, route or data-integrity error remains.',
  updated_at=CURRENT_TIMESTAMP
WHERE item_key='backup_migrate_deploy';

UPDATE startup_readiness_items SET
  external_location='Production domain, browser developer tools, Cloudflare Pages Functions logs, and POST_DEPLOY_SMOKE_TEST.md',
  instructions_markdown='1. Confirm the deployment ID and Build 240 migration evidence match the package that passed Deployment Preflight.
2. Open the production home, handmade-jewelry, gift-card, shop, one product detail, contact, policies, login and password-recovery pages while signed out; record HTTP and visual results.
3. Confirm the three generated WebP illustrations load at phone and desktop sizes, disclose editorial use, preserve one H1, and are absent from Product/Offer structured data and real-product galleries.
4. Sign in with an owner-controlled administrator and test Startup Readiness, Visual Image Manifest, Creative Automation Studio, Labeling & Packaging, Client Documents, Orders and the Prelaunch Operations Map.
5. In the manifest, filter open blockers, open a route, make one reversible review update, reload, and confirm database history. Test the API failure path and confirm the full 20-row Unsynced fallback remains visible with saving disabled.
6. Test safe public/API reads and confirm every failure returns structured JSON or a clearly labelled usable fallback rather than a blank page or false success.
7. At phone, tablet, laptop and wide-desktop widths, check navigation, image crops, cards, forms, tables, focus, touch targets, contrast and horizontal overflow on every changed route.
8. Confirm one H1/title/meta/canonical/structured-data behaviour on representative live public pages and verify no admin page is indexable.
9. Open Startup Readiness with All statuses, confirm 45 unique gates and locate the missing-launch-images Critical blocker.
10. Record every failed route, console error, incident ID, screenshot/evidence reference and correction owner. After any correction/redeploy, repeat all smoke checks.
11. Continue to Deploy Readiness only when every critical smoke result passes.',
  pass_condition='The exact production deployment passes all critical public, authentication, admin, API, fallback, mobile/desktop and SEO smoke checks with current evidence and no unresolved critical result.',
  updated_at=CURRENT_TIMESTAMP
WHERE item_key='post_deploy_smoke_standalone';

UPDATE startup_readiness_items SET
  external_location='Production website and the configured transactional email provider',
  instructions_markdown='1. Deploy the complete Build 240 package, hard refresh to service-worker shell v18, and record the Pages deployment ID before testing.
2. Open a private browser window, open Developer Tools → Network, enable Preserve log, and load /login/ without storing the password in evidence.
3. Open /api/auth/login in a separate tab and confirm HTTP 200 JSON reports response_profile auth_login_bounded_v1 and diagnostic_mode binding_only; a normal GET must not run full schema discovery.
4. Submit an owner-controlled administrator login and confirm POST /api/auth/login returns HTTP 200 JSON, X-DD-Auth-Profile auth_login_bounded_v1, a session cookie, the correct role and the expected redirect. Never copy the token into evidence.
5. In Cloudflare Workers & Pages → the production project → Functions/Workers Logs and Metrics, filter the login timestamp and confirm the invocation was successful with no exceededCpu, exceededMemory or 1102 outcome.
6. Confirm the redirected page calls /api/auth/me once, returns HTTP 200 JSON with response_profile auth_session_bounded_v1, and remains signed in after one normal refresh.
7. Test one deliberately wrong password and confirm HTTP 401 structured JSON AUTH_INVALID_CREDENTIALS, no redirect and no new authenticated session.
8. While a valid session exists, use browser request blocking for /api/auth/me, reload /login/, and confirm the account widget says the session was retained/verification is temporarily unavailable; local storage and cookie must not be erased by a network/503 failure. Remove the block and confirm the next verification succeeds.
9. Log out normally and verify the auth token/cookie is cleared and protected pages/APIs return a real 401 rather than continuing access.
10. Request a password reset from the public recovery page; confirm delivery, one-time use, rejection of an expired/reused link, and successful login with the new password.
11. Test Logout All Sessions in two browsers and confirm the older session receives 401 and is cleared, while a temporary 503 still does not masquerade as an invalid session.
12. Confirm a deliberately expired owner-controlled session receives 401 and a clear login path; do not wait on a real production account or alter customer sessions.
13. Record deployment ID, UTC/local timestamp, route, HTTP status, response code/profile, browser/device, Cloudflare invocation outcome and pass/fail result without passwords, cookies or tokens.
14. If any step returns 503/1102, keep this gate Failed or Blocked, capture the Cloudflare invocation outcome, redeploy/roll back as appropriate and repeat all fourteen steps from a clean private session.',
  pass_condition='Bounded login, session verification, temporary-503 retention, logout, reset, one-time token use, deliberate expiry, and logout-all work in production with no exceeded-resource outcome and no continued access after an explicit invalidation.',
  updated_at=CURRENT_TIMESTAMP
WHERE item_key='login_logout_recovery';

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO schema_migration_ledger (migration_key,file_name,applied_at,notes)
VALUES (
  'build240_operational_evidence_continuity',
  'database_build240_operational_evidence_continuity.sql',
  CURRENT_TIMESTAMP,
  'Adds twenty operational workstreams covering evidence, idempotency, packaging reservations/formula/prepress/locks, provider and notification reconciliation, mobile evidence recovery, deployed assets, product media roles, support, accounting close, controlled batch approvals, local SEO observations, public-page audits, route fallbacks, mobile operations and synchronized schema/Markdown authority.'
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,
  notes=excluded.notes;
