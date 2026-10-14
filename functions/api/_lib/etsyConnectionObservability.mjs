// Release 467 Build 394 — passive Etsy verification and expiry evidence.
// Pure summary of existing D1 rows; no network, token access, database writes, or automated refresh.
const DAY_MS = 24 * 60 * 60 * 1000;
const VERIFICATION_REVIEW_DAYS = 30;

function parseTimestamp(value) {
  if (value == null || !String(value).trim()) return null;
  const raw = String(value).trim();
  // SQLite CURRENT_TIMESTAMP omits a time zone but is UTC.
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(raw)
    ? raw.replace(' ', 'T') + 'Z' : raw;
  const time = Date.parse(normalized);
  return Number.isFinite(time) ? time : null;
}

export function classifyEtsyConnection(connection, shop, nowMs = Date.now()) {
  const conn = connection || {};
  const record = shop || {};
  const now = Number.isFinite(nowMs) ? nowMs : Date.now();
  const connected = String(conn.connection_status || '') === 'connected';
  const shopVerified = String(record.acceptance_status || '') === 'connected_verified';
  const verifiedAt = parseTimestamp(record.verified_at);
  const refreshExpiry = parseTimestamp(conn.refresh_expires_at);
  const accessExpiry = parseTimestamp(conn.access_expires_at);
  const ageDays = verifiedAt === null ? null : Math.max(0, Math.floor((now - verifiedAt) / DAY_MS));
  let status = 'not_connected';
  if (!connected) status = String(conn.connection_status || '') === 'disconnected' ? 'disconnected' : 'not_connected';
  else if (refreshExpiry !== null && refreshExpiry <= now) status = 'reauthorization_required';
  else if (accessExpiry !== null && accessExpiry <= now) status = 'refresh_due';
  else if (!shopVerified || verifiedAt === null || verifiedAt > now + DAY_MS) status = 'verification_unknown';
  else if (ageDays >= VERIFICATION_REVIEW_DAYS) status = 'verification_review_due';
  else status = 'connected_verified';
  return {
    status,
    evidence_source: 'stored_etsy_oauth_connection_and_shop',
    last_verified_at: verifiedAt === null ? null : record.verified_at,
    verification_age_days: ageDays,
    last_connection_change_at: conn.updated_at || null,
    manual_review_required: status !== 'connected_verified',
    provider_calls_performed: false,
    database_mutations_performed: false,
    listing_changes_performed: false
  };
}
