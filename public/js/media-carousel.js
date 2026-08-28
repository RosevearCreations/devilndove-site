// Devil n Dove Release 448 — reusable accessible media carousel presentation.
(() => {
  'use strict';
  if (window.DDMediaCarousel) return;

  function ensureStyles() {
    if (document.querySelector('link[data-dd-media-carousel]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/media-carousel.css?v=448';
    link.dataset.ddMediaCarousel = '448';
    document.head.appendChild(link);
  }
  ensureStyles();

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  function normalizeSlide(row = {}) {
    return {
      image_url: String(row.image_url || row.src || '').trim(),
      alt_text: String(row.alt_text || row.alt || '').trim(),
      title: String(row.title || '').trim(),
      body_text: String(row.body_text || row.caption || '').trim(),
      cta_label: String(row.cta_label || '').trim(),
      cta_url: String(row.cta_url || row.href || '').trim(),
      auto_advance_seconds: Math.max(5, Math.min(20, Number(row.auto_advance_seconds || 7) || 7)),
      still_time_seconds: Number.isFinite(Number(row.still_time_seconds)) ? Number(row.still_time_seconds) : null,
    };
  }

  function mount(target, options = {}) {
    const node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!node) return null;
    const slides = (Array.isArray(options.slides) ? options.slides : []).map(normalizeSlide).filter((row) => row.image_url);
    const fallbackMarkup = options.fallbackMarkup ?? node.innerHTML;
    const label = String(options.label || 'Media carousel').trim();
    const autoplay = options.autoplay !== false;
    const compact = options.compact === true;
    let index = Math.max(0, Math.min(slides.length - 1, Number(options.startIndex || 0) || 0));
    let paused = reducedMotion() || !autoplay;
    let timer = 0;

    const stop = () => { if (timer) window.clearTimeout(timer); timer = 0; };
    const restore = () => { stop(); node.innerHTML = fallbackMarkup; node.dataset.carouselState = 'static-fallback'; };
    const schedule = () => {
      stop();
      if (paused || reducedMotion() || slides.length < 2) return;
      timer = window.setTimeout(() => show(index + 1, false), slides[index].auto_advance_seconds * 1000);
    };

    function render() {
      if (!slides.length) return restore();
      const slide = slides[index];
      const timeLabel = slide.still_time_seconds == null ? '' : `<span class="dd-media-carousel-time">Still at ${esc(slide.still_time_seconds)}s</span>`;
      node.innerHTML = `<div class="dd-media-carousel${compact ? ' is-compact' : ''}" role="region" aria-roledescription="carousel" aria-label="${esc(label)}" tabindex="0">
        <div class="dd-media-carousel-slide" role="group" aria-roledescription="slide" aria-label="${index + 1} of ${slides.length}">
          <img src="${esc(slide.image_url)}" alt="${esc(slide.alt_text)}" decoding="async" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>
          ${(slide.title || slide.body_text || timeLabel || (slide.cta_label && slide.cta_url)) ? `<div class="dd-media-carousel-caption">${slide.title ? `<strong>${esc(slide.title)}</strong>` : ''}${slide.body_text ? `<p>${esc(slide.body_text)}</p>` : ''}${timeLabel}${slide.cta_label && slide.cta_url ? `<a class="btn primary" href="${esc(slide.cta_url)}">${esc(slide.cta_label)}</a>` : ''}</div>` : ''}
        </div>
        ${slides.length > 1 ? `<div class="dd-media-carousel-controls"><button class="btn" type="button" data-carousel-previous aria-label="Previous slide">Previous</button><div class="dd-media-carousel-indicators" aria-label="Choose a slide">${slides.map((_, i) => `<button type="button" data-carousel-index="${i}" aria-label="Show slide ${i + 1}" aria-current="${i === index ? 'true' : 'false'}"></button>`).join('')}</div><button class="btn" type="button" data-carousel-next aria-label="Next slide">Next</button>${autoplay ? `<button class="btn" type="button" data-carousel-pause aria-pressed="${paused ? 'true' : 'false'}" ${reducedMotion() ? 'disabled' : ''}>${reducedMotion() ? 'Paused (reduced motion)' : (paused ? 'Resume' : 'Pause')}</button>` : ''}</div>` : ''}
        <span class="visually-hidden" data-carousel-status aria-live="polite"></span>
      </div>`;
      const root = node.querySelector('.dd-media-carousel');
      root?.addEventListener('mouseenter', stop);
      root?.addEventListener('mouseleave', schedule);
      root?.addEventListener('focusin', stop);
      root?.addEventListener('focusout', schedule);
      root?.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1, true); }
        if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1, true); }
      });
      node.querySelector('[data-carousel-previous]')?.addEventListener('click', () => show(index - 1, true));
      node.querySelector('[data-carousel-next]')?.addEventListener('click', () => show(index + 1, true));
      node.querySelectorAll('[data-carousel-index]').forEach((button) => button.addEventListener('click', () => show(Number(button.dataset.carouselIndex), true)));
      node.querySelector('[data-carousel-pause]')?.addEventListener('click', () => { if (reducedMotion()) return; paused = !paused; render(); schedule(); });
      node.querySelector('img')?.addEventListener('error', restore, { once: true });
    }

    function show(next, announce) {
      index = (next + slides.length) % slides.length;
      render();
      if (announce) {
        const status = node.querySelector('[data-carousel-status]');
        if (status) status.textContent = `Slide ${index + 1} of ${slides.length}${slides[index].title ? `: ${slides[index].title}` : ''}`;
      }
      schedule();
    }

    node.dataset.carouselState = 'active';
    show(index, false);
    return { show, destroy: restore, getIndex: () => index, getSlides: () => slides.slice() };
  }

  window.DDMediaCarousel = Object.freeze({ mount });
})();
