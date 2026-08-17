// File: /functions/api/image-derivative.js
// Brief description: Public-safe image derivative worker route. Uses Cloudflare Image Resizing when available and falls back to the original image response.

function clean(value, limit = 1200) {
  const text = String(value || '').trim();
  return text.length > limit ? text.slice(0, limit).trim() : text;
}
function clamp(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}
function isAllowedSource(url, env) {
  const allowed = [
    env.PRODUCT_MEDIA_PUBLIC_BASE_URL,
    env.R2_PUBLIC_BASE_URL,
    env.PUBLIC_R2_BASE_URL,
    env.ASSET_ORIGIN,
    'https://assets.devilndove.com',
    'https://devilndove-site.pages.dev'
  ].filter(Boolean).map((value) => String(value).replace(/\/$/, '').toLowerCase());
  const src = String(url || '').toLowerCase();
  return allowed.some((base) => src.startsWith(base));
}
function fallbackSvg(message) {
  const text = String(message || 'Image unavailable').replace(/[<>&"]/g, '');
  return new Response(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><rect width="1200" height="1200" fill="#1d1027"/><text x="600" y="600" fill="#f4d7ff" font-family="Arial,sans-serif" font-size="42" text-anchor="middle">${text}</text></svg>`, {
    status: 200,
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300' }
  });
}
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const src = clean(url.searchParams.get('src') || url.searchParams.get('url') || '', 1800);
  const width = clamp(url.searchParams.get('w') || url.searchParams.get('width'), 120, 2400, 1200);
  const height = clamp(url.searchParams.get('h') || url.searchParams.get('height'), 120, 2400, 1200);
  const quality = clamp(url.searchParams.get('q') || url.searchParams.get('quality'), 45, 95, 86);
  const fit = ['cover', 'contain', 'scale-down', 'crop', 'pad'].includes(clean(url.searchParams.get('fit'), 40)) ? clean(url.searchParams.get('fit'), 40) : 'cover';
  const format = ['jpeg', 'webp', 'avif', 'png'].includes(clean(url.searchParams.get('format'), 20)) ? clean(url.searchParams.get('format'), 20) : 'webp';

  if (!src || !/^https:\/\//i.test(src)) return fallbackSvg('Missing image source');
  if (!isAllowedSource(src, context.env || {})) return fallbackSvg('Source not allowed');

  const headers = { 'Cache-Control': 'public, max-age=86400', 'X-DevilNDove-Derivative': 'worker-route' };
  const imageOptions = { width, height, quality, fit, format };
  const resized = await fetch(src, { cf: { image: imageOptions } }).catch(() => null);
  if (resized && resized.ok) {
    const nextHeaders = new Headers(resized.headers);
    Object.entries(headers).forEach(([key, value]) => nextHeaders.set(key, value));
    nextHeaders.set('X-DevilNDove-Image-Mode', 'cloudflare-image-resize');
    return new Response(resized.body, { status: resized.status, headers: nextHeaders });
  }

  const original = await fetch(src).catch(() => null);
  if (original && original.ok) {
    const nextHeaders = new Headers(original.headers);
    Object.entries(headers).forEach(([key, value]) => nextHeaders.set(key, value));
    nextHeaders.set('X-DevilNDove-Image-Mode', 'original-fallback');
    return new Response(original.body, { status: original.status, headers: nextHeaders });
  }

  return fallbackSvg('Image fetch failed');
}
