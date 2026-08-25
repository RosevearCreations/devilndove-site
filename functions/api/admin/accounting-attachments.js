import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { buildAccountingAttachmentPublicUrl, cleanAttachmentKind, cleanAttachmentScope, cleanAttachmentStatus, cleanDocumentDate, ensureAccountingAttachmentsTable } from './_accountingAttachments.js';
import { BUILD, CONTRACT_ID, OWNER, readAccountingAttachments } from '../_lib/accountingAttachmentsReadService.js';

function json(data, status = 200) { return jsonResponse(data, status); }
function sanitizeFilename(filename) {
  const cleaned = String(filename || 'upload').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '');
  return cleaned || 'upload';
}
function inferExtension(filename, mimeType) {
  const fromName = String(filename || '').match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  const map = { 'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','text/csv':'csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'xlsx','application/vnd.ms-excel':'xls','application/vnd.openxmlformats-officedocument.wordprocessingml.document':'docx','application/msword':'doc','text/plain':'txt' };
  return map[String(mimeType || '').toLowerCase()] || 'bin';
}
function isAllowedMime(mimeType) {
  const type = String(mimeType || '').toLowerCase();
  return type.startsWith('image/') || ['application/pdf','text/plain','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword'].includes(type);
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const url = new URL(context.request.url);
  try {
    return json(await readAccountingAttachments(db, {
      expenseId: Number(url.searchParams.get('expense_id') || 0), vendorId: Number(url.searchParams.get('vendor_id') || 0),
      reconciliationType: url.searchParams.get('reconciliation_type') || '', periodMonth: url.searchParams.get('period_month') || '', taxYear: url.searchParams.get('tax_year') || '',
      scopeKey: url.searchParams.get('scope_key') || '', attachmentKind: url.searchParams.get('attachment_kind') || '', attachmentScope: url.searchParams.get('attachment_scope') || '',
      providerScope: url.searchParams.get('provider_scope') || '', limit: Number(url.searchParams.get('limit') || 50),
    }));
  } catch (error) {
    return json({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, error: error?.message || 'Failed to load accounting attachments.' }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAccountingAttachmentsTable(db);

  const bucket = env.ACCOUNTING_ATTACHMENTS_BUCKET || env.PRODUCT_MEDIA_BUCKET || env.MEDIA_BUCKET || env.R2_PRODUCT_MEDIA;
  if (!bucket || typeof bucket.put !== 'function') return json({ ok: false, error: 'R2 attachment bucket binding is missing.' }, 500);

  let form;
  try { form = await request.formData(); } catch { return json({ ok: false, error: 'Expected multipart/form-data upload.' }, 400); }
  const file = form.get('file');
  if (!file || typeof file.arrayBuffer !== 'function') return json({ ok: false, error: 'Attachment file is required.' }, 400);
  const mimeType = normalizeText(file.type || 'application/octet-stream').toLowerCase();
  if (!isAllowedMime(mimeType)) return json({ ok: false, error: 'Allowed attachment types are PDF, images, CSV, text, Excel, and Word.' }, 400);
  const fileSize = Number(file.size || 0);
  if (fileSize <= 0) return json({ ok: false, error: 'Uploaded file is empty.' }, 400);
  if (fileSize > 20 * 1024 * 1024) return json({ ok: false, error: 'Attachments must be 20 MB or smaller.' }, 400);

  const attachmentKind = cleanAttachmentKind(form.get('attachment_kind'));
  const attachmentStatus = cleanAttachmentStatus(form.get('attachment_status'));
  const attachmentScope = cleanAttachmentScope(form.get('attachment_scope'));
  const documentDate = cleanDocumentDate(form.get('document_date'));
  const expenseId = Number(form.get('expense_id') || 0) || null;
  const vendorId = Number(form.get('vendor_id') || 0) || null;
  const reconciliationType = normalizeText(form.get('reconciliation_type')).toLowerCase();
  const periodMonth = normalizeText(form.get('period_month'));
  const taxYear = normalizeText(form.get('tax_year'));
  const scopeKey = normalizeText(form.get('scope_key')) || 'all';
  const statementReference = normalizeText(form.get('statement_reference'));
  const notes = normalizeText(form.get('notes'));
  const providerScope = normalizeText(form.get('provider_scope')).toLowerCase();
  const statementGrossCents = Math.round(Number(form.get('statement_gross_cents') || 0) || 0);
  const statementFeeCents = Math.round(Number(form.get('statement_fee_cents') || 0) || 0);
  const statementNetCents = Math.round(Number(form.get('statement_net_cents') || 0) || 0);
  const statementTaxCents = Math.round(Number(form.get('statement_tax_cents') || 0) || 0);
  const statementShippingCents = Math.round(Number(form.get('statement_shipping_cents') || 0) || 0);
  const statementTxnCount = Math.max(0, Math.round(Number(form.get('statement_txn_count') || 0) || 0));
  const statementPeriodStart = cleanDocumentDate(form.get('statement_period_start'));
  const statementPeriodEnd = cleanDocumentDate(form.get('statement_period_end'));
  const statementDetailJson = normalizeText(form.get('statement_detail_json')) || '';
  const originalName = sanitizeFilename(file.name || 'attachment');
  const extension = inferExtension(originalName, mimeType);
  const objectKey = `accounting/${taxYear || periodMonth || new Date().toISOString().slice(0,7)}/${attachmentKind}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const buffer = await file.arrayBuffer();
  await bucket.put(objectKey, buffer, { httpMetadata: { contentType: mimeType, cacheControl: 'private, max-age=0, no-store' }, customMetadata: {
    original_name: originalName, attachment_kind: attachmentKind, attachment_status: attachmentStatus, attachment_scope: attachmentScope, document_date: documentDate || '',
    expense_id: expenseId == null ? '' : String(expenseId), vendor_id: vendorId == null ? '' : String(vendorId), reconciliation_type: reconciliationType || '', period_month: periodMonth || '',
    tax_year: taxYear || '', scope_key: scopeKey || '', provider_scope: providerScope || '', statement_gross_cents: String(statementGrossCents), statement_fee_cents: String(statementFeeCents),
    statement_net_cents: String(statementNetCents), statement_tax_cents: String(statementTaxCents), statement_shipping_cents: String(statementShippingCents), statement_txn_count: String(statementTxnCount),
    statement_period_start: statementPeriodStart || '', statement_period_end: statementPeriodEnd || '', uploaded_by_user_id: String(adminUser.user_id || '')
  }});

  const publicUrl = buildAccountingAttachmentPublicUrl(env, objectKey);
  const result = await db.prepare(`
    INSERT INTO accounting_attachments (
      attachment_kind, attachment_status, attachment_scope, document_date, scope_key, provider_scope,
      storage_provider, bucket_name, object_key, public_url, original_filename, mime_type, file_size_bytes, expense_id, vendor_id,
      reconciliation_type, period_month, tax_year, statement_reference, statement_gross_cents, statement_fee_cents, statement_net_cents, statement_tax_cents,
      statement_shipping_cents, statement_txn_count, statement_period_start, statement_period_end, statement_detail_json, notes, created_by_user_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'r2', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    attachmentKind, attachmentStatus, attachmentScope, documentDate || null, scopeKey || null, providerScope || null,
    normalizeText(env.ACCOUNTING_ATTACHMENTS_BUCKET_NAME || env.PRODUCT_MEDIA_BUCKET_NAME || env.R2_BUCKET_NAME || 'product-media'), objectKey, publicUrl || null,
    originalName, mimeType, fileSize, expenseId, vendorId, reconciliationType || null, periodMonth || null, taxYear || null, statementReference || null,
    statementGrossCents, statementFeeCents, statementNetCents, statementTaxCents, statementShippingCents, statementTxnCount,
    statementPeriodStart || null, statementPeriodEnd || null, statementDetailJson || null, notes || null, Number(adminUser.user_id || 0)
  ).run();

  const attachmentId = Number(result?.meta?.last_row_id || 0) || null;
  await auditAdminAction(env, request, adminUser, { action_type: 'upload_accounting_attachment', target_type: 'accounting_attachment', target_id: attachmentId, target_key: objectKey, details: {
    attachment_kind: attachmentKind, attachment_status: attachmentStatus, attachment_scope: attachmentScope, document_date: documentDate || null,
    expense_id: expenseId, vendor_id: vendorId, reconciliation_type: reconciliationType || null, period_month: periodMonth || null, tax_year: taxYear || null, scope_key: scopeKey || null,
    provider_scope: providerScope || null, statement_reference: statementReference || null, statement_gross_cents: statementGrossCents, statement_fee_cents: statementFeeCents,
    statement_net_cents: statementNetCents, statement_tax_cents: statementTaxCents, statement_shipping_cents: statementShippingCents, statement_txn_count: statementTxnCount,
    statement_period_start: statementPeriodStart || null, statement_period_end: statementPeriodEnd || null, original_filename: originalName, mime_type: mimeType,
    file_size_bytes: fileSize, public_url: publicUrl || null,
  }});

  return json({ ok: true, attachment: {
    accounting_attachment_id: attachmentId, attachment_kind: attachmentKind, attachment_status: attachmentStatus, attachment_scope: attachmentScope,
    document_date: documentDate || '', scope_key: scopeKey || '', object_key: objectKey, public_url: publicUrl, original_filename: originalName,
    mime_type: mimeType, file_size_bytes: fileSize, expense_id: expenseId, vendor_id: vendorId, reconciliation_type: reconciliationType || '', period_month: periodMonth || '',
    tax_year: taxYear || '', statement_reference: statementReference || '', statement_gross_cents: statementGrossCents, statement_fee_cents: statementFeeCents,
    statement_net_cents: statementNetCents, statement_tax_cents: statementTaxCents, statement_shipping_cents: statementShippingCents, statement_txn_count: statementTxnCount,
    statement_period_start: statementPeriodStart || '', statement_period_end: statementPeriodEnd || '', statement_detail_json: statementDetailJson || '', notes: notes || '',
  }});
}
