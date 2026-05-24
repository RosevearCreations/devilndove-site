// File: /public/js/admin-create-product.js
// Build 145: Draft-first product creation with autosave and multi-image upload (max 7 images).

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("createProductForm");
  const messageEl = document.getElementById("createProductMessage");
  const taxClassSelect = document.getElementById("create_product_tax_class_id");
  const MAX_PRODUCT_IMAGES = 7;
  const MAX_GALLERY_IMAGE_FIELDS = MAX_PRODUCT_IMAGES - 1;
  const AUTOSAVE_DELAY_MS = 1400;
  let autosaveTimer = null;
  let autosaveInFlight = false;
  let lastAutosaveFingerprint = "";
  let autosaveStatusEl = null;

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function slugify(value) {
    return normalizeText(value)
      .toLowerCase()
      .replace(/["']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function setMessage(message, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.style.display = "block";
    messageEl.style.color = isError ? "#ffb4c1" : "#9ef0b4";
  }

  function clearMessage() {
    if (!messageEl) return;
    messageEl.textContent = "";
    messageEl.style.display = "none";
  }

  function setAutosaveStatus(message, tone = "muted") {
    if (!autosaveStatusEl) return;
    autosaveStatusEl.textContent = message || "";
    autosaveStatusEl.dataset.tone = tone;
  }

  async function readApiJson(response, fallbackMessage = "Request failed.") {
    const contentType = String(response?.headers?.get("Content-Type") || "").toLowerCase();
    if (contentType.includes("application/json")) {
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error_detail || data?.error || fallbackMessage);
      }
      return data;
    }
    const text = await response.text().catch(() => "");
    const details = text ? text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 240) : "";
    throw new Error(`${fallbackMessage} Server returned ${response.status || "an error"}${details ? `: ${details}` : ""}`);
  }

  function isDraftMode() {
    const status = normalizeText(form?.elements?.namedItem("status")?.value || "draft").toLowerCase();
    return status === "draft";
  }

  const REQUIRED_FIELD_CONFIG = [
    { name: "name", label: "Name", badge: "Required for draft" },
    { name: "product_type", label: "Product type", badge: "Required" },
    {
      name: "external_listing_url",
      label: "External listing URL",
      badge: "Required before active",
      when: () => !isDraftMode() && ["hybrid", "external_only"].includes(normalizeText(form?.elements?.namedItem("sale_channel")?.value).toLowerCase())
    }
  ];

  const PUBLISH_READINESS_CONFIG = [
    { name: "product_category", label: "Category" },
    { name: "price", label: "Price" },
    { name: "featured_image_url", label: "Featured image" },
    { name: "meta_title", label: "SEO title" },
    { name: "meta_description", label: "SEO meta description" }
  ];

  function isFieldMissing(field) {
    if (!field) return false;
    if (field.type === "checkbox" || field.type === "radio") return !field.checked;
    return !normalizeText(field.value);
  }

  function ensureFieldBadge(container, className, text) {
    if (!container || container.querySelector(`.${className}`)) return;
    const target = container.querySelector(".small") || container.firstElementChild || container;
    const badge = document.createElement("span");
    badge.className = className;
    badge.textContent = text;
    target.appendChild(badge);
  }

  function setRequiredFieldState(field, shouldMark, config = {}) {
    if (!field) return;
    const container = field.closest("label") || field.parentElement;
    if (container) {
      container.classList.add("dd-required-field");
      ensureFieldBadge(container, "dd-required-badge", config.badge || "Required");
      container.classList.toggle("is-required-empty", !!shouldMark);
    }
    field.classList.toggle("dd-required-outline", !!shouldMark);
    field.setAttribute("aria-invalid", shouldMark ? "true" : "false");
  }

  function setReadinessFieldState(field, shouldMark) {
    if (!field) return;
    const container = field.closest("label") || field.parentElement;
    if (container) {
      container.classList.add("dd-publish-readiness-field");
      ensureFieldBadge(container, "dd-recommended-badge", "Needed before publish");
      container.classList.toggle("is-readiness-missing", !!shouldMark);
    }
    field.classList.toggle("dd-readiness-outline", !!shouldMark);
  }

  function syncRequiredFieldOutlines() {
    if (!form) return;
    REQUIRED_FIELD_CONFIG.forEach((config) => {
      const field = form.elements.namedItem(config.name);
      if (!field) return;
      const shouldApply = typeof config.when === "function" ? !!config.when() : true;
      setRequiredFieldState(field, shouldApply && isFieldMissing(field), config);
    });

    PUBLISH_READINESS_CONFIG.forEach((config) => {
      const field = form.elements.namedItem(config.name);
      if (!field) return;
      setReadinessFieldState(field, !isDraftMode() && isFieldMissing(field));
    });
  }

  window.DDProductEditorRequiredState = { sync: syncRequiredFieldOutlines };

  function setSelectOptions(select, items, valueKey = null, labelBuilder = null, placeholder = "Select an option") {
    if (!select) return;
    const rows = Array.isArray(items) ? items : [];
    const currentValue = normalizeText(select.value);
    select.innerHTML = `<option value="">${placeholder}</option>` + rows.map((item) => {
      const rawValue = valueKey ? item?.[valueKey] : item;
      const value = normalizeText(rawValue == null ? "" : rawValue);
      const label = labelBuilder ? labelBuilder(item) : value;
      return `<option value="${value.replace(/"/g, "&quot;")}">${String(label || value || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</option>`;
    }).join("");
    if (currentValue) select.value = currentValue;
  }

  async function loadEditorBootstrap() {
    if (!window.DDAuth || !window.DDAuth.isLoggedIn()) return null;
    try {
      const response = await window.DDAuth.apiFetch("/api/admin/product-mobile-bootstrap", { method: "GET" });
      const data = await readApiJson(response, "Failed to load product editor options.");
      setSelectOptions(document.getElementById("create_product_category"), data.category_options || [], null, null, "Select category");
      setSelectOptions(document.getElementById("create_product_color_name"), data.color_options || [], null, null, "Select primary colour");
      setSelectOptions(document.getElementById("create_product_shipping_code"), data.shipping_code_options || [], null, null, "Select shipping code");
      if (taxClassSelect) {
        const currentValue = normalizeText(taxClassSelect.value);
        taxClassSelect.innerHTML = `<option value="">Select tax class</option>` + (Array.isArray(data.tax_classes) ? data.tax_classes : []).map((taxClass) => {
          const ratePercent = Number(taxClass.tax_rate || taxClass.rate_percent || 0);
          const friendlyRate = ratePercent > 1 ? ratePercent : Math.round(ratePercent * 100);
          return `<option value="${Number(taxClass.tax_class_id || 0)}">${String(taxClass.name || "Tax class")} (${friendlyRate}%)</option>`;
        }).join("");
        if (currentValue) taxClassSelect.value = currentValue;
      }
      return data;
    } catch (error) {
      setMessage(error.message || "Failed to load product editor options.", true);
      return null;
    }
  }

  function dollarsToCents(value) {
    const normalized = normalizeText(value);
    if (!normalized) return 0;
    const amount = Number(normalized);
    if (!Number.isFinite(amount) || amount < 0) return NaN;
    return Math.round(amount * 100);
  }

  async function loadTaxClasses() {
    await loadEditorBootstrap();
  }

  function getImageDimensions(file) {
    return new Promise((resolve) => {
      if (!file || !file.type || !file.type.startsWith("image/")) {
        resolve({});
        return;
      }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const width = Number(img.naturalWidth || 0);
        const height = Number(img.naturalHeight || 0);
        URL.revokeObjectURL(url);
        resolve({
          width_px: width || "",
          height_px: height || "",
          image_orientation: width && height ? (Math.abs(width - height) <= Math.max(24, width * 0.03) ? "square" : (width > height ? "landscape" : "portrait")) : ""
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({});
      };
      img.src = url;
    });
  }

  function imageUrlFields() {
    const rows = [];
    for (let i = 1; i <= MAX_GALLERY_IMAGE_FIELDS; i += 1) {
      const field = form?.elements?.namedItem(`image_url_${i}`);
      if (field) rows.push(field);
    }
    return rows;
  }

  function firstEmptyImageField(preferGallery = false) {
    const featured = form?.elements?.namedItem("featured_image_url");
    if (!preferGallery && featured && !normalizeText(featured.value)) return featured;
    const galleryField = imageUrlFields().find((field) => field && !normalizeText(field.value));
    if (galleryField) return galleryField;
    return featured || imageUrlFields()[0] || null;
  }

  function countExistingImageSlots() {
    const featuredCount = normalizeText(form?.elements?.namedItem("featured_image_url")?.value) ? 1 : 0;
    return featuredCount + imageUrlFields().filter((field) => normalizeText(field.value)).length;
  }

  function fillImageField(url, placement = "auto") {
    const cleanUrl = normalizeText(url);
    if (!cleanUrl) return false;
    let field = null;
    if (placement === "featured") field = form.elements.namedItem("featured_image_url");
    else if (placement === "gallery") field = imageUrlFields().find((candidate) => candidate && !normalizeText(candidate.value));
    field = field || firstEmptyImageField(placement === "gallery");
    if (!field) return false;
    field.value = cleanUrl;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  function ensureImageUploadPanel() {
    if (!form || document.getElementById("productDraftImageUploader")) return;
    const featuredField = form.elements.namedItem("featured_image_url");
    const anchor = featuredField?.closest(".grid") || featuredField?.closest("label") || form.querySelector("label");
    const panel = document.createElement("div");
    panel.id = "productDraftImageUploader";
    panel.className = "dd-product-draft-media-panel";
    panel.innerHTML = `
      <div>
        <h3 style="margin:0 0 6px 0">Product pictures</h3>
        <p class="small" style="margin:0">Drafts can be saved without pictures. Upload up to 7 pictures at a time, or paste public image URLs below. The first image can become the featured image.</p>
      </div>
      <div class="dd-product-draft-media-grid">
        <label><span class="small">Choose images</span><input class="input" id="productDraftImageFile" type="file" accept="image/*" multiple /></label>
        <label><span class="small">Alt text base</span><input class="input" id="productDraftImageAlt" type="text" maxlength="160" placeholder="Short description used as the base for uploaded product pictures" /></label>
        <label><span class="small">Placement</span><select class="input" id="productDraftImagePlacement"><option value="auto">Auto-fill featured, then gallery</option><option value="featured">First image featured, rest gallery</option><option value="gallery">Gallery only</option></select></label>
      </div>
      <div class="dd-product-draft-media-actions">
        <button class="btn" id="productDraftUploadButton" type="button">Upload selected images</button>
        <span class="small" id="productDraftUploadStatus">No images selected.</span>
      </div>
      <div class="dd-product-draft-image-preview" id="productDraftImagePreview" hidden></div>
    `;
    if (anchor?.parentElement) anchor.parentElement.insertBefore(panel, anchor);
    else form.insertBefore(panel, form.firstElementChild || null);

    const fileInput = panel.querySelector("#productDraftImageFile");
    const altInput = panel.querySelector("#productDraftImageAlt");
    const uploadButton = panel.querySelector("#productDraftUploadButton");
    const status = panel.querySelector("#productDraftUploadStatus");
    const preview = panel.querySelector("#productDraftImagePreview");

    fileInput?.addEventListener("change", () => {
      const files = Array.from(fileInput.files || []).filter((file) => file?.type?.startsWith("image/"));
      if (!files.length) {
        status.textContent = "No images selected.";
        preview.hidden = true;
        preview.innerHTML = "";
        return;
      }
      const trimmed = files.slice(0, MAX_PRODUCT_IMAGES);
      const rejected = files.length > MAX_PRODUCT_IMAGES ? ` Only the first ${MAX_PRODUCT_IMAGES} will be uploaded.` : "";
      status.textContent = `${trimmed.length} image${trimmed.length === 1 ? "" : "s"} selected.${rejected}`;
      preview.hidden = false;
      preview.innerHTML = trimmed.map((file) => {
        const url = URL.createObjectURL(file);
        setTimeout(() => URL.revokeObjectURL(url), 2500);
        return `<img alt="Selected product preview" src="${url}" />`;
      }).join("");
      if (altInput && !normalizeText(altInput.value)) {
        altInput.value = normalizeText(form.elements.namedItem("name")?.value) || trimmed[0].name.replace(/\.[a-z0-9]+$/i, "");
      }
    });

    uploadButton?.addEventListener("click", async () => {
      const rawFiles = Array.from(fileInput?.files || []).filter((file) => file?.type?.startsWith("image/"));
      const files = rawFiles.slice(0, MAX_PRODUCT_IMAGES);
      if (!files.length) {
        status.textContent = "Choose one or more images first.";
        return;
      }
      if (!window.DDAuth || !window.DDAuth.isLoggedIn()) {
        status.textContent = "Log in before uploading media.";
        return;
      }
      const openSlots = MAX_PRODUCT_IMAGES - countExistingImageSlots();
      if (openSlots <= 0) {
        status.textContent = `This form already has the ${MAX_PRODUCT_IMAGES} available image slots filled. Clear one before uploading more.`;
        return;
      }
      const uploadFiles = files.slice(0, Math.min(MAX_PRODUCT_IMAGES, openSlots));
      const originalText = uploadButton.textContent;
      uploadButton.disabled = true;
      uploadButton.textContent = "Uploading…";
      status.textContent = `Uploading ${uploadFiles.length} image${uploadFiles.length === 1 ? "" : "s"}…`;
      const uploadedUrls = [];
      const failures = [];
      try {
        const placement = normalizeText(panel.querySelector("#productDraftImagePlacement")?.value || "auto");
        const currentProductId = Number(form?.dataset?.productId || window.DDCurrentProductEditorId || 0);
        const attachToCurrentProduct = form?.dataset?.mode === "edit" && Number.isInteger(currentProductId) && currentProductId > 0;

        for (let index = 0; index < uploadFiles.length; index += 1) {
          const file = uploadFiles[index];
          try {
            const dimensions = await getImageDimensions(file);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_scope", "product");
            if (attachToCurrentProduct) formData.append("product_id", String(currentProductId));
            formData.append("attach_to_product", attachToCurrentProduct ? "1" : "0");
            const shouldBeFeatured = placement === "featured" && index === 0;
            formData.append("set_featured", shouldBeFeatured ? "1" : "0");
            formData.append("variant_role", shouldBeFeatured ? "featured" : "gallery");
            formData.append("asset_tag", "draft-product-editor-multi");
            const altBase = normalizeText(altInput?.value) || normalizeText(form.elements.namedItem("name")?.value) || file.name;
            formData.append("alt_text", uploadFiles.length > 1 ? `${altBase} ${index + 1}` : altBase);
            Object.entries(dimensions || {}).forEach(([key, value]) => {
              if (value !== "" && value != null) formData.append(key, value);
            });

            const response = await window.DDAuth.apiFetch("/api/admin/media-upload", { method: "POST", body: formData });
            const data = await readApiJson(response, `Image upload failed for ${file.name}.`);
            const url = normalizeText(data?.asset?.public_url);
            if (!url) throw new Error("Upload succeeded but no public image URL was returned. Check the R2 public base URL setting.");
            uploadedUrls.push(url);
            fillImageField(url, placement === "gallery" ? "gallery" : (placement === "featured" && index === 0 ? "featured" : "auto"));
            status.textContent = `Uploaded ${uploadedUrls.length}/${uploadFiles.length} image${uploadFiles.length === 1 ? "" : "s"}…`;
          } catch (error) {
            failures.push(`${file.name}: ${error.message || "Upload failed"}`);
          }
        }

        if (uploadedUrls.length) {
          setMessage(`${uploadedUrls.length} image${uploadedUrls.length === 1 ? "" : "s"} uploaded and added to the product form.`);
          syncRequiredFieldOutlines();
          scheduleAutosave("image-upload");
        }
        status.textContent = failures.length
          ? `${uploadedUrls.length} uploaded, ${failures.length} failed. ${failures[0]}`
          : `${uploadedUrls.length} image${uploadedUrls.length === 1 ? "" : "s"} uploaded.`;
      } catch (error) {
        status.textContent = error.message || "Image upload failed.";
        setMessage(error.message || "Image upload failed.", true);
      } finally {
        uploadButton.disabled = false;
        uploadButton.textContent = originalText || "Upload selected images";
      }
    });
  }

  function resetCreateDefaults() {
    if (!form) return;
    const defaults = {
      product_type: "physical",
      status: "draft",
      review_status: "pending_review",
      currency: "CAD",
      taxable: "1",
      requires_shipping: "1",
      inventory_tracking: "1",
      inventory_quantity: "0",
      sort_order: "0",
      merchandise_origin: "handmade",
      sale_channel: "onsite"
    };
    Object.entries(defaults).forEach(([name, value]) => {
      const field = form.elements.namedItem(name);
      if (field) field.value = value;
    });
    setAutosaveStatus("Autosave starts after product name and type are filled.", "muted");
  }

  function collectProductPayload({ forceDraft = false } = {}) {
    const formData = new FormData(form);
    const price_cents = dollarsToCents(formData.get("price"));
    const compareRaw = normalizeText(formData.get("compare_at_price"));
    const compare_at_price_cents = compareRaw ? dollarsToCents(compareRaw) : null;
    const rawSlug = normalizeText(formData.get("slug"));
    const name = normalizeText(formData.get("name"));
    const imageUrls = imageUrlFields()
      .map((field) => normalizeText(field.value))
      .filter(Boolean)
      .slice(0, MAX_PRODUCT_IMAGES);

    return {
      product_id: Number(form?.dataset?.productId || window.DDCurrentProductEditorId || 0) || undefined,
      name,
      slug: rawSlug || slugify(name),
      sku: normalizeText(formData.get("sku")),
      short_description: normalizeText(formData.get("short_description")),
      product_category: normalizeText(formData.get("product_category")),
      color_name: normalizeText(formData.get("color_name")),
      color_names_text: normalizeText(formData.get("color_names_text")),
      shipping_code: normalizeText(formData.get("shipping_code")),
      review_status: normalizeText(formData.get("review_status") || "pending_review"),
      description: normalizeText(formData.get("description")),
      product_type: normalizeText(formData.get("product_type") || "physical"),
      status: forceDraft ? "draft" : normalizeText(formData.get("status") || "draft"),
      price_cents,
      compare_at_price_cents,
      currency: normalizeText(formData.get("currency") || "CAD").toUpperCase(),
      taxable: formData.get("taxable") === "0" ? 0 : 1,
      tax_class_id: normalizeText(formData.get("tax_class_id")) || null,
      requires_shipping: formData.get("requires_shipping") === "1" ? 1 : 0,
      weight_grams: normalizeText(formData.get("weight_grams")) || null,
      inventory_tracking: formData.get("inventory_tracking") === "1" ? 1 : 0,
      inventory_quantity: normalizeText(formData.get("inventory_quantity")) || 0,
      digital_file_url: normalizeText(formData.get("digital_file_url")),
      featured_image_url: normalizeText(formData.get("featured_image_url")),
      sort_order: normalizeText(formData.get("sort_order")) || 0,
      meta_title: normalizeText(formData.get("meta_title")),
      meta_description: normalizeText(formData.get("meta_description")),
      keywords: normalizeText(formData.get("keywords")),
      h1_override: normalizeText(formData.get("h1_override")),
      canonical_url: normalizeText(formData.get("canonical_url")),
      og_title: normalizeText(formData.get("og_title")),
      og_description: normalizeText(formData.get("og_description")),
      og_image_url: normalizeText(formData.get("og_image_url")),
      merchandise_origin: normalizeText(formData.get("merchandise_origin") || "handmade"),
      sale_channel: normalizeText(formData.get("sale_channel") || "onsite"),
      external_listing_url: normalizeText(formData.get("external_listing_url")),
      external_listing_label: normalizeText(formData.get("external_listing_label")),
      condition_summary: normalizeText(formData.get("condition_summary")),
      era_label: normalizeText(formData.get("era_label")),
      sourcing_notes: normalizeText(formData.get("sourcing_notes")),
      image_urls: imageUrls,
      capture_entry_mode: "full"
    };
  }

  function validatePayload(payload, { allowDraft = true } = {}) {
    if (Number.isNaN(payload.price_cents)) return "Price must be a valid amount, or leave it blank for a draft.";
    if (payload.compare_at_price_cents !== null && Number.isNaN(payload.compare_at_price_cents)) return "Compare-at price must be a valid amount.";
    if (!payload.name) return "Product name is required to save a draft.";
    if (!payload.product_type) return "Product type is required.";
    if (!allowDraft && payload.status !== "draft" && ["hybrid", "external_only"].includes(payload.sale_channel) && !payload.external_listing_url) {
      return "Add an external listing URL before activating hybrid or external-only items. Drafts can skip this.";
    }
    return "";
  }

  async function saveProductPayload(payload, { autosave = false } = {}) {
    const isExisting = Number(payload.product_id || 0) > 0;
    const endpoint = isExisting ? "/api/admin/update-product" : "/api/admin/create-product";
    const response = await window.DDAuth.apiFetch(endpoint, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const data = await readApiJson(response, autosave ? "Autosave failed." : "Failed to save product.");
    if (!isExisting && Number(data?.product?.product_id || 0)) {
      form.dataset.productId = String(data.product.product_id);
      window.DDCurrentProductEditorId = Number(data.product.product_id || 0);
      document.dispatchEvent(new CustomEvent("dd:product-autosaved-new", {
        detail: { product: data.product || null, product_id: Number(data.product.product_id || 0) }
      }));
    }
    if (data?.product?.slug && !normalizeText(form.elements.namedItem("slug")?.value)) {
      form.elements.namedItem("slug").value = data.product.slug;
    }
    return data;
  }

  function canAutosaveDraft() {
    if (!form || !window.DDAuth || !window.DDAuth.isLoggedIn()) return false;
    const name = normalizeText(form.elements.namedItem("name")?.value);
    const productType = normalizeText(form.elements.namedItem("product_type")?.value);
    const status = normalizeText(form.elements.namedItem("status")?.value || "draft").toLowerCase();
    return Boolean(name && productType && status === "draft");
  }

  function scheduleAutosave(reason = "change") {
    if (!form || form.dataset.autosavePaused === "1") return;
    clearTimeout(autosaveTimer);
    if (!canAutosaveDraft()) {
      setAutosaveStatus("Autosave starts after product name and type are filled while status is Draft.", "muted");
      return;
    }
    setAutosaveStatus("Autosave pending…", "pending");
    autosaveTimer = setTimeout(() => runAutosave(reason), AUTOSAVE_DELAY_MS);
  }

  async function runAutosave(reason = "change") {
    if (autosaveInFlight || !canAutosaveDraft()) return;
    const payload = collectProductPayload({ forceDraft: true });
    const validationError = validatePayload(payload, { allowDraft: true });
    if (validationError) {
      setAutosaveStatus(validationError, "error");
      return;
    }
    const fingerprint = JSON.stringify(payload);
    if (fingerprint === lastAutosaveFingerprint) {
      setAutosaveStatus("Autosaved — no changes.", "saved");
      return;
    }
    autosaveInFlight = true;
    setAutosaveStatus("Autosaving draft…", "pending");
    try {
      const data = await saveProductPayload(payload, { autosave: true });
      lastAutosaveFingerprint = JSON.stringify(collectProductPayload({ forceDraft: true }));
      const productId = Number(data?.product?.product_id || payload.product_id || 0);
      setAutosaveStatus(`Autosaved draft${productId ? ` #${productId}` : ""} at ${new Date().toLocaleTimeString()}.`, "saved");
      document.dispatchEvent(new CustomEvent("dd:product-autosaved", { detail: { product: data.product || null, reason } }));
    } catch (error) {
      setAutosaveStatus(`Autosave failed: ${error.message || "unknown error"}`, "error");
    } finally {
      autosaveInFlight = false;
    }
  }

  function ensureAutosavePanel() {
    if (!form || document.getElementById("productAutosavePanel")) return;
    const panel = document.createElement("div");
    panel.id = "productAutosavePanel";
    panel.className = "dd-product-autosave-panel small";
    panel.innerHTML = `
      <strong>Draft autosave:</strong>
      <span id="productAutosaveStatus" data-tone="muted">Autosave starts after product name and type are filled.</span>
      <button class="btn" type="button" id="productAutosaveNowButton">Autosave now</button>
    `;
    form.insertBefore(panel, form.firstElementChild || null);
    autosaveStatusEl = panel.querySelector("#productAutosaveStatus");
    panel.querySelector("#productAutosaveNowButton")?.addEventListener("click", () => runAutosave("manual"));
  }

  if (!form) {
    loadTaxClasses();
    return;
  }

  if (!form.dataset.mode) form.dataset.mode = "create";
  ensureAutosavePanel();
  ensureImageUploadPanel();
  resetCreateDefaults();
  loadTaxClasses().finally(() => { syncRequiredFieldOutlines(); });

  form.addEventListener("input", () => { syncRequiredFieldOutlines(); scheduleAutosave("input"); });
  form.addEventListener("change", () => { syncRequiredFieldOutlines(); scheduleAutosave("change"); });

  form.addEventListener("submit", async (event) => {
    syncRequiredFieldOutlines();
    if (form.dataset.mode === "edit") return;

    event.preventDefault();
    clearMessage();

    const submitButton = form.querySelector('button[type="submit"]');
    const payload = collectProductPayload();
    const validationError = validatePayload(payload, { allowDraft: false });
    if (validationError) {
      setMessage(validationError, true);
      return;
    }

    if (payload.status !== "draft" && ["hybrid", "external_only"].includes(payload.sale_channel) && !payload.external_listing_url) {
      setMessage("Add an external listing URL before activating hybrid or external-only items. Drafts can skip this.", true);
      return;
    }

    const originalButtonText = submitButton ? submitButton.textContent : "";

    try {
      clearTimeout(autosaveTimer);
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = payload.status === "draft" ? "Saving draft…" : "Creating…";
      }

      const data = await saveProductPayload(payload, { autosave: false });
      setMessage(data.message || "Product draft saved successfully.");
      lastAutosaveFingerprint = JSON.stringify(collectProductPayload({ forceDraft: true }));
      setAutosaveStatus("Saved. You can continue editing this draft or clear the editor.", "saved");
      document.dispatchEvent(new CustomEvent("dd:product-created", { detail: { product: data.product || null } }));
      document.dispatchEvent(new CustomEvent("dd:product-editor-target", {
        detail: { product: data.product || null, product_id: Number(data?.product?.product_id || 0) }
      }));
    } catch (error) {
      setMessage(error.message || "Failed to create product.", true);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText || "Save Draft Product";
      }
    }
  });
});
