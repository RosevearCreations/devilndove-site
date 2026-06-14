-- Devil n Dove Build 186 — Markdown consolidation, value backlog execution, and visual placeholder enrichment
-- Safe additive D1 migration. Run after database_build185_admin_command_center_value_dashboards.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  migration_label TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS markdown_consolidation_runs (
  markdown_consolidation_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 186',
  run_status TEXT NOT NULL DEFAULT 'prepared',
  canonical_file_count INTEGER NOT NULL DEFAULT 2,
  supporting_file_count INTEGER NOT NULL DEFAULT 0,
  retired_reference_count INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS markdown_file_status_rows (
  markdown_file_status_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL UNIQUE,
  file_role TEXT NOT NULL DEFAULT 'supporting_reference',
  keep_active INTEGER NOT NULL DEFAULT 1,
  canonical_replacement TEXT,
  owner_note TEXT,
  last_review_build TEXT NOT NULL DEFAULT 'Build 186',
  review_status TEXT NOT NULL DEFAULT 'reviewed',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_markdown_file_status_role ON markdown_file_status_rows(file_role, keep_active);

CREATE TABLE IF NOT EXISTS value_enhancement_execution_rows (
  value_enhancement_execution_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  enhancement_key TEXT NOT NULL UNIQUE,
  enhancement_label TEXT NOT NULL,
  business_value TEXT,
  app_surface TEXT,
  desktop_status TEXT NOT NULL DEFAULT 'prepared',
  mobile_status TEXT NOT NULL DEFAULT 'prepared',
  seo_status TEXT NOT NULL DEFAULT 'aligned',
  data_owner TEXT NOT NULL DEFAULT 'D1_or_static_json_under_review',
  implementation_status TEXT NOT NULL DEFAULT 'active_tracking',
  priority_rank INTEGER NOT NULL DEFAULT 100,
  next_best_action TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_value_enhancement_execution_priority ON value_enhancement_execution_rows(priority_rank, implementation_status);

CREATE TABLE IF NOT EXISTS visual_graphic_placeholder_rows (
  visual_graphic_placeholder_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  placeholder_key TEXT NOT NULL UNIQUE,
  page_path TEXT NOT NULL,
  image_slot_label TEXT NOT NULL,
  placeholder_asset_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  desktop_status TEXT NOT NULL DEFAULT 'visible_placeholder',
  mobile_status TEXT NOT NULL DEFAULT 'visible_placeholder',
  replacement_status TEXT NOT NULL DEFAULT 'awaiting_approved_media',
  h1_change_allowed INTEGER NOT NULL DEFAULT 0,
  performance_budget_status TEXT NOT NULL DEFAULT 'lazy_loaded_svg',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_visual_placeholder_page ON visual_graphic_placeholder_rows(page_path, replacement_status);

CREATE TABLE IF NOT EXISTS desktop_mobile_surface_audit_rows (
  desktop_mobile_surface_audit_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  surface_key TEXT NOT NULL UNIQUE,
  route_path TEXT NOT NULL,
  surface_label TEXT NOT NULL,
  desktop_status TEXT NOT NULL DEFAULT 'prepared',
  mobile_status TEXT NOT NULL DEFAULT 'prepared',
  touch_target_status TEXT NOT NULL DEFAULT 'needs_live_device_check',
  overflow_status TEXT NOT NULL DEFAULT 'static_pass',
  fallback_status TEXT NOT NULL DEFAULT 'has_readable_fallback',
  next_best_action TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS css_drift_overlap_review_rows (
  css_drift_overlap_review_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_key TEXT NOT NULL UNIQUE,
  selector_or_area TEXT NOT NULL,
  review_kind TEXT NOT NULL DEFAULT 'css_drift',
  desktop_status TEXT NOT NULL DEFAULT 'static_pass',
  mobile_status TEXT NOT NULL DEFAULT 'static_pass',
  risk_level TEXT NOT NULL DEFAULT 'watch',
  recommended_fix TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS next_step_sanity_rows (
  next_step_sanity_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  step_key TEXT NOT NULL UNIQUE,
  step_label TEXT NOT NULL,
  step_group TEXT NOT NULL DEFAULT 'next_20',
  priority_rank INTEGER NOT NULL DEFAULT 100,
  expected_value TEXT,
  target_surface TEXT,
  current_status TEXT NOT NULL DEFAULT 'queued',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO markdown_file_status_rows (file_path, file_role, keep_active, canonical_replacement, owner_note, review_status)
VALUES
('PROJECT_STATUS_AND_ROADMAP.md','primary_canonical',1,NULL,'Main human-readable project status, current value roadmap, SEO direction, and next 20 steps.','active'),
('AI_HANDOFF.md','primary_canonical',1,NULL,'Main new-chat handoff with D1 order, live checks, and where the app is heading.','active'),
('DEVELOPMENT_ROADMAP.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep detailed historical build trail but use the canonical project file first.','reviewed'),
('KNOWN_GAPS_AND_RISKS.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep as detailed risk log while the primary summary moves to canonical docs.','reviewed'),
('DATABASE_SCHEMA_REFERENCE.md','supporting_reference',1,'AI_HANDOFF.md','Keep schema details and D1 order, but summarize current order in AI handoff.','reviewed'),
('RELEASE_NOTES.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep chronological build notes.','reviewed'),
('SANITY_HEALTH_CHECK.md','supporting_reference',1,'AI_HANDOFF.md','Keep latest validation and post-deploy verification notes.','reviewed'),
('LOCAL_SEO_PLAYBOOK.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep detailed local SEO playbook.','reviewed'),
('IMAGES.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep visual/image workflow details.','reviewed'),
('NEW_CHAT_STATUS.md','handoff_reference',1,'AI_HANDOFF.md','Keep short compatibility handoff for old chats but prefer AI_HANDOFF.md.','reviewed'),
('AI_CONTEXT.md','handoff_reference',1,'AI_HANDOFF.md','Keep broad context but prefer AI_HANDOFF.md for the current build.','reviewed'),
('COMPETITIVE.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep competitor and market-direction notes.','reviewed'),
('README.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep repo overview and route notes.','reviewed'),
('REPO_BASE_GUIDE.md','supporting_reference',1,'AI_HANDOFF.md','Keep technical repository notes.','reviewed'),
('REPO_RULES.md','supporting_reference',1,'AI_HANDOFF.md','Keep working rules and guardrails.','reviewed'),
('AMAZON_MATCHING_NOTES.md','specialized_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep only for inventory/Amazon import matching.','reviewed')
ON CONFLICT(file_path) DO UPDATE SET file_role=excluded.file_role, keep_active=excluded.keep_active, canonical_replacement=excluded.canonical_replacement, owner_note=excluded.owner_note, last_review_build='Build 186', review_status=excluded.review_status, updated_at=CURRENT_TIMESTAMP;

INSERT INTO value_enhancement_execution_rows (enhancement_key, enhancement_label, business_value, app_surface, priority_rank, next_best_action, notes)
VALUES
('admin_command_center','Admin Command Center','Reduces admin overwhelm and makes daily work easier.','/admin/command-center/',1,'Add true live rollups from orders/products/SEO instead of mostly seeded rows.','Build 185 started this; Build 186 keeps it as primary daily entry.');
INSERT INTO value_enhancement_execution_rows (enhancement_key, enhancement_label, business_value, app_surface, priority_rank, next_best_action, notes) VALUES
('product_readiness_scoreboard','Product Readiness Scoreboard','Helps publish only complete, trustworthy products.','/admin/readiness/',2,'Add one-click safe fixes for approved low-risk blockers.',''),
('conversion_funnel_tracking','Conversion funnel tracking','Shows which pages and products turn visitors into orders.','/admin/command-center/',3,'Connect page view/cart/checkout/order analytics into funnel rows.',''),
('local_seo_scorecard','Local SEO scorecard','Keeps local discovery focused on relevance, distance, and prominence signals.','/admin/local-seo-review/',4,'Import Search Console and record manual Google Business Profile observations.',''),
('before_after_maker_gallery','Before/after maker gallery','Builds real workshop trust with process proof.','/admin/visual-enrichment-studio/',5,'Replace placeholders with approved before/after images and captions.',''),
('customer_story_builder','Customer story builder','Turns consented proof into product stories, trust blocks, and social snippets.','/admin/public-proof-candidates/',6,'Add story wizard that chooses page placement and social caption.',''),
('mobile_quick_product_add','Mobile quick product add','Captures products directly from the phone while work is fresh.','/admin/mobile-product/',7,'Add offline autosave and image role prompts.',''),
('inventory_job_costing','Inventory/job costing','Protects margins and makes marketplace pricing more realistic.','/admin/inventory-operations/',8,'Connect tool/supply cost rollups to product price suggestions.',''),
('unified_customer_history','Unified customer/member history','Shows orders, recalls, gift cards, stories, and proof approvals in one place.','/admin/members/',9,'Create customer timeline cards from existing tables.',''),
('performance_budgets','Performance budgets','Keeps visual polish sharp without slowing the site.','/admin/visual-polish/',10,'Measure route payloads after real image uploads.',''),
('markdown_consolidation','Markdown consolidation','Makes future AI/new-chat work safer and less confusing.','/admin/markdown-sanity/',11,'Use PROJECT_STATUS_AND_ROADMAP.md and AI_HANDOFF.md as the two main files.','')
ON CONFLICT(enhancement_key) DO UPDATE SET enhancement_label=excluded.enhancement_label, business_value=excluded.business_value, app_surface=excluded.app_surface, priority_rank=excluded.priority_rank, next_best_action=excluded.next_best_action, updated_at=CURRENT_TIMESTAMP;

INSERT INTO visual_graphic_placeholder_rows (placeholder_key, page_path, image_slot_label, placeholder_asset_url, alt_text, notes)
VALUES
('home_workshop_process','/','Workshop process hero support','/assets/visual-placeholders/workshop-process.svg','Placeholder for an approved Devil n Dove workshop process photo.','Homepage enrichment without changing the H1.'),
('shop_product_detail','/shop/','Product detail proof','/assets/visual-placeholders/product-detail.svg','Placeholder for approved product detail photography.','Shop enrichment and product trust.'),
('gallery_before_after','/gallery/','Before and after maker proof','/assets/visual-placeholders/before-after.svg','Placeholder for approved before and after workshop images.','Use only approved public-use media later.'),
('jewelry_macro','/handmade-jewelry-ontario/','Jewelry macro close-up','/assets/visual-placeholders/jewelry-macro.svg','Placeholder for approved handmade jewelry close-up image.','Supports handmade jewelry Ontario search intent.'),
('candle_colour','/custom-candle-making-ontario/','Candle colour and scent proof','/assets/visual-placeholders/candle-colour.svg','Placeholder for approved custom candle colour photo.','Supports custom candles Ontario page.'),
('soap_texture','/custom-soap-making-ontario/','Soap texture and ingredient clarity','/assets/visual-placeholders/soap-texture.svg','Placeholder for approved custom soap texture photo.','Avoid medical claims.'),
('engraving_proof','/laser-engraving-ontario/','Laser engraving material proof','/assets/visual-placeholders/engraving-proof.svg','Placeholder for approved laser engraving proof image.','Helps custom request confidence.'),
('vintage_condition','/vintage-finds-ontario/','Vintage condition proof','/assets/visual-placeholders/vintage-condition.svg','Placeholder for approved vintage condition detail image.','Keeps vintage separate from handmade.'),
('workshop_made_gifts','/workshop-made-gifts-ontario/','Workshop-made gifts process','/assets/visual-placeholders/workshop-process.svg','Placeholder for approved workshop-made gift process image.','Mixed-media gift umbrella page.')
ON CONFLICT(placeholder_key) DO UPDATE SET page_path=excluded.page_path, image_slot_label=excluded.image_slot_label, placeholder_asset_url=excluded.placeholder_asset_url, alt_text=excluded.alt_text, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO desktop_mobile_surface_audit_rows (surface_key, route_path, surface_label, next_best_action, notes)
VALUES
('public_home','/','Public homepage','Check hero/card spacing on phone and desktop after visual placeholder injection.','No extra H1 allowed.'),
('shop','/shop/','Shop landing page','Check placeholder and product grid spacing on phone.','Keep product cards readable.'),
('admin_command_center','/admin/command-center/','Admin Command Center','Keep as daily entry point and avoid another scattered page.','Mobile cards should stack.'),
('markdown_sanity','/admin/markdown-sanity/','Markdown Sanity','Use for doc cleanup and AI handoff clarity.','New Build 186 page.'),
('visual_enrichment','/admin/visual-enrichment-studio/','Visual Enrichment Studio','Keep media rows responsive and touch friendly.','Replace placeholders with approved media.')
ON CONFLICT(surface_key) DO UPDATE SET route_path=excluded.route_path, surface_label=excluded.surface_label, next_best_action=excluded.next_best_action, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO css_drift_overlap_review_rows (review_key, selector_or_area, review_kind, recommended_fix, notes)
VALUES
('visual_placeholder_grid','.visual-placeholder-gallery','responsive_grid','Use auto-fit cards on desktop and one-column flow on phone.','Build 186 CSS added.'),
('admin_table_overflow','.admin-table','overflow','Keep table-wrap around admin tables; never force wide tables on mobile.','Existing pattern reinforced.'),
('hero_visual_overlays','.hero::after and visual accents','motion_safety','Respect prefers-reduced-motion and low-bandwidth mode.','No required animation.'),
('nav_touch_targets','.nav a, .btn','mobile_tap_target','Keep min-height near 44px on small screens.','Build 182/183 rule retained.'),
('placeholder_images','.visual-placeholder-card img','image_budget','Use lazy-loaded SVG placeholders until approved compressed media exists.','Sharp placeholders, low byte cost.')
ON CONFLICT(review_key) DO UPDATE SET selector_or_area=excluded.selector_or_area, review_kind=excluded.review_kind, recommended_fix=excluded.recommended_fix, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO next_step_sanity_rows (step_key, step_label, step_group, priority_rank, expected_value, target_surface, notes)
VALUES
('live_rollups_command_center','Live rollups into Command Center','next_20',1,'Daily dashboard becomes truly operational.','/admin/command-center/','Connect products/orders/SEO/visuals/performance counts.'),
('product_readiness_apply_more','More safe Product QA applies','next_20',2,'Less manual catalog cleanup.','/admin/readiness/','Limit to low-risk fixes first.'),
('replace_visual_placeholders','Replace placeholders with approved media','next_20',3,'Public pages look sharper and more trustworthy.','/admin/visual-enrichment-studio/','Use consent/public-use checks.'),
('customer_story_wizard','Customer story wizard','next_20',4,'More trust blocks and social proof.','/admin/public-proof-candidates/','Consent required.'),
('mobile_product_autosave','Mobile product autosave','next_20',5,'Phone product capture becomes safer.','/admin/mobile-product/','Preserve drafts after network failures.'),
('conversion_event_pipeline','Conversion event pipeline','next_20',6,'Know which pages make sales.','/admin/analytics/','Landing → product → cart → checkout → order.'),
('local_seo_gbp_log','Google Business Profile observation log','next_20',7,'Track local prominence work.','/admin/local-seo-review/','Manual observations until API integration exists.'),
('customer_timeline_cards','Customer/member timeline cards','next_20',8,'Better service and recall visibility.','/admin/members/','Orders, gift cards, recalls, proof approvals.'),
('costing_margin_cards','Costing margin cards','next_20',9,'Protect profit on handmade/vintage listings.','/admin/inventory-operations/','Material/labour/fees/packaging.'),
('performance_measurement_import','Performance measurement import','next_20',10,'Prevent visual polish from becoming slow.','/admin/visual-polish/','Store route payload measurements.')
ON CONFLICT(step_key) DO UPDATE SET step_label=excluded.step_label, step_group=excluded.step_group, priority_rank=excluded.priority_rank, expected_value=excluded.expected_value, target_surface=excluded.target_surface, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO markdown_consolidation_runs (build_label, run_status, canonical_file_count, supporting_file_count, retired_reference_count, summary_json, notes)
VALUES ('Build 186','prepared',2,14,0,'{"canonical":["PROJECT_STATUS_AND_ROADMAP.md","AI_HANDOFF.md"],"approach":"Keep existing Markdown for compatibility, but make two files primary for future AI/new-chat handoff."}','Build 186 Markdown sanity pass. Existing files are not deleted; they are reclassified so future work starts from the two canonical files.');

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_186_markdown_consolidation_visual_placeholders', 'database_build186_markdown_consolidation_visual_placeholders.sql', CURRENT_TIMESTAMP, 'Safe additive Build 186 schema for Markdown consolidation, value enhancement execution rows, visual graphic placeholders, desktop/mobile audits, CSS drift/overlap review, and next-step sanity rows.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;
