// File: /public/js/admin-dashboard-summary.js

document.addEventListener("DOMContentLoaded", () => {
  const refreshButton = document.getElementById("refreshDashboardSummaryButton");
  const messageEl = document.getElementById("dashboardSummaryMessage");

  const usersCountEl = document.getElementById("summaryUsersCount");
  const productsCountEl = document.getElementById("summaryProductsCount");
  const ordersCountEl = document.getElementById("summaryOrdersCount");
  const paymentsCountEl = document.getElementById("summaryPaymentsCount");

  if (!window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  let isLoading = false;

  function setMessage(message, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.style.display = message ? "block" : "none";
    messageEl.style.color = isError ? "#b00020" : "";
  }

  function setValue(el, value) {
    if (!el) return;
    el.textContent = value;
  }

  function formatCount(value) {
    const count = Number(value || 0);
    return Number.isFinite(count) ? count.toLocaleString() : "0";
  }

  async function fetchSummary() {
    const response = await window.DDAuth.apiFetch("/api/admin/dashboard-summary", {
      method: "GET"
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Failed to load dashboard summary.");
    }

    return data.summary || {};
  }

  function renderSummary(summary) {
    setValue(usersCountEl, formatCount(summary.users_count));
    setValue(productsCountEl, formatCount(summary.products_count));
    setValue(ordersCountEl, formatCount(summary.orders_count));
    setValue(paymentsCountEl, formatCount(summary.payments_count));
  }

  async function loadSummary() {
    if (isLoading) return;

    isLoading = true;
    const originalText = refreshButton?.textContent || "Refresh Summary";

    try {
      setMessage("Loading dashboard summary...");
      if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.textContent = "Loading...";
      }

      const summary = await fetchSummary();
      renderSummary(summary);
      setMessage("Dashboard summary loaded.");
    } catch (error) {
      setMessage(error.message || "Failed to load dashboard summary.", true);
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
      await loadSummary();
    });
  }

  document.addEventListener("dd:order-updated", async () => {
    await loadSummary();
  });

  loadSummary();
});
