# Devil n Dove — Build 440 targeted Product Editor channel clarity

**Owner observation (2026-10-23):** Twelve screenshots for saved Product #54, *Bar Soap Sweet Orange*, show an authorized Etsy connection, CAD $9.00, quantity 3, 93 saved description characters, appropriate finished handmade goods classification, and a shipping-profile refusal because `Delivery Fees` includes non-Canadian, regional or worldwide destinations. They also show redundant Build 405/406/408 controls repeated under every Product Editor tab and a stale Build 390 `$0.00` save warning. These UI issues are separate from the Etsy API connection.

## Operator-facing correction

- Give Etsy its own warm orange tab and clearly labelled required data, with a small readiness checklist showing saved Product, connection, shipping policy and draft action independently.
- Give Facebook/Meta a separate blue tab and an honest **authorization pending** summary; do not pretend app keys grant Marketplace posting.
- Keep optional channel intent under **Basics**, image mapping under **Media**, and legacy local destination acceptance under **Advanced**. Do not duplicate these controls on every tab.
- Remove misleading static `$0.00` footer text; save status continues to report the verified real CAD amount.
- Explain that local Build 406 photo approvals do **not** block an *unpublished* Etsy draft. Preserve their checks for future publication.
- Link to Etsy's official shipping instructions; recommend a separate Canada-only profile to avoid changing shipping terms on existing live listings. Never alter the remote Etsy profile or authorize U.S. shipping silently.
- No API call is added on page load. Tests/verification remain operator-clicked. Etsy write stays one-attempt, owner-confirmed, unpublished, Canada-only.

## Still pending / do not claim GREEN for live Etsy draft

- Product #54 needs an existing or new Canada-only shipping profile in the Etsy shop. The current `Delivery Fees` profile fails the deliberate gate; the app cannot rewrite Etsy shipping settings with its current OAuth grant.
- After this profile exists, click **Test Etsy connection**, select the verified profile, **Verify this profile delivers to Canada only**, confirm the single unpublished draft, and use the Product Editor button. An actual Etsy listing ID and external draft state must be reconciled before calling provider acceptance GREEN.
- Build 440's broader Product Editor reliability backlog (media quality, unsaved changes/recovery, mobile/keyboard acceptance, and complete save/read lifecycle) remains open outside this focused clarity correction.

## Relevant first-party guidance

- [Etsy — How to Set Up Shipping Information](https://help.etsy.com/hc/en-us/articles/115014115187-How-to-Set-Up-Shipping-Information)
- [Etsy — Listings Open API tutorial](https://developers.etsy.com/documentation/tutorials/listings/)
