import { renderRecentWorkMounts } from "/assets/recent-work.js?v=20260501build127";

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${url}`);
  return await res.json().catch(() => ({}));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugFromPath() {
  const explicit = document.body?.dataset?.landingSlug;
  if (explicit) return explicit.trim();
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts[0] === "landing" && parts[1]) return parts[1];
  return parts[parts.length - 1] || "";
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n)
    ? new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
        maximumFractionDigits: 0
      }).format(n)
    : null;
}

function hasPositiveMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeProductName(value) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeProductRefs(value) {
  return (Array.isArray(value) ? value : []).map((item) => ({
    name: cleanText(item?.name || item?.title),
    role: cleanText(item?.role),
    note: cleanText(item?.note),
    image_url: cleanText(item?.image_url)
  })).filter((item) => item.name || item.image_url);
}

function findProductByName(products, name) {
  const target = normalizeProductName(name);
  if (!target) return null;

  return products.find((item) => normalizeProductName(item?.name || item?.title) === target) ||
    products.find((item) => normalizeProductName(item?.name || item?.title).includes(target)) ||
    products.find((item) => target.includes(normalizeProductName(item?.name || item?.title))) ||
    null;
}

function resolveRelatedProducts(page, productCatalog) {
  const refs = normalizeProductRefs(page?.related_products);
  const items = Array.isArray(productCatalog) ? productCatalog : [];
  return refs.map((ref) => {
    const product = ref.name ? (findProductByName(items, ref.name) || {}) : {};
    return {
      name: ref.name || product.name || product.title || "Related product",
      role: ref.role,
      note: ref.note,
      image_url: ref.image_url || product.r2_url || product.image_url || "",
      source_kind: product.source_kind || product.type || "product"
    };
  }).filter((item) => item.name || item.image_url);
}

function addonPriceSummary(addon) {
  if (!addon) return "";
  const sizeMap = addon.prices_cad && typeof addon.prices_cad === "object" ? addon.prices_cad : {};
  const parts = [];
  if (hasPositiveMoney(sizeMap.small)) parts.push(`Small ${money(sizeMap.small)}`);
  if (hasPositiveMoney(sizeMap.mid)) parts.push(`Mid ${money(sizeMap.mid)}`);
  if (hasPositiveMoney(sizeMap.oversize)) parts.push(`Oversize ${money(sizeMap.oversize)}`);

  if (addon.quote_required === true) {
    if (parts.length) return `From ${parts.join(" • ")} • Quote required`;
    if (hasPositiveMoney(addon.price_cad)) return `From ${money(addon.price_cad)} • Quote required`;
    return "Quote required after inspection";
  }

  if (parts.length) return parts.join(" • ");
  if (hasPositiveMoney(addon.price_cad)) return `Starting at ${money(addon.price_cad)}`;
  return "";
}

function heroMediaForPage(page, addon, relatedProducts) {
  if (page?.hero_image_url) return page.hero_image_url;
  if (addon?.image_url && !String(addon.image_url).toLowerCase().endsWith(".svg")) return addon.image_url;

  const firstProduct = (relatedProducts || []).find((item) => item.image_url);
  if (firstProduct?.image_url) return firstProduct.image_url;

  if (addon?.image_url) return addon.image_url;
  if (addon?.image_fallback_url) return addon.image_fallback_url;
  return "/assets/brand/rosie-reviews-fallback.svg";
}

function galleryMarkup(page, relatedProducts) {
  const gallerySource = Array.isArray(page?.gallery_image_urls) ? page.gallery_image_urls : (Array.isArray(page?.gallery_images) ? page.gallery_images : []);
  const gallery = gallerySource.filter(Boolean);
  const productImages = (relatedProducts || []).map((item) => item.image_url).filter(Boolean);
  const all = [...gallery, ...productImages].filter(Boolean);
  if (!all.length) return "";

  const unique = [];
  const seen = new Set();
  for (const src of all) {
    if (seen.has(src)) continue;
    seen.add(src);
    unique.push(src);
  }

  return `
    <section class="section panel">
      <h2 style="margin-top:0">Service and product visuals</h2>
      <div class="service-link-grid" style="margin-top:12px">
        ${unique.slice(0, 8).map((src) => `
          <article class="service-link-card">
            <img src="${escapeHtml(src)}" alt="Rosie Dazzlers service visual" class="proof-media" loading="lazy" onerror="this.onerror=null;this.src='/assets/brand/rosie-reviews-fallback.svg';" />
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function pageTemplate(page, pricing, slug, productCatalog) {
  const addon = page.related_code
    ? (pricing.addons || []).find((row) => row.code === page.related_code)
    : null;

  const related = Object.values((window.__landingPages || {}).pages || {})
    .filter((row) => row && row.enabled !== false && row.slug !== slug && row.nav_group === page.nav_group)
    .slice(0, 8);

  const faq = Array.isArray(page.faq) ? page.faq : [];
  const reasons = (Array.isArray(page.reasons_page_exists) ? page.reasons_page_exists : []).length
    ? page.reasons_page_exists
    : [
      page.type === "location"
        ? "This location page exists because local customers often search by town name first and need a page that talks about their service area directly."
        : "This add-on page exists because customers often search for this exact service or problem before they compare full packages.",
      "It keeps process, expectations, pricing/quote guidance, and booking links together instead of burying them inside a long catalog.",
      "It gives search engines clearer page focus while still keeping one honest customer path into booking."
    ];
  const process = (Array.isArray(page.process) ? page.process : []).length
    ? page.process
    : [
      "Confirm fit, scope, service area, and any quote requirements before the job is treated as ready.",
      "Inspect the vehicle or local setup notes so expectations are realistic.",
      "Complete the needed package, add-on, prep, treatment, or proof workflow using the current Rosie Dazzlers process.",
      "Review the result, aftercare notes, and next booking path with the customer."
    ];
  const equipment = Array.isArray(page.equipment) ? page.equipment : [];
  const highlights = Array.isArray(page.highlights) ? page.highlights : [];
  const thingsToKnow = Array.isArray(page.things_to_know) ? page.things_to_know : [];
  const officialLinks = Array.isArray(page.official_links) ? page.official_links : [];
  const relatedProducts = resolveRelatedProducts(page, productCatalog);
  const priceSummary = addonPriceSummary(addon);
  const heroImage = heroMediaForPage(page, addon, relatedProducts);
  const photoCaption = cleanText(page.region_photo_caption || (page.type === "location" ? "Regional photo included so this local landing page feels tied to the area, not just copied from a generic service page." : ""));
  const photoSource = cleanText(page.region_photo_source);
  const photoSourceUrl = cleanText(page.region_photo_source_url);
  const whyHeading = page.type === "location" ? "Why this location has its own page" : "Why this service has its own page";

  return `
  <main class="container">
    <section class="hero hero-split">
      <div>
        <div class="badge">${escapeHtml(page.badge || "Landing page")}</div>
        <h1>${escapeHtml(page.hero_title || page.name || "Landing page")}</h1>
        <p>${escapeHtml(page.hero_intro || "")}</p>
        <div class="badges">
          <span class="badge">Mobile service</span>
          <span class="badge">Oxford & Norfolk Counties</span>
          ${addon ? `<span class="badge">${escapeHtml(addon.quote_required ? "Quote required" : "Bookable add-on")}</span>` : `<span class="badge">Local service page</span>`}
        </div>
        <div class="cta-row" style="margin-top:14px">
          <a class="btn primary" href="/book">Book now</a>
          <a class="btn ghost" href="/pricing#booking-planner">Open live availability</a>
          <a class="btn ghost" href="/services">All services</a>
        </div>
      </div>
      <aside class="panel hero-sidecard">
        <figure class="landing-region-photo">
          <img src="${escapeHtml(heroImage)}" alt="${escapeHtml(page.name || page.hero_title || slug)}" class="proof-media" loading="lazy" onerror="this.onerror=null;this.src='/assets/brand/rosie-reviews-fallback.svg';" />
          ${photoCaption || photoSource ? `<figcaption>${escapeHtml(photoCaption || "Regional/service photo")}${photoSourceUrl ? ` <a href="${escapeHtml(photoSourceUrl)}" target="_blank" rel="noopener">${escapeHtml(photoSource || "source")}</a>` : (photoSource ? ` ${escapeHtml(photoSource)}` : "")}</figcaption>` : ""}
        </figure>
        <h2 style="margin-top:0">What to expect</h2>
        <p class="muted">${escapeHtml(priceSummary || "Review the process, scope, and booking fit before choosing this page’s service path.")}</p>
        <div class="hr"></div>
        <p class="muted">${escapeHtml((highlights[0] || reasons[0] || page.hero_intro || "").slice(0, 280))}</p>
      </aside>
    </section>

    <section class="section proof-grid">
      <article class="proof-card">
        <h2 style="margin-top:0">${escapeHtml(whyHeading)}</h2>
        <ul class="muted-list">${reasons.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>
      <article class="proof-card">
        <h2 style="margin-top:0">Best fit for</h2>
        <ul class="muted-list">${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>
    </section>

    <section class="section proof-grid">
      <article class="proof-card">
        <h2 style="margin-top:0">How the process usually works</h2>
        <ol class="muted-list">${process.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
      </article>
      <article class="proof-card">
        <h2 style="margin-top:0">Equipment and workflow</h2>
        <ul class="muted-list">${equipment.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>
    </section>

    ${relatedProducts.length ? `
      <section class="section panel">
        <h2 style="margin-top:0">Products we use for this service</h2>
        <p class="muted">These are the real consumables or support products currently linked to this service page.</p>
        <div class="service-link-grid" style="margin-top:12px">
          ${relatedProducts.map((item) => `
            <article class="service-link-card">
              ${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" class="proof-media" style="margin-bottom:10px" loading="lazy" onerror="this.onerror=null;this.src='/assets/brand/rosie-reviews-fallback.svg';" />` : ``}
              <h3>${escapeHtml(item.name)}</h3>
              ${item.role ? `<div class="badge" style="margin-bottom:8px">${escapeHtml(item.role)}</div>` : ``}
              ${item.note ? `<p class="muted">${escapeHtml(item.note)}</p>` : `<p class="muted">Linked from your consumables catalog.</p>`}
            </article>
          `).join("")}
        </div>
      </section>
    ` : ""}

    ${galleryMarkup(page, relatedProducts)}

    ${thingsToKnow.length ? `
      <section class="section panel">
        <h2 style="margin-top:0">Things to know, avoid, and plan for</h2>
        <ul class="muted-list">${thingsToKnow.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>
    ` : ""}

    ${officialLinks.length ? `
      <section class="section panel">
        <h2 style="margin-top:0">Helpful official sources and local references</h2>
        <div class="service-link-grid" style="margin-top:12px">
          ${officialLinks.map((item) => `
            <article class="service-link-card">
              <h3>${escapeHtml(item.label || "Official source")}</h3>
              <a class="btn ghost small" href="${escapeHtml(item.url)}" rel="noopener" target="_blank">Open source</a>
            </article>
          `).join("")}
        </div>
      </section>
    ` : ""}

    <section class="section panel">
      <h2 style="margin-top:0">Recent work and review proof</h2>
      <p class="muted">Keep visible proof close to the booking CTA so visitors can confirm the business is active before they contact you.</p>
      <div data-recent-work-mount style="margin-top:12px"></div>
      <div class="hr"></div>
      <div class="proof-grid">
        <article class="proof-card">
          <h3>Review proof</h3>
          <img data-reviews src="/assets/brand/rosie-reviews-fallback.svg" alt="Rosie Dazzlers reviews" class="proof-media" />
        </article>
        <article class="proof-card">
          <h3>Booking fit</h3>
          <p class="muted">${escapeHtml(
            addon?.quote_required
              ? "This service is requested online first and finalized after inspection because condition, labour, and prep needs can change the product path."
              : "Use the live booking planner to compare package fit, vehicle size, and add-on eligibility before you lock in a booking."
          )}</p>
          <div class="cta-row" style="margin-top:10px">
            <a class="btn ghost small" href="/contact">Ask a question</a>
            <a class="btn ghost small" href="/gallery">Gallery</a>
          </div>
        </article>
      </div>
    </section>

    ${faq.length ? `
      <section class="section panel">
        <h2 style="margin-top:0">Frequently asked questions</h2>
        <div class="faq-list">
          ${faq.map((item) => `
            <details class="faq-item">
              <summary>${escapeHtml(item.q)}</summary>
              <p class="muted">${escapeHtml(item.a)}</p>
            </details>
          `).join("")}
        </div>
      </section>
    ` : ""}

    ${related.length ? `
      <section class="section panel">
        <h2 style="margin-top:0">Related pages</h2>
        <div class="service-link-grid" style="margin-top:12px">
          ${related.map((item) => `
            <article class="service-link-card">
              <h3>${escapeHtml(item.name || item.hero_title || item.slug)}</h3>
              <a class="btn ghost small" href="/${escapeHtml(item.slug)}">Open page</a>
            </article>
          `).join("")}
        </div>
      </section>
    ` : ""}
  </main>`;
}


function upsertJsonLd(id, data) {
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data, null, 2);
}

function updateLandingStructuredData(page, addon, slug) {
  const title = page?.meta_title || page?.hero_title || page?.name || "Rosie Dazzlers landing page";
  const description = page?.meta_description || page?.hero_intro || "Rosie Dazzlers mobile auto detailing information page.";
  const url = `${location.origin}/${slug}`;
  const faqs = Array.isArray(page?.faq) ? page.faq.filter((item) => item?.q && item?.a) : [];

  upsertJsonLd("landing-service-jsonld", {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": page?.name || page?.hero_title || title,
    "serviceType": addon ? (addon.name || "Auto detailing add-on") : "Mobile auto detailing",
    "description": description,
    "url": url,
    "provider": {
      "@type": "LocalBusiness",
      "name": "Rosie Dazzlers Mobile Auto Detailing",
      "url": `${location.origin}/`,
      "areaServed": ["Oxford County, Ontario", "Norfolk County, Ontario"]
    },
    "areaServed": ["Tillsonburg, Ontario", "Woodstock, Ontario", "Ingersoll, Ontario", "Simcoe, Ontario", "Delhi, Ontario", "Port Dover, Ontario", "Oxford County, Ontario", "Norfolk County, Ontario"]
  });

  upsertJsonLd("landing-breadcrumb-jsonld", {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${location.origin}/` },
      { "@type": "ListItem", "position": 2, "name": page?.name || title, "item": url }
    ]
  });

  if (faqs.length) {
    upsertJsonLd("landing-faq-jsonld", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.slice(0, 8).map((item) => ({
        "@type": "Question",
        "name": cleanText(item.q),
        "acceptedAnswer": { "@type": "Answer", "text": cleanText(item.a) }
      }))
    });
  }
}

async function renderLandingPage() {
  const slug = slugFromPath();
  const [landingPages, pricing, productCatalog] = await Promise.all([
    fetchJson("/api/landing_pages_public"),
    fetchJson("/api/pricing_catalog_public"),
    fetchJson("/data/rosie_products_catalog.json")
  ]);

  window.__landingPages = landingPages || { pages: {} };
  const page = landingPages?.pages?.[slug];

  if (!page || page.enabled === false) {
    document.getElementById("landingMount").innerHTML = `
      <main class="container">
        <section class="hero">
          <div>
            <div class="badge">Landing page</div>
            <h1>Page not found</h1>
            <p>The requested landing page does not exist yet or is not enabled.</p>
            <div class="cta-row" style="margin-top:14px">
              <a class="btn primary" href="/services">All services</a>
              <a class="btn ghost" href="/contact">Contact</a>
            </div>
          </div>
        </section>
      </main>`;
    document.title = "Landing Page Not Found | Rosie Dazzlers";
    return;
  }

  if (page.meta_title) document.title = page.meta_title;
  const meta = document.querySelector('meta[name="description"]');
  if (meta && page.meta_description) meta.setAttribute("content", page.meta_description);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && page.meta_title) ogTitle.setAttribute("content", page.meta_title);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc && page.meta_description) ogDesc.setAttribute("content", page.meta_description);

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute(
      "href",
      location.origin + (location.pathname.startsWith("/landing/") ? location.pathname : `/${slug}`)
    );
  }

  document.getElementById("landingMount").innerHTML = pageTemplate(page, pricing || {}, slug, productCatalog || []);
  const addon = page.related_code ? ((pricing?.addons || []).find((row) => row.code === page.related_code) || null) : null;
  updateLandingStructuredData(page, addon, slug);
  renderRecentWorkMounts(3);
}

renderLandingPage().catch((err) => {
  document.getElementById("landingMount").innerHTML = `
    <main class="container">
      <section class="hero">
        <div>
          <div class="badge">Landing page</div>
          <h1>Could not load this page</h1>
          <p>${escapeHtml(err?.message || "Unknown error")}</p>
          <div class="cta-row" style="margin-top:14px">
            <a class="btn primary" href="/services">All services</a>
            <a class="btn ghost" href="/contact">Contact</a>
          </div>
        </div>
      </section>
    </main>`;
});
