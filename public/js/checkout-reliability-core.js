// Release 467 Build 78 — Cart & Checkout Reliability.
// Pure browser-safe helpers: no network, storage, D1/R2 or provider execution.
(function (root) {
  'use strict';

  const VERSION = 'R467B78_V1';
  const MAX_CART_QUANTITY = 99;
  const SHIPPING_FLAT_CENTS = 1500;
  const TAX_ESTIMATE_RATE = 0.13;

  function text(value) {
    return String(value ?? '').trim();
  }

  function integer(value, fallback = 0) {
    const number = Number(value);
    return Number.isInteger(number) ? number : fallback;
  }

  function normalizeCartItems(items) {
    const merged = new Map();
    for (const raw of Array.isArray(items) ? items : []) {
      const productId = integer(raw?.product_id, 0);
      const quantity = Math.min(MAX_CART_QUANTITY, Math.max(0, integer(raw?.quantity, 0)));
      if (productId <= 0 || quantity <= 0) continue;
      const previous = merged.get(productId);
      const nextQuantity = Math.min(MAX_CART_QUANTITY, quantity + integer(previous?.quantity, 0));
      merged.set(productId, {
        product_id: productId,
        slug: text(raw?.slug || previous?.slug),
        sku: text(raw?.sku || previous?.sku),
        name: text(raw?.name || previous?.name || `Product ${productId}`),
        product_type: text(raw?.product_type || previous?.product_type || 'physical').toLowerCase() || 'physical',
        price_cents: Math.max(0, integer(raw?.price_cents ?? previous?.price_cents, 0)),
        currency: (text(raw?.currency || previous?.currency || 'CAD').toUpperCase() || 'CAD'),
        featured_image_url: text(raw?.featured_image_url || previous?.featured_image_url),
        requires_shipping: Number(raw?.requires_shipping ?? previous?.requires_shipping) === 1 ? 1 : 0,
        quantity: nextQuantity
      });
    }
    return [...merged.values()].sort((a, b) => a.product_id - b.product_id);
  }

  function cartSignature(items, giftCardPurchase = null) {
    const rows = normalizeCartItems(items).map((item) => `${item.product_id}:${item.quantity}`).join('|');
    const gift = giftCardPurchase && Number(giftCardPurchase.amount_cents || 0) > 0
      ? `gift:${Math.max(0, integer(giftCardPurchase.amount_cents, 0))}:${text(giftCardPurchase.recipient_email).toLowerCase()}`
      : 'gift:none';
    return `${rows || 'cart:empty'}|${gift}`;
  }

  function requiresShipping(items) {
    return normalizeCartItems(items).some((item) => item.requires_shipping === 1);
  }

  function normalizeFulfillmentChoice(value, items) {
    if (!requiresShipping(items)) return 'digital';
    return text(value).toLowerCase() === 'pickup' ? 'pickup' : 'shipping';
  }

  function shippingCents(items, fulfillmentChoice) {
    return normalizeFulfillmentChoice(fulfillmentChoice, items) === 'shipping' ? SHIPPING_FLAT_CENTS : 0;
  }

  function taxEstimateCents(subtotalCents, discountCents, shippingAmountCents) {
    const taxableBase = Math.max(0, integer(subtotalCents, 0) - Math.max(0, integer(discountCents, 0)))
      + Math.max(0, integer(shippingAmountCents, 0));
    return Math.round(taxableBase * TAX_ESTIMATE_RATE);
  }

  const api = Object.freeze({
    VERSION,
    MAX_CART_QUANTITY,
    SHIPPING_FLAT_CENTS,
    TAX_ESTIMATE_RATE,
    normalizeCartItems,
    cartSignature,
    requiresShipping,
    normalizeFulfillmentChoice,
    shippingCents,
    taxEstimateCents
  });

  root.DDCheckoutReliabilityCore = api;
})(globalThis);
