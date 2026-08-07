-- Devil n Dove Build 241 — CAIP private raw-media intake, resumable multipart uploads, processing plans and governed public promotion.
-- Apply once after Build 240. Back up D1 first. This migration contains no explicit transaction statements.
-- Binary originals live in a dedicated private R2 binding when configured; D1 stores metadata, upload state, rights state and evidence only.

-- Some older aggregate/fresh-install schema paths did not carry the shared media_assets table even though CAIP references it.
-- Keep the dependency migration-owned and idempotent so fresh and upgraded databases behave the same.
CREATE TABLE IF NOT EXISTS media_assets (
  media_asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  storage_provider TEXT NOT NULL DEFAULT 'r2',
  bucket_name TEXT,
  object_key TEXT NOT NULL UNIQUE,
  public_url TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  variant_role TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  annotation_notes TEXT,
  width_px INTEGER,
  height_px INTEGER,
  image_orientation TEXT,
  background_consistency_score INTEGER,
  subject_fill_score INTEGER,
  sharpness_score INTEGER,
  brightness_score INTEGER,
  contrast_score INTEGER,
  angle_group TEXT,
  shot_style TEXT,
  merchandising_score INTEGER,
  deleted_at TEXT,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_media_assets_product_id ON media_assets(product_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at);
CREATE INDEX IF NOT EXISTS idx_media_assets_sort_order ON media_assets(product_id,sort_order);

CREATE TABLE IF NOT EXISTS caip_media_intake_settings (
  caip_media_intake_setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  value_kind TEXT NOT NULL DEFAULT 'text' CHECK (value_kind IN ('text','integer','boolean','json')),
  is_secret INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  updated_by_user_id INTEGER,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS caip_media_upload_sessions (
  caip_media_upload_session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  session_key TEXT NOT NULL UNIQUE,
  session_status TEXT NOT NULL DEFAULT 'draft' CHECK (session_status IN ('draft','ready','uploading','paused','complete','failed','aborted')),
  storage_profile TEXT NOT NULL DEFAULT 'private_r2',
  object_prefix TEXT NOT NULL,
  transport_mode TEXT NOT NULL DEFAULT 'worker_streamed_multipart_v1',
  preferred_direct_transport TEXT NOT NULL DEFAULT 'direct_s3_presigned_multipart_future',
  part_size_bytes INTEGER NOT NULL DEFAULT 33554432,
  parallel_parts INTEGER NOT NULL DEFAULT 2,
  upload_device TEXT,
  source_note TEXT,
  total_files INTEGER NOT NULL DEFAULT 0,
  total_bytes INTEGER NOT NULL DEFAULT 0,
  uploaded_bytes INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  FOREIGN KEY(creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_caip_media_sessions_project ON caip_media_upload_sessions(creative_project_id,session_status,created_at DESC);

CREATE TABLE IF NOT EXISTS caip_media_upload_files (
  caip_media_upload_file_id INTEGER PRIMARY KEY AUTOINCREMENT,
  caip_media_upload_session_id INTEGER NOT NULL,
  creative_project_id INTEGER NOT NULL,
  client_file_key TEXT NOT NULL,
  file_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  mime_type TEXT,
  media_type TEXT NOT NULL DEFAULT 'other' CHECK (media_type IN ('image','video','audio','other')),
  media_role TEXT NOT NULL DEFAULT 'miscellaneous',
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  last_modified_ms INTEGER,
  capture_at TEXT,
  upload_device TEXT,
  upload_status TEXT NOT NULL DEFAULT 'waiting' CHECK (upload_status IN ('waiting','initiating','uploading','paused','uploaded','failed','aborted','archived')),
  storage_provider TEXT NOT NULL DEFAULT 'r2_private_caip',
  bucket_alias TEXT NOT NULL DEFAULT 'CAIP_PRIVATE_MEDIA_BUCKET',
  object_key TEXT NOT NULL UNIQUE,
  r2_upload_id TEXT,
  part_size_bytes INTEGER NOT NULL DEFAULT 33554432,
  expected_parts INTEGER NOT NULL DEFAULT 0,
  uploaded_parts INTEGER NOT NULL DEFAULT 0,
  uploaded_bytes INTEGER NOT NULL DEFAULT 0,
  etag TEXT,
  file_fingerprint TEXT,
  checksum_algorithm TEXT,
  checksum_value TEXT,
  checksum_status TEXT NOT NULL DEFAULT 'pending' CHECK (checksum_status IN ('pending','client_supplied','verified','mismatch','not_available')),
  privacy_state TEXT NOT NULL DEFAULT 'private' CHECK (privacy_state IN ('private','internal_review','public_candidate','public_approved','blocked')),
  consent_state TEXT NOT NULL DEFAULT 'not_applicable' CHECK (consent_state IN ('not_applicable','unknown','internal_only','public_allowed','revoked','blocked')),
  rights_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (rights_status IN ('needs_review','internal_only','public_allowed','blocked')),
  creative_asset_id INTEGER,
  last_error TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  initiated_at TEXT,
  uploaded_at TEXT,
  aborted_at TEXT,
  UNIQUE(caip_media_upload_session_id,client_file_key),
  FOREIGN KEY(caip_media_upload_session_id) REFERENCES caip_media_upload_sessions(caip_media_upload_session_id) ON DELETE CASCADE,
  FOREIGN KEY(creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY(creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_caip_media_files_session ON caip_media_upload_files(caip_media_upload_session_id,upload_status,caip_media_upload_file_id);
CREATE INDEX IF NOT EXISTS idx_caip_media_files_project ON caip_media_upload_files(creative_project_id,privacy_state,rights_status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_caip_media_files_fingerprint ON caip_media_upload_files(file_fingerprint,file_size_bytes,upload_status);

CREATE TABLE IF NOT EXISTS caip_media_upload_parts (
  caip_media_upload_part_id INTEGER PRIMARY KEY AUTOINCREMENT,
  caip_media_upload_file_id INTEGER NOT NULL,
  part_number INTEGER NOT NULL,
  byte_start INTEGER NOT NULL DEFAULT 0,
  byte_end INTEGER NOT NULL DEFAULT 0,
  part_size_bytes INTEGER NOT NULL DEFAULT 0,
  part_status TEXT NOT NULL DEFAULT 'waiting' CHECK (part_status IN ('waiting','uploading','uploaded','failed','aborted')),
  etag TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  uploaded_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(caip_media_upload_file_id,part_number),
  FOREIGN KEY(caip_media_upload_file_id) REFERENCES caip_media_upload_files(caip_media_upload_file_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_caip_media_parts_file ON caip_media_upload_parts(caip_media_upload_file_id,part_status,part_number);

CREATE TABLE IF NOT EXISTS caip_media_processing_jobs (
  caip_media_processing_job_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER NOT NULL,
  caip_media_upload_file_id INTEGER,
  job_key TEXT NOT NULL UNIQUE,
  job_type TEXT NOT NULL CHECK (job_type IN ('metadata','proxy_video','thumbnail','frame_extract','audio_extract','transcript','story_analysis','derivative_plan')),
  job_status TEXT NOT NULL DEFAULT 'planned' CHECK (job_status IN ('planned','queued','running','complete','failed','blocked','cancelled')),
  provider_key TEXT NOT NULL DEFAULT 'not_configured',
  input_object_key TEXT,
  output_prefix TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  result_json TEXT NOT NULL DEFAULT '{}',
  last_error TEXT,
  requested_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  completed_at TEXT,
  FOREIGN KEY(creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY(creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE,
  FOREIGN KEY(caip_media_upload_file_id) REFERENCES caip_media_upload_files(caip_media_upload_file_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_caip_media_processing_project ON caip_media_processing_jobs(creative_project_id,job_status,job_type,created_at DESC);

CREATE TABLE IF NOT EXISTS caip_media_public_promotion_requests (
  caip_media_public_promotion_request_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER NOT NULL,
  caip_media_upload_file_id INTEGER,
  request_key TEXT NOT NULL UNIQUE,
  destination_role TEXT NOT NULL DEFAULT 'website_gallery',
  request_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (request_status IN ('needs_review','approved','rejected','promoted','failed','revoked')),
  private_object_key TEXT NOT NULL,
  target_public_bucket_alias TEXT NOT NULL DEFAULT 'PRODUCT_MEDIA_BUCKET',
  target_public_object_key TEXT,
  target_public_url TEXT,
  rights_status_snapshot TEXT NOT NULL,
  consent_state_snapshot TEXT NOT NULL,
  privacy_state_snapshot TEXT NOT NULL,
  evidence_json TEXT NOT NULL DEFAULT '{}',
  requested_by_user_id INTEGER,
  reviewed_by_user_id INTEGER,
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  promoted_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY(creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE,
  FOREIGN KEY(caip_media_upload_file_id) REFERENCES caip_media_upload_files(caip_media_upload_file_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_caip_media_promotion_status ON caip_media_public_promotion_requests(creative_project_id,request_status,requested_at DESC);

INSERT INTO caip_media_intake_settings(setting_key,setting_value,value_kind,is_secret,notes,updated_at) VALUES
('private_bucket_binding','CAIP_PRIVATE_MEDIA_BUCKET','text',0,'Dedicated private R2 binding for raw CAIP project media. Do not attach a public domain or r2.dev URL.',CURRENT_TIMESTAMP),
('public_bucket_binding','PRODUCT_MEDIA_BUCKET','text',0,'Existing public/approved media bucket binding. Only reviewed public promotion may target it.',CURRENT_TIMESTAMP),
('default_part_size_bytes','33554432','integer',0,'32 MiB parts keep the Worker-streamed fallback comfortably below common request-body ceilings while satisfying R2 multipart minimums.',CURRENT_TIMESTAMP),
('default_parallel_parts','2','integer',0,'Conservative parallelism for home Wi-Fi and mobile connections.',CURRENT_TIMESTAMP),
('current_transport_mode','worker_streamed_multipart_v1','text',0,'Build 241 implementation streams one bounded multipart part per authenticated request into the private R2 binding.',CURRENT_TIMESTAMP),
('preferred_future_transport','direct_s3_presigned_multipart','text',0,'Future adapter: browser-to-R2 S3 multipart with short-lived scoped signing; credentials must remain server-side.',CURRENT_TIMESTAMP),
('raw_original_policy','immutable','text',0,'Uploaded raw originals are never overwritten. Corrections and edits create separate derived objects.',CURRENT_TIMESTAMP)
ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,value_kind=excluded.value_kind,is_secret=excluded.is_secret,notes=excluded.notes,updated_at=CURRENT_TIMESTAMP;

INSERT INTO creative_provider_profiles(provider_key,display_name,capability_key,lifecycle_status,endpoint_policy,config_redacted_json,consent_required,default_budget_cap_cents,created_at,updated_at)
VALUES
('caip_private_r2_multipart','CAIP private R2 multipart intake','private_media_upload','enabled_when_bound','CAIP_PRIVATE_MEDIA_BUCKET binding required','{"transport":"worker_streamed_multipart_v1","part_bytes":33554432,"public":false}',1,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('caip_direct_s3_multipart','CAIP direct S3 multipart intake','private_media_upload','planned','short-lived scoped signing adapter not yet configured','{"transport":"direct_s3_presigned_multipart","public":false}',1,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('caip_proxy_builder','CAIP proxy-video builder','proxy_video','disabled','provider not configured','{}',1,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('caip_transcript_builder','CAIP transcript builder','transcript','disabled','provider not configured','{}',1,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT(provider_key) DO UPDATE SET display_name=excluded.display_name,capability_key=excluded.capability_key,endpoint_policy=excluded.endpoint_policy,config_redacted_json=excluded.config_redacted_json,consent_required=excluded.consent_required,updated_at=CURRENT_TIMESTAMP;

INSERT INTO operational_workstreams(workstream_key,workstream_title,workstream_group,workstream_status,priority,destination_path,completion_rule,sort_order,is_active,created_at,updated_at)
VALUES('caip_large_media_intake','CAIP private large-media intake and recovery','Creative / media','ready_to_test','P1','/admin/creative-assets/','Private raw media uses a dedicated R2 binding; interrupted multipart uploads resume from recorded parts; completed files become internal-only CAIP assets; raw originals remain immutable; public promotion remains review/consent gated.',205,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT(workstream_key) DO UPDATE SET workstream_title=excluded.workstream_title,workstream_group=excluded.workstream_group,priority=excluded.priority,destination_path=excluded.destination_path,completion_rule=excluded.completion_rule,is_active=1,updated_at=CURRENT_TIMESTAMP;

-- Build 241 Startup metadata refresh BEGIN
INSERT INTO startup_readiness_items(
  item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,
  target_route,external_location,instructions_markdown,pass_condition,is_active
) VALUES
('deployment_preflight_standalone','foundation','Foundation and deployment','Complete Deployment Preflight as a standalone pre-deploy process',5,'critical',1,0,'/admin/deployment-preflight/','Build 241 archive, current schema/migration files, Cloudflare Pages Functions bundler, and PRELAUNCH_PROCESS_PLAYBOOKS.md','1. Open the Prelaunch Operations Map and confirm Deployment Preflight is stage 2, before Safe Deploy, live smoke tests, Deploy Readiness, and Go-Live Execution.
2. Run the static predeploy, deployment-preflight, final-blocker, JavaScript syntax, Build 231 autosave/reload regression, Build 232 archived-product removal regression, Build 233 bounded-login/session-retention regression, Build 234 packaging/template/duplicate-cleanup regression, Build 241 CAIP large-media regression, aggregate-schema, repeated-current-migration, Startup 46-gate, image-manifest seed/provenance, packaging-reference checksum, and Cloudflare Pages Functions bundle checks against the exact archive to deploy.
3. Confirm all public HTML pages have a viewport, distinctive title, useful meta description, one H1, crawlable canonical where applicable, valid structured data, and descriptive image alternative text.
4. Confirm CSS braces balance and review phone, tablet, laptop, and wide-desktop overflow for every changed interface, especially Login, Product Editor, Product Cleanup, Visual Image Manifest, Labeling & Packaging, Creative Automation and three public image bands.
5. Confirm database_upgrade_current_pass.sql remains identical to database_build241_caip_large_media_intake.sql and the Build 241 migration contains no explicit BEGIN, COMMIT, SAVEPOINT, RELEASE or ROLLBACK statement.
6. Confirm AI_HANDOFF.md, PROJECT_STATUS_AND_ROADMAP.md, schema references, release notes, changed files and validation identify Build 241 consistently while naming Build 241 as the current D1 migration.
7. Confirm the five adopted packaging source files still match PACKAGING_REFERENCE_BASELINE.md and the three generated editorial assets match GENERATED_VISUAL_ASSET_REGISTER.md; generated art must not appear in Product/Offer structured data.
8. Confirm the image manifest contains 20 active seed rows, the three generated rows retain provenance, and real-photo requirements cannot be passed by generated imagery.
9. Save the exact archive name, SHA-256, check results and unresolved warnings. Do not proceed when any blocker remains.
10. If a check fails, correct the owning source file rather than editing only generated output; rerun the entire preflight from the beginning.','The exact Build 241 archive passes every static, bounded-login/session-retention, autosave/reload, archived-product removal, schema, syntax, CSS, one-H1, metadata, image-manifest, fallback, packaging-reference, documentation and Pages Functions bundle check with zero unresolved blocker.',1),
('backup_migrate_deploy','foundation','Foundation and deployment','Back up D1, apply the current migration, and deploy the complete build',10,'critical',1,1,'/admin/deployment-preflight/','Cloudflare Dashboard → Workers & Pages → D1 and Pages deployments','1. Open Cloudflare D1 and record the current Time Travel bookmark or approved recovery point before changing the schema.
2. Record the date, database name and safe recovery reference in the evidence notes.
3. Confirm required prior ledger keys through build240_operational_evidence_continuity already exist, including Build 234 packaging and Build 240 continuity, then apply database_build241_caip_large_media_intake.sql or the identical database_upgrade_current_pass.sql, but not both.
4. Confirm the ledger records build241_caip_large_media_intake; verify twenty-one workstreams, 46 Startup gates, 36 Build 241 page audits, seven mobile cards, two fallback policies, the CAIP private-media workstream, the retained packaging references/templates and unchanged mutable evidence.
5. Deploy the complete ZIP rather than selected files.
6. Record the Pages deployment URL and deployment/commit identifier.
7. Open Startup Readiness with All statuses and confirm all 46 gates load without removing prior owner, evidence or history records; explicitly locate missing_launch_images, candle_top_template_proof and operational_continuity_evidence_center and caip_private_large_media_intake and open their operating routes.
8. Confirm the manifest loads from D1 rather than Unsynced fallback and preserves the three generated-editorial provenance rows.
9. Continue to the standalone Post-Deploy Smoke Tests; do not treat successful upload as a passed live deployment.
10. Stop and restore the previous deployment or D1 recovery point if any critical migration, Function, route or data-integrity error appears.','A recoverable D1 point exists, the Build 241 migration is applied once after the required prior ledger keys, the complete deployment is live, all 46 gates, five packaging references, five new reusable templates and 20 manifest rows load, and no migration, Function, route or data-integrity error remains.',1),
('post_deploy_smoke_standalone','foundation','Foundation and deployment','Complete Post-Deploy Smoke Tests as a standalone live-verification process',15,'critical',1,1,'/admin/post-deploy-smoke-tests/','Production domain, browser developer tools, Cloudflare Pages Functions logs, and POST_DEPLOY_SMOKE_TEST.md','1. Confirm the deployment ID and Build 241 migration evidence match the package that passed Deployment Preflight.
2. Open the production home, handmade-jewelry, gift-card, shop, one product detail, contact, policies, login and password-recovery pages while signed out; record HTTP and visual results.
3. Confirm the three generated WebP illustrations load at phone and desktop sizes, disclose editorial use, preserve one H1, and are absent from Product/Offer structured data and real-product galleries.
4. Sign in with an owner-controlled administrator and test Startup Readiness, Visual Image Manifest, Creative Automation Studio, Labeling & Packaging, Client Documents, Orders and the Prelaunch Operations Map.
5. In the manifest, filter open blockers, open a route, make one reversible review update, reload, and confirm database history. Test the API failure path and confirm the full 20-row Unsynced fallback remains visible with saving disabled.
6. Test safe public/API reads and confirm every failure returns structured JSON or a clearly labelled usable fallback rather than a blank page or false success.
7. At phone, tablet, laptop and wide-desktop widths, check navigation, image crops, cards, forms, tables, focus, touch targets, contrast and horizontal overflow on every changed route.
8. Confirm one H1/title/meta/canonical/structured-data behaviour on representative live public pages and verify no admin page is indexable.
9. Open Startup Readiness with All statuses, confirm 46 unique gates and locate the missing-launch-images Critical blocker.
10. Record every failed route, console error, incident ID, screenshot/evidence reference and correction owner. After any correction/redeploy, repeat all smoke checks.
11. Continue to Deploy Readiness only when every critical smoke result passes.','The exact production deployment passes all critical public, authentication, admin, API, fallback, mobile/desktop and SEO smoke checks with current evidence and no unresolved critical result.',1),
('production_bindings_secrets','foundation','Foundation and deployment','Verify production bindings, secrets, domains, and environment separation',20,'critical',1,1,'/admin/deployment-preflight/','Cloudflare Pages project → Settings → Variables and Bindings; custom domains; D1/R2 bindings','1. Confirm the production Pages project is connected to the intended D1 database and R2 buckets.
2. Confirm every required secret exists in Production, not only Preview.
3. Check payment, email, OAuth, admin-bootstrap, analytics, and storage variables against CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md.
4. Confirm preview/test credentials are not used in production and production credentials are not committed to the repository.
5. Confirm devilndove.com and any www redirect resolve to the production deployment with valid HTTPS.
6. Test one read and one safe write against each required binding.
7. Record only variable names and test results; never paste secret values into evidence.','The production domain, D1, R2, payment, email, and required application bindings are present in the correct environment and pass safe connectivity checks without exposing secrets.',1),
('login_logout_recovery','access','Access, security, and recovery','Prove production login, logout, session expiry, and password recovery',30,'critical',1,1,'/login/','Production website and the configured transactional email provider','1. Deploy the complete Build 241 package, hard refresh to service-worker shell v19, and record the Pages deployment ID before testing.
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
14. If any step returns 503/1102, keep this gate Failed or Blocked, capture the Cloudflare invocation outcome, redeploy/roll back as appropriate and repeat all fourteen steps from a clean private session.','Bounded login, session verification, temporary-503 retention, logout, reset, one-time token use, deliberate expiry, and logout-all work in production with no exceeded-resource outcome and no continued access after an explicit invalidation.',1),
('role_authorization','access','Access, security, and recovery','Verify server-side authorization for destructive, financial, and approval actions',40,'critical',1,1,'/admin/members/','Production admin APIs and role test accounts','1. Prepare an administrator account and at least one lower-privilege test account.
2. Test inventory reversal, label approval, accounting export, member administration, publication approval and permanent product deletion with the lower role; confirm every direct API call returns 401 or 403 even if a button is hidden.
3. As an administrator, create an owner-controlled disposable Draft product with no order, payment, customer, packaging or creative-project history; record its ID and System #.
4. Archive that disposable product, open /admin/products/ → Draft & Archive Cleanup → Archived, select Check removal, and confirm /api/admin/delete-product?product_id=<ID> returns HTTP 200 JSON with cleanup_profile bounded_registry_v1.
5. Confirm archive status and its ordinary editor/media audit alone do not block removal; the preflight must say Removal allowed unless a genuine protected reference exists.
6. For a second owner-controlled product that has an order, packaging project, creative project or other protected history, repeat Check removal and confirm Archive only lists the blocking table/count and Permanent remove stays disabled. Never delete that history-backed product.
7. On the disposable product, link one safe test supply and reserve one unit. Open Correct / return raw inventory, confirm the suggested release never exceeds Reserved, leave physical return at zero unless stock was truly put back, and enter a factual reason.
8. Select Delete unused product and apply reviewed inventory actions, type DELETE PRODUCT exactly, confirm the current admin password and verify one success response.
9. Confirm the product row is gone, its System # was not reused, Reserved changed exactly once, On hand did not change for reservation release, and product deletion/material-return/admin audit evidence identifies the actor, product, reason and time.
10. Repeat the protected-history check after the deletion test and confirm it remains archived and unchanged.
11. In Cloudflare Functions metrics/logs, confirm product-removal GET/POST returned valid JSON and produced no exceededCpu, exceededMemory, raw HTML or JSON.parse error.
12. Retest the other sensitive administrator actions, remove or disable temporary accounts, and reconcile or remove only the owner-controlled disposable records.','Every sensitive action is enforced on the server; lower roles receive 401/403; an unused archived product passes the bounded preflight and is removed with its reviewed inventory action exactly once; protected-history products remain archived; and successful actions are attributable in audit history without a Worker resource-limit event.',1),
('runtime_incident_fallback','access','Access, security, and recovery','Prove runtime incident capture and honest fallback behaviour',50,'high',1,1,'/admin/runtime-incidents/','Production Pages Functions logs and runtime incident records','1. Use a safe test condition that causes a non-destructive optional API failure, such as an unavailable optional table in a preview environment.
2. Confirm the API returns structured JSON with a useful status code and plain-language error.
3. In /admin/catalog/, load an owner-controlled Draft product, change its short description, wait at least three seconds and confirm Draft autosave reports a saved product ID/time.
4. Reload the same product and confirm it loads without a JSON.parse error and contains the saved value.
5. Throttle the browser network, edit the draft during an in-flight autosave and confirm the newer edit is queued, saved next and remains after reload.
6. Block the update request or go temporarily offline, edit again and confirm the browser offers Recover browser copy without showing raw Cloudflare HTML/CSS or claiming D1 saved it.
7. Restore connectivity, recover the copy, select Autosave now, reload and confirm the recovered value is authoritative in D1.
8. In Cloudflare Workers & Pages metrics/logs, check the matching product-detail/create/update invocations for exceededCpu, exceededMemory and cf-error-type 1102. Record only timestamp, route, outcome, CPU/wall time and non-secret IDs. A platform-terminated Worker may be unable to write its own runtime incident, so Cloudflare logs are required evidence.
9. Confirm an ordinary application exception still records scope, code, severity, user/request context and sanitized detail in /admin/runtime-incidents/.
10. Restore the optional dependency and verify the normal path recovers; also review offline.html and low-bandwidth media fallback.
11. After any code, deployment, plan/limit or schema change, repeat steps 3–10 before marking this gate Complete.','Expected failures are visible, sanitized and recoverable; product reload/autosave preserves the newest edit without raw HTML or JSON.parse text; the controlled run adds no exceeded-resource event; and fallback states never present a browser copy as an authoritative save.',1),
('launch_product_list','catalog','Catalog, product facts, and media','Choose a small opening-day product list and freeze its launch scope',60,'critical',1,0,'/admin/products/','Internal operating decision','1. Select a deliberately small group of products that can be physically counted, photographed, packaged, and fulfilled now.
2. Exclude experimental, incomplete, duplicate, content-only, or uncertain products from the launch group.
3. Record the product IDs, names, SKUs, and intended sale channels.
4. Confirm every selected item has an owner responsible for facts, media, inventory, packaging, and final review.
5. Keep other products in Draft or Archived while the site opens.
6. Revisit the launch group only through a deliberate review so the finish line does not keep moving.','A finite opening-day product list is recorded, owned, and protected from unrelated draft work.',1),
('product_detail_gallery','catalog','Catalog, product facts, and media','Verify every launch product View link, detail page, and seven-image gallery',70,'critical',1,1,'/shop/','Public shop and /api/product-detail?slug=<slug>','1. Open the public Shop in a private browser window.
2. Select View on every launch product card.
3. Confirm the URL contains the correct slug and the detail endpoint returns HTTP 200 with ok:true.
4. Confirm name, price, description, SKU, availability, shipping information, and calls to action match the admin record.
5. For products with seven approved images, confirm seven unique thumbnails appear and each changes the main image, alternative text, caption, and image counter.
6. Confirm blocked or consent-needed images remain excluded for a documented reason.
7. Test direct loading, browser refresh, copied link, mobile view, and the public catalog fallback.
8. Record every product that returns fewer images or stale facts and correct it in Catalog Media or Products.','Every launch product opens from its card, returns current facts, and displays all approved unique storefront images without broken routes or stale fallback content.',1),
('product_facts_preflight','catalog','Catalog, product facts, and media','Complete Product Release Preflight for every launch product',80,'critical',1,0,'/admin/release-preflight/','Devil n Dove Product Release Preflight','1. Filter Product Release Preflight to the opening-day product list.
2. Resolve required name, slug, SKU, price, category, description, quantity, dimensions, weight, shipping, tax, care, condition, and sale-channel facts.
3. Confirm quantity pricing and set components where applicable.
4. Resolve every blocking media, consent, packaging, content, or inventory warning.
5. Open the public detail page after each important correction.
6. Record any warning intentionally accepted, who accepted it, and why.
7. Do not publish a product merely because a percentage score looks high; manually review the final buyer view.','Every opening-day product is green for required preflight checks and has a final human review of the public page.',1),
('catalog_media_rights','catalog','Catalog, product facts, and media','Finish product media, rights, roles, alt text, and R2 delivery',90,'critical',1,1,'/admin/catalog-media/','Catalog Media, R2 object delivery, and public product pages','1. Assign one featured image and up to six supporting images to each launch product.
2. Set image role, display order, concise descriptive alt text, caption where useful, and public-use status.
3. Confirm ownership or consent and keep blocked/consent-needed media out of public responses.
4. Verify full, thumbnail, WebP, and AVIF derivatives where configured.
5. Test image loading on a normal desktop connection and a throttled mobile connection.
6. Confirm image URLs do not expose private object paths or require an expired signed URL for public catalog media.
7. Replace every launch-product placeholder or broken image with approved real media.','Every launch product has an approved featured image, supporting media where available, documented rights, useful alt text, and reliable public delivery.',1),
('missing_launch_images','catalog','Catalog, product facts, and media','Replace every missing, broken, fallback, or placeholder launch image',95,'critical',1,1,'/admin/image-manifest/','Database Visual Image Manifest, IMAGES_REQUIRED.md capture guide, Catalog Media, R2, and every public launch product, service, local, category, and social-preview route','1. Open Visual Image Manifest and confirm the green Database status authority banner, 20 active seed rows, three generated-editorial provenance rows, and visible open-launch-blocker count. If Unsynced fallback appears, apply Build 230 and repair the API before continuing.
2. Open IMAGES_REQUIRED.md from the manifest for capture standards, then freeze the opening-day product list and create item-specific Catalog Media records for every launch product.
3. Filter Open launch blockers only. Assign each item an owner and open its page; do not approve from the thumbnail alone.
4. At narrow-phone, tablet, desktop and wide-desktop widths, check source HTTP status, crop, distortion, overlap, layout shift, repeated-image substitution, intrinsic dimensions, slow/offline fallback and whether the alternative text describes the actual image.
5. For real_photo_required rows, photograph the actual current product, process, condition, location or packaging. Generated or stock-looking artwork cannot pass these rows.
6. For editorial_illustration_allowed rows, confirm the page discloses illustration where necessary, does not imply actual inventory, and excludes the asset from Product/Offer schema and real-product galleries.
7. Confirm ownership, model/property consent, product accuracy, privacy and public-use permission. Keep needs-review or blocked media out of public release surfaces.
8. Upload approved originals through R2/Catalog Media where applicable; create responsive derivatives; save the final root-relative or HTTPS URL and useful alt text.
9. Save rights, public-use, phone and desktop results plus evidence URL and a plain-language change note. Approval is rejected until all required fields pass. Reload and confirm the change appears in manifest history.
10. Inspect Open Graph, Organization/LocalBusiness/Product structured data, feeds, social queues and scheduled content so no planning placeholder or generated product proof represents a launch item.
11. Repeat the open-blocker filter. Keep this Startup gate Failed or Blocked while any required row or item-specific launch-product role is missing, misleading, rights-unclear, placeholder-based, device-failed or absent from saved evidence.
12. Reopen this gate after any launch-product, route, crop, asset, rights, schema, social-preview or public-use change.','The D1 Visual Image Manifest and item-specific Catalog Media evidence show approved, accurate, rights-cleared responsive final imagery for every launch product and indexable launch route; no required real-photo row is passed with generated art; no missing, broken, fallback, duplicate substitute or planning placeholder remains; and phone/desktop review history is complete.',1),
('pricing_quantity_sets','commerce','Pricing, inventory, and checkout','Verify base prices, quantity specials, sets, coupons, and gift-card interactions',100,'critical',1,1,'/admin/products/','Public product detail, cart, checkout, and payment total','1. For each launch product, compare the stored base price with the public detail page, cart, checkout, and payment provider.
2. Test every quantity breakpoint using the exact threshold, one below, and one above.
3. Confirm the per-unit price never increases unexpectedly at a higher advertised tier.
4. For sets, confirm component quantities and requested reserved-set quantity are correct.
5. Test coupon and gift-card combinations only if those features are publicly displayed.
6. Confirm discounts cannot reduce a price below an approved floor or create a negative total.
7. Verify the server recalculates all totals and ignores browser-edited values.
8. Record screenshots or order IDs for each scenario.','Displayed and server-calculated prices, discounts, quantity tiers, sets, and final payment totals match approved business rules.',1),
('inventory_regular_exact_once','commerce','Pricing, inventory, and checkout','Prove exact-once inventory settlement for regular products',110,'critical',1,1,'/admin/orders/','Production checkout, Stripe webhook events, orders, and inventory movements','1. Record the starting inventory of a safe test product.
2. Complete one paid production order for one unit.
3. Confirm inventory is consumed only after the approved payment event and exactly one movement is recorded.
4. Replay or resend the same webhook event and confirm no second consumption occurs.
5. Attempt a failed and an expired checkout and confirm no permanent consumption remains.
6. Compare order quantity, inventory movement, on-hand quantity, and audit history.
7. Use a compensating correction only through the reviewed inventory workflow if the test exposes a defect.','A successful payment consumes the correct quantity once, retries are idempotent, and failed or expired payment attempts do not leave stock consumed.',1),
('inventory_sets_concurrency','commerce','Pricing, inventory, and checkout','Prove component-set reservation, zero availability, and final-unit concurrency',120,'critical',1,1,'/admin/products/','Production set product, component products, simultaneous checkout sessions','1. Create or use a safe set with known component quantities and a small temporary stock level.
2. Confirm the set availability equals the lowest whole number of complete component sets.
3. Confirm reserved components reduce the individual component availability shown publicly.
4. Reduce one component below the required quantity and confirm the set shows zero available.
5. Restore stock through a reviewed movement, not a direct database edit.
6. Open two private browser sessions and attempt to buy the final available set or final one-of-a-kind item at nearly the same time.
7. Confirm only one checkout can settle and the other receives a clear unavailable result.
8. Confirm cancellation/refund restores both set and component availability exactly once.','Set availability is component-limited, reservations are visible, zero availability is enforced, and simultaneous final-unit attempts cannot oversell.',1),
('purchase_lots_costs','commerce','Pricing, inventory, and checkout','Reconcile tools, supplies, purchase lots, dates, and actual costs',130,'high',1,0,'/admin/inventory-operations/','Amazon order history, supplier invoices, and physical stock count','1. Open Tools & Supplies and choose Lots for each launch material.
2. Enter each separate purchase with purchase/received date, supplier, order number, ASIN or supplier SKU, quantity, unit cost, allocated tax/shipping, storage location, and expiry where applicable.
3. Keep goat milk bases, oils, mica, coloured bases, fragrance, packaging, and other batches separate when traceability matters.
4. Compare total lot remaining with the main on-hand quantity.
5. Physically count the material before applying a lot total to main inventory.
6. Use the review and APPLY LOT TOTAL confirmation rather than editing D1 directly.
7. Record quarantine, expiry, return, or consumed status accurately.
8. Verify project and product costing uses reviewed costs rather than a stale default.','Every launch material has traceable purchase evidence, physical quantity, lot status, and a reviewed cost suitable for margin calculation.',1),
('tax_scenarios','commerce','Pricing, inventory, and checkout','Verify Canadian tax scenarios and refund tax calculations',140,'critical',1,1,'/checkout/','Production checkout, payment provider, and accountant-reviewed tax settings','1. Confirm the business tax-registration status and effective date with the owner/accountant.
2. Test an Ontario shipping address and every other province or territory the store accepts.
3. Test local pickup if enabled.
4. Confirm tax treatment for physical goods, digital items, shipping charges, discounts, gift cards, and refunds.
5. Compare the public checkout total, payment-provider amount, stored order tax, and accounting journal.
6. Confirm unsupported destinations are rejected before payment.
7. Save scenario evidence and the business rule used; do not rely only on a browser display.','Every accepted destination and product type produces the reviewed tax result, and refunds reverse the correct tax amount.',1),
('shipping_pickup','commerce','Pricing, inventory, and checkout','Verify shipping destinations, rates, pickup, packaging, and fulfilment promises',150,'critical',1,1,'/pickup/','Checkout, carrier or shipping-rate source, packing materials, and public policies','1. List the destinations the business can actually fulfil at launch.
2. Test Ontario, another supported province, PO box handling, and US/international only when intentionally enabled.
3. Confirm package weight and dimensions for each launch-product family.
4. Compare checkout rates with the expected carrier or flat-rate policy.
5. Test local pickup instructions, pickup timing, contact details, and tax treatment.
6. Confirm free-shipping thresholds and surcharges cannot be bypassed through quantity or discount combinations.
7. Perform one physical pack test and verify the product is protected by the materials included in its cost.
8. Ensure policy text matches actual operating practice.','Every accepted address can be fulfilled at the displayed cost and timeframe, pickup instructions are accurate, and physical packaging protects the product.',1),
('stripe_live_webhook','payments','Payments, refunds, and financial controls','Complete Stripe live capture, signed webhook, and idempotency proof',160,'critical',1,1,'/admin/webhook-events/','Stripe Dashboard → Developers → Webhooks and production payment settings','1. Confirm live Stripe keys and the production webhook signing secret are stored in Production secrets.
2. Confirm the public webhook endpoint and subscribed event types match the application.
3. Place one low-value real order with an owner-controlled payment method.
4. Confirm the payment amount, currency, order ID, customer details, and settlement status.
5. Confirm the webhook signature is verified before any state change.
6. Resend the same event and confirm the event ID is not applied twice.
7. Test a failed payment, expired checkout, and customer cancellation.
8. Record Stripe event IDs and order IDs, never secret values or full card data.','A live payment settles once, its signed webhook is verified, duplicate delivery has no duplicate effect, and failed/cancelled sessions remain recoverable.',1),
('refund_restore','payments','Payments, refunds, and financial controls','Prove cancellation, partial/full refund, and inventory restoration',170,'critical',1,1,'/admin/orders/','Order management, payment provider, inventory movements, and accounting records','1. Use a separate paid rehearsal order after the successful-payment test.
2. Cancel before fulfilment and confirm the order status, payment state, and inventory restoration.
3. Test a full refund and, if supported publicly, a partial refund.
4. Confirm each refund creates one provider action, one order history event, one inventory restoration where appropriate, and balanced accounting entries.
5. Replay the refund webhook and confirm no second restoration or refund record occurs.
6. Confirm non-restockable or partially fulfilled items require an explicit reviewed decision.
7. Check the customer-facing refund communication.','Cancellation and refund actions are idempotent, financially traceable, communicate clearly, and restore only the inventory that should return to sale.',1),
('paypal_visibility','payments','Payments, refunds, and financial controls','Make PayPal fully operational or completely hide it',180,'critical',1,1,'/checkout/','PayPal developer/live account and production callback settings','1. Inspect checkout, footer, payment options, public policies, email templates, admin screens, and documentation for PayPal references.
2. In Cloudflare Production secrets, confirm the intended PayPal environment, client ID, secret, webhook identity, callback/return URLs, and currency without recording secret values.
3. If live credentials, callbacks, capture, cancellation, signed webhook, idempotency, and refund paths are not proven, remove or hide PayPal from all public surfaces.
4. If PayPal will launch, use a low-value owner-controlled transaction to test approval, capture, cancellation, duplicate webhook delivery, and full refund.
5. Compare the PayPal transaction, stored payment/order, tax, inventory, customer notice and accounting records.
6. Confirm the displayed provider status never claims connected based only on a client ID or browser-side setting.
7. Keep manual payment records clearly separate from provider-confirmed payments and record the provider transaction/event IDs as evidence.
8. Record the explicit launch/hide decision, owner, date, and next review date.','Customers either receive a completely working PayPal option or see no PayPal option or promise anywhere on the live site.',1),
('accounting_tax_reporting','payments','Payments, refunds, and financial controls','Verify bookkeeping, payment application, HST/GST review, and export controls',190,'high',1,0,'/admin/accounting/','Accountant-reviewed chart of accounts, tax settings, and export process','1. Confirm sales, tax, shipping, discounts, payment fees, refunds, inventory, cost of goods, and gift-card liabilities map to the intended accounts.
2. Confirm paid orders can be applied to receivables and provider settlements without duplicate journals.
3. Review HST/GST reporting fields and opening balances with the accountant.
4. Test an accountant export with a safe date range and confirm lower roles cannot run it.
5. Confirm month-end lock/reopen controls or document the temporary manual procedure.
6. Record unresolved accounting limitations in the operating checklist before launch volume increases.','Opening transactions can be reconciled and exported accurately, sensitive exports are authorized, and any temporary manual accounting controls are documented.',1),
('transactional_email','communications','Customer communication and policies','Verify every required transactional email and failure path',200,'critical',1,1,'/admin/live-ops-followthrough/','Configured email provider, Gmail, Outlook, and mobile inboxes','1. Test registration or welcome, password reset, order confirmation, payment receipt, cancellation, refund, fulfilment/shipping, pickup, and review request when enabled.
2. Send only to owner-controlled test addresses.
3. Check Gmail, Outlook, and a mobile mail application.
4. Confirm sender name, reply-to, domain authentication, links, order facts, plain-text fallback, and unsubscribe requirements for non-transactional mail.
5. Trigger a safe provider failure and confirm it is visible in logs or an admin retry queue.
6. Confirm no secret, internal note, or unrelated customer data appears in the message.
7. Save provider message IDs or screenshots as evidence.','Essential messages arrive with correct facts and links, failures are observable, and a safe resend or support path exists.',1),
('customer_support_contact','communications','Customer communication and policies','Verify contact, custom request, order-help, and customer-service response paths',210,'high',1,1,'/contact/','Public contact/custom-request forms and owner-controlled inbox','1. Submit the public contact form and any enabled custom-request form from a private browser.
2. Confirm required consent, spam protection, validation, acknowledgement, and admin visibility.
3. Ask a product, shipping, pickup, return, and custom-order question using test data.
4. Confirm the message reaches the correct owner inbox or admin queue with a useful reference.
5. Verify a customer can find order-help instructions without entering admin areas.
6. Confirm response-time promises are realistic and consistent with policy pages.
7. Delete test personal data after verification where appropriate.','Customers can reach the business, receive acknowledgement, and obtain order/product help through monitored channels with realistic response expectations.',1),
('policies_legal','communications','Customer communication and policies','Review privacy, terms, shipping, pickup, returns, refunds, and custom-work policies',220,'critical',1,0,'/terms/','Public footer, checkout, product pages, and owner/legal review','1. Open every public policy from the footer and checkout.
2. Confirm business name, contact method, effective date, jurisdiction, shipping destinations, pickup rules, cancellation, return, refund, damaged-item, custom/personalized, digital, and privacy wording.
3. Make sure policies describe actual operations and do not promise unsupported delivery times or return rights.
4. Confirm product pages link to the policy information customers need before payment.
5. Verify privacy/data-deletion instructions reflect the data actually collected by forms, analytics, accounts, and payment providers.
6. Review special conditions for one-of-a-kind, vintage, made-to-order, and cosmetic products.
7. Record who reviewed the final policy set and when.','All customer-facing policies are findable before payment, internally consistent, dated, and aligned with the way the business will actually operate.',1),
('soap_formula_ingredients','packaging','Soap, packaging, and regulatory readiness','Verify each soap formula, INCI order, bilingual identity, warnings, and claims',230,'critical',1,0,'/admin/packaging/soap-labels/','Verified recipe/formula records, supplier documents, bilingual review, and applicable cosmetic requirements','1. Link the soap label project to the intended finished soap product and verified recipe or formula source.
2. Enter ingredients in reviewed INCI order rather than copying supplier marketing bullets.
3. Complete matched English and French product identity, ingredient display rows, warnings, dealer/address, consumer contact, Canadian-origin wording, and metric net quantity.
4. Review fragrance, colourant, allergen, and claim obligations that apply to the final formula.
5. Confirm every displayed claim has an internal approval note and factual support.
6. Compare the structured rows against the batch record and physical product.
7. Lock the reviewed source facts before creating the final label version.','The label content reflects the actual formula and reviewed bilingual/legal facts; no ingredient or claim is inferred from artwork or supplier advertising.',1),
('soap_print_proof','packaging','Soap, packaging, and regulatory readiness','Generate, measure, wrap-test, approve, and archive each soap label',240,'critical',1,0,'/admin/packaging/soap-labels/','100% physical printer proof and PACKAGING_STUDIO.md','1. Use PACKAGING_STUDIO.md as the single packaging source of truth.
2. Generate the continuous ribbon from structured records and save a review version.
3. Print at 100% with browser/page scaling disabled.
4. Measure strip width, band height, front oval, rear seal, bleed, and safe-area result.
5. Test both the photo-fit and true-50-mm profile if the final physical geometry is not yet chosen.
6. Wrap the actual soap and inspect front centring, folds, overlap/glue, ingredient legibility, French text, claims, net weight, barcode/batch zones, and colour.
7. Upload or link a proof photo, record printer/paper, and mark fit, legibility, and overlap separately.
8. Approve and archive only the version that passed; supersede rather than silently overwrite an approved label.','Each launch soap has a saved, physically measured, wrapped, passed, approved, and archived label version linked to its exact structured source data.',1),
('candle_top_template_proof','packaging','Soap, packaging, and regulatory readiness','Measure, save, laser-test, approve, and archive each candle-top template',245,'critical',1,0,'/admin/packaging-studio/','Physical candle lid or blank, laser/printer settings, owner-supplied wedding sample, and PACKAGING_STUDIO.md','1. Open Labeling & Packaging, create or open the intended candle-top project, and select the closest round system template; never reuse a soap or generic rectangle template.
2. Measure the actual lid or laser blank in millimetres with an appropriate ruler or caliper. Record the usable diameter separately from any lip, bevel, fixture or no-burn area.
3. In Layout, enter the measured canvas diameter, safe margin and bleed/trim allowance. Select round plus the wedding, centred-candle or maker-mark design profile that matches the job.
4. In Artwork & Colours, replace the sample names, original date, occasion, celebration date, upper website arc and lower origin arc. Keep all customer wording editable; do not bake names or dates into the illustration.
5. Confirm the preview uses centred text anchors and curved text paths, both rings are concentric, permanent website/origin wording is present, and no line crosses the safe area.
6. Enter a specific reusable template name that includes nominal size and use, such as 3.75-inch wedding candle top, add material/fixture notes, and select Save these dimensions and features as a reusable template. Reload the project and confirm the custom template remains selected.
7. Save the project and a review version, export SVG, and archive its filename and checksum. Do not treat browser PNG/JPG or the AI-created line-art raster as a vector engraving master unless the chosen laser workflow has accepted and traced it.
8. Run one owner-controlled material test using the exact blank, laser/printer, power/speed/DPI, focus, masking and fixture settings intended for production. Keep flammable candle material out of an unsafe test setup and follow the equipment/material manufacturer instructions.
9. Measure the finished result and inspect centring, legibility, line weight, arc direction, spelling, dates, scorching/colour, edge clearance and fixture rotation. Photograph the proof without exposing private customer information beyond approved wording.
10. In Print Test, record 100% scale, round diameter, material/stock, equipment, physical checks, proof URL and factual notes. A failed size, spelling, material or centring result requires a new version and full retest.
11. Approve only the exact version that passed and keep the source sample, generated text-free artwork, exported file, settings and proof evidence together for the repeat job. Never overwrite an approved customer version silently.
12. Repeat this gate for every new physical size, blank/material, artwork profile, laser/printer setting or meaningful wording-layout change.','Every launch candle top or engraved round uses a saved exact-size reusable template with editable wording, centred static brand elements, an archived export/checksum, and a passed physical proof on the intended blank and production method.',1),
('health_canada_notification','packaging','Soap, packaging, and regulatory readiness','Prepare Health Canada cosmetic notification and change control',250,'critical',1,1,'/admin/startup-readiness/','Health Canada Cosmetic Notification Form and official guidance','1. Determine which launch products are cosmetics and identify the responsible manufacturer or importer.
2. Prepare product identity, intended use, company/contact, first-sale date, formula ingredients, concentration ranges, and other required notification information.
3. Submit the Cosmetic Notification Form within the applicable period after first sale; current official guidance states within 10 days after first sale in Canada.
4. Save the submission confirmation or reference outside the public website and record a safe evidence pointer here.
5. Create a change-control rule for name, formula, concentration, company, contact, or other reportable changes.
6. Review the Cosmetic Ingredient Hotlist and other applicable official requirements before release.
7. Do not treat an app-generated label or notification record as legal approval.','Every applicable cosmetic has an owner, prepared/submitted notification evidence, and a documented process for later formula or business-detail changes.',1),
('packaging_prepress_boundary','packaging','Soap, packaging, and regulatory readiness','Confirm the packaging export is suitable for the chosen printer and production method',260,'high',1,0,'/admin/packaging-studio/','Chosen printer, paper/stock, cutter, colour profile, and production proof','1. Confirm whether the printer accepts SVG, browser-generated PDF, or requires a prepress PDF with crop/bleed boxes and embedded/outlined fonts.
2. Verify the exact media size, bleed, safe area, crop marks, colour mode/profile, and no-scaling setting.
3. Confirm the rose and icon assets remain sharp and licensed/owned for production use.
4. Print a calibration ruler and compare measured output to the design dimensions.
5. Record printer, paper, driver, scaling, colour, and cutting settings.
6. Keep browser Print/Save PDF labelled as preparation until the chosen printer accepts it as final production output.
7. Archive the source SVG, delivered file, checksum, and proof result.','The chosen printer and material reproduce the approved dimensions, type, colour, bleed, and cut safely using an archived export and documented settings.',1),
('analytics_consent','discovery','Search, analytics, accessibility, and quality','Verify analytics, consent, privacy boundaries, and commerce event accuracy',270,'high',1,1,'/admin/site-analytics/','GA4 or configured analytics property and browser developer tools','1. Confirm the production analytics identifier is loaded once on public pages and not duplicated by multiple scripts.
2. Test page_view, view_item, add_to_cart, begin_checkout, purchase, refund, contact, and custom-request events that are actually enabled.
3. Confirm transaction IDs prevent duplicate purchase events after refresh.
4. Verify no secret, password, payment detail, private admin note, or unnecessary personal data is sent.
5. Test consent or privacy controls required by the chosen analytics setup.
6. Exclude admin and preview traffic where practical.
7. Compare one test order with analytics and the stored order.','Public and commerce activity is observable once, privacy boundaries are respected, and analytics values can be reconciled to a test transaction.',1),
('search_console_indexing','discovery','Search, analytics, accessibility, and quality','Verify sitemap, robots, canonical URLs, Search Console, and index coverage',280,'high',1,1,'/sitemap.xml','Google Search Console for devilndove.com','1. Open robots.txt and sitemap.xml on the production domain and confirm both load successfully.
2. Confirm the sitemap contains only intended canonical public URLs and excludes admin/private pages.
3. Verify the domain property in Search Console and submit the sitemap.
4. Inspect the home page, shop, one category/local page, and several product-detail URLs.
5. Confirm canonical URLs use the production domain and query-based product pages resolve consistently.
6. Review index coverage, mobile usability, structured-data reports, manual actions, and security issues.
7. Record important indexing problems as separate work items rather than repeatedly changing titles without evidence.','Search Console owns the production property, the sitemap/canonical system is correct, and representative public pages are crawlable without critical index or security errors.',1),
('caip_private_large_media_intake','creative','Creative media, privacy, and publishing','Prove private CAIP large-media intake, recovery, immutable originals, and public-promotion boundary',285,'high',1,1,'/admin/creative-assets/','Cloudflare R2 private binding CAIP_PRIVATE_MEDIA_BUCKET, D1 Build 241 records, and docs/creative-asset-intelligence-platform/16_Private_Raw_Media_Intake.md','1. Create a dedicated private R2 bucket for Devil n Dove CAIP raw media and bind it as CAIP_PRIVATE_MEDIA_BUCKET; keep r2.dev and public custom-domain access disabled.
2. Open a reviewed Creative Project in CAIP and create a private media upload session. Confirm D1 stores metadata/state while R2 stores the binary.
3. Upload at least one image and one video using multipart parts and confirm successful parts record ETags.
4. Interrupt a multipart upload after several parts, reconnect or refresh, reselect the same local file when browser security requires it, and resume without intentionally re-uploading completed parts.
5. Confirm object keys use project/file IDs and generated keys rather than personal/customer names.
6. Confirm successful raw originals are immutable through the intake UI; transformations target proxy/extracted/derived/export namespaces instead.
7. Confirm completion creates an internal-only CAIP/media record, technical observation, no public URL, and planned—not falsely completed—processing jobs.
8. Create and test a secure authenticated review grant against the private object.
9. Update privacy/consent/rights and confirm blocked or revoked media cannot request promotion.
10. Request public promotion and prove the request remains needs_review and creates no public copy in Build 241.
11. Test drag/drop, file selection, progress, pause/resume/retry, degraded errors, focus/touch targets and horizontal overflow on phone and desktop.
12. Record production evidence without secrets or unnecessary personal information before marking this gate complete.','The dedicated private R2 binding is proven live; multipart interruption/recovery works without restarting completed parts; completed originals remain private and immutable; secure review is authenticated/no-store; planned processors do not claim nonexistent outputs; and public promotion remains rights/consent/privacy/review gated with no automatic public copy.',1),
('google_business_profile','discovery','Search, analytics, accessibility, and quality','Complete and verify Google Business Profile and local-business consistency',290,'high',1,1,'/contact/','Google Business Profile for Devil n Dove','1. Confirm the profile name, primary/secondary categories, phone, website, service or pickup area, hours, special hours, description, products/services, and photos are accurate.
2. Keep address visibility consistent with how customers actually visit or receive products.
3. Compare business name, phone, website, and locality wording with the website and major directory profiles.
4. Add current real photos and respond to legitimate reviews without incentives that violate platform rules.
5. Use local wording only where it truthfully reflects pickup, service, market, or delivery reach.
6. Record monthly evidence and any profile correction task.
7. Do not promise or report a guaranteed first-page position; monitor relevance, distance, and prominence over time.','The Business Profile is complete, accurate, consistent with the website, actively maintained, and supported by real local proof and customer trust.',1),
('seo_page_quality','discovery','Search, analytics, accessibility, and quality','Run the public SEO, title, H1, structured-data, image, and internal-link audit',300,'high',1,1,'/admin/local-seo-review/','Production public pages, Google rich-result tools, and Search Console','1. Scan every indexable HTML page for one and only one H1, a distinctive title, useful meta description, canonical URL, robots directive, and meaningful visible introduction.
2. Make the main title visually unambiguous; avoid multiple headings with equal title prominence.
3. Use descriptive buyer language in titles, headings, product facts, image alt text, and internal links without stuffing locations or keywords.
4. Validate Organization/LocalBusiness, Breadcrumb, Product, Offer, image, and other applicable structured data against visible facts.
5. Confirm Product schema includes the approved gallery images, current price, currency, availability, SKU, and canonical offer URL.
6. Check crawlable internal links to important shop, category, policy, contact, story, and local relevance pages.
7. Review duplicate/thin pages and redirect or noindex where appropriate.
8. Record before/after evidence for changes rather than guessing from rankings.','All indexable pages pass the one-H1 and metadata audit, structured data matches visible facts, and important pages are discoverable through descriptive crawlable links.',1),
('mobile_accessibility_performance','discovery','Search, analytics, accessibility, and quality','Complete real-device mobile, keyboard, accessibility, and performance testing',310,'critical',1,1,'/admin/post-deploy-smoke-tests/','Real phones/tablet/desktop, Lighthouse/PageSpeed, keyboard, and screen-reader checks','1. Test a narrow phone, large phone, tablet, laptop, and large desktop in portrait and landscape where relevant.
2. Complete navigation, product view/gallery, cart, checkout, login, password reset, contact, and critical admin workflows.
3. Confirm touch targets, sticky actions, form labels, validation, focus visibility, keyboard order, dialogs, tables, and horizontal overflow.
4. Check colour contrast and text readability in dark/light surfaces used by the site.
5. Test with images disabled or a slow connection and confirm useful fallback content.
6. Run Lighthouse/PageSpeed on home, shop, product detail, contact, and an important local/content page on mobile and desktop.
7. Fix critical accessibility errors and layout overlap before launch; document lower-priority performance work.
8. Re-run after CSS or image changes.','Critical customer journeys work on target devices and keyboard, no blocking accessibility or overlap defect remains, and performance evidence is recorded.',1),
('social_oauth_visibility','discovery','Search, analytics, accessibility, and quality','Keep social publishing controls review-first until provider OAuth is approved',320,'medium',1,1,'/admin/social-publishing/','Meta, Pinterest, YouTube, TikTok, and other configured provider developer consoles','1. Open Social Publishing and list each provider shown in the connection cards, queue, and public footer.
2. For Meta, confirm FACEBOOK_PAGE_ID (or META_PAGE_ID), FACEBOOK_PAGE_ACCESS_TOKEN (or META_PAGE_ACCESS_TOKEN), INSTAGRAM_USER_ID/INSTAGRAM_BUSINESS_ACCOUNT_ID, and the optional INSTAGRAM_ACCESS_TOKEN exist as encrypted Production secrets; never record their values.
3. Select Test Facebook + Instagram. Confirm the Page identity and Instagram professional-account identity return HTTP 200 and the configured IDs match.
4. If META_APP_ID and META_APP_SECRET are present, confirm token debug reports is_valid, the app ID matches, expiry/data-access-expiry are acceptable, and the returned scopes cover the approved workflow.
5. Confirm exact callback URLs, privacy/data-deletion pages, app-review state, Page/account roles, and provider scopes in the Meta developer/business consoles.
6. Keep automatic publishing disabled. Generate one product draft, review media/privacy/caption/UTM, approve deliberately, and publish only one safe product-only test post.
7. Confirm the provider post ID/URL and queue status are recorded, then verify the tracked public destination works.
8. Expire/revoke a test token or use a safe invalid preview credential and confirm the item remains in review/failed state rather than falsely marked published.
9. Repeat the credential identity test after token rotation, app-role changes, Graph API version changes, or account reconnection.
10. Keep providers manual and remove unfinished public promises when OAuth, review, or posting permissions are incomplete.','Unapproved providers remain disabled and honestly labelled; any enabled provider publishes only after deliberate review with observable success/failure evidence.',1),
('backup_restore_rehearsal','operations','Recovery, fulfilment, and controlled opening','Rehearse D1, R2, deployment, and configuration recovery',330,'critical',1,1,'/admin/deployment-preflight/','Cloudflare D1 backups/exports, R2, Pages deployments, and secure configuration records','1. Create a test or copied environment that can be restored without risking production customer data.
2. Restore a recent D1 backup and verify users, products, inventory, orders, packaging, and readiness records.
3. Verify R2 object inventory and restore or re-link a safe test media object.
4. Roll back to a previous Pages deployment, run smoke tests, then return to the current deployment.
5. Confirm required variable and binding names are documented outside the code without storing secret values in the repository.
6. Measure recovery time and record the operator steps that were confusing or missing.
7. Update the recovery guide after the rehearsal.','A tested operator can restore database, media, deployment, and required configuration within an acceptable time using documented steps.',1),
('paid_order_fulfilment_rehearsal','operations','Recovery, fulfilment, and controlled opening','Complete a real paid order from product view through fulfilment',340,'critical',1,1,'/admin/orders/','Public store, payment provider, email, packaging, pickup/shipping, inventory, and accounting','1. Use a launch product and an owner-controlled customer identity/payment method.
2. Start from the public Shop, inspect the product gallery/facts, add to cart, and complete checkout.
3. Confirm payment, webhook, order, inventory, tax, shipping/pickup, email, and accounting records.
4. Pick the physical item, verify lot/batch where relevant, package it with the approved label/materials, and mark fulfilment.
5. Confirm the customer receives the correct fulfilment or pickup message.
6. Compare actual labour, packaging, shipping, provider fee, and margin with the stored assumptions.
7. Save order ID, timestamps, and issues; never store full payment credentials.','One real order completes end to end with correct product, money, stock, communication, packaging, fulfilment, and reconciliable records.',1),
('separate_refund_rehearsal','operations','Recovery, fulfilment, and controlled opening','Complete a separate cancellation/refund rehearsal and customer recovery',350,'critical',1,1,'/admin/orders/','Production payment, order, inventory, email, and accounting systems','1. Use a different low-value owner-controlled rehearsal order so the paid-order proof remains intact.
2. Test the actual cancellation/refund workflow an operator will use.
3. Confirm provider refund, order history, customer email, inventory decision, tax reversal, fee treatment, and accounting entries.
4. Confirm the item is returned to sellable stock only after physical/operational review where required.
5. Replay the provider event and confirm the recovery action remains idempotent.
6. Document the customer-service wording and escalation path for a failed automated step.','A separate refund/cancellation can be completed safely, communicated clearly, reconciled, and repeated webhook delivery cannot duplicate its effects.',1),
('deploy_readiness_standalone','operations','Recovery, fulfilment, and controlled opening','Complete Deploy Readiness as a standalone promotion decision',355,'critical',1,1,'/admin/deploy-readiness/','Startup Readiness, Deployment Preflight result, Post-Deploy Smoke Tests, rollback evidence, and release manifest','1. Open Deploy Readiness only after the exact package passed Deployment Preflight, was deployed, and passed the complete Post-Deploy Smoke process.
2. Confirm every Critical Startup gate is Complete or has an owner-approved, factually justified Not Applicable result; do not rely only on a score.
3. Review blocker drilldowns, manifest paths, migration ledger, rollback/recovery reference, smoke evidence, product scope, marketplace/recall locks and provider checks.
4. Confirm the opening owner, monitoring hours, stop conditions, rollback steps and customer recovery contacts are written and reachable from a phone.
5. Record the exact deployment, database bookmark/recovery point, approved product count, outstanding High items and the person making the decision.
6. Select Blocked when any required evidence is absent or contradictory and link back to the exact Startup gate.
7. Select approval only when the evidence—not the existence of the feature—supports proceeding to controlled Go-Live Execution.
8. Reopen this decision after a new deployment, migration, critical configuration change, failed smoke test or material Startup-gate change.','A named owner has recorded an evidence-backed promotion decision for the exact live build, no Critical Startup gate or smoke result remains open, and rollback/stop conditions are ready.',1),
('operational_continuity_evidence_center','operations','Recovery, fulfilment, and controlled opening','Operate the Build 241 evidence, continuity, fallback and mobile control centre',357,'critical',1,1,'/admin/operational-continuity/','Production D1, Cloudflare logs, payment/email/social providers, R2 and phone/desktop browsers','1. Apply Build 241 after backing up D1 and confirm the migration ledger key.
2. Open Operational Continuity and verify all twenty-one workstreams load from D1; degraded mode must show the static fallback and no false success.
3. Create evidence cases for login, autosave, webhook duplicate, concurrency, refund, email, restore, packaging and controlled opening.
4. Record expected and actual results plus safe IDs/URLs; never store credentials or unnecessary customer data.
5. Verify idempotency claims reject a duplicate key without repeating the operation.
6. Test one packaging component reservation, release and reversal with lot-aware quantities.
7. Link one verified formula/version/checksum to a packaging project and lock one approved version.
8. Record prepress text-fit, region-overflow, QR/barcode destination and font results.
9. Reconcile at least one observable provider result and one notification delivery attempt.
10. Test a phone evidence draft through interruption, privacy review and sync recovery.
11. Run deployed asset and public-page audits; one H1, titles, descriptions, canonical, links, images and schema must remain visible.
12. Review support, accounting-close, batch-approval, local-SEO, fallback and mobile-card queues.
13. Attach non-secret evidence and reopen affected gates after any failure or corrective deployment.','All twenty-one workstreams have an owner/status, critical live cases have evidence, duplicate operations are prevented, fallbacks do not imply success, and no active stop condition remains.',1),
('launch_monitoring_ownership','operations','Recovery, fulfilment, and controlled opening','Assign launch-day ownership, monitoring, support, and stop conditions',360,'critical',1,0,'/admin/startup-readiness/','Internal launch operating plan','1. Name the person responsible for orders, payments, inventory, email, customer messages, site incidents, and public updates during opening.
2. Define the hours the store will be actively monitored during the first days.
3. Write stop conditions for payment mismatch, oversell, repeated 500 errors, lost email, wrong tax, broken fulfilment, or unsafe product/label concern.
4. Record how to hide checkout, archive a product, roll back a deployment, contact customers, and preserve evidence.
5. Confirm the owner can access the required dashboards and recovery instructions from a phone.
6. Prepare a short daily review of orders, incidents, inventory, refunds, and customer questions.','Each launch responsibility has an owner and the team has clear monitoring, escalation, rollback, and temporary-stop instructions.',1),
('go_live_execution_standalone','operations','Recovery, fulfilment, and controlled opening','Run Go-Live Execution as a standalone controlled-opening process',365,'critical',1,1,'/admin/go-live-execution/','Production storefront, Deploy Readiness approval, Promotion Control, launch owner and immediate monitoring dashboards','1. Confirm the Deploy Readiness decision names the exact live build and still has no Critical blocker.
2. Confirm the deliberately small opening product list, conservative sellable quantities, real product media, packaging status, accepted destinations and customer policies.
3. Record the opening date/time, owner on duty, monitoring window and first scheduled review before changing public availability.
4. Enable only the approved products/channels; keep unfinished automation and unapproved providers disabled.
5. Open the production store in a private session and complete the agreed visibility/cart/checkout check without changing unrelated products.
6. Queue immediate incident/order/payment/inventory/email monitoring and keep rollback, checkout pause and product-archive controls open.
7. If any stop condition occurs, pause the affected public action immediately, preserve evidence, communicate with affected customers and roll back or correct safely.
8. Record the exact actions, operator, timestamps and resulting public URLs; never mark this gate complete from a successful button click alone.
9. Continue to Live Ops Follow-through and monitor the first operational window.','The approved limited storefront is opened by a named operator, the exact actions and public results are recorded, immediate monitoring is active, and the opening remains reversible.',1),
('controlled_opening','operations','Recovery, fulfilment, and controlled opening','Open with controlled stock, limited products, and a reversible rollout',370,'critical',1,1,'/admin/startup-readiness/','Production store and launch operating decision','1. Confirm every critical readiness item is Complete or has a formally justified Not Applicable decision.
2. Keep the opening-day product list small and inventory conservative.
3. Open to a limited audience or quiet public release before paid promotion.
4. Monitor the first orders in real time and compare every system record.
5. Pause sales immediately if a stop condition is reached.
6. Add products and automation gradually only after the core order, inventory, email, refund, and fulfilment paths remain stable.
7. Record the opening time, product count, owner on duty, and first review time.','The store opens through a monitored, reversible, low-risk release with no unresolved critical blocker and a clear pause/rollback path.',1),
('live_ops_followthrough_standalone','operations','Recovery, fulfilment, and controlled opening','Run Live Ops Follow-through as a standalone first-window monitoring process',380,'critical',1,1,'/admin/live-ops-followthrough/','Production orders, payments, inventory, email provider, customer support, incidents, analytics and public channels','1. Begin monitoring at the Go-Live timestamp and keep the named owner available for the agreed first operating window.
2. For every first-window order, compare payment, order, item, inventory movement, tax, delivery/pickup, email, client document and accounting records.
3. Review runtime incidents, webhook retries, failed messages, stock warnings, customer questions, public-content/provider results and analytics duplication.
4. Confirm completed fulfilment and any separate refund rehearsal remain reconciled and idempotent.
5. Record expected versus actual results, safe IDs, customer recovery actions, owner and resolution for every anomaly.
6. Activate the stop condition immediately for payment mismatch, oversell, repeated 500 errors, unsafe product/label, lost transactional email, wrong tax or unrecoverable fulfilment failure.
7. Reopen every affected Startup gate after a failure, credential/configuration change or corrective deployment; never hide the incident by editing only the status.
8. Complete a written end-of-window review covering orders, refunds, incidents, inventory, support and the next monitoring period.
9. Expand products, stock or automation only after stable evidence supports the change.','The first live operating window is reconciled across customer, money, stock, communication, fulfilment, accounting and incident records, with every anomaly owned and no active stop condition.',1)
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
-- Build 241 Startup metadata refresh END

INSERT INTO schema_migration_ledger(migration_key,file_name,applied_at,notes)
VALUES('build241_caip_large_media_intake','database_build241_caip_large_media_intake.sql',CURRENT_TIMESTAMP,'Adds Devil n Dove CAIP private raw-media upload sessions/files/parts, resumable R2 multipart state, internal processing plans, governed public-promotion requests, a CAIP operational workstream and the 46th Startup gate. Raw originals remain private and immutable; public promotion is review/consent gated.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name,notes=excluded.notes;
