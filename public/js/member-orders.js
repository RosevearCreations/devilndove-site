// File: /public/js/member-orders.js

document.addEventListener("DOMContentLoaded", () => {
  const refreshButton = document.getElementById("refreshMemberOrdersButton");
  const messageEl = document.getElementById("memberOrdersMessage");
  const summaryEl = document.getElementById("memberOrdersSummary");
  const emptyEl = document.getElementById("memberOrdersEmpty");
  const tableBody = document.getElementById("memberOrdersTableBody");

  if (!tableBody || !window.DDAuth) return;

  let isLoading = false;
  let hasMemberAccess = false;
  let currentUser = null;
  let allOrders = [];

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

  function updateSummary(orders) {
    if (!summaryEl) return;

    const safeOrders = Array.isArray(orders) ? orders : [];

    if (!safeOrders.length) {
      summaryEl.textContent = "0 orders shown.";
      return;
    }

    const totalValueCents = safeOrders.reduce((sum, order) => {
      return sum + Number(order.total_cents || 0);
    }, 0);

    const pendingCount = safeOrders.filter((order) => {
      return String(order.order_status || "").toLowerCase() === "pending";
    }).length;

    summaryEl.textContent =
      `${safeOrders.length} order${safeOrders.length === 1 ? "" : "s"} • ` +
      `Total ${formatMoney(totalValueCents, safeOrders[0]?.currency || "CAD")} • ` +
      `${pendingCount} pending`;
  }

  function getPaymentLabel(order) {
    const paymentStatus = String(
      order.derived_payment_status || order.payment_status || "pending"
    ).toLowerCase();

    if (paymentStatus === "paid") return "Paid";
    if (paymentStatus === "authorized") return "Authorized";
    if (paymentStatus === "refunded") return "Refunded";
    if (paymentStatus === "partially_refunded") return "Partially Refunded";
    if (paymentStatus === "failed") return "Failed";
    if (paymentStatus === "cancelled") return "Cancelled";

    return "Pending";
  }

  function renderOrders(orders) {
    const safeOrders = Array.isArray(orders) ? orders : [];

    if (emptyEl) {
      emptyEl.style.display = safeOrders.length ? "none" : "block";
    }

    updateSummary(safeOrders);

    if (!safeOrders.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="padding:12px">No orders found.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = safeOrders.map((order) => {
      const currency = order.currency || "CAD";

      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #ddd">
            <div><strong>${escapeHtml(order.order_number || "—")}</strong></div>
          </td>

          <td style="padding:8px;border-bottom:1px solid #ddd">
            ${escapeHtml(titleCase(order.order_status || "pending"))}
          </td>

          <td style="padding:8px;border-bottom:1px solid #ddd">
            ${escapeHtml(getPaymentLabel(order))}
          </td>

          <td style="padding:8px;border-bottom:1px solid #ddd">
            ${escapeHtml(titleCase(order.fulfillment_type || "shipping"))}
          </td>

          <td style="padding:8px;border-bottom:1px solid #ddd">
            ${escapeHtml(formatMoney(order.total_cents || 0, currency))}
          </td>

          <td style="padding:8px;border-bottom:1px solid #ddd">
            ${escapeHtml(formatDate(order.created_at))}
          </td>

          <td style="padding:8px;border-bottom:1px solid #ddd">
            <button
              class="btn"
              type="button"
              data-member-view-order-id="${escapeHtml(String(order.order_id || ""))}"
            >
              View
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  async function fetchMemberOrders() {
    const response = await window.DDAuth.apiFetch("/api/member/orders", {
      method: "GET"
    });

    const data = await response.json();

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "Failed to load your orders.");
    }

    return Array.isArray(data.orders) ? data.orders : [];
  }

  async function loadOrders() {
    if (isLoading || !hasMemberAccess || !currentUser) return;

    isLoading = true;
    const originalText = refreshButton?.textContent || "Refresh Orders";

    try {
      setMessage("Loading your orders...");

      if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.textContent = "Loading...";
      }

      allOrders = await fetchMemberOrders();
      renderOrders(allOrders);
      setMessage(`Loaded ${allOrders.length} order${allOrders.length === 1 ? "" : "s"}.`);
    } catch (error) {
      allOrders = [];
      renderOrders([]);
      setMessage(error.message || "Failed to load your orders.", true);
    } finally {
      isLoading = false;

      if (refreshButton) {
        refreshButton.disabled = false;
        refreshButton.textContent = originalText;
      }
    }
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", async () => {
      await loadOrders();
    });
  }

  document.addEventListener("dd:member-access-ready", async (event) => {
    hasMemberAccess = !!event?.detail?.ok;
    currentUser = hasMemberAccess ? (event?.detail?.user || currentUser) : null;

    if (!hasMemberAccess) {
      allOrders = [];
      renderOrders([]);
      return;
    }

    await loadOrders();
  });

  document.addEventListener("dd:members-ready", async (event) => {
    if (!event?.detail?.ok) return;

    hasMemberAccess = true;
    currentUser = event.detail.user || currentUser;
    await loadOrders();
  });

  document.addEventListener("dd:order-updated", async () => {
    if (!hasMemberAccess) return;
    await loadOrders();
  });

  renderOrders([]);
});
