# Release 467 Build 391 — Historical Price Reconciliation & Product Save Browser Acceptance

## Product historical pricing
- **Evidence-based only.** Build 390 fixed the malformed 8.00-to-zero conversion, but some Product prices may already have been saved as 0. Never infer or bulk write missing prices from Purchase Cost or Product name.
- Admin Products → Verify Products displaying $0.00 → choose a Product → compare to pricing invoices, prior approved records or original SKU prices → Product Editor Price. Save the verified amount.
- Ensure explicit **Saved ✓ CAD price verified** response; refresh Products Browser and verify displayed CAD value. A screenshot or authenticated manual use is an independent acceptance check, not implied by CI.

## Deployment preflight (two screenshots)
- The old preflight compared the canonical native/proof ledger against hard-coded **30**, while the manifest now expects **39**. Dynamic expected counts remove false fail status without hiding genuine missing migrations.
- Replace enormous horizontally scrolling migration and check tables with independently readable diagnostic cards. Every item retains code, status, details, operator action, and manifest filename.
- Old **Build 246/247** data is historical archive, not current release. Active Build 391 authority displays Build 390 as verified baseline.

## Etsy main-site OAuth consent → error 502
- The Etsy consent screenshot indicates the provider asked for authorization; it does **not** confirm that Devil n Dove completed callback token exchange or verified the Etsy shop.
- Handle recoverable callback errors with a **controlled 422 diagnostic page**, instead of deliberately returning 502. Preserve single-use PKCE/state, selected-provider gate, intended-account identity verification, encrypted tokens, and no automatic retries.
- Admin → I.T. Integrations → Etsy now shows the **latest terminal authorization status and safe diagnostic** (without codes, tokens, state, or secrets). Do not reuse a previously consumed Etsy Grant Access link. If the Cloudflare **Host Error 502** persists, capture Ray ID and UTC timestamp, and inspect Cloudflare Pages Function/Worker logs and bindings; edge/origin 502 cannot be ruled out by a code-only check.
- Never assert Etsy connection or listing acceptance until shop state is actually `connected_verified`. No listing publish or remote draft write is enabled.

## Delivery guard
No new D1 migrations; existing data is read-only except for operator-initiated Product Save. Exact Development checks including Build 391 regression, canonical Preview, quality, runtime, hygiene, then promote identical tree to main. Cloudflare Production Pages and live resource proof must finish GREEN. Manual browser/OAuth checks remain separately required.

**Next queued: Build 392 — Etsy OAuth Callback Edge Reliability & Price Reconciliation Source Acceptance.**
