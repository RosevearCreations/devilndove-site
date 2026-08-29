# Release 449 — Corporate / Commerce Convergence

Status: Development source authority. Production promotion remains closed.

## Scope

Release 449 extends the existing Accounting ledger and expense framework; it does not create a parallel financial system.

The convergence adds:

- derived corporate Balance Sheet/GIFI readiness from the existing journal and GIFI mappings;
- quarterly and year-end completeness controls;
- invoice/refund fields for subtotal, discounts, shipping, taxes and totals;
- provider, marketplace and currency-conversion cost staging with explicit ledger-post traceability;
- I.T.-owned provider setup metadata that never stores or returns secret values;
- marketplace-channel controls with publication fail-closed by default;
- draft-first Etsy Product syndication that creates a local review draft and never publishes during Release 449;
- deliberate visual-placeholder and SEO/responsive work through the existing Release 448 public/admin gates.

## Accounting authority

`general_ledger_accounts`, `accounting_journal_entries`, `accounting_journal_lines`, the existing expense authorities, and the existing GIFI read service remain authoritative.

The Release 449 Balance Sheet is a derived management/readiness view. GIFI readiness is a staging/control surface for quarterly and year-end review; it is not a filed T2 return or professional accounting opinion.

Commerce cost rows are completeness evidence and posting traceability. A cost is not treated as posted to the Accounting ledger merely because a staging row exists.

## Provider authority

Provider setup rows contain names, setup authority, setup URLs, required configuration-key names and status only. API keys, OAuth tokens, signing secrets and passwords remain outside D1.

Initial Development providers are Stripe, PayPal, Etsy, Pinterest, Meta/Instagram, TikTok and YouTube. Their setup status begins `unconfigured` unless verified independently.

## Etsy safety

Etsy channel mode begins `draft_only` with `publication_allowed = 0`.

`/api/admin/etsy-product-syndication` can create/review local Etsy draft payloads. It contains no external `fetch()` call and does not publish listings. A later release must add explicit reviewed publication authority before any remote Etsy write can exist.

## D1 release sequence

1. Source implementation and source gates.
2. New additive Development migration only.
3. Verify exact Development database `devilndove-dev` and its pinned UUID.
4. Apply only Release 449 SQL.
5. Run `PRAGMA quick_check`, `PRAGMA integrity_check`, schema/seed verification and Accounting preservation checks.
6. Keep Production mutation capability unavailable.

Release 447/448 migrations are not replayed blindly. `account_id` remains absent from `wrangler.toml`.
