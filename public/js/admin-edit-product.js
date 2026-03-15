// File: /public/js/admin-edit-product.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("createProductForm");
  const messageEl = document.getElementById("createProductMessage");
  const submitButton = form ? form.querySelector('button[type="submit"]') : null;
  const productsTableBody = document.getElementById("productsTableBody");

  if (!form || !productsTableBody) return;

  let editingProductId = null;

  function setMessage(message, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.style.display = "block";
    messageEl.style.color = isError ? "#b00020" : "#0a7a2f";
  }

  function clearMessage() {
    if (!messageEl) return;
    messageEl.textContent = "";
    messageEl.style.display = "none";
  }

  function centsToDollars(value) {
    const cents = Number(value || 0);
    if (!Number.isFinite(cents)) return "";
    return (cents / 100).toFixed(2);
  }

  function setField(name, value) {
    const field = form.elements.namedItem(name);
    if (!field) return;
    field.value = value == null ? "" : String(value);
  }

  function getImageUrlFields() {
    return [
      form.elements.namedItem("image_url_1"),
      form.elements.namedItem("image_url_2"),
      form.elements.namedItem("image_url_3"),
      form.elements.namedItem("image_url_4"),
      form.elements.namedItem("image_url_5")
    ].filter(Boolean);
  }

  function resetImageUrlFields() {
    getImageUrlFields().forEach(field => {
      field.value = "";
    });
  }

  function resetFormState() {
    form.reset();
    resetImageUrlFields();
    editingProductId = null;
    form.dataset.mode = "create";

    if (submitButton) {
      submitButton.textContent = "Create Product";
      submitButton.disabled = false;
    }

    const cancelButton = document.getElementById("cancelProductEdit");
    if (cancelButton) {
      cancelButton.style.display = "none";
    }
  }

  function ensureCancelButton() {
    let cancelButton = document.getElementById("cancelProductEdit");
    if (cancelButton) return cancelButton;

    cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.id = "cancelProductEdit";
    cancelButton.className = "btn";
    cancelButton.textContent = "Cancel Edit";
    cancelButton.style.marginLeft = "10px";

    if (submitButton && submitButton.parentNode) {
      submitButton.parentNode.appendChild(cancelButton);
    }

    cancelButton.addEventListener("click", () => {
      clearMessage();
      resetFormState();
    });

    return cancelButton;
  }

  function setFormModeEdit() {
    form.dataset.mode = "edit";

    if (submitButton) {
      submitButton.textContent = "Update Product";
    }

    const cancelButton = ensureCancelButton();
    cancelButton.style.display = "";
  }

  function fillForm(product, images) {
    setField("name", product.name || "");
    setField("slug", product.slug || "");
    setField("sku", product.sku || "");
    setField("short_description", product.short_description || "");
    setField("description", product.description || "");
    setField("product_type", product.product_type || "physical");
    setField("status", product.status || "draft");
    setField("currency", product.currency || "CAD");
    setField("price", centsToDollars(product.price_cents));
    setField(
      "compare_at_price",
      product.compare_at_price_cents == null ? "" : centsToDollars(product.compare_at_price_cents)
    );
    setField("taxable", Number(product.taxable) === 0 ? "0" : "1");
    setField("tax_class_id", product.tax_class_id == null ? "" : product.tax_class_id);
    setField("requires_shipping", Number(product.requires_shipping) === 1 ? "1" : "0");
    setField("weight_grams", product.weight_grams == null ? "" : product.weight_grams);
    setField("inventory_tracking", Number(product.inventory_tracking) === 1 ? "1" : "0");
    setField("inventory_quantity", product.inventory_quantity == null ? "0" : product.inventory_quantity);
    setField("digital_file_url", product.digital_file_url || "");
    setField("featured_image_url", product.featured_image_url || "");
    setField("sort_order", product.sort_order == null ? "0" : product.sort_order);

    resetImageUrlFields();

    const imageFields = getImageUrlFields();
    const safeImages = Array.isArray(images) ? images.slice(0, 5) : [];

    for (let i = 0; i < imageFields.length; i += 1) {
      imageFields[i].value = safeImages[i]?.image_url || "";
    }
  }

  async function loadProduct(productId) {
    const response = await window.DDAuth.apiFetch(
      `/api/admin/product-detail?product_id=${encodeURIComponent(productId)}`,
      { method: "GET" }
    );

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Failed to load product.");
    }

    return data;
  }

  async function updateProduct(payload) {
    const response = await window.DDAuth.apiFetch("/api/admin/update-product", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Failed to update product.");
    }

    return data;
  }

  productsTableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-edit-product-id]");
    if (!button) return;

    const productId = Number(button.getAttribute("data-edit-product-id"));
    if (!productId) {
      setMessage("Invalid product id.", true);
      return;
    }

    const originalText = button.textContent;

    try {
      clearMessage();
      button.disabled = true;
      button.textContent = "Loading...";

      const data = await loadProduct(productId);

      editingProductId = productId;
      fillForm(data.product || {}, data.images || []);
      setFormModeEdit();
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      setMessage("Product loaded for editing.");
    } catch (error) {
      setMessage(error.message || "Failed to load product.", true);
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });

  form.addEventListener("submit", async (event) => {
    if (form.dataset.mode !== "edit") return;

    event.preventDefault();
    clearMessage();

    if (!editingProductId) {
      setMessage("No product selected for editing.", true);
      return;
    }

    const formData = new FormData(form);

    const parseMoney = (value) => {
      const normalized = String(value || "").trim();
      if (!normalized) return 0;
      const amount = Number(normalized);
      if (!Number.isFinite(amount) || amount < 0) return NaN;
      return Math.round(amount * 100);
    };

    const price_cents = parseMoney(formData.get("price"));
    const compareRaw = String(formData.get("compare_at_price") || "").trim();
    const compare_at_price_cents = compareRaw ? parseMoney(compareRaw) : null;

    if (Number.isNaN(price_cents)) {
      setMessage("Price must be a valid amount.", true);
      return;
    }

    if (compare_at_price_cents !== null && Number.isNaN(compare_at_price_cents)) {
      setMessage("Compare-at price must be a valid amount.", true);
      return;
    }

    const image_urls = [
      String(formData.get("image_url_1") || "").trim(),
      String(formData.get("image_url_2") || "").trim(),
      String(formData.get("image_url_3") || "").trim(),
      String(formData.get("image_url_4") || "").trim(),
      String(formData.get("image_url_5") || "").trim()
    ].filter(Boolean);

    const payload = {
      product_id: editingProductId,
      name: String(formData.get("name") || "").trim(),
      slug: String(formData.get("slug") || "").trim(),
      sku: String(formData.get("sku") || "").trim(),
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
      image_urls
    };

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Updating...";
      }

      const data = await updateProduct(payload);

      setMessage(data.message || "Product updated successfully.");
      resetFormState();

      document.dispatchEvent(new CustomEvent("dd:product-updated", {
        detail: {
          product: data.product || null
        }
      }));
    } catch (error) {
      setMessage(error.message || "Failed to update product.", true);
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Update Product";
      }
    }
  });

  document.addEventListener("dd:product-deleted", (event) => {
    const deletedProductId = Number(event?.detail?.product_id || 0);
    if (editingProductId && deletedProductId === editingProductId) {
      clearMessage();
      resetFormState();
      setMessage("The product being edited was deleted.");
    }
  });

  resetFormState();
});
