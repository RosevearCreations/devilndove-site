-- Release 467 Build 452: provenance-first Maker storyboards, no raw-media copy,
-- Product image rewrite, live publication, provider call or fabricated consent.
CREATE TABLE IF NOT EXISTS maker_media_story_revisions (
 maker_media_story_revision_id INTEGER PRIMARY KEY AUTOINCREMENT,
 creative_work_project_id INTEGER NOT NULL REFERENCES creative_work_projects(creative_work_project_id) ON DELETE RESTRICT,
 product_id INTEGER REFERENCES products(product_id) ON DELETE RESTRICT,
 revision_label TEXT NOT NULL CHECK(length(trim(revision_label))>=4),
 story_kind TEXT NOT NULL CHECK(story_kind IN ('product_story','workshop_journal','tutorial','learning_failure')),
 story_title TEXT NOT NULL CHECK(length(trim(story_title))>=8),
 narrative TEXT NOT NULL CHECK(length(trim(narrative))>=30),
 intended_visibility TEXT NOT NULL DEFAULT 'internal_only' CHECK(intended_visibility IN ('internal_only','public_candidate')),
 edited_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(creative_work_project_id,revision_label)
);
CREATE INDEX IF NOT EXISTS idx_maker_media_story_project ON maker_media_story_revisions(creative_work_project_id,maker_media_story_revision_id DESC);
CREATE TRIGGER IF NOT EXISTS trg_maker_media_story_project_guard BEFORE INSERT ON maker_media_story_revisions BEGIN
 SELECT RAISE(ABORT,'maker_story_product_unlinked_to_project') WHERE NEW.product_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM creative_work_projects p WHERE p.creative_work_project_id=NEW.creative_work_project_id AND p.product_id=NEW.product_id
  UNION SELECT 1 FROM creative_project_product_links l WHERE l.creative_work_project_id=NEW.creative_work_project_id AND l.product_id=NEW.product_id
  UNION SELECT 1 FROM maker_quality_attempts a JOIN maker_quality_product_links q ON q.maker_quality_attempt_id=a.maker_quality_attempt_id
   WHERE a.creative_work_project_id=NEW.creative_work_project_id AND q.product_id=NEW.product_id);
 SELECT RAISE(ABORT,'maker_story_public_project_not_authorized') WHERE NEW.intended_visibility='public_candidate' AND NOT EXISTS (
  SELECT 1 FROM creative_work_projects p WHERE p.creative_work_project_id=NEW.creative_work_project_id
    AND p.privacy_status='public_candidate' AND p.rights_status='public_allowed');
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_media_story_immutable BEFORE UPDATE ON maker_media_story_revisions BEGIN SELECT RAISE(ABORT,'maker_story_revision_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_media_story_no_delete BEFORE DELETE ON maker_media_story_revisions BEGIN SELECT RAISE(ABORT,'maker_story_revision_append_only'); END;

-- Source identity resolves only via canonical Creative Process / Product media.
-- Human labels never create asset, upload or public Product gallery changes.
CREATE TABLE IF NOT EXISTS maker_media_story_frames (
 maker_media_story_frame_id INTEGER PRIMARY KEY AUTOINCREMENT,
 maker_media_story_revision_id INTEGER NOT NULL REFERENCES maker_media_story_revisions(maker_media_story_revision_id) ON DELETE RESTRICT,
 source_kind TEXT NOT NULL CHECK(source_kind IN ('creative_event','product_image','product_video','media_asset')),
 source_id INTEGER NOT NULL CHECK(source_id>0),
 moment TEXT NOT NULL CHECK(moment IN ('before','during','after','detail','tutorial','failure')),
 frame_label TEXT NOT NULL CHECK(length(trim(frame_label))>=4),
 caption TEXT NOT NULL CHECK(length(trim(caption))>=12),
 alt_description TEXT NOT NULL CHECK(length(trim(alt_description))>=12),
 is_principal INTEGER NOT NULL DEFAULT 0 CHECK(is_principal IN (0,1)),
 publication_intent TEXT NOT NULL DEFAULT 'internal_only' CHECK(publication_intent IN ('internal_only','public_candidate')),
 consent_record_id INTEGER REFERENCES media_consent_records(consent_record_id) ON DELETE RESTRICT,
 sort_order INTEGER NOT NULL DEFAULT 0,
 added_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(maker_media_story_revision_id,source_kind,source_id)
);
CREATE INDEX IF NOT EXISTS idx_maker_media_story_frames_order ON maker_media_story_frames(maker_media_story_revision_id,sort_order,maker_media_story_frame_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_maker_media_story_principal ON maker_media_story_frames(maker_media_story_revision_id) WHERE is_principal=1;
CREATE TRIGGER IF NOT EXISTS trg_maker_story_frame_guard BEFORE INSERT ON maker_media_story_frames BEGIN
 SELECT RAISE(ABORT,'maker_story_revision_reviewed_locked') WHERE EXISTS (
  SELECT 1 FROM maker_media_story_release_reviews r WHERE r.maker_media_story_revision_id=NEW.maker_media_story_revision_id AND r.decision='approved_candidate');
 SELECT RAISE(ABORT,'maker_story_event_wrong_project_or_void') WHERE NEW.source_kind='creative_event' AND NOT EXISTS (
  SELECT 1 FROM maker_media_story_revisions s JOIN creative_work_events e ON e.creative_work_project_id=s.creative_work_project_id
  WHERE s.maker_media_story_revision_id=NEW.maker_media_story_revision_id AND e.creative_work_event_id=NEW.source_id
   AND e.entry_status='active' AND length(trim(COALESCE(e.media_url,'')))>0);
 SELECT RAISE(ABORT,'maker_story_image_wrong_product') WHERE NEW.source_kind='product_image' AND NOT EXISTS (
  SELECT 1 FROM maker_media_story_revisions s JOIN product_images i ON i.product_id=s.product_id
  WHERE s.maker_media_story_revision_id=NEW.maker_media_story_revision_id AND i.product_image_id=NEW.source_id
   AND length(trim(COALESCE(i.image_url,'')))>0);
 SELECT RAISE(ABORT,'maker_story_video_wrong_product_or_blocked') WHERE NEW.source_kind='product_video' AND NOT EXISTS (
  SELECT 1 FROM maker_media_story_revisions s JOIN product_video_attachments v ON v.product_id=s.product_id
  WHERE s.maker_media_story_revision_id=NEW.maker_media_story_revision_id AND v.product_video_id=NEW.source_id
   AND v.publication_status<>'blocked' AND length(trim(COALESCE(v.video_url,'')))>0);
 SELECT RAISE(ABORT,'maker_story_asset_wrong_product_or_deleted') WHERE NEW.source_kind='media_asset' AND NOT EXISTS (
  SELECT 1 FROM maker_media_story_revisions s JOIN media_assets m ON m.product_id=s.product_id
  WHERE s.maker_media_story_revision_id=NEW.maker_media_story_revision_id AND m.media_asset_id=NEW.source_id
   AND m.deleted_at IS NULL AND length(trim(COALESCE(m.object_key,'')))>0);
 SELECT RAISE(ABORT,'maker_story_public_revision_required') WHERE NEW.publication_intent='public_candidate' AND NOT EXISTS (
  SELECT 1 FROM maker_media_story_revisions s JOIN creative_work_projects p ON p.creative_work_project_id=s.creative_work_project_id
  WHERE s.maker_media_story_revision_id=NEW.maker_media_story_revision_id AND s.intended_visibility='public_candidate'
   AND p.privacy_status='public_candidate' AND p.rights_status='public_allowed');
 SELECT RAISE(ABORT,'maker_story_event_not_public_candidate') WHERE NEW.publication_intent='public_candidate' AND NEW.source_kind='creative_event'
  AND NOT EXISTS(SELECT 1 FROM creative_work_events WHERE creative_work_event_id=NEW.source_id AND is_public_candidate=1);
 SELECT RAISE(ABORT,'maker_story_video_not_publicly_reviewed') WHERE NEW.publication_intent='public_candidate' AND NEW.source_kind='product_video'
  AND NOT EXISTS(SELECT 1 FROM product_video_attachments WHERE product_video_id=NEW.source_id AND publication_status='product_page_ok');
 SELECT RAISE(ABORT,'maker_story_media_asset_not_public') WHERE NEW.publication_intent='public_candidate' AND NEW.source_kind='media_asset'
  AND NOT EXISTS(SELECT 1 FROM media_assets WHERE media_asset_id=NEW.source_id AND length(trim(COALESCE(public_url,'')))>0);
 SELECT RAISE(ABORT,'maker_story_consent_required_and_source_matched') WHERE NEW.publication_intent='public_candidate' AND NOT EXISTS (
  SELECT 1 FROM media_consent_records c WHERE c.consent_record_id=NEW.consent_record_id
   AND c.consent_status IN ('granted','not_required') AND c.public_use_allowed=1
   AND c.consent_scope IN ('product_page','website_gallery','all_public')
   AND (c.expires_at IS NULL OR date(c.expires_at)>=date('now'))
   AND c.media_url=CASE NEW.source_kind
    WHEN 'creative_event' THEN (SELECT media_url FROM creative_work_events WHERE creative_work_event_id=NEW.source_id)
    WHEN 'product_image' THEN (SELECT image_url FROM product_images WHERE product_image_id=NEW.source_id)
    WHEN 'product_video' THEN (SELECT video_url FROM product_video_attachments WHERE product_video_id=NEW.source_id)
    WHEN 'media_asset' THEN (SELECT public_url FROM media_assets WHERE media_asset_id=NEW.source_id) END);
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_story_frame_immutable BEFORE UPDATE ON maker_media_story_frames BEGIN SELECT RAISE(ABORT,'maker_story_frame_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_story_frame_no_delete BEFORE DELETE ON maker_media_story_frames BEGIN SELECT RAISE(ABORT,'maker_story_frame_append_only'); END;

-- Approval is a PRIVATE editorial candidate receipt, never a public release.
CREATE TABLE IF NOT EXISTS maker_media_story_release_reviews (
 maker_media_story_release_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
 maker_media_story_revision_id INTEGER NOT NULL REFERENCES maker_media_story_revisions(maker_media_story_revision_id) ON DELETE RESTRICT,
 decision TEXT NOT NULL CHECK(decision IN ('hold','internal_only','approved_candidate')),
 review_note TEXT NOT NULL CHECK(length(trim(review_note))>=12),
 reviewed_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_maker_media_review_rev ON maker_media_story_release_reviews(maker_media_story_revision_id,maker_media_story_release_review_id DESC);
CREATE TRIGGER IF NOT EXISTS trg_maker_story_release_guard BEFORE INSERT ON maker_media_story_release_reviews
WHEN NEW.decision='approved_candidate' BEGIN
 SELECT RAISE(ABORT,'maker_story_public_approval_requires_rights') WHERE NOT EXISTS (
  SELECT 1 FROM maker_media_story_revisions s JOIN creative_work_projects p ON p.creative_work_project_id=s.creative_work_project_id
  WHERE s.maker_media_story_revision_id=NEW.maker_media_story_revision_id AND s.intended_visibility='public_candidate'
   AND p.privacy_status='public_candidate' AND p.rights_status='public_allowed');
 SELECT RAISE(ABORT,'maker_story_public_approval_requires_reviewed_media') WHERE NOT EXISTS (
  SELECT 1 FROM maker_media_story_frames f WHERE f.maker_media_story_revision_id=NEW.maker_media_story_revision_id AND f.publication_intent='public_candidate');
 SELECT RAISE(ABORT,'maker_story_public_approval_has_private_or_revoked_media') WHERE EXISTS (
  SELECT 1 FROM maker_media_story_frames f LEFT JOIN media_consent_records c ON c.consent_record_id=f.consent_record_id
  WHERE f.maker_media_story_revision_id=NEW.maker_media_story_revision_id AND (
    f.publication_intent<>'public_candidate' OR COALESCE(c.consent_status,'missing') NOT IN ('granted','not_required') OR COALESCE(c.public_use_allowed,0)<>1
    OR COALESCE(c.consent_scope,'missing') NOT IN ('product_page','website_gallery','all_public') OR (c.expires_at IS NOT NULL AND date(c.expires_at)<date('now'))
    OR COALESCE(c.media_url,'')<>COALESCE(CASE f.source_kind
      WHEN 'creative_event' THEN (SELECT media_url FROM creative_work_events WHERE creative_work_event_id=f.source_id AND entry_status='active' AND is_public_candidate=1)
      WHEN 'product_image' THEN (SELECT image_url FROM product_images WHERE product_image_id=f.source_id)
      WHEN 'product_video' THEN (SELECT video_url FROM product_video_attachments WHERE product_video_id=f.source_id AND publication_status='product_page_ok')
      WHEN 'media_asset' THEN (SELECT public_url FROM media_assets WHERE media_asset_id=f.source_id AND deleted_at IS NULL)
     END,'') OR COALESCE(c.media_url,'')=''));
 SELECT RAISE(ABORT,'maker_story_product_quality_not_approved') WHERE EXISTS (
  SELECT 1 FROM maker_media_story_revisions s JOIN maker_quality_product_links l ON l.product_id=s.product_id
  WHERE s.maker_media_story_revision_id=NEW.maker_media_story_revision_id AND NOT EXISTS (
   SELECT 1 FROM maker_quality_release_reviews q WHERE q.maker_quality_attempt_id=l.maker_quality_attempt_id AND q.decision='approved_for_sale'
   AND q.maker_quality_release_review_id=(SELECT MAX(x.maker_quality_release_review_id) FROM maker_quality_release_reviews x WHERE x.maker_quality_attempt_id=l.maker_quality_attempt_id)));
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_story_release_immutable BEFORE UPDATE ON maker_media_story_release_reviews BEGIN SELECT RAISE(ABORT,'maker_story_release_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_story_release_no_delete BEFORE DELETE ON maker_media_story_release_reviews BEGIN SELECT RAISE(ABORT,'maker_story_release_append_only'); END;
PRAGMA foreign_key_check;
