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
      const inventoryQty = Number(product.inventory_quantity || 0);
      const inventory = escapeHtml(String(inventoryQty));
      const shipping = escapeHtml(yesNo(product.requires_shipping));
      const taxClass = escapeHtml(product.tax_class_name || product.tax_class_code || "");
      const isArchived = String(product.status || "").toLowerCase() === "archived";
      const lowStock = Number(product.low_stock_flag || 0) === 1;
      const ready = Number(product.is_ready_for_storefront || 0) === 1;
      const reviewStatus = escapeHtml(product.review_status || 'pending_review');
      const readyNotes = escapeHtml(product.ready_check_notes || '');
      const linkedResourceCount = Number(product.linked_resource_count || 0);
      const linkedResourceCost = escapeHtml(formatMoney(product.linked_resource_cost_cents || 0, product.currency));
      const grossMargin = escapeHtml(formatMoney(product.gross_margin_cents || 0, product.currency));
      const missingCostLinks = Number(product.missing_cost_links || 0);
      const buildableUnits = product.buildable_units_from_resources == null ? '' : String(Number(product.buildable_units_from_resources || 0));
      const shortageLinks = Number(product.resource_shortage_links || 0);

      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #ddd">${productId}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${name}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${slug}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${sku}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${type}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${status}<div class="small">Review: ${reviewStatus}</div><div class="small">${ready ? 'Ready for storefront' : 'Needs review'}</div></td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${price}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${inventory}<div class="small">${lowStock ? '⚠️ low stock' : 'healthy'}</div><div class="small">${ready ? 'Storefront ready' : readyNotes || 'Missing storefront fields'}</div><div class="small">Cost ${linkedResourceCost} • Margin ${grossMargin}</div><div class="small">${linkedResourceCount} linked resources${missingCostLinks ? ` • ${missingCostLinks} missing costs` : ''}</div><div class="small">${buildableUnits ? `Buildable units ${escapeHtml(buildableUnits)}` : 'Buildable units unknown'}${shortageLinks ? ` • ${shortageLinks} shortages` : ''}</div></td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${shipping}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">${taxClass}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd">
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn" type="button" data-edit-product-id="${productId}">
                Edit
              </button>
              <button class="btn" type="button" data-review-action="approve" data-product-id="${productId}">
                Approve
              </button>
              <button class="btn" type="button" data-review-action="request_changes" data-product-id="${productId}">
                Needs Changes
              </button>
              <button class="btn" type="button" data-review-action="publish" data-product-id="${productId}">
                Publish
              </button>
              <button class="btn" type="button" data-resource-action="reserve" data-product-id="${productId}">
                Reserve Resources
              </button>
              <button class="btn" type="button" data-resource-action="release" data-product-id="${productId}">
                Release Resources
              </button>
              <button
                class="btn"
                type="button"
                data-archive-product-id="${productId}"
                ${isArchived ? "disabled" : ""}
              >
                Archive
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

  document.addEventListener("dd:product-archived", async () => {
    await loadProducts({ silent: true });
  });

  async function runReviewAction(productId, action) {
    const note = window.prompt('Optional note for this review action:', '');
    const payload = { product_id: Number(productId || 0), action, note: String(note || '').trim() };
    if (action === 'publish' || action === 'unpublish') {
      const password = window.prompt('Confirm your admin password to continue:');
      if (!password) return;
      payload.confirm_password = password;
    }
    const response = await window.DDAuth.apiFetch('/api/admin/product-review-actions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok || !data?.ok) throw new Error(data?.error || `Failed to ${action} product.`);
    document.dispatchEvent(new CustomEvent('dd:product-updated', { detail: data.product || null }));
  }

  async function runResourceAction(productId, action) {
    const quantityInput = window.prompt('Quantity multiplier for linked resources:', '1');
    if (quantityInput === null) return;
    const quantityMultiplier = Math.max(1, Number(quantityInput || 1));
    if (!Number.isFinite(quantityMultiplier)) {
      throw new Error('Quantity multiplier must be a valid number.');
    }
    const note = window.prompt(`Optional note for ${action} resources:`, '') || '';
    const response = await window.DDAuth.apiFetch('/api/admin/site-item-inventory', {
      method: 'POST',
      body: JSON.stringify({
        action: action === 'reserve' ? 'reserve_product_resources' : 'release_product_resources',
        product_id: Number(productId || 0),
        quantity_multiplier: quantityMultiplier,
        note: String(note).trim()
      })
    });
    const data = await response.json();
    if (!response.ok || !data?.ok) throw new Error(data?.error || `Failed to ${action} resources.`);
    const summary = data.summary || {};
    window.alert(`${action === 'reserve' ? 'Reserved' : 'Released'} resources for ${data.product?.name || 'product'}.
Affected items: ${Number(summary.affected_items || 0)}
Shortage items: ${Number(summary.shortage_item_count || 0)}`);
    document.dispatchEvent(new CustomEvent('dd:product-updated', { detail: data.product || null }));
  }

  document.addEventListener('click', async (event) => {
    const reviewButton = event.target.closest('[data-review-action]');
    const resourceButton = event.target.closest('[data-resource-action]');
    if (!reviewButton && !resourceButton) return;
    if (!window.DDAuth || !window.DDAuth.isLoggedIn()) return;
    if (reviewButton) {
      const productId = Number(reviewButton.getAttribute('data-product-id') || 0);
      const action = String(reviewButton.getAttribute('data-review-action') || '').trim();
      if (!productId || !action) return;
      try {
        await runReviewAction(productId, action);
        await loadProducts({ silent: true });
      } catch (error) {
        if (errorEl) errorEl.textContent = error.message || `Failed to ${action} product.`;
        show(errorEl);
      }
      return;
    }
    const productId = Number(resourceButton.getAttribute('data-product-id') || 0);
    const action = String(resourceButton.getAttribute('data-resource-action') || '').trim();
    if (!productId || !action) return;
    try {
      await runResourceAction(productId, action);
      await loadProducts({ silent: true });
    } catch (error) {
      if (errorEl) errorEl.textContent = error.message || `Failed to ${action} product resources.`;
      show(errorEl);
    }
  });

  if (!window.DDAuth || !window.DDAuth.isLoggedIn()) {
    return;
  }

  await loadProducts();
});
