# Build 509 — Product #53 exception resolution, original-photo freshness and gateway security handoff

## Owner-safe scope

**Product #53** (`DND-01130`, `adventurine-argon`) must continue to use the original unpublished Etsy draft **#4603838854**. This build does not create or publish a replacement, retry an uncertain image upload, move a claim, update Etsy, issue credentials, connect businesses, or enable customer/product data transfer, calls, SMS, events or commands. Production deployment GREEN is separate from real owner acceptance.

## Photo freshness and independent review

- The shared Product/Etsy evidence SHA-256 digest now includes each source original's actual image URL, role, public-use state and alternative text plus the current Etsy image URLs. A replacement at the *same image ID* changes the digest and invalidates prior owner authorization.
- The Build 509 review shows **three paired photographs**, source original #344/#345/#346 beside its corresponding actual Etsy image. This is a read-only view. Matching image IDs/URLs and local receipts are technical prerequisites, not proof that the images are visually identical. The owner/reviewer must inspect them.
- Build 504 owner sign-off and Build 508 owner closeout now reject a current photograph with a missing source URL, remote URL, ambiguous photo pairing or incorrect exact count. Their previous digest becomes stale if URLs/metadata change; the owner must redo the actual content inspection and record fresh receipts.
- `/api/admin/product-etsy-independent-review-509` GET is a separate verified Admin readback of the actual Etsy listing, media/source URLs and most recent owner closeout. No remote writes occur.
- **Exception follow-up:** An owner can record a specific category and next action in `etsy_509_exception_followup_recorded`, even when Product #53 has **no confirmed local draft link** and the live evidence fingerprint is unknown. This documents the issue without claiming the draft is verified, releasing HOLD or touching Etsy.
- **Independent current-evidence acceptance:** Only a second, different verified Admin may append `etsy_509_independent_owner_trial_accepted`, and only after the exact current listing, metadata, all three URLs/receipts, digest and genuine Build 508 owner closeout match. The second Admin must separately confirm the photos, details, Canada-only unpublished state and independence. One outcome per fingerprint prevents duplicate approval. This is local source-linked evidence, not Etsy publication.

No migration or new D1 database is required. Audits use existing `admin_action_audit` with a unique request key, exact source, same-origin Admin authorization, and atomic duplicate check. A changed/uncertain provider readback stays HOLD.

## Gateway security approval handoff

- The admin-only GET `/api/admin/integration-gateway-security-handoff-509` independently reviews existing signed, replay-protected v1 **health** and **capabilities** GET receipt evidence from AI Data Platform.
- Only when server-only HMAC binding and key ID are configured and both latest matching signed GET audit receipts yield **TESTING** may the owner explicitly prepare a security handoff.
- Four separate attestations cover credential rotation/revocation, company isolation, server-only secrets and no-live-dispatch/data-access scope. The POST adds one idempotent `rosevear_integration_509_security_handoff` audit receipt. It returns no secret, provisions no key and never marks the gateway CONNECTED.
- Server-only binding names: `ROSEVEAR_INTEGRATION_KEY_ID_V1`, `ROSEVEAR_INTEGRATION_HMAC_SECRET_V1`, `ROSEVEAR_INTEGRATION_ENVIRONMENT_V1`, optional `ROSEVEAR_INTEGRATION_REVOKED_V1`. Provision through the approved secure environment manager, not browser inputs or a shared markdown handoff.
- Future live data sharing, Product access, events or commands require a new independently verified contract and explicit owner authorization. Do not infer live connection from TESTING.

## Verification

Run all Build 500–509 tests, specifically `node scripts/release467_build509_etsy_freshness_exception_gateway_handoff.test.mjs`, then `python scripts/current_application_quality_gate.py` and protected dev/main release checks. Confirm Cloudflare Pages deployment, live editor `?v=509`, and the separate production live-resource integrity proof. Keep true Etsy owner approval/independent second-human review and actual gateway provisioning as separate, owner-observed work.

**Next expected Build 510 — Product #53 Unlinked Draft Recovery Witness Trail, Verified Source-Photo Pairing Retest & Gateway Approval Separation Audit.**
