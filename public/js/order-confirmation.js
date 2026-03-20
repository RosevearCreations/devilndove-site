// File: /public/js/order-confirmation.js
// Brief description: Handles the checkout confirmation page. It reads the new order details
// from the URL, optionally fetches fresh order data when available, fills the confirmation
// summary, and gives the user a clean handoff after checkout/order creation.

document.addEventListener("DOMContentLoaded", () => {
  const messageEl = document.getElementById("orderConfirmationMessage");
  const orderNumberEl = document.getElementById("confirmationOrderNumber");
  const orderIdEl = document.getElementById("confirmationOrderId");
  const orderStatusEl = document.getElementById("confirmationOrderStatus");
  const paymentStatusEl = document.getElementById("confirmationPaymentStatus");
  const paymentProviderEl = document.getElementById("confirmationPaymentProvider");
  const customerNameEl = document.getElementById("confirmationCustomerName");
  const customerEmailEl = document.getElementById("confirmationCustomerEmail");
  const totalEl = document.getElementById("confirmationTotal");
  const createdAtEl = document.getElementById("confirmationCreatedAt");
  const nextStepEl = document.getElementById("confirmationNextStep");

  function setMessage(message, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.style.display = message ? "block" : "none";
    messageEl.style.color = isError ? "#b00020" : "";
  }

  function setText(el, value) {
    if (!el) return;
    el.textContent = value;
  }

  function titleCase(value) {
    const text = String(value || "").trim();
    if (!text) return "—";

    return text
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
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

  function getUrlState() {
    const url = new URL(window.location.href);

    return {
      order_id: Number(url.searchParams.get("order_id") || 0),
      order_number: String(url.searchParams.get("order_number") || "").trim(),
      payment_provider: String(url.searchParams.get("payment_provider") || "").trim(),
      payment_status: String(url.searchParams.get("payment_status") || "").trim()
    };
  }

  async function fetchOrderDetail(orderId) {
    if (!orderId || !window.DDAuth?.apiFetch) return null;

    try {
      const response = await window.DDAuth.apiFetch(`/api/member/order-detail?order_id=${encodeURIComponent(orderId)}`, {
        method: "GET"
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  function renderFromUrlState(state) {
    setText(orderNumberEl, state.order_number || "—");
    setText(orderIdEl, state.order_id ? String(state.order_id) : "—");
    setText(orderStatusEl, "Pending");
    setText(paymentStatusEl, titleCase(state.payment_status || "pending"));
    setText(paymentProviderEl, titleCase(state.payment_provider || "pending"));
    setText(customerNameEl, "—");
    setText(customerEmailEl, "—");
    setText(totalEl, "—");
    setText(createdAtEl, "—");

    if (nextStepEl) {
      nextStepEl.textContent =
        "Your order was created successfully. Payment is currently pending until the payment provider flow is completed.";
    }
  }

  function renderFromOrderPayload(payload, fallbackState) {
    const order = payload?.order || {};
    const paymentSummary = payload?.payment_summary || {};

    setText(orderNumberEl, order.order_number || fallbackState.order_number || "—");
    setText(orderIdEl, order.order_id ? String(order.order_id) : (fallbackState.order_id ? String(fallbackState.order_id) : "—"));
    setText(orderStatusEl, titleCase(order.order_status || "pending"));
    setText(paymentStatusEl, titleCase(paymentSummary.derived_payment_status || order.payment_status || fallbackState.payment_status || "pending"));
    setText(paymentProviderEl, titleCase(fallbackState.payment_provider || "pending"));
    setText(customerNameEl, order.customer_name || "—");
    setText(customerEmailEl, order.customer_email || "—");
    setText(totalEl, formatMoney(order.total_cents || 0, order.currency || "CAD"));
    setText(createdAtEl, formatDate(order.created_at));

    if (nextStepEl) {
      const paymentState = String(paymentSummary.derived_payment_status || order.payment_status || "pending").toLowerCase();

      if (paymentState === "paid") {
        nextStepEl.textContent = "Payment has been recorded and your order is now marked as paid.";
      } else if (paymentState === "authorized") {
        nextStepEl.textContent = "Your payment is authorized and awaiting final completion.";
      } else {
        nextStepEl.textContent =
          "Your order has been created. Payment is still pending and will be completed once the payment flow is finalized.";
      }
    }
  }

  async function init() {
    const state = getUrlState();

    if (!state.order_id && !state.order_number) {
      setMessage("No order information was found for this confirmation page.", true);
      renderFromUrlState({});
      return;
    }

    setMessage("Loading your order confirmation...");
    renderFromUrlState(state);

    const payload = state.order_id ? await fetchOrderDetail(state.order_id) : null;

    if (payload?.order) {
      renderFromOrderPayload(payload, state);
      setMessage("");
      return;
    }

    setMessage("");
  }

  init();
});
