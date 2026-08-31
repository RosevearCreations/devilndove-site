import { auditAdminAction } from '../_lib/adminAudit.js';

function text(value) { return String(value || '').trim(); }
export function boundedRetentionDays(value) { return Math.max(7, Math.min(Number(value || 30), 365)); }
export async function retentionReviews(db) {
  const result = await db.prepare(`SELECT operational_retention_review_id,resource_type,older_than_days,review_status,candidate_count,archive_item_count,archive_reference,requested_by_user_id,requested_at,approved_by_user_id,approved_at,consumed_by_user_id,consumed_at,admin_note FROM operational_retention_reviews WHERE resource_type='runtime_incidents' ORDER BY operational_retention_review_id DESC LIMIT 12`).all();
  return Array.isArray(result?.results) ? result.results : [];
}
export async function requestRetentionReview(context, adminUser, db, body) {
  const days = boundedRetentionDays(body?.older_than_days);
  const note = text(body?.admin_note || body?.note);
  const candidate = await db.prepare(`SELECT COUNT(*) AS count_value FROM runtime_incidents WHERE LOWER(COALESCE(review_status,'open')) IN ('resolved','ignored') AND datetime(COALESCE(created_at,datetime('now'))) < datetime('now',?)`).bind(`-${days} days`).first();
  const candidateCount = Number(candidate?.count_value || 0);
  const inserted = await db.prepare(`INSERT INTO operational_retention_reviews(resource_type,older_than_days,review_status,candidate_count,archive_item_count,archive_reference,requested_by_user_id,requested_at,admin_note) VALUES('runtime_incidents',?,'archived_pending_approval',?,0,NULL,?,CURRENT_TIMESTAMP,?)`).bind(days,candidateCount,Number(adminUser.user_id||0),note||null).run();
  const reviewId = Number(inserted?.meta?.last_row_id || 0);
  if (!reviewId) throw new Error('Retention review could not be created.');
  if (candidateCount > 0) {
    await db.prepare(`INSERT INTO operational_retention_archive_items(operational_retention_review_id,resource_type,source_id,payload_json,archived_at) SELECT ?,'runtime_incidents',runtime_incident_id,json_object('runtime_incident_id',runtime_incident_id,'incident_scope',incident_scope,'incident_code',incident_code,'severity',severity,'endpoint_path',endpoint_path,'request_method',request_method,'message',message,'details_json',details_json,'related_user_id',related_user_id,'review_status',review_status,'admin_note',admin_note,'reviewed_by_user_id',reviewed_by_user_id,'reviewed_at',reviewed_at,'created_at',created_at),CURRENT_TIMESTAMP FROM runtime_incidents WHERE LOWER(COALESCE(review_status,'open')) IN ('resolved','ignored') AND datetime(COALESCE(created_at,datetime('now'))) < datetime('now',?)`).bind(reviewId,`-${days} days`).run();
  }
  const archived = await db.prepare(`SELECT COUNT(*) AS count_value FROM operational_retention_archive_items WHERE operational_retention_review_id=?`).bind(reviewId).first();
  const archiveCount = Number(archived?.count_value || 0);
  const archiveReference = `d1://operational_retention_archive_items/review/${reviewId}`;
  await db.prepare(`UPDATE operational_retention_reviews SET archive_item_count=?,archive_reference=? WHERE operational_retention_review_id=?`).bind(archiveCount,archiveReference,reviewId).run();
  if (archiveCount !== candidateCount) {
    await db.prepare(`UPDATE operational_retention_reviews SET review_status='rejected',admin_note=COALESCE(admin_note,'') || ? WHERE operational_retention_review_id=?`).bind(` Archive count mismatch: ${archiveCount}/${candidateCount}.`,reviewId).run();
    throw new Error('Retention archive count did not match candidate count; review rejected fail-closed.');
  }
  await auditAdminAction(context.env,context.request,adminUser,{action_type:'runtime_incident_retention_archived',target_type:'operational_retention_reviews',target_id:reviewId,details:{older_than_days:days,candidate_count:candidateCount,archive_item_count:archiveCount,archive_reference:archiveReference}});
  return { ok:true, review_id:reviewId, review_status:'archived_pending_approval', candidate_count:candidateCount, archive_item_count:archiveCount, archive_reference:archiveReference };
}
export async function decideRetentionReview(context, adminUser, db, body, approve) {
  const reviewId = Number(body?.retention_review_id || body?.review_id || 0);
  if (!Number.isInteger(reviewId) || reviewId <= 0) return { status:400, data:{ok:false,error:'A retention review id is required.'} };
  const review = await db.prepare(`SELECT * FROM operational_retention_reviews WHERE operational_retention_review_id=? AND resource_type='runtime_incidents' LIMIT 1`).bind(reviewId).first();
  if (!review || review.review_status !== 'archived_pending_approval') return { status:409, data:{ok:false,error:'Retention review is not awaiting approval.'} };
  if (approve && Number(review.archive_item_count||0) !== Number(review.candidate_count||0)) return { status:409, data:{ok:false,error:'Archive evidence is incomplete; approval is refused.'} };
  const next = approve ? 'approved' : 'rejected';
  const note = text(body?.admin_note || body?.note);
  await db.prepare(`UPDATE operational_retention_reviews SET review_status=?,approved_by_user_id=?,approved_at=CURRENT_TIMESTAMP,admin_note=CASE WHEN ?='' THEN admin_note ELSE ? END WHERE operational_retention_review_id=?`).bind(next,Number(adminUser.user_id||0),note,note,reviewId).run();
  await auditAdminAction(context.env,context.request,adminUser,{action_type:`runtime_incident_retention_${next}`,target_type:'operational_retention_reviews',target_id:reviewId,details:{candidate_count:Number(review.candidate_count||0),archive_item_count:Number(review.archive_item_count||0),archive_reference:review.archive_reference||null}});
  return { status:200, data:{ok:true,review_id:reviewId,review_status:next} };
}
export async function consumeRetentionReview(context, adminUser, db, body) {
  const reviewId = Number(body?.retention_review_id || body?.review_id || 0);
  if (!Number.isInteger(reviewId) || reviewId <= 0) return { status:400, data:{ok:false,error:'Cleanup requires an approved archived retention review id.'} };
  const review = await db.prepare(`SELECT * FROM operational_retention_reviews WHERE operational_retention_review_id=? AND resource_type='runtime_incidents' LIMIT 1`).bind(reviewId).first();
  if (!review || review.review_status !== 'approved' || !text(review.archive_reference)) return { status:409, data:{ok:false,error:'Cleanup refused: archived retention review is not approved.'} };
  const count = await db.prepare(`SELECT COUNT(*) AS count_value FROM operational_retention_archive_items WHERE operational_retention_review_id=? AND resource_type='runtime_incidents'`).bind(reviewId).first();
  const archiveCount = Number(count?.count_value || 0);
  if (archiveCount !== Number(review.archive_item_count||0) || archiveCount !== Number(review.candidate_count||0)) return { status:409, data:{ok:false,error:'Cleanup refused: archive evidence count drifted.'} };
  const deleted = await db.prepare(`DELETE FROM runtime_incidents WHERE runtime_incident_id IN (SELECT source_id FROM operational_retention_archive_items WHERE operational_retention_review_id=? AND resource_type='runtime_incidents') AND LOWER(COALESCE(review_status,'open')) IN ('resolved','ignored')`).bind(reviewId).run();
  await db.prepare(`UPDATE operational_retention_reviews SET review_status='consumed',consumed_by_user_id=?,consumed_at=CURRENT_TIMESTAMP WHERE operational_retention_review_id=? AND review_status='approved'`).bind(Number(adminUser.user_id||0),reviewId).run();
  const deletedCount = Number(deleted?.meta?.changes || 0);
  await auditAdminAction(context.env,context.request,adminUser,{action_type:'runtime_incident_cleanup_archived_approved',target_type:'operational_retention_reviews',target_id:reviewId,details:{deleted_count:deletedCount,archive_reference:review.archive_reference}});
  return { status:200, data:{ok:true,review_id:reviewId,review_status:'consumed',deleted_count:deletedCount,archive_reference:review.archive_reference} };
}
