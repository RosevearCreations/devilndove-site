# 12 — Testing and Acceptance

## Local acceptance checks

1. Apply Build 199, Build 200, and Build 201 migrations twice to a fresh test database.
2. Confirm CAIP table/index creation and exactly one Build 201 ledger entry.
3. Seed a product, content project, and at least three content-media references with mixed source safety states.
4. Run CAIP synchronization twice; confirm one creative project and stable unique asset rows.
5. Confirm CAIP sync never deletes/updates source `product_images`, `media_assets`, `content_project_media`, source URL, source gallery order, or featured image.
6. Confirm blocked source state forces CAIP `blocked` rights state.
7. Confirm a source transition from public-cleared to review downgrades CAIP `public_allowed` to `needs_review`.
8. Confirm CAIP cannot set `public_allowed` when Content Studio source safety is not public-cleared.
9. Confirm manual asset tags/notes and locked evidence/segments survive a refresh.
10. Confirm recommendations expose reasons/status but do not auto-accept or auto-publish.
11. Confirm internal CAIP approval does not change Release Board/public content status.
12. Confirm manifest has source-safe flags and contains no credentials.
13. Confirm all JS parses, admin pages are `noindex,nofollow`, public pages still have one visible H1, and CSS braces are balanced.
14. Confirm at phone/tablet/desktop widths every CAIP action remains reachable and the layout does not overflow.

## Live acceptance checks

1. Back up D1 and deploy Build 201.
2. Verify migration ledger, `/admin/creative-assets/`, and `/api/admin/creative-assets` as authenticated admin.
3. Use one disposable real approved product with public-cleared and needs-review source items.
4. Verify original media direct URLs and Featured Image URL before and after every CAIP action.
5. Review the same project in Content Studio, CAIP, Release Board, and public pages; verify ownership boundaries are unchanged.
6. Test a CAIP sync with source media blocked, then with source consent/public review changed; confirm the stricter state propagates.
7. Download and inspect a CAIP manifest; confirm it contains no secret, token, signed URL, or unapproved output claim.
8. Check Cloudflare logs for 4xx validation vs 5xx/server errors. Correct rights validation in the UI rather than retrying it blindly.

## Definition of done for Build 201

Build 201 is ready only when a deployed user can safely synchronize a real product package, review CAIP assets/evidence/segments, return to Content Studio/Release Board, and prove that no original product/R2 media was changed by CAIP.

## Build 202 acceptance tests

1. Apply Builds 199–202 twice in a fresh SQLite/D1-compatible test database; verify one Build 202 ledger row and all eight Build 202 tables.
2. Seed a CAIP asset linked to a bound R2 object key; run a probe with fake R2 `head()` response and verify only metadata records change.
3. Repeat with no bucket binding and with an R2 missing object; verify `metadata_only`/`missing` record without deleting or modifying the CAIP source asset.
4. Create each derivative template; verify output URL/key/checksum are blank and `verification_status = not_created`.
5. Approve a plan; verify the status becomes internally approved but no provider run is created.
6. Create a secure review grant; verify D1 has a SHA-256 hash, no raw token, bounded expiry/view count, and audit row.
7. Verify secure review fails without admin auth, from another administrator, after expiry, after max views, and after revoke.
8. Verify a successful review proxy response is `private, no-store`, same-origin only, no-referrer, no-frame, and streams the original object.
9. Confirm existing Content Studio package, CAIP asset/evidence/story data, Release Board draft, product image order, and R2 source object remain unchanged.
10. Run JavaScript syntax, one-H1, local-reference, CSS brace, service-worker/cache, mobile-layout, and package-integrity checks.
