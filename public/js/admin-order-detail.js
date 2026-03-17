// File: /public/js/admin-order-detail.js

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("ordersTableBody");

  if (!tableBody || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

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
    const d = new Date(String(value).replace(" ", "T") + "Z");
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  }

  function titleCase(value) {
    return String(value || "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, ch => ch.toUpperCase());
  }

  function dollarsToCents(value) {
    const normalized = String(value || "").trim();
    if (!normalized) return 0;
    const amount = Number(normalized);
    if (!Number.isFinite(amount) || amount < 0) return NaN;
    return Math.round(amount * 100);
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

            <div class="card" style="margin-top:18px">
              <h3 style="margin-top:0">Update Status</h3>

              <div class="grid" style="gap:12px">
                <div>
                  <label class="small" for="detailNewOrderStatus">New Status</label>
                  <select id="detailNewOrderStatus">
                    <option value="draft">draft</option>
                    <option value="pending">pending</option>
                    <option value="paid">paid</option>
                    <option value="fulfilled">fulfilled</option>
                    <option value="cancelled">cancelled</option>
                    <option value="refunded">refunded</option>
                  </select>
                </div>

                <div>
                  <label class="small" for="detailOrderStatusNote">Note (optional)</label>
                  <input id="detailOrderStatusNote" type="text" />
                </div>

                <div>
                  <button class="btn" type="button" id="detailUpdateOrderStatusButton">
                    Update Status
                  </button>
                </div>

                <div id="detailUpdateOrderStatusMessage" class="small" style="display:none"></div>
              </div>
            </div>

            <div class="card" style="margin-top:18px">
              <h3 style="margin-top:0">Record Payment</h3>

              <div class="grid" style="gap:12px">
                <div>
                  <label class="small" for="detailPaymentProvider">Provider</label>
                  <select id="detailPaymentProvider">
                    <option value="manual" selected>manual</option>
                    <option value="paypal">paypal</option>
                    <option value="stripe">stripe</option>
                    <option value="square">square</option>
                    <option value="other">other</option>
                  </select>
                </div>

                <div>
                  <label class="small" for="detailPaymentStatus">Payment Status</label>
                  <select id="detailPaymentStatus">
                    <option value="paid" selected>paid</option>
                    <option value="pending">pending</option>
                    <option value="authorized">authorized</option>
                    <option value="failed">failed</option>
                    <option value="cancelled">cancelled</option>
                    <option value="refunded">refunded</option>
                    <option value="partially_refunded">partially_refunded</option>
                  </select>
                </div>

                <div>
                  <label class="small" for="detailPaymentAmount">Amount</label>
                  <input id="detailPaymentAmount" type="text" placeholder="0.00" />
                </div>

                <div>
                  <label class="small" for="detailPaymentCurrency">Currency</label>
                  <input id="detailPaymentCurrency" type="text" value="CAD" />
                </div>

                <div>
                  <label class="small" for="detailPaymentMethodLabel">Method Label</label>
                  <input id="detailPaymentMethodLabel" type="text" placeholder="Cash, E-transfer, PayPal, Visa..." />
                </div>

                <div>
                  <label class="small" for="detailPaymentReference">Transaction Reference</label>
                  <input id="detailPaymentReference" type="text" />
                </div>

                <div>
                  <label class="small" for="detailProviderPaymentId">Provider Payment ID</label>
                  <input id="detailProviderPaymentId" type="text" />
                </div>

                <div>
                  <label class="small" for="detailProviderOrderId">Provider Order ID</label>
                  <input id="detailProviderOrderId" type="text" />
                </div>

                <div style="grid-column:1 / -1">
                  <label class="small" for="detailPaymentNotes">Notes</label>
                  <input id="detailPaymentNotes" type="text" />
                </div>

                <div>
                  <button class="btn" type="button" id="detailRecordPaymentButton">
                    Record Payment
                  </button>
                </div>

                <div id="detailRecordPaymentMessage" class="small" style="display:none"></div>
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
              <h3 style="margin-top:0">Payments</h3>
              <div style="overflow:auto">
                <table style="width:100%;border-collapse:collapse">
                  <thead>
                    <tr>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Provider</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Status</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Amount</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Reference</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Paid At</th>
                      <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Created</th>
                    </tr>
                  </thead>
                  <tbody id="detailPaymentsBody"></tbody>
                </table>
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

    modalEl.querySelector("#detailUpdateOrderStatusButton").addEventListener("click", async () => {
      await updateOrderStatus();
    });

    modalEl.querySelector("#detailRecordPaymentButton").addEventListener("click", async () => {
      await recordPayment();
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

  function setUpdateMessage(message, isError = false) {
    const el = document.getElementById("detailUpdateOrderStatusMessage");
    if (!el) return;
    el.textContent = message;
    el.style.display = "block";
    el.style.color = isError ? "#b00020" : "#0a7a2f";
  }

  function clearUpdateMessage() {
    const el = document.getElementById("detailUpdateOrderStatusMessage");
    if (!el) return;
    el.textContent = "";
    el.style.display = "none";
  }

  function setPaymentMessage(message, isError = false) {
    const el = document.getElementById("detailRecordPaymentMessage");
    if (!el) return;
    el.textContent = message;
    el.style.display = "block";
    el.style.color = isError ? "#b00020" : "#0a7a2f";
  }

  function clearPaymentMessage() {
    const el = document.getElementById("detailRecordPaymentMessage");
    if (!el) return;
    el.textContent = "";
    el.style.display = "none";
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
    const payments = Array.isArray(data.payments) ? data.payments : [];
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

    const statusSelect = document.getElementById("detailNewOrderStatus");
    if (statusSelect) {
      statusSelect.value = String(order.order_status || "pending").toLowerCase();
    }

    const statusNote = document.getElementById("detailOrderStatusNote");
    if (statusNote) {
      statusNote.value = "";
    }

    const paymentAmount = document.getElementById("detailPaymentAmount");
    if (paymentAmount) {
      paymentAmount.value = ((Number(order.total_cents || 0)) / 100).toFixed(2);
    }

    const paymentCurrency = document.getElementById("detailPaymentCurrency");
    if (paymentCurrency) {
      paymentCurrency.value = currency;
    }

    const paymentMethodLabel = document.getElementById("detailPaymentMethodLabel");
    if (paymentMethodLabel) paymentMethodLabel.value = "";

    const paymentReference = document.getElementById("detailPaymentReference");
    if (paymentReference) paymentReference.value = "";

    const providerPaymentId = document.getElementById("detailProviderPaymentId");
    if (providerPaymentId) providerPaymentId.value = "";

    const providerOrderId = document.getElementById("detailProviderOrderId");
    if (providerOrderId) providerOrderId.value = "";

    const paymentNotes = document.getElementById("detailPaymentNotes");
    if (paymentNotes) paymentNotes.value = "";

    const shippingAddressEl = document.getElementById("detailShippingAddress");
    if (shippingAddressEl) {
      shippingAddressEl.innerHTML = setAddressHtml(order, "shipping");
    }

    const billingAddressEl = document.getElementById("detailBillingAddress");
    if (billingAddressEl) {
      billingAddressEl.innerHTML = setAddressHtml(order, "billing");
    }

    const paymentsBody = document.getElementById("detailPaymentsBody");
    if (paymentsBody) {
      paymentsBody.innerHTML = payments.length
        ? payments.map(payment => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(payment.provider || "")}</td>
              <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(titleCase(payment.payment_status || ""))}</td>
              <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(formatMoney(payment.amount_cents || 0, payment.currency || currency))}</td>
              <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(payment.transaction_reference || payment.provider_payment_id || payment.provider_order_id || "—")}</td>
              <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(formatDate(payment.paid_at))}</td>
              <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(formatDate(payment.created_at))}</td>
            </tr>
          `).join("")
        : `<tr><td colspan="6" style="padding:8px">No payments found.</td></tr>`;
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

  async function sendOrderStatusUpdate(orderId, newStatus, note) {
    const response = await window.DDAuth.apiFetch("/api/admin/update-order-status", {
      method: "POST",
      body: JSON.stringify({
        order_id: orderId,
        new_status: newStatus,
        note
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Failed to update order status.");
    }

    return data;
  }

  async function sendRecordPayment(payload) {
    const response = await window.DDAuth.apiFetch("/api/admin/record-payment", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Failed to record payment.");
    }

    return data;
  }

  async function refreshCurrentOrderDetail() {
    if (!currentOrderId) return;

    const modal = ensureModal();
    const loadingEl = modal.querySelector("#orderDetailLoading");
    const errorEl = modal.querySelector("#orderDetailError");
    const contentEl = modal.querySelector("#orderDetailContent");

    if (loadingEl) loadingEl.style.display = "";
    if (errorEl) {
      errorEl.style.display = "none";
      errorEl.textContent = "";
    }

    try {
      const data = await loadOrderDetail(currentOrderId);
      renderOrderDetail(data);
      if (contentEl) contentEl.style.display = "";
    } catch (error) {
      if (errorEl) {
        errorEl.textContent = error.message || "Failed to reload order.";
        errorEl.style.display = "";
      }
    } finally {
      if (loadingEl) loadingEl.style.display = "none";
    }
  }

  async function updateOrderStatus() {
    if (!currentOrderId) {
      setUpdateMessage("No order selected.", true);
      return;
    }

    const statusSelect = document.getElementById("detailNewOrderStatus");
    const noteInput = document.getElementById("detailOrderStatusNote");
    const button = document.getElementById("detailUpdateOrderStatusButton");

    const newStatus = String(statusSelect?.value || "").trim().toLowerCase();
    const note = String(noteInput?.value || "").trim();
    const originalText = button ? button.textContent : "";

    try {
      clearUpdateMessage();

      if (button) {
        button.disabled = true;
        button.textContent = "Updating...";
      }

      await sendOrderStatusUpdate(currentOrderId, newStatus, note);
      setUpdateMessage("Order status updated successfully.");

      document.dispatchEvent(new CustomEvent("dd:order-updated", {
        detail: { order_id: currentOrderId }
      }));

      await refreshCurrentOrderDetail();
    } catch (error) {
      setUpdateMessage(error.message || "Failed to update order status.", true);
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = originalText || "Update Status";
      }
    }
  }

  async function recordPayment() {
    if (!currentOrderId) {
      setPaymentMessage("No order selected.", true);
      return;
    }

    const provider = document.getElementById("detailPaymentProvider");
    const paymentStatus = document.getElementById("detailPaymentStatus");
    const amount = document.getElementById("detailPaymentAmount");
    const currency = document.getElementById("detailPaymentCurrency");
    const methodLabel = document.getElementById("detailPaymentMethodLabel");
    const reference = document.getElementById("detailPaymentReference");
    const providerPaymentId = document.getElementById("detailProviderPaymentId");
    const providerOrderId = document.getElementById("detailProviderOrderId");
    const notes = document.getElementById("detailPaymentNotes");
    const button = document.getElementById("detailRecordPaymentButton");

    const amount_cents = dollarsToCents(amount?.value || "");

    if (Number.isNaN(amount_cents)) {
      setPaymentMessage("Amount must be a valid number.", true);
      return;
    }

    const payload = {
      order_id: currentOrderId,
      provider: String(provider?.value || "manual").trim().toLowerCase(),
      payment_status: String(paymentStatus?.value || "paid").trim().toLowerCase(),
      amount_cents,
      currency: String(currency?.value || "CAD").trim().toUpperCase(),
      payment_method_label: String(methodLabel?.value || "").trim(),
      transaction_reference: String(reference?.value || "").trim(),
      provider_payment_id: String(providerPaymentId?.value || "").trim(),
      provider_order_id: String(providerOrderId?.value || "").trim(),
      notes: String(notes?.value || "").trim()
    };

    const originalText = button ? button.textContent : "";

    try {
      clearPaymentMessage();

      if (button) {
        button.disabled = true;
        button.textContent = "Recording...";
      }

      await sendRecordPayment(payload);
      setPaymentMessage("Payment recorded successfully.");

      document.dispatchEvent(new CustomEvent("dd:order-updated", {
        detail: { order_id: currentOrderId }
      }));

      await refreshCurrentOrderDetail();
    } catch (error) {
      setPaymentMessage(error.message || "Failed to record payment.", true);
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = originalText || "Record Payment";
      }
    }
  }

  tableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-view-order-id]");
    if (!button) return;

    const orderId = Number(button.getAttribute("data-view-order-id"));
    if (!orderId) return;

    currentOrderId = orderId;

    const modal = ensureModal();
    showModal();
    clearUpdateMessage();
    clearPaymentMessage();

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
