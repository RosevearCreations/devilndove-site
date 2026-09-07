// Release 467 Build 73 — bounded, read-only Product Media / Photo Studio convergence endpoint.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { buildReadBudgetHeaders } from '../_lib/d1ReadBudget.js';
import { convergeProductMedia, PRODUCT_MEDIA_AUTHORITY_BUILD } from '../_lib/productMediaAuthority.js';

const BUILD = PRODUCT_MEDIA_AUTHORITY_BUILD;
const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const json = (data, status = 200) => jsonResponse({ release: 467, build: BUILD, ...data }, status, {
  'Cache-Control': 'no-store',
  ...buildReadBudgetHeaders('admin_product_media_authority', { limit: 30 }),
});

async function safeAll(db, sql, bindings = []) {
  try { return rows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; }
}
async function safeFirst(db, sql, bindings = []) {
  try { return await db.prepare(sql).bind(...bindings).first(); } catch { return null; }
}

export async function onRequestGet(context) {
  const admin = await getAdminUserFromRequest(context.request, context.env);
  if (!admin) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const productId = Number(new URL(context.request.url).searchParams.get('product_id') || 0);
  if (!Number.isInteger(productId) || productId <= 0) return json({ ok: false, error: 'A valid product_id is required.' }, 400);

  try {
    const product = await safeFirst(db, `
      SELECT product_id,name,slug,sku,status,review_status,featured_image_url,updated_at
      FROM products WHERE product_id=? LIMIT 1
    `, [productId]);
    if (!product) return json({ ok: false, error: 'Product not found.' }, 404);

    const [seo, galleryRows, mediaRows, roleRows, annotationRows, qualityRows, assessmentRows] = await Promise.all([
      safeFirst(db, `SELECT product_id,og_image_url,og_title,og_description FROM product_seo WHERE product_id=? LIMIT 1`, [productId]),
      safeAll(db, `
        SELECT product_image_id,product_id,image_url,alt_text,sort_order,created_at
        FROM product_images WHERE product_id=?
        ORDER BY sort_order ASC,product_image_id ASC LIMIT 20
      `, [productId]),
      safeAll(db, `
        SELECT media_asset_id,product_id,storage_provider,bucket_name,object_key,public_url,original_filename,mime_type,
               variant_role,sort_order,annotation_notes,created_at,updated_at,deleted_at
        FROM media_assets
        WHERE product_id=? AND deleted_at IS NULL AND TRIM(COALESCE(public_url,''))<>''
        ORDER BY COALESCE(sort_order,999999),media_asset_id ASC LIMIT 30
      `, [productId]),
      safeAll(db, `
        SELECT product_media_role_assignment_id,product_id,role_key,product_image_id,image_url,assignment_status,notes,updated_at
        FROM product_media_role_assignments
        WHERE product_id=? AND COALESCE(assignment_status,'assigned')<>'removed'
        ORDER BY role_key,product_media_role_assignment_id ASC LIMIT 20
      `, [productId]),
      safeAll(db, `
        SELECT product_image_annotation_id,product_id,product_image_id,image_url,alt_text,image_title,caption,
               focal_point_x,focal_point_y,annotation_notes,width_px,height_px,image_orientation,merchandising_score,
               image_role,public_use_status,consent_record_id,role_review_notes,updated_at
        FROM product_image_annotations
        WHERE product_id=? AND TRIM(COALESCE(image_url,''))<>''
        ORDER BY updated_at DESC,product_image_annotation_id DESC LIMIT 30
      `, [productId]),
      safeAll(db, `
        SELECT product_image_quality_review_id,product_id,product_image_id,image_url,width_px,height_px,load_status,
               quality_score,acceptance_status,review_source,reviewed_at,updated_at
        FROM product_image_quality_reviews
        WHERE product_id=? ORDER BY updated_at DESC,product_image_quality_review_id DESC LIMIT 30
      `, [productId]),
      safeAll(db, `
        SELECT product_image_quality_assessment_id,product_id,image_url,total_score,width_px,height_px,status,scored_at,updated_at
        FROM product_image_quality_assessments
        WHERE product_id=? ORDER BY updated_at DESC,product_image_quality_assessment_id DESC LIMIT 30
      `, [productId]),
    ]);

    const authority = convergeProductMedia({
      product,
      seo: seo || {},
      galleryRows,
      mediaRows,
      roleRows,
      annotationRows,
      qualityRows,
      assessmentRows,
    });

    return json({
      ok: true,
      response_profile: 'product_media_convergence_v73',
      read_only: true,
      product_owned: true,
      automatic_publish: false,
      automatic_social_publish: false,
      automatic_r2_copy: false,
      automatic_r2_delete: false,
      requested_by: { user_id: admin.user_id, email: admin.email, display_name: admin.display_name },
      authority,
      read_budget: {
        product: 1,
        seo: 1,
        product_images: 20,
        media_assets: 30,
        role_assignments: 20,
        annotations: 30,
        quality_reviews: 30,
        quality_assessments: 30,
      },
      owners: {
        gallery_and_annotations: '/api/admin/product-images',
        role_and_primary_quality: '/api/admin/product-media-score',
        focused_workspace: '/admin/catalog-media/',
        static_site_media: '/admin/media-content-studio/',
      },
    });
  } catch (error) {
    return json({ ok: false, read_only: true, error: 'Product media authority could not be loaded.', detail: String(error?.message || error) }, 503);
  }
}
