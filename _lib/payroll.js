import { serviceHeaders } from "./staff-auth.js";
import { loadPricingCatalog } from "./pricing-catalog.js";

const DEFAULT_MAX_HOURS_PER_DAY = 8;
const DEFAULT_MAX_HOURS_PER_WEEK = 40;
const SLOT_HOURS = 4;

export function parsePayrollRange(input = {}) {
  const start = parseDateOnly(input.start_date) || firstDayOfCurrentMonth();
  const end = parseDateOnly(input.end_date) || todayDateOnly();
  if (start > end) {
    return { start_date: end, end_date: start };
  }
  return { start_date: start, end_date: end };
}

export async function buildPayrollSummary(env, { start_date, end_date, staff_user_ids = null } = {}) {
  const range = parsePayrollRange({ start_date, end_date });
  const [staffRows, bookingRows, rawTimeEntries, rawBlocks, pricing] = await Promise.all([
    loadStaffUsers(env),
    loadBookingsInRange(env, range),
    loadAllTimeEntries(env),
    loadAvailabilityBlocks(env, range),
    loadPricingCatalog(env).catch(() => null)
  ]);

  const staffFilter = buildStaffFilter(staff_user_ids);
  const staff = staffRows.filter((row) => row.is_active === true).filter((row) => !staffFilter || staffFilter.has(String(row.id || "")));
  const bookings = Array.isArray(bookingRows) ? bookingRows : [];
  const timeEntries = filterTimeEntriesToRange(Array.isArray(rawTimeEntries) ? rawTimeEntries : [], range);
  const availabilityBlocks = Array.isArray(rawBlocks) ? rawBlocks : [];

  const assignmentMap = await loadAssignmentsForBookings(env, bookings);
  const bookingTimeByBookingId = computeBookingMinutesByBooking(timeEntries, range);
  const staffTimeMap = computeStaffTimeMap(timeEntries, range);
  const scheduleMap = buildStaffScheduleMap(staff, bookings, assignmentMap);
  const availabilityMap = buildAvailabilityMap(staff, availabilityBlocks, bookings, assignmentMap);

  const staffRowsOut = staff.map((row) => {
    const key = String(row.id || "");
    const time = staffTimeMap.get(key) || emptyTimeSummary();
    const schedule = scheduleMap.get(key) || emptyScheduleSummary();
    const availability = availabilityMap.get(key) || emptyAvailabilitySummary();
    const hourlyRateCad = centsToCad(row.hourly_rate_cents || 0);
    const grossPayCad = roundMoney(time.total_hours * hourlyRateCad);
    const maxDaily = numberOr(row.max_hours_per_day, DEFAULT_MAX_HOURS_PER_DAY);
    const maxWeekly = numberOr(row.max_hours_per_week, DEFAULT_MAX_HOURS_PER_WEEK);
    const dailyFlags = Object.entries(time.hours_by_date)
      .filter(([, value]) => Number(value || 0) > maxDaily)
      .map(([date, value]) => ({ date, logged_hours: roundMoney(value), max_hours: maxDaily }));
    const weeklyFlags = Object.entries(time.hours_by_week)
      .filter(([, value]) => Number(value || 0) > maxWeekly)
      .map(([week, value]) => ({ week, logged_hours: roundMoney(value), max_hours: maxWeekly }));
    const isOverworked = dailyFlags.length > 0 || weeklyFlags.length > 0;
    return {
      staff_user_id: row.id || null,
      full_name: row.full_name || null,
      email: row.email || null,
      role_code: row.role_code || null,
      employee_code: row.employee_code || null,
      position_title: row.position_title || null,
      pay_schedule: row.pay_schedule || null,
      hourly_rate_cents: Number(row.hourly_rate_cents || 0),
      hourly_rate_cad: hourlyRateCad,
      payroll_enabled: row.payroll_enabled !== false,
      max_hours_per_day: maxDaily,
      max_hours_per_week: maxWeekly,
      logged_hours: roundMoney(time.total_hours),
      scheduled_hours: roundMoney(schedule.total_hours),
      gross_pay_cad: grossPayCad,
      booking_count: schedule.booking_count,
      availability_conflicts: availability.conflicts,
      active_availability_blocks: availability.active_blocks,
      next_unavailable_at: availability.next_unavailable_at,
      hours_by_date: time.hours_by_date,
      hours_by_week: time.hours_by_week,
      overworked_daily_flags: dailyFlags,
      overworked_weekly_flags: weeklyFlags,
      is_overworked: isOverworked
    };
  }).sort((a, b) => String(a.full_name || "").localeCompare(String(b.full_name || "")));

  const serviceInsights = buildServiceInsights(bookings, bookingTimeByBookingId, pricing);
  const totals = {
    staff_count: staffRowsOut.length,
    logged_hours: roundMoney(staffRowsOut.reduce((sum, row) => sum + Number(row.logged_hours || 0), 0)),
    scheduled_hours: roundMoney(staffRowsOut.reduce((sum, row) => sum + Number(row.scheduled_hours || 0), 0)),
    estimated_gross_pay_cad: roundMoney(staffRowsOut.reduce((sum, row) => sum + Number(row.gross_pay_cad || 0), 0)),
    overworked_staff_count: staffRowsOut.filter((row) => row.is_overworked).length,
    availability_conflict_count: staffRowsOut.reduce((sum, row) => sum + Number(row.availability_conflicts || 0), 0),
    booking_count: bookings.length,
    average_site_minutes: serviceInsights.overall.average_site_minutes,
    average_site_hours: roundMoney((serviceInsights.overall.average_site_minutes || 0) / 60)
  };

  return {
    range,
    totals,
    staff_rows: staffRowsOut,
    service_time_insights: serviceInsights,
    source_notes: {
      logged_time: "Logged hours combine direct minute entries and work-state event history where available.",
      scheduled_time: `Scheduled hours use ${SLOT_HOURS} hours per AM/PM slot and ${SLOT_HOURS * 2} hours for full-day bookings.`,
      addon_time: "Add-on insight uses average full job minutes when that add-on is present, not isolated stopwatch minutes per add-on."
    }
  };
}

export async function createPayrollRun(env, { start_date, end_date, staff_user_ids = null, actor = null, status = "draft", note = null, post_to_accounting = false } = {}) {
  const summary = await buildPayrollSummary(env, { start_date, end_date, staff_user_ids });
  const includedStaff = summary.staff_rows.filter((row) => row.payroll_enabled !== false && Number(row.logged_hours || 0) > 0);
  const totalHours = roundMoney(includedStaff.reduce((sum, row) => sum + Number(row.logged_hours || 0), 0));
  const totalGross = roundMoney(includedStaff.reduce((sum, row) => sum + Number(row.gross_pay_cad || 0), 0));
  const headers = serviceHeaders(env);
  const finalStatus = status === "posted" ? "posted" : "draft";

  const runRes = await fetch(`${env.SUPABASE_URL}/rest/v1/staff_payroll_runs`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify([{
      period_start: summary.range.start_date,
      period_end: summary.range.end_date,
      status: finalStatus,
      staff_count: includedStaff.length,
      total_hours: totalHours,
      total_gross_cad: totalGross,
      note: cleanNote(note),
      created_by_name: actor?.full_name || actor?.email || null,
      created_by_staff_user_id: actor?.id || null,
      posted_at: finalStatus === "posted" ? new Date().toISOString() : null,
      posted_by_name: finalStatus === "posted" ? (actor?.full_name || actor?.email || null) : null,
      posted_by_staff_user_id: finalStatus === "posted" ? (actor?.id || null) : null
    }])
  });
  if (!runRes.ok) throw new Error(`Could not create payroll run. ${await runRes.text()}`);
  const runRows = await runRes.json().catch(() => []);
  const run = Array.isArray(runRows) ? runRows[0] || null : null;
  if (!run?.id) throw new Error("Could not create payroll run.");

  if (includedStaff.length) {
    const lineRes = await fetch(`${env.SUPABASE_URL}/rest/v1/staff_payroll_run_lines`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify(includedStaff.map((row, index) => ({
        payroll_run_id: run.id,
        staff_user_id: row.staff_user_id,
        staff_name: row.full_name,
        staff_email: row.email,
        line_order: index + 1,
        regular_hours: roundMoney(Math.min(Number(row.logged_hours || 0), Number(row.max_hours_per_week || DEFAULT_MAX_HOURS_PER_WEEK))),
        overtime_hours: roundMoney(Math.max(0, Number(row.logged_hours || 0) - Number(row.max_hours_per_week || DEFAULT_MAX_HOURS_PER_WEEK))),
        total_hours: roundMoney(Number(row.logged_hours || 0)),
        hourly_rate_cents: Number(row.hourly_rate_cents || 0),
        gross_pay_cad: roundMoney(Number(row.gross_pay_cad || 0)),
        scheduled_hours: roundMoney(Number(row.scheduled_hours || 0)),
        booking_count: Number(row.booking_count || 0),
        availability_conflicts: Number(row.availability_conflicts || 0),
        is_overworked: row.is_overworked === true,
        note: row.is_overworked ? "Flagged for overtime review." : null
      })))
    });
    if (!lineRes.ok) throw new Error(`Could not save payroll run lines. ${await lineRes.text()}`);
  }

  let accounting_post = null;
  if (post_to_accounting && finalStatus === "posted" && totalGross > 0) {
    accounting_post = await postPayrollJournal(env, { run, totalGross, actor });
    if (accounting_post?.entry?.id) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/staff_payroll_runs?id=eq.${encodeURIComponent(run.id)}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ accounting_entry_id: accounting_post.entry.id, updated_at: new Date().toISOString() })
      }).catch(() => null);
    }
  }

  return { run, summary, accounting_post };
}

async function postPayrollJournal(env, { run, totalGross, actor }) {
  const { postJournalEntry, loadAccounts } = await import("./accounting-gl.js");
  const accounts = await loadAccounts(env).catch(() => []);
  const expenseCode = pickAccountCode(accounts, ["payroll_expense", "wages_expense", "direct_labor_expense", "shop_supplies"]);
  const payableCode = pickAccountCode(accounts, ["wages_payable", "payroll_payable", "accounts_payable", "owner_draw"]);
  if (!expenseCode || !payableCode) {
    return { warning: "Payroll journal was not posted because the expected payroll accounts are not available yet." };
  }
  return await postJournalEntry(env, {
    entry_date: run.period_end,
    entry_type: "payroll_run",
    status: "posted",
    reference_type: "payroll_run",
    reference_id: run.id,
    payee_name: "Crew Payroll",
    vendor_name: "Crew Payroll",
    memo: `Payroll for ${run.period_start} to ${run.period_end}`,
    subtotal_cad: totalGross,
    tax_cad: 0,
    total_cad: totalGross,
    created_by_name: actor?.full_name || actor?.email || null,
    last_recorded_by_name: actor?.full_name || actor?.email || null,
    created_by_staff_user_id: actor?.id || null,
    last_recorded_by_staff_user_id: actor?.id || null
  }, [
    { account_code: expenseCode, direction: "debit", amount_cad: totalGross, memo: "Payroll expense" },
    { account_code: payableCode, direction: "credit", amount_cad: totalGross, memo: "Payroll payable" }
  ]);
}

function pickAccountCode(accounts, preferredCodes) {
  const set = new Set(preferredCodes.map((code) => String(code || "").trim()));
  const direct = accounts.find((row) => set.has(String(row.code || "").trim()));
  return direct?.code || null;
}

function buildStaffFilter(ids) {
  if (!Array.isArray(ids) || !ids.length) return null;
  const cleaned = ids.map((value) => String(value || "").trim()).filter(Boolean);
  return cleaned.length ? new Set(cleaned) : null;
}

async function loadStaffUsers(env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/staff_users?select=id,full_name,email,role_code,is_active,employee_code,position_title,pay_schedule,hourly_rate_cents,max_hours_per_day,max_hours_per_week,payroll_enabled&order=full_name.asc`, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not load staff users. ${await res.text()}`);
  return await res.json().catch(() => []);
}

async function loadBookingsInRange(env, range) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,service_date,start_slot,duration_slots,package_code,vehicle_size,addons,assigned_staff_user_id,assigned_staff_email,assigned_staff_name,assigned_to,service_area_zone,service_area_municipality,service_area_county&service_date=gte.${encodeURIComponent(range.start_date)}&service_date=lte.${encodeURIComponent(range.end_date)}&order=service_date.asc`, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not load bookings for payroll summary. ${await res.text()}`);
  return await res.json().catch(() => []);
}

async function loadAllTimeEntries(env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/job_time_entries?select=id,booking_id,staff_user_id,staff_name,minutes,entry_type,event_time,created_at,note&order=created_at.asc&limit=10000`, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not load job time entries. ${await res.text()}`);
  return await res.json().catch(() => []);
}

async function loadAvailabilityBlocks(env, range) {
  const startIso = `${range.start_date}T00:00:00.000Z`;
  const endIso = `${addDays(range.end_date, 1)}T00:00:00.000Z`;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/staff_availability_blocks?select=id,staff_user_id,start_at,end_at,availability_type,note&end_at=gte.${encodeURIComponent(startIso)}&start_at=lt.${encodeURIComponent(endIso)}&order=start_at.asc`, { headers: serviceHeaders(env) });
  if (!res.ok) {
    const text = await res.text();
    if (String(text || "").toLowerCase().includes("staff_availability_blocks")) return [];
    throw new Error(`Could not load staff availability blocks. ${text}`);
  }
  return await res.json().catch(() => []);
}

async function loadAssignmentsForBookings(env, bookings) {
  const ids = bookings.map((row) => String(row.id || "").trim()).filter(Boolean);
  const map = new Map();
  if (!ids.length) return map;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/booking_staff_assignments?select=id,booking_id,staff_user_id,staff_email,staff_name,assignment_role,sort_order&booking_id=in.(${encodeIdList(ids)})&order=sort_order.asc,created_at.asc`, { headers: serviceHeaders(env) });
  if (!res.ok) {
    const text = await res.text();
    if (String(text || "").toLowerCase().includes("booking_staff_assignments")) return map;
    throw new Error(`Could not load booking staff assignments. ${text}`);
  }
  const rows = await res.json().catch(() => []);
  for (const row of Array.isArray(rows) ? rows : []) {
    const key = String(row.booking_id || "").trim();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

function filterTimeEntriesToRange(entries, range) {
  const startMs = Date.parse(`${range.start_date}T00:00:00.000Z`);
  const endMs = Date.parse(`${addDays(range.end_date, 1)}T00:00:00.000Z`);
  return entries.filter((row) => {
    const t = pickTimeMs(row);
    return Number.isFinite(t) && t >= startMs && t < endMs;
  });
}

function pickTimeMs(row) {
  const raw = row?.event_time || row?.created_at || null;
  const t = raw ? Date.parse(raw) : NaN;
  return Number.isFinite(t) ? t : NaN;
}

function computeBookingMinutesByBooking(entries, range) {
  const staffTime = computeStaffTimeMap(entries, range);
  const byBooking = new Map();
  for (const item of staffTime.values()) {
    for (const [bookingId, minutes] of Object.entries(item.minutes_by_booking)) {
      byBooking.set(bookingId, roundMoney((byBooking.get(bookingId) || 0) + Number(minutes || 0)));
    }
  }
  return byBooking;
}

function computeStaffTimeMap(entries, range) {
  const manualMap = new Map();
  const eventMap = new Map();

  for (const row of entries) {
    const staffKey = resolveStaffKey(row);
    if (!staffKey) continue;
    if (Number(row.minutes || 0) > 0) {
      const summary = ensureTimeSummary(manualMap, staffKey, row);
      const minutes = roundMoney(Number(row.minutes || 0));
      const dateKey = timeDateKey(row);
      const weekKey = isoWeekKey(row);
      summary.total_minutes = roundMoney(summary.total_minutes + minutes);
      summary.hours_by_date[dateKey] = roundMoney((summary.hours_by_date[dateKey] || 0) + minutes / 60);
      summary.hours_by_week[weekKey] = roundMoney((summary.hours_by_week[weekKey] || 0) + minutes / 60);
      const bookingId = String(row.booking_id || "").trim();
      if (bookingId) summary.minutes_by_booking[bookingId] = roundMoney((summary.minutes_by_booking[bookingId] || 0) + minutes);
    } else if (isEventEntry(row.entry_type) && row.event_time) {
      const eventKey = `${staffKey}::${String(row.booking_id || "")}`;
      if (!eventMap.has(eventKey)) eventMap.set(eventKey, []);
      eventMap.get(eventKey).push(row);
    }
  }

  for (const [eventKey, rows] of eventMap.entries()) {
    const [staffKey, bookingId] = eventKey.split("::");
    const summary = ensureTimeSummary(manualMap, staffKey, rows[0]);
    const workedMinutes = summarizeWorkedEventMinutes(rows, range);
    if (workedMinutes <= 0) continue;
    const dateKey = timeDateKey(rows[0]);
    const weekKey = isoWeekKey(rows[0]);
    summary.total_minutes = roundMoney(summary.total_minutes + workedMinutes);
    summary.hours_by_date[dateKey] = roundMoney((summary.hours_by_date[dateKey] || 0) + workedMinutes / 60);
    summary.hours_by_week[weekKey] = roundMoney((summary.hours_by_week[weekKey] || 0) + workedMinutes / 60);
    if (bookingId) summary.minutes_by_booking[bookingId] = roundMoney((summary.minutes_by_booking[bookingId] || 0) + workedMinutes);
  }

  for (const summary of manualMap.values()) {
    summary.total_hours = roundMoney(summary.total_minutes / 60);
  }

  return manualMap;
}

function summarizeWorkedEventMinutes(rows, range) {
  const sorted = rows.slice().sort((a, b) => pickTimeMs(a) - pickTimeMs(b));
  let activeWorkStart = null;
  let totalMs = 0;
  const rangeStart = Date.parse(`${range.start_date}T00:00:00.000Z`);
  const rangeEnd = Date.parse(`${addDays(range.end_date, 1)}T00:00:00.000Z`);
  for (const row of sorted) {
    const t = pickTimeMs(row);
    if (!Number.isFinite(t)) continue;
    const type = String(row.entry_type || "").trim().toLowerCase();
    if (type === "work_start") {
      activeWorkStart = t;
      continue;
    }
    if (["break_start", "rain_break_start", "heat_break_start", "work_stop", "job_complete"].includes(type)) {
      if (activeWorkStart != null) {
        totalMs += overlapMs(activeWorkStart, t, rangeStart, rangeEnd);
        activeWorkStart = null;
      }
      continue;
    }
    if (["break_stop", "rain_break_stop", "heat_break_stop"].includes(type)) {
      activeWorkStart = t;
    }
  }
  if (activeWorkStart != null) {
    totalMs += overlapMs(activeWorkStart, Date.now(), rangeStart, rangeEnd);
  }
  return roundMoney(totalMs / 60000);
}

function overlapMs(start, end, rangeStart, rangeEnd) {
  const left = Math.max(Number(start || 0), rangeStart);
  const right = Math.min(Number(end || 0), rangeEnd);
  return right > left ? right - left : 0;
}

function buildStaffScheduleMap(staffRows, bookings, assignmentMap) {
  const map = new Map();
  const ensure = (staffId) => {
    const key = String(staffId || "").trim();
    if (!key) return null;
    if (!map.has(key)) map.set(key, emptyScheduleSummary());
    return map.get(key);
  };

  const emailToId = new Map();
  const nameToId = new Map();
  for (const row of staffRows) {
    if (row.email) emailToId.set(String(row.email).trim().toLowerCase(), String(row.id || ""));
    if (row.full_name) nameToId.set(String(row.full_name).trim().toLowerCase(), String(row.id || ""));
  }

  for (const booking of bookings) {
    const slotHours = scheduledHoursForBooking(booking);
    const explicit = assignmentMap.get(String(booking.id || "")) || [];
    const assignees = explicit.length ? explicit : buildFallbackAssignments(booking);
    for (const item of assignees) {
      const resolvedId = String(item.staff_user_id || "").trim() || emailToId.get(String(item.staff_email || "").trim().toLowerCase()) || nameToId.get(String(item.staff_name || item.assigned_to || "").trim().toLowerCase()) || null;
      const summary = ensure(resolvedId);
      if (!summary) continue;
      summary.total_hours = roundMoney(summary.total_hours + slotHours);
      summary.booking_count += 1;
      summary.service_dates.push(String(booking.service_date || ""));
    }
  }

  return map;
}

function buildAvailabilityMap(staffRows, blocks, bookings, assignmentMap) {
  const map = new Map();
  const ensure = (staffId) => {
    const key = String(staffId || "").trim();
    if (!key) return null;
    if (!map.has(key)) map.set(key, emptyAvailabilitySummary());
    return map.get(key);
  };

  for (const staff of staffRows) ensure(staff.id);
  for (const block of blocks) {
    const summary = ensure(block.staff_user_id);
    if (!summary) continue;
    summary.active_blocks += 1;
    if (!summary.next_unavailable_at || String(block.start_at || "") < String(summary.next_unavailable_at || "")) {
      summary.next_unavailable_at = block.start_at || null;
    }
  }

  const blocksByStaff = new Map();
  for (const block of blocks) {
    const key = String(block.staff_user_id || "").trim();
    if (!key) continue;
    if (!blocksByStaff.has(key)) blocksByStaff.set(key, []);
    blocksByStaff.get(key).push(block);
  }

  const emailToId = new Map();
  const nameToId = new Map();
  for (const row of staffRows) {
    if (row.email) emailToId.set(String(row.email).trim().toLowerCase(), String(row.id || ""));
    if (row.full_name) nameToId.set(String(row.full_name).trim().toLowerCase(), String(row.id || ""));
  }

  for (const booking of bookings) {
    const bookingStart = Date.parse(`${booking.service_date}T00:00:00.000Z`);
    const bookingEnd = Date.parse(`${addDays(booking.service_date, 1)}T00:00:00.000Z`);
    const assignees = (assignmentMap.get(String(booking.id || "")) || []).length ? (assignmentMap.get(String(booking.id || "")) || []) : buildFallbackAssignments(booking);
    for (const item of assignees) {
      const staffId = String(item.staff_user_id || "").trim() || emailToId.get(String(item.staff_email || "").trim().toLowerCase()) || nameToId.get(String(item.staff_name || item.assigned_to || "").trim().toLowerCase()) || null;
      const summary = ensure(staffId);
      if (!summary) continue;
      const relevant = blocksByStaff.get(String(staffId || "").trim()) || [];
      if (relevant.some((block) => overlapMs(Date.parse(block.start_at), Date.parse(block.end_at), bookingStart, bookingEnd) > 0)) {
        summary.conflicts += 1;
      }
    }
  }

  return map;
}

function buildServiceInsights(bookings, bookingMinutesMap, pricing) {
  const overallCount = bookings.filter((row) => bookingMinutesMap.has(String(row.id || ""))).length;
  const overallMinutes = bookings.reduce((sum, row) => sum + Number(bookingMinutesMap.get(String(row.id || "")) || 0), 0);
  const packageBuckets = new Map();
  const addonBuckets = new Map();

  const addonNameMap = new Map();
  const addons = pricing?.addons || [];
  for (const addon of addons) {
    addonNameMap.set(String(addon.code || "").trim(), addon.name || addon.code || "Add-on");
  }

  for (const booking of bookings) {
    const bookingId = String(booking.id || "").trim();
    const minutes = Number(bookingMinutesMap.get(bookingId) || 0);
    if (minutes <= 0) continue;
    const packageCode = String(booking.package_code || "").trim() || "unknown";
    accumulateInsight(packageBuckets, packageCode, minutes);

    const addons = normalizeAddonRows(booking.addons);
    for (const addon of addons) {
      const code = String(addon.code || addon || "").trim();
      if (!code) continue;
      accumulateInsight(addonBuckets, code, minutes, addonNameMap.get(code) || addon.label || code);
    }
  }

  return {
    overall: {
      booking_count: overallCount,
      average_site_minutes: overallCount ? roundMoney(overallMinutes / overallCount) : 0,
      average_site_hours: overallCount ? roundMoney((overallMinutes / overallCount) / 60) : 0
    },
    by_package: mapToInsightRows(packageBuckets),
    by_addon_presence: mapToInsightRows(addonBuckets)
  };
}

function accumulateInsight(map, key, minutes, label = null) {
  if (!map.has(key)) {
    map.set(key, { key, label: label || key, count: 0, total_minutes: 0 });
  }
  const bucket = map.get(key);
  bucket.count += 1;
  bucket.total_minutes = roundMoney(bucket.total_minutes + Number(minutes || 0));
}

function mapToInsightRows(map) {
  return Array.from(map.values()).map((row) => ({
    key: row.key,
    label: row.label,
    booking_count: row.count,
    average_minutes: row.count ? roundMoney(row.total_minutes / row.count) : 0,
    average_hours: row.count ? roundMoney((row.total_minutes / row.count) / 60) : 0
  })).sort((a, b) => Number(b.average_minutes || 0) - Number(a.average_minutes || 0));
}

function normalizeAddonRows(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(Boolean).map((row) => {
    if (typeof row === "string") return { code: row, label: row };
    if (typeof row === "object") return row;
    return { code: String(row), label: String(row) };
  });
}

function resolveStaffKey(row) {
  const id = String(row?.staff_user_id || "").trim();
  if (id) return id;
  const name = String(row?.staff_name || "").trim();
  return name ? `name:${name.toLowerCase()}` : null;
}

function ensureTimeSummary(map, staffKey, row) {
  if (!map.has(staffKey)) {
    map.set(staffKey, {
      staff_user_id: row?.staff_user_id || null,
      staff_name: row?.staff_name || null,
      total_minutes: 0,
      total_hours: 0,
      hours_by_date: {},
      hours_by_week: {},
      minutes_by_booking: {}
    });
  }
  const summary = map.get(staffKey);
  if (!summary.staff_user_id && row?.staff_user_id) summary.staff_user_id = row.staff_user_id;
  if (!summary.staff_name && row?.staff_name) summary.staff_name = row.staff_name;
  return summary;
}

function timeDateKey(row) {
  const raw = row?.event_time || row?.created_at || new Date().toISOString();
  return String(raw).slice(0, 10);
}

function isoWeekKey(row) {
  const raw = row?.event_time || row?.created_at || new Date().toISOString();
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "unknown";
  const weekStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = weekStart.getUTCDay() || 7;
  weekStart.setUTCDate(weekStart.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(weekStart.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((weekStart - yearStart) / 86400000) + 1) / 7);
  return `${weekStart.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function isEventEntry(value) {
  return ["arrival","work_start","work_stop","break_start","break_stop","rain_break_start","rain_break_stop","heat_break_start","heat_break_stop","job_complete"].includes(String(value || "").trim().toLowerCase());
}

function scheduledHoursForBooking(booking) {
  const durationSlots = Number(booking?.duration_slots || 1);
  return roundMoney(Math.max(1, durationSlots) * SLOT_HOURS);
}

function buildFallbackAssignments(booking) {
  const rows = [];
  if (booking?.assigned_staff_user_id || booking?.assigned_staff_email || booking?.assigned_staff_name || booking?.assigned_to) {
    rows.push({
      staff_user_id: booking.assigned_staff_user_id || null,
      staff_email: booking.assigned_staff_email || null,
      staff_name: booking.assigned_staff_name || booking.assigned_to || null,
      assignment_role: "lead"
    });
  }
  return rows;
}

function emptyTimeSummary() {
  return { total_minutes: 0, total_hours: 0, hours_by_date: {}, hours_by_week: {}, minutes_by_booking: {} };
}

function emptyScheduleSummary() {
  return { total_hours: 0, booking_count: 0, service_dates: [] };
}

function emptyAvailabilitySummary() {
  return { conflicts: 0, active_blocks: 0, next_unavailable_at: null };
}

function encodeIdList(ids) {
  return ids.map((id) => encodeURIComponent(String(id))).join(",");
}

function firstDayOfCurrentMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function todayDateOnly() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

function parseDateOnly(value) {
  const s = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function addDays(dateText, days) {
  const d = new Date(`${dateText}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return dateText;
  d.setUTCDate(d.getUTCDate() + Number(days || 0));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function numberOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function centsToCad(value) {
  return roundMoney(Number(value || 0) / 100);
}

function cleanNote(value) {
  const s = String(value || "").trim();
  return s || null;
}

function roundMoney(value) {
  const num = Number(value || 0);
  return Math.round((Number.isFinite(num) ? num : 0) * 100) / 100;
}
