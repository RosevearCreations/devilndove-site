// Build 436 hotfix — read the *canonical* Product gallery and its image annotations.
// Product images own image_url / sort_order; distribution dimensions and public-use
// approvals are owned by product_image_annotations, NEVER by product_images.
// Never fabricate approval when annotation metadata is missing.
export const CANONICAL_DISTRIBUTION_GALLERY_SQL = `
  SELECT pi.product_image_id, pi.product_id, pi.image_url,
         COALESCE(NULLIF(TRIM(pi.alt_text), ''), pia.alt_text, '') AS alt_text,
         COALESCE(pia.image_role, '') AS image_role,
         COALESCE(pia.public_use_status, 'internal_review') AS public_use_status,
         pia.width_px AS width_px, pia.height_px AS height_px,
         pi.sort_order AS sort_order
  FROM product_images pi
  LEFT JOIN product_image_annotations pia ON pia.product_image_id = pi.product_image_id
  WHERE pi.product_id = ?
  ORDER BY pi.sort_order ASC, pi.product_image_id ASC LIMIT 60`;

export const CANONICAL_GALLERY_UNANNOTATED_SQL = `
  SELECT product_image_id, product_id, image_url, alt_text,
         '' AS image_role, 'internal_review' AS public_use_status,
         NULL AS width_px, NULL AS height_px, sort_order
  FROM product_images WHERE product_id=?
  ORDER BY sort_order ASC, product_image_id ASC LIMIT 60`;

export async function readCanonicalDistributionGallery(db, productId) {
  try {
    const result=await db.prepare(CANONICAL_DISTRIBUTION_GALLERY_SQL).bind(productId).all();
    return {images:Array.isArray(result?.results)?result.results:[],annotation_authority:'canonical_product_image_annotations',annotation_unavailable:false};
  } catch (error) {
    // A legacy database without the annotation table must not break gallery viewing.
    // Such images are explicitly unapproved (internal_review, unknown dimensions).
    const message=String(error?.message||'');
    if (!/no such table:\s*product_image_annotations/i.test(message)) throw error;
    const result=await db.prepare(CANONICAL_GALLERY_UNANNOTATED_SQL).bind(productId).all();
    return {images:Array.isArray(result?.results)?result.results:[],annotation_authority:'missing_annotations_unapproved_only',annotation_unavailable:true};
  }
}
