import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { cleanEventStatus, cleanEventType, cleanPickupMode, ensureCommunityEventsTable, ensurePickupProfilesTable, listCommunityEvents, listPickupProfiles } from '../_communityContent.js';

function toInt(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num) : fallback;
}

function safeUrl(value) {
  const raw = normalizeText(value);
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return '';
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureCommunityEventsTable(db);
  await ensurePickupProfilesTable(db);
  const [events, pickup_profiles] = await Promise.all([
    listCommunityEvents(db, { includeInactive: true }),
    listPickupProfiles(db, { includeInactive: true }),
  ]);
  return jsonResponse({ ok: true, events, pickup_profiles });
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureCommunityEventsTable(db);
  await ensurePickupProfilesTable(db);

  let body = {};
  try { body = await context.request.json(); } catch { return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const action = normalizeText(body.action).toLowerCase();

  if (action === 'save_event') {
    const eventId = toInt(body.community_event_id || body.event_id || 0, 0);
    const title = normalizeText(body.title);
    if (!title) return jsonResponse({ ok: false, error: 'Event title is required.' }, 400);
    const payload = {
      title,
      event_type: cleanEventType(body.event_type),
      event_status: cleanEventStatus(body.event_status),
      starts_at: normalizeText(body.starts_at) || null,
      ends_at: normalizeText(body.ends_at) || null,
      venue_name: normalizeText(body.venue_name) || null,
      city: normalizeText(body.city) || null,
      region_label: normalizeText(body.region_label) || null,
      event_url: safeUrl(body.event_url) || null,
      public_note: normalizeText(body.public_note) || null,
      sale_channel_note: normalizeText(body.sale_channel_note) || null,
      pickup_supported: Number(body.pickup_supported ? 1 : 0),
      is_featured: Number(body.is_featured ? 1 : 0),
      is_active: Number(body.is_active === false ? 0 : 1),
      sort_order: toInt(body.sort_order || 0, 0),
    };
    if (eventId > 0) {
      await db.prepare(`
        UPDATE community_events
        SET title=?, event_type=?, event_status=?, starts_at=?, ends_at=?, venue_name=?, city=?, region_label=?, event_url=?, public_note=?, sale_channel_note=?,
            pickup_supported=?, is_featured=?, is_active=?, sort_order=?, updated_at=CURRENT_TIMESTAMP
        WHERE community_event_id=?
      `).bind(
        payload.title, payload.event_type, payload.event_status, payload.starts_at, payload.ends_at, payload.venue_name, payload.city, payload.region_label, payload.event_url, payload.public_note,
        payload.sale_channel_note, payload.pickup_supported, payload.is_featured, payload.is_active, payload.sort_order, eventId
      ).run();
      await auditAdminAction(context.env, context.request, adminUser, { action_type: 'update_community_event', target_type: 'community_event', target_id: eventId, target_key: payload.title, details: payload });
      return jsonResponse({ ok: true, community_event_id: eventId });
    }
    const result = await db.prepare(`
      INSERT INTO community_events (
        title, event_type, event_status, starts_at, ends_at, venue_name, city, region_label, event_url, public_note, sale_channel_note,
        pickup_supported, is_featured, is_active, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      payload.title, payload.event_type, payload.event_status, payload.starts_at, payload.ends_at, payload.venue_name, payload.city, payload.region_label, payload.event_url,
      payload.public_note, payload.sale_channel_note, payload.pickup_supported, payload.is_featured, payload.is_active, payload.sort_order
    ).run();
    const createdId = Number(result?.meta?.last_row_id || 0);
    await auditAdminAction(context.env, context.request, adminUser, { action_type: 'create_community_event', target_type: 'community_event', target_id: createdId, target_key: payload.title, details: payload });
    return jsonResponse({ ok: true, community_event_id: createdId });
  }

  if (action === 'delete_event') {
    const eventId = toInt(body.community_event_id || body.event_id || 0, 0);
    if (!eventId) return jsonResponse({ ok: false, error: 'community_event_id is required.' }, 400);
    await db.prepare(`DELETE FROM community_events WHERE community_event_id=?`).bind(eventId).run();
    await auditAdminAction(context.env, context.request, adminUser, { action_type: 'delete_community_event', target_type: 'community_event', target_id: eventId });
    return jsonResponse({ ok: true, deleted: true, community_event_id: eventId });
  }

  if (action === 'save_pickup_profile') {
    const pickupId = toInt(body.pickup_profile_id || 0, 0);
    const label = normalizeText(body.label);
    if (!label) return jsonResponse({ ok: false, error: 'Pickup label is required.' }, 400);
    const payload = {
      label,
      pickup_mode: cleanPickupMode(body.pickup_mode),
      city: normalizeText(body.city) || null,
      region_label: normalizeText(body.region_label) || null,
      appointment_only: Number(body.appointment_only === false ? 0 : 1),
      lead_time_hours: Math.max(0, toInt(body.lead_time_hours || 24, 24)),
      public_note: normalizeText(body.public_note) || null,
      availability_note: normalizeText(body.availability_note) || null,
      map_url: safeUrl(body.map_url) || null,
      contact_hint: normalizeText(body.contact_hint) || null,
      is_active: Number(body.is_active === false ? 0 : 1),
      sort_order: toInt(body.sort_order || 0, 0),
    };
    if (pickupId > 0) {
      await db.prepare(`
        UPDATE pickup_profiles
        SET label=?, pickup_mode=?, city=?, region_label=?, appointment_only=?, lead_time_hours=?, public_note=?, availability_note=?, map_url=?, contact_hint=?, is_active=?, sort_order=?, updated_at=CURRENT_TIMESTAMP
        WHERE pickup_profile_id=?
      `).bind(
        payload.label, payload.pickup_mode, payload.city, payload.region_label, payload.appointment_only, payload.lead_time_hours, payload.public_note,
        payload.availability_note, payload.map_url, payload.contact_hint, payload.is_active, payload.sort_order, pickupId
      ).run();
      await auditAdminAction(context.env, context.request, adminUser, { action_type: 'update_pickup_profile', target_type: 'pickup_profile', target_id: pickupId, target_key: payload.label, details: payload });
      return jsonResponse({ ok: true, pickup_profile_id: pickupId });
    }
    const result = await db.prepare(`
      INSERT INTO pickup_profiles (
        label, pickup_mode, city, region_label, appointment_only, lead_time_hours, public_note, availability_note, map_url, contact_hint, is_active, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      payload.label, payload.pickup_mode, payload.city, payload.region_label, payload.appointment_only, payload.lead_time_hours, payload.public_note,
      payload.availability_note, payload.map_url, payload.contact_hint, payload.is_active, payload.sort_order
    ).run();
    const createdId = Number(result?.meta?.last_row_id || 0);
    await auditAdminAction(context.env, context.request, adminUser, { action_type: 'create_pickup_profile', target_type: 'pickup_profile', target_id: createdId, target_key: payload.label, details: payload });
    return jsonResponse({ ok: true, pickup_profile_id: createdId });
  }

  if (action === 'delete_pickup_profile') {
    const pickupId = toInt(body.pickup_profile_id || 0, 0);
    if (!pickupId) return jsonResponse({ ok: false, error: 'pickup_profile_id is required.' }, 400);
    await db.prepare(`DELETE FROM pickup_profiles WHERE pickup_profile_id=?`).bind(pickupId).run();
    await auditAdminAction(context.env, context.request, adminUser, { action_type: 'delete_pickup_profile', target_type: 'pickup_profile', target_id: pickupId });
    return jsonResponse({ ok: true, deleted: true, pickup_profile_id: pickupId });
  }

  return jsonResponse({ ok: false, error: 'Unsupported action.' }, 400);
}
