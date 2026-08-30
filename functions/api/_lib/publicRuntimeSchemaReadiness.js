const CHECKOUT_RECOVERY_COLUMNS = [
  "checkout_recovery_lead_id", "browser_session_token", "visitor_token", "customer_email",
  "customer_name", "cart_count", "cart_value_cents", "currency", "checkout_path",
  "checkout_state_json", "status", "last_recovery_email_at", "created_at", "updated_at",
];

const CUSTOM_REQUEST_CONSENT_COLUMNS = [
  "custom_request_fulfillment_prompt_id", "custom_request_id", "order_id", "prompt_key",
  "prompt_status", "prompt_type", "customer_name", "customer_email", "subject", "body_text",
  "consent_question_text", "created_by_user_id", "prompt_token", "public_response_status",
  "public_use_scope", "review_text", "customer_response_note", "responded_at", "expired_at",
  "voided_at", "public_proof_candidate_id", "created_at", "updated_at",
];

const CUSTOM_REQUEST_COLUMNS = [
  "custom_request_id", "request_key", "name", "email", "phone", "request_type",
  "product_interest", "deadline_date", "budget_cents", "message", "attachment_urls_json",
  "consent_to_contact", "status", "admin_notes", "utm_source", "utm_medium", "utm_campaign",
  "utm_content", "utm_term", "visitor_token", "browser_session_token", "upload_token",
  "reference_upload_count", "scent_profile", "wax_or_base", "colour_notes", "batch_number",
  "ingredient_notes", "allergen_safety_notes", "created_at", "updated_at",
];

const CUSTOM_SPEC_COLUMNS = [
  "custom_candle_soap_product_spec_id", "custom_request_id", "product_id", "product_draft_id",
  "product_family", "scent_profile", "wax_or_base", "colour_notes", "batch_number",
  "ingredient_notes", "allergen_safety_notes", "cure_ready_date", "created_at", "updated_at",
];

const CUSTOM_REFERENCE_UPLOAD_COLUMNS = [
  "custom_request_reference_upload_id", "custom_request_id", "request_key", "public_url",
  "object_key", "original_filename", "mime_type", "file_size_bytes", "reference_use_status",
  "created_at",
];

const MEDIA_CONSENT_COLUMNS = [
  "consent_record_id", "consent_key", "subject_label", "source_type", "source_id", "media_url",
  "consent_status", "consent_scope", "public_use_allowed", "social_use_allowed", "privacy_notes",
  "reviewed_by_user_id", "expires_at", "created_at", "updated_at",
];

function resultRows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableColumns(db, tableName) {
  const result = await db.prepare(`PRAGMA table_info(${tableName})`).all().catch(() => ({ results: [] }));
  return new Set(resultRows(result).map((row) => String(row?.name || "").trim()).filter(Boolean));
}

function hasAllColumns(columns, required) {
  return required.every((name) => columns.has(name));
}

function quotePragmaIdentifier(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}

async function hasUniqueIndexOnColumns(db, tableName, expectedColumns) {
  const list = await db.prepare(`PRAGMA index_list(${tableName})`).all().catch(() => ({ results: [] }));
  for (const index of resultRows(list)) {
    if (Number(index?.unique || 0) !== 1 || !index?.name) continue;
    const info = await db.prepare(`PRAGMA index_info(${quotePragmaIdentifier(index.name)})`).all().catch(() => ({ results: [] }));
    const columns = resultRows(info).sort((a, b) => Number(a?.seqno || 0) - Number(b?.seqno || 0)).map((row) => String(row?.name || "").trim());
    if (columns.length === expectedColumns.length && columns.every((name, i) => name === expectedColumns[i])) return true;
  }
  return false;
}

async function hasTableShape(db, tableName, required) {
  if (!db) return false;
  return hasAllColumns(await tableColumns(db, tableName), required);
}

/** Public/customer routes must never create or alter D1 schema. Release 461 owns these shapes. */
export async function hasCheckoutRecoverySchema(db) {
  if (!(await hasTableShape(db, "checkout_recovery_leads", CHECKOUT_RECOVERY_COLUMNS))) return false;
  return hasUniqueIndexOnColumns(db, "checkout_recovery_leads", ["browser_session_token", "customer_email"]);
}

export async function hasCustomRequestConsentSchema(db) {
  return hasTableShape(db, "custom_request_fulfillment_prompts", CUSTOM_REQUEST_CONSENT_COLUMNS);
}

export async function hasCustomRequestIntakeSchema(db) {
  return (await hasTableShape(db, "custom_requests", CUSTOM_REQUEST_COLUMNS)) &&
    (await hasTableShape(db, "custom_candle_soap_product_specs", CUSTOM_SPEC_COLUMNS));
}

export async function hasCustomRequestReferenceUploadSchema(db) {
  return (await hasTableShape(db, "custom_requests", CUSTOM_REQUEST_COLUMNS)) &&
    (await hasTableShape(db, "custom_request_reference_uploads", CUSTOM_REFERENCE_UPLOAD_COLUMNS)) &&
    (await hasTableShape(db, "media_consent_records", MEDIA_CONSENT_COLUMNS));
}
