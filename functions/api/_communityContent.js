import { normalizeText } from './_lib/adminAudit.js';

function nr(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

export async function ensureCommunityEventsTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS community_events (
      community_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      event_type TEXT NOT NULL DEFAULT 'market',
      event_status TEXT NOT NULL DEFAULT 'planned',
      starts_at TEXT,
      ends_at TEXT,
      venue_name TEXT,
      city TEXT,
      region_label TEXT,
      event_url TEXT,
      public_note TEXT,
      sale_channel_note TEXT,
      pickup_supported INTEGER NOT NULL DEFAULT 0,
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

export async function ensurePickupProfilesTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS pickup_profiles (
      pickup_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      pickup_mode TEXT NOT NULL DEFAULT 'appointment',
      city TEXT,
      region_label TEXT,
      appointment_only INTEGER NOT NULL DEFAULT 1,
      lead_time_hours INTEGER NOT NULL DEFAULT 24,
      public_note TEXT,
      availability_note TEXT,
      map_url TEXT,
      contact_hint TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

export function cleanEventType(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['market', 'popup', 'show', 'pickup_window', 'meetup'].includes(raw) ? raw : 'market';
}

export function cleanEventStatus(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['planned', 'live', 'completed', 'cancelled'].includes(raw) ? raw : 'planned';
}

export function cleanPickupMode(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['appointment', 'event', 'market', 'porch', 'hybrid'].includes(raw) ? raw : 'appointment';
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
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null,
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

export async function listCommunityEvents(db, { includeInactive = false } = {}) {
  await ensureCommunityEventsTable(db);
  const filter = includeInactive ? '' : 'WHERE is_active = 1';
  const rows = nr(await db.prepare(`
    SELECT community_event_id, title, event_type, event_status, starts_at, ends_at, venue_name, city, region_label, event_url,
           public_note, sale_channel_note, pickup_supported, is_featured, is_active, sort_order, created_at, updated_at
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
