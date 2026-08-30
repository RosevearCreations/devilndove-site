const CHECKOUT_RECOVERY_COLUMNS = [
  "checkout_recovery_lead_id",
  "browser_session_token",
  "visitor_token",
  "customer_email",
  "customer_name",
  "cart_count",
  "cart_value_cents",
  "currency",
  "checkout_path",
  "checkout_state_json",
  "status",
  "last_recovery_email_at",
  "created_at",
  "updated_at",
];

const CUSTOM_REQUEST_CONSENT_COLUMNS = [
  "custom_request_fulfillment_prompt_id",
  "custom_request_id",
  "order_id",
  "prompt_key",
  "prompt_status",
  "prompt_type",
  "customer_name",
  "customer_email",
  "subject",
  "body_text",
  "consent_question_text",
  "created_by_user_id",
  "prompt_token",
  "public_response_status",
  "public_use_scope",
  "review_text",
  "customer_response_note",
  "responded_at",
  "expired_at",
  "voided_at",
  "public_proof_candidate_id",
  "created_at",
  "updated_at",
];

function resultRows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableColumns(db, tableName) {
  const result = await db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all()
    .catch(() => ({ results: [] }));

  return new Set(
    resultRows(result)
      .map((row) => String(row?.name || "").trim())
      .filter(Boolean)
  );
}

function hasAllColumns(columns, required) {
  return required.every((name) => columns.has(name));
}

function quotePragmaIdentifier(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}

async function hasUniqueIndexOnColumns(db, tableName, expectedColumns) {
  const list = await db
    .prepare(`PRAGMA index_list(${tableName})`)
    .all()
    .catch(() => ({ results: [] }));

  for (const index of resultRows(list)) {
    if (Number(index?.unique || 0) !== 1 || !index?.name) continue;

    const info = await db
      .prepare(`PRAGMA index_info(${quotePragmaIdentifier(index.name)})`)
      .all()
      .catch(() => ({ results: [] }));

    const columns = resultRows(info)
      .sort((a, b) => Number(a?.seqno || 0) - Number(b?.seqno || 0))
      .map((row) => String(row?.name || "").trim());

    if (
      columns.length === expectedColumns.length &&
      columns.every((name, indexPosition) => name === expectedColumns[indexPosition])
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Public/customer routes must never create or alter D1 schema.
 *
 * Release 461 migration ownership:
 *   migrations/dev/20260829_release461_public_runtime_schema_authority.sql
 *
 * These helpers only verify that migration-owned schema is ready.
 */
export async function hasCheckoutRecoverySchema(db) {
  if (!db) return false;

  const columns = await tableColumns(db, "checkout_recovery_leads");
  if (!hasAllColumns(columns, CHECKOUT_RECOVERY_COLUMNS)) {
    return false;
  }

  return hasUniqueIndexOnColumns(db, "checkout_recovery_leads", [
    "browser_session_token",
    "customer_email",
  ]);
}

export async function hasCustomRequestConsentSchema(db) {
  if (!db) return false;

  const columns = await tableColumns(db, "custom_request_fulfillment_prompts");
  return hasAllColumns(columns, CUSTOM_REQUEST_CONSENT_COLUMNS);
}
