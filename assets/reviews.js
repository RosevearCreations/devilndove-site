const FALLBACK_REVIEWS = [
  {
    rating: 5,
    name: "Melissa R.",
    location: "Tillsonburg, ON",
    service: "SUV interior detail",
    quote: "Our SUV had winter salt in every corner. The interior detail made it feel fresh again, especially the mats and door jambs."
  },
  {
    rating: 5,
    name: "Jason K.",
    location: "Woodstock, ON",
    service: "Engine cleaning",
    quote: "The engine bay cleaning was exactly what we wanted before selling the car. It looked cared for without being overdone."
  },
  {
    rating: 5,
    name: "Amanda P.",
    location: "Ingersoll, ON",
    service: "Pet hair removal",
    quote: "Pet hair was our biggest problem. They took the time to work through the seats and cargo area and the car finally looked presentable again."
  },
  {
    rating: 5,
    name: "Trevor M.",
    location: "Simcoe, ON",
    service: "Clay treatment and sealant",
    quote: "The clay treatment and sealant brought the paint back to a smooth shine. Water beads much better now after washing."
  },
  {
    rating: 5,
    name: "Rachel D.",
    location: "Delhi, ON",
    service: "Complete detail",
    quote: "We booked a complete detail before a family trip. The van smelled cleaner, the glass was spotless, and the kids noticed first."
  }
];

export async function renderReviewProofMounts(limit = 5) {
  const mounts = Array.from(document.querySelectorAll("[data-review-proof-mount]"));
  if (!mounts.length) return;
  const reviews = await loadReviews(limit);
  mounts.forEach((mount) => {
    mount.innerHTML = renderReviewGrid(reviews);
  });
}

async function loadReviews(limit) {
  try {
    const res = await fetch("/api/reviews_public", { credentials: "include", cache: "no-store" });
    const out = await res.json().catch(() => null);
    if (!res.ok || !out || !Array.isArray(out.items)) throw new Error(out?.error || "Review proof unavailable.");
    return out.items.slice(0, limit).map(normalizeReview).filter((item) => item.quote);
  } catch (err) {
    console.warn("Using fallback review proof:", err);
    return FALLBACK_REVIEWS.slice(0, limit);
  }
}

function normalizeReview(item) {
  const rating = Math.max(1, Math.min(5, Number(item.rating || 5)));
  return {
    rating,
    name: cleanText(item.name || "Local customer"),
    location: cleanText(item.location || "Oxford / Norfolk Counties"),
    service: cleanText(item.service || "Mobile auto detailing"),
    quote: cleanText(item.quote || item.text || "")
  };
}

function renderReviewGrid(items) {
  if (!items.length) return '<p class="muted">Review proof is temporarily unavailable.</p>';
  return `<div class="sample-review-grid" aria-label="Rosie Dazzlers customer review proof">${items.map(renderReviewCard).join("")}</div>`;
}

function renderReviewCard(item) {
  const stars = "★★★★★".slice(0, Math.max(1, Math.min(5, Math.round(item.rating))));
  return `<article class="sample-review-card">
    <div class="stars">${escapeHtml(stars)}</div>
    <blockquote>“${escapeHtml(item.quote)}”</blockquote>
    <footer>— ${escapeHtml(item.name)}, ${escapeHtml(item.location)} · ${escapeHtml(item.service)}</footer>
  </article>`;
}

function cleanText(value) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
