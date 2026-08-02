// File: /public/js/admin-delete-product.js
// Build 232: safe removal-preflight parsing for JSON and Cloudflare platform errors.
// Permanent deletion is for unused incorrect/test products only. Ordered or referenced
// products must remain in business history and are archived instead.

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("productsTableBody");
  if (!tableBody) return;

  async function readApiJson(response, fallbackMessage) {
    if (window.DDAuth?.readApiJson) return window.DDAuth.readApiJson(response, { fallbackMessage });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || fallbackMessage);
    return data;
  }

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

      const data = await readApiJson(response, 'Delete failed.');

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
    if (!productId) return alert("Invalid product.");
    const label = productLabel(button);
    const draftCleanup = button.getAttribute('data-draft-cleanup') === '1';

    try {
      button.disabled = true;
      button.textContent = 'Checking…';
      const previewResponse = await window.DDAuth.apiFetch(`/api/admin/delete-product?product_id=${encodeURIComponent(productId)}`);
      const preview = await readApiJson(previewResponse, 'Could not check this product.');
      if (String(preview.product?.status || '').toLowerCase() !== 'draft' && draftCleanup) {
        throw new Error('Only draft products use the duplicate-draft cleanup action. Archive or use the full correction workflow for other products.');
      }
      if (Number(preview.deletion_allowed || 0) !== 1) {
        const refs = (preview.blocking_references || []).map((row) => `${row.count} ${row.table_name}`).join(', ');
        throw new Error(`This product has saved history${refs ? ` (${refs})` : ''} and cannot be permanently removed. Archive it instead.`);
      }
      const linkedMaterials = Array.isArray(preview.materials) ? preview.materials : [];
      const materialReviewRows = Array.isArray(preview.materials_requiring_review) ? preview.materials_requiring_review : [];
      if (materialReviewRows.length) {
        throw new Error('This draft has linked material rows that may involve reserved stock. Use Correct / remove so reservation releases or physical returns can be reviewed.');
      }
      const recipeNote = linkedMaterials.length
        ? `\n\n${linkedMaterials.length} linked recipe/material row(s) will be removed with the duplicate. Main inventory quantities will not be changed.`
        : '';
      if (!window.confirm(`${draftCleanup ? 'Remove duplicate draft' : 'Delete unused product'}: ${label}?\n\nThis permanently removes only this unused record. Product numbers are not reused.${recipeNote}`)) return;
      const confirmationPhrase = window.prompt(`Type DELETE PRODUCT exactly to remove ${label}.`);
      if (confirmationPhrase === null) return;
      const confirmPassword = window.prompt('Enter your current admin password to authorize this permanent cleanup.');
      if (confirmPassword === null) return;
      await deleteProduct(productId, button, {
        confirmation_phrase: confirmationPhrase,
        deletion_reason: draftCleanup ? 'Duplicate draft created during data entry.' : 'Incorrect or unused product entry.',
        confirm_password: confirmPassword
      });
    } catch (error) {
      alert(error.message || 'Delete check failed.');
    } finally {
      button.disabled = false;
      button.textContent = draftCleanup ? 'Remove duplicate draft' : 'Delete unused';
    }
  });
});
