# Devil n Dove Build 525 — Fresh Product owner evidence and QL-259 private signer review

**29 October 2026 — Release acceptance and integration authorization are separate decisions.**

## What is real in Build 525

Build 525 adds an explicit **Read actual Etsy draft and original image pairs (GET only)** action to the same Product Editor. For a **fresh saved Product** (never #48 or #53) it:

1. Re-reads the uniquely claimed numeric Etsy listing ID and its **primary D1 receipt**, saved Product SKU/slug, canonical gallery, approvals and all retained image-transfer receipts.
2. Uses the existing server-side Etsy OAuth and approved Canada-only shipping guard to GET the **actual unpublished Etsy draft and entire live image inventory**. It checks the saved title, description, CAD price, quantity, native tags, category and exact listing identity. A missing OAuth token or failed Etsy GET is a blocker, not a pretend witness.
3. Requires every approved original to have exactly one prior accepted Etsy image receipt and a unique **currently visible** Etsy image ID/HTTPS photo URL. Missing, extra, duplicate or mismatched images are a HOLD, even if the Product's Etsy listing number is saved. This only confirms the source-to-provider **receipt mapping**: it cannot prove the pixel content of images is identical.
4. Displays each **saved original and actual Etsy photo side by side**, with individually required owner checkboxes. The Admin must inspect every image, then separately acknowledge and select **Record my visual photo acceptance**.
5. Re-reads D1 and live Etsy *again* immediately before writing an owner-visual-comparison receipt to the **existing** `admin_action_audit` table, with a source fingerprint and one-time request key. The receipt is **local only**: it does not POST/PATCH to Etsy, upload photos, publish a listing, or post to Meta. A changed fingerprint, reused request key or uncertain audit write is a HOLD, not an automatic retry.

No production owner trial is automatically performed by CI. Tests use nonproduction mock fixtures and must not be described as a real Etsy acceptance. Owner-chosen earlier draft Products #48/#53 are untouched. Facebook Marketplace is still manual.

## One real Product trial to perform

1. In `https://devilndove.com/admin/product-editor/`, create and **Save a NEW Product** with real title, description, CAD price, quantity, measurements, shipping setup, SKU, slug, and original approved Media gallery. Leave #48 and #53 alone.
2. Check **Etsy**, save its preference and first-time setup; press **Check Product and all photos (read only)**. Follow the issues until ready. Acknowledge **POST one unpublished Etsy draft** once. If Etsy returns an uncertain result, **stop** and use **Verify saved Etsy ID**; never submit another blind POST.
3. On the *same new Product*, click **Read actual Etsy draft and original image pairs (GET only)**. This calls the real Etsy provider in read-only mode. Verify the numeric listing ID, primary receipt and **every** original/remote photo pair. Open both images for inspection.
4. Check the checkbox beside each image **only when it is genuinely the same photograph**. Check the owner statement; press **Record my visual photo acceptance (local audit only)**. Save the resulting **owner receipt number**, Product ID/SKU/slug, Etsy listing ID, approved original IDs and remote Etsy image IDs in the owner evidence log.
5. If a live read is unavailable or shows an unmatched image, report the exact issue with a sanitized screenshot or evidence ID. Do **not** create a second draft or claim acceptance. An authorized operator can inspect the original Etsy draft and repair real media receipts separately.

The displayed acceptance is explicitly a **real authenticated Admin's owner statement**, not third-party image pixel equality or independent source signer custody.

## QL-259 independent signer custody: the next specific blocker

Attached **Comms Hub QL-258 owner action checklist** confirms no key provisioning or owner TEST permission merely from the checklist. It supplies **no actual** original private signer material, approved host/key store, authenticated role assignments, independent SPKI pin witness, nonproduction tenant isolation, signed proof commit B or public immutable proof HTTP 200.

`scripts/ql259_independent_signer_custody_review_525.mjs` accepts **sanitized status references only**, reports each missing prerequisite, and deliberately **cannot** mark `signer_custody_accepted`, `source_proof_B_verified` or `owner_test_decision` as true from a self-reported JSON file.

**Next real action:** privately designate and independently authenticate **three separate people** (original key custodian, nonce/pin witness, reviewer) and approve a specific restricted persistent signer host/store and isolated Devil n Dove nonproduction source. Those operators must verify the original Ed25519 possession challenge, public SPKI fingerprint and signed source proof A→B in the approved private channel; publish the genuine `docs/integration/ql246-source-proof.json` at immutable proof commit **B** and independently verify its HTTP 200 plus pinned signature. Return only nonsecret immutable commit IDs, authenticated opaque witness receipts, pin hash and independent decision. Never invent or embed a signer secret in public builds.

**Connection remains `DISCONNECTED / HOLD`** until an authenticated reviewer accepts real private evidence and the owner separately authorizes nonproduction TEST-only activity. No mini-server relay, signed GET, live call, SMS, dispatch or pilot was activated by this software release.

## Variables/bindings

- Reuses existing D1 binding **`DB` / `DD_DB`** and the existing **server-only** Etsy OAuth integration. This build introduces **no new Cloudflare variables, bindings or GitHub Actions secrets**. Secret values remain private; a public source build cannot reveal them.
- Real independent signer private keys belong only in an approved restricted persistent **private operator key store**. Never in `VITE_*`, browser JS, GitHub repo/Actions public variables, Cloudflare static-assets-only Worker Build variables or a chat attachment.

## Validation and next build

Run `node --test scripts/release467_build525_fresh_owner_trial_ql259.test.mjs` and the existing Build 523/524 suites. The CI quality job also includes Build 525's four JS syntax checks and new evidence test. Only after merge and successful exact `main` SHA checks may software Production be marked GREEN.

**Next queued:** Build 526 — Actual Fresh Owner Trial Receipt Review, Image Exception Remediation & QL-260 Authenticated Independent Custodian Disposition. The owner/independent witness decisions remain unconfirmed until true field evidence is returned.
