# Project Status and Roadmap — Release 452 Application Streamlining & UX/SEO Depth

Updated: 2026-08-29

`development-release.json` is the machine authority. `AI_HANDOFF.md` is the compact human handoff. `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md` is the permanent D1/R2 startup authority.

## Current Development position

- Current release: **452 — Application Streamlining & UX/SEO Depth**
- Source branch: `dev`
- Development Pages project: `devilndove-site-dev`
- Development D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- D1 schema authority: **verified through Release 450**
- Release 451: complete source-only marketplace calibration/SEO assurance; no D1 migration.
- Release 452: source-only application/repository convergence; **no D1 migration required**.
- Development account selection remains pinned by tooling/GitHub Actions; never add `account_id` to `wrangler.toml`.
- Provider execution/publication: **closed**.
- Production `main` / live `devilndove-site`: **untouched; promotion closed**.

## Release 452 batch

Release 452 is focused on application streamlining, permanent repository hygiene, public SEO depth, and representative admin usability/accessibility while provider credentials are unavailable.

Implemented source changes:

1. Retire obsolete root Build-era D1 verification SQL from the current tree while preserving Git history.
2. Add a permanent repository hygiene gate so obsolete Build verifiers do not accumulate again.
3. Reject backup/temp artifacts such as `.bak`, `.old`, `.tmp`, `.orig`, `.rej`, and editor `~` files.
4. Reject stale current-release authority drift across the active handoff/roadmap documents.
5. Preserve exactly one H1 on principal Storefront pages.
6. Guard canonical URL depth on Shop, Product, Collections, and Collages.
7. Guard Open Graph metadata depth.
8. Guard Twitter card metadata depth.
9. Guard CollectionPage JSON-LD on Shop, Collections, and Collages.
10. Preserve the existing dynamic Product JSON-LD authority rather than creating a competing Product schema.
11. Add a visible accessible Product breadcrumb.
12. Add dynamic BreadcrumbList JSON-LD tied to the canonical Product route/title.
13. Improve below-fold Product proof-image decoding behavior.
14. Guard public image alt text on principal Storefront pages.
15. Add `/collages/` to sitemap discovery.
16. Guard principal Storefront local links against dead routes.
17. Add `noindex,nofollow` protection to Accounting admin.
18. Add non-disruptive live status announcements to Inventory Intelligence.
19. Add live status announcements to Tool Lifecycle.
20. Add live status announcements to CAIP Content Handoff.
21. Add live status announcements to Accounting.
22. Preserve responsive representative admin layouts.
23. Carry Release 451 marketplace calibration forward read-only.
24. Add a focused Release 452 source workflow.
25. Integrate Release 452 hygiene/UX/SEO into the canonical System Gate.
26. Preserve the explicit **no-new-D1-migration** convergence authority.

## Repository streamlining authority

Git history is the archive. One-off historical Build verification SQL does not belong in the active repository root once its release authority has been superseded by current gates and canonical migration/state documents.

Release 452 therefore removes the remaining obsolete root `BUILD###_*D1*VERIFICATION*.sql` artifacts from the current tree. Active Release 448 regression scripts/workflows are **not** removed because the canonical System Gate still uses them as carried-forward regression authority.

`scripts/repository_hygiene_gate.py` now makes this repeatable by checking:

- obsolete Build verifier artifacts;
- backup/temp files;
- stale current-release authority documents;
- principal Storefront route/SEO/image invariants;
- Product breadcrumb/Product schema coexistence;
- sitemap discovery routes;
- representative admin privacy/accessibility markers;
- `wrangler.toml` account-ID prohibition;
- Production/provider lock state.

## SEO and public Storefront authority

The public page rule remains: **one meaningful H1 per page**.

Release 452 extends the existing SEO system rather than replacing it:

- existing dynamic Product JSON-LD remains canonical;
- Product BreadcrumbList JSON-LD is additive and local/read-only;
- Shop, Collections and Collages retain CollectionPage JSON-LD;
- canonical/Open Graph/Twitter metadata remain guarded;
- `/collages/` is now represented in the sitemap;
- public Product proof imagery is guarded for alt text and below-fold decoding behavior;
- `scripts/public_seo_gate.py` and `scripts/public_seo_depth_gate.py` remain mandatory.

## Representative admin UX/privacy authority

Release 452 adds or guards:

- Accounting `noindex,nofollow`;
- polite live-status announcements in Inventory Intelligence, Tool Lifecycle, Accounting, and CAIP Content Handoff;
- existing responsive breakpoints in representative operational workspaces;
- marketplace admin surfaces remain private and provider execution remains disabled.

These changes do not create new Inventory, Tool, Accounting, CAIP, Product, or media authorities.

## Development D1 state

The last schema-changing release is **Release 450**.

Release 450 mutation workflow `33235769850` and independent verifier `33235803838` remain the current D1 schema proof. Release 451 and Release 452 intentionally add no migration because their features use existing verified authorities.

Mandatory startup rule:

> **A new chat is not a migration event.**

Never replay Releases 447, 448, 449 or 450 merely because a conversation/workstation changed. Read current state first, verify the exact Development D1/R2 identities read-only, and create a new additive migration only if a genuinely new durable schema authority is required.

## Current acceptance boundary

Release 452 source acceptance requires:

- `scripts/repository_hygiene_gate.py` green;
- `scripts/release452_application_streamlining_gate.py` green;
- Release 451 and Release 450 carried-forward gates green;
- Release 448 regression authorities green;
- public structural and SEO-depth gates green;
- JavaScript/Python syntax and whitespace checks green;
- current Development D1 remote transport verification remains read-only;
- Production/provider mutation capability remains absent.

The focused Release 452 source gate and canonical System Gate evidence should be recorded only after the final converged `dev` head passes them.

## Deferred acceptance / next operating work

Provider credentials are still not required for source development. The remaining provider/runtime backlog is:

1. Calibrate real Etsy listings against provider taxonomy/shipping profiles when credentials arrive.
2. Capture Etsy fee/payout evidence during provider acceptance.
3. Complete Meta catalog/commerce-account acceptance.
4. Complete Pinterest business-account/domain/catalog acceptance.
5. Complete TikTok creator-info/consent/verified-media acceptance.
6. Complete authenticated Development runtime acceptance.
7. Complete Stripe test acceptance.
8. Complete PayPal sandbox acceptance.
9. Complete CAIP private-media acceptance.
10. Perform deliberate Production promotion rehearsal only after Development review.

Source enhancements can continue meanwhile, especially responsive/admin usability, Product/collection SEO depth, accessibility, dead-route/dead-asset protection, and module workflow refinement where existing authorities already support the work.

## Non-negotiable invariants

- One current release: **452**.
- D1 schema verified through **Release 450**; Release 452 adds no migration.
- Production remains untouched unless deliberately authorized.
- Provider publication remains disabled.
- No `account_id` in `wrangler.toml`.
- No historical migration replay because a chat/workstation changed.
- Existing Product, Inventory, Accounting, media, Tool, Supply and CAIP authorities remain canonical.
- Active Release 448 regression assets remain while the System Gate depends on them.
- One meaningful H1 per public page.
- Secrets stay in proper secret stores; credential values never enter D1/source/handoff documents.
