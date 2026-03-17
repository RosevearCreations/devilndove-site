// File: /public/js/admin-order-detail.js

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("ordersTableBody");

  if (!tableBody || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  let modalEl = null;

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
    const d = new Date(String(value).replace(" ", "T") + "Z");
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  }

  function titleCase(value) {
    return String(value || "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, ch => ch.toUpperCase());
  }

  function ensureModal() {
    if (modalEl) return modalEl;

    modalEl = document.createElement("div");
    modalEl.id = "orderDetailModal";
    modalEl.style.display = "none";
    modalEl.style.position = "fixed";
    modalEl.style.inset = "0";
    modalEl.style.background = "rgba(0,0,0,0.55)";
    modalEl.style.zIndex = "9999";

    modalEl.innerHTML = `
      <div style="max-width:1000px;margin:30px auto;padding:0 16px;">
        <div class="card" style="max-height:88vh;overflow:auto">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
            <h2 style="margin:0">Order Details</h2>
            <button class="btn" type="button" id="closeOrderDetailModal">Close</button>
          </div>

          <div id="orderDetailLoading" class="small" style="margin-top:12px">Loading order...</div>
          <div id="orderDetailError" class="small" style="display:none;color:#b00020;margin-top:12px"></div>

          <div id="orderDetailContent" style="display:none;margin-top:14px">
            <div class="grid cols-2" style="gap:18px">
              <div class="card">
                <h3 style="margin-top:0">Order</h3>
                <p><strong>Order Number:</strong> <span id="detailOrderNumber"></span></p>
                <p><strong>Status:</strong> <span id="detailOrderStatus"></span></p>
                <p><strong>Fulfillment:</strong> <span id="detailFulfillmentType"></span></p>
                <p><strong>Customer:</strong> <span id="detailCustomerName"></span></p>
                <p><strong>Email:</strong> <span id="detailCustomerEmail"></span></p>
                <p><strong>Created:</strong> <span id="detailCreatedAt"></span></p>
                <p><strong>Updated:</strong> <span id="detailUpdatedAt"></span></p>
              </div>

              <div class="card">
                <h3 style="margin-top:0">Totals</h3>
                <p><strong>Subtotal:</strong> <span id="detailSubtotal"></span></p>
                <p><strong>Discount:</strong> <span id="detailDiscount"></span></p>
                <p><strong>Shipping:</strong> <span id="detailShipping"></span></p>
                <p><strong>Tax:</strong> <span id="detailTax"></span></p>
                <p style="font-size:1.05rem;font-weight:700"><strong>Total:</strong> <span id="detailTotal"></span></p>
              </div>
            </div>

            <div class="grid cols-2" style="gap:18px;margin-top:18px">
              <div class="card">
                <h3 style="margin-top:0">Shipping Address</h3>
                <div id="detailShippingAddress"></div>
              </div>

              <div class="card">
                <h3 style="margin-top:0">Billing Address</h3>
                <div id="detailBillingAddress"></div>
              </div>
            </div>

            <div class="card" style="margin-top:18px">
              <h3 style="margin-top:0">Items</h3>
              <div style="overflow:auto">
                <table style="width:100%;border-collapse:collapse">
                  <thead>
                    <tr>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Product</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Type</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">SKU</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Qty</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Unit Price</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Line Total</th>
                    </tr>
                  </thead>
                  <tbody id="detailItemsBody"></tbody>
                </table>
              </div>
            </div>

            <div class="card" style="margin-top:18px">
              <h3 style="margin-top:0">Status History</h3>
              <div style="overflow:auto">
                <table style="width:100%;border-collapse:collapse">
                  <thead>
                    <tr>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">When</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">From</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">To</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">By</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Note</th>
                    </tr>
                  </thead>
                  <tbody id="detailHistoryBody"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    modalEl.querySelector("#closeOrderDetailModal").addEventListener("click", () => {
      hideModal();
    });

    modalEl.addEventListener("click", (event) => {
      if (event.target === modalEl) {
        hideModal();
      }
    });

    return modalEl;
  }

  function showModal() {
    ensureModal();
    modalEl.style.display = "block";
  }

  function hideModal() {
    if (!modalEl) return;
    modalEl.style.display = "none";
  }

  function setAddressHtml(order, prefix) {
    const lines = [
      order[`${prefix}_name`],
      order[`${prefix}_company`],
      order[`${prefix}_address1`],
      order[`${prefix}_address2`],
      [order[`${prefix}_city`], order[`${prefix}_province`]].filter(Boolean).join(", "),
      order[`${prefix}_postal_code`],
      order[`${prefix}_country`]
    ]
      .map(v => String(v || "").trim())
      .filter(Boolean);

    if (!lines.length) {
      return `<p class="small">No ${prefix} address saved.</p>`;
    }

    return `<p>${lines.map(line => escapeHtml(line)).join("<br>")}</p>`;
  }

  function renderOrderDetail(data) {
    const order = data.order || {};
    const items = Array.isArray(data.items) ? data.items : [];
    const history = Array.isArray(data.history) ? data.history : [];
    const currency = order.currency || "CAD";

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText("detailOrderNumber", order.order_number || "—");
    setText("detailOrderStatus", titleCase(order.order_status || ""));
    setText("detailFulfillmentType", titleCase(order.fulfillment_type || ""));
    setText("detailCustomerName", order.customer_name || "—");
    setText("detailCustomerEmail", order.customer_email || "—");
    setText("detailCreatedAt", formatDate(order.created_at));
    setText("detailUpdatedAt", formatDate(order.updated_at));

    setText("detailSubtotal", formatMoney(order.subtotal_cents || 0, currency));
    setText("detailDiscount", formatMoney(order.discount_cents || 0, currency));
    setText("detailShipping", formatMoney(order.shipping_cents || 0, currency));
    setText("detailTax", formatMoney(order.tax_cents || 0, currency));
    setText("detailTotal", formatMoney(order.total_cents || 0, currency));

    const shippingAddressEl = document.getElementById("detailShippingAddress");
    if (shippingAddressEl) {
      shippingAddressEl.innerHTML = setAddressHtml(order, "shipping");
    }

    const billingAddressEl = document.getElementById("detailBillingAddress");
    if (billingAddressEl) {
      billingAddressEl.innerHTML = setAddressHtml(order, "billing");
    }

    const itemsBody = document.getElementById("detailItemsBody");
    if (itemsBody) {
      itemsBody.innerHTML = items.length
        ? items.map(item => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(item.product_name || "")}</td>
              <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(item.product_type || "")}</td>
              <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(item.sku || "—")}</td>
              <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(String(item.quantity || 0))}</td>
              <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(formatMoney(item.unit_price_cents || 0, currency))}</td>
              <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(formatMoney(item.line_subtotal_cents || 0, currency))}</td>
            </tr>
          `).join("")
        : `<tr><td colspan="6" style="padding:8px">No items found.</td></tr>`;
    }

    const historyBody = document.getElementById("detailHistoryBody");
    if (historyBody) {
      historyBody.innerHTML = history.length
        ? history.map(row => {
            const changedBy = row.changed_by_display_name || row.changed_by_email || "System";
            return `
              <tr>
                <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(formatDate(row.created_at))}</td>
                <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(titleCase(row.old_status || "—"))}</td>
                <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(titleCase(row.new_status || ""))}</td>
                <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(changedBy)}</td>
                <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(row.note || "")}</td>
              </tr>
            `;
          }).join("")
        : `<tr><td colspan="5" style="padding:8px">No status history found.</td></tr>`;
    }
  }

  async function loadOrderDetail(orderId) {
    const response = await window.DDAuth.apiFetch(`/api/admin/order-detail?order_id=${encodeURIComponent(orderId)}`, {
      method: "GET"
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Failed to load order.");
    }

    return data;
  }

  tableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-view-order-id]");
    if (!button) return;

    const orderId = Number(button.getAttribute("data-view-order-id"));
    if (!orderId) return;

    const modal = ensureModal();
    showModal();

    const loadingEl = modal.querySelector("#orderDetailLoading");
    const errorEl = modal.querySelector("#orderDetailError");
    const contentEl = modal.querySelector("#orderDetailContent");

    if (loadingEl) loadingEl.style.display = "";
    if (errorEl) {
      errorEl.style.display = "none";
      errorEl.textContent = "";
    }
    if (contentEl) contentEl.style.display = "none";

    const originalText = button.textContent;

    try {
      button.disabled = true;
      button.textContent = "Loading...";

      const data = await loadOrderDetail(orderId);
      renderOrderDetail(data);

      if (contentEl) contentEl.style.display = "";
    } catch (error) {
      if (errorEl) {
        errorEl.textContent = error.message || "Failed to load order.";
        errorEl.style.display = "";
      }
    } finally {
      if (loadingEl) loadingEl.style.display = "none";
      button.disabled = false;
      button.textContent = originalText;
    }
  });
});
