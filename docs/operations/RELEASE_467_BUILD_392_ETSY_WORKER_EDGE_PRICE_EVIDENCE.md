# Release 467 Build 392 — Etsy OAuth Callback Edge Reliability & Price Reconciliation Source Acceptance

## Screenshot diagnosis (October 13)
The user granted Etsy access and the callback page returned:
`invalid_redirect_value_must_be_one_of_follow_or_manual_error_won_t_be_implemented`

This is a **Cloudflare Workers runtime** TypeError, not Etsy's OAuth redirect URI mismatch. It arises because the application used `fetch(...,{redirect:'error'})` in `oauthProviders.js` for the token exchange and provider identity/shop requests. Cloudflare workerd rejects the unsupported redirect mode before performing the provider request.

Build392 switches all provider-bound fetch calls (authorization-code exchange, token refresh, identity verification, Etsy shop discovery, and revocation) to `redirect:'manual'` plus explicit blocking of any 300–399 or opaque redirect response. Requests are never automatically followed to a possibly untrusted host with authorization headers, codes or secrets. Provider errors remain explicit. The original one-time state is consumed; **the user must return to I.T. Integrations and start a fresh Etsy Connect attempt** after deployment. No old grant link is reusable.

## Acceptance boundaries
- Node regression simulates Cloudflare rejecting `redirect:'error'`, successful fake token exchange under manual mode, strict redirect blocking, zero network retry, exact Etsy HTTPS callback and preserved PKCE.
- Synthetic success does not prove real Etsy connection. Only a new approved Etsy flow with `connection.connected` and shop `connected_verified` does. No provider listing edits, synchronization, or publication is authorized by OAuth alone.
- Diagnostic UI never reveals OAuth code, PKCE verifier, state hash or token material.

## Historical Product prices
- Continue the manual source-backed review for Products showing $0.00. Use original approved pricing and source receipts before changing each Product. Existing zero prices, Product inventory, SKU, products and supplier tax evidence must not be bulk-rewritten based on inferred prices.
- Product Editor Build390 still rejects bad decimal values and confirms persisted CAD cents. A real authenticated Product Save/read-back and refresh remains operator acceptance after deployment. No new canonical migration or automated financial action in Build392.

## Release criteria
Dedicated Build392 regression, Current Application Quality, I.T. Runtime, Repository Branch Hygiene, System Gate, exact Development preview, identical verified dev/main tree, Production Pages deploy and Production Live Resource Integrity. Only mark Production GREEN when all proofs succeed.

Next queued: **Build 393 — Etsy Live Callback Acceptance & Verified Product Price Reconciliation**.
