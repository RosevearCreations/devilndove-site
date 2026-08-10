# Build 246 continuity extension

Operational continuity now also depends on audited Creative Project deletion/inventory return, idempotent finished-product production releases, product ingredient snapshots, CAIP same-project duplicate prevention and packaging translation review evidence. Build 240 remains the origin of this specialist workstream document; current release authority is `AI_HANDOFF.md` + `PROJECT_STATUS_AND_ROADMAP.md`.


The Build 240 Operational Continuity model remains specialist authority. The retained Build 245 foundation adds stronger admin degraded-auth handling and a schema foundation for bounded API-health observations; Cloudflare Observability/runtime incidents remain the production evidence for Worker CPU/memory/D1-overload events.

# Operational Continuity and Evidence — Build 240

Build 240 converts twenty roadmap items into database-backed, operator-visible foundations at `/admin/operational-continuity/`. The page is an evidence and control centre, not proof that a live provider or physical workflow has passed.

## The twenty completed foundations

1. **Production evidence cases** — expected result, actual result, safe reference, status, owner and append-only events.
2. **Idempotency claims** — one unique key per repeat-sensitive operation with duplicate detection and safe result reference.
3. **Packaging reservations** — project/version-level packaging reservations with finished-unit quantity and unique idempotency key.
4. **Packaging reservation lines** — component, inventory item, lot, required/reserved/consumed/reversed quantities and shortage state.
5. **Formula authority links** — packaging points to a verified formula source key, version and checksum rather than copying ingredients again.
6. **Packaging release locks** — approved version checksum, proof reference, supersession and reprint state.
7. **Prepress checks** — dimensions, bleed, safe margin, text fit, region overflow, barcode/QR destination and font status.
8. **Provider result reconciliation** — local reference versus observable provider ID/URL and expected/actual payload summaries.
9. **Notification delivery attempts** — provider attempt number, status, message ID, retry time and sanitized response/error.
10. **Mobile evidence recovery** — interruption-safe phone drafts with EXIF, privacy, rights, derivative and R2 state.
11. **Deployed asset checks** — URL/status/content type/dimensions/bytes/load time/duplicate hash/structured-data exposure.
12. **Product media-role requirements** — feature, detail, scale and packaging rows per product without copying product facts.
13. **Consent-safe support history** — private customer reference, question/status, next action, follow-up and order/product link.
14. **Accounting close checklist** — period-specific evidence, owner, blocker and pass/not-applicable state.
15. **Controlled low-risk batch approvals** — reviewed IDs, criteria, risk, rollback and apply state; Build 240 rejects non-low-risk creation.
16. **Local SEO observations** — page, location, query, Search Console, Business Profile, reviews and conversions by date.
17. **Public-page audits** — build/page-level one-H1, title, description, canonical, links, images, alt, assets and JSON-LD results.
18. **Route fallback policies** — explicit no-false-success copy, retry state, safe navigation and incident scope.
19. **Phone operations cards** — mobile shortcuts for evidence, packaging, notifications, support, accounting, SEO and release blockers.
20. **Schema and Markdown authority** — Build 240 migration synchronized across the numbered/current/aggregate SQL files and two canonical project documents.


## Table map

`runtime_incidents`, `operational_workstreams`, `production_evidence_cases`, `production_evidence_events`, `operation_idempotency_claims`, `packaging_inventory_reservations`, `packaging_inventory_reservation_lines`, `packaging_formula_source_links`, `packaging_release_locks`, `packaging_prepress_checks`, `provider_result_reconciliations`, `notification_delivery_attempts`, `mobile_evidence_drafts`, `deployed_asset_check_results`, `product_media_role_requirements`, `customer_support_interactions`, `accounting_close_checklist_items`, `controlled_batch_approvals`, `local_seo_observation_snapshots`, `public_page_audit_results`, `route_fallback_policies`, and `mobile_operations_cards`.

## Safe operating rules

- Build 240 remains the prerequisite that created Operational Continuity. On an older database, apply `database_build240_operational_evidence_continuity.sql` first. The **current-pass** file now belongs to Build 241, so do not use it as a substitute for a missing Build 240 ledger row.
- `runtime_incidents` is migration-managed; shared error capture performs no request-time incident-table creation.
- Back up D1 first and confirm prior Build 234 ledger state.
- Never store passwords, tokens, full payment data or unnecessary customer information.
- A feature row or a green button does not prove a provider, physical material, concurrency or live fulfilment outcome.
- Failed evidence reopens the affected Startup gate and keeps the workstream Blocked or In progress.
- Representative images do not replace exact item photographs for Product/Offer evidence.

## Database authority

The numbered migration creates the Build 240 tables, twenty workstream seeds, route fallbacks, mobile cards, 36 static public-page audit rows, the 45th Startup gate and ledger key `build240_operational_evidence_continuity`. Runtime requests do not create schema.

## Degraded-mode boundary

When authentication, API or D1 fails, the browser shows a static list of twenty workstreams and labels every live status unknown. Saving remains unavailable and no item is inferred complete.
