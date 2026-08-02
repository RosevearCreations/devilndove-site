-- Build 230 - visual image manifest and generated editorial provenance.
-- D1-safe migration: do not wrap this file in BEGIN/COMMIT/SAVEPOINT.

CREATE TABLE IF NOT EXISTS image_manifest_items (
  image_manifest_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  manifest_key TEXT NOT NULL UNIQUE,
  manifest_group TEXT NOT NULL DEFAULT 'public_static',
  manifest_title TEXT NOT NULL,
  page_path TEXT NOT NULL,
  slot_key TEXT NOT NULL,
  current_asset_url TEXT,
  final_asset_url TEXT,
  required_asset_kind TEXT NOT NULL DEFAULT 'real_photo_required',
  replacement_status TEXT NOT NULL DEFAULT 'missing',
  rights_status TEXT NOT NULL DEFAULT 'needs_review',
  public_use_status TEXT NOT NULL DEFAULT 'needs_review',
  phone_review_status TEXT NOT NULL DEFAULT 'unchecked',
  desktop_review_status TEXT NOT NULL DEFAULT 'unchecked',
  recommended_width INTEGER,
  recommended_height INTEGER,
  alt_text TEXT,
  owner_name TEXT,
  evidence_url TEXT,
  notes TEXT,
  generated_asset INTEGER NOT NULL DEFAULT 0,
  generated_prompt_summary TEXT,
  is_launch_blocker INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_image_manifest_status ON image_manifest_items(is_active,replacement_status,is_launch_blocker,sort_order);
CREATE INDEX IF NOT EXISTS idx_image_manifest_page ON image_manifest_items(page_path,is_active,sort_order);

CREATE TABLE IF NOT EXISTS image_manifest_history (
  image_manifest_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_manifest_item_id INTEGER NOT NULL,
  previous_status TEXT,
  next_status TEXT NOT NULL,
  previous_asset_url TEXT,
  next_asset_url TEXT,
  rights_status TEXT,
  public_use_status TEXT,
  phone_review_status TEXT,
  desktop_review_status TEXT,
  evidence_url TEXT,
  change_note TEXT,
  changed_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(image_manifest_item_id) REFERENCES image_manifest_items(image_manifest_item_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_image_manifest_history_item ON image_manifest_history(image_manifest_item_id,created_at DESC,image_manifest_history_id DESC);

INSERT INTO image_manifest_items
  (manifest_key,manifest_group,manifest_title,page_path,slot_key,current_asset_url,final_asset_url,required_asset_kind,replacement_status,rights_status,public_use_status,phone_review_status,desktop_review_status,recommended_width,recommended_height,alt_text,notes,generated_asset,generated_prompt_summary,is_launch_blocker,sort_order)
VALUES
  ('workshop_process_hero','public_static','Workshop process photograph','/','workshop_process','/assets/visual-placeholders/workshop-process.svg',NULL,'real_photo_required','placeholder','needs_review','needs_review','unchecked','unchecked',1600,1000,'Maker working at the Devil n Dove Southern Ontario workshop','Must show a truthful, rights-cleared current process. Do not substitute generated art for proof. ',0,NULL,1,10),
  ('home_workshop_discovery','public_static','Homepage workshop discovery visual','/','workshop_discovery','/assets/generated/editorial/workshop-discovery-illustration.webp','/assets/generated/editorial/workshop-discovery-illustration.webp','editorial_illustration_allowed','generated_editorial','approved','approved','needs_review','needs_review',1536,1024,'Illustration of a maker workbench with jewelry tools, an engraved tag, soap, a candle, and collected objects','Editorial category signpost only; never place in Product or Offer structured data. A real workshop photograph remains recommended.',1,'Illustrated eclectic maker workbench with jewelry, engraving, soap, candle and collected-object cues; charcoal, cream, orange-red and icy-blue palette; no text or real-inventory claim.',0,20),
  ('representative_product_collection','public_static','Representative product collection photograph','/creations/','representative_collection','/assets/visual-placeholders/product-grid.svg',NULL,'real_photo_required','placeholder','needs_review','needs_review','unchecked','unchecked',1600,1000,'Selection of current Devil n Dove handmade and collected products','Use only current, accurately identified products with consistent crop and rights.',0,NULL,1,30),
  ('before_after_process','public_static','Before-and-after or process proof','/gallery/','before_after','/assets/visual-placeholders/before-after.svg',NULL,'real_photo_required','placeholder','needs_review','needs_review','unchecked','unchecked',1600,1000,'Before and after views of a Devil n Dove workshop project','Before and after must be the same documented project.',0,NULL,1,40),
  ('handmade_jewelry_macro','public_static','Handmade jewelry technique visual','/handmade-jewelry-ontario/','jewelry_macro','/assets/generated/editorial/handmade-jewelry-techniques-illustration.webp','/assets/generated/editorial/handmade-jewelry-techniques-illustration.webp','editorial_illustration_allowed','generated_editorial','approved','approved','needs_review','needs_review',1536,1024,'Illustration of a textured ring, ring mandrel, polymer clay earring pieces, wire, and jewelry pliers','Editorial technique overview only. Every launch jewelry product still requires accurate close-up photographs.',1,'Editorial macro illustration with ring, mandrel, polymer-clay pieces, wire and pliers; no text, logo or actual-inventory claim.',0,50),
  ('polymer_clay_macro','public_static','Polymer-clay earring photograph','/polymer-clay-earrings-ontario/','jewelry_macro','/assets/visual-placeholders/jewelry-macro.svg',NULL,'real_photo_required','placeholder','needs_review','needs_review','unchecked','unchecked',1600,1000,'Close view of approved Devil n Dove polymer clay earrings','Photograph the real item and show surface, attachment and scale.',0,NULL,1,60),
  ('laser_engraving_proof','public_static','Laser engraving proof photograph','/laser-engraving-ontario/','engraving_detail','/assets/visual-placeholders/engraving-detail.svg',NULL,'real_photo_required','placeholder','needs_review','needs_review','unchecked','unchecked',1600,1000,'Close view of an approved Devil n Dove laser engraving project','Show a truthful finished result and material detail.',0,NULL,1,70),
  ('candle_process','public_static','Candle colour and process photograph','/custom-candle-making-ontario/','candle_process','/assets/visual-placeholders/candle-colour.svg',NULL,'real_photo_required','placeholder','needs_review','needs_review','unchecked','unchecked',1600,1000,'Approved Devil n Dove candle colour and making detail','Avoid an active-flame safety implication unless the scene is controlled and accurate.',0,NULL,1,80),
  ('soap_process','public_static','Soap texture and process photograph','/custom-soap-making-ontario/','soap_texture','/assets/visual-placeholders/soap-texture.svg',NULL,'real_photo_required','placeholder','needs_review','needs_review','unchecked','unchecked',1600,1000,'Approved Devil n Dove soap texture and making detail','Match the photographed formula and final approved label facts.',0,NULL,1,90),
  ('vintage_condition','public_static','Vintage condition photograph','/vintage-finds-ontario/','vintage_condition','/assets/visual-placeholders/vintage-condition.svg',NULL,'real_photo_required','placeholder','needs_review','needs_review','unchecked','unchecked',1600,1000,'Detailed condition view of an identified vintage item','Show flaws and condition accurately; do not reuse a representative image as item proof.',0,NULL,1,100),
  ('workshop_gift_process','public_static','Workshop-made gift process photograph','/workshop-made-gifts-ontario/','gift_process','/assets/visual-placeholders/product-process.svg',NULL,'real_photo_required','placeholder','needs_review','needs_review','unchecked','unchecked',1600,1000,'Devil n Dove workshop-made gift in progress','Use a documented current project and preserve privacy.',0,NULL,1,110),
  ('product_material_detail','public_static','Product material detail photograph','/shop/','material_detail','/assets/visual-placeholders/material-detail.svg',NULL,'real_photo_required','placeholder','needs_review','needs_review','unchecked','unchecked',1600,1000,'Close view showing the material and finish of a current product','Dynamic launch products need item-specific media rather than a generic substitute.',0,NULL,1,120),
  ('product_scale','public_static','Product scale photograph','/shop/','product_scale','/assets/visual-placeholders/product-scale.svg',NULL,'real_photo_required','placeholder','needs_review','needs_review','unchecked','unchecked',1600,1000,'Current product shown with an accurate scale reference','Use a familiar, non-misleading scale reference and retain dimensions in text.',0,NULL,1,130),
  ('product_care_packaging','public_static','Product care and packaging photograph','/shop/','care_packaging','/assets/visual-placeholders/product-care.svg',NULL,'real_photo_required','placeholder','needs_review','needs_review','unchecked','unchecked',1600,1000,'Current product with its approved care and packaging materials','Packaging in the photograph must match the shipped launch configuration.',0,NULL,1,140),
  ('gift_card_artwork','public_static','Main gift-card artwork','/gift-cards/','gift_card_artwork','/assets/generated/editorial/gift-card-brand-illustration.webp','/assets/generated/editorial/gift-card-brand-illustration.webp','editorial_illustration_allowed','owner_review','approved','needs_review','needs_review','needs_review',1536,1024,'Decorative illustration of a pale blue dove, warm orange flames, jewelry tools, a ring, and an engraved tag','Decorative artwork may be final after owner, mobile and desktop approval. It does not state a value or balance.',1,'Decorative brand illustration with dove/icy-blue and flame/orange sides, workshop tools, ring and engraved tag; no text, currency, QR or value.',0,150),
  ('workshop_journal_hero','public_static','Workshop Journal hero and story image','/workshop-journal/','journal_hero','/assets/visual-placeholders/workshop-journal.svg',NULL,'real_photo_required','placeholder','needs_review','needs_review','unchecked','unchecked',1600,1000,'Current Devil n Dove workshop story photograph','Use real, dated story evidence rather than generalized generated proof.',0,NULL,1,160),
  ('launch_product_primary','dynamic_catalog','Launch-product primary photographs','/shop/','product_primary','/assets/product-placeholder.svg',NULL,'real_photo_required','missing','needs_review','needs_review','unchecked','unchecked',1600,1600,'Specific launch product photographed accurately','Create one manifest row per frozen launch product in Catalog Media; include feature, detail, scale and packaging roles where promised.',0,NULL,1,170),
  ('events_page','public_static','Events page photograph','/events/','events_hero','/assets/visual-placeholders/events.svg',NULL,'real_photo_required','placeholder','needs_review','needs_review','unchecked','unchecked',1600,1000,'Devil n Dove at an identified event or market','Publish only when the event, date and consent are accurate.',0,NULL,1,180),
  ('pickup_page','public_static','Local pickup photograph','/pickup/','pickup_hero','/assets/visual-placeholders/pickup.svg',NULL,'real_photo_required','placeholder','needs_review','needs_review','unchecked','unchecked',1600,1000,'Approved local pickup handoff or location detail','Do not expose a private home address, vehicle plate or customer identity.',0,NULL,1,190),
  ('tools_and_supplies','public_static','Tools, toolshed, and supplies photographs','/tools/','tools_supplies','/assets/visual-placeholders/tools.svg',NULL,'real_photo_required','placeholder','needs_review','needs_review','unchecked','unchecked',1600,1000,'Tools and supplies actually used in the Devil n Dove workshop','Use accurate tool names and disclose affiliate or external links where applicable.',0,NULL,1,200)
ON CONFLICT(manifest_key) DO UPDATE SET
  manifest_group=excluded.manifest_group,
  manifest_title=excluded.manifest_title,
  page_path=excluded.page_path,
  slot_key=excluded.slot_key,
  recommended_width=excluded.recommended_width,
  recommended_height=excluded.recommended_height,
  required_asset_kind=excluded.required_asset_kind,
  generated_asset=excluded.generated_asset,
  generated_prompt_summary=excluded.generated_prompt_summary,
  is_launch_blocker=excluded.is_launch_blocker,
  sort_order=excluded.sort_order,
  is_active=1,
  updated_at=CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
INSERT INTO schema_migration_ledger (migration_key,file_name,applied_at,notes)
VALUES ('build230_visual_image_manifest','database_build230_visual_image_manifest.sql',CURRENT_TIMESTAMP,'Adds the mutable visual image manifest, append-only review history, and provenance for three responsive editorial illustrations without treating generated art as product proof.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name,notes=excluded.notes;
