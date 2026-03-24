// File: /public/js/product-detail.js
// Brief description: Renders one storefront product with SEO-aware media handling,
// gallery metadata, and add-to-cart support.

document.addEventListener("DOMContentLoaded", async () => {
  const loadingEl = document.getElementById("productLoading");
  const errorEl = document.getElementById("productError");
  const detailEl = document.getElementById("productDetail");
  const productTypeEl = document.getElementById("productType");
  const productNameEl = document.getElementById("productName");
  const productPriceEl = document.getElementById("productPrice");
  const productShortDescriptionEl = document.getElementById("productShortDescription");
  const productKeywordTagsEl = document.getElementById("productKeywordTags");
  const pageH1El = document.getElementById("pageH1");
  const pageIntroEl = document.getElementById("pageIntro");
  const productSkuEl = document.getElementById("productSku");
  const productShippingEl = document.getElementById("productShipping");
  const productTaxClassEl = document.getElementById("productTaxClass");
  const productInventoryEl = document.getElementById("productInventory");
  const productDescriptionEl = document.getElementById("productDescription");
  const productMainImageWrapEl = document.getElementById("productMainImageWrap");
  const productGalleryEl = document.getElementById("productGallery");
  const productQuantityEl = document.getElementById("productQuantity");
  const addToCartButton = document.getElementById("addToCartButton");
  const addToCartMessageEl = document.getElementById("addToCartMessage");
  let currentProduct = null;

  function show(el) { if (el) el.style.display = ""; }
  function hide(el) { if (el) el.style.display = "none"; }
  function setCartMessage(message, isError = false) {
    if (!addToCartMessageEl) return;
    addToCartMessageEl.textContent = message;
    addToCartMessageEl.style.display = "block";
    addToCartMessageEl.style.color = isError ? "#b00020" : "#0a7a2f";
  }
  function clearCartMessage() { if (addToCartMessageEl) { addToCartMessageEl.textContent = ""; addToCartMessageEl.style.display = "none"; } }
  function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function formatMoney(cents, currency = "CAD") { const amount = Number(cents || 0) / 100; try { return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "CAD" }).format(amount); } catch { return `${amount.toFixed(2)} ${currency || "CAD"}`; } }
  function yesNo(value) { return Number(value) === 1 ? "Yes" : "No"; }

  function renderMainImage(product, images) {
    if (!productMainImageWrapEl) return;
    const featured = String(product.featured_image_url || "").trim();
    const featuredRow = Array.isArray(images) ? images.find((row) => String(row.image_url || '').trim() === featured) : null;
    const mainRow = featuredRow || (Array.isArray(images) && images.length ? images[0] : null);
    const mainImageUrl = String(mainRow?.image_url || featured || "").trim();
    const caption = String(mainRow?.caption || '').trim();
    if (!mainImageUrl) {
      productMainImageWrapEl.innerHTML = `<div class="card" style="width:100%;aspect-ratio:1 / 1;display:flex;align-items:center;justify-content:center"><span class="small">No Image</span></div>`;
      return;
    }
    productMainImageWrapEl.innerHTML = `
      <div>
        <img src="${escapeHtml(mainImageUrl)}" alt="${escapeHtml(mainRow?.alt_text || product.name || 'Product image')}" style="width:100%;aspect-ratio:1 / 1;object-fit:cover;border-radius:12px" />
        ${caption ? `<div class="small" style="margin-top:8px">${escapeHtml(caption)}</div>` : ''}
      </div>`;
  }

  function renderGallery(images, productName) {
    if (!productGalleryEl) return;
    const safeImages = Array.isArray(images) ? images : [];
    if (!safeImages.length) { productGalleryEl.innerHTML = ""; return; }
    productGalleryEl.innerHTML = safeImages.map((image, index) => `
      <figure style="margin:0">
        <img src="${escapeHtml(image.image_url || "")}" alt="${escapeHtml(image.alt_text || `${productName} image ${index + 1}`)}" title="${escapeHtml(image.image_title || image.caption || '')}" style="width:100%;aspect-ratio:1 / 1;object-fit:cover;border-radius:10px" />
        ${image.caption ? `<figcaption class="small" style="margin-top:6px">${escapeHtml(image.caption)}</figcaption>` : ''}
      </figure>`).join("");
  }

  function renderProduct(product, images) {
    currentProduct = product || null;
    if (productTypeEl) productTypeEl.textContent = product.product_type || "";
    if (productNameEl) productNameEl.textContent = product.name || "";
    if (pageH1El) pageH1El.textContent = product.h1_override || product.name || 'Product Details';
    if (pageIntroEl) pageIntroEl.textContent = product.meta_description || product.short_description || 'View the full details for this Devil n Dove item.';
    if (productPriceEl) productPriceEl.textContent = formatMoney(product.price_cents, product.currency);
    if (productShortDescriptionEl) productShortDescriptionEl.textContent = product.short_description || product.meta_description || "No short description available.";
    if (productKeywordTagsEl) productKeywordTagsEl.textContent = product.keywords ? `Keywords: ${product.keywords}` : '';
    if (productSkuEl) productSkuEl.textContent = product.sku || "—";
    if (productShippingEl) productShippingEl.textContent = yesNo(product.requires_shipping);
    if (productTaxClassEl) productTaxClassEl.textContent = product.tax_class_name || product.tax_class_code || "—";
    if (productInventoryEl) {
      const tracking = Number(product.inventory_tracking) === 1;
      const quantity = Number(product.inventory_quantity || 0);
      productInventoryEl.textContent = tracking ? String(quantity) : "Not tracked";
    }
    if (productDescriptionEl) {
      const description = String(product.description || "").trim();
      productDescriptionEl.innerHTML = description ? `<p>${escapeHtml(description).replaceAll("\n", "<br>")}</p>` : `<p class="small">No full description available.</p>`;
    }
    renderMainImage(product, images);
    renderGallery(images, product.name || "Product");
  }

  async function loadProduct() {
    hide(errorEl);
    hide(detailEl);
    show(loadingEl);
    try {
      const url = new URL(window.location.href);
      const slug = String(url.searchParams.get("slug") || "").trim();
      if (!slug) throw new Error("No product slug was provided.");
      const response = await fetch(`/api/product-detail?slug=${encodeURIComponent(slug)}`, { method: "GET" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Failed to load product.");
      renderProduct(data.product || {}, data.images || []);
      document.title = `${data.product?.meta_title || data.product?.name || "Product"} — Devil n Dove`;
      const desc = document.querySelector('meta[name="description"]'); if (desc) desc.setAttribute('content', data.product?.meta_description || data.product?.short_description || 'View product details from Devil n Dove.');
      const canon = document.querySelector('link[rel="canonical"]'); if (canon) canon.setAttribute('href', data.product?.canonical_url || window.location.href);
      if (data.product) {
        const schema = {
          '@context': 'https://schema.org',
          '@type': data.product.schema_type || 'Product',
          name: data.product.name,
          description: data.product.meta_description || data.product.short_description || data.product.description || '',
          sku: data.product.sku || undefined,
          image: (data.images || []).map((row) => row.image_url).filter(Boolean),
          offers: { '@type': 'Offer', priceCurrency: data.product.currency || 'CAD', price: (Number(data.product.price_cents || 0) / 100).toFixed(2), availability: Number(data.product.inventory_quantity || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: window.location.href }
        };
        let script = document.getElementById('productStructuredData');
        if (!script) { script = document.createElement('script'); script.type = 'application/ld+json'; script.id = 'productStructuredData'; document.head.appendChild(script); }
        script.textContent = JSON.stringify(schema);
      }
      show(detailEl);
    } catch (error) {
      if (errorEl) errorEl.textContent = error.message || 'Failed to load product.';
      show(errorEl);
    } finally {
      hide(loadingEl);
    }
  }

  if (addToCartButton) {
    addToCartButton.addEventListener("click", () => {
      clearCartMessage();
      if (!window.DDCart) return setCartMessage("Cart is not available right now.", true);
      if (!currentProduct || !currentProduct.product_id) return setCartMessage("Product is not ready to add to cart.", true);
      const quantity = Number(productQuantityEl?.value || 1);
      if (!Number.isInteger(quantity) || quantity <= 0) return setCartMessage("Please enter a valid quantity.", true);
      try {
        window.DDCart.addToCart(currentProduct, quantity);
        setCartMessage("Added to cart successfully.");
        if (productQuantityEl) productQuantityEl.value = "1";
      } catch (error) {
        setCartMessage(error.message || "Failed to add item to cart.", true);
      }
    });
  }

  await loadProduct();
});
