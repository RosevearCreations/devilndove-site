// File: /public/js/cart.js
// Release 467 Build 78: resilient, normalized cart persistence with an in-memory fallback.

(function () {
  const CART_KEY = "dd_cart";
  const MAX_QTY = 99;
  let memoryCart = [];

  function fallbackNormalize(items) {
    const merged = new Map();
    for (const raw of Array.isArray(items) ? items : []) {
      const productId = Number(raw?.product_id || 0);
      const quantity = Math.min(MAX_QTY, Math.max(0, Number(raw?.quantity || 0)));
      if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity <= 0) continue;
      const previous = merged.get(productId);
      merged.set(productId, {
        ...previous,
        ...raw,
        product_id: productId,
        quantity: Math.min(MAX_QTY, Number(previous?.quantity || 0) + quantity),
        price_cents: Math.max(0, Number(raw?.price_cents ?? previous?.price_cents ?? 0) || 0),
        currency: String(raw?.currency || previous?.currency || "CAD").trim().toUpperCase() || "CAD",
        requires_shipping: Number(raw?.requires_shipping ?? previous?.requires_shipping) === 1 ? 1 : 0
      });
    }
    return [...merged.values()].sort((a, b) => Number(a.product_id) - Number(b.product_id));
  }

  function normalize(items) {
    try {
      if (window.DDCheckoutReliabilityCore?.normalizeCartItems) {
        return window.DDCheckoutReliabilityCore.normalizeCartItems(items);
      }
    } catch {}
    return fallbackNormalize(items);
  }

  function readCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return normalize(memoryCart);
      const normalized = normalize(JSON.parse(raw));
      memoryCart = normalized;
      return normalized;
    } catch {
      return normalize(memoryCart);
    }
  }

  function emit(items) {
    document.dispatchEvent(new CustomEvent("dd:cart-changed", {
      detail: {
        count: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        items: items.map((item) => ({ ...item }))
      }
    }));
  }

  function writeCart(items) {
    const normalized = normalize(items);
    memoryCart = normalized;
    try { localStorage.setItem(CART_KEY, JSON.stringify(normalized)); } catch {}
    emit(normalized);
    return normalized;
  }

  function getCartItems() {
    return readCart().map((item) => ({ ...item }));
  }

  function getCartCount() {
    return readCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }

  function clearCart() {
    writeCart([]);
  }

  function removeFromCart(productId) {
    const nextItems = readCart().filter(item => Number(item.product_id) !== Number(productId));
    writeCart(nextItems);
  }

  function setQuantity(productId, quantity) {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      removeFromCart(productId);
      return;
    }
    const safeQty = Math.min(MAX_QTY, qty);
    const items = readCart();
    const nextItems = items.map(item => Number(item.product_id) === Number(productId)
      ? { ...item, quantity: safeQty }
      : item);
    writeCart(nextItems);
  }

  function addToCart(product, quantity = 1) {
    const qty = Number(quantity);
    if (!product || !Number.isInteger(qty) || qty <= 0) throw new Error("A valid product and quantity are required.");

    const productId = Number(product.product_id);
    if (!Number.isInteger(productId) || productId <= 0) throw new Error("A valid product_id is required.");

    const items = readCart();
    const existingIndex = items.findIndex(item => Number(item.product_id) === productId);
    if (existingIndex >= 0) {
      items[existingIndex] = {
        ...items[existingIndex],
        quantity: Math.min(MAX_QTY, Number(items[existingIndex].quantity || 0) + qty)
      };
      return writeCart(items).find((item) => Number(item.product_id) === productId) || null;
    }

    const newItem = {
      product_id: productId,
      slug: String(product.slug || "").trim(),
      sku: String(product.sku || "").trim(),
      name: String(product.name || "").trim(),
      product_type: String(product.product_type || "").trim(),
      price_cents: Number(product.price_cents || 0),
      currency: String(product.currency || "CAD").trim().toUpperCase(),
      featured_image_url: String(product.featured_image_url || "").trim(),
      requires_shipping: Number(product.requires_shipping) === 1 ? 1 : 0,
      quantity: Math.min(MAX_QTY, qty)
    };

    const written = writeCart([...items, newItem]);
    return written.find((item) => Number(item.product_id) === productId) || newItem;
  }

  window.DDCart = {
    getCartItems,
    getCartCount,
    clearCart,
    removeFromCart,
    setQuantity,
    addToCart,
    persistenceVersion: "R467B78_V1"
  };
})();
