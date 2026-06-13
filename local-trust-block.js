// File: /public/js/local-trust-block.js
// Build 144: Reusable Southern Ontario trust block for public pages.

(function () {
  const DEFAULT_TRUST = {
    heading: 'Southern Ontario workshop trust',
    summary: 'Devil n Dove is a small Southern Ontario maker workshop sharing handmade jewelry, mixed-media gifts, vintage finds, tools, supplies, and the real making process behind the pieces.',
    points: [
      'Workshop-made, sourced, or vintage items are labelled clearly so buyers know what they are viewing.',
      'Product pages are built around real photos, condition notes, materials, process details, and local pickup/shipping clarity.',
      'Local wording stays natural for Southern Ontario, Tillsonburg, Oxford County, Norfolk County, and nearby communities.',
      'Behind-the-scenes photos and social posts stay review-first so private workshop or customer details are not posted accidentally.'
    ],
    links: [
      { label: 'Local pickup', url: '/pickup/' },
      { label: 'Custom gifts', url: '/custom-gifts-southern-ontario/' },
      { label: 'Handmade jewelry', url: '/handmade-jewelry-ontario/' },
      { label: 'Workshop stories', url: '/creations/' }
    ]
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeData(data) {
    const source = data && typeof data === 'object' ? data : DEFAULT_TRUST;
    return {
      heading: source.heading || DEFAULT_TRUST.heading,
      summary: source.summary || DEFAULT_TRUST.summary,
      points: Array.isArray(source.points) && source.points.length ? source.points : DEFAULT_TRUST.points,
      links: Array.isArray(source.links) && source.links.length ? source.links : DEFAULT_TRUST.links
    };
  }

  function renderTrustBlock(mount, data) {
    const trust = normalizeData(data);
    const variant = String(mount.getAttribute('data-local-trust-variant') || 'standard').trim().toLowerCase();
    mount.classList.add('dd-local-trust-block');
    if (variant) mount.classList.add(`dd-local-trust-${variant}`);
    mount.innerHTML = `
      <div class="dd-local-trust-copy">
        <p class="small dd-local-trust-kicker">Local maker trust</p>
        <h2>${escapeHtml(trust.heading)}</h2>
        <p>${escapeHtml(trust.summary)}</p>
        <ul class="small compact-list">
          ${trust.points.slice(0, 4).map((point) => `<li>${escapeHtml(point)}</li>`).join('')}
        </ul>
      </div>
      <div class="dd-local-trust-actions">
        ${trust.links.slice(0, 5).map((link, index) => `<a class="btn ${index === 0 ? 'primary' : ''}" href="${escapeHtml(link.url || '#')}">${escapeHtml(link.label || 'Learn more')}</a>`).join('')}
      </div>
    `;
  }

  async function loadTrustData() {
    try {
      const response = await fetch('/data/site/local-trust.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('local trust JSON unavailable');
      return await response.json();
    } catch {
      return DEFAULT_TRUST;
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const mounts = Array.from(document.querySelectorAll('[data-local-trust-block]'));
    if (!mounts.length) return;
    const data = await loadTrustData();
    mounts.forEach((mount) => renderTrustBlock(mount, data));
  });
})();
