// File: /public/js/checkout.js
// Release 467 Build 78: resilient cart/checkout flow with pickup, persisted attempts,
// idempotent order retries, authoritative-server revalidation, and payment recovery.

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("checkoutForm");
  const messageEl = document.getElementById("checkoutMessage");
  const recoveryStatusEl = document.getElementById("checkoutRecoveryStatus");
  const submitButton = document.getElementById("checkoutSubmitButton");
  const summaryItemsEl = document.getElementById("checkoutSummaryItems");
  const summarySubtotalEl = document.getElementById("checkoutSummarySubtotal");
  const summaryShippingEl = document.getElementById("checkoutSummaryShipping");
  const summaryDiscountEl = document.getElementById("checkoutSummaryDiscount");
  const summaryTaxEl = document.getElementById("checkoutSummaryTax");
  const summaryTotalEl = document.getElementById("checkoutSummaryTotal");
  const paymentProviderStatusEl = document.getElementById("paymentProviderStatus");
  const giftCardInputEl = document.getElementById("gift_card_code");
  const giftCardButtonEl = document.getElementById("applyGiftCardButton");
  const giftCardMessageEl = document.getElementById("giftCardMessage");
  const fulfillmentEl = document.getElementById("fulfillment_method");
  const fulfillmentMessageEl = document.getElementById("fulfillmentMessage");
  const shippingFieldsEl = document.getElementById("checkoutShippingFields");

  const CORE = window.DDCheckoutReliabilityCore || null;
  const CART_KEY = "dd_cart";
  const RECOVERY_WRITE_KEY = "dd_checkout_recovery_v279";
  const RECOVERY_WRITE_WINDOW_MS = 60 * 1000;
  const CHECKOUT_FORM_KEY = "dd_checkout_form";
  const CONFIRMATION_KEY = "dd_last_order_confirmation";
  const ATTEMPT_KEY = "dd_checkout_attempt_v78";

  let appliedGiftCard = null;

  function getGiftCardPurchase() {
    return window.DDGiftCardPurchase?.read ? (window.DDGiftCardPurchase.read() || null) : null;
  }

  function clearGiftCardPurchase() {
    try { window.DDGiftCardPurchase?.clear?.(); } catch {}
  }

  function setMessage(message, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.style.display = message ? "block" : "none";
    messageEl.style.color = isError ? "#b00020" : "";
    messageEl.setAttribute("role", isError ? "alert" : "status");
  }

  function setRecoveryStatus(message, isError = false) {
    if (!recoveryStatusEl) return;
    recoveryStatusEl.textContent = message;
    recoveryStatusEl.style.display = message ? "block" : "none";
    recoveryStatusEl.style.color = isError ? "#b00020" : "";
    recoveryStatusEl.setAttribute("role", isError ? "alert" : "status");
  }

  function setGiftCardMessage(message, isError = false) {
    if (!giftCardMessageEl) return;
    giftCardMessageEl.textContent = message;
    giftCardMessageEl.style.display = message ? "block" : "none";
    giftCardMessageEl.style.color = isError ? "#b00020" : "#0a7a2f";
  }

  function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function formatMoney(cents, currency = "CAD") {
    const amount = Number(cents || 0) / 100;
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "CAD" }).format(amount); }
    catch { return `${amount.toFixed(2)} ${currency || "CAD"}`; }
  }

  function getCartItems() {
    try {
      if (window.DDCart?.getCartItems) return window.DDCart.getCartItems();
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return CORE?.normalizeCartItems ? CORE.normalizeCartItems(parsed) : (Array.isArray(parsed) ? parsed : []);
    } catch { return []; }
  }

  function saveCheckoutForm(data) {
    try { localStorage.setItem(CHECKOUT_FORM_KEY, JSON.stringify(data || {})); } catch {}
  }

  function loadCheckoutForm() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CHECKOUT_FORM_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch { return {}; }
  }

  function saveConfirmationSnapshot(data) {
    try { sessionStorage.setItem(CONFIRMATION_KEY, JSON.stringify(data || {})); }
    catch { try { localStorage.setItem(CONFIRMATION_KEY, JSON.stringify(data || {})); } catch {} }
  }

  function readAttempt() {
    try {
      const parsed = JSON.parse(localStorage.getItem(ATTEMPT_KEY) || "null");
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch { return null; }
  }

  function writeAttempt(attempt) {
    try { localStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt || {})); } catch {}
  }

  function clearAttempt() {
    try { localStorage.removeItem(ATTEMPT_KEY); } catch {}
    setRecoveryStatus("");
  }

  function cartSignature() {
    const items = getCartItems();
    const gift = getGiftCardPurchase();
    if (CORE?.cartSignature) return CORE.cartSignature(items, gift);
    return `${items.map((item) => `${Number(item.product_id)}:${Number(item.quantity)}`).sort().join("|")}|gift:${Number(gift?.amount_cents || 0)}`;
  }

  function makeRequestKey() {
    try { if (crypto?.randomUUID) return `r467b78-${crypto.randomUUID()}`; } catch {}
    return `r467b78-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
  }

  function currentAttempt() {
    const signature = cartSignature();
    let attempt = readAttempt();
    if (!attempt || attempt.signature !== signature) {
      attempt = { version: "R467B78_V1", signature, request_key: makeRequestKey(), order_id: null, order_number: "", created_at: new Date().toISOString() };
      writeAttempt(attempt);
    }
    return attempt;
  }

  function fillFormFromSavedData() {
    const saved = loadCheckoutForm();
    const fieldIds = ["customer_name","customer_email","shipping_name","shipping_company","shipping_address1","shipping_address2","shipping_city","shipping_province","shipping_postal_code","shipping_country","billing_name","billing_company","billing_address1","billing_address2","billing_city","billing_province","billing_postal_code","billing_country","fulfillment_method","notes","payment_method","gift_card_code"];
    fieldIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (saved[id] !== undefined && saved[id] !== null && saved[id] !== "") el.value = saved[id];
    });
  }

  function readFormData() {
    const ids = ["customer_name","customer_email","shipping_name","shipping_company","shipping_address1","shipping_address2","shipping_city","shipping_province","shipping_postal_code","shipping_country","billing_name","billing_company","billing_address1","billing_address2","billing_city","billing_province","billing_postal_code","billing_country","fulfillment_method","notes","payment_method","gift_card_code"];
    const data = {};
    ids.forEach((id) => { data[id] = String(document.getElementById(id)?.value || "").trim(); });
    return data;
  }

  function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim()); }

  function fulfillmentChoice(cartItems) {
    const raw = String(fulfillmentEl?.value || "shipping");
    if (CORE?.normalizeFulfillmentChoice) return CORE.normalizeFulfillmentChoice(raw, cartItems);
    const requiresShipping = cartItems.some((item) => Number(item.requires_shipping || 0) === 1);
    return !requiresShipping ? "digital" : (raw === "pickup" ? "pickup" : "shipping");
  }

  function updateFulfillmentUi() {
    const items = getCartItems();
    const choice = fulfillmentChoice(items);
    const hasPhysical = items.some((item) => Number(item.requires_shipping || 0) === 1);
    if (fulfillmentEl) fulfillmentEl.disabled = !hasPhysical;
    if (shippingFieldsEl) shippingFieldsEl.style.display = choice === "shipping" ? "" : "none";
    if (fulfillmentMessageEl) fulfillmentMessageEl.textContent = choice === "digital"
      ? "Digital-only order: no shipping address or shipping charge is required."
      : (choice === "pickup" ? "Local pickup selected: shipping address and shipping charge are not required." : "Shipping selected: a valid Canadian shipping address is required.");
  }

  function calculateCartSummary(cartItems) {
    const safeItems = Array.isArray(cartItems) ? cartItems : [];
    const giftCardPurchase = getGiftCardPurchase();
    const subtotal_cents = safeItems.reduce((sum, item) => sum + Number(item.price_cents || 0) * Number(item.quantity || 0), 0) + Number(giftCardPurchase?.amount_cents || 0);
    const choice = fulfillmentChoice(safeItems);
    const shipping_cents = CORE?.shippingCents ? CORE.shippingCents(safeItems, choice) : (choice === "shipping" ? 1500 : 0);
    const gift_card_discount_cents = Math.min(Number(appliedGiftCard?.applicable_discount_cents || 0), subtotal_cents + shipping_cents);
    const tax_cents = CORE?.taxEstimateCents ? CORE.taxEstimateCents(subtotal_cents, gift_card_discount_cents, shipping_cents) : Math.round(Math.max(0, subtotal_cents + shipping_cents - gift_card_discount_cents) * 0.13);
    const total_cents = Math.max(0, subtotal_cents + shipping_cents + tax_cents - gift_card_discount_cents);
    return { subtotal_cents, shipping_cents, gift_card_discount_cents, tax_cents, total_cents, requires_shipping: choice === "shipping", fulfillment_method: choice };
  }

  function validateRequiredShippingFields(formData, summary) {
    if (!summary?.requires_shipping) return "";
    if (!formData.shipping_address1) return "Shipping address line 1 is required for physical orders being shipped.";
    if (!formData.shipping_city) return "Shipping city is required for physical orders being shipped.";
    if (!formData.shipping_province) return "Shipping province or territory is required for physical orders being shipped.";
    if (!formData.shipping_postal_code) return "Shipping postal code is required for physical orders being shipped.";
    if (!formData.shipping_country) return "Shipping country is required for physical orders being shipped.";
    return "";
  }

  function renderSummary() {
    const cartItems = getCartItems();
    const giftCardPurchase = getGiftCardPurchase();
    const summary = calculateCartSummary(cartItems);
    updateFulfillmentUi();
    if (summaryItemsEl) {
      const rows = cartItems.map((item) => `<div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:8px"><div><div>${escapeHtml(item.name || "Item")}</div><div class="small">Qty: ${escapeHtml(String(Number(item.quantity || 0)))}</div></div><div>${escapeHtml(formatMoney(Number(item.price_cents || 0) * Number(item.quantity || 0), item.currency || "CAD"))}</div></div>`);
      if (giftCardPurchase?.amount_cents) rows.push(`<div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:8px"><div><div>Storefront gift card</div><div class="small">For ${escapeHtml(giftCardPurchase.recipient_name || giftCardPurchase.recipient_email || "recipient")}</div></div><div>${escapeHtml(formatMoney(giftCardPurchase.amount_cents, giftCardPurchase.currency || "CAD"))}</div></div>`);
      summaryItemsEl.innerHTML = rows.length ? rows.join("") : `<div class="small">Your cart is empty.</div>`;
    }
    if (summarySubtotalEl) summarySubtotalEl.textContent = formatMoney(summary.subtotal_cents, "CAD");
    if (summaryShippingEl) summaryShippingEl.textContent = summary.fulfillment_method === "pickup" ? "Local pickup — $0.00" : formatMoney(summary.shipping_cents, "CAD");
    if (summaryDiscountEl) summaryDiscountEl.textContent = appliedGiftCard ? `-${formatMoney(summary.gift_card_discount_cents, "CAD")}` : formatMoney(0, "CAD");
    if (summaryTaxEl) summaryTaxEl.textContent = formatMoney(summary.tax_cents, "CAD");
    if (summaryTotalEl) summaryTotalEl.textContent = formatMoney(summary.total_cents, "CAD");
    return summary;
  }

  function normalizeCartForApi(cartItems) {
    return (Array.isArray(cartItems) ? cartItems : []).map((item) => ({ product_id: Number(item.product_id || 0), quantity: Number(item.quantity || 0) }));
  }

  async function createOrder(payload) {
    const headers = { "Content-Type": "application/json" };
    if (window.DDAuth?.isLoggedIn?.()) { const token = window.DDAuth.getToken?.(); if (token) headers.Authorization = `Bearer ${token}`; }
    const response = await fetch("/api/checkout-create-order", { method: "POST", headers, body: JSON.stringify(payload) });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      const error = new Error(data?.error || "Failed to create order.");
      error.code = data?.code || "checkout_create_failed";
      error.httpStatus = response.status;
      throw error;
    }
    return data;
  }

  async function preparePayment(order_id, provider) {
    const headers = { "Content-Type": "application/json" };
    if (window.DDAuth?.isLoggedIn?.()) { const token = window.DDAuth.getToken?.(); if (token) headers.Authorization = `Bearer ${token}`; }
    const response = await fetch("/api/checkout-prepare-payment", { method: "POST", headers, body: JSON.stringify({ order_id, provider }) });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || "Failed to prepare payment.");
    return data;
  }

  async function applyGiftCard() {
    const code = String(giftCardInputEl?.value || "").trim();
    if (!code) { appliedGiftCard = null; renderSummary(); setGiftCardMessage("Enter a gift card code first.", true); return; }
    try {
      setGiftCardMessage("Checking gift card...");
      const summary = calculateCartSummary(getCartItems());
      const response = await fetch("/api/gift-card-quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, order_total_cents: summary.subtotal_cents + summary.shipping_cents + summary.tax_cents, currency: "CAD" }) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Gift card could not be applied.");
      appliedGiftCard = data.gift_card || null; renderSummary(); setGiftCardMessage(`Applied ${formatMoney(appliedGiftCard?.applicable_discount_cents || 0, appliedGiftCard?.currency || "CAD")} from ${appliedGiftCard?.code || code}.`);
    } catch (error) { appliedGiftCard = null; renderSummary(); setGiftCardMessage(error.message || "Gift card could not be applied.", true); }
  }

  async function captureRecoveryLead({ force = false, beacon = false } = {}) {
    try {
      const formData = readFormData();
      if (!isValidEmail(formData.customer_email)) return;
      const cartItems = getCartItems();
      const cartSummary = calculateCartSummary(cartItems);
      if (cartSummary.subtotal_cents <= 0) return;
      const now = Date.now();
      if (!force) { try { const last = Number(sessionStorage.getItem(RECOVERY_WRITE_KEY) || 0); if (last && now - last < RECOVERY_WRITE_WINDOW_MS) return; } catch {} }
      const payload = { customer_email: formData.customer_email, customer_name: formData.customer_name, browser_session_token: window.DDAnalytics?.browser_session_token || "", visitor_token: window.DDAnalytics?.visitor_token || "", checkout_path: "/checkout/", cart_count: cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0), cart_value_cents: cartSummary.subtotal_cents, currency: "CAD" };
      if (beacon && navigator.sendBeacon) navigator.sendBeacon("/api/checkout-recovery-lead", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      else await fetch("/api/checkout-recovery-lead", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify(payload) });
      try { sessionStorage.setItem(RECOVERY_WRITE_KEY, String(now)); } catch {}
    } catch {}
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const cartItems = getCartItems();
    const giftCardPurchase = getGiftCardPurchase();
    if (!cartItems.length && !giftCardPurchase) { setMessage("Your cart is empty.", true); return; }

    const formData = readFormData();
    saveCheckoutForm(formData);
    if (!formData.customer_name) { setMessage("Customer name is required.", true); return; }
    if (!formData.customer_email || !isValidEmail(formData.customer_email)) { setMessage("A valid email is required.", true); return; }
    const summary = renderSummary();
    const shippingError = validateRequiredShippingFields(formData, summary);
    if (shippingError) { setMessage(shippingError, true); return; }

    const originalText = submitButton?.textContent || "Place Order";
    try {
      if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Processing..."; }
      setMessage("Checking your cart and order...");
      const attempt = currentAttempt();
      let orderData;
      let order;

      if (Number(attempt.order_id || 0) > 0) {
        order = { order_id: Number(attempt.order_id), order_number: attempt.order_number || "" };
        orderData = { order, items: [] };
        setRecoveryStatus(`Resuming order ${order.order_number || `#${order.order_id}`} without creating a duplicate.`);
      } else {
        const payload = {
          ...formData,
          checkout_request_key: attempt.request_key,
          fulfillment_method: summary.fulfillment_method,
          items: normalizeCartForApi(cartItems),
          shipping_cents: summary.shipping_cents,
          currency: "CAD",
          gift_card_code: appliedGiftCard?.code || formData.gift_card_code || "",
          gift_card_discount_cents: Number(summary.gift_card_discount_cents || 0),
          gift_card_purchase: giftCardPurchase || null
        };
        orderData = await createOrder(payload);
        order = orderData.order || null;
        if (!order?.order_id) throw new Error("Order was created, but the response did not include an order id.");
        writeAttempt({ ...attempt, order_id: Number(order.order_id), order_number: order.order_number || "", order_created_at: new Date().toISOString() });
        if (orderData.idempotent_replay) setRecoveryStatus(`Recovered existing order ${order.order_number || `#${order.order_id}`} from the same checkout attempt.`);
        try { window.DDAnalytics?.trackCart?.("order_created", { order_id: order.order_id, meta: { source: orderData.idempotent_replay ? "checkout_idempotent_replay" : "checkout_create_order" } }); } catch {}
      }

      setMessage("Order ready. Preparing payment...");
      const paymentData = await preparePayment(order.order_id, formData.payment_method || "paypal");
      saveConfirmationSnapshot({ order: orderData.order || order, order_items: orderData.items || [], storefront_gift_card: orderData.storefront_gift_card || null, payment: paymentData.payment || null, provider_payload: paymentData.provider_payload || null, payment_preparation: paymentData.payment_preparation || null });

      try { localStorage.removeItem(CART_KEY); } catch {}
      clearGiftCardPurchase();
      try { window.DDCart?.clearCart?.(); } catch {}
      clearAttempt();
      if (paymentProviderStatusEl) { paymentProviderStatusEl.textContent = paymentData.message || "Payment was prepared."; paymentProviderStatusEl.style.display = "block"; }
      const nextUrl = paymentData?.provider_payload?.redirect_url || paymentData?.payment_preparation?.redirect_url || `/checkout/confirmation/?order_id=${encodeURIComponent(order.order_id)}`;
      window.location.href = nextUrl;
    } catch (error) {
      const attempt = readAttempt();
      if (Number(attempt?.order_id || 0) > 0) setRecoveryStatus(`Order ${attempt.order_number || `#${attempt.order_id}`} is saved. Retry checkout to resume payment without creating another order.`, true);
      setMessage(error.message || "Failed to complete checkout.", true);
    } finally {
      if (submitButton) { submitButton.disabled = false; submitButton.textContent = originalText; }
    }
  }

  function bindAutoSaveAndRecovery() {
    if (!form) return;
    const saveFields = Array.from(form.querySelectorAll("input, select, textarea"));
    let timer = null;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { saveCheckoutForm(readFormData()); renderSummary(); captureRecoveryLead(); }, 350);
    };
    saveFields.forEach((field) => { field.addEventListener("input", schedule); field.addEventListener("change", schedule); field.addEventListener("blur", schedule); });
  }

  fillFormFromSavedData();
  renderSummary();
  const resumed = readAttempt();
  if (Number(resumed?.order_id || 0) > 0 && resumed.signature === cartSignature()) setRecoveryStatus(`An earlier checkout created order ${resumed.order_number || `#${resumed.order_id}`}. Submitting again will resume payment, not create a duplicate.`);
  bindAutoSaveAndRecovery();
  form?.addEventListener("submit", handleSubmit);
  giftCardButtonEl?.addEventListener("click", applyGiftCard);
  fulfillmentEl?.addEventListener("change", () => { renderSummary(); saveCheckoutForm(readFormData()); });
  document.addEventListener("dd:cart-changed", () => { renderSummary(); const attempt = readAttempt(); if (attempt && attempt.signature !== cartSignature() && !attempt.order_id) clearAttempt(); });
  window.addEventListener("beforeunload", () => { captureRecoveryLead({ force: true, beacon: true }); });
});
