# Build 240 Validation

## Local automated checks

Run from the repository root:

```bash
python3 scripts/build240_public_page_audit.py
node scripts/build240_operational_continuity_test.mjs
node scripts/build230_visual_manifest_test.mjs
node scripts/build231_product_autosave_test.mjs
node scripts/build232_product_removal_test.mjs
node scripts/build233_login_resource_test.mjs
node scripts/build234_packaging_creative_test.mjs
node scripts/build235_creative_readiness_test.mjs
python3 scripts/predeploy_sanity_check.py
python3 scripts/deployment_preflight_static_check.py
python3 scripts/dark_theme_regression_check.py
node --check functions/api/admin/operational-continuity.js
node --check public/js/admin-operational-continuity.js
node --check sw.js
```

Expected Build 240 results:

- numbered/current-pass SQL are byte-identical;
- all three aggregate schemas apply and can safely reapply Build 240;
- 22 migration-managed tables exist, 20 operational workstreams are active, 36 static public audits are stored, and 45 Startup gates are active;
- all 36 exposed static public pages have exactly one H1, title, description, canonical, crawlable internal link, descriptive image alternative text, resolvable local images and parseable JSON-LD;
- Operational Continuity has one H1, `noindex,nofollow`, bounded authenticated reads, no request-time schema DDL, twenty allowed actions and a static no-false-success fallback;
- responsive CSS stacks forms/cards on phones and contains table overflow;
- retained autosave, product removal, bounded login, packaging and Creative Automation checks still pass.


## Recorded local result

- Build 240 operational/schema/Startup/fallback regression — **PASS**.
- Retained Build 230–235 regressions — **PASS**.
- Build 239 18-route visual/static fallback regression — **PASS**.
- Build 240 public audit — **36/36 passed, 0 warnings, 0 failures**.
- Global active `/assets/...` reference audit — **126 references, 0 missing**.
- Predeploy sanity — **109 pages, 0 issues**.
- Deployment preflight — **Ready, 0 blockers, 0 warnings**.
- Dark-theme regression — **PASS**.
- Final deployment blocker check — **PASS**.
- Numbered/current-pass migration identity and aggregate reapply — **PASS**.

This container blocked headless-browser navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`, so Build 240 does not claim a new live-browser production pass. The retained Build 239 route regression passed, and deployed phone/desktop browser checks remain required after upload.

## D1 deployment procedure

1. Back up D1 and record the recovery bookmark/reference.
2. Confirm ledger key `build234_packaging_templates_creative_cleanup` is present.
3. Apply exactly one of:
   - `database_build240_operational_evidence_continuity.sql`
   - `database_upgrade_current_pass.sql`
4. Confirm ledger key `build240_operational_evidence_continuity` appears once.
5. Confirm 20 active `operational_workstreams`, 36 Build 240 `public_page_audit_results`, seven `mobile_operations_cards`, two `route_fallback_policies`, and 45 active Startup rows.
6. Deploy the complete ZIP and hard refresh to service-worker shell v18.

## Live tests still required

- Create evidence cases for login, autosave, webhook duplication, concurrency, refund, email, restore, packaging and controlled opening.
- Prove a duplicate idempotency key does not repeat a payment, stock, packaging or provider action.
- Reserve, release, consume and reverse one owner-controlled packaging BOM with actual lots and counted quantities.
- Verify formula/version/checksum authority, packaging version lock and measured physical print/laser proof.
- Reconcile observable provider IDs/URLs and notification delivery outcomes.
- Interrupt and recover a phone evidence draft; inspect EXIF/privacy/rights and R2 derivatives.
- Run deployed asset checks and browser overflow checks against the production domain.
- Record one support follow-up, one accounting close period, one low-risk batch review and one local SEO observation snapshot.

No live/provider/physical gate passes merely because the schema, route or form exists.
