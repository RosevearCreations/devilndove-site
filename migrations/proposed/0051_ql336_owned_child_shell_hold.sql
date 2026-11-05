-- QL-336 UNAPPLIED PROPOSAL. Not in the immutable canonical migration stream.
-- Additive registry only. D1/SQLite has no Postgres RLS: every future
-- source API must independently enforce child scope in every SQL statement.
-- No existing maker, Etsy, order, inventory, media or customer table changes.
CREATE TABLE IF NOT EXISTS maker_shell_children_ql336 (
  child_id TEXT PRIMARY KEY NOT NULL,
  shell_id TEXT NOT NULL DEFAULT 'devilndove' CHECK (shell_id='devilndove'),
  child_slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  lifecycle TEXT NOT NULL DEFAULT 'PENDING_BACKUP_OWNER_REVIEW'
    CHECK (lifecycle='PENDING_BACKUP_OWNER_REVIEW'),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS maker_shell_memberships_ql336 (
  child_id TEXT NOT NULL REFERENCES maker_shell_children_ql336(child_id),
  source_user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','manager','maker','viewer')),
  lifecycle TEXT NOT NULL DEFAULT 'PENDING_INDEPENDENT_REVIEW'
    CHECK (lifecycle='PENDING_INDEPENDENT_REVIEW'),
  PRIMARY KEY(child_id,source_user_id)
);
CREATE INDEX IF NOT EXISTS idx_maker_shell_memberships_user_ql336
  ON maker_shell_memberships_ql336(source_user_id,child_id);
CREATE TABLE IF NOT EXISTS maker_shell_resource_claims_ql336 (
  resource_kind TEXT NOT NULL CHECK (resource_kind IN
    ('product','listing','etsy_shop','inventory','order','customer','media','fulfillment','payment','export')),
  legacy_resource_id TEXT NOT NULL,
  child_id TEXT NOT NULL REFERENCES maker_shell_children_ql336(child_id),
  lifecycle TEXT NOT NULL DEFAULT 'PENDING_SOURCE_BACKFILL'
    CHECK (lifecycle='PENDING_SOURCE_BACKFILL'),
  PRIMARY KEY(resource_kind,legacy_resource_id)
);
CREATE INDEX IF NOT EXISTS idx_maker_shell_resource_claims_child_ql336
  ON maker_shell_resource_claims_ql336(child_id,resource_kind);
CREATE TABLE IF NOT EXISTS maker_shell_provider_handles_ql336 (
  child_id TEXT NOT NULL REFERENCES maker_shell_children_ql336(child_id),
  provider TEXT NOT NULL CHECK(provider IN ('etsy','stripe','paypal','media','r2','shipping','marketplace')),
  opaque_vault_ref TEXT CHECK (opaque_vault_ref IS NULL OR
    (opaque_vault_ref LIKE 'vault://%' AND length(opaque_vault_ref)<=180)),
  lifecycle TEXT NOT NULL DEFAULT 'PENDING_SEPARATE_CONSENT'
    CHECK (lifecycle='PENDING_SEPARATE_CONSENT'),
  PRIMARY KEY(child_id,provider)
);
