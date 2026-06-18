// File: /public/js/before-after-gallery.js
// Progressive enhancement for approved before/after/process proof on public pages.

document.addEventListener('DOMContentLoaded', async () => {
  const mount = document.querySelector('[data-approved-before-after-gallery]');
  if (!mount) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  try {
    const response = await fetch('/api/before-after-gallery', { headers:{'Accept':'application/json'} });
    const data = await response.json().catch(()=>({}));
    const items = Array.isArray(data?.items) ? data.items : [];
    if (!items.length) return;
    mount.innerHTML = `
      <div class="section-head"><div><h2>Approved workshop and before/after proof</h2><p class="small">Real process images published only after consent, public-use, alt-text, compression, and mobile review.</p></div></div>
      <div class="approved-proof-grid">${items.map((item)=>`
        <article class="approved-proof-card">
          <div class="approved-proof-images">
            ${item.before_image_url ? `<figure><img src="${esc(item.before_image_url)}" alt="${esc(item.alt_text || `${item.gallery_label} before`)}" loading="lazy"><figcaption>Before</figcaption></figure>` : ''}
            ${item.after_image_url ? `<figure><img src="${esc(item.after_image_url)}" alt="${esc(item.alt_text || `${item.gallery_label} after`)}" loading="lazy"><figcaption>After</figcaption></figure>` : ''}
            ${item.process_image_url && !item.before_image_url && !item.after_image_url ? `<figure><img src="${esc(item.process_image_url)}" alt="${esc(item.alt_text || item.gallery_label)}" loading="lazy"><figcaption>Process</figcaption></figure>` : ''}
          </div>
          <div class="approved-proof-copy"><h3>${esc(item.gallery_label)}</h3>${item.story_note ? `<p>${esc(item.story_note)}</p>` : ''}</div>
        </article>`).join('')}</div>`;
    mount.hidden = false;
  } catch {
    // Keep the static placeholder/fallback content.
  }
});
