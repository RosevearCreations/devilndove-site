import { captureRuntimeIncident } from './_lib/adminAudit.js';
import { ensureCommunityEventsTable, ensurePickupProfilesTable, listCommunityEvents, listPickupProfiles } from './_communityContent.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=120',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

function fallbackEvents() {
  return [];
}

function fallbackPickupProfiles() {
  return [
    {
      pickup_profile_id: 0,
      label: 'Southern Ontario by appointment',
      pickup_mode: 'appointment',
      city: 'Tillsonburg area',
      region_label: 'Southern Ontario',
      appointment_only: 1,
      lead_time_hours: 24,
      public_note: 'Use Contact before checkout if an item is fragile, oversized, externally listed, or easier to hand off in person.',
      availability_note: 'Availability can vary for handmade, vintage, and external-channel items.',
      map_url: '',
      contact_hint: 'Please confirm timing and item availability first.',
      is_active: 1,
      sort_order: 0,
    }
  ];
}

export async function onRequestGet(context) {
  const db = context.env.DB || context.env.DD_DB;
  if (!db) {
    return json({
      ok: true,
      warning: 'Database binding is unavailable. Returning safe community fallbacks.',
      events: fallbackEvents(),
      pickup_profiles: fallbackPickupProfiles(),
      summary: { event_count: 0, pickup_profile_count: 1, authority: 'binding_unavailable' }
    });
  }

  try {
    await ensureCommunityEventsTable(db);
    await ensurePickupProfilesTable(db);
    const [events, pickup_profiles] = await Promise.all([
      listCommunityEvents(db, { includeInactive: false }),
      listPickupProfiles(db, { includeInactive: false }),
    ]);
    return json({
      ok: true,
      events,
      pickup_profiles,
      summary: {
        event_count: events.length,
        pickup_profile_count: pickup_profiles.length,
        authority: 'd1'
      }
    });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'community_content',
      incident_code: 'community_content_load_failed',
      severity: 'warning',
      message: 'Community content query failed. Safe fallbacks were returned.',
      details: { error: String(error?.message || error || 'Unknown error') }
    });
    return json({
      ok: true,
      warning: 'Community content is temporarily using safe fallback messaging.',
      events: fallbackEvents(),
      pickup_profiles: fallbackPickupProfiles(),
      summary: { event_count: 0, pickup_profile_count: 1, authority: 'fallback' }
    });
  }
}
