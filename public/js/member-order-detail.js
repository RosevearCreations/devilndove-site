// File: /public/js/member-order-detail.js

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("memberOrdersTableBody");

  if (!tableBody || !window.DDAuth) return;

  let modalEl = null;
  let currentOrderId = null;

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

  function showModal() {
    ensureModal();
    modalEl.style.display = "block";
  }

  function hideModal() {
    if (!modalEl) return;
    modalEl.style.display = "none";
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
    }
  }

  function ensureModal() {
    if (modalEl) return modalEl;

    modalEl = document.createElement("div");
    modalEl.id = "memberOrderDetailModal";
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
            <button class="btn" type="button" id="closeMemberOrderDetailModal">Close</button>
          </div>

          <div id="memberOrderDetailLoading" class="small" style="margin-top:12px">
            Loading order...
          </div>

          <div id="memberOrderDetailError" class="small" style="display:none;color:#b00020;margin-top:12px"></div>

          <div id="memberOrderDetailContent" style="display:none;margin-top:14px">
            <div class="grid cols-2" style="gap:18px">
              <div class="card">
                <h3 style="margin-top:0">Order</h3>
                <p><strong>Order Number:</strong> <span id="memberDetailOrderNumber"></span></p>
                <p><strong>Status:</strong> <span id="memberDetailOrderStatus"></span></p>
                <p><strong>Payment:</strong> <span id="memberDetailPaymentStatus"></span></p>
                <p><strong>Payment Method:</strong> <span id="memberDetailPaymentMethod"></span></p>
                <p><strong>Fulfillment:</strong> <span id="memberDetailFulfillmentType"></span></p>
                <p><strong>Created:</strong> <span id="memberDetailCreatedAt"></span></p>
                <p><strong>Updated:</strong> <span id="memberDetailUpdatedAt"></span></p>
              </div>

              <div class="card">
                <h3 style="margin-top:0">Totals</h3>
                <p><strong>Subtotal:</strong> <span id="memberDetailSubtotal"></span></p>
                <p><strong>Discount:</strong> <span id="memberDetailDiscount"></span></p>
                <p><strong>Shipping:</strong> <span id="memberDetailShipping"></span></p>
                <p><strong>Tax:</strong> <span id="memberDetailTax"></span></p>
                <p style="font-size:1.05rem;font-weight:700"><strong>Total:</strong> <span id="memberDetailTotal"></span></p>
                <p><strong>Outstanding:</strong> <span id="memberDetailOutstanding"></span></p>
              </div>
            </div>

            <div class="grid cols-2" style="gap:18px;margin-top:18px">
              <div class="card">
                <h3 style="margin-top:0">Payment Summary</h3>
                <p><strong>Derived Status:</strong> <span id="memberDetailDerivedPaymentStatus"></span></p>
                <p><strong>Payments:</strong> <span id="memberDetailPaymentCount"></span></p>
                <p><strong>Paid Total:</strong> <span id="memberDetailPaidTotal"></span></p>
                <p><strong>Pending Total:</strong> <span id="memberDetailPendingTotal"></span></p>
                <p><strong>Refunded Total:</strong> <span id="memberDetailRefundedTotal"></span></p>
              </div>

              <div class="card">
                <h3 style="margin-top:0">Shipping</h3>
                <div id="memberDetailShippingAddress" class="small"></div>
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
                  <tbody id="memberDetailItemsBody"></tbody>
                </table>
              </div>
            </div>

            <div class="card" style="margin-top:18px">
              <h3 style="margin-top:0">Payments</h3>
              <div style="overflow:auto">
                <table style="width:100%;border-collapse:collapse">
                  <thead>
                    <tr>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Provider</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Status</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Method</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Amount</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Reference</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Paid At</th>
                    </tr>
                  </thead>
                  <tbody id="memberDetailPaymentsBody"></tbody>
                </table>
              </div>
            </div>

            <div class="card" style="margin-top:18px">
              <h3 style="margin-top:0">Notes</h3>
              <div id="memberDetailNotes" class="small">No notes available.</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    modalEl.querySelector("#closeMemberOrderDetailModal").addEventListener("click", hideModal);

    modalEl.addEventListener("click", (event) => {
      if (event.target === modalEl) {
        hideModal();
      }
    });

    return modalEl;
  }

  function renderShippingAddress(order) {
    const el = document.getElementById("memberDetailShippingAddress");
    if (!el) return;

    const lines = [
      order.shipping_name || order.customer_name,
      order.shipping_address1,
      order.shipping_address2,
      [order.shipping_city, order.shipping_province].filter(Boolean).join(", "),
      order.shipping_postal_code,
      order.shipping_country
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    el.innerHTML = lines.length
      ? `<p>${lines.map((line) => escapeHtml(line)).join("<br>")}</p>`
      : `<p>No shipping address saved for this order.</p>`;
  }

  function renderItems(items, currency) {
    const body = document.getElementById("memberDetailItemsBody");
    if (!body) return;

    const safeItems = Array.isArray(items) ? items : [];

    body.innerHTML = safeItems.length
      ? safeItems.map((item) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(item.product_name || "—")}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(item.product_type || "—")}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(item.sku || "—")}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(String(item.quantity || 0))}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(formatMoney(item.unit_price_cents || 0, item.currency || currency))}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(formatMoney(item.line_subtotal_cents || 0, item.currency || currency))}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="6" style="padding:8px">No items found.</td></tr>`;
  }

  function renderPayments(payments, currency) {
    const body = document.getElementById("memberDetailPaymentsBody");
    if (!body) return;

    const safePayments = Array.isArray(payments) ? payments : [];

    body.innerHTML = safePayments.length
      ? safePayments.map((payment) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(titleCase(payment.provider || "—"))}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(titleCase(payment.payment_status || "—"))}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(payment.payment_method_label || "—")}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(formatMoney(payment.amount_cents || 0, payment.currency || currency))}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(payment.transaction_reference || "—")}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(formatDate(payment.paid_at))}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="6" style="padding:8px">No payments found.</td></tr>`;
  }

  function renderOrderDetail(data) {
    const order = data.order || {};
    const items = Array.isArray(data.items) ? data.items : [];
    const payments = Array.isArray(data.payments) ? data.payments : [];
    const paymentSummary = data.payment_summary || {};
    const currency = order.currency || "CAD";

    setText("memberDetailOrderNumber", order.order_number || "—");
    setText("memberDetailOrderStatus", titleCase(order.order_status || "pending"));
    setText("memberDetailPaymentStatus", titleCase(order.payment_status || "pending"));
    setText("memberDetailPaymentMethod", titleCase(order.payment_method || "—"));
    setText("memberDetailFulfillmentType", titleCase(order.fulfillment_type || "shipping"));
    setText("memberDetailCreatedAt", formatDate(order.created_at));
    setText("memberDetailUpdatedAt", formatDate(order.updated_at));

    setText("memberDetailSubtotal", formatMoney(order.subtotal_cents || 0, currency));
    setText("memberDetailDiscount", formatMoney(order.discount_cents || 0, currency));
    setText("memberDetailShipping", formatMoney(order.shipping_cents || 0, currency));
    setText("memberDetailTax", formatMoney(order.tax_cents || 0, currency));
    setText("memberDetailTotal", formatMoney(order.total_cents || 0, currency));
    setText("memberDetailOutstanding", formatMoney(paymentSummary.outstanding_cents || 0, currency));

    setText("memberDetailDerivedPaymentStatus", titleCase(paymentSummary.derived_payment_status || order.payment_status || "pending"));
    setText("memberDetailPaymentCount", String(paymentSummary.payment_count || 0));
    setText("memberDetailPaidTotal", formatMoney(paymentSummary.paid_total_cents || 0, currency));
    setText("memberDetailPendingTotal", formatMoney(paymentSummary.pending_total_cents || 0, currency));
    setText("memberDetailRefundedTotal", formatMoney(paymentSummary.refunded_total_cents || 0, currency));

    const notesEl = document.getElementById("memberDetailNotes");
    if (notesEl) {
      notesEl.innerHTML = order.notes
        ? escapeHtml(order.notes).replace(/\n/g, "<br>")
        : "No notes available.";
    }

    renderShippingAddress(order);
    renderItems(items, currency);
    renderPayments(payments, currency);
  }

  async function loadOrderDetail(orderId) {
    const response = await window.DDAuth.apiFetch(`/api/member/order-detail?order_id=${encodeURIComponent(orderId)}`, {
      method: "GET"
    });

    const data = await response.json();

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "Failed to load order.");
    }

    return data;
  }

  tableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-member-view-order-id]");
    if (!button) return;

    const orderId = Number(button.getAttribute("data-member-view-order-id"));
    if (!orderId) return;

    currentOrderId = orderId;
    showModal();

    const loadingEl = document.getElementById("memberOrderDetailLoading");
    const errorEl = document.getElementById("memberOrderDetailError");
    const contentEl = document.getElementById("memberOrderDetailContent");

    if (loadingEl) loadingEl.style.display = "";
    if (errorEl) {
      errorEl.style.display = "none";
      errorEl.textContent = "";
    }
    if (contentEl) {
      contentEl.style.display = "none";
    }

    const originalText = button.textContent;

    try {
      button.disabled = true;
      button.textContent = "Loading...";

      const data = await loadOrderDetail(currentOrderId);
      renderOrderDetail(data);

      if (contentEl) {
        contentEl.style.display = "";
      }
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
