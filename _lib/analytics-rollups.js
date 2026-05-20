export const ALL_SERVICE_AREA_LABEL = '__all__';

export function cleanServiceAreaLabel(value) {
  return String(value || '').trim();
}

export function buildAnalyticsRollupPayload(rows) {
  const summaryBuckets = new Map();
  const dimensionBuckets = new Map();
  const funnelBuckets = new Map();

  for (const row of Array.isArray(rows) ? rows : []) {
    const createdAt = row?.created_at || null;
    const date = new Date(createdAt || '');
    if (!createdAt || Number.isNaN(date.getTime())) continue;

    const area = cleanServiceAreaLabel(row?.payload?.service_area_label || row?.payload?.service_area || '');
    const scopes = area ? [ALL_SERVICE_AREA_LABEL, area] : [ALL_SERVICE_AREA_LABEL];
    const dayMeta = getDayMeta(date);

    for (const scope of scopes) {
      for (const meta of getSummaryPeriodMetas(date)) {
        const summary = ensureSummaryBucket(summaryBuckets, meta, scope);
        summary.events += 1;
        if (row.event_type === 'page_view') summary.page_views += 1;
        if (row.event_type === 'cart_snapshot') summary.cart_snapshots += 1;
        if (row.event_type === 'checkout_started' || row.checkout_state === 'started') summary.booking_starts += 1;
        if (row.event_type === 'checkout_completed' || row.checkout_state === 'completed') summary.booking_completions += 1;
        if (row.visitor_id) summary.visitor_ids.add(String(row.visitor_id));
        if (row.session_id) summary.session_ids.add(String(row.session_id));
      }

      const funnel = ensureFunnelBucket(funnelBuckets, dayMeta.key, scope);
      applyFunnelIncrement(funnel, row);

      addDimensionCount(dimensionBuckets, dayMeta.key, scope, 'page_path', row.page_path || '/');
      addDimensionCount(dimensionBuckets, dayMeta.key, scope, 'country', row.country || 'Unknown');
      addDimensionCount(dimensionBuckets, dayMeta.key, scope, 'region', row?.payload?.region || 'Unknown');
      addDimensionCount(
        dimensionBuckets,
        dayMeta.key,
        scope,
        'city',
        row?.payload?.city ? `${row.payload.city}${row?.payload?.region ? `, ${row.payload.region}` : ''}` : 'Unknown'
      );
      addDimensionCount(dimensionBuckets, dayMeta.key, scope, 'device_type', row?.payload?.device_type || 'Unknown');
      addDimensionCount(dimensionBuckets, dayMeta.key, scope, 'referrer', row.referrer || 'Direct');
      if (!['heartbeat', 'page_focus', 'page_exit'].includes(String(row.event_type || ''))) {
        addDimensionCount(dimensionBuckets, dayMeta.key, scope, 'event_type', row.event_type || 'unknown');
      }
      if (row.checkout_state) {
        addDimensionCount(dimensionBuckets, dayMeta.key, scope, 'checkout_state', row.checkout_state);
      }
    }

    if (area) {
      addDimensionCount(dimensionBuckets, dayMeta.key, ALL_SERVICE_AREA_LABEL, 'service_area', area);
    }
  }

  return {
    summaryRows: [...summaryBuckets.values()].map((bucket) => ({
      period_type: bucket.period_type,
      period_key: bucket.period_key,
      period_start: bucket.period_start,
      period_end: bucket.period_end,
      service_area_label: bucket.service_area_label,
      events: bucket.events,
      page_views: bucket.page_views,
      unique_visitors: bucket.visitor_ids.size,
      unique_sessions: bucket.session_ids.size,
      booking_starts: bucket.booking_starts,
      booking_completions: bucket.booking_completions,
      cart_snapshots: bucket.cart_snapshots
    })),
    dimensionRows: [...dimensionBuckets.values()],
    funnelRows: [...funnelBuckets.values()]
  };
}

function ensureSummaryBucket(map, meta, scope) {
  const key = `${meta.periodType}|${meta.key}|${scope}`;
  if (!map.has(key)) {
    map.set(key, {
      period_type: meta.periodType,
      period_key: meta.key,
      period_start: meta.start,
      period_end: meta.end,
      service_area_label: scope,
      events: 0,
      page_views: 0,
      unique_visitors: 0,
      unique_sessions: 0,
      booking_starts: 0,
      booking_completions: 0,
      cart_snapshots: 0,
      visitor_ids: new Set(),
      session_ids: new Set()
    });
  }
  return map.get(key);
}

function ensureFunnelBucket(map, dayKey, scope) {
  const key = `${dayKey}|${scope}`;
  if (!map.has(key)) {
    map.set(key, {
      rollup_date: dayKey,
      service_area_label: scope,
      step_1_views: 0,
      step_2_views: 0,
      step_3_views: 0,
      step_4_views: 0,
      step_5_views: 0,
      service_area_picks: 0,
      date_picks: 0,
      package_picks: 0,
      addon_toggles: 0,
      customer_continue: 0,
      checkout_started: 0,
      checkout_completed: 0
    });
  }
  return map.get(key);
}

function applyFunnelIncrement(funnel, row) {
  const type = String(row?.event_type || '');
  const stepNumber = Number(row?.payload?.step_number || 0);
  if (type === 'booking_step_view' && stepNumber >= 1 && stepNumber <= 5) {
    funnel[`step_${stepNumber}_views`] += 1;
  }
  if (type === 'booking_service_area_pick') funnel.service_area_picks += 1;
  if (type === 'booking_date_pick') funnel.date_picks += 1;
  if (type === 'booking_package_pick') funnel.package_picks += 1;
  if (type === 'booking_addon_toggle') funnel.addon_toggles += 1;
  if (type === 'booking_customer_continue') funnel.customer_continue += 1;
  if (type === 'checkout_started' || row?.checkout_state === 'started') funnel.checkout_started += 1;
  if (type === 'checkout_completed' || row?.checkout_state === 'completed') funnel.checkout_completed += 1;
}

function addDimensionCount(map, rollupDate, serviceAreaLabel, dimensionType, dimensionValue) {
  const value = String(dimensionValue || '').trim() || 'Unknown';
  const key = `${rollupDate}|${serviceAreaLabel}|${dimensionType}|${value}`;
  if (!map.has(key)) {
    map.set(key, {
      rollup_date: rollupDate,
      service_area_label: serviceAreaLabel,
      dimension_type: dimensionType,
      dimension_value: value,
      count: 0
    });
  }
  map.get(key).count += 1;
}

export function getDayMeta(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const key = `${year}-${month}-${day}`;
  return { key, start: `${key}T00:00:00.000Z`, end: `${key}T23:59:59.999Z` };
}

export function getSummaryPeriodMetas(date) {
  const day = getDayMeta(date);
  const week = getWeekMeta(date);
  const month = getMonthMeta(date);
  const year = getYearMeta(date);
  return [
    { periodType: 'day', key: day.key, start: day.start, end: day.end },
    { periodType: 'week', key: week.key, start: week.start, end: week.end },
    { periodType: 'month', key: month.key, start: month.start, end: month.end },
    { periodType: 'year', key: year.key, start: year.start, end: year.end }
  ];
}

export function getWeekMeta(date) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round((target - firstThursday) / 604800000);
  const monday = new Date(target);
  monday.setUTCDate(target.getUTCDate() - 3);
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return {
    key: `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`,
    start: monday.toISOString(),
    end: sunday.toISOString()
  };
}

function getMonthMeta(date) {
  const year = date.getUTCFullYear();
  const monthNumber = date.getUTCMonth() + 1;
  const month = String(monthNumber).padStart(2, '0');
  const key = `${year}-${month}`;
  const endDate = new Date(Date.UTC(year, monthNumber, 0, 23, 59, 59, 999));
  return { key, start: `${key}-01T00:00:00.000Z`, end: endDate.toISOString() };
}

function getYearMeta(date) {
  const year = String(date.getUTCFullYear());
  return { key: year, start: `${year}-01-01T00:00:00.000Z`, end: `${year}-12-31T23:59:59.999Z` };
}
