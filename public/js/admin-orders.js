// File: /public/js/admin-orders.js

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("ordersTableBody");
  const refreshButton = document.getElementById("refreshOrdersButton");
  const statusFilter = document.getElementById("orderStatusFilter");
  const paymentFilter = document.getElementById("orderPaymentStatusFilter");
  const fulfillmentFilter = document.getElementById("orderFulfillmentFilter");
  const searchInput = document.getElementById("orderSearchInput");
  const messageEl = document.getElementById("ordersMessage");
  const summaryEl = document.getElementById("ordersSummary");
  const emptyEl = document.getElementById("ordersEmpty");

  if (!tableBody || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  let allOrders = [];
  let isLoading = false;

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
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }

  function setMessage(message, isError = false) {
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.style.display = message ? "block" : "none";
    messageEl.style.color = isError ? "#b00020" : "";
  }

  function getPaymentBadgeText(order) {
    const status =
      order.derived_payment_status ||
      order.payment_status ||
      "pending";

    const outstandingCents = Number(order.outstanding_cents || 0);
    const paidTotalCents = Number(order.paid_total_cents || 0);
    const totalCents = Number(order.total_cents || 0);

    if (status === "paid" && outstandingCents <= 0 && totalCents > 0) {
      return "Paid in Full";
    }

    if (status === "partially_refunded") {
      return "Partially Refunded";
    }

    if (status === "refunded") {
      return "Refunded";
    }

    if (status === "authorized") {
      return "Authorized";
    }

    if (status === "failed") {
      return "Failed";
    }

    if (status === "pending" && paidTotalCents > 0 && outstandingCents > 0) {
      return "Partially Paid";
    }

    return titleCase(status);
  }

  function getSearchText(order) {
    return [
      order.order_number,
      order.customer_name,
      order.customer_email,
      order.payment_method,
      order.fulfillment_type,
      order.order_status,
      order.payment_status,
      order.derived_payment_status
    ]
      .map((value) => String(value || "").toLowerCase())
      .join(" ");
  }

  function getFilterValue(el) {
    return String(el?.value || "").trim().toLowerCase();
  }

  function matchesFilters(order) {
    const statusValue = getFilterValue(statusFilter);
    const paymentValue = getFilterValue(paymentFilter);
    const fulfillmentValue = getFilterValue(fulfillmentFilter);
    const searchValue = String(searchInput?.value || "").trim().toLowerCase();

    if (statusValue && String(order.order_status || "").toLowerCase() !== statusValue) {
      return false;
    }

    if (paymentValue) {
      const orderPayment = String(order.payment_status || "").toLowerCase();
      const derivedPayment = String(order.derived_payment_status || "").toLowerCase();

      if (orderPayment !== paymentValue && derivedPayment !== paymentValue) {
        return false;
      }
    }

    if (fulfillmentValue && String(order.fulfillment_type || "").toLowerCase() !== fulfillmentValue) {
      return false;
    }

    if (searchValue && !getSearchText(order).includes(searchValue)) {
      return false;
    }

    return true;
  }

  function updateSummary(filteredOrders) {
    if (!summaryEl) return;

    const safeOrders = Array.isArray(filteredOrders) ? filteredOrders : [];

    if (!safeOrders.length) {
      summaryEl.textContent = "0 orders shown.";
      return;
    }

    const totalOrderValueCents = safeOrders.reduce((sum, order) => {
      return sum + Number(order.total_cents || 0);
    }, 0);

    const outstandingValueCents = safeOrders.reduce((sum, order) => {
      return sum + Number(order.outstanding_cents || 0);
    }, 0);

    summaryEl.textContent =
      `${safeOrders.length} order${safeOrders.length === 1 ? "" : "s"} shown • ` +
      `Total ${formatMoney(totalOrderValueCents, safeOrders[0]?.currency || "CAD")} • ` +
      `Outstanding ${formatMoney(outstandingValueCents, safeOrders[0]?.currency || "CAD")}`;
  }

  function renderOrders() {
    const filteredOrders = allOrders.filter(matchesFilters);

    if (emptyEl) {
      emptyEl.style.display = filteredOrders.length ? "none" : "block";
    }

    updateSummary(filteredOrders);

    if (!filteredOrders.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="10" style="padding:12px">No matching orders found.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filteredOrders.map((order) => {
      const currency = order.currency || "CAD";
      const orderTotal = formatMoney(order.total_cents || 0, currency);
      const outstanding = formatMoney(order.outstanding_cents || 0, currency);
      const paidTotal = formatMoney(order.paid_total_cents || 0, currency);
      const paymentSummaryText =
        `${getPaymentBadgeText(order)} • Paid ${paidTotal} • Outstanding ${outstanding}`;

      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #ddd">
            <strong>${escapeHtml(order.order_number || "—")}</strong>
          </td>

          <td style="padding:8px;border-bottom:1px solid #ddd">
            <div>${escapeHtml(order.customer_name || "—")}</div>
            <div class="small">${escapeHtml(order.customer_email || "—")}</div>
          </td>

          <td style="padding:8px;border-bottom:1px solid #ddd">
            ${escapeHtml(titleCase(order.order_status || "pending"))}
          </td>

          <td style="padding:8px;border-bottom:1px solid #ddd">
            ${escapeHtml(titleCase(order.fulfillment_type || "shipping"))}
          </td>

          <td style="padding:8px;border-bottom:1px solid #ddd">
            <div>${escapeHtml(paymentSummaryText)}</div>
            <div class="small">${escapeHtml(titleCase(order.payment_method || "—"))}</div>
          </td>

          <td style="padding:8px;border-bottom:1px solid #ddd">
            ${escapeHtml(orderTotal)}
          </td>

          <td style="padding:8px;border-bottom:1px solid #ddd">
            ${escapeHtml(outstanding)}
          </td>

          <td style="padding:8px;border-bottom:1px solid #ddd">
            ${escapeHtml(String(order.payment_count || 0))}
          </td>

          <td style="padding:8px;border-bottom:1px solid #ddd">
            ${escapeHtml(formatDate(order.created_at))}
          </td>

          <td style="padding:8px;border-bottom:1px solid #ddd">
            <button
              class="btn"
              type="button"
              data-view-order-id="${escapeHtml(String(order.order_id || ""))}"
            >
              View
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  async function fetchOrders() {
    const response = await window.DDAuth.apiFetch("/api/admin/orders", {
      method: "GET"
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Failed to load orders.");
    }

    return Array.isArray(data.orders) ? data.orders : [];
  }

  function normalizeOrders(orders) {
    return (Array.isArray(orders) ? orders : []).map((order) => {
      const totalCents = Number(order.total_cents || 0);
      const paidTotalCents = Number(order.paid_total_cents || 0);
      const outstandingCents =
        order.outstanding_cents != null
          ? Number(order.outstanding_cents || 0)
          : Math.max(totalCents - paidTotalCents, 0);

      return {
        ...order,
        total_cents: totalCents,
        paid_total_cents: paidTotalCents,
        refunded_total_cents: Number(order.refunded_total_cents || 0),
        pending_total_cents: Number(order.pending_total_cents || 0),
        outstanding_cents: outstandingCents,
        payment_count: Number(order.payment_count || 0)
      };
    });
  }

  async function loadOrders() {
    if (isLoading) return;

    const originalRefreshText = refreshButton?.textContent || "Refresh";
    isLoading = true;

    try {
      setMessage("Loading orders...");
      if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.textContent = "Loading...";
      }

      const orders = await fetchOrders();
      allOrders = normalizeOrders(orders);
      renderOrders();

      setMessage(`Loaded ${allOrders.length} order${allOrders.length === 1 ? "" : "s"}.`);
    } catch (error) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="10" style="padding:12px;color:#b00020">
            ${escapeHtml(error.message || "Failed to load orders.")}
          </td>
        </tr>
      `;
      updateSummary([]);
      setMessage(error.message || "Failed to load orders.", true);
    } finally {
      isLoading = false;
      if (refreshButton) {
        refreshButton.disabled = false;
        refreshButton.textContent = originalRefreshText;
      }
    }
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", async () => {
      await loadOrders();
    });
  }

  [statusFilter, paymentFilter, fulfillmentFilter].forEach((el) => {
    if (!el) return;
    el.addEventListener("change", () => {
      renderOrders();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderOrders();
    });
  }

  document.addEventListener("dd:order-updated", async () => {
    await loadOrders();
  });

  loadOrders();
});
