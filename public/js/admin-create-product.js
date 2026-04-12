document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("createProductForm");
  const messageEl = document.getElementById("createProductMessage");
  const taxClassSelect = document.getElementById("create_product_tax_class_id");
  if (!form || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  const LOCAL_PENDING_KEY = "dd_admin_product_create_pending_actions_v1";
  let pendingMount = null;
  let currentSharedPendingActions = [];

  function setMessage(message, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = message || "";
    messageEl.style.display = message ? "block" : "none";
    messageEl.style.color = isError ? "#b00020" : "#0a7a2f";
  }

  function clearMessage() {
    setMessage("");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function parseSafeJson(value, fallback = []) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function loadLocalPendingActions() {
    return parseSafeJson(localStorage.getItem(LOCAL_PENDING_KEY) || "[]", []);
  }

  function saveLocalPendingActions(actions) {
    try {
      localStorage.setItem(LOCAL_PENDING_KEY, JSON.stringify(actions));
    } catch {}
  }

  function removeLocalPendingAction(clientActionId) {
    const next = loadLocalPendingActions().filter((row) => String(row.client_action_id || row.id || "") !== String(clientActionId || ""));
    saveLocalPendingActions(next);
  }

  function upsertLocalPendingAction(action) {
    const rows = loadLocalPendingActions();
    const key = String(action.client_action_id || action.id || "");
    const existingIndex = rows.findIndex((row) => String(row.client_action_id || row.id || "") === key);
    if (existingIndex >= 0) rows[existingIndex] = action;
    else rows.unshift(action);
    saveLocalPendingActions(rows.slice(0, 30));
  }

  function ensurePendingMount() {
    if (pendingMount && pendingMount.isConnected) return pendingMount;
    pendingMount = document.getElementById("productCreatePendingActionsMount");
    if (pendingMount) return pendingMount;
    pendingMount = document.createElement("div");
    pendingMount.id = "productCreatePendingActionsMount";
    pendingMount.className = "card";
    pendingMount.style.marginTop = "16px";
    form.parentNode?.insertBefore(pendingMount, form.nextSibling);
    return pendingMount;
  }

  function dollarsToCents(value) {
    const normalized = String(value || "").trim();
    if (!normalized) return 0;
    const amount = Number(normalized);
    if (!Number.isFinite(amount) || amount < 0) return NaN;
    return Math.round(amount * 100);
  }

  function buildClientActionId() {
    return ["product-create", Date.now()].join(":");
  }

  function normalizeSharedAction(row) {
    if (!row) return null;
    return {
      source: "shared",
      admin_pending_action_id: Number(row.admin_pending_action_id || 0),
      client_action_id: String(row.client_action_id || "").trim(),
      queue_status: row.queue_status || "queued",
      label: row.label || row.action_label || "Pending product create",
      last_error: row.last_error || row.warning || "",
      created_at: row.created_at || null,
      payload: row.payload || {},
      endpoint: row.endpoint || row.endpoint_path || "/api/admin/create-product",
      method: row.method || row.http_method || "POST",
    };
  }

  function normalizeLocalAction(row) {
    if (!row) return null;
    return {
      source: "local",
      id: String(row.id || row.client_action_id || "").trim(),
      client_action_id: String(row.client_action_id || row.id || "").trim(),
      queue_status: row.queue_status || "queued",
      label: row.label || "Pending product create",
      last_error: row.last_error || "",
      created_at: row.created_at || null,
      payload: row.payload || {},
      endpoint: row.endpoint || "/api/admin/create-product",
      method: row.method || "POST",
    };
  }

  async function fetchSharedPendingActions() {
    try {
      const response = await window.DDAuth.apiFetch("/api/admin/pending-actions?action_scope=product_create&limit=20", { method: "GET" });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Failed to load queued product creates.");
      return (Array.isArray(data.actions) ? data.actions : []).map(normalizeSharedAction).filter(Boolean);
    } catch {
      return [];
    }
  }

  async function saveSharedPendingAction(action) {
    const response = await window.DDAuth.apiFetch("/api/admin/pending-actions", {
      method: "POST",
      body: JSON.stringify({
        client_action_id: action.client_action_id,
        action_scope: "product_create",
        action_label: action.label,
        endpoint_path: action.endpoint,
        http_method: action.method,
        payload: action.payload,
        queue_status: action.queue_status || "queued",
        last_error: action.last_error || "",
        warning: action.warning || "",
        source_device_label: navigator.userAgent || "browser",
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || "Failed to save queued product create.");
    return normalizeSharedAction(data.action);
  }

  async function updateSharedPendingActionStatus(action, queueStatus, lastError = "", incrementAttempt = false) {
    const response = await window.DDAuth.apiFetch("/api/admin/pending-actions-status", {
      method: "POST",
      body: JSON.stringify({
        admin_pending_action_id: action.admin_pending_action_id || 0,
        client_action_id: action.client_action_id || "",
        queue_status: queueStatus,
        last_error: lastError,
        increment_attempt: incrementAttempt ? 1 : 0,
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || "Failed to update queued product create.");
    return data.action || null;
  }

  function mergePendingActions(sharedRows) {
    const localRows = loadLocalPendingActions().map(normalizeLocalAction).filter(Boolean);
    const sharedClientIds = new Set(sharedRows.map((row) => String(row.client_action_id || "")).filter(Boolean));
    return [...sharedRows, ...localRows.filter((row) => !sharedClientIds.has(String(row.client_action_id || "")))];
  }

  function renderPendingActions() {
    const mount = ensurePendingMount();
    const rows = mergePendingActions(currentSharedPendingActions);
    mount.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div>
          <h3 style="margin:0 0 6px 0">Queued product creates</h3>
          <div class="small">Failed create-product writes now save to the shared replay queue first. Browser-only storage remains the last safety net only if the queue cannot be reached.</div>
        </div>
        <button class="btn" type="button" id="refreshProductCreatePendingButton">Refresh queue</button>
      </div>
      <div style="margin-top:12px">
        ${rows.length ? `<div class="table-wrap"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Action</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Status</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Saved</th><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Replay</th></tr></thead><tbody>${rows.map((row) => `<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>${escapeHtml(row.label || "Pending product create")}</strong>${row.last_error ? `<div class="small">${escapeHtml(row.last_error)}</div>` : ""}</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(row.queue_status || "queued")}<div class="small">${row.source === "shared" ? "Shared queue" : "Browser only"}</div></td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(row.created_at || "—")}</td><td style="padding:8px;border-bottom:1px solid #eee"><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" data-replay-product-create="${escapeHtml(String(row.client_action_id || row.id || ""))}">Retry</button><button class="btn" type="button" data-dismiss-product-create="${escapeHtml(String(row.client_action_id || row.id || ""))}">Dismiss</button></div></td></tr>`).join("")}</tbody></table></div>` : `<div class="small">No queued product creates are waiting right now.</div>`}
      </div>`;
    mount.querySelector("#refreshProductCreatePendingButton")?.addEventListener("click", loadPendingActions);
  }

  async function loadPendingActions() {
    currentSharedPendingActions = await fetchSharedPendingActions();
    renderPendingActions();
  }

  async function liveCreateProduct(payload) {
    const response = await window.DDAuth.apiFetch("/api/admin/create-product", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || "Failed to create product.");
    return data;
  }

  async function queueCreateProduct(payload, errorMessage) {
    const action = {
      client_action_id: buildClientActionId(),
      queue_status: "queued",
      label: `Create product: ${payload.name || payload.slug || "draft"}`,
      payload,
      endpoint: "/api/admin/create-product",
      method: "POST",
      last_error: errorMessage || "Failed to create product.",
      created_at: new Date().toISOString(),
    };
    try {
      const shared = await saveSharedPendingAction(action);
      currentSharedPendingActions = await fetchSharedPendingActions();
      renderPendingActions();
      return { queued: true, shared: true, action: shared };
    } catch {
      upsertLocalPendingAction({ ...action, id: action.client_action_id, source: "local" });
      renderPendingActions();
      return { queued: true, shared: false, action };
    }
  }

  async function replayAction(row) {
    if (!row?.payload) return;
    try {
      if (row.source === "shared") {
        await updateSharedPendingActionStatus(row, "retrying", row.last_error || "", true);
      } else {
        upsertLocalPendingAction({ ...row, queue_status: "retrying" });
      }
      renderPendingActions();
      const result = await liveCreateProduct(row.payload);
      if (row.source === "shared") {
        await updateSharedPendingActionStatus(row, "completed", "", false);
        currentSharedPendingActions = await fetchSharedPendingActions();
      } else {
        removeLocalPendingAction(row.client_action_id || row.id);
      }
      renderPendingActions();
      setMessage(`Queued create replay succeeded. ${result?.product?.name || "Product"} was created.`, false);
      form.reset();
      loadTaxClasses();
      document.dispatchEvent(new CustomEvent("dd:product-created", { detail: result }));
    } catch (error) {
      if (row.source === "shared") {
        await updateSharedPendingActionStatus(row, "failed", error.message || "Replay failed.", true).catch(() => null);
        currentSharedPendingActions = await fetchSharedPendingActions();
      } else {
        upsertLocalPendingAction({ ...row, queue_status: "failed", last_error: error.message || "Replay failed." });
      }
      renderPendingActions();
      setMessage(error.message || "Queued create replay failed.", true);
    }
  }

  async function dismissAction(row) {
    if (!row) return;
    try {
      if (row.source === "shared") {
        await updateSharedPendingActionStatus(row, "dismissed", row.last_error || "", false);
        currentSharedPendingActions = await fetchSharedPendingActions();
      } else {
        removeLocalPendingAction(row.client_action_id || row.id);
      }
      renderPendingActions();
    } catch (error) {
      setMessage(error.message || "Failed to dismiss queued create action.", true);
    }
  }

  ensurePendingMount().addEventListener("click", async (event) => {
    const replayId = event.target?.getAttribute?.("data-replay-product-create");
    if (replayId) {
      const row = mergePendingActions(currentSharedPendingActions).find((entry) => String(entry.client_action_id || entry.id || "") === String(replayId));
      await replayAction(row);
      return;
    }
    const dismissId = event.target?.getAttribute?.("data-dismiss-product-create");
    if (dismissId) {
      const row = mergePendingActions(currentSharedPendingActions).find((entry) => String(entry.client_action_id || entry.id || "") === String(dismissId));
      await dismissAction(row);
    }
  });

  async function loadTaxClasses() {
    if (!taxClassSelect) return;

    const currentValue = String(taxClassSelect.value || "").trim();
    taxClassSelect.innerHTML = `<option value="">Loading tax classes...</option>`;

    try {
      const response = await window.DDAuth.apiFetch("/api/admin/tax-classes", { method: "GET" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Failed to load tax classes.");
      const taxClasses = Array.isArray(data.tax_classes) ? data.tax_classes : [];
      taxClassSelect.innerHTML = `
        <option value="">Select tax class</option>
        ${taxClasses.map((taxClass) => `
          <option value="${taxClass.tax_class_id}">
            ${taxClass.name} (${Math.round(Number(taxClass.tax_rate || 0) * 100)}%)
          </option>
        `).join("")}
      `;
      if (currentValue) taxClassSelect.value = currentValue;
    } catch (error) {
      taxClassSelect.innerHTML = `<option value="">Unable to load tax classes</option>`;
      setMessage(error.message || "Failed to load tax classes.", true);
    }
  }

  function buildPayload(formData) {
    const price_cents = dollarsToCents(formData.get("price"));
    const compareRaw = String(formData.get("compare_at_price") || "").trim();
    const compare_at_price_cents = compareRaw ? dollarsToCents(compareRaw) : null;
    if (Number.isNaN(price_cents)) throw new Error("Price must be a valid amount.");
    if (compare_at_price_cents !== null && Number.isNaN(compare_at_price_cents)) {
      throw new Error("Compare-at price must be a valid amount.");
    }

    const imageUrls = [
      String(formData.get("image_url_1") || "").trim(),
      String(formData.get("image_url_2") || "").trim(),
      String(formData.get("image_url_3") || "").trim(),
      String(formData.get("image_url_4") || "").trim(),
      String(formData.get("image_url_5") || "").trim(),
    ].filter(Boolean);

    const payload = {
      name: String(formData.get("name") || "").trim(),
      slug: String(formData.get("slug") || "").trim(),
      sku: String(formData.get("sku") || "").trim(),
      product_category: String(formData.get("product_category") || "").trim(),
      color_name: String(formData.get("color_name") || "").trim(),
      shipping_code: String(formData.get("shipping_code") || "").trim(),
      review_status: String(formData.get("review_status") || "pending_review").trim(),
      short_description: String(formData.get("short_description") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      product_type: String(formData.get("product_type") || "physical").trim(),
      status: String(formData.get("status") || "draft").trim(),
      price_cents,
      compare_at_price_cents,
      currency: String(formData.get("currency") || "CAD").trim().toUpperCase(),
      taxable: formData.get("taxable") === "0" ? 0 : 1,
      tax_class_id: String(formData.get("tax_class_id") || "").trim() || null,
      requires_shipping: formData.get("requires_shipping") === "1" ? 1 : 0,
      weight_grams: String(formData.get("weight_grams") || "").trim() || null,
      inventory_tracking: formData.get("inventory_tracking") === "1" ? 1 : 0,
      inventory_quantity: String(formData.get("inventory_quantity") || "").trim() || 0,
      digital_file_url: String(formData.get("digital_file_url") || "").trim(),
      featured_image_url: String(formData.get("featured_image_url") || "").trim(),
      sort_order: String(formData.get("sort_order") || "").trim() || 0,
      meta_title: String(formData.get("meta_title") || "").trim(),
      meta_description: String(formData.get("meta_description") || "").trim(),
      keywords: String(formData.get("keywords") || "").trim(),
      h1_override: String(formData.get("h1_override") || "").trim(),
      canonical_url: String(formData.get("canonical_url") || "").trim(),
      og_title: String(formData.get("og_title") || "").trim(),
      og_description: String(formData.get("og_description") || "").trim(),
      og_image_url: String(formData.get("og_image_url") || "").trim(),
      image_urls: imageUrls,
    };

    if (!payload.name) throw new Error("Product name is required.");
    return payload;
  }

  loadTaxClasses();
  loadPendingActions();

  form.addEventListener("submit", async (event) => {
    if (form.dataset.mode === "edit") return;
    event.preventDefault();
    clearMessage();
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton && (submitButton.disabled = true);

    let payload = null;
    try {
      payload = buildPayload(new FormData(form));
      const data = await liveCreateProduct(payload);
      setMessage(`Product created successfully. ${data?.product?.name || payload.name} is now in the catalog.`, false);
      form.reset();
      loadTaxClasses();
      document.dispatchEvent(new CustomEvent("dd:product-created", { detail: data }));
    } catch (error) {
      if (payload) {
        const queued = await queueCreateProduct(payload, error.message || "Failed to create product.");
        setMessage(
          queued.shared
            ? `Live create failed, but the action was saved to the shared queue for replay. ${error.message || ""}`.trim()
            : `Live create failed, and the action was saved only in this browser as a fallback. ${error.message || ""}`.trim(),
          true
        );
      } else {
        setMessage(error.message || "Failed to create product.", true);
      }
    } finally {
      submitButton && (submitButton.disabled = false);
    }
  });
});
