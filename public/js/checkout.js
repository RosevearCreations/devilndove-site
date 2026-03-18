// File: /public/js/checkout.js

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "dd_checkout_form";
  const LAST_ORDER_KEY = "dd_last_order";

  const checkoutEmptyEl = document.getElementById("checkoutEmpty");
  const checkoutContentEl = document.getElementById("checkoutContent");
  const checkoutItemsEl = document.getElementById("checkoutItems");
  const checkoutItemCountEl = document.getElementById("checkoutItemCount");
  const checkoutSubtotalEl = document.getElementById("checkoutSubtotal");
  const checkoutShippingEl = document.getElementById("checkoutShipping");
  const checkoutTaxEl = document.getElementById("checkoutTax");
  const checkoutTotalEl = document.getElementById("checkoutTotal");
  const checkoutForm = document.getElementById("checkoutForm");
  const checkoutMessageEl = document.getElementById("checkoutMessage");
  const checkoutSubmitButton = document.getElementById("checkoutSubmitButton");

  function show(el) {
    if (el) el.style.display = "";
  }

  function hide(el) {
    if (el) el.style.display = "none";
  }

  function setMessage(message, isError = false) {
    if (!checkoutMessageEl) return;
    checkoutMessageEl.textContent = message;
    checkoutMessageEl.style.display = "block";
    checkoutMessageEl.style.color = isError ? "#b00020" : "#0a7a2f";
  }

  function clearMessage() {
    if (!checkoutMessageEl) return;
    checkoutMessageEl.textContent = "";
    checkoutMessageEl.style.display = "none";
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

  function getCartItemsSafe() {
    if (!window.DDCart) return [];
    return window.DDCart.getCartItems();
  }

  function getStoredFormData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveFormData() {
    if (!checkoutForm) return;

    const formData = new FormData(checkoutForm);
    const payload = {};

    for (const [key, value] of formData.entries()) {
      payload[key] = String(value || "");
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function restoreFormData() {
    if (!checkoutForm) return;

    const stored = getStoredFormData();

    Object.entries(stored).forEach(([key, value]) => {
      const field = checkoutForm.elements.namedItem(key);
      if (!field) return;
      field.value = value == null ? "" : String(value);
    });
  }

  function saveLastOrder(data) {
    try {
      localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(data));
    } catch {
      // ignore storage failures
    }
  }

  function getFieldValue(formData, names) {
    for (const name of names) {
      const value = formData.get(name);
      if (value != null) {
        return String(value || "").trim();
      }
    }
    return "";
  }

  function hasPhysicalItems(items) {
    return items.some(item => {
      if (Number(item.requires_shipping) === 1) return true;
      return String(item.product_type || "").toLowerCase() === "physical";
    });
  }

  function renderCheckout() {
    const items = getCartItemsSafe();

    if (!items.length) {
      hide(checkoutContentEl);
      show(checkoutEmptyEl);

      if (checkoutItemsEl) checkoutItemsEl.innerHTML = "";
      if (checkoutItemCountEl) checkoutItemCountEl.textContent = "0";
      if (checkoutSubtotalEl) checkoutSubtotalEl.textContent = formatMoney(0, "CAD");
      if (checkoutShippingEl) checkoutShippingEl.textContent = "Calculated at order step";
      if (checkoutTaxEl) checkoutTaxEl.textContent = "Calculated at order step";
      if (checkoutTotalEl) checkoutTotalEl.textContent = formatMoney(0, "CAD");
      if (checkoutSubmitButton) checkoutSubmitButton.disabled = true;
      return;
    }

    hide(checkoutEmptyEl);
    show(checkoutContentEl);

    const subtotalCents = items.reduce((sum, item) => {
      return sum + (Number(item.price_cents || 0) * Number(item.quantity || 0));
    }, 0);

    const totalItems = items.reduce((sum, item) => {
      return sum + Number(item.quantity || 0);
    }, 0);

    const currency = items[0]?.currency || "CAD";
    const shippingRequired = hasPhysicalItems(items);

    if (checkoutItemCountEl) {
      checkoutItemCountEl.textContent = String(totalItems);
    }

    if (checkoutSubtotalEl) {
      checkoutSubtotalEl.textContent = formatMoney(subtotalCents, currency);
    }

    if (checkoutShippingEl) {
      checkoutShippingEl.textContent = shippingRequired
        ? "Calculated after address review"
        : formatMoney(0, currency);
    }

    if (checkoutTaxEl) {
      checkoutTaxEl.textContent = "Calculated when order is created";
    }

    if (checkoutTotalEl) {
      checkoutTotalEl.textContent = "Calculated when order is created";
    }

    if (checkoutItemsEl) {
      checkoutItemsEl.innerHTML = items.map(item => {
        const lineTotal = Number(item.price_cents || 0) * Number(item.quantity || 0);

        return `
          <div class="card" style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
              <div>
                <div style="font-weight:700">${escapeHtml(item.name || "")}</div>
                <div class="small" style="text-transform:capitalize;opacity:.8">
                  ${escapeHtml(item.product_type || "")}
                </div>
                <div class="small">
                  Qty: ${escapeHtml(String(item.quantity || 0))}
                </div>
              </div>

              <div style="font-weight:700">
                ${escapeHtml(formatMoney(lineTotal, item.currency || currency))}
              </div>
            </div>
          </div>
        `;
      }).join("");
    }

    if (checkoutSubmitButton) {
      checkoutSubmitButton.disabled = false;
      checkoutSubmitButton.textContent = "Create Order";
    }
  }

  async function prefillFromLoggedInUser() {
    if (!window.DDAuth || !window.DDAuth.isLoggedIn() || !checkoutForm) {
      return;
    }

    try {
      const me = await window.DDAuth.fetchMe();

      const emailField = checkoutForm.elements.namedItem("email");
      const nameField = checkoutForm.elements.namedItem("name");

      if (emailField && !String(emailField.value || "").trim()) {
        emailField.value = String(me?.email || "").trim();
      }

      if (nameField && !String(nameField.value || "").trim()) {
        nameField.value = String(me?.display_name || "").trim();
      }

      saveFormData();
    } catch {
      // ignore autofill failures
    }
  }

  function validateCheckoutPayload(payload, shippingRequired) {
    if (!payload.email) {
      return "Email is required.";
    }

    if (!payload.customer_name) {
      return "Full name is required.";
    }

    if (!payload.payment_method) {
      return "Payment method is required.";
    }

    if (shippingRequired) {
      if (!payload.shipping_address1) return "Address Line 1 is required for shippable items.";
      if (!payload.shipping_city) return "City is required for shippable items.";
      if (!payload.shipping_province) return "Province / State is required for shippable items.";
      if (!payload.shipping_postal_code) return "Postal / ZIP Code is required for shippable items.";
      if (!payload.shipping_country) return "Country is required for shippable items.";
    }

    return "";
  }

  async function createOrder() {
    if (!checkoutForm) return;

    const cartItems = getCartItemsSafe();

    if (!cartItems.length) {
      setMessage("Your cart is empty.", true);
      renderCheckout();
      return;
    }

    const formData = new FormData(checkoutForm);
    const shippingRequired = hasPhysicalItems(cartItems);

    const payload = {
      email: getFieldValue(formData, ["email"]),
      customer_name: getFieldValue(formData, ["customer_name", "name"]),
      shipping_address1: getFieldValue(formData, ["shipping_address1", "address1"]),
      shipping_address2: getFieldValue(formData, ["shipping_address2", "address2"]),
      shipping_city: getFieldValue(formData, ["shipping_city", "city"]),
      shipping_province: getFieldValue(formData, ["shipping_province", "province"]),
      shipping_postal_code: getFieldValue(formData, ["shipping_postal_code", "postal_code"]),
      shipping_country: getFieldValue(formData, ["shipping_country", "country"]) || "Canada",
      notes: getFieldValue(formData, ["notes", "order_notes", "checkout_notes"]),
      payment_method: getFieldValue(formData, ["payment_method"]) || "paypal",
      cart_items: cartItems
    };

    const validationError = validateCheckoutPayload(payload, shippingRequired);

    if (validationError) {
      setMessage(validationError, true);
      return;
    }

    const originalText = checkoutSubmitButton ? checkoutSubmitButton.textContent : "";

    try {
      clearMessage();

      if (checkoutSubmitButton) {
        checkoutSubmitButton.disabled = true;
        checkoutSubmitButton.textContent = "Creating Order...";
      }

      const createOrderResponse = await fetch("/api/checkout-create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const createOrderData = await createOrderResponse.json();

      if (!createOrderResponse.ok || !createOrderData.ok) {
        throw new Error(createOrderData.error || "Failed to create order.");
      }

      let finalOrderData = {
        ...createOrderData,
        checkout_warning: ""
      };

      try {
        if (checkoutSubmitButton) {
          checkoutSubmitButton.textContent = "Preparing Payment...";
        }

        const preparePaymentResponse = await fetch("/api/checkout-prepare-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            order_id: createOrderData.order?.order_id,
            payment_method: payload.payment_method
          })
        });

        const preparePaymentData = await preparePaymentResponse.json();

        if (preparePaymentResponse.ok && preparePaymentData.ok) {
          finalOrderData = {
            ...createOrderData,
            payment: preparePaymentData.payment || createOrderData.payment || null,
            next_step: preparePaymentData.next_step || null,
            checkout_warning: ""
          };
        } else {
          finalOrderData.checkout_warning =
            preparePaymentData.error || "Order created, but payment setup was not prepared yet.";
        }
      } catch {
        finalOrderData.checkout_warning =
          "Order created, but payment setup could not be prepared yet.";
      }

      saveFormData();
      saveLastOrder(finalOrderData);

      if (window.DDCart) {
        window.DDCart.clearCart();
      }

      window.location.href = "/checkout/confirmation/";
    } catch (error) {
      setMessage(error.message || "Failed to create order.", true);
    } finally {
      if (checkoutSubmitButton) {
        checkoutSubmitButton.disabled = false;
        checkoutSubmitButton.textContent = originalText || "Create Order";
      }
    }
  }

  if (checkoutForm) {
    restoreFormData();

    checkoutForm.addEventListener("input", () => {
      saveFormData();
    });

    checkoutForm.addEventListener("change", () => {
      saveFormData();
    });

    checkoutForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await createOrder();
    });
  }

  document.addEventListener("dd:cart-changed", () => {
    renderCheckout();
  });

  renderCheckout();
  prefillFromLoggedInUser();
});
