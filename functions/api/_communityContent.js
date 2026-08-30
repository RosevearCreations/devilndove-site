import { normalizeText } from './_lib/adminAudit.js';

function nr(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(nr(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function getTableIndexSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA index_list(${tableName})`).all();
    return new Set(nr(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function requireCommunityTableSchema(db, tableName, requiredColumns, requiredIndexes = []) {
  const columns = await getTableColumnSet(db, tableName);
  const missingColumns = requiredColumns.filter((name) => !columns.has(name));
  if (missingColumns.length) {
    throw new Error(`Community schema is not ready: ${tableName} is missing ${missingColumns.join(', ')}. Apply the current Development migration authority.`);
  }
  if (requiredIndexes.length) {
    const indexes = await getTableIndexSet(db, tableName);
    const missingIndexes = requiredIndexes.filter((name) => !indexes.has(name));
    if (missingIndexes.length) {
      throw new Error(`Community schema is not ready: ${tableName} is missing index ${missingIndexes.join(', ')}. Apply the current Development migration authority.`);
    }
  }
  return true;
}

export async function ensureCommunityEventsTable(db) {
  return requireCommunityTableSchema(db, 'community_events', [
    'community_event_id', 'title', 'event_type', 'event_status', 'starts_at', 'ends_at', 'venue_name', 'city', 'region_label',
    'event_url', 'public_note', 'sale_channel_note', 'pickup_supported', 'is_featured', 'is_active', 'sort_order', 'created_at', 'updated_at',
    'recurrence_rule', 'recurrence_interval', 'recurrence_count', 'recurrence_until', 'recurrence_label', 'image_url', 'image_alt',
    'application_mode', 'application_url', 'vendor_capacity', 'vendor_note'
  ], ['idx_community_events_active_start']);
}

export async function ensurePickupProfilesTable(db) {
  return requireCommunityTableSchema(db, 'pickup_profiles', [
    'pickup_profile_id', 'label', 'pickup_mode', 'city', 'region_label', 'appointment_only', 'lead_time_hours', 'public_note',
    'availability_note', 'map_url', 'contact_hint', 'is_active', 'sort_order', 'created_at', 'updated_at'
  ], ['idx_pickup_profiles_active_sort']);
}

export async function ensureEventVendorApplicationsTable(db) {
  return requireCommunityTableSchema(db, 'event_vendor_applications', [
    'event_vendor_application_id', 'community_event_id', 'event_title_snapshot', 'vendor_name', 'contact_name', 'contact_email',
    'contact_phone', 'city', 'offered_items', 'website_url', 'marketplace_url', 'instagram_url', 'setup_notes', 'application_status',
    'internal_note', 'created_at', 'updated_at'
  ], ['idx_event_vendor_applications_event_status']);
}

export function cleanEventType(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['market', 'popup', 'show', 'pickup_window', 'meetup', 'fair', 'festival'].includes(raw) ? raw : 'market';
}

export function cleanEventStatus(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['planned', 'live', 'completed', 'cancelled'].includes(raw) ? raw : 'planned';
}

export function cleanPickupMode(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['appointment', 'event', 'market', 'porch', 'hybrid'].includes(raw) ? raw : 'appointment';
}

export function cleanRecurrenceRule(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['none', 'weekly', 'biweekly', 'monthly'].includes(raw) ? raw : 'none';
}

export function cleanApplicationMode(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['closed', 'internal', 'external', 'info_only'].includes(raw) ? raw : 'closed';
}

export function cleanVendorApplicationStatus(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['submitted', 'reviewing', 'approved', 'waitlisted', 'declined', 'closed'].includes(raw) ? raw : 'submitted';
}

function parseDateish(value) {
  const raw = normalizeText(value);
  if (!raw) return null;
  const iso = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateish(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function addInterval(date, rule, interval) {
  const next = new Date(date.getTime());
  if (rule === 'weekly') next.setUTCDate(next.getUTCDate() + (7 * interval));
  else if (rule === 'biweekly') next.setUTCDate(next.getUTCDate() + (14 * interval));
  else if (rule === 'monthly') next.setUTCMonth(next.getUTCMonth() + interval);
  return next;
}

export function recurrenceSummary(row) {
  const rule = cleanRecurrenceRule(row?.recurrence_rule);
  const label = normalizeText(row?.recurrence_label);
  if (label) return label;
  if (rule === 'weekly') return 'Repeats weekly';
  if (rule === 'biweekly') return 'Repeats every two weeks';
  if (rule === 'monthly') return 'Repeats monthly';
  return '';
}

export function normalizeCommunityEvent(row) {
  return {
    community_event_id: Number(row?.community_event_id || 0),
    title: row?.title || '',
    event_type: row?.event_type || 'market',
    event_status: row?.event_status || 'planned',
    starts_at: row?.starts_at || null,
    ends_at: row?.ends_at || null,
    venue_name: row?.venue_name || '',
    city: row?.city || '',
    region_label: row?.region_label || '',
    event_url: row?.event_url || '',
    public_note: row?.public_note || '',
    sale_channel_note: row?.sale_channel_note || '',
    pickup_supported: Number(row?.pickup_supported || 0),
    is_featured: Number(row?.is_featured || 0),
    is_active: Number(row?.is_active || 0),
    sort_order: Number(row?.sort_order || 0),
    recurrence_rule: cleanRecurrenceRule(row?.recurrence_rule),
    recurrence_interval: Number(row?.recurrence_interval || 1),
    recurrence_count: row?.recurrence_count == null || row?.recurrence_count === '' ? null : Number(row?.recurrence_count || 0),
    recurrence_until: row?.recurrence_until || null,
    recurrence_label: row?.recurrence_label || '',
    image_url: row?.image_url || '',
    image_alt: row?.image_alt || '',
    application_mode: cleanApplicationMode(row?.application_mode),
    application_url: row?.application_url || '',
    vendor_capacity: Number(row?.vendor_capacity || 0),
    vendor_note: row?.vendor_note || '',
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null,
    recurrence_summary: recurrenceSummary(row),
  };
}

export function normalizePickupProfile(row) {
  return {
    pickup_profile_id: Number(row?.pickup_profile_id || 0),
    label: row?.label || '',
    pickup_mode: row?.pickup_mode || 'appointment',
    city: row?.city || '',
    region_label: row?.region_label || '',
    appointment_only: Number(row?.appointment_only || 0),
    lead_time_hours: Number(row?.lead_time_hours || 0),
    public_note: row?.public_note || '',
    availability_note: row?.availability_note || '',
    map_url: row?.map_url || '',
    contact_hint: row?.contact_hint || '',
    is_active: Number(row?.is_active || 0),
    sort_order: Number(row?.sort_order || 0),
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null,
  };
}

export function normalizeVendorApplication(row) {
  return {
    event_vendor_application_id: Number(row?.event_vendor_application_id || 0),
    community_event_id: Number(row?.community_event_id || 0),
    event_title_snapshot: row?.event_title_snapshot || '',
    vendor_name: row?.vendor_name || '',
    contact_name: row?.contact_name || '',
    contact_email: row?.contact_email || '',
    contact_phone: row?.contact_phone || '',
    city: row?.city || '',
    offered_items: row?.offered_items || '',
    website_url: row?.website_url || '',
    marketplace_url: row?.marketplace_url || '',
    instagram_url: row?.instagram_url || '',
    setup_notes: row?.setup_notes || '',
    application_status: cleanVendorApplicationStatus(row?.application_status),
    internal_note: row?.internal_note || '',
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null,
  };
}

export async function listCommunityEvents(db, { includeInactive = false } = {}) {
  await ensureCommunityEventsTable(db);
  const filter = includeInactive ? '' : 'WHERE is_active = 1';
  const rows = nr(await db.prepare(`
    SELECT community_event_id, title, event_type, event_status, starts_at, ends_at, venue_name, city, region_label, event_url,
           public_note, sale_channel_note, pickup_supported, is_featured, is_active, sort_order,
           recurrence_rule, recurrence_interval, recurrence_count, recurrence_until, recurrence_label,
           image_url, image_alt, application_mode, application_url, vendor_capacity, vendor_note,
           created_at, updated_at
    FROM community_events
    ${filter}
    ORDER BY is_featured DESC, sort_order ASC, COALESCE(starts_at, created_at) ASC, community_event_id DESC
  `).all().catch(() => ({ results: [] })));
  return rows.map(normalizeCommunityEvent);
}

export async function listPickupProfiles(db, { includeInactive = false } = {}) {
  await ensurePickupProfilesTable(db);
  const filter = includeInactive ? '' : 'WHERE is_active = 1';
  const rows = nr(await db.prepare(`
    SELECT pickup_profile_id, label, pickup_mode, city, region_label, appointment_only, lead_time_hours,
           public_note, availability_note, map_url, contact_hint, is_active, sort_order, created_at, updated_at
    FROM pickup_profiles
    ${filter}
    ORDER BY sort_order ASC, label ASC, pickup_profile_id DESC
  `).all().catch(() => ({ results: [] })));
  return rows.map(normalizePickupProfile);
}

export async function listVendorApplications(db, { status = 'all', limit = 200 } = {}) {
  await ensureEventVendorApplicationsTable(db);
  const statusFilter = cleanVendorApplicationStatus(status);
  const where = status === 'all' ? '' : 'WHERE application_status = ?';
  const statement = db.prepare(`
    SELECT event_vendor_application_id, community_event_id, event_title_snapshot, vendor_name, contact_name, contact_email, contact_phone,
           city, offered_items, website_url, marketplace_url, instagram_url, setup_notes, application_status, internal_note, created_at, updated_at
    FROM event_vendor_applications
    ${where}
    ORDER BY created_at DESC, event_vendor_application_id DESC
    LIMIT ?
  `);
  const result = status === 'all' ? await statement.bind(Number(limit || 200)).all().catch(() => ({ results: [] })) : await statement.bind(statusFilter, Number(limit || 200)).all().catch(() => ({ results: [] }));
  return nr(result).map(normalizeVendorApplication);
}

export function expandCommunityEventOccurrences(events, { maxCount = 12, horizonDays = 180 } = {}) {
  const horizon = new Date();
  horizon.setUTCDate(horizon.getUTCDate() + Number(horizonDays || 180));
  const now = new Date();
  const out = [];

  for (const row of Array.isArray(events) ? events : []) {
    const baseStart = parseDateish(row.starts_at);
    if (!baseStart) {
      out.push({ ...row, occurrence_index: 0, occurrence_starts_at: row.starts_at || null, occurrence_ends_at: row.ends_at || null, recurrence_summary: recurrenceSummary(row) });
      continue;
    }
    const baseEnd = parseDateish(row.ends_at);
    const rule = cleanRecurrenceRule(row.recurrence_rule);
    const until = parseDateish(row.recurrence_until);
    const recurrenceCount = row.recurrence_count == null ? null : Number(row.recurrence_count || 0);
    const interval = Math.max(1, Number(row.recurrence_interval || 1));

    let iteration = 0;
    let nextStart = new Date(baseStart.getTime());
    let nextEnd = baseEnd ? new Date(baseEnd.getTime()) : null;

    while (iteration === 0 || rule !== 'none') {
      const include = nextStart >= now || iteration === 0;
      if (include) {
        out.push({
          ...row,
          occurrence_index: iteration,
          occurrence_starts_at: formatDateish(nextStart),
          occurrence_ends_at: formatDateish(nextEnd),
          recurrence_summary: recurrenceSummary(row),
        });
      }
      iteration += 1;
      if (rule === 'none') break;
      if (recurrenceCount != null && iteration >= recurrenceCount) break;
      nextStart = addInterval(nextStart, rule, interval);
      nextEnd = nextEnd ? addInterval(nextEnd, rule, interval) : null;
      if (until && nextStart > until) break;
      if (nextStart > horizon) break;
      if (out.length >= Number(maxCount || 12) * 3) break;
    }
  }

  return out
    .sort((a, b) => String(a.occurrence_starts_at || '').localeCompare(String(b.occurrence_starts_at || '')) || Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .slice(0, Number(maxCount || 12));
}
