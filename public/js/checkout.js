// File: /public/js/checkout.js

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "dd_checkout_form";

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

  function renderCheckout() {
    const items = getCartItemsSafe();

    if (!items.length) {
      hide(checkoutContentEl);
      show(checkoutEmptyEl);

      if (checkoutItemsEl) checkoutItemsEl.innerHTML = "";
      if (checkoutItemCountEl) checkoutItemCountEl.textContent = "0";
      if (checkoutSubtotalEl) checkoutSubtotalEl.textContent = formatMoney(0, "CAD");
      if (checkoutTotalEl) checkoutTotalEl.textContent = formatMoney(0, "CAD");
      if (checkoutShippingEl) checkoutShippingEl.textContent = "Calculated later";
      if (checkoutTaxEl) checkoutTaxEl.textContent = "Calculated later";
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

    if (checkoutItemCountEl) {
      checkoutItemCountEl.textContent = String(totalItems);
    }

    if (checkoutSubtotalEl) {
      checkoutSubtotalEl.textContent = formatMoney(subtotalCents, currency);
    }

    if (checkoutTotalEl) {
      checkoutTotalEl.textContent = formatMoney(subtotalCents, currency);
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
  }

  if (checkoutForm) {
    restoreFormData();

    checkoutForm.addEventListener("input", () => {
      saveFormData();
    });

    checkoutForm.addEventListener("change", () => {
      saveFormData();
    });

    checkoutForm.addEventListener("submit", (event) => {
      event.preventDefault();
      clearMessage();
      setMessage("Checkout submission will be connected when PayPal and card processing are added.");
      saveFormData();
    });
  }

  document.addEventListener("dd:cart-changed", () => {
    renderCheckout();
  });

  renderCheckout();
});
