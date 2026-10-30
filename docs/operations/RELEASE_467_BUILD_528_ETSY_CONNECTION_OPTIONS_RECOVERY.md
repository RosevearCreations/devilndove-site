# Devil n Dove — Release 467 Build 528

## Owner report, 29 October 2026 Eastern

The first-time Etsy setup displayed empty category, shipping and processing lists. The browser recorded two HTTP 409 responses for `POST /api/admin/product-etsy-draft`; the displayed server response was `etsy_connection_not_ready`, not a Product data error. Dropdown controls crowded each other across a five-column desktop row. Firefox Roboto visibility and layout-timing warnings did not explain the Etsy 409.

## Code change

- The first-time setup button now performs one explicit Etsy account/category/profile verification. On a structured access-expiry blocker only, it calls the already-approved secured OAuth refresh route once, then repeats **only** the remote-read connection test once. This never retries an Etsy draft, image, metadata or tag write.
- On an unavailable refresh token, missing scopes, missing credentials, wrong shop/currency or another failure, the editor displays a human-readable HOLD, disables the empty choices and provides the I.T. Integrations reconnection link. It never guesses a category or shipping profile.
- Opening the Etsy editor tab no longer calls the connection POST automatically. The saved Product and Etsy ID may still be read. The separate owner-confirmed draft flow remains unchanged, with no unattended provider publication.
- First-time setup is limited to a legible three-column layout, then two columns and one column on narrow screens. Form labels, select boxes and numeric inputs cannot overflow their grid cells.
- New deterministic acceptance tests cover structured 409 recovery decisions, single explicit refresh, no automatic connection POST on tab-open, reconnection route, and layout.
- No canonical migration, Production D1/R2 migration, Etsy product write, real account refresh, claim correction, listing linkage, image upload or publication is executed by this code promotion.

## Genuine live-trial limits

The user's screenshots show a failed connection preflight but do **not** identify the three actual soap Product IDs. Their saved D1 rows, Etsy primary listing IDs, remote draft states, photos, tags and approval receipts require authenticated owner readback after Build 528 deployment. They are not represented as verified by fixtures. Any existing listing ID must be reused; uncertain remote writes stay HOLD pending an independent same-listing readback.

To close the trial: open one affected saved Product, press **Check Etsy connection & load choices** once, inspect the displayed blocker or verified choices, then provide the three Product IDs or owner-safe receipt screenshots. Reconnect via I.T. Integrations if the button reports unavailable credentials or scopes. Do not send a second draft request while the first receipt is unknown.

## Release requirements

Require exact `dev` four-proof green, PR merge, exact SHA Production Pages Deploy success and a live `release-version.json` response matching `main` SHA and build 528. QL-265 Comms Hub integration and private signer/custodian acceptance remain separate HELD scope.

## Next proposed build

**Build 529 — Real Etsy OAuth Receipt Confirmation, Three Soap Draft Identity/Image Readback & Owner-Safe Save Completion.**
