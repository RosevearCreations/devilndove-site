// File: /public/js/order-confirmation.js

document.addEventListener("DOMContentLoaded", () => {
  const LAST_ORDER_KEY = "dd_last_order";

  const emptyEl = document.getElementById("orderConfirmationEmpty");
  const contentEl = document.getElementById("orderConfirmationContent");

  const orderNumberEl = document.getElementById("confirmOrderNumber");
  const orderStatusEl = document.getElementById("confirmOrderStatus");
  const paymentStatusEl = document.getElementById("confirmPaymentStatus");
  const customerNameEl = document.getElementById("confirmCustomerName");
  const customerEmailEl = document.getElementById("confirmCustomerEmail");
  const fulfillmentTypeEl = document.getElementById("confirmFulfillmentType");
  const paymentMethodEl = document.getElementById("confirmPaymentMethod");
  const createdAtEl = document.getElementById("confirmCreatedAt");

  const subtotalEl = document.getElementById("confirmSubtotal");
  const shippingEl = document.getElementById("confirmShipping");
  const taxEl = document.getElementById("confirmTax");
  const totalEl = document.getElementById("confirmTotal");

  const nextStepTextEl = document.getElementById("confirmNextStepText");
  const paymentProviderEl = document.getElementById("confirmPaymentProvider");
  const paymentReferenceEl = document.getElementById("confirmPaymentReference");
  const nextActionEl = document.getElementById("confirmNextAction");

  const warningWrapEl = document.getElementById("confirmOrderWarningWrap");
  const warningEl = document.getElementById("confirmOrderWarning");

  const itemsEl = document.getElementById("confirmItems");
  const shippingAddressEl = document.getElementById("confirmShippingAddress");

  const payPalButton = document.getElementById("confirmPayPalButton");
  const cardButton = document.getElementById("confirmCardButton");

  function show(el) {
    if (el) el.style.display = "";
  }

  function hide(el) {
    if (el) el.style.display = "none";
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

  function formatDate(value) {
    if (!value) return "—";

    const raw = String(value).trim();
    const parsed = new Date(raw);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString();
    }

    const fallback = new Date(raw.replace(" ", "T") + "Z");
    if (!Number.isNaN(fallback.getTime())) {
      return fallback.toLocaleString();
    }

    return raw;
  }

  function titleCase(value) {
    const text = String(value || "").trim();
    if (!text) return "—";

    return text
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .replace(/\b\w/g, ch => ch.toUpperCase());
  }

  function getLastOrder() {
    try {
      const raw = localStorage.getItem(LAST_ORDER_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function getPaymentReference(payment) {
    if (!payment || typeof payment !== "object") return "—";

    return (
      payment.payment_reference ||
      payment.provider_reference ||
      payment.intent_id ||
      payment.order_id ||
      payment.transaction_id ||
      payment.id ||
      "—"
    );
  }

  function getPaymentProvider(payment) {
    if (!payment || typeof payment !== "object") return "—";

    return titleCase(
      payment.provider ||
      payment.gateway ||
      payment.method ||
      "pending"
    );
  }

  function getPaymentMethod(order, payment) {
    return titleCase(
      payment?.method ||
      order?.payment_method ||
      "pending"
    );
  }

  function getPaymentStatus(order, payment) {
    return titleCase(
      payment?.payment_status ||
      payment?.status ||
      order?.payment_status ||
      "pending"
    );
  }

  function getNextAction(data, payment) {
    return titleCase(
      data?.next_step?.action ||
      data?.next_step?.type ||
      payment?.next_action ||
      payment?.action_required ||
      "awaiting gateway connection"
    );
  }

  function getNextStepMessage(data, order, payment) {
    const nextStep = data?.next_step || {};
    const paymentMethod = String(payment?.method || order?.payment_method || "").toLowerCase();
    const paymentStatus = String(payment?.payment_status || payment?.status || order?.payment_status || "").toLowerCase();

    if (nextStep.message) {
      return String(nextStep.message);
    }

    if (paymentStatus === "paid" || paymentStatus === "completed") {
      return "Your payment appears to be completed. Keep your order number for any follow-up.";
    }

    if (paymentMethod === "paypal") {
      return "Your order was created and the PayPal payment step has been prepared as far as the current integration allows.";
    }

    if (paymentMethod === "stripe") {
      return "Your order was created and card payment preparation has been saved for the upcoming Stripe connection.";
    }

    if (paymentMethod === "square") {
      return "Your order was created and Square payment preparation has been saved for the upcoming live gateway connection.";
    }

    if (paymentMethod === "manual") {
      return "Your order was created. Payment will need to be completed by manual or offline follow-up.";
    }

    return "Your order was created and the payment step has been prepared as far as the current checkout integration allows.";
  }

  function normalizeItems(data, order) {
    const directItems = Array.isArray(data?.items) ? data.items : [];
    if (directItems.length) return directItems;

    const fallbackItems = Array.isArray(order?.items) ? order.items : [];
    if (fallbackItems.length) return fallbackItems;

    return [];
  }

  function renderItems(items, currency) {
    if (!itemsEl) return;

    const safeItems = Array.isArray(items) ? items : [];

    if (!safeItems.length) {
      itemsEl.innerHTML = `<p class="small">No order items found.</p>`;
      return;
    }

    itemsEl.innerHTML = safeItems.map(item => {
      const quantity = Number(item.quantity || 0);
      const lineSubtotalCents =
        Number(item.line_subtotal_cents || 0) ||
        (Number(item.price_cents || 0) * quantity);

      const productName = item.product_name || item.name || "Item";
      const productType = item.product_type || "product";
      const sku = item.sku || item.product_sku || "—";

      return `
        <div class="card" style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
            <div>
              <div style="font-weight:700">${escapeHtml(productName)}</div>
              <div class="small" style="text-transform:capitalize;opacity:.8">
                ${escapeHtml(productType)}
              </div>
              <div class="small">Qty: ${escapeHtml(String(quantity || 0))}</div>
              <div class="small">SKU: ${escapeHtml(sku)}</div>
            </div>

            <div style="font-weight:700">
              ${escapeHtml(formatMoney(lineSubtotalCents, currency))}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderShippingAddress(order) {
    if (!shippingAddressEl) return;

    const lines = [
      order.shipping_name || order.customer_name,
      order.shipping_address1,
      order.shipping_address2,
      [order.shipping_city, order.shipping_province].filter(Boolean).join(", "),
      order.shipping_postal_code,
      order.shipping_country
    ]
      .map(value => String(value || "").trim())
      .filter(Boolean);

    if (!lines.length) {
      shippingAddressEl.innerHTML = `<p class="small">No shipping address saved for this order.</p>`;
      return;
    }

    shippingAddressEl.innerHTML = `<p>${lines.map(line => escapeHtml(line)).join("<br>")}</p>`;
  }

  function renderWarning(data) {
    const warning =
      String(data?.checkout_warning || "").trim() ||
      String(data?.warning || "").trim();

    if (!warning) {
      hide(warningWrapEl);
      return;
    }

    if (warningEl) {
      warningEl.textContent = warning;
    }

    show(warningWrapEl);
  }

  function renderPaymentButtons(order, payment) {
    const method = String(payment?.method || order?.payment_method || "").toLowerCase();

    if (payPalButton) {
      payPalButton.disabled = method !== "paypal";
      payPalButton.textContent = method === "paypal"
        ? "Pay with PayPal Coming Soon"
        : "Pay with PayPal Unavailable";
    }

    if (cardButton) {
      const isCardMethod = method === "stripe" || method === "square";
      cardButton.disabled = !isCardMethod;
      cardButton.textContent = isCardMethod
        ? "Pay by Card Coming Soon"
        : "Pay by Card Unavailable";
    }
  }

  function renderOrder(data) {
    const order = data?.order || {};
    const payment = data?.payment || {};
    const items = normalizeItems(data, order);
    const currency = order.currency || "CAD";

    if (orderNumberEl) {
      orderNumberEl.textContent = order.order_number || order.order_id || "—";
    }

    if (orderStatusEl) {
      orderStatusEl.textContent = titleCase(order.order_status || "pending");
    }

    if (paymentStatusEl) {
      paymentStatusEl.textContent = getPaymentStatus(order, payment);
    }

    if (customerNameEl) {
      customerNameEl.textContent = order.customer_name || order.shipping_name || "—";
    }

    if (customerEmailEl) {
      customerEmailEl.textContent = order.customer_email || order.email || "—";
    }

    if (fulfillmentTypeEl) {
      fulfillmentTypeEl.textContent = titleCase(order.fulfillment_type || "shipping");
    }

    if (paymentMethodEl) {
      paymentMethodEl.textContent = getPaymentMethod(order, payment);
    }

    if (createdAtEl) {
      createdAtEl.textContent = formatDate(order.created_at);
    }

    if (subtotalEl) {
      subtotalEl.textContent = formatMoney(order.subtotal_cents || 0, currency);
    }

    if (shippingEl) {
      shippingEl.textContent = formatMoney(order.shipping_cents || 0, currency);
    }

    if (taxEl) {
      taxEl.textContent = formatMoney(order.tax_cents || 0, currency);
    }

    if (totalEl) {
      totalEl.textContent = formatMoney(order.total_cents || 0, currency);
    }

    if (nextStepTextEl) {
      nextStepTextEl.textContent = getNextStepMessage(data, order, payment);
    }

    if (paymentProviderEl) {
      paymentProviderEl.textContent = getPaymentProvider(payment);
    }

    if (paymentReferenceEl) {
      paymentReferenceEl.textContent = getPaymentReference(payment);
    }

    if (nextActionEl) {
      nextActionEl.textContent = getNextAction(data, payment);
    }

    renderWarning(data);
    renderItems(items, currency);
    renderShippingAddress(order);
    renderPaymentButtons(order, payment);
  }

  const lastOrder = getLastOrder();

  if (!lastOrder || !lastOrder.order) {
    hide(contentEl);
    show(emptyEl);
    return;
  }

  hide(emptyEl);
  renderOrder(lastOrder);
  show(contentEl);
});
