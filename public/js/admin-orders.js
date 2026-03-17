// File: /public/js/admin-orders.js

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("ordersTableBody");
  const emptyEl = document.getElementById("ordersEmpty");
  const errorEl = document.getElementById("ordersError");
  const loadingEl = document.getElementById("ordersLoading");
  const refreshButtons = document.querySelectorAll("[data-refresh-orders]");
  const statusFilterEl = document.getElementById("ordersStatusFilter");

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
    if (!value) return "";
    const d = new Date(String(value).replace(" ", "T") + "Z");
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  }

  function titleCase(value) {
    return String(value || "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, ch => ch.toUpperCase());
  }

  function buildLocation(order) {
    const parts = [
      order.shipping_city,
      order.shipping_province,
      order.shipping_country
    ]
      .map(value => String(value || "").trim())
      .filter(Boolean);

    return parts.join(", ") || "—";
  }

  function buildPaymentSummary(order) {
    const paymentCount = Number(order.payment_count || 0);
    const paidAmount = formatMoney(order.paid_amount_cents || 0, order.currency || "CAD");
    const latestStatus = titleCase(order.latest_payment_status || "none");
    const latestProvider = order.latest_payment_provider
      ? titleCase(order.latest_payment_provider)
      : "—";

    if (paymentCount <= 0) {
      return `
        <div>No payments</div>
        <div class="small">Paid: ${escapeHtml(formatMoney(0, order.currency || "CAD"))}</div>
      `;
    }

    return `
      <div>${escapeHtml(latestStatus)}</div>
      <div class="small">Paid: ${escapeHtml(paidAmount)}</div>
      <div class="small">Provider: ${escapeHtml(latestProvider)}</div>
    `;
  }

  function renderRows(orders) {
    if (!tableBody) return;

    tableBody.innerHTML = orders.map(order => {
      const orderId = Number(order.order_id);
      const orderNumber = escapeHtml(order.order_number || "");
      const customerName = escapeHtml(order.customer_name || "");
      const customerEmail = escapeHtml(order.customer_email || "");
      const status = escapeHtml(order.order_status || "");
      const fulfillment = escapeHtml(order.fulfillment_type || "");
      const total = escapeHtml(formatMoney(order.total_cents, order.currency));
      const location = escapeHtml(buildLocation(order));
      const created = escapeHtml(formatDate(order.created_at));
      const paymentSummary = buildPaymentSummary(order);

      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #ddd">${orderId}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${orderNumber}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">
            <div>${customerName || "—"}</div>
            <div class="small">${customerEmail || ""}</div>
          </td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${status}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${fulfillment}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${total}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${paymentSummary}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${location}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${created}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">
            <button class="btn" type="button" data-view-order-id="${orderId}">
              View
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  async function loadOrders(options = {}) {
    const { silent = false } = options;

    hide(emptyEl);
    hide(errorEl);

    if (!silent) {
      show(loadingEl);
    }

    try {
      const status = String(statusFilterEl?.value || "").trim();
      const query = status ? `?status=${encodeURIComponent(status)}` : "";

      const response = await window.DDAuth.apiFetch(`/api/admin/orders${query}`, {
        method: "GET"
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to load orders.");
      }

      const orders = Array.isArray(data.orders) ? data.orders : [];

      if (!orders.length) {
        if (tableBody) tableBody.innerHTML = "";
        show(emptyEl);
        return;
      }

      renderRows(orders);
    } catch (error) {
      if (tableBody) tableBody.innerHTML = "";
      if (errorEl) {
        errorEl.textContent = error.message || "Failed to load orders.";
      }
      show(errorEl);
    } finally {
      hide(loadingEl);
    }
  }

  refreshButtons.forEach(button => {
    button.addEventListener("click", async () => {
      await loadOrders();
    });
  });

  if (statusFilterEl) {
    statusFilterEl.addEventListener("change", async () => {
      await loadOrders();
    });
  }

  document.addEventListener("dd:order-updated", async () => {
    await loadOrders({ silent: true });
  });

  if (!window.DDAuth || !window.DDAuth.isLoggedIn()) {
    return;
  }

  await loadOrders();
});
