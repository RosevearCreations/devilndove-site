import { cleanEmail, cleanText, isUuid, serviceHeaders } from "./staff-auth.js";

export async function loadCrewAssignmentsMap(env, bookingIds = []) {
  const ids = Array.from(new Set((Array.isArray(bookingIds) ? bookingIds : []).map((value) => cleanText(value)).filter((value) => isUuid(value))));
  if (!ids.length) return { map: Object.create(null), warning: null };

  const url = `${env.SUPABASE_URL}/rest/v1/booking_staff_assignments?select=booking_id,staff_user_id,staff_email,staff_name,assignment_role,sort_order,notes,created_at&booking_id=in.(${ids.map((id) => encodeURIComponent(id)).join(",")})&order=booking_id.asc,sort_order.asc,created_at.asc`;
  const res = await fetch(url, { headers: serviceHeaders(env) });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (text.includes("booking_staff_assignments") || res.status === 404) {
      return {
        map: Object.create(null),
        warning: "Crew-assignment table is not available yet. Run the latest SQL migration before testing multi-detailer assignment."
      };
    }
    return { map: Object.create(null), warning: `Could not load crew assignments. ${text}` };
  }

  const rows = await res.json().catch(() => []);
  const map = Object.create(null);
  for (const row of Array.isArray(rows) ? rows : []) {
    const bookingId = cleanText(row.booking_id);
    if (!bookingId) continue;
    if (!map[bookingId]) map[bookingId] = [];
    map[bookingId].push({
      staff_user_id: cleanText(row.staff_user_id) || null,
      staff_email: cleanEmail(row.staff_email) || null,
      staff_name: cleanText(row.staff_name) || null,
      assignment_role: cleanText(row.assignment_role) === "lead" ? "lead" : "crew",
      sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : 0,
      notes: cleanText(row.notes) || null
    });
  }

  return { map, warning: null };
}

export function attachCrewAssignments(items, crewMap) {
  const list = Array.isArray(items) ? items : [];
  return list.map((item) => {
    const bookingId = cleanText(item?.id || item?.booking_id);
    const crew_assignments = bookingId ? (crewMap?.[bookingId] || []) : [];
    return {
      ...item,
      crew_assignments,
      crew_summary: formatCrewSummary(crew_assignments, item)
    };
  });
}

export function formatCrewSummary(assignments, booking = null) {
  const list = Array.isArray(assignments) ? assignments.filter(Boolean) : [];
  if (!list.length) {
    const single = cleanText(booking?.assigned_staff_name || booking?.assigned_to || booking?.assigned_staff_email);
    return single ? `Lead: ${single}` : "Unassigned";
  }
  return list
    .map((row) => `${row.assignment_role === "lead" ? "Lead" : "Crew"}: ${cleanText(row.staff_name || row.staff_email) || "Staff"}`)
    .join(" · ");
}
