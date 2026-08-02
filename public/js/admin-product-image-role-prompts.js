// File: /public/js/admin-product-image-role-prompts.js
// Build 191 image-role guidance shared by phone and desktop product editors.

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('mobileProductForm') || document.getElementById('createProductForm');
  if (!form || !window.DDAuth?.apiFetch) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const mobile = form.id === 'mobileProductForm';
  const categoryField = form.elements?.product_category;
  const originField = form.elements?.merchandise_origin;
  let roles = [];

  try {
    const response = await window.DDAuth.apiFetch('/api/admin/value-ops-followthrough');
    const data = await response.json().catch(()=>({}));
    if (!response.ok || data?.ok === false) return;
    roles = Array.isArray(data.image_roles) ? data.image_roles : [];
  } catch { return; }

  const card = document.createElement('section');
  card.className = 'card product-image-role-prompt-card';
  card.setAttribute('aria-label','Product image role guidance');
  const imageInput = mobile ? document.getElementById('mobileProductImages') : form.elements?.featured_image_url;
  const anchor = imageInput?.closest('label') || form.firstElementChild;
  anchor?.parentNode?.insertBefore(card, anchor);

  function family() {
    const category = String(categoryField?.value || '').toLowerCase();
    const origin = String(originField?.value || '').toLowerCase();
    if (origin.includes('vintage') || origin.includes('collectible') || origin.includes('antique')) return 'vintage';
    if (category.includes('candle')) return 'candles';
    if (category.includes('soap')) return 'soap';
    if (category.includes('engraving') || category.includes('laser')) return 'engraving';
    if (category.includes('jewel') || category.includes('ring') || category.includes('pendant')) return 'jewelry';
    if (category.includes('custom')) return 'custom';
    return 'all';
  }
  function render() {
    const selected = family();
    const visible = roles.filter((row) => row.family_key === 'all' || row.family_key === selected);
    card.innerHTML = `<div class="value-card-head"><div><h3>Photo roles for ${esc(selected.replace(/_/g,' '))}</h3><p class="small">These prompts improve trust, alt text, product readiness, marketplace exports, and mobile consistency. Use real approved images—not decorative placeholders.</p></div><span class="status-pill">${mobile ? 'phone guidance' : 'desktop guidance'}</span></div>
      <div class="product-image-role-grid">${visible.map((row)=>`<article class="product-image-role-item ${row.is_publish_blocker ? 'is-blocker' : ''}"><strong>${esc(row.role_label)}</strong><span>${row.minimum_count ? `Minimum ${Number(row.minimum_count)}` : 'Optional'}</span><p>${esc(mobile ? row.phone_prompt : row.desktop_prompt)}</p>${row.is_publish_blocker ? '<em>Publish blocker</em>' : '<em>Recommended proof</em>'}</article>`).join('')}</div>`;
  }
  categoryField?.addEventListener('change',render);
  originField?.addEventListener('change',render);
  render();
});
