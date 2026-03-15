// File: /public/js/shop.js

document.addEventListener("DOMContentLoaded", async () => {
  const loadingEl = document.getElementById("shopLoading");
  const errorEl = document.getElementById("shopError");
  const emptyEl = document.getElementById("shopEmpty");
  const productsEl = document.getElementById("shopProducts");

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

  function renderProducts(products) {
    if (!productsEl) return;

    productsEl.innerHTML = products.map(product => {
      const productId = Number(product.product_id);
      const name = escapeHtml(product.name || "");
      const slug = encodeURIComponent(product.slug || "");
      const shortDescription = escapeHtml(product.short_description || "");
      const productType = escapeHtml(product.product_type || "");
      const price = escapeHtml(formatMoney(product.price_cents, product.currency));
      const imageUrl = String(product.featured_image_url || "").trim();

      const imageMarkup = imageUrl
        ? `<img
             src="${escapeHtml(imageUrl)}"
             alt="${name}"
             style="width:100%;aspect-ratio:1 / 1;object-fit:cover;border-radius:12px;margin-bottom:12px"
           />`
        : `<div
             style="width:100%;aspect-ratio:1 / 1;border-radius:12px;margin-bottom:12px;display:flex;align-items:center;justify-content:center;border:1px solid #ddd"
             class="small"
           >
             No Image
           </div>`;

      return `
        <article class="card">
          ${imageMarkup}

          <div class="small" style="text-transform:capitalize;opacity:.8">${productType}</div>
          <h3 style="margin:8px 0 6px 0">${name}</h3>
          <div style="font-weight:700;margin-bottom:10px">${price}</div>

          <p class="small" style="min-height:48px">
            ${shortDescription || "No description available yet."}
          </p>

          <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">
            <a class="btn" href="/shop/product/?slug=${slug}">View</a>
            <button
              class="btn"
              type="button"
              data-add-shop-cart-id="${productId}"
            >
              Add to Cart
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  async function loadProducts() {
    hide(errorEl);
    hide(emptyEl);
    hide(productsEl);
    show(loadingEl);

    try {
      const response = await fetch("/api/products", {
        method: "GET"
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to load products.");
      }

      const products = Array.isArray(data.products) ? data.products : [];

      if (!products.length) {
        show(emptyEl);
        return;
      }

      renderProducts(products);
      show(productsEl);

      productsEl.querySelectorAll("[data-add-shop-cart-id]").forEach(button => {
        button.addEventListener("click", () => {
          if (!window.DDCart) {
            alert("Cart is not available right now.");
            return;
          }

          const productId = Number(button.getAttribute("data-add-shop-cart-id"));
          const product = products.find(item => Number(item.product_id) === productId);

          if (!product) {
            alert("Product could not be added.");
            return;
          }

          try {
            window.DDCart.addToCart(product, 1);
            alert("Added to cart.");
          } catch (error) {
            alert(error.message || "Failed to add item to cart.");
          }
        });
      });
    } catch (error) {
      if (errorEl) {
        errorEl.textContent = error.message || "Failed to load products.";
      }
      show(errorEl);
    } finally {
      hide(loadingEl);
    }
  }

  await loadProducts();
});
