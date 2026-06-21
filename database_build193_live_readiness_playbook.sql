-- Devil n Dove Build 193 — Live Readiness Playbook and Resumable Mobile Media
-- Safe additive D1 migration. Run after database_build192_operational_data_connection.sql.
-- Purpose: turns the remaining live-only work into a tracked, evidence-based checklist and
-- adds R2 multipart-upload metadata for resumable mobile image uploads.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS live_readiness_test_cases (
  live_readiness_test_case_id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_key TEXT NOT NULL UNIQUE,
  test_area TEXT NOT NULL,
  test_label TEXT NOT NULL,
  priority_rank INTEGER NOT NULL DEFAULT 100,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  requires_live_binding INTEGER NOT NULL DEFAULT 0,
  target_route TEXT,
  instructions_markdown TEXT NOT NULL,
  expected_result TEXT NOT NULL,
  test_status TEXT NOT NULL DEFAULT 'not_started',
  evidence_url TEXT,
  evidence_notes TEXT,
  last_run_at TEXT,
  last_run_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_live_readiness_cases_area
  ON live_readiness_test_cases(test_area, priority_rank, test_status);

CREATE TABLE IF NOT EXISTS live_readiness_test_runs (
  live_readiness_test_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_key TEXT NOT NULL,
  run_status TEXT NOT NULL DEFAULT 'not_started',
  result_summary TEXT,
  evidence_url TEXT,
  tested_by_user_id INTEGER,
  tested_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_live_readiness_runs_test
  ON live_readiness_test_runs(test_key, tested_at DESC);

CREATE TABLE IF NOT EXISTS mobile_resumable_upload_runtime_rows (
  mobile_resumable_upload_runtime_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  upload_key TEXT NOT NULL UNIQUE,
  r2_object_key TEXT NOT NULL,
  multipart_upload_id TEXT NOT NULL,
  public_url TEXT,
  attached_product_id INTEGER,
  alt_text TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  aborted_at TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS mobile_resumable_upload_parts (
  mobile_resumable_upload_part_id INTEGER PRIMARY KEY AUTOINCREMENT,
  upload_key TEXT NOT NULL,
  part_number INTEGER NOT NULL,
  part_etag TEXT NOT NULL,
  byte_count INTEGER NOT NULL DEFAULT 0,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(upload_key, part_number)
);

CREATE INDEX IF NOT EXISTS idx_mobile_resumable_parts_upload
  ON mobile_resumable_upload_parts(upload_key, part_number);

CREATE TABLE IF NOT EXISTS mobile_resumable_upload_events (
  mobile_resumable_upload_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  upload_key TEXT NOT NULL,
  event_kind TEXT NOT NULL,
  event_status TEXT NOT NULL DEFAULT 'recorded',
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS command_center_usage_events (
  command_center_usage_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  event_kind TEXT NOT NULL DEFAULT 'view',
  source_route TEXT,
  user_id INTEGER,
  session_key TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_command_center_usage_route
  ON command_center_usage_events(route_path, created_at DESC);

INSERT INTO live_readiness_test_cases
(test_key,test_area,test_label,priority_rank,risk_level,requires_live_binding,target_route,instructions_markdown,expected_result)
VALUES
(
  'fee_cost_configuration',
  'business_data',
  'Enter one reviewed channel fee and one product-family cost default',
  10,'high',0,'/admin/command-center/',
  '1. Log in as an admin.\n2. Open Admin Command Center.\n3. In the fee/cost section, enter one real channel fee using the exact rate shown in that provider account.\n4. Enter one realistic product-family material, labour, packaging, overhead, and waste default.\n5. Save the change with a short factual reason.\n6. Refresh Product Readiness and confirm the margin status changes.',
  'The fee/cost row is marked configured, the audit row exists, and Product Readiness no longer calls that setting unknown.'
),
(
  'marketplace_margin_gate',
  'business_data',
  'Confirm marketplace export blocks an unhealthy margin',
  20,'high',0,'/admin/marketplace-exports/',
  '1. Use a draft/test product with intentionally incomplete costs or a low price.\n2. Open Marketplace Export Preview.\n3. Try to download the channel CSV.\n4. Confirm the export is blocked and the reason names the margin/cost issue.\n5. Do not create an override unless there is a real business reason.\n6. If testing an override, use a temporary expiry and record why.',
  'The CSV is blocked for unknown, low, or negative margin unless a current approved override exists.'
),
(
  'mobile_draft_recovery',
  'mobile',
  'Save and recover a mobile product draft',
  30,'high',0,'/admin/mobile-product/',
  '1. On a phone or narrow browser, open Mobile Product Add.\n2. Enter a product name, reference, and short description.\n3. Save a partial draft.\n4. Reload the page or reopen the draft list.\n5. Select the saved draft.\n6. Confirm the saved fields return and the readiness checklist identifies remaining work.\n7. Record any missing field or layout issue before continuing.',
  'The product draft is recoverable from D1 and the mobile readiness view remains usable without overlap.'
),
(
  'mobile_resumable_media',
  'mobile',
  'Test resumable R2 media upload on a real phone',
  40,'high',1,'/admin/mobile-product/',
  '1. Save a text-only product draft first and reopen it.\n2. In the Resumable image upload panel choose one non-sensitive test image.\n3. Start the upload while on Wi-Fi.\n4. If practical, briefly disable/re-enable connectivity after the first part completes.\n5. Re-select the same file and resume.\n6. Complete the upload.\n7. Confirm the image appears on the reopened draft and the R2 object key is recorded.\n8. Delete the test image after verification if it should not remain in the catalog.',
  'The upload can resume from completed parts, completes into R2, and attaches a product image without duplicate rows.'
),
(
  'r2_derivative_worker',
  'media',
  'Run R2 derivative health checks',
  50,'high',1,'/admin/command-center/',
  '1. Confirm PRODUCT_MEDIA_BUCKET is bound in Cloudflare Pages.\n2. Confirm the derivative worker route/binding is deployed.\n3. Create a tiny approved test image object.\n4. Generate WebP and AVIF derivatives.\n5. Verify the derivative URLs load, the product record receives valid responsive URLs, and the visual output looks correct.\n6. Run cleanup and confirm test objects are removed.\n7. Mark each check only after evidence is saved.',
  'WebP and AVIF derivatives load, srcset/sizes references are valid, and cleanup removes test objects.'
),
(
  'approved_real_media',
  'media',
  'Replace one placeholder with approved real workshop media',
  60,'medium',0,'/admin/visual-enrichment-studio/',
  '1. Choose one visible placeholder from the media replacement plan.\n2. Confirm the photo is owned by you or public-use consent is recorded.\n3. Compress the image and add descriptive alt text.\n4. Check it on a phone and desktop.\n5. Publish only after the visual review status is approved.\n6. Confirm the replacement uses relevant nearby text and does not change the page H1.',
  'One real photo safely replaces one placeholder with consent, alt text, mobile review, and performance evidence.'
),
(
  'search_console_import',
  'seo',
  'Import a real Search Console export',
  70,'high',0,'/admin/local-seo-review/',
  '1. Open Google Search Console for the verified property.\n2. Open Performance search results.\n3. Choose an appropriate date range and export pages and queries as CSV.\n4. In the admin import tool, upload or preview the CSV.\n5. Review detected headers and sample rows before saving.\n6. Create one follow-up action from an opportunity, not a promise of ranking.\n7. Save the import date and source note.',
  'The CSV mapping is reviewed before import, rows are stored, and actions are factual and traceable.'
),
(
  'gbp_monthly_evidence',
  'seo',
  'Record monthly Google Business Profile evidence',
  80,'medium',0,'/admin/command-center/',
  '1. Open the Google Business Profile.\n2. Check business name, category, hours, service area, phone, website, and current photos.\n3. Record only accurate observations in the GBP evidence panel.\n4. Add a link or screenshot reference where available.\n5. Note any needed update as a task.\n6. Do not claim that posting or photo updates guarantee a ranking result.',
  'A dated monthly record exists for profile accuracy, photos, reviews, posts, and local-page evidence.'
),
(
  'customer_duplicate_review',
  'customers',
  'Review customer duplicate suggestions',
  90,'medium',0,'/admin/command-center/',
  '1. Refresh duplicate customer candidates.\n2. Open each candidate source summary.\n3. Confirm two records truly describe the same person before choosing any merge action.\n4. Keep separate records for shared family emails, gifts, or uncertain matches.\n5. Record a short factual review note.\n6. Do not bulk merge automatically.',
  'Duplicate suggestions are reviewed manually with an auditable outcome.'
),
(
  'stripe_webhook_signature',
  'payments',
  'Test Stripe webhook signature verification',
  100,'high',1,'/admin/webhook-events/',
  '1. In Stripe, use the Developers and Webhooks area.\n2. Confirm the endpoint URL and STRIPE_WEBHOOK_SECRET are configured in Cloudflare.\n3. Send a Stripe test event from Stripe, not a fabricated browser request.\n4. Check the app webhook event log for verified status and event ID.\n5. Confirm the same event ID does not create duplicate payment effects.\n6. Record the outcome without exposing a secret.',
  'A Stripe test event is signature-verified, logged once, and produces no duplicate state changes.'
),
(
  'email_test_delivery',
  'communications',
  'Run a safe email provider delivery test',
  110,'high',1,'/admin/live-ops-followthrough/',
  '1. Keep customer automation disabled.\n2. Confirm EMAIL_PROVIDER and the provider API key are configured.\n3. Send a test only to an owner-controlled inbox.\n4. Confirm sender identity, subject, body, delivery, and spam placement.\n5. Record provider response/reference and delivery result.\n6. Do not send gift-card or review emails to customers during this test.',
  'A test reaches an owner-controlled inbox and is logged without customer automation being enabled.'
),
(
  'r2_live_health',
  'deployment',
  'Run R2 upload, signed-read, and delete health test',
  120,'high',1,'/admin/live-ops-followthrough/',
  '1. Use the private evidence/R2 health panel.\n2. Upload a tiny non-sensitive test image or text object.\n3. Open the signed-read URL while logged in.\n4. Confirm access expires or is denied when expected.\n5. Delete the test object.\n6. Confirm the object no longer exists and the result is logged.',
  'Upload, authorized signed read, expiry behaviour, and delete all pass with evidence.'
),
(
  'pagespeed_lighthouse',
  'performance',
  'Import mobile and desktop Lighthouse/PageSpeed evidence',
  130,'medium',0,'/admin/command-center/',
  '1. Run PageSpeed Insights or Lighthouse for the homepage, shop, gallery, and one local page.\n2. Run both mobile and desktop reports.\n3. Record the score/date and major warnings.\n4. Add a remediation task only for meaningful issues.\n5. Recheck after image or CSS changes.\n6. Keep performance decisions tied to real measured evidence.',
  'Dated mobile and desktop reports are stored and performance budgets reflect evidence.'
),
(
  'real_device_qa',
  'performance',
  'Capture real-device QA evidence',
  140,'medium',0,'/admin/post-deploy-smoke-tests/',
  '1. Check a narrow phone, larger phone, tablet, laptop, and large desktop.\n2. Test navigation, product media, cart, login, mobile product capture, and one admin table.\n3. Confirm tap targets, no horizontal clipping, readable text, and no overlapping cards.\n4. Save screenshots or notes for any defect.\n5. Record each device/result in the QA evidence rows.',
  'Each target device class has dated pass/fail evidence and defects become tracked tasks.'
),
(
  'legacy_admin_usage',
  'operations',
  'Review legacy admin usage before retiring pages',
  150,'low',0,'/admin/command-center/',
  '1. Use the Command Center for normal daily work for at least several weeks.\n2. Review recorded route usage and missing workflow needs.\n3. Keep detailed pages until the Command Center covers their essential daily work.\n4. Archive or redirect only after a documented decision.\n5. Do not remove a route merely because it has low use during a short test period.',
  'Legacy-page consolidation is based on observed use and replacement coverage, not guesswork.'
)
ON CONFLICT(test_key) DO UPDATE SET
  test_area=excluded.test_area,
  test_label=excluded.test_label,
  priority_rank=excluded.priority_rank,
  risk_level=excluded.risk_level,
  requires_live_binding=excluded.requires_live_binding,
  target_route=excluded.target_route,
  instructions_markdown=excluded.instructions_markdown,
  expected_result=excluded.expected_result,
  updated_at=CURRENT_TIMESTAMP;

INSERT INTO schema_migration_ledger (migration_key,file_name,applied_at,notes)
VALUES (
  'build_193_live_readiness_playbook',
  'database_build193_live_readiness_playbook.sql',
  CURRENT_TIMESTAMP,
  'Adds tracked live-readiness test cases/runs, R2 multipart mobile upload metadata, and Command Center usage telemetry. Includes detailed test instructions for costs, margins, mobile recovery, R2, media, Search Console, GBP, provider tests, performance, and legacy-page consolidation.'
)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name,notes=excluded.notes;
