// File: /public/js/admin-products.js

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("productsTableBody");
  const emptyEl = document.getElementById("productsEmpty");
  const errorEl = document.getElementById("productsError");
  const loadingEl = document.getElementById("productsLoading");
  const refreshButtons = document.querySelectorAll("[data-refresh-products]");
  const productsAdminMount = document.getElementById("productsAdminMount");
  const refreshable = tableBody || productsAdminMount;
  if (!refreshable) return;

  const SNAPSHOT_KEY = "dd_admin_products_snapshot_v2";
  const LOCAL_PENDING_KEY = "dd_admin_product_review_pending_actions_v1";
  let currentSharedPendingActions = [];
  let latestProductRows = [];
  let latestReadinessByProductId = new Map();

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

  function yesNo(value) {
    return Number(value) === 1 ? "Yes" : "No";
  }


  function normalizeReadinessLabel(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  function firstBlockerTarget(productId, readiness) {
    const blockers = Array.isArray(readiness?.blockers) ? readiness.blockers : [];
    const first = blockers[0] || {};
    const label = normalizeReadinessLabel(first.label || first.code || '');
    const imageLabels = ['featured_image','image_count','alt_text','hero_front_role','detail_image_role','scale_context_role','image_roles','public_use_clearance','lead_image_shape','lead_image_size','lead_image_score','gallery_score'];
    if (imageLabels.some((token) => label.includes(token) || label.includes(token.replace(/_/g, '')))) {
      return `/admin/catalog-media/?product_id=${encodeURIComponent(productId)}#product-media-workflow`;
    }
    if (label.includes('seo')) return `/admin/catalog/?product_id=${encodeURIComponent(productId)}#product-seo-fields`;
    if (label.includes('price')) return `/admin/catalog/?product_id=${encodeURIComponent(productId)}#product-pricing-fields`;
    if (label.includes('description')) return `/admin/catalog/?product_id=${encodeURIComponent(productId)}#product-description-fields`;
    return `/admin/readiness/?product_id=${encodeURIComponent(productId)}`;
  }

  function readinessBadgeMarkup(product) {
    const productId = Number(product?.product_id || 0);
    const readiness = latestReadinessByProductId.get(productId)?.readiness || null;
    if (!readiness) return '<div class="small product-readiness-inline is-unknown">Readiness preview unavailable</div>';
    const blockers = Array.isArray(readiness.blockers) ? readiness.blockers : [];
    const first = blockers[0];
    const score = Number(readiness.score || 0);
    const tone = readiness.ready ? 'is-good' : score >= 70 ? 'is-warning' : 'is-bad';
    return `<div class="product-readiness-inline ${tone}"><strong>${readiness.ready ? 'Ready' : 'Blocked'} ${escapeHtml(String(score))}%</strong>${first ? `<span>${escapeHtml(first.label || 'First blocker')}: ${escapeHtml(first.help || '')}</span>` : '<span>No blockers in preview.</span>'}<button class="btn small" type="button" data-open-first-blocker="${productId}">Open first blocker</button></div>`;
  }

  async function refreshReadinessPreview() {
    if (!window.DDAuth?.isLoggedIn()) return;
    try {
      const response = await window.DDAuth.apiFetch('/api/admin/product-readiness?limit=500&show_ready=1');
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Readiness preview unavailable.');
      latestReadinessByProductId = new Map((Array.isArray(data.products) ? data.products : []).map((product) => [Number(product.product_id || 0), product]));
    } catch {
      latestReadinessByProductId = new Map();
    }
  }


  function formatTrendDelta(current, previous) {
    const currentValue = Number(current);
    const previousValue = Number(previous);
    if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue)) return '';
    const delta = currentValue - previousValue;
    if (delta === 0) return 'flat';
    return `${delta > 0 ? '+' : ''}${delta}`;
  }

  function parseSafeJson(value, fallback) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function saveSnapshot(products) {
    try {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
        cached_at: new Date().toISOString(),
        products: Array.isArray(products) ? products : []
      }));
    } catch {}
  }

  function loadSnapshot() {
    return parseSafeJson(localStorage.getItem(SNAPSHOT_KEY) || "null", null);
  }

  function loadLocalPendingActions() {
    const rows = parseSafeJson(localStorage.getItem(LOCAL_PENDING_KEY) || "[]", []);
    return Array.isArray(rows) ? rows : [];
  }

  function saveLocalPendingActions(rows) {
    try {
      localStorage.setItem(LOCAL_PENDING_KEY, JSON.stringify(Array.isArray(rows) ? rows : []));
    } catch {}
  }

  function upsertLocalPendingAction(action) {
    const rows = loadLocalPendingActions();
    const key = String(action?.id || action?.client_action_id || "").trim();
    const next = rows.filter((row) => String(row?.id || row?.client_action_id || "") !== key);
    next.unshift(action);
    saveLocalPendingActions(next.slice(0, 30));
  }

  function removeLocalPendingAction(actionId) {
    const key = String(actionId || "").trim();
    if (!key) return;
    const rows = loadLocalPendingActions().filter((row) => String(row?.id || row?.client_action_id || "") !== key);
    saveLocalPendingActions(rows);
  }

  function buildClientActionId(productId, action) {
    return ["product-review", Number(productId || 0), String(action || "").trim(), Date.now()].join(":");
  }

  function setStatus(message, tone = "error") {
    if (!errorEl) return;
    errorEl.textContent = message || "";
    errorEl.className = `status-note ${tone}`;
    if (message) show(errorEl);
    else hide(errorEl);
  }

  function renderProductPicker(products) {
    const select = document.getElementById("existingProductSelect");
    if (!select) return;
    const rows = Array.isArray(products) ? products : [];
    select.innerHTML = `<option value="">Choose an existing product...</option>` + rows.map((product) => {
      const productId = Number(product.product_id || 0);
      const name = escapeHtml(product.name || `Product #${productId}`);
      const slug = escapeHtml(product.slug || '');
      const sku = escapeHtml(product.sku || '');
      const colour = escapeHtml(product.color_names_text || product.color_name || '');
      const suffix = [slug, sku, colour].filter(Boolean).join(' • ');
      return `<option value="${productId}">${name}${suffix ? ` — ${suffix}` : ''}</option>`;
    }).join('');
  }


  function productDetailUrl(product) {
    const slug = String(product?.slug || '').trim();
    const path = slug ? `/shop/product/?slug=${encodeURIComponent(slug)}` : '/shop/';
    try { return new URL(path, window.location.origin).toString(); } catch { return path; }
  }

  function productSocialSummary(product) {
    const parts = [];
    if (product?.short_description) parts.push(product.short_description);
    if (product?.product_type) parts.push(`Type: ${product.product_type}.`);
    if (product?.merchandise_origin) parts.push(`Origin: ${String(product.merchandise_origin).replace(/[_-]+/g, ' ')}.`);
    if (product?.condition_summary) parts.push(`Condition: ${product.condition_summary}.`);
    if (product?.price_cents) parts.push(`Listed at ${formatMoney(product.price_cents, product.currency)}.`);
    return parts.join(' ').slice(0, 900) || 'A Devil n Dove product update from our Southern Ontario workshop.';
  }

  async function queueProductSocialPost(productId) {
    const product = latestProductRows.find((row) => Number(row.product_id || 0) === Number(productId || 0));
    if (!product) throw new Error('Product details are not loaded yet. Refresh products and try again.');
    const title = `New Devil n Dove product: ${product.name || `Product #${productId}`}`;
    const summary = productSocialSummary(product);
    const linkUrl = productDetailUrl(product);
    const imageUrls = [product.featured_image_url, product.og_image_url].filter(Boolean).join('\n');
    const templateKey = String(product.merchandise_origin || '').toLowerCase().includes('vintage') ? 'vintage_find' : 'finished_product';
    const response = await window.DDAuth.apiFetch('/api/admin/social-post-queue', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create',
        source_type: 'product_update',
        source_id: String(productId),
        caption_template_key: templateKey,
        title,
        summary,
        image_urls: imageUrls,
        link_url: linkUrl,
        target_platforms: ['facebook', 'instagram', 'pinterest', 'x'],
        hashtags: '#DevilnDove #HandmadeOntario #ShopSmallCanada #SouthernOntario',
        post_status: 'draft',
        notes: 'Queued from Product editor. Review privacy, caption, schedule, and platform readiness before posting.'
      })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to queue product social post.');
    return data;
  }




  function qaHistoryMarkup(product) {
    const productId = Number(product?.product_id || 0);
    return `<details class="product-qa-history-panel"><summary>QA history</summary><div data-product-qa-history="${productId}" class="small">Open to load QA history.</div><button class="btn small" type="button" data-load-qa-history="${productId}">Load history</button></details>`;
  }

  async function loadProductQAHistory(productId) {
    const target = document.querySelector(`[data-product-qa-history="${productId}"]`);
    if (!target) return;
    target.textContent = 'Loading QA history...';
    try {
      const response = await window.DDAuth.apiFetch(`/api/admin/product-qa-history?product_id=${encodeURIComponent(productId)}`);
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'QA history failed.');
      const rows = Array.isArray(data.history) ? data.history.slice(0, 5) : [];
      target.innerHTML = rows.length ? rows.map((row) => `<div class="status-note ${String(row.qa_status || '').includes('pass') ? 'success' : 'warning'}"><strong>${escapeHtml(row.qa_status || 'checked')}</strong> ${escapeHtml(String(row.qa_score || 0))}%<br>${escapeHtml(row.created_at || '')}</div>`).join('') : 'No QA history recorded yet.';
    } catch (error) { target.textContent = error.message || 'QA history failed.'; }
  }

  function qaBadgeMarkup(product) {
    const qa = product._qa || null;
    if (!qa) return `<div class="product-qa-inline"><strong>Post-publish QA</strong><span class="small">Not run yet.</span><button class="btn small" type="button" data-product-qa-run="${Number(product.product_id || 0)}">Run QA</button></div>`;
    const checks = Array.isArray(qa.checks) ? qa.checks : [];
    const failed = Number(qa.failed || checks.filter((row) => !row.ok).length || 0);
    return `<div class="product-qa-inline ${failed ? 'is-fail' : 'is-pass'}"><strong>Post-publish QA ${failed ? 'needs attention' : 'passed'}</strong><div class="product-qa-badges">${checks.map((check) => `<span class="product-qa-badge ${check.ok ? 'ok' : 'fail'}">${check.ok ? '✓' : '!' } ${escapeHtml(check.code || 'check')}</span>`).join('')}</div>${failed ? `<span class="small">${escapeHtml(checks.find((check) => !check.ok)?.help || 'One or more QA checks failed.')}</span>` : ''}</div>`;
  }

  async function runProductQA(productId) {
    const response = await window.DDAuth.apiFetch(`/api/admin/product-publish-qa?product_id=${encodeURIComponent(productId)}`);
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Post-publish QA failed.');
    latestProductRows = latestProductRows.map((row) => Number(row.product_id || 0) === Number(productId) ? { ...row, _qa: data } : row);
    renderRows(latestProductRows);
    setStatus(`QA complete for product #${productId}: ${Number(data.failed || 0)} issue(s).`, Number(data.failed || 0) ? 'warning' : 'success');
    return data;
  }

  function renderRows(products) {
    if (!tableBody) return;

    tableBody.innerHTML = products.map(product => {
      const productId = Number(product.product_id);
      const name = escapeHtml(product.name || "");
      const slug = escapeHtml(product.slug || "");
      const sku = escapeHtml(product.sku || "");
      const colorSummary = escapeHtml(product.color_names_text || product.color_name || '');
      const type = escapeHtml(product.product_type || "");
      const status = escapeHtml(product.status || "");
      const price = escapeHtml(formatMoney(product.price_cents, product.currency));
      const inventoryQty = Number(product.inventory_quantity || 0);
      const inventory = escapeHtml(String(inventoryQty));
      const shipping = escapeHtml(yesNo(product.requires_shipping));
      const taxClass = escapeHtml(product.tax_class_name || product.tax_class_code || "");
      const isArchived = String(product.status || "").toLowerCase() === "archived";
      const lowStock = Number(product.low_stock_flag || 0) === 1;
      const ready = Number(product.is_ready_for_storefront || 0) === 1;
      const reviewStatusValue = String(product.review_status || "pending_review").toLowerCase();
      const reviewStatus = escapeHtml(product.review_status || "pending_review");
      const readyNotes = escapeHtml(product.ready_check_notes || "");
      const publishScore = Number(product.publish_readiness_score || 0);
      const imageScore = Number(product.image_quality_score || 0);
      const merchandisingScore = Number(product.merchandising_score || 0);
      const effectiveGalleryMerchandisingScore = Number(product.effective_gallery_merchandising_score || merchandisingScore || 0);
      const leadMerchandisingScore = Number(product.lead_image_merchandising_score || 0);
      const previousLeadMerchandisingScore = product.previous_lead_image_merchandising_score == null ? null : Number(product.previous_lead_image_merchandising_score || 0);
      const previousGalleryMerchandisingScore = product.previous_gallery_merchandising_score == null ? null : Number(product.previous_gallery_merchandising_score || 0);
      const overriddenGalleryImageCount = Number(product.overridden_gallery_image_count || 0);
      const weakUnapprovedGalleryImageCount = Number(product.weak_unapproved_gallery_image_count || 0);
      const leadTrend = formatTrendDelta(leadMerchandisingScore, previousLeadMerchandisingScore);
      const galleryTrend = formatTrendDelta(effectiveGalleryMerchandisingScore, previousGalleryMerchandisingScore);
      const canApprove = ready;
      const lowScorePublish = publishScore < 85 || imageScore < 70 || !ready;
      const canPublish = ready && ["approved", "published"].includes(reviewStatusValue) && !lowScorePublish;
      const approveTitle = canApprove ? 'Approve this draft for storefront review.' : `Click to see the exact missing approval fields${readyNotes ? `: ${readyNotes}` : '.'}`;
      const publishTitle = canPublish ? 'Publish this product to the storefront.' : (!ready ? `Click to see the exact publish blockers${readyNotes ? `: ${readyNotes}` : '.'}` : 'Click to see why publish is blocked.');
      const linkedResourceCount = Number(product.linked_resource_count || 0);
      const linkedResourceCost = escapeHtml(formatMoney(product.linked_resource_cost_cents || 0, product.currency));
      const grossMargin = escapeHtml(formatMoney(product.gross_margin_cents || 0, product.currency));
      const missingCostLinks = Number(product.missing_cost_links || 0);
      const buildableUnits = product.buildable_units_from_resources == null ? "" : String(Number(product.buildable_units_from_resources || 0));
      const shortageLinks = Number(product.resource_shortage_links || 0);
      const contextualShotCount = Number(product.contextual_shot_count || 0);

      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #ddd">${productId}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${name}${colorSummary ? `<div class="small">Colours: ${colorSummary}</div>` : ''}${readinessBadgeMarkup(product)}${qaBadgeMarkup(product)}${qaHistoryMarkup(product)}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${slug}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${sku}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${type}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${status}<div class="small">Review: ${reviewStatus}</div><div class="small">${ready ? "Ready for storefront" : "Needs review"}</div></td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${price}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${inventory}<div class="small">${lowStock ? "⚠️ low stock" : "healthy"}</div><div class="small">${ready ? "Storefront ready" : readyNotes || "Missing storefront fields"}</div><div class="small">Publish score ${escapeHtml(String(publishScore))}% • Image score ${escapeHtml(String(imageScore))}%</div><div class="small">Gallery merch ${escapeHtml(String(merchandisingScore))}% • Effective gallery ${escapeHtml(String(effectiveGalleryMerchandisingScore))}% • Lead merch ${escapeHtml(String(leadMerchandisingScore))}%</div><div class="small">Trend ${escapeHtml(galleryTrend || 'new')} gallery • ${escapeHtml(leadTrend || 'new')} lead${product.merchandising_history_recorded_at ? ` • saved ${escapeHtml(product.merchandising_history_recorded_at)}` : ''}</div><div class="small">Contextual shots ${escapeHtml(String(contextualShotCount))} • target 1+ once the gallery has 4 or more images</div><div class="small">${overriddenGalleryImageCount ? `${escapeHtml(String(overriddenGalleryImageCount))} overridden story/gallery images` : 'No documented gallery overrides'}${weakUnapprovedGalleryImageCount ? ` • ${escapeHtml(String(weakUnapprovedGalleryImageCount))} weak images still unapproved` : ''}</div><div class="small">Cost ${linkedResourceCost} • Margin ${grossMargin}</div><div class="small">${linkedResourceCount} linked resources${missingCostLinks ? ` • ${missingCostLinks} missing costs` : ""}</div><div class="small">${buildableUnits ? `Buildable units ${escapeHtml(buildableUnits)}` : "Buildable units unknown"}${shortageLinks ? ` • ${shortageLinks} shortages` : ""}</div></td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${shipping}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${taxClass}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn" type="button" data-edit-product-id="${productId}">Edit</button>
              <button class="btn" type="button" data-open-first-blocker="${productId}">Open blocker</button>
              <button class="btn" type="button" data-product-qa-run="${productId}">Run QA</button>
              <button class="btn" type="button" data-review-action="approve" data-product-id="${productId}" title="${escapeHtml(approveTitle)}">Approve</button>
              <button class="btn" type="button" data-review-action="request_changes" data-product-id="${productId}">Needs Changes</button>
              <button class="btn" type="button" data-review-action="publish" data-product-id="${productId}" title="${escapeHtml(publishTitle)}">Publish</button>
              ${(!canPublish && ["approved", "published"].includes(reviewStatusValue)) ? `<button class="btn" type="button" data-review-action="publish_override" data-product-id="${productId}" title="Override low publish score and push live anyway.">Override Publish</button>` : ''}
              <button class="btn" type="button" data-social-product-id="${productId}">Post this product</button>
              <button class="btn" type="button" data-resource-action="reserve" data-product-id="${productId}">Reserve Resources</button>
              <button class="btn" type="button" data-resource-action="release" data-product-id="${productId}">Release Resources</button>
              <button class="btn" type="button" data-archive-product-id="${productId}" ${isArchived ? "disabled" : ""}>Archive</button>
              <button class="btn" type="button" data-delete-product-id="${productId}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  function normalizeSharedAction(row) {
    if (!row) return null;
    return {
      source: "shared",
      admin_pending_action_id: Number(row.admin_pending_action_id || 0),
      client_action_id: String(row.client_action_id || "").trim(),
      queue_status: row.queue_status || "queued",
      label: row.label || row.action_label || "Pending product review action",
      last_error: row.last_error || row.warning || "",
      created_at: row.created_at || null,
      payload: row.payload || {},
      endpoint: row.endpoint || row.endpoint_path || "/api/admin/product-review-actions",
      method: row.method || row.http_method || "POST"
    };
  }

  function normalizeLocalAction(row) {
    if (!row) return null;
    return {
      source: "local",
      id: String(row.id || row.client_action_id || "").trim(),
      client_action_id: String(row.client_action_id || row.id || "").trim(),
      queue_status: row.queue_status || "queued",
      label: row.label || "Pending product review action",
      last_error: row.last_error || "",
      created_at: row.created_at || null,
      payload: row.payload || {},
      endpoint: row.endpoint || "/api/admin/product-review-actions",
      method: row.method || "POST"
    };
  }

  async function fetchSharedPendingActions() {
    if (!window.DDAuth?.isLoggedIn()) return [];
    try {
      const response = await window.DDAuth.apiFetch("/api/admin/pending-actions?action_scope=product_review&limit=30", { method: "GET" });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Failed to load queued product review actions.");
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
        action_scope: "product_review",
        action_label: action.label,
        endpoint_path: action.endpoint,
        http_method: action.method,
        payload: action.payload,
        queue_status: action.queue_status || "queued",
        last_error: action.last_error || "",
        warning: action.warning || "",
        source_device_label: navigator.userAgent || "browser"
      })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || "Failed to save queued product review action.");
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
        increment_attempt: incrementAttempt ? 1 : 0
      })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || "Failed to update queued product review action.");
    return data.action || null;
  }

  function mergePendingActions(sharedRows) {
    const localRows = loadLocalPendingActions().map(normalizeLocalAction).filter(Boolean);
    const sharedClientIds = new Set(sharedRows.map((row) => String(row.client_action_id || "")).filter(Boolean));
    return [...sharedRows, ...localRows.filter((row) => !sharedClientIds.has(String(row.client_action_id || "")))];
  }

  function renderPendingActions() {
    if (!productsAdminMount) return;
    const sharedRows = currentSharedPendingActions;
    const mergedRows = mergePendingActions(sharedRows);
    productsAdminMount.innerHTML = `
      <div class="card" style="margin-top:16px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
          <div>
            <h3 style="margin:0 0 6px 0">Queued product review actions</h3>
            <div class="small">Failed approve, publish, and needs-changes actions can now be replayed across devices. Browser-local storage remains the last safety net when the shared queue is unavailable.</div>
          </div>
          <div class="small">Shared: ${escapeHtml(String(sharedRows.length))} · Browser-only: ${escapeHtml(String(loadLocalPendingActions().length))}</div>
        </div>
        <div id="adminProductPendingActions" style="margin-top:12px">${mergedRows.length ? `<div class="mobile-summary-list">${mergedRows.map((row) => {
          const actionText = escapeHtml(row.label || "Pending product review action");
          const statusText = escapeHtml(row.queue_status || "queued");
          const detailText = escapeHtml(row.last_error || "Waiting to retry.");
          const key = escapeHtml(String(row.admin_pending_action_id || row.client_action_id || row.id || ""));
          return `<div class="mobile-summary-list-item">
            <strong>${actionText}</strong>
            <div class="small">${statusText}${row.created_at ? ` · ${escapeHtml(row.created_at)}` : ""}</div>
            <div class="small" style="margin-top:6px">${detailText}</div>
            <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn" type="button" data-product-pending-retry="${key}" data-product-pending-source="${escapeHtml(row.source || "shared")}">Retry</button>
              <button class="btn" type="button" data-product-pending-dismiss="${key}" data-product-pending-source="${escapeHtml(row.source || "shared")}">Dismiss</button>
            </div>
          </div>`;
        }).join("")}</div>` : `<div class="small">No queued product review actions are waiting right now.</div>`}</div>
      </div>
    `;
  }

  async function refreshPendingActions() {
    currentSharedPendingActions = await fetchSharedPendingActions();
    renderPendingActions();
  }

  async function loadProducts(options = {}) {
    const { silent = false } = options;

    hide(emptyEl);
    if (!silent) show(loadingEl);

    try {
      const response = await window.DDAuth.apiFetch("/api/admin/products", { method: "GET" });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Failed to load products.");

      const products = Array.isArray(data.products) ? data.products : [];
      latestProductRows = products;
      await refreshReadinessPreview();
      saveSnapshot(products);
      setStatus("");

      if (!products.length) {
        if (tableBody) tableBody.innerHTML = "";
        show(emptyEl);
        return;
      }

      renderProductPicker(products);
      renderRows(products);
    } catch (error) {
      const cached = loadSnapshot();
      if (cached?.products?.length) {
        latestProductRows = cached.products;
        await refreshReadinessPreview();
        renderProductPicker(cached.products);
        renderRows(cached.products);
        setStatus(`Live product list is unavailable. Showing the last saved snapshot from ${cached.cached_at || "an earlier visit"}.`, "warning");
      } else {
        if (tableBody) tableBody.innerHTML = "";
        setStatus(error.message || "Failed to load products.", "error");
        show(emptyEl);
      }
    } finally {
      hide(loadingEl);
    }
  }

  refreshButtons.forEach(button => {
    button.addEventListener("click", async () => {
      await loadProducts();
      await refreshPendingActions();
    });
  });

  document.addEventListener("dd:product-created", async () => {
    await loadProducts({ silent: true });
  });

  document.addEventListener("dd:product-updated", async () => {
    await loadProducts({ silent: true });
  });

  document.addEventListener("dd:product-deleted", async () => {
    await loadProducts({ silent: true });
  });

  document.addEventListener("dd:product-archived", async () => {
    await loadProducts({ silent: true });
  });

  async function queueReviewAction(payload, errorMessage) {
    const action = {
      id: buildClientActionId(payload.product_id, payload.action),
      client_action_id: buildClientActionId(payload.product_id, payload.action),
      label: `Product ${String(payload.action || "review").replace(/_/g, " ")} · #${Number(payload.product_id || 0)}`,
      endpoint: "/api/admin/product-review-actions",
      method: "POST",
      payload,
      queue_status: "queued",
      last_error: errorMessage || ""
    };

    try {
      const saved = await saveSharedPendingAction(action);
      removeLocalPendingAction(action.id);
      currentSharedPendingActions = [saved, ...currentSharedPendingActions.filter((row) => String(row.client_action_id || "") !== String(saved.client_action_id || ""))];
      renderPendingActions();
      return { queued: true, shared: true };
    } catch (queueError) {
      upsertLocalPendingAction(action);
      renderPendingActions();
      return { queued: true, shared: false, queueError: queueError?.message || "Failed to save shared queue action." };
    }
  }

  async function executeQueuedAction(action) {
    const payload = action?.payload && typeof action.payload === "object" ? action.payload : {};
    const response = await window.DDAuth.apiFetch(action.endpoint || "/api/admin/product-review-actions", {
      method: action.method || "POST",
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || "Failed to replay queued product review action.");
    document.dispatchEvent(new CustomEvent("dd:product-updated", { detail: data.product || null }));
    return data;
  }

  async function runReviewAction(productId, action, options = {}) {
    const payload = options.payload ? { ...options.payload } : { product_id: Number(productId || 0), action };
    if (!options.payload) {
      const promptLabel = action === 'publish_override'
        ? 'Override Publish note (required): explain why this low-score listing should go live now.'
        : action === 'request_changes'
          ? 'What needs to change? This note will be saved to the product review history.'
          : action === 'approve'
            ? 'Optional approval note. If approval is blocked, the next message will show the missing fields.'
            : 'Optional note for this review action:';
      const note = window.prompt(promptLabel, "");
      payload.note = String(note || "").trim();
      if (action === 'publish_override' && !payload.note) {
        window.alert('Override Publish requires a note.');
        return { cancelled: true };
      }
      if (action === 'request_changes' && !payload.note) {
        const continueWithout = window.confirm('No change note was entered. Continue and mark as Needs Changes anyway?');
        if (!continueWithout) return { cancelled: true };
      }
      if (action === "publish" || action === "publish_override" || action === "unpublish") {
        const password = window.prompt("Confirm your admin password to continue:");
        if (!password) return { cancelled: true };
        payload.confirm_password = password;
      }
    }

    try {
      const response = await window.DDAuth.apiFetch("/api/admin/product-review-actions", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || `Failed to ${action} product.`);
      document.dispatchEvent(new CustomEvent("dd:product-updated", { detail: data.product || null }));
      if (options.pendingAction) {
        if (options.pendingAction.source === "shared") {
          await updateSharedPendingActionStatus(options.pendingAction, "completed", "", true).catch(() => null);
          currentSharedPendingActions = currentSharedPendingActions.filter((row) => String(row.client_action_id || "") !== String(options.pendingAction.client_action_id || ""));
        } else {
          removeLocalPendingAction(options.pendingAction.id || options.pendingAction.client_action_id);
        }
        renderPendingActions();
      }
      return { queued: false, ok: true };
    } catch (error) {
      if (options.pendingAction) {
        if (options.pendingAction.source === "shared") {
          await updateSharedPendingActionStatus(options.pendingAction, "failed", error.message || "Replay failed.", true).catch(() => null);
        } else {
          upsertLocalPendingAction({ ...options.pendingAction, queue_status: "failed", last_error: error.message || "Replay failed." });
        }
        await refreshPendingActions();
        return { queued: true, ok: false, error: error.message || `Failed to ${action} product.` };
      }

      const queued = await queueReviewAction(payload, error.message || `Failed to ${action} product.`);
      return {
        queued: true,
        ok: false,
        shared: queued.shared,
        error: error.message || `Failed to ${action} product.`
      };
    }
  }

  async function dismissPendingAction(action) {
    if (action.source === "shared") {
      await updateSharedPendingActionStatus(action, "dismissed", "Dismissed by admin.", false).catch(() => null);
      currentSharedPendingActions = currentSharedPendingActions.filter((row) => String(row.client_action_id || "") !== String(action.client_action_id || ""));
    } else {
      removeLocalPendingAction(action.id || action.client_action_id);
    }
    renderPendingActions();
  }

  async function runResourceAction(productId, action) {
    const quantityInput = window.prompt("Quantity multiplier for linked resources:", "1");
    if (quantityInput === null) return { cancelled: true };
    const quantityMultiplier = Math.max(1, Number(quantityInput || 1));
    if (!Number.isFinite(quantityMultiplier)) {
      throw new Error("Quantity multiplier must be a valid number.");
    }
    const note = window.prompt(`Optional note for ${action} resources:`, "") || "";
    const response = await window.DDAuth.apiFetch("/api/admin/site-item-inventory", {
      method: "POST",
      body: JSON.stringify({
        action: action === "reserve" ? "reserve_product_resources" : "release_product_resources",
        product_id: Number(productId || 0),
        quantity_multiplier: quantityMultiplier,
        note: String(note).trim()
      })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || `Failed to ${action} resources.`);
    const results = Array.isArray(data.results) ? data.results : [];
    const affectedItems = results.filter((row) => row && row.ok && !row.skipped_reservation).length;
    const skippedItems = results.filter((row) => row && row.skipped_reservation).length;
    const missingItems = results.filter((row) => row && row.missing_inventory).length;
    const failedItems = results.filter((row) => row && row.ok === false).length;
    const summary = data.summary || {
      affected_items: affectedItems,
      skipped_items: skippedItems,
      missing_inventory_count: missingItems,
      failed_items: failedItems
    };
    const message = `${action === "reserve" ? "Reserved" : "Released"} resources for product #${Number(productId || 0)}. Affected: ${Number(summary.affected_items || affectedItems)}. Skipped/story-only: ${Number(summary.skipped_items || skippedItems)}. Missing inventory links: ${Number(summary.missing_inventory_count || missingItems)}.`;
    setStatus(message, missingItems || failedItems ? "warning" : "success");
    document.dispatchEvent(new CustomEvent("dd:product-updated", { detail: data.product || { product_id: Number(productId || 0) } }));
    return { ok: true, summary, results };
  }

  document.addEventListener("click", async (event) => {
    const reviewButton = event.target.closest("[data-review-action]");
    const resourceButton = event.target.closest("[data-resource-action]");
    const socialProductButton = event.target.closest("[data-social-product-id]");
    const retryButton = event.target.closest("[data-product-pending-retry]");
    const dismissButton = event.target.closest("[data-product-pending-dismiss]");
    const blockerButton = event.target.closest("[data-open-first-blocker]");
    const qaButton = event.target.closest("[data-product-qa-run]");
    const qaHistoryButton = event.target.closest("[data-load-qa-history]");
    if (!reviewButton && !resourceButton && !socialProductButton && !retryButton && !dismissButton && !blockerButton && !qaButton && !qaHistoryButton) return;
    if (!window.DDAuth || !window.DDAuth.isLoggedIn()) return;


    if (qaHistoryButton) {
      await loadProductQAHistory(Number(qaHistoryButton.getAttribute('data-load-qa-history') || 0));
      return;
    }
    if (qaButton) {
      const productId = Number(qaButton.getAttribute('data-product-qa-run') || 0);
      if (!productId) return;
      try { qaButton.disabled = true; await runProductQA(productId); }
      catch (error) { setStatus(error.message || 'Post-publish QA failed.', 'error'); }
      finally { qaButton.disabled = false; }
      return;
    }

    if (blockerButton) {
      const productId = Number(blockerButton.getAttribute('data-open-first-blocker') || 0);
      const readiness = latestReadinessByProductId.get(productId)?.readiness || null;
      window.location.href = firstBlockerTarget(productId, readiness);
      return;
    }


    if (socialProductButton) {
      const productId = Number(socialProductButton.getAttribute('data-social-product-id') || 0);
      if (!productId) return;
      try {
        socialProductButton.disabled = true;
        const data = await queueProductSocialPost(productId);
        const queuedId = data?.result?.social_post_queue_id || data?.social_post_queue_id || '';
        setStatus(`Product social post queued${queuedId ? ` as #${queuedId}` : ''}. Review it in Operations > Social Posting Queue before publishing.`, 'success');
      } catch (error) {
        setStatus(error.message || 'Failed to queue product social post.', 'error');
      } finally {
        socialProductButton.disabled = false;
      }
      return;
    }

    if (retryButton || dismissButton) {
      const actionKey = String((retryButton || dismissButton).getAttribute(retryButton ? "data-product-pending-retry" : "data-product-pending-dismiss") || "").trim();
      const actionSource = String((retryButton || dismissButton).getAttribute("data-product-pending-source") || "shared").trim();
      const action = actionSource === "shared"
        ? currentSharedPendingActions.find((row) => String(row.admin_pending_action_id || row.client_action_id || "") === actionKey || String(row.client_action_id || "") === actionKey)
        : loadLocalPendingActions().map(normalizeLocalAction).find((row) => String(row.id || row.client_action_id || "") === actionKey);
      if (!action) return;
      try {
        if (retryButton) {
          const payload = action.payload || {};
          const actionName = String(payload.action || "review").trim();
          const result = await runReviewAction(Number(payload.product_id || 0), actionName, { payload, pendingAction: action });
          if (result?.ok) setStatus("Queued product review action replayed successfully.", "success");
          else setStatus(result?.error || "Queued product review action is still waiting.", "warning");
          await loadProducts({ silent: true });
          await refreshPendingActions();
        } else {
          await dismissPendingAction(action);
          setStatus("Queued product review action dismissed.", "success");
        }
      } catch (error) {
        setStatus(error.message || "Failed to process queued product review action.", "error");
      }
      return;
    }

    if (reviewButton) {
      const productId = Number(reviewButton.getAttribute("data-product-id") || 0);
      const action = String(reviewButton.getAttribute("data-review-action") || "").trim();
      if (!productId || !action) return;
      try {
        const result = await runReviewAction(productId, action);
        if (result?.cancelled) return;
        if (result?.queued) {
          const tone = result.shared ? "warning" : "error";
          const suffix = result.shared
            ? "The action was saved to the shared replay queue."
            : "The shared queue was unavailable, so the action was saved only in this browser for later retry.";
          setStatus(`${result.error || `Failed to ${action} product.`} ${suffix}`, tone);
          await refreshPendingActions();
        } else {
          setStatus(`Product ${action.replace(/_/g, " ")} complete.`, "success");
          await loadProducts({ silent: true });
          await refreshPendingActions();
        }
      } catch (error) {
        setStatus(error.message || `Failed to ${action} product.`, "error");
      }
      return;
    }

    const productId = Number(resourceButton.getAttribute("data-product-id") || 0);
    const action = String(resourceButton.getAttribute("data-resource-action") || "").trim();
    if (!productId || !action) return;
    try {
      const resourceResult = await runResourceAction(productId, action);
      if (resourceResult?.cancelled) return;
      if (!resourceResult?.ok) setStatus(`Product resources ${action} action complete.`, "success");
      await loadProducts({ silent: true });
    } catch (error) {
      setStatus(error.message || `Failed to ${action} product resources.`, "error");
    }
  });

  document.getElementById("clearExistingProductButton")?.addEventListener("click", () => {
    const select = document.getElementById("existingProductSelect");
    if (select) select.value = "";
  });

  if (!window.DDAuth || !window.DDAuth.isLoggedIn()) {
    return;
  }

  await loadProducts();
  await refreshPendingActions();
});


// Build 169: lightweight persisted QA state and issue-specific fix buttons for catalog rows.
(function(){
  async function saveQaState(productId, panelState){
    if(!window.DDAuth || !productId) return;
    try{ await window.DDAuth.apiFetch('/api/admin/product-qa-panel-state',{method:'POST',body:JSON.stringify({product_id:Number(productId),panel_state:panelState})}); }catch{}
  }
  document.addEventListener('click', (event)=>{
    const toggle = event.target?.closest?.('[data-toggle-product-qa-panel]');
    if(toggle){ const id=toggle.getAttribute('data-toggle-product-qa-panel'); const panel=document.querySelector(`[data-product-qa-panel="${CSS.escape(String(id))}"]`); if(panel){ const open=panel.toggleAttribute('hidden'); saveQaState(id, open?'collapsed':'expanded'); } }
    const fix = event.target?.closest?.('[data-product-qa-fix]');
    if(fix){ const issue=fix.getAttribute('data-product-qa-fix')||'issue'; const productId=fix.getAttribute('data-product-id')||''; alert(`Fix helper: ${issue}\n\nOpen the matching editor section for product #${productId} and repair the readiness blocker before publishing.`); }
  });
})();
