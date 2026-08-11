-- Devil n Dove Build 250 — product editor media recovery and product-resource usage reliability.
-- Run after Build 249. Back up D1 first. Additive/idempotent data normalization only.
PRAGMA foreign_keys = ON;

-- Historical or incomplete links with no meaningful quantity should behave like a newly
-- linked resource: one usage unit per finished item/batch until explicitly changed.
UPDATE product_resource_links
SET quantity_used = 1,
    updated_at = CURRENT_TIMESTAMP
WHERE quantity_used IS NULL OR quantity_used <= 0;
