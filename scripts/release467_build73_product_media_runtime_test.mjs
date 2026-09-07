import assert from 'node:assert/strict';
import { convergeProductMedia } from '../functions/api/_lib/productMediaAuthority.js';

const checks = [];
function check(label, fn) {
  fn();
  checks.push(label);
  console.log(`${String(checks.length).padStart(2, '0')}. PASS — ${label}`);
}

const product = {
  product_id: 73,
  name: 'Build 73 Test Pendant',
  slug: 'build-73-test-pendant',
  sku: 'DND-B73',
  status: 'draft',
  review_status: 'pending_review',
  featured_image_url: 'https://assets.devilndove.com/products/73/front.jpg?v=old',
};
const seo = { og_image_url: 'https://assets.devilndove.com/products/73/detail.jpg' };
const galleryRows = [
  { product_image_id: 1, product_id: 73, image_url: 'https://assets.devilndove.com/products/73/front.jpg', alt_text: '', sort_order: 0 },
  { product_image_id: 2, product_id: 73, image_url: 'https://assets.devilndove.com/products/73/detail.jpg', alt_text: 'Detailed pendant texture and finish', sort_order: 1 },
  { product_image_id: 4, product_id: 73, image_url: 'https://assets.devilndove.com/products/73/private.jpg', alt_text: 'Private process photograph', sort_order: 2 },
];
const mediaRows = [
  { media_asset_id: 101, product_id: 73, public_url: 'https://assets.devilndove.com/products/73/front.jpg?cache=1', object_key: 'products/73/front.jpg', storage_provider: 'r2', bucket_name: 'product-media', original_filename: 'front.jpg', sort_order: 0 },
  { media_asset_id: 103, product_id: 73, public_url: 'https://assets.devilndove.com/products/73/unused.jpg', object_key: 'products/73/unused.jpg', storage_provider: 'r2', bucket_name: 'product-media', original_filename: 'unused-product-photo.jpg', sort_order: 8 },
];
const roleRows = [
  { product_media_role_assignment_id: 501, product_id: 73, role_key: 'social_share', product_image_id: 2, image_url: 'https://assets.devilndove.com/products/73/detail.jpg', assignment_status: 'assigned' },
];
const annotationRows = [
  { product_image_annotation_id: 701, product_id: 73, product_image_id: 1, image_url: 'https://assets.devilndove.com/products/73/front.jpg', alt_text: 'Front view of handmade pendant on neutral background', focal_point_x: 0.5, focal_point_y: 0.45, image_role: 'hero_front', public_use_status: 'product_page_ok', width_px: 1600, height_px: 1600 },
  { product_image_annotation_id: 702, product_id: 73, product_image_id: 2, image_url: 'https://assets.devilndove.com/products/73/detail.jpg', alt_text: 'Detailed pendant texture and finish', focal_point_x: 0.52, focal_point_y: 0.48, image_role: 'detail_texture', public_use_status: 'all_public_ok', width_px: 1500, height_px: 1500 },
  { product_image_annotation_id: 704, product_id: 73, product_image_id: 4, image_url: 'https://assets.devilndove.com/products/73/private.jpg', alt_text: 'Private process photograph', image_role: 'process_story', public_use_status: 'consent_needed', width_px: 1400, height_px: 1400 },
];
const qualityRows = [
  { product_image_id: 1, image_url: 'https://assets.devilndove.com/products/73/front.jpg', quality_score: 82, acceptance_status: 'accepted', load_status: 'loaded', width_px: 1600, height_px: 1600 },
  { product_image_id: 2, image_url: 'https://assets.devilndove.com/products/73/detail.jpg', quality_score: 76, acceptance_status: 'supporting', load_status: 'loaded', width_px: 1500, height_px: 1500 },
];

const authority = convergeProductMedia({ product, seo, galleryRows, mediaRows, roleRows, annotationRows, qualityRows, assessmentRows: [] });

check('duplicate R2/gallery evidence converges to one canonical Product image', () => {
  assert.equal(authority.summary.unique_image_count, 4);
  assert.equal(authority.summary.gallery_image_count, 3);
  const front = authority.images.find((row) => row.product_image_id === 1);
  assert.equal(front.source, 'product_images');
  assert.deepEqual(front.evidence_sources.slice(0, 3), ['product_images', 'media_assets', 'product_image_annotations']);
  assert.equal(front.media_asset_id, 101);
});

check('featured image query variants resolve back to the canonical gallery row', () => {
  const front = authority.images.find((row) => row.product_image_id === 1);
  assert.equal(front.is_featured, true);
  assert.equal(authority.summary.featured_resolved, true);
  assert.equal(authority.summary.featured_in_gallery, true);
});

check('annotation alt text and focal point enrich the canonical gallery owner', () => {
  const front = authority.images.find((row) => row.product_image_id === 1);
  assert.equal(front.alt_text, 'Front view of handmade pendant on neutral background');
  assert.equal(front.alt_ready, true);
  assert.equal(front.focal_ready, true);
  assert.equal(front.focal_x, 0.5);
  assert.equal(front.quality_score, 82);
});

check('buyer-facing role assignment enriches the existing gallery image without duplicating it', () => {
  const detail = authority.images.find((row) => row.product_image_id === 2);
  assert.equal(detail.has_role_assignment, true);
  assert.equal(detail.role_assignment_id, 501);
  assert.equal(authority.summary.role_assigned_count, 1);
});

check('approved social-use image with sufficient alt and quality becomes a social candidate', () => {
  const detail = authority.images.find((row) => row.product_image_id === 2);
  assert.equal(detail.social_eligible, true);
  assert.equal(detail.is_seo_social, true);
  assert.equal(authority.social_candidates[0].product_image_id, 2);
  assert.equal(authority.summary.social_candidate_count, 1);
});

check('consent-needed Product media remains fail-closed for public/social use', () => {
  const privateImage = authority.images.find((row) => row.product_image_id === 4);
  assert.equal(privateImage.public_blocked, true);
  assert.equal(privateImage.product_page_eligible, false);
  assert.equal(privateImage.social_eligible, false);
});

check('linked R2 media outside gallery/roles is surfaced only as an unused-media review candidate', () => {
  assert.equal(authority.summary.unused_media_review_count, 1);
  assert.equal(authority.unused_media_review[0].media_asset_id, 103);
  assert.equal(authority.unused_media_review[0].safe_to_delete, false);
  assert.equal(authority.unused_media_review[0].deletion_requires_specialist_review, true);
});

check('unused-media review never changes Product or R2 ownership boundaries', () => {
  assert.equal(authority.boundaries.canonical_gallery_owner, 'product_images');
  assert.match(authority.boundaries.storage_owner, /no copy or delete/i);
  assert.match(authority.boundaries.unused_media_review, /review-only/i);
  assert.match(authority.boundaries.social_selection, /does not publish/i);
});

console.log(`BUILD 73 PRODUCT MEDIA / PHOTO STUDIO CONVERGENCE RUNTIME: PASS (${checks.length} checks)`);
