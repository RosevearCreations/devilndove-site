// Devil n Dove Build 440 — Product Delete Reference Inspector.
// Permanent deletion remains limited to unused products. Protected business/customer/history
// references are inspected, opened in their owning workspace, or resolved by archiving the product.

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("productsTableBody");
  if (!tableBody) return;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));

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

  function ensureInspectorStyle() {
    if (document.getElementById('ddProductReferenceInspectorStyle')) return;
    const style = document.createElement('style');
    style.id = 'ddProductReferenceInspectorStyle';
    style.textContent = `
      .dd-product-ref-backdrop{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.68);display:flex;align-items:flex-start;justify-content:center;padding:5vh 16px;overflow:auto}
      .dd-product-ref-dialog{width:min(900px,100%);max-height:90vh;overflow:auto;background:var(--card,#171717);border:1px solid var(--border,#444);border-radius:16px;box-shadow:0 20px 70px rgba(0,0,0,.45);padding:18px}
      .dd-product-ref-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
      .dd-product-ref-head h2{margin:0 0 6px}.dd-product-ref-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
      .dd-product-ref-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;margin-top:14px}
      .dd-product-ref-card{border:1px solid var(--border,#444);border-radius:12px;padding:12px;background:rgba(255,255,255,.025)}
      .dd-product-ref-card strong{display:block;margin-bottom:4px}.dd-product-ref-card code{font-size:.8em;overflow-wrap:anywhere}
      .dd-product-ref-count{font-weight:800;font-size:1.15rem}.dd-product-ref-note{margin-top:12px;padding:10px 12px;border-radius:10px;background:rgba(255,185,0,.08);border:1px solid rgba(255,185,0,.3)}
      body.dd-product-ref-open{overflow:hidden}
      @media(max-width:640px){.dd-product-ref-backdrop{padding:0}.dd-product-ref-dialog{min-height:100vh;max-height:none;border-radius:0}.dd-product-ref-head{flex-direction:column}.dd-product-ref-actions .btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function referenceMeta(reference, productId) {
    const table = String(reference?.table_name || '').toLowerCase();
    const recordId = Number(reference?.record_id || 0);
    const map = {
      order_items: { label: 'Customer order history', href: '/admin/orders/', help: 'Orders are permanent customer/business history. The product should be archived, not detached from an order.' },
      product_production_runs: { label: 'Finished production history', href: `/admin/creative-process/?product_id=${encodeURIComponent(productId)}`, help: 'A finished-production record exists. Review production/reversal history before changing product lifecycle state.' },
      creative_project_cost_allocations: { label: 'Creative project cost allocation', href: `/admin/creative-process/?product_id=${encodeURIComponent(productId)}`, help: 'Creative project costing references this product and must remain auditable.' },
      accounting_overhead_product_allocations: { label: 'Accounting allocation', href: '/admin/accounting/', help: 'Accounting history references this product and must not be erased by product cleanup.' },
      packaging_projects: { label: 'Packaging project', href: `/admin/packaging-studio/?product_id=${encodeURIComponent(productId)}`, help: 'Packaging work references this product. Keep the product identity and archive it if no longer active.' },
      product_bundle_components: { label: 'Product bundle', href: `/admin/products/?product_id=${encodeURIComponent(productId)}`, help: 'This product is used as a component of another product/bundle.' },
      marketplace_margin_override_history: { label: 'Marketplace margin history', href: `/admin/catalog/?product_id=${encodeURIComponent(productId)}`, help: 'Reviewed marketplace pricing/margin history must remain attached to the product identity.' },
      approved_before_after_gallery_items: { label: 'Approved gallery evidence', href: '/admin/media-content-studio/', help: 'Approved public/gallery evidence references this product.' },
      customer_story_approval_batches: { label: 'Customer story approval', href: '/admin/content-studio/', help: 'Customer-approved story history must be preserved.' },
      customer_story_output_drafts: { label: 'Customer story output', href: '/admin/content-studio/', help: 'Content output history references this product.' },
      public_proof_candidates: { label: 'Public proof candidate', href: '/admin/content-studio/', help: 'Reviewed proof/content evidence references this product.' },
      recall_customer_match_previews: { label: 'Recall/customer match history', href: '/admin/orders/', help: 'Customer safety/recall history must remain auditable.' },
      trust_block_items: { label: 'Trust / compliance block', href: '/admin/readiness/', help: 'A trust/compliance record explicitly references this product.' },
      content_projects: { label: 'Content Studio project', href: recordId ? `/admin/content-studio/?content_project_id=${recordId}` : '/admin/content-studio/', help: reference?.reason || 'Reviewed Content Studio work references this product.' },
      creative_projects: { label: 'CAIP / Creative project', href: recordId ? `/admin/creative-assets/?creative_project_id=${recordId}` : '/admin/creative-assets/', help: reference?.reason || 'Reviewed CAIP/Creative work references this product.' },
    };
    const fallback = {
      label: table ? table.replace(/_/g, ' ') : 'Protected reference',
      href: `/admin/products/?product_id=${encodeURIComponent(productId)}`,
      help: reference?.reason || 'This is protected application history. Inspect it before changing the product lifecycle state.'
    };
    return map[table] || fallback;
  }

  function closeInspector() {
    document.getElementById('ddProductReferenceInspector')?.remove();
    document.body.classList.remove('dd-product-ref-open');
  }

  async function archiveFromInspector(productId, productName, button) {
    if (!confirm(`Archive ${productName || `product #${productId}`}?\n\nArchiving preserves the protected references and removes the product from active storefront use.`)) return;
    const original = button?.textContent || 'Archive product instead';
    if (button) { button.disabled = true; button.textContent = 'Archiving…'; }
    try {
      const response = await window.DDAuth.apiFetch('/api/admin/archive-product', {
        method: 'POST',
        body: JSON.stringify({ product_id: Number(productId) })
      });
      const data = await readApiJson(response, 'Product could not be archived.');
      document.dispatchEvent(new CustomEvent('dd:product-archived', { detail: { product_id: Number(productId), product: data.product || null } }));
      closeInspector();
      alert(data.message || 'Product archived. Protected history was preserved.');
    } finally {
      if (button?.isConnected) { button.disabled = false; button.textContent = original; }
    }
  }

  function renderInspector(preview, options = {}) {
    ensureInspectorStyle();
    closeInspector();
    const product = preview?.product || {};
    const productId = Number(product.product_id || options.productId || 0);
    const blockers = Array.isArray(preview?.blocking_references) ? preview.blocking_references : [];
    const safe = Array.isArray(preview?.automatically_safe_references) ? preview.automatically_safe_references : [];
    const name = String(product.name || options.productName || `Product #${productId}`).trim();
    const container = document.createElement('div');
    container.id = 'ddProductReferenceInspector';
    container.className = 'dd-product-ref-backdrop';
    container.setAttribute('role', 'presentation');
    container.innerHTML = `<section class="dd-product-ref-dialog" role="dialog" aria-modal="true" aria-labelledby="ddProductRefTitle">
      <div class="dd-product-ref-head">
        <div>
          <p class="eyebrow">Build 440 · Commerce &amp; Operations</p>
          <h2 id="ddProductRefTitle">Product Delete Reference Inspector</h2>
          <p class="small"><strong>${esc(name)}</strong>${product.product_number ? ` · DD${esc(product.product_number)}` : ''}${product.sku ? ` · ${esc(product.sku)}` : ''}</p>
        </div>
        <button class="btn secondary" type="button" data-dd-product-ref-close>Close</button>
      </div>
      <div class="dd-product-ref-note"><strong>Permanent removal is blocked because this product has saved business/history references.</strong><br/><span class="small">Do not delete those records simply to make the product removable. Open the owning workspace to inspect them, or archive the product so customer/accounting/creative history remains intact.</span></div>
      <div class="dd-product-ref-grid">
        ${blockers.map((reference) => {
          const meta = referenceMeta(reference, productId);
          return `<article class="dd-product-ref-card">
            <span class="dd-product-ref-count">${Number(reference.count || 0)} record${Number(reference.count || 0) === 1 ? '' : 's'}</span>
            <strong>${esc(meta.label)}</strong>
            <p class="small">${esc(meta.help)}</p>
            <code>${esc(reference.table_name || '')}.${esc(reference.column_name || 'product_id')}</code>
            <div class="dd-product-ref-actions" style="margin-top:10px"><a class="btn secondary" href="${esc(meta.href)}">Open related area</a></div>
          </article>`;
        }).join('') || '<p class="small">No blocking rows were returned. Refresh the preflight before attempting permanent removal.</p>'}
      </div>
      ${safe.length ? `<details style="margin-top:14px"><summary><strong>${safe.length} automatically safe generated reference${safe.length === 1 ? '' : 's'}</strong></summary><p class="small">These are unreviewed product-owned automation shells. They do not block an otherwise-safe deletion.</p>${safe.map((reference) => `<div class="small">${esc(reference.table_name || 'generated row')} ${reference.record_id ? `#${Number(reference.record_id)}` : ''} — ${esc(reference.reason || 'auto-generated unreviewed shell')}</div>`).join('')}</details>` : ''}
      <div class="dd-product-ref-actions" style="margin-top:16px">
        <button class="btn" type="button" data-dd-product-ref-refresh>Refresh references</button>
        <button class="btn primary" type="button" data-dd-product-ref-archive>Archive product instead</button>
      </div>
    </section>`;
    document.body.appendChild(container);
    document.body.classList.add('dd-product-ref-open');
    container.querySelector('[data-dd-product-ref-close]')?.focus();
    container.addEventListener('click', async (event) => {
      if (event.target === container || event.target.closest('[data-dd-product-ref-close]')) return closeInspector();
      const refresh = event.target.closest('[data-dd-product-ref-refresh]');
      const archive = event.target.closest('[data-dd-product-ref-archive]');
      if (refresh) {
        refresh.disabled = true; refresh.textContent = 'Refreshing…';
        try {
          const response = await window.DDAuth.apiFetch(`/api/admin/delete-product?product_id=${encodeURIComponent(productId)}`, { cache: 'no-store' });
          const data = await readApiJson(response, 'Could not refresh product references.');
          if (Number(data.deletion_allowed || 0) === 1) {
            closeInspector();
            alert('Protected references are now clear. Run the normal removal preflight again before deleting.');
          } else {
            renderInspector(data, { productId, productName: name });
          }
        } catch (error) {
          alert(error.message || 'Could not refresh references.');
        }
      }
      if (archive) {
        try { await archiveFromInspector(productId, name, archive); }
        catch (error) { alert(error.message || 'Archive failed.'); }
      }
    });
    return container;
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.getElementById('ddProductReferenceInspector')) closeInspector();
  });

  window.DDProductReferenceInspector = Object.freeze({
    open: (preview, options = {}) => renderInspector(preview, options),
    close: closeInspector,
  });

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
      const previewResponse = await window.DDAuth.apiFetch(`/api/admin/delete-product?product_id=${encodeURIComponent(productId)}`, { cache: 'no-store' });
      const preview = await readApiJson(previewResponse, 'Could not check this product.');
      if (String(preview.product?.status || '').toLowerCase() !== 'draft' && draftCleanup) {
        throw new Error('Only draft products use the duplicate-draft cleanup action. Archive or use the full correction workflow for other products.');
      }
      if (Number(preview.deletion_allowed || 0) !== 1) {
        renderInspector(preview, { productId, productName: label });
        return;
      }
      const linkedMaterials = Array.isArray(preview.materials) ? preview.materials : [];
      const materialReviewRows = Array.isArray(preview.materials_requiring_review) ? preview.materials_requiring_review : [];
      if (materialReviewRows.length) {
        throw new Error('This draft has linked material rows that may involve reserved stock. Use Correct / remove so reservation releases or physical returns can be reviewed.');
      }
      const recipeNote = linkedMaterials.length
        ? `\n\n${linkedMaterials.length} linked recipe/material row(s) will be removed with the duplicate. Main inventory quantities will not be changed.`
        : '';
      const safeAutomation = Array.isArray(preview.automatically_safe_references) ? preview.automatically_safe_references : [];
      const automationNote = safeAutomation.length
        ? `\n\n${safeAutomation.length} unreviewed auto-generated Content Studio/CAIP shell row(s) are tied only to this product and will be removed with it. Reviewed or published project work would still block deletion.`
        : '';
      if (!window.confirm(`${draftCleanup ? 'Remove duplicate draft' : 'Delete unused product'}: ${label}?\n\nThis permanently removes only this unused record. Product numbers are not reused.${recipeNote}${automationNote}`)) return;
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