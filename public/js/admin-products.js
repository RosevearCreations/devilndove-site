// File: /public/js/admin-products.js

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("productsTableBody");
  const emptyEl = document.getElementById("productsEmpty");
  const errorEl = document.getElementById("productsError");
  const loadingEl = document.getElementById("productsLoading");
  const refreshButtons = document.querySelectorAll("[data-refresh-products]");

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

  function renderRows(products) {
    if (!tableBody) return;

    tableBody.innerHTML = products.map(product => {
      const productId = Number(product.product_id);
      const name = escapeHtml(product.name || "");
      const slug = escapeHtml(product.slug || "");
      const sku = escapeHtml(product.sku || "");
      const type = escapeHtml(product.product_type || "");
      const status = escapeHtml(product.status || "");
      const price = escapeHtml(formatMoney(product.price_cents, product.currency));
      const inventory = escapeHtml(String(Number(product.inventory_quantity || 0)));
      const shipping = escapeHtml(yesNo(product.requires_shipping));
      const taxClass = escapeHtml(product.tax_class_name || product.tax_class_code || "");

      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #ddd">${productId}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${name}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${slug}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${sku}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${type}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${status}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${price}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${inventory}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${shipping}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${taxClass}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn" type="button" data-edit-product-id="${productId}">
                Edit
              </button>
              <button class="btn" type="button" data-delete-product-id="${productId}">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  async function loadProducts(options = {}) {
    const { silent = false } = options;

    hide(emptyEl);
    hide(errorEl);

    if (!silent) {
      show(loadingEl);
    }

    try {
      const response = await window.DDAuth.apiFetch("/api/admin/products", {
        method: "GET"
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to load products.");
      }

      const products = Array.isArray(data.products) ? data.products : [];

      if (!products.length) {
        if (tableBody) tableBody.innerHTML = "";
        show(emptyEl);
        return;
      }

      renderRows(products);
    } catch (error) {
      if (tableBody) tableBody.innerHTML = "";
      if (errorEl) {
        errorEl.textContent = error.message || "Failed to load products.";
      }
      show(errorEl);
    } finally {
      hide(loadingEl);
    }
  }

  refreshButtons.forEach(button => {
    button.addEventListener("click", async () => {
      await loadProducts();
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

  if (!window.DDAuth || !window.DDAuth.isLoggedIn()) {
    return;
  }

  await loadProducts();
});
