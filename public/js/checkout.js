// File: /public/js/checkout.js
// Brief description: Handles the checkout page flow. It loads cart items from browser storage,
// calculates totals, validates customer and shipping fields, creates the order through
// /api/checkout-create-order, prepares payment through /api/checkout-prepare-payment,
// and stores a confirmation snapshot so guest checkout can render the confirmation page cleanly.

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("checkoutForm");
  const messageEl = document.getElementById("checkoutMessage");
  const submitButton = document.getElementById("checkoutSubmitButton");
  const summaryItemsEl = document.getElementById("checkoutSummaryItems");
  const summarySubtotalEl = document.getElementById("checkoutSummarySubtotal");
  const summaryShippingEl = document.getElementById("checkoutSummaryShipping");
  const summaryTaxEl = document.getElementById("checkoutSummaryTax");
  const summaryTotalEl = document.getElementById("checkoutSummaryTotal");
  const paymentProviderStatusEl = document.getElementById("paymentProviderStatus");

  const CART_KEY = "dd_cart";
  const CHECKOUT_FORM_KEY = "dd_checkout_form";
  const CONFIRMATION_KEY = "dd_last_order_confirmation";

  function setMessage(message, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.style.display = message ? "block" : "none";
    messageEl.style.color = isError ? "#b00020" : "";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatMoney(cents, currency = "CAD") {
    const amount = Number(cents || 0) / 100;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || "CAD"
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency || "CAD"}`;
    }
  }

  function getCartItems() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveCheckoutForm(data) {
    try {
      localStorage.setItem(CHECKOUT_FORM_KEY, JSON.stringify(data || {}));
    } catch {
      // ignore storage failure
    }
  }

  function loadCheckoutForm() {
    try {
      const raw = localStorage.getItem(CHECKOUT_FORM_KEY);
      const parsed = JSON.parse(raw || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveConfirmationSnapshot(data) {
    try {
      sessionStorage.setItem(CONFIRMATION_KEY, JSON.stringify(data || {}));
    } catch {
      try {
        localStorage.setItem(CONFIRMATION_KEY, JSON.stringify(data || {}));
      } catch {
        // ignore storage failure
      }
    }
  }

  function fillFormFromSavedData() {
    const saved = loadCheckoutForm();
    const fieldIds = [
      "customer_name",
      "customer_email",
      "shipping_name",
      "shipping_company",
      "shipping_address1",
      "shipping_address2",
      "shipping_city",
      "shipping_province",
      "shipping_postal_code",
      "shipping_country",
      "billing_name",
      "billing_company",
      "billing_address1",
      "billing_address2",
      "billing_city",
      "billing_province",
      "billing_postal_code",
      "billing_country",
      "notes",
      "payment_method"
    ];

    fieldIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (saved[id] !== undefined && saved[id] !== null && saved[id] !== "") {
        el.value = saved[id];
      }
    });
  }

  function readFormData() {
    const ids = [
      "customer_name",
      "customer_email",
      "shipping_name",
      "shipping_company",
      "shipping_address1",
      "shipping_address2",
      "shipping_city",
      "shipping_province",
      "shipping_postal_code",
      "shipping_country",
      "billing_name",
      "billing_company",
      "billing_address1",
      "billing_address2",
      "billing_city",
      "billing_province",
      "billing_postal_code",
      "billing_country",
      "notes",
      "payment_method"
    ];

    const data = {};
    ids.forEach((id) => {
      const el = document.getElementById(id);
      data[id] = String(el?.value || "").trim();
    });

    return data;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  }

  function calculateCartSummary(cartItems) {
    const safeItems = Array.isArray(cartItems) ? cartItems : [];
    const subtotal_cents = safeItems.reduce((sum, item) => {
      return sum + (Number(item.price_cents || 0) * Number(item.quantity || 0));
    }, 0);

    const requiresShipping = safeItems.some((item) => Number(item.requires_shipping || 0) === 1);
    const shipping_cents = requiresShipping ? 1500 : 0;
    const tax_cents = Math.round((subtotal_cents + shipping_cents) * 0.13);
    const total_cents = subtotal_cents + shipping_cents + tax_cents;

    return {
      subtotal_cents,
      shipping_cents,
      tax_cents,
      total_cents,
      requires_shipping: requiresShipping
    };
  }

  function validateRequiredShippingFields(formData, summary) {
    if (!summary?.requires_shipping) {
      return "";
    }

    if (!formData.shipping_address1) return "Shipping address line 1 is required for physical orders.";
    if (!formData.shipping_city) return "Shipping city is required for physical orders.";
    if (!formData.shipping_province) return "Shipping province or state is required for physical orders.";
    if (!formData.shipping_postal_code) return "Shipping postal or ZIP code is required for physical orders.";
    if (!formData.shipping_country) return "Shipping country is required for physical orders.";

    return "";
  }

  function renderSummary() {
    const cartItems = getCartItems();
    const summary = calculateCartSummary(cartItems);

    if (summaryItemsEl) {
      if (!cartItems.length) {
        summaryItemsEl.innerHTML = `<div class="small">Your cart is empty.</div>`;
      } else {
        summaryItemsEl.innerHTML = cartItems.map((item) => {
          const qty = Number(item.quantity || 0);
          const unit = Number(item.price_cents || 0);
          const line = qty * unit;

          return `
            <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:8px">
              <div>
                <div>${escapeHtml(item.name || "Item")}</div>
                <div class="small">Qty: ${escapeHtml(String(qty))}</div>
              </div>
              <div>${escapeHtml(formatMoney(line, item.currency || "CAD"))}</div>
            </div>
          `;
        }).join("");
      }
    }

    if (summarySubtotalEl) {
      summarySubtotalEl.textContent = formatMoney(summary.subtotal_cents, "CAD");
    }
    if (summaryShippingEl) {
      summaryShippingEl.textContent = formatMoney(summary.shipping_cents, "CAD");
    }
    if (summaryTaxEl) {
      summaryTaxEl.textContent = formatMoney(summary.tax_cents, "CAD");
    }
    if (summaryTotalEl) {
      summaryTotalEl.textContent = formatMoney(summary.total_cents, "CAD");
    }

    return summary;
  }

  function normalizeCartForApi(cartItems) {
    return (Array.isArray(cartItems) ? cartItems : []).map((item) => ({
      product_id: Number(item.product_id || 0),
      quantity: Number(item.quantity || 0)
    }));
  }

  async function createOrder(payload) {
    const headers = {
      "Content-Type": "application/json"
    };

    if (window.DDAuth?.isLoggedIn?.()) {
      const token = window.DDAuth.getToken?.();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch("/api/checkout-create-order", {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "Failed to create order.");
    }

    return data;
  }

  async function preparePayment(order_id, provider) {
    const headers = {
      "Content-Type": "application/json"
    };

    if (window.DDAuth?.isLoggedIn?.()) {
      const token = window.DDAuth.getToken?.();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch("/api/checkout-prepare-payment", {
      method: "POST",
      headers,
      body: JSON.stringify({
        order_id,
        provider
      })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "Failed to prepare payment.");
    }

    return data;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const cartItems = getCartItems();
    if (!cartItems.length) {
      setMessage("Your cart is empty.", true);
      return;
    }

    const formData = readFormData();
    saveCheckoutForm(formData);

    if (!formData.customer_name) {
      setMessage("Customer name is required.", true);
      return;
    }

    if (!formData.customer_email || !isValidEmail(formData.customer_email)) {
      setMessage("A valid email is required.", true);
      return;
    }

    const summary = calculateCartSummary(cartItems);
    const shippingError = validateRequiredShippingFields(formData, summary);
    if (shippingError) {
      setMessage(shippingError, true);
      return;
    }

    const paymentProvider = formData.payment_method || "paypal";
    const originalText = submitButton?.textContent || "Place Order";

    try {
      setMessage("Creating your order...");

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Processing...";
      }

      const orderPayload = {
        ...formData,
        currency: "CAD",
        shipping_cents: summary.shipping_cents,
        items: normalizeCartForApi(cartItems)
      };

      window.DDAnalytics?.trackCart('checkout_started', { meta: { payment_method: paymentProvider } });
      const orderResult = await createOrder(orderPayload);
      const order = orderResult.order;

      setMessage("Preparing payment...");

      const paymentResult = await preparePayment(order.order_id, paymentProvider);
      window.DDAnalytics?.trackCart('order_created', { order_id: Number(order.order_id || 0), meta: { payment_provider: paymentProvider } });

      saveConfirmationSnapshot({
        saved_at: new Date().toISOString(),
        order,
        items: Array.isArray(orderResult?.items) ? orderResult.items : [],
        payment_preparation: paymentResult?.payment_preparation || null,
        customer: {
          customer_name: formData.customer_name,
          customer_email: formData.customer_email
        }
      });

      try {
        localStorage.removeItem(CART_KEY);
      } catch {
        // ignore storage failure
      }

      const confirmationUrl = new URL("/checkout/confirmation/", window.location.origin);
      confirmationUrl.searchParams.set("order_id", String(order.order_id));
      confirmationUrl.searchParams.set("order_number", String(order.order_number || ""));
      confirmationUrl.searchParams.set("payment_provider", String(paymentProvider || ""));
      confirmationUrl.searchParams.set(
        "payment_status",
        String(paymentResult?.payment_preparation?.payment_stub?.payment_status || "pending")
      );

      const redirectUrl = String(paymentResult?.payment_preparation?.redirect_url || "").trim();

      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      window.location.href = confirmationUrl.toString();
    } catch (error) {
      setMessage(error.message || "Checkout failed.", true);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  }

  function bindAutoSave() {
    if (!form) return;

    form.addEventListener("input", () => {
      saveCheckoutForm(readFormData());
    });
  }

  fillFormFromSavedData();
  renderSummary();
  bindAutoSave();

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
});
