// Release 460 — non-executing provider publication planning and idempotency authority.
// This module validates local publication intent only. It MUST NOT contact providers,
// read/decrypt OAuth tokens, or imply that provider publication is authorized.

import { sha256Base64Url } from './oauthSecurity.js';

const PROVIDER_KEYS = ['etsy', 'pinterest', 'meta', 'x', 'tiktok', 'youtube'];
const EXECUTION_BOUNDARY = Object.freeze({
  validation_only: true,
  provider_execution: false,
  provider_publication: false,
  network_calls_allowed: false,
  token_material_required: false,
  live_authorization_required: false,
});

const CONTRACTS = Object.freeze({
  etsy: { label: 'Etsy', content_kind: 'listing_draft', max_title: 140, max_description: 10000, max_images: 10, max_tags: 13 },
  pinterest: { label: 'Pinterest', content_kind: 'pin_draft', max_title: 100, max_description: 500, max_images: 1 },
  meta: { label: 'Meta / Facebook / Instagram', content_kind: 'social_post_draft', max_caption: 2200, max_images: 10, surfaces: ['facebook_page', 'instagram_business'] },
  x: { label: 'X', content_kind: 'social_post_draft', max_caption: 280, max_images: 4 },
  tiktok: { label: 'TikTok', content_kind: 'video_post_draft', max_caption: 2200, max_images: 0, video_required: true },
  youtube: { label: 'YouTube', content_kind: 'video_upload_draft', max_title: 100, max_description: 5000, max_images: 0, video_required: true },
});

function text(value, max = 0) {
  const clean = String(value == null ? '' : value).replace(/\r\n?/g, '\n').trim();
  return max > 0 ? clean.slice(0, max) : clean;
}
function normalizedProvider(value) {
  const key = text(value).toLowerCase();
  if (key === 'facebook' || key === 'instagram') return 'meta';
  return PROVIDER_KEYS.includes(key) ? key : '';
}
function destinationAlias(value) {
  const clean = text(value || 'primary').toLowerCase().replace(/[^a-z0-9._:-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  return clean || 'primary';
}
function urlValue(value) {
  const clean = text(value, 1800);
  if (!clean) return '';
  try { return new URL(clean).toString(); } catch { return ''; }
}
function httpsUrl(value) {
  const url = urlValue(value);
  return /^https:\/\//i.test(url) && !/(^|\.)localhost$|127\.0\.0\.1|0\.0\.0\.0/i.test(new URL(url).hostname) ? url : '';
}
function list(value, max = 20) {
  const source = Array.isArray(value) ? value : [];
  return source.map((item) => text(item)).filter(Boolean).slice(0, max);
}
function mediaUrls(value, max) {
  return [...new Set(list(value, max).map(httpsUrl).filter(Boolean))].slice(0, max);
}
function error(errors, code, field) { errors.push({ code, field }); }
function warning(warnings, code, field) { warnings.push({ code, field }); }
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}
function stableJson(value) { return JSON.stringify(canonical(value)); }
function finiteNumber(value) {
  if (value === '' || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function integer(value) {
  const parsed = finiteNumber(value);
  return parsed == null ? null : Math.max(0, Math.trunc(parsed));
}
function uniqueTags(value, max) {
  return [...new Set(list(value, max * 2).map((item) => text(item, 40).toLowerCase()).filter(Boolean))].sort().slice(0, max);
}

export function listProviderPublicationContracts() {
  return PROVIDER_KEYS.map((key) => ({
    provider: key,
    label: CONTRACTS[key].label,
    content_kind: CONTRACTS[key].content_kind,
    validation_policy: 'release460_internal_preview_v1',
    execution_boundary: { ...EXECUTION_BOUNDARY },
  }));
}

export async function buildProviderPublicationPlan(providerKey, input = {}) {
  const provider = normalizedProvider(providerKey);
  if (!provider) throw new Error('provider_publication_provider_unsupported');
  const contract = CONTRACTS[provider];
  const errors = [];
  const warnings = [];
  const destination = destinationAlias(input.destination_alias || input.destination_key || 'primary');
  const linkUrl = urlValue(input.link_url || input.url || '');
  const requestedImages = Array.isArray(input.image_urls) ? input.image_urls : [];
  const images = mediaUrls(requestedImages, contract.max_images || 0);
  if (requestedImages.length && images.length !== Math.min(requestedImages.length, contract.max_images || 0)) warning(warnings, 'non_https_or_excess_media_removed', 'image_urls');

  let surface = null;
  let payload = {};

  if (provider === 'etsy') {
    const title = text(input.title, contract.max_title);
    const description = text(input.description || input.caption, contract.max_description);
    const price = finiteNumber(input.price);
    const quantity = integer(input.quantity);
    const tags = uniqueTags(input.tags, contract.max_tags);
    if (!title) error(errors, 'title_required', 'title');
    if (!description) error(errors, 'description_required', 'description');
    if (price == null || price < 0) error(errors, 'non_negative_price_required', 'price');
    if (quantity == null) error(errors, 'quantity_required', 'quantity');
    if (!images.length) warning(warnings, 'public_https_image_recommended', 'image_urls');
    payload = { title, description, price, quantity, tags, image_urls: images, product_reference: text(input.product_reference, 120) || null };
  } else if (provider === 'pinterest') {
    const title = text(input.title, contract.max_title);
    const description = text(input.description || input.caption, contract.max_description);
    if (!title) error(errors, 'title_required', 'title');
    if (!description) error(errors, 'description_required', 'description');
    if (!images.length) error(errors, 'public_https_image_required', 'image_urls');
    payload = { title, description, link_url: linkUrl || null, image_url: images[0] || null };
  } else if (provider === 'meta') {
    surface = text(input.surface).toLowerCase();
    if (!contract.surfaces.includes(surface)) error(errors, 'meta_surface_required', 'surface');
    const caption = text(input.caption || input.description, contract.max_caption);
    if (!caption) error(errors, 'caption_required', 'caption');
    if (surface === 'instagram_business' && !images.length) error(errors, 'instagram_public_https_image_required', 'image_urls');
    payload = { surface: surface || null, caption, link_url: linkUrl || null, image_urls: images };
  } else if (provider === 'x') {
    const caption = text(input.caption || input.description, contract.max_caption);
    if (!caption) error(errors, 'caption_required', 'caption');
    payload = { text: caption, image_urls: images, link_url: linkUrl || null };
  } else if (provider === 'tiktok') {
    const caption = text(input.caption || input.description, contract.max_caption);
    const videoUrl = httpsUrl(input.video_url);
    if (!videoUrl) error(errors, 'public_https_video_required', 'video_url');
    if (!caption) warning(warnings, 'caption_recommended', 'caption');
    payload = { caption, video_url: videoUrl || null };
  } else if (provider === 'youtube') {
    const title = text(input.title, contract.max_title);
    const description = text(input.description || input.caption, contract.max_description);
    const videoUrl = httpsUrl(input.video_url);
    if (!title) error(errors, 'title_required', 'title');
    if (!videoUrl) error(errors, 'public_https_video_required', 'video_url');
    payload = { title, description, video_url: videoUrl || null, privacy_intent: text(input.privacy_intent, 40) || 'private_review' };
  }

  const fingerprintMaterial = {
    version: 'release460-provider-publication-v1',
    provider,
    destination_alias: destination,
    surface,
    payload,
  };
  const digest = await sha256Base64Url(stableJson(fingerprintMaterial));
  const idempotencyKey = `r460_${provider}_${digest}`;
  const prior = [...new Set(list(input.prior_idempotency_keys, 100))];
  const duplicate = prior.includes(idempotencyKey);

  return {
    release: 460,
    provider,
    provider_label: contract.label,
    content_kind: contract.content_kind,
    validation_policy: 'release460_internal_preview_v1',
    valid: errors.length === 0,
    errors,
    warnings,
    destination: { alias: destination, surface },
    payload_preview: payload,
    idempotency: {
      key: idempotencyKey,
      deterministic: true,
      duplicate_of_prior_key: duplicate,
      disposition: duplicate ? 'duplicate_blocked' : 'new_or_revised',
    },
    execution_boundary: { ...EXECUTION_BOUNDARY },
    provider_subject_values_emitted: false,
    secret_values_emitted: false,
  };
}
