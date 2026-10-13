# Release 467 Build 390 — Product Price Save Repair, Video Review & Purchase Tax Acceptance

## Price regression (critical)
The prior client Build389 `cents()` regular expression contained an extra escape before the decimal point. A valid `8.00` or `12.45` returned **zero cents**, even though the Product Editor showed an apparent save success. This is an **actual existing-data integrity defect**, not merely a display bug.

Build390 fixes the parser, rejects malformed amount strings without sending any Product write, demands explicit confirmation for intentionally free $0.00 Products, and validates the persisted Product price and Compare-at price through one bounded source readback before returning confirmed Save. The editor also rejects non-confirming responses and never retries automatically. It displays the verified CAD amount.

For existing zero-dollar Products, **do not guess past prices**. In Admin Products open "Verify Products displaying $0.00" to load a bounded list (on demand only). Review purchase invoices, prior product pricing exports, and any audit evidence, then correct one Product at a time through the now-verified editor. No automated bulk rewrite or source inference was performed.

## Video approval and purchase tax evidence
The Build389 Product Video workspace now summarizes `internal_review`, `product_page_ok` and `blocked` counts. No media publication occurs without explicit review Save; public Product video endpoint continues to return only approved video rows.

Build388 inventory tax view explicitly labels supplier invoices, amounts paid and input tax credit eligibility **UNVERIFIED**. Existing Tool/Supply correction receipts remain source linked. No invoice is claimed verified, no input tax credits are booked, and no provider payments occur.

## Acceptance and production
Run Build390 Node money parser cases ($8.00=$800c, $0.29=29c, invalid decimal fails closed), bounded source check, Current Application Quality, I.T. Runtime, System Gate, repository hygiene. Promote the exact GREEN Development tree to main, and confirm Cloudflare Pages Production deployment, existing D1 integrity and independent live resource integrity proof. **Authenticated manual Product Save with deliberate test item remains a separate operator test after automated proof.**

**Next queued Build391 — Historical Price Reconciliation & Product Save Browser Acceptance.**
