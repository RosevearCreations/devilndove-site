// Devil n Dove Release 448 — Home carousel data adapter using the shared Storefront media-carousel presentation.
(() => {
  'use strict';
  const mount = document.getElementById('homeHeroCarouselMount');
  if (!mount) return;
  let fallbackMarkup = mount.innerHTML;

  function restoreFallback() {
    mount.innerHTML = fallbackMarkup;
    mount.dataset.carouselState = 'static-fallback';
  }

  async function loadCarouselAuthority() {
    if (window.DDMediaCarousel?.mount) return window.DDMediaCarousel;
    await new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-dd-media-carousel-loader]');
      if (existing) {
        existing.addEventListener('load', resolve, { once:true });
        existing.addEventListener('error', reject, { once:true });
        return;
      }
      const script = document.createElement('script');
      script.src = '/public/js/media-carousel.js?v=448';
      script.async = true;
      script.dataset.ddMediaCarouselLoader = '448';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    if (!window.DDMediaCarousel?.mount) throw new Error('Shared carousel authority did not initialize.');
    return window.DDMediaCarousel;
  }

  async function waitForMediaStudioFallback() {
    if (['applied','partial','authored-default'].includes(document.documentElement.dataset.mediaContentStudio || '')) return;
    await new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        document.removeEventListener('dd:media-content-ready', finish);
        resolve();
      };
      document.addEventListener('dd:media-content-ready', finish, { once:true });
      setTimeout(finish, 1800);
    });
  }

  async function start() {
    try {
      mount.dataset.carouselState = 'loading';
      await waitForMediaStudioFallback();
      fallbackMarkup = mount.innerHTML;
      const response = await fetch('/api/home-carousel', { headers: { Accept:'application/json' }, cache:'no-store' });
      const data = await response.json();
      if (!response.ok || !data?.ok || !Array.isArray(data.slides) || !data.slides.length) return restoreFallback();
      const authority = await loadCarouselAuthority();
      const first = new Image();
      first.onload = () => {
        mount.dataset.carouselState = 'published-carousel';
        authority.mount(mount, {
        slides: data.slides,
        label: 'Featured Devil n Dove stories',
        autoplay: true,
        fallbackMarkup,
        });
      };
      first.onerror = restoreFallback;
      first.src = data.slides[0].image_url;
    } catch {
      restoreFallback();
    }
  }

  start();
})();
