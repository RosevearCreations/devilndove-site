// File: /public/js/cart.js

(function () {
  const CART_KEY = "dd_cart";

  function readCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function priceForQuantity(item, quantity) {
    const qty = Math.max(1, Number(quantity || 1));
    const tiers = Array.isArray(item?.quantity_price_tiers) ? item.quantity_price_tiers.slice().sort((a,b)=>Number(a.min_quantity||0)-Number(b.min_quantity||0)) : [];
    const eligible = tiers.filter((row) => Number(row.min_quantity || 0) <= qty);
    return eligible.length ? Number(eligible[eligible.length - 1].unit_price_cents || item.base_price_cents || item.price_cents || 0) : Number(item.base_price_cents || item.price_cents || 0);
  }

  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("dd:cart-changed", {
      detail: {
        count: getCartCount(),
        items: getCartItems()
      }
    }));
  }

  function getCartItems() {
    return readCart();
  }

  function getCartCount() {
    return readCart().reduce((sum, item) => {
      return sum + Number(item.quantity || 0);
    }, 0);
  }

  function clearCart() {
    writeCart([]);
  }

  function removeFromCart(productId) {
    const nextItems = readCart().filter(item => {
      return Number(item.product_id) !== Number(productId);
    });

    writeCart(nextItems);
  }

  function setQuantity(productId, quantity) {
    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty <= 0) {
      removeFromCart(productId);
      return;
    }

    const items = readCart();
    const nextItems = items.map(item => {
      if (Number(item.product_id) !== Number(productId)) {
        return item;
      }

      const maxAvailable = Number(item.inventory_tracking || 0) === 1 ? Math.max(0, Number(item.inventory_quantity || 0)) : null;
      const safeQty = maxAvailable == null ? qty : Math.min(qty, maxAvailable);
      return {
        ...item,
        quantity: safeQty,
        price_cents: priceForQuantity(item, safeQty)
      };
    });

    writeCart(nextItems);
  }

  function addToCart(product, quantity = 1) {
    const qty = Number(quantity);

    if (!product || !Number.isInteger(qty) || qty <= 0) {
      throw new Error("A valid product and quantity are required.");
    }

    const productId = Number(product.product_id);
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error("A valid product_id is required.");
    }

    const items = readCart();
    const existingIndex = items.findIndex(item => Number(item.product_id) === productId);

    if (existingIndex >= 0) {
      const existing = items[existingIndex];
      const requested = Number(existing.quantity || 0) + qty;
      const maxAvailable = Number(existing.inventory_tracking || product.inventory_tracking || 0) === 1 ? Math.max(0, Number(existing.inventory_quantity || product.inventory_quantity || 0)) : null;
      const nextQuantity = maxAvailable == null ? requested : Math.min(requested, maxAvailable);
      items[existingIndex] = {
        ...existing,
        quantity: nextQuantity,
        price_cents: priceForQuantity(existing, nextQuantity)
      };
      writeCart(items);
      return items[existingIndex];
    }

    const newItem = {
      product_id: productId,
      slug: String(product.slug || "").trim(),
      sku: String(product.sku || "").trim(),
      name: String(product.name || "").trim(),
      product_type: String(product.product_type || "").trim(),
      base_price_cents: Number(product.price_cents || 0),
      price_cents: priceForQuantity({ base_price_cents: Number(product.price_cents || 0), quantity_price_tiers: product.quantity_price_tiers || [] }, qty),
      quantity_price_tiers: Array.isArray(product.quantity_price_tiers) ? product.quantity_price_tiers : [],
      inventory_tracking: Number(product.inventory_tracking || 0),
      inventory_quantity: Math.max(0, Number(product.inventory_quantity || 0)),
      is_bundle: Number(product.is_bundle || product.bundle?.is_bundle || 0),
      currency: String(product.currency || "CAD").trim().toUpperCase(),
      featured_image_url: String(product.featured_image_url || "").trim(),
      requires_shipping: Number(product.requires_shipping) === 1 ? 1 : 0,
      quantity: qty
    };

    items.push(newItem);
    writeCart(items);
    return newItem;
  }

  window.DDCart = {
    getCartItems,
    getCartCount,
    clearCart,
    removeFromCart,
    setQuantity,
    addToCart
  };
})();
