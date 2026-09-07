// Release 467 Build 73 — pure Product Media / Photo Studio convergence authority.
// This module consolidates existing Product media evidence. It never touches D1, R2 or providers.

export const PRODUCT_MEDIA_AUTHORITY_BUILD = 73;
export const PRODUCT_MEDIA_AUTHORITY_CONTRACT = 'product-owned-media-convergence';
export const PRODUCT_MEDIA_MAX_GALLERY = 20;
export const PRODUCT_MEDIA_MAX_SUPPORT = 30;
export const PRODUCT_MEDIA_MIN_ALT = 12;
export const PRODUCT_MEDIA_MIN_SOCIAL_SCORE = 55;

const text = (value) => String(value ?? '').trim();
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const cleanKey = (value) => text(value).toLowerCase().replace(/[?#].*$/, '').replace(/^https?:\/\/[^/]+/i, '').replace(/\/+$/, '');
const clamp01 = (value, fallback = null) => {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
};

const SOURCE_RANK = Object.freeze({
  product_images: 0,
  media_assets: 1,
  product_media_role_assignments: 2,
  product_image_annotations: 3,
});

const PRODUCT_PAGE_ALLOWED = new Set(['product_page_ok', 'all_public_ok']);
const SOCIAL_ALLOWED = new Set(['social_ok', 'all_public_ok']);
const PUBLIC_BLOCKED = new Set(['blocked', 'consent_needed']);

function normalizePublicUse(value) {
  const clean = text(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return clean || 'internal_review';
}

function normalizeRole(value, fallback = '') {
  return text(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || fallback;
}

function qualityFor(url, imageId, reviews = [], assessments = []) {
  const key = cleanKey(url);
  const review = reviews.find((row) => Number(row.product_image_id || 0) === Number(imageId || 0) || cleanKey(row.image_url) === key) || null;
  const assessment = assessments.find((row) => cleanKey(row.image_url) === key) || null;
  const reviewScore = review == null ? null : number(review.quality_score, 0);
  const assessmentScore = assessment == null ? null : number(assessment.total_score, 0);
  const score = reviewScore != null ? reviewScore : assessmentScore;
  return {
    score,
    acceptance_status: text(review?.acceptance_status || assessment?.status) || 'unverified',
    load_status: text(review?.load_status) || 'unknown',
    width_px: number(review?.width_px || assessment?.width_px, 0) || null,
    height_px: number(review?.height_px || assessment?.height_px, 0) || null,
    reviewed_at: review?.updated_at || review?.reviewed_at || assessment?.updated_at || assessment?.scored_at || null,
    source: review ? 'product_image_quality_reviews' : assessment ? 'product_image_quality_assessments' : 'none',
  };
}

function annotationFor(url, imageId, annotations = []) {
  const key = cleanKey(url);
  return annotations.find((row) => Number(row.product_image_id || 0) === Number(imageId || 0) || cleanKey(row.image_url) === key) || null;
}

function roleFor(url, imageId, roles = []) {
  const key = cleanKey(url);
  return roles.find((row) => text(row.assignment_status || 'assigned').toLowerCase() !== 'removed' && (
    Number(row.product_image_id || 0) === Number(imageId || 0) || cleanKey(row.image_url) === key
  )) || null;
}

function mediaMetadataFor(url, mediaId, mediaRows = []) {
  const key = cleanKey(url);
  return mediaRows.find((row) => Number(row.media_asset_id || 0) === Number(mediaId || 0) || cleanKey(row.public_url) === key) || null;
}

function makeImage(row, source, index, context) {
  const url = text(row.image_url || row.public_url);
  if (!url) return null;
  const imageId = Number(row.product_image_id || 0) || null;
  const mediaId = Number(row.media_asset_id || 0) || null;
  const annotation = annotationFor(url, imageId, context.annotations);
  const roleAssignment = roleFor(url, imageId, context.roles);
  const media = mediaMetadataFor(url, mediaId, context.mediaRows);
  const quality = qualityFor(url, imageId, context.reviews, context.assessments);
  const alt = text(row.alt_text || annotation?.alt_text || media?.managed_alt_text || row.original_filename || annotation?.image_title);
  const publicUse = normalizePublicUse(annotation?.public_use_status || row.public_use_status);
  const role = normalizeRole(roleAssignment?.role_key || annotation?.image_role || row.variant_role, index === 0 && source === 'product_images' ? 'main' : 'gallery_support');
  const focalX = clamp01(annotation?.focal_point_x ?? media?.focal_x, null);
  const focalY = clamp01(annotation?.focal_point_y ?? media?.focal_y, null);
  const width = number(annotation?.width_px || media?.width_px || quality.width_px, 0) || null;
  const height = number(annotation?.height_px || media?.height_px || quality.height_px, 0) || null;
  const merchandisingScore = annotation?.merchandising_score == null ? null : number(annotation.merchandising_score, 0);
  const effectiveScore = quality.score == null ? merchandisingScore : quality.score;
  const blocked = PUBLIC_BLOCKED.has(publicUse);
  const altReady = alt.length >= PRODUCT_MEDIA_MIN_ALT;
  const qualityKnown = effectiveScore != null;
  const socialEligible = !blocked && SOCIAL_ALLOWED.has(publicUse) && altReady && qualityKnown && effectiveScore >= PRODUCT_MEDIA_MIN_SOCIAL_SCORE;
  const productPageEligible = !blocked && PRODUCT_PAGE_ALLOWED.has(publicUse) && altReady;
  const key = cleanKey(url);
  return {
    canonical_key: key,
    image_url: url,
    product_image_id: imageId,
    media_asset_id: mediaId || (media ? Number(media.media_asset_id || 0) || null : null),
    source,
    source_rank: SOURCE_RANK[source] ?? 99,
    evidence_sources: [source],
    sort_order: number(row.sort_order, index),
    alt_text: alt,
    alt_text_length: alt.length,
    alt_ready: altReady,
    image_title: text(annotation?.image_title || media?.image_title),
    caption: text(annotation?.caption || media?.caption),
    role_key: role,
    role_assignment_id: Number(roleAssignment?.product_media_role_assignment_id || 0) || null,
    public_use_status: publicUse,
    consent_record_id: Number(annotation?.consent_record_id || 0) || null,
    focal_x: focalX,
    focal_y: focalY,
    focal_ready: focalX != null && focalY != null,
    width_px: width,
    height_px: height,
    image_orientation: text(annotation?.image_orientation || media?.image_orientation),
    merchandising_score: merchandisingScore,
    quality_score: effectiveScore,
    quality_source: quality.source,
    quality_status: quality.acceptance_status,
    quality_reviewed_at: quality.reviewed_at,
    storage_provider: text(media?.storage_provider) || null,
    bucket_name: text(media?.bucket_name) || null,
    object_key: text(media?.object_key) || null,
    product_page_eligible: productPageEligible,
    social_eligible: socialEligible,
    public_blocked: blocked,
  };
}

function mergeEvidence(target, candidate) {
  const evidence = new Set([...(target.evidence_sources || []), ...(candidate.evidence_sources || [])]);
  target.evidence_sources = [...evidence].sort((a, b) => (SOURCE_RANK[a] ?? 99) - (SOURCE_RANK[b] ?? 99));
  for (const field of ['role_key','role_assignment_id','public_use_status','consent_record_id','focal_x','focal_y','width_px','height_px','image_orientation','merchandising_score','quality_score','quality_source','quality_status','quality_reviewed_at','storage_provider','bucket_name','object_key','media_asset_id','product_image_id','image_title','caption']) {
    if ((target[field] == null || target[field] === '' || target[field] === 'internal_review' || target[field] === 'none') && candidate[field] != null && candidate[field] !== '') target[field] = candidate[field];
  }
  if (!target.alt_text && candidate.alt_text) target.alt_text = candidate.alt_text;
  return target;
}

export function convergeProductMedia({ product = {}, seo = {}, galleryRows = [], mediaRows = [], roleRows = [], annotationRows = [], qualityRows = [], assessmentRows = [] } = {}) {
  const context = { mediaRows, roles: roleRows, annotations: annotationRows, reviews: qualityRows, assessments: assessmentRows };
  const candidates = [];
  galleryRows.slice(0, PRODUCT_MEDIA_MAX_GALLERY).forEach((row, index) => candidates.push(makeImage(row, 'product_images', index, context)));
  mediaRows.slice(0, PRODUCT_MEDIA_MAX_SUPPORT).forEach((row, index) => candidates.push(makeImage(row, 'media_assets', index + 30, context)));
  roleRows.slice(0, PRODUCT_MEDIA_MAX_SUPPORT).forEach((row, index) => candidates.push(makeImage(row, 'product_media_role_assignments', index + 60, context)));
  annotationRows.slice(0, PRODUCT_MEDIA_MAX_SUPPORT).forEach((row, index) => candidates.push(makeImage(row, 'product_image_annotations', index + 90, context)));

  const byKey = new Map();
  for (const candidate of candidates.filter(Boolean)) {
    if (!candidate.canonical_key) continue;
    const existing = byKey.get(candidate.canonical_key);
    if (!existing) {
      byKey.set(candidate.canonical_key, candidate);
      continue;
    }
    if (candidate.source_rank < existing.source_rank) {
      byKey.set(candidate.canonical_key, mergeEvidence(candidate, existing));
    } else {
      mergeEvidence(existing, candidate);
    }
  }

  const images = Array.from(byKey.values()).sort((a, b) => a.source_rank - b.source_rank || a.sort_order - b.sort_order || a.canonical_key.localeCompare(b.canonical_key));
  const featuredKey = cleanKey(product.featured_image_url);
  const ogKey = cleanKey(seo.og_image_url || product.og_image_url);
  let canonicalGalleryPosition = 0;
  images.forEach((image) => {
    image.has_canonical_gallery_reference = image.evidence_sources.includes('product_images');
    image.has_r2_media_reference = image.evidence_sources.includes('media_assets');
    image.has_role_assignment = Boolean(image.role_assignment_id) || image.evidence_sources.includes('product_media_role_assignments');
    image.has_annotation_reference = image.evidence_sources.includes('product_image_annotations');
    image.is_featured = Boolean(featuredKey && image.canonical_key === featuredKey);
    image.is_seo_social = Boolean(ogKey && image.canonical_key === ogKey);
    image.gallery_position = image.has_canonical_gallery_reference ? ++canonicalGalleryPosition : null;
    image.alt_text_length = text(image.alt_text).length;
    image.alt_ready = image.alt_text_length >= PRODUCT_MEDIA_MIN_ALT;
    image.focal_ready = image.focal_x != null && image.focal_y != null;
    const blocked = PUBLIC_BLOCKED.has(image.public_use_status);
    image.public_blocked = blocked;
    image.product_page_eligible = !blocked && PRODUCT_PAGE_ALLOWED.has(image.public_use_status) && image.alt_ready;
    image.social_eligible = !blocked && SOCIAL_ALLOWED.has(image.public_use_status) && image.alt_ready && image.quality_score != null && Number(image.quality_score) >= PRODUCT_MEDIA_MIN_SOCIAL_SCORE;
  });

  const featured = images.find((image) => image.is_featured) || images.find((image) => image.has_canonical_gallery_reference) || images[0] || null;
  const socialCandidates = images.filter((image) => image.social_eligible).sort((a, b) => Number(b.is_seo_social) - Number(a.is_seo_social) || Number(b.quality_score || 0) - Number(a.quality_score || 0));
  const unusedMediaReview = images.filter((image) => image.has_r2_media_reference && !image.has_canonical_gallery_reference && !image.has_role_assignment && !image.is_featured && !image.is_seo_social).map((image) => ({
    ...image,
    review_reason: 'Linked R2 Product media is not in the canonical gallery, featured/SEO selection, or a buyer-facing media role.',
    safe_to_delete: false,
    deletion_requires_specialist_review: true,
  }));
  const sourceCounts = {};
  for (const image of images) {
    for (const source of image.evidence_sources) sourceCounts[source] = Number(sourceCounts[source] || 0) + 1;
  }

  return {
    product: {
      product_id: Number(product.product_id || 0),
      name: text(product.name),
      slug: text(product.slug),
      sku: text(product.sku),
      status: text(product.status),
      review_status: text(product.review_status),
      featured_image_url: text(product.featured_image_url) || null,
      og_image_url: text(seo.og_image_url || product.og_image_url) || null,
    },
    images,
    social_candidates: socialCandidates,
    unused_media_review: unusedMediaReview,
    summary: {
      unique_image_count: images.length,
      gallery_image_count: images.filter((image) => image.has_canonical_gallery_reference).length,
      r2_linked_image_count: images.filter((image) => image.has_r2_media_reference).length,
      support_recovery_count: images.filter((image) => !image.has_canonical_gallery_reference).length,
      role_assigned_count: images.filter((image) => image.has_role_assignment).length,
      featured_resolved: Boolean(featured),
      featured_in_gallery: Boolean(featured?.has_canonical_gallery_reference),
      featured_alt_ready: Boolean(featured?.alt_ready),
      featured_quality_score: featured?.quality_score ?? null,
      seo_social_image_resolved: Boolean(ogKey && images.some((image) => image.canonical_key === ogKey)),
      social_candidate_count: socialCandidates.length,
      product_page_candidate_count: images.filter((image) => image.product_page_eligible).length,
      unused_media_review_count: unusedMediaReview.length,
      blocked_public_count: images.filter((image) => image.public_blocked).length,
      missing_alt_count: images.filter((image) => !image.alt_ready).length,
      missing_focal_count: images.filter((image) => !image.focal_ready).length,
      source_counts: sourceCounts,
    },
    boundaries: {
      canonical_gallery_owner: 'product_images',
      supporting_recovery_authorities: ['media_assets','product_media_role_assignments','product_image_annotations'],
      storage_owner: 'R2/media_assets references; no copy or delete in this projection',
      unused_media_review: 'review-only; never implies that an R2 object is safe to delete',
      social_selection: 'approved Product media only; selection does not publish',
      write_owner: '/api/admin/product-images and /api/admin/product-media-score',
    },
  };
}
