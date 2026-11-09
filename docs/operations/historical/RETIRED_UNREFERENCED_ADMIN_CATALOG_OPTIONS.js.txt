// Build 197: visible category manager for the reusable product-category selector.
(() => {
  function text(value) { return String(value || '').trim(); }
  function uniqueValues(raw) {
    return [...new Set(String(raw || '').split(/[\r\n,|]+/g).map((value) => text(value).replace(/\s+/g, ' ')).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }
  function setMessage(message, isError = false) {
    const node = document.getElementById('catalogCategoryMessage');
    if (!node) return;
    node.textContent = message || '';
    node.style.display = message ? 'block' : 'none';
    node.style.color = isError ? '#ffb4c1' : '#9ef0b4';
  }
  function optionHtml(value) {
    const clean = text(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
    return `<option value="${clean}">${clean}</option>`;
  }
  function refreshCategorySelects(categories) {
    document.querySelectorAll('select[name="product_category"]').forEach((select) => {
      const current = text(select.value);
      select.innerHTML = `<option value="">Select category</option>${categories.map(optionHtml).join('')}`;
      if (current && categories.includes(current)) select.value = current;
      else if (current) {
        select.insertAdjacentHTML('beforeend', optionHtml(current));
        select.value = current;
      }
    });
  }
  async function loadCategories({ quiet = false } = {}) {
    const response = await window.DDAuth.apiFetch('/api/admin/catalog-option-sets', { method: 'GET' });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Could not load category choices.');
    const categories = Array.isArray(data?.option_sets?.category_options) ? data.option_sets.category_options.map(text).filter(Boolean) : [];
    const textarea = document.getElementById('catalogCategoryValues');
    if (textarea) textarea.value = categories.join('\n');
    refreshCategorySelects(categories);
    document.dispatchEvent(new CustomEvent('dd:catalog-option-sets-updated', { detail: { categories } }));
    if (!quiet) setMessage(`Loaded ${categories.length} category choice${categories.length === 1 ? '' : 's'}.`);
    return categories;
  }
  document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('catalogCategoryValues');
    const save = document.getElementById('saveCatalogCategoriesButton');
    const refresh = document.getElementById('refreshCatalogCategoriesButton');
    if (!textarea || !save || !refresh || !window.DDAuth) return;
    loadCategories({ quiet: true }).catch((error) => setMessage(error.message || 'Could not load category choices.', true));
    refresh.addEventListener('click', () => loadCategories().catch((error) => setMessage(error.message || 'Could not load category choices.', true)));
    save.addEventListener('click', async () => {
      const values = uniqueValues(textarea.value);
      if (!values.length) return setMessage('Add at least one category. Existing categories such as Soap and Candles can be added on their own lines.', true);
      const original = save.textContent;
      save.disabled = true;
      save.textContent = 'Saving…';
      try {
        const response = await window.DDAuth.apiFetch('/api/admin/catalog-option-sets', {
          method: 'POST', body: JSON.stringify({ action: 'save_option_set', option_set: 'categories', values })
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) throw new Error(data?.error || 'Could not save category choices.');
        const categories = Array.isArray(data?.option_sets?.category_options) ? data.option_sets.category_options.map(text).filter(Boolean) : values;
        textarea.value = categories.join('\n');
        refreshCategorySelects(categories);
        document.dispatchEvent(new CustomEvent('dd:catalog-option-sets-updated', { detail: { categories } }));
        setMessage(`Saved ${categories.length} category choice${categories.length === 1 ? '' : 's'}. Soap and Candles can now be selected in the product editor.`);
      } catch (error) { setMessage(error.message || 'Could not save category choices.', true); }
      finally { save.disabled = false; save.textContent = original; }
    });
  });
})();
