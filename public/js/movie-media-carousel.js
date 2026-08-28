// Devil n Dove Release 448 — Movie Shelf adapter for the shared Storefront media carousel.
(() => {
  'use strict';
  let loadingAuthority = null;
  function loadAuthority() {
    if (window.DDMediaCarousel?.mount) return Promise.resolve(window.DDMediaCarousel);
    if (loadingAuthority) return loadingAuthority;
    loadingAuthority = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/public/js/media-carousel.js?v=448';
      script.async = true;
      script.dataset.ddMovieCarouselAuthority = '448';
      script.onload = () => window.DDMediaCarousel?.mount ? resolve(window.DDMediaCarousel) : reject(new Error('Shared carousel did not initialize.'));
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return loadingAuthority;
  }
  async function enhance(row) {
    if (!row || row.dataset.sharedCarousel === '448') return;
    const images = Array.from(row.querySelectorAll('.movie-cover-box img')).filter((image) => image.src);
    // Keep the truthful two-column fallback whenever one side is still pending.
    if (images.length < 2) return;
    row.dataset.sharedCarousel = '448';
    const fallbackMarkup = row.innerHTML;
    const title = row.closest('.movie-card-shell')?.querySelector('.movie-title')?.textContent?.trim() || 'Movie';
    try {
      const authority = await loadAuthority();
      authority.mount(row, {
        compact: true,
        autoplay: false,
        fallbackMarkup,
        label: `${title} front and back covers`,
        slides: images.map((image, index) => ({
          image_url: image.currentSrc || image.src,
          alt_text: image.alt || `${title} ${index === 0 ? 'front' : 'back'} cover`,
          title: index === 0 ? 'Front cover' : 'Back cover',
        })),
      });
      row.classList.add('movie-media-carousel');
    } catch {
      row.innerHTML = fallbackMarkup;
      row.dataset.sharedCarousel = 'fallback';
    }
  }
  function scan() { document.querySelectorAll('.movie-media-row').forEach((row) => enhance(row)); }
  const observer = new MutationObserver(scan);
  function start() { scan(); const grid = document.getElementById('movieGrid'); if (grid) observer.observe(grid, { childList:true, subtree:true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true }); else start();
})();
