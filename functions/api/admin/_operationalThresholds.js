export const OPERATIONAL_THRESHOLDS = Object.freeze({
  notification_failures_24h: { warning: 1, error: 3 },
  upload_failures_24h: { warning: 1, error: 3 },
  payment_provider_failures_24h: { error: 1, critical: 3 },
  open_critical: { critical: 1 },
  stale_open_hours: { warning: 24, critical: 72 }
});

function text(value) { return String(value || '').trim(); }
function severity(value) {
  const clean = text(value).toLowerCase();
  return ['critical','error','warning','info'].includes(clean) ? clean : 'warning';
}

const BREACH_CONTEXT = Object.freeze({
  open_critical: {
    label: 'Open critical runtime incidents',
    description: 'One or more incidents are explicitly recorded at critical severity and are still open or under review.',
    where: 'I.T. → Runtime incidents',
    owner_href: '/admin/it/',
    owner_label: 'Open I.T. operations'
  },
  notification_failures_24h: {
    label: 'Notification failures in the past 24 hours',
    description: 'Recent notification or messaging failures need review before another provider or customer-facing retry.',
    where: 'I.T. → Runtime incidents / notification provider',
    owner_href: '/admin/it/',
    owner_label: 'Review notification incidents'
  },
  upload_failures_24h: {
    label: 'Upload or media failures in the past 24 hours',
    description: 'Recent media/upload failures need review in the owning media workflow before another upload is attempted.',
    where: 'Media workflows + I.T. runtime incidents',
    owner_href: '/admin/media-content-studio/',
    owner_label: 'Open Media Studio'
  },
  payment_provider_failures_24h: {
    label: 'Payment/provider failures in the past 24 hours',
    description: 'Payment or provider failures require evidence review; this screen never retries charges or refunds automatically.',
    where: 'Finance / provider integration + I.T. runtime incidents',
    owner_href: '/admin/accounting/',
    owner_label: 'Open Finance'
  },
  stale_open_24h: {
    label: 'Open incidents older than 24 hours',
    description: 'Incidents have remained open or reviewing for more than 24 hours and need disposition or corrective evidence.',
    where: 'I.T. → Runtime incidents',
    owner_href: '/admin/it/',
    owner_label: 'Review stale incidents'
  },
  stale_open_72h: {
    label: 'Open incidents older than 72 hours',
    description: 'Incidents have remained open or reviewing for more than 72 hours. The count is the full runtime-incident backlog, not only the current Days filter.',
    where: 'I.T. → Runtime incidents',
    owner_href: '/admin/it/',
    owner_label: 'Review stale incidents'
  }
});

function breachWithContext(key, level, count) {
  return { key, level, count, ...(BREACH_CONTEXT[key] || {
    label: key,
    description: 'Operational attention is required.',
    where: 'I.T. → Runtime incidents',
    owner_href: '/admin/it/',
    owner_label: 'Open I.T. operations'
  }) };
}

export function classifyIncidentAttention(row) {
  const status = text(row?.review_status || 'open').toLowerCase();
  if (!['open','reviewing'].includes(status)) return { level: 'none', reasons: [], age_hours: 0 };
  const createdMs = Date.parse(row?.created_at || '');
  const ageHours = Number.isFinite(createdMs) ? Math.max(0, (Date.now() - createdMs) / 3600000) : 0;
  const incidentSeverity = severity(row?.severity);
  let level = incidentSeverity === 'critical' ? 'critical' : (incidentSeverity === 'error' ? 'error' : 'warning');
  const reasons = [];
  if (ageHours >= OPERATIONAL_THRESHOLDS.stale_open_hours.critical) {
    level = 'critical'; reasons.push(`open_${Math.floor(ageHours)}h`);
  } else if (ageHours >= OPERATIONAL_THRESHOLDS.stale_open_hours.warning) {
    reasons.push(`stale_${Math.floor(ageHours)}h`);
  }
  if (incidentSeverity === 'critical') reasons.push('critical_incident');
  return { level, reasons, age_hours: Math.round(ageHours * 10) / 10 };
}

export async function operationalThresholdSnapshot(db) {
  const row = await db.prepare(`
    SELECT
      SUM(CASE WHEN LOWER(COALESCE(review_status,'open')) IN ('open','reviewing') AND LOWER(COALESCE(severity,''))='critical' THEN 1 ELSE 0 END) AS open_critical,
      SUM(CASE WHEN LOWER(COALESCE(review_status,'open')) IN ('open','reviewing') AND datetime(created_at)>=datetime('now','-24 hours') AND (LOWER(COALESCE(incident_scope,'')) LIKE '%notif%' OR LOWER(COALESCE(incident_code,'')) LIKE '%notif%') AND (LOWER(COALESCE(severity,'')) IN ('critical','error') OR LOWER(COALESCE(incident_code,'')) LIKE '%fail%') THEN 1 ELSE 0 END) AS notification_failures_24h,
      SUM(CASE WHEN LOWER(COALESCE(review_status,'open')) IN ('open','reviewing') AND datetime(created_at)>=datetime('now','-24 hours') AND (LOWER(COALESCE(incident_scope,'')) LIKE '%upload%' OR LOWER(COALESCE(incident_scope,'')) LIKE '%media%' OR LOWER(COALESCE(incident_code,'')) LIKE '%upload%') AND (LOWER(COALESCE(severity,'')) IN ('critical','error') OR LOWER(COALESCE(incident_code,'')) LIKE '%fail%') THEN 1 ELSE 0 END) AS upload_failures_24h,
      SUM(CASE WHEN LOWER(COALESCE(review_status,'open')) IN ('open','reviewing') AND datetime(created_at)>=datetime('now','-24 hours') AND (LOWER(COALESCE(incident_scope,'')) LIKE '%payment%' OR LOWER(COALESCE(incident_scope,'')) LIKE '%provider%' OR LOWER(COALESCE(incident_code,'')) LIKE '%payment%' OR LOWER(COALESCE(incident_code,'')) LIKE '%stripe%' OR LOWER(COALESCE(incident_code,'')) LIKE '%paypal%') AND (LOWER(COALESCE(severity,'')) IN ('critical','error') OR LOWER(COALESCE(incident_code,'')) LIKE '%fail%') THEN 1 ELSE 0 END) AS payment_provider_failures_24h,
      SUM(CASE WHEN LOWER(COALESCE(review_status,'open')) IN ('open','reviewing') AND datetime(created_at)<datetime('now','-24 hours') THEN 1 ELSE 0 END) AS stale_open_24h,
      SUM(CASE WHEN LOWER(COALESCE(review_status,'open')) IN ('open','reviewing') AND datetime(created_at)<datetime('now','-72 hours') THEN 1 ELSE 0 END) AS stale_open_72h
    FROM runtime_incidents
  `).first();
  const counts = {
    open_critical: Number(row?.open_critical || 0),
    notification_failures_24h: Number(row?.notification_failures_24h || 0),
    upload_failures_24h: Number(row?.upload_failures_24h || 0),
    payment_provider_failures_24h: Number(row?.payment_provider_failures_24h || 0),
    stale_open_24h: Number(row?.stale_open_24h || 0),
    stale_open_72h: Number(row?.stale_open_72h || 0)
  };
  const breaches = [];
  if (counts.open_critical >= 1) breaches.push(breachWithContext('open_critical','critical',counts.open_critical));
  if (counts.payment_provider_failures_24h >= 3) breaches.push(breachWithContext('payment_provider_failures_24h','critical',counts.payment_provider_failures_24h));
  else if (counts.payment_provider_failures_24h >= 1) breaches.push(breachWithContext('payment_provider_failures_24h','error',counts.payment_provider_failures_24h));
  for (const key of ['notification_failures_24h','upload_failures_24h']) {
    if (counts[key] >= 3) breaches.push(breachWithContext(key,'error',counts[key]));
    else if (counts[key] >= 1) breaches.push(breachWithContext(key,'warning',counts[key]));
  }
  if (counts.stale_open_72h > 0) breaches.push(breachWithContext('stale_open_72h','critical',counts.stale_open_72h));
  else if (counts.stale_open_24h > 0) breaches.push(breachWithContext('stale_open_24h','warning',counts.stale_open_24h));
  const status = breaches.some((b)=>b.level==='critical') ? 'critical' : breaches.some((b)=>b.level==='error') ? 'error' : breaches.length ? 'warning' : 'ok';
  return { thresholds: OPERATIONAL_THRESHOLDS, counts, breaches, status };
}
