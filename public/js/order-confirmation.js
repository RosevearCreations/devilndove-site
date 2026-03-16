// File: /public/js/order-confirmation.js

document.addEventListener("DOMContentLoaded", () => {
  const LAST_ORDER_KEY = "dd_last_order";

  const emptyEl = document.getElementById("orderConfirmationEmpty");
  const contentEl = document.getElementById("orderConfirmationContent");

  const orderNumberEl = document.getElementById("confirmOrderNumber");
  const orderStatusEl = document.getElementById("confirmOrderStatus");
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
  const itemsEl = document.getElementById("confirmItems");
  const shippingAddressEl = document.getElementById("confirmShippingAddress");

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
    const normalized = String(value).replace(" ", "T") + "Z";
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  }

  function titleCase(value) {
    return String(value || "")
      .replaceAll("_", " ")
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

  function renderItems(items, currency) {
    if (!itemsEl) return;

    const safeItems = Array.isArray(items) ? items : [];

    if (!safeItems.length) {
      itemsEl.innerHTML = `<p class="small">No order items found.</p>`;
      return;
    }

    itemsEl.innerHTML = safeItems.map(item => {
      const lineTotal = Number(item.line_subtotal_cents || 0);

      return `
        <div class="card" style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
            <div>
              <div style="font-weight:700">${escapeHtml(item.product_name || "")}</div>
              <div class="small" style="text-transform:capitalize;opacity:.8">
                ${escapeHtml(item.product_type || "")}
              </div>
              <div class="small">Qty: ${escapeHtml(String(item.quantity || 0))}</div>
              <div class="small">SKU: ${escapeHtml(item.sku || "—")}</div>
            </div>

            <div style="font-weight:700">
              ${escapeHtml(formatMoney(lineTotal, currency))}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderShippingAddress(order) {
    if (!shippingAddressEl) return;

    const lines = [
      order.shipping_name,
      order.shipping_address1,
      order.shipping_address2,
      [order.shipping_city, order.shipping_province].filter(Boolean).join(", "),
      order.shipping_postal_code,
      order.shipping_country
    ].map(v => String(v || "").trim()).filter(Boolean);

    if (!lines.length) {
      shippingAddressEl.innerHTML = `<p class="small">No shipping address saved for this order.</p>`;
      return;
    }

    shippingAddressEl.innerHTML = `<p>${lines.map(line => escapeHtml(line)).join("<br>")}</p>`;
  }

  function renderOrder(data) {
    const order = data.order || {};
    const items = data.items || [];
    const payment = data.payment || {};
    const currency = order.currency || "CAD";

    if (orderNumberEl) orderNumberEl.textContent = order.order_number || "—";
    if (orderStatusEl) orderStatusEl.textContent = titleCase(order.order_status || "pending");
    if (customerNameEl) customerNameEl.textContent = order.customer_name || "—";
    if (customerEmailEl) customerEmailEl.textContent = order.customer_email || "—";
    if (fulfillmentTypeEl) fulfillmentTypeEl.textContent = titleCase(order.fulfillment_type || "shipping");
    if (paymentMethodEl) paymentMethodEl.textContent = titleCase(payment.method || "paypal");
    if (createdAtEl) createdAtEl.textContent = formatDate(order.created_at);

    if (subtotalEl) subtotalEl.textContent = formatMoney(order.subtotal_cents || 0, currency);
    if (shippingEl) shippingEl.textContent = formatMoney(order.shipping_cents || 0, currency);
    if (taxEl) taxEl.textContent = formatMoney(order.tax_cents || 0, currency);
    if (totalEl) totalEl.textContent = formatMoney(order.total_cents || 0, currency);

    if (nextStepTextEl) {
      const method = String(payment.method || "").toLowerCase();
      nextStepTextEl.textContent =
        method === "paypal"
          ? "This order is ready for PayPal integration. The next step is connecting PayPal order creation and redirect."
          : "This order is ready for card processing integration. The next step is connecting your chosen card processor.";
    }

    renderItems(items, currency);
    renderShippingAddress(order);
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
