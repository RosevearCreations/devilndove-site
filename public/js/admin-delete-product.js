// File: /public/js/admin-delete-product.js
// Permanent deletion is for unused incorrect/test products only. Ordered or referenced
// products must remain in business history and are archived instead.

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("productsTableBody");
  if (!tableBody) return;

  function getRowProductId(button) {
    return Number(button.getAttribute("data-delete-product-id"));
  }

  function productLabel(button) {
    const name = String(button.getAttribute("data-product-name") || "this product").trim();
    const number = String(button.getAttribute("data-product-number") || "").trim();
    const sku = String(button.getAttribute("data-product-sku") || "").trim();
    return [name, number ? `DD${number}` : "", sku].filter(Boolean).join(" · ");
  }

  async function deleteProduct(productId, button, payload) {
    const originalText = button.textContent;
    try {
      button.disabled = true;
      button.textContent = "Deleting…";

      const response = await window.DDAuth.apiFetch("/api/admin/delete-product", {
        method: "POST",
        body: JSON.stringify({ product_id: productId, ...payload })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        const error = data?.error || "Delete failed.";
        if (data?.requires_archive) {
          throw new Error(`${error}\n\nUse Archive instead. Archive keeps the order/history record but removes the item from active storefront use.`);
        }
        throw new Error(error);
      }

      const cleanupNote = data?.r2_cleanup_note ? `\n\n${data.r2_cleanup_note}` : "";
      alert(`${data.message || "Product deleted successfully."}${cleanupNote}`);

      document.dispatchEvent(new CustomEvent("dd:product-deleted", {
        detail: { product: data.product || null, product_id: productId }
      }));
    } catch (error) {
      alert(error.message || "Delete failed.");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  tableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete-product-id]");
    if (!button) return;

    const productId = getRowProductId(button);
    if (!productId) {
      alert("Invalid product.");
      return;
    }

    const label = productLabel(button);
    const confirmed = window.confirm(
      `Delete ${label} permanently?\n\nOnly use this for an unused incorrect/test product. Products with orders or saved history cannot be deleted and should be archived instead.`
    );
    if (!confirmed) return;

    const confirmationPhrase = window.prompt(
      `Final safety check for ${label}.\n\nType DELETE PRODUCT exactly to permanently remove this unused product.`
    );
    if (confirmationPhrase === null) return;

    const deletionReason = window.prompt(
      "Why is this product being removed? This is saved in the deletion audit.",
      "Incorrect or duplicate entry"
    );
    if (deletionReason === null) return;

    const confirmPassword = window.prompt(
      "Enter your current admin password to confirm this permanent deletion."
    );
    if (confirmPassword === null) return;

    await deleteProduct(productId, button, {
      confirmation_phrase: confirmationPhrase,
      deletion_reason: deletionReason,
      confirm_password: confirmPassword
    });
  });
});
