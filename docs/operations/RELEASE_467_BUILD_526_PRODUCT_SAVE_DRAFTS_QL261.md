# Devil n Dove — Release 467 Build 526

**Scope:** Product Editor save recovery, uncluttered owner draft intake, current
photo exception review, QL-260/QL-261 source-app status. Code-only deployment;
no D1 migration, new secret or live Etsy/Meta mutation is part of deployment.

## Owner-facing flow

1. Open a saved Product or create a local draft. Fill Basics, Pricing/Stock,
   Description, Tags/SEO and the shared original Media gallery as appropriate.
2. Select **Etsy — create or update draft** and/or **Facebook Marketplace —
   prepare draft**. These selections save a local preference without demanding
   a second preference-only checkbox. Press **Save Product**.
3. Press **Create Etsy draft** or **Update Etsy draft #ID**. The application
   reads the unique original primary-D1 listing claim first, verifies the actual
   Etsy shop, Canada-only profile, policy-compatible tags, unpublished state
   and all approved original photos, then asks for explicit final confirmation.
   It never guesses a listing ID or creates a duplicate when one is recorded.
4. Marketplace prepares an owner-copyable title, CAD price, description and
   links to the same approved original images. It does **not** claim a Facebook
   Marketplace API POST because a supported posting connection is not proven.
5. If the draft/action's image readback is uncertain, keep the existing draft
   and use the preserved advanced photo reconciliation. Never blindly repeat
   an image upload or create another listing to repair it.

## Save 500 response and browser recovery

- Local Product update compares all already-supported columns and changes
  only values that differ. This avoids gratuitously firing publication,
  quality-release, finished-piece quantity and active-stock triggers.
- A Product update and SEO update execute in a single D1 `batch` transaction,
  so a rejected SEO write cannot leave the submitted product update half-saved.
- Known protection-rule failures return an actionable 409 instead of an
  opaque HTTP 500; capacity exhaustion remains a distinct 503.
- A 5xx/timeout remains **outcome unknown**: one read-only server comparison
  must precede any new write. The original submitted fields are now restorable
  even if the separate browser recovery snapshot did not exist. The operator
  can explicitly keep the saved server version or restore browser fields for
  review; neither choice itself repeats the failed POST.
- Existing Product records, Etsy IDs and stored gallery rows are never
  overwritten during page startup or release deployment. No attempt to modify
  the three reported failed products is made without their real readback.

## Browser-console warnings

- Added a same-origin `report-uri` and minimal `/api/csp-report` collector for
  the existing stricter CSP Report-Only policy. The collector logs only safe
  directive names, not full URLs or private session details. Enforcing CSP
  and its per-response script/style nonces remain unchanged.
- Firefox Roboto visibility diagnostics and the early forced-layout warning
  do not constitute the observed `/api/admin/product-editor-save` 500.

## QL-260/QL-261 independent custodian decision

**DISCONNECTED / HOLD.** Real Ed25519 source signer possession, a separately
authenticated custodian, an independent witness and reviewer, verified public
SPKI pin through another trusted channel, and exact-source signed proof B
remain unprovided. The nonproduction read-only Comms Hub endpoint has not been
authenticated or exercised. Owner TEST approval has **not** been given.
No private witness identity, signing material or simulated `ql246-source-proof.json`
is committed. The separate original source proof remains unresolved. Etsy and
Marketplace product draft controls are not made available to Comms Hub.

## Verification boundary

Automated tests cover changed-field saves, trigger-denial responses, UI wiring,
stored-ID routing and preserved photo/link safeguards. A fresh live owner
Product/Etsy/photo receipt and the actual three failed Product records require
an authenticated operator's deliberate readback after production deployment.
Do not label these observations successful without their real receipts.

**Queued successor:** Build 527 — Real Three-Product Save Recovery Readback,
Single-Draft Image Reconciliation & Optional Owner Acceptance Closure.
