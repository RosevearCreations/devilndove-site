// Devil n Dove Build 443 — accessible Home hero-media carousel with static fallback.
(() => {
  'use strict';
  const mount = document.getElementById('homeHeroCarouselMount');
  if (!mount) return;
  const fallbackMarkup = mount.innerHTML;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  let slides = [];
  let index = 0;
  let paused = reducedMotion;
  let timer = 0;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const stop = () => { if (timer) window.clearTimeout(timer); timer = 0; };
  const schedule = () => {
    stop();
    if (paused || reducedMotion || slides.length < 2) return;
    timer = window.setTimeout(() => show(index + 1, false), Math.max(5, Math.min(20, Number(slides[index]?.auto_advance_seconds || 7))) * 1000);
  };

  function render() {
    const slide = slides[index];
    mount.innerHTML = `<div class="home-carousel" role="region" aria-roledescription="carousel" aria-label="Featured Devil n Dove stories" tabindex="0">
      <div class="home-carousel-slide" role="group" aria-roledescription="slide" aria-label="${index + 1} of ${slides.length}">
        <img src="${esc(slide.image_url)}" alt="${esc(slide.alt_text)}" decoding="async" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>
        <div class="home-carousel-caption"><strong>${esc(slide.title)}</strong>${slide.body_text ? `<p>${esc(slide.body_text)}</p>` : ''}${slide.cta_label && slide.cta_url ? `<a class="btn primary" href="${esc(slide.cta_url)}">${esc(slide.cta_label)}</a>` : ''}</div>
      </div>
      ${slides.length > 1 ? `<div class="home-carousel-controls"><button class="btn" type="button" data-carousel-previous aria-label="Previous slide">Previous</button><div class="home-carousel-indicators" aria-label="Choose a slide">${slides.map((_, i) => `<button type="button" data-carousel-index="${i}" aria-label="Show slide ${i + 1}" aria-current="${i === index ? 'true' : 'false'}"></button>`).join('')}</div><button class="btn" type="button" data-carousel-next aria-label="Next slide">Next</button><button class="btn" type="button" data-carousel-pause aria-pressed="${paused ? 'true' : 'false'}" ${reducedMotion ? 'disabled' : ''}>${reducedMotion ? 'Paused (reduced motion)' : (paused ? 'Resume' : 'Pause')}</button></div>` : ''}
      <span class="visually-hidden" data-carousel-status aria-live="polite"></span>
    </div>`;
    const root = mount.querySelector('.home-carousel');
    root?.addEventListener('mouseenter', stop);
    root?.addEventListener('mouseleave', schedule);
    root?.addEventListener('focusin', stop);
    root?.addEventListener('focusout', schedule);
    root?.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1, true); }
      if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1, true); }
    });
    mount.querySelector('[data-carousel-previous]')?.addEventListener('click', () => show(index - 1, true));
    mount.querySelector('[data-carousel-next]')?.addEventListener('click', () => show(index + 1, true));
    mount.querySelectorAll('[data-carousel-index]').forEach((button) => button.addEventListener('click', () => show(Number(button.dataset.carouselIndex), true)));
    mount.querySelector('[data-carousel-pause]')?.addEventListener('click', () => { if (reducedMotion) return; paused = !paused; render(); schedule(); });
    mount.querySelector('img')?.addEventListener('error', restoreFallback, { once:true });
  }

  function show(next, announce) {
    if (!slides.length) return;
    index = (next + slides.length) % slides.length;
    render();
    if (announce) {
      const status = mount.querySelector('[data-carousel-status]');
      if (status) status.textContent = `Slide ${index + 1} of ${slides.length}: ${slides[index].title}`;
    }
    schedule();
  }

  function restoreFallback() {
    stop();
    mount.innerHTML = fallbackMarkup;
    mount.dataset.carouselState = 'static-fallback';
  }

  async function start() {
    try {
      const response = await fetch('/api/home-carousel', { headers: { Accept:'application/json' } });
      const data = await response.json();
      if (!response.ok || !data?.ok || !Array.isArray(data.slides) || !data.slides.length) return restoreFallback();
      slides = data.slides;
      const firstImage = new Image();
      firstImage.onload = () => { mount.dataset.carouselState = 'active'; show(0, false); };
      firstImage.onerror = restoreFallback;
      firstImage.src = slides[0].image_url;
    } catch { restoreFallback(); }
  }
  start();
})();
