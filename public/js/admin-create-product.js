// File: /public/js/admin-create-product.js
// Build 134: Draft-first product creation, safer JSON handling, and an inline product image uploader.

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("createProductForm");
  const messageEl = document.getElementById("createProductMessage");
  const taxClassSelect = document.getElementById("create_product_tax_class_id");

  function normalizeText(value) {
    return String(value || "").trim();
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

  function firstEmptyImageField() {
    const featured = form?.elements?.namedItem("featured_image_url");
    if (featured && !normalizeText(featured.value)) return featured;
    for (let i = 1; i <= 5; i += 1) {
      const field = form?.elements?.namedItem(`image_url_${i}`);
      if (field && !normalizeText(field.value)) return field;
    }
    return featured || form?.elements?.namedItem("image_url_1") || null;
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
        <p class="small" style="margin:0">Drafts can be saved without pictures. Upload a picture here when R2 media storage is connected, or paste image URLs below.</p>
      </div>
      <div class="dd-product-draft-media-grid">
        <label><span class="small">Choose image</span><input class="input" id="productDraftImageFile" type="file" accept="image/*" /></label>
        <label><span class="small">Alt text</span><input class="input" id="productDraftImageAlt" type="text" maxlength="160" placeholder="Short description for the product picture" /></label>
        <label><span class="small">Placement</span><select class="input" id="productDraftImagePlacement"><option value="auto">Auto-fill first empty image field</option><option value="featured">Featured image</option><option value="gallery">Next gallery image</option></select></label>
      </div>
      <div class="dd-product-draft-media-actions">
        <button class="btn" id="productDraftUploadButton" type="button">Upload selected image</button>
        <span class="small" id="productDraftUploadStatus">No image selected.</span>
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
      const file = fileInput.files?.[0];
      if (!file) {
        status.textContent = "No image selected.";
        preview.hidden = true;
        preview.innerHTML = "";
        return;
      }
      status.textContent = `${file.name} selected.`;
      const url = URL.createObjectURL(file);
      preview.hidden = false;
      preview.innerHTML = `<img alt="Selected product preview" src="${url}" />`;
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      if (altInput && !normalizeText(altInput.value)) {
        altInput.value = normalizeText(form.elements.namedItem("name")?.value) || file.name.replace(/\.[a-z0-9]+$/i, "");
      }
    });

    uploadButton?.addEventListener("click", async () => {
      const file = fileInput?.files?.[0];
      if (!file) {
        status.textContent = "Choose an image first.";
        return;
      }
      if (!window.DDAuth || !window.DDAuth.isLoggedIn()) {
        status.textContent = "Log in before uploading media.";
        return;
      }
      const originalText = uploadButton.textContent;
      uploadButton.disabled = true;
      uploadButton.textContent = "Uploading…";
      status.textContent = "Uploading image…";
      try {
        const placement = normalizeText(panel.querySelector("#productDraftImagePlacement")?.value || "auto");
        const dimensions = await getImageDimensions(file);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_scope", "product");
        formData.append("attach_to_product", "0");
        formData.append("set_featured", placement === "featured" ? "1" : "0");
        formData.append("variant_role", placement === "featured" ? "featured" : "gallery");
        formData.append("asset_tag", "draft-product-editor");
        formData.append("alt_text", normalizeText(altInput?.value) || normalizeText(form.elements.namedItem("name")?.value) || file.name);
        Object.entries(dimensions || {}).forEach(([key, value]) => {
          if (value !== "" && value != null) formData.append(key, value);
        });

        const response = await window.DDAuth.apiFetch("/api/admin/media-upload", {
          method: "POST",
          body: formData
        });
        const data = await readApiJson(response, "Image upload failed.");
        const url = normalizeText(data?.asset?.public_url);
        if (!url) throw new Error("Upload succeeded but no public image URL was returned. Check the R2 public base URL setting.");

        let field = null;
        if (placement === "featured") field = form.elements.namedItem("featured_image_url");
        else if (placement === "gallery") {
          for (let i = 1; i <= 5; i += 1) {
            const candidate = form.elements.namedItem(`image_url_${i}`);
            if (candidate && !normalizeText(candidate.value)) {
              field = candidate;
              break;
            }
          }
        }
        field = field || firstEmptyImageField();
        if (field) {
          field.value = url;
          field.dispatchEvent(new Event("input", { bubbles: true }));
        }
        status.textContent = "Image uploaded and added to the product form.";
        setMessage("Image uploaded. You can now save the draft product.");
        syncRequiredFieldOutlines();
      } catch (error) {
        status.textContent = error.message || "Image upload failed.";
        setMessage(error.message || "Image upload failed.", true);
      } finally {
        uploadButton.disabled = false;
        uploadButton.textContent = originalText || "Upload selected image";
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
  }

  if (!form) {
    loadTaxClasses();
    return;
  }

  if (!form.dataset.mode) form.dataset.mode = "create";
  ensureImageUploadPanel();
  resetCreateDefaults();
  loadTaxClasses().finally(() => { syncRequiredFieldOutlines(); });

  form.addEventListener("input", () => { syncRequiredFieldOutlines(); });
  form.addEventListener("change", () => { syncRequiredFieldOutlines(); });

  form.addEventListener("submit", async (event) => {
    syncRequiredFieldOutlines();
    if (form.dataset.mode === "edit") return;

    event.preventDefault();
    clearMessage();

    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);

    const price_cents = dollarsToCents(formData.get("price"));
    const compareRaw = normalizeText(formData.get("compare_at_price"));
    const compare_at_price_cents = compareRaw ? dollarsToCents(compareRaw) : null;

    if (Number.isNaN(price_cents)) {
      setMessage("Price must be a valid amount, or leave it blank for a draft.", true);
      return;
    }
    if (compare_at_price_cents !== null && Number.isNaN(compare_at_price_cents)) {
      setMessage("Compare-at price must be a valid amount.", true);
      return;
    }

    const imageUrls = [1, 2, 3, 4, 5]
      .map((index) => normalizeText(formData.get(`image_url_${index}`)))
      .filter(Boolean);

    const payload = {
      name: normalizeText(formData.get("name")),
      slug: normalizeText(formData.get("slug")),
      sku: normalizeText(formData.get("sku")),
      short_description: normalizeText(formData.get("short_description")),
      product_category: normalizeText(formData.get("product_category")),
      color_name: normalizeText(formData.get("color_name")),
      color_names_text: normalizeText(formData.get("color_names_text")),
      shipping_code: normalizeText(formData.get("shipping_code")),
      review_status: normalizeText(formData.get("review_status") || "pending_review"),
      description: normalizeText(formData.get("description")),
      product_type: normalizeText(formData.get("product_type") || "physical"),
      status: normalizeText(formData.get("status") || "draft"),
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

    if (!payload.name) {
      setMessage("Product name is required to save a draft.", true);
      return;
    }
    if (!payload.product_type) {
      setMessage("Product type is required.", true);
      return;
    }
    if (payload.status !== "draft" && ["hybrid", "external_only"].includes(payload.sale_channel) && !payload.external_listing_url) {
      setMessage("Add an external listing URL before activating hybrid or external-only items. Drafts can skip this.", true);
      return;
    }

    const originalButtonText = submitButton ? submitButton.textContent : "";

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = payload.status === "draft" ? "Saving draft…" : "Creating…";
      }

      const response = await window.DDAuth.apiFetch("/api/admin/create-product", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const data = await readApiJson(response, "Failed to create product.");

      setMessage(data.message || "Product draft saved successfully.");
      form.reset();
      form.dataset.mode = "create";
      resetCreateDefaults();
      await loadTaxClasses();
      syncRequiredFieldOutlines();

      document.dispatchEvent(new CustomEvent("dd:product-created", { detail: { product: data.product || null } }));
      document.dispatchEvent(new CustomEvent("dd:product-editor-target", {
        detail: { product: data.product || null, product_id: Number(data?.product?.product_id || 0) }
      }));
    } catch (error) {
      setMessage(error.message || "Failed to create product.", true);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText || "Create Product";
      }
    }
  });
});
