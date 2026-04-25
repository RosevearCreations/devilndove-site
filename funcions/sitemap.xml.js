// File: /functions/sitemap.xml.js
// Brief description: Generates a valid XML sitemap for the site and active products.
// This fixes the unterminated string literal build error and keeps sitemap output
// safe for Cloudflare Pages Functions.

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function toIsoLike(value) {
  if (!value) return "";
  const raw = String(value).trim();

  if (!raw) return "";
  if (raw.includes("T")) return raw.endsWith("Z") ? raw : `${raw}Z`;

  return `${raw.replace(" ", "T")}Z`;
}

export async function onRequestGet(context) {
  const { env, request } = context;

  const url = new URL(request.url);
  const siteUrl = String(env.PUBLIC_SITE_URL || `${url.protocol}//${url.host}`).replace(/\/+$/, "");

  const staticUrls = [
    { loc: "/", priority: "1.0", changefreq: "weekly" },
    { loc: "/about/", priority: "0.8", changefreq: "monthly" },
    { loc: "/contact/", priority: "0.7", changefreq: "monthly" },
    { loc: "/gallery/", priority: "0.8", changefreq: "weekly" },
    { loc: "/creations/", priority: "0.8", changefreq: "weekly" },
    { loc: "/shop/", priority: "0.9", changefreq: "daily" },
    { loc: "/tools/", priority: "0.7", changefreq: "weekly" },
    { loc: "/supplies/", priority: "0.7", changefreq: "weekly" },
    { loc: "/toolshed/", priority: "0.6", changefreq: "weekly" },
    { loc: "/movies/", priority: "0.5", changefreq: "monthly" },
    { loc: "/search/", priority: "0.5", changefreq: "weekly" }
  ];

  let productRows = [];
  try {
    const result = await env.DB.prepare(`
      SELECT
        product_id,
        slug,
        updated_at,
        created_at,
        status
      FROM products
      WHERE LOWER(COALESCE(status, '')) = 'active'
      ORDER BY updated_at DESC, product_id DESC
    `).all();

    productRows = normalizeResults(result);
  } catch {
    productRows = [];
  }

  const staticXml = staticUrls
    .map((u) => {
      return [
        "<url>",
        `<loc>${escapeXml(siteUrl + u.loc)}</loc>`,
        `<changefreq>${escapeXml(u.changefreq)}</changefreq>`,
        `<priority>${escapeXml(u.priority)}</priority>`,
        "</url>"
      ].join("");
    })
    .join("");

  const productXml = productRows
    .map((p) => {
      const slug = String(p.slug || "").trim();
      if (!slug) return "";

      const lastmod = toIsoLike(p.updated_at || p.created_at);

      return [
        "<url>",
        `<loc>${escapeXml(`${siteUrl}/shop/product/?slug=${encodeURIComponent(slug)}`)}</loc>`,
        lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : "",
        "<changefreq>weekly</changefreq>",
        "<priority>0.8</priority>",
        "</url>"
      ].join("");
    })
    .join("");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    staticXml,
    productXml,
    "</urlset>"
  ].join("");

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=UTF-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
