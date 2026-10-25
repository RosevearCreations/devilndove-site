# Build 471 — Single Product Creation & Human-Gated Channel Publishing

## One Product and local-only channel decisions

1. Open `/admin/product-editor/` without `product_id`. Enter the original Product name, category, truthful CAD price, descriptions and attributes. Choose Etsy and/or Facebook Marketplace in **One Product, optional destinations**.
2. When a destination is selected, the owner or authorized operator must explicitly confirm local preparation and Canada-only/no-U.S.-shipping policy. **Save Product** makes one canonical Product write first, then one optional, authenticated, receipt-guarded local channel-intent write. A selected channel is **not** a published listing, remote draft, image transfer or shipping change.
3. After success, follow the redirect to the saved Product ID. Verify the destination receipt. The Media and mapping button operates on the existing Product only; source gallery images must be individually approved for public use, alt text and resolution, then mapped separately with the existing destination review controls.
4. Etsy: only after live seller profile verification and a separate explicit owner check may the operator create **one unpublished draft**; image transfer needs another separate authorization. Facebook: only manual copy-and-review is offered. No generic Marketplace publication permission is assumed.

## Ambiguous 503/1102 save recovery

- A failure of the initial Product POST is **not** retried automatically. Check the Product Browser for duplicates before making any second Product attempt.
- If the canonical Product is successfully created but its optional channel-intent write fails or times out, the page **redirects to the saved Product**, marking destination intent unconfirmed. The browser retains the intended switches (not consent) for up to one hour. Only after loading the **authoritative saved destination receipt** may the owner select **Review unsaved destination choices**, re-consent, and save **destinations only**. This never repeats the Product POST.
- An ambiguous channel receipt is not treated as success. A known saved receipt is the only confirmed state. No background retry, provider write, paid monitoring, D1 catalog scan or R2 gallery scan is added.

## Owner and provider HOLD boundary

External publication, product legality, media rights, actual Canada-only profile, independent safety acceptance, delivery rates, customer contact, and completed fulfillment require their respective independent real evidence/owner authorization. Source and CI checks prove only the mechanics; they are not substitute owner acceptance.

Regression: `node --test scripts/release467_build471_single_product_channel_acceptance.test.mjs`; manual owner click-through remains pending genuine Product data.
